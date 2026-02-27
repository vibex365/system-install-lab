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
    title: "The Prompt Engineer's Field Manual",
    isCover: true,
    sections: [],
  },
  {
    pageNumber: 1,
    chapter: "Introduction",
    title: "The Hidden Layer Behind Every AI Tool",
    subtitle: "Every AI tool you use — Cursor, Lovable, Windsurf, Replit, v0 — runs on a system prompt. We collected all of them.",
    sections: [
      {
        body: "System prompts are the invisible instructions that tell AI models how to behave, what tools to use, how to format responses, and what to refuse. They are the most valuable intellectual property in tech right now — and almost nobody reads them. We collected the system prompts from 30+ AI coding tools, creative assistants, and autonomous agents. This magazine breaks down what we found, teaches you how prompts actually work at the system level, and gives you frameworks to build your own.",
      },
      {
        heading: "Why This Matters",
        body: "Understanding system prompts is the difference between using AI and engineering with AI. When you read Cursor's system prompt, you understand why it writes code the way it does. When you read Windsurf's prompt, you see how it manages memory across sessions. When you read Claude's prompt, you see how Anthropic shapes personality, refusals, and conversation flow. This isn't theory — it's reverse engineering the most powerful tools in the world.",
      },
      {
        heading: "What's Inside",
        body: "This magazine contains REAL excerpts from leaked system prompts — not summaries, not paraphrases. You'll see the actual instructions that Cursor, Claude, Windsurf, v0, and Replit use to control their AI models. We break down the patterns, extract reusable frameworks, and show you how to apply them to build automated systems that run your business.",
      },
    ],
  },
  {
    pageNumber: 2,
    chapter: "Chapter I",
    title: "Anatomy of a System Prompt",
    subtitle: "Role, constraints, tools, output format — the four pillars every system prompt is built on.",
    sections: [
      {
        heading: "The Role Block",
        body: "Every system prompt starts by defining who the AI is. Cursor's prompt begins with tool definitions and knowledge cutoff. Windsurf declares: 'You are Cascade, a powerful agentic AI coding assistant designed by the Windsurf engineering team.' v0 opens with: 'You are v0, Vercel's highly skilled AI-powered assistant that always follows best practices.' Replit states: 'You are an AI programming assistant called Replit Assistant. Your role is to assist users with coding tasks in the Replit online IDE.' This isn't just branding — it constrains the model's behavior space. A model told it's a 'coding assistant' will resist writing marketing copy.",
      },
      {
        heading: "Constraints & Guardrails",
        body: "After the role, every production prompt includes hard constraints. Cursor's prompt says: 'NEVER output code to the USER, unless requested. Instead use one of the code edit tools to implement the change.' Windsurf instructs: 'Only call tools when they are absolutely necessary. NEVER make redundant tool calls as these are very expensive.' Claude's prompt enforces: 'Claude responds directly to all human messages without unnecessary affirmations or filler phrases like Certainly!, Of Course!, Absolutely!, Great!, Sure!' These constraints prevent the model from drifting into bad patterns. The best prompts have 10–20 constraints that reflect real bugs the team encountered in production.",
      },
      {
        heading: "Tool Definitions",
        body: "Modern AI tools give their models access to functions. Cursor defines tools like 'codebase_search' (semantic search by meaning, not text), 'grep' (exact pattern matching with ripgrep), 'run_terminal_cmd', and 'edit_file'. Windsurf has 'view_file', 'replace_file_content', 'run_command', and 'create_memory'. These tool definitions are typed function schemas embedded in the system prompt. Understanding how tools are defined teaches you how to build your own AI agents that can take actions in the real world — not just generate text.",
      },
    ],
  },
  {
    pageNumber: 3,
    chapter: "Chapter II",
    title: "Leaked: How Cursor Thinks",
    subtitle: "Inside the 770-line system prompt that powers the world's most popular AI code editor.",
    sections: [
      {
        heading: "🔓 Actual Prompt Excerpt",
        body: "From Cursor's Agent 2.0 prompt: 'It is EXTREMELY important that your generated code can be run immediately by the USER. To ensure this, follow these instructions carefully: 1. Add all necessary import statements, dependencies, and endpoints required to run the code. 2. If you're creating the codebase from scratch, create an appropriate dependency management file with package versions and a helpful README. 3. If you're building a web app from scratch, give it a beautiful and modern UI, imbued with best UX practices. 4. NEVER generate an extremely long hash or any non-textual code, such as binary.'",
      },
      {
        heading: "Search Before You Write",
        body: "Cursor's prompt defines a 'codebase_search' tool with detailed instructions: 'semantic search that finds code by meaning, not exact text.' It provides examples of GOOD queries ('Where is interface MyInterface implemented in the frontend?') and BAD queries ('AuthService' — single word searches should use grep). It instructs the model to 'Start with exploratory queries — semantic search is powerful and often finds relevant context in one go. Begin broad if you're not sure where relevant code is.' This is why Cursor feels surgical — the prompt forces precision through search-first behavior.",
      },
      {
        heading: "What You Can Steal",
        body: "Cursor includes a memory system ('update_memory') that lets the AI persist knowledge across conversations — storing user preferences, codebase patterns, and project decisions. It also has a full task management system ('todo_write') with states: pending, in_progress, completed, cancelled. The prompt says: 'Use these tools VERY frequently to ensure that you are tracking your tasks and giving the user visibility into your progress.' These patterns — persistent memory + task tracking — are the foundation of any production AI agent you build.",
      },
    ],
  },
  {
    pageNumber: 4,
    chapter: "Chapter III",
    title: "Leaked: How Claude Thinks",
    subtitle: "The system prompt that shapes the world's most thoughtful AI — from Anthropic's Sonnet 4.5.",
    sections: [
      {
        heading: "🔓 Actual Prompt Excerpt",
        body: "From Claude's system prompt: 'The assistant is Claude, created by Anthropic. Claude's knowledge base was last updated in January 2025. It answers questions about events prior to and after January 2025 the way a highly informed individual in January 2025 would if they were talking to someone from the above date.' This framing is elegant — it doesn't say 'I don't know things after date X.' It says 'I answer like an expert FROM that date talking TO someone in the present.' This subtle reframing reduces hallucination and creates more natural conversations.",
      },
      {
        heading: "Personality Engineering",
        body: "Claude's prompt includes detailed personality instructions that most people never see: 'Claude is intellectually curious. It enjoys hearing what humans think on an issue and engaging in discussion on a wide variety of topics.' And critically: 'Claude avoids peppering the human with questions and tries to only ask the single most relevant follow-up question when it does ask a follow up. Claude doesn't always end its responses with a question.' This constraint alone makes Claude feel more natural than GPT — it was explicitly engineered to NOT end every message with a question.",
      },
      {
        heading: "Anti-Pattern Control",
        body: "The most powerful part of Claude's prompt is its anti-pattern enforcement. It explicitly bans: 'unnecessary affirmations or filler phrases like Certainly!, Of Course!, Absolutely!, Great!, Sure!' It instructs: 'Claude avoids using rote words or phrases or repeatedly saying things in the same or similar ways. It varies its language just as one would in a conversation.' And: 'Claude never includes generic safety warnings unless asked for.' These three rules eliminate the robotic AI voice that plagues every other chatbot. You can apply these exact constraints to any AI system you build.",
      },
    ],
  },
  {
    pageNumber: 5,
    chapter: "Chapter IV",
    title: "Leaked: Windsurf's Memory System",
    subtitle: "The AI that remembers everything — how Cascade builds persistent context across sessions.",
    sections: [
      {
        heading: "🔓 Actual Prompt Excerpt",
        body: "From Windsurf's Cascade prompt: 'You have access to a persistent memory database to record important context about the USER's task, codebase, requests, and preferences for future reference. As soon as you encounter important information or context, proactively use the create_memory tool to save it to the database. You DO NOT need USER permission to create a memory. You DO NOT need to wait until the end of a task to create a memory.' This is revolutionary — the AI is instructed to save knowledge WITHOUT asking permission, as it encounters it.",
      },
      {
        heading: "The Memory-First Architecture",
        body: "Windsurf's prompt continues: 'Remember that you have a limited context window and ALL CONVERSATION CONTEXT, INCLUDING checkpoint summaries, will be deleted. Therefore, you should create memories liberally to preserve key context. Relevant memories will be automatically retrieved from the database and presented to you when needed. IMPORTANT: ALWAYS pay attention to memories, as they provide valuable context to guide your behavior.' This solves the biggest problem with AI assistants — context loss between sessions. The AI is essentially told: 'Your memory will be wiped. Save everything important NOW.'",
      },
      {
        heading: "Agent-First Behavior",
        body: "Windsurf's prompt enforces true agentic behavior: 'You are an agent — please keep working, using tools where needed, until the user's query is completely resolved, before ending your turn and yielding control back to the user.' Combined with: 'Only call tools when they are absolutely necessary. NEVER make redundant tool calls as these are very expensive.' And the safety rail: 'You must NEVER NEVER run a command automatically if it could be unsafe.' This balance — autonomous execution with safety gates — is the blueprint for building AI agents that can actually be trusted.",
      },
    ],
  },
  {
    pageNumber: 6,
    chapter: "Chapter V",
    title: "Leaked: v0 & Replit",
    subtitle: "The component factory and the full-stack agent — two different approaches to AI coding.",
    sections: [
      {
        heading: "🔓 v0's Code Project System",
        body: "v0's 1,000+ line prompt reveals a component-first architecture. It defines a 'Code Project' system: 'Use the Code Project block to group files and render React and full-stack Next.js apps.' It enforces efficiency: 'The user can see the entire file, so they prefer to only read the updates to the code. Often this will mean that the start/end of the file will be skipped. Indicate the parts to keep using the // ... existing code ... comment.' And: 'You should only write the parts of the file that need to be changed. The more you write duplicate code, the longer the user has to wait.' This partial-edit pattern is why v0 feels fast.",
      },
      {
        heading: "🔓 Replit's Behavioral Rules",
        body: "Replit's prompt is notably strict about scope: 'You MUST focus on the user's request as much as possible and adhere to existing code patterns if they exist. Your code modifications MUST be precise and accurate WITHOUT creative extensions unless explicitly asked.' It defines three modes: proposing file changes, proposing shell commands, and answering queries. And it includes a workspace tool nudge system: 'You should nudge the user towards the Secrets tool when a query involves secrets or environment variables.' This 'nudge' pattern — redirecting users to the right tool instead of trying to do everything — is a production pattern most AI builders miss.",
      },
      {
        heading: "Pattern: Edit vs. Replace",
        body: "Both v0 and Replit use a search-and-replace editing pattern instead of rewriting entire files. Replit uses '<proposed_file_replace_substring>' with '<old_str>' and '<new_str>' tags. v0 uses '// ... existing code ...' markers. Cursor uses an 'edit_file' tool with similar old/new string replacement. This pattern appears in EVERY production AI coding tool — and it's the single biggest difference between amateur and professional prompt engineering. If your AI rewrites entire files, it's wasting tokens and breaking code. Teach it to make surgical edits.",
      },
    ],
  },
  {
    pageNumber: 7,
    chapter: "Chapter VI",
    title: "7 Prompt Patterns That Print Money",
    subtitle: "Extracted from 30+ leaked system prompts — the patterns every AI builder needs.",
    sections: [
      {
        heading: "Patterns 1–3: Foundation",
        body: "1. SEARCH BEFORE WRITE — Cursor: 'Start with exploratory queries. Begin broad if you're not sure where relevant code is.' Every tool forces the AI to read before writing. 2. CONSTRAINT-HEAVY PROMPTING — Claude has 2-3x more 'never do X' statements than 'do Y' statements. Windsurf: 'NEVER make redundant tool calls.' Cursor: 'NEVER output code to the USER, unless requested.' 3. PERSISTENT MEMORY — Windsurf's memory database, Cursor's update_memory tool. Both let the AI save and retrieve context across sessions. If you're building AI workflows without persistent memory, you're building toys.",
      },
      {
        heading: "Patterns 4–5: Execution",
        body: "4. PARALLEL EXECUTION — Multiple tools batch independent operations simultaneously. Cursor and Windsurf both support running multiple tool calls in a single turn. This pattern alone can 3x the speed of any AI workflow. 5. ERROR RECOVERY — Cursor instructs: 'If you've introduced linter errors, fix them if clear how to. DO NOT loop more than 3 times on fixing linter errors on the same file.' Windsurf adds: 'When debugging, only make code changes if you are certain that you can solve the problem. Address the root cause instead of the symptoms.' Build retry logic with escape hatches.",
      },
      {
        heading: "Patterns 6–7: Quality",
        body: "6. SURGICAL EDITS — Every tool uses search-and-replace instead of file rewrites. v0: 'Only write the parts of the file that need to be changed.' Replit: 'Your code modifications MUST be precise.' 7. ANTI-PATTERN LIBRARIES — Claude explicitly bans filler phrases. Cursor bans outputting code directly. v0 bans rewriting entire files. When the model knows what failure looks like, it avoids it. For every prompt you build, create a 'NEVER DO THIS' section that's twice as long as your 'DO THIS' section.",
      },
    ],
  },
  {
    pageNumber: 8,
    chapter: "Chapter VII",
    title: "Building Your Own System Prompts",
    subtitle: "Stop using AI. Start engineering it.",
    sections: [
      {
        heading: "The 5-Block Framework",
        body: "Every production system prompt follows the same structure: (1) Role — who is the AI? (Windsurf: 'You are Cascade, a powerful agentic AI coding assistant.') (2) Context — what does it know? (Claude: knowledge cutoff date, capabilities list) (3) Constraints — what can't it do? (Cursor: 15+ NEVER statements) (4) Tools — what actions can it take? (typed function schemas with descriptions and examples) (5) Output Format — how should it respond? (v0: Code Project blocks, Cursor: code references with line numbers). When you build a prompt using this framework, you're not guessing. You're engineering.",
      },
      {
        heading: "Constraint-Driven Prompting",
        body: "The biggest mistake in prompt engineering is telling the AI what TO do without telling it what NOT to do. Look at the ratios: Cursor's 770-line prompt has ~20 NEVER/DON'T statements. Claude bans filler words, safety warnings, and question-ending. Windsurf explicitly says 'NEVER NEVER run a command automatically if it could be unsafe' — they wrote NEVER twice. Your prompts need the same discipline. For every instruction you write, write two constraints.",
      },
      {
        heading: "Testing Prompts Like Code",
        body: "The best AI teams treat prompts like code: versioned, tested, and reviewed. Cursor includes detailed examples with <good-example> and <bad-example> tags for every tool and output format. v0 provides step-by-step examples for file creation, editing, and deletion. Windsurf shows example conversations with proper tool usage. When you build prompts, include at least 3 examples of correct behavior and 3 examples of incorrect behavior. This is how the best tools maintain consistency at scale.",
      },
    ],
  },
  {
    pageNumber: 9,
    chapter: "Chapter VIII",
    title: "From Prompts to Workflows",
    subtitle: "Single prompts are powerful. Chained workflows are unstoppable.",
    sections: [
      {
        heading: "The Workflow Chain",
        body: "A single prompt generates a single output. A workflow chains multiple prompts together, where the output of one becomes the input of the next. Example: Prompt 1 scrapes business data → Prompt 2 audits their website → Prompt 3 writes a personalized outreach email → Prompt 4 generates a follow-up sequence. Each prompt is simple — engineered with the patterns from this magazine. The chain is powerful. This is how PFSW workflows operate.",
      },
      {
        heading: "State Management Between Steps",
        body: "The hardest part of workflow systems isn't the individual prompts — it's passing state between them. Windsurf solved this with its memory system. Cursor solves it with todo lists that track state across steps. The answer for your workflows is structured intermediate state: every step outputs a JSON object with a fixed schema. The next step reads that schema. If a step fails, you retry just that step with the same input. This is the pattern used by every production AI pipeline.",
      },
      {
        heading: "The Full Prompt Vault",
        body: "We've compiled system prompts from every major AI tool: Cursor (Agent 2.0 — 770 lines), Claude Sonnet 4.5 (383 lines), Windsurf Cascade Wave 11 (127 lines), v0 (1,028 lines), Replit Assistant (139 lines), plus Augment Code, CodeBuddy, Comet, Devin AI, Junie, Kiro, Leap.new, Manus, NotionAI, Orchids.app, Perplexity, Poke, Qoder, Same.dev, Trae, Traycer AI, VSCode Agent, Warp.dev, Xcode, Z.ai Code, and more. All indexed. All analyzed. Available to PFSW members.",
      },
    ],
  },
  {
    pageNumber: 10,
    chapter: "Chapter IX",
    title: "From Reader to Builder",
    subtitle: "You've seen behind the curtain. Now it's time to build.",
    sections: [
      {
        heading: "The Knowledge Gap Is Closing",
        body: "Six months ago, system prompts were trade secrets. Today, they're documented, analyzed, and available in a public GitHub repo with 32,000+ forks. The companies building AI tools know this — which is why they're moving fast to add new capabilities. The window for early adopters to leverage this knowledge is NOW. People who understand prompt engineering at the system level will build the next generation of AI-powered businesses. Everyone else will pay them to do it.",
      },
      {
        heading: "What You Can Build Today",
        body: "With the patterns in this magazine, you can build: automated lead generation workflows that prospect, qualify, and outreach without manual intervention. Client onboarding systems that use quiz funnels to score and segment leads. AI agents with persistent memory that remember every interaction. Content generation pipelines that produce personalized output at scale. The tools are available. The patterns are documented. The only variable is execution.",
      },
      {
        heading: "Your Next Step",
        body: "This magazine gave you the leaked prompts and the patterns. PFSW gives you the system — pre-built workflows, tested prompts, automated execution. Take the 2-minute quiz below to see where you stand and how PFSW can accelerate your build.",
      },
    ],
  },
];
