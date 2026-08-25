## Purpose

Accepts a job description and a resume as input and extracts structured, per-skill requirements (from the JD) and evidence (from the resume) that downstream gap analysis depends on.

## ADDED Requirements

### Requirement: Job description skill extraction
The system SHALL accept a job description as input and extract a list of required skills/competencies, each with an inferred depth level (Aware, Used, Owned, or Led) and a citation quoted verbatim from the job description text supporting that depth level.

#### Scenario: JD phrasing implies ownership
- **WHEN** a submitted job description contains a phrase such as "led migration to Kubernetes"
- **THEN** the system extracts a skill entry for the relevant competency with an implied depth of Led and a citation containing that phrase

#### Scenario: JD phrasing implies only awareness
- **WHEN** a submitted job description contains a phrase such as "familiarity with GraphQL a plus"
- **THEN** the system extracts a skill entry for the relevant competency with an implied depth of Aware and a citation containing that phrase

#### Scenario: No supporting citation available
- **WHEN** the system cannot identify an exact quoted phrase in the job description to support an extracted skill's depth level
- **THEN** the system SHALL NOT record a depth score for that skill without a citation

### Requirement: Resume evidence extraction
The system SHALL accept a resume as input and extract, for each skill relevant to the associated job description, the depth level (Aware, Used, Owned, or Led) demonstrated by the resume's content, with a citation quoted verbatim from the resume text supporting that depth level.

#### Scenario: Resume text demonstrates hands-on use
- **WHEN** a submitted resume contains a phrase such as "built and maintained the payments service"
- **THEN** the system extracts evidence for the relevant skill with a demonstrated depth of Used or Owned and a citation containing that phrase

#### Scenario: No evidence found for a JD-required skill
- **WHEN** a resume contains no text supporting any depth level for a skill required by the associated job description
- **THEN** the system records that skill as having no evidence entry for this resume, rather than assigning a fabricated depth or citation

### Requirement: Intake creates a new analysis
The system SHALL create a new analysis record from a submitted job description and initial resume, associating the extracted JD skill requirements and the first resume version's evidence with that analysis for use by downstream capabilities.

#### Scenario: Successful intake
- **WHEN** a candidate submits a job description and a resume together
- **THEN** the system creates a new analysis containing the extracted JD skill requirements and the resume's extracted evidence as its first version
