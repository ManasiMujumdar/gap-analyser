"use client";

import { useEffect, useState } from "react";
import { DepthStepper } from "@/components/DepthStepper";
import type { DepthLevel, SuggestionDto } from "@/lib/types";

/**
 * Task 6.1-6.5: the per-skill suggestions slide-over (suggestions-panel
 * spec). Scoped to one skill + resume version at a time; closing it is a
 * pure UI action with no write/mutation call (spec: "Panel is scoped to one
 * skill and version at a time").
 */
export function SuggestionsPanel({
  resumeVersionId,
  skillId,
  skillName,
  jdDepth,
  resumeDepth,
  onClose,
}: {
  resumeVersionId: string;
  skillId: string;
  skillName: string;
  jdDepth: DepthLevel;
  resumeDepth: DepthLevel | null;
  onClose: () => void;
}) {
  const [suggestions, setSuggestions] = useState<SuggestionDto[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setSuggestions(null);
    fetch(`/api/resume-versions/${resumeVersionId}/suggestions`)
      .then((res) => res.json())
      .then((body: { suggestions: SuggestionDto[] }) => {
        if (!cancelled) setSuggestions(body.suggestions.filter((s) => s.skillId === skillId));
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load suggestions for this skill.");
      });
    return () => {
      cancelled = true;
    };
  }, [resumeVersionId, skillId]);

  const rewrite = suggestions?.find((s) => s.type === "resume_rewrite");
  const portfolio = suggestions?.find((s) => s.type === "portfolio_addition");
  const narrative = suggestions?.find((s) => s.type === "talking_point_narrative");

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-labelledby="panel-title">
      <div
        className="absolute inset-0 bg-bg-subtle/40 backdrop-blur-sm"
        aria-hidden="true"
        onClick={onClose}
      />
      <div className="relative w-full max-w-2xl bg-surface h-full shadow-2xl flex flex-col border-l border-border-soft">
        <div className="px-card-padding py-6 border-b border-border-soft flex flex-col shrink-0">
          <div className="flex items-start justify-between mb-4">
            <h2 id="panel-title" className="font-headline-lg text-headline-lg text-primary">
              {skillName}
            </h2>
            <button
              type="button"
              className="rounded-full p-2 text-on-surface-variant hover:bg-bg-subtle transition-colors"
              onClick={onClose}
            >
              <span className="sr-only">Close panel</span>
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <div className="bg-bg-subtle rounded-lg p-4 border border-border-soft flex flex-col gap-3">
            <DepthStepper label="Job Wants" depth={jdDepth} filledClassName="bg-secondary" labelClassName="text-secondary" />
            <DepthStepper label="You Show" depth={resumeDepth} filledClassName="bg-gap-mid" labelClassName="text-primary" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-card-padding flex flex-col gap-gutter">
          {error && <p className="text-error font-body-md text-body-md">{error}</p>}
          {!suggestions && !error && <p className="font-body-md text-body-md text-on-surface-variant">Loading suggestions...</p>}

          {rewrite && (
            <div className="bg-surface rounded-xl p-card-padding border border-border-soft shadow-sm relative overflow-hidden shrink-0">
              <div className="absolute top-0 left-0 w-1 h-full bg-success-muted" />
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-success-muted">edit_note</span>
                  <h3 className="font-headline-sm text-headline-sm text-primary">Rewrite your resume</h3>
                </div>
                <span className="bg-bg-subtle text-on-surface-variant font-label-sm text-label-sm px-2 py-1 rounded-full border border-border-soft">
                  Quick Win
                </span>
              </div>
              <div className="bg-bg-subtle rounded-lg p-4 border border-border-soft">
                <p className="font-body-md text-body-md italic text-primary">{rewrite.content}</p>
              </div>
            </div>
          )}

          {portfolio && (
            <div className="bg-surface rounded-xl p-card-padding border border-border-soft shadow-sm relative overflow-hidden shrink-0">
              <div className="absolute top-0 left-0 w-1 h-full bg-secondary" />
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary">construction</span>
                  <h3 className="font-headline-sm text-headline-sm text-primary">Build something to show it</h3>
                </div>
                <div className="flex items-center gap-1 bg-gap-mid/30 text-on-secondary-container font-label-sm text-label-sm px-2 py-1 rounded-full border border-gap-mid">
                  <span className="material-symbols-outlined text-[14px]">timer</span>
                  <span>Takes Time</span>
                </div>
              </div>
              <p className="font-body-md text-body-md text-on-surface-variant">{portfolio.content}</p>
            </div>
          )}

          {narrative && typeof narrative.content === "object" && (
            <div className="bg-surface rounded-xl p-card-padding border border-border-soft shadow-sm relative overflow-hidden shrink-0">
              <div className="absolute top-0 left-0 w-1 h-full bg-tertiary-container" />
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-tertiary-container">record_voice_over</span>
                  <h3 className="font-headline-sm text-headline-sm text-primary">How to talk about it</h3>
                </div>
                <span className="bg-bg-subtle text-on-surface-variant font-label-sm text-label-sm px-2 py-1 rounded-full border border-border-soft">
                  Interview Prep
                </span>
              </div>
              <div className="relative pl-6 space-y-6 before:absolute before:inset-y-0 before:left-[11px] before:w-[2px] before:bg-border-soft">
                {(["situation", "task", "action", "result"] as const).map((step) => (
                  <div key={step} className="relative">
                    <div className="absolute -left-6 w-3 h-3 rounded-full bg-surface border-2 border-tertiary-container mt-1.5" />
                    <h4 className="font-label-md text-label-md text-primary mb-1 capitalize">{step}</h4>
                    <p className="font-body-md text-body-md text-on-surface-variant bg-bg-subtle p-3 rounded-lg border border-border-soft">
                      {narrative.content[step]}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {suggestions && suggestions.length === 0 && (
            <p className="font-body-md text-body-md text-on-surface-variant">No suggestions for this skill.</p>
          )}
        </div>
      </div>
    </div>
  );
}
