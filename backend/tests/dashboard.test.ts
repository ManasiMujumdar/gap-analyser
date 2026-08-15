import { beforeEach, describe, expect, it, vi } from "vitest";

const state = {
  versions: [] as { id: string; versionNumber: number }[],
  gapScoresByVersion: {} as Record<string, { skillId: string; canonicalName: string; gapSize: number }[]>,
  suggestionsByVersion: {} as Record<string, { skillId: string; type: string; content: string }[]>,
};

const llmCalls = { count: 0 };

vi.mock("../src/services/versioning.js", () => ({
  getResumeVersions: vi.fn(async () => state.versions),
  computeDelta: vi.fn(async (olderId: string, newerId: string) => {
    const older = new Map(state.gapScoresByVersion[olderId]?.map((s) => [s.skillId, s.gapSize]) ?? []);
    const newer = state.gapScoresByVersion[newerId] ?? [];
    return newer.map((s) => ({
      skillId: s.skillId,
      canonicalName: s.canonicalName,
      previousGapSize: older.get(s.skillId) ?? 0,
      currentGapSize: s.gapSize,
      category: (older.get(s.skillId) ?? 0) > 0 && s.gapSize === 0 ? "gap_closed" : "gap_unchanged",
    }));
  }),
}));

vi.mock("../src/services/gapAnalysis.js", () => ({
  getGapScoresForVersion: vi.fn(async (versionId: string) => state.gapScoresByVersion[versionId] ?? []),
  computeGapScoresForVersion: vi.fn(async () => {
    llmCalls.count++;
  }),
}));

vi.mock("../src/services/suggestions.js", () => ({
  getSuggestionsForVersion: vi.fn(async (versionId: string) => state.suggestionsByVersion[versionId] ?? []),
  generateSuggestionsForVersion: vi.fn(async () => {
    llmCalls.count++;
  }),
}));

const { getCurrentGapState, getVersionTimeline, getSuggestionHistory } = await import("../src/services/dashboard.js");

describe("dashboard queries (group 7, application-dashboard spec)", () => {
  beforeEach(() => {
    llmCalls.count = 0;
    state.versions = [
      { id: "v1", versionNumber: 1 },
      { id: "v2", versionNumber: 2 },
    ];
    state.gapScoresByVersion = {
      v1: [{ skillId: "s1", canonicalName: "Data Modeling", gapSize: 2 }],
      v2: [{ skillId: "s1", canonicalName: "Data Modeling", gapSize: 0 }],
    };
    state.suggestionsByVersion = {
      v1: [{ skillId: "s1", type: "resume_rewrite", content: "v1 suggestion" }],
      v2: [],
    };
  });

  it("task 7.1: current gap state reflects the latest version only", async () => {
    const result = await getCurrentGapState("a1");
    expect(result.latestVersion?.versionNumber).toBe(2);
    expect(result.gapScores).toEqual(state.gapScoresByVersion.v2);
  });

  it("task 7.2: version timeline has no delta for the first version and a delta for later ones", async () => {
    const timeline = await getVersionTimeline("a1");
    expect(timeline).toHaveLength(2);
    expect(timeline[0].deltaFromPrevious).toBeNull();
    expect(timeline[1].deltaFromPrevious?.[0].category).toBe("gap_closed");
  });

  it("task 7.3: suggestion history is retrievable for a non-latest version and stays visible after a newer version exists", async () => {
    const history = await getSuggestionHistory("v1");
    expect(history).toEqual(state.suggestionsByVersion.v1);
  });

  it("task 7.4/7.5: dashboard queries are read-only and return consistent results across repeated reads", async () => {
    const first = await getCurrentGapState("a1");
    const second = await getCurrentGapState("a1");
    expect(second).toEqual(first);
    expect(llmCalls.count).toBe(0);
  });
});
