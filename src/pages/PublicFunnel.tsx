import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, ArrowRight, CheckCircle2, Loader2, AlertTriangle,
  Sparkles, Phone, Search, BarChart3, Clock, TrendingUp, Check,
} from "lucide-react";

interface QuizQuestion {
  id: string;
  question: string;
  type: "single" | "multi";
  options: string[];
}

interface FunnelConfig {
  title: string;
  slug: string;
  quiz_config: { questions?: QuizQuestion[] };
  brand_config: { niche?: string; headline?: string; description?: string; primary_color?: string; accent_color?: string };
  user_id: string;
  partner_mode?: boolean;
  affiliate_url?: string;
  completion_action?: string;
}

type Phase = "loading" | "not_found" | "intro" | "quiz" | "analyzing" | "insight" | "capture" | "otp_verify" | "generating" | "result" | "booking" | "confirmed";

const TIERS = [
  { min: 0, max: 25, label: "Critical", color: "text-red-400", bg: "bg-red-500/10", desc: "Major gaps identified. Immediate action recommended." },
  { min: 26, max: 50, label: "Needs Work", color: "text-amber-400", bg: "bg-amber-500/10", desc: "Several areas need improvement for better results." },
  { min: 51, max: 75, label: "Solid", color: "text-primary", bg: "bg-primary/10", desc: "Good foundation. Fine-tuning will unlock your next level." },
  { min: 76, max: 100, label: "Excellent", color: "text-emerald-400", bg: "bg-emerald-500/10", desc: "You're ahead of most. Let's optimize for peak performance." },
];

const ANALYZING_TEXTS = [
  "Analyzing your response...",
  "Comparing against top operators...",
  "Detecting execution gaps...",
];

const GENERATING_STEPS = [
  "Building your automation profile...",
  "Analyzing industry benchmarks...",
  "Generating personalized insights...",
  "Preparing your readiness report...",
];

// Map question answers to simple scores
function scoreAnswer(optionIndex: number, totalOptions: number): number {
  // Later options = higher score (assumes options go from worst to best)
  return Math.round(((optionIndex + 1) / totalOptions) * 25);
}

