

# Activate All Agents + Build Video Content Agent

## Problem

Three fully-built agents (Cold Call, SMS Outreach, Cold Email Outreach) show "Coming Soon" buttons because they lack Stripe price IDs and aren't marked as included with membership. The Video Content Agent is the only one that should remain "Coming Soon" since it has no handler yet -- but per your request, it needs to be built out too.

## Changes

### 1. Mark outreach agents as included with membership (database update)

Set `included_with_membership = true` for Cold Call, SMS Outreach, and Cold Email Outreach. This makes them instantly usable by all active members without needing Stripe price IDs -- which makes sense since these are core outreach tools in the pipeline.

### 2. Build out the Video Content Agent

**Database**: Set `video-content` status to `active` and `included_with_membership = false` (it's a premium agent at $79/mo -- will still need a Stripe price ID to lease, or we can mark it included too).

**Frontend** (`src/pages/Agents.tsx`): Add input config for `video-content`:
- Topic / Build (textarea)
- Platform (select: YouTube, TikTok, Instagram Reels, All)
- Tone (select: Educational, Hype/Energy, Professional, Behind-the-scenes)

**Backend** (`supabase/functions/run-agent/index.ts`): Add `video-content` handler that generates:
- Video script (hook, body, CTA) optimized for the selected platform
- Thumbnail text suggestions (3 options)
- Video title and description
- Hashtags and posting notes

### 3. Admin access

Admin/Chief Architect RLS policies already exist on `agents`, `agent_leases`, and `agent_runs` tables. No changes needed there. However, the UI button logic needs a small fix so admins/chief architects can run agents without needing a lease (currently they'd still see "Coming Soon" or "Lease" buttons).

## Technical Details

### Database updates (via insert tool, not migration)
```sql
-- Make outreach agents included with membership
UPDATE agents SET included_with_membership = true WHERE slug IN ('cold-call', 'sms-outreach', 'cold-email-outreach');

-- Activate video content agent
UPDATE agents SET status = 'active' WHERE slug = 'video-content';
```

### Files to edit

| File | Change |
|------|--------|
| `src/pages/Agents.tsx` | Add `video-content` to `AGENT_INPUTS` config |
| `supabase/functions/run-agent/index.ts` | Add `else if (agent.slug === "video-content")` handler block before the generic fallback |

### Video Content handler logic
- Takes `topic`, `platform`, `tone` from input
- Calls `callAI()` with a system prompt for video content creation
- Returns structured output: script, thumbnail text, title/description, hashtags
- No external API needed (uses existing Lovable AI gateway)

