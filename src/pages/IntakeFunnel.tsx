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
  Bot,
  Search,
  Mail,
  Phone,
  Shield,
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
      question: "What type of digital business are you building?",
      options: [
        { label: "Network Marketing / MLM", score: 20 },
        { label: "Affiliate Marketing", score: 20 },
        { label: "Online Coaching or Consulting", score: 25 },
        { label: "E-Commerce / Digital Products", score: 15 },
        { label: "Home-based business / Other", score: 10 },
      ],
    },
  },
  {
    type: "education",
    data: {
      title: "Did You Know?",
      stat: "3.2x",
      body: "Interactive quiz funnels convert 3.2x better than static landing pages. Most digital entrepreneurs still use flat pages with a contact form — leaving money on the table.",
    },
  },
  {
    type: "question",
    data: {
      question: "How are you currently finding new prospects?",
      options: [
        { label: "Mostly word-of-mouth and warm market", score: 5 },
        { label: "Social media posting and DMs manually", score: 15 },
        { label: "Paid ads to a landing page", score: 25 },
        { label: "I have a full system: prospecting → outreach → close", score: 35 },
      ],
    },
  },
  {
    type: "question",
    data: {
      question: "How do you qualify whether a prospect is a good fit?",
      options: [
        { label: "I don't — I pitch everyone the same way", score: 5 },
        { label: "I ask a few questions on a call", score: 15 },
        { label: "I use a form or survey to pre-screen", score: 25 },
        { label: "I have automated scoring that filters prospects", score: 35 },
      ],
      hint: "Top earners qualify before they ever get on a call.",
    },
  },
  {
    type: "education",
    data: {
      title: "The Qualification Gap",
      stat: "67%",
      body: "of sales calls are wasted on unqualified prospects. A quiz funnel pre-screens buyers so you only talk to people ready to take action.",
    },
  },
  {
    type: "question",
    data: {
      question: "What's your biggest bottleneck right now?",
      options: [
        { label: "Not enough leads coming in", score: 20 },
        { label: "Leads go cold before I can follow up", score: 15 },
        { label: "Spending too much time on manual outreach", score: 10 },
        { label: "Can't scale without burning out", score: 8 },
      ],
      multiSelect: true,
      hint: "Select all that apply.",
    },
  },
  {
    type: "question",
    data: {
      question: "How much time do you spend on prospecting each week?",
      options: [
        { label: "10+ hours — it's all manual", score: 5 },
        { label: "5–10 hours — mix of manual and some tools", score: 15 },
        { label: "2–5 hours — I have some systems", score: 25 },
        { label: "Under 2 hours — mostly automated", score: 35 },
      ],
    },
  },
  {
    type: "education",
    data: {
      title: "AI Changes Everything",
      stat: "80%",
      body: "of prospecting work can be automated with AI agents — from finding leads to sending outreach to booking calls. Top digital entrepreneurs spend their time closing, not chasing.",
    },
  },
  {
    type: "question",
    data: {
      question: "How interested are you in using AI to automate prospecting and outreach?",
      options: [
        { label: "Very — I need this yesterday", score: 35 },
        { label: "Interested — show me how it works", score: 25 },
        { label: "Curious but skeptical", score: 15 },
        { label: "Just researching for now", score: 5 },
      ],
    },
  },
];

const TIERS = [
  {
    min: 0, max: 35, label: "Critical", color: "text-red-400", bgColor: "bg-red-500/10", borderColor: "border-red-500/30",
    message: "Your current process is costing you prospects and revenue every week. Manual prospecting and no qualification system are holding you back.",
    urgency: "Immediate Action Needed",
    urgencyColor: "bg-red-500/20 text-red-400 border-red-500/30",
  },
  {
    min: 36, max: 60, label: "Needs Work", color: "text-amber-400", bgColor: "bg-amber-500/10", borderColor: "border-amber-500/30",
    message: "You have some pieces in place, but major gaps in prospecting and qualification are slowing your growth.",
    urgency: "Significant Improvement Available",
    urgencyColor: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  },
  {
    min: 61, max: 80, label: "Solid Foundation", color: "text-primary", bgColor: "bg-primary/10", borderColor: "border-primary/30",
    message: "You're ahead of most digital entrepreneurs. Automating your remaining manual processes could unlock your next level.",
    urgency: "Optimization Opportunities Available",
    urgencyColor: "bg-primary/20 text-primary border-primary/30",
  },
  {
    min: 81, max: 100, label: "System Operator", color: "text-emerald-400", bgColor: "bg-emerald-500/10", borderColor: "border-emerald-500/30",
    message: "You're running a systematized operation. PFSW would help you scale further with AI agents and quiz funnels that run on autopilot.",
    urgency: "Ready to Scale",
    urgencyColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  },
];

