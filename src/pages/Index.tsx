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
import { Brain, Users, CalendarCheck, BookOpen, Shield, Layers, Search, MessageSquare, Globe, Mail } from "lucide-react";
import heroBg from "@/assets/hero-bg.png";
import { useSEO } from "@/hooks/use-seo";

/* ── Data ── */
const featuredAgents = [
  {
    icon: Search,
    name: "Lead Prospector",
    desc: "Parse ICP criteria and return a structured list of qualified leads with contact data.",
  },
  {
    icon: Globe,
    name: "Website Proposal Agent",
    desc: "Scan any URL and generate a scoped project proposal with pricing and delivery timeline.",
  },
  {
    icon: MessageSquare,
    name: "Social Media Agent",
    desc: "Generate a week of on-brand content from a single topic — Lovable-builder audiences included.",
  },
  {
    icon: Mail,
    name: "Email Drip Agent",
    desc: "Build a 5-email onboarding or nurture sequence with subject lines and send cadence.",
  },
];

const pillars = [

  {
    icon: Brain,
    title: "Prompt Engine",
    description:
      "Lovable-ready system prompt architecture with persistent memory. Build structured, deployment-ready prompts that ship with your Lovable project.",
  },
  {
    icon: BookOpen,
    title: "Curated Library",
    description: "Battle-tested Lovable prompt blueprints across MVP, SaaS, e-commerce, agency, and internal tools — curated and approved by the institution.",
  },
  {
    icon: CalendarCheck,
    title: "Weekly Build Cohorts",
    description:
      "Mandatory weekly sessions built for Lovable builders — structured roll call, hot seats, and shipping commitments. No passive consumption.",
  },
  {
    icon: Users,
    title: "Architect Leads",
    description: "Certified leads run each cohort. Accountability through hierarchy, not motivation. Structure that Lovable builders can build inside.",
  },
  {
    icon: Shield,
    title: "Moderated Submissions",
    description: "Members submit Lovable-tested prompts for institutional review. Approved work enters the curated library for the full membership.",
  },
  {
    icon: Layers,
    title: "Session Memory",
    description: "Every Lovable generation is tracked. Context persists across sessions. Your prompt architecture compounds over time.",
  },
];

const process = [
  { step: "01", title: "Apply", desc: "Submit your application with a $5 processing fee. We review within 48 hours." },
  {
    step: "02",
    title: "Get Accepted",
    desc: "Accepted applicants activate membership at $197/month. No trials, no discounts.",
  },
  {
    step: "03",
    title: "Choose Your Cohort",
    desc: "Select a weekly build cohort. Attendance is mandatory. Structure is non-negotiable.",
  },
  {
    step: "04",
    title: "Build With Systems",
    desc: "Access the Prompt Engine, Library, and weekly sessions. Ship structured output every week.",
  },
];

const institutionalFaqs = [
  {
    q: "What is PFSW?",
    a: "A private prompt architecture institution. We teach builders how to construct structured AI system prompts — and hold them accountable through mandatory weekly cohorts.",
  },
  {
    q: "Why does the application cost $5?",
    a: "To filter. If $5 stops you, the program isn't for you. The fee ensures only serious operators enter the pipeline.",
  },
  {
    q: "How does PFSW help with Lovable specifically?",
    a: "Most Lovable builders hit the same wall: vague prompts produce broken builds. PFSW gives you structured system prompt architecture built for Lovable projects — persistent memory, scoped context, and deployment-ready blueprints so your Lovable builds ship the first time. The curated library contains Lovable-tested prompt blueprints across MVP, SaaS, e-commerce, and internal tools.",
  },
  {
    q: "What is the AI Agent Marketplace?",
    a: "A catalog of specialized institutional AI agents available to active members. Each agent runs a defined job — lead prospecting, website proposals, social content, SMS follow-ups, competitor intelligence, and more. Agents are leased monthly and can run on demand or on a recurring schedule. No prompt engineering required; the architecture is built in.",
  },
  {
    q: "What does $197/month include?",
    a: "Full access to the Prompt Engine with AI generation, the curated prompt library, weekly build cohorts, the member submission pipeline, and the AI Agent Marketplace.",
  },
  {
    q: "What happens if I miss sessions?",
    a: "Two consecutive missed sessions trigger a warning. Three triggers a review. Attendance is mandatory — this is an institution, not a community.",
  },
  { q: "Can I cancel?", a: "Yes. No contracts. But the prompts you build and the systems you install stay with you." },
  {
    q: "Is this coaching?",
    a: "No. This is a structured operating environment. You get frameworks, architecture tools, disciplined cadence, and institutional AI agents — not advice.",
  },
];

