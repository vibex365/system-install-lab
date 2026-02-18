

# PFSW Acceptance Funnel — Implementation Plan

This plan builds the complete acceptance funnel: Stripe $5 application fee, admin approval with Twilio SMS, editorial `/accepted` induction page, founding member pricing, and membership activation via Stripe payment.

---

## What Gets Built

1. **Database changes** — New `system_meta` table, new `member_tier`/`invite_reputation_score`/`invite_multiplier` columns on `profiles`, new `accepted_pending_payment` enum value for `member_status`
2. **Stripe $5 application fee** — Application form submits to Stripe Checkout first; webhook creates the application record on payment success
3. **Twilio SMS scaffold** — Edge function that sends accept/reject SMS (wired to secrets, called from admin panel)
4. **`/accepted` editorial induction page** — Gated to `accepted_pending_payment` status, no navbar, serif editorial layout with gold dividers
5. **Stripe membership payment** — "Accept My Founding Spot" button triggers Stripe Checkout for membership; webhook activates profile
6. **Admin panel updates** — Approve triggers `accepted_pending_payment` + SMS; reject triggers rejection SMS
7. **Routing + auth flow updates** — Login redirects to `/accepted` when status is `accepted_pending_payment`; new route added

---

## Phase 1: Database Migration

**New enum value:**
- Add `'accepted_pending_payment'` to `member_status` enum

**New table: `system_meta`**
- `id` uuid PK
- `version` text default `'v1'`
- `founding_access_open` boolean default `true`
- `base_price` integer default `500` (cents)
- `updated_at` timestamptz default `now()`
- RLS: admin-only SELECT/UPDATE
- Seed one row on creation

**Profiles additions:**
- `member_tier` text nullable (values: `founding`, `standard`)
- `invite_reputation_score` integer default `100`
- `invite_multiplier` float default `1.0`

---

## Phase 2: Enable Stripe

Use the Lovable Stripe integration tool to enable Stripe. This will:
- Collect the Stripe secret key
- Provide the tools to create products/prices
- Enable webhook handling

Two Stripe products needed:
1. **"PFSW Application Review"** — $5 one-time
2. **"PFSW Membership"** — price from `system_meta.base_price`

---

## Phase 3: Application Flow with Stripe $5

**`/apply` changes:**
- Keep the 4-step wizard as-is
- On step 4 submit: instead of inserting directly, call an edge function `create-application-checkout`
- Edge function creates a Stripe Checkout session for $5, stores form data in session metadata
- Redirect user to Stripe Checkout
- On success: Stripe webhook edge function `stripe-webhook` receives `checkout.session.completed`, extracts metadata, inserts the application row with `payment_status = 'paid'` and `stripe_session_id`
- On cancel: user returns to `/apply` with a message

**Form data flow:**
```text
Browser (form data) --> Edge Function (create checkout session with metadata) --> Stripe Checkout --> Webhook --> Insert application row
```

---

## Phase 4: Twilio SMS Edge Function

**Edge function: `send-sms`**
- Accepts `{ phone, message }` in body
- Uses `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` secrets
- Calls Twilio REST API to send SMS
- Returns success/error

Secrets will be requested from the user via the secrets tool before proceeding.

---

## Phase 5: Admin Panel Updates

**On approve:**
1. Update `applications.status = 'accepted'`
2. If user exists: update `profiles.member_status = 'accepted_pending_payment'`
3. If user doesn't exist: show note (will activate on first login via email match)
4. Call `send-sms` edge function with acceptance message
5. Update `handle_new_user` trigger to set `member_status = 'accepted_pending_payment'` (instead of `active`) when matching an accepted application

**On reject:**
1. Update `applications.status = 'rejected'`
2. Call `send-sms` edge function with rejection message

---

## Phase 6: `/accepted` Editorial Induction Page

**Access rule:** Only visible when `profile.member_status === 'accepted_pending_payment'`

