import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSEO } from "@/hooks/use-seo";

// ─── Quiz Data ──────────────────────────────────────────────────────────────

interface QuizOption {
  label: string;
  score: number;
}

interface QuizQuestion {
  question: string;
  options: QuizOption[];
}

interface EducationSlide {
  title: string;
  stat: string;
  body: string;
}

type Step =
  | { type: "question"; data: QuizQuestion }
  | { type: "education"; data: EducationSlide };

const STEPS: Step[] = [
  {
    type: "question",
    data: {
      question: "How are you currently building funnels for your clients?",
      options: [
        { label: "Manually coding from scratch every time", score: 5 },
        { label: "Using templates but heavily customizing", score: 15 },
        { label: "Drag-and-drop builders (ClickFunnels, GoHighLevel)", score: 25 },
        { label: "I don't build funnels — I just do static sites", score: 10 },
      ],
    },
  },
  {
    type: "education",
    data: {
      title: "Did You Know?",
      stat: "72%",
      body: "of agencies spend over 10 hours per funnel build — time that could be spent closing new clients instead of wrestling with page builders.",
    },
  },
  {
    type: "question",
    data: {
      question: "How long does it take you to deliver a complete funnel to a client?",
      options: [
        { label: "2+ weeks", score: 5 },
        { label: "1-2 weeks", score: 15 },
        { label: "3-5 days", score: 25 },
        { label: "Same day or next day", score: 35 },
      ],
    },
  },
  {
    type: "question",
    data: {
      question: "Do your funnels include lead capture that actually stores data for the client?",
      options: [
        { label: "No — leads go to email or a spreadsheet", score: 5 },
        { label: "Sometimes — depends on the client's setup", score: 15 },
        { label: "Yes — I set up a basic form submission", score: 25 },
        { label: "Yes — with CRM integration and automated follow-up", score: 35 },
      ],
    },
  },
  {
    type: "education",
    data: {
      title: "The Funnel Gap",
      stat: "3.2x",
      body: "Interactive quiz funnels convert 3.2x better than static landing pages. Yet most agencies still deliver flat pages with a contact form.",
    },
  },
  {
    type: "question",
    data: {
      question: "What's your biggest bottleneck when scaling your agency?",
      options: [
        { label: "Finding new clients", score: 20 },
        { label: "Delivering fast enough to keep clients happy", score: 10 },
        { label: "Building high-converting assets (funnels, sites)", score: 5 },
        { label: "Managing everything solo — no systems", score: 8 },
      ],
    },
  },
  {
    type: "question",
    data: {
      question: "How much are you charging per funnel build?",
      options: [
        { label: "Under $500", score: 5 },
        { label: "$500 – $1,500", score: 15 },
        { label: "$1,500 – $5,000", score: 25 },
        { label: "$5,000+", score: 35 },
      ],
    },
  },
  {
    type: "education",
    data: {
      title: "Speed = Revenue",
      stat: "$4,200",
      body: "Agencies using AI-powered funnel generation report an average deal size of $4,200 — because they deliver faster, look more premium, and include data-driven features.",
    },
  },
  {
    type: "question",
    data: {
      question: "How do you currently prospect for new clients?",
      options: [
        { label: "Referrals only — no outbound", score: 10 },
        { label: "Cold email / DMs manually", score: 15 },
        { label: "Paid ads to my own offer page", score: 25 },
        { label: "I have a full system: prospecting → outreach → close", score: 35 },
      ],
    },
  },
];

const TIERS = [
  { min: 0, max: 40, label: "Critical", color: "text-red-400", message: "You're leaving serious money on the table. Your current process is costing you clients and revenue every week." },
  { min: 41, max: 70, label: "Needs Work", color: "text-amber-400", message: "You have some pieces in place, but major gaps in your funnel delivery and client acquisition process are holding you back." },
  { min: 71, max: 85, label: "Solid", color: "text-primary", message: "You're ahead of most agencies, but there's still room to automate, systematize, and charge more for premium funnel builds." },
  { min: 86, max: 100, label: "Elite", color: "text-emerald-400", message: "You're operating at a high level. PFSW would help you scale even further with AI-powered tools and a builder collective." },
];

const MAX_SCORE = 200; // sum of max possible scores

// ─── Component ──────────────────────────────────────────────────────────────

