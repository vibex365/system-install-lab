import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Trigger outbound Twilio call to a lead.
 * Admin/CRM triggers this to initiate AI voice calls.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: authData, error: authError } = await supabase.auth.getClaims(token);
    if (authError || !authData?.claims) throw new Error("Not authenticated");
    const userId = authData.claims.sub as string;

    const body = await req.json();
    const { lead_id, user_id: targetUserId, phone_number, respondent_name, quiz_score, quiz_result_label } = body;

    let leadPhone = phone_number;
    let leadName = respondent_name || "Lead";

    if (lead_id) {
      const { data: lead } = await supabase.from("leads").select("*").eq("id", lead_id).single();
      if (lead) {
        leadPhone = leadPhone || lead.phone;
        leadName = leadName || lead.contact_name || lead.business_name || "Lead";
      }
    }

    if (!leadPhone) throw new Error("No phone number available");

    const twilioSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioPhone = Deno.env.get("TWILIO_PHONE_NUMBER");
    if (!twilioSid || !twilioToken || !twilioPhone) throw new Error("Twilio not configured");

    // Use VibeX voice webhook (shared Twilio infrastructure)
    const webhookUrl = "https://cuuvsarxfpmcnsxbhscg.supabase.co/functions/v1/twilio-voice-webhook";

    // Create call log
    const { data: callLog, error: clError } = await supabase
      .from("call_logs")
      .insert({
        user_id: targetUserId || userId,
        lead_id: lead_id || null,
        phone_number: leadPhone,
        call_type: "outbound",
        status: "initiating",
        quiz_score: quiz_score || 0,
        quiz_result_label: quiz_result_label || null,
      })
      .select()
      .single();

    if (clError) throw new Error(`Failed to create call log: ${clError.message}`);

    // Initiate Twilio call
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Calls.json`;
    const callParams = new URLSearchParams({
      To: leadPhone,
      From: twilioPhone,
      Url: `${webhookUrl}?call_log_id=${callLog.id}&respondent_name=${encodeURIComponent(leadName)}&quiz_score=${quiz_score || 0}&quiz_result=${encodeURIComponent(quiz_result_label || "")}`,
      StatusCallback: `${webhookUrl}?call_log_id=${callLog.id}&event=status&respondent_name=${encodeURIComponent(leadName)}&quiz_score=${quiz_score || 0}&quiz_result=${encodeURIComponent(quiz_result_label || "")}`,
      StatusCallbackEvent: "completed",
    });

    const twilioResponse = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        "Authorization": "Basic " + btoa(`${twilioSid}:${twilioToken}`),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: callParams.toString(),
    });

    const twilioData = await twilioResponse.json();

    if (!twilioResponse.ok) {
      await supabase.from("call_logs").update({ status: "failed" }).eq("id", callLog.id);
      throw new Error(twilioData.message || "Failed to initiate call");
    }

    await supabase.from("call_logs").update({ vapi_call_id: twilioData.sid, status: "ringing" }).eq("id", callLog.id);

    return new Response(
      JSON.stringify({ success: true, call_log_id: callLog.id, twilio_sid: twilioData.sid }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("trigger-twilio-call error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
