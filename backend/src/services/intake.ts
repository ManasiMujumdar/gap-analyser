import { db } from "../db/client.js";
import { analyses, jdSkillRequirements, resumeEvidence, resumeVersions } from "../db/schema.js";
import { extractJdSkills } from "../llm/extractJdSkills.js";
import { extractResumeEvidence } from "../llm/extractResumeEvidence.js";
import { resolveSkillsBatch } from "./taxonomy.js";
import { computeGapScoresForVersion } from "./gapAnalysis.js";
import { generateSuggestionsForVersion } from "./suggestions.js";

/**
 * Task 3.1/3.2: submits a job description and extracts its per-skill
 * requirements (implied depth + citation). Kept as a standalone step so
 * intake can be composed with createAnalysis below.
 */
export async function submitJobDescription(jdText: string) {
  return extractJdSkills(jdText);
}

/**
 * Task 3.3/3.4: submits a resume and extracts evidence for a set of target
 * skill names (implied depth + citation, or absence when not found).
 */
export async function submitResume(resumeText: string, targetSkillNames: string[]) {
  return extractResumeEvidence(resumeText, targetSkillNames);
}

/**
 * Task 3.5: creates a new Analysis from a JD + initial resume - extracts JD
 * skill requirements, resolves each against the growing taxonomy, records
 * the first resume version (version 1) with its extracted evidence, and
 * computes its initial gap scores (jd-resume-intake spec: "Intake creates a
 * new analysis").
 */
export async function createAnalysis(jdText: string, resumeText: string) {
  const jdExtraction = await submitJobDescription(jdText);
  const targetSkillNames = jdExtraction.skills.map((s) => s.name);

  const [analysis] = await db.insert(analyses).values({ jdText }).returning();

  // Taxonomy matching and resume-evidence extraction both only depend on
  // jdExtraction's skill names, not on each other, so they run concurrently
  // rather than sequentially - meaningfully cuts wall-clock time (and means
  // a rate-limit retry on one doesn't block the other), which matters given
  // Vercel's serverless function timeout on this route.
  const [resolvedByName, resumeExtraction] = await Promise.all([
    resolveSkillsBatch(targetSkillNames),
    submitResume(resumeText, targetSkillNames),
  ]);
  const skillIdByName = new Map([...resolvedByName].map(([name, resolved]) => [name, resolved.id]));

  if (jdExtraction.skills.length > 0) {
    await db.insert(jdSkillRequirements).values(
      jdExtraction.skills.map((jdSkill) => ({
        analysisId: analysis.id,
        skillId: skillIdByName.get(jdSkill.name)!,
        jdDepth: jdSkill.depth,
        jdCitation: jdSkill.citation,
      })),
    );
  }

  const [version] = await db
    .insert(resumeVersions)
    .values({ analysisId: analysis.id, versionNumber: 1, resumeText })
    .returning();

  const evidenceRows = resumeExtraction.evidence
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

  return { analysis, resumeVersion: version };
}
