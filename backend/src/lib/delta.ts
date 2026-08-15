export type DeltaCategory = "gap_closed" | "gap_narrowed" | "gap_unchanged" | "gap_widened" | "new_gap";

/**
 * Task 6.3: categorizes how a skill's gap changed between two consecutive
 * resume versions (resume-version-tracking spec: "Delta view between
 * consecutive versions").
 */
export function computeDeltaCategory(olderGapSize: number, newerGapSize: number): DeltaCategory {
  if (olderGapSize > 0 && newerGapSize === 0) return "gap_closed";
  if (olderGapSize === 0 && newerGapSize > 0) return "new_gap";
  if (newerGapSize < olderGapSize) return "gap_narrowed";
  if (newerGapSize > olderGapSize) return "gap_widened";
  return "gap_unchanged";
}
