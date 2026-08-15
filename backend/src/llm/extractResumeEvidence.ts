import { callStructuredWithCitationRetry } from "./client.js";
import { resumeEvidenceExtractionSchema, type ResumeEvidenceExtraction } from "./schemas.js";

const SYSTEM = `You extract evidence of specific skills from a resume for a resume-gap-analysis tool.
You will be given a resume and a list of target skill names. For each target skill that the resume provides evidence for, determine the DEPTH demonstrated, on this rubric:
- "aware": the skill is merely mentioned (e.g. a skills list) with no demonstrated use
- "used": hands-on, individual-contributor use ("built", "implemented", "worked with")
- "owned": end-to-end ownership of a system or decision ("designed", "owned", "architected")
- "led": leadership or organization-wide impact ("led", "mentored", "drove adoption of")
Only include a skill in your output if the resume actually provides evidence for it - do not guess or include skills with no supporting text.
Every entry you extract MUST include an exact, verbatim quote from the resume text as its citation - do not paraphrase or summarize the citation.
The "skillName" field must exactly match one of the target skill names provided.`;

/** Task 3.4: resume evidence extraction with demonstrated depth + citation, or absence when no evidence exists. */
export async function extractResumeEvidence(
  resumeText: string,
  targetSkillNames: string[],
): Promise<ResumeEvidenceExtraction> {
  return callStructuredWithCitationRetry({
    schema: resumeEvidenceExtractionSchema,
    toolName: "record_resume_evidence",
    toolDescription: "Records evidence found in a resume for a set of target skills, with demonstrated depth and citation",
    system: SYSTEM,
    prompt: `Target skills:\n${targetSkillNames.map((name) => `- ${name}`).join("\n")}\n\nResume:\n"""\n${resumeText}\n"""`,
    sourceText: resumeText,
    sourceKind: "resume",
    getItems: (result) => result.evidence,
    withItems: (result, evidence) => ({ ...result, evidence }),
    getCitation: (item) => item.citation,
    describeItem: (item) => `${item.skillName} (${item.depth}): "${item.citation}"`,
  });
}