const INSIGHT_MAP: Record<number, { icon: typeof Target; title: string; description: string }> = {
  0: { icon: Users, title: "Business Model", description: "Your niche has massive upside with the right system. Quiz funnels + AI agents are tailor-made for this." },
  2: { icon: Search, title: "Lead Generation", description: "Your prospecting is too manual. AI Scout Agents can find qualified prospects in your niche automatically." },
  3: { icon: Target, title: "Prospect Qualification", description: "Without automated qualification, you're wasting time on bad-fit prospects. A quiz funnel fixes this instantly." },
  5: { icon: AlertTriangle, title: "Growth Bottleneck", description: "Your biggest bottleneck is solvable with automation. AI agents remove the ceiling on your growth." },
  6: { icon: TrendingUp, title: "Time Investment", description: "You're spending too many hours on prospecting. AI agents can cut this by 80% and deliver better results." },
  8: { icon: Zap, title: "Automation Readiness", description: "Your interest level shows you're ready. The gap between where you are and where you could be is one system." },
};

const MAX_SCORE = 220;

// ─── Component ──────────────────────────────────────────────────────────────

export default function IntakeFunnel() {
  useSEO({
    title: "Are You Leaving Money on the Table? | PFSW Quiz",
    description:
      "Take the 2-minute Business Automation quiz. Discover how quiz funnels and AI agents can automate your prospecting, qualification, and sales.",
  });

  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [multiSelectAnswers, setMultiSelectAnswers] = useState<Record<number, number[]>>({});
  const [phase, setPhase] = useState<"landing" | "quiz" | "capture" | "verify" | "analyzing" | "result">("landing");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [callbackNumber, setCallbackNumber] = useState("");

  // OTP state
  const [otpCode, setOtpCode] = useState("");
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [formattedPhone, setFormattedPhone] = useState("");

  const totalQuestions = STEPS.filter((s) => s.type === "question").length;
  const answeredCount = Object.keys(answers).length;
  const progress = phase === "quiz" ? (answeredCount / totalQuestions) * 100 : phase === "landing" ? 0 : 100;
  const stepsRemaining = totalQuestions - answeredCount;

  const rawScore = Object.values(answers).reduce((a, b) => a + b, 0);
  const normalizedScore = Math.round((rawScore / MAX_SCORE) * 100);
  const tier = TIERS.find((t) => normalizedScore >= t.min && normalizedScore <= t.max) || TIERS[0];

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

  // ─── OTP: Send verification code ───
  const handleCaptureSubmit = async () => {
    if (!name.trim() || !phone.trim()) {
      toast({ title: "Name and phone number are required", variant: "destructive" });
      return;
    }
    setOtpSending(true);
    setOtpError("");
    try {
      const { data, error } = await supabase.functions.invoke("send-otp", {
        body: { phone: phone.trim() },
      });
      if (error) throw error;
      setFormattedPhone(data?.formatted_phone || phone.trim());
      setPhase("verify");
    } catch (err) {
      console.error("OTP send error:", err);
      setOtpError("Failed to send verification code. Please check your number and try again.");
    }
    setOtpSending(false);
  };

  // ─── OTP: Verify code & submit lead ───
  const handleVerifyOtp = async () => {
    if (!otpCode.trim() || otpCode.trim().length !== 4) {
      setOtpError("Please enter the 4-digit code.");
      return;
    }
    setOtpVerifying(true);
    setOtpError("");
    try {
      const { data, error } = await supabase.functions.invoke("verify-otp", {
        body: { phone: formattedPhone, code: otpCode.trim() },
      });
      if (error) throw error;
      if (!data?.verified) {
        setOtpError(data?.error || "Invalid code. Please try again.");
        setOtpVerifying(false);
        return;
      }

      // Verified! Now submit lead and trigger funnel-call
      setPhase("analyzing");

      const questionSteps = STEPS.filter(s => s.type === "question");
      const summaryLines = questionSteps.map((s) => {
        const q = s.data as QuizQuestion;
        const stepIdx = STEPS.indexOf(s);
        const selectedScore = answers[stepIdx];
        const selectedOpt = q.options.find(o => o.score === selectedScore);
        return `Q: ${q.question}\nA: ${selectedOpt?.label || "N/A"}`;
      });
      const quizSummary = summaryLines.join("\n\n");

      // Save funnel lead
      await supabase.from("funnel_leads" as any).insert({
        name: name.trim(),
        email: email.trim() || null,
        phone: formattedPhone,
        score: normalizedScore,
        tier: tier.label,
        answers: answers,
        funnel_name: "intake",
      });

      // Save waitlist entry
      if (email.trim()) {
        await supabase.from("waitlist").insert({
          email: email.trim(),
          note: `[PFSW Quiz] Name: ${name.trim()} | Phone: ${formattedPhone} | Score: ${normalizedScore}/100 (${tier.label})`,
        });
      }

      // Call funnel-call: creates CRM lead + sends SMS with callback number
      const { data: funnelData } = await supabase.functions.invoke("funnel-call", {
        body: {
          phone_number: formattedPhone,
          respondent_name: name.trim(),
          respondent_email: email.trim(),
          quiz_score: normalizedScore,
          quiz_result_label: tier.label,
          quiz_title: "Automation Readiness Quiz",
          quiz_questions_summary: quizSummary,
        },
      });

      setCallbackNumber(funnelData?.callback_number || "(866) 642-9937");
      setTimeout(() => setPhase("result"), 3000);
    } catch (err) {
      console.error("Verify/submit error:", err);
      setOtpError("Something went wrong. Please try again.");
      setPhase("verify");
    }
    setOtpVerifying(false);
  };

  const handleResendOtp = async () => {
    setOtpSending(true);
    setOtpError("");
    setOtpCode("");
    try {
      await supabase.functions.invoke("send-otp", { body: { phone: phone.trim() } });
    } catch {
      setOtpError("Failed to resend. Please try again.");
    }
    setOtpSending(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress bar */}
      {(phase === "quiz" || phase === "capture") && (
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

      {/* Brand header */}
      <header className="fixed top-0 left-0 right-0 z-50 py-3 bg-background/80 backdrop-blur-sm border-b border-border">
        <p className="text-center text-xs font-bold tracking-[0.3em] uppercase text-foreground">
          PFSW
        </p>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="w-full max-w-xl">
          <AnimatePresence mode="wait">
            {/* ─── LANDING ─── */}
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
                    FREE BUSINESS AUTOMATION AUDIT
                  </p>
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-foreground leading-tight">
                    Is Manual Prospecting{" "}
                    <span className="text-primary">Killing Your Growth?</span>
                  </h1>
                  <p className="text-muted-foreground text-base md:text-lg max-w-md mx-auto leading-relaxed">
                    Answer 6 quick questions. Get your Automation Readiness Score and see how quiz funnels + AI agents can transform your business.
                  </p>
                </div>

                <Button
                  size="lg"
                  className="text-base md:text-lg px-10 py-7 font-bold tracking-wide gold-glow-strong"
                  onClick={() => setPhase("quiz")}
                >
                  TAKE THE FREE QUIZ <ArrowRight className="ml-2 h-5 w-5" />
                </Button>

                <div className="flex items-center justify-center gap-4 text-muted-foreground text-xs">
                  <div className="flex items-center gap-1.5">
                    <Bot className="h-3.5 w-3.5 text-primary" />
                    <span>AI-Powered</span>
                  </div>
                  <span>·</span>
                  <div className="flex items-center gap-1.5">
                    <Target className="h-3.5 w-3.5 text-primary" />
                    <span>Quiz Funnels</span>
                  </div>
                  <span>·</span>
                  <div className="flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5 text-primary" />
                    <span>6 Agents</span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ─── QUIZ ─── */}
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

            {/* ─── CAPTURE (Name, Phone required, Email optional) ─── */}
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
                  <CheckCircle2 className="h-10 w-10 mx-auto text-emerald-400" />
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                    Your Report Is Ready!
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    Enter your details to receive your personalized Automation Readiness Report. We'll send a verification code to confirm your number.
                  </p>
                </div>
                <Card className="bg-card border-border">
                  <CardContent className="pt-6 space-y-4">
                    <div>
                      <label className="text-sm font-semibold text-foreground mb-1.5 block">Full Name *</label>
                      <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sarah Johnson" className="bg-secondary border-border" />
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-foreground mb-1.5 block">Phone Number *</label>
                      <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 000-0000" className="bg-secondary border-border" />
                      <p className="text-xs text-muted-foreground mt-1">We'll send a 4-digit verification code to confirm your number.</p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-foreground mb-1.5 block">Email Address <span className="font-normal text-muted-foreground">(optional)</span></label>
                      <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="sarah@business.com" className="bg-secondary border-border" />
                    </div>
                    {otpError && <p className="text-sm text-destructive text-center">{otpError}</p>}
                    <Button className="w-full py-6 text-base font-bold gold-glow-strong" onClick={handleCaptureSubmit} disabled={!name.trim() || !phone.trim() || otpSending}>
                      {otpSending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Verify & Continue <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                    <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
                      <Lock className="h-3 w-3" />
                      <span>Your information is secure and never shared.</span>
                    </div>
                    <button onClick={() => setPhase("quiz")} className="block mx-auto text-xs text-muted-foreground hover:text-foreground transition-colors">
                      ← Go Back
                    </button>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* ─── VERIFY OTP ─── */}
            {phase === "verify" && (
              <motion.div
                key="verify"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="space-y-6"
              >
                <div className="text-center space-y-3">
                  <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Shield className="h-8 w-8 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">Verify Your Phone Number</h2>
                  <p className="text-sm text-muted-foreground">
                    We sent a 4-digit code to <span className="font-semibold text-foreground">{formattedPhone || phone}</span>
                  </p>
                </div>
                <Card className="bg-card border-border">
                  <CardContent className="pt-6 space-y-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1 block">Enter 4-Digit Code</label>
                      <Input
                        value={otpCode}
                        onChange={(e) => { setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 4)); setOtpError(""); }}
                        placeholder="1234"
                        className="text-center text-2xl tracking-[0.5em] font-mono h-14 bg-secondary border-border"
                        maxLength={4}
                        inputMode="numeric"
                        autoFocus
                      />
                    </div>
                    {otpError && <p className="text-sm text-destructive text-center">{otpError}</p>}
                    <Button className="w-full py-6 text-base font-bold gold-glow-strong" onClick={handleVerifyOtp} disabled={otpVerifying || otpCode.length !== 4}>
                      {otpVerifying ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Verify & Get My Results <ArrowRight className="ml-2 h-5 w-5" /></>}
                    </Button>
                    <div className="text-center">
                      <button onClick={handleResendOtp} disabled={otpSending} className="text-sm text-primary hover:underline disabled:opacity-50">
                        {otpSending ? "Sending..." : "Didn't receive the code? Resend"}
                      </button>
                    </div>
                    <button onClick={() => setPhase("capture")} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mx-auto transition-colors">
                      <ArrowLeft className="h-4 w-4" /> Change phone number
                    </button>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* ─── ANALYZING ─── */}
            {phase === "analyzing" && (
              <motion.div
                key="analyzing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center space-y-6 py-12"
              >
                <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" />
                <p className="text-lg font-semibold text-foreground">Analyzing your automation profile...</p>
                <p className="text-sm text-muted-foreground">Comparing against top-performing digital entrepreneurs</p>
              </motion.div>
            )}

            {/* ─── RESULTS ─── */}
            {phase === "result" && (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="space-y-8"
              >
                <div className="text-center space-y-2">
                  <p className="text-xs text-primary tracking-widest uppercase font-semibold">Your Results</p>
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                    🎯 {name.split(" ")[0]}, here's your score.
                  </h2>
                  <p className="text-muted-foreground text-sm">Your Automation Readiness Assessment is complete.</p>
                </div>

                {/* Score Card */}
                <Card className="bg-secondary border-border overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row items-center gap-6">
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
                      <div className="flex-1 text-center sm:text-left space-y-2">
                        <h3 className={`text-xl font-bold ${tier.color}`}>{tier.label}</h3>
                        <p className="text-muted-foreground text-sm leading-relaxed">{tier.message}</p>
                      </div>
                    </div>
                    <div className={`mt-4 px-4 py-2.5 rounded-lg border text-center text-sm font-semibold ${tier.urgencyColor}`}>
                      ⚡ {tier.urgency}
                    </div>
                  </CardContent>
                </Card>

                {/* Call CTA */}
                <Card className="bg-emerald-500/10 border-emerald-500/30">
                  <CardContent className="p-6 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                        <Phone className="h-6 w-6 text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-base font-bold text-foreground">Talk to a Growth Specialist Now</p>
                        <p className="text-sm text-muted-foreground">Our AI specialist is standing by to walk you through your personalized growth plan — no obligation.</p>
                      </div>
                    </div>
                    {callbackNumber && (
                      <a href={`tel:${callbackNumber}`} className="flex items-center justify-center gap-2 w-full h-12 rounded-full bg-emerald-500 text-white font-bold text-lg hover:opacity-90 transition-opacity">
                        <Phone className="h-5 w-5" />
                        Call Now: {callbackNumber}
                      </a>
                    )}
                    <p className="text-xs text-center text-muted-foreground">📱 We also sent you a text with this number. Call anytime — we'll have your results ready.</p>
                  </CardContent>
                </Card>

                {/* Insights */}
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
                    <h3 className="text-sm font-semibold text-foreground">What PFSW Can Do For You</h3>
                    {normalizedScore < 40 && (
                      <>
                        <Rec icon={Search} text="Deploy AI Scout Agents to find qualified prospects in your niche automatically — no more cold DMs." />
                        <Rec icon={Target} text="Build a quiz funnel that pre-qualifies buyers so you only talk to high-intent prospects." />
                        <Rec icon={Mail} text="Set up automated email + SMS sequences that nurture leads without manual follow-up." />
                      </>
                    )}
                    {normalizedScore >= 40 && normalizedScore < 75 && (
                      <>
                        <Rec icon={Target} text="Replace static landing pages with interactive quiz funnels that score and segment prospects automatically." />
                        <Rec icon={Bot} text="Add AI agents that handle prospecting, outreach, and follow-up while you focus on closing." />
                        <Rec icon={Phone} text="Activate the Voice Booker agent to call qualified leads and book meetings on your calendar." />
                      </>
                    )}
                    {normalizedScore >= 75 && (
                      <>
                        <Rec icon={Zap} text="Scale your system with autonomous workflows — describe a goal and let agents execute end-to-end." />
                        <Rec icon={TrendingUp} text="Use competitor intel agents to find positioning gaps and dominate your market." />
                        <Rec icon={Users} text="White-label your quiz funnels and run them for multiple niches or product lines simultaneously." />
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* CTA */}
                <div className="space-y-3 text-center">
                  <Button
                    size="lg"
                    className="w-full text-base py-6 font-bold gold-glow-strong"
                    onClick={() => window.location.href = "/login"}
                  >
                    Get Started with PFSW <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Quiz funnels + AI agents · No credit card required
                  </p>
                </div>

                {/* Trust footer */}
                <div className="flex items-center justify-center gap-6 text-muted-foreground text-[10px] tracking-widest uppercase pt-4 border-t border-border">
                  <span>Quiz Funnels</span>
                  <span>•</span>
                  <span>6 AI Agents</span>
                  <span>•</span>
                  <span>Autonomous Workflows</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

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

function Rec({ text, icon: Icon }: { text: string; icon: typeof CheckCircle2 }) {
  return (
    <div className="flex gap-2 items-start">
      <Icon className="h-4 w-4 text-primary mt-0.5 shrink-0" />
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
