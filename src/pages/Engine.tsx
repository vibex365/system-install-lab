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
  Sparkles, RefreshCw, Minimize2, Plus, Save, Copy, Loader2, Trash2,
  Download, Globe, ShoppingBag, Palette, Scan, CheckCircle2, X, Send, ExternalLink,
} from "lucide-react";

const LOVABLE_AFFILIATE_URL = "https://lovable.dev/invite/8HW4GFV";

// ─── Types ───────────────────────────────────────────────────────────────────

type EngineMode = "mvp" | "website" | "shopify" | "uiux";

interface ScanResult {
  siteName: string;
  summary: string;
  pageContent: string;
  colors: { primary: string; secondary: string; accent: string; background: string; text: string };
  fonts: string[];
  logo: string | null;
}

// ─── System Prompts ──────────────────────────────────────────────────────────

const SYSTEM_MVP = `You are PFSW — People Fail, Systems Work. You are an elite Lovable prompt architect.

PLATFORM CONTEXT (Lovable):
- React + Vite + Tailwind + TypeScript + Supabase Cloud
- Available native connectors: Stripe, Shopify, Slack, Firecrawl, ElevenLabs, Perplexity
- For AI: use Lovable AI Gateway (https://ai.gateway.lovable.dev) via edge functions
- For auth: Supabase Auth with RLS — never raw client SQL

STRIPE RULE (MANDATORY — NO EXCEPTIONS):
- NEVER use webhooks for payment verification
- ALWAYS use Stripe Checkout Sessions with mode: "payment" or mode: "subscription"
- success_url MUST include ?session_id={CHECKOUT_SESSION_ID}
- Verify payment by querying the session on return — not via webhook events
- Use supabase.functions.invoke() to call edge functions for checkout creation

SHOPIFY RULE:
- Use Lovable's native Shopify connector (connector_id: shopify) — NOT the raw Shopify API

Rules:
- Tone: disciplined, premium, direct. No hype. No emojis.
- Output MUST follow this EXACT structure in this EXACT order. Include ALL sections.
- No extra commentary before or after.

1. Objective
2. Stack
3. Routes
4. Database Schema
5. RLS Policies
6. Core User Flows
7. UI/UX Requirements (black/gold editorial)
8. Integrations
9. SEO Implementation (MANDATORY — include ALL of the following):
   - React Helmet or document.title management for every route
   - Unique title tag per page (under 60 chars, keyword-first)
   - Unique meta description per page (under 160 chars, action-oriented)
   - Open Graph tags: og:title, og:description, og:type, og:url, og:image (1200×630)
   - Twitter Card tags: twitter:card=summary_large_image, twitter:title, twitter:description, twitter:image
   - Canonical <link rel="canonical"> on every page
   - JSON-LD structured data: Organization + WebSite on root; Product/Service schema where relevant; FAQPage schema if FAQ section exists
   - Semantic HTML: single <h1> per page, logical h2/h3 hierarchy, <main>, <header>, <footer>, <section>, <article> where appropriate
   - Image: descriptive alt attributes on all images; lazy loading on below-fold images
   - /public/robots.txt: Allow all crawlers, reference /sitemap.xml
   - /public/sitemap.xml: all public routes with <priority> and <changefreq>
   - Performance: lazy-load below-fold sections with React.lazy; avoid render-blocking scripts
10. Acceptance Criteria
11. Build Order

Use stored session context as truth unless overridden.
Keep MVP minimal. Remove unnecessary features.
Return only the final build prompt — nothing else.`;

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

