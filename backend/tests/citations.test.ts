import { describe, expect, it } from "vitest";
import { assertValidCitation, InvalidCitationError, isValidCitation } from "../src/lib/citations.js";

describe("isValidCitation", () => {
  it("accepts an exact substring of the source text", () => {
    expect(isValidCitation("We need someone who led migration to Kubernetes.", "led migration to Kubernetes")).toBe(true);
  });

  it("tolerates whitespace/line-wrap differences", () => {
    expect(isValidCitation("led   migration\nto Kubernetes", "led migration to Kubernetes")).toBe(true);
  });

  it("rejects a citation not present in the source (fabricated/hallucinated)", () => {
    expect(isValidCitation("Familiarity with GraphQL a plus.", "led migration to Kubernetes")).toBe(false);
  });

  it("rejects an empty citation", () => {
    expect(isValidCitation("some source text", "")).toBe(false);
  });
});

describe("assertValidCitation", () => {
  it("throws InvalidCitationError for an unverifiable citation, per task 2.2 / jd-resume-intake spec", () => {
    expect(() => assertValidCitation("source text", "not in source", "jd")).toThrow(InvalidCitationError);
  });

  it("does not throw for a valid citation", () => {
    expect(() => assertValidCitation("source text here", "source text", "resume")).not.toThrow();
  });
});
