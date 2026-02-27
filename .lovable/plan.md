

## Plan: Dream 100 Outreach Agents + Invite-Only Affiliate Program

Two features: (1) Add outreach agent actions directly on Dream 100 entries, and (2) build an invite-only affiliate/influencer program.

---

### Feature 1: Dream 100 Outreach Agents

**New edge function: `agent-dream100-outreach`**
- Accepts a Dream 100 entry ID + outreach channel (email/DM/SMS)
- Uses AI to craft a personalized partnership pitch based on the entry's name, platform, niche, followers, and notes
- For email: sends via Resend
- For SMS: sends via Twilio
- Updates `outreach_status` on the `dream_100` row (e.g., `dm_sent`)
- Logs to `outreach_log` table

**Dream 100 UI changes (`src/pages/Dream100.tsx`)**
- Add a "Send Outreach" action button per entry (mail icon) that opens a small dialog
- Dialog lets user pick channel (Email / SMS) and preview the AI-generated message before sending
- Shows a workflow-style progress indicator (generating message → sending → updating status)
- Bulk outreach option: "Outreach All Approved" button that runs the agent on all `approved` entries

**Database: Add `email` column to `dream_100` table**
- Migration to add `email text` and `phone text` columns to `dream_100` so outreach can reach them
- Update the discovery agent to try extracting email/phone when available

---

### Feature 2: Invite-Only Affiliate Program

**New table: `affiliate_program`**
- `id`, `user_id` (the affiliate/influencer), `referral_code` (unique slug), `commission_percent` (default 20), `status` (invited/active/paused/revoked), `invited_by` (admin user_id), `total_earned`, `total_referrals`, `created_at`
- RLS: users see own row, chief_architect manages all

**New table: `affiliate_referrals`**
- `id`, `affiliate_id` (FK to affiliate_program), `referred_user_id`, `referred_email`, `payment_id` (FK to payments), `commission_amount`, `status` (pending/paid/voided), `created_at`
- RLS: affiliates see own referrals, admin manages all

**Admin UI: Affiliate Management (`src/pages/admin/AdminAffiliates.tsx`)**
- Invite influencer by email from Dream 100 (one-click "Invite as Affiliate")
- Set commission %, view referral stats, pause/revoke affiliates
- Add to admin navigation

**Affiliate Dashboard (for invited influencers)**
- New page `/affiliate` showing their unique referral link, total referrals, earnings, and payout history
- Referral link format: `peoplefailsystemswork.com/?ref=CODE`

**Dream 100 integration**
- Add "Invite as Affiliate" button on Dream 100 entries that are `connected` or `partnered`
- Sends invitation email via Resend with the affiliate signup link
- Updates entry status to reflect affiliate invitation

**Tracking**
- Store `ref` query param in localStorage on landing page visit
- On signup/payment, check for stored ref code and create `affiliate_referrals` entry

---

### Implementation Order

1. DB migration: add `email`/`phone` to `dream_100`, create `affiliate_program` + `affiliate_referrals` tables with RLS
2. Create `agent-dream100-outreach` edge function
3. Update Dream 100 UI with outreach actions + affiliate invite button
4. Create admin affiliate management page
5. Create affiliate dashboard page
6. Add referral tracking to signup/payment flow
7. Register new routes in App.tsx and nav

---

### Technical Details

- Commission tracking hooks into existing `payments` table via `payment_id` FK
- Affiliate invitations use existing Resend integration
- The outreach agent reuses the same AI gateway pattern as `agent-outreach-email` but targets Dream 100 entries instead of leads
- `referral_code` generated as 8-char alphanumeric slug from user ID

