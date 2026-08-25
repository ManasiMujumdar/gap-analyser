# improvement-suggestions Specification

## Purpose

Turns each gap identified by skill gap analysis into three concrete, differently-actionable suggestions the candidate can choose from.

## Requirements

### Requirement: Three suggestion types per gap
For every skill with a gap on the current resume version, the system SHALL generate exactly three suggestions: a resume rewrite, a portfolio addition, and a talking-point narrative.

#### Scenario: Gap exists
- **WHEN** a skill has a gap score greater than zero for the current resume version
- **THEN** the system generates a resume rewrite suggestion, a portfolio addition suggestion, and a talking-point narrative suggestion for that skill

#### Scenario: No gap
- **WHEN** a skill has no gap for the current resume version
- **THEN** the system does not generate suggestions for that skill

### Requirement: Resume rewrite suggestion
The resume rewrite suggestion SHALL reference the existing resume citation for the skill (when one exists) and propose revised wording intended to better demonstrate the depth already implied by that evidence.

#### Scenario: Existing evidence is under-told
- **WHEN** a resume rewrite suggestion is generated for a skill with an existing resume citation
- **THEN** the suggestion includes the original citation and a proposed rewrite of that text

### Requirement: Portfolio addition suggestion
The portfolio addition suggestion SHALL describe a scoped project or experience the candidate could pursue to produce evidence at the JD-implied depth for that skill.

#### Scenario: Suggestion describes a scoped addition
- **WHEN** a portfolio addition suggestion is generated for a skill
- **THEN** the suggestion describes a concrete, scoped project or experience that would demonstrate the JD-implied depth if completed

### Requirement: Talking-point narrative suggestion
The talking-point narrative suggestion SHALL provide a STAR-shaped (Situation, Task, Action, Result) story scaffold the candidate can adapt to describe relevant experience verbally, regardless of whether the resume text itself is rewritten.

#### Scenario: Narrative scaffold provided
- **WHEN** a talking-point narrative suggestion is generated for a skill
- **THEN** the suggestion includes a Situation, Task, Action, and Result scaffold relevant to that skill

### Requirement: Suggestions are versioned, not overwritten
Suggestions generated for a given resume version SHALL remain associated with that version and SHALL NOT be edited or deleted when a later resume version is submitted; a new resume version triggers regeneration of suggestions for its own current gaps.

#### Scenario: New resume version submitted
- **WHEN** a candidate submits a new resume version to an analysis
- **THEN** the system generates a new set of suggestions for the gaps found in that version, while suggestions recorded against prior versions remain unchanged and accessible
