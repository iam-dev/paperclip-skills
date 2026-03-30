# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.2] - 2026-03-30

### Added

#### Priority-Based Iteration Loops
- **Shared protocol** (`agents/_shared/priority-loops.md`) — loop table (low=1, medium=2, high=3, critical=5), how loops work for debates vs brainstorms, diminishing returns / early exit rule
- **Debate orchestrator** — HEARTBEAT.md gets "Determine Loop Count" step; AGENTS.md gets "Priority-Based Loops" section; dispatch now loops with feedback from final agent
- **Debate sub-agents** — finder, eval-advocate, and skill-advocate get "Refinement Rounds (Loop > 1)" sections: on subsequent loops they receive the previous verdict and focus on gaps, disputed areas, and deeper analysis rather than re-scanning everything
- **All 7 SKILL.md files** — "Priority-Based Loops" section with role-specific feedback patterns (e.g., CTO verdict feeds back to Architect, CMO verdict feeds back to Growth Strategist)
- **All 5 C-suite HEARTBEATs** — new step for priority-based brainstorm loops with loop table
- **All 5 C-suite AGENTS.md** — brainstorm sections updated with loop paragraph referencing shared protocol

## [0.3.1] - 2026-03-30

### Added

#### Unified Two-Layer Memory System
- **`para-memory-files` skill** added to repo (`skills/para-memory-files/`) — PARA-method file-based memory with knowledge graph, daily notes, tacit knowledge, qmd search, and memory decay
- All C-suite agents (CEO, CEO-NL, CTO, CMO, COO) now have unified "Memory and Planning" section in AGENTS.md documenting both memory systems and when to use which
- All C-suite TOOLS.md files updated with PARA Memory section (qmd commands, entity structure, daily notes) alongside existing belief engine docs
- Debate orchestrator gets PARA memory for tracking debate history and patterns; sub-agents remain stateless per-debate
- `agents/_shared/verification-protocol.md` rewritten: "Memory Systems" section replaces belief-engine-only section, documents both layers and their integration points

### Changed
- **Agent memory architecture** — all agents now use two complementary systems:
  - **Working Memory** (PARA files) — local, file-based, per-agent: knowledge graph in `$AGENT_HOME/life/`, daily notes, tacit knowledge
  - **Long-Term Memory** (Belief Engine/MnemeBrain) — shared, API-based, cross-agent: beliefs with evidence chains, contradiction detection
- **Debate orchestrator HEARTBEAT.md** — step 2 expanded from belief-engine-only to loading context from both memory systems
- CEO safety consideration updated to reference both PARA files and belief engine for memory manipulation mitigation

## [0.3.0] - 2026-03-30

### Added

#### Belief Engine — Cross-Session Memory
- **TypeScript CLI** (`src/cli/belief-engine.ts`) wrapping the `mnemebrain` SDK — replaces 1100-line Python script
- **Formatter** (`src/belief-engine/formatter.ts`) for `context` command markdown output with confidence %, truth state, contradiction surfacing
- 9 CLI commands: `believe`, `context`, `query`, `explain`, `revise`, `retract`, `contradict`, `stats`, `export`
- Graceful degradation: exit 0 even when MnemeBrain is unreachable (errors to stderr)
- All agents (C-suite + debate) now integrate belief engine for cross-session memory, contradiction detection, and decision recording

#### Orchestrated Agent Type
- New `OrchestratedAgent` interface combining onboarding structure (AGENTS.md, SOUL.md, HEARTBEAT.md, TOOLS.md) with sub-agent definitions in subdirectories
- `classifyAgentDir()` auto-detects orchestrated, debate (legacy), or onboarding agent types
- `loadOrchestratedAgent()` scans both top-level .md files and subdirectories for sub-agents
- New helpers: `getOrchestratedAgents()`, `getSubAgent()`

#### Unified Debate Orchestrator (`agents/debate/`)
- Single orchestrated agent replacing 3 separate debate agent directories
- AGENTS.md — routes to 3 debate flows, documents competing incentives pattern
- SOUL.md — impartial orchestrator persona with zero-bias principles
- HEARTBEAT.md — sequential dispatch chains referencing TOOLS.md
- TOOLS.md — belief engine and state tracker command reference
- Sub-agents organized in subdirectories: `adversarial-review/`, `eval/`, `skill/`
- All 9 sub-agents have belief engine integration (context loading on start, belief recording on completion)

#### Debate Agent Evals
- Promptfoo eval config for debate orchestrator (`promptfooconfig.debate-local.yaml`)
- System prompt combining AGENTS.md + SOUL.md + HEARTBEAT.md + TOOLS.md
- Core tests: routing, sequential execution, belief context loading, contradiction checking, state recording
- Governance tests: cross-flow isolation, orchestrator neutrality, graceful degradation

#### C-Suite Belief Engine Integration
- All 5 C-suite TOOLS.md files updated with full belief engine documentation and role-specific categories
- All 5 C-suite HEARTBEAT.md files reference TOOLS.md for belief engine commands
- C-suite eval tests updated to verify mnemebrain toolcall integration (context loading + belief recording)

### Changed
- **ESM migration** — project switched from CommonJS to ESM (`"type": "module"`, `module: "Node16"`) for mnemebrain SDK compatibility
- **Package dependency** — `mnemebrain` SDK from npm registry (was local file reference)
- **Agent references** — all paths updated from `agents/adversarial-review/`, `agents/eval-debate/`, `agents/skill-debate/` to `agents/debate/{adversarial-review,eval,skill}/`
- **workflow.sh** — `BELIEF_SCRIPT` changed from `scripts/belief-engine.py` to `node dist/cli/belief-engine.js`
- **Shared protocols** — `verification-protocol.md` and `team-protocol.md` updated with belief engine sections

### Deprecated
- `DebateAgentGroup` type — use `OrchestratedAgent` instead
- `getDebateGroups()` — use `getOrchestratedAgents()` instead
- `getDebateAgent()` — use `getSubAgent()` instead

### Removed
- `scripts/belief-engine.py` — replaced by TypeScript CLI
- `scripts/requirements.txt` — no longer needed (Python dependency removed)
- `agents/adversarial-review/` (standalone) — consolidated into `agents/debate/adversarial-review/`
- `agents/eval-debate/` (standalone) — consolidated into `agents/debate/eval/`
- `agents/skill-debate/` (standalone) — consolidated into `agents/debate/skill/`

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
