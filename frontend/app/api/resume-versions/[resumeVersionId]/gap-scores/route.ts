import { NextResponse } from "next/server";
import { getGapScoresForVersion } from "backend/services/gapAnalysis";

/**
 * Task 3.9: GET /api/resume-versions/[resumeVersionId]/gap-scores - a
 * specific resume version's own gap scores, independent of whether it's
 * the analysis's latest version (timeline-screen spec: "View a historical
 * version's detail").
 */
export async function GET(_request: Request, { params }: { params: Promise<{ resumeVersionId: string }> }) {
  const { resumeVersionId } = await params;

  const gapScores = await getGapScoresForVersion(resumeVersionId);

  return NextResponse.json({ gapScores });
}
