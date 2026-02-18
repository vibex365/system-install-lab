

# PFSW Platform Homepage — Implementation Plan

## Brand System Setup
- Override CSS variables with the PFSW palette: near-black backgrounds (#0B0B0F, #111118), gold accents (#D4AF37, #B8892E), light text (#F5F5F7, #B7B7C2)
- Tight tracking on headings, bold weights, grotesk feel via system fonts
- Gold used sparingly: borders, underlines, numbered accents

## Reusable Components
- **Navbar** — Sticky with backdrop blur, PFSW wordmark, anchor links (Method, What You Get, Proof, FAQ), Apply CTA button, Log In link, mobile hamburger menu
- **SectionHeader** — Reusable heading + subheading with consistent spacing
- **FeatureCard** — Dark card with subtle border, icon, title, description, gold hover underline
- **ProofCard** — Case study placeholder cards
- **PrinciplesList** — Numbered list (01–05) with gold numbers
- **FAQAccordion** — shadcn Accordion with 6 brand-voice Q&As
- **CTASection** — Reusable call-to-action block with primary/secondary buttons
- **Footer** — Links, brand line, social icon placeholders

## Home Page Sections (single scrollable page)
1. **Hero** — "People Fail. Systems Work." headline, subheadline, Apply + See the Method CTAs, placeholder dark panel with gold grid lines, micro-proof tagline, subtle glow animation
2. **Method** — 3 cards (Diagnose, Design, Deploy) with icons and bullet points
3. **What You Get** — 6-card grid of deliverables with gold underline hover effect
4. **Proof / Outcomes** — Two-column: outcomes bullets on left, 3 case study placeholder cards on right, "no hype" disclaimer
5. **Principles** — Numbered list 01–05 with gold accents, operator-tone copy
6. **FAQ** — 6-question accordion with direct, short answers
7. **Final CTA** — "Stop relying on motivation. Install a system." with Apply + Waitlist buttons and disclaimer

## Additional Routes (placeholder pages)
- `/apply` — Form with Name, Email, Role dropdown, "What are you building?" textarea, "Biggest bottleneck?" textarea → success toast + `track("apply_submitted")` placeholder
- `/waitlist` — Email-only capture → toast + `track("waitlist_submitted")` placeholder
- `/login` — Simple placeholder page
- `/privacy` and `/terms` — Placeholder text pages

## Interactions & Polish
- Smooth scroll to anchor sections from nav links
- Sticky navbar with blur on scroll
- Subtle CSS animations: fade-in on scroll, glow on gold accents, hover scale on cards
- Analytics event placeholders (`track()` stub function) for PostHog/GA
- Fully responsive mobile-first layout
- All copy written in direct, disciplined operator tone — no fluff, no emojis, no clichés

## No Backend Required
- All forms use local state with mock submit
- Components structured for easy future backend wiring

