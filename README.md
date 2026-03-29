# @paperclip/skills

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

Each is a group of 3 agents with competing incentives, loaded from markdown files with frontmatter.

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
├── skills/                    # Skill definitions (SKILL.md + references + evals)
│   ├── ceo-brainstorm/
│   ├── cmo-brainstorm/
│   ├── coo-brainstorm/
│   ├── cto-brainstorm/
│   ├── adversarial-review/
│   ├── eval-debate/
│   └── skill-debate/
├── agents/                    # Agent definitions
│   ├── _shared/               # Shared protocols (evaluation criteria, verification)
│   ├── ceo-brainstorm/        # Onboarding: AGENTS.md, SOUL.md, HEARTBEAT.md, TOOLS.md
│   ├── ceo-nl/
│   ├── cmo-brainstorm/
│   ├── coo-brainstorm/
│   ├── cto-brainstorm/
│   ├── adversarial-review/    # Debate: README.md + finder.md, adversary.md, referee.md
│   ├── eval-debate/           # Debate: README.md + eval-advocate.md, eval-critic.md, eval-arbiter.md
│   └── skill-debate/          # Debate: README.md + advocate.md, critic.md, arbiter.md
├── evals/                     # Promptfoo eval configs and test suites
│   └── promptfoo/
├── workspaces/                # Eval test results and benchmarks
└── package.json
```

## Installation

```bash
npm install @paperclip/skills
```

## Usage

```typescript
import {
  skills,
  agents,
  shared,
  getDebateGroups,
  getOnboardingAgents,
  getDebateAgent,
} from '@paperclip/skills';

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

// --- Debate agent groups ---
const review = agents['adversarial-review'];  // type: 'debate'
if (review.type === 'debate') {
  console.log(review.readme);                  // README.md — flow description
  console.log(Object.keys(review.agents));     // ['adversary', 'finder', 'referee']
  console.log(review.agents.finder.name);      // 'finder'
  console.log(review.agents.finder.model);     // 'opus'
  console.log(review.agents.finder.tools);     // ['Read', 'Glob', 'Grep', 'Bash']
  console.log(review.agents.finder.content);   // Full agent prompt
}

// --- Convenience helpers ---
const debates = getDebateGroups();        // { 'adversarial-review': ..., 'eval-debate': ..., ... }
const csuite = getOnboardingAgents();     // { 'ceo-brainstorm': ..., 'cto-brainstorm': ..., ... }
const finder = getDebateAgent('adversarial-review', 'finder');  // AgentDefinition | null

// --- Shared protocols ---
console.log(shared['evaluation-criteria.md']);    // Scoring calibration guide
console.log(shared['verification-protocol.md']); // Anti-hallucination protocol
```

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
