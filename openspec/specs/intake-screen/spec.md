# intake-screen Specification

## Purpose

Lets a candidate submit a job description and resume to start a new analysis, or submit a new resume version against an existing analysis.

## Requirements

### Requirement: Start a new analysis
The screen SHALL accept a job description and a resume from the candidate and, on submission, create a new analysis and navigate the candidate to that analysis's Gap Report.

#### Scenario: Successful new analysis submission
- **WHEN** a candidate fills in both the job description and resume fields and submits
- **THEN** a new analysis is created and the candidate is navigated to its Gap Report screen

#### Scenario: Incomplete submission
- **WHEN** a candidate attempts to submit with the job description or resume field empty
- **THEN** the submission is prevented and the candidate is shown which field is missing, without creating an analysis

### Requirement: Add a resume version to an existing analysis
When the screen is reached for an existing analysis, it SHALL display that analysis's job description read-only and accept only an updated resume; on submission it SHALL create a new resume version for that analysis and navigate the candidate to its Gap Report reflecting the new version.

#### Scenario: Successful version submission
- **WHEN** a candidate on an existing analysis's intake screen submits an updated resume
- **THEN** a new resume version is created for that analysis and the candidate is navigated to the Gap Report showing the updated gap state

#### Scenario: Job description is not editable
- **WHEN** a candidate reaches the intake screen for an existing analysis
- **THEN** the job description is shown but cannot be edited, and only the resume field accepts input
