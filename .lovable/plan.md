

# Full Build Plan: CRM + Smart Calendar + Smart Funnel Engine + Email Drip + Pipeline Upgrade

## Overview

This is a consolidated plan covering everything discussed. Five major features built together:

1. **CRM Dashboard** -- Members manage all their leads in one place with pipeline status tracking
2. **Smart Calendar** -- Each member gets a personal booking page for prospects to schedule calls
3. **Smart Funnel Builder** (replaces Website Builder) -- Scan a prospect's site for brand data, then generate an interactive quiz funnel prompt. The generated prompt includes instructions for a **form API endpoint** so the funnel captures leads for the member's client
4. **Email Drip Agent** -- Activate and build the handler with Resend for sending 3-part email sequences
5. **6-Step Pipeline** with Site Audit inserted and full handoff chain with CRM auto-updates

---

## The Clarification: Form API

The Form API is NOT a backend feature we build on this platform. Instead, the **generated Lovable prompt** will include instructions telling the AI to add a form submission endpoint in the funnel it builds. When a member builds a smart funnel for their client (e.g., a dental quiz), that funnel will have a lead capture form that stores submissions in the client project's own backend. This is purely a prompt instruction -- we add it to the system prompt so every generated funnel includes form handling out of the box.

---

## Database Changes (4 new tables + 1 data update)

### New Table: `leads`
Persistent CRM storage for scraped and manually-added leads.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid, PK | auto-generated |
| user_id | uuid, NOT NULL | Owner |
| business_name | text | |
| contact_name | text, nullable | |
| phone | text, nullable | |
| email | text, nullable | |
| website | text, nullable | |
| address | text, nullable | |
| city | text, nullable | |
| category | text, nullable | |
| rating | numeric, nullable | Google rating |
| website_quality_score | integer, nullable | 0-10 |
| audit_summary | text, nullable | Pain points from site audit |
| pipeline_status | text, default 'scraped' | scraped / audited / emailed / contacted / called / proposal_sent / booked / converted / lost |
| source | text, default 'manual' | manual / lead-prospector / import |
| notes | text, nullable | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

RLS: Users can only SELECT, INSERT, UPDATE, DELETE their own leads.

### New Table: `booking_settings`
Per-member calendar configuration.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid, PK | |
| user_id | uuid, unique | |
| display_name | text | Shown on booking page |
| timezone | text, default 'America/New_York' | |
| available_days | integer[], default {1,2,3,4,5} | 0=Sun..6=Sat |
| start_hour | integer, default 9 | |
| end_hour | integer, default 17 | |
| slot_duration_minutes | integer, default 30 | |
| booking_slug | text, unique | For public URL /book/:slug |
| created_at | timestamptz | |

RLS: Owner manages own row. Public can SELECT by booking_slug.

### New Table: `bookings`
Scheduled appointments.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid, PK | |
| host_user_id | uuid | |
| guest_name | text | |
| guest_email | text | |
| guest_phone | text, nullable | |
| scheduled_at | timestamptz | The booked slot |
| duration_minutes | integer, default 30 | |
| status | text, default 'confirmed' | confirmed / cancelled / completed |
| notes | text, nullable | |
| lead_id | uuid, nullable | Links to leads table |
| created_at | timestamptz | |

RLS: Host can view/update own bookings. Public can INSERT (to book). Public can SELECT by host to check availability.

### Data Update
```sql
UPDATE agents SET status = 'active' WHERE slug = 'email-drip';
```
Video Content stays as `coming_soon`.

---

## Secrets Needed

- **RESEND_API_KEY** -- for the Email Drip agent to send emails via Resend (free tier: 100 emails/day)

---

## Edge Function Changes

### 1. `supabase/functions/run-agent/index.ts` -- Add email-drip handler

New handler block for `agent.slug === "email-drip"`:
- Inputs: `lead_name`, `lead_email`, `business_name`, `website_url`, `niche`, `sender_name`, `sender_email`, `pitch_context`
- AI generates 3 structured emails (Day 1 intro, Day 3 value, Day 5 close)
- Sends Email 1 immediately via Resend API (`POST https://api.resend.com/emails`)
- Returns all 3 emails formatted in the result for manual follow-up
- Includes send status (sent / failed / resend_not_configured)

### 2. `supabase/functions/run-agent/index.ts` -- Add CRM auto-save

After Lead Prospector completes, parse the result and INSERT leads into the `leads` table with `pipeline_status = 'scraped'`.

After Site Audit completes on a lead, UPDATE the lead's `audit_summary` and set `pipeline_status = 'audited'`.

### 3. `supabase/functions/run-agent/index.ts` -- Inject booking URL

For SMS Outreach, Cold Call, Email Drip, and Website Proposal: fetch the member's `booking_settings.booking_slug` and include their booking URL in the AI prompt so all outreach copy ends with a booking CTA.

---

## New Frontend Pages (3)

### `/crm` -- CRM Dashboard (member-only)
- Lead table: Business Name, Contact, Phone, Email, Website, Pipeline Status, Source, Date
- Pipeline status filter tabs: All / Scraped / Audited / Contacted / Booked / Converted
- Quick actions per lead: Edit, change status, hand off to Audit/SMS/Call/Proposal
- Add lead manually (modal form)
- Stats bar: Total Leads, Contacted, Booked, Converted (with conversion rate)
- Same dark editorial design as the rest of the platform

