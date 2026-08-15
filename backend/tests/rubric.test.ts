import { describe, expect, it } from "vitest";
import { buildGapScore, computeGapSize } from "../src/lib/rubric.js";

describe("computeGapSize", () => {
  it("is zero when resume depth meets JD-implied depth", () => {
    expect(computeGapSize("used", "used")).toBe(0);
  });

  it("is zero when resume depth exceeds JD-implied depth", () => {
    expect(computeGapSize("used", "led")).toBe(0);
  });

  it("reflects a one-level gap (JD: owned, resume: used)", () => {
    expect(computeGapSize("owned", "used")).toBe(1);
  });

  it("reflects the maximum real gap (JD: led, resume: aware)", () => {
    expect(computeGapSize("led", "aware")).toBe(3);
  });

  it("produces the largest possible gap when there is no resume evidence at all (skill-gap-analysis spec: 'No evidence at all')", () => {
    const noEvidenceGap = computeGapSize("led", null);
    const worstRealGap = computeGapSize("led", "aware");
    expect(noEvidenceGap).toBeGreaterThan(worstRealGap);
  });
});

describe("buildGapScore", () => {
  it("carries both JD and resume citations through (skill-gap-analysis spec: 'Evidence-backed gap scores')", () => {
    const score = buildGapScore({
      jdDepth: "owned",
      jdCitation: "designed the caching layer",
      resumeDepth: "used",
      resumeCitation: "built the caching layer",
    });
    expect(score).toMatchObject({
      jdDepth: "owned",
      jdCitation: "designed the caching layer",
      resumeDepth: "used",
      resumeCitation: "built the caching layer",
      gapSize: 1,
    });
  });

  it("records null resume depth/citation when there is no evidence", () => {
    const score = buildGapScore({
      jdDepth: "owned",
      jdCitation: "designed the caching layer",
      resumeDepth: null,
      resumeCitation: null,
    });
    expect(score.resumeDepth).toBeNull();
    expect(score.resumeCitation).toBeNull();
    expect(score.gapSize).toBeGreaterThan(0);
  });
});
