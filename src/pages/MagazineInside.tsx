import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AuthGate } from "@/components/AuthGate";

const GoldDivider = () => (
  <div className="flex items-center justify-center py-10">
    <div className="h-px w-20 bg-gradient-to-r from-transparent via-primary to-transparent" />
  </div>
);

const sections = [
  {
    title: "Why the Application Exists",
    body: "The application is a filter. Most platforms let anyone in. We don't. The application exists to identify signal — people who have enough self-awareness to articulate where they're stuck, enough honesty to admit it, and enough intent to pay $5 to prove it. If you can't answer hard questions about your execution, you can't benefit from what we build here."
  },
  {
    title: "Why $5 Exists",
    body: "Five dollars is not revenue. It's friction. It eliminates the curious and retains the committed. Every application costs us time to review. The $5 ensures that time is spent on people who are serious. If $5 is too much to invest in your own trajectory, this isn't the right environment for you."
  },
  {
    title: "Why $197/Month Exists",
    body: "The membership fee funds the infrastructure — the cohort sessions, the prompt engine, the lead architects, the moderation, the systems. It also functions as a commitment device. When you pay monthly, you show up monthly. When you show up, you ship. When you ship, you compound. The price is not negotiable because the structure is not optional."
  },
  {
    title: "Why Attendance Is Mandatory",
    body: "Weekly sessions are not optional because execution is not optional. If you skip sessions, you lose momentum. If you lose momentum, you lose output. If you lose output, you lose your seat. Two missed sessions trigger a warning. Three trigger a review. This is not punishment — it's protection. For you and for every other member who shows up."
  },
  {
    title: "Cohort Structure",
    body: "Every member is assigned to a cohort immediately upon activation. Cohorts run on a fixed weekly schedule: Roll Call (10 minutes), Hot Seats (60 minutes), Commitments (20 minutes). This structure is not flexible. It is not a suggestion. It is the operating rhythm that makes execution inevitable. Your Architect Lead runs the session. You follow the protocol."
  },
  {
    title: "Architect Lead Certification",
    body: "Architect Leads are not self-appointed. They are selected by the Chief Architect based on demonstrated execution, consistency, and the ability to hold others accountable without ego. Leads manage one cohort. They follow the exact session protocol. They do not freelance. Certification is earned through sustained performance, not tenure."
  },
  {
    title: "Prompt Architecture Philosophy",
    body: "The Prompt Engine is not a chatbot. It is a structured system for generating production-ready build prompts. Every prompt follows a defined architecture: Objective, Stack, Routes, Schema, RLS, Flows, UI, Integrations, Acceptance Criteria, Build Order. We do not generate ideas. We generate blueprints. The engine remembers your context across sessions because continuity compounds."
  },
  {
    title: "The OpenClaw Standardization Layer",
    body: "Every prompt produced by the Engine follows the OpenClaw standard — a structured output format designed for direct consumption by AI-powered development platforms. This means your prompts are not documentation. They are executable instructions. Consistent format. Consistent output. Consistent results."
  },
];

export default function MagazineInside() {
  return (
    <AuthGate requireActive>
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-20">
          <div className="max-w-2xl mx-auto px-6">
            <p className="text-xs uppercase tracking-[0.3em] text-primary mb-4">The Doctrine</p>
            <h1 className="font-serif text-4xl sm:text-5xl font-bold text-foreground leading-tight mb-4">
              People Fail.<br />
              <span className="text-primary gold-text-glow">Systems Work.</span>
            </h1>
            <p className="text-muted-foreground leading-relaxed mb-2">
              This is the institutional doctrine of PFSW. Read it. Internalize it. Operate by it.
            </p>

            {sections.map((s, i) => (
              <div key={i}>
                <GoldDivider />
                <section className="py-2">
                  <h2 className="font-serif text-2xl sm:text-3xl font-bold text-foreground mb-4">{s.title}</h2>
                  <p className="text-muted-foreground leading-relaxed">{s.body}</p>
                </section>
              </div>
            ))}

            <GoldDivider />
            <p className="text-center text-xs text-muted-foreground tracking-wide pb-10">
              PFSW — Prompt Architecture Institution
            </p>
          </div>
        </main>
        <Footer />
      </div>
    </AuthGate>
  );
}
