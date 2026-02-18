import { useState, useEffect, useCallback } from "react";
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
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, PenTool, Rocket, FileCode, Map, CalendarCheck,
  Sparkles, BookOpen, Users, Target, Zap, Eye, RotateCcw, Power,
} from "lucide-react";

/* ── Typewriter hook ── */
function useTypewriter(text: string, speed = 60, startDelay = 0, enabled = true) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!enabled) { setDisplayed(""); setDone(false); return; }
    setDisplayed("");
    setDone(false);
    let i = 0;
    const timeout = setTimeout(() => {
      const interval = setInterval(() => {
        i++;
        setDisplayed(text.slice(0, i));
        if (i >= text.length) { clearInterval(interval); setDone(true); }
      }, speed);
      return () => clearInterval(interval);
    }, startDelay);
    return () => clearTimeout(timeout);
  }, [text, speed, startDelay, enabled]);

  return { displayed, done };
}

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

/* ── Grid Cell ── */
function GridCell({ delay, lit }: { delay: number; lit: boolean }) {
  return (
    <motion.div
      className="relative border border-primary/10 rounded-sm overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: lit ? 1 : 0.15 }}
      transition={{ duration: 0.8, delay: lit ? delay : 0 }}
    >
      {lit && (
        <>
          <motion.div
            className="absolute inset-0 bg-gradient-to-br from-primary/8 to-transparent"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1.2, delay: delay + 0.2 }}
          />
          <motion.div
            className="absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-primary/40"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.4, delay: delay + 0.5 }}
          />
          {/* Random "data lines" */}
          <motion.div
            className="absolute bottom-2 left-2 right-4 h-px bg-primary/20"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.6, delay: delay + 0.7 }}
            style={{ transformOrigin: "left" }}
          />
          <motion.div
            className="absolute bottom-4 left-2 right-8 h-px bg-primary/15"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.5, delay: delay + 0.9 }}
            style={{ transformOrigin: "left" }}
          />
        </>
      )}
    </motion.div>
  );
}

/* ── Light Switch ── */
function LightSwitch({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="group relative flex items-center gap-3 px-5 py-3 rounded-full border border-border bg-card/80 backdrop-blur-sm transition-all hover:border-primary/40 hover:gold-glow"
      aria-label="Turn on the light"
    >
      <motion.div
        className="relative w-8 h-8 rounded-full flex items-center justify-center"
        animate={{
          backgroundColor: on ? "hsl(48 96% 53% / 0.2)" : "transparent",
          boxShadow: on ? "0 0 20px hsl(48 96% 53% / 0.4)" : "none",
        }}
        transition={{ duration: 0.5 }}
      >
        <Power className={`w-4 h-4 transition-colors duration-500 ${on ? "text-primary" : "text-muted-foreground"}`} />
      </motion.div>
      <span className="text-sm tracking-wide text-muted-foreground group-hover:text-foreground transition-colors">
        {on ? "Systems online" : "Turn on the light"}
      </span>
    </button>
  );
}

/* ── Page ── */
export default function Index() {
  const [lightsOn, setLightsOn] = useState(false);

  const headline = "People Fail. Systems Work.";
  const subheadline = "PFSW is the execution-first platform for serious builders. We don't sell motivation — we install systems.";

  const { displayed: typedHeadline, done: headlineDone } = useTypewriter(headline, 50, 400, lightsOn);
  const { displayed: typedSub, done: subDone } = useTypewriter(subheadline, 25, 400 + headline.length * 50 + 200, lightsOn);

  const scrollTo = useCallback((id: string) => {
    document.querySelector(id)?.scrollIntoView({ behavior: "smooth" });
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Texture overlay */}
        <div className="absolute inset-0 hero-noise pointer-events-none z-[1]" />
        {/* Glossy base */}
        <div className="absolute inset-0 glossy-surface" />

        {/* Glow orbs — visible when lights on */}
        <AnimatePresence>
          {lightsOn && (
            <>
              <motion.div
                className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full"
                style={{ background: "radial-gradient(circle, hsl(48 96% 53% / 0.12) 0%, transparent 70%)" }}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ duration: 1.5 }}
              />
              <motion.div
                className="absolute top-1/4 right-1/4 w-[400px] h-[400px] rounded-full"
                style={{ background: "radial-gradient(circle, hsl(48 96% 53% / 0.06) 0%, transparent 70%)" }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 2, delay: 0.3 }}
              />
            </>
          )}
        </AnimatePresence>

        <div className="container relative z-10 text-center py-20">
          {/* Light switch */}
          <motion.div
            className="flex justify-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <LightSwitch on={lightsOn} onToggle={() => setLightsOn(true)} />
          </motion.div>

          {/* Headline with typewriter */}
          <div className="min-h-[80px] md:min-h-[100px] lg:min-h-[120px] mb-6">
            <AnimatePresence>
              {lightsOn ? (
                <motion.h1
                  className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground leading-[1.05]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {typedHeadline.includes("Systems") ? (
                    <>
                      {typedHeadline.split("Systems")[0]}
                      <span className="text-primary gold-text-glow">Systems{typedHeadline.split("Systems")[1] || ""}</span>
                    </>
                  ) : (
                    typedHeadline
                  )}
                  {!headlineDone && (
                    <span className="inline-block w-[3px] h-[0.8em] bg-primary ml-1 animate-pulse" />
                  )}
                </motion.h1>
              ) : (
                <motion.h1
                  className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-muted-foreground/20 leading-[1.05]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1, delay: 0.5 }}
                >
                  _ _ _
                </motion.h1>
              )}
            </AnimatePresence>
          </div>

          {/* Subheadline */}
          <div className="min-h-[60px] md:min-h-[50px] mb-10 max-w-2xl mx-auto">
            <AnimatePresence>
              {lightsOn && headlineDone && (
                <motion.p
                  className="text-lg md:text-xl text-muted-foreground leading-relaxed"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {typedSub}
                  {!subDone && (
                    <span className="inline-block w-[2px] h-[0.8em] bg-muted-foreground ml-0.5 animate-pulse" />
                  )}
                </motion.p>
              )}
            </AnimatePresence>
          </div>

          {/* CTAs */}
          <AnimatePresence>
            {lightsOn && subDone && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="space-y-6"
              >
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Button asChild size="lg" className="tracking-wide px-8 gold-glow-strong">
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
                <p className="text-sm text-muted-foreground tracking-wide">
                  Built for operators. Designed for outcomes.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Grid visual */}
          <motion.div
            className="mt-16 rounded-2xl border border-border bg-card/50 backdrop-blur-sm p-4 md:p-6 relative overflow-hidden"
            animate={{ borderColor: lightsOn ? "hsl(48 96% 53% / 0.15)" : "hsl(240 8% 16%)" }}
            transition={{ duration: 1 }}
          >
            {lightsOn && (
              <motion.div
                className="absolute inset-0 rounded-2xl"
                style={{ boxShadow: "inset 0 1px 0 0 hsl(48 96% 53% / 0.1), inset 0 -1px 0 0 hsl(240 10% 4% / 0.5)" }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1 }}
              />
            )}
            <div className="grid grid-cols-6 md:grid-cols-8 grid-rows-3 gap-1 md:gap-1.5">
              {Array.from({ length: 24 }).map((_, i) => (
                <GridCell key={i} delay={0.05 * i} lit={lightsOn} />
              ))}
            </div>
            {/* Scanline effect */}
            {lightsOn && (
              <motion.div
                className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent"
                initial={{ top: 0 }}
                animate={{ top: "100%" }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "linear", repeatDelay: 1 }}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent pointer-events-none" />
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
