import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, CheckCircle2, Lock } from "lucide-react";

// ── Niche configs ──
const NICHES: Record<string, {
  brand: string;
  headline: string;
  subtext: string;
  cta: string;
  resultLabel: string;
  colors: { bg: string; primary: string; accent: string; text: string; muted: string };
  questions: { q: string; options: string[] }[];
  tiers: { label: string; desc: string; color: string }[];
}> = {
  dental: {
    brand: "BrightSmile Dental",
    headline: "Is Your Smile Costing You Confidence?",
    subtext: "Answer 5 quick questions. Get your Smile Health Score in under 2 minutes.",
    cta: "TAKE THE FREE QUIZ NOW",
    resultLabel: "Smile Health Score",
    colors: { bg: "#0B1D3A", primary: "#C9A84C", accent: "#1B3A6B", text: "#FFFFFF", muted: "#94A3B8" },
    questions: [
      { q: "How often do you visit the dentist?", options: ["Every 6 months", "Once a year", "Only when something hurts", "It's been years"] },
      { q: "Do you experience tooth sensitivity?", options: ["Never", "Occasionally with cold foods", "Frequently", "Daily pain"] },
      { q: "How would you rate your brushing routine?", options: ["Twice daily + flossing", "Twice daily, no floss", "Once daily", "Inconsistent"] },
      { q: "Are you happy with your smile?", options: ["Love it", "It's okay", "I avoid smiling in photos", "I want a complete change"] },
      { q: "Have you considered cosmetic dentistry?", options: ["Not interested", "Curious but haven't researched", "Actively looking", "Ready to start"] },
    ],
    tiers: [
      { label: "Excellent", desc: "Your oral health habits are strong.", color: "#22C55E" },
      { label: "Good", desc: "Minor improvements could make a big difference.", color: "#84CC16" },
      { label: "Needs Attention", desc: "Several areas need professional guidance.", color: "#F59E0B" },
      { label: "Critical", desc: "Immediate professional consultation recommended.", color: "#EF4444" },
    ],
  },
  restaurant: {
    brand: "TableTurn Pro",
    headline: "Is Your Restaurant Leaving Money on the Table?",
    subtext: "Answer 5 quick questions. Get your Revenue Leak Score in under 2 minutes.",
    cta: "START THE FREE AUDIT",
    resultLabel: "Revenue Leak Score",
    colors: { bg: "#1A0A0A", primary: "#D4A857", accent: "#6B1A1A", text: "#FAF5E9", muted: "#A89070" },
    questions: [
      { q: "Can customers find your menu online?", options: ["Yes, updated regularly", "It's online but outdated", "Only on third-party apps", "Not online at all"] },
      { q: "Do you have an online ordering system?", options: ["Yes, integrated with our site", "Through DoorDash/UberEats only", "No, phone orders only", "We don't do takeout"] },
      { q: "How do customers typically find you?", options: ["Google search + social", "Word of mouth only", "We don't track this", "Walk-ins mostly"] },
      { q: "When was your website last updated?", options: ["This month", "This year", "Over a year ago", "We don't have one"] },
      { q: "Do you collect customer emails or reviews?", options: ["Actively collect both", "Just reviews", "Neither, but want to", "Never thought about it"] },
    ],
    tiers: [
      { label: "Optimized", desc: "Your digital presence is driving revenue.", color: "#22C55E" },
      { label: "Solid", desc: "A few tweaks could unlock significant growth.", color: "#84CC16" },
      { label: "Leaking Revenue", desc: "You're losing customers to competitors online.", color: "#F59E0B" },
      { label: "Critical Gap", desc: "Immediate action needed to capture lost revenue.", color: "#EF4444" },
    ],
  },
  realestate: {
    brand: "HomeValue Pro",
    headline: "What's Your Home Really Worth?",
    subtext: "Answer 5 quick questions. Get your Market Readiness Score instantly.",
    cta: "GET YOUR FREE SCORE",
    resultLabel: "Market Readiness Score",
    colors: { bg: "#0F0F0F", primary: "#B8962E", accent: "#1C1C1C", text: "#F8F8F8", muted: "#9CA3AF" },
    questions: [
      { q: "How long have you owned your home?", options: ["Less than 2 years", "2-5 years", "5-10 years", "10+ years"] },
      { q: "Have you made renovations recently?", options: ["Major renovation (kitchen/bath)", "Minor updates", "Basic maintenance only", "Nothing in years"] },
      { q: "What's your timeline for selling?", options: ["Within 3 months", "6-12 months", "Just exploring", "Not selling, just curious"] },
      { q: "How's the curb appeal of your property?", options: ["Pristine, magazine-ready", "Well-maintained", "Needs some work", "Significant improvements needed"] },
      { q: "Do you know your neighborhood's recent sale prices?", options: ["Yes, I track them", "Somewhat", "Not really", "No idea"] },
    ],
    tiers: [
      { label: "Market Ready", desc: "Your home is positioned for top dollar.", color: "#22C55E" },
      { label: "Almost There", desc: "Small improvements could add significant value.", color: "#84CC16" },
      { label: "Needs Prep", desc: "Strategic updates recommended before listing.", color: "#F59E0B" },
      { label: "Not Ready", desc: "Professional assessment needed before listing.", color: "#EF4444" },
    ],
  },
  fitness: {
    brand: "FitAge Labs",
    headline: "What's Your Fitness Age?",
    subtext: "Answer 5 quick questions. Get your Wellness Score in under 2 minutes.",
    cta: "FIND YOUR FITNESS AGE",
    resultLabel: "Wellness Score",
    colors: { bg: "#0A0A0A", primary: "#F5A623", accent: "#111111", text: "#FFFFFF", muted: "#737373" },
    questions: [
      { q: "How many days per week do you exercise?", options: ["5+", "3-4", "1-2", "Rarely or never"] },
      { q: "How would you describe your energy levels?", options: ["High all day", "Good until afternoon", "Inconsistent", "Low most of the time"] },
      { q: "What's your relationship with nutrition?", options: ["Track macros and eat clean", "Mostly healthy", "Eat whatever's convenient", "Fast food/processed mostly"] },
      { q: "How's your sleep quality?", options: ["7-8 hours, wake refreshed", "Decent but could improve", "Inconsistent", "Poor, under 6 hours"] },
      { q: "What's your #1 fitness goal?", options: ["Build muscle", "Lose weight", "Increase energy", "Just get started"] },
    ],
    tiers: [
      { label: "Elite", desc: "Your fitness age is well below your actual age.", color: "#22C55E" },
      { label: "Above Average", desc: "You're ahead of most — fine-tuning will take you further.", color: "#84CC16" },
      { label: "Average", desc: "There's significant room for improvement.", color: "#F59E0B" },
      { label: "Below Average", desc: "Time for a structured program to reverse the trend.", color: "#EF4444" },
    ],
  },
};

