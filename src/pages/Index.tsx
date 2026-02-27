import { useCallback } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { SectionHeader } from "@/components/SectionHeader";
import { FAQAccordion } from "@/components/FAQAccordion";
import { CTASection } from "@/components/CTASection";
import { Footer } from "@/components/Footer";
import { motion } from "framer-motion";
import {
  Zap, Bot, Search, Mail, Phone, Target,
  BarChart3, MessageSquare, Check, ArrowRight,
  Users, TrendingUp, Calendar,
} from "lucide-react";
import { useSEO } from "@/hooks/use-seo";
import heroPortrait from "@/assets/hero-portrait.png";

const agents = [
  { icon: Search, name: "Scout Agent", desc: "Finds prospects in your niche and location. Returns names, phones, emails, and websites — no manual searching." },
  { icon: Target, name: "Qualifier Agent", desc: "AI-scores every prospect for fit. Only the highest-potential leads make it to your pipeline." },
  { icon: Mail, name: "Email Outreach", desc: "Sends personalized multi-step email sequences with pain points and booking CTAs on autopilot." },
  { icon: MessageSquare, name: "SMS Agent", desc: "Automated text follow-ups that drive replies and move prospects toward booking a call." },
  { icon: Phone, name: "Voice Booker", desc: "AI voice agent calls your leads, pitches your offer, and books meetings directly on your calendar." },
  { icon: BarChart3, name: "Intel Agent", desc: "Scans competitor positioning, pricing, and strategies so you always have the edge in your market." },
];

const tiers = [
  {
    name: "Starter",
    price: "$47",
    period: "/mo",
    features: ["100 leads/month", "Email outreach agent", "1 active workflow", "Basic CRM pipeline"],
    cta: "Get Started",
    highlighted: false,
  },
  {
    name: "Growth",
    price: "$97",
    period: "/mo",
    features: ["500 leads/month", "SMS + email agents", "5 active workflows", "Booking agent", "Full CRM"],
    cta: "Start Growing",
    highlighted: true,
  },
  {
    name: "Scale",
    price: "$197",
    period: "/mo",
    features: ["Everything in Growth", "2,000 leads/month", "Voice agent", "Unlimited workflows", "Competitor intel", "Priority support"],
    cta: "Scale Now",
    highlighted: false,
  },
];

const steps = [
  { num: "01", icon: Target, title: "Describe Your Goal", desc: "Tell the system what you need: \"Find 50 health supplement prospects in Dallas and book calls.\"" },
  { num: "02", icon: Zap, title: "AI Plans the Workflow", desc: "The orchestrator breaks your goal into executable steps — scout, qualify, outreach, book." },
  { num: "03", icon: Bot, title: "Agents Execute", desc: "Each agent runs automatically. Leads are found, scored, contacted, and followed up — no manual work." },
  { num: "04", icon: Calendar, title: "You Close", desc: "Qualified prospects land in your pipeline with calls booked. You show up and close deals." },
];

const stats = [
  { value: "10x", label: "Faster Lead Gen" },
  { value: "85%", label: "Qualification Accuracy" },
  { value: "3x", label: "More Booked Calls" },
  { value: "24/7", label: "Always Running" },
];

const faqs = [
  { q: "Who is PFSW for?", a: "Digital entrepreneurs — network marketers, affiliate promoters, coaches, and online business owners who want AI to handle prospecting, outreach, and booking so they can focus on closing." },
  { q: "Do I need technical skills?", a: "No. Describe your goal in plain English. The system decomposes it into tasks and agents execute everything end-to-end." },
  { q: "How does the workflow system work?", a: "You type a goal like 'Find 50 prospects in Dallas interested in supplements.' The orchestrator builds a plan: Scout → Qualify → Email → SMS → Book. Every step runs automatically." },
  { q: "What kind of businesses use this?", a: "Network marketing, affiliate marketing, online coaching, e-commerce, and any digital business that needs a steady flow of qualified prospects and booked calls." },
  { q: "Can I cancel anytime?", a: "Yes. No contracts. Cancel anytime. Your leads, workflows, and data stay with you." },
];

