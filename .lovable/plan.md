
## OpenClaw Agent Marketplace — 10 Agent Profiles with Lease System

### Vision
Build a first-of-its-kind Agent Marketplace at `/agents` where members can browse 10 specialized AI agents, read exactly what each one does, and lease them for a monthly add-on fee. Each agent has a detailed profile card showing its capabilities, use cases, example outputs, and pricing. The Chief Architect manages the catalog from `/admin/agents`.

---

### The 10 Agents (Pre-Seeded Catalog)

| # | Agent Name | What It Does | Monthly Price |
|---|---|---|---|
| 1 | **Social Media Agent** | Writes and queues web design / build posts for Twitter, LinkedIn, and Instagram on your behalf. Pulls from your recent Lovable builds. | $29/mo |
| 2 | **Lead Prospector Agent** | Scrapes Google Maps and directories for local businesses — pulls name, phone, email, website, category. Delivers a clean lead list. | $49/mo |
| 3 | **Website Proposal Agent** | Takes a scraped business profile, analyzes their current site via Firecrawl, generates a personalized website rebuild proposal ready to send. | $59/mo |
| 4 | **SMS Follow-Up Agent** | Automatically texts leads when their application status changes — accepted, waitlisted, or rejected — via Twilio. | $29/mo |
| 5 | **Prompt Packager Agent** | Instantly standardizes and classifies any raw prompt you submit, skipping the review queue. Ships in under 60 seconds. | $19/mo |
| 6 | **Site Audit Agent** | Scans your live Lovable app via Firecrawl, then generates a full UI/UX audit prompt ready to paste back into Lovable. | $39/mo |
| 7 | **Weekly Recap Agent** | Every Sunday, pulls your session and generation history, writes a build summary, queues it as a draft for you to post or share. | $19/mo |
| 8 | **Email Drip Agent** | Sends a personalized 3-part email sequence to new leads using Resend — intro, follow-up, and close. Uses your name and brand. | $49/mo |
| 9 | **Competitor Intel Agent** | Give it a URL. It scrapes the competitor site, extracts their stack, positioning, pricing, and copy style, then generates a positioning report. | $39/mo |
| 10 | **Onboarding Agent** | When a new member joins, automatically sends them a welcome SMS, queues a personalized first-build prompt suggestion, and logs their onboard. | $29/mo |

---

### What We Are Building (4 Parts)

**Part 1: Database Tables**

Three new tables:

- `agents` — the catalog. Each row = one agent type with all profile data (name, slug, description, what_it_does, use_cases array, example_output, job_type, price_cents, status, icon_name, category)
- `agent_leases` — one row per member per leased agent (user_id, agent_id, stripe_session_id, status, leased_at, expires_at)
- `agent_runs` — one row every time a leased agent is triggered (lease_id, user_id, agent_id, job_id, triggered_at, status, result_summary)

RLS:
- Members: read active agents (catalog), read/insert their own leases and runs
- Chief Architect: full access to all three tables

**Part 2: Member Marketplace Page (`/agents`)**

A new page with two sections:

**"My Agents" strip** (top) — Only visible if user has active leases. Shows compact cards for each leased agent with a "Run Agent" button and last-run timestamp.

**"Agent Catalog"** (main section) — Grid of 10 detailed agent profile cards. Each card shows:
- Agent icon and category badge (e.g. "Outreach", "Research", "Content")
- Agent name and one-line headline
- Full "What This Agent Does" description (2-3 sentences)
- "Use Cases" list (3 bullet points of specific scenarios)
- "Example Output" preview (collapsed, expandable)
- Status badge (Active / Coming Soon)
- Monthly price
- "Lease Agent — $XX/mo" button → triggers Stripe Checkout (subscription mode)
- If already leased: shows "Active" green badge + "Run Agent" button instead

**Part 3: Admin Agent Manager (`/admin/agents`)**

Added to the AdminShell sidebar. Page shows:
- Table of all 10 agents with lease count per agent
- Toggle to activate/deactivate agents
- "Add Agent" button to create new entries
- View all members who have leased each agent

**Part 4: Stripe Lease Flow**

Two new backend functions:
- `create-agent-lease` — creates a Stripe Checkout session in subscription mode for the selected agent's price. Takes `agent_id` from the request body.
- `verify-agent-lease` — called on redirect back from Stripe. Confirms the session, inserts `agent_leases` record with `status: 'active'` and `expires_at` set 30 days out.

Both registered in `supabase/config.toml` with `verify_jwt = false` (auth validated in code).

---

### Stripe Pricing Note

Each of the 10 agents needs its own Stripe product/price. Rather than creating all 10 upfront, we will store the `stripe_price_id` column in the `agents` table (nullable). The Chief Architect populates these from the admin panel after creating the Stripe products. For the initial build, agents without a `stripe_price_id` will show "Coming Soon" even if status is active — this prevents broken checkout flows.

---

### File Plan

| File | Action |
|---|---|
| Database migration | Create `agents`, `agent_leases`, `agent_runs` tables + RLS + seed 10 agents |
| `src/pages/Agents.tsx` | New member marketplace page |
| `src/App.tsx` | Add `/agents` route |
| `src/components/Navbar.tsx` | Add "Agents" link for active members |
| `src/components/admin/AdminShell.tsx` | Add "Agents" nav item |
| `src/pages/admin/AdminAgents.tsx` | New admin management page |
| `src/App.tsx` | Add `/admin/agents` route |
| `supabase/functions/create-agent-lease/index.ts` | Stripe Checkout for agent lease |
| `supabase/functions/verify-agent-lease/index.ts` | Confirm payment, write lease |
| `supabase/config.toml` | Register both new edge functions |

---

### Agent Card Design

Each card is a rich profile — not a simple pricing tile. It uses the existing dark card system (`bg-card border-border`) with:
- A colored icon badge per category (gold for AI/Content, blue for Outreach, green for Research)
- An expandable "Example Output" section so members can preview exactly what the agent produces before leasing
- A clear separation between what the agent does automatically vs. what requires a trigger from the member

### User Flow

```text
Member visits /agents
  → Sees "Agent Catalog" with 10 detailed cards
  → Opens "Website Proposal Agent" — reads description, use cases, example output
  → Clicks "Lease Agent — $59/mo"
  → Stripe Checkout opens (subscription)
  → Pays → redirected to /agents?lease_success=true&agent_id=...
  → verify-agent-lease runs → lease record created
  → Page refreshes → "Website Proposal Agent" now shows "Active" + "Run Agent" button
  → Member clicks "Run Agent" → enters target business URL
  → Job queued in OpenClaw → agent runs → result shown inline
```
