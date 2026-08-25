# application-dashboard Specification

## Purpose

Presents persistent, cross-session status of an analysis — current gap state, suggestion history, and resume version timeline — so a candidate can track progress across multiple visits without redoing prior work.

## Requirements

### Requirement: Current gap state view
The system SHALL present, for the latest resume version of an analysis, the full list of job-description-required skills with each skill's current gap status and supporting citations.

#### Scenario: Viewing current state
- **WHEN** a candidate opens the dashboard for an analysis
- **THEN** the system displays every JD-required skill with its current gap status and the citations supporting that status

### Requirement: Resume version timeline
The system SHALL present all resume versions submitted to an analysis in submission order, each annotated with a summary of gap changes relative to the previous version.

#### Scenario: Viewing the timeline
- **WHEN** a candidate opens the dashboard for an analysis with multiple resume versions
- **THEN** the system displays each version in order along with a summary of gaps closed, narrowed, unchanged, widened, or newly appeared relative to the prior version

### Requirement: Suggestion history visibility
The system SHALL present, for any resume version, the suggestions generated at that version, retained even after newer versions have been submitted.

#### Scenario: Viewing suggestions for a past version
- **WHEN** a candidate selects a prior resume version on the dashboard
- **THEN** the system displays the suggestions that were generated for that version, unchanged by later versions

### Requirement: Persistent cross-session state
The system SHALL persist analysis state so that a candidate returning in a later session sees the same dashboard state without needing to re-submit the job description or any prior resume version.

#### Scenario: Returning in a later session
- **WHEN** a candidate returns to the dashboard for an existing analysis in a new session
- **THEN** the system displays the same gap state, suggestion history, and version timeline that existed at the end of the previous session, unless a new resume version is submitted
