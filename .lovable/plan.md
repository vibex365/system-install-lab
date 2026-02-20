
# Complete Platform Audit & Magazine Upgrade Plan

## Current State Assessment

### The Full User Journey (What's Built)

```text
Public: / → /apply ($5 fee) → /application-under-review
                                     ↓
Admin: /admin/applications → Approve (sets accepted_pending_payment)
                                     ↓
User: auto-redirect to /accepted (induction page) → Stripe $197/mo
                                     ↓
Post-payment: /engine?membership_session_id=... → verify → active
                                     ↓
Member: /engine, /library, /magazine/inside, /choose-cohort, /board
```

### What's Complete
- Application funnel (4-step form + $5 Stripe fee)
- Admin approve/reject + SMS trigger
- Auth redirect logic (login → /accepted or /engine or /status)
- Prompt Engine with session memory
- Library with prompt packages
- Board (posts, comments, votes)
- Weekly cohorts + attendance
- Lead dashboard
- Admin panel (all 8 sub-pages)
- 20-page magazine at `/magazine/inside`

### Issues Identified

**1. Magazine Placement Bug**
The magazine is currently gated with `requireActive` — meaning only paid members can read it. But the user says it should be the "final step before purchase" — i.e., it should be accessible to accepted users BEFORE they pay. The correct gate should be accessible to either `accepted_pending_payment` OR `active` users.

**2. Magazine Missing: Cover Page + Manifesto**
- Page 1 currently jumps straight to content
- Needs a full-screen cover page (using the uploaded image as background) with the manifesto: "People Fail. Systems Work." and "No one is bigger than the program"
- Page 1 should be treated as a visually distinct cover/manifesto, separate from the chapter articles

**3. Magazine Missing: Images**
- The 20 pages are pure text — no visuals
- Need atmospheric editorial imagery to break up long-form content and make it feel premium (using Unsplash URLs for relevant stock photography)

**4. Magazine Flow in the User Journey**
Looking at the `/accepted` page and the `/engine` redirect — the magazine isn't currently shown as a step between acceptance and payment. It should be offered as reading material on the `/accepted` page ("Read the full doctrine before you decide") so accepted users can read it and feel more informed about the purchase.

**5. Accepted Page CTA Language**
The accept button says "Accept My Founding Spot" regardless of `foundingOpen` state. When `foundingOpen` is false it should say "Activate Membership."

**6. Post-Payment Flow Gap: /choose-cohort**
After Stripe payment, users land on `/engine` which verifies the session. But there's no automatic redirect to `/choose-cohort` if the user hasn't selected a cohort yet. The Engine page should check `profile.cohort_id` and redirect to `/choose-cohort` if null.

---

## What Will Be Built

### Task 1 — Magazine: Cover Page + Manifesto (Page 0)
Add a dedicated cover page as index 0 in `magazinePages.ts` with:
- Full-screen black background with the uploaded user image as cover art
- Large serif headline: "People Fail. Systems Work."
- Secondary line: "No one is bigger than the program."
- PFSW institutional tagline
- "Begin Reading" CTA to page 1

Copy the uploaded image to `src/assets/magazine-cover.jpg` and import it in the component.

### Task 2 — Magazine: Editorial Images Per Page
Update `MagazinePage` interface to add optional `image?: string` field. Add curated Unsplash image URLs to selected pages (approx. every 3-4 pages) that match the editorial tone:
- Dark, moody, architectural photography
- Urban builder/creator imagery
- System/machinery/structure visuals

These render as full-width editorial images below the chapter label and above the title.

### Task 3 — Magazine: Auth Gate Fix
Change `MagazineInside.tsx` from:
```tsx
<AuthGate requireActive>
```
To a custom check that allows both `active` AND `accepted_pending_payment` users:
```tsx
// Remove AuthGate, use manual redirect logic via useAuth + useEffect
// Allow: active, accepted_pending_payment
// Redirect to /login if not logged in
// Redirect to /status if pending/rejected/inactive
```

### Task 4 — Magazine Link on Accepted Page
Add a subtle "Read the full doctrine" link on `/accepted` that opens `/magazine/inside` in a new tab or navigates there. Place it between the "What This Actually Is" section and the pricing section so users can go deeper before committing.

### Task 5 — Post-Payment Cohort Redirect
In `Engine.tsx`, after membership verification succeeds (when `membership_session_id` is in URL), check if `profile?.cohort_id` is null and redirect to `/choose-cohort` automatically.

### Task 6 — Accepted Page: Dynamic Button Text
Fix the "Accept My Founding Spot" button to read "Activate Membership" when `foundingOpen` is false.

---

## Technical Implementation Details

### Magazine Cover Image
- Copy `user-uploads://IMG_3582.jpeg` → `src/assets/magazine-cover.jpg`
- Import as ES6 module in `MagazineInside.tsx`
- Use as full-bleed cover with `object-cover` + dark overlay

### Updated MagazinePage Type
```typescript
export interface MagazinePage {
  pageNumber: number;
  chapter: string;
  title: string;
  subtitle?: string;
  image?: string;  // NEW: Unsplash URL
  isCover?: boolean; // NEW: special cover treatment
  sections: { heading?: string; body: string }[];
}
```

### Magazine Auth Logic
```tsx
const { user, profile, isChiefArchitect, loading } = useAuth();
const navigate = useNavigate();
useEffect(() => {
  if (loading) return;
  if (!user) { navigate("/login"); return; }
  const s = profile?.member_status as string;
  const allowed = s === "active" || s === "accepted_pending_payment" || isChiefArchitect;
  if (!allowed) { navigate("/status"); return; }
}, [user, profile, loading]);
```

### Files to Modify
1. `src/assets/magazine-cover.jpg` — new (copy from uploads)
2. `src/data/magazinePages.ts` — add cover page (index 0), add `image` fields to select pages
3. `src/pages/MagazineInside.tsx` — cover page special rendering, image display, custom auth gate
4. `src/pages/Accepted.tsx` — add doctrine link + fix button text
5. `src/pages/Engine.tsx` — redirect to /choose-cohort if no cohort after payment

---

## What's Not Missing (Already Complete)
- User roles table (`user_roles`) — already exists, `has_role()` RLS function in use
- Admin approve/reject flow — wired and working
- SMS edge function — deployed
- Auth redirect (login → /accepted or /engine) — working
- All 20 magazine pages of content — complete
- Stripe checkout for both application and membership — complete
- Lead dashboard and attendance — complete
- Board with posts/comments/votes — complete

---

## Summary of Changes

| File | Change |
|------|--------|
| `src/assets/magazine-cover.jpg` | Copy uploaded image |
| `src/data/magazinePages.ts` | Add cover page as index 0, add `image` field to 6 pages |
| `src/pages/MagazineInside.tsx` | Cover page render, images, fix auth gate |
| `src/pages/Accepted.tsx` | Add doctrine link, fix dynamic button text |
| `src/pages/Engine.tsx` | Auto-redirect to /choose-cohort post-payment |
