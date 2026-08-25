import { extractTextFromPdf } from "./pdf";
import { extractTextFromDocx } from "./docx";

// Task 1.6: below this, treat extraction as failed rather than submitting
// near-empty text (design.md Risk: scanned/image-only PDFs yield an empty
// or near-empty string rather than an error).
const MIN_EXTRACTED_LENGTH = 50;

export class ResumeExtractionError extends Error {}

/**
 * Task 1.5: dispatches to the right extractor by file extension and
 * validates the result, so callers only need one function regardless of
 * file type (intake-screen spec: "Resume upload from a file").
 */
export async function extractResumeText(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  let text: string;

  if (name.endsWith(".pdf")) {
    try {
      text = await extractTextFromPdf(file);
    } catch {
      throw new ResumeExtractionError("Couldn't read that PDF. It may be corrupted or scanned without selectable text.");
    }
  } else if (name.endsWith(".docx")) {
    try {
      text = await extractTextFromDocx(file);
    } catch {
      throw new ResumeExtractionError("Couldn't read that Word document. It may be corrupted or in an unsupported format.");
    }
  } else {
    throw new ResumeExtractionError("Please upload a PDF or Word (.docx) file.");
  }

  const trimmed = text.trim();
  if (trimmed.length < MIN_EXTRACTED_LENGTH) {
    throw new ResumeExtractionError(
      "We couldn't find enough readable text in that file (it may be a scanned image). Try pasting your resume text instead.",
    );
  }

  return trimmed;
}
