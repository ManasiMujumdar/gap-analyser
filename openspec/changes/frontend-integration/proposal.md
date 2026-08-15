## Why

The `resume-gap-analysis` backend is fully implemented and verified end-to-end, and four UI screens have been designed in Google Stitch and exported as static HTML/Tailwind mockups — but the two aren't connected. The backend exposes only TypeScript service functions (no HTTP layer), and the Stitch screens are static mockups full of placeholder data ("TechNova Solutions", "78% Overall Match", fabricated skills). Neither is usable on its own. This change turns both into one real, deployed, live application — the actual deliverable this whole project has been building toward, and the piece that makes it a working portfolio item rather than a backend repo and a design file.

## What Changes

- New Next.js (App Router, TypeScript) application that hosts both the frontend and an API layer wrapping the existing backend service functions — one deployable project rather than two separately-hosted services.
- New API routes wrapping each backend capability: submit JD + resume, get current gap state, get version timeline, get suggestion history, submit a new resume version. These routes call the existing `src/services/*` functions directly — no backend business logic is reimplemented or altered.
- A real Tailwind config extracted from the shared design tokens across the four Stitch exports (colors, fonts, spacing, radius), replacing CDN Tailwind with a proper build-time setup.
- Four pages rebuilt from the Stitch HTML as real components bound to live data: Start/Upload, Gap Report (main dashboard), Suggestions panel (slide-over from a gap card), and Version Timeline.
- Navigation between the four screens, with the analysis ID carried in the URL as the source of truth for which analysis is being viewed (no accounts/login — see design.md for the single-user navigation approach).
- Deployment to Vercel's free tier, connected to the same Supabase Postgres and Gemini API already configured for the backend.

**Non-goals** (explicitly out of scope, noted so this doesn't block future decisions):
- Auth/accounts — continues the backend's single-candidate scope.
- A "browse all past analyses" list view — the backend has no query for this; each analysis is accessed directly by ID.
- Mobile native app — responsive web only.
- Editing or deleting suggestions/analyses after creation.
- Offline support or dark mode (Stitch designed a light theme only).
- Any change to backend business logic (gap scoring, taxonomy matching, suggestion generation) — this change is purely an HTTP + UI layer on top of what already exists and is tested.

## Capabilities

### New Capabilities
- `api-layer`: HTTP routes exposing the backend's intake, gap-analysis, suggestion, versioning, and dashboard service functions to the frontend.
- `intake-screen`: the Start/Upload page's behavior — submitting a new JD + resume, or a new resume version against an existing analysis.
- `gap-report-screen`: the main dashboard page's behavior — displaying current gap state for an analysis.
- `suggestions-panel`: the per-skill suggestions detail view's behavior — displaying the three suggestion types for a gapped skill.
- `timeline-screen`: the version timeline page's behavior — displaying resume version history with deltas.

### Modified Capabilities
(none — the backend's capabilities and their specs are unchanged by this UI/API layer)

## Impact

- New code: a Next.js application (new top-level directory), consuming the existing backend's `src/services/*` functions as a dependency rather than duplicating them.
- No changes to backend code, database schema, or LLM integration.
- New deployment target (Vercel free tier) in addition to the existing Supabase (DB) and Gemini (LLM) dependencies.
- The four Stitch-exported HTML files (`design/stitch-export/*.html`) are the visual reference for this change but are not themselves shipped — they get rebuilt as maintainable components.
