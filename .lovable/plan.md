

## Launch Readiness Plan

This plan covers three areas: moving the Magazine under the Admin Marketing tab, updating homepage copy for agency owners, and adding niche smart funnel example screenshots.

---

### 1. Move Magazine to Admin Marketing Tab

The Magazine (/magazine/inside) currently lives as a standalone member-facing page in the navbar. We will reposition it as a marketing asset managed from the Admin panel.

**Changes:**
- **AdminMarketing.tsx**: Add a new "Magazine" card section below the existing Intake Funnel card. It will include a link to preview the magazine (/magazine/inside), a copy-to-clipboard for the public URL, and a description framing it as a lead nurturing and conversion tool (send to prospects to build authority before the pitch call).
- **Navbar.tsx**: Remove the "Magazine" link from the member navigation (both desktop and mobile). The magazine page itself stays accessible via direct URL -- it becomes a marketing asset you share with prospects, not an internal member tool.
- **AdminShell nav stays the same** -- Magazine is accessed through the Marketing tab content, not as its own sidebar item.

### 2. Update Homepage Copy for Agency Owners

The homepage currently targets "web designers" and "freelancers." We will broaden the language to explicitly include agency owners.

**Changes to Index.tsx:**
- Hero subtitle: change from "Built for Web Designers Who Build With Lovable" to include agency owners (e.g., "Built for Agency Owners and Web Designers Who Build With Lovable")
- FAQ "Who is PFSW for?" answer: add "agency owners" alongside "web designers and freelancers"
- Pricing subtitle: mention agency owners
- SEO title/description: include "agency owners" in the meta
- Process step descriptions and pillar descriptions: keep as-is (they're already tool-focused and apply to both audiences)

### 3. Niche Smart Funnel Examples on Homepage

Add a new section between the Smart Funnel Builder demo and the Six Pillars section showcasing 3-4 niche smart funnel examples with placeholder screenshot cards.

**Changes to Index.tsx:**
- Add a new "Smart Funnel Examples" section with a grid of 3-4 cards, each showing:
  - A niche name (Dental, Restaurant, Real Estate, Fitness)
  - A funnel name (e.g., "Smile Health Score Quiz", "Online Presence Audit")
  - A placeholder screenshot area (styled card with a gradient mock since we don't have actual screenshots yet -- or use Unsplash niche images as stand-ins)
  - A brief one-liner description of what the funnel does
- This section visually demonstrates the variety of funnels members can generate and deploy

---

### Technical Summary

| File | Change |
|---|---|
| `src/pages/admin/AdminMarketing.tsx` | Add Magazine card with preview link and copy URL |
| `src/components/Navbar.tsx` | Remove Magazine link from member nav (desktop + mobile) |
| `src/pages/Index.tsx` | Add agency owner language throughout; add Smart Funnel Examples section |

No database changes required. No new dependencies needed.

