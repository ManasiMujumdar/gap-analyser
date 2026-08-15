import { beforeEach, describe, expect, it, vi } from "vitest";

const state = {
  version: { id: "v1", analysisId: "a1" } as { id: string; analysisId: string } | undefined,
  requirements: [] as { skillId: string; jdDepth: string; jdCitation: string }[],
  evidence: [] as { skillId: string; evidenceDepth: string; evidenceCitation: string }[],
  inserted: [] as unknown[],
};

function chainable<T>(result: T) {
  const promise = Promise.resolve(result) as Promise<T> & { where: () => Promise<T> };
  promise.where = () => Promise.resolve(result);
  return promise;
}

vi.mock("../src/db/client.js", () => ({
  db: {
    select: () => ({
      from: (table: unknown) => ({
        where: () => {
          // Distinguish which table is being queried by identity captured via closures below.
          return chainable(currentSelectResult(table));
        },
      }),
    }),
    insert: () => ({
      values: (rows: unknown[]) => {
        state.inserted.push(...(Array.isArray(rows) ? rows : [rows]));
        return Promise.resolve();
      },
    }),
  },
}));

vi.mock("../src/db/schema.js", () => ({
  resumeVersions: "resumeVersions",
  jdSkillRequirements: "jdSkillRequirements",
  resumeEvidence: "resumeEvidence",
  gapScores: "gapScores",
}));

function currentSelectResult(table: unknown) {
  if (table === "resumeVersions") return state.version ? [state.version] : [];
  if (table === "jdSkillRequirements") return state.requirements;
  if (table === "resumeEvidence") return state.evidence;
  return [];
}

const { computeGapScoresForVersion } = await import("../src/services/gapAnalysis.js");

describe("computeGapScoresForVersion (tasks 4.3/4.4, skill-gap-analysis spec)", () => {
  beforeEach(() => {
    state.version = { id: "v1", analysisId: "a1" };
    state.requirements = [];
    state.evidence = [];
    state.inserted = [];
  });

  it("records a no-evidence gap score when the resume has no evidence for a required skill", async () => {
    state.requirements = [{ skillId: "s1", jdDepth: "led", jdCitation: "led migration to Kubernetes" }];
    state.evidence = [];

    await computeGapScoresForVersion("v1");

    expect(state.inserted).toHaveLength(1);
    const row = state.inserted[0] as any;
    expect(row.resumeDepth).toBeNull();
    expect(row.resumeCitation).toBeNull();
    expect(row.gapSize).toBeGreaterThan(0);
  });

  it("carries both JD and resume citations when evidence exists", async () => {
    state.requirements = [{ skillId: "s1", jdDepth: "owned", jdCitation: "designed the caching layer" }];
    state.evidence = [{ skillId: "s1", evidenceDepth: "used", evidenceCitation: "built the caching layer" }];

    await computeGapScoresForVersion("v1");

    const row = state.inserted[0] as any;
    expect(row.jdCitation).toBe("designed the caching layer");
    expect(row.resumeCitation).toBe("built the caching layer");
    expect(row.gapSize).toBe(1);
  });

  it("records zero gap size when resume evidence meets or exceeds JD-implied depth", async () => {
    state.requirements = [{ skillId: "s1", jdDepth: "used", jdCitation: "worked with GraphQL" }];
    state.evidence = [{ skillId: "s1", evidenceDepth: "owned", evidenceCitation: "architected the GraphQL API" }];

    await computeGapScoresForVersion("v1");

    expect((state.inserted[0] as any).gapSize).toBe(0);
  });
});
