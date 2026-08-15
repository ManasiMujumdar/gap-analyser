import { describe, expect, it, vi } from "vitest";

const state = {
  rows: [] as unknown[],
};

vi.mock("backend/services/gapAnalysis", () => ({
  getGapScoresForVersion: vi.fn(async () => state.rows),
}));

const { GET } = await import("@/app/api/resume-versions/[resumeVersionId]/gap-scores/route");

describe("GET /api/resume-versions/[resumeVersionId]/gap-scores (task 3.9, api-layer spec: Gap scores endpoint for a specific resume version)", () => {
  it("returns that version's own gap scores", async () => {
    state.rows = [{ skillId: "s1", canonicalName: "GraphQL", gapSize: 2 }];

    const response = await GET(new Request("http://localhost"), { params: Promise.resolve({ resumeVersionId: "v1" }) });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.gapScores).toEqual(state.rows);
  });
});
