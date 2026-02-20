
# 4-Mode Prompt Engine + Firecrawl Website Scanner

## Overview

This implements everything from both approved plans in one build:
1. Connect Firecrawl to unlock the website scanner
2. New `scan-website` edge function using Firecrawl branding + markdown + summary
3. Transform Engine.tsx into a 4-mode intelligence system (MVP Builder, Website Builder, Shopify, UI/UX Audit)
4. Website Builder mode gets the URL scanner that auto-fills form fields from client's live site
5. Fix Stripe prompt rule (no webhooks, checkout sessions only)
6. Add Lovable connector awareness to MVP Builder system prompt

---

## Before Implementation: Connect Firecrawl

The Firecrawl connection (`std_01kfs0g30aevy92kqye4qxdjda`) exists in the workspace but is not linked to this project. Linking it will inject `FIRECRAWL_API_KEY` into the project's edge functions automatically. This is required before the `scan-website` function can call the Firecrawl API.

---

## What Gets Built

### The 4 Modes

```text
[ MVP Builder ] [ Website Builder ] [ Shopify ] [ UI/UX Audit ]
```

Each mode has its own:
- System prompt (different AI persona + output structure per mode)
- Left panel form fields
- Quick-action buttons on the right
- Session context (mode is stored in context_json so loaded sessions restore the correct mode)

---

### Mode 1: MVP Builder (Enhanced from current)

Keeps all existing fields. Two upgrades to the system prompt:

**Stripe Rule (no webhooks):**
```
STRIPE RULE: NEVER use webhooks. ALWAYS use Stripe Checkout Sessions.
success_url must include ?session_id={CHECKOUT_SESSION_ID}
Verify payment by querying the session on return — not via webhook events.
```

**Lovable Connector Awareness:**
```
This is a Lovable project (React + Vite + Tailwind + TypeScript + Supabase Cloud).
Available native connectors: Stripe, Shopify, Slack, Firecrawl, ElevenLabs, Perplexity.
For AI: use Lovable AI Gateway via edge functions.
For auth: Supabase Auth with RLS — never raw client SQL.
```

Quick buttons: Generate, Refine, Simplify, + Stripe (Sessions), + Supabase, + Shopify connector, + Twilio

---

### Mode 2: Website Builder (New — with Firecrawl scanner)

**Form fields:**
- Client Website URL (with "Scan Site" button)
- Site Name (auto-filled from scan)
- Client Industry
- Site Goal (auto-filled from scan summary)
- Pages Needed
- Style Direction
- Color/Font Notes (auto-filled from scan branding)
- Animations Level (None / Subtle / Rich — Select)

**Scanner flow:**
1. Member pastes client URL and clicks "Scan Site"
2. Calls `scan-website` edge function
3. Firecrawl returns `branding` (colors, fonts) + `summary` (AI summary) + `markdown` (content)
4. Auto-fills: Site Name, Site Goal, Color/Font Notes, Style Direction
5. A "Scan complete" banner appears showing extracted color swatches and fonts
6. The raw brand context gets injected into the generation message

**System prompt:**
```
You are PFSW — an elite Lovable website prompt architect.
This is for CLIENT WEBSITES, not SaaS. No auth, no database, no RLS.
Focus on visual excellence, conversion, and scroll experience.

Output structure (5 sections):
1. Site Goal & Target Audience
2. Pages & Sections (with exact content per page)
3. UI/UX Style (typography, color, spacing, components)
4. Animations & Interactions (Framer Motion where appropriate)
5. Copy Tone & Content Notes
```

Quick buttons: Generate, Refine, + Animations section, + SEO section, + Mobile notes

---

### Mode 3: Shopify Storefront (New)

**Form fields:**
- Store Name
- Niche / Products
- Target Customer
- Pages Needed (checkbox-style text: Home, PDP, Cart, Collections, Blog)
- Design Style
- Custom Features

