# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