export default function PublicFunnel() {
  const { slug } = useParams<{ slug: string }>();
  const { toast } = useToast();

  const [funnel, setFunnel] = useState<FunnelConfig | null>(null);
  const [phase, setPhase] = useState<Phase>("loading");
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, { label: string; score: number }>>({});
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [analyzingText, setAnalyzingText] = useState(0);
  const [currentInsight, setCurrentInsight] = useState("");
  const [generatingStep, setGeneratingStep] = useState(0);
  const [callbackNumber] = useState("(866) 479-5373");

  // OTP state
  const [otpCode, setOtpCode] = useState("");
  const [otpSending, setOtpSending] = useState(false);
  const [otpError, setOtpError] = useState("");

  useEffect(() => {
    if (!slug) { setPhase("not_found"); return; }
    (async () => {
      const { data, error } = await supabase
        .from("user_funnels")
        .select("title, slug, quiz_config, brand_config, user_id, partner_mode, affiliate_url, completion_action")
        .eq("slug", slug)
        .eq("status", "active")
        .single();
      if (error || !data) { setPhase("not_found"); return; }
      setFunnel({
        ...data,
        quiz_config: typeof data.quiz_config === "object" ? (data.quiz_config as any) : {},
        brand_config: typeof data.brand_config === "object" ? (data.brand_config as any) : {},
        partner_mode: (data as any).partner_mode || false,
        affiliate_url: (data as any).affiliate_url || "",
        completion_action: (data as any).completion_action || "callback",
      });
      setPhase("intro");
    })();
  }, [slug]);

  const questions = funnel?.quiz_config?.questions || [];
  const totalQ = questions.length;
  const answeredCount = Object.keys(answers).length;
  const progress = totalQ > 0 ? ((currentQ + (phase === "insight" ? 1 : 0)) / totalQ) * 100 : 0;

  const computeScore = useCallback(() => {
    const vals = Object.values(answers);
    if (vals.length === 0) return 0;
    const total = vals.reduce((s, a) => s + a.score, 0);
    const maxPossible = totalQ * 25;
    return maxPossible > 0 ? Math.round((total / maxPossible) * 100) : 0;
  }, [answers, totalQ]);

  // Simple insight generator based on question
  const getInsight = (qIdx: number): string => {
    const q = questions[qIdx];
    if (!q) return "";
    const niche = funnel?.brand_config?.niche || "business";
    const insights: Record<string, string[]> = {
      mlm: [
        "Most top MLM earners automate their prospecting — this is where AI agents change the game.",
        "Your follow-up speed directly correlates with enrollment rates. Automation closes this gap.",
        "The leaders in your space are already using AI funnels to pre-qualify before they ever get on a call.",
      ],
      affiliate: [
        "Affiliate marketers who automate their lead nurture see 3x higher conversion rates.",
        "Speed to contact is everything in affiliate marketing — AI handles this 24/7.",
        "Your competitors are already scoring leads before they talk to them. Let's level the field.",
      ],
      coaching: [
        "High-ticket coaches who pre-qualify with quizzes book 40% more discovery calls.",
        "Your time is your most valuable asset — AI qualification protects it.",
        "The best coaching businesses systemize intake so they only talk to ideal clients.",
      ],
      default: [
        "Businesses that automate lead qualification close deals 2x faster.",
        "Your response time to new leads is the #1 predictor of conversion.",
        "AI-powered follow-up ensures no lead falls through the cracks.",
      ],
    };
    const pool = insights[niche] || insights.default;
    return pool[qIdx % pool.length];
  };

  const handleSelect = (optionLabel: string, optionIndex: number) => {
    const score = scoreAnswer(optionIndex, questions[currentQ].options.length);
    setAnswers(prev => ({ ...prev, [currentQ]: { label: optionLabel, score } }));

    // Show analyzing animation
    setPhase("analyzing");
    setAnalyzingText(0);
    let textIdx = 0;
    const interval = setInterval(() => {
      textIdx++;
      if (textIdx < ANALYZING_TEXTS.length) {
        setAnalyzingText(textIdx);
      } else {
        clearInterval(interval);
        const insight = getInsight(currentQ);
        if (insight && currentQ < totalQ - 1) {
          setCurrentInsight(insight);
          setPhase("insight");
        } else {
          advanceQuestion();
        }
      }
    }, 600);
  };

  const advanceQuestion = () => {
    if (currentQ < totalQ - 1) {
      setCurrentQ(prev => prev + 1);
      setPhase("quiz");
    } else {
      setPhase("capture");
    }
  };

  const handleContinueFromInsight = () => {
    advanceQuestion();
  };

  // ── OTP Flow ──
  const handleSendOtp = async () => {
    if (!phone.trim()) return;
    setOtpSending(true);
    setOtpError("");
    try {
      const { data, error } = await supabase.functions.invoke("send-otp", {
        body: { phone: phone.trim() },
      });
      if (error || data?.error) {
        setOtpError(data?.error || "Failed to send code");
      } else {
        setPhase("otp_verify");
      }
    } catch {
      setOtpError("Failed to send verification code");
    }
    setOtpSending(false);
  };

  const handleVerifyOtp = async () => {
    if (!otpCode.trim()) return;
    setOtpSending(true);
    setOtpError("");
    try {
      const { data, error } = await supabase.functions.invoke("verify-otp", {
        body: { phone: phone.trim(), code: otpCode.trim() },
      });
      if (error || !data?.verified) {
        setOtpError(data?.error || "Invalid code");
        setOtpSending(false);
        return;
      }
      setOtpSending(false);
      await handleSubmitAfterVerify();
    } catch {
      setOtpError("Verification failed");
      setOtpSending(false);
    }
  };

  const handleCaptureSubmit = async () => {
    if (!name.trim() || !email.trim()) {
      toast({ title: "Name and email are required", variant: "destructive" });
      return;
    }
    if (phone.trim()) {
      await handleSendOtp();
    } else {
      await handleSubmitAfterVerify();
    }
  };

  const handleSubmitAfterVerify = async () => {
    if (!funnel) return;
    setSubmitting(true);

    const score = computeScore();
    const tier = TIERS.find(t => score >= t.min && score <= t.max) || TIERS[0];

    // Start generating animation
    setPhase("generating");
    setGeneratingStep(0);
    let step = 0;
    const stepInterval = setInterval(() => {
      step++;
      if (step < GENERATING_STEPS.length) setGeneratingStep(step);
      else clearInterval(stepInterval);
    }, 900);

    try {
      const summaryLines = questions.map((q, i) =>
        `Q: ${q.question}\nA: ${answers[i]?.label || "N/A"} (score: ${answers[i]?.score || 0})`
      );
      const quizSummary = summaryLines.join("\n\n");

      // Save funnel lead
      await supabase.from("funnel_leads").insert({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
        score,
        tier: tier.label,
        answers: Object.fromEntries(Object.entries(answers).map(([k, v]) => [k, v.label])) as any,
        funnel_name: funnel.slug,
        funnel_owner_id: funnel.user_id,
      });

      // Trigger funnel-call for SMS + CRM lead creation + call trigger
      if (phone.trim()) {
        try {
          await supabase.functions.invoke("funnel-call", {
            body: {
              phone_number: phone.trim(),
              respondent_name: name.trim(),
              respondent_email: email.trim(),
              quiz_score: score,
              quiz_result_label: tier.label,
              quiz_title: funnel.title,
              quiz_questions_summary: quizSummary,
              funnel_slug: funnel.slug,
              funnel_owner_id: funnel.user_id,
            },
          });
        } catch { /* non-blocking */ }
      }

      // Wait for generating animation to finish
      setTimeout(() => {
        if (phone.trim() && score >= 50) {
          // High-intent lead with phone → trigger call
          setPhase("booking");
          setTimeout(() => setPhase("confirmed"), 4000);
        } else {
          setPhase("result");
        }
      }, 4000);
    } catch {
      toast({ title: "Something went wrong", variant: "destructive" });
      setPhase("capture");
    } finally {
      setSubmitting(false);
    }
  };

  const score = computeScore();
  const tier = TIERS.find(t => score >= t.min && score <= t.max) || TIERS[0];

  // ─── RENDERS ───

  if (phase === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (phase === "not_found") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <AlertTriangle className="h-12 w-12 text-muted-foreground" />
        <h1 className="text-xl font-bold text-foreground">Funnel Not Found</h1>
        <p className="text-sm text-muted-foreground">This quiz funnel doesn't exist or isn't published yet.</p>
        <Link to="/" className="text-sm text-primary hover:underline">← Back to home</Link>
      </div>
    );
  }

  const headline = funnel?.brand_config?.headline || funnel?.title || "Take the Quiz";
  const description = funnel?.brand_config?.description || "Answer a few quick questions to get your personalized score.";

  const brandPrimary = funnel?.brand_config?.primary_color;
  const brandAccent = funnel?.brand_config?.accent_color;

  // Convert hex to HSL values string for CSS custom properties
  const hexToHsl = (hex: string): string => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      else if (max === g) h = ((b - r) / d + 2) / 6;
      else h = ((r - g) / d + 4) / 6;
    }
    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  };

  const brandStyle: React.CSSProperties = {};
  if (brandPrimary) {
    (brandStyle as any)["--primary"] = hexToHsl(brandPrimary);
  }
  if (brandAccent) {
    (brandStyle as any)["--accent"] = hexToHsl(brandAccent);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8" style={brandStyle}>
      <div className="w-full max-w-2xl">
        <AnimatePresence mode="wait">

          {/* ── INTRO ── */}
          {phase === "intro" && (
            <motion.div key="intro" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <Card className="overflow-hidden border-border">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-primary/5 pointer-events-none" />
                <CardHeader className="text-center relative z-10 pb-2">
                  <div className="mx-auto mb-4 size-16 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                    <Sparkles className="size-8 text-primary" />
                  </div>
                  <CardTitle className="text-2xl md:text-3xl font-bold">{headline}</CardTitle>
                  <p className="text-muted-foreground mt-3 text-sm md:text-base">{description}</p>
                </CardHeader>
                <CardContent className="relative z-10 space-y-6">
                  <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5"><Clock className="size-3.5" /> Under 2 minutes</span>
                    <span className="flex items-center gap-1.5"><BarChart3 className="size-3.5" /> Instant Results</span>
                    <span className="flex items-center gap-1.5"><Sparkles className="size-3.5" /> AI-Powered</span>
                  </div>
                  <Progress value={0} className="h-1.5" />
                  <Button onClick={() => setPhase("quiz")} className="w-full gap-2 h-12 text-base" size="lg">
                    Begin Assessment <ArrowRight className="size-5" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ── QUIZ ── */}
          {phase === "quiz" && questions[currentQ] && (
            <motion.div key={`q-${currentQ}`} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.3 }}>
              <Card>
                <CardHeader>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{funnel?.title}</span>
                      <span>{currentQ + 1} / {totalQ}</span>
                    </div>
                    <Progress value={progress} className="h-1.5 transition-all duration-500" />
                  </div>
                  <CardTitle className="text-xl mt-4">{questions[currentQ].question}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {questions[currentQ].options.map((opt, i) => {
                    const selected = answers[currentQ]?.label === opt;
                    return (
                      <Button
                        key={opt}
                        variant={selected ? "default" : "outline"}
                        className="w-full justify-start text-left h-auto py-3 px-4"
                        onClick={() => handleSelect(opt, i)}
                      >
                        {opt}
                      </Button>
                    );
                  })}
                  {currentQ > 0 && (
                    <button onClick={() => { setCurrentQ(prev => prev - 1); setPhase("quiz"); }} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mt-2">
                      <ArrowLeft className="h-3 w-3" /> Back
                    </button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ── ANALYZING ── */}
          {phase === "analyzing" && (
            <motion.div key="analyzing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Card>
                <CardContent className="py-16 text-center space-y-6">
                  <div className="relative mx-auto w-16 h-16">
                    <Search className="size-8 text-primary absolute inset-0 m-auto" />
                    <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-ping" />
                  </div>
                  <p className="text-sm text-muted-foreground animate-pulse">
                    {ANALYZING_TEXTS[analyzingText]}
                  </p>
                  <Progress value={progress} className="h-1.5 max-w-xs mx-auto" />
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ── INSIGHT ── */}
          {phase === "insight" && (
            <motion.div key="insight" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{funnel?.title}</span>
                      <span>{currentQ + 1} / {totalQ}</span>
                    </div>
                    <Progress value={progress} className="h-1.5" />
                  </div>
                </CardHeader>
              </Card>
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="py-6">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 size-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                      <TrendingUp className="size-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-primary mb-1">Industry Insight</p>
                      <p className="text-sm text-foreground/90">{currentInsight}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Button onClick={handleContinueFromInsight} className="w-full gap-2">
                Continue <ArrowRight className="size-4" />
              </Button>
            </motion.div>
          )}

          {/* ── CAPTURE ── */}
          {phase === "capture" && (
            <motion.div key="capture" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
              <Card>
                <CardHeader className="text-center">
                  <div className="mx-auto mb-3 size-12 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                    <Sparkles className="size-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">Generate Your Personalized Report</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">Enter your details to see your diagnostic results.</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Full Name *</Label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
                  </div>
                  <div className="space-y-2">
                    <Label>Email Address *</Label>
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone (for instant callback)</Label>
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/[^\d+\-() ]/g, ""))}
                      placeholder="+1 555-012-3456"
                    />
                    <p className="text-[10px] text-muted-foreground">Include country code. We'll verify via SMS before showing results.</p>
                  </div>
                  {otpError && <p className="text-sm text-destructive text-center">{otpError}</p>}
                  <Button
                    onClick={handleCaptureSubmit}
                    disabled={!email.trim() || !name.trim() || submitting || otpSending}
                    className="w-full gap-2 h-12"
                    size="lg"
                  >
                    {otpSending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                    {otpSending ? "Sending code..." : "Generate My Report"}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ── OTP VERIFY ── */}
          {phase === "otp_verify" && (
            <motion.div key="otp" initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}>
              <Card>
                <CardHeader className="text-center">
                  <div className="mx-auto mb-3 size-12 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                    <Phone className="size-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">Verify Your Phone</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    We sent a 4-digit code to <span className="font-medium text-foreground">{phone}</span>
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Verification Code</Label>
                    <Input
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
                      placeholder="1234"
                      maxLength={4}
                      className="text-center text-3xl tracking-[0.4em] font-mono"
                    />
                  </div>
                  {otpError && <p className="text-sm text-destructive text-center">{otpError}</p>}
                  <Button onClick={handleVerifyOtp} disabled={otpCode.length !== 4 || otpSending} className="w-full gap-2 h-12" size="lg">
                    {otpSending ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                    Verify & See Results
                  </Button>
                  <button type="button" onClick={handleSendOtp} disabled={otpSending} className="w-full text-xs text-muted-foreground hover:text-primary transition-colors">
                    Didn't receive it? Resend code
                  </button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ── GENERATING ── */}
          {phase === "generating" && (
            <motion.div key="generating" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Card>
                <CardContent className="py-12 space-y-6">
                  <div className="text-center mb-4">
                    <Loader2 className="size-10 text-primary animate-spin mx-auto mb-3" />
                    <p className="font-semibold text-lg">Building Your Readiness Report</p>
                  </div>
                  <div className="space-y-3 max-w-sm mx-auto">
                    {GENERATING_STEPS.map((step, i) => (
                      <div key={i} className={`flex items-center gap-3 transition-all duration-500 ${i <= generatingStep ? "opacity-100" : "opacity-30"}`}>
                        {i < generatingStep ? (
                          <Check className="size-5 text-primary shrink-0" />
                        ) : i === generatingStep ? (
                          <Loader2 className="size-5 text-primary animate-spin shrink-0" />
                        ) : (
                          <div className="size-5 rounded-full border border-muted-foreground/30 shrink-0" />
                        )}
                        <span className="text-sm">{step}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ── BOOKING (call initiated) ── */}
          {phase === "booking" && (
            <motion.div key="booking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Card>
                <CardContent className="py-16 text-center space-y-4">
                  <div className="mx-auto size-16 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 animate-pulse">
                    <Phone className="size-8 text-primary" />
                  </div>
                  <p className="text-lg font-bold text-foreground">
                    {funnel?.partner_mode
                      ? "Call us to review your results — we'll text you your exclusive link after!"
                      : "A PFSW growth specialist will call you shortly!"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {funnel?.partner_mode
                      ? "Our specialist will walk through your quiz results on the call."
                      : "We're connecting you with a live specialist to walk through your results."}
                  </p>
                  <Badge variant="outline" className="text-primary border-primary/30">📞 Call incoming...</Badge>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ── CONFIRMED ── */}
          {phase === "confirmed" && (
            <motion.div key="confirmed" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
              <Card>
                <CardContent className="py-12 text-center space-y-4">
                  <CheckCircle2 className="size-14 text-primary mx-auto" />
                  <h2 className="text-xl font-bold text-foreground">You're All Set{name ? `, ${name.split(" ")[0]}` : ""}!</h2>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    {funnel?.partner_mode
                      ? "After your call, check your texts for your exclusive membership link!"
                      : "A PFSW growth specialist will reach out shortly. In the meantime, you can also call us directly."}
                  </p>
                  <a href={`tel:${callbackNumber.replace(/[^\d+]/g, "")}`} className="inline-flex items-center gap-2 text-primary font-bold text-lg hover:underline">
                    <Phone className="size-5" /> {callbackNumber}
                  </a>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* ── RESULT ── */}
          {phase === "result" && (
            <motion.div key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
              <Card>
                <CardHeader className="text-center">
                  <CheckCircle2 className="size-12 text-primary mx-auto mb-2" />
                  <CardTitle className="text-xl">Your Readiness Score</CardTitle>
                  {tier && <p className={`text-lg font-bold ${tier.color} mt-1`}>{tier.label}</p>}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className={`rounded-2xl p-8 text-center space-y-3 ${tier.bg}`}>
                    <motion.p className={`text-6xl font-black ${tier.color}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}>
                      {score}
                    </motion.p>
                    <p className="text-sm text-muted-foreground">{tier.desc}</p>
                  </div>

                  {/* Answer breakdown */}
                  <div className="space-y-2">
                    {questions.slice(0, 4).map((q, i) => (
                      <div key={i} className="rounded-xl p-3 border border-border bg-card flex items-start gap-3">
                        <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                        <div>
                          <p className="text-xs font-medium text-foreground">{q.question}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Your answer: {answers[i]?.label || "N/A"}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* CTA */}
                  <div className="text-center pt-4 space-y-3">
                    <p className="text-sm font-medium text-foreground">
                      {funnel?.partner_mode
                        ? "Call us to review your results — we'll text you your exclusive link after!"
                        : "Ready to level up your automation?"}
                    </p>
                    <a href={`tel:${callbackNumber.replace(/[^\d+]/g, "")}`} className="inline-flex items-center gap-2 text-primary font-bold text-lg hover:underline">
                      <Phone className="size-5" /> Call Us: {callbackNumber}
                    </a>
                  </div>
                </CardContent>
              </Card>
              <p className="text-center text-xs text-muted-foreground">Powered by PFSW Smart Funnels</p>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Back link */}
      <div className="fixed bottom-4 left-4 z-50">
        <Link to="/" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-3 w-3" /> Back to PFSW
        </Link>
      </div>
    </div>
  );
}
