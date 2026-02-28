import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { product, slideCount, platform, offer, niche, targetAudience, userId, stepId, workflowId } = await req.json();

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    if (stepId) {
      await supabase.from("workflow_steps").update({ status: "running", started_at: new Date().toISOString() }).eq("id", stepId);
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const numSlides = slideCount || 5;
    const plat = platform || "facebook";

    console.log("Generating", numSlides, "-slide carousel for:", product, "on", plat);

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a performance marketing creative director specializing in carousel ads. Generate a ${numSlides}-slide carousel ad for ${plat}.

For EACH slide provide:
- **Slide #** — Position in carousel
- **Headline** (max 40 chars) — Attention-grabbing, scroll-stopping
- **Body Copy** (max 125 chars) — Benefit-driven, emotionally compelling
- **CTA Text** — Action-oriented button text
- **Image Prompt** — Detailed prompt to generate the visual (style, colors, composition, subject)
- **Design Notes** — Font suggestions, color overlay, text placement

Also provide:
- **Ad Set Copy** — Primary text for the overall ad (max 250 chars)
- **Targeting Suggestions** — Audience demographics and interests
- **Hook Strategy** — Why this carousel sequence works psychologically

${offer ? `Special offer: ${offer}` : ""}
${niche ? `Industry: ${niche}` : ""}
${targetAudience ? `Target audience: ${targetAudience}` : ""}

Platform specs for ${plat}:
- Facebook/Instagram: 1080x1080px, 2-10 cards
- LinkedIn: 1080x1080px, 2-10 cards

Use markdown formatting. Make it conversion-optimized and thumb-stopping.`,
          },
          { role: "user", content: `Product/Service: ${product}` },
        ],
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      throw new Error(`AI gateway error [${aiRes.status}]: ${errText}`);
    }

    const aiData = await aiRes.json();
    const carousel = aiData.choices?.[0]?.message?.content || "No carousel generated.";

    const output = { carousel, product, slide_count: numSlides, platform: plat };

    if (stepId) {
      await supabase.from("workflow_steps").update({ status: "done", completed_at: new Date().toISOString(), output }).eq("id", stepId);
    }

    if (workflowId) {
      await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/orchestrator`, {
        method: "POST",
        headers: { Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`, "Content-Type": "application/json" },
        body: JSON.stringify({ workflowId, completedStepId: stepId }),
      }).catch((e) => console.error("Chain error:", e));
    }

    return new Response(JSON.stringify({ success: true, data: output }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("agent-carousel-generator error:", error);
    return new Response(JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