/* ── Page ── */
export default function Index() {
  const scrollTo = useCallback((id: string) => {
    document.querySelector(id)?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useSEO({
    title: "Stop Struggling With Lovable Prompts — PFSW Has the System",
    description: "Built for Lovable users who keep hitting walls. PFSW gives you structured AI system prompts, a curated Lovable prompt library, and weekly build cohorts so your projects actually ship. $197/month.",
    canonical: "https://system-install-lab.lovable.app/",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "PFSW — Structured Prompt Architecture for Lovable Builders",
      "description": "Built for Lovable users who keep hitting walls. Structured AI system prompts, a curated library, and weekly build cohorts so your Lovable projects actually ship.",
      "url": "https://system-install-lab.lovable.app/",
      "offers": {
        "@type": "Offer",
        "price": "197",
        "priceCurrency": "USD",
        "priceSpecification": { "@type": "UnitPriceSpecification", "billingDuration": "P1M" },
        "name": "PFSW Membership",
        "description": "AI Prompt Engine, curated Lovable prompt library, weekly build cohorts, and member submissions pipeline. Built for serious Lovable builders."
      },
      "mainEntity": {
        "@type": "FAQPage",
        "mainEntity": [
          { "@type": "Question", "name": "Who is PFSW for?", "acceptedAnswer": { "@type": "Answer", "text": "PFSW is built for Lovable users and AI builders who are tired of bad prompts producing broken results. We teach structured system prompt architecture and hold you accountable through mandatory weekly build cohorts." } },
          { "@type": "Question", "name": "How does PFSW help with Lovable specifically?", "acceptedAnswer": { "@type": "Answer", "text": "Most Lovable builders hit the same wall: vague prompts produce broken builds. PFSW gives you structured system prompt architecture built for Lovable projects — persistent memory, scoped context, and deployment-ready blueprints so your Lovable builds ship the first time." } },
          { "@type": "Question", "name": "What is the AI Agent Marketplace?", "acceptedAnswer": { "@type": "Answer", "text": "A catalog of specialized institutional AI agents available to active members. Each agent runs a defined job — lead prospecting, website proposals, social content, SMS follow-ups, competitor intelligence, and more. No prompt engineering required." } },
          { "@type": "Question", "name": "What does $197/month include?", "acceptedAnswer": { "@type": "Answer", "text": "Full access to the AI Prompt Engine, the curated Lovable prompt library, weekly build cohorts, the member submission pipeline, and the AI Agent Marketplace." } }
        ]
      }
    },
  });

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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            A Private Prompt Architecture Institution
          </motion.p>

          <motion.h1
            className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter text-foreground leading-[0.95] mb-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            People Fail. <span className="text-primary gold-text-glow">Systems Work.</span>
          </motion.h1>

          <motion.p
            className="text-xl md:text-2xl lg:text-3xl font-semibold text-foreground/90 tracking-tight mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
          >
            The Prompt Architecture System for Lovable Builders.
          </motion.p>

          <motion.p
            className="text-sm text-muted-foreground mb-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.7 }}
          >
            Application required · $197/month upon acceptance
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-5"
          >
            <Button asChild size="lg" className="tracking-wide text-lg px-10 py-6 font-bold gold-glow-strong">
              <Link to="/apply">Apply for Access</Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
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

      {/* ── AI Agent Marketplace Teaser ── */}
      <section className="py-20 md:py-28 border-t border-border bg-card/30">
        <div className="container">
          <SectionHeader
            title="AI Agent Marketplace"
            subtitle="Active members get access to a catalog of specialized institutional agents. Each one runs a defined job — no prompting required."
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {featuredAgents.map((agent) => (
              <div key={agent.name} className="rounded-2xl border border-border bg-card p-6 hover:border-primary/30 transition-all">
                <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <agent.icon className="h-4 w-4 text-primary" />
                </div>
                <h3 className="text-sm font-semibold text-foreground tracking-tight mb-1">{agent.name}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{agent.desc}</p>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <Button asChild size="sm" variant="outline" className="border-primary/30 text-foreground hover:bg-primary/10 tracking-wide">
              <Link to="/agents">Explore All Agents</Link>
            </Button>
            <span className="text-xs text-muted-foreground">10+ agents · Active members only</span>
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
