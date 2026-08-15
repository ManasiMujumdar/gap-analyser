import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { skills } from "../db/schema.js";
import { matchTaxonomy } from "../llm/matchTaxonomy.js";

/**
 * Task 4.1: growing taxonomy store - looks up existing canonical skill
 * entries and, via LLM-assisted semantic comparison (task 4.2), either
 * reuses an existing entry for a newly mentioned skill or creates a new one.
 * Global (not scoped to a single analysis) per design.md Decision #2/#4, so
 * the same canonical entry can be reused across analyses.
 */
export async function resolveSkill(mentionedName: string): Promise<{ id: string; canonicalName: string }> {
  const existing = await db.select().from(skills);

  const match = await matchTaxonomy(
    mentionedName,
    existing.map((s) => s.canonicalName),
  );

  if (match.matchedCanonicalName) {
    const found = existing.find((s) => s.canonicalName === match.matchedCanonicalName);
    if (found) {
      return { id: found.id, canonicalName: found.canonicalName };
    }
    // Model hallucinated a name not actually in the provided list - fall through to creating a new entry.
  }

  const [created] = await db
    .insert(skills)
    .values({ canonicalName: mentionedName })
    .onConflictDoNothing({ target: skills.canonicalName })
    .returning();

  if (created) {
    return { id: created.id, canonicalName: created.canonicalName };
  }

  // Unique-constraint race: another call created this exact canonical name concurrently.
  const [conflicted] = await db.select().from(skills).where(eq(skills.canonicalName, mentionedName));
  if (!conflicted) {
    throw new Error(`Failed to resolve or create taxonomy entry for "${mentionedName}"`);
  }
  return { id: conflicted.id, canonicalName: conflicted.canonicalName };
}
