import { desc, eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { jdSkillRequirements, resumeEvidence, resumeVersions, skills } from "../db/schema.js";
import { extractResumeEvidence } from "../llm/extractResumeEvidence.js";
import { computeGapScoresForVersion, getGapScoresForVersion } from "./gapAnalysis.js";
import { generateSuggestionsForVersion } from "./suggestions.js";
import { computeDeltaCategory, type DeltaCategory } from "../lib/delta.js";

export interface SkillDelta {
  skillId: string;
  canonicalName: string;
  previousGapSize: number;
  currentGapSize: number;
  category: DeltaCategory;
}

/** Task 6.2: all resume versions for an analysis, in submission order. */
export async function getResumeVersions(analysisId: string) {
  return db
    .select()
    .from(resumeVersions)
    .where(eq(resumeVersions.analysisId, analysisId))
    .orderBy(resumeVersions.versionNumber);
}

/**
 * Task 6.1/6.2: submits a new resume version against an existing analysis.
 * Reuses the analysis's already-resolved skill set (task 4.5: stable skill
 * identity across versions) rather than re-running taxonomy resolution -
 * evidence extraction targets the exact same canonical skill names already
 * tied to this analysis's JD requirements.
 */
export async function addResumeVersion(analysisId: string, resumeText: string) {
  const existingVersions = await db
    .select()
    .from(resumeVersions)
    .where(eq(resumeVersions.analysisId, analysisId))
    .orderBy(desc(resumeVersions.versionNumber));

  const nextVersionNumber = (existingVersions[0]?.versionNumber ?? 0) + 1;
  const previousVersion = existingVersions[0];

  const requirements = await db
    .select({ skillId: jdSkillRequirements.skillId, canonicalName: skills.canonicalName })
    .from(jdSkillRequirements)
    .innerJoin(skills, eq(jdSkillRequirements.skillId, skills.id))
    .where(eq(jdSkillRequirements.analysisId, analysisId));
  const skillIdByName = new Map(requirements.map((r) => [r.canonicalName, r.skillId]));

  const [version] = await db
    .insert(resumeVersions)
    .values({ analysisId, versionNumber: nextVersionNumber, resumeText })
    .returning();

  const extraction = await extractResumeEvidence(resumeText, [...skillIdByName.keys()]);
  const evidenceRows = extraction.evidence
    .filter((item) => skillIdByName.has(item.skillName))
    .map((item) => ({
      resumeVersionId: version.id,
      skillId: skillIdByName.get(item.skillName)!,
      evidenceDepth: item.depth,
      evidenceCitation: item.citation,
    }));
  if (evidenceRows.length > 0) {
    await db.insert(resumeEvidence).values(evidenceRows);
  }

  await computeGapScoresForVersion(version.id);
  await generateSuggestionsForVersion(version.id);

  const delta = previousVersion ? await computeDelta(previousVersion.id, version.id) : null;

  return { resumeVersion: version, delta };
}

/**
 * Task 6.3: delta between two consecutive resume versions, keyed by skill
 * (resume-version-tracking spec: "Delta view between consecutive versions").
 */
export async function computeDelta(olderVersionId: string, newerVersionId: string): Promise<SkillDelta[]> {
  const [olderScores, newerScores] = await Promise.all([
    getGapScoresForVersion(olderVersionId),
    getGapScoresForVersion(newerVersionId),
  ]);
  const olderBySkill = new Map(olderScores.map((s) => [s.skillId, s]));

  return newerScores.map((newer) => {
    const older = olderBySkill.get(newer.skillId);
    const previousGapSize = older?.gapSize ?? 0;
    return {
      skillId: newer.skillId,
      canonicalName: newer.canonicalName,
      previousGapSize,
      currentGapSize: newer.gapSize,
      category: computeDeltaCategory(previousGapSize, newer.gapSize),
    };
  });
}

/** Task 6.4: gap scores and suggestions for any prior (or the latest) resume version. */
export { getGapScoresForVersion } from "./gapAnalysis.js";
export { getSuggestionsForVersion } from "./suggestions.js";
