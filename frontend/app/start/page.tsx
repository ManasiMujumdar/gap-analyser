"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { ResumeUploadControl } from "@/components/ResumeUploadControl";
import { rememberAnalysisId } from "@/lib/analysisStorage";

/** Task 4.1/4.2/4.3: Start/Upload screen, "new analysis" mode. */
export default function StartPage() {
  const router = useRouter();
  const [jdText, setJdText] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [errors, setErrors] = useState<{ jd?: string; resume?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const nextErrors: { jd?: string; resume?: string } = {};
    if (!jdText.trim()) nextErrors.jd = "Paste the job description before analyzing.";
    if (!resumeText.trim()) nextErrors.resume = "Paste your resume before analyzing.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      const response = await fetch("/api/analyses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jdText, resumeText }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error ?? "Something went wrong analyzing your resume.");
      }
      const body = await response.json();
      rememberAnalysisId(body.analysisId);
      router.push(`/dashboard/${body.analysisId}`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 lg:ml-64 w-full px-margin-mobile md:px-0 py-8 lg:py-12">
        <div className="max-w-3xl mx-auto flex flex-col gap-stack-gap">
          <div className="text-center mb-6">
            <h1 className="font-headline-lg text-headline-lg text-primary mb-3">Start New Analysis</h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl mx-auto">
              We&apos;ll compare this against what the job actually asks for, with sources cited so you can trust the
              result.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="bg-surface-container-lowest border border-border-soft rounded-xl p-card-padding flex flex-col gap-gutter shadow-sm"
          >
            <div className="flex flex-col gap-2">
              <label className="font-headline-sm text-headline-sm text-primary" htmlFor="job-description">
                Paste the job description
              </label>
              <textarea
                id="job-description"
                className="w-full bg-bg-subtle border-none rounded-lg p-4 font-body-md text-body-md text-on-background focus:ring-1 focus:ring-secondary transition-colors resize-y"
                placeholder="Paste the full job requirements, responsibilities, and details here..."
                rows={6}
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
              />
              {errors.jd && <p className="text-error font-label-md text-label-md">{errors.jd}</p>}
            </div>

            <div className="flex items-center gap-4 py-2">
              <div className="h-px bg-border-soft flex-1" />
              <span className="font-label-sm text-label-sm text-outline-variant uppercase tracking-wider">
                Against
              </span>
              <div className="h-px bg-border-soft flex-1" />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <label className="font-headline-sm text-headline-sm text-primary" htmlFor="resume-text">
                  Paste your resume
                </label>
                <ResumeUploadControl
                  onExtracted={(text) => {
                    setResumeText(text);
                    setErrors((prev) => ({ ...prev, resume: undefined }));
                  }}
                />
              </div>
              <textarea
                id="resume-text"
                className="w-full bg-bg-subtle border-none rounded-lg p-4 font-body-md text-body-md text-on-background focus:ring-1 focus:ring-secondary transition-colors resize-y"
                placeholder="Paste your current resume content here to check for gaps..."
                rows={8}
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
              />
              {errors.resume && <p className="text-error font-label-md text-label-md">{errors.resume}</p>}
            </div>

            {submitError && <p className="text-error font-body-md text-body-md">{submitError}</p>}

            <div className="flex justify-end mt-4">
              <button
                type="submit"
                disabled={submitting}
                className="bg-secondary text-on-primary font-label-md text-label-md px-8 py-4 rounded-lg flex items-center gap-2 hover:bg-opacity-90 active:scale-95 transition-all shadow-sm disabled:opacity-60"
              >
                <span className="material-symbols-outlined text-[20px]">troubleshoot</span>
                {submitting ? "Analyzing..." : "Analyze Match"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
