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
import { Search, Globe, Mail, Phone, Layers, Users, CalendarCheck, BookOpen, Shield, Brain, Utensils, Home, Dumbbell, Stethoscope } from "lucide-react";
import heroBg from "@/assets/hero-bg.png";
import { useSEO } from "@/hooks/use-seo";

/* ── Data ── */
const featuredAgents = [
  {
    icon: Search,
    name: "Lead Prospector",
    desc: "Enter a city and niche. Get back business names, phone numbers, emails, and website URLs — ready to pitch.",
  },
  {
    icon: Globe,
    name: "Website Auditor",
    desc: "Scan any business site and generate a professional rebuild proposal with specific pain points and pricing.",
  },
  {
    icon: Mail,
    name: "Cold Email Agent",
    desc: "Turns audit findings into 3-part personalized email sequences with subject lines and booking CTA.",
  },
  {
    icon: Phone,
    name: "AI Voice Caller",
    desc: "Calls business owners via AI voice. Pitches website problems. Books discovery calls automatically.",
  },
];

const pillars = [
  {
    icon: Layers,
    title: "Smart Funnel Builder",
    description:
      "Generate high-conversion interactive quiz funnels for any niche. Your client's prospects answer questions, get a personalized score, and book a call — all from one page.",
  },
  {
    icon: Search,
    title: "Lead Prospector",
    description:
      "Scrape local business leads by city and niche. Get names, phones, emails, and website URLs in minutes. Your pipeline fills automatically.",
  },
  {
    icon: Globe,
    title: "Website Auditor",
    description:
      "Scan any business website for mobile issues, load speed, missing CTAs, and design problems. Output a professional rebuild proposal.",
  },
  {
    icon: Mail,
    title: "Cold Email Outreach",
    description:
      "Generate personalized cold email sequences with audit-specific pain points baked in. Every email references real problems on their site.",
  },
  {
    icon: Phone,
    title: "AI Voice Caller",
    description:
      "The VAPI agent calls business owners, pitches their website problems, and books discovery calls — automatically, while you sleep.",
  },
  {
    icon: CalendarCheck,
    title: "Weekly Hot Seats",
    description:
      "Live peer review sessions where members share pitches, Lovable builds, and outreach results. Real feedback from operators doing the same work.",
  },
];

const process = [
  {
    step: "01",
    title: "Scrape",
    desc: "Run the Lead Prospector. Enter a city and niche. Get a prospect list with phones, emails, and website URLs.",
  },
  {
    step: "02",
    title: "Audit",
    desc: "The Website Auditor scans each site and generates a rebuild proposal. The Cold Email Agent writes the outreach sequence.",
  },
  {
    step: "03",
    title: "Call & Close",
    desc: "The AI Voice Caller pitches website problems and books calls. You show up, close the deal.",
  },
  {
    step: "04",
    title: "Build & Ship",
    desc: "Paste a niche Lovable prompt, customize for the client, and ship a polished site in days. Not weeks.",
  },
];

const institutionalFaqs = [
  {
    q: "Who is PFSW for?",
    a: "Agency owners, web designers, and freelancers who build with Lovable and want a system to find clients, pitch automatically, and deliver fast. If you're doing outreach manually or not at all, this is the system that replaces that.",
  },
  {
    q: "Why does the application cost $5?",
    a: "To filter. The $5 separates people who are browsing from people who are deciding. Every application is reviewed manually. We only accept serious web designers who will actually run the system.",
  },
  {
    q: "Do I need to know how to code?",
    a: "No. Lovable builds the sites from structured prompts. You need to understand client conversations and be able to customize a prompt for a specific niche. The build stack handles the rest.",
  },
  {
    q: "How does the Lead Prospector work?",
    a: "You enter a city and a niche — dental, restaurant, real estate, etc. The agent scrapes local business directories and returns a list with business name, phone, email, and website URL. A full prospecting run that would take 6-8 hours manually takes under 10 minutes.",
  },
  {
    q: "What is the AI Voice Caller?",
    a: "The VAPI agent makes outbound calls to your prospect list. It introduces itself as a web design outreach assistant, references specific audit findings for that business, and directs interested prospects to your booking calendar.",
  },
  {
    q: "What are the weekly hot seats?",
    a: "Weekly peer review sessions where members share active work — pitches, Lovable builds, audit reports, discovery call recordings. Your cohort gives structured feedback. Real critique from operators doing the same work. Attendance is mandatory.",
  },
  {
    q: "Can I cancel?",
    a: "Yes. No contracts. Cancel anytime. The agent runs, the prospect data, and the Lovable prompts you generate stay with you.",
  },
  {
    q: "What does $197/month include?",
    a: "Full access to the Smart Funnel Builder, all outreach agents (Lead Prospector, Website Auditor, Cold Email Agent, SMS Outreach, AI Voice Caller), the niche smart funnel prompt library, weekly hot seat cohort, and the moderated member board.",
  },
];

