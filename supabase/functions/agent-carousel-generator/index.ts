import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { product, slideCount, platform, offer, niche, targetAudience, userId, stepId, workflowId, params, memory } = await req.json();

    const actualProduct = product || params?.product || "product";
    const numSlides = slideCount || params?.slideCount || 5;
    const plat = platform || params?.platform || "facebook";
    const actualOffer = offer || params?.offer || "";
    const actualNiche = niche || params?.niche || "";
    const actualAudience = targetAudience || params?.targetAudience || "";
    const uid = userId || params?.user_id || "";

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    if (stepId) {
      await supabase.from("workflow_steps").update({ status: "running", started_at: new Date().toISOString() }).eq("id", stepId);
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    console.log("Generating", numSlides, "-slide carousel for:", actualProduct, "on", plat);

    // Generate structured carousel data via tool calling
    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a performance marketing creative director. Generate a ${numSlides}-slide carousel ad for ${plat}.`,
          },
          { role: "user", content: `Product/Service: ${actualProduct}${actualOffer ? `\nOffer: ${actualOffer}` : ""}${actualNiche ? `\nIndustry: ${actualNiche}` : ""}${actualAudience ? `\nTarget audience: ${actualAudience}` : ""}` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "create_carousel",
              description: "Create a structured carousel ad",
              parameters: {
                type: "object",
                properties: {
                  ad_primary_text: { type: "string", description: "Primary ad text (max 250 chars)" },
                  targeting_suggestions: { type: "string", description: "Audience targeting notes" },
                  slides: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        headline: { type: "string", description: "Slide headline (max 40 chars)" },
                        body: { type: "string", description: "Slide body copy (max 125 chars)" },
                        cta: { type: "string", description: "CTA button text" },
                        image_prompt: { type: "string", description: "Detailed prompt to generate the slide image (style, colors, composition, subject)" },
                      },
                      required: ["headline", "body", "cta", "image_prompt"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["ad_primary_text", "slides"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "create_carousel" } },
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      throw new Error(`AI gateway error [${aiRes.status}]: ${errText}`);
    }

    const aiData = await aiRes.json();

    // Extract structured data from tool call
    let carouselData: any = null;
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      try {
        carouselData = JSON.parse(toolCall.function.arguments);
      } catch {
        console.error("Failed to parse tool call arguments");
      }
    }

    // Fallback: extract from content if tool calling didn't work
    if (!carouselData) {
      const content = aiData.choices?.[0]?.message?.content || "";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try { carouselData = JSON.parse(jsonMatch[0]); } catch { /* ignore */ }
      }
    }

    if (!carouselData) {
      carouselData = {
        ad_primary_text: `Check out ${actualProduct}`,
        slides: Array.from({ length: numSlides }, (_, i) => ({
          headline: `Slide ${i + 1}`,
          body: `Discover ${actualProduct}`,
          cta: "Learn More",
          image_prompt: `Professional ad creative for ${actualProduct}, slide ${i + 1}, clean modern design`,
        })),
      };
    }

    const output = {
      carousel: carouselData,
      product: actualProduct,
      slide_count: carouselData.slides?.length || numSlides,
      platform: plat,
      image_prompts: (carouselData.slides || []).map((s: any) => s.image_prompt),
    };

    if (stepId) {
      await supabase.from("workflow_steps").update({ status: "done", completed_at: new Date().toISOString(), output }).eq("id", stepId);
    }

    // Update workflow memory with carousel data for downstream agents
    if (workflowId) {
      const { data: wf } = await supabase.from("workflows").select("memory").eq("id", workflowId).single();
      const currentMemory = (wf as any)?.memory || {};
      await supabase.from("workflows").update({
        memory: { ...currentMemory, carousel_output: output },
      }).eq("id", workflowId);

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
