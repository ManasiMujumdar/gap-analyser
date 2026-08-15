import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { analyses } from "../db/schema.js";
import { getGapScoresForVersion } from "./gapAnalysis.js";
import { getSuggestionsForVersion } from "./suggestions.js";
import { getResumeVersions, computeDelta, type SkillDelta } from "./versioning.js";

/**
 * Read-only lookup of an analysis's own record (currently just its JD text)
 * - added for frontend-integration's intake-screen, which needs to display
 * an existing analysis's job description read-only without re-deriving it
 * from gap state.
 */
export async function getAnalysis(analysisId: string) {
  const [analysis] = await db.select().from(analyses).where(eq(analyses.id, analysisId));
  return analysis ?? null;
}

/**
 * All functions in this module are read-only queries over already-persisted
 * state (task 7.4, application-dashboard spec: "Persistent cross-session
 * state") - none of them call the LLM or write to the database, so a
 * candidate returning in a later session sees unchanged state until they
 * explicitly submit a new resume version.
 */

/** Task 7.1: current gap state - latest resume version's full skill list with status and citations. */
export async function getCurrentGapState(analysisId: string) {
  const versions = await getResumeVersions(analysisId);
  const latest = versions.at(-1);
  if (!latest) return { latestVersion: null, gapScores: [] };

  const gapScoresForLatest = await getGapScoresForVersion(latest.id);
  return { latestVersion: latest, gapScores: gapScoresForLatest };
}

export interface VersionTimelineEntry {
  version: Awaited<ReturnType<typeof getResumeVersions>>[number];
  deltaFromPrevious: SkillDelta[] | null;
}

/** Task 7.2: all resume versions in order, each with a delta summary vs. the previous version. */
export async function getVersionTimeline(analysisId: string): Promise<VersionTimelineEntry[]> {
  const versions = await getResumeVersions(analysisId);

  const timeline: VersionTimelineEntry[] = [];
  for (let i = 0; i < versions.length; i++) {
    const previous = versions[i - 1];
    const deltaFromPrevious = previous ? await computeDelta(previous.id, versions[i].id) : null;
    timeline.push({ version: versions[i], deltaFromPrevious });
  }
  return timeline;
}

/** Task 7.3: suggestions recorded for any given resume version (latest or historical). */
export async function getSuggestionHistory(resumeVersionId: string) {
  return getSuggestionsForVersion(resumeVersionId);
}
