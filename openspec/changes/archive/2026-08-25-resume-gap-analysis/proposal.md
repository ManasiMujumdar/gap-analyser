## Why

Pasting a job description and resume into a generic LLM chat produces a one-shot, forgettable answer: no memory of what was already tried, no way to see whether a resume edit actually closed a gap, and no evidence trail for why a gap was flagged. Candidates preparing for a specific role need a persistent workspace that scores *depth* of fit against a job description (not just keyword overlap), tells them concretely what to change, and lets them track whether their edits are working — across multiple resume iterations, over multiple sessions.

## What Changes

- New intake flow: upload a Job Description and a Resume as the starting point for an analysis.
- New depth-based gap analysis: for each skill/competency the JD requires, score the depth implied by the JD against the depth the resume's evidence actually demonstrates, using a 4-level rubric (Aware → Used → Owned → Led). Every score is backed by a cited quote/phrase from both the JD and the resume — no un-sourced scores.
- New skill normalization: skill/competency names are matched against a personal, growing taxonomy (no predefined list) so the same underlying skill is recognized consistently across resume versions, even when JD/resume wording varies.
- New improvement suggestions: each identified gap produces three distinct suggestion types — a resume rewrite (evidence exists but is under-told), a portfolio addition (evidence doesn't exist yet), and a talking-point narrative (a STAR-shaped story scaffold for verbal delivery) — rather than one generic tip.
- New resume versioning: a candidate can upload a new resume version after acting on suggestions; the system re-runs gap analysis and shows a delta against the previous version (gaps closed, gaps remaining, new gaps).
- New persistent dashboard: a status/timeline view (not a linear wizard) showing current gap state, suggestion history, and the resume version timeline, so the candidate can revisit progress across sessions. This proposal defines the underlying data and requirements the dashboard must expose; visual design is handled separately.

**Non-goals for this change** (explicitly deferred, noted so this design doesn't block them later):
- Mock interview question generation and answer scoring against the rubric.
- Post-interview retro capture (candidate self-reflection after a real interview).
- A cross-JD "weak-spot ledger" carrying retro feedback forward to the next job application.
- Interview-date-driven "last-minute" reprioritization of suggestions.
- Years-of-experience gap detection — the candidate self-identifies these; this system only scores depth of demonstrated skill.
- Multi-candidate/multi-tenant support — single candidate for now.

## Capabilities

### New Capabilities
- `jd-resume-intake`: Accepting a job description and resume as input and extracting structured, per-skill requirements (JD) and evidence (resume) for downstream analysis.
- `skill-gap-analysis`: Scoring each JD-required skill against resume evidence on the Aware/Used/Owned/Led rubric, with cited evidence, using the growing taxonomy to normalize skill identity across analyses.
- `improvement-suggestions`: Generating the three suggestion types (resume rewrite, portfolio addition, talking-point narrative) for each gap identified by skill-gap-analysis.
- `resume-version-tracking`: Accepting a new resume version for an existing analysis, re-scoring gaps, and producing a delta view against the prior version.
- `application-dashboard`: Presenting persistent, cross-session status of the current analysis — gap state, suggestion history, and resume version timeline.

### Modified Capabilities
(none — greenfield project, no existing specs)

## Impact

- New system: no existing code or specs affected.
- Introduces a dependency on an LLM for JD/resume parsing, rubric scoring, evidence citation, taxonomy matching, and suggestion generation.
- Introduces persistent storage for: analyses, per-skill taxonomy entries, resume versions, gap scores with evidence, and suggestions — needed for versioning and delta views to work.
- UI is out of scope for implementation here (screens to be designed in Google Stitch separately) but this change must expose the data/state the dashboard needs.
