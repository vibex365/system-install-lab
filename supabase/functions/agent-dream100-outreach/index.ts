import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { entry_id, channel, user_id } = await req.json();
    if (!entry_id || !channel || !user_id) {
      throw new Error("Missing required fields: entry_id, channel, user_id");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("AI not configured");

    const serviceSupabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch the Dream 100 entry
    const { data: entry, error: entryErr } = await serviceSupabase
      .from("dream_100")
      .select("*")
      .eq("id", entry_id)
      .eq("user_id", user_id)
      .single();

    if (entryErr || !entry) throw new Error("Dream 100 entry not found");

    // Validate contact info
    if (channel === "email" && !entry.email) {
      throw new Error("No email address on this entry. Add one first.");
    }
    if (channel === "sms" && !entry.phone) {
      throw new Error("No phone number on this entry. Add one first.");
    }

    // Get user profile for context
    const { data: profile } = await serviceSupabase
      .from("profiles")
      .select("niche, full_name")
      .eq("id", user_id)
      .single();

    const userNiche = profile?.niche || "business";
    const userName = profile?.full_name || "PFSW Team";

    // Generate personalized pitch via AI
    const prompt = `You are writing a partnership outreach ${channel === "email" ? "email" : "SMS"} to an influencer/thought leader.

Target: ${entry.name}
Platform: ${entry.platform}
Niche: ${entry.niche || userNiche}
Followers: ${entry.followers_estimate ? `~${entry.followers_estimate}` : "unknown"}
Notes: ${entry.notes || "none"}
URL: ${entry.url || "none"}

Sender: ${userName} from PFSW (People Fail, Systems Work) — a platform that helps digital entrepreneurs automate client acquisition with AI agents, quiz funnels, and done-for-you systems.

${channel === "email" ? `Generate a personalized partnership pitch email. Include:
- A compelling subject line
- Reference their specific platform and content
- Propose a mutually beneficial partnership (affiliate, co-promotion, guest appearance)
- Keep it 3-4 short paragraphs
- Professional but warm tone
- Soft CTA to continue the conversation

Return JSON: {"subject":"...","body":"..."}` : `Generate a short, personalized partnership SMS:
- Under 160 characters
- Reference their name/platform naturally
- Mention partnership opportunity
- Friendly and professional
- End with "- ${userName}"

Return JSON: {"message":"..."}`}

Return ONLY the JSON object, no markdown.`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!aiRes.ok) {
      if (aiRes.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI generation failed: ${aiRes.status}`);
    }

    const aiData = await aiRes.json();
    const raw = aiData.choices?.[0]?.message?.content || "{}";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const generated = JSON.parse(jsonMatch ? jsonMatch[0] : "{}");

    // Send the message
    let deliveryStatus = "sent";

    if (channel === "email") {
      const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
      if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");

      const emailHtml = formatEmailHtml(generated.body, entry.name);
      const sendRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: `PFSW <outreach@mail.peoplefailsystemswork.com>`,
          to: [entry.email],
          subject: generated.subject,
          html: emailHtml,
        }),
      });

      if (!sendRes.ok) {
        const errText = await sendRes.text();
        throw new Error(`Email send failed: ${errText}`);
      }
    } else if (channel === "sms") {
      const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
      const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
      const fromNumber = Deno.env.get("TWILIO_PHONE_NUMBER");
      if (!accountSid || !authToken || !fromNumber) throw new Error("Twilio not configured");

      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
      const twilioRes = await fetch(twilioUrl, {
        method: "POST",
        headers: {
          Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          To: entry.phone,
          From: fromNumber,
          Body: generated.message,
        }),
      });

      if (!twilioRes.ok) {
        const errData = await twilioRes.json();
        throw new Error(`SMS send failed: ${errData.message}`);
      }
    }

    // Log to outreach_log
    await serviceSupabase.from("outreach_log").insert({
      user_id,
      channel,
      company_name: entry.name,
      recipient_email: channel === "email" ? entry.email : null,
      recipient_phone: channel === "sms" ? entry.phone : null,
      email_subject: channel === "email" ? generated.subject : null,
      email_body: channel === "email" ? generated.body : null,
      sms_body: channel === "sms" ? generated.message : null,
      delivery_status: deliveryStatus,
      niche: entry.niche,
    });

    // Update outreach_status on dream_100 entry
    const newOutreachStatus = channel === "email" ? "dm_sent" : "dm_sent";
    await serviceSupabase.from("dream_100").update({
      outreach_status: newOutreachStatus,
      updated_at: new Date().toISOString(),
    }).eq("id", entry_id);

    return new Response(JSON.stringify({
      success: true,
      channel,
      preview: channel === "email"
        ? { subject: generated.subject, body: generated.body }
        : { message: generated.message },
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Dream 100 outreach error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function formatEmailHtml(body: string, name: string): string {
  const paragraphs = body.split("\n").filter(Boolean).map((p) =>
    `<p style="margin:0 0 14px;line-height:1.6;color:#333;">${p}</p>`
  ).join("");
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f7f7f7;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f7f7;padding:40px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
<tr><td style="padding:32px 40px;">
${paragraphs}
</td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}
