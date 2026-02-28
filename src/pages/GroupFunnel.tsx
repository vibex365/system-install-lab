import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, ArrowLeft, CheckCircle2, Users, Zap, Target, TrendingUp, Bot, AlertTriangle } from "lucide-react";
import { useSEO } from "@/hooks/use-seo";
import guruHero from "@/assets/guru-quiz-hero.png";

const FB_GROUP_URL = "https://www.facebook.com/share/g/18ewsZUu7t/?mibextid=wwXIfr";

interface QuizOption { label: string; score: number; }
interface QuizQuestion { question: string; options: QuizOption[]; }

const QUESTIONS: QuizQuestion[] = [
  {
    question: "How are you currently getting new customers or clients?",
    options: [
      { label: "Word of mouth / hoping people find me", score: 5 },
      { label: "Posting on social media and praying", score: 10 },
      { label: "Running ads but not sure what's working", score: 20 },
      { label: "I have a real system that generates leads consistently", score: 30 },
    ],
  },
  {
    question: "How much of your sales process is automated?",
    options: [
      { label: "Nothing — I do everything manually", score: 5 },
      { label: "I have a few tools but nothing connected", score: 10 },
      { label: "Some automations but gaps everywhere", score: 20 },
      { label: "Fully automated from lead to close", score: 30 },
    ],
  },
  {
    question: "What happens when a lead comes in at 2 AM?",
    options: [
      { label: "They wait until I wake up (and probably forget)", score: 5 },
      { label: "They get an auto-reply but no real follow-up", score: 15 },
      { label: "They get qualified and booked automatically", score: 30 },
    ],
  },
  {
    question: "How many hours per week do you spend on repetitive tasks?",
    options: [
      { label: "15+ hours — I'm drowning", score: 5 },
      { label: "8-15 hours — it's eating my life", score: 10 },
      { label: "3-8 hours — manageable but annoying", score: 20 },
      { label: "Under 3 hours — systems handle it", score: 30 },
    ],
  },
  {
    question: "What's your biggest frustration right now?",
    options: [
      { label: "I can't find enough leads", score: 10 },
      { label: "Leads go cold before I follow up", score: 10 },
      { label: "I'm working IN the business, not ON it", score: 10 },
      { label: "I know I need systems but don't know where to start", score: 10 },
    ],
  },
];

