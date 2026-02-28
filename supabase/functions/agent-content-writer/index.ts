import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { brief, contentType, tone, niche, targetAudience, userId, stepId, workflowId } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    if (stepId) {
      await supabase.from("workflow_steps").update({ status: "running", started_at: new Date().toISOString() }).eq("id", stepId);
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const typeInstructions: Record<string, string> = {
      blog: "Write a complete blog post (800-1200 words) with headline, subheadings, intro, body, and conclusion. Include a meta description.",
      ad_copy: "Write 3 ad copy variations. Each should include: headline (max 40 chars), primary text (max 125 chars), description (max 30 chars), and a CTA.",
      email_sequence: "Write a 3-email nurture sequence. Each email should have: subject line, preview text, body copy, and CTA. Space them 2-3 days apart.",
      social: "Write 5 social media posts optimized for engagement. Include hashtag suggestions and best posting times.",
    };

    const type = contentType || "blog";
    const instruction = typeInstructions[type] || typeInstructions.blog;

    console.log("Generating", type, "content for:", brief);

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an expert copywriter and content strategist. ${instruction}

Tone: ${tone || "professional yet approachable"}
${niche ? `Industry/Niche: ${niche}` : ""}
${targetAudience ? `Target audience: ${targetAudience}` : ""}

Use markdown formatting. Make content compelling, specific, and actionable.`,
          },
          { role: "user", content: `Content brief: ${brief}` },
        ],
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      throw new Error(`AI gateway error [${aiRes.status}]: ${errText}`);
    }

    const aiData = await aiRes.json();
    const content = aiData.choices?.[0]?.message?.content || "No content generated.";

    const output = { content, content_type: type, brief, tone: tone || "professional" };

    if (stepId) {
      await supabase.from("workflow_steps").update({
        status: "done",
        completed_at: new Date().toISOString(),
        output,
      }).eq("id", stepId);
    }

    if (workflowId) {
      const orchestratorUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/orchestrator`;
      await fetch(orchestratorUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ workflowId, completedStepId: stepId }),
      }).catch((e) => console.error("Orchestrator chain error:", e));
    }

    return new Response(JSON.stringify({ success: true, data: output }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("agent-content-writer error:", error);
    return new Response(JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
