# @iam-dev/paperclip-skills

Adversarial debate skills and agent assets for [Paperclip](https://github.com/paperclipai/paperclip) AI agents.

## The Problem

AI agents deciding alone produce bad outcomes. A single agent reviewing code rubber-stamps it. A single agent evaluating a strategy confirms its own bias. A single agent picking between options chooses the first one that sounds reasonable. This is the sycophancy problem — and it gets worse the more autonomous your agents become.

The root cause: **no tension**. When one agent proposes and the same agent evaluates, there's no adversarial pressure. No one is incentivized to find the flaw, challenge the assumption, or stress-test the mitigation. The result is confident-sounding decisions that fall apart in production, in the market, or in the org.

## The Solution

Competing incentives. Instead of one agent doing everything, split the work across agents that are **scored differently**:

- A **finder** who gets points for every issue found will over-report — and that's the point
- An **adversary** who gets points for killing false positives will be ruthlessly skeptical — and that's the point
- A **referee** who gets points only for correct rulings has no bias in either direction

This pattern — borrowed from adversarial ML, red-teaming, and structured analytic techniques — produces decisions that survive contact with reality because they've already survived a rigorous internal debate.

All agents integrate with [MnemeBrain](https://github.com/mnemebrain/mnemebrain-ts) for cross-session memory, evidence tracking, and contradiction detection. For local development, install [mnemebrain-lite](https://github.com/mnemebrain/mnemebrain-lite) (`pip install mnemebrain-lite`).

This package provides **7 debate protocols** and **8 agent groups** covering four domains:

| Domain | Problem | Debate |
|--------|---------|--------|
| **Strategic decisions** | CEO/CTO/CMO/COO deciding alone = confirmation bias | Brainstorm: proposer vs challenger vs decider |
| **Code quality** | Single reviewer = rubber-stamping | Adversarial review: finder vs adversary vs referee |
| **Implementation quality** | Self-evaluation = grade inflation | Eval debate: advocate vs critic vs arbiter |
| **Option selection** | First reasonable option wins = unexplored alternatives | Skill debate: advocate vs critic vs arbiter |

## Skills

### Brainstorm Skills (Strategic Decisions)

| Skill | Personas | Rounds | Use Case |
|-------|----------|--------|----------|
| **ceo-brainstorm** | Visionary, Skeptic, Pragmatist | 4 | Business strategy, pivots, M&A, pricing |
| **cmo-brainstorm** | Growth Strategist, Brand Guardian, CMO | 6 | Marketing, positioning, go-to-market, brand |
| **coo-brainstorm** | Optimizer, Frontline Operator, COO | 6 | Operations, reorgs, build-vs-outsource, scaling |
| **cto-brainstorm** | Architect, Operator, CTO | 6 | Architecture, build-vs-buy, migrations, tech stack |

### Debate Skills (Code Quality & Evaluation)

| Skill | Flow | Agents | Use Case |
|-------|------|--------|----------|
| **adversarial-review** | finder → adversary → referee | 3 | Code review, security audit, pre-merge validation |
| **eval-debate** | eval-advocate → eval-critic → eval-arbiter | 3 | Sprint QA, implementation quality assessment |
| **skill-debate** | advocate → critic → arbiter | 3 | Option evaluation, architecture choices, tech selection |

### Memory Skill

| Skill | Method | Use Case |
|-------|--------|----------|
| **para-memory-files** | PARA folders + atomic YAML facts + qmd search | Persistent file-based memory across sessions |

All agents use two complementary memory systems:
- **Belief Engine (MnemeBrain)** — shared, API-based long-term memory for decisions, evidence chains, and contradiction detection
- **PARA Memory Files** — local, file-based working memory with knowledge graph, daily notes, and tacit knowledge

All 8 skills include where applicable:
- **Competing incentives** — each agent scored with "+1 per" metrics that create adversarial tension
- **Priority-based loops** — issue priority determines iteration depth (low=1, medium=2, high=3, critical=5 loops)
- **Reporting chain** — output templates specify who receives the report (Board, CEO, CTO, Implementer, etc.)
- **Reference files** — `references/personas.md` (persona definitions) and output format templates

### Priority-Based Loops

Paperclip issues have four priority levels. Higher priority = more iterations = deeper analysis:

| Priority | Loops | Effect |
|----------|-------|--------|
| **Low** | 1 | Single pass |
| **Medium** | 2 | One refinement round — lead agent revises based on final agent's feedback |
| **High** | 3 | Two refinement rounds |
| **Critical** | 5 | Four refinement rounds — maximum rigor |

For debates, each loop re-runs the full 3-agent chain with the previous verdict as additional input. For brainstorms, each loop feeds the decider's verdict back to the proposer. Loops stop early if no new findings or position changes emerge.

## Agents

### C-Suite Agents (Onboarding Assets)

Each has AGENTS.md (role), SOUL.md (persona), HEARTBEAT.md (execution checklist), TOOLS.md.

| Agent | Role | Reports To | Brainstorm Skill |
|-------|------|------------|------------------|
| **ceo-brainstorm** | CEO — strategy, prioritization, cross-functional coordination | Board | `ceo-brainstorm` |
| **ceo-nl** | CEO (Dutch) — same role, Dutch language | Board | `ceo-brainstorm` |
| **cto-brainstorm** | CTO — technical strategy, architecture, engineering | CEO | `cto-brainstorm` |
| **cmo-brainstorm** | CMO — marketing, brand, growth, go-to-market | CEO | `cmo-brainstorm` |
| **coo-brainstorm** | COO — operations, process, team structure, scaling | CEO | `coo-brainstorm` |

### Debate Agent Groups

Each is a group of 3 agents with competing incentives, loaded from markdown files with frontmatter. All agents include role-specific **safety considerations** documenting attack surfaces and mitigations.

| Group | Agents | Phase |
|-------|--------|-------|
| **adversarial-review** | finder, adversary, referee | validate (code review) |
| **eval-debate** | eval-advocate, eval-critic, eval-arbiter | implement (sprint QA) |
| **skill-debate** | advocate, critic, arbiter | any (option evaluation) |

### Shared Protocols

Referenced by debate agents:
- `evaluation-criteria.md` — Scoring calibration guide (1-10 per dimension)
- `verification-protocol.md` — Anti-hallucination and security verification
- `team-protocol.md` — Parallel agent execution protocol

## Structure

```
├── skills/                    # Skill definitions (SKILL.md + references/ + evals/)
│   ├── ceo-brainstorm/        # references/personas.md
│   ├── cmo-brainstorm/        # references/personas.md
│   ├── coo-brainstorm/        # references/personas.md
│   ├── cto-brainstorm/        # references/personas.md
│   ├── adversarial-review/    # references/personas.md, verdict-report-template.md
│   ├── eval-debate/           # references/personas.md, sprint-evaluation-template.md
│   ├── skill-debate/          # references/personas.md, ranking-report-template.md
│   └── para-memory-files/     # references/schemas.md (PARA memory skill)
├── agents/                    # Agent definitions
│   ├── _shared/               # Shared protocols (evaluation criteria, verification)
│   ├── ceo-brainstorm/        # Onboarding: AGENTS.md, SOUL.md, HEARTBEAT.md, TOOLS.md
│   ├── ceo-nl/
│   ├── cmo-brainstorm/
│   ├── coo-brainstorm/
│   ├── cto-brainstorm/
│   └── debate/                # Orchestrated: AGENTS.md, SOUL.md, HEARTBEAT.md, TOOLS.md
│       ├── adversarial-review/  # review-finder.md, review-adversary.md, review-referee.md
│       ├── eval/                # eval-advocate.md, eval-critic.md, eval-arbiter.md
│       └── skill/               # skill-advocate.md, skill-critic.md, skill-arbiter.md
├── scripts/                   # Runtime scripts (state tracking, belief engine, workflow)
│   ├── _lib.sh                # Shared bash library (stack detection, safe writes)
│   ├── state-tracker.sh       # Pipeline state, QA rounds, adversarial reports
│   └── workflow.sh            # Workflow phases, checkpoints, agent routing
├── src/
│   ├── cli/
│   │   └── belief-engine.ts   # CLI wrapping MnemeBrain SDK
│   └── belief-engine/
│       └── formatter.ts       # Context command → markdown output
├── evals/                     # Promptfoo eval configs and test suites
│   └── promptfoo/
├── workspaces/                # Eval test results and benchmarks
└── package.json
```

## Installation

```bash
npm install @iam-dev/paperclip-skills
```

### Install into a Running Paperclip Instance

Use `scripts/install.sh` to import skills, create agents, and register scripts into a running Paperclip server:

```bash
# Install everything (auto-detect Paperclip at localhost:3100)
bash scripts/install.sh

# Specify Paperclip URL
bash scripts/install.sh --url http://localhost:3100

# Use an existing company
bash scripts/install.sh --company-id <id>

# Override import path (for Docker-mounted paths)
bash scripts/install.sh --source-path /mounted/path

# Only import skills or only create agents
bash scripts/install.sh --skills-only
bash scripts/install.sh --agents-only

# Preview what would be installed
bash scripts/install.sh --dry-run

# Machine-readable output (for scripts/CI)
bash scripts/install.sh --json
```

Environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `PAPERCLIP_URL` | `http://localhost:3100` | Base URL of Paperclip server |
| `PAPERCLIP_COMPANY` | *(creates new)* | Company ID to install into |
| `MNEMEBRAIN_URL` | `http://localhost:8000` | MnemeBrain URL for belief engine |

The script tries bulk filesystem import first, then falls back to uploading skill content via the API individually. Agents are created with role mappings and skill assignments. Existing agents are skipped to avoid duplicates.

### Belief Engine (optional)

For cross-session memory, install and run [MnemeBrain Lite](https://github.com/mnemebrain/mnemebrain-lite) locally:

```bash
pip install mnemebrain-lite
python -m mnemebrain_core  # starts on http://localhost:8000
```

Agents degrade gracefully when MnemeBrain is unavailable — debates still run, they just lack cross-session context.

## Usage

```typescript
import {
  skills,
  agents,
  shared,
  getOrchestratedAgents,
  getOnboardingAgents,
  getSubAgent,
} from '@iam-dev/paperclip-skills';

// --- Brainstorm skills ---
const ceoSkill = skills['ceo-brainstorm'];
console.log(ceoSkill.content);     // SKILL.md content
console.log(ceoSkill.references);  // { 'personas.md': '...', ... }
console.log(ceoSkill.evals);       // Eval scenarios (if any)

// --- Debate skills ---
const reviewSkill = skills['adversarial-review'];
console.log(reviewSkill.content);  // SKILL.md with protocol description

// --- C-suite agents (onboarding) ---
const ceo = agents['ceo-brainstorm'];  // type: 'onboarding'
if (ceo.type === 'onboarding') {
  console.log(ceo.agents);    // AGENTS.md — role and delegation rules
  console.log(ceo.soul);      // SOUL.md — persona and voice
  console.log(ceo.heartbeat); // HEARTBEAT.md — execution checklist
  console.log(ceo.tools);     // TOOLS.md — tool inventory
}

// --- Orchestrated debate agent ---
const debate = agents['debate'];  // type: 'orchestrated'
if (debate.type === 'orchestrated') {
  console.log(debate.agents);     // AGENTS.md — routing and flow definitions
  console.log(debate.soul);       // SOUL.md — orchestrator persona
  console.log(debate.heartbeat);  // HEARTBEAT.md — dispatch checklist
  console.log(debate.tools);      // TOOLS.md — belief engine + state tracker
  console.log(Object.keys(debate.subAgents));  // ['review-finder', 'review-adversary', ...]
  console.log(debate.subAgents['review-finder'].model);  // 'opus'
}

// --- Convenience helpers ---
const orchestrated = getOrchestratedAgents();  // { 'debate': ... }
const csuite = getOnboardingAgents();          // { 'ceo-brainstorm': ..., 'cto-brainstorm': ..., ... }
const finder = getSubAgent('debate', 'review-finder');  // AgentDefinition | null

// --- Shared protocols ---
console.log(shared['evaluation-criteria.md']);    // Scoring calibration guide
console.log(shared['verification-protocol.md']); // Anti-hallucination protocol
```

## Belief Engine CLI

The belief engine provides cross-session memory via MnemeBrain:

```bash
# Record a belief with evidence
belief-engine believe "Auth middleware is secure" \
  --evidence="agent:finder:validate" --category=review_finding

# Load context for a topic (markdown output)
belief-engine context "auth middleware changes"

# Search beliefs
belief-engine query "authentication" --limit=10

# Detect contradictions
belief-engine contradict

# Explain a belief's reasoning chain
belief-engine explain "auth middleware"

# Export all beliefs
belief-engine export
```

## Memory Architecture

All agents use two complementary memory systems:

### Working Memory — PARA Files (`para-memory-files` skill)

Local, file-based, per-agent. Based on Tiago Forte's PARA method.

```
$AGENT_HOME/life/
  projects/<name>/summary.md + items.yaml    # Active work with goals
  areas/people/<name>/                       # People, companies (ongoing)
  resources/<topic>/                         # Reference material
  archives/                                  # Inactive items
$AGENT_HOME/memory/YYYY-MM-DD.md             # Daily notes (raw timeline)
$AGENT_HOME/MEMORY.md                        # Tacit knowledge (patterns, preferences)
```

- **Atomic facts** in YAML with decay (hot/warm/cold based on recency + access count)
- **Weekly synthesis** rewrites `summary.md` from active facts
- **Search**: `qmd query "topic"` (semantic), `qmd search "phrase"` (keyword)

### Long-Term Memory — Belief Engine (MnemeBrain)

Shared, API-based, cross-agent. Persists decisions, evidence chains, and contradictions.

```bash
belief-engine believe "decision" --evidence="agent:ceo:strategy" --category=decision
belief-engine context "topic"       # Load prior findings (markdown)
belief-engine contradict            # Surface conflicting beliefs
```

### Integration

| Scenario | Working Memory (PARA) | Long-Term Memory (Belief Engine) |
|----------|----------------------|----------------------------------|
| Before decisions | Read entity summaries | Load belief context |
| After decisions | Write daily notes + extract facts | Record belief with evidence |
| Tracking entities | PARA entity folder | — |
| Cross-agent recall | — | Shared beliefs |
| Contradictions | Check PARA for prior context | `contradict` command |
| Superseding facts | Update fact status | `revise` belief |

Debate sub-agents are stateless per-debate — they use the belief engine but not PARA files. Only orchestrators and C-suite agents maintain PARA files.

## Debate Patterns

### Adversarial Review (Code Quality)

```
finder scans 8 categories → adversary challenges each finding (KILL/SURVIVE/DISPUTED)
→ referee rules on disputes, spot-checks ~20% → final issue list + verdict
```

### Evaluator Debate (Sprint QA)

```
eval-advocate defends implementation vs contract → eval-critic challenges scores
→ eval-arbiter resolves disputes → PASS / NEEDS_CHANGES / REGRESSION_DETECTED
```

### Skill Debate (Option Evaluation)

```
advocate evaluates each option's strengths → critic finds weaknesses and risks
→ arbiter ranks options → final recommendation
```

### Brainstorm (Strategic Decisions)

```
proposer presents bold case → challenger raises severity-rated objections
→ proposer defends (concede/counter) → [stress-test → final stand →] decider rules
```

## License

MIT
