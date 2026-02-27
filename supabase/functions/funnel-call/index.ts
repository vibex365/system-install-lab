import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Public edge function for quiz funnel submissions.
 * Creates lead + call_log, sends SMS with callback number.
 * When lead calls back, twilio-voice-webhook recognizes them by phone number.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const {
      phone_number,
      respondent_name,
      respondent_email,
      quiz_score,
      quiz_result_label,
      quiz_title,
      quiz_questions_summary,
    } = await req.json();

    if (!phone_number) throw new Error("Phone number is required");

    // Clean phone to E.164
    let cleanPhone = phone_number.replace(/[^\d+]/g, "");
    if (!cleanPhone.startsWith("+")) {
      cleanPhone = cleanPhone.replace(/^1?/, "+1");
    }

    const contactName = (respondent_name || "").trim() || "Unknown";

    // Route to admin user
    const { data: adminRole } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin")
      .limit(1)
      .single();
    const targetUserId = adminRole?.user_id || "00000000-0000-0000-0000-000000000000";

    // Create lead in CRM pipeline
    const { data: leadData, error: leadError } = await supabase
      .from("leads")
      .insert({
        user_id: targetUserId,
        business_name: contactName,
        contact_name: contactName,
        email: respondent_email || null,
        phone: cleanPhone,
        source: "quiz_funnel",
        pipeline_status: "prospect",
        notes: `${quiz_title || "Automation Quiz"} Score: ${quiz_score}/100. Result: ${quiz_result_label}.\n\n${quiz_questions_summary || ""}`,
      })
      .select("id")
      .single();

    if (leadError) console.error("Lead insert error:", leadError.message);

    // Create call log with quiz context (for caller recognition when they call back)
    const { data: callLog, error: clError } = await supabase
      .from("call_logs")
      .insert({
        user_id: targetUserId,
        lead_id: leadData?.id || null,
        phone_number: cleanPhone,
        call_type: "funnel_callback",
        status: "awaiting_callback",
        quiz_answers: {
          summary: quiz_questions_summary,
          score: quiz_score,
          result: quiz_result_label,
          respondent_name: contactName,
        },
        quiz_score: quiz_score || 0,
        quiz_result_label: quiz_result_label || null,
      })
      .select()
      .single();

    if (clError) console.error("Call log error:", clError.message);

    // Log pipeline activity
    if (leadData?.id) {
      await supabase.from("lead_activity_log").insert({
        lead_id: leadData.id,
        user_id: targetUserId,
        from_status: null,
        to_status: "prospect",
      });
    }

    // Send SMS with callback number
    const twilioSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioPhone = Deno.env.get("TWILIO_PHONE_NUMBER");

    if (twilioSid && twilioToken && twilioPhone) {
      const firstName = contactName.split(" ")[0];
      const smsMessage = `Hi ${firstName}! 🎯 Your Automation Readiness results are ready (Score: ${quiz_score}/100). Our AI growth specialist is standing by to walk you through your personalized report and show you how quiz funnels + AI agents can transform your business. Call us now: ${twilioPhone}`;

      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
      await fetch(twilioUrl, {
        method: "POST",
        headers: {
          "Authorization": "Basic " + btoa(`${twilioSid}:${twilioToken}`),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          To: cleanPhone,
          From: twilioPhone,
          Body: smsMessage,
        }).toString(),
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        lead_id: leadData?.id,
        call_log_id: callLog?.id,
        callback_number: twilioPhone || null,
        flow: "inbound_callback",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("funnel-call error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
