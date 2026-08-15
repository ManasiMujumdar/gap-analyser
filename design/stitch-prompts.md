# Google Stitch prompts — Resume Gap Analysis dashboard

Prompts for [Google Stitch](https://stitch.withgoogle.com) to design the UI for the `resume-gap-analysis` core loop. Paste Prompt 1 first to establish the app and its main screen, then use the follow-up prompts to add the other screens to the same Stitch project so they share a consistent design system.

Every prompt below is grounded in the actual data the backend returns (see the **Data reference** section at the bottom) so the eventual integration work — wiring these screens to `src/services/dashboard.ts` etc. — maps cleanly instead of needing rework.

---

## Prompt 1 — Establish the app + main Dashboard screen

```
Design a calm, focused web dashboard for a personal tool called "Gap Check" that helps one job candidate see the honest gap between their resume and a specific job description, and what to do about it. This is a persistent dashboard the candidate returns to repeatedly over days or weeks while preparing for one interview - not a linear wizard or onboarding flow. The tone should be supportive and matter-of-fact, never alarming or punitive - a skill gap is framed as "here's what to work on," not "you failed."

Visual style: clean, professional, generous whitespace, a single calm accent color (avoid aggressive red/alarm colors for gaps - use a muted amber/blue scale instead of red for severity). Should feel more like a thoughtful coaching tool than a corporate SaaS dashboard.

Main screen: "Gap Report" - the primary view when the candidate opens the app for an existing analysis.

Layout:
- Header: the job title/company (derived from the JD) and a small "Resume v2 of 2" style version indicator.
- A list of skill cards, one per required skill from the job description. Each card shows:
  - The skill name (e.g. "Distributed Systems Design")
  - Two small side-by-side depth badges on a 4-step scale (Aware -> Used -> Owned -> Led): one labeled "Job wants" and one labeled "Your resume shows". Design this as a compact horizontal stepper/progress element, not just text, so the gap is visually obvious at a glance.
  - If there's a gap (resume depth below job-wants depth), a subtle badge showing the gap size and a "View suggestions" button/expand affordance.
  - If there's no gap, a quiet checkmark/"on track" state - no call to action, minimal visual weight, so attention naturally goes to the actual gaps.
  - Each depth badge is backed by a citation (an exact quote from the JD or resume) - show this as a small expandable "why" quote on hover/click, not always visible, to keep the card scannable.
- A persistent sidebar or top-tab area with two more sections we'll design next: "Resume Versions" (timeline) and "Upload" (add a new resume version). Just stub these as nav items for now.

Generate this as the primary screen of a multi-screen web app.
```

---

## Prompt 2 — Upload screen

```
Add a second screen to this app called "Start" / "Add Resume Version" - the entry point for either starting a brand-new analysis (job description + first resume) or adding a new resume version to an existing analysis.

Two states of this screen:
1. New analysis: two large text areas (or file-drop zones) side by side - "Paste the job description" and "Paste your resume" - with a single primary action button "Analyze". Keep it minimal - this should feel like a two-field form, not a multi-step wizard.
2. Existing analysis (adding a version): the job description is already shown collapsed/read-only at the top (since it doesn't change), with just one text area - "Paste your updated resume" - and a button "Check my progress" instead of "Analyze", to reinforce that this is a re-check, not starting over.

Match the calm, supportive visual style from the main Gap Report screen - same accent color, same generous whitespace. Include a brief one-line explainer under the button: "We'll compare this against what the job actually asks for, with sources cited so you can trust the result."
```

---

## Prompt 3 — Suggestions panel (per-skill gap detail)

```
Add a detail view that opens when a candidate clicks "View suggestions" on a gapped skill card from the Gap Report screen - either as a slide-over panel or an expanded in-place section, your choice of whichever fits the design system better.

Header: the skill name, and the two depth badges from the card (Job wants / Your resume shows) repeated for context.

Below that, three distinct suggestion types, shown as three clearly separated cards or tabs (not a single wall of text) - because these are three different kinds of action with very different effort levels, and that difference should be visually obvious:

1. "Rewrite your resume" - a smaller, quick-win styled card. Shows the proposed rewritten bullet/phrase text. Include a small "copy" icon/action.
2. "Build something to show it" - a medium-effort styled card (visually distinct from the quick-win one - maybe a different accent weight or a small "takes time" indicator). Shows a description of a scoped project or experience to pursue.
3. "How to talk about it in the interview" - shown as a 4-step mini-timeline or numbered card sequence: Situation, Task, Action, Result - since this is a STAR-format story scaffold the candidate can adapt and rehearse.

Keep the visual hierarchy clear: card 1 (rewrite) reads as "do this now", card 2 (build) reads as "do this if you have time", card 3 (narrative) reads as "always useful, rehearse this".
```

---

## Prompt 4 — Version timeline

```
Add a "Resume Versions" screen/tab showing the history of resumes submitted for this analysis, as a vertical timeline (oldest at top or bottom - your call, but be consistent with version numbering).

Each entry in the timeline represents one resume version and shows:
- "Version 1", "Version 2", etc., with a timestamp
- For every version after the first, a compact delta summary comparing it to the version before: counts of skills in each of five states - "Closed" (gap fixed), "Improved" (gap narrowed), "No change", "Got worse" (gap widened), "New gap appeared" - shown as small colored count chips, not a wall of text (green-ish for closed/improved, neutral for no change, muted amber for worse/new - staying consistent with the calm, non-alarming palette from the main screen).
- Clicking a version expands to show that version's full skill list and suggestions as they were at that point in time (reuse the Gap Report skill-card design from Prompt 1, in a read-only/historical styling - slightly muted/archived look to distinguish from the live current view).

The first version has no delta summary (nothing to compare against) - just show it as the starting point of the timeline.
```

---

## Data reference (for later integration)

These are the actual field names/shapes the backend (`src/services/dashboard.ts`, `gapAnalysis.ts`, `suggestions.ts`, `versioning.ts`) returns — use these when wiring the Stitch-generated screens to real data, so the UI doesn't need reshaping later.

**Depth levels** (ordinal, low to high): `aware` < `used` < `owned` < `led`

**Gap Report screen** ← `getCurrentGapState(analysisId)`
```ts
{
  latestVersion: { id, versionNumber, resumeText, createdAt },
  gapScores: [{
    skillId, canonicalName,          // skill name for the card
    jdDepth, jdCitation,             // "Job wants" badge + its citation
    resumeDepth, resumeCitation,     // "Your resume shows" badge + citation (both null if no evidence)
    gapSize,                         // 0 = no gap (quiet checkmark state)
  }]
}
```

**Suggestions panel** ← `getSuggestionHistory(resumeVersionId)`
```ts
[{
  skillId, canonicalName,
  type,       // "resume_rewrite" | "portfolio_addition" | "talking_point_narrative"
  content,    // plain string for the first two; for talking_point_narrative,
              // a JSON string: { situation, task, action, result }
}]
```

**Version timeline** ← `getVersionTimeline(analysisId)`
```ts
[{
  version: { id, versionNumber, resumeText, createdAt },
  deltaFromPrevious: null | [{
    skillId, canonicalName,
    previousGapSize, currentGapSize,
    category,   // "gap_closed" | "gap_narrowed" | "gap_unchanged" | "gap_widened" | "new_gap"
  }],
}]
```
(`deltaFromPrevious` is `null` only for the first version in the list.)
