
## Add Video Content Agent Placeholder

### What This Does

Adds the 11th agent — **Video Content Agent** — as a "Coming Soon" placeholder card to the `/agents` marketplace. No edge function pipeline, no Stripe checkout, no ElevenLabs or Shotstack integration yet. Just the profile card so it shows up in the catalog with the right description, pricing, and a "Coming Soon" badge.

### What Needs to Change

**1. Database — Insert the 11th agent row**

A single SQL `INSERT` into the `agents` table with:

- `name`: Video Content Agent
- `slug`: `video-content`
- `headline`: Turn any idea into a viral short-form video — fully automated.
- `category`: Content
- `icon_name`: Video (we'll map this to a Lucide icon)
- `price_cents`: 7900 ($79/mo — premium tier)
- `status`: `coming_soon` — so no Lease button appears, just a "Coming Soon" badge
- `stripe_price_id`: null (to be filled in later)
- `job_type`: `video-content`
- `what_it_does`: Full description of the pipeline (script → voiceover → visuals → render)
- `use_cases`: Array of 3 use cases
- `example_output`: Preview of what the agent delivers

**2. Frontend — Add `Video` icon to the icon map**

`src/pages/Agents.tsx` currently maps icon names to Lucide components in `ICON_MAP`. We need to add the `Video` icon from `lucide-react` so the card renders the correct icon instead of falling back to a blank.

No other frontend changes needed — the existing card rendering system already handles `coming_soon` status automatically (shows badge, hides Lease button).

### Technical Details

- Database migration: single `INSERT INTO agents (...)` statement
- Frontend: add `Video` to the lucide-react import and `ICON_MAP`
- No edge function changes
- No Stripe changes
- The card will render with a gold "Content" category badge, $79/mo price, and "Coming Soon" status — matching the style of the other 10 cards exactly

### Files Changing

| File | Change |
|---|---|
| Database migration | INSERT Video Content Agent row into `agents` table |
| `src/pages/Agents.tsx` | Add `Video` to icon imports and `ICON_MAP` |
