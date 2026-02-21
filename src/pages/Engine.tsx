import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { AuthGate } from "@/components/AuthGate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Sparkles, RefreshCw, Plus, Save, Copy, Loader2, Trash2,
  Download, Scan, CheckCircle2, X, Send, ExternalLink,
} from "lucide-react";

const LOVABLE_AFFILIATE_URL = "https://lovable.dev/invite/8HW4GFV";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ScanResult {
  siteName: string;
  summary: string;
  pageContent: string;
  colors: { primary: string; secondary: string; accent: string; background: string; text: string };
  fonts: string[];
  logo: string | null;
}

// ─── System Prompt ───────────────────────────────────────────────────────────

const SYSTEM_FUNNEL = `You are PFSW — an elite Lovable prompt architect building HIGH-CONVERSION interactive quiz funnels for local businesses.

CONTEXT:
- This is a SMART LANDING PAGE (interactive quiz funnel) — NOT a traditional multi-page website
- The goal is to generate a complete Lovable-ready prompt that builds an interactive quiz funnel
- Stack: React + Vite + Tailwind + Framer Motion + shadcn/ui + Supabase (Lovable Cloud)
- If brand context is provided from a site scan, USE IT for colors, fonts, tone

WHAT THIS FUNNEL DOES:
1. Asks the prospect 5-8 niche-specific questions (multiple choice, weighted scoring)
2. Teaches them something between questions (education slides with stats/facts)
3. Collects their contact info (name, email, phone) BEFORE showing the result
4. Calculates and displays a personalized result score (animated reveal)
5. Ends with a CTA to book a call or take next steps

DESIGN PHILOSOPHY:
- Modern, premium single-page React app with step-by-step flow
- Framer Motion for all transitions between steps (smooth slide/fade)
- Progress bar showing quiz completion
- Bold, niche-appropriate color palette
- Mobile-first, thumb-friendly (44px touch targets)
- Typography: distinctive display font + refined sans body

OUTPUT STRUCTURE — Follow this EXACT format:

1. Funnel Concept
   - Quiz title (engaging question format)
   - Target audience
   - Result metric name (e.g., "Risk Score", "Health Score", "Readiness Score")
   - Scoring range (0-100) with 3-4 result tiers

2. Quiz Questions (5-8)
   - Each question: text, 3-4 answer options, score weight per option
   - 2-3 education slides interspersed ("Did you know..." format with compelling stats)

3. Lead Capture Form
   - Fields: Name, Email, Phone
   - Positioned AFTER quiz, BEFORE results
   - Value proposition above form ("Get your personalized [Result] now")

4. Results Page
   - Animated score reveal (circular progress or counting animation)
   - Score interpretation for each tier
   - 3-4 personalized recommendations based on score
   - Urgency messaging

5. CTA Section
   - Primary: "Book Your Free Consultation" button
   - Secondary: "Download Your Report" option
   - Trust signals

6. UI/UX Design System
   - Typography: specific Google Fonts pairing
   - Color palette: exact hex values (use brand context if available)
   - Component styling: buttons, cards, progress bar
   - Framer Motion specs: entrance, transitions, score reveal

7. FORM API & DATA HANDLING (CRITICAL)
   - Include a Supabase table schema for storing quiz submissions:
     - guest_name, guest_email, guest_phone, quiz_answers (jsonb), score, created_at
   - Include an Edge Function endpoint that receives form submissions
   - The lead capture form MUST POST to this endpoint
   - Include RLS policies so the business owner can view their leads
   - This is the client's OWN backend — NOT ours

8. Build Order
   - Step-by-step component build sequence
   - Note: this is a SINGLE PAGE app with step transitions, not multi-page

Rules:
- Extract brand data from context if provided — match their colors, fonts, tone
- Every quiz question must be relevant and educational, not filler
- Scoring must feel legitimate and personalized
- Result MUST feel valuable enough to justify giving contact info
- Return ONLY the final build prompt — nothing else.`;

// ─── Constants ────────────────────────────────────────────────────────────────

const DAILY_LIMIT = 50;

