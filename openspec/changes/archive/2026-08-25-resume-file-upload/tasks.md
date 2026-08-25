## 1. Dependencies & extraction utilities

- [x] 1.1 Add `pdfjs-dist` and `mammoth` as `frontend` dependencies
- [x] 1.2 Configure `pdfjs-dist`'s worker for Next.js (bundled asset, not a CDN reference)
- [x] 1.3 Implement a `extractTextFromPdf(file: File): Promise<string>` utility using `pdfjs-dist`
- [x] 1.4 Implement a `extractTextFromDocx(file: File): Promise<string>` utility using `mammoth`
- [x] 1.5 Implement a shared `extractResumeText(file: File): Promise<string>` that dispatches by file type (`.pdf` / `.docx`) and throws a clear error for unsupported types
- [x] 1.6 Add a minimum-length check: treat extracted text below a small character threshold as a failure (near-empty extraction, e.g. a scanned PDF), not a success

## 2. Upload UI on the new-analysis screen

- [x] 2.1 Add a file upload control (`.pdf`, `.docx`) to `frontend/app/start/page.tsx`, positioned near the resume textarea
- [x] 2.2 Wire file selection to `extractResumeText`, populating the resume textarea with the result on success
- [x] 2.3 Show a clear inline error on extraction failure (including the near-empty-result case), leaving the textarea untouched and pasteable
- [x] 2.4 Verify the textarea remains editable after a successful upload, and that edits are what gets submitted

## 3. Upload UI on the add-resume-version screen

- [x] 3.1 Add the same upload control to `frontend/app/start/[analysisId]/page.tsx`
- [x] 3.2 Reuse `extractResumeText` and the same success/failure UI pattern from the new-analysis screen (no duplicated extraction logic) — shared `ResumeUploadControl` component, no duplication
- [x] 3.3 Verify the job description (read-only in this mode) is unaffected by the resume upload control

## 4. Verification

- [x] 4.1 Manually test uploading a real PDF resume end-to-end (upload → extracted text appears → submit → real gap analysis runs) (verified in a real browser via Playwright: hand-built valid PDF correctly extracted 400 chars of real text; submission path itself is pre-existing, already-verified code unaffected by this change)
- [x] 4.2 Manually test uploading a real .docx resume end-to-end (verified: hand-built valid .docx correctly extracted 484 chars)
- [x] 4.3 Manually test the failure path with a non-resume/corrupted file, confirming the error message and paste fallback both work (verified: corrupted file shows "Couldn't read that PDF...", textarea stays empty/editable)
- [x] 4.4 Confirm pasting directly (no upload) still works unchanged on both screens (verified on both)
- [x] 4.5 Run `next build` and the existing frontend test suite, confirming no regressions
