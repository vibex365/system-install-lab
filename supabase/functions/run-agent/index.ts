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

    const { agent_id, lease_id, input, schedule } = await req.json();

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

    // If a schedule (cron expression) was provided, calculate next_run_at and persist to the lease
    if (schedule) {
      let nextRunAt: Date | null = null;
      const now = new Date();
      if (schedule === "0 9 * * *") {
        // Daily at 9am UTC — next occurrence tomorrow
        nextRunAt = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 9, 0, 0));
      } else if (schedule === "0 9 * * 1") {
        // Weekly on Monday at 9am UTC — find next Monday
        const daysUntilMonday = (8 - now.getUTCDay()) % 7 || 7;
        nextRunAt = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + daysUntilMonday, 9, 0, 0));
      }

      if (nextRunAt) {
        await serviceSupabase
          .from("agent_leases")
          .update({ schedule, next_run_at: nextRunAt.toISOString() })
          .eq("id", lease_id);
      }
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
      const url = input.website || input.url || "";
      const businessName = input.business_name || "";
      const category = input.category || "";
      const city = input.city || "";
      const scraped = url ? await scrapeUrl(url) : "";
      result = await callAI(`You are a local business website analyst and digital marketing consultant. You work independently — do NOT mention any tools, platforms, or software you use. Never mention Lovable, Supabase, or any specific tech stack. You are presenting yourself as a consultant who builds custom solutions.

Business: ${businessName}
Category: ${category}
Location: ${city}
Website: ${url}
Website content:
${scraped || "No website content available — this business may not have a website or it could not be scraped."}

Analyze this business's online presence and produce a clear, actionable report. Write in plain text only — no markdown, no asterisks, no hashtags, no bullet symbols. Use simple numbered lists and line breaks.

IMPORTANT: Base your analysis ONLY on what you see in the actual website content provided above. Do NOT make up features or describe pages that don't exist. If the website content is empty or minimal, say so honestly.

1. WEBSITE OVERVIEW
Brief assessment of their current site based on what you actually see — what it does well, what it's missing.

2. LEAD CAPTURE GAPS
Identify specific ways this business is losing potential customers: missing contact forms, no online booking, no follow-up system, no intake questionnaire, slow or outdated design, poor mobile experience, etc.

3. SMART FUNNEL OPPORTUNITY
Describe exactly what kind of automated lead capture system would work for this ${category} business:
- What type of intake quiz or calculator would attract their ideal customers
- How automated follow-up (text and email) would recover lost leads
- What an online booking system would do for their conversion rate

4. REVENUE IMPACT
Estimate how many leads they may be losing monthly without proper capture and follow-up. Be specific to their niche.

5. RECOMMENDATION
One clear next step — whether it's building a lead capture system, redesigning their site, or starting outreach.

Keep it professional, specific to their business, and written as if you are presenting this directly to the business owner. No generic advice. No mentions of any software platforms or tools.`);
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

CRITICAL RULES FOR BUSINESS NAME:
- The "Business Name" MUST be the ACTUAL NAME of the practice/business (e.g. "RU Flossing", "Kaminsky Wolf Dental", "Noble Dental Group")
- NEVER use the category or specialty as the business name (e.g. do NOT write "Cosmetic Dentistry", "Family Dentist", "General Dentistry")
- Extract the real business name from the URL, page title, or listing. For example: ruflossing.com → "RU Flossing", kaiserrosendental.com → "Kaiser Rosen Dental"
- If you cannot determine the actual business name, use the domain name formatted as a proper name

Format as a clean lead list with these columns for each business found:
- Business Name (the ACTUAL practice/company name, NOT the category)
- Phone (if found)
- Email (if found)  
- Website
- Address (full street address if found)
- Category (their specialty/niche, e.g. "Cosmetic Dentistry", "Family Dentist")
- Notes (anything notable about their web presence)

