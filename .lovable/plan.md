

# Redesign Intake Funnel to Match Reference

## Overview
Upgrade the `/intake-funnel` page to match the full reference funnel flow shown in the Guardian Insulation example, adapted for the PFSW brand. This involves adding a landing page, improving the quiz UI, upgrading the lead capture screen, and building a much richer results page.

## Changes (all in `src/pages/IntakeFunnel.tsx`)

### 1. Add Landing Phase
- New `"landing"` phase before the quiz begins
- PFSW brand header centered at top
- Pre-headline: "ARE YOU LEAVING MONEY ON THE TABLE?"
- Main headline: "Are You Building Your Clients' Funnels The Hard Way?"
- Subtext: "Answer 6 quick questions. Get your Funnel Efficiency Score in under 2 minutes."
- Large CTA button: "TAKE THE FREE QUIZ NOW"
- Trust line: "Trusted by 50+ agency owners"

### 2. Persistent Brand Header
- "PFSW" brand name centered at the top of every phase (quiz, capture, results) -- matching how "Guardian Insulation" appears on every screen in the reference

### 3. Improved Progress Bar
- Add "X steps remaining" text on the left and percentage on the right, above the progress bar
- Matches the reference layout exactly

### 4. Multi-Select Question Support
- Add a `multiSelect` flag to the quiz question type
- Multi-select questions show checkboxes instead of radio-style buttons
- A "Continue" button appears below the options (user picks multiple then advances)
- Add optional `hint` text below options (small italic helper text like "A healthy attic means healthier air...")

### 5. Enhanced Lead Capture Phase
- Headline: "Almost there! Where should we send your results?"
- Subtitle: "Enter your details below to receive your personalized Funnel Efficiency Score."
- Bold field labels: "Full Name", "Email Address", "Phone Number"
- Privacy notice with lock icon: "Your information is secure and will never be shared with third parties."
- CTA button: "Get My Funnel Score" (styled prominently in primary color)
- "Go Back" link below the button

### 6. Rich Results Page
- Personalized greeting: "Thank You, [Name]!" with emoji accents
- Subtitle: "Your Funnel Efficiency Assessment is complete"
- Score card with dark background containing:
  - Gauge/arc visualization (already exists, will be enhanced)
  - Tier label and description on the right side
  - Urgency banner at bottom of card (e.g., "Immediate Action Recommended")
- "Why Your Score Is X" section with answer-based insight cards (left-bordered colored cards with icon, bold title, and description)
- Primary CTA: "Apply to Join the Collective"
- Secondary recommendations section preserved

### 7. No New Files or Dependencies
Everything stays in the single `IntakeFunnel.tsx` file. No database changes. No new packages needed.

## Technical Details

**Phase state type change:**
```text
"landing" | "quiz" | "capture" | "result"
```
Initial phase set to `"landing"`.

**QuizQuestion interface update:**
```text
interface QuizQuestion {
  question: string;
  options: QuizOption[];
  multiSelect?: boolean;
  hint?: string;
}
```

**Progress calculation update:**
- Steps remaining = totalQuestions - answeredCount
- Percentage displayed as text alongside the bar

**Results score card:**
- Horizontal layout: gauge on left, tier info on right
- Dark card background (using secondary/card colors)
- Alert-style banner below the score

**"Why Your Score" section:**
- 2-3 dynamic insight cards based on which answers scored lowest
- Each card has a colored left border, icon, bold title, and explanation text

