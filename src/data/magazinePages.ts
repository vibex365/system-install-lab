export interface MagazinePage {
  pageNumber: number;
  chapter: string;
  title: string;
  subtitle?: string;
  sections: { heading?: string; body: string }[];
}

export const magazinePages: MagazinePage[] = [
  {
    pageNumber: 1,
    chapter: "Prologue",
    title: "People Fail. Systems Won't.",
    subtitle: "The founding thesis of PFSW.",
    sections: [
      {
        body: "Every builder who has ever failed didn't fail because of a lack of talent. They failed because they relied on motivation instead of systems. Motivation decays. Willpower depletes. Enthusiasm fades after the first week. But a system — a structured, repeatable, accountable operating rhythm — doesn't care how you feel. It runs regardless."
      },
      {
        body: "PFSW exists because we watched thousands of talented builders stall. Not because they lacked ideas, but because they lacked architecture. They had the vision but no blueprint. They had the ambition but no cadence. They had the tools but no protocol for using them."
      },
      {
        body: "This magazine is your orientation manual. It will walk you through every component of the system — what it does, why it exists, and how it produces results that motivation never could. By the end, you won't just understand PFSW. You'll understand why everything else you've tried hasn't worked."
      },
    ],
  },
  {
    pageNumber: 2,
    chapter: "Chapter I — The Problem",
    title: "Why Talented Builders Fail",
    subtitle: "The execution gap nobody talks about.",
    sections: [
      {
        heading: "The Myth of the Solo Genius",
        body: "The tech industry glorifies the solo founder — the lone genius who built an empire from a garage. It's a myth. Behind every shipped product is a system: deadlines, accountability partners, structured workflows, and relentless iteration cycles. Solo founders who actually ship have internalized systems. The rest just have ideas."
      },
      {
        heading: "The Three Failure Patterns",
        body: "After analyzing hundreds of failed builder journeys, we identified three universal failure patterns: (1) The Infinite Planner — always researching, never building. (2) The Scattered Executor — starts everything, finishes nothing. (3) The Isolated Grinder — works hard in silence, never gets feedback, ships into a void. All three share one root cause: no operating system."
      },
      {
        heading: "The Cost of Unstructured Ambition",
        body: "Every month you operate without structure, you lose compounding potential. A builder who ships one structured module per week has 52 production assets at year-end. A builder who 'works on stuff' has a graveyard of half-finished projects. The difference isn't effort. It's architecture."
      },
    ],
  },
  {
    pageNumber: 3,
    chapter: "Chapter II — The Solution",
    title: "An Institution, Not a Community",
    subtitle: "Why we built something different.",
    sections: [
      {
        heading: "Communities vs. Institutions",
        body: "Communities are optional. You show up when you feel like it. You lurk. You consume. You leave. Institutions have requirements. They have standards. They have consequences. PFSW is modeled after the institutions that actually produce results — military academies, residency programs, architecture firms. You don't casually attend. You operate within the structure or you don't operate at all."
      },
      {
        heading: "Why Structure Produces Freedom",
        body: "Most builders resist structure because they believe it limits creativity. The opposite is true. When your operating rhythm is solved — when you know exactly what to build, when to build it, and who will hold you accountable — your creative energy is liberated. You stop spending willpower on logistics and start spending it on execution."
      },
      {
        heading: "The PFSW Operating Contract",
        body: "When you join PFSW, you're entering an operating contract. You commit to weekly sessions. You commit to structured output. You commit to the protocol. In exchange, we commit to providing the architecture, the tools, the accountability, and the cadence that makes your execution inevitable."
      },
    ],
  },
  {
    pageNumber: 4,
    chapter: "Chapter III — The Application",
    title: "Why We Filter at the Gate",
    subtitle: "The $5 that separates intent from interest.",
    sections: [
      {
        heading: "Friction Is a Feature",
        body: "The application process exists to create deliberate friction. Most platforms remove all barriers to entry because more users means more revenue. We do the opposite. More friction means higher quality. The application asks hard questions about your execution bottlenecks, your failed projects, your psychological patterns. If you can't articulate where you're stuck, we can't help you get unstuck."
      },
      {
        heading: "The $5 Signal",
        body: "Five dollars is not revenue. It generates roughly enough to cover payment processing. The $5 exists as a psychological filter. It separates the person who is browsing from the person who is deciding. It separates 'I might try this' from 'I'm investing in this.' Every application costs our team time to review. The $5 ensures that time is spent on serious operators."
      },
      {
        heading: "What We Look For",
        body: "We're not looking for credentials, followers, or revenue numbers. We're looking for three signals: (1) Self-awareness — can you clearly identify your bottleneck? (2) Honesty — can you admit what's not working? (3) Intent — are you ready to operate within a structure you don't control? These three signals predict success inside the institution better than any resume."
      },
    ],
  },
  {
    pageNumber: 5,
    chapter: "Chapter IV — Membership Economics",
    title: "Why $197/Month Is the Price",
    subtitle: "The economics of commitment and infrastructure.",
    sections: [
      {
        heading: "Not Cheap Enough to Ignore",
        body: "$197/month is calibrated precisely. It's not $29 — cheap enough to forget you're paying. It's not $997 — expensive enough to create financial anxiety. At $197, you feel the commitment every month. That feeling is the point. It creates a productive tension that drives you to extract value. Members who pay $197 show up. Members on free trials don't."
      },
      {
        heading: "What the $197 Funds",
        body: "Your membership funds the entire operating infrastructure: the Prompt Engine with AI-powered generation, the curated library maintained by the team, weekly cohort sessions facilitated by certified Architect Leads, the moderation pipeline for member submissions, session memory and context persistence, and the continuous development of the platform itself."
      },
      {
        heading: "The ROI Framework",
        body: "One well-structured prompt can save 40+ hours of development time. One weekly cohort session can unblock a problem you've been stuck on for months. One month of structured execution can produce more output than six months of unstructured grinding. At $197/month, the ROI is not theoretical. It's mathematical."
      },
    ],
  },
  {
    pageNumber: 6,
    chapter: "Chapter V — The Prompt Engine",
    title: "Your AI Architecture Studio",
    subtitle: "Not a chatbot. A structured generation system.",
    sections: [
      {
        heading: "Beyond Chat Interfaces",
        body: "The Prompt Engine is fundamentally different from ChatGPT, Claude, or any other chat interface. Those tools are conversational. The Engine is architectural. It doesn't generate responses — it generates structured blueprints following a defined schema. Every output includes: Objective, Stack, Routes, Schema, RLS Policies, Flows, UI Specifications, Integrations, Acceptance Criteria, and Build Order."
      },
      {
        heading: "Context Persistence",
        body: "Most AI tools forget you exist between sessions. The Prompt Engine doesn't. It maintains session memory — your project context, your stack preferences, your architectural patterns, your iteration history. Every generation builds on the last. This means your prompts compound. Session 10 is exponentially more powerful than Session 1 because the Engine understands your entire project topology."
      },
      {
        heading: "The Generation Pipeline",
        body: "When you generate a prompt, it passes through a structured pipeline: (1) Context Injection — your saved project data is loaded. (2) Schema Enforcement — the output is constrained to the OpenClaw format. (3) AI Generation — the model produces a structured blueprint. (4) Token Tracking — every generation is logged for your records. This is not magic. It's engineering."
      },
    ],
  },
  {
    pageNumber: 7,
    chapter: "Chapter VI — OpenClaw Standard",
    title: "The Universal Prompt Format",
    subtitle: "Standardization is what separates amateurs from architects.",
    sections: [
      {
        heading: "Why Format Matters",
        body: "An unstructured prompt is a wish. A structured prompt is an instruction. The OpenClaw standard defines exactly how a build prompt should be formatted so that any AI-powered development platform can consume it without ambiguity. Think of it like an architectural blueprint — it doesn't matter which construction crew reads it, the building gets built the same way."
      },
      {
        heading: "The OpenClaw Schema",
        body: "Every OpenClaw prompt contains these mandatory sections: Project Objective (what you're building and why), Technology Stack (exact tools and versions), Route Architecture (every page and API endpoint), Database Schema (tables, columns, types, relationships), Row-Level Security (who can access what data), Application Flows (step-by-step user journeys), UI Specifications (layout, components, responsive breakpoints), External Integrations (APIs, webhooks, third-party services), Acceptance Criteria (how you know it's done), and Build Order (what to build first, second, third)."
      },
      {
        heading: "Portable and Executable",
        body: "OpenClaw prompts are not documentation that sits in a Google Doc. They are executable instructions designed to be pasted directly into AI development tools. The format is platform-agnostic — it works with Lovable, Cursor, Bolt, or any other AI-powered builder. Your architecture travels with you."
      },
    ],
  },
  {
    pageNumber: 8,
    chapter: "Chapter VII — The Library",
    title: "Battle-Tested Blueprints",
    subtitle: "Don't start from zero. Start from proven.",
    sections: [
      {
        heading: "Curated, Not Crowdsourced",
        body: "The prompt library is not a marketplace where anyone can dump their work. Every prompt in the library has been reviewed, tested, and approved by the architecture team. They follow the OpenClaw standard. They have been validated against real builds. They represent institutional knowledge — not individual opinions."
      },
      {
        heading: "Package Architecture",
        body: "Prompts are organized into packages — collections grouped by vertical or use case. MVP Launch Package. SaaS Foundation Package. E-Commerce Build Package. Agency Site Package. Internal Tools Package. Each package contains multiple prompts that work together as a cohesive system. You don't grab random prompts — you deploy coordinated architectural packages."
      },
      {
        heading: "Living Documentation",
        body: "The library is not static. It evolves. When platforms update their capabilities, prompts are revised. When new architectural patterns emerge, new packages are created. When members submit exceptional work through the submission pipeline, it enters the library after review. The library is a living, breathing repository of institutional execution knowledge."
      },
    ],
  },
  {
    pageNumber: 9,
    chapter: "Chapter VIII — Weekly Cohorts",
    title: "The Operating Rhythm",
    subtitle: "Execution is not optional. Neither is attendance.",
    sections: [
      {
        heading: "Why Weekly, Not Daily or Monthly",
        body: "Daily is too frequent for deep work cycles — you need time to execute between sessions. Monthly is too infrequent — you lose momentum and accountability dissolves. Weekly is the optimal cadence for builders. It gives you enough time to ship meaningful work between sessions while maintaining enough pressure to prevent drift. The weekly rhythm is not arbitrary. It's engineered."
      },
      {
        heading: "The Session Protocol",
        body: "Every cohort session follows the exact same protocol. No variation. No 'let's try something different this week.' The protocol: Roll Call (10 minutes) — every member states what they shipped since last session. Hot Seats (60 minutes) — members present blockers, receive structured feedback. Commitments (20 minutes) — every member declares what they will ship before next session. This is the protocol. It does not change."
      },
      {
        heading: "The Power of Public Commitment",
        body: "When you declare your commitment out loud to your cohort, something shifts neurologically. It's no longer a private intention — it's a public contract. Your cohort heard you. Your Architect Lead recorded it. Next week, you'll be asked to report on it. This public commitment mechanism is one of the most powerful forcing functions in behavioral science. We deploy it every single week."
      },
    ],
  },
  {
    pageNumber: 10,
    chapter: "Chapter IX — Attendance Policy",
    title: "Why Missing Sessions Has Consequences",
    subtitle: "Accountability without enforcement is theater.",
    sections: [
      {
        heading: "The Attendance Architecture",
        body: "Attendance is tracked automatically. Every session, every member, every week. This isn't surveillance — it's infrastructure. When you show up consistently, your attendance record reflects it. When you don't, the system notices before any human needs to intervene. The system tracks consecutive misses because patterns matter more than individual incidents."
      },
      {
        heading: "The Escalation Ladder",
        body: "One missed session — noted, no action. Two consecutive missed sessions — automated warning. Your Architect Lead reaches out. Three consecutive missed sessions — review initiated. Your membership is evaluated. This isn't punitive. It's protective. Every empty seat in a cohort weakens the accountability dynamic for every other member. Your absence doesn't just affect you — it affects your cohort."
      },
      {
        heading: "Why This Makes Us Different",
        body: "Name one other platform that will revoke your membership for not showing up. You can't. Because every other platform optimizes for retention metrics, not results. We optimize for execution density. A smaller group of members who all show up and ship produces more value than a large group where half are lurking. We choose density over volume. Every time."
      },
    ],
  },
  {
    pageNumber: 11,
    chapter: "Chapter X — Architect Leads",
    title: "The Leadership Layer",
    subtitle: "Certified operators who run the protocol.",
    sections: [
      {
        heading: "Selection, Not Application",
        body: "You cannot apply to become an Architect Lead. You are selected. The Chief Architect identifies members who demonstrate three qualities: (1) Consistent execution — they ship every week, without exception. (2) Protocol adherence — they follow the system without trying to customize it. (3) Accountable presence — they hold others to standard without ego or emotion. These qualities cannot be taught in a course. They are observed over time."
      },
      {
        heading: "The Lead's Mandate",
        body: "An Architect Lead has one job: run the session protocol with precision. They don't mentor. They don't coach. They don't give advice unless asked during Hot Seats. They facilitate structured accountability. They call roll. They manage time. They ensure commitments are recorded. They follow up on missed sessions. The Lead is the operating system of the cohort."
      },
      {
        heading: "Certification and Standards",
        body: "Certification is not a one-time event. Leads are continuously evaluated. If a Lead's cohort shows declining attendance, the Lead is reviewed. If a Lead deviates from protocol, they receive correction. If correction doesn't resolve the deviation, certification is revoked. There is no tenure protection. The standard is maintained through ongoing performance, not historical achievement."
      },
    ],
  },
  {
    pageNumber: 12,
    chapter: "Chapter XI — The Submission Pipeline",
    title: "Contributing to Institutional Knowledge",
    subtitle: "Your best work doesn't stay private. It becomes infrastructure.",
    sections: [
      {
        heading: "The Submission Process",
        body: "Any active member can submit a prompt for inclusion in the institutional library. The process: (1) Build your prompt using the Engine or independently. (2) Submit through the member portal with title, problem statement, scope, and the raw prompt. (3) The architecture team reviews for quality, completeness, and OpenClaw compliance. (4) Approved submissions are packaged, tagged, and added to the library."
      },
      {
        heading: "Quality Standards",
        body: "Not every submission makes it into the library. We reject submissions that lack structure, address problems too narrowly to be reusable, or don't meet the OpenClaw format requirements. This isn't gatekeeping for its own sake — it's quality assurance. Every prompt in the library must be useful to any member, not just the person who wrote it."
      },
      {
        heading: "The Compound Effect",
        body: "When your submission enters the library, it becomes part of the institution's permanent knowledge base. Other members build on it. Future prompts reference it. It gets versioned and improved over time. Your individual expertise becomes collective infrastructure. This is how institutional knowledge compounds — not through blog posts, but through structured, reusable, executable architecture."
      },
    ],
  },
  {
    pageNumber: 13,
    chapter: "Chapter XII — Session Memory",
    title: "Context That Compounds",
    subtitle: "Your AI doesn't forget you between sessions.",
    sections: [
      {
        heading: "The Memory Architecture",
        body: "Every time you use the Prompt Engine, your session context is saved. This includes your project parameters, stack preferences, previous generations, and iteration history. When you return — whether it's tomorrow or next month — the Engine picks up exactly where you left off. No re-explaining your project. No re-establishing your preferences. No starting from scratch."
      },
      {
        heading: "Why Memory Changes Everything",
        body: "Without memory, every AI interaction is isolated. You spend the first 20% of every session re-establishing context. Over a year, that's hundreds of hours of redundant communication. With persistent memory, Session 50 has the full benefit of Sessions 1 through 49. Your prompts get sharper. Your outputs get more precise. Your architecture gets more sophisticated. This is compounding applied to AI-assisted development."
      },
      {
        heading: "Token Tracking and Usage",
        body: "Every generation is tracked — tokens used, session ID, timestamp. This isn't just for billing. It gives you a complete audit trail of your architectural evolution. You can see how your prompts have matured. You can trace the lineage of your current architecture back to its first generation. Your development history becomes a structured dataset, not a scattered chat log."
      },
    ],
  },
  {
    pageNumber: 14,
    chapter: "Chapter XIII — The Board",
    title: "Structured Discourse, Not Social Media",
    subtitle: "A discussion system built for operators.",
    sections: [
      {
        heading: "Not a Forum, Not a Feed",
        body: "The PFSW Board is not Slack. It's not Discord. It's not Reddit. It's a structured discussion platform where members post with intent. Every post has a title, a body, and tags. Posts are organized by board — dedicated spaces for different topics. There's no infinite scroll. No dopamine-optimized feed. No vanity metrics. Just structured discourse between operators."
      },
      {
        heading: "Moderation Architecture",
        body: "Every post and comment is moderated. Not by algorithms — by the architecture team. Posts that don't meet quality standards are flagged. Comments that are off-topic or unconstructive are addressed. This creates an environment where signal-to-noise ratio is exceptionally high. When you read a post on the Board, you know it's been through a quality filter. Your attention is respected."
      },
      {
        heading: "Voting and Signal",
        body: "Members can upvote posts they find valuable. But unlike social platforms, votes don't determine visibility through an algorithm. They serve as signal — indicating which topics resonate with the membership. Highly-voted posts surface naturally because other members reference them. The voting system amplifies quality without creating a popularity contest."
      },
    ],
  },
  {
    pageNumber: 15,
    chapter: "Chapter XIV — Security Architecture",
    title: "Your Data, Your Architecture, Protected",
    subtitle: "Enterprise-grade security for individual builders.",
    sections: [
      {
        heading: "Row-Level Security",
        body: "Every table in the PFSW database is protected by Row-Level Security (RLS) policies. This means your data is isolated at the database level — not just the application level. Even if someone bypassed the UI entirely and queried the database directly, they would only see their own data. Your prompts, your sessions, your context — all protected by cryptographic user isolation."
      },
      {
        heading: "Authentication Architecture",
        body: "PFSW uses institutional-grade authentication. Email verification is mandatory — no auto-confirm shortcuts. Session tokens are managed with industry-standard JWT protocols. Password policies enforce minimum complexity. Every authentication event is logged. We don't cut corners on identity verification because your intellectual property deserves real protection."
      },
      {
        heading: "Payment Security",
        body: "All payment processing is handled through Stripe — the same infrastructure used by Amazon, Google, and Shopify. We never see your card number. We never store payment credentials. Every transaction is encrypted end-to-end. Your $5 application fee and your $197 monthly membership are processed through PCI-DSS Level 1 compliant infrastructure."
      },
    ],
  },
  {
    pageNumber: 16,
    chapter: "Chapter XV — The Technology Stack",
    title: "What Powers the Machine",
    subtitle: "Modern infrastructure for modern builders.",
    sections: [
      {
        heading: "Frontend Architecture",
        body: "PFSW is built on React with TypeScript — the same stack used by Meta, Airbnb, and Stripe. The UI is built with Tailwind CSS for consistent design tokens, shadcn/ui for accessible components, and Framer Motion for intentional animations. Every interface element follows a strict design system. No random colors. No inconsistent spacing. No amateur aesthetics."
      },
      {
        heading: "Backend Infrastructure",
        body: "The backend runs on Lovable Cloud — a managed infrastructure layer that provides database management, authentication, file storage, edge functions, and real-time capabilities. This means zero DevOps overhead. No server management. No database administration. No infrastructure anxiety. The platform handles the plumbing so you can focus on architecture."
      },
      {
        heading: "AI Integration Layer",
        body: "The Prompt Engine is powered by a multi-model AI gateway that routes requests to the optimal model for each task. Complex architectural reasoning uses frontier models. Simple classification tasks use efficient models. The system automatically selects the right model for the right job. You get the best output at the lowest latency without having to think about model selection."
      },
    ],
  },
  {
    pageNumber: 17,
    chapter: "Chapter XVI — Workflow Architecture",
    title: "A Day in the Life of a PFSW Member",
    subtitle: "What structured execution actually looks like.",
    sections: [
      {
        heading: "Monday: Session Day",
        body: "Your cohort session is locked to the same time slot every week. You arrive. Roll is called. You report what you shipped. During Hot Seats, you present your current blocker or you support another member presenting theirs. At the end, you declare your commitment for the week. The session ends. You have your marching orders. No ambiguity. No 'I'll figure out what to work on later.' You know exactly what to build."
      },
      {
        heading: "Tuesday–Friday: Build Cycle",
        body: "You open the Prompt Engine. Your context is loaded. You generate a structured prompt for your commitment. You paste it into your development environment. You build. When you hit a wall, you check the Library for relevant packages. When you need feedback, you post to the Board. When you need structured help, you prepare a Hot Seat brief for next week's session. Every action has a designated channel."
      },
      {
        heading: "Weekend: Review and Prepare",
        body: "You review your output for the week. You prepare your Roll Call report — what you shipped, what you learned, what you're carrying forward. If you have a prompt worth submitting, you submit it through the pipeline. If you completed your commitment, you plan next week's scope. This is the rhythm. It doesn't vary. It doesn't depend on inspiration. It runs."
      },
    ],
  },
  {
    pageNumber: 18,
    chapter: "Chapter XVII — Results Architecture",
    title: "What 90 Days Looks Like",
    subtitle: "The compound effect of structured execution.",
    sections: [
      {
        heading: "Month 1: Foundation",
        body: "In your first month, you attend four cohort sessions. You make four public commitments. You ship four structured outputs. You generate your first batch of Engine prompts. You learn the protocol. You internalize the rhythm. You might resist the structure — that's normal. By week 3, you stop resisting and start operating. Most members report more output in Month 1 than the previous three months combined."
      },
      {
        heading: "Month 2: Acceleration",
        body: "By Month 2, the Engine knows your project deeply. Your prompts are sharper. Your session context is rich. You're not explaining yourself anymore — you're iterating. Your cohort knows your project. Hot Seat feedback becomes surgical. You start seeing connections between other members' architectures and your own. The compound effect becomes tangible."
      },
      {
        heading: "Month 3: Architecture",
        body: "By Month 3, you have a body of work. Twelve sessions. Twelve commitments. Twelve shipped outputs. A library of generated prompts tied to your specific project. A track record of execution that you can see, measure, and build on. Some members have shipped entire MVPs. Others have restructured existing products from scratch. All of them have something they didn't have before: a system that works regardless of how they feel."
      },
    ],
  },
  {
    pageNumber: 19,
    chapter: "Chapter XVIII — Institutional Philosophy",
    title: "The Beliefs That Drive the System",
    subtitle: "First principles of the PFSW doctrine.",
    sections: [
      {
        heading: "Belief 1: Execution > Ideas",
        body: "Ideas are abundant. Execution is scarce. The world doesn't need more brainstorming — it needs more shipping. PFSW is built entirely around execution. We don't workshop ideas. We don't explore possibilities. We build things. Every tool, every process, every policy is designed to move you from concept to deployed output as fast as architecturally possible."
      },
      {
        heading: "Belief 2: Structure > Motivation",
        body: "Motivation is a depreciating asset. It's highest at the start and decays over time. Structure is a constant. It produces the same result on Day 1 and Day 365. We don't try to motivate our members. We don't send inspirational emails. We don't host rah-rah calls. We provide a structure that produces output whether you're motivated or not. That's the entire point."
      },
      {
        heading: "Belief 3: Density > Scale",
        body: "We will never optimize for member count. We will always optimize for member quality. A cohort of 8 committed operators produces more collective value than a Slack group of 8,000 lurkers. We maintain density by maintaining standards. The application filter, the attendance policy, the pricing — everything is designed to ensure that every person in the room is someone who ships."
      },
      {
        heading: "Belief 4: Systems > People",
        body: "This is the founding thesis. Not that people don't matter — they do. But people are variable. People have bad days, bad weeks, bad months. Systems don't. A well-designed system produces consistent output regardless of the humans inside it. PFSW is the system. You are the operator. Together, we produce what neither could alone."
      },
    ],
  },
  {
    pageNumber: 20,
    chapter: "Epilogue",
    title: "The Decision",
    subtitle: "You've read the manual. Now choose.",
    sections: [
      {
        body: "You've now read the complete operating doctrine of PFSW. You understand the application process, the pricing rationale, the technology stack, the cohort structure, the accountability mechanisms, and the philosophical foundations. Nothing has been hidden. Nothing has been softened."
      },
      {
        body: "This is not a platform that will adapt to your preferences. This is a system that will hold you to a standard. It will not celebrate your intentions. It will measure your output. It will not applaud your plans. It will track your commitments."
      },
      {
        body: "If you've read this far, you're probably one of two people. The first person is looking for a reason to say no. They'll find one. The structure is too rigid. The price is too high. The attendance policy is too strict. They'll go back to what they were doing before — and get the same results they've always gotten."
      },
      {
        body: "The second person recognizes themselves in these pages. They see the failure patterns and feel the sting of recognition. They understand that what they've been missing isn't another tool, another course, or another community. It's a system. An operating rhythm. An institution that demands execution and provides the architecture to achieve it."
      },
      {
        heading: "Your Move",
        body: "The application takes five minutes. The fee is $5. The review takes 48 hours. If you're accepted, you'll activate your membership, choose your cohort, and begin operating within the system that has already been built for you. The infrastructure is running. The cohorts are active. The Engine is waiting. The only variable left is you."
      },
    ],
  },
];
