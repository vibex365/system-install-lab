import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userErr } = await supabaseUser.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: isAdmin } = await supabaseAdmin.rpc("has_role", {
      _user_id: user.id,
      _role: "chief_architect",
    });

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action } = body;

    if (action === "generate_script") {
      return await handleGenerateScript(body, LOVABLE_API_KEY, corsHeaders);
    } else if (action === "save_project") {
      return await handleSaveProject(body, supabaseAdmin, user.id, corsHeaders);
    } else if (action === "generate_image") {
      return await handleGenerateImage(body, LOVABLE_API_KEY, corsHeaders);
    } else {
      return new Response(JSON.stringify({ error: "Invalid action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (e: any) {
    console.error("generate-video-script error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function handleGenerateScript(
  body: { topic: string; tone?: string; format?: string },
  apiKey: string,
  corsHeaders: Record<string, string>
) {
  const { topic, tone, format } = body;

  const formatGuide = format === "interview"
    ? "Write as a 2-person interview/conversation format with a host and guest."
    : format === "roundtable"
    ? "Write as a 3-person roundtable discussion with multiple perspectives."
    : "Write as a solo presenter talking directly to camera.";

  const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      tools: [
        {
          type: "function",
          function: {
            name: "create_video_script",
            description: "Generate a structured video script with 4-6 scenes for a 60-second vertical short-form video.",
            parameters: {
              type: "object",
              properties: {
                title: { type: "string", description: "Catchy video title for the short" },
                scenes: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string", description: "Scene label (e.g., Hook, Point 1, CTA)" },
                      narration: { type: "string", description: "What the speaker says on camera (5-15 seconds worth of speech)" },
                      visual_prompt: { type: "string", description: "Detailed visual description for AI video generation: what should be shown on screen. Include setting, actions, camera movement, mood, and style. Must work for 9:16 vertical video." },
                      caption_text: { type: "string", description: "Bold on-screen text overlay (3-6 words max)" },
                    },
                    required: ["title", "narration", "visual_prompt", "caption_text"],
                  },
                },
              },
              required: ["title", "scenes"],
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "create_video_script" } },
      messages: [
        {
          role: "system",
          content: `You are a viral short-form video scriptwriter for Dale Payne-Sizer's brand "People Fail. Systems Work."

You create 60-second vertical video scripts (9:16) for TikTok and YouTube Shorts about AI tools, automation, and business systems.

${formatGuide}

Rules:
- Tone: ${tone || "educational but punchy"}. Direct, no fluff, operator mindset.
- Scene 1 MUST be a scroll-stopping hook (pattern interrupt, bold claim, or provocative question)
- Last scene MUST be a CTA: "Comment SYSTEMS below" or similar engagement driver
- Each scene = 5-15 seconds of narration
- Visual prompts should describe cinematic, professional scenes suitable for AI video generation
- Caption text should be bold, readable text overlays (3-6 words)
- Total script should be ~60 seconds when read aloud
- NO hustle bro clichés. Be authentic, disciplined, systems-focused.
- Include practical value — name specific tools, techniques, or frameworks when relevant`,
        },
        {
          role: "user",
          content: `Create a short-form video script about: ${topic}`,
        },
      ],
    }),
  });

  if (!aiResp.ok) {
    const errText = await aiResp.text();
    throw new Error(`AI generation failed: ${errText}`);
  }

  const aiData = await aiResp.json();
  
  // Extract from tool call
  const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall) {
    throw new Error("AI did not return structured script data");
  }

  const script = JSON.parse(toolCall.function.arguments);

  return new Response(JSON.stringify({ script }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function handleSaveProject(
  body: { title: string; topic: string; tone: string; format: string; scenes: any[] },
  supabaseAdmin: any,
  userId: string,
  corsHeaders: Record<string, string>
) {
  const { title, topic, tone, format, scenes } = body;

  // Create project
  const { data: project, error: projErr } = await supabaseAdmin
    .from("video_projects")
    .insert({
      user_id: userId,
      title,
      topic,
      tone: tone || "educational",
      format: format || "solo",
      status: "scripted",
    })
    .select()
    .single();

  if (projErr) throw projErr;

  // Insert scenes
  const sceneRows = scenes.map((s: any, i: number) => ({
    project_id: project.id,
    scene_order: i + 1,
    title: s.title,
    narration: s.narration,
    visual_prompt: s.visual_prompt,
    caption_text: s.caption_text,
    status: "draft",
  }));

  const { error: scenesErr } = await supabaseAdmin
    .from("video_scenes")
    .insert(sceneRows);

  if (scenesErr) throw scenesErr;

  return new Response(JSON.stringify({ success: true, project }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function handleGenerateImage(
  body: { visual_prompt: string; scene_id: string },
  apiKey: string,
  corsHeaders: Record<string, string>
) {
  // Use Gemini image model to generate a scene image
  const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-image",
      messages: [
        {
          role: "user",
          content: `Generate a cinematic 9:16 vertical image for a short-form video scene. The image should be photorealistic, professional, and visually striking.

Scene description: ${body.visual_prompt}

Style: Modern, clean, professional. Suitable for TikTok/YouTube Shorts. Vertical 9:16 aspect ratio.`,
        },
      ],
    }),
  });

  if (!aiResp.ok) {
    const errText = await aiResp.text();
    throw new Error(`Image generation failed: ${errText}`);
  }

  const aiData = await aiResp.json();
  const imageContent = aiData.choices?.[0]?.message?.content;

  return new Response(JSON.stringify({ 
    success: true, 
    scene_id: body.scene_id,
    image_data: imageContent,
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
