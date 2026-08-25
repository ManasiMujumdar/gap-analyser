# api-layer Specification

## Purpose

Exposes the existing backend's intake, gap-analysis, suggestion, versioning, and dashboard service functions over HTTP for the frontend to consume, without altering their underlying behavior.

## Requirements

### Requirement: Get analysis endpoint
The system SHALL provide an endpoint that, given an analysis identifier, returns that analysis's job description text, for screens that need to display it without re-fetching the full gap state.

#### Scenario: Existing analysis
- **WHEN** a request is made with a valid analysis identifier
- **THEN** the system responds with that analysis's job description text

#### Scenario: Non-existent analysis
- **WHEN** a request is made with an analysis identifier that does not exist
- **THEN** the system responds with an error indicating the analysis was not found

### Requirement: Create analysis endpoint
The system SHALL provide an endpoint that accepts a job description and a resume, creates a new analysis from them, and returns the created analysis's identifier along with its initial gap state.

#### Scenario: Valid submission
- **WHEN** a request is made with a non-empty job description and resume
- **THEN** the system creates a new analysis and responds with the analysis identifier, the first resume version, and its computed gap scores

#### Scenario: Missing input
- **WHEN** a request is made with an empty or missing job description or resume
- **THEN** the system rejects the request with an error response and does not create an analysis

### Requirement: Add resume version endpoint
The system SHALL provide an endpoint that accepts an existing analysis identifier and a new resume, creates a new resume version for that analysis, and returns the new version along with its delta against the previous version.

#### Scenario: Valid submission to an existing analysis
- **WHEN** a request is made with a valid existing analysis identifier and a non-empty resume
- **THEN** the system creates a new resume version and responds with the new version and its delta relative to the immediately preceding version

#### Scenario: Submission to a non-existent analysis
- **WHEN** a request is made with an analysis identifier that does not exist
- **THEN** the system responds with an error and does not create a resume version

### Requirement: Current gap state endpoint
The system SHALL provide an endpoint that, given an analysis identifier, returns the latest resume version's gap scores for every JD-required skill.

#### Scenario: Existing analysis
- **WHEN** a request is made with a valid analysis identifier
- **THEN** the system responds with the latest resume version and its full list of gap scores

#### Scenario: Non-existent analysis
- **WHEN** a request is made with an analysis identifier that does not exist
- **THEN** the system responds with an error indicating the analysis was not found

### Requirement: Version timeline endpoint
The system SHALL provide an endpoint that, given an analysis identifier, returns every resume version submitted to it in order, each annotated with its delta relative to the immediately preceding version.

#### Scenario: Multi-version analysis
- **WHEN** a request is made for an analysis with three resume versions
- **THEN** the system responds with all three versions in submission order, where the first has no delta and the second and third each include a delta relative to the version before them

### Requirement: Gap scores endpoint for a specific resume version
The system SHALL provide an endpoint that, given a resume version identifier, returns that version's own gap scores, independent of whether it is the analysis's latest version.

#### Scenario: Historical version
- **WHEN** a request is made for a resume version that is not the latest one in its analysis
- **THEN** the system responds with that version's own recorded gap scores, not the latest version's

### Requirement: Suggestions endpoint for a specific resume version
The system SHALL provide an endpoint that, given a resume version identifier, returns the suggestions recorded for that version, with the talking-point-narrative suggestion's content returned as structured fields rather than a raw JSON string.

#### Scenario: Version with gaps
- **WHEN** a request is made for a resume version that has recorded suggestions
- **THEN** the system responds with each suggestion's type and content, where resume-rewrite and portfolio-addition content are plain text and talking-point-narrative content is returned as separate situation, task, action, and result fields

#### Scenario: Version with no gaps
- **WHEN** a request is made for a resume version with no recorded suggestions
- **THEN** the system responds with an empty list, not an error
