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

const SYSTEM_WEBSITE = `You are PFSW — an elite Lovable web design prompt architect building HIGH-END client websites.

CONTEXT:
- This is for CLIENT WEBSITES for local and regional businesses
- The goal is to produce the most visually polished, conversion-optimized Lovable site in the client's niche
- No auth, no database — unless explicitly requested
- Stack: React + Vite + Tailwind + Framer Motion + shadcn/ui
- If brand context is provided, USE IT as truth for colors, fonts, tone, and content

DESIGN PHILOSOPHY:
- Study the best UI/UX on the market for this niche — then exceed it
- Every section must have a purpose: hero, social proof, services, about, CTA, footer
- Typography: commit to a distinctive font pairing (display serif + refined sans)
- Color: extract from brand context if available; otherwise pick a bold, niche-appropriate palette
- Motion: Framer Motion entrance animations on every section, scroll-triggered reveals, smooth hover states
- Layout: generous whitespace, asymmetric compositions, premium card designs
- Mobile: thumb-friendly, 44px touch targets, optimized nav, fast load

Rules:
- Tone: disciplined, premium, visual-first. No hype. No emojis.
- Output MUST follow this EXACT 7-section structure. Include ALL sections.
- No extra commentary before or after.

1. Site Goal & Target Audience
   - Who is the client, what do they sell, who visits the site
   - Primary conversion goal (form submission, phone call, booking, purchase)

2. Pages & Sections
   - List every page and every section within it
   - Include EXACT copy: headline, subheadline, body text, CTA label for EVERY section
   - No placeholders — write real content based on the client's business

3. UI/UX Design System
   - Typography: specific font pairings (Google Fonts or system fonts), scale, weights
   - Color palette: exact hex values for primary, secondary, accent, background, text
   - Spacing system: padding/margin rhythm
   - Component library choices: which shadcn components to use and how to customize them
   - Visual effects: shadows, gradients, glassmorphism, borders — be specific

4. Animations & Interactions
   - Hero entrance: specific Framer Motion animation with duration and easing
   - Scroll-triggered section reveals: staggered children, directional fades
   - Hover states: card lifts, button transforms, link underlines
   - Page transitions if applicable
   - Loading states and skeleton screens

5. SEO Implementation (MANDATORY)
   - Unique <title> per page (under 60 chars, keyword-first with brand name)
   - Unique meta description per page (under 160 chars, benefit-focused)
   - Open Graph + Twitter Card on all pages
   - Canonical <link rel="canonical"> on every page
   - JSON-LD: Organization + LocalBusiness on homepage; Service schema on service pages
   - Semantic HTML: single <h1> per page, h2/h3 hierarchy, <main>, <header>, <footer>, <section>
   - Image SEO: descriptive alt text, lazy loading, WebP recommendation
   - /public/robots.txt + /public/sitemap.xml

6. Conversion Optimization
   - Above-the-fold CTA strategy
   - Social proof placement (testimonials, logos, review counts)
   - Trust signals (certifications, guarantees, years in business)
   - Contact form or booking widget placement
   - Mobile CTA sticky bar if appropriate

7. Build Order
   - Ordered list of components to build, from foundation to polish
   - Note any third-party embeds (Google Maps, Calendly, review widgets)

Rules:
- Extract every detail from the brand context if provided — do not invent what you can observe
- Prioritize visual quality above all else — this site must look like the best in its niche
- Return only the final build prompt — nothing else.`;

// ─── Constants ────────────────────────────────────────────────────────────────

const DAILY_LIMIT = 50;

