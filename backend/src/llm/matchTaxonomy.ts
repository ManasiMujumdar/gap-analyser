import { callStructured } from "./client.js";
import { taxonomyMatchSchema, type TaxonomyMatch } from "./schemas.js";

const SYSTEM = `You maintain a personal taxonomy of skill/competency names for a resume-gap-analysis tool.
Given a newly mentioned skill and a list of existing canonical skill names already in the taxonomy, decide whether the new mention refers to the SAME underlying competency as one of the existing names (even if phrased differently, e.g. "scalable backend design" and "Distributed Systems Design" are the same underlying competency), or whether it is genuinely distinct and needs a new taxonomy entry.
Be conservative: only match to an existing name if you are confident it is the same underlying competency, not merely a related or adjacent one.`;

/** Task 4.2: match a newly extracted skill mention against the growing taxonomy. */
export async function matchTaxonomy(
  newSkillName: string,
  existingCanonicalNames: string[],
): Promise<TaxonomyMatch> {
  if (existingCanonicalNames.length === 0) {
    return { matchedCanonicalName: null };
  }

  return callStructured({
    schema: taxonomyMatchSchema,
    toolName: "record_taxonomy_match",
    toolDescription: "Records whether a newly mentioned skill matches an existing taxonomy entry",
    system: SYSTEM,
    prompt: `New skill mention: "${newSkillName}"\n\nExisting canonical skill names:\n${existingCanonicalNames
      .map((name) => `- ${name}`)
      .join("\n")}`,
  });
}
