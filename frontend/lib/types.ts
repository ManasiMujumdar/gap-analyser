export type DepthLevel = "aware" | "used" | "owned" | "led";

export interface GapScoreDto {
  skillId: string;
  canonicalName: string;
  jdDepth: DepthLevel;
  jdCitation: string;
  resumeDepth: DepthLevel | null;
  resumeCitation: string | null;
  gapSize: number;
}

export type DeltaCategory = "gap_closed" | "gap_narrowed" | "gap_unchanged" | "gap_widened" | "new_gap";

export interface SkillDeltaDto {
  skillId: string;
  canonicalName: string;
  previousGapSize: number;
  currentGapSize: number;
  category: DeltaCategory;
}

export interface TalkingPointNarrative {
  situation: string;
  task: string;
  action: string;
  result: string;
}

export type SuggestionDto =
  | { skillId: string; canonicalName: string; type: "resume_rewrite"; content: string }
  | { skillId: string; canonicalName: string; type: "portfolio_addition"; content: string }
  | { skillId: string; canonicalName: string; type: "talking_point_narrative"; content: TalkingPointNarrative };
