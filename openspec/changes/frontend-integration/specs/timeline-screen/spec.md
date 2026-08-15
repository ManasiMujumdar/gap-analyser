## Purpose

Shows the history of resume versions submitted for an analysis, with delta summaries, so the candidate can see whether their edits are actually closing gaps.

## ADDED Requirements

### Requirement: Display version history in order
The screen SHALL display every resume version submitted to an analysis in submission order.

#### Scenario: Analysis with multiple versions
- **WHEN** an analysis has three resume versions
- **THEN** the screen displays all three in submission order

### Requirement: Display delta summary per version
Every version after the first SHALL show a summary of how many skills fall into each delta category (closed, narrowed, unchanged, widened, new) relative to the immediately preceding version. The first version SHALL show no delta summary.

#### Scenario: Non-first version
- **WHEN** the screen displays the second resume version
- **THEN** it shows counts of skills in each delta category relative to the first version

#### Scenario: First version
- **WHEN** the screen displays the first resume version
- **THEN** it shows no delta summary, since there is no preceding version to compare against

### Requirement: View a historical version's detail
Selecting a past version SHALL display that version's own gap state and suggestions as they were at that version, not the current/latest state.

#### Scenario: Expanding a past version
- **WHEN** a candidate expands version 1 of an analysis whose current version is version 3
- **THEN** the screen shows version 1's own recorded gap scores and suggestions, not version 3's
