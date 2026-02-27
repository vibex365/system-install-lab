import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, ArrowRight, CheckCircle2, Lock, Loader2, AlertTriangle,
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
  brand_config: { niche?: string; headline?: string; description?: string };
  user_id: string;
}

type Phase = "loading" | "not_found" | "landing" | "quiz" | "capture" | "result";

const TIERS = [
  { min: 0, max: 25, label: "Critical", color: "text-red-400", bg: "bg-red-500/10", desc: "Major gaps identified. Immediate action recommended." },
  { min: 26, max: 50, label: "Needs Work", color: "text-amber-400", bg: "bg-amber-500/10", desc: "Several areas need improvement for better results." },
  { min: 51, max: 75, label: "Solid", color: "text-primary", bg: "bg-primary/10", desc: "Good foundation. Fine-tuning will unlock your next level." },
  { min: 76, max: 100, label: "Excellent", color: "text-emerald-400", bg: "bg-emerald-500/10", desc: "You're ahead of most. Let's optimize for peak performance." },
];

export default function PublicFunnel() {
  const { slug } = useParams<{ slug: string }>();
  const { toast } = useToast();

  const [funnel, setFunnel] = useState<FunnelConfig | null>(null);
  const [phase, setPhase] = useState<Phase>("loading");
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!slug) { setPhase("not_found"); return; }
    (async () => {
      const { data, error } = await supabase
        .from("user_funnels")
        .select("title, slug, quiz_config, brand_config, user_id")
        .eq("slug", slug)
        .eq("status", "active")
        .single();
      if (error || !data) { setPhase("not_found"); return; }
      setFunnel({
        ...data,
        quiz_config: typeof data.quiz_config === "object" ? (data.quiz_config as any) : {},
        brand_config: typeof data.brand_config === "object" ? (data.brand_config as any) : {},
      });
      setPhase("landing");
    })();
  }, [slug]);

  const questions = funnel?.quiz_config?.questions || [];
  const totalQ = questions.length;
  const answeredCount = Object.keys(answers).length;
  const progress = totalQ > 0 ? (answeredCount / totalQ) * 100 : 0;
  const score = totalQ > 0 ? Math.round((answeredCount / totalQ) * 100) : 0;
  const tier = TIERS.find(t => score >= t.min && score <= t.max) || TIERS[0];

  const handleAnswer = (optionLabel: string) => {
    setAnswers(prev => ({ ...prev, [currentQ]: optionLabel }));
    setTimeout(() => {
      if (currentQ < totalQ - 1) setCurrentQ(s => s + 1);
      else setPhase("capture");
    }, 350);
  };

  const goBack = () => { if (currentQ > 0) setCurrentQ(s => s - 1); };

  const submitLead = async () => {
    if (!name.trim() || !email.trim()) {
      toast({ title: "Name and email are required", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const summaryLines = questions.map((q, i) => `Q: ${q.question}\nA: ${answers[i] || "N/A"}`);
      const quizSummary = summaryLines.join("\n\n");

      await supabase.from("funnel_leads").insert({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
        score,
        tier: tier.label,
        answers: answers as any,
        funnel_name: funnel?.slug || "custom",
        funnel_owner_id: funnel?.user_id || null,
      });

      // Trigger funnel-call for SMS + CRM lead creation
      if (phone.trim()) {
        try {
          await supabase.functions.invoke("funnel-call", {
            body: {
              phone_number: phone.trim(),
              respondent_name: name.trim(),
              respondent_email: email.trim(),
              quiz_score: score,
              quiz_result_label: tier.label,
              quiz_title: funnel?.title || "Quiz Funnel",
              quiz_questions_summary: quizSummary,
              funnel_owner_id: funnel?.user_id,
            },
          });
        } catch { /* non-blocking */ }
      }

      setPhase("result");
    } catch {
      toast({ title: "Something went wrong", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress bar */}
      {(phase === "quiz" || phase === "capture") && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border py-3 px-4">
          <div className="max-w-xl mx-auto">
            <div className="flex justify-between text-[11px] text-muted-foreground mb-1.5">
              <span>{totalQ - answeredCount} step{totalQ - answeredCount !== 1 ? "s" : ""} remaining</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <motion.div className="h-full bg-primary rounded-full" animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }} />
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex items-center justify-center px-4 py-20">
        <div className="w-full max-w-xl">
          <AnimatePresence mode="wait">
            {/* LANDING */}
            {phase === "landing" && (
              <motion.div key="landing" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="text-center space-y-8">
                <div className="space-y-4">
                  <p className="text-xs text-primary tracking-[0.25em] uppercase font-semibold">FREE ASSESSMENT</p>
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-foreground leading-tight">{headline}</h1>
                  <p className="text-muted-foreground text-base md:text-lg max-w-md mx-auto leading-relaxed">{description}</p>
                </div>
                <Button size="lg" className="text-base md:text-lg px-10 py-7 font-bold tracking-wide" onClick={() => setPhase("quiz")}>
                  START THE QUIZ <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <p className="text-xs text-muted-foreground">🔒 Takes under 2 minutes · 100% free</p>
              </motion.div>
            )}

            {/* QUIZ */}
            {phase === "quiz" && questions[currentQ] && (
              <motion.div key={`q-${currentQ}`} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.3 }} className="space-y-6">
                <h2 className="text-xl md:text-2xl font-bold text-foreground">{questions[currentQ].question}</h2>
                <div className="space-y-3">
                  {questions[currentQ].options.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => handleAnswer(opt)}
                      className={`w-full text-left px-5 py-4 rounded-xl border transition-all hover:scale-[1.02] text-sm font-medium ${
                        answers[currentQ] === opt
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border bg-card text-foreground hover:border-primary/50"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                {currentQ > 0 && (
                  <button onClick={goBack} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="h-3 w-3" /> Back
                  </button>
                )}
              </motion.div>
            )}

            {/* CAPTURE */}
            {phase === "capture" && (
              <motion.div key="capture" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-bold text-foreground">Almost there!</h2>
                  <p className="text-sm text-muted-foreground">Where should we send your results?</p>
                </div>
                <div className="space-y-4">
                  <div><label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Full Name *</label>
                    <Input value={name} onChange={e => setName(e.target.value)} placeholder="John Smith" /></div>
                  <div><label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Email Address *</label>
                    <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="john@example.com" type="email" /></div>
                  <div><label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1 block">Phone (optional)</label>
                    <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 (555) 123-4567" type="tel" /></div>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground"><Lock className="h-3 w-3" /> Your information is secure and will never be shared.</div>
                <Button size="lg" className="w-full text-base font-bold py-6" onClick={submitLead} disabled={submitting}>
                  {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Calculating...</> : "Get My Results"}
                </Button>
              </motion.div>
            )}

            {/* RESULT */}
            {phase === "result" && (
              <motion.div key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-bold text-foreground">🎯 Your Results Are In{name ? `, ${name.split(" ")[0]}` : ""}!</h2>
                  <p className="text-sm text-muted-foreground">Here's your personalized assessment</p>
                </div>
                <div className={`rounded-2xl p-8 text-center space-y-3 ${tier.bg}`}>
                  <motion.p className={`text-6xl font-black ${tier.color}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}>
                    {score}
                  </motion.p>
                  <p className={`text-lg font-bold ${tier.color}`}>{tier.label}</p>
                  <p className="text-sm text-muted-foreground">{tier.desc}</p>
                </div>
                <div className="space-y-3">
                  {questions.slice(0, 3).map((q, i) => (
                    <div key={i} className="rounded-xl p-4 border border-border bg-card flex items-start gap-3">
                      <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                      <div>
                        <p className="text-xs font-medium text-foreground">{q.question}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Your answer: {answers[i] || "N/A"}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-center text-xs text-muted-foreground">
                  Powered by PFSW Smart Funnels
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="fixed bottom-4 left-4 z-50">
        <Link to="/" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-3 w-3" /> Back to PFSW
        </Link>
      </div>
    </div>
  );
}
