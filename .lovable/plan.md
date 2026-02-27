

## Plan: ELYT Partner Funnel — Inbound Callback + SMS Affiliate Link

The flow: Lead completes quiz → gets SMS with callback number → calls in → AI voice agent reviews quiz results → after call ends, system sends SMS with the partner's ELYT affiliate link. This reuses the existing inbound callback infrastructure and adds the affiliate link delivery as a post-call step.

---

### Database Migration

**Add 3 columns to `user_funnels`:**
- `partner_mode` boolean default false
- `affiliate_url` text nullable
- `completion_action` text default 'callback' (values: `callback` | `send_link`)

**Add `affiliate_url` to `profiles`:**
- `affiliate_url` text nullable

---

### Edge Function Changes

**1. Update `funnel-call`** — after creating the lead and call log, check the funnel's `completion_action`:
- If `callback` (default + ELYT flow): existing behavior — SMS callback number
- After voice call completes (handled in step 2), send affiliate link

**2. Update `twilio-voice-webhook`** — at call completion, check if the call_log has an associated funnel with `partner_mode = true`:
- If yes, send a follow-up SMS with the affiliate URL from the funnel record
- Message: "Thanks for chatting with us! Here's your exclusive link to get started: {affiliate_url}"

**3. Create `agent-send-link`** — new workflow agent for orchestrator:
- Sends SMS with affiliate URL to a lead
- Used as the final step in partner workflows

---

### Frontend Changes

**4. Add `travel_mlm` to NICHES array in `Funnels.tsx`:**
- `{ value: "travel_mlm", label: "Travel / Lifestyle MLM" }`

**5. Add Partner Mode UI to `Funnels.tsx`:**
- Toggle switch for "Partner Mode" in funnel settings
- Text input for "Affiliate URL" (placeholder: `https://www.elytlifestyle.com/?ref=`)
- Only visible when partner_mode is toggled on
- Save to `user_funnels` record

**6. Update `PublicFunnel.tsx` result/confirmed phases:**
- When funnel has `partner_mode = true`, update CTA text:
  - Result: "Call us to review your results — we'll text you your exclusive link after!"
  - Confirmed: "After your call, check your texts for your exclusive membership link!"

---

### Config

Add to `supabase/config.toml`:
```toml
[functions.agent-send-link]
verify_jwt = false
```

---

### Implementation Order
1. Database migration (add columns to `user_funnels` and `profiles`)
2. Update `Funnels.tsx` — add travel_mlm niche + partner mode UI
3. Update `PublicFunnel.tsx` — partner mode result/confirmed copy
4. Update `funnel-call` — pass affiliate context to call log
5. Update `twilio-voice-webhook` — post-call affiliate SMS delivery
6. Create `agent-send-link` edge function for workflow use

