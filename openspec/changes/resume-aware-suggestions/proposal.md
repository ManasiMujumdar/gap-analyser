## Why

Suggestion generation currently scores each gap in isolation — the LLM only sees the one skill's own JD citation and resume citation, never the rest of the resume. This means a portfolio-addition suggestion for, say, a Budget Management gap can only guess at a generic tool (e.g., "Excel or Airtable"), even if the resume already shows the candidate using a more specific, relevant tool for a different skill nearby. The suggestion can't build on what the candidate already knows because it never sees it.

## What Changes

- When generating suggestions for a resume version, the system now also gathers every other skill on that version with recorded resume evidence (not just the gapped skill) and makes it available as context in the same LLM call.
- The suggestion-generation prompt instructs the model to prefer building portfolio-addition suggestions on tools/domains the candidate has already demonstrated elsewhere, when that's a sensible fit, rather than defaulting to a generic unrelated recommendation.
- No new LLM calls — this enriches the prompt content of the existing single batched call per resume version.
- No API or frontend changes — purely a backend prompt-construction change; the suggestions endpoint and UI are unaffected.

**Non-goals**:
- Guaranteeing every suggestion references other skills — when a resume has little or no other evidence yet (e.g., a first version with mostly gaps), suggestions fall back to today's per-skill-only grounding, which remains correct behavior, not a regression.
- Passing raw resume text into the prompt — this uses the structured, citation-backed evidence already extracted, not a second copy of the resume.

## Capabilities

### New Capabilities
(none)

### Modified Capabilities
- `improvement-suggestions`: suggestion generation now has access to the candidate's full demonstrated skillset from the current resume version, not only the gapped skill, as additional grounding context.

## Impact

- Backend only: `backend/src/services/suggestions.ts` (gathers the additional context), `backend/src/llm/generateSuggestions.ts` (accepts and prompts with it).
- No database schema changes — reuses existing `gap_scores`/evidence data already stored.
- No changes to the API layer or frontend.
