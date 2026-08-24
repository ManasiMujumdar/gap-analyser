import { z } from "zod";

/** Shared depth rubric (design.md Decision #1): aware < used < owned < led. */
export const depthLevelSchema = z.enum(["aware", "used", "owned", "led"]);
export type DepthLevel = z.infer<typeof depthLevelSchema>;

export const DEPTH_ORDINAL: Record<DepthLevel, number> = {
  aware: 0,
  used: 1,
  owned: 2,
  led: 3,
};

/** Contract 1: JD skill extraction (task 2.1, task 3.2). */
export const jdSkillExtractionSchema = z.object({
  skills: z.array(
    z.object({
      name: z
        .string()
        .min(1)
        .describe("Concise skill/competency name, phrased as it would appear in a taxonomy (e.g. 'Distributed Systems Design')"),
      depth: depthLevelSchema.describe(
        "Depth level implied by the JD's phrasing for this skill",
      ),
      citation: z
        .string()
        .min(1)
        .describe("Exact verbatim substring copied from the job description text that supports this depth level"),
    }),
  ),
});
export type JdSkillExtraction = z.infer<typeof jdSkillExtractionSchema>;

/** Contract 2: resume evidence extraction (task 2.1, task 3.4). */
export const resumeEvidenceExtractionSchema = z.object({
  evidence: z.array(
    z.object({
      skillName: z
        .string()
        .min(1)
        .describe("Must exactly match one of the requested target skill names"),
      depth: depthLevelSchema.describe(
        "Depth level demonstrated by the resume's content for this skill",
      ),
      citation: z
        .string()
        .min(1)
        .describe("Exact verbatim substring copied from the resume text that supports this depth level"),
    }),
  ),
});
export type ResumeEvidenceExtraction = z.infer<typeof resumeEvidenceExtractionSchema>;

/**
 * Contract 3: growing-taxonomy matching (task 2.1, task 4.2) - matches every
 * newly-mentioned skill from one
 * analysis against the taxonomy in a single LLM call, instead of one call
 * per skill. Introduced after live testing showed the free-tier Gemini rate
 * limit (5 req/min) being tripped by the per-skill call pattern once the
 * taxonomy grew large enough that most skills needed a match check.
 */
export const taxonomyMatchBatchSchema = z.object({
  matches: z.array(
    z.object({
      newSkillName: z.string().min(1).describe("Must exactly match one of the provided new skill names"),
      matchedCanonicalName: z
        .string()
        .nullable()
        .describe(
          "One of the provided existing canonical skill names if it represents the same underlying competency, otherwise null to create a new taxonomy entry",
        ),
    }),
  ),
});
export type TaxonomyMatchBatch = z.infer<typeof taxonomyMatchBatchSchema>;

/**
 * Gap scoring "contract" (task 2.1) is deterministic, not LLM-called: a gap
 * score is the rubric-ordinal difference between already-extracted JD and
 * resume depths (design.md Decision #1). See src/lib/rubric.ts.
 */
export interface GapScoreResult {
  jdDepth: DepthLevel;
  jdCitation: string;
  resumeDepth: DepthLevel | null;
  resumeCitation: string | null;
  gapSize: number;
}

/**
 * Contract 5: suggestion generation (task 2.1, tasks 5.1-5.3) - generates
 * suggestions for every gapped skill on a resume version in one LLM call,
 * instead of one call per gap. Same rate-limit motivation as
 * taxonomyMatchBatchSchema above.
 */
export const suggestionGenerationBatchSchema = z.object({
  suggestions: z.array(
    z.object({
      skillName: z.string().min(1).describe("Must exactly match one of the provided skill names"),
      resumeRewrite: z
        .string()
        .min(1)
        .describe(
          "Proposed rewritten resume wording that better demonstrates the JD-implied depth, grounded in the existing resume citation when one exists",
        ),
      portfolioAddition: z
        .string()
        .min(1)
        .describe("A concrete, scoped project or experience the candidate could pursue to demonstrate the JD-implied depth"),
      talkingPointNarrative: z.object({
        situation: z.string().min(1),
        task: z.string().min(1),
        action: z.string().min(1),
        result: z.string().min(1),
      }),
    }),
  ),
});
export type SuggestionGenerationBatch = z.infer<typeof suggestionGenerationBatchSchema>;