const SYSTEM_SHOPIFY = `You are PFSW — an elite Lovable Shopify storefront prompt architect.

SHOPIFY CONNECTOR RULES (MANDATORY):
- Use Lovable's native Shopify connector (connector_id: shopify) — NOT the raw Shopify API
- Products, inventory, and store data come from the Shopify connector automatically
- Checkout flows through Stripe Checkout Sessions (no webhooks) OR Shopify Checkout
- The storefront is a React app connecting to the Shopify store via connector

STRIPE RULE (if using Stripe checkout):
- NEVER use webhooks — always Stripe Checkout Sessions
- success_url must include ?session_id={CHECKOUT_SESSION_ID}

Rules:
- Tone: disciplined, direct. No hype. No emojis.
- Output MUST follow this EXACT 7-section structure. Include ALL sections.
- No extra commentary before or after.

1. Store Goal & Products
2. Shopify Connector Setup
3. Pages & Product Flows
4. UI/UX Requirements
5. SEO Implementation (MANDATORY — storefront-specific):
   - Unique title per page: "{Product/Collection} | {Store Name}" format, under 60 chars
   - Meta descriptions per page: benefit-driven, under 160 chars, with primary keyword
   - Open Graph + Twitter Card on all pages (especially product pages for social sharing)
   - Canonical tags on all pages; handle pagination with rel=next/prev or canonical to page 1
   - JSON-LD: Product schema on PDP (name, description, image, offers with price/currency/availability); BreadcrumbList on all interior pages; Organization on homepage
   - Semantic HTML: h1 = product/collection name on interior pages, structured product content
   - Image SEO: alt text = "{Product Name} — {Key Descriptor}", lazy load below fold, WebP
   - Collection pages: unique h1, unique meta per collection
   - /public/robots.txt + /public/sitemap.xml covering all routes
   - Performance: lazy-load product images, skeleton loaders for data fetching
6. Integrations
7. Build Order

Return only the final build prompt — nothing else.`;

const SYSTEM_UIUX = `You are PFSW — an elite UI/UX design consultant generating Lovable-ready design improvement prompts.

You systematically address every aspect that separates remedial designs from top-tier products.
You use a 3-level framework. Each level builds on the previous.

LEVEL 1 — FOUNDATION FIX:
- Visual Hierarchy & Typography: Typographic scale (1.25 ratio: 12/15/18/24/30/37/46px), font weights (300/400/600/700), line heights (1.2 headings, 1.5 body), letter spacing (-0.02em large, +0.05em small caps)
- Color & Contrast: WCAG AA compliance (4.5:1 minimum), cohesive palette with variants (50–900), semantic color usage, dark mode
- Spacing & Layout: 4px/8px base unit system (4/8/12/16/24/32/48/64px), border radius consistency (2/4/8/12/16px), grid alignment
- Component Standardization: Button heights (32/40/48px), form inputs, icon sizing (16/20/24/32px), card/container styling

LEVEL 2 — INTERACTION PERFECTION:
- Micro-Interactions: 0.2s ease hover states, focus indicators, skeleton loaders, page transitions, micro-feedback, success animations, tooltips (0.3s delay)
- Navigation & Flow: Breadcrumbs, smart search, onboarding hints, CTA hierarchy, form progression with validation, progress indicators
- Responsive & Accessibility: 44px touch targets, thumb-friendly mobile nav, keyboard navigation, ARIA labels, screen reader support, gesture support
- Error Handling: Error states with recovery paths, empty states, offline handling, timeout handling, confirmation dialogs, auto-save

LEVEL 3 — PREMIUM POLISH:
- Visual Effects: Multi-level shadow system, glassmorphism, gradient overlays (10-15% opacity), texture/grain, backdrop blur, parallax hero, premium cards
- Brand Personality: Custom illustration style, branded loading animations, branded empty states, consistent copywriting voice, branded error pages
- Data Visualization: Chart styling, interactive data displays, progress indicators, elegant tables, smart data formatting, dashboard layouts
- Enterprise Polish: Role-based UI variations, print stylesheets, audit trails, onboarding flows, keyboard shortcuts, smart defaults, multi-device sync

SEO LAYER (included in all audit levels):
- Title tag audit: unique per page, under 60 chars, keyword-first
- Meta description audit: unique per page, under 160 chars, action-oriented with primary keyword
- Open Graph + Twitter Card coverage on all public routes
- Canonical tag presence on every page
- JSON-LD structured data: Organization/WebSite on root, content-type schemas on interior pages (FAQ, Product, Article, BreadcrumbList)
- Semantic HTML audit: single h1 per page, h2/h3 hierarchy, semantic elements (<main>, <section>, <article>, <header>, <footer>)
- Image SEO: alt text quality, lazy loading, format (WebP recommendation)
- Performance: Core Web Vitals targets (LCP < 2.5s, CLS < 0.1, FID < 100ms), lazy-loading strategy
- robots.txt and sitemap.xml presence and correctness
- Internal linking: logical navigation structure, breadcrumbs on interior pages

Rules:
- Tone: precise, technical, premium. No hype.
- Generate Lovable-ready improvement prompts — actionable instructions the AI can implement
- Return only the final design prompt — nothing else.`;

