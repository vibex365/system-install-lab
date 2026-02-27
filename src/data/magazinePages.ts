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
    image: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200&q=80&auto=format&fit=crop",
    sections: [
      {
        body: "System prompts are the invisible instructions that tell AI models how to behave, what tools to use, how to format responses, and what to refuse. They are the most valuable intellectual property in tech right now — and almost nobody reads them. We did. We collected the system prompts from 30+ AI coding tools, creative assistants, and autonomous agents. This magazine breaks down what we found, teaches you how prompts actually work at the system level, and gives you frameworks to build your own.",
      },
      {
        heading: "Why This Matters",
        body: "Understanding system prompts is the difference between using AI and engineering with AI. When you read Cursor's system prompt, you understand why it writes code the way it does. When you read Lovable's prompt, you understand its design philosophy. When you read Windsurf's prompt, you see how it manages memory across sessions. This isn't theory — it's reverse engineering the most powerful tools in the world.",
      },
      {
        heading: "What You'll Learn",
        body: "By the end of this magazine, you'll understand: how system prompts structure AI behavior, the anatomy of a production-grade prompt, how to build multi-step workflow prompts, prompt patterns used by billion-dollar companies, and how to apply these patterns to build automated systems that run your business. This is the playbook nobody else is sharing.",
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
        body: "Every system prompt starts by defining who the AI is. Cursor tells its model: 'You are an intelligent programmer.' Lovable says: 'You are Lovable, an AI editor that creates and modifies web applications.' v0 declares: 'You are v0, an AI assistant by Vercel.' This isn't just branding — it constrains the model's behavior space. A model told it's a 'programmer' will resist writing marketing copy. A model told it's a 'web editor' will default to React components. The role block is the single most important line in any prompt.",
      },
      {
        heading: "Constraints & Guardrails",
        body: "After the role, every production prompt includes hard constraints. Cursor's prompt says: 'Do not output three backtick markdown code blocks.' Lovable's says: 'NEVER use custom color classes in components. Always use semantic design tokens.' These constraints prevent the model from drifting into bad patterns. Without them, models hallucinate, produce inconsistent output, and break existing code. The best prompts have 10–20 constraints that reflect real bugs the team encountered in production.",
      },
      {
        heading: "Tool Definitions",
        body: "Modern AI tools give their models access to functions — file reading, code search, terminal execution, browser automation. Cursor defines tools like 'codebase_search', 'edit_file', and 'run_terminal_command'. Windsurf has 'create_file', 'search_replace', and 'run_command'. These tool definitions are JSON schemas embedded in the system prompt. Understanding how tools are defined teaches you how to build your own AI agents that can take actions in the real world — not just generate text.",
      },
    ],
  },
  {
    pageNumber: 3,
    chapter: "Chapter II",
    title: "Leaked: How Cursor Thinks",
    subtitle: "Inside the system prompt that powers the world's most popular AI code editor.",
    image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&q=80&auto=format&fit=crop",
    sections: [
      {
        heading: "The Cursor Philosophy",
        body: "Cursor's system prompt reveals a clear design philosophy: minimal diffs, maximum context. The prompt instructs the model to 'make changes to at most one file at a time' and to 'use the minimum amount of changes.' It tells the model to search the codebase before writing code, to check for existing implementations before creating new ones, and to always verify that imports exist. This is why Cursor feels surgical compared to ChatGPT — the prompt forces precision.",
      },
      {
        heading: "Memory & Context Management",
        body: "Cursor's prompt includes a sophisticated context strategy. It tells the model to 'read relevant files before making changes' and to never assume file contents. It includes rules about when to use grep vs. semantic search, how to handle large codebases, and when to ask the user for clarification vs. making a decision. This context management is what makes Cursor feel like it 'understands' your project — it's not magic, it's prompt engineering.",
      },
      {
        heading: "What You Can Steal",
        body: "From Cursor's prompt, you can extract patterns for your own coding agents: always search before writing, make minimal changes, verify imports, read files before editing, and never assume context. These five rules, applied to any AI model with tool access, will produce dramatically better code generation. You don't need Cursor's infrastructure — you need Cursor's prompt patterns.",
      },
    ],
  },
  {
    pageNumber: 4,
    chapter: "Chapter III",
    title: "Leaked: How Lovable Builds",
    subtitle: "The system prompt behind the AI that ships full-stack apps from a conversation.",
    sections: [
      {
        heading: "Design System Enforcement",
        body: "Lovable's prompt reveals an obsessive focus on design quality. It includes a full design philosophy section: 'Before coding, commit to a BOLD aesthetic direction.' It instructs the model to never use 'generic AI aesthetics: overused fonts (Inter, Poppins), purple gradients on white, predictable layouts.' It requires semantic design tokens, proper dark mode support, and motion with framer-motion. This is why Lovable apps look polished — the prompt literally forbids ugliness.",
      },
      {
        heading: "The Parallel Execution Pattern",
        body: "One of the most powerful patterns in Lovable's prompt is parallel tool execution. The prompt repeatedly states: 'Always batch independent operations into parallel calls' and 'If you need to create multiple files, create all of them at once.' This pattern — identifying independent operations and executing them simultaneously — is applicable far beyond code generation. It's a fundamental principle for building efficient AI workflows.",
      },
      {
        heading: "What You Can Steal",
        body: "From Lovable's prompt: enforce a design system at the prompt level, use semantic tokens instead of raw values, prefer search-replace over full file rewrites, batch parallel operations, and always verify changes after making them. These patterns work in any AI-assisted development workflow, whether you're using Lovable or building your own toolchain.",
      },
    ],
  },
  {
    pageNumber: 5,
    chapter: "Chapter IV",
    title: "Leaked: Windsurf, Replit & v0",
    subtitle: "Three more system prompts. Three more lessons in prompt architecture.",
    image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&q=80&auto=format&fit=crop",
    sections: [
      {
        heading: "Windsurf: The Memory Model",
        body: "Windsurf's system prompt introduces 'Cascade memories' — a persistent memory layer that survives across conversations. The prompt instructs the model to save learnings about the user's codebase, preferred patterns, and project decisions into memory. When the user returns, the model has context it didn't have to re-learn. This is a blueprint for building AI systems with long-term memory — something most developers haven't implemented yet.",
      },
      {
        heading: "Replit: The Full-Stack Agent",
        body: "Replit's prompt turns the AI into a complete development environment manager. It can create files, run shell commands, manage packages, deploy applications, and interact with databases — all from within the prompt context. The key insight: Replit's prompt includes detailed error-handling instructions for every tool. When a deployment fails, the prompt tells the model exactly how to diagnose and retry. Robust error handling in prompts is what separates toys from production systems.",
      },
      {
        heading: "v0: The Component Factory",
        body: "v0's system prompt is laser-focused on UI generation. It includes a massive library of component patterns — buttons, cards, forms, layouts, navigation — all defined as prompt context. When you ask v0 for a dashboard, it's not generating from scratch; it's selecting and composing patterns from its prompt library. This 'pattern library in the prompt' approach is how you build consistent, high-quality output from AI systems. Pre-define the patterns. Let the model compose them.",
      },
    ],
  },
  {
    pageNumber: 6,
    chapter: "Chapter V",
    title: "Building Your Own System Prompts",
    subtitle: "Stop using AI. Start engineering it.",
    sections: [
      {
        heading: "The 5-Block Framework",
        body: "Every production system prompt follows the same structure: (1) Role — who is the AI? (2) Context — what does it know? (3) Constraints — what can't it do? (4) Tools — what actions can it take? (5) Output Format — how should it respond? When you build a prompt using this framework, you're not guessing. You're engineering. Start with the role, then add context about the task, then constrain the behavior, then define the tools, then specify the output format. This framework works for chatbots, coding agents, data analysts, and every other AI use case.",
      },
      {
        heading: "Constraint-Driven Prompting",
        body: "The biggest mistake in prompt engineering is telling the AI what TO do without telling it what NOT to do. Every leaked system prompt we analyzed has 2–3x more constraints than instructions. Cursor has 15+ 'NEVER' statements. Lovable has a section called 'Critical Instructions.' v0 lists explicit anti-patterns. Your prompts need the same discipline. For every instruction you write, write two constraints. 'Generate a landing page' becomes: 'Generate a landing page. Do NOT use placeholder images. Do NOT use lorem ipsum. Do NOT create more than 3 sections.'",
      },
      {
        heading: "Testing Prompts Like Code",
        body: "The best AI teams treat prompts like code: versioned, tested, and reviewed. When you change a prompt, run it against 10 known inputs and compare outputs. Track regression. Use A/B testing. Store prompt versions in git. This is how Cursor, Lovable, and Windsurf iterate — not by guessing, but by measuring. If you're building AI systems for clients, this discipline is what separates a $500 chatbot from a $50,000 AI workflow.",
      },
    ],
  },
  {
    pageNumber: 7,
    chapter: "Chapter VI",
    title: "Prompt Patterns That Print Money",
    subtitle: "7 reusable patterns extracted from the world's best AI products.",
    image: "https://images.unsplash.com/photo-1639322537228-f710d846310a?w=1200&q=80&auto=format&fit=crop",
    sections: [
      {
        heading: "Pattern 1–3: Foundation",
        body: "Chain of Thought Enforcement — Force the model to think step-by-step before acting. Every major AI tool includes this. Cursor: 'Think carefully step by step.' Lovable: 'Assess scope: Clear/narrow → implement. Broad/ambiguous → ask clarifying questions first.' Tool Selection Logic — Define WHEN to use each tool, not just what it does. Lovable's prompt has paragraphs explaining when to use search vs. file read vs. browser automation. Context Window Management — Tell the model what to remember and what to forget. Windsurf's memory system is the gold standard here.",
      },
      {
        heading: "Pattern 4–5: Execution",
        body: "Parallel Execution — Batch independent operations. Lovable's prompt: 'Always batch independent operations into parallel calls.' This pattern alone can 3x the speed of any AI workflow. Error Recovery Chains — Tell the model what to do when something fails. Replit's prompt includes fallback sequences for every tool. 'If deployment fails, check logs. If logs show X, try Y. If Y fails, notify user.' This is the difference between an AI that breaks and an AI that recovers.",
      },
      {
        heading: "Pattern 6–7: Quality",
        body: "Output Validation — Make the model verify its own output before returning it. Lovable: 'After code edits, verify your changes work.' This self-check pattern catches 30–40% of errors before the user ever sees them. Anti-Pattern Libraries — Explicitly list what BAD output looks like. Lovable lists 'generic AI aesthetics' as anti-patterns. Cursor lists common code mistakes. When the model knows what failure looks like, it avoids it. Build your own anti-pattern library for every prompt you deploy.",
      },
    ],
  },
  {
    pageNumber: 8,
    chapter: "Chapter VII",
    title: "Building Workflow Systems",
    subtitle: "Single prompts are powerful. Chained workflows are unstoppable.",
    sections: [
      {
        heading: "From Prompt to Pipeline",
        body: "A single prompt generates a single output. A workflow chains multiple prompts together, where the output of one becomes the input of the next. Example: Prompt 1 scrapes business data → Prompt 2 audits their website → Prompt 3 writes a personalized email → Prompt 4 generates a follow-up sequence. Each prompt is simple. The chain is powerful. This is how PFSW workflows operate — and it's how you should think about building AI systems for any business process.",
      },
      {
        heading: "State Management Between Steps",
        body: "The hardest part of workflow systems isn't the individual prompts — it's passing state between them. What does Prompt 2 need to know about Prompt 1's output? How do you handle errors in Step 3 without re-running Steps 1 and 2? The answer is structured intermediate state. Every step outputs a JSON object with a fixed schema. The next step reads that schema. If a step fails, you retry just that step with the same input. This is the pattern used by every production AI pipeline, from simple chatbots to autonomous coding agents.",
      },
      {
        heading: "The PFSW Workflow Model",
        body: "PFSW workflows use this exact architecture. You define a goal in natural language. The system decomposes it into steps. Each step is assigned to a specialized agent with its own system prompt. The agents execute in sequence, passing structured data between them. You can monitor each step's status, review intermediate outputs, and intervene when needed. This is the future of AI-powered business: not single prompts, but orchestrated systems of prompts working together.",
      },
    ],
  },
  {
    pageNumber: 9,
    chapter: "Chapter VIII",
    title: "The Full Prompt Vault",
    subtitle: "30+ AI tool system prompts. All indexed. All analyzed.",
    image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&q=80&auto=format&fit=crop",
    sections: [
      {
        heading: "The Collection",
        body: "We've compiled system prompts from every major AI tool in the ecosystem: Cursor (Agent Mode, Ask Mode, Edit Mode), Lovable (Full System Prompt + Tool Definitions), Windsurf (Cascade + Memory System), Replit (Agent + Deployment), v0 (Component Generation), Claude (Chat + Code + Chrome Tools), Augment Code, CodeBuddy, Devin AI, Junie, Kiro, Manus, NotionAI, Perplexity, Replit, Same.dev, Trae, VSCode Agent, Warp.dev, Xcode, and more. Each prompt is annotated with key patterns, constraints, and techniques you can reuse.",
      },
      {
        heading: "How to Use This Vault",
        body: "Don't read every prompt end-to-end. Instead, use them as reference material. Building a coding agent? Read Cursor and Windsurf's prompts for tool definition patterns. Building a design tool? Read Lovable and v0 for design constraint patterns. Building a chatbot? Read Claude and Perplexity for conversation management. The vault is a reference library, not a textbook. Search by pattern, not by tool.",
      },
      {
        heading: "Access the Source",
        body: "The full prompt collection is maintained as an open-source repository with 30+ AI tool prompts, regularly updated as tools evolve. PFSW members get curated analysis, pattern extraction, and ready-to-deploy prompt templates built from these sources. This is the raw material. PFSW workflows are the finished product — tested, optimized, and integrated into an automated system that runs your business.",
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
        body: "Six months ago, system prompts were trade secrets. Today, they're documented, analyzed, and available. The companies building AI tools know this — which is why they're moving fast to add new capabilities. The window for early adopters to leverage this knowledge is NOW. People who understand prompt engineering at the system level will build the next generation of AI-powered businesses. Everyone else will pay them to do it.",
      },
      {
        heading: "What You Can Build Today",
        body: "With the patterns in this magazine, you can build: automated lead generation workflows that prospect, qualify, and outreach without manual intervention. Client onboarding systems that use quiz funnels to score and segment leads. Content generation pipelines that produce personalized output at scale. Monitoring systems that watch for changes and trigger automated responses. The tools are available. The patterns are documented. The only variable is execution.",
      },
      {
        heading: "Your Next Step",
        body: "This magazine gave you the theory. PFSW gives you the system. Pre-built workflows. Tested prompts. Automated execution. If you're serious about building AI-powered systems — not just reading about them — take the quiz below to see where you stand and how PFSW can accelerate your build.",
      },
    ],
  },
];
