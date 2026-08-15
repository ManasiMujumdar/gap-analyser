import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { gapScores, jdSkillRequirements, resumeEvidence, resumeVersions, skills } from "../db/schema.js";
import { buildGapScore } from "../lib/rubric.js";

/**
 * Task 4.3-4.4: computes and stores a GapScore row for every skill required
 * by the resume version's analysis, using whatever resume evidence exists
 * for that version (skill-gap-analysis spec: "Depth gap scoring",
 * "Evidence-backed gap scores", "No evidence at all").
 *
 * Skill identity is already stable by this point (task 4.5): both the JD
 * requirements and the resume evidence for this analysis were resolved
 * against the same taxonomy entries during intake/versioning, so this
 * function only needs to join on skillId.
 */
export async function computeGapScoresForVersion(resumeVersionId: string): Promise<void> {
  const [version] = await db
    .select()
    .from(resumeVersions)
    .where(eq(resumeVersions.id, resumeVersionId));
  if (!version) {
    throw new Error(`Resume version ${resumeVersionId} not found`);
  }

  const requirements = await db
    .select()
    .from(jdSkillRequirements)
    .where(eq(jdSkillRequirements.analysisId, version.analysisId));

  const evidenceRows = await db
    .select()
    .from(resumeEvidence)
    .where(eq(resumeEvidence.resumeVersionId, resumeVersionId));
  const evidenceBySkillId = new Map(evidenceRows.map((e) => [e.skillId, e]));

  const rows = requirements.map((req) => {
    const evidence = evidenceBySkillId.get(req.skillId);
    const score = buildGapScore({
      jdDepth: req.jdDepth,
      jdCitation: req.jdCitation,
      resumeDepth: evidence?.evidenceDepth ?? null,
      resumeCitation: evidence?.evidenceCitation ?? null,
    });
    return {
      resumeVersionId,
      skillId: req.skillId,
      jdDepth: score.jdDepth,
      jdCitation: score.jdCitation,
      resumeDepth: score.resumeDepth,
      resumeCitation: score.resumeCitation,
      gapSize: score.gapSize,
    };
  });

  if (rows.length > 0) {
    await db.insert(gapScores).values(rows);
  }
}

/**
 * Task 6.4 / application-dashboard spec: retrieves the gap scores recorded
 * for a specific resume version (latest or a prior one), with skill names
 * resolved for display.
 */
export async function getGapScoresForVersion(resumeVersionId: string) {
  return db
    .select({
      skillId: gapScores.skillId,
      canonicalName: skills.canonicalName,
      jdDepth: gapScores.jdDepth,
      jdCitation: gapScores.jdCitation,
      resumeDepth: gapScores.resumeDepth,
      resumeCitation: gapScores.resumeCitation,
      gapSize: gapScores.gapSize,
    })
    .from(gapScores)
    .innerJoin(skills, eq(gapScores.skillId, skills.id))
    .where(eq(gapScores.resumeVersionId, resumeVersionId));
}
