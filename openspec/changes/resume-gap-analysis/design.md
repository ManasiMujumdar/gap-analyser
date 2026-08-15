## Context

Greenfield system — see proposal.md for motivation and scope. This is a single-candidate tool, intended to be hosted (on free-tier infrastructure) so it functions as a live, link-able project — no multi-tenancy/accounts needed since there's exactly one user. The core loop must support repeated visits over days/weeks: a candidate uploads a JD once, then returns multiple times with new resume versions, so state must persist across sessions rather than living only in a single request/response.

## Goals / Non-Goals

**Goals:**
- Define how skill depth is scored and how that scoring stays consistent and auditable (evidence-backed) across repeated runs.
- Define how skill identity stays stable across resume versions and future analyses (the growing taxonomy) without upfront taxonomy design.
- Define the data model needed to support versioning, delta views, and a persistent dashboard.

**Non-Goals:**
- Visual/UI design (handled separately in Google Stitch) — this design only defines the data/state the UI reads.
- Multi-analysis correlation (cross-JD ledger, retro) — deferred per proposal.md non-goals.
- Choice of specific LLM provider/model version — treated as a swappable implementation detail, not a design constraint.

## Decisions

### 1. Depth rubric: Aware → Used → Owned → Led, with mandatory evidence citation
Each JD-required skill gets two scores on the same 4-level scale: the depth the JD *implies* it wants (inferred from phrasing — e.g., "led migration to X" implies Led; "familiarity with X" implies Aware), and the depth the resume *evidence* demonstrates. The gap is the difference between the two.

Every score — JD-side and resume-side — must be accompanied by the exact quote/phrase from the source document that justifies it. A score with no citation is not accepted; this is the mechanism that makes the tool auditable and trustworthy versus a black-box LLM answer, and it's what lets progress tracking mean something concrete ("this citation changed" rather than "the LLM said a different number").

*Alternative considered*: a numeric 1-10 skill-match score. Rejected — a bare number invites false precision and gives no traceability; the candidate can't tell *why* they scored what they did or *what specifically* to fix.

### 2. Growing taxonomy for skill normalization
No predefined skill list. When a skill is extracted from a JD or resume, it's matched against existing taxonomy entries (via LLM-assisted semantic comparison); if no existing entry is a close enough match, a new canonical entry is created. This is what keeps "Distributed Systems Design" recognized as the same skill across resume v1, v2, and v3, even if each document phrases it differently, without requiring the taxonomy to be designed upfront.

*Alternative considered*: fixed taxonomy (predefined list). Rejected for now — requires upfront design effort disproportionate to a single-candidate tool and would need ongoing maintenance as new skills appear in JDs. *Alternative considered*: pure fuzzy match at query time with no persisted canonical entries. Rejected — labels would drift run to run, breaking delta comparisons across resume versions, which is a core requirement (proposal.md).

### 3. Three-way suggestions are generated per-gap, not per-analysis
For every skill where a gap exists (resume depth < JD-implied depth), generate all three suggestion types (resume rewrite, portfolio addition, talking-point narrative) rather than picking one. The candidate decides which is actionable for them; the system doesn't guess. Suggestions are regenerated (not edited in place) each time a new resume version is analyzed, since the underlying evidence may have changed.

### 4. Data model
Core entities:
- **Analysis**: one JD + its extracted per-skill requirements (skill → JD-implied depth + citation). Created once at intake.
- **Skill (taxonomy entry)**: canonical name, created/reused via the growing-taxonomy matching process. Shared across all resume versions within an Analysis (and, structurally, reusable by future analyses even though cross-analysis correlation is out of scope for this change).
- **ResumeVersion**: one uploaded resume, ordered (v1, v2, …) within an Analysis, with its extracted per-skill evidence (skill → depth + citation).
- **GapScore**: computed per (ResumeVersion × Skill) — JD-implied depth, resume-evidence depth, gap size. This is what gets diffed between versions to produce the delta/progress view.
- **Suggestion**: per (ResumeVersion × Skill) where a gap exists — one record per suggestion type (rewrite / portfolio / narrative).

This shape is what makes `resume-version-tracking`'s delta view a straightforward comparison (GapScores for version N vs. N-1, keyed by Skill) rather than a fresh LLM comparison each time — the rubric score is the stable unit being diffed, not raw text.

### 5. Persistence: hosted Postgres, free tier (Supabase or Neon)
Given the tool will be hosted on free-tier serverless compute (Vercel/Netlify/Cloudflare-style platforms), which have ephemeral filesystems, a local file-based store like SQLite would not reliably survive redeploys or cold restarts. A free-tier hosted Postgres (Supabase or Neon) gives genuine persistence without managing a disk, and fits a serverless deployment shape. Still single-candidate scope — this is a storage-engine swap, not a move to multi-tenancy. Structured (not flat files) because delta computation and the dashboard's timeline view both need to query/filter/sort across versions and skills.

*Alternative considered*: local SQLite. Rejected once hosting (rather than local-only use) was confirmed — free serverless compute doesn't guarantee disk persistence. *Alternative considered*: a self-managed database on a persistent-disk host. Rejected — harder to find genuinely free and reliable than a managed free-tier Postgres.

### 6. LLM calls use structured (schema-constrained) output
Parsing, rubric scoring, taxonomy matching, and suggestion generation should all request structured JSON output matching a defined schema, rather than freeform text — this is what makes evidence citations, depth levels, and skill IDs reliably extractable and storable rather than needing further parsing/interpretation downstream.

## Risks / Trade-offs

- **[Risk]** LLM scoring may be non-deterministic — the same resume could score slightly differently across runs, making deltas noisy. → **Mitigation**: low/zero temperature for scoring calls; the mandatory evidence citation constrains the model to ground scores in specific text rather than free-associating, which reduces variance in practice.
- **[Risk]** LLM could hallucinate a citation that doesn't actually appear in the source document. → **Mitigation**: validate each citation as an actual substring (exact or near-exact match) of the source JD/resume text before accepting a score; reject and retry if not found.
- **[Risk]** Growing taxonomy could still fragment (near-duplicate entries created instead of matched) or over-merge (distinct skills collapsed together). → **Mitigation**: acceptable at single-candidate scale where the taxonomy stays small (tens of entries, not thousands); revisit matching threshold if it becomes a problem. Not a blocker for this change.
- **[Risk]** Resume/JD parsing quality depends on document formatting (PDFs, unusual layouts). → **Mitigation**: out of scope to solve robustly in this change; assume reasonably well-formatted text input, revisit if parsing failures are common in practice.
- **[Risk]** Free-tier hosted Postgres (Supabase/Neon) may pause or throttle after inactivity, or cap storage/compute below paid tiers. → **Mitigation**: acceptable at single-user, low-frequency usage; Analysis/ResumeVersion data volume stays small (tens of records), well within free-tier limits.

## Migration Plan

Greenfield — no existing data to migrate. First run creates an empty taxonomy that grows organically as analyses are performed.

## Open Questions

- Exact similarity threshold/method for taxonomy matching (e.g., embedding cosine similarity cutoff vs. LLM judgment call) — tunable during implementation without affecting the spec-level behavior (a skill either matches an existing entry or creates a new one).
- Specific LLM provider/model — swappable implementation detail, doesn't affect specs or task breakdown. Implemented with Google Gemini (free tier, `gemini-flash-latest` alias by default to avoid pinned-model deprecation churn) rather than a paid provider, since this is a single-candidate hobby project and free-tier usage comfortably covers it; the LLM call boundary (`callStructured`) is provider-agnostic so this can change without touching extraction/scoring/matching/suggestion logic.
