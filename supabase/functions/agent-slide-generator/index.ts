import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { topic, slideCount, audience, purpose, niche, userId, stepId, workflowId } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    if (stepId) {
      await supabase.from("workflow_steps").update({ status: "running", started_at: new Date().toISOString() }).eq("id", stepId);
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const numSlides = slideCount || 10;

    console.log("Generating", numSlides, "slides for:", topic);

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an expert presentation designer and strategist. Create a ${numSlides}-slide presentation deck.

For each slide provide:
- **Slide Number & Title**
- **Key Points** (3-5 bullet points)
- **Speaker Notes** (2-3 sentences of what to say)
- **Visual Suggestion** (what image/graphic/chart to use)

Structure:
- Slide 1: Title slide with hook
- Slide 2: Problem/Agenda
- Slides 3-${numSlides - 2}: Core content
- Slide ${numSlides - 1}: Summary/Key Takeaways
- Slide ${numSlides}: CTA/Next Steps

${audience ? `Target audience: ${audience}` : ""}
${purpose ? `Purpose: ${purpose}` : ""}
${niche ? `Industry context: ${niche}` : ""}

Use markdown. Make it compelling, data-driven where possible, and presentation-ready.`,
          },
          { role: "user", content: `Presentation topic: ${topic}` },
        ],
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      throw new Error(`AI gateway error [${aiRes.status}]: ${errText}`);
    }

    const aiData = await aiRes.json();
    const deck = aiData.choices?.[0]?.message?.content || "No slides generated.";

    const output = { deck, topic, slide_count: numSlides, audience: audience || null, purpose: purpose || null };

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
    console.error("agent-slide-generator error:", error);
    return new Response(JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
