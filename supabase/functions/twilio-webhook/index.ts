import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Twilio SMS Webhook — handles STOP/START/YES replies.
 * On YES: triggers an AI voice call to the lead.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: { "Content-Type": "text/xml" } });
  }

  try {
    const formData = await req.formData();
    const body = formData.get("Body")?.toString().trim() ?? "";
    const bodyUpper = body.toUpperCase();
    const from = formData.get("From")?.toString() ?? "";

    if (!from) {
      return new Response("<Response></Response>", { headers: { "Content-Type": "text/xml" } });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const STOP_KEYWORDS = ["STOP", "UNSUBSCRIBE", "CANCEL", "END", "QUIT"];
    const START_KEYWORDS = ["START", "UNSTOP"];

    let replyMsg = "";

    if (STOP_KEYWORDS.includes(bodyUpper)) {
      await supabase.from("leads").update({ sms_opt_out: true }).eq("phone", from);
      replyMsg = "You've been unsubscribed from PFSW messages. Reply START to re-subscribe.";
    } else if (START_KEYWORDS.includes(bodyUpper)) {
      await supabase.from("leads").update({ sms_opt_out: false }).eq("phone", from);
      replyMsg = "You've been re-subscribed to PFSW updates. Reply STOP to opt out.";
    } else if (bodyUpper === "YES") {
      // Look up lead by phone
      const { data: leads } = await supabase
        .from("leads")
        .select("id, user_id, contact_name, business_name")
        .eq("phone", from)
        .order("created_at", { ascending: false })
        .limit(1);

      const lead = leads?.[0];

      if (lead) {
        try {
          const baseUrl = Deno.env.get("SUPABASE_URL")!;
          const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

          await fetch(`${baseUrl}/functions/v1/trigger-twilio-call`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${serviceKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              lead_id: lead.id,
              user_id: lead.user_id,
              phone_number: from,
              respondent_name: lead.contact_name || lead.business_name || "Customer",
            }),
          });

          replyMsg = `Great! A PFSW growth specialist will call you shortly to walk through your Automation Readiness results. Talk soon!`;
        } catch (err) {
          console.error("Failed to trigger call from YES reply:", err);
          replyMsg = "Thanks for your interest in PFSW! We'll be in touch shortly.";
        }
      } else {
        replyMsg = "Thanks for reaching out! Visit peoplefailsystemswork.com to get started with PFSW.";
      }
    }

    const twiml = replyMsg
      ? `<Response><Message>${replyMsg}</Message></Response>`
      : `<Response></Response>`;

    return new Response(twiml, { headers: { "Content-Type": "text/xml" } });
  } catch (err) {
    console.error("twilio-webhook error:", err);
    return new Response("<Response></Response>", { headers: { "Content-Type": "text/xml" } });
  }
});
