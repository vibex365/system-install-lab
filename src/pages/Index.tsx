import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { SectionHeader } from "@/components/SectionHeader";
import { FeatureCard } from "@/components/FeatureCard";
import { ProofCard } from "@/components/ProofCard";
import { PrinciplesList } from "@/components/PrinciplesList";
import { FAQAccordion } from "@/components/FAQAccordion";
import { CTASection } from "@/components/CTASection";
import { Footer } from "@/components/Footer";
import {
  Search,
  PenTool,
  Rocket,
  FileCode,
  Map,
  CalendarCheck,
  Sparkles,
  BookOpen,
  Users,
  Target,
  Zap,
  Eye,
  RotateCcw,
} from "lucide-react";

const methodCards = [
  {
    icon: Search,
    title: "Diagnose",
    description: "Identify where people fail — the gaps, bottlenecks, and broken loops in your execution.",
    bullets: ["Audit your current workflow", "Map failure points and friction"],
  },
  {
    icon: PenTool,
    title: "Design",
    description: "Build the system that replaces willpower with structure.",
    bullets: ["Create repeatable operating blueprints", "Define cadence, constraints, and checkpoints"],
  },
  {
    icon: Rocket,
    title: "Deploy",
    description: "Execute weekly with feedback loops that compound.",
    bullets: ["Run sprint cycles with built-in reviews", "Iterate based on output, not opinion"],
  },
];

const deliverables = [
  { icon: FileCode, title: "MVP Blueprints", description: "Validated frameworks to go from zero to shipped." },
  { icon: Map, title: "System Architecture Maps", description: "Visual operating models for your entire workflow." },
  { icon: CalendarCheck, title: "Weekly Execution Sprints", description: "Structured cadence with clear deliverables every 7 days." },
  { icon: Sparkles, title: "Prompt Packs", description: "Lovable-ready prompts engineered for builder workflows." },
  { icon: BookOpen, title: "Templates + SOP Library", description: "Battle-tested templates for repeatable operations." },
  { icon: Users, title: "Operator Community", description: "Direct access to serious builders. No noise, no fluff." },
];

const outcomes = [
  { icon: Target, label: "Focus — Know exactly what to build next, every single day." },
  { icon: Zap, label: "Velocity — Ship faster because the system removes decision fatigue." },
  { icon: Eye, label: "Clarity — See what matters. Ignore what doesn't." },
  { icon: RotateCcw, label: "Repeatability — Build once, run forever." },
];

const proofCards = [
  { title: "From idea to MVP in 10 days", description: "Founder used PFSW sprint system to validate and ship before the market moved." },
  { title: "Offer rebuilt, churn cut", description: "Operator restructured their delivery system. Retention up, complexity down." },
  { title: "Execution cadence installed", description: "Creator went from scattered to shipping weekly with a 5-step operating loop." },
];

export default function Index() {
  const scrollTo = (id: string) => {
    document.querySelector(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* ── Hero ── */}
      <section className="relative pt-32 pb-20 md:pt-44 md:pb-32 overflow-hidden">
        {/* Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[120px] animate-glow-pulse pointer-events-none" />

        <div className="container relative z-10">
          <div className="max-w-3xl">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground leading-[1.05]">
              People Fail.{" "}
              <span className="text-primary gold-text-glow">Systems Work.</span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed">
              PFSW is the execution-first platform for serious builders. We don't sell motivation — we install systems.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" className="tracking-wide px-8">
                <Link to="/apply">Apply to Join</Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="tracking-wide px-8 border-primary/30 text-foreground hover:bg-primary/10"
                onClick={() => scrollTo("#method")}
              >
                See the Method
              </Button>
            </div>
            <p className="mt-6 text-sm text-muted-foreground tracking-wide">
              Built for operators. Designed for outcomes.
            </p>
          </div>

          {/* Hero visual placeholder */}
          <div className="mt-16 rounded-2xl border border-border bg-card p-8 md:p-12 relative overflow-hidden">
            <div className="grid grid-cols-4 grid-rows-3 gap-px opacity-20">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="h-16 md:h-24 border border-primary/30 rounded-sm" />
              ))}
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
          </div>
        </div>
      </section>

      {/* ── Method ── */}
      <section className="py-20 md:py-28">
        <div className="container">
          <SectionHeader id="method" title="The PFSW Method" subtitle="Three phases. One system. Compounding results." />
          <div className="grid md:grid-cols-3 gap-6">
            {methodCards.map((card) => (
              <FeatureCard key={card.title} {...card} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Deliverables ── */}
      <section className="py-20 md:py-28 border-t border-border">
        <div className="container">
          <SectionHeader id="deliverables" title="What You Get" subtitle="Everything you need to operate — nothing you don't." />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {deliverables.map((d) => (
              <FeatureCard key={d.title} icon={d.icon} title={d.title} description={d.description} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Proof ── */}
      <section className="py-20 md:py-28 border-t border-border">
        <div className="container">
          <SectionHeader id="proof" title="Proof" subtitle="What changes when you operate with systems." />
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
            <div className="space-y-6">
              {outcomes.map((o) => (
                <div key={o.label} className="flex items-start gap-4">
                  <div className="mt-1 shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <o.icon className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-foreground leading-relaxed">{o.label}</p>
                </div>
              ))}
            </div>
            <div className="space-y-4">
              {proofCards.map((card) => (
                <ProofCard key={card.title} {...card} />
              ))}
              <p className="text-xs text-muted-foreground mt-4 tracking-wide">
                Proof is curated. No hype metrics.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Principles ── */}
      <section className="py-20 md:py-28 border-t border-border">
        <div className="container">
          <SectionHeader title="Principles" subtitle="The operating beliefs behind every system we build." />
          <PrinciplesList />
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-20 md:py-28 border-t border-border">
        <div className="container">
          <SectionHeader id="faq" title="FAQ" />
          <FAQAccordion />
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="border-t border-border">
        <div className="container">
          <CTASection
            headline="Stop relying on motivation. Install a system."
            primaryLabel="Apply to Join"
            primaryTo="/apply"
            secondaryLabel="Join Waitlist"
            secondaryTo="/waitlist"
            disclaimer="PFSW is not for dabblers. If you want leverage, apply."
          />
        </div>
      </section>

      <Footer />
    </div>
  );
}