**Layout:**
- No Navbar, no Footer
- Full-screen black background
- Narrow reading column (max-w-2xl centered)
- Large serif headings (using `font-serif` class)
- Gold `<hr>` dividers between sections
- Scroll-based sections with generous spacing

**Sections:**
1. "You Were Selected" — confirmation with gravitas
2. "Why You" — personalized framing
3. "People Fail. Systems Work." — philosophy
4. "What This Actually Is" — what PFSW delivers
5. "What Changes" — transformation promise
6. "The Founding Standard" — exclusivity framing
7. "Founding Member Pricing" — price display (from `system_meta`)
8. "Decision" — two buttons

**Buttons:**
- Primary: "Accept My Founding Spot" — triggers Stripe Checkout for membership
- Secondary: "Release My Spot" — sets `member_status = 'inactive'`

**Conditional logic:**
- If `system_meta.founding_access_open = true`: show founding pricing
- If `false`: show standard pricing language

---

## Phase 7: Membership Payment (Stripe)

**Edge function: `create-membership-checkout`**
- Reads `system_meta.base_price`
- Creates Stripe Checkout session for that amount
- Returns checkout URL

**Webhook handling (in `stripe-webhook`):**
- On membership payment success:
  - Set `profiles.member_status = 'active'`
  - If `system_meta.version = 'v1'`: set `member_tier = 'founding'`, `invite_multiplier = 1.5`
  - Else: set `member_tier = 'standard'`, `invite_multiplier = 1.0`

---

## Phase 8: Auth Flow Updates

**Login redirect logic (in `use-auth.tsx` / `Login.tsx`):**
- After login, check `profile.member_status`:
  - `active` -> `/dashboard`
  - `accepted_pending_payment` -> `/accepted`
  - else -> `/status`

**`handle_new_user` trigger update:**
- When matching an accepted application, set `member_status = 'accepted_pending_payment'` instead of `active`

**`AuthGate` update:**
- Add support for `requireAcceptedPending` prop for the `/accepted` route

**New route in `App.tsx`:**
- `/accepted` -> `Accepted` page component

---

## Phase 9: Status Page Update

Update `/status` to handle the new `accepted_pending_payment` state:
- Show "Accepted — Complete Payment" with link to `/accepted`

---

## Technical Details

### Edge Functions Created
1. `create-application-checkout` — Creates $5 Stripe Checkout for application
2. `stripe-webhook` — Handles all Stripe webhook events (application payment + membership payment)
3. `send-sms` — Sends SMS via Twilio API

### Secrets Required
- `STRIPE_SECRET_KEY` (collected via Stripe integration tool)
- `TWILIO_ACCOUNT_SID` (will request from user)
- `TWILIO_AUTH_TOKEN` (will request from user)
- `TWILIO_PHONE_NUMBER` (will request from user)

### Files Modified
- `src/pages/Apply.tsx` — Submit calls edge function instead of direct insert
- `src/pages/Admin.tsx` — Approve/reject triggers SMS + new status
- `src/pages/Status.tsx` — Handle `accepted_pending_payment` state
- `src/pages/Login.tsx` — Redirect logic based on member_status
- `src/hooks/use-auth.tsx` — Expose member_status for routing
- `src/components/AuthGate.tsx` — New gating option
- `src/App.tsx` — Add `/accepted` route

### Files Created
- `src/pages/Accepted.tsx` — Editorial induction page
- `supabase/functions/create-application-checkout/index.ts`
- `supabase/functions/stripe-webhook/index.ts`
- `supabase/functions/send-sms/index.ts`

### Migration SQL (summary)
- `ALTER TYPE member_status ADD VALUE 'accepted_pending_payment'`
- `CREATE TABLE system_meta` with seed row
- `ALTER TABLE profiles ADD COLUMN member_tier, invite_reputation_score, invite_multiplier`
- Update `handle_new_user` trigger function

