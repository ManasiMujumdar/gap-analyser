import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

/**
 * Depth rubric shared by JD requirements and resume evidence (design.md Decision #1).
 * Ordinal order matters: aware < used < owned < led.
 */
export const depthLevelEnum = pgEnum("depth_level", [
  "aware",
  "used",
  "owned",
  "led",
]);

export const suggestionTypeEnum = pgEnum("suggestion_type", [
  "resume_rewrite",
  "portfolio_addition",
  "talking_point_narrative",
]);

/** One JD, the root of a candidate's analysis (task 1.2). */
export const analyses = pgTable("analyses", {
  id: uuid("id").defaultRandom().primaryKey(),
  jdText: text("jd_text").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Growing taxonomy entry (design.md Decision #2). Global, not scoped to a
 * single analysis, so the same canonical skill can be reused across
 * analyses even though cross-analysis correlation is out of scope here.
 */
export const skills = pgTable("skills", {
  id: uuid("id").defaultRandom().primaryKey(),
  canonicalName: text("canonical_name").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

/** Per-skill requirement extracted from a JD, at analysis creation time. */
export const jdSkillRequirements = pgTable(
  "jd_skill_requirements",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    analysisId: uuid("analysis_id")
      .notNull()
      .references(() => analyses.id, { onDelete: "cascade" }),
    skillId: uuid("skill_id")
      .notNull()
      .references(() => skills.id, { onDelete: "restrict" }),
    jdDepth: depthLevelEnum("jd_depth").notNull(),
    jdCitation: text("jd_citation").notNull(),
  },
  (t) => [unique().on(t.analysisId, t.skillId)],
);

/** One uploaded resume, ordered within its analysis (task 1.4). */
export const resumeVersions = pgTable(
  "resume_versions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    analysisId: uuid("analysis_id")
      .notNull()
      .references(() => analyses.id, { onDelete: "cascade" }),
    versionNumber: integer("version_number").notNull(),
    resumeText: text("resume_text").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [unique().on(t.analysisId, t.versionNumber)],
);

/**
 * Evidence extracted from a specific resume version for a specific skill.
 * Absence of a row = no evidence found (jd-resume-intake spec scenario).
 */
export const resumeEvidence = pgTable(
  "resume_evidence",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    resumeVersionId: uuid("resume_version_id")
      .notNull()
      .references(() => resumeVersions.id, { onDelete: "cascade" }),
    skillId: uuid("skill_id")
      .notNull()
      .references(() => skills.id, { onDelete: "restrict" }),
    evidenceDepth: depthLevelEnum("evidence_depth").notNull(),
    evidenceCitation: text("evidence_citation").notNull(),
  },
  (t) => [unique().on(t.resumeVersionId, t.skillId)],
);

/**
 * Gap score per (ResumeVersion x Skill) - design.md Decision #4. This is the
 * stable unit diffed between versions for the delta/progress view, so it
 * carries both sides' depth + citations rather than requiring a join/re-derivation.
 */
export const gapScores = pgTable(
  "gap_scores",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    resumeVersionId: uuid("resume_version_id")
      .notNull()
      .references(() => resumeVersions.id, { onDelete: "cascade" }),
    skillId: uuid("skill_id")
      .notNull()
      .references(() => skills.id, { onDelete: "restrict" }),
    jdDepth: depthLevelEnum("jd_depth").notNull(),
    jdCitation: text("jd_citation").notNull(),
    // null resumeDepth/resumeCitation = no evidence found for this skill.
    resumeDepth: depthLevelEnum("resume_depth"),
    resumeCitation: text("resume_citation"),
    gapSize: integer("gap_size").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [unique().on(t.resumeVersionId, t.skillId)],
);

/** Three suggestion types per gapped skill per resume version (design.md Decision #3). */
export const suggestions = pgTable(
  "suggestions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    resumeVersionId: uuid("resume_version_id")
      .notNull()
      .references(() => resumeVersions.id, { onDelete: "cascade" }),
    skillId: uuid("skill_id")
      .notNull()
      .references(() => skills.id, { onDelete: "restrict" }),
    type: suggestionTypeEnum("type").notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [unique().on(t.resumeVersionId, t.skillId, t.type)],
);
