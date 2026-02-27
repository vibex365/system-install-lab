import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * AI-generated follow-up emails to leads via Resend.
 * Supports: follow_up, post_call, nurture types.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { lead_id, user_id, type } = await req.json();
    if (!lead_id) throw new Error("lead_id required");

    const { data: lead } = await sb.from("leads").select("*").eq("id", lead_id).single();
    if (!lead) throw new Error("Lead not found");
    if (!lead.email) throw new Error("Lead has no email address");

    const uid = user_id || lead.user_id;
    const leadName = lead.contact_name || lead.business_name || "there";
    const firstName = leadName.split(" ")[0];

    // Get niche config for context
    const { data: nicheConfigs } = await sb.from("niche_config").select("display_name, cta_label").limit(1);
    const niche = nicheConfigs?.[0];
    const nicheLabel = niche?.display_name || "digital business";
    const ctaLabel = niche?.cta_label || "Book Your Strategy Call";

    // Get recent activity
    const { data: activities } = await sb
      .from("lead_activity_log")
      .select("from_status, to_status, created_at")
      .eq("lead_id", lead_id)
      .order("created_at", { ascending: false })
      .limit(5);

    const activityContext = (activities || []).map((a: any) => `${a.from_status || "new"} → ${a.to_status}`).join(", ");

    const aiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!aiKey) throw new Error("AI gateway not configured");

    const emailType = type || "follow_up";
    const prompts: Record<string, string> = {
      follow_up: `Write a short, professional follow-up email (under 200 words) to ${leadName} about growing their ${nicheLabel} with automation. Company: PFSW (People Fail, Systems Work). Be warm but direct. Include a call to action to ${ctaLabel.toLowerCase()}.`,
      post_call: `Write a post-call thank you email (under 200 words) to ${firstName}. Mention you discussed their business automation needs and will send detailed recommendations shortly. Company: PFSW.`,
      nurture: `Write a gentle nurture email (under 200 words) to ${firstName}. Share a quick tip about using quiz funnels or AI agents to grow a ${nicheLabel}. Subtly mention PFSW services. Company: PFSW (People Fail, Systems Work).`,
    };

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${aiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          { role: "system", content: `You are an email copywriter for PFSW, a platform providing quiz funnels and AI agents for digital entrepreneurs. Write professional, personalized emails. Use this signature:\n\nThe PFSW Team\nPeople Fail. Systems Work.\n\nReturn JSON with 'subject' and 'body' fields. Body should be plain text with line breaks. No markdown.` },
          { role: "user", content: `${prompts[emailType] || prompts.follow_up}\n\nRecent lead activity: ${activityContext || "none"}` },
        ],
        temperature: 0.6,
      }),
    });

    const aiData = await aiRes.json();
    const rawContent = aiData.choices?.[0]?.message?.content || "";

    let emailContent = { subject: `Following up — PFSW`, body: `Hi ${firstName},\n\nJust following up on your interest in automating your ${nicheLabel}. Let us know if you'd like to schedule a strategy call.\n\nBest,\nThe PFSW Team` };
    try {
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) emailContent = JSON.parse(jsonMatch[0]);
    } catch { /* use default */ }

    emailContent.body = emailContent.body.replace(/[#*_~`]/g, "");

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) throw new Error("RESEND_API_KEY not configured");

    const sendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: `PFSW <noreply@peoplefailsystemswork.com>`,
        to: [lead.email],
        subject: emailContent.subject,
        text: emailContent.body,
      }),
    });

    const sendData = await sendRes.json();
    if (!sendRes.ok) throw new Error(sendData.message || "Email send failed");

    // Log activity
    await sb.from("lead_activity_log").insert({
      lead_id,
      user_id: uid,
      from_status: lead.pipeline_status,
      to_status: lead.pipeline_status,
    });

    // Track usage
    const { data: usage } = await sb.rpc("get_or_create_usage", { p_user_id: uid });
    if (usage) {
      await sb.from("usage_tracking").update({ campaigns_used: (usage.campaigns_used || 0) + 1 }).eq("id", usage.id);
    }

    return new Response(JSON.stringify({ success: true, email_id: sendData.id, subject: emailContent.subject }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("send-email-followup error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
