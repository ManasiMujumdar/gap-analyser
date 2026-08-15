import { NextResponse } from "next/server";
import { getSuggestionHistory } from "backend/services/dashboard";
import type { SuggestionDto, TalkingPointNarrative } from "@/lib/types";

/**
 * Task 3.5: GET /api/resume-versions/[resumeVersionId]/suggestions - suggestions
 * for a resume version, with talking-point-narrative content parsed into
 * structured fields (design.md Decision #4) rather than left as a raw JSON string.
 * An empty list is a valid response (no gaps on this version), not an error.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ resumeVersionId: string }> }) {
  const { resumeVersionId } = await params;

  const rows = await getSuggestionHistory(resumeVersionId);

  const suggestions: SuggestionDto[] = rows.map((row) => {
    if (row.type === "talking_point_narrative") {
      const parsed = JSON.parse(row.content) as TalkingPointNarrative;
      return { skillId: row.skillId, canonicalName: row.canonicalName, type: row.type, content: parsed };
    }
    return { skillId: row.skillId, canonicalName: row.canonicalName, type: row.type, content: row.content };
  });

  return NextResponse.json({ suggestions });
}
