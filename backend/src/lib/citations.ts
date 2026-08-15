/**
 * Normalizes whitespace so citation matching tolerates line-wrap/formatting
 * differences without allowing genuinely fabricated text through.
 */
function normalize(text: string): string {
  return text.replace(/\s+/g, " ").trim().toLowerCase();
}

/**
 * Task 2.2 / design.md citation-hallucination mitigation: a citation is only
 * accepted if it is an actual (whitespace-normalized) substring of the
 * source document. Used to validate every JD and resume citation the LLM
 * returns before a depth score is stored.
 */
export function isValidCitation(sourceText: string, citation: string): boolean {
  if (!citation.trim()) return false;
  return normalize(sourceText).includes(normalize(citation));
}

export class InvalidCitationError extends Error {
  constructor(
    public readonly citation: string,
    public readonly sourceKind: "jd" | "resume",
  ) {
    super(`Citation not found in ${sourceKind} source text: "${citation}"`);
    this.name = "InvalidCitationError";
  }
}

/** Throws InvalidCitationError if the citation cannot be verified against the source. */
export function assertValidCitation(
  sourceText: string,
  citation: string,
  sourceKind: "jd" | "resume",
): void {
  if (!isValidCitation(sourceText, citation)) {
    throw new InvalidCitationError(citation, sourceKind);
  }
}
