## ADDED Requirements

### Requirement: Suggestion generation includes the candidate's full demonstrated skillset
When generating suggestions for any gap on a resume version, the system SHALL include the candidate's resume-demonstrated skills from across that entire resume version — not only the skill with the gap — as context available to the suggestion generator, so suggestions can be grounded in tools, domains, or experience the candidate has already shown evidence of.

#### Scenario: Full skillset available during generation
- **WHEN** suggestions are generated for a gap on a resume version that has other skills with recorded evidence
- **THEN** the generation request includes those other skills' names and evidence, not only the gapped skill's own evidence

#### Scenario: No other evidence exists yet
- **WHEN** suggestions are generated for a gap on a resume version where no other skill has any recorded evidence
- **THEN** suggestion generation still proceeds successfully, using only the gapped skill's own context, without failing or requiring other evidence to exist
