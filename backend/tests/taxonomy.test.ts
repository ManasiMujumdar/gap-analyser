import { beforeEach, describe, expect, it, vi } from "vitest";

const state = {
  existingSkills: [] as { id: string; canonicalName: string }[],
  matchedCanonicalName: null as string | null,
  insertedRow: null as { id: string; canonicalName: string } | null,
};

function chainable<T>(result: T) {
  const promise = Promise.resolve(result) as Promise<T> & { where: () => Promise<T> };
  promise.where = () => Promise.resolve(result);
  return promise;
}

vi.mock("../src/db/client.js", () => ({
  db: {
    select: () => ({
      from: () => chainable(state.existingSkills),
    }),
    insert: () => ({
      values: () => ({
        onConflictDoNothing: () => ({
          returning: () => Promise.resolve(state.insertedRow ? [state.insertedRow] : []),
        }),
      }),
    }),
  },
}));

vi.mock("../src/llm/matchTaxonomy.js", () => ({
  matchTaxonomy: vi.fn(async () => ({ matchedCanonicalName: state.matchedCanonicalName })),
}));

const { resolveSkill } = await import("../src/services/taxonomy.js");

describe("resolveSkill (task 4.1/4.2, skill-gap-analysis spec: growing taxonomy skill matching)", () => {
  beforeEach(() => {
    state.existingSkills = [];
    state.matchedCanonicalName = null;
    state.insertedRow = null;
  });

  it("reuses an existing taxonomy entry when the LLM reports a match", async () => {
    state.existingSkills = [{ id: "skill-1", canonicalName: "Distributed Systems Design" }];
    state.matchedCanonicalName = "Distributed Systems Design";

    const result = await resolveSkill("scalable backend design");

    expect(result).toEqual({ id: "skill-1", canonicalName: "Distributed Systems Design" });
  });

  it("creates a new taxonomy entry when no existing entry is a close match", async () => {
    state.existingSkills = [{ id: "skill-1", canonicalName: "Distributed Systems Design" }];
    state.matchedCanonicalName = null;
    state.insertedRow = { id: "skill-2", canonicalName: "GraphQL API Design" };

    const result = await resolveSkill("GraphQL API Design");

    expect(result).toEqual({ id: "skill-2", canonicalName: "GraphQL API Design" });
  });

  it("creates a new entry directly when the taxonomy is empty, without calling the matcher unnecessarily", async () => {
    state.existingSkills = [];
    state.insertedRow = { id: "skill-1", canonicalName: "Data Modeling" };

    const result = await resolveSkill("Data Modeling");

    expect(result).toEqual({ id: "skill-1", canonicalName: "Data Modeling" });
  });
});
