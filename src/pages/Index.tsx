import { useCallback } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { SectionHeader } from "@/components/SectionHeader";
import { FAQAccordion } from "@/components/FAQAccordion";
import { CTASection } from "@/components/CTASection";
import { Footer } from "@/components/Footer";
import { motion } from "framer-motion";
import { Zap, Bot, Search, Mail, Phone, Target, BarChart3, MessageSquare, Check } from "lucide-react";
import { useSEO } from "@/hooks/use-seo";
import heroPortrait from "@/assets/hero-portrait.png";

const agents = [
  { icon: Search, name: "Scout Agent", desc: "Discovers leads by niche and location via web search. Returns names, phones, emails, websites." },
  { icon: Target, name: "Qualifier Agent", desc: "AI-scores every lead for fit. Ranks your prospects so you only pursue the best ones." },
  { icon: Mail, name: "Email Outreach", desc: "Sends personalized 3-part email sequences with pain points and booking CTAs." },
  { icon: MessageSquare, name: "SMS Agent", desc: "Automated text message follow-ups that reference audit findings and drive responses." },
  { icon: Phone, name: "Voice Booker", desc: "AI voice agent calls leads, pitches your offer, and books meetings on your calendar." },
  { icon: BarChart3, name: "Intel Agent", desc: "Researches competitor strategies, pricing, and positioning in your niche." },
];

const tiers = [
  {
    name: "Starter",
    price: "$47",
    period: "/mo",
    features: ["3 quiz funnels", "100 leads/month", "Email follow-up agent", "1 campaign"],
    cta: "Start Free Trial",
    highlighted: false,
  },
  {
    name: "Growth",
    price: "$97",
    period: "/mo",
    features: ["Unlimited funnels", "500 leads/month", "SMS + email agents", "5 campaigns", "Booking agent"],
    cta: "Start Growing",
    highlighted: true,
  },
  {
    name: "Scale",
    price: "$197",
    period: "/mo",
    features: ["Everything in Growth", "2,000 leads/month", "Voice agent", "Autonomous workflows", "Competitor intel", "White-label funnels"],
    cta: "Scale Now",
    highlighted: false,
  },
];

const steps = [
  { num: "01", title: "Describe Your Goal", desc: "Type what you want: \"Get me 50 MLM leads in Dallas interested in health supplements.\"" },
  { num: "02", title: "AI Plans the Workflow", desc: "The orchestrator decomposes your goal into tasks — scout, qualify, email, SMS, book." },
  { num: "03", title: "Agents Execute", desc: "Each agent runs its step automatically. Scout finds leads, qualifier scores them, outreach begins." },
  { num: "04", title: "You Close", desc: "Qualified leads appear in your pipeline. Calls get booked. You show up and close." },
];

const faqs = [
  { q: "Who is PFSW for?", a: "MLM marketers, affiliate promoters, coaches, and work-from-home entrepreneurs who want AI agents to find leads, qualify them, and book calls — automatically." },
  { q: "Do I need technical skills?", a: "No. You describe your goal in plain English. The AI decomposes it into tasks and agents handle everything — from lead discovery to outreach to booking." },
  { q: "How does the workflow system work?", a: "You type a goal like 'Find 50 MLM prospects in Dallas.' The orchestrator creates a multi-step plan: Scout → Qualify → Email → SMS → Book. Each step runs automatically." },
  { q: "What niches does PFSW support?", a: "MLM/Network Marketing, Affiliate Marketing, Online Coaching, and Work-From-Home. Each niche has custom pipeline stages, quiz funnels, and outreach templates." },
  { q: "Can I cancel anytime?", a: "Yes. No contracts. Cancel anytime. All your leads, funnels, and data stay with you." },
];

