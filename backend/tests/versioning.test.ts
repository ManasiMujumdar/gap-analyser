import { beforeEach, describe, expect, it, vi } from "vitest";

const state = {
  versions: [] as { id: string; analysisId: string; versionNumber: number }[],
  gapScoresByVersion: {} as Record<string, { skillId: string; canonicalName: string; gapSize: number }[]>,
};

function chainable<T>(result: T) {
  const promise = Promise.resolve(result) as Promise<T> & {
    where: () => typeof promise;
    orderBy: () => Promise<T>;
  };
  promise.where = () => promise;
  promise.orderBy = () => Promise.resolve(result);
  return promise;
}

vi.mock("../src/db/client.js", () => ({
  db: {
    select: () => ({
      from: () => chainable(state.versions),
    }),
  },
}));

vi.mock("../src/services/gapAnalysis.js", () => ({
  getGapScoresForVersion: vi.fn(async (resumeVersionId: string) => state.gapScoresByVersion[resumeVersionId] ?? []),
  computeGapScoresForVersion: vi.fn(async () => {}),
}));

vi.mock("../src/services/suggestions.js", () => ({
  generateSuggestionsForVersion: vi.fn(async () => {}),
  getSuggestionsForVersion: vi.fn(async () => []),
}));

const { getResumeVersions, computeDelta } = await import("../src/services/versioning.js");

describe("getResumeVersions (task 6.2: sequential version ordering)", () => {
  it("returns versions in submission order", async () => {
    state.versions = [
      { id: "v1", analysisId: "a1", versionNumber: 1 },
      { id: "v2", analysisId: "a1", versionNumber: 2 },
      { id: "v3", analysisId: "a1", versionNumber: 3 },
    ];

    const result = await getResumeVersions("a1");

    expect(result.map((v) => v.versionNumber)).toEqual([1, 2, 3]);
  });
});

describe("computeDelta (task 6.3/6.4)", () => {
  beforeEach(() => {
    state.gapScoresByVersion = {};
  });

  it("categorizes each skill's change between two versions", async () => {
    state.gapScoresByVersion["v1"] = [
      { skillId: "s1", canonicalName: "Distributed Systems Design", gapSize: 2 },
      { skillId: "s2", canonicalName: "API Design", gapSize: 0 },
      { skillId: "s3", canonicalName: "Data Modeling", gapSize: 1 },
    ];
    state.gapScoresByVersion["v2"] = [
      { skillId: "s1", canonicalName: "Distributed Systems Design", gapSize: 0 }, // closed
      { skillId: "s2", canonicalName: "API Design", gapSize: 1 }, // new gap
      { skillId: "s3", canonicalName: "Data Modeling", gapSize: 1 }, // unchanged
    ];

    const delta = await computeDelta("v1", "v2");
    const bySkill = Object.fromEntries(delta.map((d) => [d.skillId, d.category]));

    expect(bySkill).toEqual({
      s1: "gap_closed",
      s2: "new_gap",
      s3: "gap_unchanged",
    });
  });

  it("retrieves gap scores for a non-latest (older) version independently (task 6.4)", async () => {
    state.gapScoresByVersion["v1"] = [{ skillId: "s1", canonicalName: "Data Modeling", gapSize: 2 }];
    state.gapScoresByVersion["v2"] = [{ skillId: "s1", canonicalName: "Data Modeling", gapSize: 1 }];

    const { getGapScoresForVersion } = await import("../src/services/gapAnalysis.js");
    const olderScores = await getGapScoresForVersion("v1");

    expect(olderScores).toEqual([{ skillId: "s1", canonicalName: "Data Modeling", gapSize: 2 }]);
  });
});
