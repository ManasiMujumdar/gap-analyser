## ADDED Requirements

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