const TIERS = [
  { min: 0, max: 30, label: "System Emergency", color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30", message: "You're running your business on willpower alone. No systems, no automation, no leverage. You're one burnout away from shutting down." },
  { min: 31, max: 55, label: "System Deficient", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30", message: "You've got pieces but nothing connected. Leads slip through cracks, follow-ups get missed, and you're doing the work of 3 people." },
  { min: 56, max: 80, label: "System Aware", color: "text-primary", bg: "bg-primary/10", border: "border-primary/30", message: "You understand systems matter but haven't fully committed. You're leaving 60%+ of your revenue potential on the table." },
  { min: 81, max: 100, label: "System Ready", color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", message: "You're ahead of 90% of entrepreneurs. The right system would let you scale without adding more hours." },
];

const MAX_SCORE = 150;

export default function GroupFunnel() {
  useSEO({
    title: "Your Fake Guru Mentor Lied | Take the Systems Quiz",
    description: "Take the 2-minute Systems Readiness Quiz from Dale Payne-Sizer. Find out if your business is built on hustle or real systems.",
  });

  const [phase, setPhase] = useState<"landing" | "quiz" | "result">("landing");
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});

  const rawScore = Object.values(answers).reduce((a, b) => a + b, 0);
  const normalized = Math.round((rawScore / MAX_SCORE) * 100);
  const tier = TIERS.find(t => normalized >= t.min && normalized <= t.max) || TIERS[0];
  const progress = phase === "quiz" ? ((Object.keys(answers).length) / QUESTIONS.length) * 100 : 0;

  const selectAnswer = (qIdx: number, score: number) => {
    setAnswers(prev => ({ ...prev, [qIdx]: score }));
    setTimeout(() => {
      if (qIdx < QUESTIONS.length - 1) {
        setCurrent(s => s + 1);
      } else {
        setPhase("result");
      }
    }, 400);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Progress */}
      {phase === "quiz" && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
          <div className="max-w-xl mx-auto px-4 py-3">
            <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
              <span>{QUESTIONS.length - Object.keys(answers).length} left</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <motion.div className="h-full bg-primary rounded-full" animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }} />
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-xl">
          <AnimatePresence mode="wait">
            {/* ─── LANDING ─── */}
            {phase === "landing" && (
              <motion.div key="landing" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
                <div className="rounded-2xl overflow-hidden border border-border shadow-xl">
                  <img src={guruHero} alt="Your Fake Guru Mentor Lied — People Fail, Systems Work" className="w-full" />
                </div>
                <div className="text-center space-y-4">
                  <p className="text-xs text-primary tracking-[0.25em] uppercase font-semibold">
                    FREE SYSTEMS READINESS QUIZ
                  </p>
                  <h1 className="text-2xl md:text-3xl font-black text-foreground leading-tight">
                    Find Out If Your Business Is Built On{" "}
                    <span className="text-primary">Hustle or Real Systems</span>
                  </h1>
                  <p className="text-muted-foreground text-sm md:text-base max-w-md mx-auto">
                    5 questions. 60 seconds. Get your Systems Score — then join the free community where Dale Payne-Sizer shows you how to build systems that actually work.
                  </p>
                </div>
                <div className="text-center">
                  <Button size="lg" className="text-base md:text-lg px-10 py-7 font-bold tracking-wide" onClick={() => setPhase("quiz")}>
                    TAKE THE QUIZ <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* ─── QUIZ ─── */}
            {phase === "quiz" && (
              <motion.div key={`q-${current}`} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.3 }}>
                <Card className="bg-card border-border">
                  <CardContent className="p-6 space-y-5">
                    <p className="text-xs text-muted-foreground">Question {current + 1} of {QUESTIONS.length}</p>
                    <h2 className="text-lg md:text-xl font-bold text-foreground">{QUESTIONS[current].question}</h2>
                    <div className="space-y-2.5">
                      {QUESTIONS[current].options.map((opt, i) => {
                        const selected = answers[current] === opt.score;
                        return (
                          <button
                            key={i}
                            onClick={() => selectAnswer(current, opt.score)}
                            className={`w-full text-left rounded-xl border px-4 py-3.5 text-sm transition-all ${
                              selected
                                ? "border-primary bg-primary/10 text-foreground"
                                : "border-border bg-secondary/30 text-muted-foreground hover:border-primary/40 hover:bg-primary/5"
                            }`}
                          >
                            {selected && <CheckCircle2 className="inline h-4 w-4 mr-2 text-primary" />}
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                    {current > 0 && (
                      <button onClick={() => setCurrent(s => s - 1)} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                        <ArrowLeft className="h-3 w-3" /> Back
                      </button>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* ─── RESULT ─── */}
            {phase === "result" && (
              <motion.div key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
                <Card className={`bg-card border ${tier.border}`}>
                  <CardContent className="p-6 space-y-5 text-center">
                    <p className="text-xs text-muted-foreground uppercase tracking-widest">Your Systems Score</p>
                    <div className={`text-6xl font-black ${tier.color}`}>{normalized}<span className="text-2xl text-muted-foreground">/100</span></div>
                    <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${tier.bg} ${tier.color} border ${tier.border}`}>
                      {tier.label}
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{tier.message}</p>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-foreground">Join the Free Community</h3>
                        <p className="text-xs text-muted-foreground">People Fail. Systems Work.</p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Dale Payne-Sizer built a system that does prospecting, qualification, booking, and follow-up — on autopilot. Join the free Facebook group to see how it works and start building yours.
                    </p>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2"><Zap className="h-4 w-4 text-primary mt-0.5 shrink-0" /> Live system breakdowns & walkthroughs</li>
                      <li className="flex items-start gap-2"><Bot className="h-4 w-4 text-primary mt-0.5 shrink-0" /> AI automation strategies for any niche</li>
                      <li className="flex items-start gap-2"><Target className="h-4 w-4 text-primary mt-0.5 shrink-0" /> Direct access to Dale & the community</li>
                    </ul>
                    <Button
                      size="lg"
                      className="w-full text-base font-bold py-6"
                      onClick={() => window.open(FB_GROUP_URL, "_blank")}
                    >
                      <Users className="mr-2 h-5 w-5" /> JOIN THE FREE GROUP <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                    <p className="text-[10px] text-muted-foreground/60 text-center">100% free. No spam. Just systems.</p>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
