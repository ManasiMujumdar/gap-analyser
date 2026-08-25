"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { ResumeUploadControl } from "@/components/ResumeUploadControl";
import { rememberAnalysisId } from "@/lib/analysisStorage";

/** Task 4.4: Start/Upload screen, "add a resume version to an existing analysis" mode. */
export default function AddVersionPage({ params }: { params: Promise<{ analysisId: string }> }) {
  const { analysisId } = use(params);
  const router = useRouter();

  const [jdText, setJdText] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [resumeText, setResumeText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    rememberAnalysisId(analysisId);
    fetch(`/api/analyses/${analysisId}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Couldn't find that analysis.");
        return res.json();
      })
      .then((body) => setJdText(body.jdText))
      .catch((err) => setLoadError(err instanceof Error ? err.message : "Something went wrong."));
  }, [analysisId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!resumeText.trim()) {
      setError("Paste your updated resume before checking your progress.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`/api/analyses/${analysisId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? "Something went wrong.");
      }
      router.push(`/dashboard/${analysisId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar analysisId={analysisId} />
      <main className="flex-1 lg:ml-64 w-full px-margin-mobile md:px-0 py-8 lg:py-12">
        <div className="max-w-3xl mx-auto flex flex-col gap-stack-gap">
          <div className="text-center mb-6">
            <h1 className="font-headline-lg text-headline-lg text-primary mb-3">Check Your Progress</h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl mx-auto">
              We&apos;ll re-check your updated resume against the same job description.
            </p>
          </div>

          {loadError && <p className="text-error font-body-md text-body-md text-center">{loadError}</p>}

          {jdText !== null && (
            <form
              onSubmit={handleSubmit}
              className="bg-surface-container-lowest border border-border-soft rounded-xl p-card-padding flex flex-col gap-gutter shadow-sm"
            >
              <div className="flex flex-col gap-2">
                <label className="font-headline-sm text-headline-sm text-primary">Job description</label>
                <div className="w-full bg-bg-subtle rounded-lg p-4 font-body-md text-body-md text-on-surface-variant max-h-40 overflow-y-auto opacity-80">
                  {jdText}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label className="font-headline-sm text-headline-sm text-primary" htmlFor="resume-text">
                    Paste your updated resume
                  </label>
                  <ResumeUploadControl
                    onExtracted={(text) => {
                      setResumeText(text);
                      setError(null);
                    }}
                  />
                </div>
                <textarea
                  id="resume-text"
                  className="w-full bg-bg-subtle border-none rounded-lg p-4 font-body-md text-body-md text-on-background focus:ring-1 focus:ring-secondary transition-colors resize-y"
                  rows={8}
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                />
                {error && <p className="text-error font-label-md text-label-md">{error}</p>}
              </div>

              <div className="flex justify-end mt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-secondary text-on-primary font-label-md text-label-md px-8 py-4 rounded-lg flex items-center gap-2 hover:bg-opacity-90 active:scale-95 transition-all shadow-sm disabled:opacity-60"
                >
                  <span className="material-symbols-outlined text-[20px]">troubleshoot</span>
                  {submitting ? "Checking..." : "Check My Progress"}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
