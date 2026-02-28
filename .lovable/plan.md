

## Plan: Media Buying Agent with User-Owned Meta Credentials + Direct Upload

### Architecture

Each user stores their own Meta credentials (encrypted in a per-user `user_integrations` table). They upload ad creatives directly to a storage bucket on the platform — no Google Drive needed.

---

### 1. Database

**`user_integrations` table** — stores per-user API credentials:
- `id` (uuid PK)
- `user_id` (uuid, NOT NULL)
- `provider` (text) — e.g. `meta_ads`
- `credentials` (jsonb) — `{ access_token, ad_account_id }`
- `created_at`, `updated_at`
- RLS: users can only CRUD their own rows

**`ad_campaigns` table** — tracks campaigns created by the agent:
- `id` (uuid PK)
- `user_id` (uuid)
- `campaign_name` (text)
- `objective` (text) — LEADS, CONVERSIONS, TRAFFIC
- `daily_budget_cents` (integer)
- `target_audience` (jsonb) — location, interests, age range
- `ad_copy` (jsonb) — headline, body, CTA
- `creative_urls` (text[]) — storage bucket URLs
- `meta_campaign_id`, `meta_adset_id`, `meta_ad_id` (text, nullable)
- `status` (text) — draft, active, paused, completed, error
- `performance` (jsonb) — impressions, clicks, spend, leads
- `error_message` (text, nullable)
- `created_at`, `updated_at`
- RLS: users manage own campaigns, chief architect has full access

**Storage bucket: `ad-creatives`** — public bucket for uploaded images
- RLS: users can upload/view/delete their own files (path prefix = user_id)

---

### 2. Edge Function: `agent-media-buyer`

Pipeline:
1. Fetch user's Meta credentials from `user_integrations`
2. Fetch creative image URLs from `ad-creatives` bucket (user's folder)
3. Generate ad copy via AI (Gemini) based on niche, audience, objective
4. Create Meta Campaign → Ad Set → Upload Creatives → Create Ad via Marketing API
5. Save all Meta IDs + status to `ad_campaigns`
6. Deduct 5 lead credits

Handles errors gracefully — if Meta API rejects, saves error to `ad_campaigns.error_message`.

---

### 3. UI: Media Buyer Setup + Campaign Creator

**Settings section** (on Agents or a dedicated page):
- Form to input Meta Access Token + Ad Account ID (saved to `user_integrations`)
- "Test Connection" button that hits Meta API to verify credentials
- Creative upload zone — drag-and-drop images to `ad-creatives` bucket
- Gallery view of uploaded creatives

**Campaign creator form:**
- Campaign name, objective dropdown, daily budget
- Target audience: location, age range, interests
- Select creatives from uploaded gallery
- "Launch Campaign" button triggers `agent-media-buyer`

**Campaign dashboard:**
- List of campaigns with status, spend, impressions, clicks, leads
- Pause/Resume toggle
- Error display for failed campaigns

---

### 4. Wire into Agent System

- Insert `media-buyer` agent row into `agents` table
- Add to `CREDIT_COSTS` in `api-gateway` (5 lead credits)
- Add route `/campaigns` or integrate as tab in Agents page

---

### Implementation Order

1. DB migration: `user_integrations`, `ad_campaigns` tables + `ad-creatives` storage bucket
2. Build `agent-media-buyer` edge function
3. Build Meta credentials settings UI + creative upload
4. Build campaign creator + dashboard
5. Register agent in system

