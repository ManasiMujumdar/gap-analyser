import { beforeEach, describe, expect, it, vi } from "vitest";

const state = {
  existingSkills: [] as { id: string; canonicalName: string }[],
  matches: [] as { newSkillName: string; matchedCanonicalName: string | null }[],
  insertedRows: {} as Record<string, { id: string; canonicalName: string } | undefined>,
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
      values: (row: { canonicalName: string }) => ({
        onConflictDoNothing: () => ({
          returning: () => Promise.resolve(state.insertedRows[row.canonicalName] ? [state.insertedRows[row.canonicalName]] : []),
        }),
      }),
    }),
  },
}));

vi.mock("../src/llm/matchTaxonomy.js", () => ({
  matchTaxonomyBatch: vi.fn(async () => ({ matches: state.matches })),
}));

const { resolveSkillsBatch } = await import("../src/services/taxonomy.js");

describe("resolveSkillsBatch (task 4.1/4.2, skill-gap-analysis spec: growing taxonomy skill matching)", () => {
  beforeEach(() => {
    state.existingSkills = [];
    state.matches = [];
    state.insertedRows = {};
  });

  it("resolves several skills in one call, reusing matches and creating new entries as needed", async () => {
    state.existingSkills = [{ id: "skill-1", canonicalName: "Distributed Systems Design" }];
    state.matches = [
      { newSkillName: "scalable backend design", matchedCanonicalName: "Distributed Systems Design" },
      { newSkillName: "GraphQL API Design", matchedCanonicalName: null },
    ];
    state.insertedRows["GraphQL API Design"] = { id: "skill-2", canonicalName: "GraphQL API Design" };

    const result = await resolveSkillsBatch(["scalable backend design", "GraphQL API Design"]);

    expect(result.get("scalable backend design")).toEqual({ id: "skill-1", canonicalName: "Distributed Systems Design" });
    expect(result.get("GraphQL API Design")).toEqual({ id: "skill-2", canonicalName: "GraphQL API Design" });
  });

  it("creates new entries for all skills when the taxonomy is empty", async () => {
    state.existingSkills = [];
    state.matches = [{ newSkillName: "Data Modeling", matchedCanonicalName: null }];
    state.insertedRows["Data Modeling"] = { id: "skill-1", canonicalName: "Data Modeling" };

    const result = await resolveSkillsBatch(["Data Modeling"]);

    expect(result.get("Data Modeling")).toEqual({ id: "skill-1", canonicalName: "Data Modeling" });
  });

  it("deduplicates repeated skill names before resolving", async () => {
    state.existingSkills = [];
    state.matches = [{ newSkillName: "SQL", matchedCanonicalName: null }];
    state.insertedRows["SQL"] = { id: "skill-1", canonicalName: "SQL" };

    const result = await resolveSkillsBatch(["SQL", "SQL"]);

    expect(result.size).toBe(1);
    expect(result.get("SQL")).toEqual({ id: "skill-1", canonicalName: "SQL" });
  });

  it("returns an empty map for no mentioned skills", async () => {
    const result = await resolveSkillsBatch([]);
    expect(result.size).toBe(0);
  });
});
