import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { decode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { prompt, style, dimensions, count, userId, stepId, workflowId } = await req.json();

    if (!prompt) throw new Error("Prompt is required");

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    if (stepId) {
      await supabase.from("workflow_steps").update({ status: "running", started_at: new Date().toISOString() }).eq("id", stepId);
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const numImages = Math.min(count || 1, 4);
    const imageUrls: string[] = [];

    const styleModifier = style
      ? `Style: ${style}. `
      : "Style: professional, high-quality, commercial photography aesthetic. ";

    const dimModifier = dimensions
      ? `Dimensions/aspect ratio: ${dimensions}. `
      : "Aspect ratio: square 1:1. ";

    for (let i = 0; i < numImages; i++) {
      const fullPrompt = `${styleModifier}${dimModifier}${prompt}${numImages > 1 ? ` (variation ${i + 1} of ${numImages})` : ""}`;

      console.log(`Generating image ${i + 1}/${numImages}:`, fullPrompt.slice(0, 100));

      const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image",
          messages: [{ role: "user", content: fullPrompt }],
          modalities: ["image", "text"],
        }),
      });

      if (!aiRes.ok) {
        const errText = await aiRes.text();
        console.error(`Image generation failed [${aiRes.status}]:`, errText);
        if (aiRes.status === 429) throw new Error("Rate limited — please try again in a moment");
        if (aiRes.status === 402) throw new Error("Credits exhausted — please add funds");
        throw new Error(`AI gateway error [${aiRes.status}]`);
      }

      const aiData = await aiRes.json();
      const imageData = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

      if (!imageData) {
        console.error("No image in response");
        continue;
      }

      // Upload to storage
      const base64String = imageData.replace(/^data:image\/\w+;base64,/, "");
      const imageBytes = decode(base64String);
      const fileName = `generated/${userId || "anon"}/${Date.now()}-${i}.png`;

      // Ensure bucket exists (ignore error if already exists)
      await supabase.storage.createBucket("ad-creatives", { public: true }).catch(() => {});

      const { error: uploadError } = await supabase.storage
        .from("ad-creatives")
        .upload(fileName, imageBytes, { contentType: "image/png", upsert: true });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        // Fall back to base64 URL
        imageUrls.push(imageData);
      } else {
        const { data: publicUrl } = supabase.storage.from("ad-creatives").getPublicUrl(fileName);
        imageUrls.push(publicUrl.publicUrl);
      }
    }

    if (imageUrls.length === 0) throw new Error("Failed to generate any images");

    const output = {
      images: imageUrls,
      count: imageUrls.length,
      prompt,
      style: style || "professional",
    };

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
    console.error("agent-image-generator error:", error);
    return new Response(JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
