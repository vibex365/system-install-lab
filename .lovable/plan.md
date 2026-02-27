

## Plan: Bundles-Only Agents Page + Developer API Portal

### Overview
Three major changes: (1) strip individual agents from the Agents page to sell only workflow bundles, (2) build a full Developer API Portal for external platforms to consume agents via REST API, and (3) wire API usage to the existing credit system.

---

### 1. Agents Page — Bundles Only

**Remove from `src/pages/Agents.tsx`:**
- Remove "Included with Membership" section (individual agent cards)
- Remove "Add-On Agents" section with category filters
- Remove "My Active Agents" strip showing individual agents
- Keep the "Lead-to-Close Pipeline" visualization (it demonstrates workflow value)
- Keep "Workflow Bundles" section as the primary offering
- Keep "Run History" section
- Update header copy: "Agent Marketplace" → "Workflow Marketplace" with messaging about executing plans, not clicking buttons

**Reframe the page narrative:**
- "We don't sell tools. We sell execution plans." 
- Bundles are positioned as automated pipelines that run end-to-end

---

### 2. Developer API Portal — New Page + Infrastructure

**Database migration — new tables:**

`api_keys` table:
- `id` (uuid, PK)
- `user_id` (uuid, NOT NULL)
- `key_hash` (text, NOT NULL) — stores SHA-256 hash of the API key
- `key_prefix` (text, NOT NULL) — first 8 chars for display (e.g. `oc_live_a1b2...`)
- `label` (text, default 'Default')
- `permissions` (text[], default `{all}`)
- `is_active` (boolean, default true)
- `last_used_at` (timestamptz)
- `created_at` (timestamptz, default now())
- `revoked_at` (timestamptz)

`api_usage_log` table:
- `id` (uuid, PK)
- `api_key_id` (uuid, FK → api_keys)
- `user_id` (uuid, NOT NULL)
- `endpoint` (text, NOT NULL) — e.g. `/v1/agents/lead-prospector`
- `method` (text, default 'POST')
- `credits_consumed` (integer, default 1)
- `status_code` (integer)
- `response_time_ms` (integer)
- `created_at` (timestamptz, default now())

RLS: Users can only see/manage their own keys and usage logs. Chief architect has full access.

**New Edge Function: `api-gateway` (`supabase/functions/api-gateway/index.ts`)**
- Accepts REST calls: `POST /api-gateway?agent=lead-prospector`
- Authenticates via `Authorization: Bearer oc_live_xxx` API key (hashed lookup)
- Validates credits available (checks `credit_purchases` remaining balance)
- Routes to the appropriate agent function (reuses existing `run-agent` logic)
- Deducts credits from `credit_purchases` using FIFO
- Logs usage to `api_usage_log`
- Returns structured JSON response
- Rate limiting: 60 requests/minute per key

**Credit costs per API call (configurable):**
- Lead Prospector: 1 lead credit per lead found
- Site Audit: 1 lead credit
- Email Outreach: 1 SMS credit
- SMS Outreach: 1 SMS credit
- Voice Call: 1 voice credit
- Forum Scout: 2 lead credits
- Workflow bundle execution: sum of component costs

**New Page: `src/pages/DeveloperPortal.tsx`**
- API key management (create, revoke, copy key on creation only)
- Credit balance display per resource type
- Usage analytics (calls today, this month, top endpoints)
- Code examples with copy buttons (cURL, JavaScript, Python)
- Endpoint reference docs for each available agent
- Link to buy more credits (routes to `/upgrade`)

**New Route in `src/App.tsx`:**
- `/developers` → `<PlanGate><DeveloperPortal /></PlanGate>`

**Add nav link** in Navbar for "Developers" (visible to active members)

---

### 3. Config + Deployment

- Add `[functions.api-gateway] verify_jwt = false` to `supabase/config.toml` (uses API key auth, not JWT)
- API keys are generated with prefix `oc_live_` + 32 random chars
- Key is shown once on creation, only the hash is stored

---

### Implementation Order

1. DB migration: create `api_keys` and `api_usage_log` tables with RLS
2. Create `api-gateway` edge function
3. Refactor `Agents.tsx` to bundles-only
4. Build `DeveloperPortal.tsx` page
5. Add route and nav link

