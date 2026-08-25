# gap-report-screen Specification

## Purpose

Shows the candidate the current state of every job-description-required skill against their latest resume, so they can see at a glance where they stand.

## Requirements

### Requirement: Display current gap state
For a given analysis, the screen SHALL display every job-description-required skill together with its JD-implied depth, its resume-demonstrated depth (or an explicit no-evidence state), and its gap size.

#### Scenario: Skill with a gap
- **WHEN** a skill's resume-demonstrated depth is below its JD-implied depth
- **THEN** the screen displays both depth levels with a visible indicator that a gap exists

#### Scenario: Skill with no gap
- **WHEN** a skill's resume-demonstrated depth meets or exceeds its JD-implied depth
- **THEN** the screen displays it without a gap indicator or call to action

#### Scenario: Skill with no resume evidence
- **WHEN** a skill has no resume evidence at all for the current version
- **THEN** the screen displays it distinctly from a skill that has weak-but-present evidence, rather than presenting both the same way

### Requirement: Citation transparency
Each displayed depth level SHALL be traceable, on request, to the citation supporting it, rather than being presented as an unsupported score.

#### Scenario: Viewing a skill's rationale
- **WHEN** a candidate requests to see why a skill was scored the way it was
- **THEN** the screen shows the job description and/or resume citation that supports the displayed depth level

### Requirement: Entry point to suggestions
Each skill with a gap SHALL provide a way to open that skill's suggestions.

#### Scenario: Opening suggestions for a gapped skill
- **WHEN** a candidate selects a skill that has a gap
- **THEN** the screen opens that skill's suggestions for the current resume version
