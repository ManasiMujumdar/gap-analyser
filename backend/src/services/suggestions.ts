import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { gapScores, skills, suggestions } from "../db/schema.js";
import { generateSuggestionsBatch } from "../llm/generateSuggestions.js";

/**
 * Tasks 5.1-5.5: generates and stores the three suggestion types for every
 * skill with a gap on this resume version, skipping skills with no gap
 * (improvement-suggestions spec: "Three suggestion types per gap"). Always
 * inserts new rows scoped to this resumeVersionId rather than mutating any
 * other version's suggestions (spec: "Suggestions are versioned, not
 * overwritten").
 */
export async function generateSuggestionsForVersion(resumeVersionId: string): Promise<void> {
  const gapped = await db
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

  const gapsNeedingSuggestions = gapped.filter((gap) => gap.gapSize > 0);
  if (gapsNeedingSuggestions.length === 0) return;

  // One LLM call for every gap on this version, not one per gap (rate-limit
  // motivation - see generateSuggestionsBatch).
  const generated = await generateSuggestionsBatch(
    gapsNeedingSuggestions.map((gap) => ({
      skillName: gap.canonicalName,
      jdDepth: gap.jdDepth,
      jdCitation: gap.jdCitation,
      resumeDepth: gap.resumeDepth,
      resumeCitation: gap.resumeCitation,
    })),
  );

  const rows: (typeof suggestions.$inferInsert)[] = [];
  for (const gap of gapsNeedingSuggestions) {
    const suggestion = generated.suggestions.find((s) => s.skillName === gap.canonicalName);
    if (!suggestion) {
      console.warn(`No batch suggestion returned for skill "${gap.canonicalName}" - skipping.`);
      continue;
    }

    rows.push(
      {
        resumeVersionId,
        skillId: gap.skillId,
        type: "resume_rewrite",
        content: suggestion.resumeRewrite,
      },
      {
        resumeVersionId,
        skillId: gap.skillId,
        type: "portfolio_addition",
        content: suggestion.portfolioAddition,
      },
      {
        resumeVersionId,
        skillId: gap.skillId,
        type: "talking_point_narrative",
        content: JSON.stringify(suggestion.talkingPointNarrative),
      },
    );
  }

  if (rows.length > 0) {
    await db.insert(suggestions).values(rows);
  }
}

/**
 * Task 6.4 / application-dashboard spec: retrieves the suggestions recorded
 * for a specific resume version (latest or a prior one), unaffected by any
 * later version's suggestions.
 */
export async function getSuggestionsForVersion(resumeVersionId: string) {
  return db
    .select({
      skillId: suggestions.skillId,
      canonicalName: skills.canonicalName,
      type: suggestions.type,
      content: suggestions.content,
    })
    .from(suggestions)
    .innerJoin(skills, eq(suggestions.skillId, skills.id))
    .where(eq(suggestions.resumeVersionId, resumeVersionId));
}
