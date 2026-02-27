export interface SystemMagazinePage {
  pageNumber: number;
  chapter: string;
  title: string;
  subtitle?: string;
  isCover?: boolean;
  sections: { heading?: string; body: string }[];
}

export const systemMagazinePages: SystemMagazinePage[] = [
  {
    pageNumber: 0,
    chapter: "PFSW",
    title: "Inside the Machine",
    isCover: true,
    sections: [],
  },
  {
    pageNumber: 1,
    chapter: "Introduction",
    title: "Why Your Follow-Up Is Broken",
    subtitle: "You're not losing deals because of your offer. You're losing them in the gap between 'interested' and 'booked.'",
    sections: [
      {
        body: "Here's the truth nobody wants to hear: 78% of deals go to the first responder. Not the best offer. Not the best price. The first person who picks up the phone, sends the text, and books the call. Most businesses respond to a new lead in 24-48 hours. By then, your prospect has already talked to three competitors, forgotten your name, and moved on. The PFSW system was built to eliminate that gap entirely.",
      },
      {
        heading: "What This Magazine Covers",
        body: "This is not a sales pitch. This is a technical breakdown of how the PFSW automation engine works — the AI agents, the intelligent workflows, the real-time response system, and the end-to-end pipeline that turns a cold lead into a booked appointment without you lifting a finger. By the end, you'll understand exactly what's running under the hood and why it outperforms anything you've seen before.",
      },
    ],
  },
  {
    pageNumber: 2,
    chapter: "Chapter I",
    title: "The Intelligence Layer",
    subtitle: "How our AI agents think, decide, and act — without human intervention.",
    sections: [
      {
        heading: "🧠 What Are AI Agents?",
        body: "An AI agent isn't a chatbot. It's not a template. It's an autonomous decision-maker that receives a goal, evaluates the situation, and executes a multi-step plan. Our agents are purpose-built for one thing: moving prospects through your pipeline faster than any human team could. Each agent specializes in a specific task — qualifying leads, writing outreach, booking calls, following up — and they operate 24/7 without breaks, mood swings, or 'I forgot to call them back.'",
      },
      {
        heading: "⚡ Speed That Changes Everything",
        body: "When a new lead enters your system — whether from a quiz funnel, a form submission, or a manual import — our intelligence layer activates within seconds. Not minutes. Seconds. The system evaluates the lead's data, scores their readiness, selects the right outreach strategy, and begins execution before you've even seen the notification. This isn't automation in the traditional sense. This is an AI workforce that never clocks out.",
      },
      {
        heading: "🔒 Built-In Quality Control",
        body: "Every agent output goes through validation checks. The system won't send a message that sounds robotic. It won't book a call at 3 AM. It won't follow up with someone who asked to stop. Quality gates are baked into every step — so you get the speed of automation with the quality of a trained sales team.",
      },
    ],
  },
  {
    pageNumber: 3,
    chapter: "Chapter II",
    title: "The Agent Chain",
    subtitle: "How individual agents link together into intelligent workflows that handle entire sales processes.",
    sections: [
      {
        heading: "🔗 Chaining: The Secret Weapon",
        body: "A single agent is powerful. A chain of agents is unstoppable. Here's how it works: Agent A qualifies a lead and passes the result to Agent B, which crafts a personalized outreach message. Agent B's output triggers Agent C, which sends that message via the optimal channel — text, email, or voice. Agent C's delivery confirmation activates Agent D, which monitors for responses and routes them back through the chain. Each agent feeds the next. No handoffs get dropped. No leads fall through the cracks.",
      },
      {
        heading: "📊 Real Example: Lead to Booked Call",
        body: "Here's a live workflow running inside the system right now:\n\n1. QUALIFIER AGENT scans a new lead → scores them 1-100 based on business type, response signals, and fit criteria\n2. OUTREACH AGENT receives the score → generates a personalized message calibrated to their tier (high-touch for hot leads, nurture sequence for warm ones)\n3. DELIVERY AGENT sends the message via the right channel at the right time → tracks opens, clicks, and replies\n4. BOOKING AGENT detects interest → offers time slots, handles objections, confirms the appointment\n5. FOLLOW-UP AGENT sends reminders before the call → reduces no-shows by up to 60%\n\nAll five agents coordinate autonomously. You wake up to booked calls on your calendar.",
      },
      {
        heading: "🎯 Why Chains Beat Zapier",
        body: "Traditional automation tools connect apps with simple 'if this, then that' logic. Our agent chains are fundamentally different. They don't just pass data between tools — they make decisions at every step. Should this lead get a text or an email? Should the follow-up be aggressive or soft? Should we wait 2 hours or 2 days? These decisions happen in real-time, adapting to each lead's behavior. That's the difference between dumb automation and intelligent execution.",
      },
    ],
  },
  {
    pageNumber: 4,
    chapter: "Chapter III",
    title: "The Workflow Engine",
    subtitle: "How we orchestrate complex, multi-day campaigns that feel personal at scale.",
    sections: [
      {
        heading: "⚙️ Orchestration, Not Automation",
        body: "Most tools automate tasks. We orchestrate outcomes. The workflow engine is the brain of the operation — it manages the timing, sequencing, and decision logic across every agent in the chain. Think of it like a conductor leading an orchestra. Each instrument (agent) plays its part, but the conductor ensures they play in harmony, at the right tempo, in the right order.",
      },
      {
        heading: "📅 Multi-Day Intelligence",
        body: "The engine doesn't just fire-and-forget. It maintains a memory of every interaction across your entire pipeline. It knows that Lead A opened your email but didn't reply. It knows Lead B responded with a question at 9 PM. It knows Lead C no-showed their last call. Each of these scenarios triggers a different response strategy — automatically. The system learns from the patterns in your pipeline and adjusts its approach over time.",
      },
      {
        heading: "🏗️ Your Workflows, Your Rules",
        body: "Every workflow is configurable. You decide the goal ('book 20 calls this week'), the constraints ('only contact between 9 AM and 6 PM'), and the escalation rules ('if no response after 3 touches, pause and flag for review'). The engine handles everything else — selecting agents, managing timing, handling edge cases, and reporting results. You set the strategy. The machine executes it.",
      },
    ],
  },
  {
    pageNumber: 5,
    chapter: "Chapter IV",
    title: "The Voice System",
    subtitle: "AI-powered voice calls that sound human, handle objections, and book appointments in real-time.",
    sections: [
      {
        heading: "📞 Beyond Text — The Voice Advantage",
        body: "Text and email are powerful, but nothing closes like a phone call. Our voice system deploys AI-powered calls that sound natural, conversational, and human. The AI doesn't read a script — it has a conversation. It asks questions, listens to responses, handles objections, and guides the prospect toward booking a call with you. If a prospect says 'I'm busy right now,' the AI responds naturally: 'No problem — what time works better for you this week?'",
      },
      {
        heading: "🎙️ How Voice Agents Work",
        body: "The voice agent receives a briefing from the workflow engine: who they're calling, what they know about the prospect, what the goal is, and what objections to expect. Then it makes the call. During the conversation, it adapts in real-time — adjusting its tone, pacing, and questions based on how the prospect responds. After the call, it generates a summary, logs the outcome, and triggers the next step in the workflow chain.",
      },
      {
        heading: "📈 Results That Speak",
        body: "Businesses using our voice system see:\n\n• 3x more booked appointments vs. text-only outreach\n• 60% reduction in no-shows (AI sends reminders + confirmation calls)\n• Average call duration: 2-4 minutes (efficient, not pushy)\n• 24/7 availability — the AI calls when your prospects are available, not when you are\n\nThe voice system isn't replacing your sales team. It's doing the work your sales team doesn't have time to do — the initial outreach, the follow-ups, the re-engagement. By the time a prospect gets on a call with you, they're already warmed up and ready to talk.",
      },
    ],
  },
  {
    pageNumber: 6,
    chapter: "Chapter V",
    title: "The CRM & Pipeline",
    subtitle: "Every lead, every touchpoint, every outcome — visible in one intelligent dashboard.",
    sections: [
      {
        heading: "📋 Your Command Center",
        body: "The PFSW CRM isn't just a contact list. It's a living pipeline that shows you exactly where every lead stands, what's been done, what's coming next, and what needs your attention. Leads move through stages automatically as agents complete their tasks — from 'New' to 'Contacted' to 'Qualified' to 'Booked' to 'Closed.' You see the full picture without digging through spreadsheets or switching between 5 different tools.",
      },
      {
        heading: "📊 Analytics That Actually Matter",
        body: "Forget vanity metrics. The dashboard shows you what moves the needle:\n\n• Lead-to-booked conversion rate\n• Average time from first contact to booked call\n• Agent performance (which workflows are closing the most)\n• Channel effectiveness (text vs. email vs. voice)\n• Pipeline value and velocity\n\nEvery data point is connected to revenue. You know exactly what's working, what's not, and where to double down.",
      },
      {
        heading: "🔄 The Feedback Loop",
        body: "Here's what makes the system compound over time: every outcome feeds back into the intelligence layer. When a message gets a high response rate, the system learns from it. When a call script books more appointments, it gets prioritized. When a particular lead type converts faster, the qualifier agent adjusts its scoring. You're not just running campaigns — you're training a system that gets smarter with every interaction.",
      },
    ],
  },
  {
    pageNumber: 7,
    chapter: "Chapter VI",
    title: "The Quiz Funnel System",
    subtitle: "How we turn cold traffic into qualified, scored leads — before you ever talk to them.",
    sections: [
      {
        heading: "🎯 Why Quiz Funnels Win",
        body: "A traditional landing page asks a visitor to make a decision: sign up or leave. A quiz funnel flips the script — it asks the visitor questions, scores their answers, and delivers personalized results. By the time they reach the end, they've invested 2-3 minutes of attention, they've seen their 'score,' and they want to know how to improve it. That's the hook. That's what makes them give you their phone number.",
      },
      {
        heading: "⚡ From Quiz to Pipeline in 30 Seconds",
        body: "Here's the flow:\n\n1. Prospect clicks your quiz link (from an ad, a DM, or a social post)\n2. They answer 5-6 qualifying questions about their business\n3. The system scores their answers in real-time and assigns a tier\n4. They see their results + a CTA to talk to an AI advisor\n5. They enter their phone number → receive a callback within seconds\n6. The AI voice agent walks them through their results and books a call\n7. The lead lands in your CRM, fully scored, with a call on the calendar\n\nFrom cold click to booked appointment — no manual follow-up required.",
      },
      {
        heading: "🏗️ Built for Distribution",
        body: "Every funnel gets a unique, branded URL you can share anywhere. Drop it in a Facebook ad, text it to your warm list, put it in your Instagram bio, send it in a group chat. The system handles the rest. And here's the best part: you can deploy a new funnel in minutes, not days. Pick a template, customize the questions, set your CTA, and you're live. No developers. No designers. No waiting.",
      },
    ],
  },
  {
    pageNumber: 8,
    chapter: "Chapter VII",
    title: "The Full Picture",
    subtitle: "How every piece connects into a single revenue engine.",
    sections: [
      {
        heading: "🗺️ The Complete System Map",
        body: "Let's zoom out and see how everything connects:\n\nTRAFFIC → Quiz Funnel captures and scores the lead\nQUALIFICATION → AI agent evaluates fit and assigns priority\nOUTREACH → Personalized messages sent via text, email, or voice\nBOOKING → AI handles scheduling, objections, and confirmations\nFOLLOW-UP → Automated reminders reduce no-shows\nCRM → Full pipeline visibility with actionable analytics\nFEEDBACK → Every outcome improves the next campaign\n\nThis isn't 7 different tools duct-taped together. It's one integrated system where every component was designed to work with every other component. Data flows seamlessly. Agents coordinate automatically. Nothing gets lost.",
      },
      {
        heading: "💰 The ROI Math",
        body: "Let's do the math:\n\n• A single VA doing lead gen + follow-up costs $1,500-3,000/month\n• They work 8 hours/day, handle maybe 20-30 leads, and still miss follow-ups\n• Our system runs 24/7, handles unlimited leads, never forgets, and costs a fraction\n\nBut here's the real ROI: speed. When you respond to a lead in 30 seconds instead of 30 hours, your conversion rate doesn't just improve — it multiplies. The businesses using this system aren't just saving time. They're closing deals their competitors never even got a chance to pitch.",
      },
      {
        heading: "🚀 What's Next",
        body: "This system is already live and producing results. But we're just getting started. New agent types, deeper personalization, multi-language support, and advanced analytics are all in the pipeline. The platform evolves every week — and when it does, your system evolves with it automatically. No updates to install. No migrations to run. You benefit from every improvement the moment it ships.",
      },
    ],
  },
];
