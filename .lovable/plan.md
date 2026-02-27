

## Plan: Port VibeX Twilio Voice Webhook, Funnel-Call, SMS Reply Handlers & Resend Email Setup to PFSW

This is a large migration. VibeX uses Twilio for real voice calls (not Vapi), with a full conversational AI webhook that injects quiz answers into a live phone call. PFSW currently uses Vapi for calls. We need to bring over the Twilio-native voice system and adapt it to PFSW's data model.

---

### Database Changes Required

PFSW's `call_logs` table is missing columns that VibeX relies on:
- `quiz_score` (integer)
- `quiz_result_label` (text)
- `quiz_answers` (jsonb) — stores conversation history, quiz summary
- `quiz_id` (uuid)
- `submission_id` (text)
- `lead_id` (uuid)
- `call_summary` (text)
- `call_duration_seconds` (integer)
- `call_recording_url` (text)
- `appointment_id` (uuid)
- `booking_made` (boolean)

PFSW's `leads` table is missing:
- `sms_opt_out` (boolean, default false)

New tables needed:
- `appointments` — for booking from voice calls (id, user_id, lead_id, title, description, start_at, end_at, status, location, created_at)
- `availability_slots` — for user scheduling preferences (id, user_id, day_of_week, start_time, end_time, is_active, created_at)

---

### Edge Functions to Create/Adapt (5 functions)

#### 1. `funnel-call` (NEW — from VibeX)
- Called after quiz completion in IntakeFunnel.tsx
- Creates a lead in `leads` table from quiz data
- Creates a `call_logs` entry with `status: 'awaiting_callback'` and quiz context
- Sends SMS via Twilio with callback number
- Adapted: use PFSW field names (`business_name`/`contact_name` instead of `first_name`/`last_name`), route to admin user, reference PFSW product not VibeX/roofing

#### 2. `twilio-voice-webhook` (NEW — from VibeX, 1176 lines)
- Twilio calls this endpoint when someone calls the TWILIO_PHONE_NUMBER
- Handles: inbound call recognition, multi-turn AI conversation via Lovable AI (replacing Anthropic), gather/speech events, recording, status callbacks, appointment booking, booking SMS/email confirmations
- Adapted: Replace all VibeX/roofing references with PFSW digital entrepreneur context. Replace Anthropic API calls with Lovable AI gateway (`google/gemini-2.5-flash`). Remove `_shared/get-niche-config.ts` dependency (use PFSW's `niche_config` table directly). Use PFSW field names on leads table.

#### 3. `trigger-twilio-call` (NEW — from VibeX)
- Admin/CRM can trigger outbound calls to leads
- Creates call log, initiates Twilio call with webhook URL pointing to `twilio-voice-webhook`
- Adapted: use PFSW auth pattern, field names

#### 4. `twilio-webhook` (NEW — from VibeX)
- SMS reply handler for STOP/START/YES keywords
- On YES reply: triggers a voice call to the lead
- Adapted: use PFSW leads table fields, remove VibeX profile references

#### 5. `send-email-followup` (NEW — from VibeX)
- AI-generated follow-up emails to leads via Resend
- Supports: follow_up, post_call, nurture types
- Adapted: use PFSW product context, field names, niche_config table

---

### Frontend Changes

#### IntakeFunnel.tsx — Connect quiz completion to `funnel-call`
- After `submitLead` saves to `funnel_leads` and `waitlist`, also call `funnel-call` edge function with quiz data (score, tier, answers, phone) to create CRM lead + trigger SMS

#### CRM KanbanBoard — Show quiz data on funnel leads
- Leads with `source: 'quiz_funnel'` show a badge with quiz score/tier
- Detail drawer shows quiz answers from notes field

---

### Config Changes

Add to `supabase/config.toml`:
```
[functions.funnel-call]
verify_jwt = false

[functions.twilio-voice-webhook]
verify_jwt = false

[functions.trigger-twilio-call]
verify_jwt = false

[functions.twilio-webhook]
verify_jwt = false

[functions.send-email-followup]
verify_jwt = false
```

---

### Key Adaptations from VibeX → PFSW

| VibeX | PFSW |
|-------|------|
| `first_name` / `last_name` on leads | `contact_name` / `business_name` on leads |
| `lead_activities` table | `lead_activity_log` table |
| `client_websites` / `client_slug` | Not needed (single product) |
| Anthropic Claude for voice AI | Lovable AI gateway (gemini-2.5-flash) |
| `vibex` / `client` funnel types | `pfsw` single funnel type |
| `noreply@vibex.ai` emails | `noreply@[PFSW domain]` or Resend dev sender |
| `agency_name` on profiles | Not on PFSW profiles (use "PFSW" brand) |
| `increment_usage` RPC | `get_or_create_usage` + direct update |

---

### Implementation Order

1. Database migration (add columns to call_logs, leads; create appointments & availability_slots tables)
2. Create `funnel-call` edge function
3. Create `twilio-voice-webhook` edge function (largest piece)
4. Create `trigger-twilio-call` edge function
5. Create `twilio-webhook` SMS reply handler
6. Create `send-email-followup` edge function
7. Update IntakeFunnel.tsx to call `funnel-call` on completion
8. Update CRM to show quiz badges on funnel leads
9. Update config.toml entries

