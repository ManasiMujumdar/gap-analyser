"use client";

import { useRef, useState } from "react";
import { extractResumeText, ResumeExtractionError } from "@/lib/extraction";

/**
 * Tasks 2.1-2.3/3.2: file upload control shared by both intake screens
 * (intake-screen spec: "Resume upload from a file"). Extraction failures
 * (including the near-empty-result case) show inline and never block the
 * candidate from pasting instead.
 */
export function ResumeUploadControl({ onExtracted }: { onExtracted: (text: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ""; // allow re-selecting the same file after an error
    if (!file) return;

    setError(null);
    setExtracting(true);
    try {
      const text = await extractResumeText(file);
      onExtracted(text);
    } catch (err) {
      setError(err instanceof ResumeExtractionError ? err.message : "Something went wrong reading that file.");
    } finally {
      setExtracting(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={extracting}
          className="flex items-center gap-1 text-secondary font-label-md text-label-md hover:text-secondary-container transition-colors disabled:opacity-60"
        >
          <span className="material-symbols-outlined text-[16px]">upload_file</span>
          {extracting ? "Reading file..." : "Or upload a PDF / Word file"}
        </button>
        <input ref={inputRef} type="file" accept=".pdf,.docx" onChange={handleFileChange} className="hidden" />
      </div>
      {error && <p className="text-error font-label-md text-label-md">{error}</p>}
    </div>
  );
}