### `/calendar` -- Booking Dashboard (member-only)
- Upcoming bookings list with date/time, guest name, status
- Settings panel: configure available days, hours, timezone, booking slug
- Copy shareable booking link button
- Cancel / mark completed actions

### `/book/:slug` -- Public Booking Page (no auth required)
- Fetches host's booking_settings by slug
- Calendar date picker for date selection
- Available time slots (filters out already-booked slots)
- Simple form: Name, Email, Phone (optional), Notes
- Confirmation screen after booking
- Clean, professional design

---

## Modified Frontend Pages

### `src/pages/Engine.tsx` -- Smart Funnel Builder (replaces Website Builder)

**Remove**: "Website Builder" header, Pages Needed field, Animations Level field

**Add**:
- Header changes to "Smart Funnel Builder"
- New fields: Quiz Title, Number of Questions (5-8), Result Label (e.g. "Risk Score"), CTA Text
- Keep: Niche selector, URL scanner, brand context, style direction, color/font notes

**New system prompt** (`SYSTEM_FUNNEL`) replaces `SYSTEM_WEBSITE`:
- Instructs AI to generate a React quiz funnel prompt
- Includes: multi-step quiz flow, education slides, lead capture form, animated score reveal, result page, booking CTA
- **Form API instruction**: The prompt tells the AI to include a backend function or form handler that stores quiz submissions (name, email, phone, answers, score) so the member's client captures leads. This is baked into the generated Lovable prompt, not our platform
- Uses brand context from site scan if available

**Updated niche presets** for funnel mode:
- Dental: "Is Your Smile Costing You Confidence?" -- smile health score
- Restaurant: "Is Your Restaurant Leaving Money on the Table?" -- revenue leak score
- Real Estate: "What's Your Home Really Worth?" -- market readiness score
- Law Firm: "Are You Legally Protected?" -- risk assessment score
- Fitness: "What's Your Fitness Age?" -- wellness score
- Auto Shop: "Is Your Car a Ticking Time Bomb?" -- vehicle health score
- Plumbing: "Is Your Home's Plumbing Secretly Failing?" -- plumbing risk score
- Roofing: "Is Your Roof Protecting Your Family?" -- roof safety score
- Salon: "What's Your Hair Health Score?" -- hair wellness score

### `src/pages/Agents.tsx` -- Pipeline + Email Drip + Handoffs

**Pipeline expansion** to 6 steps:
```
Lead Prospector -> Site Audit -> Email Drip -> SMS Outreach -> Cold Call -> Website Proposal
```

**AGENT_INPUTS for email-drip** expanded:
- Lead Name, Lead Email (required), Business Name, Website URL, Niche (dropdown), Your Name (sender), Your Email (sender), Pitch Context (textarea)

**New handoff buttons**:
- Lead Prospector results: Add "Audit" button per lead (opens Site Audit with lead's URL)
- Site Audit results: Add "Email Drip", "SMS", "Call", "Proposal" buttons (carry audit findings as pitch_context)

**New state management**:
- `auditPrefill` / `emailDripPrefill` for carrying data between agent handoffs
- `onHandoffToAudit` / `onHandoffToEmailDrip` callbacks on RunAgentModal

### `src/components/Navbar.tsx` -- Add CRM + Calendar links
- Add "CRM" and "Calendar" links for active members (between Library and Agents)

### `src/App.tsx` -- Add routes
- `/crm` -> CRM page
- `/calendar` -> Calendar page
- `/book/:slug` -> Public booking page

---

## Summary of All Changes

### Database
| Change | Detail |
|--------|--------|
| New table: `leads` | CRM lead storage with RLS |
| New table: `booking_settings` | Calendar config per member with RLS |
| New table: `bookings` | Scheduled appointments with RLS |
| Data update | Set email-drip agent status to 'active' |

### Secrets
| Secret | Purpose |
|--------|---------|
| RESEND_API_KEY | Email sending for Email Drip agent |

### New Files
| File | Purpose |
|------|---------|
| `src/pages/CRM.tsx` | Lead management dashboard |
| `src/pages/Calendar.tsx` | Booking dashboard + availability settings |
| `src/pages/BookingPage.tsx` | Public booking page for prospects |

### Modified Files
| File | Changes |
|------|---------|
| `supabase/functions/run-agent/index.ts` | Add email-drip handler (Resend), CRM auto-save, booking URL injection |
| `src/pages/Engine.tsx` | Complete rewrite to Smart Funnel Builder with new system prompt including form API instructions |
| `src/pages/Agents.tsx` | 6-step pipeline, email-drip inputs, audit + email drip handoff buttons, CRM auto-updates |
| `src/components/Navbar.tsx` | Add CRM + Calendar nav links |
| `src/App.tsx` | Add /crm, /calendar, /book/:slug routes |

### Build Order
1. Database migration (leads, booking_settings, bookings + RLS)
2. Activate email-drip agent
3. Add RESEND_API_KEY secret
4. Update run-agent edge function (email-drip handler, CRM auto-save, booking URL injection)
5. Build BookingPage.tsx (public /book/:slug)
6. Build Calendar.tsx (member dashboard)
7. Build CRM.tsx (lead management)
8. Rewrite Engine.tsx (Smart Funnel Builder with form API in prompt)
9. Update Agents.tsx (6-step pipeline, handoffs, email-drip inputs)
10. Update Navbar.tsx + App.tsx (new routes)

