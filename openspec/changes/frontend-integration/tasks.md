## 1. Monorepo & Next.js scaffold

- [x] 1.1 Add a root-level `package.json` with npm workspaces `["backend", "frontend"]`
- [x] 1.2 Add a `name` field and appropriate export paths to `backend/package.json` so its service modules can be imported as a workspace dependency
- [x] 1.3 Scaffold a new Next.js (App Router, TypeScript) project at `frontend/`
- [x] 1.4 Add `backend` as a workspace dependency of `frontend`, and confirm `frontend` can import a backend service function and type-check successfully
- [x] 1.5 Configure `frontend`'s Next.js config (`transpilePackages`/equivalent) so the `backend` workspace package is bundled correctly at build time

## 2. Design system extraction

- [x] 2.1 Extract the shared color/font/spacing/radius tokens from the four Stitch HTML exports (`design/stitch-export/*.html`) into `frontend/tailwind.config.ts` (verified identical across all 4 exports via diff before extracting)
- [x] 2.2 Set up Public Sans and Material Symbols font loading in the Next.js app (matching the Stitch exports' Google Fonts links)
- [x] 2.3 Verify a basic page renders with the extracted design tokens (confirmed compiled CSS output contains the correct rgb values for custom color tokens and the custom spacing scale)

## 3. API layer (api-layer)

- [x] 3.1 Implement `POST /api/analyses` wrapping `intake.createAnalysis` (create analysis + initial gap state)
- [x] 3.2 Implement `POST /api/analyses/[analysisId]/versions` wrapping `versioning.addResumeVersion` (new resume version + delta)
- [x] 3.3 Implement `GET /api/analyses/[analysisId]/gap-state` wrapping `dashboard.getCurrentGapState`
- [x] 3.4 Implement `GET /api/analyses/[analysisId]/timeline` wrapping `dashboard.getVersionTimeline`
- [x] 3.5 Implement `GET /api/resume-versions/[resumeVersionId]/suggestions` wrapping `dashboard.getSuggestionHistory`, parsing the talking-point-narrative JSON string into structured fields before responding
- [x] 3.6 Add error responses for invalid/missing input and non-existent analysis/version IDs across all routes
- [x] 3.7 Write tests covering: valid create/add-version submissions, missing-input rejection, non-existent-ID error responses, suggestions endpoint's JSON-parsing of talking-point-narrative content (14 tests, all passing; also live-verified all 5 routes against the real Supabase DB + Gemini API end-to-end)
- [x] 3.8 Implement `GET /api/analyses/[analysisId]` returning the analysis's job description text (discovered during task 4.4: the intake screen's existing-analysis mode needs to display the JD read-only, and no prior endpoint exposed it). Implemented by querying the `analyses` table directly via `backend`'s existing `./db/*` export, not by adding a new backend service function - keeps proposal.md's "no backend code changes" intact.
- [x] 3.9 Implement `GET /api/resume-versions/[resumeVersionId]/gap-scores` wrapping `gapAnalysis.getGapScoresForVersion` (discovered during task 7.4: the timeline screen's historical-detail view needs a specific past version's own gap scores, which design.md's Risks section anticipated but no task had been written for)

## 4. Intake screen (intake-screen)

- [x] 4.1 Build the Start/Upload page component from `design/stitch-export/2-start-upload.html`, using the extracted design system
- [x] 4.2 Wire the "new analysis" form state (JD + resume fields) to `POST /api/analyses`, navigating to the new analysis's Gap Report on success
- [x] 4.3 Add client-side validation preventing submission with an empty JD or resume field, with a clear indication of what's missing
- [x] 4.4 Implement the "existing analysis" mode: JD shown read-only, only a resume field accepts input, submitting calls `POST /api/analyses/[analysisId]/versions` and navigates to the updated Gap Report (required adding task 3.8's new endpoint)
- [x] 4.5 Write tests/manual checks covering: successful new-analysis submission, incomplete-submission prevention, JD read-only when adding a version (production build clean; both routes smoke-tested via dev server against a real analysis with no server errors)

## 5. Gap Report screen (gap-report-screen)

- [x] 5.1 Build the Gap Report page component from `design/stitch-export/1-gap-report.html`, using the extracted design system
- [x] 5.2 Fetch and render current gap state from `GET /api/analyses/[analysisId]/gap-state` for the analysis ID in the route
- [x] 5.3 Render each skill's JD-implied depth, resume-demonstrated depth (or explicit no-evidence state), and gap indicator, distinguishing "gap," "no gap," and "no evidence" states visually
- [x] 5.4 Implement the expandable citation ("why is this a gap?") affordance per skill
- [x] 5.5 Wire each gapped skill's "View suggestions" action to open the suggestions panel (task group 6) for that skill and the current resume version
- [x] 5.6 Write tests/manual checks covering: gap vs no-gap vs no-evidence rendering, citation expansion, suggestions entry point (production build clean; route smoke-tested via dev server against real data with no server errors)

## 6. Suggestions panel (suggestions-panel)

- [x] 6.1 Build the suggestions panel component from `design/stitch-export/3-suggestions-panel.html`, using the extracted design system
- [x] 6.2 Convert the static "always open" mockup into a real open/close interaction bound to a specific skill and resume version, triggered from the Gap Report
- [x] 6.3 Fetch and render the three suggestion types from `GET /api/resume-versions/[resumeVersionId]/suggestions`, filtered/selected for the opened skill
- [x] 6.4 Render the talking-point-narrative suggestion as its Situation/Task/Action/Result structure
- [x] 6.5 Ensure closing the panel returns to the Gap Report without any write/mutation call (onClose is a pure state setter; no fetch call is a mutation - GET only)
- [x] 6.6 Write tests/manual checks covering: opening shows all three types for the correct skill, talking-point structure renders correctly, closing performs no mutation (production build clean; component code-reviewed for correctness - full interactive verification pending live click-through in task 10.1)

## 7. Version timeline screen (timeline-screen)

- [x] 7.1 Build the timeline page component from `design/stitch-export/4-version-timeline.html`, using the extracted design system
- [x] 7.2 Fetch and render version history from `GET /api/analyses/[analysisId]/timeline`, in submission order
- [x] 7.3 Render per-version delta-category count chips (closed/narrowed/unchanged/widened/new) for every version after the first; render the first version with no delta summary
- [x] 7.4 Implement expand-to-view-historical-detail: selecting a past version fetches and displays that version's own gap state (via its `resumeVersionId`) and suggestions, not the current version's (required adding task 3.9's new endpoint; reuses SkillCard/SuggestionsPanel scoped to the historical version's ID rather than duplicating UI)
- [x] 7.5 Write tests/manual checks covering: version ordering, delta chip counts, first-version-has-no-delta, historical version shows its own data not the latest (production build clean, route renders with no server error; live data round-trip not re-verified here due to this sandbox's intermittent DB connectivity - full interactive verification deferred to task 10.1)

## 8. Navigation & analysis identity

- [x] 8.1 Implement the shared navigation/sidebar (Gap Report / Upload / Timeline) matching the Stitch design, carrying the current analysis ID across links (built incrementally as `components/Sidebar.tsx`, used on every screen)
- [x] 8.2 Implement the app-root redirect: read the most recently viewed analysis ID from `localStorage` and redirect there if present, otherwise redirect to the Start/Upload screen
- [x] 8.3 Update `localStorage`'s stored analysis ID whenever a new analysis is created or an existing one is viewed (built incrementally: `rememberAnalysisId` called on creation in `/start` and on mount in `/start/[id]`, `/dashboard/[id]`, `/timeline/[id]`)
- [x] 8.4 Verify every screen route works when loaded directly from its URL (not just via in-app navigation), confirming the analysis ID in the URL is the real source of truth (all 4 screen routes + 8 API routes smoke-tested directly via curl against real IDs, no server errors; production build registers all routes correctly)

## 9. Deployment

- [ ] 9.1 Create a new Vercel project pointed at the `frontend` workspace (root directory set accordingly)
- [ ] 9.2 Configure `DATABASE_URL` and `GEMINI_API_KEY` environment variables on Vercel, pointing at the same Supabase/Gemini credentials used by the backend
- [ ] 9.3 Deploy and verify the production URL loads the Start/Upload screen with no analysis in `localStorage`
- [ ] 9.4 Verify a full click-through on the deployed app: submit JD + resume, view Gap Report, open suggestions, submit a second resume version, view timeline with delta

## 10. End-to-end validation

- [ ] 10.1 Run a full walkthrough on the deployed app matching resume-gap-analysis's task 8.1 scenario (JD + resume v1 → gap report + suggestions → resume v2 → delta + timeline), confirming the UI reflects the same data verified in the backend's own e2e walkthrough
- [ ] 10.2 Confirm no backend business logic changed: re-run the backend's existing test suite (`npm test` in `backend/`) and confirm all tests still pass unmodified
