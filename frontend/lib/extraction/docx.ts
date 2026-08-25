import mammoth from "mammoth";

/** Task 1.4: extracts plain text from a .docx file, entirely client-side. */
export async function extractTextFromDocx(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}
