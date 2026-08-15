import "dotenv/config";
import { GoogleGenerativeAI, GoogleGenerativeAIFetchError } from "@google/generative-ai";
import type { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { isValidCitation } from "../lib/citations.js";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error("GEMINI_API_KEY is not set. Copy .env.example to .env and fill it in (get a free key at aistudio.google.com).");
}

const genAI = new GoogleGenerativeAI(apiKey);

// Uses Google's "-latest" alias rather than a pinned version, since pinned
// flash model names (gemini-2.0-flash, then gemini-2.5-flash) both went
// stale/inaccessible within the same week this was built. The alias always
// points to whatever Google currently recommends, avoiding that churn.
// Override via GEMINI_MODEL if needed.
const MODEL = process.env.GEMINI_MODEL ?? "gemini-flash-latest";

/** Parses the RetryInfo.retryDelay (e.g. "23s") Gemini includes on 429 responses, if present. */
function parseRetryDelaySeconds(err: GoogleGenerativeAIFetchError): number | null {
  for (const detail of err.errorDetails ?? []) {
    const delay = (detail as Record<string, unknown>).retryDelay;
    if (typeof delay === "string") {
      const match = delay.match(/^(\d+(?:\.\d+)?)s$/);
      if (match) return Number(match[1]);
    }
  }
  return null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Gemini's free tier has a low requests-per-minute cap (5 RPM as observed),
 * easily hit by a single analysis's several sequential LLM calls (JD
 * extraction, resume extraction, one taxonomy match per skill, one
 * suggestion-generation call per gap). Retries on 429 with the server's
 * suggested delay when provided, else exponential backoff, up to 5 attempts.
 */
async function withRateLimitRetry<T>(fn: () => Promise<T>): Promise<T> {
  const maxAttempts = 5;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const isRateLimit = err instanceof GoogleGenerativeAIFetchError && err.status === 429;
      if (!isRateLimit || attempt === maxAttempts) throw err;

      const suggested = parseRetryDelaySeconds(err);
      const waitSeconds = suggested ?? 2 ** attempt;
      console.warn(`Rate limited (attempt ${attempt}/${maxAttempts}), waiting ${waitSeconds}s before retry...`);
      await sleep(waitSeconds * 1000);
    }
  }
  throw new Error("unreachable");
}

/** Recursively strips JSON Schema fields Gemini's responseSchema rejects (e.g. additionalProperties, $schema). */
function sanitizeForGemini(node: unknown): unknown {
  if (Array.isArray(node)) {
    return node.map(sanitizeForGemini);
  }
  if (node && typeof node === "object") {
    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
      if (key === "additionalProperties" || key === "$schema") continue;
      cleaned[key] = sanitizeForGemini(value);
    }
    return cleaned;
  }
  return node;
}

/**
 * Calls the LLM and forces its response to conform to `schema` via JSON-mode
 * structured output, then validates the result at runtime (task 2.1).
 *
 * Provider is swappable by design (design.md Open Questions: "Specific LLM
 * provider/model - swappable implementation detail"). Everything upstream of
 * this function (extraction/matching/suggestion prompts, the citation-retry
 * wrapper below) is provider-agnostic - only this function and its imports
 * are Gemini-specific.
 *
 * Temperature is fixed at 0 (task 2.3, design.md scoring-non-determinism
 * mitigation) - the mandatory evidence citations already do most of the work
 * of grounding the model, so this call keeps the remaining variance minimal.
 */
export async function callStructured<T>(params: {
  schema: z.ZodType<T>;
  toolName: string;
  toolDescription: string;
  system: string;
  prompt: string;
}): Promise<T> {
  const { schema, toolDescription, system, prompt } = params;

  // Gemini's responseSchema is a narrower OpenAPI 3.0 subset than what
  // zod-to-json-schema's openApi3 target produces - it rejects unknown
  // fields like $schema/additionalProperties outright (400 Bad Request),
  // including on nested object/array schemas, so this has to strip them
  // recursively rather than just at the top level.
  const jsonSchema = sanitizeForGemini(
    zodToJsonSchema(schema, { target: "openApi3", $refStrategy: "none" }),
  );

  const model = genAI.getGenerativeModel({
    model: MODEL,
    systemInstruction: `${system}\n\n${toolDescription}`,
    generationConfig: {
      temperature: 0,
      responseMimeType: "application/json",
      responseSchema: jsonSchema as never,
    },
  });

  const result = await withRateLimitRetry(() => model.generateContent(prompt));
  const text = result.response.text();

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(`LLM did not return valid JSON: ${text}`);
  }

  return schema.parse(parsed);
}

/**
 * Wraps callStructured with the citation-hallucination mitigation from
 * design.md's Risks section: after the first call, any item whose citation
 * doesn't verify against the source text is retried once with a corrective
 * follow-up asking the model to fix or drop just those items; anything still
 * unverifiable after the retry is dropped rather than stored (task 2.2).
 */
export async function callStructuredWithCitationRetry<T, TItem>(params: {
  schema: z.ZodType<T>;
  toolName: string;
  toolDescription: string;
  system: string;
  prompt: string;
  sourceText: string;
  sourceKind: "jd" | "resume";
  getItems: (result: T) => TItem[];
  withItems: (result: T, items: TItem[]) => T;
  getCitation: (item: TItem) => string;
  describeItem: (item: TItem) => string;
}): Promise<T> {
  const { schema, toolName, toolDescription, system, prompt, sourceText, sourceKind, getItems, withItems, getCitation, describeItem } = params;

  let result = await callStructured({ schema, toolName, toolDescription, system, prompt });

  let items = getItems(result);
  let invalid = items.filter((item) => !isValidCitation(sourceText, getCitation(item)));

  if (invalid.length > 0) {
    const retryPrompt = `${prompt}\n\nThe following items had citations that were not found verbatim in the source text. For each, provide a corrected exact verbatim quote from the source text, or omit the item entirely if no such quote exists:\n${invalid
      .map((item) => `- ${describeItem(item)}`)
      .join("\n")}`;

    result = await callStructured({ schema, toolName, toolDescription, system, prompt: retryPrompt });
    items = getItems(result);
    invalid = items.filter((item) => !isValidCitation(sourceText, getCitation(item)));
  }

  const valid = items.filter((item) => isValidCitation(sourceText, getCitation(item)));
  if (invalid.length > 0) {
    console.warn(
      `Dropping ${invalid.length} ${sourceKind} item(s) with unverifiable citations after retry:`,
      invalid.map(describeItem),
    );
  }

  return withItems(result, valid);
}
