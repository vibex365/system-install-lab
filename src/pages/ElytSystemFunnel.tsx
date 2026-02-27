import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  CheckCircle2,
  ArrowRight,
  Loader2,
  Lock,
  Phone,
  Zap,
  Target,
  TrendingUp,
  Bot,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSEO } from "@/hooks/use-seo";

// ─── Quiz Questions: Selling the PFSW system to ELYT travel members ─────────

interface QuizOption {
  label: string;
  score: number;
}

interface QuizQuestion {
  question: string;
  options: QuizOption[];
  hint?: string;
}

const QUESTIONS: QuizQuestion[] = [
  {
    question: "How are you currently finding new travel prospects?",
    options: [
      { label: "Friends and family — my warm market", score: 5 },
      { label: "Posting on social media and hoping for DMs", score: 15 },
      { label: "Running paid ads to a landing page", score: 25 },
      { label: "I have a full system with automated follow-up", score: 35 },
    ],
  },
  {
    question: "What happens after someone shows interest in your travel opportunity?",
    options: [
      { label: "I send them a generic link and hope they sign up", score: 5 },
      { label: "I message them back manually when I have time", score: 10 },
      { label: "I call or text them within 24 hours", score: 20 },
      { label: "They automatically get qualified and booked on my calendar", score: 35 },
    ],
    hint: "Speed-to-lead is everything in travel MLM.",
  },
  {
    question: "How many leads do you lose because you couldn't follow up fast enough?",
    options: [
      { label: "Most of them — I know I'm leaving money on the table", score: 5 },
      { label: "A lot — I try but life gets in the way", score: 10 },
      { label: "Some — my follow-up is decent but not instant", score: 20 },
      { label: "Very few — my system follows up within minutes", score: 35 },
    ],
  },
  {
    question: "Would you use an AI assistant that qualifies prospects and books calls for you 24/7?",
    options: [
      { label: "Absolutely — I need this yesterday", score: 35 },
      { label: "Yes — show me how it works first", score: 25 },
      { label: "Maybe — I'm curious but skeptical", score: 15 },
      { label: "I prefer doing everything myself", score: 5 },
    ],
  },
  {
    question: "What's your #1 goal for your ELYT travel business in the next 90 days?",
    options: [
      { label: "Get my first 10 sign-ups", score: 15 },
      { label: "Double my current team size", score: 25 },
      { label: "Build a system that works while I travel", score: 35 },
      { label: "Just looking to earn some extra income", score: 10 },
    ],
  },
];

const TIERS = [
  {
    min: 0, max: 30,
    label: "Manual Mode",
    color: "text-red-400",
    message: "You're doing everything by hand — and it's costing you sign-ups every single day. Our AI system was built for exactly this.",
    urgency: "Biggest Opportunity",
    urgencyColor: "bg-red-500/20 text-red-400 border-red-500/30",
  },
  {
    min: 31, max: 55,
    label: "Getting There",
    color: "text-amber-400",
    message: "You have some pieces but major gaps in follow-up and qualification are slowing your growth. Automation closes those gaps instantly.",
    urgency: "High Growth Potential",
    urgencyColor: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  },
  {
    min: 56, max: 80,
    label: "Solid Foundation",
    color: "text-primary",
    message: "You're ahead of most ELYT members. Adding AI-powered lead gen and follow-up could 3x your results without more hours.",
    urgency: "Ready to Scale",
    urgencyColor: "bg-primary/20 text-primary border-primary/30",
  },
  {
    min: 81, max: 100,
    label: "System Builder",
    color: "text-emerald-400",
    message: "You already think in systems. Our platform will give you AI agents, quiz funnels, and automated follow-up — all in one.",
    urgency: "Perfect Fit",
    urgencyColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  },
];

const INSIGHTS = [
  { icon: Target, title: "Lead Generation", desc: "AI agents find qualified travel prospects in your area automatically — no more cold messaging." },
  { icon: Bot, title: "Instant Follow-Up", desc: "Our AI calls and texts your leads within seconds, 24/7 — so you never lose a hot prospect again." },
  { icon: MessageSquare, title: "Smart Qualification", desc: "Quiz funnels pre-screen your leads before you ever get on a call — only talk to people ready to join." },
];

const MAX_SCORE = 175;

type Phase = "landing" | "quiz" | "capture" | "verify" | "analyzing" | "result";