**System prompt:**
```
You are PFSW — an elite Lovable Shopify storefront prompt architect.
Use Lovable's native Shopify connector — NOT the raw Shopify API.
Products and store data come from the connector.
Checkout goes through Stripe Checkout Sessions (no webhooks) OR Shopify Checkout.

Output structure (6 sections):
1. Store Goal & Products
2. Shopify Connector Setup
3. Pages & Product Flows
4. UI/UX Requirements
5. Integrations
6. Build Order
```

Quick buttons: Generate, Refine, + Product Grid, + Cart Flow, + SEO

---

### Mode 4: UI/UX Audit (New — 3-tier framework)

**Form fields:**
- Design Description (large textarea — paste description or URL)
- Current Problems (what's broken or feels off)
- Brand Colors (hex codes or description)
- Audit Level selector: Foundation / Interaction / Premium / Full Report

**System prompt:** Uses the full 3-prompt design framework:
- Level 1 (Foundation): Typography scale, contrast/WCAG, spacing system, component standardization
- Level 2 (Interaction): Micro-interactions, navigation flows, responsive/a11y, error states, performance
- Level 3 (Premium): Visual effects, brand personality, data visualization, enterprise polish

**Quick buttons:** Run Level 1 Audit, Run Level 2 Audit, Run Level 3 Audit, Full 3-Level Report

The Full Report button calls generate() with all 3 levels concatenated as the refinement prompt, producing a comprehensive design critique in one pass.

---

## New Edge Function: `scan-website`

Located at `supabase/functions/scan-website/index.ts`.

Calls Firecrawl with `formats: ['branding', 'summary', 'markdown']` on the provided URL.

Returns a structured object:
```typescript
{
  colors: {
    primary: string,
    secondary: string,
    accent: string,
    background: string,
    text: string
  },
  fonts: string[],       // e.g. ["Inter", "Georgia"]
  summary: string,       // AI summary of site purpose
  pageContent: string,   // First 3000 chars of markdown content
  siteName: string       // From metadata title
}
```

The edge function normalizes URLs (adds `https://` if missing), reads `FIRECRAWL_API_KEY` from Deno env, and returns a clean error message if the connector isn't linked.

---

## Session System Updates

The `context_json` object stored per session will now include a `mode` field:
```json
{
  "mode": "website",
  "siteName": "Acme Corp",
  "clientIndustry": "Real estate",
  "siteGoal": "Generate leads for luxury condos",
  "colorFontNotes": "Primary: #C9A84C, Font: Playfair Display",
  ...
}
```

When a session is loaded, the mode pill selector updates to match, and the correct form fields render. This means sessions are fully mode-aware — loading a Website session restores the Website Builder form; loading an MVP session restores the MVP form.

---

## Files Changed

| File | Change |
|------|--------|
| `supabase/functions/scan-website/index.ts` | New — Firecrawl branding + summary + markdown scrape |
| `supabase/config.toml` | Add `[functions.scan-website]` entry |
| `src/pages/Engine.tsx` | Full rewrite — 4-mode selector, all form fields, all system prompts, scanner UI, session mode-awareness |

No database changes needed. The `prompt_sessions.context_json` column is already `jsonb` so it accepts any shape.

---

## UI Layout

```text
┌─ Header: Prompt Engine [mode pills] ──── New / Save / Export ─┐
│                                                                 │
│  ┌─ Left Panel ─────────────┐  ┌─ Right Panel ──────────────┐  │
│  │ [Mode-specific form]     │  │ Generated Prompt (textarea) │  │
│  │                          │  │                             │  │
│  │ [Sessions list]          │  │ [Quick action buttons]      │  │
│  └──────────────────────────┘  └─────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

In Website Builder mode, the top of the left form shows the URL scanner before the regular fields.

---

## Implementation Order

1. Connect Firecrawl (done via connector prompt — no code needed)
2. Create `supabase/functions/scan-website/index.ts`
3. Add `[functions.scan-website]` to `supabase/config.toml`
4. Rewrite `src/pages/Engine.tsx` with all 4 modes
