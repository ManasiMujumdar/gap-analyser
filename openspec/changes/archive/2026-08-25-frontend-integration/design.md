## Context

See proposal.md for motivation. Current state: `backend/` (a standalone npm package, TypeScript, ESM) has five fully-implemented, tested service modules (`intake`, `gapAnalysis`, `suggestions`, `versioning`, `dashboard` under `src/services/`) with no HTTP layer. `design/stitch-export/` has four static HTML files, each a complete standalone document (its own `<html>`/`<head>`/inline Tailwind config), sharing one identical design token set (verified: same color/font/spacing/radius values across all four `tailwind.config` blocks) but with no shared component structure and hardcoded placeholder data.

This is a personal, single-candidate tool being built as a Product Management portfolio piece (see proposal.md), not a production SaaS. That context shapes several decisions below toward minimizing ongoing maintenance surface and deployment fragility over architectural completeness.

## Goals / Non-Goals

**Goals:**
- Reuse the backend's existing, already-verified service functions as-is — this change adds a transport layer (HTTP) and a UI layer, not new business logic.
- Preserve the Stitch-designed visual language (colors, spacing, card layouts, iconography) as closely as practical while replacing static/placeholder content with live data.
- Keep the deployed system to a single Vercel project, minimizing the number of independently-failing pieces an interviewer's click-through depends on.

**Non-Goals:**
- State-management library, client-side data cache layer, or other complexity beyond what four simple pages need — see Decision 5.
- Pixel-perfect fidelity to the Stitch HTML where it conflicts with making the screen actually work (e.g., the suggestions panel's slide-over is hardcoded "open" in the static export; this design makes it a real open/close interaction bound to a specific skill).

## Decisions

### 1. Monorepo via npm workspaces, not a duplicated or separately-deployed backend
The Next.js app (`frontend/`) and the existing `backend/` become sibling packages under a root-level `package.json` declaring `"workspaces": ["backend", "frontend"]`. `frontend`'s API routes import backend service functions directly as a workspace dependency (e.g. `import { createAnalysis } from "backend/services/intake"`), rather than reimplementing them or calling out to a separately-hosted backend service.

*Alternative considered*: deploy `backend/` as its own hosted service (e.g. a separate Vercel/Render deployment) with the Next.js app calling it over HTTP. Rejected — this is exactly the two-independently-breakable-services problem the proposal's "Why" flags as a portfolio-reliability risk, for no benefit at this scale (single user, low traffic).
*Alternative considered*: copy the service files into the Next.js project. Rejected — creates drift between two copies of the same logic; workspace dependency keeps one source of truth.

Vercel has native npm-workspace monorepo support (build root directory set to `frontend/`, workspace dependencies bundled automatically), so this doesn't complicate deployment.

### 2. Analysis identity without auth: ID-in-URL + localStorage convenience redirect
Every screen route includes the analysis ID (e.g. `/dashboard/[analysisId]`, `/timeline/[analysisId]`). The ID is the actual source of truth — any URL is shareable/bookmarkable and works standalone. On landing at the app root with no ID in the URL, the app checks `localStorage` for the most recently created/viewed analysis ID and redirects there if present, otherwise routes to the Start/Upload screen. This is a UX convenience only, never an authorization check — there is no concept of "whose" analysis it is, consistent with the backend's single-candidate scope (resume-gap-analysis/design.md).

*Alternative considered*: a real session/auth system. Rejected — out of scope per both changes' non-goals; would add real maintenance surface (secrets, session storage) for a single-user tool.

### 3. Tailwind config extracted once, shared across all pages
The identical design-token block found in all four Stitch exports (colors like `gap-high`/`gap-mid`/`success-muted`, Public Sans font family, custom spacing/radius scale) becomes `frontend/tailwind.config.ts`, compiled at build time rather than loaded from the Tailwind CDN `<script>` the Stitch exports use. Material Symbols and Public Sans are loaded the same way Stitch already set up (Google Fonts links), kept as-is.

### 4. Suggestion content parsed server-side, not left as a raw string
`suggestions.content` is stored as plain text for `resume_rewrite`/`portfolio_addition` but as a JSON string for `talking_point_narrative` (`{situation, task, action, result}}`, per resume-gap-analysis/design.md). The `api-layer`'s suggestions route parses this JSON server-side before responding, so the frontend always receives a typed, already-structured shape and never re-parses JSON embedded in a string.

### 5. No client-side state management library
Four pages, each reading data via a `fetch` to its own API route (Next.js Server Components / route handlers) with ordinary React state for the one genuinely interactive piece (the suggestions slide-over's open/closed state and which skill it's showing). No Redux/Zustand/React Query. Justified directly by the PM-portfolio context in proposal.md: fewer dependencies, less to break, less to explain in a case study, and the actual data-fetching needs here are simple (four read endpoints, two write endpoints, no complex client cache invalidation).

## Risks / Trade-offs

- **[Risk]** Free-tier Vercel + Supabase + Gemini each have cold starts / rate limits, which could make a live demo feel slow to an interviewer clicking through it. → **Mitigation**: acceptable at this traffic level; add simple loading states (skeleton/spinner) to each screen so a cold-start delay reads as intentional UX, not a broken app.
- **[Risk]** Translating the suggestions panel from Stitch's hardcoded "always open" mockup into a real click-to-open interaction bound to a specific skill's actual data is real UI logic, not a copy-paste of the HTML. → **Mitigation**: called out explicitly as its own task group, not folded silently into "build the screen."
- **[Risk]** The version timeline's historical/expanded view must show *that specific past version's* gap scores and suggestions (via its own `resumeVersionId`), not just re-render the current dashboard's data. → **Mitigation**: `api-layer`'s routes accept an explicit `resumeVersionId` for gap-score/suggestion lookups (matching `getGapScoresForVersion`/`getSuggestionsForVersion`'s existing per-version signature), not just "latest."
- **[Risk]** Misconfigured monorepo build settings on Vercel (wrong root directory) could cause a deploy failure. → **Mitigation**: task list includes explicitly verifying a successful Vercel deploy before considering the change done, not just a local build.

## Migration Plan

Greenfield addition — no existing deployed frontend to migrate from or data to migrate. Deploy as a new Vercel project pointed at the same Supabase Postgres and Gemini API credentials already configured for the backend.

## Open Questions

- Whether to add response caching/revalidation on the read-only dashboard routes — an implementation-time tuning detail, doesn't change the API shape or specs.
- Exact Vercel project settings (root directory, ignored build step for the `backend` workspace) — operational configuration, not spec-affecting.
