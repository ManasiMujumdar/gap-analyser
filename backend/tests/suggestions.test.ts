import { beforeEach, describe, expect, it, vi } from "vitest";

const state = {
  gapped: [] as {
    skillId: string;
    canonicalName: string;
    jdDepth: string;
    jdCitation: string;
    resumeDepth: string | null;
    resumeCitation: string | null;
    gapSize: number;
  }[],
  inserted: [] as any[],
};

vi.mock("../src/db/client.js", () => ({
  db: {
    select: () => ({
      from: () => ({
        innerJoin: () => ({
          where: () => Promise.resolve(state.gapped),
        }),
      }),
    }),
    insert: () => ({
      values: (rows: any[]) => {
        state.inserted.push(...rows);
        return Promise.resolve();
      },
    }),
  },
}));

const generateSuggestionsBatch = vi.fn(
  async (gaps: { skillName: string }[], _demonstratedSkillset: { skillName: string }[] = []) => ({
    suggestions: gaps.map((gap) => ({
      skillName: gap.skillName,
      resumeRewrite: `Rewrite for ${gap.skillName}`,
      portfolioAddition: `Build something for ${gap.skillName}`,
      talkingPointNarrative: {
        situation: `Situation for ${gap.skillName}`,
        task: `Task for ${gap.skillName}`,
        action: `Action for ${gap.skillName}`,
        result: `Result for ${gap.skillName}`,
      },
    })),
  }),
);

vi.mock("../src/llm/generateSuggestions.js", () => ({ generateSuggestionsBatch }));

const { generateSuggestionsForVersion } = await import("../src/services/suggestions.js");

describe("generateSuggestionsForVersion (tasks 5.4/5.5, improvement-suggestions spec)", () => {
  beforeEach(() => {
    state.gapped = [];
    state.inserted = [];
    generateSuggestionsBatch.mockClear();
  });

  it("generates exactly three suggestions for a skill with a gap", async () => {
    state.gapped = [
      {
        skillId: "s1",
        canonicalName: "Distributed Systems Design",
        jdDepth: "owned",
        jdCitation: "designed the caching layer",
        resumeDepth: "used",
        resumeCitation: "built the caching layer",
        gapSize: 1,
      },
    ];

    await generateSuggestionsForVersion("v1");

    expect(state.inserted).toHaveLength(3);
    const types = state.inserted.map((row) => row.type).sort();
    expect(types).toEqual(["portfolio_addition", "resume_rewrite", "talking_point_narrative"]);
    expect(state.inserted.every((row) => row.resumeVersionId === "v1" && row.skillId === "s1")).toBe(true);
  });

  it("generates no suggestions for a skill with no gap", async () => {
    state.gapped = [
      {
        skillId: "s1",
        canonicalName: "API Design",
        jdDepth: "used",
        jdCitation: "worked with REST APIs",
        resumeDepth: "owned",
        resumeCitation: "designed the public REST API",
        gapSize: 0,
      },
    ];

    await generateSuggestionsForVersion("v1");

    expect(state.inserted).toHaveLength(0);
    expect(generateSuggestionsBatch).not.toHaveBeenCalled();
  });

  it("batches multiple gapped skills into a single LLM call and maps results back correctly", async () => {
    state.gapped = [
      {
        skillId: "s1",
        canonicalName: "Distributed Systems Design",
        jdDepth: "owned",
        jdCitation: "designed the caching layer",
        resumeDepth: "used",
        resumeCitation: "built the caching layer",
        gapSize: 1,
      },
      {
        skillId: "s2",
        canonicalName: "GraphQL",
        jdDepth: "used",
        jdCitation: "experience with GraphQL",
        resumeDepth: "aware",
        resumeCitation: "familiar with GraphQL",
        gapSize: 1,
      },
    ];

    await generateSuggestionsForVersion("v1");

    expect(generateSuggestionsBatch).toHaveBeenCalledTimes(1);
    expect(state.inserted).toHaveLength(6);
    const s1Rows = state.inserted.filter((row) => row.skillId === "s1");
    const s2Rows = state.inserted.filter((row) => row.skillId === "s2");
    expect(s1Rows).toHaveLength(3);
    expect(s2Rows).toHaveLength(3);
    expect(s1Rows.find((row) => row.type === "resume_rewrite")?.content).toBe("Rewrite for Distributed Systems Design");
    expect(s2Rows.find((row) => row.type === "resume_rewrite")?.content).toBe("Rewrite for GraphQL");
  });

  it("passes the candidate's demonstrated skillset (other skills with evidence) to the batch call (resume-aware-suggestions spec)", async () => {
    state.gapped = [
      {
        skillId: "s1",
        canonicalName: "Budget Management",
        jdDepth: "owned",
        jdCitation: "owned campaign budgets",
        resumeDepth: null,
        resumeCitation: null,
        gapSize: 3,
      },
      {
        skillId: "s2",
        canonicalName: "SQL",
        jdDepth: "used",
        jdCitation: "experience with SQL",
        resumeDepth: "owned",
        resumeCitation: "owned the SQL reporting pipeline",
        gapSize: 0,
      },
    ];

    await generateSuggestionsForVersion("v1");

    const [, demonstratedSkillset] = generateSuggestionsBatch.mock.calls[0];
    expect(demonstratedSkillset).toEqual([{ skillName: "SQL", depth: "owned", citation: "owned the SQL reporting pipeline" }]);
  });

  it("passes an empty demonstrated skillset when no other skill has any evidence (graceful degradation)", async () => {
    state.gapped = [
      {
        skillId: "s1",
        canonicalName: "Budget Management",
        jdDepth: "owned",
        jdCitation: "owned campaign budgets",
        resumeDepth: null,
        resumeCitation: null,
        gapSize: 3,
      },
    ];

    await generateSuggestionsForVersion("v1");

    const [, demonstratedSkillset] = generateSuggestionsBatch.mock.calls[0];
    expect(demonstratedSkillset).toEqual([]);
    expect(state.inserted).toHaveLength(3);
  });
});