export default function Index() {
  const scrollTo = useCallback((id: string) => {
    document.querySelector(id)?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useSEO({
    title: "PFSW — AI Agents for Digital Entrepreneurs",
    description: "Autonomous AI agents that find leads, qualify prospects, send outreach, and book calls for digital entrepreneurs. Describe a goal — the system executes.",
    canonical: "https://system-install-lab.lovable.app/",
  });

  return (
    <div className="min-h-screen bg-background glossy-surface">
      <Navbar />

      {/* ─── Hero ─── */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Background layers */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-background to-accent/5" />
        
        {/* Portrait — dramatic right side */}
        <div className="absolute inset-0 flex justify-end items-end overflow-hidden">
          <img
            src={heroPortrait}
            alt=""
            className="h-[90%] md:h-full object-contain object-bottom opacity-30 md:opacity-50 select-none pointer-events-none translate-x-[5%]"
          />
          {/* Gradient masks */}
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/20" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/40" />
        </div>

        {/* Animated magnifying glass */}
        <motion.div
          className="absolute z-20 hidden md:block"
          initial={{ x: "60vw", y: "30vh" }}
          animate={{
            x: ["60vw", "55vw", "65vw", "58vw", "62vw", "60vw"],
            y: ["30vh", "40vh", "35vh", "45vh", "32vh", "30vh"],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="relative">
            <div className="w-28 h-28 rounded-full border-4 border-primary/40 bg-primary/5 backdrop-blur-sm flex items-center justify-center">
              <Search className="w-10 h-10 text-primary/60" />
            </div>
            <div className="absolute -bottom-4 -right-4 w-8 h-1.5 bg-primary/40 rounded-full rotate-45 origin-left" />
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-primary/20"
              animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2.5, repeat: Infinity }}
            />
          </div>
        </motion.div>

        {/* Ambient glow */}
        <div className="absolute top-1/3 left-1/4 w-[600px] h-[600px] rounded-full bg-primary/8 blur-[200px]" />
        <div className="absolute bottom-1/4 right-1/3 w-[400px] h-[400px] rounded-full bg-accent/6 blur-[150px]" />

        {/* Hero content — left aligned */}
        <div className="container relative z-10 py-28 md:py-36">
          <div className="max-w-2xl">
            <motion.div
              className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 mb-8"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Bot className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-medium text-primary tracking-wide">Built for Digital Entrepreneurs</span>
            </motion.div>

            <motion.h1
              className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter text-foreground leading-[0.9] mb-8"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
            >
              People Fail.
              <br />
              <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent bg-[length:200%_auto] animate-[gradient-shift_4s_ease-in-out_infinite]">
                Systems Work.
              </span>
            </motion.h1>

            <motion.p
              className="text-lg md:text-xl text-muted-foreground max-w-lg mb-10 leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
            >
              You describe the goal. AI agents find prospects, qualify them, run outreach, and book calls — while you focus on closing.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex flex-col sm:flex-row items-start gap-4"
            >
              <Button asChild size="lg" className="tracking-wide text-lg px-10 py-6 font-bold gold-glow-strong group">
                <Link to="/login">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
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

            <motion.p
              className="text-xs text-muted-foreground/50 mt-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              Network Marketing · Affiliate · Coaching · E-Commerce · Online Business
            </motion.p>
          </div>
        </div>
      </section>

      {/* ─── Stats Bar ─── */}
      <section className="border-t border-border bg-card/50">
        <div className="container py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <p className="text-3xl md:text-4xl font-black bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1 tracking-wide uppercase">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Goal Input Preview ─── */}
      <section className="py-24 md:py-32">
        <div className="container max-w-4xl">
          <SectionHeader
            title="One Goal. Full Execution."
            subtitle="Type what you want. The system figures out the rest."
          />
          <motion.div
            className="rounded-3xl border border-border bg-card/80 backdrop-blur-sm p-8 md:p-10 gold-glow"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-2 mb-6">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Zap className="h-4 w-4 text-primary" />
              </div>
              <span className="text-xs font-semibold text-foreground uppercase tracking-wider">Goal Input</span>
            </div>
            <div className="rounded-2xl border border-primary/20 bg-background/50 p-5 mb-8">
              <p className="text-base text-muted-foreground italic">
                "Get me 50 MLM leads in Dallas who are interested in health supplements"
              </p>
            </div>
            <div className="space-y-4">
              {[
                { status: "done", text: "Scout — Found 127 potential leads" },
                { status: "done", text: "Qualifier — Scored & ranked top 50" },
                { status: "active", text: "Email Outreach — Sending sequences..." },
                { status: "waiting", text: "SMS Follow-up — Waiting" },
                { status: "waiting", text: "Book Calls — Waiting" },
              ].map((step, i) => (
                <motion.div
                  key={i}
                  className="flex items-center gap-3"
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <div className={`h-2 w-2 rounded-full ${
                    step.status === "done" ? "bg-emerald-400" :
                    step.status === "active" ? "bg-primary animate-pulse" :
                    "bg-muted-foreground/30"
                  }`} />
                  <span className={`text-sm font-medium ${
                    step.status === "done" ? "text-emerald-400" :
                    step.status === "active" ? "text-primary" :
                    "text-muted-foreground/50"
                  }`}>
                    {step.text}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section className="py-24 md:py-32 border-t border-border" id="how-it-works">
        <div className="container">
          <SectionHeader title="How It Works" subtitle="From goal to booked calls in four steps." />
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((s, i) => (
              <motion.div
                key={s.num}
                className="group relative rounded-3xl border border-border bg-card p-8 hover:border-primary/30 transition-all duration-300"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-4xl font-black bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{s.num}</span>
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <s.icon className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-3">{s.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Agent Grid ─── */}
      <section className="py-24 md:py-32 border-t border-border relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-card/50 via-background to-card/30" />
        <div className="container relative z-10">
          <SectionHeader title="The Agent Stack" subtitle="Six AI agents that run your prospecting and outreach end-to-end." />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {agents.map((a, i) => (
              <motion.div
                key={a.name}
                className="group rounded-3xl border border-border bg-card/80 backdrop-blur-sm p-7 hover:border-primary/40 hover:gold-glow transition-all duration-300"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-accent/10 group-hover:from-primary/25 group-hover:to-accent/15 transition-colors">
                  <a.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-base font-bold text-foreground mb-2">{a.name}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{a.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Social Proof ─── */}
      <section className="py-24 md:py-32 border-t border-border">
        <div className="container max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="rounded-3xl border border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 p-12 md:p-16 gold-glow"
          >
            <div className="flex items-center justify-center gap-2 mb-6">
              <Users className="h-5 w-5 text-primary" />
              <TrendingUp className="h-5 w-5 text-accent" />
            </div>
            <blockquote className="text-2xl md:text-3xl font-bold text-foreground leading-snug mb-6">
              "I typed one goal and woke up to 50 qualified leads in my pipeline with calls already booked."
            </blockquote>
            <p className="text-sm text-muted-foreground">— Early Beta User, Digital Entrepreneur</p>
          </motion.div>
        </div>
      </section>

      {/* ─── Pricing ─── */}
      <section className="py-24 md:py-32 border-t border-border" id="pricing">
        <div className="container">
          <SectionHeader title="Simple Pricing" subtitle="Start free. Scale when you're ready." />
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {tiers.map((t, i) => (
              <motion.div
                key={t.name}
                className={`rounded-3xl border p-8 relative overflow-hidden ${
                  t.highlighted
                    ? "border-primary/50 bg-card gold-glow"
                    : "border-border bg-card hover:border-primary/20 transition-colors"
                }`}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                {t.highlighted && (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
                    <span className="relative inline-block text-[10px] uppercase tracking-[0.15em] text-primary font-semibold mb-4 bg-primary/10 px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  </>
                )}
                <div className="relative">
                  <h3 className="text-lg font-bold text-foreground mb-1">{t.name}</h3>
                  <div className="flex items-baseline gap-1 mb-8">
                    <span className="text-5xl font-black text-foreground">{t.price}</span>
                    <span className="text-muted-foreground text-sm">{t.period}</span>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {t.features.map((f) => (
                      <li key={f} className="flex items-start gap-3 text-sm text-muted-foreground">
                        <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    asChild
                    className={`w-full py-5 ${t.highlighted ? "gold-glow-strong" : ""}`}
                    variant={t.highlighted ? "default" : "outline"}
                  >
                    <Link to="/login">{t.cta}</Link>
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="py-24 md:py-32 border-t border-border">
        <div className="container max-w-3xl">
          <SectionHeader id="faq" title="Frequently Asked Questions" subtitle="Everything you need to know." />
          <FAQAccordion items={faqs} />
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="border-t border-border">
        <div className="container">
          <CTASection
            headline="Stop prospecting manually. Let AI agents build your pipeline while you close deals."
            primaryLabel="Get Started Free"
            primaryTo="/login"
            secondaryLabel="See Pricing"
            secondaryTo="/#pricing"
            disclaimer="No credit card required. Cancel anytime."
          />
        </div>
      </section>

      <Footer />
    </div>
  );
}
