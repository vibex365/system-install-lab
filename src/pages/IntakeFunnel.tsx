import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Lock,
  AlertTriangle,
  TrendingUp,
  Target,
  Zap,
  DollarSign,
  Users,
  Star,
} from "lucide-react";
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
  multiSelect?: boolean;
  hint?: string;
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
      hint: "Proper lead capture is the foundation of any high-converting funnel.",
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
      multiSelect: true,
      hint: "Select all that apply.",
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
  {
    min: 0, max: 40, label: "Critical", color: "text-red-400", bgColor: "bg-red-500/10", borderColor: "border-red-500/30",
    message: "You're leaving serious money on the table. Your current process is costing you clients and revenue every week.",
    urgency: "Immediate Action Recommended",
    urgencyColor: "bg-red-500/20 text-red-400 border-red-500/30",
  },
  {
    min: 41, max: 70, label: "Needs Work", color: "text-amber-400", bgColor: "bg-amber-500/10", borderColor: "border-amber-500/30",
    message: "You have some pieces in place, but major gaps in your funnel delivery and client acquisition process are holding you back.",
    urgency: "Significant Improvement Needed",
    urgencyColor: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  },
  {
    min: 71, max: 85, label: "Solid", color: "text-primary", bgColor: "bg-primary/10", borderColor: "border-primary/30",
    message: "You're ahead of most agencies, but there's still room to automate, systematize, and charge more for premium funnel builds.",
    urgency: "Optimization Opportunities Available",
    urgencyColor: "bg-primary/20 text-primary border-primary/30",
  },
  {
    min: 86, max: 100, label: "Elite", color: "text-emerald-400", bgColor: "bg-emerald-500/10", borderColor: "border-emerald-500/30",
    message: "You're operating at a high level. PFSW would help you scale even further with AI-powered tools and a builder collective.",
    urgency: "Ready to Scale",
    urgencyColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  },
];

const INSIGHT_MAP: Record<number, { icon: typeof Target; title: string; description: string }> = {
  0: { icon: Zap, title: "Funnel Build Process", description: "Your current build method is slowing you down. AI-generated funnels can cut delivery time by 80%." },
  2: { icon: TrendingUp, title: "Delivery Speed", description: "Faster delivery means happier clients and more capacity for new deals. Top agencies deliver in hours, not weeks." },
  3: { icon: Target, title: "Lead Capture & Data", description: "Without proper lead capture, your clients' funnels are leaking revenue. Every form submission should feed a CRM." },
  5: { icon: AlertTriangle, title: "Scaling Bottleneck", description: "Your biggest bottleneck is solvable with the right systems. Automation removes the ceiling on your growth." },
  6: { icon: DollarSign, title: "Pricing Strategy", description: "You may be undercharging. Agencies with AI-powered delivery consistently command $3K–$5K+ per funnel." },
  8: { icon: Users, title: "Client Acquisition", description: "A systemized prospecting pipeline is the difference between feast-or-famine and predictable revenue." },
};

const MAX_SCORE = 200;

// ─── Component ──────────────────────────────────────────────────────────────

