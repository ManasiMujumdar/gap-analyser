# resume-gap-analysis backend

Implements the `resume-gap-analysis` OpenSpec change: core-loop backend for uploading a job description + resume, scoring depth gaps per skill (Aware/Used/Owned/Led rubric with evidence citations), generating three-way improvement suggestions, tracking resume versions, and serving dashboard queries. See `openspec/changes/resume-gap-analysis/` for the full proposal/design/specs.

This is a library of TypeScript service functions (`src/services/*`), not yet wired to an HTTP layer — that's expected to happen alongside the UI integration (Google Stitch screens), per the proposal's non-goals.

## Setup

1. **Create a free Postgres database** on [Supabase](https://supabase.com) or [Neon](https://neon.tech) (design.md Decision #5 — chosen for free-tier persistence on serverless hosting). Either works; grab the connection string.
2. Copy `.env.example` to `.env` and fill in:
   - `DATABASE_URL` — the connection string from step 1. If your host only exposes an IPv6 direct-connection hostname (Supabase does by default), use its connection **pooler** string instead - it's IPv4-reachable.
   - `GEMINI_API_KEY` — a free Google Gemini API key from [aistudio.google.com/apikey](https://aistudio.google.com/apikey) (no credit card required). Used for extraction, scoring, taxonomy matching, and suggestion generation.
3. Install dependencies: `npm install`
4. Run migrations against your database: `npm run db:migrate`

## Commands

- `npm test` — runs the unit/service test suite (34 tests, no live DB/LLM required — dependencies are mocked)
- `npm run e2e` — runs the full core-loop walkthrough (`scripts/e2e-walkthrough.ts`) against your **real** database and Gemini account: submits a sample JD + resume, reviews the gap state and suggestions, submits a second resume version, verifies the delta view, and validates that every stored citation is a real substring of its source document (tasks 8.1/8.2). Uses Gemini's free tier, so this should cost nothing.
- `npm run build` — type-checks and compiles to `dist/`
- `npm run db:generate` — regenerates migrations after a schema change in `src/db/schema.ts`

## Structure

- `src/db/` — Drizzle schema and Postgres client
- `src/llm/` — Gemini client wrapper (JSON-mode structured output, citation-retry) and the extraction/scoring/matching/suggestion prompts. Provider is swappable by design - see the comment on `callStructured` in `client.ts`.
- `src/lib/` — pure logic: depth-rubric ordinal math, citation validation, delta categorization
- `src/services/` — the five capabilities from the OpenSpec change: `intake`, `taxonomy` + `gapAnalysis` (skill-gap-analysis), `suggestions` (improvement-suggestions), `versioning` (resume-version-tracking), `dashboard` (application-dashboard)
