export interface MagazinePage {
  pageNumber: number;
  chapter: string;
  title: string;
  subtitle?: string;
  image?: string;
  isCover?: boolean;
  sections: { heading?: string; body: string }[];
}

export const magazinePages: MagazinePage[] = [
  {
    pageNumber: 0,
    chapter: "PFSW",
    title: "The AI Marketing Playbook",
    isCover: true,
    sections: [],
  },
  {
    pageNumber: 1,
    chapter: "Introduction",
    title: "Why 99% of People Use AI Wrong",
    subtitle: "The difference between asking AI a question and engineering AI to run your business.",
    sections: [
      {
        body: "Every AI tool you use — ChatGPT, Claude, Cursor, Windsurf — runs on a system prompt. These are the invisible instructions that tell AI how to behave, what to refuse, and how to format responses. We collected the system prompts from 30+ AI tools, reverse-engineered the patterns, and turned them into plug-and-play marketing prompts you can copy today. This isn't theory. This is the operating system behind the most powerful AI tools in the world — translated into everyday business prompts.",
      },
      {
        heading: "The Hidden Layer",
        body: "Claude's actual system prompt reads: 'The assistant is Claude, created by Anthropic. Claude is intellectually curious. It enjoys hearing what humans think on an issue and engaging in discussion on a wide variety of topics.' It then enforces: 'Claude responds directly to all human messages without unnecessary affirmations or filler phrases like Certainly!, Of course!, Absolutely!, Great!, Sure!' — This single constraint is why Claude sounds more human than every other chatbot. When you understand how these instructions shape AI behavior, you stop being a user and start being an engineer.",
      },
      {
        heading: "What's Inside This Magazine",
        body: "Each chapter gives you two things: (1) Real excerpts from leaked system prompts showing HOW the best AI tools think, and (2) Copy-paste marketing prompts built on those same patterns — for cold outreach, copywriting, homepage audits, voice extraction, content creation, and lead generation. These prompts are sourced from open-source marketing skill repositories with 10,000+ stars on GitHub, battle-tested by real marketers and founders.",
      },
    ],
  },
  {
    pageNumber: 2,
    chapter: "Chapter I",
    title: "The Cold Email That Doesn't Sound Cold",
    subtitle: "How to write outreach that gets replies — using the same constraint-driven patterns the best AI tools use internally.",
    sections: [
      {
        heading: "🔓 The Pattern Behind It",
        body: "Claude's system prompt bans robotic language: 'Claude avoids using rote words or phrases or repeatedly saying things in the same or similar ways. It varies its language just as one would in a conversation.' Every production AI tool enforces anti-pattern rules. Your cold emails need the same discipline. Here's the framework that applies this pattern to outreach.",
      },
      {
        heading: "📋 The Cold Email Prompt",
        body: "Copy this prompt into any AI tool:\n\n'You are an expert cold email writer. Your goal is to write emails that sound like they came from a sharp, thoughtful human — not a sales machine following a template.\n\nWrite like a peer, not a vendor. The email should read like it came from someone who understands their world — not someone trying to sell. Use contractions. Read it aloud. If it sounds like marketing copy, rewrite it.\n\nEvery sentence must earn its place. Cold email is ruthlessly short. If a sentence doesn't move the reader toward replying, cut it.\n\nPersonalization must connect to the problem. If you remove the personalized opening and the email still makes sense, the personalization isn't working.\n\nLead with their world, not yours. \"You/your\" should dominate over \"I/we.\" Don't open with who you are or what your company does.\n\nOne ask, low friction. Interest-based CTAs (\"Worth exploring?\" / \"Would this be useful?\") beat meeting requests.\n\nNEVER use: \"I hope this email finds you well,\" \"My name is X and I work at Y,\" \"synergy,\" \"leverage,\" \"circle back,\" \"best-in-class,\" \"leading provider,\" \"just checking in.\"\n\nSubject lines: 2-4 words, lowercase, no punctuation tricks. Should look like it came from a colleague: \"reply rates,\" \"hiring ops,\" \"Q2 forecast.\"'",
      },
      {
        heading: "📐 The Frameworks That Work",
        body: "Use one of these structures depending on your situation:\n\n• Observation → Problem → Proof → Ask: 'You noticed X, which usually means Y challenge. We helped Z with that. Interested?'\n• Question → Value → Ask: 'Struggling with X? We do Y. Company Z saw [result]. Worth a look?'\n• Trigger → Insight → Ask: 'Congrats on X. That usually creates Y challenge. We've helped similar companies. Curious?'\n• Story → Bridge → Ask: '[Similar company] had [problem]. They [solved it this way]. Relevant to you?'\n\nCalibrate to the audience: C-suite gets ultra-brief, peer-level, understated. Mid-level gets more specific value. Technical gets precise, no fluff. Each follow-up must add something new — a different angle, fresh proof, a useful resource. Never 'just checking in.'",
      },
    ],
  },
  {
    pageNumber: 3,
    chapter: "Chapter II",
    title: "The Copywriting System",
    subtitle: "How production AI tools write — and the conversion copywriting prompt that applies the same principles to your business.",
    sections: [
      {
        heading: "🔓 How Cursor Writes Code (And What It Teaches About Copy)",
        body: "Cursor's 770-line system prompt says: 'It is EXTREMELY important that your generated code can be run immediately by the USER.' It forces precision through search-first behavior, defining a 'codebase_search' tool with instructions: 'Start with exploratory queries — semantic search is powerful and often finds relevant context in one go.' The principle: research before you write. The best copy starts with understanding, not creativity.",
      },
      {
        heading: "📋 The Conversion Copywriting Prompt",
        body: "Copy this prompt into any AI tool:\n\n'You are an expert conversion copywriter. Your goal is to write marketing copy that is clear, compelling, and drives action.\n\nBefore writing, answer these questions:\n1. What type of page? (homepage, landing page, pricing, feature, about)\n2. What is the ONE primary action you want visitors to take?\n3. Who is the ideal customer and what problem are they solving?\n4. What makes this different from alternatives?\n5. What proof points exist? (numbers, testimonials, case studies)\n\nCopywriting Rules:\n• Clarity over cleverness — if you choose between clear and creative, choose clear\n• Benefits over features — Features: what it does. Benefits: what that means for the customer\n• Specificity over vagueness — Not \"Save time on your workflow\" but \"Cut weekly reporting from 4 hours to 15 minutes\"\n• Customer language over company language — mirror voice-of-customer from reviews and support tickets\n• Simple over complex — \"Use\" not \"utilize,\" \"help\" not \"facilitate\"\n• Active over passive — \"We generate reports\" not \"Reports are generated\"\n• Confident over qualified — remove \"almost,\" \"very,\" \"really\"\n• Honest over sensational — never fabricate statistics or testimonials'",
      },
      {
        heading: "📐 Headline Formulas That Convert",
        body: "These formulas work across every niche:\n\n• '{Achieve outcome} without {pain point}'\n• 'The {category} for {audience}'\n• 'Never {unpleasant event} again'\n• '{Question highlighting main pain point}'\n\nStrong CTAs follow this formula: [Action Verb] + [What They Get] + [Qualifier]\n\nExamples: 'Start My Free Trial,' 'Get the Complete Checklist,' 'See Pricing for My Team.'\n\nWeak CTAs to NEVER use: Submit, Sign Up, Learn More, Click Here, Get Started.\n\nThe best copy uses rhetorical questions to engage: 'Hate returning stuff to Amazon?' 'Tired of chasing approvals?' — Questions make readers think about their own situation.",
      },
    ],
  },
  {
    pageNumber: 4,
    chapter: "Chapter III",
    title: "The Homepage Audit",
    subtitle: "Score any landing page in 5 minutes using the same systematic approach that production AI tools use to evaluate code.",
    sections: [
      {
        heading: "🔓 How Claude Thinks Systematically",
        body: "Claude's system prompt instructs: 'When presented with a math problem, logic problem, or other problem benefiting from systematic thinking, Claude thinks through it step by step before giving its final answer.' And: 'Claude provides thorough responses to more complex and open-ended questions, but concise responses to simpler questions.' This step-by-step, calibrated approach is exactly how you should audit a homepage — systematic scoring, not gut feelings.",
      },
      {
        heading: "📋 The Homepage Audit Prompt",
        body: "Copy this prompt into any AI tool (paste the URL or screenshot after):\n\n'You are a conversion expert. Audit this homepage with systematic scoring, then produce an impact-prioritized action plan with concrete rewrites.\n\nClassify the page type first:\n• SaaS: Headline must explain the outcome, not the feature. Social proof priority: trial numbers, G2 ratings, logos. CTA priority: Free trial > Demo > Learn More.\n• Service Business: Headline must answer \"what do you do and for whom.\" Social proof priority: client results, named testimonials. CTA priority: Book call > Get proposal.\n• E-commerce: Headline must communicate core value proposition. Social proof priority: reviews, ratings, UGC. CTA priority: Shop > Browse collection.\n\nScore these 8 dimensions (1-10 each):\n1. Headline clarity — does it explain the value in under 8 words?\n2. Subheadline specificity — does it add detail, not fluff?\n3. CTA strength — is it action-oriented and specific?\n4. Social proof quality — real names, numbers, logos?\n5. Above-the-fold completeness — can you understand the offer without scrolling?\n6. Objection handling — are common concerns addressed?\n7. Visual hierarchy — does the eye flow naturally?\n8. Mobile experience — does it work on a phone?\n\nFor each score below 7, provide a specific rewrite.'",
      },
      {
        heading: "🎯 Quick Wins That Move the Needle",
        body: "After auditing 1,000+ pages, these are the patterns that appear in 80% of underperforming sites:\n\n• Feature-led headlines instead of outcome-led ('AI-Powered Analytics Platform' vs 'Know exactly which customers will churn — before they do')\n• Generic CTAs that don't tell you what happens next ('Get Started' vs 'Start Your Free 14-Day Trial')\n• Missing social proof above the fold — logos, numbers, or testimonials should be visible without scrolling\n• Too many CTAs competing for attention — one primary action per page\n• No clear answer to 'Who is this for?' in the first 3 seconds\n\nFix these five things before touching anything else. They account for 60-80% of conversion improvements on most sites.",
      },
    ],
  },
  {
    pageNumber: 5,
    chapter: "Chapter IV",
    title: "The Voice Extractor",
    subtitle: "How to capture your authentic writing voice so AI stops sounding like AI.",
    sections: [
      {
        heading: "🔓 Why Claude Sounds Different",
        body: "Claude's prompt includes personality instructions most people never see: 'Claude is intellectually curious. It enjoys hearing what humans think on an issue and engaging in discussion on a wide variety of topics.' And critically: 'Claude avoids peppering the human with questions and tries to only ask the single most relevant follow-up question. Claude doesn't always end its responses with a question.' These constraints alone make Claude feel more natural than GPT. The same principle applies to your content — constraint-driven voice is more authentic than generic output.",
      },
      {
        heading: "📋 The Voice Extraction Prompt",
        body: "Copy this prompt into any AI tool (paste 3+ writing samples after):\n\n'AI-generated content all sounds the same. The fix isn't better prompts — it's teaching the AI how you actually communicate.\n\nExtract my communication DNA from these writing samples and produce a Voice Guide.\n\nSample priority (most to least authentic):\n1. Casual Slack or email messages (raw, unedited voice)\n2. Podcast or call transcripts\n3. LinkedIn posts or articles\n4. Website copy (often edited, less authentic)\n\nAnalyze these dimensions:\n• Sentence length patterns — do they favor short punchy sentences or flowing compound ones?\n• Vocabulary fingerprint — what words do they overuse? What words do they never use?\n• Punctuation habits — em dashes, ellipses, parentheses, semicolons?\n• Rhetorical devices — do they use analogies, rhetorical questions, lists, stories?\n• Emotional register — matter-of-fact, passionate, irreverent, understated?\n• Opening patterns — how do they start paragraphs and messages?\n• Closing patterns — how do they end?\n\nOutput a Voice Guide with: (1) 5 rules for writing in this voice, (2) 5 phrases they would use, (3) 5 phrases they would NEVER use, (4) a \"sounds like / doesn't sound like\" comparison.'",
      },
      {
        heading: "🎯 Using Your Voice Guide",
        body: "Once you have your Voice Guide, prepend it to every AI prompt you use. Example: 'Using the following Voice Guide, write a LinkedIn post about [topic].' This single step eliminates 90% of 'AI voice' from your content.\n\nPro tip: The best voice samples are your messiest writing — Slack messages, quick emails, voice-to-text transcriptions. The more casual and unedited, the more authentic the patterns. Website copy is the worst source because it's already been edited by someone else.\n\nUpdate your Voice Guide every 3 months. Your voice evolves — your AI should evolve with it.",
      },
    ],
  },
  {
    pageNumber: 6,
    chapter: "Chapter V",
    title: "The Cold Outreach Sequence",
    subtitle: "A complete 21-day prospecting system — research, connect, follow up, convert.",
    sections: [
      {
        heading: "🔓 Windsurf's Memory Pattern Applied to Sales",
        body: "Windsurf's Cascade prompt reveals: 'You have access to a persistent memory database to record important context about the USER's task, codebase, requests, and preferences for future reference. As soon as you encounter important information, proactively save it. You DO NOT need USER permission to create a memory.' This is exactly how your outreach should work — research signals saved and referenced across every touchpoint. The AI remembers. Your outreach should too.",
      },
      {
        heading: "📋 The Full Outreach Sequence Prompt",
        body: "Copy this prompt to generate a complete sequence for any prospect:\n\n'Build a personalized cold outreach sequence for [PROSPECT NAME] at [COMPANY].\n\nPhase 1 — Research: Search for recent news (funding, launches, hires, press), LinkedIn activity, and company stage. Assign a personalization tier:\n• Tier 1 (named signal found): Fully custom, reference signal in every message\n• Tier 2 (company info + role context): Template + personalized opener\n• Tier 3 (no signals found): Volume template, minimal customization\n\nPhase 2 — Generate the sequence:\n\nConnection Request (LinkedIn, 300 chars max): [Specific observation from research] + [Simple reason to connect]. No pitching. Prove you did research.\n\nFirst Message (24-48 hours after accept): Thanks + Bridge to relevance + Light value + Soft question. Example: \"Thanks for connecting. I work with [ICP] on [outcome]. Curious — is [function] something you own directly at [Company], or is that still founder-led?\"\n\nFollow-Up #1 (Day 7): Light nudge + New signal or angle + Easy out. NEVER write \"following up\" with nothing new. Add a relevant article, trend, or insight.\n\nFollow-Up #2 (Day 14): Shift to email. Subject: \"[Company]'s [function] as you scale.\" 1-line hook + 2-3 sentences why + soft CTA.\n\nBreak-Up (Day 21): \"I'll assume timing isn't right. If [pain point] becomes a priority, happy to reconnect. Best of luck with [specific thing they're working on].\" Add to 6-month re-engagement list.'",
      },
      {
        heading: "📐 Self-Critique Checklist",
        body: "After generating any outreach sequence, run this quality check:\n\n• Does every message reference the specific signal from research, or are they generic?\n• Is the connection request under 300 characters?\n• Does the first message ask a question (invite dialogue) rather than pitch?\n• Does follow-up #1 add something genuinely new?\n• Does the break-up message reference something specific about their situation?\n• Would YOU reply to this if you received it?\n• Does it sound like a template with fields swapped in? If yes, rewrite.\n• Does it sound like AI wrote it? Check for: 'I hope this finds you well,' 'I came across your profile,' 'leverage,' 'synergy.' If any appear, rewrite.",
      },
    ],
  },
  {
    pageNumber: 7,
    chapter: "Chapter VI",
    title: "The Content Engine",
    subtitle: "LinkedIn authority, content ideas, and social posts — all from one positioning foundation.",
    sections: [
      {
        heading: "🔓 v0's Component Architecture Applied to Content",
        body: "v0's 1,000+ line prompt reveals a component-first architecture: 'Use the Code Project block to group files and render React apps.' It enforces: 'You should only write the parts of the file that need to be changed. The more you write duplicate code, the longer the user has to wait.' The same principle applies to content: build a positioning foundation once, then generate infinite variations from it. One positioning doc → LinkedIn posts, email sequences, social cards, case studies, ad copy.",
      },
      {
        heading: "📋 The LinkedIn Authority Builder Prompt",
        body: "Copy this to build your content system:\n\n'You are building a LinkedIn content system for thought leadership. Start with positioning:\n\n1. Who do you serve? (specific role + company stage)\n2. What transformation do you deliver?\n3. What's your unique mechanism or framework?\n4. What credentials or proof points back this up?\n\nFrom this positioning, generate:\n\n• 3 Content Pillars — broad themes you'll own (e.g., \"AI automation for agencies,\" \"Systems over hustle,\" \"Prompt engineering\")\n• For each pillar, 5 post ideas using these formats:\n  - Contrarian take: \"Everyone says X. Here's why Y.\"\n  - Behind-the-scenes: \"Here's exactly how we [achieved result].\"\n  - Framework: \"The 3-step system for [outcome].\"\n  - Story: \"A client came to us with [problem]. Here's what happened.\"\n  - Data: \"We analyzed [X]. Here's what we found.\"\n\n• Posting rhythm: 3-5x/week. Mix formats. Never post the same format twice in a row.\n• Hook formula: First line must stop the scroll. Use: numbers, contrarian claims, or specific outcomes.'",
      },
      {
        heading: "📋 The Social Card Generator Prompt",
        body: "Turn any piece of content into platform-specific posts:\n\n'Take this source content and generate platform-specific social post variants:\n\nFor LinkedIn:\n• Open with a hook line (pattern interrupt or bold claim)\n• 3-5 short paragraphs with line breaks between each\n• End with a question to drive comments\n• No hashtags in the body — add 3-5 at the end if needed\n\nFor X/Twitter:\n• Single tweet version (under 280 characters, punchy)\n• Thread version (5-7 tweets, each standalone, first tweet is the hook)\n• No hashtags unless directly relevant\n\nFor Email Newsletter:\n• Subject line (under 50 characters, curiosity-driven)\n• Opening hook (1-2 sentences)\n• 3 key points with brief commentary\n• Single CTA at the end\n\nRule: Each platform version must feel native to that platform, not like a cross-post. Rewrite, don't resize.'",
      },
    ],
  },
  {
    pageNumber: 8,
    chapter: "Chapter VII",
    title: "7 Prompt Patterns That Print Money",
    subtitle: "Extracted from 30+ leaked system prompts and 380+ community skills — the patterns every marketer needs.",
    sections: [
      {
        heading: "Patterns 1–3: Foundation",
        body: "1. CONSTRAINT-HEAVY PROMPTING — Claude has 2-3x more 'never do X' statements than 'do Y' statements. Cursor says: 'NEVER output code to the USER, unless requested.' Windsurf says: 'NEVER make redundant tool calls.' For every marketing prompt you write, your 'NEVER DO THIS' section should be twice as long as your 'DO THIS' section. Example: 'NEVER use: synergy, leverage, circle back, best-in-class, just checking in.'\n\n2. RESEARCH BEFORE WRITE — Cursor forces: 'Start with exploratory queries. Begin broad if you're not sure where relevant code is.' Every cold email, every piece of copy, every audit should start with research. The prompt should force the AI to gather context before generating output.\n\n3. ANTI-PATTERN LIBRARIES — Claude explicitly bans filler phrases. Cursor bans outputting code directly. v0 bans rewriting entire files. Build a banned-word list for every prompt you create. When the model knows what failure looks like, it avoids it.",
      },
      {
        heading: "Patterns 4–5: Execution",
        body: "4. CONTEXT LOADING GATES — Every production marketing skill starts with gates: 'Do not begin the audit without one of these: A live URL, a screenshot, or copy/paste of headline and CTA.' Gates prevent the AI from generating garbage based on assumptions. Add gates to every prompt: 'Before writing, confirm you have: [list of required inputs]. If any are missing, ask for them.'\n\n5. SELF-CRITIQUE LOOPS — The best prompts include built-in quality checks. After generating a cold email sequence: 'Evaluate: Does every message reference the specific signal from research? Does the first message ask a question rather than pitch? Flag any issue and revise.' Cursor does this: 'If you've introduced linter errors, fix them. DO NOT loop more than 3 times.' Build retry logic with escape hatches into every prompt.",
      },
      {
        heading: "Patterns 6–7: Scale",
        body: "6. VOICE CONSISTENCY — Claude's prompt says: 'Claude avoids using rote words or phrases or repeatedly saying things in the same or similar ways.' Every brand needs a voice guide that the AI references before generating content. Extract your voice once, reference it everywhere. This single step eliminates the 'AI slop' problem.\n\n7. TIERED PERSONALIZATION — The cold outreach skill uses three tiers: Tier 1 (named signal, fully custom), Tier 2 (company info, template + personal opener), Tier 3 (no signals, volume template). This pattern works for every marketing activity. Content personalization, email sequences, ad copy — assign a tier based on available data, then match effort to impact. Don't over-personalize Tier 3 prospects. Don't under-personalize Tier 1.",
      },
    ],
  },
  {
    pageNumber: 9,
    chapter: "Chapter VIII",
    title: "The Positioning & Research Stack",
    subtitle: "Market research, competitor analysis, and positioning — the foundation every other prompt builds on.",
    sections: [
      {
        heading: "📋 The Positioning Prompt",
        body: "This is the foundation prompt. Run it FIRST, save the output, and reference it in every other prompt:\n\n'Help me define my positioning. Answer these questions:\n\n1. What do you do? (One sentence. No jargon.)\n2. Who is it for? (Specific role + company stage + pain level)\n3. What problem do you solve? (The pain they feel, in their words)\n4. What makes you different? (Your unique mechanism — not features, but approach)\n5. What proof do you have? (Numbers, case studies, testimonials)\n6. What's the transformation? (Before state → After state)\n\nFrom these answers, generate:\n• A one-line positioning statement: \"[Product] helps [audience] [achieve outcome] by [unique mechanism]\"\n• A 3-second elevator pitch\n• A 30-second elevator pitch\n• The top 3 objections and how to handle each\n• The words your ideal customer uses to describe their problem (voice-of-customer language)\n\nSave this as your Product Marketing Context. Reference it before running any other marketing prompt.'",
      },
      {
        heading: "📋 The 30-Day Research Prompt",
        body: "Use this to understand what your market is saying RIGHT NOW:\n\n'Research [TOPIC/INDUSTRY] across Reddit, X, and web content from the last 30 days. Find:\n\n1. Top 5 pain points people are complaining about\n2. Top 3 solutions people are recommending to each other\n3. Top 3 trends or shifts in the conversation\n4. Common language and phrases people use (exact quotes)\n5. Questions that keep getting asked with no good answer\n6. Competitors being mentioned (positively and negatively)\n\nFor each finding, include the source and a direct quote. Organize by: Validated Pain Points, Emerging Opportunities, Content Gaps (questions with no good answer), and Competitive Intelligence.\n\nOutput an actionable brief I can use to inform my content, outreach, and positioning.'",
      },
      {
        heading: "📋 The AI Discoverability Audit Prompt",
        body: "Most marketers optimize for Google. Smart marketers optimize for AI search too:\n\n'Audit how [BRAND/COMPANY] appears in AI-powered search and recommendation systems (ChatGPT, Perplexity, Claude, Gemini).\n\nTest these queries:\n1. \"Best [category] tools for [use case]\"\n2. \"[Brand name] vs [competitor]\"\n3. \"What is [brand name]?\"\n4. \"[Problem statement] solution\"\n\nFor each query, document:\n• Does the brand appear in the AI response?\n• How is it described? (Accurate? Outdated? Missing key features?)\n• What competitors appear alongside it?\n• What sources is the AI citing?\n\nThen provide:\n• Current AI visibility score (1-10)\n• Top 3 actions to improve AI discoverability\n• Content gaps that AI tools can't find answers for\n• Structured data and schema recommendations'",
      },
    ],
  },
  {
    pageNumber: 10,
    chapter: "Chapter IX",
    title: "From Reader to Builder",
    subtitle: "You've seen the prompts. Now it's time to deploy them.",
    sections: [
      {
        heading: "The Prompt Stack",
        body: "Here's the order to deploy these prompts for maximum impact:\n\n1. Run the Positioning Prompt (Chapter VIII) — this is your foundation\n2. Run the Voice Extractor (Chapter IV) — capture your authentic voice\n3. Run the Homepage Audit (Chapter III) — find your biggest conversion leaks\n4. Set up the Cold Outreach Sequence (Chapter V) — start prospecting with research-backed personalization\n5. Build the Content Engine (Chapter VI) — create your LinkedIn authority system\n6. Run the 30-Day Research Prompt monthly — stay current with market shifts\n\nEach prompt references your positioning foundation. Build once, generate everywhere. This is the 'component architecture' pattern from v0 and Cursor — modular, reusable, infinitely scalable.",
      },
      {
        heading: "What PFSW Members Get",
        body: "This magazine gave you the prompts. PFSW gives you the system — pre-built workflows that chain these prompts together with automated execution. Instead of manually running each prompt, PFSW workflows: prospect leads automatically using the research + outreach sequence, audit websites and generate personalized proposals, extract voice and generate content calendars, and track every touchpoint in your CRM. The prompts are the building blocks. The workflows are the machine.",
      },
      {
        heading: "Your Next Step",
        body: "Take the 2-minute assessment below to see where your business stands and how PFSW can accelerate your build. Every prompt in this magazine is available to PFSW members as an automated workflow — no manual copy-paste required.",
      },
    ],
  },
];
