## 1. Gather the candidate's demonstrated skillset

- [x] 1.1 In `generateSuggestionsForVersion`, extend the existing gap-scores query (or add a second query) to also capture skills with non-null `resumeDepth` on this resume version, regardless of gap size (the existing query already fetched all skills, not just gapped ones - no new query needed)
- [x] 1.2 Build a "demonstrated skillset" list (skill name, depth, citation) from those rows, excluding the current gap being described in each per-gap context (a skill's own evidence stays in its own gap entry, not duplicated in the shared list) (exclusion done per-gap inside the prompt builder, since one skill can be "other" context for one gap and "the gap itself" for another)
- [x] 1.3 Handle the empty case (no other evidence yet) as a plain empty list, not a special code path

## 2. Thread the context into the batch LLM call

- [x] 2.1 Extend `generateSuggestionsBatch`'s parameters to accept the demonstrated-skillset list alongside the existing gaps array
- [x] 2.2 Update the prompt construction to include the demonstrated skillset once (shared across all gaps in the call), formatted as skill name + depth + citation
- [x] 2.3 Update `BATCH_SYSTEM` instructions: when producing a portfolio-addition suggestion, prefer building on a tool/domain from the demonstrated skillset when it's a sensible fit for the target depth, rather than defaulting to a generic unrelated recommendation — without forcing an unnatural connection when nothing fits
- [x] 2.4 Wire `generateSuggestionsForVersion`'s call site to pass the new context through

## 3. Tests

- [x] 3.1 Update `suggestions.test.ts` to reflect the new query/context-gathering step (mock's `generateSuggestionsBatch` now accepts a second `demonstratedSkillset` arg)
- [x] 3.2 Add a test confirming the demonstrated-skillset context reaches `generateSuggestionsBatch` correctly, keyed off the mocked LLM call's received arguments
- [x] 3.3 Add a test confirming the empty-skillset case (no other evidence) doesn't throw and still produces suggestions using only the gap's own context
- [x] 3.4 Run the full backend test suite, confirming no regressions (38/38 passed, up from 36; `tsc --noEmit` clean)

## 4. Verification

- [x] 4.1 Run a live end-to-end check with a resume that has both a gap and other demonstrated evidence, confirming the demonstrated-skillset context is actually included in the real request sent to Gemini (verified on production: JD required "Data Visualization" (owned, no resume evidence) alongside "SQL" (owned, via a specific citation); the resume-rewrite suggestion for the Data Visualization gap explicitly cited "Tableau and SQL" — SQL could only have surfaced there via the cross-skill context, confirming it reached the real Gemini request)
- [x] 4.2 Spot-check the resulting portfolio-addition suggestion's plausibility given the resume's other evidence (plausible: proposed a Tableau/PowerBI dashboard project, consistent with the target skill; didn't force SQL into that specific suggestion, which is correct restraint per the "only if genuinely relevant" instruction — the earlier Budget Management scenario also correctly declined to force in an unrelated SQL mention)
- [x] 4.3 Confirm no changes needed to the API layer or frontend (suggestions endpoint and SuggestionsPanel should work unchanged) (confirmed: full flow worked end-to-end with zero console errors and zero failed network requests, no API/frontend files touched in this change)
