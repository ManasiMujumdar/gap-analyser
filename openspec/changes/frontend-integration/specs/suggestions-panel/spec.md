## Purpose

Shows the three suggestion types for a specific skill gap so the candidate can choose which action to take.

## ADDED Requirements

### Requirement: Display three suggestion types for a selected skill
When opened for a given skill and resume version, the panel SHALL display the resume-rewrite, portfolio-addition, and talking-point-narrative suggestions for that skill, visually distinguished from one another.

#### Scenario: Opening a gapped skill's suggestions
- **WHEN** a candidate opens suggestions for a skill with a gap
- **THEN** the panel displays all three suggestion types, each clearly distinguishable from the others

#### Scenario: Talking-point narrative structure
- **WHEN** the panel displays the talking-point-narrative suggestion
- **THEN** it is shown as its Situation, Task, Action, and Result components, not as a single block of raw text

### Requirement: Panel is scoped to one skill and version at a time
The panel SHALL only display suggestions for the specific skill and resume version it was opened for, and closing it SHALL NOT alter any stored data.

#### Scenario: Closing the panel
- **WHEN** a candidate closes the suggestions panel
- **THEN** the candidate returns to the Gap Report and no suggestion or gap data has been modified
