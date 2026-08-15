import { describe, expect, it } from "vitest";
import { computeDeltaCategory } from "../src/lib/delta.js";

describe("computeDeltaCategory (task 6.3, resume-version-tracking spec: Delta view between consecutive versions)", () => {
  it("categorizes gap_closed when a gap existed before and is gone now", () => {
    expect(computeDeltaCategory(2, 0)).toBe("gap_closed");
  });

  it("categorizes new_gap when no gap existed before but one exists now", () => {
    expect(computeDeltaCategory(0, 1)).toBe("new_gap");
  });

  it("categorizes gap_narrowed when the gap shrank but didn't close", () => {
    expect(computeDeltaCategory(3, 1)).toBe("gap_narrowed");
  });

  it("categorizes gap_widened when the gap grew", () => {
    expect(computeDeltaCategory(1, 3)).toBe("gap_widened");
  });

  it("categorizes gap_unchanged when the gap size is identical", () => {
    expect(computeDeltaCategory(2, 2)).toBe("gap_unchanged");
  });

  it("categorizes gap_unchanged when there was and still is no gap", () => {
    expect(computeDeltaCategory(0, 0)).toBe("gap_unchanged");
  });
});
