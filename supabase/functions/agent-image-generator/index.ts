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
    const { prompt, style, dimensions, count, userId, stepId, workflowId, params, memory } = await req.json();

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    if (stepId) {
      await supabase.from("workflow_steps").update({ status: "running", started_at: new Date().toISOString() }).eq("id", stepId);
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const uid = userId || params?.user_id || "anon";

    // Check if we have carousel output from a previous step in the chain
    let carouselOutput: any = null;
    if (workflowId) {
      const { data: wf } = await supabase.from("workflows").select("memory").eq("id", workflowId).single();
      carouselOutput = (wf as any)?.memory?.carousel_output;
    }
    if (!carouselOutput && memory?.carousel_output) {
      carouselOutput = memory.carousel_output;
    }

    // Determine prompts to generate
    let imagePrompts: string[] = [];

    if (carouselOutput?.image_prompts?.length) {
      // Chained mode: generate one image per carousel slide
      imagePrompts = carouselOutput.image_prompts;
      console.log(`Chained mode: generating ${imagePrompts.length} images from carousel`);
    } else {
      // Standalone mode
      const actualPrompt = prompt || params?.prompt || "Professional marketing image";
      const numImages = Math.min(count || params?.count || 1, 4);
      imagePrompts = Array.from({ length: numImages }, (_, i) =>
        numImages > 1 ? `${actualPrompt} (variation ${i + 1} of ${numImages})` : actualPrompt
      );
    }

    const styleModifier = style || params?.style || "professional, high-quality, commercial photography aesthetic";
    const dimModifier = dimensions || params?.dimensions || "square 1:1, 1080x1080px";
    const imageUrls: string[] = [];

    // Ensure bucket exists
    await supabase.storage.createBucket("ad-creatives", { public: true }).catch(() => {});

    for (let i = 0; i < imagePrompts.length; i++) {
      const fullPrompt = `Style: ${styleModifier}. Dimensions: ${dimModifier}. ${imagePrompts[i]}`;

      console.log(`Generating image ${i + 1}/${imagePrompts.length}`);

      try {
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
          console.error(`Image ${i + 1} failed [${aiRes.status}]`);
          if (aiRes.status === 429) {
            // Rate limited — wait and retry once
            console.log("Rate limited, waiting 5s...");
            await new Promise((r) => setTimeout(r, 5000));
            continue;
          }
          continue;
        }

        const aiData = await aiRes.json();
        const imageData = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
        if (!imageData) { console.error("No image in response"); continue; }

        // Upload to storage
        const base64String = imageData.replace(/^data:image\/\w+;base64,/, "");
        const imageBytes = decode(base64String);
        const fileName = `generated/${uid}/${Date.now()}-slide-${i}.png`;

        const { error: uploadError } = await supabase.storage
          .from("ad-creatives")
          .upload(fileName, imageBytes, { contentType: "image/png", upsert: true });

        if (uploadError) {
          console.error("Upload error:", uploadError);
          imageUrls.push(imageData); // fallback to base64
        } else {
          const { data: publicUrl } = supabase.storage.from("ad-creatives").getPublicUrl(fileName);
          imageUrls.push(publicUrl.publicUrl);
        }
      } catch (imgErr) {
        console.error(`Image ${i + 1} error:`, imgErr);
      }

      // Small delay between generations to avoid rate limits
      if (i < imagePrompts.length - 1) await new Promise((r) => setTimeout(r, 1500));
    }

    if (imageUrls.length === 0) throw new Error("Failed to generate any images");

    const output = {
      images: imageUrls,
      count: imageUrls.length,
      prompts_used: imagePrompts,
      chained_from_carousel: !!carouselOutput,
    };

    if (stepId) {
      await supabase.from("workflow_steps").update({ status: "done", completed_at: new Date().toISOString(), output }).eq("id", stepId);
    }

    // Update workflow memory with generated image URLs for downstream agents (media buyer)
    if (workflowId) {
      const { data: wf } = await supabase.from("workflows").select("memory").eq("id", workflowId).single();
      const currentMemory = (wf as any)?.memory || {};
      await supabase.from("workflows").update({
        memory: { ...currentMemory, generated_images: imageUrls },
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
    console.error("agent-image-generator error:", error);
    return new Response(JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
