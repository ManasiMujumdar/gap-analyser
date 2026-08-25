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

### Requirement: Resume upload from a file
The screen SHALL let a candidate provide their resume by uploading a PDF or Word (.docx) file, as an alternative to pasting, on both the new-analysis and add-resume-version modes. Uploading SHALL NOT remove the ability to paste directly.

#### Scenario: Uploading a PDF resume
- **WHEN** a candidate selects a PDF file via the upload control
- **THEN** the screen extracts the file's text and populates the resume field with it

#### Scenario: Uploading a Word document resume
- **WHEN** a candidate selects a .docx file via the upload control
- **THEN** the screen extracts the file's text and populates the resume field with it

#### Scenario: Pasting still works
- **WHEN** a candidate types or pastes directly into the resume field without using the upload control
- **THEN** submission proceeds exactly as it did before this capability existed

### Requirement: Extracted text remains editable before submission
The resume field SHALL remain editable after a file upload populates it, so the candidate can review or correct the extracted text before submitting.

#### Scenario: Editing after upload
- **WHEN** a candidate uploads a file and then edits the populated resume field
- **THEN** the edited text, not the original extraction, is what gets submitted

### Requirement: Graceful fallback on extraction failure
If text cannot be meaningfully extracted from an uploaded file (unreadable file, unsupported content, or a result too short to be a real resume), the screen SHALL show a clear error and leave the candidate able to paste text directly, rather than blocking submission entirely.

#### Scenario: Corrupted or unreadable file
- **WHEN** a candidate uploads a file that cannot be parsed
- **THEN** the screen shows an error message and the candidate can still paste their resume text directly

#### Scenario: File with no meaningful extractable text
- **WHEN** a candidate uploads a file (such as a scanned, image-only PDF) that yields little or no extractable text
- **THEN** the screen treats this the same as an extraction failure, showing an error rather than submitting near-empty text