export default function Index() {
  const scrollTo = useCallback((id: string) => {
    document.querySelector(id)?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useSEO({
    title: "PFSW — AI Agents That Find Leads & Book Calls",
    description: "Autonomous AI agent platform for MLM, affiliate, and coaching entrepreneurs. Describe a goal, agents execute end-to-end. Scout, qualify, email, SMS, voice call, book.",
    canonical: "https://system-install-lab.lovable.app/",
  });

  return (
    <div className="min-h-screen bg-background glossy-surface">
      <Navbar />

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
        <div className="absolute inset-0 flex justify-end items-end overflow-hidden">
          <img src={heroPortrait} alt="" className="h-[85%] object-contain object-bottom opacity-20 md:opacity-30 select-none pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-primary/5 blur-[150px]" />

        <div className="container relative z-10 text-center py-24 md:py-32">
          <motion.div
            className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 mb-8"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Bot className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium text-primary">Autonomous AI Agent Platform</span>
          </motion.div>

          <motion.h1
            className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter text-foreground leading-[0.95] mb-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            People Fail.{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Systems Work.
            </span>
          </motion.h1>

          <motion.p
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
          >
            Describe a goal. AI agents find leads, qualify them, send outreach, and book calls — automatically.
          </motion.p>

          <motion.p
            className="text-sm text-muted-foreground/60 mb-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Built for MLM · Affiliate · Coaching · Home Business
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button asChild size="lg" className="tracking-wide text-lg px-10 py-6 font-bold gold-glow-strong">
              <Link to="/login">Get Started Free</Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="tracking-wide text-lg px-10 py-6 font-bold border-primary/30 text-foreground hover:bg-primary/10"
              onClick={() => scrollTo("#how-it-works")}
            >
              See How It Works
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Goal Input Preview */}
      <section className="py-20 md:py-28 border-t border-border">
        <div className="container max-w-3xl">
          <SectionHeader
            title="One Goal. Full Execution."
            subtitle="Type what you want. The system figures out the rest."
          />
          <div className="rounded-2xl border border-border bg-card p-8">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold text-foreground uppercase tracking-wider">Goal Input</span>
            </div>
            <div className="rounded-xl border border-border bg-background p-4 mb-6">
              <p className="text-sm text-muted-foreground italic">
                "Get me 50 MLM leads in Dallas who are interested in health supplements"
              </p>
            </div>
            <div className="space-y-3">
              {["✅ Scout — Found 127 potential leads", "✅ Qualifier — Scored & ranked top 50", "🔄 Email Outreach — Sending sequences...", "⏳ SMS Follow-up — Waiting", "⏳ Book Calls — Waiting"].map((step, i) => (
                <div key={i} className="flex items-center gap-3 text-sm">
                  <span className={i < 2 ? "text-emerald-400" : i === 2 ? "text-primary" : "text-muted-foreground"}>{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 md:py-28 border-t border-border">
        <div className="container">
          <SectionHeader id="how-it-works" title="How It Works" subtitle="From goal to booked calls in four steps." />
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((s) => (
              <div key={s.num} className="rounded-2xl border border-border bg-card p-6 md:p-8">
                <span className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent tracking-tight">{s.num}</span>
                <h3 className="text-lg font-semibold text-foreground mt-4 mb-2 tracking-tight">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Agent Grid */}
      <section className="py-20 md:py-28 border-t border-border bg-card/30">
        <div className="container">
          <SectionHeader title="The Agent Stack" subtitle="Six AI agents working in sequence. No manual work required." />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map((a) => (
              <div key={a.name} className="rounded-2xl border border-border bg-card p-6 hover:border-primary/30 transition-all">
                <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <a.icon className="h-4 w-4 text-primary" />
                </div>
                <h3 className="text-sm font-semibold text-foreground tracking-tight mb-1">{a.name}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 md:py-28 border-t border-border" id="pricing">
        <div className="container">
          <SectionHeader title="Simple Pricing" subtitle="Start free. Scale when you're ready." />
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {tiers.map((t) => (
              <div
                key={t.name}
                className={`rounded-2xl border p-8 ${t.highlighted ? "border-primary/50 bg-card gold-glow" : "border-border bg-card"}`}
              >
                {t.highlighted && (
                  <span className="inline-block text-[10px] uppercase tracking-[0.15em] text-primary font-semibold mb-4 bg-primary/10 px-2 py-0.5 rounded-full">Most Popular</span>
                )}
                <h3 className="text-lg font-bold text-foreground mb-1">{t.name}</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-black text-foreground">{t.price}</span>
                  <span className="text-muted-foreground text-sm">{t.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button asChild className={`w-full ${t.highlighted ? "gold-glow-strong" : ""}`} variant={t.highlighted ? "default" : "outline"}>
                  <Link to="/login">{t.cta}</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 md:py-28 border-t border-border">
        <div className="container">
          <SectionHeader id="faq" title="FAQ" />
          <FAQAccordion items={faqs} />
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-border">
        <div className="container">
          <CTASection
            headline="Stop doing manual outreach. Let AI agents work while you sleep."
            primaryLabel="Get Started Free"
            primaryTo="/login"
            secondaryLabel="See Pricing"
            secondaryTo="/#pricing"
            disclaimer="No credit card required. Start with Starter plan free trial."
          />
        </div>
      </section>

      <Footer />
    </div>
  );
}