export default function ElytSystemFunnel() {
  useSEO({
    title: "Is Your Follow-Up Costing You Sign-Ups? | ELYT × PFSW",
    description: "Take the 2-minute quiz and discover how AI-powered funnels can automate your ELYT travel lead gen, follow-up, and team building.",
  });

  const { toast } = useToast();
  const [phase, setPhase] = useState<Phase>("landing");
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [formattedPhone, setFormattedPhone] = useState("");
  const [callbackNumber, setCallbackNumber] = useState("");

  const rawScore = Object.values(answers).reduce((a, b) => a + b, 0);
  const normalizedScore = Math.round((rawScore / MAX_SCORE) * 100);
  const tier = TIERS.find((t) => normalizedScore >= t.min && normalizedScore <= t.max) || TIERS[0];
  const progress = ((Object.keys(answers).length) / QUESTIONS.length) * 100;

  const handleAnswer = (score: number) => {
    setAnswers((prev) => ({ ...prev, [currentQ]: score }));
    setTimeout(() => {
      if (currentQ < QUESTIONS.length - 1) {
        setCurrentQ((q) => q + 1);
      } else {
        setPhase("capture");
      }
    }, 400);
  };

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
    } catch {
      setOtpError("Failed to send verification code. Check your number and try again.");
    }
    setOtpSending(false);
  };

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

      setPhase("analyzing");

      const summaryLines = QUESTIONS.map((q, i) => {
        const selectedOpt = q.options.find((o) => o.score === answers[i]);
        return `Q: ${q.question}\nA: ${selectedOpt?.label || "N/A"}`;
      });

      await supabase.from("funnel_leads").insert({
        name: name.trim(),
        email: email.trim() || null,
        phone: formattedPhone,
        score: normalizedScore,
        tier: tier.label,
        answers: answers,
        funnel_name: "elyt_system_demo",
      });

      const { data: funnelData } = await supabase.functions.invoke("funnel-call", {
        body: {
          phone_number: formattedPhone,
          respondent_name: name.trim(),
          respondent_email: email.trim(),
          quiz_score: normalizedScore,
          quiz_result_label: tier.label,
          quiz_title: "ELYT System Readiness Quiz",
          quiz_questions_summary: summaryLines.join("\n\n"),
        },
      });

      setCallbackNumber(funnelData?.callback_number || "(866) 479-5373");
      setTimeout(() => setPhase("result"), 3000);
    } catch {
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
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(135deg, #0B1628 0%, #0D1117 50%, #1A0F2E 100%)" }}>
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 py-3 backdrop-blur-sm border-b" style={{ borderColor: "rgba(201,168,76,0.2)", backgroundColor: "rgba(11,22,40,0.9)" }}>
        <div className="flex items-center justify-center gap-2">
          <Sparkles className="h-4 w-4" style={{ color: "#C9A84C" }} />
          <p className="text-xs font-bold tracking-[0.3em] uppercase" style={{ color: "#C9A84C" }}>
            ELYT × PFSW
          </p>
        </div>
      </header>

      {/* Progress */}
      {(phase === "quiz" || phase === "capture") && (
        <div className="fixed top-12 left-0 right-0 z-40 px-4 pt-2">
          <div className="max-w-xl mx-auto">
            <div className="flex justify-between text-[11px] mb-1" style={{ color: "#94A3B8" }}>
              <span>{QUESTIONS.length - Object.keys(answers).length} steps left</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(201,168,76,0.15)" }}>
              <motion.div className="h-full rounded-full" style={{ backgroundColor: "#C9A84C" }} animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }} />
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex items-center justify-center px-4 py-24">
        <div className="w-full max-w-xl">
          <AnimatePresence mode="wait">
            {/* ── LANDING ── */}
            {phase === "landing" && (
              <motion.div key="landing" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="text-center space-y-8">
                <div className="space-y-4">
                  <p className="text-xs tracking-[0.25em] uppercase font-semibold" style={{ color: "#C9A84C" }}>
                    FREE 2-MINUTE ASSESSMENT
                  </p>
                  <h1 className="text-3xl md:text-5xl font-black leading-tight" style={{ color: "#FFFFFF" }}>
                    Is Your Follow-Up{" "}
                    <span style={{ color: "#C9A84C" }}>Costing You Sign-Ups?</span>
                  </h1>
                  <p className="text-base md:text-lg max-w-md mx-auto leading-relaxed" style={{ color: "#94A3B8" }}>
                    Discover how AI-powered funnels can automate your ELYT travel lead gen, follow-up, and team building — while you travel.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto text-center">
                  {[
                    { icon: Target, label: "AI Lead Gen" },
                    { icon: Bot, label: "24/7 Follow-Up" },
                    { icon: Zap, label: "Auto Qualify" },
                  ].map(({ icon: Icon, label }) => (
                    <div key={label} className="rounded-xl p-3" style={{ backgroundColor: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.15)" }}>
                      <Icon className="h-5 w-5 mx-auto mb-1" style={{ color: "#C9A84C" }} />
                      <p className="text-[10px] font-semibold" style={{ color: "#C9A84C" }}>{label}</p>
                    </div>
                  ))}
                </div>

                <Button
                  size="lg"
                  className="text-base md:text-lg px-10 py-7 font-bold tracking-wide"
                  style={{ backgroundColor: "#C9A84C", color: "#0B1628" }}
                  onClick={() => setPhase("quiz")}
                >
                  TAKE THE FREE QUIZ <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <p className="text-xs" style={{ color: "#64748B" }}>⭐ Built for ELYT Lifestyle travel entrepreneurs</p>
              </motion.div>
            )}

            {/* ── QUIZ ── */}
            {phase === "quiz" && (
              <motion.div key={`q-${currentQ}`} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} className="space-y-6">
                <h2 className="text-xl md:text-2xl font-bold" style={{ color: "#FFFFFF" }}>{QUESTIONS[currentQ].question}</h2>
                {QUESTIONS[currentQ].hint && (
                  <p className="text-xs" style={{ color: "#C9A84C" }}>💡 {QUESTIONS[currentQ].hint}</p>
                )}
                <div className="space-y-3">
                  {QUESTIONS[currentQ].options.map((opt) => (
                    <button
                      key={opt.label}
                      onClick={() => handleAnswer(opt.score)}
                      className="w-full text-left px-5 py-4 rounded-xl border transition-all hover:scale-[1.02] text-sm font-medium"
                      style={{ borderColor: "rgba(201,168,76,0.2)", backgroundColor: "rgba(201,168,76,0.05)", color: "#FFFFFF" }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#C9A84C"; e.currentTarget.style.backgroundColor = "rgba(201,168,76,0.12)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(201,168,76,0.2)"; e.currentTarget.style.backgroundColor = "rgba(201,168,76,0.05)"; }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── CAPTURE ── */}
            {phase === "capture" && (
              <motion.div key="capture" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-bold" style={{ color: "#FFFFFF" }}>Your results are ready! 🎉</h2>
                  <p className="text-sm" style={{ color: "#94A3B8" }}>Enter your info to unlock your System Readiness Score and get a personalized AI demo.</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider mb-1 block" style={{ color: "#C9A84C" }}>Full Name *</label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="bg-transparent" style={{ borderColor: "rgba(201,168,76,0.3)", color: "#FFFFFF" }} />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider mb-1 block" style={{ color: "#C9A84C" }}>Email</label>
                    <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" className="bg-transparent" style={{ borderColor: "rgba(201,168,76,0.3)", color: "#FFFFFF" }} />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider mb-1 block" style={{ color: "#C9A84C" }}>Phone Number *</label>
                    <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 (555) 123-4567" className="bg-transparent" style={{ borderColor: "rgba(201,168,76,0.3)", color: "#FFFFFF" }} />
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs" style={{ color: "#64748B" }}>
                  <Lock className="h-3 w-3" /> We'll text you a 4-digit PIN to verify. No spam.
                </div>
                <Button
                  size="lg"
                  className="w-full text-base font-bold py-6"
                  style={{ backgroundColor: "#C9A84C", color: "#0B1628" }}
                  onClick={handleCaptureSubmit}
                  disabled={otpSending}
                >
                  {otpSending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sending Code...</> : <>Unlock My Results <ArrowRight className="ml-2 h-5 w-5" /></>}
                </Button>
              </motion.div>
            )}

            {/* ── VERIFY OTP ── */}
            {phase === "verify" && (
              <motion.div key="verify" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="text-center space-y-2">
                  <Phone className="h-10 w-10 mx-auto" style={{ color: "#C9A84C" }} />
                  <h2 className="text-2xl font-bold" style={{ color: "#FFFFFF" }}>Verify Your Number</h2>
                  <p className="text-sm" style={{ color: "#94A3B8" }}>Enter the 4-digit code sent to <strong style={{ color: "#C9A84C" }}>{formattedPhone}</strong></p>
                </div>
                <Input
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  placeholder="1234"
                  maxLength={4}
                  className="text-center text-3xl tracking-[0.5em] bg-transparent font-mono"
                  style={{ borderColor: "rgba(201,168,76,0.4)", color: "#FFFFFF" }}
                />
                {otpError && <p className="text-xs text-center text-red-400">{otpError}</p>}
                <Button
                  size="lg"
                  className="w-full text-base font-bold py-6"
                  style={{ backgroundColor: "#C9A84C", color: "#0B1628" }}
                  onClick={handleVerifyOtp}
                  disabled={otpVerifying}
                >
                  {otpVerifying ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Verifying...</> : "Verify & See My Results"}
                </Button>
                <button onClick={handleResendOtp} disabled={otpSending} className="w-full text-center text-xs underline" style={{ color: "#64748B" }}>
                  {otpSending ? "Resending..." : "Didn't receive a code? Resend"}
                </button>
              </motion.div>
            )}

            {/* ── ANALYZING ── */}
            {phase === "analyzing" && (
              <motion.div key="analyzing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-6 py-12">
                <Loader2 className="h-12 w-12 mx-auto animate-spin" style={{ color: "#C9A84C" }} />
                <h2 className="text-xl font-bold" style={{ color: "#FFFFFF" }}>Analyzing your responses...</h2>
                <p className="text-sm" style={{ color: "#94A3B8" }}>Building your personalized system recommendation.</p>
              </motion.div>
            )}

            {/* ── RESULT ── */}
            {phase === "result" && (
              <motion.div key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-bold" style={{ color: "#FFFFFF" }}>
                    {name ? `${name}, here's` : "Here's"} your System Readiness Score
                  </h2>
                </div>

                {/* Score card */}
                <div className="rounded-2xl p-6 text-center space-y-3" style={{ backgroundColor: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.2)" }}>
                  <motion.p className="text-6xl font-black" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}>
                    <span className={tier.color}>{normalizedScore}</span>
                    <span className="text-lg font-normal" style={{ color: "#64748B" }}>/100</span>
                  </motion.p>
                  <p className={`text-lg font-bold ${tier.color}`}>{tier.label}</p>
                  <span className={`text-xs px-3 py-1 rounded-full border ${tier.urgencyColor}`}>{tier.urgency}</span>
                  <p className="text-sm pt-2" style={{ color: "#94A3B8" }}>{tier.message}</p>
                </div>

                {/* What you get */}
                <div className="space-y-3">
                  <h3 className="text-sm font-bold" style={{ color: "#C9A84C" }}>What our system does for you:</h3>
                  {INSIGHTS.map(({ icon: Icon, title, desc }) => (
                    <div key={title} className="rounded-xl p-4 flex items-start gap-3" style={{ backgroundColor: "rgba(201,168,76,0.05)", border: "1px solid rgba(201,168,76,0.15)" }}>
                      <Icon className="h-5 w-5 shrink-0 mt-0.5" style={{ color: "#C9A84C" }} />
                      <div>
                        <p className="text-sm font-semibold" style={{ color: "#FFFFFF" }}>{title}</p>
                        <p className="text-xs" style={{ color: "#94A3B8" }}>{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Callback CTA */}
                <div className="rounded-2xl p-6 text-center space-y-4" style={{ backgroundColor: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.3)" }}>
                  <Phone className="h-8 w-8 mx-auto" style={{ color: "#C9A84C" }} />
                  <h3 className="text-lg font-bold" style={{ color: "#FFFFFF" }}>Want to see it in action?</h3>
                  <p className="text-sm" style={{ color: "#94A3B8" }}>
                    We just texted you a callback number. Call now and our AI agent will walk you through your personalized results and show you exactly how the system works for your ELYT business.
                  </p>
                  <p className="text-2xl font-black tracking-wider" style={{ color: "#C9A84C" }}>{callbackNumber}</p>
                  <p className="text-xs" style={{ color: "#64748B" }}>📱 Check your texts for the callback number</p>
                </div>

                <p className="text-center text-xs" style={{ color: "#475569" }}>
                  Powered by PFSW · Built for ELYT Lifestyle
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
