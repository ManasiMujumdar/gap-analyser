import * as pdfjsLib from "pdfjs-dist";

// Bundled asset, not a CDN reference (design.md Decision #2) - webpack's
// asset-module handling of `new URL(..., import.meta.url)` resolves this to
// a local static file at build time.
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();

/** Task 1.3: extracts plain text from a PDF file, page by page, entirely client-side. */
export async function extractTextFromPdf(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  // standardFontDataUrl: needed for PDFs using standard (non-embedded)
  // fonts, common in resumes exported from Word/Google Docs - without it,
  // pdfjs-dist warns and can mis-measure/mis-extract that text.
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer, standardFontDataUrl: "/standard_fonts/" }).promise;

  const pageTexts: string[] = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const pageText = content.items.map((item) => ("str" in item ? item.str : "")).join(" ");
    pageTexts.push(pageText);
  }

  return pageTexts.join("\n\n");
}
