# resume-version-tracking Specification

## Purpose

Lets a candidate submit successive resume versions against an existing analysis and see whether their edits closed previously identified gaps.

## Requirements

### Requirement: Additional resume version submission
The system SHALL allow a new resume version to be submitted to an existing analysis and SHALL re-run evidence extraction and gap scoring for that version against the analysis's job description skill requirements.

#### Scenario: New version submitted
- **WHEN** a candidate submits a new resume to an existing analysis
- **THEN** the system extracts evidence and computes gap scores for the new version against the same job description skill set

### Requirement: Sequential version ordering
Each resume version within an analysis SHALL be recorded with a sequential order so that version history is unambiguous.

#### Scenario: Versions are ordered
- **WHEN** a candidate has submitted three resumes to the same analysis
- **THEN** the system records them as version 1, version 2, and version 3 in submission order

### Requirement: Delta view between consecutive versions
The system SHALL produce a delta comparing gap scores between the newest resume version and the immediately preceding version, categorizing each skill's change as gap closed, gap narrowed, gap unchanged, gap widened, or new gap.

#### Scenario: Gap closed
- **WHEN** a skill had a gap in the preceding version and has no gap in the newest version
- **THEN** the delta categorizes that skill as gap closed

#### Scenario: Gap unchanged
- **WHEN** a skill's gap score is identical between the preceding and newest version
- **THEN** the delta categorizes that skill as gap unchanged

#### Scenario: New gap appears
- **WHEN** a skill had no gap in the preceding version but has a gap in the newest version
- **THEN** the delta categorizes that skill as a new gap

### Requirement: Prior versions remain accessible
The system SHALL retain gap scores and suggestions for all prior resume versions of an analysis and SHALL allow them to be viewed, not only the latest version.

#### Scenario: Viewing an earlier version
- **WHEN** a candidate requests the gap scores for an earlier resume version of an analysis
- **THEN** the system returns that version's recorded gap scores and suggestions unchanged
