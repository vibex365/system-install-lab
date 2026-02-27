

## Plan: Forum Lead Scout Agent + Reply Templates

Three changes: (1) a new edge function that searches forums for high-intent posts, (2) copy-paste reply templates in the Dream 100 UI, and (3) accuracy fixes to niche magazine Scout Agent descriptions.

---

### 1. New Edge Function: `agent-forum-scout`

- Accepts `user_id`, `niche`, `location` (from profile)
- Uses Firecrawl search API to find recent posts on Reddit, Facebook groups, Nextdoor, and forums matching queries like:
  - `"looking for a lawyer" site:reddit.com [city]`
  - `"anyone recommend a dentist" site:facebook.com [city]`
  - `"need a personal trainer near" [city]`
- Uses AI (Gemini 2.5 Flash) to extract structured lead data: post URL, platform, poster intent, urgency score, suggested reply
- Inserts results into `leads` table with `source = 'forum_scout'`
- Returns count + preview of found leads

### 2. Dream 100 UI: Forum Scout Button + Reply Templates

- Add "Scout Forums" button next to "AI Discover" on Dream100 page
- When clicked, runs step-by-step workflow (similar to discovery agent) showing:
  - Searching Reddit → Searching Facebook → AI analyzing posts → Generating replies → Saving leads
- Results show as lead cards with:
  - Post snippet + URL (links to original post)
  - "Copy Reply" button with AI-generated reply text ready to paste
  - One-click "Add to CRM" to move into leads pipeline

### 3. Niche Magazine Copy Fix

- Update Scout Agent descriptions to clarify it **finds** posts and **generates reply templates** for manual posting
- Change from implying automated posting to: "Finds high-intent posts and generates a reply template you can post in seconds"

---

### Database

- No new tables needed — found leads go into existing `leads` table with `source = 'forum_scout'`
- Add `forum_post_url` and `suggested_reply` columns to `leads` table via migration

### Config

- Add `[functions.agent-forum-scout] verify_jwt = false` to config.toml

### Implementation Order

1. DB migration: add `forum_post_url` and `suggested_reply` to `leads`
2. Create `agent-forum-scout` edge function
3. Update Dream 100 UI with forum scout workflow + reply copy buttons
4. Fix niche magazine Scout Agent descriptions

