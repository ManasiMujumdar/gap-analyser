import { describe, expect, it, vi } from "vitest";

const state = {
  latestVersion: null as unknown,
  gapScores: [] as unknown[],
};

vi.mock("backend/services/dashboard", () => ({
  getCurrentGapState: vi.fn(async () => ({ latestVersion: state.latestVersion, gapScores: state.gapScores })),
}));

const { GET } = await import("@/app/api/analyses/[analysisId]/gap-state/route");

describe("GET /api/analyses/[analysisId]/gap-state (task 3.3)", () => {
  it("returns the latest version and gap scores for an existing analysis", async () => {
    state.latestVersion = { id: "v1", versionNumber: 1 };
    state.gapScores = [{ skillId: "s1", canonicalName: "GraphQL", gapSize: 1 }];

    const response = await GET(new Request("http://localhost"), { params: Promise.resolve({ analysisId: "a1" }) });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.gapScores).toHaveLength(1);
  });

  it("returns 404 for a non-existent analysis", async () => {
    state.latestVersion = null;
    state.gapScores = [];

    const response = await GET(new Request("http://localhost"), { params: Promise.resolve({ analysisId: "missing" }) });
    expect(response.status).toBe(404);
  });
});
