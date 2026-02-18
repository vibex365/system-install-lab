import { useCallback } from "react";
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
import { motion } from "framer-motion";
import {
  Search, PenTool, Rocket, FileCode, Map, CalendarCheck,
  Sparkles, BookOpen, Users, Target, Zap, Eye, RotateCcw,
} from "lucide-react";
import heroBg from "@/assets/hero-bg.png";

/* ── Data ── */
const methodCards = [
  { icon: Search, title: "Diagnose", description: "Identify where people fail — the gaps, bottlenecks, and broken loops in your execution.", bullets: ["Audit your current workflow", "Map failure points and friction"] },
  { icon: PenTool, title: "Design", description: "Build the system that replaces willpower with structure.", bullets: ["Create repeatable operating blueprints", "Define cadence, constraints, and checkpoints"] },
  { icon: Rocket, title: "Deploy", description: "Execute weekly with feedback loops that compound.", bullets: ["Run sprint cycles with built-in reviews", "Iterate based on output, not opinion"] },
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

/* ── Page ── */
export default function Index() {
  const scrollTo = useCallback((id: string) => {
    document.querySelector(id)?.scrollIntoView({ behavior: "smooth" });
  }, []);

  return (
    <div className="min-h-screen bg-background glossy-surface">
      <Navbar />

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Photo background */}
        <img
          src={heroBg}
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/70" />
        {/* Bottom gradient fade */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/50" />

        <div className="container relative z-10 text-center py-24 md:py-32">
          <motion.h1
            className="text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter text-foreground leading-[0.95] mb-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            People Fail.{" "}
            <span className="text-primary gold-text-glow">Systems Work.</span>
          </motion.h1>

          <motion.p
            className="text-lg md:text-xl lg:text-2xl text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
          >
            PFSW is the execution-first platform for serious builders. We don't sell motivation — we install systems.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="space-y-6"
          >
            <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
              <Button asChild size="lg" className="tracking-wide text-lg px-10 py-6 font-bold gold-glow-strong">
                <Link to="/apply">Apply to Join</Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="tracking-wide text-lg px-10 py-6 font-bold border-primary/30 text-foreground hover:bg-primary/10"
                onClick={() => scrollTo("#method")}
              >
                See the Method
              </Button>
            </div>
            <p className="text-sm text-muted-foreground tracking-wide">
              Built for operators. Designed for outcomes.
            </p>
          </motion.div>
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
              <p className="text-xs text-muted-foreground mt-4 tracking-wide">Proof is curated. No hype metrics.</p>
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
