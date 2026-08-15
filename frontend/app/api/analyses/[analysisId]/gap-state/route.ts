import { NextResponse } from "next/server";
import { getCurrentGapState } from "backend/services/dashboard";
import { errorResponse } from "@/lib/api-errors";

/** Task 3.3: GET /api/analyses/[analysisId]/gap-state - latest resume version's gap scores. */
export async function GET(_request: Request, { params }: { params: Promise<{ analysisId: string }> }) {
  const { analysisId } = await params;

  const { latestVersion, gapScores } = await getCurrentGapState(analysisId);
  if (!latestVersion) {
    return errorResponse(`Analysis ${analysisId} was not found.`, 404);
  }

  return NextResponse.json({ latestVersion, gapScores });
}