export default function IntakeFunnel() {
  useSEO({
    title: "Are You Building Your Clients' Funnels The Hard Way? | PFSW",
    description: "Take the 2-minute Funnel Efficiency quiz and get your personalized score. Discover how top agencies build and deliver high-converting funnels in hours, not weeks.",
  });

  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [phase, setPhase] = useState<"quiz" | "capture" | "result">("quiz");

  // Lead capture
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const totalQuestions = STEPS.filter((s) => s.type === "question").length;
  const answeredCount = Object.keys(answers).length;
  const progress = phase === "quiz" ? (answeredCount / totalQuestions) * 100 : 100;

  const rawScore = Object.values(answers).reduce((a, b) => a + b, 0);
  const normalizedScore = Math.round((rawScore / MAX_SCORE) * 100);
  const tier = TIERS.find((t) => normalizedScore >= t.min && normalizedScore <= t.max) || TIERS[0];

  const selectAnswer = (stepIndex: number, score: number) => {
    setAnswers((prev) => ({ ...prev, [stepIndex]: score }));
    // Auto advance after short delay
    setTimeout(() => {
      if (currentStep < STEPS.length - 1) {
        setCurrentStep((s) => s + 1);
      } else {
        setPhase("capture");
      }
    }, 400);
  };

  const advanceEducation = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      setPhase("capture");
    }
  };

  const goBack = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  };

  const submitLead = async () => {
    if (!name.trim() || !email.trim()) {
      toast({ title: "Name and email are required", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      await supabase.from("waitlist").insert({
        email: email.trim(),
        note: `[Intake Funnel] Name: ${name.trim()} | Phone: ${phone.trim() || "N/A"} | Score: ${normalizedScore}/100 (${tier.label}) | Answers: ${JSON.stringify(answers)}`,
      });
      setPhase("result");
    } catch {
      toast({ title: "Something went wrong", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render ──

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] flex flex-col">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-secondary">
        <motion.div
          className="h-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-xl">
          <AnimatePresence mode="wait">
            {/* ─── QUIZ PHASE ─── */}
            {phase === "quiz" && (
              <motion.div
                key={`step-${currentStep}`}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.3 }}
              >
                {STEPS[currentStep].type === "question" ? (
                  <div className="space-y-6">
                    <p className="text-xs text-muted-foreground tracking-widest uppercase">
                      Question {answeredCount + (answers[currentStep] !== undefined ? 0 : 1)} of {totalQuestions}
                    </p>
                    <h2 className="text-xl md:text-2xl font-bold text-foreground leading-tight">
                      {(STEPS[currentStep].data as QuizQuestion).question}
                    </h2>
                    <div className="space-y-3">
                      {(STEPS[currentStep].data as QuizQuestion).options.map((opt, i) => (
                        <button
                          key={i}
                          onClick={() => selectAnswer(currentStep, opt.score)}
                          className={`w-full text-left px-5 py-4 rounded-xl border transition-all duration-200 text-sm md:text-base ${
                            answers[currentStep] === opt.score
                              ? "border-primary bg-primary/10 text-foreground"
                              : "border-border bg-card text-foreground hover:border-primary/50 hover:bg-card/80"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    {currentStep > 0 && (
                      <Button variant="ghost" size="sm" onClick={goBack} className="text-muted-foreground">
                        <ArrowLeft className="h-4 w-4 mr-1" /> Back
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6 text-center">
                    <p className="text-xs text-primary tracking-widest uppercase font-semibold">
                      {(STEPS[currentStep].data as EducationSlide).title}
                    </p>
                    <p className="text-5xl md:text-6xl font-black text-primary">
                      {(STEPS[currentStep].data as EducationSlide).stat}
                    </p>
                    <p className="text-muted-foreground text-sm md:text-base max-w-md mx-auto leading-relaxed">
                      {(STEPS[currentStep].data as EducationSlide).body}
                    </p>
                    <Button onClick={advanceEducation} className="mt-4">
                      Continue <ArrowRight className="h-4 w-4 ml-1" />
                    </Button>
                    {currentStep > 0 && (
                      <div>
                        <Button variant="ghost" size="sm" onClick={goBack} className="text-muted-foreground">
                          <ArrowLeft className="h-4 w-4 mr-1" /> Back
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {/* ─── LEAD CAPTURE PHASE ─── */}
            {phase === "capture" && (
              <motion.div
                key="capture"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="space-y-6"
              >
                <div className="text-center space-y-2">
                  <p className="text-xs text-primary tracking-widest uppercase font-semibold">Almost There</p>
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                    Get Your Funnel Efficiency Score
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    Enter your info below to see your personalized results and recommendations.
                  </p>
                </div>
                <Card className="bg-card border-border">
                  <CardContent className="pt-6 space-y-4">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Your Name *</label>
                      <Input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Marcus Johnson"
                        className="bg-secondary border-border"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Email *</label>
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="marcus@agency.com"
                        className="bg-secondary border-border"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">Phone (optional)</label>
                      <Input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="(555) 000-0000"
                        className="bg-secondary border-border"
                      />
                    </div>
                    <Button className="w-full" onClick={submitLead} disabled={submitting}>
                      {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      See My Results
                    </Button>
                    <p className="text-[10px] text-muted-foreground text-center">
                      We'll never spam you. Your data stays private.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* ─── RESULTS PHASE ─── */}
            {phase === "result" && (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="space-y-8 text-center"
              >
                <p className="text-xs text-primary tracking-widest uppercase font-semibold">Your Results</p>

                {/* Animated score */}
                <div className="relative mx-auto w-40 h-40 flex items-center justify-center">
                  <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="54" fill="none" stroke="hsl(var(--secondary))" strokeWidth="8" />
                    <motion.circle
                      cx="60" cy="60" r="54"
                      fill="none"
                      stroke="hsl(var(--primary))"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 54}
                      initial={{ strokeDashoffset: 2 * Math.PI * 54 }}
                      animate={{ strokeDashoffset: 2 * Math.PI * 54 * (1 - normalizedScore / 100) }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                    />
                  </svg>
                  <motion.span
                    className={`text-4xl font-black ${tier.color}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                  >
                    {normalizedScore}
                  </motion.span>
                </div>

                <div>
                  <h2 className={`text-2xl font-bold ${tier.color}`}>{tier.label}</h2>
                  <p className="text-muted-foreground text-sm mt-2 max-w-md mx-auto">{tier.message}</p>
                </div>

                {/* Recommendations */}
                <Card className="bg-card border-border text-left">
                  <CardContent className="pt-6 space-y-3">
                    <h3 className="text-sm font-semibold text-foreground">Your Personalized Recommendations</h3>
                    {normalizedScore < 50 && (
                      <>
                        <Rec text="Replace manual funnel builds with AI-generated interactive quiz funnels that convert 3x better." />
                        <Rec text="Implement a lead prospecting system so you're never waiting on referrals again." />
                        <Rec text="Set up automated email sequences to nurture leads without manual follow-up." />
                      </>
                    )}
                    {normalizedScore >= 50 && normalizedScore < 80 && (
                      <>
                        <Rec text="Upgrade from static pages to interactive quiz funnels with built-in lead capture and scoring." />
                        <Rec text="Add a site audit step before outreach — knowing a prospect's weak points triples your close rate." />
                        <Rec text="Automate your outreach pipeline: prospect → audit → email → call → proposal." />
                      </>
                    )}
                    {normalizedScore >= 80 && (
                      <>
                        <Rec text="Scale your delivery with AI-generated funnel prompts that produce client-ready assets in minutes." />
                        <Rec text="Join a builder collective to share strategies, win bigger deals, and access premium tools." />
                        <Rec text="Leverage done-for-you automation agents for prospecting, outreach, and proposal generation." />
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* CTA */}
                <div className="space-y-3">
                  <Button
                    size="lg"
                    className="w-full text-base py-6"
                    onClick={() => window.open("https://peoplefailsystemswork.com/apply", "_blank")}
                  >
                    Apply to Join the Collective <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Limited spots · Application-only · $197/mo
                  </p>
                </div>

                {/* Trust */}
                <div className="flex items-center justify-center gap-6 text-muted-foreground text-[10px] tracking-widest uppercase pt-4 border-t border-border">
                  <span>AI-Powered Tools</span>
                  <span>•</span>
                  <span>6-Step Pipeline</span>
                  <span>•</span>
                  <span>Builder Collective</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer branding */}
      <footer className="py-4 text-center border-t border-border">
        <p className="text-[10px] text-muted-foreground tracking-widest uppercase">
          People Fail. Systems Work.
        </p>
      </footer>
    </div>
  );
}

function Rec({ text }: { text: string }) {
  return (
    <div className="flex gap-2 items-start">
      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
