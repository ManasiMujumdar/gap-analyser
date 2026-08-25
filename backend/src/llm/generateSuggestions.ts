import { callStructured } from "./client.js";
import { suggestionGenerationBatchSchema, type DepthLevel, type SuggestionGenerationBatch } from "./schemas.js";

const BATCH_SYSTEM = `You write improvement suggestions for a candidate preparing for a specific job, for a resume-gap-analysis tool.
You will be given several skill gaps at once (from the same resume/JD pair) - each one a skill where the candidate's resume falls short of what the job description implies it wants, on a depth rubric of aware < used < owned < led.
For EACH gap, produce exactly three distinct kinds of suggestions, keeping them specific to that individual skill - do not blend or generalize across skills:
1. resumeRewrite: if the candidate has existing resume evidence for this skill, propose a rewritten version of that evidence that better demonstrates the target depth, grounded in what they actually did (do not invent accomplishments). If there is no existing evidence, propose how they might phrase a bullet point once they have something to describe.
2. portfolioAddition: describe one concrete, realistically scoped project or piece of experience the candidate could pursue to genuinely demonstrate the target depth. Some gaps will list other skills the candidate has already demonstrated elsewhere on their resume - when one of those is a genuinely sensible fit (a tool, domain, or type of work relevant to the target depth), prefer building the suggestion on it rather than defaulting to an unrelated generic recommendation. Do not force a connection that isn't a real fit.
3. talkingPointNarrative: a STAR-shaped (Situation, Task, Action, Result) scaffold the candidate could adapt to describe relevant experience verbally in an interview, even if their resume doesn't fully capture it.`;

/**
 * Tasks 5.1-5.3: generates all three suggestion types for every gapped skill
 * on a resume version in one LLM call rather than one call per gap
 * (rate-limit motivation - see matchTaxonomyBatch).
 *
 * demonstratedSkillset (resume-aware-suggestions): every other skill on this
 * resume version with recorded evidence, so portfolio-addition suggestions
 * can build on tools/domains the candidate already knows rather than
 * guessing generic ones. Naturally empty when there's little other evidence
 * yet - the prompt degrades to today's per-skill-only grounding.
 */
export async function generateSuggestionsBatch(
  gaps: Array<{
    skillName: string;
    jdDepth: DepthLevel;
    jdCitation: string;
    resumeDepth: DepthLevel | null;
    resumeCitation: string | null;
  }>,
  demonstratedSkillset: Array<{ skillName: string; depth: DepthLevel; citation: string }> = [],
): Promise<SuggestionGenerationBatch> {
  if (gaps.length === 0) return { suggestions: [] };

  const prompt = gaps
    .map((gap, i) => {
      const evidenceDescription =
        gap.resumeDepth && gap.resumeCitation
          ? `The resume demonstrates "${gap.resumeDepth}" depth for this skill, via: "${gap.resumeCitation}"`
          : "The resume has no evidence at all for this skill.";

      const otherSkills = demonstratedSkillset.filter((s) => s.skillName !== gap.skillName);
      const skillsetSection =
        otherSkills.length > 0
          ? `\nThe candidate's resume also demonstrates these other skills (consider for the portfolio addition suggestion, only if genuinely relevant):\n${otherSkills
              .map((s) => `- ${s.skillName} (${s.depth}), via: "${s.citation}"`)
              .join("\n")}`
          : "";

      return `Gap ${i + 1}:
Skill: ${gap.skillName}
Job description wants "${gap.jdDepth}" depth, based on: "${gap.jdCitation}"
${evidenceDescription}${skillsetSection}`;
    })
    .join("\n\n");

  return callStructured({
    schema: suggestionGenerationBatchSchema,
    toolName: "record_suggestions_batch",
    toolDescription: "Records the three improvement suggestions for each of several skill gaps",
    system: BATCH_SYSTEM,
    prompt,
  });
}
