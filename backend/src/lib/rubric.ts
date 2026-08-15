import { DEPTH_ORDINAL, type DepthLevel, type GapScoreResult } from "../llm/schemas.js";

/**
 * Ordinal used for a skill with no resume evidence at all: one below the
 * lowest real depth level, so its computed gap always exceeds the gap of any
 * skill that does have evidence (jd-resume-intake spec: "no evidence found"
 * scenario; skill-gap-analysis spec: "No evidence at all" scenario).
 */
const NO_EVIDENCE_ORDINAL = -1;

/** Task 4.3: rubric-ordered difference between JD-implied and resume-evidence depth. */
export function computeGapSize(
  jdDepth: DepthLevel,
  resumeDepth: DepthLevel | null,
): number {
  const resumeOrdinal = resumeDepth === null ? NO_EVIDENCE_ORDINAL : DEPTH_ORDINAL[resumeDepth];
  return Math.max(0, DEPTH_ORDINAL[jdDepth] - resumeOrdinal);
}

export function buildGapScore(params: {
  jdDepth: DepthLevel;
  jdCitation: string;
  resumeDepth: DepthLevel | null;
  resumeCitation: string | null;
}): GapScoreResult {
  return {
    ...params,
    gapSize: computeGapSize(params.jdDepth, params.resumeDepth),
  };
}
