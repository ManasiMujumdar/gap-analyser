import { describe, expect, it, vi } from "vitest";

const state = {
  rows: [] as unknown[],
};

vi.mock("backend/services/dashboard", () => ({
  getSuggestionHistory: vi.fn(async () => state.rows),
}));

const { GET } = await import("@/app/api/resume-versions/[resumeVersionId]/suggestions/route");

describe("GET /api/resume-versions/[resumeVersionId]/suggestions (task 3.5)", () => {
  it("parses talking-point-narrative content into structured fields", async () => {
    state.rows = [
      {
        skillId: "s1",
        canonicalName: "Caching",
        type: "talking_point_narrative",
        content: JSON.stringify({ situation: "S", task: "T", action: "A", result: "R" }),
      },
    ];

    const response = await GET(new Request("http://localhost"), { params: Promise.resolve({ resumeVersionId: "v1" }) });
    const body = await response.json();
    expect(body.suggestions[0].content).toEqual({ situation: "S", task: "T", action: "A", result: "R" });
  });

  it("leaves resume-rewrite and portfolio-addition content as plain text", async () => {
    state.rows = [{ skillId: "s1", canonicalName: "Caching", type: "resume_rewrite", content: "Rewrite this bullet." }];

    const response = await GET(new Request("http://localhost"), { params: Promise.resolve({ resumeVersionId: "v1" }) });
    const body = await response.json();
    expect(body.suggestions[0].content).toBe("Rewrite this bullet.");
  });

  it("returns an empty list, not an error, when the version has no suggestions", async () => {
    state.rows = [];

    const response = await GET(new Request("http://localhost"), { params: Promise.resolve({ resumeVersionId: "v1" }) });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.suggestions).toEqual([]);
  });
});