// ─── Constants ────────────────────────────────────────────────────────────────

const DAILY_LIMIT = 50;

const MODES: { id: EngineMode; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "mvp", label: "MVP Builder", icon: Sparkles },
  { id: "website", label: "Website Builder", icon: Globe },
  { id: "shopify", label: "Shopify", icon: ShoppingBag },
  { id: "uiux", label: "UI/UX Audit", icon: Palette },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function Engine() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // ── Mode
  const [mode, setMode] = useState<EngineMode>("mvp");

  // ── MVP fields
  const [productName, setProductName] = useState("");
  const [targetUser, setTargetUser] = useState("");
  const [offer, setOffer] = useState("");
  const [monetization, setMonetization] = useState("");
  const [mvpIntegrations, setMvpIntegrations] = useState("");
  const [constraints, setConstraints] = useState("");
  const [category, setCategory] = useState("");
  const [packages, setPackages] = useState<{ id: string; slug: string; name: string }[]>([]);

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

  // ── Shopify fields
  const [storeName, setStoreName] = useState("");
  const [niche, setNiche] = useState("");
  const [targetCustomer, setTargetCustomer] = useState("");
  const [shopifyPages, setShopifyPages] = useState("Home, PDP, Cart, Collections");
  const [designStyle, setDesignStyle] = useState("");
  const [customFeatures, setCustomFeatures] = useState("");

  // ── UI/UX Audit fields
  const [designDescription, setDesignDescription] = useState("");
  const [currentProblems, setCurrentProblems] = useState("");
  const [brandColors, setBrandColors] = useState("");
  const [auditLevel, setAuditLevel] = useState("foundation");

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
    supabase.from("prompt_packages").select("id, slug, name").then(({ data }) => setPackages(data || []));
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
            setCategory(data.package?.slug || "");
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
    // Restore mode
    if (ctx.mode) setMode(ctx.mode as EngineMode);
    // MVP
    setProductName(ctx.productName || "");
    setTargetUser(ctx.targetUser || "");
    setOffer(ctx.offer || "");
    setMonetization(ctx.monetization || "");
    setMvpIntegrations(ctx.mvpIntegrations || "");
    setConstraints(ctx.constraints || "");
    setCategory(ctx.category || "");
    // Website
    setClientUrl(ctx.clientUrl || "");
    setSiteName(ctx.siteName || "");
    setClientIndustry(ctx.clientIndustry || "");
    setSiteGoal(ctx.siteGoal || "");
    setPagesNeeded(ctx.pagesNeeded || "");
    setStyleDirection(ctx.styleDirection || "");
    setColorFontNotes(ctx.colorFontNotes || "");
    setAnimationsLevel(ctx.animationsLevel || "subtle");
    setBrandContext(ctx.brandContext || "");
    // Shopify
    setStoreName(ctx.storeName || "");
    setNiche(ctx.niche || "");
    setTargetCustomer(ctx.targetCustomer || "");
    setShopifyPages(ctx.shopifyPages || "Home, PDP, Cart, Collections");
    setDesignStyle(ctx.designStyle || "");
    setCustomFeatures(ctx.customFeatures || "");
    // UI/UX
    setDesignDescription(ctx.designDescription || "");
    setCurrentProblems(ctx.currentProblems || "");
    setBrandColors(ctx.brandColors || "");
    setAuditLevel(ctx.auditLevel || "foundation");

    setOutput(session.last_output || "");
    setScanResult(null);
  };

  const buildContext = () => ({
    mode,
    // MVP
    productName, targetUser, offer, monetization, mvpIntegrations, constraints, category,
    // Website
    clientUrl, siteName, clientIndustry, siteGoal, pagesNeeded, styleDirection, colorFontNotes, animationsLevel, brandContext,
    // Shopify
    storeName, niche, targetCustomer, shopifyPages, designStyle, customFeatures,
    // UI/UX
    designDescription, currentProblems, brandColors, auditLevel,
  });

  const saveSession = async () => {
    if (!user) return;
    const ctx = buildContext();
    const title =
      mode === "mvp" ? productName :
      mode === "website" ? siteName || clientUrl :
      mode === "shopify" ? storeName :
      designDescription.slice(0, 40) || "UI/UX Audit";

    if (activeSessionId) {
      await supabase.from("prompt_sessions").update({
        title: title || "Untitled",
        context_json: ctx,
        last_output: output,
        updated_at: new Date().toISOString(),
      }).eq("id", activeSessionId);
    } else {
      const { data } = await supabase.from("prompt_sessions").insert({
        user_id: user.id,
        title: title || "Untitled",
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
    setProductName(""); setTargetUser(""); setOffer(""); setMonetization("");
    setMvpIntegrations(""); setConstraints(""); setCategory(""); setOutput("");
    setClientUrl(""); setSiteName(""); setClientIndustry(""); setSiteGoal("");
    setPagesNeeded(""); setStyleDirection(""); setColorFontNotes(""); setAnimationsLevel("subtle");
    setScanResult(null); setBrandContext("");
    setStoreName(""); setNiche(""); setTargetCustomer("");
    setShopifyPages("Home, PDP, Cart, Collections"); setDesignStyle(""); setCustomFeatures("");
    setDesignDescription(""); setCurrentProblems(""); setBrandColors(""); setAuditLevel("foundation");
  };

  const exportOutput = () => {
    const fileName = mode === "mvp" ? productName : mode === "website" ? siteName : mode === "shopify" ? storeName : "uiux-audit";
    const blob = new Blob([output], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileName || "prompt"}-blueprint.md`;
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

      // Auto-fill fields
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

      // Build raw brand context for injection into prompt
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
      const systemPrompt =
        mode === "mvp" ? SYSTEM_MVP :
        mode === "website" ? SYSTEM_WEBSITE :
        mode === "shopify" ? SYSTEM_SHOPIFY :
        SYSTEM_UIUX;

      let userMessage = "";

      if (mode === "mvp") {
        userMessage = `
Product: ${productName}
Target User: ${targetUser}
Offer: ${offer}
Monetization: ${monetization}
Integrations: ${mvpIntegrations}
Constraints: ${constraints}
Category: ${category}
${refinement ? `\nRefinement: ${refinement}` : ""}
${output ? `\nPrevious Output:\n${output}` : ""}

Generate a complete Lovable-ready build prompt following the exact 10-section structure.`;
      } else if (mode === "website") {
        userMessage = `
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
      } else if (mode === "shopify") {
        userMessage = `
Store Name: ${storeName}
Niche / Products: ${niche}
Target Customer: ${targetCustomer}
Pages Needed: ${shopifyPages}
Design Style: ${designStyle}
Custom Features: ${customFeatures}
${refinement ? `\nRefinement: ${refinement}` : ""}
${output ? `\nPrevious Output:\n${output}` : ""}

Generate a complete Lovable-ready Shopify storefront build prompt following the exact 6-section structure.`;
      } else {
        userMessage = `
Design Description: ${designDescription}
Current Problems: ${currentProblems}
Brand Colors: ${brandColors}
Audit Level: ${auditLevel}
${refinement ? `\nRefinement: ${refinement}` : ""}
${output ? `\nPrevious Output:\n${output}` : ""}

Generate a complete Lovable-ready UI/UX design improvement prompt.`;
      }

      const response = await supabase.functions.invoke("generate-prompt", {
        body: { system: systemPrompt, message: userMessage },
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

  const generateUIAudit = (level: "foundation" | "interaction" | "premium" | "full") => {
    const prompts = {
      foundation: "Generate a Level 1 Foundation Fix audit. Focus on: typographic scale, WCAG contrast, spacing system, and component standardization.",
      interaction: "Generate a Level 2 Interaction Perfection audit. Focus on: micro-interactions, navigation flows, responsive design, accessibility, error handling, and performance.",
      premium: "Generate a Level 3 Premium Polish audit. Focus on: advanced visual effects, brand personality injection, data visualization excellence, and enterprise-grade polish.",
      full: "Generate a FULL 3-Level Report covering ALL three levels in sequence: Level 1 Foundation Fix, Level 2 Interaction Perfection, Level 3 Premium Polish. Include every sub-item from each level. This is a comprehensive design critique.",
    };
    generate(prompts[level]);
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

  const sessionLabel = (s: any) => {
    const ctx = s.context_json as Record<string, string> || {};
    const modeLabel = ctx.mode ? MODES.find(m => m.id === ctx.mode)?.label?.split(" ")[0] : null;
    return { title: s.title || "Untitled", mode: modeLabel };
  };

  return (
    <AuthGate requireActive>
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-20 pb-20">
          <div className="container max-w-7xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-xl font-bold text-foreground">Prompt Engine</h1>
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

            {/* Mode Selector */}
            <div className="flex gap-1 mb-6 p-1 bg-muted rounded-lg w-fit">
              {MODES.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setMode(id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    mode === id
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* ── Left Panel ── */}
              <div className="space-y-4">
                <Card className="bg-card border-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">
                      {mode === "mvp" && "Build Context"}
                      {mode === "website" && "Website Context"}
                      {mode === "shopify" && "Store Context"}
                      {mode === "uiux" && "Design Context"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">

                    {/* ── MVP Fields ── */}
                    {mode === "mvp" && (
                      <>
                        <Field label="Product Name">
                          <Input value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="e.g. TaskFlow" className="bg-background border-border" />
                        </Field>
                        <Field label="Target User">
                          <Input value={targetUser} onChange={(e) => setTargetUser(e.target.value)} placeholder="e.g. Solo founders building SaaS" className="bg-background border-border" />
                        </Field>
                        <Field label="Offer">
                          <Textarea value={offer} onChange={(e) => setOffer(e.target.value)} placeholder="What does this product deliver?" className="bg-background border-border min-h-[60px]" />
                        </Field>
                        <Field label="Monetization">
                          <Input value={monetization} onChange={(e) => setMonetization(e.target.value)} placeholder="e.g. $29/mo subscription (Stripe Checkout Sessions)" className="bg-background border-border" />
                        </Field>
                        <Field label="Integrations">
                          <Input value={mvpIntegrations} onChange={(e) => setMvpIntegrations(e.target.value)} placeholder="e.g. Stripe, Supabase, Twilio, Shopify connector" className="bg-background border-border" />
                        </Field>
                        <Field label="Constraints">
                          <Input value={constraints} onChange={(e) => setConstraints(e.target.value)} placeholder="e.g. No webhooks, MVP only" className="bg-background border-border" />
                        </Field>
                        <Field label="Category">
                          <Select value={category} onValueChange={setCategory}>
                            <SelectTrigger className="bg-background border-border">
                              <SelectValue placeholder="Select package" />
                            </SelectTrigger>
                            <SelectContent>
                              {packages.map((p) => (
                                <SelectItem key={p.id} value={p.slug}>{p.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </Field>
                      </>
                    )}

                    {/* ── Website Fields ── */}
                    {mode === "website" && (
                      <>
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
                            {/* Color swatches */}
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
                            {/* Fonts */}
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
                      </>
                    )}

                    {/* ── Shopify Fields ── */}
                    {mode === "shopify" && (
                      <>
                        <Field label="Store Name">
                          <Input value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder="e.g. Ember Goods" className="bg-background border-border" />
                        </Field>
                        <Field label="Niche / Products">
                          <Textarea value={niche} onChange={(e) => setNiche(e.target.value)} placeholder="e.g. Premium candles and home fragrance" className="bg-background border-border min-h-[60px]" />
                        </Field>
                        <Field label="Target Customer">
                          <Input value={targetCustomer} onChange={(e) => setTargetCustomer(e.target.value)} placeholder="e.g. Women 25-45, home décor enthusiasts" className="bg-background border-border" />
                        </Field>
                        <Field label="Pages Needed">
                          <Input value={shopifyPages} onChange={(e) => setShopifyPages(e.target.value)} placeholder="e.g. Home, PDP, Cart, Collections, Blog" className="bg-background border-border" />
                        </Field>
                        <Field label="Design Style">
                          <Input value={designStyle} onChange={(e) => setDesignStyle(e.target.value)} placeholder="e.g. Warm minimalist, earthy tones" className="bg-background border-border" />
                        </Field>
                        <Field label="Custom Features">
                          <Textarea value={customFeatures} onChange={(e) => setCustomFeatures(e.target.value)} placeholder="e.g. Bundle builder, loyalty points, subscription products" className="bg-background border-border min-h-[60px]" />
                        </Field>
                      </>
                    )}

                    {/* ── UI/UX Audit Fields ── */}
                    {mode === "uiux" && (
                      <>
                        <Field label="Design Description">
                          <Textarea
                            value={designDescription}
                            onChange={(e) => setDesignDescription(e.target.value)}
                            placeholder="Describe your current design, paste a URL, or describe the UI you want audited..."
                            className="bg-background border-border min-h-[100px]"
                          />
                        </Field>
                        <Field label="Current Problems">
                          <Textarea
                            value={currentProblems}
                            onChange={(e) => setCurrentProblems(e.target.value)}
                            placeholder="What's broken, feels off, or doesn't meet expectations?"
                            className="bg-background border-border min-h-[80px]"
                          />
                        </Field>
                        <Field label="Brand Colors">
                          <Input value={brandColors} onChange={(e) => setBrandColors(e.target.value)} placeholder="e.g. #1A1A2E, #E94560 or 'navy and gold'" className="bg-background border-border" />
                        </Field>
                        <Field label="Audit Level">
                          <Select value={auditLevel} onValueChange={setAuditLevel}>
                            <SelectTrigger className="bg-background border-border">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="foundation">Level 1 — Foundation Fix</SelectItem>
                              <SelectItem value="interaction">Level 2 — Interaction Perfection</SelectItem>
                              <SelectItem value="premium">Level 3 — Premium Polish</SelectItem>
                              <SelectItem value="full">Full 3-Level Report</SelectItem>
                            </SelectContent>
                          </Select>
                        </Field>
                      </>
                    )}
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
                        {sessions.map((s) => {
                          const { title, mode: sMode } = sessionLabel(s);
                          return (
                            <div key={s.id} className="flex items-center gap-1">
                              <button
                                onClick={() => loadSession(s)}
                                className={`flex-1 text-left px-3 py-2 rounded text-xs transition-colors flex items-center gap-2 ${
                                  s.id === activeSessionId
                                    ? "bg-primary/10 text-primary"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                }`}
                              >
                                <span className="flex-1 truncate">{title}</span>
                                {sMode && (
                                  <Badge variant="outline" className="text-[10px] py-0 h-4 shrink-0">{sMode}</Badge>
                                )}
                              </button>
                              <Button size="icon" variant="ghost" className="h-6 w-6 shrink-0" onClick={() => deleteSession(s.id)}>
                                <Trash2 className="h-3 w-3 text-muted-foreground" />
                              </Button>
                            </div>
                          );
                        })}
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
                                onClick={() => {
                                  const defaultTitle =
                                    mode === "mvp" ? productName :
                                    mode === "website" ? siteName || clientUrl :
                                    mode === "shopify" ? storeName :
                                    designDescription.slice(0, 50) || "UI/UX Audit";
                                  setSubmitTitle(defaultTitle);
                                }}
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
                                    placeholder="e.g. SaaS MVP with Stripe Checkout"
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
                      placeholder="Your Lovable-ready build prompt will appear here..."
                      className="bg-background border-border min-h-[400px] font-mono text-xs leading-relaxed"
                    />
                  </CardContent>
                </Card>

                {/* Quick Action Buttons */}
                <div className="flex flex-wrap gap-2">
                  {/* ── MVP Buttons ── */}
                  {mode === "mvp" && (
                    <>
                      <Button onClick={() => generate()} disabled={generating || !productName} className="gold-glow-strong">
                        {generating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Sparkles className="h-4 w-4 mr-1" />}
                        Generate
                      </Button>
                      <Button variant="outline" onClick={() => generate("Refine and improve the output. Keep the same 10-section structure.")} disabled={generating || !output} className="border-border">
                        <RefreshCw className="h-3 w-3 mr-1" /> Refine
                      </Button>
                      <Button variant="outline" onClick={() => generate("Simplify. Remove unnecessary complexity. Keep the same 10-section structure.")} disabled={generating || !output} className="border-border">
                        <Minimize2 className="h-3 w-3 mr-1" /> Simplify
                      </Button>
                      <Button variant="outline" onClick={() => generate("Add Stripe integration using ONLY Checkout Sessions (mode: 'payment' or 'subscription'). NEVER webhooks. success_url must include ?session_id={CHECKOUT_SESSION_ID}. Verify payment by querying the session on return. Keep the same 10-section structure.")} disabled={generating || !output} className="border-border">
                        <Plus className="h-3 w-3 mr-1" /> + Stripe (Sessions)
                      </Button>
                      <Button variant="outline" onClick={() => generate("Add Supabase Auth with RLS policies. Use supabase.auth for authentication, never raw SQL. Keep the same 10-section structure.")} disabled={generating || !output} className="border-border">
                        <Plus className="h-3 w-3 mr-1" /> + Supabase
                      </Button>
                      <Button variant="outline" onClick={() => generate("Add Lovable Shopify connector integration (connector_id: shopify). Use the native connector, not raw Shopify API. Keep the same 10-section structure.")} disabled={generating || !output} className="border-border">
                        <Plus className="h-3 w-3 mr-1" /> + Shopify
                      </Button>
                      <Button variant="outline" onClick={() => generate("Add Twilio SMS notifications for key user events. Use edge functions to call Twilio API. Keep the same 10-section structure.")} disabled={generating || !output} className="border-border">
                        <Plus className="h-3 w-3 mr-1" /> + Twilio
                      </Button>
                    </>
                  )}

                  {/* ── Website Buttons ── */}
                  {mode === "website" && (
                    <>
                      <Button onClick={() => generate()} disabled={generating || (!siteName && !siteGoal)} className="gold-glow-strong">
                        {generating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Sparkles className="h-4 w-4 mr-1" />}
                        Generate
                      </Button>
                      <Button variant="outline" onClick={() => generate("Refine and improve the output. Keep the same 5-section structure.")} disabled={generating || !output} className="border-border">
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
                    </>
                  )}

                  {/* ── Shopify Buttons ── */}
                  {mode === "shopify" && (
                    <>
                      <Button onClick={() => generate()} disabled={generating || !storeName} className="gold-glow-strong">
                        {generating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Sparkles className="h-4 w-4 mr-1" />}
                        Generate
                      </Button>
                      <Button variant="outline" onClick={() => generate("Refine and improve the output. Keep the same 6-section structure.")} disabled={generating || !output} className="border-border">
                        <RefreshCw className="h-3 w-3 mr-1" /> Refine
                      </Button>
                      <Button variant="outline" onClick={() => generate("Expand the product grid section: filterable grid, product cards, quick view, color swatches, size selectors, and image gallery specs.")} disabled={generating || !output} className="border-border">
                        <Plus className="h-3 w-3 mr-1" /> + Product Grid
                      </Button>
                      <Button variant="outline" onClick={() => generate("Add a detailed cart and checkout flow: cart drawer, upsells, Stripe Checkout Session integration (no webhooks), order confirmation, and post-purchase flows.")} disabled={generating || !output} className="border-border">
                        <Plus className="h-3 w-3 mr-1" /> + Cart Flow
                      </Button>
                      <Button variant="outline" onClick={() => generate("Add SEO optimization for the storefront: product schema markup, collection pages, blog SEO, meta tags, sitemap, and page speed considerations.")} disabled={generating || !output} className="border-border">
                        <Plus className="h-3 w-3 mr-1" /> + SEO
                      </Button>
                    </>
                  )}

                  {/* ── UI/UX Audit Buttons ── */}
                  {mode === "uiux" && (
                    <>
                      <Button onClick={() => generateUIAudit("foundation")} disabled={generating || !designDescription} className="gold-glow-strong text-xs">
                        {generating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Sparkles className="h-4 w-4 mr-1" />}
                        Level 1: Fix Foundation
                      </Button>
                      <Button variant="outline" onClick={() => generateUIAudit("interaction")} disabled={generating || !designDescription} className="border-border text-xs">
                        <Palette className="h-3 w-3 mr-1" /> Level 2: Interactions
                      </Button>
                      <Button variant="outline" onClick={() => generateUIAudit("premium")} disabled={generating || !designDescription} className="border-border text-xs">
                        <Sparkles className="h-3 w-3 mr-1" /> Level 3: Premium Polish
                      </Button>
                      <Button onClick={() => generateUIAudit("full")} disabled={generating || !designDescription} className="border-border text-xs" variant="outline">
                        <RefreshCw className="h-3 w-3 mr-1" /> Full 3-Level Report
                      </Button>
                    </>
                  )}
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
