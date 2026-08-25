## Why

Candidates almost never have their resume sitting around as plain pasteable text — it exists as a PDF or Word document. Requiring paste-only forces an extra manual step (open the file, select all, copy, paste) that's real friction on the one screen every candidate must use before anything else works. Letting them upload the file directly removes that friction.

## What Changes

- Add a file upload control to both intake screens (new-analysis and add-resume-version), accepting `.pdf` and `.docx`, as an alternative to pasting — pasting keeps working unchanged.
- On upload, the file's text is extracted in the browser and used to populate the existing resume textarea, which the candidate can still review and edit before submitting.
- Extraction failures (corrupted file, scanned/image-only PDF with no text layer, unsupported format) show a clear error and let the candidate fall back to pasting — never a dead end.

**Non-goals**:
- Job description file upload — stays paste-only; JDs are typically copied from a job posting page, not held as a standalone file.
- Server-side file storage or a new upload API endpoint — extraction happens entirely client-side; the backend/API layer sees the same plain `resumeText` string it always has.
- OCR for scanned/image-only PDFs — out of scope; these fail extraction and fall back to paste.

## Capabilities

### New Capabilities
(none)

### Modified Capabilities
- `intake-screen`: adds file-upload-based resume submission alongside the existing paste-based submission, on both the new-analysis and add-version screens.

## Impact

- Frontend only: `frontend/app/start/page.tsx`, `frontend/app/start/[analysisId]/page.tsx`, plus new client-side extraction utilities and two new dependencies (a PDF text-extraction library and a DOCX text-extraction library).
- No backend, API, or database changes — `POST /api/analyses` and `POST /api/analyses/[analysisId]/versions` are unaffected.
