# skill-gap-analysis Specification

## Purpose

Scores each job-description-required skill against resume evidence on a shared depth rubric, normalizing skill identity via a growing taxonomy, to produce auditable and version-comparable gap scores.

## Requirements

### Requirement: Depth gap scoring
For each skill associated with an analysis, the system SHALL compute a gap score as the difference between the job description's implied depth and the current resume version's demonstrated depth, using the ordered rubric Aware < Used < Owned < Led.

#### Scenario: Gap exists
- **WHEN** a skill's JD-implied depth is Owned and the resume's demonstrated depth is Used
- **THEN** the system records a gap score reflecting that the resume is one level below the JD requirement

#### Scenario: No gap
- **WHEN** a skill's resume-demonstrated depth is equal to or greater than the JD-implied depth
- **THEN** the system records no gap for that skill

#### Scenario: No evidence at all
- **WHEN** a skill has no resume evidence entry for the current version
- **THEN** the system records the largest possible gap for that skill, relative to the JD-implied depth

### Requirement: Evidence-backed gap scores
Every gap score SHALL reference both the job description citation and the resume citation (or absence of one) used to derive it, so the score is traceable back to source text.

#### Scenario: Gap score includes both citations
- **WHEN** a gap score is computed for a skill with existing resume evidence
- **THEN** the gap score record includes the JD citation and the resume citation used to determine each side's depth level

### Requirement: Growing taxonomy skill matching
When a skill mention is extracted from a job description or resume, the system SHALL match it against existing taxonomy entries for the candidate; if a sufficiently similar entry exists, the system SHALL reuse that entry's canonical identity, otherwise it SHALL create a new canonical taxonomy entry.

#### Scenario: Matches an existing entry
- **WHEN** a newly extracted skill mention is semantically close to an existing taxonomy entry (e.g., "scalable backend design" vs. an existing "Distributed Systems Design" entry)
- **THEN** the system associates the extraction with the existing canonical entry rather than creating a duplicate

#### Scenario: No close match exists
- **WHEN** a newly extracted skill mention has no sufficiently similar existing taxonomy entry
- **THEN** the system creates a new canonical taxonomy entry and associates the extraction with it

### Requirement: Stable skill identity across resume versions
Within a single analysis, the system SHALL reuse the same canonical taxonomy entry for a given skill across all resume versions submitted to that analysis, so gap scores remain comparable version to version.

#### Scenario: Same skill referenced across versions
- **WHEN** a skill was matched to a canonical taxonomy entry for resume version 1 of an analysis
- **THEN** resume version 2 of the same analysis reuses that same canonical entry when the same underlying skill is detected, rather than creating a new entry