const NICHE_PRESETS: Record<string, { industry: string; siteGoal: string; styleDirection: string; pages: string; colorFontNotes: string }> = {
  Dental: {
    industry: "Dental practice",
    siteGoal: "Book new patient appointments — conversion-optimized landing page with online booking widget, insurance info, and Google review trust signals",
    styleDirection: "Clean clinical white with navy and gold accents — professional, trustworthy, friendly. Playfair Display headlines, Inter body.",
    pages: "Home, Services, About, Patient Resources, Contact & Booking",
    colorFontNotes: "Primary: #1B3A6B (navy) · Accent: #C9A84C (gold) · Background: #FFFFFF · Fonts: Playfair Display, Inter",
  },
  Restaurant: {
    industry: "Restaurant / food & beverage",
    siteGoal: "Drive table reservations and online orders — mouth-watering food photography hero, menu showcase, reservation CTA above the fold",
    styleDirection: "Warm, editorial, food-magazine aesthetic. Deep burgundy, cream, and warm amber. Cormorant Garamond headlines, Lato body.",
    pages: "Home, Menu, Reservations, About, Gallery, Contact",
    colorFontNotes: "Primary: #6B1A1A (burgundy) · Accent: #D4A857 (amber) · Background: #FAF5E9 (cream) · Fonts: Cormorant Garamond, Lato",
  },
  "Real Estate": {
    industry: "Real estate agency / realtor",
    siteGoal: "Generate buyer and seller leads — property search, featured listings, agent bio, and lead capture form with neighborhood guides",
    styleDirection: "Luxury property aesthetic. Charcoal, white, and gold. Serif headlines, clean sans body. Full-bleed property photography.",
    pages: "Home, Listings, Neighborhoods, About, Contact",
    colorFontNotes: "Primary: #1C1C1C (charcoal) · Accent: #B8962E (gold) · Background: #F8F8F8 · Fonts: Freight Display, DM Sans",
  },
  "Law Firm": {
    industry: "Law firm / attorney",
    siteGoal: "Generate case inquiry leads — build authority and trust, highlight practice areas, and drive free consultation bookings",
    styleDirection: "Authoritative and understated. Dark navy, white, subtle gold. No bright colors. Garamond or Times New Roman for trust, Inter for clarity.",
    pages: "Home, Practice Areas, Attorneys, Case Results, Contact",
    colorFontNotes: "Primary: #0D1B2A (dark navy) · Accent: #C5A028 (gold) · Background: #FFFFFF · Fonts: EB Garamond, Inter",
  },
  Fitness: {
    industry: "Gym / fitness studio / personal trainer",
    siteGoal: "Drive membership sign-ups and class bookings — high energy hero, class schedule, trainer bios, transformation testimonials",
    styleDirection: "High energy, dark athletic aesthetic. Black, electric yellow or orange, white. Impact or Bebas Neue headlines, DM Sans body.",
    pages: "Home, Classes, Trainers, Membership, Testimonials, Contact",
    colorFontNotes: "Primary: #0A0A0A (near black) · Accent: #F5A623 (electric orange) · Background: #111111 · Fonts: Bebas Neue, DM Sans",
  },
  Auto: {
    industry: "Auto shop / auto repair / car dealership",
    siteGoal: "Drive service appointments and car inquiries — trust signals, service menu, online appointment booking, financing options",
    styleDirection: "Rugged industrial with a polished edge. Charcoal, red or orange accent, white. Strong sans-serifs, bold section dividers.",
    pages: "Home, Services, Inventory, About, Appointment Booking, Contact",
    colorFontNotes: "Primary: #2D2D2D (charcoal) · Accent: #E53E3E (red) · Background: #F4F4F4 · Fonts: Oswald, Open Sans",
  },
  Plumbing: {
    industry: "Plumbing / home services",
    siteGoal: "Drive service call bookings — emergency availability badge, clear service list, transparent pricing, strong local SEO signals",
    styleDirection: "Clean, approachable, trustworthy. Blue and white. Professional but not corporate. Roboto or Source Sans Pro throughout.",
    pages: "Home, Services, Service Area, About, Contact & Emergency Line",
    colorFontNotes: "Primary: #1E5F9B (blue) · Accent: #F6A623 (orange/gold) · Background: #FFFFFF · Fonts: Roboto Slab, Roboto",
  },
  Salon: {
    industry: "Hair salon / beauty studio / spa",
    siteGoal: "Drive appointment bookings — portfolio of work, service menu with pricing, stylist profiles, online booking integration",
    styleDirection: "Elevated, feminine, modern. Blush, black, and gold. Didot or Bodoni headlines, light sans body. Instagram-quality photo grid.",
    pages: "Home, Services & Pricing, Our Team, Gallery, Book Online, Contact",
    colorFontNotes: "Primary: #1A1A1A (near black) · Accent: #C9A0A0 (blush) · Accent2: #C9A84C (gold) · Background: #FAF7F5 · Fonts: Cormorant, Raleway",
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function Engine() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // ── Website Builder fields
  const [clientUrl, setClientUrl] = useState("");
  const [siteName, setSiteName] = useState("");
  const [clientIndustry, setClientIndustry] = useState("");
  const [siteGoal, setSiteGoal] = useState("");
  const [pagesNeeded, setPagesNeeded] = useState("");
  const [styleDirection, setStyleDirection] = useState("");
  const [colorFontNotes, setColorFontNotes] = useState("");
  const [animationsLevel, setAnimationsLevel] = useState("subtle");
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

  // Realtime: subscribe to agent run notifications for the current user
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("user-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "user_notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const n = payload.new as { title: string; body: string };
          toast({
            title: `🤖 ${n.title}`,
            description: n.body || "View results on the Agents page.",
          });
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
    setSiteGoal(ctx.siteGoal || "");
    setPagesNeeded(ctx.pagesNeeded || "");
    setStyleDirection(ctx.styleDirection || "");
    setColorFontNotes(ctx.colorFontNotes || "");
    setAnimationsLevel(ctx.animationsLevel || "subtle");
    setBrandContext(ctx.brandContext || "");
    setOutput(session.last_output || "");
    setScanResult(null);
  };

  const buildContext = () => ({
    mode: "website",
    clientUrl, siteName, clientIndustry, siteGoal, pagesNeeded, styleDirection, colorFontNotes, animationsLevel, brandContext,
  });

  const saveSession = async () => {
    if (!user) return;
    const ctx = buildContext();
    const title = siteName || clientUrl || "Untitled";

    if (activeSessionId) {
      await supabase.from("prompt_sessions").update({
        title,
        context_json: ctx,
        last_output: output,
        updated_at: new Date().toISOString(),
      }).eq("id", activeSessionId);
    } else {
      const { data } = await supabase.from("prompt_sessions").insert({
        user_id: user.id,
        title,
        context_json: ctx,
        last_output: output,
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
    setClientUrl(""); setSiteName(""); setClientIndustry(""); setSiteGoal("");
    setPagesNeeded(""); setStyleDirection(""); setColorFontNotes(""); setAnimationsLevel("subtle");
    setScanResult(null); setBrandContext(""); setOutput(""); setSelectedNiche("");
  };

  const exportOutput = () => {
    const blob = new Blob([output], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${siteName || "website"}-blueprint.md`;
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
      if (result.summary) setSiteGoal(result.summary.slice(0, 200));

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
${brandContext ? brandContext + "\n\n" : ""}Site Name: ${siteName}
Client Industry / Niche: ${clientIndustry}
Site Goal: ${siteGoal}
Pages Needed: ${pagesNeeded}
Style Direction: ${styleDirection}
Color & Font Notes: ${colorFontNotes}
Animations Level: ${animationsLevel}
${refinement ? `\nRefinement: ${refinement}` : ""}
${output ? `\nPrevious Output:\n${output}` : ""}

Generate a complete Lovable-ready website build prompt following the exact 7-section structure. Prioritize visual excellence — this must look like the best site in its niche.`;

      const response = await supabase.functions.invoke("generate-prompt", {
        body: { system: SYSTEM_WEBSITE, message: userMessage },
      });

      if (response.error) throw response.error;
      const result = response.data?.text || response.data?.content || "Generation failed.";
      setOutput(result);

      await supabase.from("prompt_generations").insert({
        user_id: user!.id,
        session_id: activeSessionId,
        tokens_estimate: result.length,
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
        submitted_by: user.id,
        title: submitTitle.trim(),
        raw_prompt: output,
        problem: submitProblem.trim() || null,
        status: "pending_review",
      });
      if (error) throw error;
      toast({ title: "Submitted for review", description: "Your prompt has been sent to the admin queue." });
      setSubmitOpen(false);
      setSubmitTitle("");
      setSubmitProblem("");
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
                <h1 className="text-xl font-bold text-foreground">Website Builder</h1>
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
                    <CardTitle className="text-sm">Website Context</CardTitle>
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
                            setSiteGoal(preset.siteGoal);
                            setStyleDirection(preset.styleDirection);
                            setPagesNeeded(preset.pages);
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
                      <label className="text-xs text-muted-foreground block">Client Website URL</label>
                      <div className="flex gap-2">
                        <Input
                          value={clientUrl}
                          onChange={(e) => setClientUrl(e.target.value)}
                          placeholder="https://client-site.com"
                          className="bg-background border-border flex-1"
                          onKeyDown={(e) => e.key === "Enter" && scanSite()}
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={scanSite}
                          disabled={scanning || !clientUrl}
                          className="shrink-0 border-border"
                        >
                          {scanning
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : <Scan className="h-3.5 w-3.5" />
                          }
                          <span className="ml-1">{scanning ? "Scanning..." : "Scan Site"}</span>
                        </Button>
                      </div>
                    </div>

                    {/* Scan result banner */}
                    {scanResult && (
                      <div className="rounded-md border border-border bg-muted/40 p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
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
                                <div
                                  className="w-4 h-4 rounded-sm border border-border shrink-0"
                                  style={{ backgroundColor: v }}
                                  title={`${k}: ${v}`}
                                />
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

                    <Field label="Site Name">
                      <Input value={siteName} onChange={(e) => setSiteName(e.target.value)} placeholder="e.g. Acme Corp" className="bg-background border-border" />
                    </Field>
                    <Field label="Client Industry">
                      <Input value={clientIndustry} onChange={(e) => setClientIndustry(e.target.value)} placeholder="e.g. Real estate, Law firm, Fitness" className="bg-background border-border" />
                    </Field>
                    <Field label="Site Goal">
                      <Textarea value={siteGoal} onChange={(e) => setSiteGoal(e.target.value)} placeholder="e.g. Generate leads for luxury condos" className="bg-background border-border min-h-[60px]" />
                    </Field>
                    <Field label="Pages Needed">
                      <Input value={pagesNeeded} onChange={(e) => setPagesNeeded(e.target.value)} placeholder="e.g. Home, About, Services, Contact" className="bg-background border-border" />
                    </Field>
                    <Field label="Style Direction">
                      <Input value={styleDirection} onChange={(e) => setStyleDirection(e.target.value)} placeholder="e.g. Minimal luxury, Bold editorial, Warm organic" className="bg-background border-border" />
                    </Field>
                    <Field label="Color & Font Notes">
                      <Textarea value={colorFontNotes} onChange={(e) => setColorFontNotes(e.target.value)} placeholder="e.g. Primary: #1A1A2E · Fonts: Playfair Display, Inter" className="bg-background border-border min-h-[60px]" />
                    </Field>
                    <Field label="Animations Level">
                      <Select value={animationsLevel} onValueChange={setAnimationsLevel}>
                        <SelectTrigger className="bg-background border-border">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None — Static only</SelectItem>
                          <SelectItem value="subtle">Subtle — Fade & slide transitions</SelectItem>
                          <SelectItem value="rich">Rich — Full Framer Motion choreography</SelectItem>
                        </SelectContent>
                      </Select>
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
                                s.id === activeSessionId
                                  ? "bg-primary/10 text-primary"
                                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
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

                {/* ── Lovable CTA ── */}
                <Card className="bg-card border border-primary/30">
                  <CardContent className="p-4 space-y-3">
                    <p className="text-xs font-semibold text-primary tracking-wide uppercase">
                      New to Lovable?
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Every prompt generated here is Lovable-ready. No account yet? Create one free — it takes 60 seconds.
                    </p>
                    <a
                      href={LOVABLE_AFFILIATE_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                    >
                      Create Your Lovable Account
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </CardContent>
                </Card>
              </div>

              {/* ── Right Panel ── */}
              <div className="space-y-4">
                <Card className="bg-card border-border">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">Generated Prompt</CardTitle>
                      <div className="flex gap-1">
                        {output && (
                          <Button size="sm" variant="ghost" onClick={copyOutput} className="text-xs h-7">
                            <Copy className="h-3 w-3 mr-1" /> Copy
                          </Button>
                        )}
                        {output && (
                          <Dialog open={submitOpen} onOpenChange={setSubmitOpen}>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs h-7 border-primary/40 text-primary hover:bg-primary/10"
                                onClick={() => setSubmitTitle(siteName || clientUrl || "Website")}
                              >
                                <Send className="h-3 w-3 mr-1" /> Submit to Library
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md bg-card border-border">
                              <DialogHeader>
                                <DialogTitle className="text-sm">Submit to Prompt Library</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4 pt-1">
                                <p className="text-xs text-muted-foreground">
                                  Submit this prompt for admin review. Once approved, it will be published to the Prompt Library for all members.
                                </p>
                                <div className="space-y-1">
                                  <Label className="text-xs text-muted-foreground">Prompt Title <span className="text-destructive">*</span></Label>
                                  <Input
                                    value={submitTitle}
                                    onChange={(e) => setSubmitTitle(e.target.value)}
                                    placeholder="e.g. Dental Practice Website"
                                    className="bg-background border-border text-sm"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs text-muted-foreground">Problem it solves (optional)</Label>
                                  <Textarea
                                    value={submitProblem}
                                    onChange={(e) => setSubmitProblem(e.target.value)}
                                    placeholder="What situation or pain point does this prompt address?"
                                    className="bg-background border-border text-xs min-h-[72px]"
                                  />
                                </div>
                                <div className="bg-muted/50 rounded p-2">
                                  <p className="text-[10px] text-muted-foreground font-mono line-clamp-3">{output.slice(0, 200)}…</p>
                                </div>
                                <div className="flex justify-end gap-2">
                                  <Button size="sm" variant="outline" onClick={() => setSubmitOpen(false)} className="border-border text-xs">
                                    Cancel
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={submitToLibrary}
                                    disabled={submitting || !submitTitle.trim()}
                                    className="text-xs"
                                  >
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
                      value={output}
                      onChange={(e) => setOutput(e.target.value)}
                      placeholder="Your Lovable-ready website build prompt will appear here..."
                      className="bg-background border-border min-h-[400px] font-mono text-xs leading-relaxed"
                    />
                  </CardContent>
                </Card>

                {/* Quick Action Buttons */}
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => generate()} disabled={generating || (!siteName && !siteGoal)} className="gold-glow-strong">
                    {generating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Sparkles className="h-4 w-4 mr-1" />}
                    Generate
                  </Button>
                  <Button variant="outline" onClick={() => generate("Refine and improve the output. Keep the same 7-section structure.")} disabled={generating || !output} className="border-border">
                    <RefreshCw className="h-3 w-3 mr-1" /> Refine
                  </Button>
                  <Button variant="outline" onClick={() => generate("Expand the Animations & Interactions section with detailed Framer Motion specs: entrance animations, scroll-triggered effects, hover states, and page transitions.")} disabled={generating || !output} className="border-border">
                    <Plus className="h-3 w-3 mr-1" /> + Animations
                  </Button>
                  <Button variant="outline" onClick={() => generate("Add a detailed SEO section: meta tags, OG tags, structured data (JSON-LD), sitemap, canonical URLs, and performance optimizations.")} disabled={generating || !output} className="border-border">
                    <Plus className="h-3 w-3 mr-1" /> + SEO
                  </Button>
                  <Button variant="outline" onClick={() => generate("Add detailed mobile-first notes: responsive breakpoints, touch targets, thumb zones, mobile navigation, and mobile-specific animations.")} disabled={generating || !output} className="border-border">
                    <Plus className="h-3 w-3 mr-1" /> + Mobile Notes
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
