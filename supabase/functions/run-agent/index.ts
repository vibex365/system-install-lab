import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LOVABLE_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

async function callAI(prompt: string): Promise<string> {
  const response = await fetch(LOVABLE_GATEWAY, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 2000,
    }),
  });
  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

async function scrapeUrl(url: string): Promise<string> {
  const apiKey = Deno.env.get("FIRECRAWL_API_KEY");
  if (!apiKey) return "";
  let formattedUrl = url.trim();
  if (!formattedUrl.startsWith("http")) formattedUrl = `https://${formattedUrl}`;
  const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
    method: "POST",
    headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ url: formattedUrl, formats: ["markdown", "summary"], onlyMainContent: true }),
  });
  const data = await res.json();
  return data.data?.summary || data.data?.markdown?.slice(0, 3000) || "";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
  );
  const serviceSupabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } }
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: authData, error: authError } = await supabase.auth.getClaims(token);
    if (authError || !authData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const userId = authData.claims.sub;

    const { agent_id, lease_id, input } = await req.json();

    // Verify active lease
    const { data: lease } = await serviceSupabase
      .from("agent_leases")
      .select("id, status")
      .eq("id", lease_id)
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle();

    if (!lease) {
      return new Response(JSON.stringify({ error: "No active lease found for this agent." }), { status: 403, headers: corsHeaders });
    }

    // Get agent details
    const { data: agent } = await serviceSupabase
      .from("agents")
      .select("slug, name, what_it_does")
      .eq("id", agent_id)
      .single();

    if (!agent) {
      return new Response(JSON.stringify({ error: "Agent not found." }), { status: 404, headers: corsHeaders });
    }

    // Create job record
    const { data: job } = await serviceSupabase
      .from("jobs")
      .insert({ type: agent.slug, payload_json: { ...input, user_id: userId, agent_id }, status: "queued" })
      .select("id")
      .single();

    // Create agent_runs record
    const { data: run } = await serviceSupabase
      .from("agent_runs")
      .insert({
        lease_id,
        user_id: userId,
        agent_id,
        job_id: job?.id,
        status: "running",
        input_payload: input,
      })
      .select("id")
      .single();

    // Run the agent pipeline based on slug
    let result = "";

    if (agent.slug === "site-audit") {
      const url = input.url || "";
      const scraped = await scrapeUrl(url);
      result = await callAI(`You are a UI/UX expert reviewing a Lovable-built web app.

Site URL: ${url}
Site content scraped:
${scraped}

Generate a detailed UI/UX audit in this format:
1. Top 3 critical issues (with specific fix instructions formatted as Lovable prompts)
2. Design improvements (typography, spacing, color consistency)
3. Mobile experience assessment
4. Conversion optimization recommendations
5. One ready-to-paste Lovable prompt that addresses the most critical issue

Be specific, actionable, and frame fixes as Lovable prompts where possible.`);
    }

    else if (agent.slug === "lead-prospector") {
      const city = input.city || "";
      const category = input.category || "";
      const scraped = await (async () => {
        const apiKey = Deno.env.get("FIRECRAWL_API_KEY");
        if (!apiKey) return "";
        const res = await fetch("https://api.firecrawl.dev/v1/search", {
          method: "POST",
          headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({ query: `${category} businesses in ${city} contact email phone website`, limit: 10 }),
        });
        const data = await res.json();
        return data.data?.map((r: any) => `${r.title}\n${r.description}\nURL: ${r.url}`).join("\n\n") || "";
      })();
      result = await callAI(`You are a lead research specialist. Based on these search results for "${category} in ${city}", extract and format lead data:

${scraped}

Format as a clean lead list with these columns for each business found:
- Business Name
- Phone (if found)
- Email (if found)  
- Website
- Category
- Notes (anything notable about their web presence)

If phone/email not found, mark as "Research needed". Include 5-10 leads. End with a summary of the best prospects and why.`);
    }

    else if (agent.slug === "website-proposal") {
      const url = input.url || "";
      const businessName = input.business_name || url;
      const scraped = await scrapeUrl(url);
      result = await callAI(`You are a web design sales expert. Analyze this website and write a compelling rebuild proposal.

Business: ${businessName}
Website: ${url}
Current site content:
${scraped}

Write a professional website rebuild proposal including:
1. Current State Analysis (specific problems with their site — design, mobile, speed, conversion)
2. What You'll Build (specific features and improvements)
3. Business Impact (why this matters to their revenue/customers)
4. Timeline (realistic, specific)
5. Investment (suggest $800-$2,500 range based on complexity)
6. Call to Action

Make it feel personal and specific to THEIR business, not generic. Use their actual business context.`);
    }

    else if (agent.slug === "social-media") {
      const topic = input.topic || "web design and development";
      const platform = input.platform || "all";
      result = await callAI(`You are a social media content strategist specializing in web design and development for freelancers.

Topic/Recent build: ${topic}
Platform(s): ${platform}

Generate a complete social media content package:

TWITTER/X (3 posts):
- One thread starter (hook + 3 follow-up tweets)
- One tip post with practical value
- One behind-the-scenes build post

LINKEDIN (1 post):
- Professional insight post (200-300 words) about what was built and what it means for clients

INSTAGRAM (1 caption):
- Visual-focused caption with story, outcome, and hashtags

Make all posts authentic, specific, and written as if from a skilled web designer who uses Lovable/AI to build fast.`);
    }

    else if (agent.slug === "competitor-intel") {
      const url = input.url || "";
      const scraped = await scrapeUrl(url);
      result = await callAI(`You are a competitive intelligence analyst. Analyze this competitor website and produce a positioning report.

Competitor URL: ${url}
Site content:
${scraped}

Produce a structured intelligence report:

1. STACK & TECHNOLOGY (what tools/tech they appear to use)
2. TARGET AUDIENCE (who they're selling to, their ICP)
3. POSITIONING & MESSAGING (their core value prop, tone, differentiators)
4. PRICING (if visible or inferable)
5. CONTENT STRATEGY (how they attract customers)
6. WEAKNESSES (gaps, dated content, poor UX, missing features)
7. YOUR COMPETITIVE ANGLE (3 specific ways to position against them)
8. BATTLE CARD (a one-paragraph pitch when a prospect mentions this competitor)

Be specific and actionable. Use what's actually on their site.`);
    }

    else if (agent.slug === "prompt-packager") {
      const rawPrompt = input.raw_prompt || "";
      result = await callAI(`You are a Lovable prompt specialist. Package this raw prompt into a structured, production-ready library entry.

RAW PROMPT:
${rawPrompt}

Output in this exact format:

TITLE: [Clear, descriptive title under 10 words]
COMPLEXITY: [simple | medium | complex | advanced]
SUMMARY: [2-sentence description of what this builds]
TAGS: [5-8 relevant tags, comma separated]
TARGET USER: [who benefits from this prompt]
INTEGRATIONS: [any APIs, services, or tools needed]

PACKAGED PROMPT:
[The fully rewritten, production-ready prompt. Should be specific, include all necessary context, define the tech stack, specify edge cases, and be ready to paste directly into Lovable. Minimum 3 paragraphs.]`);
    }

    else if (agent.slug === "weekly-recap") {
      const builds = input.builds || "various web projects";
      result = await callAI(`You are a build accountability coach. Write a weekly recap post for a web developer/designer.

This week they worked on: ${builds}

Write a weekly recap in this format:

WEEK OF [current week]:

📊 STATS:
- Estimated builds/projects worked on
- Key accomplishments

🏆 TOP BUILD THIS WEEK:
[A compelling narrative about the most interesting project - what was built, why it matters, what was learned]

📝 WEEKLY REFLECTION:
[3-4 sentences on momentum, what went well, what to improve]

📅 NEXT WEEK:
[2-3 specific goals]

FORMAT FOR LINKEDIN:
[A polished LinkedIn post (150-200 words) based on the above, written in first person]`);
    }

    else if (agent.slug === "sms-followup") {
      const status = input.status || "accepted";
      const applicantName = input.applicant_name || "there";
      const customMessage = input.custom_message || "";
      result = await callAI(`You are a community manager writing personalized SMS messages for PFSW (a selective web builder community).

Applicant name: ${applicantName}
Application status: ${status}
Additional context: ${customMessage}

Write 3 SMS message variations for this status change. Each should be:
- Under 160 characters (SMS standard)
- Personal and warm
- Specific to the PFSW community
- Include a clear next step

STATUS: ${status.toUpperCase()}

VARIATION 1 (warm/direct):
[message]

VARIATION 2 (energetic/motivational):
[message]

VARIATION 3 (professional/concise):
[message]

RECOMMENDATION: Which variation to use and why.`);
    }

    else if (agent.slug === "onboarding") {
      const memberName = input.member_name || "new member";
      const productIdea = input.product_idea || "their web project";
      result = await callAI(`You are the PFSW onboarding specialist. Create a complete onboarding package for a new member.

Member name: ${memberName}
Their product/idea: ${productIdea}

Generate:

1. WELCOME SMS (under 160 chars):
[personalized welcome text]

2. FIRST-BUILD PROMPT (ready to paste into Lovable):
[A complete, specific Lovable prompt tailored to their exact product idea — full stack, specific features, realistic scope for a first build in 1-2 hours]

3. ONBOARDING CHECKLIST (first 7 days):
[Day-by-day actions specific to their situation]

4. COHORT INTRO MESSAGE (what they should post to introduce themselves):
[A template they can personalize]

Make everything specific to ${memberName} and their ${productIdea}. No generic advice.`);
    }

    else {
      result = `Agent "${agent.name}" is queued and will process your request. Job ID: ${job?.id}`;
    }

    // Update run with result
    await serviceSupabase
      .from("agent_runs")
      .update({ status: "completed", result_summary: result })
      .eq("id", run?.id);

    // Update job status
    if (job?.id) {
      await serviceSupabase.from("jobs").update({ status: "completed" }).eq("id", job.id);
    }

    // Insert notification for the user
    await serviceSupabase.from("user_notifications").insert({
      user_id: userId,
      type: "agent_run",
      title: `${agent.name} completed`,
      body: result.slice(0, 200) + (result.length > 200 ? "…" : ""),
      agent_run_id: run?.id,
    });

    return new Response(JSON.stringify({ success: true, result, run_id: run?.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("[run-agent] Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