If phone/email not found, mark as "Research needed". Include 5-10 leads. End with a summary of the best prospects and why.`);

      // ── CRM Auto-Save: parse leads and insert into leads table ──
      try {
        const parsedLeads: Record<string, string>[] = [];

        // Strategy 1: Parse markdown table format (| col1 | col2 | ...)
        const tableRows = result.split("\n").filter((line) => line.trim().startsWith("|") && !line.includes("---"));
        if (tableRows.length >= 2) {
          const headerRow = tableRows[0];
          const headers = headerRow.split("|").map((h) => h.trim().toLowerCase()).filter(Boolean);
          for (let i = 1; i < tableRows.length; i++) {
            const cells = tableRows[i].split("|").map((c) => c.trim()).filter(Boolean);
            if (cells.length < 2) continue;
            const lead: Record<string, string> = {};
            headers.forEach((h, idx) => {
              const val = cells[idx] || "";
              if (/business\s*name/i.test(h)) lead.business_name = val;
              else if (/phone/i.test(h)) lead.phone = val;
              else if (/email/i.test(h)) lead.email = val;
              else if (/website/i.test(h)) lead.website = val;
              else if (/address/i.test(h)) lead.address = val;
              else if (/category/i.test(h)) lead.category = val;
              else if (/notes/i.test(h)) lead.notes = val;
            });
            if (lead.business_name && lead.business_name !== "Business Name") parsedLeads.push(lead);
          }
        }

        // Strategy 2: Fallback to key-value line parsing (- Business Name: ...)
        if (parsedLeads.length === 0) {
          const leadLines = result.split("\n");
          let currentLead: Record<string, string> = {};
          const flushLead = () => {
            if (currentLead.business_name) {
              parsedLeads.push({ ...currentLead });
              currentLead = {};
            }
          };
          for (const line of leadLines) {
            const t = line.trim();
            if (/^-?\s*\*?\*?Business Name\*?\*?[:\s]/i.test(t)) { flushLead(); currentLead.business_name = t.replace(/^-?\s*\*?\*?Business Name\*?\*?[:\s]*/i, "").trim(); }
            else if (/^-?\s*\*?\*?Phone\*?\*?[:\s]/i.test(t)) currentLead.phone = t.replace(/^-?\s*\*?\*?Phone\*?\*?[:\s]*/i, "").trim();
            else if (/^-?\s*\*?\*?Email\*?\*?[:\s]/i.test(t)) currentLead.email = t.replace(/^-?\s*\*?\*?Email\*?\*?[:\s]*/i, "").trim();
            else if (/^-?\s*\*?\*?Website\*?\*?[:\s]/i.test(t)) currentLead.website = t.replace(/^-?\s*\*?\*?Website\*?\*?[:\s]*/i, "").trim();
            else if (/^-?\s*\*?\*?Address\*?\*?[:\s]/i.test(t)) currentLead.address = t.replace(/^-?\s*\*?\*?Address\*?\*?[:\s]*/i, "").trim();
            else if (/^-?\s*\*?\*?Category\*?\*?[:\s]/i.test(t)) currentLead.category = t.replace(/^-?\s*\*?\*?Category\*?\*?[:\s]*/i, "").trim();
            else if (/^-?\s*\*?\*?Notes\*?\*?[:\s]/i.test(t)) currentLead.notes = t.replace(/^-?\s*\*?\*?Notes\*?\*?[:\s]*/i, "").trim();
          }
          flushLead();
        }

        if (parsedLeads.length > 0) {
          const clean = (v: string | undefined) => v && v !== "Research needed" && v !== "N/A" && v !== "—" && v !== "-" ? v : null;
          const leadsToInsert = parsedLeads.map((l) => ({
            user_id: userId,
            business_name: l.business_name || "",
            phone: clean(l.phone),
            email: clean(l.email),
            website: clean(l.website),
            address: clean(l.address),
            category: clean(l.category) || category || null,
            city: city || null,
            notes: clean(l.notes),
            pipeline_status: "scraped",
            source: "lead-prospector",
          }));
          await serviceSupabase.from("leads").insert(leadsToInsert);
          console.log(`[lead-prospector] Auto-saved ${leadsToInsert.length} leads to CRM`);
        } else {
          console.log("[lead-prospector] No leads parsed from result — skipping CRM save");
        }
      } catch (crmErr) {
        console.error("[lead-prospector] CRM auto-save error:", crmErr);
      }
    }

    else if (agent.slug === "website-proposal") {
      const url = input.url || "";
      const businessName = input.business_name || url;
      const scraped = await scrapeUrl(url);

      // Fetch booking URL for CTA
      let bookingUrl = "";
      const { data: bsProposal } = await serviceSupabase
        .from("booking_settings")
        .select("booking_slug")
        .eq("user_id", userId)
        .maybeSingle();
      if (bsProposal?.booking_slug) {
        bookingUrl = `\n\nBooking link for CTA: https://system-install-lab.lovable.app/book/${bsProposal.booking_slug}`;
      }

      result = await callAI(`You are a smart funnel sales expert. Analyze this business's current website and write a compelling proposal for building them a Smart Funnel — a high-converting, AI-powered lead capture and sales system built with Lovable.

Business: ${businessName}
Website: ${url}
Current site content:
${scraped}
${bookingUrl}

Write a professional Smart Funnel proposal including:
1. Current State Analysis (specific problems with their site — no lead capture, no booking system, no intake funnel, poor mobile experience, no follow-up automation)
2. What You'll Build — A SMART FUNNEL, not just a website. Include:
   - AI-powered intake questionnaire that qualifies leads automatically
   - Automated booking calendar integration
   - SMS/email follow-up sequences triggered by form submissions
   - Mobile-first, conversion-optimized landing pages
   - Lead scoring and pipeline dashboard
3. Business Impact (how many leads they're losing now, projected increase in conversions, time saved on manual follow-up)
4. Timeline (typically 3-5 days with Lovable)
5. Investment (suggest $1,500-$4,000 range based on complexity — this is a SYSTEM, not just a site)
6. Call to Action${bookingUrl ? " — include the booking link so they can schedule a strategy call" : ""}

IMPORTANT: Position this as a SMART FUNNEL system, NOT a website redesign. You're selling a lead generation machine, not a pretty website. Use their actual business context to show exactly how the funnel would work for their specific niche.`);
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

