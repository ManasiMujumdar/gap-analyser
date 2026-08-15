"use client";

import { use, useEffect, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { SkillCard } from "@/components/SkillCard";
import { SuggestionsPanel } from "@/components/SuggestionsPanel";
import { rememberAnalysisId } from "@/lib/analysisStorage";
import type { DeltaCategory, GapScoreDto, SkillDeltaDto } from "@/lib/types";

interface TimelineEntry {
  version: { id: string; versionNumber: number; createdAt: string };
  deltaFromPrevious: SkillDeltaDto[] | null;
}

const CHIP_LABEL: Record<DeltaCategory, string> = {
  gap_closed: "Closed",
  gap_narrowed: "Improved",
  gap_unchanged: "No change",
  gap_widened: "Got worse",
  new_gap: "New gap",
};

const CHIP_CLASS: Record<DeltaCategory, string> = {
  gap_closed: "bg-success-muted/10 text-success-muted",
  gap_narrowed: "bg-success-muted/10 text-success-muted",
  gap_unchanged: "bg-bg-subtle text-on-surface-variant border border-border-soft",
  gap_widened: "bg-gap-high/40 text-on-tertiary-fixed-variant",
  new_gap: "bg-gap-high/40 text-on-tertiary-fixed-variant",
};

function deltaCounts(delta: SkillDeltaDto[]): Partial<Record<DeltaCategory, number>> {
  const counts: Partial<Record<DeltaCategory, number>> = {};
  for (const d of delta) counts[d.category] = (counts[d.category] ?? 0) + 1;
  return counts;
}

/** Task 7.1/7.2/7.3: Version timeline screen. */
export default function TimelinePage({ params }: { params: Promise<{ analysisId: string }> }) {
  const { analysisId } = use(params);

  const [timeline, setTimeline] = useState<TimelineEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedVersionId, setExpandedVersionId] = useState<string | null>(null);
  const [expandedGapScores, setExpandedGapScores] = useState<GapScoreDto[] | null>(null);
  const [openSkill, setOpenSkill] = useState<{
    resumeVersionId: string;
    skillId: string;
    canonicalName: string;
    jdDepth: GapScoreDto["jdDepth"];
    resumeDepth: GapScoreDto["resumeDepth"];
  } | null>(null);

  useEffect(() => {
    rememberAnalysisId(analysisId);
    fetch(`/api/analyses/${analysisId}/timeline`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Couldn't find that analysis.");
        return res.json();
      })
      .then((body) => setTimeline(body.timeline))
      .catch((err) => setError(err instanceof Error ? err.message : "Something went wrong."));
  }, [analysisId]);

  /** Task 7.4: expanding a version fetches that version's own gap state, not the latest. */
  async function toggleExpand(versionId: string) {
    if (expandedVersionId === versionId) {
      setExpandedVersionId(null);
      setExpandedGapScores(null);
      return;
    }
    setExpandedVersionId(versionId);
    setExpandedGapScores(null);
    const res = await fetch(`/api/resume-versions/${versionId}/gap-scores`);
    const body = await res.json();
    setExpandedGapScores(body.gapScores);
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar analysisId={analysisId} />
      <main className="flex-1 lg:ml-64 w-full px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto py-8 lg:py-12">
        <div className="mb-12">
          <h2 className="font-headline-lg text-headline-lg text-primary mb-2">Resume Evolution</h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
            Track your progress as you address skill gaps.
          </p>
        </div>

        {error && <p className="text-error font-body-md text-body-md">{error}</p>}
        {!timeline && !error && <p className="font-body-md text-body-md text-on-surface-variant">Loading...</p>}

        <div className="flex flex-col gap-stack-gap max-w-3xl">
          {timeline?.map((entry) => {
            const counts = entry.deltaFromPrevious ? deltaCounts(entry.deltaFromPrevious) : null;
            const isExpanded = expandedVersionId === entry.version.id;

            return (
              <div
                key={entry.version.id}
                className="bg-surface-container-lowest border border-border-soft rounded-xl p-card-padding"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
                  <div>
                    <h3 className="font-headline-sm text-headline-sm text-primary">
                      Version {entry.version.versionNumber}
                    </h3>
                    <p className="font-body-md text-body-md text-on-surface-variant">
                      {new Date(entry.version.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="flex items-center gap-1 text-secondary font-label-md text-label-md hover:bg-bg-subtle py-2 px-3 rounded transition-colors"
                    onClick={() => toggleExpand(entry.version.id)}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {isExpanded ? "expand_less" : "expand_more"}
                    </span>
                    {isExpanded ? "Hide" : "View"} Gaps
                  </button>
                </div>

                {counts ? (
                  <div className="flex flex-wrap gap-2">
                    {(Object.entries(counts) as [DeltaCategory, number][]).map(([category, count]) => (
                      <span key={category} className={`chip px-3 py-1 rounded-full font-label-md text-label-md ${CHIP_CLASS[category]}`}>
                        {count} {CHIP_LABEL[category]}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="font-body-md text-body-md text-on-surface-variant italic">
                    Starting point. No comparison available.
                  </p>
                )}

                {isExpanded && (
                  <div className="mt-6 pt-6 border-t border-border-soft flex flex-col gap-stack-gap">
                    {!expandedGapScores && (
                      <p className="font-body-md text-body-md text-on-surface-variant">Loading...</p>
                    )}
                    {expandedGapScores?.map((skill) => (
                      <SkillCard
                        key={skill.skillId}
                        skill={skill}
                        onViewSuggestions={() =>
                          setOpenSkill({
                            resumeVersionId: entry.version.id,
                            skillId: skill.skillId,
                            canonicalName: skill.canonicalName,
                            jdDepth: skill.jdDepth,
                            resumeDepth: skill.resumeDepth,
                          })
                        }
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>

      {openSkill && (
        <SuggestionsPanel
          resumeVersionId={openSkill.resumeVersionId}
          skillId={openSkill.skillId}
          skillName={openSkill.canonicalName}
          jdDepth={openSkill.jdDepth}
          resumeDepth={openSkill.resumeDepth}
          onClose={() => setOpenSkill(null)}
        />
      )}
    </div>
  );
}
