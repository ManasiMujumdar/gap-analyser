import { describe, expect, it, vi } from "vitest";

const state = {
  timeline: [] as unknown[],
};

vi.mock("backend/services/dashboard", () => ({
  getVersionTimeline: vi.fn(async () => state.timeline),
}));

const { GET } = await import("@/app/api/analyses/[analysisId]/timeline/route");

describe("GET /api/analyses/[analysisId]/timeline (task 3.4)", () => {
  it("returns the version list in order for an existing analysis", async () => {
    state.timeline = [
      { version: { versionNumber: 1 }, deltaFromPrevious: null },
      { version: { versionNumber: 2 }, deltaFromPrevious: [{ category: "gap_closed" }] },
    ];

    const response = await GET(new Request("http://localhost"), { params: Promise.resolve({ analysisId: "a1" }) });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.timeline).toHaveLength(2);
    expect(body.timeline[0].deltaFromPrevious).toBeNull();
  });

  it("returns 404 for a non-existent analysis", async () => {
    state.timeline = [];

    const response = await GET(new Request("http://localhost"), { params: Promise.resolve({ analysisId: "missing" }) });
    expect(response.status).toBe(404);
  });
});