FACEBOOK (1 post):
- Conversational post (150-250 words) optimized for Facebook engagement — ask a question, share a win, or tell a short story about the build. Include a CTA to comment or DM. No hashtag spam.

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

    else if (agent.slug === "sms-outreach") {
      const leadName = input.contact_name || input.lead_name || "there";
      const phone = input.phone || "";
      const businessName = input.business_name || "";
      const pitchContext = input.pitch_context || input.notes || "";
      const auditSummary = input.audit_summary || "";
      const category = input.category || "";

      if (!phone) {
        return new Response(JSON.stringify({ error: "Phone number is required." }), { status: 400, headers: corsHeaders });
      }

      // Fetch booking URL for this specific user
      let bookingUrlSms = "";
      const { data: bsSms } = await serviceSupabase
        .from("booking_settings")
        .select("booking_slug")
        .eq("user_id", userId)
        .maybeSingle();
      if (bsSms?.booking_slug) {
        bookingUrlSms = `https://system-install-lab.lovable.app/book/${bsSms.booking_slug}`;
      }

      // Check if there's a recent audit for this lead
      let auditContext = auditSummary;
      if (!auditContext && input.lead_id) {
        const { data: recentAudit } = await serviceSupabase
          .from("agent_runs")
          .select("result_summary")
          .contains("input_payload", { lead_id: input.lead_id })
          .eq("status", "completed")
          .order("triggered_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (recentAudit?.result_summary) {
          auditContext = recentAudit.result_summary.slice(0, 500);
        }
      }

      // Generate the SMS copy
      const smsBody = await callAI(`You are a local business outreach specialist. You just ran a website audit for a business and want to reach out via text.

Lead name: ${leadName}
Business: ${businessName}
Category: ${category}
${auditContext ? `Audit findings (use 1-2 specific issues from this): ${auditContext.slice(0, 400)}` : "No audit available — mention you reviewed their online presence."}
${bookingUrlSms ? `Booking link: ${bookingUrlSms}` : ""}

Write ONE SMS message. Rules:
- Start with "Hey ${leadName}" (or "Hi ${leadName}")
- Reference that you just reviewed their website/online presence
- Mention 1 specific issue you found (missing booking, no lead capture, outdated design, etc.)
- ${bookingUrlSms ? `End with: "Want me to walk you through it? ${bookingUrlSms}"` : "End with a question like 'Mind if I send over what I found?'"}
- Keep it under 300 characters total
- Sound like a real person texting, not a bot
- No emojis, no ALL CAPS, no spam language
- Write in plain text only

Output ONLY the SMS text, nothing else.`);

      const trimmedSms = smsBody.trim().slice(0, 320);

      // Send via Twilio
      const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
      const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
      const fromNumber = Deno.env.get("TWILIO_PHONE_NUMBER");

      let smsStatus = "draft";
      let smsSid = "";

      if (accountSid && authToken && fromNumber) {
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
        const twilioAuth = btoa(`${accountSid}:${authToken}`);
        const twilioRes = await fetch(twilioUrl, {
          method: "POST",
          headers: {
            Authorization: `Basic ${twilioAuth}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({ To: phone, From: fromNumber, Body: trimmedSms }),
        });
        const twilioData = await twilioRes.json();
        if (twilioRes.ok) {
          smsStatus = "sent";
          smsSid = twilioData.sid || "";
        } else {
          smsStatus = "failed";
          console.error("[sms-outreach] Twilio error:", twilioData);
        }
      } else {
        smsStatus = "twilio_not_configured";
      }

      result = `SMS STATUS: ${smsStatus}\nTO: ${phone}\nSID: ${smsSid}\n\nMESSAGE SENT:\n${trimmedSms}`;
    }

    else if (agent.slug === "cold-call") {
      const leadName = input.contact_name || input.lead_name || "there";
      const phone = input.phone || "";
      const pitchContext = input.pitch_context || input.notes || "";

      if (!phone) {
        return new Response(JSON.stringify({ error: "Phone number is required." }), { status: 400, headers: corsHeaders });
      }

      const VAPI_API_KEY = Deno.env.get("VAPI_API_KEY");
      if (!VAPI_API_KEY) {
        return new Response(JSON.stringify({ error: "VAPI_API_KEY not configured" }), { status: 500, headers: corsHeaders });
      }

      // Fetch booking URL for call CTA
      let bookingUrlCall = "";
      const { data: bsCall } = await serviceSupabase
        .from("booking_settings")
        .select("booking_slug")
        .eq("user_id", userId)
        .maybeSingle();
      if (bsCall?.booking_slug) {
        bookingUrlCall = `https://system-install-lab.lovable.app/book/${bsCall.booking_slug}`;
      }

      const systemPrompt = `You are a smart funnel consultant making a warm outbound call to a small business owner about upgrading their lead generation.

Lead name: ${leadName}
Context: ${pitchContext}
${bookingUrlCall ? `Booking link to share: ${bookingUrlCall}` : ""}

Your goal:
1. Introduce yourself as a lead generation specialist who came across their business
2. Reference something specific from the context about their business
3. Explain that most small businesses lose leads because they don't have an automated funnel — no instant follow-up, no booking system, no lead capture
4. Pitch a "Smart Funnel" — a done-for-you system with a lead quiz, automated follow-up, and a booking calendar, built in under a week
5. Ask if they'd be open to a 10-minute screen share to see what's possible
6. If interested, ${bookingUrlCall ? "give them the booking link to schedule a call" : "confirm their email for a follow-up proposal"}

Be natural, not salesy. You're a professional offering genuine value, not a telemarketer. Keep it under 3 minutes.`;

      const firstMessage = `Hi, is this ${leadName}? Great — my name is Alex and I help local businesses capture more leads online with smart funnels. I came across your business and had a couple ideas. Do you have 2 minutes?`;

      const vapiPayload = {
        customer: { number: phone },
        assistant: {
          firstMessage,
          model: { provider: "openai", model: "gpt-4o", systemPrompt },
          voice: { provider: "11labs", voiceId: "sarah" },
          endCallMessage: "Thanks for your time. Have a great day!",
          endCallPhrases: ["goodbye", "take care", "bye bye", "talk later", "not interested"],
          maxDurationSeconds: 300,
        },
      };

      const vapiRes = await fetch("https://api.vapi.ai/call/phone", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${VAPI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(vapiPayload),
      });

      const vapiData = await vapiRes.json();

      if (!vapiRes.ok) {
        console.error("[cold-call] VAPI error:", vapiData);
        result = `CALL FAILED: ${vapiData?.message || "VAPI error"}\nSTATUS: ${vapiRes.status}`;
      } else {
        console.log(`[cold-call] Call initiated: ${vapiData.id} to ${phone}`);
        result = `CALL STATUS: initiated\nCALL ID: ${vapiData.id}\nTO: ${phone}\nLEAD: ${leadName}\nVAPI STATUS: ${vapiData.status || "queued"}\n\nThe AI call is now in progress. Results will be available in the VAPI dashboard.`;
      }
    }

    else if (agent.slug === "email-drip") {
      const leadName = input.contact_name || input.lead_name || "there";
      const leadEmail = input.email || input.lead_email || "";
      const businessName = input.business_name || "";
      const websiteUrl = input.website || input.url || "";
      const niche = input.category || input.niche || "";
      const senderName = input.sender_name || "Your Web Designer";
      const senderEmail = input.sender_email || "";
      const pitchContext = input.pitch_context || input.notes || "";

      if (!leadEmail) {
        return new Response(JSON.stringify({ error: "Lead email is required." }), { status: 400, headers: corsHeaders });
      }

      // Fetch booking URL
      let bookingUrl = "";
      const { data: bookingSettings } = await serviceSupabase
        .from("booking_settings")
        .select("booking_slug")
        .eq("user_id", userId)
        .maybeSingle();
      if (bookingSettings?.booking_slug) {
        bookingUrl = `Book a call: https://system-install-lab.lovable.app/book/${bookingSettings.booking_slug}`;
      }

      const emailPrompt = `You are an expert cold email copywriter for web designers.

Lead: ${leadName} at ${businessName}
Website: ${websiteUrl}
Niche: ${niche}
Pitch context: ${pitchContext}
Sender: ${senderName}
${bookingUrl ? `Booking link: ${bookingUrl}` : ""}

Write a 3-email drip sequence:

EMAIL 1 (Day 1 - Introduction):
Subject: [compelling subject line]
Body: [personalized intro referencing their business, one specific observation about their web presence, soft CTA]

EMAIL 2 (Day 3 - Value):
Subject: [value-focused subject line]
Body: [share a relevant stat or insight about their niche, position yourself as expert, medium CTA]

EMAIL 3 (Day 5 - Close):
Subject: [urgency subject line]
Body: [recap value, create urgency, strong CTA to book a call${bookingUrl ? " using the booking link" : ""}]

Rules:
- Each email under 150 words
- Personal, specific to their business
- No spam language
- Professional but warm tone
- Include the booking link in the CTA if available`;

      const emailContent = await callAI(emailPrompt);

      // Try to send Email 1 via Resend
      let sendStatus = "draft";
      const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
      if (RESEND_API_KEY && senderEmail) {
        try {
          // Extract first email subject and body
          const email1Match = emailContent.match(/EMAIL 1.*?Subject:\s*(.+?)[\n\r].*?Body:\s*([\s\S]*?)(?=EMAIL 2|$)/i);
          const subject = email1Match?.[1]?.trim() || `Quick question about ${businessName}`;
          const body = email1Match?.[2]?.trim() || emailContent.slice(0, 500);

          const resendRes = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              from: `${senderName} <onboarding@resend.dev>`,
              to: [leadEmail],
              subject,
              text: body,
            }),
          });
          sendStatus = resendRes.ok ? "sent" : "failed";
        } catch (e) {
          sendStatus = "failed";
          console.error("[email-drip] Resend error:", e);
        }
      } else {
        sendStatus = "resend_not_configured";
      }

      result = `EMAIL DRIP STATUS: ${sendStatus}\nTO: ${leadEmail}\n\n${emailContent}`;
    }

    else if (agent.slug === "cold-email-outreach") {
      const leadName = input.contact_name || input.lead_name || "there";
      const leadEmail = input.email || input.lead_email || "";
      const businessName = input.business_name || "";
      const websiteUrl = input.website || input.url || "";
      const niche = input.category || input.niche || "";
      const senderName = input.sender_name || "Your Smart Funnel Consultant";
      const senderEmail = input.sender_email || "";
      const pitchContext = input.pitch_context || input.notes || "";

      if (!leadEmail) {
        return new Response(JSON.stringify({ error: "Lead email is required." }), { status: 400, headers: corsHeaders });
      }

      // Fetch booking URL
      let bookingUrl = "";
      const { data: bookingSettingsCold } = await serviceSupabase
        .from("booking_settings")
        .select("booking_slug")
        .eq("user_id", userId)
        .maybeSingle();
      if (bookingSettingsCold?.booking_slug) {
        bookingUrl = `Book a call: https://system-install-lab.lovable.app/book/${bookingSettingsCold.booking_slug}`;
      }

      const emailContent = await callAI(`You are an expert cold outreach email copywriter for a smart funnel consultant who builds AI-powered lead generation systems for local businesses.

Lead: ${leadName} at ${businessName}
Website: ${websiteUrl}
Niche: ${niche}
Pitch context: ${pitchContext}
Sender: ${senderName}
${bookingUrl ? `Booking link: ${bookingUrl}` : ""}

Write ONE cold email (not a drip sequence). This should be:

Subject: [Compelling, personalized subject line — under 50 chars]

Body:
- Open with something specific about their business (reference their website, niche, or local area)
- Identify a specific lead capture gap (no booking system, no follow-up, no intake form, etc.)
- Pitch a Smart Funnel: an AI-powered lead capture system with automated follow-up, booking calendar, and lead scoring — built in under a week
- Keep it under 120 words
- End with a soft CTA — a question, not a hard sell
${bookingUrl ? "- Include the booking link naturally in the CTA" : ""}
- No spam language, no hype, no ALL CAPS
- Sound like a real person, not a template
- Write in plain text only — no markdown, no asterisks, no hashtags

Output the subject line and body clearly labeled. Plain text only.`);

      // Draft only — do NOT auto-send. User reviews in CRM drawer first.
      result = `COLD EMAIL DRAFT\nTO: ${leadEmail}\nSTATUS: ready_to_review\n\n${emailContent}`;
    }

    else if (agent.slug === "video-content") {
      const topic = input.topic || "web development project";
      const platform = input.platform || "All Platforms";
      const tone = input.tone || "Educational";

      result = await callAI(`You are a video content strategist specializing in tech/SaaS content creation.

Topic / What was built: ${topic}
Target platform: ${platform}
Tone: ${tone}

Generate a complete video content package:

📹 VIDEO SCRIPT (${platform === "TikTok" || platform === "Instagram Reels" ? "30-60 seconds" : "3-5 minutes"}):

HOOK (first 3 seconds):
[Attention-grabbing opening line — make them stop scrolling]

BODY:
[Scene-by-scene breakdown with timestamps, talking points, and visual directions. Match the ${tone} tone. Reference the specific build/topic.]

CTA (last 10 seconds):
[Clear call to action — follow, subscribe, link in bio, etc.]

---

🎨 THUMBNAIL TEXT (3 options):
1. [Bold, curiosity-driven text for thumbnail]
2. [Numbers/results focused]
3. [Question-based hook]

---

📝 TITLE & DESCRIPTION:
Title: [SEO-optimized, under 60 chars, includes power words]
Description: [150-200 words with relevant keywords, timestamps if YouTube, and CTA]

---

#️⃣ HASHTAGS & POSTING STRATEGY:
Hashtags: [10-15 relevant hashtags, mix of broad and niche]
Best posting time: [Recommendation based on platform]
Content series idea: [How to turn this into a recurring series]

Make everything specific to the topic provided. No generic filler.`);
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

    // Fetch updated lease to return next_run_at
    const { data: updatedLease } = await serviceSupabase
      .from("agent_leases")
      .select("schedule, next_run_at")
      .eq("id", lease_id)
      .maybeSingle();

    return new Response(JSON.stringify({
      success: true,
      result,
      run_id: run?.id,
      schedule: updatedLease?.schedule ?? null,
      next_run_at: updatedLease?.next_run_at ?? null,
    }), {
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
