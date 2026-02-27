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
    const { workflow_id, step_id, user_id, params, memory } = await req.json();
    if (!workflow_id || !step_id || !user_id) {
      throw new Error("Missing required fields: workflow_id, step_id, user_id");
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("AI not configured");

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");

    const serviceSupabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const template = params?.template || "intro";
    const maxEmails = params?.max_emails ?? 25;
    const fromEmail = params?.from_email || "outreach@mail.peoplefailsystemswork.com";
    const fromName = params?.from_name || "PFSW";

    // Fetch qualified leads with email addresses
    const { data: leads, error: leadsErr } = await serviceSupabase
      .from("leads")
      .select("*")
      .eq("user_id", user_id)
      .eq("pipeline_status", "qualified")
      .not("email", "is", null)
      .order("rating", { ascending: false })
      .limit(maxEmails);

    if (leadsErr) throw leadsErr;

    if (!leads || leads.length === 0) {
      await serviceSupabase.from("workflow_steps").update({
        status: "completed",
        output: { sent: 0, message: "No qualified leads with email addresses found" },
        completed_at: new Date().toISOString(),
      }).eq("id", step_id);

      return new Response(JSON.stringify({
        success: true,
        data: { sent: 0 },
        memory_update: { outreach_email_results: { sent: 0 } },
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Use AI to generate personalized email for each lead
    const leadSummaries = leads.map((l, i) =>
      `Lead ${i + 1}: ${l.business_name} | Contact: ${l.contact_name || "Business Owner"} | Category: ${l.category || "general"} | City: ${l.city || "unknown"} | Website: ${l.website || "none"} | Score: ${l.rating || "N/A"}`
    ).join("\n");

    const generateRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an email copywriter for PFSW (People Fail, Systems Work), a platform that helps digital entrepreneurs automate their lead generation with quiz funnels and AI agents. Template style: "${template}".

Generate a personalized outreach email for each lead. The email should:
- Be professional but warm and conversational
- Reference their specific business/industry
- Explain how PFSW's automation tools can help their business
- Include a soft CTA (reply or book a strategy call)
- Be 3-4 short paragraphs max
- Subject line should be compelling and personalized
- Sign off with "The PFSW Team" or "People Fail. Systems Work."

Return ONLY a JSON array: [{"lead_index":0,"subject":"...","body":"..."}]
No markdown, no explanation — just the JSON array.`,
          },
          { role: "user", content: leadSummaries },
        ],
        temperature: 0.7,
        max_tokens: 8000,
      }),
    });

    if (!generateRes.ok) {
      const errText = await generateRes.text();
      console.error("AI email generation error:", generateRes.status, errText);
      throw new Error(`AI email generation failed: ${generateRes.status}`);
    }

    const generateData = await generateRes.json();
    const raw = generateData.choices?.[0]?.message?.content || "[]";
    const match = raw.match(/\[[\s\S]*\]/);

    let emails: Array<{ lead_index: number; subject: string; body: string }> = [];
    try {
      emails = JSON.parse(match ? match[0] : "[]");
    } catch {
      console.error("Failed to parse AI-generated emails");
      emails = [];
    }

    // Send emails via Resend
    let sent = 0;
    let failed = 0;
    const results: Array<{ lead_id: string; business: string; status: string; error?: string }> = [];

    for (const email of emails) {
      const lead = leads[email.lead_index];
      if (!lead?.email) continue;

      try {
        const sendRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: `${fromName} <${fromEmail}>`,
            to: [lead.email],
            subject: email.subject,
            html: formatEmailHtml(email.body, lead),
          }),
        });

        if (sendRes.ok) {
          sent++;
          results.push({ lead_id: lead.id, business: lead.business_name, status: "sent" });

          // Update lead pipeline status
          await serviceSupabase.from("leads").update({
            pipeline_status: "contacted",
            notes: `${lead.notes || ""}\n\nEmail sent: ${email.subject}`.trim(),
            updated_at: new Date().toISOString(),
          }).eq("id", lead.id).eq("user_id", user_id);
        } else {
          const errBody = await sendRes.text();
          failed++;
          results.push({ lead_id: lead.id, business: lead.business_name, status: "failed", error: errBody });
          console.error(`Failed to send to ${lead.email}:`, errBody);
        }
      } catch (sendErr) {
        failed++;
        results.push({ lead_id: lead.id, business: lead.business_name, status: "failed", error: (sendErr as Error).message });
      }

      // Small delay to avoid rate limiting
      await new Promise((r) => setTimeout(r, 200));
    }

    const result = {
      total_leads: leads.length,
      emails_generated: emails.length,
      sent,
      failed,
      top_results: results.slice(0, 10),
    };

    // Update workflow step
    await serviceSupabase.from("workflow_steps").update({
      status: "completed",
      output: result,
      completed_at: new Date().toISOString(),
    }).eq("id", step_id);

    // Advance next step
    const { data: nextStep } = await serviceSupabase
      .from("workflow_steps")
      .select("id, agent_id, input")
      .eq("workflow_id", workflow_id)
      .eq("status", "pending")
      .order("position", { ascending: true })
      .limit(1)
      .single();

    if (nextStep) {
      await serviceSupabase.from("workflow_steps").update({
        status: "running",
        started_at: new Date().toISOString(),
      }).eq("id", nextStep.id);

      // Chain to next agent
      const agentFnName = `agent-${nextStep.agent_id.replace(/_/g, "-")}`;
      const updatedMemory = { ...memory, outreach_email_results: result };

      try {
        await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/${agentFnName}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            workflow_id,
            step_id: nextStep.id,
            user_id,
            params: nextStep.input,
            memory: updatedMemory,
          }),
        });
      } catch (chainErr) {
        console.error(`Failed to chain ${agentFnName}:`, chainErr);
      }
    } else {
      await serviceSupabase.from("workflows").update({
        status: "completed",
        updated_at: new Date().toISOString(),
      }).eq("id", workflow_id);
    }

    // Update workflow memory
    await serviceSupabase.from("workflows").update({
      memory: { ...memory, outreach_email_results: result },
      updated_at: new Date().toISOString(),
    }).eq("id", workflow_id);

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Outreach email agent error:", err);
    return new Response(JSON.stringify({ success: false, error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function formatEmailHtml(body: string, lead: any): string {
  const paragraphs = body.split("\n").filter(Boolean).map((p) => `<p style="margin:0 0 14px;line-height:1.6;color:#333;">${p}</p>`).join("");
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