/* ── Page ── */
export default function Index() {
  const scrollTo = useCallback((id: string) => {
    document.querySelector(id)?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useSEO({
    title: "Land Website Clients With Lovable — PFSW",
    description: "The client acquisition toolkit for agency owners and web designers who build with Lovable. Scrape leads, audit sites, send cold emails, call business owners, and deliver Lovable-built websites. $197/month, application required.",
    canonical: "https://system-install-lab.lovable.app/",
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "PFSW — Client Acquisition Toolkit for Agency Owners & Web Designers",
      "description": "The client acquisition toolkit for agency owners and web designers who build with Lovable. Scrape leads, audit sites, send cold emails, call business owners, and ship websites fast.",
      "url": "https://system-install-lab.lovable.app/",
      "offers": {
        "@type": "Offer",
        "price": "197",
        "priceCurrency": "USD",
        "priceSpecification": { "@type": "UnitPriceSpecification", "billingDuration": "P1M" },
        "name": "PFSW Membership",
        "description": "Lead Prospector, Website Auditor, Cold Email Agent, AI Voice Caller, Niche Lovable Prompt Library, Weekly Hot Seat Cohort."
      },
      "mainEntity": {
        "@type": "FAQPage",
        "mainEntity": [
          { "@type": "Question", "name": "Who is PFSW for?", "acceptedAnswer": { "@type": "Answer", "text": "Agency owners, web designers, and freelancers who build with Lovable and want a system to find clients, pitch automatically, and deliver fast." } },
          { "@type": "Question", "name": "How does the Lead Prospector work?", "acceptedAnswer": { "@type": "Answer", "text": "Enter a city and niche. The agent scrapes local business directories and returns business names, phones, emails, and website URLs in under 10 minutes." } },
          { "@type": "Question", "name": "What does $197/month include?", "acceptedAnswer": { "@type": "Answer", "text": "All five agents, the niche Lovable prompt library, weekly hot seat cohort, and the member board." } }
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
            Built for Agency Owners & Web Designers Who Build With Lovable
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
            Smart Funnels. Automated Outreach. Built With Lovable.
          </motion.p>

          <motion.p
            className="text-sm text-muted-foreground mb-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.7 }}
          >
            Build quiz funnels · Scrape leads · Audit sites · Auto-email · AI-call · Close the client · $197/month
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
              onClick={() => scrollTo("#how-it-works")}
            >
              See How It Works
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ── Smart Funnel Demo ── */}
      <section className="py-20 md:py-28 border-t border-border bg-card/20">
        <div className="container max-w-4xl">
          <SectionHeader
            title="Smart Funnel Builder"
            subtitle="Generate interactive quiz funnels that convert cold traffic into booked calls. Pick a niche, customize the flow, paste into Lovable."
          />
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <div className="space-y-4">
                {[
                  { step: "01", text: "Pick a niche preset or scan your client's existing site" },
                  { step: "02", text: "AI generates a complete 4-phase quiz funnel prompt" },
                  { step: "03", text: "Paste into Lovable — landing page, quiz, lead capture, results page" },
                  { step: "04", text: "Client's prospects take the quiz, get scored, and book a call" },
                ].map((s) => (
                  <div key={s.step} className="flex items-start gap-3">
                    <span className="text-sm font-bold text-primary shrink-0">{s.step}</span>
                    <p className="text-sm text-muted-foreground leading-relaxed">{s.text}</p>
                  </div>
                ))}
              </div>
              <Button asChild size="sm" className="gold-glow-strong">
                <Link to="/intake-funnel">See Live Demo</Link>
              </Button>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Layers className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold text-foreground">Funnel Phases</span>
              </div>
              {[
                { phase: "Landing", desc: "Hero hook + CTA — converts cold traffic" },
                { phase: "Quiz", desc: "5-8 scored questions with progress bar" },
                { phase: "Lead Capture", desc: "Name, email, phone — before results" },
                { phase: "Results", desc: "Animated score gauge + personalized insights" },
              ].map((p, i) => (
                <div key={p.phase} className="flex items-start gap-3 pl-2 border-l-2 border-primary/30">
                  <div>
                    <p className="text-xs font-semibold text-foreground">{p.phase}</p>
                    <p className="text-[11px] text-muted-foreground">{p.desc}</p>
                  </div>
                </div>
              ))}
              <p className="text-[10px] text-muted-foreground pt-2 border-t border-border">
                9 niche presets · Firecrawl brand scan · Supabase backend included
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Niche Smart Funnel Examples ── */}
      <section className="py-20 md:py-28 border-t border-border">
        <div className="container">
          <SectionHeader
            title="Smart Funnels for Every Niche"
            subtitle="Generate quiz funnels tailored to any industry. Here's what members are deploying for their clients."
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Stethoscope, niche: "Dental", funnel: "Smile Health Score Quiz", desc: "Patients answer 6 oral-health questions, get a personalized score, and book a cleaning.", gradient: "from-sky-500/20 to-cyan-500/10" },
              { icon: Utensils, niche: "Restaurant", funnel: "Online Presence Audit", desc: "Restaurant owners discover their digital weak spots and book a website consultation.", gradient: "from-orange-500/20 to-amber-500/10" },
              { icon: Home, niche: "Real Estate", funnel: "Home Readiness Scorecard", desc: "Sellers rate their home's condition across 8 categories and connect with an agent.", gradient: "from-emerald-500/20 to-green-500/10" },
              { icon: Dumbbell, niche: "Fitness", funnel: "Fitness Goal Matcher", desc: "Prospects identify their training style and get matched with a program and trainer.", gradient: "from-violet-500/20 to-purple-500/10" },
            ].map((ex) => (
              <div key={ex.niche} className="rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/30 transition-all">
                <div className={`h-32 bg-gradient-to-br ${ex.gradient} flex items-center justify-center`}>
                  <ex.icon className="h-10 w-10 text-primary/60" />
                </div>
                <div className="p-5">
                  <span className="text-[10px] uppercase tracking-[0.15em] text-primary font-semibold">{ex.niche}</span>
                  <h3 className="text-sm font-semibold text-foreground mt-1 mb-2 tracking-tight">{ex.funnel}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{ex.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Six Pillars ── */}
      <section className="py-20 md:py-28">
        <div className="container">
          <SectionHeader id="pillars" title="What You Get" subtitle="Smart funnels, automated agents, and a weekly peer cohort. Everything you need to land and deliver web design clients." />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {pillars.map((p) => (
              <FeatureCard key={p.title} icon={p.icon} title={p.title} description={p.description} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Agent Showcase ── */}
      <section className="py-20 md:py-28 border-t border-border bg-card/30">
        <div className="container">
          <SectionHeader
            title="The Acquisition Stack"
            subtitle="Active members get access to the full client acquisition system. Every agent runs a defined job — no manual work required."
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
          <SectionHeader id="how-it-works" title="How It Works" subtitle="Scrape. Audit. Call. Build. Four steps. No manual grind." />
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
          <SectionHeader title="Pricing" subtitle="One membership for agency owners and web designers. Full access. No tiers." />
          <div className="rounded-2xl border border-primary/30 bg-card p-10 md:p-14 gold-glow">
            <p className="text-xs uppercase tracking-[0.2em] text-primary mb-6 font-medium">Membership</p>
            <div className="flex items-baseline justify-center gap-2 mb-4">
              <span className="text-5xl md:text-6xl font-black text-foreground tracking-tight">$197</span>
              <span className="text-muted-foreground text-lg">/month</span>
            </div>
            <p className="text-sm text-muted-foreground mb-8 leading-relaxed max-w-md mx-auto">
              Smart Funnel Builder · Lead Scraper · Website Auditor · Cold Email · SMS Outreach · AI Voice Caller · Smart Funnel Library · Weekly Hot Seats
            </p>
            <Button asChild size="lg" className="tracking-wide px-10 py-6 text-lg font-bold gold-glow-strong">
              <Link to="/apply">Apply for Access</Link>
            </Button>
            <p className="text-xs text-muted-foreground mt-6">$5 application fee · Serious agency owners & web designers only</p>
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
            headline="Stop chasing clients manually. Build the system that finds them for you."
            primaryLabel="Apply for Access"
            primaryTo="/apply"
            secondaryLabel="Read the Playbook"
            secondaryTo="/magazine/inside"
            disclaimer="PFSW is for serious agency owners and web designers. Application required. $197/month upon acceptance."
          />
        </div>
      </section>

      <Footer />
    </div>
  );
}
