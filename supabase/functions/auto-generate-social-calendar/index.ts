import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FB_GROUP_URL = "https://www.facebook.com/share/g/18ewsZUu7t/?mibextid=wwXIfr";
const QUIZ_FUNNEL_URL = "https://system-install-lab.lovable.app/systems-quiz";

const CONTENT_THEMES = [
  { topic: "Why most business owners are the bottleneck in their own company", tone: "professional", includeQuiz: true },
  { topic: "How AI automation replaces 40+ hours of manual work per week", tone: "educational", includeQuiz: false },
  { topic: "The difference between a fake guru and a real systems operator", tone: "hype", includeQuiz: true },
  { topic: "Client success story: from doing everything manually to fully automated pipeline", tone: "storytelling", includeQuiz: false },
  { topic: "3 signs you need to replace yourself in your business before it breaks", tone: "casual", includeQuiz: true },
  { topic: "Stop hustling. Start building systems that work without you.", tone: "professional", includeQuiz: false },
  { topic: "The real cost of not automating: lost leads, missed calls, burned out founders", tone: "hype", includeQuiz: true },
  { topic: "What happens when you let AI handle your lead gen, follow-up, and booking", tone: "educational", includeQuiz: false },
  { topic: "Free community for business owners ready to install real systems", tone: "casual", includeQuiz: false },
  { topic: "People fail. Systems work. Which one are you betting on?", tone: "professional", includeQuiz: true },
  { topic: "How to build a client acquisition engine that runs 24/7", tone: "educational", includeQuiz: true },
  { topic: "Why your competition is automating while you're still sending DMs manually", tone: "hype", includeQuiz: false },
  { topic: "The 5-minute AI audit that shows exactly where you're leaking revenue", tone: "storytelling", includeQuiz: true },
  { topic: "Your mentor told you to grind harder. I'm telling you to build smarter.", tone: "casual", includeQuiz: true },
];

const IMAGE_VARIANTS = [
  "learn_ai_dark", "bottleneck_dark", "replace_yourself_dark", "fake_guru_dark",
  "fake_guru_yellow", "replace_yourself_yellow", "bottleneck_yellow",
];

const PLATFORMS_ROTATION = [
  ["facebook", "instagram", "linkedin"],
  ["facebook", "twitter", "threads"],
  ["facebook", "instagram", "tiktok"],
  ["facebook", "linkedin", "youtube"],
  ["facebook", "instagram", "twitter", "linkedin"],
  ["facebook", "reddit", "threads"],
  ["facebook", "instagram"],
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    // Allow both cron (no auth) and manual trigger (with auth)
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

    // If no user from auth, find chief_architect for attribution
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

    // Check which dates already have posts in the next N days
    const today = new Date();
    const scheduledDates: string[] = [];
    for (let i = 1; i <= daysToGenerate; i++) {
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
      const platforms = PLATFORMS_ROTATION[Math.floor(Math.random() * PLATFORMS_ROTATION.length)];
      const imageVariant = IMAGE_VARIANTS[Math.floor(Math.random() * IMAGE_VARIANTS.length)];

      const groupNote = `\n- MUST include this FB group link in the post: ${FB_GROUP_URL}`;
      const quizNote = theme.includeQuiz
        ? `\n- MUST include this quiz funnel link: ${QUIZ_FUNNEL_URL}`
        : "";

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
- Include a clear CTA driving people to the free community${groupNote}${quizNote}
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
        if (!fullText.includes(FB_GROUP_URL)) fullText += `\n\n${FB_GROUP_URL}`;
        if (theme.includeQuiz && !fullText.includes(QUIZ_FUNNEL_URL)) {
          fullText += `\n\nTake the free quiz: ${QUIZ_FUNNEL_URL}`;
        }

        const { error } = await supabaseAdmin.from("social_posts").insert({
          content: fullText,
          platforms,
          scheduled_date: date,
          scheduled_for: null,
          approval_status: "pending",
          status: "draft",
          image_variant: imageVariant,
          include_quiz_url: theme.includeQuiz,
          user_id: userId,
        });

        if (!error) {
          generated.push({ date, topic: theme.topic, platforms });
        }
      } catch (e) {
        console.error(`Failed to generate for ${date}:`, e);
      }

      // Small delay to avoid rate limiting
      if (i < datesToFill.length - 1) {
        await new Promise((r) => setTimeout(r, 1000));
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
