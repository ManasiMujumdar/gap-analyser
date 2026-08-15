import { describe, expect, it, vi } from "vitest";

const state = {
  rows: [] as { id: string; jdText: string; createdAt: Date }[],
};

function chainable<T>(result: T) {
  const promise = Promise.resolve(result) as Promise<T> & { where: () => Promise<T> };
  promise.where = () => Promise.resolve(result);
  return promise;
}

vi.mock("backend/db/client", () => ({
  db: {
    select: () => ({ from: () => chainable(state.rows) }),
  },
}));

vi.mock("backend/db/schema", () => ({ analyses: {} }));

const { GET } = await import("@/app/api/analyses/[analysisId]/route");

describe("GET /api/analyses/[analysisId] (task 3.8, api-layer spec: Get analysis endpoint)", () => {
  it("returns the job description text for an existing analysis", async () => {
    state.rows = [{ id: "a1", jdText: "We want a backend engineer.", createdAt: new Date() }];

    const response = await GET(new Request("http://localhost"), { params: Promise.resolve({ analysisId: "a1" }) });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.jdText).toBe("We want a backend engineer.");
  });

  it("returns 404 for a non-existent analysis", async () => {
    state.rows = [];

    const response = await GET(new Request("http://localhost"), { params: Promise.resolve({ analysisId: "missing" }) });
    expect(response.status).toBe(404);
  });
});
