import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("backend/services/intake", () => ({
  createAnalysis: vi.fn(async (jdText: string, resumeText: string) => ({
    analysis: { id: "a1", jdText, createdAt: new Date() },
    resumeVersion: { id: "v1", analysisId: "a1", versionNumber: 1, resumeText, createdAt: new Date() },
  })),
}));

vi.mock("backend/services/dashboard", () => ({
  getCurrentGapState: vi.fn(async () => ({
    latestVersion: { id: "v1", analysisId: "a1", versionNumber: 1 },
    gapScores: [{ skillId: "s1", canonicalName: "GraphQL", jdDepth: "used", jdCitation: "x", resumeDepth: "aware", resumeCitation: "y", gapSize: 1 }],
  })),
}));

const { POST } = await import("@/app/api/analyses/route");

function jsonRequest(body: unknown) {
  return new NextRequest("http://localhost/api/analyses", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("POST /api/analyses (task 3.1, api-layer spec: Create analysis endpoint)", () => {
  it("creates an analysis and returns its initial gap state for a valid submission", async () => {
    const response = await POST(jsonRequest({ jdText: "some JD", resumeText: "some resume" }));
    expect(response.status).toBe(201);
    const body = await response.json();
    expect(body.analysisId).toBe("a1");
    expect(body.gapScores).toHaveLength(1);
  });

  it("rejects a submission missing the job description", async () => {
    const response = await POST(jsonRequest({ resumeText: "some resume" }));
    expect(response.status).toBe(400);
  });

  it("rejects a submission missing the resume", async () => {
    const response = await POST(jsonRequest({ jdText: "some JD" }));
    expect(response.status).toBe(400);
  });

  it("rejects a submission with both fields empty strings", async () => {
    const response = await POST(jsonRequest({ jdText: "", resumeText: "" }));
    expect(response.status).toBe(400);
  });
});
