import { NextRequest, NextResponse } from "next/server";
import { createAnalysis } from "backend/services/intake";
import { getCurrentGapState } from "backend/services/dashboard";
import { errorResponse } from "@/lib/api-errors";

// Several sequential LLM calls happen per request (JD extraction, one
// batched taxonomy-match call, resume extraction, one batched
// suggestion-generation call) - default serverless timeouts are too short.
export const maxDuration = 120;

/** Task 3.1: POST /api/analyses - creates a new analysis and returns its initial gap state. */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const jdText = typeof body?.jdText === "string" ? body.jdText.trim() : "";
  const resumeText = typeof body?.resumeText === "string" ? body.resumeText.trim() : "";

  if (!jdText || !resumeText) {
    return errorResponse("Both jdText and resumeText are required.", 400);
  }

  try {
    const { analysis, resumeVersion } = await createAnalysis(jdText, resumeText);
    const gapState = await getCurrentGapState(analysis.id);

    return NextResponse.json(
      {
        analysisId: analysis.id,
        resumeVersion,
        gapScores: gapState.gapScores,
      },
      { status: 201 },
    );
  } catch (err) {
    // TEMPORARY diagnostic - reverting once the resume-aware-suggestions
    // live-verification failure is root-caused.
    console.error("createAnalysis pipeline failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err), stack: err instanceof Error ? err.stack : undefined },
      { status: 500 },
    );
  }
}
