/**
 * Task 8.1/8.2: full core-loop walkthrough against a real database and LLM.
 *
 * Requires DATABASE_URL and GEMINI_API_KEY to be set (see .env.example),
 * and the schema to already be migrated (`npm run db:migrate`).
 *
 * Run with: npm exec tsx scripts/e2e-walkthrough.ts
 */
import "dotenv/config";
import { createAnalysis } from "../src/services/intake.js";
import { addResumeVersion } from "../src/services/versioning.js";
import { getCurrentGapState, getVersionTimeline, getSuggestionHistory } from "../src/services/dashboard.js";
import { isValidCitation } from "../src/lib/citations.js";
import { db } from "../src/db/client.js";
import { analyses, jdSkillRequirements, resumeVersions, resumeEvidence } from "../src/db/schema.js";
import { eq } from "drizzle-orm";

const SAMPLE_JD = `We're looking for a Senior Backend Engineer. You'll have led the migration of a monolith to a distributed, microservices-based architecture, and own the design of our event-driven data pipeline end-to-end. Familiarity with GraphQL is a plus.`;

const SAMPLE_RESUME_V1 = `Backend Engineer with 4 years of experience. Built and maintained REST APIs for a payments platform. Worked with Kafka to process event streams. Familiar with GraphQL from a side project.`;

const SAMPLE_RESUME_V2 = `Backend Engineer with 4 years of experience. Led the migration of our payments platform from a monolith to a microservices architecture, coordinating across three teams. Owned the end-to-end design of our Kafka-based event-driven data pipeline, from schema design to deployment. Familiar with GraphQL from a side project.`;

async function main() {
  console.log("--- Step 1: submit JD + resume v1 ---");
  const { analysis, resumeVersion: v1 } = await createAnalysis(SAMPLE_JD, SAMPLE_RESUME_V1);
  console.log(`Analysis ${analysis.id} created, resume version 1 (${v1.id})`);

  const initialState = await getCurrentGapState(analysis.id);
  console.log("Gap state after v1:", JSON.stringify(initialState.gapScores, null, 2));

  const initialSuggestions = await getSuggestionHistory(v1.id);
  console.log(`Generated ${initialSuggestions.length} suggestion rows for v1`);

  console.log("\n--- Step 2: submit resume v2 (addresses the ownership/leadership gaps) ---");
  const { resumeVersion: v2, delta } = await addResumeVersion(analysis.id, SAMPLE_RESUME_V2);
  console.log(`Resume version 2 created (${v2.id})`);
  console.log("Delta v1 -> v2:", JSON.stringify(delta, null, 2));

  const timeline = await getVersionTimeline(analysis.id);
  console.log(`\nVersion timeline has ${timeline.length} entries`);

  console.log("\n--- Step 3 (task 8.2): citation integrity check across all stored data ---");
  const [jdReqs, evidenceRows] = await Promise.all([
    db.select().from(jdSkillRequirements).where(eq(jdSkillRequirements.analysisId, analysis.id)),
    db
      .select()
      .from(resumeEvidence)
      .where(eq(resumeEvidence.resumeVersionId, v1.id)),
  ]);

  let invalidCount = 0;
  for (const req of jdReqs) {
    if (!isValidCitation(SAMPLE_JD, req.jdCitation)) {
      invalidCount++;
      console.error(`INVALID JD citation stored: "${req.jdCitation}"`);
    }
  }
  for (const ev of evidenceRows) {
    if (!isValidCitation(SAMPLE_RESUME_V1, ev.evidenceCitation)) {
      invalidCount++;
      console.error(`INVALID resume citation stored: "${ev.evidenceCitation}"`);
    }
  }

  if (invalidCount === 0) {
    console.log("All stored citations verified against their source text. Walkthrough passed.");
  } else {
    console.error(`${invalidCount} invalid citation(s) found - walkthrough FAILED.`);
    process.exitCode = 1;
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$client.end();
  });
