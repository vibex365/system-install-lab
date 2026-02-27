

## Plan: ELYT Partner Funnel — Inbound Callback + SMS Affiliate Link ✅ IMPLEMENTED

The flow: Lead completes quiz → gets SMS with callback number → calls in → AI voice agent reviews quiz results → after call ends, system sends SMS with the partner's ELYT affiliate link. This reuses the existing inbound callback infrastructure and adds the affiliate link delivery as a post-call step.

---

### Completed Steps

1. ✅ Database migration — added `partner_mode`, `affiliate_url`, `completion_action` to `user_funnels` and `affiliate_url` to `profiles`
2. ✅ Added `travel_mlm` niche to `Funnels.tsx` NICHES config
3. ✅ Added Partner Mode UI to `Funnels.tsx` — toggle + affiliate URL input
4. ✅ Updated `PublicFunnel.tsx` — partner mode result/confirmed/booking CTA text
5. ✅ Updated `funnel-call` — passes partner_mode + affiliate_url in call_log quiz_answers
6. ✅ Updated `twilio-voice-webhook` — sends affiliate SMS after completed call when partner_mode is true
7. ✅ Created `agent-send-link` edge function for workflow orchestrator use
8. ✅ Added `send_link` agent to orchestrator's available agents list
9. ✅ Added `agent-send-link` to `supabase/config.toml`
