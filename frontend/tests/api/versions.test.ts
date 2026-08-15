import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const state = {
  existingVersions: [] as unknown[],
};

vi.mock("backend/services/versioning", () => ({
  getResumeVersions: vi.fn(async () => state.existingVersions),
  addResumeVersion: vi.fn(async (analysisId: string, resumeText: string) => ({
    resumeVersion: { id: "v2", analysisId, versionNumber: 2, resumeText, createdAt: new Date() },
    delta: [{ skillId: "s1", canonicalName: "GraphQL", previousGapSize: 1, currentGapSize: 0, category: "gap_closed" }],
  })),
}));

const { POST } = await import("@/app/api/analyses/[analysisId]/versions/route");

function jsonRequest(body: unknown) {
  return new NextRequest("http://localhost/api/analyses/a1/versions", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("POST /api/analyses/[analysisId]/versions (task 3.2, api-layer spec: Add resume version endpoint)", () => {
  it("creates a new version and returns its delta for a valid submission to an existing analysis", async () => {
    state.existingVersions = [{ id: "v1", versionNumber: 1 }];
    const response = await POST(jsonRequest({ resumeText: "updated resume" }), { params: Promise.resolve({ analysisId: "a1" }) });
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.resumeVersion.versionNumber).toBe(2);
    expect(body.delta[0].category).toBe("gap_closed");
  });

  it("rejects a submission with no resume text", async () => {
    state.existingVersions = [{ id: "v1", versionNumber: 1 }];
    const response = await POST(jsonRequest({}), { params: Promise.resolve({ analysisId: "a1" }) });
    expect(response.status).toBe(400);
  });

  it("returns 404 for a non-existent analysis", async () => {
    state.existingVersions = [];
    const response = await POST(jsonRequest({ resumeText: "x" }), { params: Promise.resolve({ analysisId: "missing" }) });
    expect(response.status).toBe(404);
  });
});
