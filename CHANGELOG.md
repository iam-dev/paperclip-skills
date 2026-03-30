# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-03-30

### Added

#### Competing Incentives
- All 7 skills now have explicit "+1 per" incentive scoring tables in SKILL.md
- Brainstorm skills: proposer (+1 per viable idea), challenger (+1 per real risk), decider (+1 per correct ruling)
- Debate skills: finder/advocate (+1 per valid finding), adversary/critic (+1 per valid challenge), referee/arbiter (+1 per correct ruling)

#### Reporting Chain & Output Templates
- **adversarial-review**: `references/personas.md`, `references/verdict-report-template.md` (reports to CTO / task assignee)
- **eval-debate**: `references/personas.md`, `references/sprint-evaluation-template.md` (reports to Implementer / Coordinator)
- **skill-debate**: `references/personas.md`, `references/ranking-report-template.md` (reports to domain-appropriate C-suite)

#### Safety Considerations
- All 9 debate agents now have role-specific safety considerations documenting attack surfaces and mitigations
- All 3 debate group READMEs have pattern-level safety considerations
- All 4 C-suite AGENTS.md files have expanded safety considerations (prompt injection, authority escalation, data exfiltration)
- Attack vectors covered: prompt injection to bias rankings, rubber-stamping, report poisoning, severity manipulation, data exfiltration, state recording manipulation

#### Eval Configs
- Promptfoo eval configs for cmo-brainstorm, coo-brainstorm, cto-brainstorm (local variants)
- System prompts and test suites (core + governance) for each brainstorm skill

### Fixed
- **skill-debate agents were broken copies of eval-debate** — advocate.md, critic.md, arbiter.md were copy-pasted from eval-debate and still referenced "sprint contracts". Fully rewritten to correctly evaluate options/approaches

### Changed
- Debate agents no longer embed output format templates — they reference skill templates in `skills/<name>/references/`
- Consistent structure: all 7 skills now have `references/personas.md` with persona definitions and incentives

## [0.1.0] - 2026-03-29

### Added

#### Skills
- **ceo-brainstorm**: 4-round adversarial debate (Visionary, Skeptic, Pragmatist) for strategic business decisions
- **cmo-brainstorm**: 6-round marketing debate (Growth Strategist, Brand Guardian, CMO) producing CEO Decision Briefs
- **coo-brainstorm**: 6-round operations debate (Optimizer, Frontline Operator, COO) producing CEO Decision Briefs
- **cto-brainstorm**: 6-round technical debate (Architect, Operator, CTO) producing ADRs or decision documents
- **adversarial-review**: 3-agent code review (finder → adversary → referee) with competing incentives
- **eval-debate**: 3-agent sprint QA (eval-advocate → eval-critic → eval-arbiter) with dimension scoring
- **skill-debate**: 3-agent option evaluation (advocate → critic → arbiter) for architecture/tech choices

#### Agents — C-Suite (onboarding assets)
- **ceo-brainstorm**: CEO agent — strategy, delegation, cross-functional coordination (reports to Board)
- **ceo-nl**: CEO agent in Dutch (reports to Board)
- **cto-brainstorm**: CTO agent — technical strategy, architecture, engineering (reports to CEO)
- **cmo-brainstorm**: CMO agent — marketing, brand, growth, go-to-market (reports to CEO)
- **coo-brainstorm**: COO agent — operations, process, team structure, scaling (reports to CEO)

#### Agents — Debate Groups
- **adversarial-review**: finder (over-reports issues), adversary (kills false positives), referee (rules on disputes)
- **eval-debate**: eval-advocate (defends quality), eval-critic (finds gaps), eval-arbiter (final verdict)
- **skill-debate**: advocate (argues strengths), critic (finds weaknesses), arbiter (ranks and recommends)

#### Shared Protocols
- `evaluation-criteria.md` — Scoring calibration guide for 4 dimensions (functionality, correctness, design fidelity, code quality)
- `verification-protocol.md` — Anti-hallucination, security checks, version verification
- `team-protocol.md` — Parallel agent execution and worktree isolation

#### Infrastructure
- TypeScript package with typed exports for skills, agents, and shared protocols
- Two agent types: `OnboardingAgent` (C-suite) and `DebateAgentGroup` (multi-agent debates)
- Helper functions: `getDebateGroups()`, `getOnboardingAgents()`, `getDebateAgent()`
- Promptfoo eval configs and test suites
- Eval workspaces with benchmark results (cmo, coo, cto brainstorm)
