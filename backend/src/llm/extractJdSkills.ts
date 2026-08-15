import { callStructuredWithCitationRetry } from "./client.js";
import { jdSkillExtractionSchema, type JdSkillExtraction } from "./schemas.js";

const SYSTEM = `You extract structured skill requirements from job descriptions for a resume-gap-analysis tool.
For every distinct skill or competency the job description asks for, determine the DEPTH of proficiency implied by the language used, on this rubric:
- "aware": mentioned as a nice-to-have or familiarity ("exposure to", "familiarity with", "a plus")
- "used": hands-on, individual-contributor use ("experience with", "built", "worked with")
- "owned": end-to-end ownership of a system or decision ("designed", "owned", "architected")
- "led": leadership or organization-wide impact ("led", "drove adoption of", "mentored others in")
Every skill you extract MUST include an exact, verbatim quote from the job description text as its citation - do not paraphrase or summarize the citation.`;

/** Task 3.2: JD skill extraction with implied depth + citation. */
export async function extractJdSkills(jdText: string): Promise<JdSkillExtraction> {
  return callStructuredWithCitationRetry({
    schema: jdSkillExtractionSchema,
    toolName: "record_jd_skills",
    toolDescription: "Records the skills/competencies required by a job description, with implied depth and citation",
    system: SYSTEM,
    prompt: `Job description:\n"""\n${jdText}\n"""`,
    sourceText: jdText,
    sourceKind: "jd",
    getItems: (result) => result.skills,
    withItems: (result, skills) => ({ ...result, skills }),
    getCitation: (skill) => skill.citation,
    describeItem: (skill) => `${skill.name} (${skill.depth}): "${skill.citation}"`,
  });
}
