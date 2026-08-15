import { NextResponse } from "next/server";
import { getVersionTimeline } from "backend/services/dashboard";
import { errorResponse } from "@/lib/api-errors";

/** Task 3.4: GET /api/analyses/[analysisId]/timeline - version history with per-version deltas. */
export async function GET(_request: Request, { params }: { params: Promise<{ analysisId: string }> }) {
  const { analysisId } = await params;

  const timeline = await getVersionTimeline(analysisId);
  if (timeline.length === 0) {
    return errorResponse(`Analysis ${analysisId} was not found.`, 404);
  }

  return NextResponse.json({ timeline });
}
