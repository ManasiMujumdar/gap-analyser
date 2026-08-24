import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { skills } from "../db/schema.js";
import { matchTaxonomyBatch } from "../llm/matchTaxonomy.js";

/**
 * Task 4.1: growing taxonomy store - looks up existing canonical skill
 * entries and, via LLM-assisted semantic comparison (task 4.2), either
 * reuses an existing entry for each newly mentioned skill or creates a new
 * one. Global (not scoped to a single analysis) per design.md Decision
 * #2/#4, so the same canonical entry can be reused across analyses.
 *
 * Resolves every mentioned skill with a single LLM call (one existing-skills
 * read + one batch match call) rather than one call per skill - introduced
 * after live testing showed the per-skill version tripping Gemini's
 * free-tier rate limit within a single analysis submission once the
 * taxonomy grew large enough that most skills needed a match check.
 */
export async function resolveSkillsBatch(
  mentionedNames: string[],
): Promise<Map<string, { id: string; canonicalName: string }>> {
  const uniqueNames = [...new Set(mentionedNames)];
  const result = new Map<string, { id: string; canonicalName: string }>();
  if (uniqueNames.length === 0) return result;

  const existing = await db.select().from(skills);
  const batch = await matchTaxonomyBatch(
    uniqueNames,
    existing.map((s) => s.canonicalName),
  );

  const toCreate: string[] = [];
  for (const name of uniqueNames) {
    const matchedCanonicalName = batch.matches.find((m) => m.newSkillName === name)?.matchedCanonicalName ?? null;
    const found = matchedCanonicalName ? existing.find((s) => s.canonicalName === matchedCanonicalName) : undefined;
    if (found) {
      result.set(name, { id: found.id, canonicalName: found.canonicalName });
    } else {
      toCreate.push(name);
    }
  }

  for (const name of toCreate) {
    const [created] = await db
      .insert(skills)
      .values({ canonicalName: name })
      .onConflictDoNothing({ target: skills.canonicalName })
      .returning();

    if (created) {
      result.set(name, { id: created.id, canonicalName: created.canonicalName });
      continue;
    }

    // Unique-constraint race: another call created this exact canonical name concurrently.
    const [conflicted] = await db.select().from(skills).where(eq(skills.canonicalName, name));
    if (!conflicted) {
      throw new Error(`Failed to resolve or create taxonomy entry for "${name}"`);
    }
    result.set(name, { id: conflicted.id, canonicalName: conflicted.canonicalName });
  }

  return result;
}
