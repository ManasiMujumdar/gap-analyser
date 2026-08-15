const STORAGE_KEY = "gapcheck:lastAnalysisId";

/**
 * Convenience-only redirect target, never an auth mechanism (design.md
 * Decision #2) - the analysis ID in the URL is always the real source of
 * truth; this just saves the candidate from re-navigating on return visits.
 */
export function rememberAnalysisId(analysisId: string) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, analysisId);
  }
}

export function getRememberedAnalysisId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(STORAGE_KEY);
}
