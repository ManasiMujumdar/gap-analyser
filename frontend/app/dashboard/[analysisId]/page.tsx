"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { Sidebar } from "@/components/Sidebar";
import { SkillCard } from "@/components/SkillCard";
import { SuggestionsPanel } from "@/components/SuggestionsPanel";
import { rememberAnalysisId } from "@/lib/analysisStorage";
import type { GapScoreDto } from "@/lib/types";

interface GapState {
  latestVersion: { id: string; versionNumber: number };
  gapScores: GapScoreDto[];
}

/** Task 5.1/5.2: Gap Report screen - current gap state for an analysis. */
export default function GapReportPage({ params }: { params: Promise<{ analysisId: string }> }) {
  const { analysisId } = use(params);

  const [state, setState] = useState<GapState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openSkill, setOpenSkill] = useState<{ skillId: string; canonicalName: string } | null>(null);

  useEffect(() => {
    rememberAnalysisId(analysisId);
    fetch(`/api/analyses/${analysisId}/gap-state`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Couldn't find that analysis.");
        return res.json();
      })
      .then(setState)
      .catch((err) => setError(err instanceof Error ? err.message : "Something went wrong."));
  }, [analysisId]);

  if (error) {
    return (
      <div className="flex min-h-screen">
        <Sidebar analysisId={analysisId} />
        <main className="flex-1 lg:ml-64 w-full p-margin-desktop">
          <p className="text-error font-body-md text-body-md">{error}</p>
        </main>
      </div>
    );
  }

  if (!state) {
    return (
      <div className="flex min-h-screen">
        <Sidebar analysisId={analysisId} />
        <main className="flex-1 lg:ml-64 w-full p-margin-desktop">
          <p className="font-body-md text-body-md text-on-surface-variant">Loading...</p>
        </main>
      </div>
    );
  }

  const total = state.gapScores.length;
  const onTrack = state.gapScores.filter((s) => s.gapSize === 0).length;
  const majorGaps = state.gapScores.filter((s) => s.gapSize >= 2).length;
  const minorGaps = state.gapScores.filter((s) => s.gapSize === 1).length;

  return (
    <div className="flex min-h-screen">
      <Sidebar analysisId={analysisId} />
      <main className="flex-1 w-full lg:ml-64 p-margin-mobile md:p-gutter lg:p-margin-desktop max-w-container-max mx-auto">
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <h2 className="font-headline-lg text-headline-lg text-primary">Gap Report</h2>
          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 bg-bg-subtle border border-border-soft rounded-full font-label-md text-label-md text-primary flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-secondary-container" />
              Resume v{state.latestVersion.versionNumber}
            </div>
            <Link
              href={`/start/${analysisId}`}
              className="px-4 py-1.5 bg-secondary text-on-primary rounded-full font-label-md text-label-md hover:bg-opacity-90 transition-colors"
            >
              Update Resume
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-stack-gap">
          <div className="md:col-span-8 flex flex-col gap-stack-gap">
            {state.gapScores.map((skill) => (
              <SkillCard
                key={skill.skillId}
                skill={skill}
                onViewSuggestions={() => setOpenSkill({ skillId: skill.skillId, canonicalName: skill.canonicalName })}
              />
            ))}
          </div>

          <div className="md:col-span-4 flex flex-col gap-stack-gap">
            <div className="bg-bg-subtle border border-border-soft rounded-lg p-card-padding">
              <h3 className="font-headline-sm text-headline-sm text-primary mb-4">Analysis Summary</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-border-soft pb-2">
                  <span className="font-body-md text-body-md text-on-surface-variant">Skills On Track</span>
                  <span className="font-headline-sm text-headline-sm text-primary">
                    {onTrack} of {total}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-border-soft pb-2">
                  <span className="font-body-md text-body-md text-on-surface-variant">Major Gaps</span>
                  <span className="font-body-md text-body-md text-on-tertiary-fixed-variant font-bold px-2 py-0.5 bg-gap-high rounded">
                    {majorGaps}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2">
                  <span className="font-body-md text-body-md text-on-surface-variant">Minor Gaps</span>
                  <span className="font-body-md text-body-md text-primary font-bold px-2 py-0.5 bg-gap-mid rounded">
                    {minorGaps}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {openSkill && (
        <SuggestionsPanel
          resumeVersionId={state.latestVersion.id}
          skillId={openSkill.skillId}
          skillName={openSkill.canonicalName}
          jdDepth={state.gapScores.find((s) => s.skillId === openSkill.skillId)!.jdDepth}
          resumeDepth={state.gapScores.find((s) => s.skillId === openSkill.skillId)!.resumeDepth}
          onClose={() => setOpenSkill(null)}
        />
      )}
    </div>
  );
}
