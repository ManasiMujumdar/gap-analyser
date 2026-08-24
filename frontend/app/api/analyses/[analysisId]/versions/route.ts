import { NextRequest, NextResponse } from "next/server";
import { addResumeVersion, getResumeVersions } from "backend/services/versioning";
import { errorResponse } from "@/lib/api-errors";

// Resume extraction + a batched suggestion-generation call can take longer
// than the default serverless timeout - see app/api/analyses/route.ts.
export const maxDuration = 60;

/** Task 3.2: POST /api/analyses/[analysisId]/versions - adds a new resume version and returns its delta. */
export async function POST(request: NextRequest, { params }: { params: Promise<{ analysisId: string }> }) {
  const { analysisId } = await params;

  const body = await request.json().catch(() => null);
  const resumeText = typeof body?.resumeText === "string" ? body.resumeText.trim() : "";
  if (!resumeText) {
    return errorResponse("resumeText is required.", 400);
  }

  const existingVersions = await getResumeVersions(analysisId);
  if (existingVersions.length === 0) {
    return errorResponse(`Analysis ${analysisId} was not found.`, 404);
  }

  const { resumeVersion, delta } = await addResumeVersion(analysisId, resumeText);

  return NextResponse.json({ resumeVersion, delta }, { status: 201 });
}