export default function IntakeFunnel() {
  useSEO({
    title: "Are You Building Your Clients' Funnels The Hard Way? | PFSW",
    description:
      "Take the 2-minute Funnel Efficiency quiz and get your personalized score. Discover how top agencies build and deliver high-converting funnels in hours, not weeks.",
  });

  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [multiSelectAnswers, setMultiSelectAnswers] = useState<Record<number, number[]>>({});
  const [phase, setPhase] = useState<"landing" | "quiz" | "capture" | "result">("landing");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const totalQuestions = STEPS.filter((s) => s.type === "question").length;
  const answeredCount = Object.keys(answers).length;
  const progress = phase === "quiz" ? (answeredCount / totalQuestions) * 100 : phase === "landing" ? 0 : 100;
  const stepsRemaining = totalQuestions - answeredCount;

  const rawScore = Object.values(answers).reduce((a, b) => a + b, 0);
  const normalizedScore = Math.round((rawScore / MAX_SCORE) * 100);
  const tier = TIERS.find((t) => normalizedScore >= t.min && normalizedScore <= t.max) || TIERS[0];

  // Find the 3 lowest-scoring question answers for insights
  const getInsightCards = () => {
    const questionStepIndices = STEPS.map((s, i) => (s.type === "question" ? i : -1)).filter((i) => i !== -1);
    const scored = questionStepIndices
      .filter((i) => answers[i] !== undefined && INSIGHT_MAP[i])
      .map((i) => ({ index: i, score: answers[i] }))
      .sort((a, b) => a.score - b.score);
    return scored.slice(0, 3).map((s) => INSIGHT_MAP[s.index]);
  };

  const selectAnswer = (stepIndex: number, score: number) => {
    setAnswers((prev) => ({ ...prev, [stepIndex]: score }));
    setTimeout(() => {
      if (currentStep < STEPS.length - 1) {
        setCurrentStep((s) => s + 1);
      } else {
        setPhase("capture");
      }
    }, 400);
  };

  const toggleMultiSelect = (stepIndex: number, score: number) => {
    setMultiSelectAnswers((prev) => {
      const current = prev[stepIndex] || [];
      const next = current.includes(score) ? current.filter((s) => s !== score) : [...current, score];
      return { ...prev, [stepIndex]: next };
    });
  };

  const confirmMultiSelect = (stepIndex: number) => {
    const selected = multiSelectAnswers[stepIndex] || [];
    const maxScore = selected.length > 0 ? Math.max(...selected) : 0;
    setAnswers((prev) => ({ ...prev, [stepIndex]: maxScore }));
    setTimeout(() => {
      if (currentStep < STEPS.length - 1) {
        setCurrentStep((s) => s + 1);
      } else {
        setPhase("capture");
      }
    }, 200);
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
      // Save to funnel_leads for CRM visibility
      await supabase.from("funnel_leads" as any).insert({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
        score: normalizedScore,
        tier: tier.label,
        answers: answers,
        funnel_name: "intake",
      });
      // Also save to waitlist for backwards compatibility
      await supabase.from("waitlist").insert({
        email: email.trim(),
        note: `[Smart Funnel] Name: ${name.trim()} | Phone: ${phone.trim() || "N/A"} | Score: ${normalizedScore}/100 (${tier.label})`,
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
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress bar — hidden on landing */}
      {phase !== "landing" && phase !== "result" && (
        <div className="fixed top-0 left-0 right-0 z-50">
          <div className="max-w-xl mx-auto px-4 pt-14">
            <div className="flex justify-between text-[11px] text-muted-foreground mb-1.5">
              <span>{stepsRemaining} step{stepsRemaining !== 1 ? "s" : ""} remaining</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Persistent brand header */}
      <header className="fixed top-0 left-0 right-0 z-50 py-3 bg-background/80 backdrop-blur-sm border-b border-border">
        <p className="text-center text-xs font-bold tracking-[0.3em] uppercase text-foreground">
          PFSW
        </p>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="w-full max-w-xl">
          <AnimatePresence mode="wait">
            {/* ─── LANDING PHASE ─── */}
            {phase === "landing" && (
              <motion.div
                key="landing"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="text-center space-y-8"
              >
                <div className="space-y-4">
                  <p className="text-xs text-primary tracking-[0.25em] uppercase font-semibold">
                    ARE YOU LEAVING MONEY ON THE TABLE?
                  </p>
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-foreground leading-tight">
                    Are You Building Your Clients' Funnels{" "}
                    <span className="text-primary">The Hard Way?</span>
                  </h1>
                  <p className="text-muted-foreground text-base md:text-lg max-w-md mx-auto leading-relaxed">
                    Answer 6 quick questions. Get your Funnel Efficiency Score in under 2 minutes.
                  </p>
                </div>

                <Button
                  size="lg"
                  className="text-base md:text-lg px-10 py-7 font-bold tracking-wide"
                  onClick={() => setPhase("quiz")}
                >
                  TAKE THE FREE QUIZ NOW <ArrowRight className="ml-2 h-5 w-5" />
                </Button>

                <div className="flex items-center justify-center gap-1 text-muted-foreground">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-primary text-primary" />
                    ))}
                  </div>
                  <span className="text-xs ml-1.5">Trusted by 50+ agency owners</span>
                </div>
              </motion.div>
            )}

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
                  <QuestionStep
                    step={STEPS[currentStep].data as QuizQuestion}
                    stepIndex={currentStep}
                    answeredCount={answeredCount}
                    totalQuestions={totalQuestions}
                    selectedScore={answers[currentStep]}
                    multiSelectSelected={multiSelectAnswers[currentStep] || []}
                    onSelect={selectAnswer}
                    onToggleMulti={toggleMultiSelect}
                    onConfirmMulti={confirmMultiSelect}
                    canGoBack={currentStep > 0}
                    onBack={goBack}
                  />
                ) : (
                  <EducationStep
                    step={STEPS[currentStep].data as EducationSlide}
                    onContinue={advanceEducation}
                    canGoBack={currentStep > 0}
                    onBack={goBack}
                  />
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
                    Where should we send your results?
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    Enter your details below to receive your personalized Funnel Efficiency Score.
                  </p>
                </div>
                <Card className="bg-card border-border">
                  <CardContent className="pt-6 space-y-4">
                    <div>
                      <label className="text-sm font-semibold text-foreground mb-1.5 block">Full Name *</label>
                      <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Marcus Johnson" className="bg-secondary border-border" />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-foreground mb-1.5 block">Email Address *</label>
                      <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="marcus@agency.com" className="bg-secondary border-border" />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-foreground mb-1.5 block">Phone Number <span className="font-normal text-muted-foreground">(optional)</span></label>
                      <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 000-0000" className="bg-secondary border-border" />
                    </div>
                    <Button className="w-full py-6 text-base font-bold" onClick={submitLead} disabled={submitting}>
                      {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Get My Funnel Score
                    </Button>
                    <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
                      <Lock className="h-3 w-3" />
                      <span>Your information is secure and will never be shared with third parties.</span>
                    </div>
                    <button onClick={() => setPhase("quiz")} className="block mx-auto text-xs text-muted-foreground hover:text-foreground transition-colors">
                      ← Go Back
                    </button>
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
                className="space-y-8"
              >
                {/* Greeting */}
                <div className="text-center space-y-2">
                  <p className="text-xs text-primary tracking-widest uppercase font-semibold">Your Results</p>
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                    Thank You, {name.split(" ")[0]}! 🎉
                  </h2>
                  <p className="text-muted-foreground text-sm">Your Funnel Efficiency Assessment is complete</p>
                </div>

                {/* Score Card */}
                <Card className="bg-secondary border-border overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                      {/* Gauge */}
                      <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
                        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 120 120">
                          <circle cx="60" cy="60" r="54" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
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
                      {/* Tier info */}
                      <div className="flex-1 text-center sm:text-left space-y-2">
                        <h3 className={`text-xl font-bold ${tier.color}`}>{tier.label}</h3>
                        <p className="text-muted-foreground text-sm leading-relaxed">{tier.message}</p>
                      </div>
                    </div>
                    {/* Urgency banner */}
                    <div className={`mt-4 px-4 py-2.5 rounded-lg border text-center text-sm font-semibold ${tier.urgencyColor}`}>
                      ⚡ {tier.urgency}
                    </div>
                  </CardContent>
                </Card>

                {/* Why Your Score Section */}
                {getInsightCards().length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-foreground">Why Your Score Is {normalizedScore}</h3>
                    {getInsightCards().map((insight, i) => {
                      const Icon = insight.icon;
                      return (
                        <div key={i} className="flex gap-3 p-4 rounded-xl bg-card border-l-4 border-primary">
                          <Icon className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                          <div>
                            <p className="text-sm font-semibold text-foreground">{insight.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{insight.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Recommendations */}
                <Card className="bg-card border-border">
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
                <div className="space-y-3 text-center">
                  <Button
                    size="lg"
                    className="w-full text-base py-6 font-bold"
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

// ─── Sub-components ──────────────────────────────────────────────────────────

function QuestionStep({
  step,
  stepIndex,
  answeredCount,
  totalQuestions,
  selectedScore,
  multiSelectSelected,
  onSelect,
  onToggleMulti,
  onConfirmMulti,
  canGoBack,
  onBack,
}: {
  step: QuizQuestion;
  stepIndex: number;
  answeredCount: number;
  totalQuestions: number;
  selectedScore: number | undefined;
  multiSelectSelected: number[];
  onSelect: (stepIndex: number, score: number) => void;
  onToggleMulti: (stepIndex: number, score: number) => void;
  onConfirmMulti: (stepIndex: number) => void;
  canGoBack: boolean;
  onBack: () => void;
}) {
  const questionNumber = selectedScore !== undefined ? answeredCount : answeredCount + 1;

  return (
    <div className="space-y-6">
      <p className="text-xs text-muted-foreground tracking-widest uppercase">
        Question {questionNumber} of {totalQuestions}
      </p>
      <h2 className="text-xl md:text-2xl font-bold text-foreground leading-tight">
        {step.question}
      </h2>
      <div className="space-y-3">
        {step.options.map((opt, i) => (
          step.multiSelect ? (
            <button
              key={i}
              onClick={() => onToggleMulti(stepIndex, opt.score)}
              className={`w-full text-left px-5 py-4 rounded-xl border transition-all duration-200 text-sm md:text-base flex items-center gap-3 ${
                multiSelectSelected.includes(opt.score)
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border bg-card text-foreground hover:border-primary/50 hover:bg-card/80"
              }`}
            >
              <Checkbox checked={multiSelectSelected.includes(opt.score)} className="pointer-events-none" />
              {opt.label}
            </button>
          ) : (
            <button
              key={i}
              onClick={() => onSelect(stepIndex, opt.score)}
              className={`w-full text-left px-5 py-4 rounded-xl border transition-all duration-200 text-sm md:text-base ${
                selectedScore === opt.score
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border bg-card text-foreground hover:border-primary/50 hover:bg-card/80"
              }`}
            >
              {opt.label}
            </button>
          )
        ))}
      </div>
      {step.hint && (
        <p className="text-xs text-muted-foreground italic">{step.hint}</p>
      )}
      {step.multiSelect && (
        <Button
          onClick={() => onConfirmMulti(stepIndex)}
          disabled={multiSelectSelected.length === 0}
          className="w-full"
        >
          Continue <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      )}
      {canGoBack && (
        <Button variant="ghost" size="sm" onClick={onBack} className="text-muted-foreground">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
      )}
    </div>
  );
}

function EducationStep({
  step,
  onContinue,
  canGoBack,
  onBack,
}: {
  step: EducationSlide;
  onContinue: () => void;
  canGoBack: boolean;
  onBack: () => void;
}) {
  return (
    <div className="space-y-6 text-center">
      <p className="text-xs text-primary tracking-widest uppercase font-semibold">{step.title}</p>
      <p className="text-5xl md:text-6xl font-black text-primary">{step.stat}</p>
      <p className="text-muted-foreground text-sm md:text-base max-w-md mx-auto leading-relaxed">{step.body}</p>
      <Button onClick={onContinue} className="mt-4">
        Continue <ArrowRight className="h-4 w-4 ml-1" />
      </Button>
      {canGoBack && (
        <div>
          <Button variant="ghost" size="sm" onClick={onBack} className="text-muted-foreground">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
        </div>
      )}
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
