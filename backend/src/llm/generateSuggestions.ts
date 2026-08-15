import { callStructured } from "./client.js";
import { suggestionGenerationSchema, type DepthLevel, type SuggestionGeneration } from "./schemas.js";

const SYSTEM = `You write improvement suggestions for a candidate preparing for a specific job, for a resume-gap-analysis tool.
You are given one skill where the candidate's resume falls short of what the job description implies it wants, on a depth rubric of aware < used < owned < led.
Produce exactly three distinct kinds of suggestions:
1. resumeRewrite: if the candidate has existing resume evidence for this skill, propose a rewritten version of that evidence that better demonstrates the target depth, grounded in what they actually did (do not invent accomplishments). If there is no existing evidence, propose how they might phrase a bullet point once they have something to describe.
2. portfolioAddition: describe one concrete, realistically scoped project or piece of experience the candidate could pursue to genuinely demonstrate the target depth.
3. talkingPointNarrative: a STAR-shaped (Situation, Task, Action, Result) scaffold the candidate could adapt to describe relevant experience verbally in an interview, even if their resume doesn't fully capture it.
Be specific to the skill and depth gap given, not generic.`;

/** Tasks 5.1-5.3: generates all three suggestion types for one skill gap. */
export async function generateSuggestions(params: {
  skillName: string;
  jdDepth: DepthLevel;
  jdCitation: string;
  resumeDepth: DepthLevel | null;
  resumeCitation: string | null;
}): Promise<SuggestionGeneration> {
  const { skillName, jdDepth, jdCitation, resumeDepth, resumeCitation } = params;

  const evidenceDescription =
    resumeDepth && resumeCitation
      ? `The resume demonstrates "${resumeDepth}" depth for this skill, via: "${resumeCitation}"`
      : "The resume has no evidence at all for this skill.";

  const prompt = `Skill: ${skillName}
Job description wants "${jdDepth}" depth, based on: "${jdCitation}"
${evidenceDescription}`;

  return callStructured({
    schema: suggestionGenerationSchema,
    toolName: "record_suggestions",
    toolDescription: "Records the three improvement suggestions (resume rewrite, portfolio addition, talking-point narrative) for a skill gap",
    system: SYSTEM,
    prompt,
  });
}
