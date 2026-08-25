## Context

See proposal.md for motivation. Current state: `generateSuggestionsForVersion` (backend/src/services/suggestions.ts) queries `gap_scores` joined with `skills` for a resume version, filters to skills with `gapSize > 0`, and calls `generateSuggestionsBatch` (backend/src/llm/generateSuggestions.ts) with one entry per gap: `{skillName, jdDepth, jdCitation, resumeDepth, resumeCitation}`. The batch prompt describes each gap independently; nothing about skills outside that list reaches the model.

## Goals / Non-Goals

**Goals:**
- Give the suggestion generator visibility into what the candidate has already demonstrated elsewhere on the same resume version, so it can ground portfolio-addition suggestions in familiar tools/domains when sensible.

**Non-Goals:**
- Changing the suggestion output schema (still `resumeRewrite` / `portfolioAddition` / `talkingPointNarrative` per skill) — only the input context grows.
- Forcing every suggestion to reference other skills — the model uses this context at its judgment, only when it's a genuine fit.

## Decisions

### 1. Pass structured evidence rows, not raw resume text
The additional context is the existing `gap_scores` rows for skills with non-null `resumeDepth` on this version (skill name, depth, citation) — data already extracted and stored, not a second copy of the resume.

*Alternative considered*: include the raw resume text alongside each gap's prompt section. Rejected — the resume was already parsed into citation-backed evidence once; sending the raw text again duplicates that work inside the prompt, makes token usage less predictable (resume length varies a lot), and reintroduces exactly the kind of un-cited, ungrounded text the citation-first design (resume-gap-analysis/design.md Decision #1) was built to avoid. Structured rows keep every piece of context traceable to a citation, same as the rest of this system.

### 2. Stays within the existing single batched call
The candidate's demonstrated-skillset list is added once to the shared prompt already built for all gaps on a version (`generateSuggestionsBatch`), not fetched or sent per-gap. No new LLM call is introduced.

### 3. Graceful degradation when there's little other evidence
If a resume version has no skills with recorded evidence outside the current gaps (common on a first submission where most/all skills are gaps), the demonstrated-skillset context is simply empty or thin. The prompt handles this the same way the current one does — the model still produces all three suggestion types per gap using only that skill's own context, exactly as it does today. This is not a special-cased failure path; it's what "no additional context available" naturally looks like.

## Risks / Trade-offs

- **[Risk]** Slightly larger prompt (more tokens) per suggestion-generation call, since it now includes every other skill's evidence in addition to the gaps themselves. → **Mitigation**: still one call per resume version, not one per skill — the rate-limit-relevant call count is unchanged; token growth is bounded by how many skills a JD realistically lists (small, tens at most).
- **[Risk]** The model could force an unnatural connection to existing tools where none genuinely fits. → **Mitigation**: the system prompt explicitly instructs "when that's a sensible fit" / not to force it — a soft steer, consistent with how this project already treats LLM output quality as best-effort rather than strictly guaranteed (design.md precedent in resume-gap-analysis for parsing quality).
