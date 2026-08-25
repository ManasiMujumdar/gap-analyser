"use client";

import { useState } from "react";
import { DepthStepper } from "@/components/DepthStepper";
import type { GapScoreDto } from "@/lib/types";

/**
 * Task 5.3/5.4/5.5: one skill's gap status - depth comparison, citation
 * transparency, and the entry point into that skill's suggestions
 * (gap-report-screen spec).
 */
export function SkillCard({ skill, onViewSuggestions }: { skill: GapScoreDto; onViewSuggestions: () => void }) {
  const [expanded, setExpanded] = useState(false);

  const hasGap = skill.gapSize > 0;
  const severity = skill.gapSize >= 2 ? "major" : skill.gapSize === 1 ? "minor" : "none";

  return (
    <article className="bg-surface-container-lowest border border-border-soft rounded-lg p-card-padding relative overflow-hidden shrink-0">
      <div className="flex justify-between items-start mb-6">
        <h3 className="font-headline-sm text-headline-sm text-primary">{skill.canonicalName}</h3>
        {severity === "major" && (
          <div className="px-3 py-1 bg-gap-high rounded-full font-label-md text-label-md text-on-tertiary-fixed-variant flex items-center gap-1 shrink-0">
            <span className="material-symbols-outlined text-[14px]">warning</span>
            Major Gap
          </div>
        )}
        {severity === "minor" && (
          <div className="px-3 py-1 bg-gap-mid rounded-full font-label-md text-label-md text-primary flex items-center gap-1 shrink-0">
            <span className="material-symbols-outlined text-[14px]">remove</span>
            Minor Gap
          </div>
        )}
        {severity === "none" && (
          <div className="flex items-center gap-1 text-success-muted font-label-md text-label-md shrink-0">
            <span className="material-symbols-outlined text-[20px]">check_circle</span>
            On Track
          </div>
        )}
      </div>

      <div className="space-y-4 mb-6">
        <DepthStepper label="Job Wants" depth={skill.jdDepth} filledClassName="bg-secondary" labelClassName="text-secondary" />
        <DepthStepper
          label="Your Resume"
          depth={skill.resumeDepth}
          filledClassName={hasGap ? "bg-primary-container" : "bg-success-muted opacity-80"}
          labelClassName={hasGap ? "text-primary-container" : "text-success-muted"}
        />
      </div>

      {hasGap && (
        <div className="border-t border-border-soft pt-4">
          <button
            type="button"
            className="flex items-center gap-2 text-secondary font-label-md text-label-md hover:text-secondary-container transition-colors"
            onClick={() => setExpanded((v) => !v)}
          >
            <span className="material-symbols-outlined text-[16px]">info</span>
            Why is this a gap?
          </button>
          {expanded && (
            <div className="mt-2 bg-bg-subtle p-3 rounded-md border border-border-soft">
              <p className="font-body-md text-body-md italic text-on-surface-variant border-l-2 border-gap-high pl-3">
                JD states: &quot;{skill.jdCitation}&quot;
                {skill.resumeCitation
                  ? ` Your resume says: "${skill.resumeCitation}"`
                  : " Your resume has no evidence for this skill yet."}
              </p>
              <div className="mt-3 flex justify-end">
                <button
                  type="button"
                  className="px-4 py-1.5 border border-secondary text-secondary rounded-md font-label-md text-label-md hover:bg-secondary hover:text-on-primary transition-colors"
                  onClick={onViewSuggestions}
                >
                  View Suggestions
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </article>
  );
}
