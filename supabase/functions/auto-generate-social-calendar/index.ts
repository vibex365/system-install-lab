import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const KEYWORD_OPTIONS = [
  "SYSTEMS", "AUTOMATE", "REPLACE", "BUILD", "SCALE", "INSTALL",
  "FREEDOM", "LEVERAGE", "OPERATOR", "READY", "UPGRADE", "BLUEPRINT",
];

const CONTENT_THEMES = [
  { topic: "Why most business owners are the bottleneck in their own company", tone: "professional" },
  { topic: "How AI automation replaces 40+ hours of manual work per week", tone: "educational" },
  { topic: "The difference between a fake guru and a real systems operator", tone: "hype" },
  { topic: "Client success story: from doing everything manually to fully automated pipeline", tone: "storytelling" },
  { topic: "3 signs you need to replace yourself in your business before it breaks", tone: "casual" },
  { topic: "Stop hustling. Start building systems that work without you.", tone: "professional" },
  { topic: "The real cost of not automating: lost leads, missed calls, burned out founders", tone: "hype" },
  { topic: "What happens when you let AI handle your lead gen, follow-up, and booking", tone: "educational" },
  { topic: "People fail. Systems work. Which one are you betting on?", tone: "professional" },
  { topic: "How to build a client acquisition engine that runs 24/7", tone: "educational" },
  { topic: "Why your competition is automating while you're still sending DMs manually", tone: "hype" },
  { topic: "The 5-minute AI audit that shows exactly where you're leaking revenue", tone: "storytelling" },
  { topic: "Your mentor told you to grind harder. I'm telling you to build smarter.", tone: "casual" },
  { topic: "Most businesses don't have a lead problem — they have a follow-up problem", tone: "professional" },
];

const IMAGE_VARIANTS = [
  "learn_ai_dark", "bottleneck_dark", "replace_yourself_dark", "fake_guru_dark",
  "fake_guru_yellow", "replace_yourself_yellow", "bottleneck_yellow",
];

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
    let userId: string | null = null;

    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const supabaseUser = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } }
      );
      const { data: { user } } = await supabaseUser.auth.getUser();
      if (user) {
        const { data: isAdmin } = await supabaseAdmin.rpc("has_role", {
          _user_id: user.id,
          _role: "chief_architect",
        });
        if (!isAdmin) {
          return new Response(JSON.stringify({ error: "Admin access required" }), {
            status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        userId = user.id;
      }
    }

    if (!userId) {
      const { data: adminRoles } = await supabaseAdmin
        .from("user_roles")
        .select("user_id")
        .eq("role", "chief_architect")
        .limit(1);
      userId = adminRoles?.[0]?.user_id || null;
      if (!userId) {
        return new Response(JSON.stringify({ error: "No admin user found" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const daysToGenerate = body.days || 7;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch connected Late.dev profiles to only use platforms we can actually post to
    const LATE_API_KEY = Deno.env.get("LATE_API_KEY");
    let connectedPlatforms: string[] = ["facebook"]; // fallback
    if (LATE_API_KEY) {
      try {
        const profilesResp = await fetch(`${LATE_API_BASE}/profiles`, {
          headers: { Authorization: `Bearer ${LATE_API_KEY}` },
        });
        if (profilesResp.ok) {
          const profilesData = await profilesResp.json();
          const profiles = Array.isArray(profilesData) ? profilesData : profilesData.profiles || profilesData.data || [];
          connectedPlatforms = profiles
            .map((p: any) => (p.platform || p.type || "").toLowerCase())
            .filter((p: string) => p);
          if (!connectedPlatforms.length) connectedPlatforms = ["facebook"];
        }
      } catch (e) {
        console.error("Failed to fetch Late.dev profiles for platform selection:", e);
      }
    }

    // Start from today (i=0), not tomorrow
    const today = new Date();
    const scheduledDates: string[] = [];
    for (let i = 0; i < daysToGenerate; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      scheduledDates.push(d.toISOString().split("T")[0]);
    }

    const { data: existingPosts } = await supabaseAdmin
      .from("social_posts")
      .select("scheduled_date")
      .in("scheduled_date", scheduledDates);

    const existingDateSet = new Set((existingPosts || []).map((p: any) => p.scheduled_date));
    const datesToFill = scheduledDates.filter((d) => !existingDateSet.has(d));

    if (datesToFill.length === 0) {
      return new Response(JSON.stringify({ message: "Calendar already filled", generated: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const generated: any[] = [];

    for (let i = 0; i < datesToFill.length; i++) {
      const date = datesToFill[i];
      const theme = CONTENT_THEMES[Math.floor(Math.random() * CONTENT_THEMES.length)];
      // Only use connected platforms
      const platforms = [...connectedPlatforms];
      const imageVariant = IMAGE_VARIANTS[Math.floor(Math.random() * IMAGE_VARIANTS.length)];
      const keyword = KEYWORD_OPTIONS[Math.floor(Math.random() * KEYWORD_OPTIONS.length)];

      try {
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
                content: `You are a social media copywriter for Dale Payne-Sizer, who teaches AI automation and systems building. Generate a post for: ${platforms.join(", ")}.

Rules:
- Tone: ${theme.tone}. Direct, disciplined, operator mindset.
- Brand voice: "People Fail. Systems Work." — no hustle clichés, no fake guru energy
- Include relevant emojis sparingly
- IMPORTANT: The CTA must tell people to comment "SEND ME THE LINK" below the post. The goal is to get them to request access to the free group. Example: "Comment 'SEND ME THE LINK' below and I'll DM you the details." Do NOT include any group URLs or direct links in the post.
- Keep it under 280 chars for Twitter, under 2200 for Instagram, optimal length for others
- Return ONLY a JSON object with: { "text": "the post text", "hashtags": ["tag1", "tag2"] }`,
              },
              {
                role: "user",
                content: `Write a social media post about: ${theme.topic}`,
              },
            ],
          }),
        });

        if (!aiResp.ok) continue;

        const aiData = await aiResp.json();
        const content = aiData.choices?.[0]?.message?.content || "";

        let parsed = { text: content, hashtags: [] as string[] };
        try {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
        } catch { /* use raw */ }

        let fullText = parsed.text;
        if (parsed.hashtags?.length) fullText += "\n\n" + parsed.hashtags.map((h: string) => `#${h}`).join(" ");

        const { error } = await supabaseAdmin.from("social_posts").insert({
          content: fullText,
          platforms,
          scheduled_date: date,
          scheduled_for: null,
          approval_status: "pending",
          status: "draft",
          image_variant: imageVariant,
          include_quiz_url: false,
          keyword,
          user_id: userId,
        });

        if (!error) {
          generated.push({ date, topic: theme.topic, platforms, keyword });
        }
      } catch (e) {
        console.error(`Failed to generate for ${date}:`, e);
      }

      if (i < datesToFill.length - 1) {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }

    if (generated.length > 0) {
      const { data: adminRoles } = await supabaseAdmin
        .from("user_roles")
        .select("user_id")
        .eq("role", "chief_architect");

      for (const admin of adminRoles || []) {
        await supabaseAdmin.from("user_notifications").insert({
          user_id: admin.user_id,
          title: `${generated.length} new social posts ready for approval`,
          body: `The Social Agent generated ${generated.length} posts for the next ${daysToGenerate} days. Each post uses a keyword CTA — review and approve them in the Social Calendar.`,
          type: "social_generate",
        });
      }
    }

    return new Response(JSON.stringify({
      message: `Generated ${generated.length} posts`,
      generated,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("auto-generate-social-calendar error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
