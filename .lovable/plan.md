

# Fix Cold Call Agent — VAPI Payload Structure

## Problem

The VAPI API is returning: *"Couldn't Get Assistant. Need Either `assistant`, `assistantId`, `squad`, Or `squadId`."*

The code currently sends `assistantOverrides`, which is only valid when paired with an `assistantId` (a pre-created assistant in VAPI). Since no assistant was created in VAPI, the call fails.

## Fix

Change `assistantOverrides` to `assistant` in the VAPI payload. This tells VAPI to create an inline (transient) assistant for each call — no need to pre-create anything in the VAPI dashboard.

Also update the Cold Call agent's system prompt to focus on **Smart Funnels** instead of website redesigns (matching the Website Proposal agent update).

## File to edit

**`supabase/functions/run-agent/index.ts`** — one change in the cold-call handler:
- Rename `assistantOverrides` to `assistant` in the `vapiPayload` object (around line 535)
- Update the system prompt to pitch Smart Funnels instead of web design
- Update the `firstMessage` to reference smart funnel / lead generation systems

Same fix also applies to the `vapi-call` edge function (`supabase/functions/vapi-call/index.ts`) which has the same `assistantOverrides` bug.

## No VAPI dashboard setup needed

You do not need to create an assistant inside VAPI. The inline `assistant` field handles everything — model, voice, prompt — on the fly per call.

