import { beforeEach, describe, expect, it, vi } from "vitest";
import { analyses, jdSkillRequirements, resumeEvidence, resumeVersions } from "../src/db/schema.js";

const state = {
  jdSkillRequirements: [] as any[],
  resumeEvidence: [] as any[],
};

vi.mock("../src/db/client.js", () => ({
  db: {
    insert: (table: unknown) => ({
      values: (rows: unknown) => {
        const rowsArr = Array.isArray(rows) ? rows : [rows];
        if (table === analyses) {
          return { returning: () => Promise.resolve([{ id: "analysis-1" }]) };
        }
        if (table === jdSkillRequirements) {
          state.jdSkillRequirements.push(...rowsArr);
          return Promise.resolve();
        }
        if (table === resumeVersions) {
          const values = rowsArr[0] as { resumeText: string };
          return {
            returning: () =>
              Promise.resolve([{ id: "version-1", analysisId: "analysis-1", versionNumber: 1, resumeText: values.resumeText }]),
          };
        }
        if (table === resumeEvidence) {
          state.resumeEvidence.push(...rowsArr);
          return Promise.resolve();
        }
        throw new Error("unexpected insert table in test mock");
      },
    }),
  },
}));

const extractJdSkills = vi.fn();
vi.mock("../src/llm/extractJdSkills.js", () => ({ extractJdSkills: (...args: unknown[]) => extractJdSkills(...args) }));

const extractResumeEvidence = vi.fn(async () => ({ evidence: [] }));
vi.mock("../src/llm/extractResumeEvidence.js", () => ({
  extractResumeEvidence: (...args: unknown[]) => extractResumeEvidence(...args),
}));

const resolveSkillsBatch = vi.fn();
vi.mock("../src/services/taxonomy.js", () => ({ resolveSkillsBatch: (...args: unknown[]) => resolveSkillsBatch(...args) }));

const computeGapScoresForVersion = vi.fn(async () => {});
vi.mock("../src/services/gapAnalysis.js", () => ({
  computeGapScoresForVersion: (...args: unknown[]) => computeGapScoresForVersion(...args),
}));

const generateSuggestionsForVersion = vi.fn(async () => {});
vi.mock("../src/services/suggestions.js", () => ({
  generateSuggestionsForVersion: (...args: unknown[]) => generateSuggestionsForVersion(...args),
}));

const { createAnalysis } = await import("../src/services/intake.js");

describe("createAnalysis (jd-resume-intake spec) - taxonomy-collision dedup", () => {
  beforeEach(() => {
    state.jdSkillRequirements = [];
    state.resumeEvidence = [];
    extractJdSkills.mockReset();
    extractResumeEvidence.mockReset().mockResolvedValue({ evidence: [] });
    resolveSkillsBatch.mockReset();
    computeGapScoresForVersion.mockClear();
    generateSuggestionsForVersion.mockClear();
  });

  it("collapses two distinct JD skill names that resolve to the same canonical skill into one row, keeping the higher depth", async () => {
    extractJdSkills.mockResolvedValue({
      skills: [
        { name: "A/B Testing", depth: "owned", citation: "owned end-to-end A/B testing" },
        { name: "Experimentation Design", depth: "used", citation: "experience with experimentation design" },
      ],
    });
    resolveSkillsBatch.mockResolvedValue(
      new Map([
        ["A/B Testing", { id: "skill-1", canonicalName: "A/B Testing" }],
        ["Experimentation Design", { id: "skill-1", canonicalName: "A/B Testing" }],
      ]),
    );

    await createAnalysis("some jd text", "some resume text");

    expect(state.jdSkillRequirements).toHaveLength(1);
    expect(state.jdSkillRequirements[0]).toMatchObject({
      analysisId: "analysis-1",
      skillId: "skill-1",
      jdDepth: "owned",
      jdCitation: "owned end-to-end A/B testing",
    });
  });

  it("inserts one row per JD skill when they resolve to distinct canonical skills (no collision)", async () => {
    extractJdSkills.mockResolvedValue({
      skills: [
        { name: "SQL", depth: "used", citation: "experience with SQL" },
        { name: "Budget Management", depth: "owned", citation: "owned campaign budgets" },
      ],
    });
    resolveSkillsBatch.mockResolvedValue(
      new Map([
        ["SQL", { id: "skill-sql", canonicalName: "SQL" }],
        ["Budget Management", { id: "skill-budget", canonicalName: "Budget Management" }],
      ]),
    );

    await createAnalysis("some jd text", "some resume text");

    expect(state.jdSkillRequirements).toHaveLength(2);
  });

  it("collapses two distinct resume-evidence skill names that resolve to the same canonical skill into one row, keeping the higher depth", async () => {
    extractJdSkills.mockResolvedValue({
      skills: [{ name: "A/B Testing", depth: "owned", citation: "owned end-to-end A/B testing" }],
    });
    resolveSkillsBatch.mockResolvedValue(new Map([["A/B Testing", { id: "skill-1", canonicalName: "A/B Testing" }]]));
    extractResumeEvidence.mockResolvedValue({
      evidence: [
        { skillName: "A/B Testing", depth: "used", citation: "ran an A/B test" },
        { skillName: "Experimentation Design", depth: "owned", citation: "owned the experimentation pipeline" },
      ],
    });
    // Both names resolve to the same skill in this scenario, so resolveSkillsBatch's
    // map (keyed by targetSkillNames, which only contains JD names) is extended here
    // to also cover the resume-only synonym, mirroring what resolveSkillsBatch would
    // actually return if asked to resolve it too.
    resolveSkillsBatch.mockResolvedValue(
      new Map([
        ["A/B Testing", { id: "skill-1", canonicalName: "A/B Testing" }],
        ["Experimentation Design", { id: "skill-1", canonicalName: "A/B Testing" }],
      ]),
    );

    await createAnalysis("some jd text", "some resume text");

    expect(state.resumeEvidence).toHaveLength(1);
    expect(state.resumeEvidence[0]).toMatchObject({
      resumeVersionId: "version-1",
      skillId: "skill-1",
      evidenceDepth: "owned",
      evidenceCitation: "owned the experimentation pipeline",
    });
  });
});
