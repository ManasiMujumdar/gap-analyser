import { callStructured } from "./client.js";
import { taxonomyMatchBatchSchema, type TaxonomyMatchBatch } from "./schemas.js";

const SYSTEM = `You maintain a personal taxonomy of skill/competency names for a resume-gap-analysis tool.
Given newly mentioned skills and a list of existing canonical skill names already in the taxonomy, decide for each new mention whether it refers to the SAME underlying competency as one of the existing names (even if phrased differently, e.g. "scalable backend design" and "Distributed Systems Design" are the same underlying competency), or whether it is genuinely distinct and needs a new taxonomy entry.
Be conservative: only match to an existing name if you are confident it is the same underlying competency, not merely a related or adjacent one.`;

/**
 * Task 4.2: matches every newly mentioned skill against the taxonomy in one
 * LLM call rather than one call per skill (rate-limit motivation - see
 * resolveSkillsBatch).
 */
export async function matchTaxonomyBatch(
  newSkillNames: string[],
  existingCanonicalNames: string[],
): Promise<TaxonomyMatchBatch> {
  if (newSkillNames.length === 0) {
    return { matches: [] };
  }
  if (existingCanonicalNames.length === 0) {
    return { matches: newSkillNames.map((newSkillName) => ({ newSkillName, matchedCanonicalName: null })) };
  }

  return callStructured({
    schema: taxonomyMatchBatchSchema,
    toolName: "record_taxonomy_matches",
    toolDescription: "Records, for each newly mentioned skill, whether it matches an existing taxonomy entry",
    system: SYSTEM,
    prompt: `New skill mentions:\n${newSkillNames.map((name) => `- ${name}`).join("\n")}\n\nExisting canonical skill names:\n${existingCanonicalNames
      .map((name) => `- ${name}`)
      .join("\n")}`,
  });
}