type Phase = "landing" | "quiz" | "capture" | "result";

export default function DemoFunnel() {
  const { niche } = useParams<{ niche: string }>();
  const config = NICHES[niche || ""] || NICHES.dental;
  const [phase, setPhase] = useState<Phase>("landing");
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const score = Math.max(15, Math.min(95, 100 - answers.reduce((a, b) => a + b, 0) * 6 + Math.floor(Math.random() * 10)));
  const tierIdx = score >= 80 ? 0 : score >= 60 ? 1 : score >= 40 ? 2 : 3;
  const tier = config.tiers[tierIdx];
  const progress = ((currentQ + 1) / config.questions.length) * 100;

  const handleAnswer = (optIdx: number) => {
    const newAnswers = [...answers, optIdx];
    setAnswers(newAnswers);
    if (currentQ < config.questions.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      setPhase("capture");
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: config.colors.bg, color: config.colors.text }}>
      {/* Demo banner */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-primary/90 text-primary-foreground text-center py-2 text-xs font-medium backdrop-blur-sm">
        🎯 DEMO — This is a sample Smart Funnel built with PFSW ·{" "}
        <Link to="/apply" className="underline font-bold">Build yours →</Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 pt-14">
        <div className="w-full max-w-xl">
          {/* Brand header */}
          <motion.p
            className="text-center text-sm font-semibold tracking-widest uppercase mb-8 opacity-70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
          >
            {config.brand}
          </motion.p>

          <AnimatePresence mode="wait">
            {/* ── LANDING ── */}
            {phase === "landing" && (
              <motion.div
                key="landing"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center space-y-6"
              >
                <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
                  {config.headline}
                </h1>
                <p className="text-sm opacity-60">{config.subtext}</p>
                <Button
                  size="lg"
                  className="text-lg px-10 py-6 font-bold tracking-wide"
                  style={{ backgroundColor: config.colors.primary, color: config.colors.bg }}
                  onClick={() => setPhase("quiz")}
                >
                  {config.cta}
                </Button>
                <p className="text-xs opacity-40">⭐ Trusted by 500+ {niche} professionals</p>
              </motion.div>
            )}

            {/* ── QUIZ ── */}
            {phase === "quiz" && (
              <motion.div
                key={`q-${currentQ}`}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <div className="flex justify-between text-xs opacity-60">
                    <span>{config.questions.length - currentQ} steps remaining</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: config.colors.accent }}>
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: config.colors.primary }}
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.4 }}
                    />
                  </div>
                </div>
                <h2 className="text-xl md:text-2xl font-bold">{config.questions[currentQ].q}</h2>
                <div className="space-y-3">
                  {config.questions[currentQ].options.map((opt, i) => (
                    <button
                      key={opt}
                      onClick={() => handleAnswer(i)}
                      className="w-full text-left px-5 py-4 rounded-xl border transition-all hover:scale-[1.02] text-sm font-medium"
                      style={{
                        borderColor: `${config.colors.primary}33`,
                        backgroundColor: `${config.colors.accent}`,
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = config.colors.primary; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = `${config.colors.primary}33`; }}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── CAPTURE ── */}
            {phase === "capture" && (
              <motion.div
                key="capture"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-bold">Almost there!</h2>
                  <p className="text-sm opacity-60">Where should we send your {config.resultLabel}?</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider opacity-70 mb-1 block">Full Name</label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="John Smith"
                      className="bg-transparent border-border"
                      style={{ borderColor: `${config.colors.primary}44`, color: config.colors.text }}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider opacity-70 mb-1 block">Email Address</label>
                    <Input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="john@example.com"
                      className="bg-transparent border-border"
                      style={{ borderColor: `${config.colors.primary}44`, color: config.colors.text }}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs opacity-40">
                  <Lock className="h-3 w-3" /> Your information is secure and will never be shared.
                </div>
                <Button
                  size="lg"
                  className="w-full text-base font-bold py-6"
                  style={{ backgroundColor: config.colors.primary, color: config.colors.bg }}
                  onClick={() => setPhase("result")}
                >
                  Get My {config.resultLabel}
                </Button>
              </motion.div>
            )}

            {/* ── RESULT ── */}
            {phase === "result" && (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6"
              >
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-bold">🎉 Thank You{name ? `, ${name}` : ""}!</h2>
                  <p className="text-sm opacity-60">Your {config.resultLabel} Assessment is complete</p>
                </div>
                <div className="rounded-2xl p-6 text-center space-y-3" style={{ backgroundColor: config.colors.accent }}>
                  <motion.p
                    className="text-6xl font-black"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1 }}
                    style={{ color: tier.color }}
                  >
                    {score}
                  </motion.p>
                  <p className="text-lg font-bold" style={{ color: tier.color }}>{tier.label}</p>
                  <p className="text-sm opacity-70">{tier.desc}</p>
                </div>
                <div className="space-y-3">
                  {answers.filter((a) => a >= 2).slice(0, 3).map((_, i) => (
                    <div key={i} className="rounded-xl p-4 border-l-4 flex items-start gap-3" style={{ borderColor: tier.color, backgroundColor: `${config.colors.accent}88` }}>
                      <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" style={{ color: tier.color }} />
                      <p className="text-xs opacity-80">
                        {["Your responses suggest room for improvement in this area. A professional consultation can help create a targeted plan.",
                          "This score indicates an opportunity to optimize. Small changes here can make a significant impact.",
                          "Based on your answers, addressing this area should be a priority for better results."][i]}
                      </p>
                    </div>
                  ))}
                </div>
                <Button
                  size="lg"
                  className="w-full text-base font-bold py-6"
                  style={{ backgroundColor: config.colors.primary, color: config.colors.bg }}
                  onClick={() => window.open("/apply", "_blank")}
                >
                  Build This Funnel For Your Business →
                </Button>
                <p className="text-center text-xs opacity-40">
                  Powered by PFSW Smart Funnel Builder
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Back to home */}
      <div className="fixed bottom-4 left-4 z-50">
        <Link to="/" className="flex items-center gap-1 text-xs opacity-40 hover:opacity-80 transition-opacity">
          <ArrowLeft className="h-3 w-3" /> Back to PFSW
        </Link>
      </div>
    </div>
  );
}
