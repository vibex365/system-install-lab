import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LATE_API_BASE = "https://getlate.dev/api/v1";

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

    const userId = user.id;

    const { data: isAdmin } = await supabaseAdmin.rpc("has_role", {
      _user_id: userId,
      _role: "chief_architect",
    });

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LATE_API_KEY = Deno.env.get("LATE_API_KEY");
    if (!LATE_API_KEY) {
      return new Response(JSON.stringify({ error: "Late.dev API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action } = body;

    if (action === "generate") {
      return await handleGenerate(body, corsHeaders);
    } else if (action === "post") {
      return await handlePost(body, LATE_API_KEY, supabaseAdmin, userId, corsHeaders);
    } else if (action === "accounts") {
      return await handleAccounts(LATE_API_KEY, corsHeaders);
    } else {
      return new Response(JSON.stringify({ error: "Invalid action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (e: any) {
    console.error("social-post error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function handleGenerate(
  body: { topic?: string; tone?: string; platforms?: string[]; keyword?: string; includeQuizUrl?: boolean; quizFunnelUrl?: string },
  corsHeaders: Record<string, string>
) {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    return new Response(JSON.stringify({ error: "AI not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { topic, tone, platforms, keyword, includeQuizUrl, quizFunnelUrl } = body;

  const kw = keyword || "SYSTEMS";
  const quizNote = includeQuizUrl && quizFunnelUrl
    ? `\n- You may ALSO include this quiz funnel link: ${quizFunnelUrl}`
    : "";

  const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content: `You are a social media copywriter for Dale Payne-Sizer, who teaches AI automation and systems building. Generate a post for: ${(platforms || ["facebook"]).join(", ")}.

Rules:
- Tone: ${tone || "professional but conversational"}. Direct, disciplined, operator mindset.
- Brand voice: "People Fail. Systems Work." — no hustle clichés, no fake guru energy
- Include relevant emojis sparingly
- IMPORTANT: The CTA must tell people to comment the keyword "${kw}" below the post to get more info. Example: "Drop '${kw}' in the comments and I'll send you the details." Do NOT include any group URLs or direct links.${quizNote}
- Keep it under 280 chars for Twitter, under 2200 for Instagram, optimal length for others
- Return ONLY a JSON object with: { "text": "the post text", "hashtags": ["tag1", "tag2"] }`,
        },
        {
          role: "user",
          content: `Write a social media post about: ${topic || "building AI automation systems"}`,
        },
      ],
    }),
  });

  if (!aiResp.ok) {
    const errText = await aiResp.text();
    throw new Error(`AI generation failed: ${errText}`);
  }

  const aiData = await aiResp.json();
  const content = aiData.choices?.[0]?.message?.content || "";

  let parsed = { text: content, hashtags: [] };
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      parsed = JSON.parse(jsonMatch[0]);
    }
  } catch {
    // Use raw content
  }

  return new Response(JSON.stringify({ generated: parsed }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function handlePost(
  body: { text: string; platforms: string[]; mediaUrls?: string[]; scheduledFor?: string },
  apiKey: string,
  supabaseAdmin: any,
  userId: string,
  corsHeaders: Record<string, string>
) {
  const { text, platforms, mediaUrls, scheduledFor } = body;

  if (!text || !platforms?.length) {
    return new Response(JSON.stringify({ error: "text and platforms are required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const payload: any = { text, platforms };
  if (mediaUrls?.length) payload.mediaUrls = mediaUrls;
  if (scheduledFor) payload.scheduledFor = scheduledFor;

  const resp = await fetch(`${LATE_API_BASE}/posts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await resp.json();

  if (!resp.ok) {
    throw new Error(`Late.dev API error [${resp.status}]: ${JSON.stringify(data)}`);
  }

  await supabaseAdmin.from("social_posts").insert({
    user_id: userId,
    content: text,
    platforms,
    media_urls: mediaUrls || [],
    scheduled_for: scheduledFor || null,
    late_post_id: data.id || null,
    status: scheduledFor ? "scheduled" : "published",
  });

  return new Response(JSON.stringify({ success: true, post: data }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function handleAccounts(apiKey: string, corsHeaders: Record<string, string>) {
  const resp = await fetch(`${LATE_API_BASE}/profiles`, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  const data = await resp.json();

  if (!resp.ok) {
    throw new Error(`Late.dev API error [${resp.status}]: ${JSON.stringify(data)}`);
  }

  return new Response(JSON.stringify({ accounts: data }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
