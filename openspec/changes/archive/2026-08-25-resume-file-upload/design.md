## Context

See proposal.md for motivation. Current state: both intake screens (`frontend/app/start/page.tsx`, `frontend/app/start/[analysisId]/page.tsx`) are client components with a plain `<textarea>` for the resume, whose value is sent as-is in the `resumeText` field of `POST /api/analyses` / `POST /api/analyses/[analysisId]/versions`.

## Goals / Non-Goals

**Goals:**
- Let a candidate produce the same `resumeText` string they'd get from pasting, but from a PDF or DOCX file instead.
- Keep the backend/API layer completely unaware this feature exists.

**Non-Goals:**
- Perfect fidelity to the original document's formatting — extracted text is plain text, matching what pasting already produces (pasting from a PDF viewer or Word already loses most formatting too).
- OCR / scanned-document support.

## Decisions

### 1. Client-side extraction, not a new upload API endpoint
The file is read and its text extracted entirely in the browser; the app never uploads the raw file anywhere. The extracted text flows into the same `resumeText` field the textarea already produces.

*Alternative considered*: a new `POST /api/resume-files` endpoint that accepts the raw file and extracts text server-side (via `pdf-parse` / `mammoth` in Node). Rejected — it would add a new API route, request-size handling, and a second place extraction logic could live, for no real benefit: extraction is fast enough to do client-side, and keeping the backend untouched matches this project's established preference for minimizing surface area (see resume-gap-analysis/design.md, frontend-integration/design.md).

### 2. Library choices: `pdfjs-dist` for PDF, `mammoth` for DOCX
Both have browser-compatible builds and are the standard choice for client-side text extraction of their respective formats. `pdfjs-dist` (Mozilla's PDF.js) requires configuring its worker script (bundled asset, not a CDN dependency) for Next.js; `mammoth`'s `extractRawText({ arrayBuffer })` API runs directly against a `File`'s `ArrayBuffer` with no extra setup.

### 3. Extracted text populates the textarea rather than replacing it with a locked preview
The candidate can see and edit the result before submitting. This is a deliberate safety net: PDF text extraction can occasionally produce garbled output (column layouts, unusual fonts, missing line breaks) — showing it in an editable field rather than submitting it silently means a bad extraction is visible and fixable, not a black box.

### 4. Extraction failure degrades to the existing paste path, never a dead end
If extraction throws (corrupted file, unrecognized format, a PDF with no text layer at all) or produces empty text, the screen shows an inline error message and leaves the textarea as-is (empty, or whatever the candidate had already typed) — the candidate can always fall back to pasting. No new error state blocks the existing submission flow.

## Risks / Trade-offs

- **[Risk]** A scanned/image-only PDF has no extractable text layer — `pdfjs-dist` will return an empty or near-empty string, not an error. → **Mitigation**: treat a suspiciously short extraction result (below a small character-count threshold) the same as a failure, showing the same fallback-to-paste message, rather than silently submitting near-empty text.
- **[Risk]** `pdfjs-dist`'s worker setup is a common source of Next.js integration friction (wrong worker path, bundler misconfiguration). → **Mitigation**: called out as its own task, verified with a real PDF upload before considering the feature done, not assumed to "just work" from adding the dependency.
- **[Risk]** Bundle size increase from two new client-side libraries. → **Mitigation**: acceptable for a portfolio project's traffic profile; both libraries are only loaded on the intake screens (code-split), not the whole app.

## Migration Plan

Additive, frontend-only change. No data migration; existing analyses/resume versions are unaffected. Deploy via the same Vercel pipeline already in place.
