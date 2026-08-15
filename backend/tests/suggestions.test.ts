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

vi.mock("../src/llm/generateSuggestions.js", () => ({
  generateSuggestions: vi.fn(async () => ({
    resumeRewrite: "Rewrite: owned the caching layer redesign end-to-end.",
    portfolioAddition: "Build a small service demonstrating end-to-end ownership.",
    talkingPointNarrative: {
      situation: "Team needed a faster cache",
      task: "Redesign the caching layer",
      action: "Owned the design and rollout",
      result: "Cut latency by 40%",
    },
  })),
}));

const { generateSuggestionsForVersion } = await import("../src/services/suggestions.js");

describe("generateSuggestionsForVersion (tasks 5.4/5.5, improvement-suggestions spec)", () => {
  beforeEach(() => {
    state.gapped = [];
    state.inserted = [];
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
  });
});
