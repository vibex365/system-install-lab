
## Add "Create Your Lovable Account" CTA Card to the Engine Dashboard

### Goal
Insert a compact affiliate CTA card into the Engine dashboard's left panel — directly below the Sessions card — so members who don't yet have a Lovable account can sign up via your affiliate link (`https://lovable.dev/invite/8HW4GFV`).

---

### What Gets Added

A new card in the left column of the Engine page (`/engine`), positioned after the Sessions card and before the right panel begins.

The card will contain:
- A small "New to Lovable?" label in gold
- One-line description: "Every prompt here is Lovable-ready. No account yet? Create one free — it takes 60 seconds."
- A gold external link: "Create Your Lovable Account →" pointing to `https://lovable.dev/invite/8HW4GFV`
- An `ExternalLink` icon from lucide-react (already available in the project)

---

### Technical Details

**File changed:** `src/pages/Engine.tsx` only

**Changes:**
1. Add `ExternalLink` to the existing lucide-react import on line 18
2. Add a `LOVABLE_AFFILIATE_URL` constant at the top of the file (easy to update later)
3. Insert the new card JSX after the closing `</Card>` tag of the Sessions card (after line 923), before `</div>` closing the left panel (line 924)

```
const LOVABLE_AFFILIATE_URL = "https://lovable.dev/invite/8HW4GFV";
```

```tsx
{/* ── Lovable CTA ── */}
<Card className="bg-card border border-primary/30">
  <CardContent className="p-4 space-y-3">
    <p className="text-xs font-semibold text-primary tracking-wide uppercase">
      New to Lovable?
    </p>
    <p className="text-xs text-muted-foreground leading-relaxed">
      Every prompt generated here is Lovable-ready. No account yet? Create one free — it takes 60 seconds.
    </p>
    <a
      href={LOVABLE_AFFILIATE_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
    >
      Create Your Lovable Account
      <ExternalLink className="h-3 w-3" />
    </a>
  </CardContent>
</Card>
```

---

### Why Only One File

The affiliate link is scoped to the Engine dashboard only, as discussed. It lives in one constant so you can swap it in seconds if your link changes. No new components, no new files — clean and minimal.
