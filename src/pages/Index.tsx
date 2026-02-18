import { useCallback } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { SectionHeader } from "@/components/SectionHeader";
import { FeatureCard } from "@/components/FeatureCard";
import { FAQAccordion } from "@/components/FAQAccordion";
import { CTASection } from "@/components/CTASection";
import { Footer } from "@/components/Footer";
import { motion } from "framer-motion";
import {
  Brain, Users, CalendarCheck, BookOpen, Shield, Layers,
} from "lucide-react";
import heroBg from "@/assets/hero-bg.png";

/* ── Data ── */
const pillars = [
  { icon: Brain, title: "Prompt Engine", description: "AI-powered prompt architecture with persistent memory. Build structured, deployment-ready system prompts." },
  { icon: BookOpen, title: "Curated Library", description: "Battle-tested prompt blueprints across MVP, SaaS, e-commerce, agency, and internal tools." },
  { icon: CalendarCheck, title: "Weekly Build Cohorts", description: "Mandatory weekly sessions with structured roll call, hot seats, and commitments. No passive consumption." },
  { icon: Users, title: "Architect Leads", description: "Certified leads run each cohort. Accountability through hierarchy, not motivation." },
  { icon: Shield, title: "Moderated Submissions", description: "Members submit prompts for review. Approved work enters the institutional library." },
  { icon: Layers, title: "Session Memory", description: "Every generation is tracked. Context persists across sessions. Your architecture compounds." },
];

const process = [
  { step: "01", title: "Apply", desc: "Submit your application with a $5 processing fee. We review within 48 hours." },
  { step: "02", title: "Get Accepted", desc: "Accepted applicants activate membership at $197/month. No trials, no discounts." },
  { step: "03", title: "Choose Your Cohort", desc: "Select a weekly build cohort. Attendance is mandatory. Structure is non-negotiable." },
  { step: "04", title: "Build With Systems", desc: "Access the Prompt Engine, Library, and weekly sessions. Ship structured output every week." },
];

const institutionalFaqs = [
  { q: "What is PFSW?", a: "A private prompt architecture institution. We teach builders how to construct structured AI system prompts — and hold them accountable through mandatory weekly cohorts." },
  { q: "Why does the application cost $5?", a: "To filter. If $5 stops you, the program isn't for you. The fee ensures only serious operators enter the pipeline." },
  { q: "What does $197/month include?", a: "Full access to the Prompt Engine with AI generation, the curated prompt library, weekly build cohorts, and the member submission pipeline." },
  { q: "What happens if I miss sessions?", a: "Two consecutive missed sessions trigger a warning. Three triggers a review. Attendance is mandatory — this is an institution, not a community." },
  { q: "Can I cancel?", a: "Yes. No contracts. But the prompts you build and the systems you install stay with you." },
  { q: "Is this coaching?", a: "No. This is a structured operating environment. You get frameworks, architecture tools, and disciplined cadence — not advice." },
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
        <img src={heroBg} alt="" className="absolute inset-0 w-full h-full object-cover object-center" />
        <div className="absolute inset-0 bg-black/75" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60" />

        <div className="container relative z-10 text-center py-24 md:py-32">
          <motion.p
            className="text-xs md:text-sm uppercase tracking-[0.3em] text-primary mb-8 font-medium"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.1 }}
          >
            A Private Prompt Architecture Institution
          </motion.p>

          <motion.h1
            className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter text-foreground leading-[0.95] mb-8"
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }}
          >
            Build Structured Systems{" "}
            <span className="text-primary gold-text-glow">With AI.</span>
          </motion.h1>

          <motion.p
            className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto mb-4"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.5 }}
          >
            Mandatory weekly build cohorts. AI-powered prompt architecture. Institutional accountability.
          </motion.p>

          <motion.p
            className="text-sm text-muted-foreground mb-12"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.7 }}
          >
            Application required · $197/month upon acceptance
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.9 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-5"
          >
            <Button asChild size="lg" className="tracking-wide text-lg px-10 py-6 font-bold gold-glow-strong">
              <Link to="/apply">Apply for Access</Link>
            </Button>
            <Button
              variant="outline" size="lg"
              className="tracking-wide text-lg px-10 py-6 font-bold border-primary/30 text-foreground hover:bg-primary/10"
              onClick={() => scrollTo("#doctrine")}
            >
              Read the Doctrine
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ── What You Get ── */}
      <section className="py-20 md:py-28">
        <div className="container">
          <SectionHeader id="pillars" title="What You Get" subtitle="Six pillars of structured prompt architecture." />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {pillars.map((p) => (
              <FeatureCard key={p.title} icon={p.icon} title={p.title} description={p.description} />
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="py-20 md:py-28 border-t border-border">
        <div className="container">
          <SectionHeader id="doctrine" title="How It Works" subtitle="Four steps. No shortcuts." />
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {process.map((p) => (
              <div key={p.step} className="rounded-2xl border border-border bg-card p-6 md:p-8">
                <span className="text-3xl font-bold text-primary gold-text-glow tracking-tight">{p.step}</span>
                <h3 className="text-lg font-semibold text-foreground mt-4 mb-2 tracking-tight">{p.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="py-20 md:py-28 border-t border-border">
        <div className="container max-w-2xl text-center">
          <SectionHeader title="Pricing" subtitle="One membership. Full access. No tiers." />
          <div className="rounded-2xl border border-primary/30 bg-card p-10 md:p-14 gold-glow">
            <p className="text-xs uppercase tracking-[0.2em] text-primary mb-6 font-medium">Membership</p>
            <div className="flex items-baseline justify-center gap-2 mb-4">
              <span className="text-5xl md:text-6xl font-black text-foreground tracking-tight">$197</span>
              <span className="text-muted-foreground text-lg">/month</span>
            </div>
            <p className="text-sm text-muted-foreground mb-8 leading-relaxed max-w-md mx-auto">
              Prompt Engine · Curated Library · Weekly Cohort · Member Submissions · Session Memory
            </p>
            <Button asChild size="lg" className="tracking-wide px-10 py-6 text-lg font-bold gold-glow-strong">
              <Link to="/apply">Apply for Access</Link>
            </Button>
            <p className="text-xs text-muted-foreground mt-6">$5 application fee · Accepted applicants only</p>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-20 md:py-28 border-t border-border">
        <div className="container">
          <SectionHeader id="faq" title="FAQ" />
          <FAQAccordion items={institutionalFaqs} />
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="border-t border-border">
        <div className="container">
          <CTASection
            headline="Stop prompting randomly. Build with architecture."
            primaryLabel="Apply for Access"
            primaryTo="/apply"
            secondaryLabel="Read the Doctrine"
            secondaryTo="/magazine/inside"
            disclaimer="PFSW is not for hobbyists. Application required. $197/month upon acceptance."
          />
        </div>
      </section>

      <Footer />
    </div>
  );
}
