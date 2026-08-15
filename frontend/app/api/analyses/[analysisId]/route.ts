import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "backend/db/client";
import { analyses } from "backend/db/schema";
import { errorResponse } from "@/lib/api-errors";

/**
 * Task 3.8: GET /api/analyses/[analysisId] - the analysis's job description
 * text, for screens (the intake screen's existing-analysis mode) that need
 * to display it without fetching the full gap state. Queries the `analyses`
 * table directly via backend's existing `./db/*` export rather than adding
 * a new backend service function, per proposal.md's no-backend-changes scope.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ analysisId: string }> }) {
  const { analysisId } = await params;

  const [analysis] = await db.select().from(analyses).where(eq(analyses.id, analysisId));
  if (!analysis) {
    return errorResponse(`Analysis ${analysisId} was not found.`, 404);
  }

  return NextResponse.json({ id: analysis.id, jdText: analysis.jdText, createdAt: analysis.createdAt });
}
