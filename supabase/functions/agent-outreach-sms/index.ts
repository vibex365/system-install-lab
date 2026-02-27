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

    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const fromNumber = Deno.env.get("TWILIO_PHONE_NUMBER");
    if (!accountSid || !authToken || !fromNumber) {
      throw new Error("Twilio not configured");
    }

    const serviceSupabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const maxSms = params?.max_sms ?? 25;

    // Fetch contacted leads with phone numbers
    const { data: leads, error: leadsErr } = await serviceSupabase
      .from("leads")
      .select("*")
      .eq("user_id", user_id)
      .eq("pipeline_status", "contacted")
      .not("phone", "is", null)
      .order("rating", { ascending: false })
      .limit(maxSms);

    if (leadsErr) throw leadsErr;

    if (!leads || leads.length === 0) {
      await serviceSupabase.from("workflow_steps").update({
        status: "completed",
        output: { sent: 0, message: "No contacted leads with phone numbers found" },
        completed_at: new Date().toISOString(),
      }).eq("id", step_id);

      return new Response(JSON.stringify({
        success: true,
        data: { sent: 0 },
        memory_update: { outreach_sms_results: { sent: 0 } },
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Generate personalized SMS messages via AI
    const leadSummaries = leads.map((l, i) =>
      `Lead ${i + 1}: ${l.business_name} | Contact: ${l.contact_name || "Business Owner"} | Category: ${l.category || "general"} | City: ${l.city || "unknown"}`
    ).join("\n");

    const generateRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an SMS copywriter for PFSW (People Fail, Systems Work), a platform that helps digital entrepreneurs automate their business with quiz funnels and AI agents.

Generate a short, personalized SMS for each lead. The SMS should:
- Be under 160 characters
- Reference their business name naturally
- Be friendly and professional, representing PFSW brand
- Include a soft CTA (reply YES to learn more, or similar)
- NOT include links or spammy language
- Sign off with "- PFSW" when space allows

Return ONLY a JSON array: [{"lead_index":0,"message":"..."}]
No markdown, no explanation — just the JSON array.`,
          },
          { role: "user", content: leadSummaries },
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!generateRes.ok) {
      const errText = await generateRes.text();
      console.error("AI SMS generation error:", generateRes.status, errText);
      throw new Error(`AI SMS generation failed: ${generateRes.status}`);
    }

    const generateData = await generateRes.json();
    const raw = generateData.choices?.[0]?.message?.content || "[]";
    const match = raw.match(/\[[\s\S]*\]/);

    let messages: Array<{ lead_index: number; message: string }> = [];
    try {
      messages = JSON.parse(match ? match[0] : "[]");
    } catch {
      console.error("Failed to parse AI-generated SMS messages");
      messages = [];
    }

    // Send SMS via Twilio
    let sent = 0;
    let failed = 0;
    const results: Array<{ lead_id: string; business: string; status: string; error?: string }> = [];
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const twilioAuth = btoa(`${accountSid}:${authToken}`);

    for (const sms of messages) {
      const lead = leads[sms.lead_index];
      if (!lead?.phone) continue;

      try {
        const twilioRes = await fetch(twilioUrl, {
          method: "POST",
          headers: {
            Authorization: `Basic ${twilioAuth}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            To: lead.phone,
            From: fromNumber,
            Body: sms.message,
          }),
        });

        const twilioData = await twilioRes.json();

        if (twilioRes.ok) {
          sent++;
          results.push({ lead_id: lead.id, business: lead.business_name, status: "sent" });

          // Log to outreach_log
          await serviceSupabase.from("outreach_log").insert({
            user_id,
            lead_id: lead.id,
            channel: "sms",
            recipient_phone: lead.phone,
            company_name: lead.business_name,
            sms_body: sms.message,
            delivery_status: "sent",
          });

          // Update lead pipeline status
          await serviceSupabase.from("leads").update({
            pipeline_status: "sms_sent",
            notes: `${lead.notes || ""}\n\nSMS sent: ${sms.message}`.trim(),
            updated_at: new Date().toISOString(),
          }).eq("id", lead.id).eq("user_id", user_id);
        } else {
          failed++;
          results.push({ lead_id: lead.id, business: lead.business_name, status: "failed", error: twilioData.message });
          console.error(`Failed SMS to ${lead.phone}:`, twilioData);
        }
      } catch (sendErr) {
        failed++;
        results.push({ lead_id: lead.id, business: lead.business_name, status: "failed", error: (sendErr as Error).message });
      }

      // Rate limit delay
      await new Promise((r) => setTimeout(r, 300));
    }

    const result = {
      total_leads: leads.length,
      sms_generated: messages.length,
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

      const agentFnName = `agent-${nextStep.agent_id.replace(/_/g, "-")}`;
      const updatedMemory = { ...memory, outreach_sms_results: result };

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
      memory: { ...memory, outreach_sms_results: result },
      updated_at: new Date().toISOString(),
    }).eq("id", workflow_id);

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Outreach SMS agent error:", err);
    return new Response(JSON.stringify({ success: false, error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
