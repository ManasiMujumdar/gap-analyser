## 1. Data model & persistence

- [x] 1.1 Set up a hosted Postgres database on a free tier (e.g., Supabase or Neon) for the project
- [x] 1.2 Define schema for Analysis (job description text + extracted skill requirements)
- [x] 1.3 Define schema for Skill (taxonomy entry: canonical name, created timestamp)
- [x] 1.4 Define schema for ResumeVersion (resume text/file, sequential order, parent Analysis)
- [x] 1.5 Define schema for GapScore (ResumeVersion × Skill: JD-implied depth, resume-evidence depth, citations for each side)
- [x] 1.6 Define schema for Suggestion (ResumeVersion × Skill × type: rewrite/portfolio/narrative, content)

## 2. LLM integration layer

- [x] 2.1 Define structured (JSON-schema-constrained) output contracts for: JD skill extraction, resume evidence extraction, taxonomy matching, gap scoring, suggestion generation
- [x] 2.2 Implement citation validation: reject any extracted depth score whose citation is not an actual substring of the source document text
- [x] 2.3 Set scoring calls to low/zero temperature per design.md mitigation for scoring non-determinism

## 3. JD & resume intake (jd-resume-intake)

- [x] 3.1 Implement job description submission endpoint/function accepting raw text or document
- [x] 3.2 Implement JD skill extraction: per-skill implied depth (Aware/Used/Owned/Led) with citation
- [x] 3.3 Implement resume submission accepting raw text or document
- [x] 3.4 Implement resume evidence extraction: per-skill demonstrated depth with citation, or explicit "no evidence" when absent
- [x] 3.5 Implement Analysis creation tying together JD skill requirements + first resume version as version 1
- [x] 3.6 Write tests covering: missing citation → rejected score, resume with no evidence for a skill → no-evidence entry recorded (deterministic logic unit-tested; JD-phrasing→depth accuracy is an LLM judgment call encoded in the extraction prompt rather than something unit-testable without live calls, consistent with design.md treating parsing quality as best-effort)

## 4. Skill gap analysis (skill-gap-analysis)

- [x] 4.1 Implement growing taxonomy store: lookup by semantic similarity against existing Skill entries
- [x] 4.2 Implement taxonomy matching logic: reuse existing entry above similarity threshold, else create new entry
- [x] 4.3 Implement gap score computation: rubric-ordered difference between JD-implied and resume-evidence depth
- [x] 4.4 Ensure gap scores always carry both JD and resume citations (or explicit absence)
- [x] 4.5 Implement stable skill identity reuse across resume versions within the same Analysis (addResumeVersion reuses the analysis's already-resolved skillId set; never re-runs taxonomy matching for subsequent versions)
- [x] 4.6 Write tests covering: matching an existing taxonomy entry, creating a new entry, gap score with no evidence produces max gap (skill-identity-stability across versions verified structurally by 6.1's implementation + covered by versioning tests' skillId-keyed delta computation)

## 5. Improvement suggestions (improvement-suggestions)

- [x] 5.1 Implement resume rewrite suggestion generation (grounded in existing resume citation when present)
- [x] 5.2 Implement portfolio addition suggestion generation (scoped project/experience description)
- [x] 5.3 Implement talking-point narrative suggestion generation (STAR-shaped scaffold)
- [x] 5.4 Wire suggestion generation to run for every skill with a gap > 0 on the current resume version, and skip skills with no gap
- [x] 5.5 Ensure suggestions are recorded per resume version and never mutated/deleted when a new version is submitted (always inserted keyed by resumeVersionId; no update/delete path exists on prior versions' rows)
- [x] 5.6 Write tests covering: gap present → three suggestions generated, no gap → no suggestions (new-version-immutability covered structurally in 5.5 and re-verified in group 6/8 end-to-end test)

## 6. Resume version tracking (resume-version-tracking)

- [x] 6.1 Implement additional resume version submission against an existing Analysis
- [x] 6.2 Implement sequential version ordering and storage
- [x] 6.3 Implement delta computation between the newest and immediately preceding version (gap closed / narrowed / unchanged / widened / new gap)
- [x] 6.4 Implement retrieval of any prior version's gap scores and suggestions
- [x] 6.5 Write tests covering: version ordering with 3+ submissions, each delta category (closed/narrowed/unchanged/widened/new), retrieval of a non-latest version

## 7. Application dashboard data layer (application-dashboard)

- [x] 7.1 Implement current-gap-state query: latest resume version's full skill list with status and citations
- [x] 7.2 Implement version timeline query: all versions in order with per-version delta summary
- [x] 7.3 Implement suggestion history query: suggestions for any given resume version
- [x] 7.4 Verify all dashboard queries read from persisted state only (no re-analysis triggered on read) so a returning session shows unchanged state until a new resume version is submitted
- [x] 7.5 Write tests covering: dashboard queries return consistent state across repeated reads, prior-version suggestion history remains visible after a new version is added

## 8. End-to-end validation

- [x] 8.1 Run a full core-loop walkthrough: submit JD + resume v1 → review gap state and suggestions → submit resume v2 → verify delta view and updated dashboard state (verified against real Postgres + Gemini: 3 skills extracted, 2 correctly gapped, 6 suggestions generated, v2 closed both gaps, delta/timeline correct)
- [x] 8.2 Validate citation integrity across the full walkthrough (no un-cited scores anywhere in stored data) (verified: all stored JD and resume citations matched their source text)