const NICHE_PRESETS: Record<string, { industry: string; quizTitle: string; resultLabel: string; styleDirection: string; ctaText: string; colorFontNotes: string }> = {
  Dental: {
    industry: "Dental practice",
    quizTitle: "Is Your Smile Costing You Confidence?",
    resultLabel: "Smile Health Score",
    styleDirection: "Clean clinical white with navy and gold accents — professional, trustworthy. Playfair Display headlines, Inter body.",
    ctaText: "Book Your Free Smile Consultation",
    colorFontNotes: "Primary: #1B3A6B (navy) · Accent: #C9A84C (gold) · Background: #FFFFFF · Fonts: Playfair Display, Inter",
  },
  Restaurant: {
    industry: "Restaurant / food & beverage",
    quizTitle: "Is Your Restaurant Leaving Money on the Table?",
    resultLabel: "Revenue Leak Score",
    styleDirection: "Warm, editorial, food-magazine aesthetic. Deep burgundy, cream, and warm amber.",
    ctaText: "Get Your Free Revenue Analysis",
    colorFontNotes: "Primary: #6B1A1A (burgundy) · Accent: #D4A857 (amber) · Background: #FAF5E9 (cream) · Fonts: Cormorant Garamond, Lato",
  },
  "Real Estate": {
    industry: "Real estate agency / realtor",
    quizTitle: "What's Your Home Really Worth?",
    resultLabel: "Market Readiness Score",
    styleDirection: "Luxury property aesthetic. Charcoal, white, and gold. Serif headlines.",
    ctaText: "Get Your Free Home Valuation",
    colorFontNotes: "Primary: #1C1C1C (charcoal) · Accent: #B8962E (gold) · Background: #F8F8F8 · Fonts: Freight Display, DM Sans",
  },
  "Law Firm": {
    industry: "Law firm / attorney",
    quizTitle: "Are You Legally Protected?",
    resultLabel: "Legal Risk Score",
    styleDirection: "Authoritative and understated. Dark navy, white, subtle gold.",
    ctaText: "Book Your Free Legal Consultation",
    colorFontNotes: "Primary: #0D1B2A (dark navy) · Accent: #C5A028 (gold) · Background: #FFFFFF · Fonts: EB Garamond, Inter",
  },
  Fitness: {
    industry: "Gym / fitness studio / personal trainer",
    quizTitle: "What's Your Fitness Age?",
    resultLabel: "Wellness Score",
    styleDirection: "High energy, dark athletic aesthetic. Black, electric orange, white.",
    ctaText: "Claim Your Free Fitness Assessment",
    colorFontNotes: "Primary: #0A0A0A (near black) · Accent: #F5A623 (orange) · Background: #111111 · Fonts: Bebas Neue, DM Sans",
  },
  Auto: {
    industry: "Auto shop / auto repair",
    quizTitle: "Is Your Car a Ticking Time Bomb?",
    resultLabel: "Vehicle Health Score",
    styleDirection: "Rugged industrial with a polished edge. Charcoal, red accent, white.",
    ctaText: "Book Your Free Vehicle Inspection",
    colorFontNotes: "Primary: #2D2D2D (charcoal) · Accent: #E53E3E (red) · Background: #F4F4F4 · Fonts: Oswald, Open Sans",
  },
  Plumbing: {
    industry: "Plumbing / home services",
    quizTitle: "Is Your Home's Plumbing Secretly Failing?",
    resultLabel: "Plumbing Risk Score",
    styleDirection: "Clean, approachable, trustworthy. Blue and white.",
    ctaText: "Get Your Free Plumbing Inspection",
    colorFontNotes: "Primary: #1E5F9B (blue) · Accent: #F6A623 (orange) · Background: #FFFFFF · Fonts: Roboto Slab, Roboto",
  },
  Roofing: {
    industry: "Roofing contractor",
    quizTitle: "Is Your Roof Protecting Your Family?",
    resultLabel: "Roof Safety Score",
    styleDirection: "Strong, reliable. Dark green, slate, white.",
    ctaText: "Book Your Free Roof Inspection",
    colorFontNotes: "Primary: #2D5016 (forest green) · Accent: #D4A857 (gold) · Background: #F8F8F8 · Fonts: Oswald, Source Sans Pro",
  },
  Salon: {
    industry: "Hair salon / beauty studio / spa",
    quizTitle: "What's Your Hair Health Score?",
    resultLabel: "Hair Wellness Score",
    styleDirection: "Elevated, feminine, modern. Blush, black, and gold.",
    ctaText: "Book Your Free Hair Consultation",
    colorFontNotes: "Primary: #1A1A1A (near black) · Accent: #C9A0A0 (blush) · Accent2: #C9A84C (gold) · Background: #FAF7F5 · Fonts: Cormorant, Raleway",
  },
  PFSW: {
    industry: "SaaS / tech community / builder collective",
    quizTitle: "Are You Building Software the Hard Way?",
    resultLabel: "Builder Readiness Score",
    styleDirection: "Dark editorial, bold and premium. Near-black background, electric accent, sharp typography. Magazine-cover aesthetic.",
    ctaText: "Apply to Join the Collective",
    colorFontNotes: "Primary: #0A0A0A (near black) · Accent: #F5A623 (amber) · Secondary: #1A1A2E (dark navy) · Background: #111111 · Fonts: Bebas Neue, DM Sans",
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function Engine() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // ── Funnel Builder fields
  const [clientUrl, setClientUrl] = useState("");
  const [siteName, setSiteName] = useState("");
  const [clientIndustry, setClientIndustry] = useState("");
  const [quizTitle, setQuizTitle] = useState("");
  const [resultLabel, setResultLabel] = useState("");
  const [ctaText, setCtaText] = useState("");
  const [numQuestions, setNumQuestions] = useState("6");
  const [styleDirection, setStyleDirection] = useState("");
  const [colorFontNotes, setColorFontNotes] = useState("");
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanning, setScanning] = useState(false);
  const [brandContext, setBrandContext] = useState("");
  const [selectedNiche, setSelectedNiche] = useState("");

  // ── Right panel
  const [output, setOutput] = useState("");
  const [generating, setGenerating] = useState(false);

  // ── Sessions
  const [sessions, setSessions] = useState<any[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // ── Usage
  const [usageCount, setUsageCount] = useState(0);

  // ── Submit to Library
  const [submitOpen, setSubmitOpen] = useState(false);
  const [submitTitle, setSubmitTitle] = useState("");
  const [submitProblem, setSubmitProblem] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadSessions();
    checkUsage();
  }, []);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("user-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "user_notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const n = payload.new as { title: string; body: string };
          toast({ title: `🤖 ${n.title}`, description: n.body || "View results on the Agents page." });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  useEffect(() => {
    const membershipSessionId = searchParams.get("membership_session_id");
    if (membershipSessionId && profile && !profile.cohort_id) {
      const timer = setTimeout(() => navigate("/choose-cohort", { replace: true }), 3000);
      return () => clearTimeout(timer);
    }
  }, [searchParams, profile, navigate]);

  useEffect(() => {
    const loadPromptId = searchParams.get("loadPrompt");
    if (loadPromptId) {
      supabase
        .from("prompts")
        .select("*, package:prompt_packages!prompts_package_id_fkey(slug)")
        .eq("id", loadPromptId)
        .single()
        .then(({ data }) => {
          if (data) {
            setOutput(data.prompt_text);
            setActiveSessionId(null);
            toast({ title: "Prompt loaded from Library" });
          }
        });
    }
  }, [searchParams]);

  const checkUsage = async () => {
    if (!user) return;
    const since = new Date(Date.now() - 86400000).toISOString();
    const { count } = await supabase
      .from("prompt_generations")
      .select("id", { count: "exact" })
      .eq("user_id", user.id)
      .gte("created_at", since);
    setUsageCount(count || 0);
  };

  const loadSessions = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("prompt_sessions")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(20);
    setSessions(data || []);
  };

  const loadSession = (session: any) => {
    setActiveSessionId(session.id);
    const ctx = (session.context_json as Record<string, string>) || {};
    setClientUrl(ctx.clientUrl || "");
    setSiteName(ctx.siteName || "");
    setClientIndustry(ctx.clientIndustry || "");
    setQuizTitle(ctx.quizTitle || "");
    setResultLabel(ctx.resultLabel || "");
    setCtaText(ctx.ctaText || "");
    setNumQuestions(ctx.numQuestions || "6");
    setStyleDirection(ctx.styleDirection || "");
    setColorFontNotes(ctx.colorFontNotes || "");
    setBrandContext(ctx.brandContext || "");
    setOutput(session.last_output || "");
    setScanResult(null);
  };

  const buildContext = () => ({
    mode: "funnel",
    clientUrl, siteName, clientIndustry, quizTitle, resultLabel, ctaText, numQuestions, styleDirection, colorFontNotes, brandContext,
  });

  const saveSession = async () => {
    if (!user) return;
    const ctx = buildContext();
    const title = siteName || quizTitle || clientUrl || "Untitled Funnel";

    if (activeSessionId) {
      await supabase.from("prompt_sessions").update({
        title, context_json: ctx, last_output: output, updated_at: new Date().toISOString(),
      }).eq("id", activeSessionId);
    } else {
      const { data } = await supabase.from("prompt_sessions").insert({
        user_id: user.id, title, context_json: ctx, last_output: output,
      }).select().single();
      if (data) setActiveSessionId(data.id);
    }
    toast({ title: "Session saved" });
    loadSessions();
  };

  const deleteSession = async (id: string) => {
    await supabase.from("prompt_sessions").delete().eq("id", id);
    if (activeSessionId === id) { setActiveSessionId(null); newSession(); }
    toast({ title: "Session deleted" });
    loadSessions();
  };

  const newSession = () => {
    setActiveSessionId(null);
    setClientUrl(""); setSiteName(""); setClientIndustry(""); setQuizTitle("");
    setResultLabel(""); setCtaText(""); setNumQuestions("6");
    setStyleDirection(""); setColorFontNotes("");
    setScanResult(null); setBrandContext(""); setOutput(""); setSelectedNiche("");
  };

  const exportOutput = () => {
    const blob = new Blob([output], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${siteName || "funnel"}-blueprint.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Website Scanner ────────────────────────────────────────────────────────

  const scanSite = async () => {
    if (!clientUrl) { toast({ title: "Enter a URL first", variant: "destructive" }); return; }
    setScanning(true);
    setScanResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("scan-website", {
        body: { url: clientUrl },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const result = data as ScanResult;
      setScanResult(result);

      if (result.siteName) setSiteName(result.siteName);

      const colorParts: string[] = [];
      if (result.colors.primary) colorParts.push(`Primary: ${result.colors.primary}`);
      if (result.colors.secondary) colorParts.push(`Secondary: ${result.colors.secondary}`);
      if (result.colors.accent) colorParts.push(`Accent: ${result.colors.accent}`);
      if (result.colors.background) colorParts.push(`Background: ${result.colors.background}`);
      if (result.fonts.length) colorParts.push(`Fonts: ${result.fonts.join(", ")}`);
      if (colorParts.length) setColorFontNotes(colorParts.join(" · "));
      if (result.fonts.length) setStyleDirection(`Match existing brand: ${result.fonts[0]} typography`);

      const ctx = [
        `[EXISTING CLIENT BRAND CONTEXT — extracted from ${clientUrl}]`,
        result.siteName ? `Site Name: ${result.siteName}` : "",
        result.summary ? `Current Site Summary: ${result.summary}` : "",
        colorParts.length ? `Brand Colors & Fonts: ${colorParts.join(", ")}` : "",
        result.pageContent ? `\nExisting Content Excerpt:\n${result.pageContent.slice(0, 1500)}` : "",
        `\n[USE THIS AS TRUTH for Style Direction, Copy Tone, and Brand Identity]`,
      ].filter(Boolean).join("\n");
      setBrandContext(ctx);

      toast({ title: "Scan complete", description: `Brand data extracted from ${result.siteName || clientUrl}` });
    } catch (err: any) {
      toast({ title: "Scan failed", description: err.message, variant: "destructive" });
    } finally {
      setScanning(false);
    }
  };

  // ── Generate ───────────────────────────────────────────────────────────────

  const generate = async (refinement?: string) => {
    if (usageCount >= DAILY_LIMIT) {
      toast({ title: "Usage temporarily limited", description: "Try again later.", variant: "destructive" });
      return;
    }
    setGenerating(true);
    try {
      const userMessage = `
${brandContext ? brandContext + "\n\n" : ""}Business / Site Name: ${siteName}
Industry / Niche: ${clientIndustry}
Quiz Title: ${quizTitle}
Result Label: ${resultLabel}
CTA Text: ${ctaText}
Number of Questions: ${numQuestions}
Style Direction: ${styleDirection}
Color & Font Notes: ${colorFontNotes}
${refinement ? `\nRefinement: ${refinement}` : ""}
${output ? `\nPrevious Output:\n${output}` : ""}

Generate a complete Lovable-ready smart funnel build prompt following the exact 8-section structure. The funnel MUST include a form API + backend to capture leads for the business owner.`;

      const response = await supabase.functions.invoke("generate-prompt", {
        body: { system: SYSTEM_FUNNEL, message: userMessage },
      });

      if (response.error) throw response.error;
      const result = response.data?.text || response.data?.content || "Generation failed.";
      setOutput(result);

      await supabase.from("prompt_generations").insert({
        user_id: user!.id, session_id: activeSessionId, tokens_estimate: result.length,
      });
      setUsageCount((c) => c + 1);
    } catch (err: any) {
      toast({ title: "Generation failed", description: err.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const copyOutput = () => {
    navigator.clipboard.writeText(output);
    toast({ title: "Copied to clipboard" });
  };

  const submitToLibrary = async () => {
    if (!user || !output || !submitTitle.trim()) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("prompt_submissions").insert({
        submitted_by: user.id, title: submitTitle.trim(), raw_prompt: output,
        problem: submitProblem.trim() || null, status: "pending_review",
      });
      if (error) throw error;
      toast({ title: "Submitted for review" });
      setSubmitOpen(false); setSubmitTitle(""); setSubmitProblem("");
    } catch (err: any) {
      toast({ title: "Submission failed", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <AuthGate requireActive>
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-20 pb-20">
          <div className="container max-w-7xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-xl font-bold text-foreground">Smart Funnel Builder</h1>
                <p className="text-xs text-muted-foreground">{usageCount}/{DAILY_LIMIT} generations today</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={newSession} className="text-xs border-border">
                  <Plus className="h-3 w-3 mr-1" /> New
                </Button>
                <Button size="sm" variant="outline" onClick={saveSession} className="text-xs border-border">
                  <Save className="h-3 w-3 mr-1" /> Save
                </Button>
                {output && (
                  <Button size="sm" variant="outline" onClick={exportOutput} className="text-xs border-border">
                    <Download className="h-3 w-3 mr-1" /> Export
                  </Button>
                )}
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* ── Left Panel ── */}
              <div className="space-y-4">
                <Card className="bg-card border-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Funnel Context</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Niche Selector */}
                    <div className="space-y-2">
                      <label className="text-xs text-muted-foreground block">Quick-Fill by Niche</label>
                      <Select
                        value={selectedNiche}
                        onValueChange={(val) => {
                          setSelectedNiche(val);
                          const preset = NICHE_PRESETS[val];
                          if (preset) {
                            setClientIndustry(preset.industry);
                            setQuizTitle(preset.quizTitle);
                            setResultLabel(preset.resultLabel);
                            setStyleDirection(preset.styleDirection);
                            setCtaText(preset.ctaText);
                            setColorFontNotes(preset.colorFontNotes);
                          }
                        }}
                      >
                        <SelectTrigger className="bg-background border-border">
                          <SelectValue placeholder="Select a niche to auto-fill fields →" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.keys(NICHE_PRESETS).map((n) => (
                            <SelectItem key={n} value={n}>{n}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedNiche && (
                        <p className="text-[10px] text-primary">✓ Fields auto-filled for {selectedNiche} — customize as needed</p>
                      )}
                    </div>

                    {/* URL Scanner */}
                    <div className="space-y-2">
                      <label className="text-xs text-muted-foreground block">Client Website URL (optional — extracts brand data)</label>
                      <div className="flex gap-2">
                        <Input
                          value={clientUrl} onChange={(e) => setClientUrl(e.target.value)}
                          placeholder="https://client-site.com"
                          className="bg-background border-border flex-1"
                          onKeyDown={(e) => e.key === "Enter" && scanSite()}
                        />
                        <Button size="sm" variant="outline" onClick={scanSite} disabled={scanning || !clientUrl} className="shrink-0 border-border">
                          {scanning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Scan className="h-3.5 w-3.5" />}
                          <span className="ml-1">{scanning ? "Scanning..." : "Scan Site"}</span>
                        </Button>
                      </div>
                    </div>

                    {/* Scan result banner */}
                    {scanResult && (
                      <div className="rounded-md border border-border bg-muted/40 p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                            Scan complete — brand data extracted
                          </div>
                          <button onClick={() => setScanResult(null)} className="text-muted-foreground hover:text-foreground">
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        {Object.values(scanResult.colors).some(Boolean) && (
                          <div className="flex gap-1.5 flex-wrap">
                            {Object.entries(scanResult.colors).filter(([, v]) => v).map(([k, v]) => (
                              <div key={k} className="flex items-center gap-1">
                                <div className="w-4 h-4 rounded-sm border border-border shrink-0" style={{ backgroundColor: v }} title={`${k}: ${v}`} />
                                <span className="text-[10px] text-muted-foreground">{v}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {scanResult.fonts.length > 0 && (
                          <div className="flex gap-1 flex-wrap">
                            {scanResult.fonts.map((f) => (
                              <Badge key={f} variant="secondary" className="text-[10px] py-0">{f}</Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <Field label="Business / Site Name">
                      <Input value={siteName} onChange={(e) => setSiteName(e.target.value)} placeholder="e.g. Atlanta Smiles Dental" className="bg-background border-border" />
                    </Field>
                    <Field label="Industry / Niche">
                      <Input value={clientIndustry} onChange={(e) => setClientIndustry(e.target.value)} placeholder="e.g. Dental, Real Estate, Fitness" className="bg-background border-border" />
                    </Field>
                    <Field label="Quiz Title">
                      <Input value={quizTitle} onChange={(e) => setQuizTitle(e.target.value)} placeholder='e.g. "Is Your Smile Costing You Confidence?"' className="bg-background border-border" />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Result Label">
                        <Input value={resultLabel} onChange={(e) => setResultLabel(e.target.value)} placeholder='e.g. "Risk Score"' className="bg-background border-border" />
                      </Field>
                      <Field label="Number of Questions">
                        <Select value={numQuestions} onValueChange={setNumQuestions}>
                          <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {["5", "6", "7", "8"].map((n) => <SelectItem key={n} value={n}>{n} questions</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </Field>
                    </div>
                    <Field label="CTA Text">
                      <Input value={ctaText} onChange={(e) => setCtaText(e.target.value)} placeholder='e.g. "Book Your Free Consultation"' className="bg-background border-border" />
                    </Field>
                    <Field label="Style Direction">
                      <Input value={styleDirection} onChange={(e) => setStyleDirection(e.target.value)} placeholder="e.g. Clean clinical, Bold editorial, Luxury" className="bg-background border-border" />
                    </Field>
                    <Field label="Color & Font Notes">
                      <Textarea value={colorFontNotes} onChange={(e) => setColorFontNotes(e.target.value)} placeholder="e.g. Primary: #1A1A2E · Fonts: Playfair Display, Inter" className="bg-background border-border min-h-[60px]" />
                    </Field>
                  </CardContent>
                </Card>

                {/* Sessions */}
                <Card className="bg-card border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Sessions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {sessions.length === 0 ? (
                      <p className="text-xs text-muted-foreground py-2">No saved sessions yet.</p>
                    ) : (
                      <div className="space-y-1">
                        {sessions.map((s) => (
                          <div key={s.id} className="flex items-center gap-1">
                            <button
                              onClick={() => loadSession(s)}
                              className={`flex-1 text-left px-3 py-2 rounded text-xs transition-colors truncate ${
                                s.id === activeSessionId ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                              }`}
                            >
                              {s.title || "Untitled"}
                            </button>
                            <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0" onClick={() => deleteSession(s.id)}>
                              <Trash2 className="h-3 w-3 text-muted-foreground" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Lovable CTA */}
                <Card className="bg-card border border-primary/30">
                  <CardContent className="p-4 space-y-3">
                    <p className="text-xs font-semibold text-primary tracking-wide uppercase">New to Lovable?</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Every prompt generated here is Lovable-ready. No account yet? Create one free — it takes 60 seconds.
                    </p>
                    <a href={LOVABLE_AFFILIATE_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors">
                      Create Your Lovable Account <ExternalLink className="h-3 w-3" />
                    </a>
                  </CardContent>
                </Card>
              </div>

              {/* ── Right Panel ── */}
              <div className="space-y-4">
                <Card className="bg-card border-border">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">Generated Funnel Prompt</CardTitle>
                      <div className="flex gap-1">
                        {output && (
                          <Button size="sm" variant="ghost" onClick={copyOutput} className="text-xs h-7">
                            <Copy className="h-3 w-3 mr-1" /> Copy
                          </Button>
                        )}
                        {output && (
                          <Dialog open={submitOpen} onOpenChange={setSubmitOpen}>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline" className="text-xs h-7 border-primary/40 text-primary hover:bg-primary/10" onClick={() => setSubmitTitle(siteName || quizTitle || "Funnel")}>
                                <Send className="h-3 w-3 mr-1" /> Submit to Library
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md bg-card border-border">
                              <DialogHeader><DialogTitle className="text-sm">Submit to Prompt Library</DialogTitle></DialogHeader>
                              <div className="space-y-4 pt-1">
                                <p className="text-xs text-muted-foreground">Submit this prompt for admin review.</p>
                                <div className="space-y-1">
                                  <Label className="text-xs text-muted-foreground">Prompt Title <span className="text-destructive">*</span></Label>
                                  <Input value={submitTitle} onChange={(e) => setSubmitTitle(e.target.value)} placeholder="e.g. Dental Quiz Funnel" className="bg-background border-border text-sm" />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs text-muted-foreground">Problem it solves (optional)</Label>
                                  <Textarea value={submitProblem} onChange={(e) => setSubmitProblem(e.target.value)} placeholder="What situation does this prompt address?" className="bg-background border-border text-xs min-h-[72px]" />
                                </div>
                                <div className="bg-muted/50 rounded p-2">
                                  <p className="text-[10px] text-muted-foreground font-mono line-clamp-3">{output.slice(0, 200)}…</p>
                                </div>
                                <div className="flex justify-end gap-2">
                                  <Button size="sm" variant="outline" onClick={() => setSubmitOpen(false)} className="border-border text-xs">Cancel</Button>
                                  <Button size="sm" onClick={submitToLibrary} disabled={submitting || !submitTitle.trim()} className="text-xs">
                                    {submitting ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Send className="h-3 w-3 mr-1" />}
                                    Submit for Review
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={output} onChange={(e) => setOutput(e.target.value)}
                      placeholder="Your Lovable-ready smart funnel prompt will appear here..."
                      className="bg-background border-border min-h-[400px] font-mono text-xs leading-relaxed"
                    />
                  </CardContent>
                </Card>

                {/* Quick Action Buttons */}
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => generate()} disabled={generating || (!quizTitle && !clientIndustry)} className="gold-glow-strong">
                    {generating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Sparkles className="h-4 w-4 mr-1" />}
                    Generate
                  </Button>
                  <Button variant="outline" onClick={() => generate("Refine and improve the output. Keep the same 8-section structure.")} disabled={generating || !output} className="border-border">
                    <RefreshCw className="h-3 w-3 mr-1" /> Refine
                  </Button>
                  <Button variant="outline" onClick={() => generate("Add 2 more education slides between questions with compelling statistics and facts.")} disabled={generating || !output} className="border-border">
                    <Plus className="h-3 w-3 mr-1" /> + Education Slides
                  </Button>
                  <Button variant="outline" onClick={() => generate("Add 2 more quiz questions that dig deeper into the prospect's pain points.")} disabled={generating || !output} className="border-border">
                    <Plus className="h-3 w-3 mr-1" /> + More Questions
                  </Button>
                  <Button variant="outline" onClick={() => generate("Enhance the CTA section with a booking calendar integration, trust signals, and urgency messaging.")} disabled={generating || !output} className="border-border">
                    <Plus className="h-3 w-3 mr-1" /> + Booking CTA
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </AuthGate>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
      {children}
    </div>
  );
}
