import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/**
 * Workflow agent: Sends an affiliate/signup link via SMS to a lead.
 * Called by the orchestrator as the final step in partner workflows.
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

    const { workflow_id, step_id, user_id, params, memory } = await req.json();

    const leadId = params?.lead_id;
    const affiliateUrl = params?.affiliate_url;
    const message = params?.message;

    if (!leadId && !params?.phone) {
      throw new Error("lead_id or phone is required");
    }
    if (!affiliateUrl) {
      throw new Error("affiliate_url is required");
    }

    // Resolve phone number
    let phone = params?.phone;
    let leadName = params?.name || "there";

    if (leadId && !phone) {
      const { data: lead } = await supabase
        .from("leads")
        .select("phone, contact_name, business_name")
        .eq("id", leadId)
        .single();
      if (!lead?.phone) throw new Error("Lead has no phone number");
      phone = lead.phone;
      leadName = lead.contact_name || lead.business_name || leadName;
    }

    const firstName = leadName.split(" ")[0];
    const smsBody = message || `Hi ${firstName}! 🎉 Here's your exclusive link to get started: ${affiliateUrl}`;

    // Send SMS via Twilio
    const twilioSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioPhone = Deno.env.get("TWILIO_PHONE_NUMBER");

    if (!twilioSid || !twilioToken || !twilioPhone) {
      throw new Error("Twilio not configured");
    }

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
    const smsRes = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        "Authorization": "Basic " + btoa(`${twilioSid}:${twilioToken}`),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: phone,
        From: twilioPhone,
        Body: smsBody,
      }).toString(),
    });

    const smsData = await smsRes.json();
    const success = smsRes.ok;

    // Update workflow step
    if (step_id) {
      await supabase.from("workflow_steps").update({
        status: success ? "completed" : "failed",
        output: { sms_sid: smsData.sid, phone, success },
        completed_at: new Date().toISOString(),
        error: success ? null : (smsData.message || "SMS send failed"),
      }).eq("id", step_id);
    }

    // Check for next step or complete workflow
    if (workflow_id) {
      const { data: nextStep } = await supabase
        .from("workflow_steps")
        .select("id, agent_id, input")
        .eq("workflow_id", workflow_id)
        .eq("status", "pending")
        .order("position", { ascending: true })
        .limit(1)
        .maybeSingle();

      if (!nextStep) {
        await supabase.from("workflows").update({
          status: "completed",
          updated_at: new Date().toISOString(),
        }).eq("id", workflow_id);
      }
    }

    return new Response(
      JSON.stringify({ success, phone, sms_sid: smsData.sid }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("agent-send-link error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
