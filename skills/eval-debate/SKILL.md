---
name: eval-debate
description: >
  Mid-implementation quality assessment using 3 competing agents: eval-advocate (defends
  implementation quality), eval-critic (finds gaps and weaknesses), eval-arbiter (rules
  on disputes and writes final evaluation). Produces a definitive sprint evaluation with
  per-dimension scores and PASS/NEEDS_CHANGES verdict. Use during sprint QA loops to
  eliminate self-evaluation bias. Replaces a single evaluator with competing incentives.
  Do NOT use for code review (use adversarial-review) or option evaluation (use skill-debate).
---

# Evaluator Debate (3-Agent Sprint QA)

Three agents with competing incentives evaluate sprint implementation quality against acceptance criteria. Eliminates self-evaluation bias by separating defense, attack, and judgment.

## Flow

```
eval-advocate → eval-critic → eval-arbiter
```

## When to Use

- Sprint QA loops during implementation
- Quality assessment against acceptance criteria
- Any evaluation where single-evaluator bias is a risk
- Long-running autonomous pipelines requiring rigorous QA

## When NOT to Use

- Code review / security audit → use `adversarial-review`
- Evaluating options or approaches → use `skill-debate`
- Strategic decisions → use brainstorm skills

## Agent Roles

| Agent | Incentive | Job |
|-------|-----------|-----|
| **eval-advocate** | +1 per valid strength | Argues implementation MEETS sprint contracts. Finds every way the code satisfies acceptance criteria. Must be honest — no inflating. |
| **eval-critic** | +1 per valid issue | Challenges advocate's claims. Re-runs tests, traces code, finds gaps. Every challenge needs evidence. |
| **eval-arbiter** | +1 per correct ruling | Resolves disputes, spot-checks ~20%, writes final evaluation file, records QA round. |

## Competing Incentives

Each agent is scored differently — this is what creates the adversarial tension:

| Agent | Incentive | Scores by |
|-------|-----------|-----------|
| **Eval-Advocate** | +1 per valid strength defended with evidence | Grounding every PASS in file:line, test output, and code traces |
| **Eval-Critic** | +1 per valid issue found with evidence | Verifying claims, running tests, finding gaps the Advocate missed |
| **Eval-Arbiter** | +1 per correct ruling | Independent verification, spot-checking both sides, definitive scoring |

The Advocate is incentivized to defend. The Critic is incentivized to attack. The Arbiter only cares about getting the verdict right. This three-way tension eliminates single-evaluator bias.

## Reporting Chain

The evaluation reports to:
- **Implementer** — receives specific feedback on what passed and what needs work
- **Coordinator** — receives the verdict for workflow progression (next sprint or fix cycle)
- **CTO** — if the sprint is part of a CTO-owned initiative, the CTO sees the verdict summary

Use the template in `references/sprint-evaluation-template.md` for the complete output.

## Priority-Based Loops

The issue priority determines how many times the full evaluation chain runs:

| Priority | Loops | Effect |
|----------|-------|--------|
| **Low** | 1 | Single pass |
| **Medium** | 2 | Advocate strengthens defense based on arbiter feedback |
| **High** | 3 | Two refinement rounds |
| **Critical** | 5 | Four refinement rounds — maximum rigor |

On loop > 1, the advocate receives the arbiter's verdict and focuses on contested criteria, weak evidence, and dimensions that scored lowest. Each loop deepens analysis. Stop early if no scores change.

## Protocol

### Step 1: Advocate Defends

The advocate reads the sprint contract and implementation, then:
- Assesses each acceptance criterion: PASS or ACKNOWLEDGE_GAP
- Scores 4 dimensions (1-10) with evidence:
  - **Functionality** (threshold: 7) — Do acceptance criteria pass?
  - **Correctness** (threshold: 7) — Edge cases, error handling, logic
  - **Design Fidelity** (threshold: 6) — Matches design spec?
  - **Code Quality** (threshold: 5) — Clean, readable, maintainable
- Lists strengths with IDs (A-001, A-002) and file:line evidence

### Step 2: Critic Challenges

The critic receives the advocate's report and:
- Verifies each PASS claim (runs tests, checks code)
- Challenges dimension scores with counter-evidence
- Finds issues across categories: contract gaps, quality, integrity, design divergence
- Identifies deal-breakers that should force NEEDS_CHANGES

### Step 3: Arbiter Rules

The arbiter receives both reports and:
- Resolves score disputes (where delta >= 2 points) with independent verification
- Evaluates deal-breakers: CONFIRMED or MANAGEABLE
- Spot-checks ~20% of unchallenged claims
- Sets definitive per-dimension scores
- Writes verdict: **PASS**, **NEEDS_CHANGES**, or **REGRESSION_DETECTED**

## Output

The arbiter produces the sprint evaluation using the template in `references/sprint-evaluation-template.md`:
- Sprint evaluation document with definitive scores
- Per-criterion results: PASS/FAIL with evidence
- Per-dimension scores with dispute resolutions
- Verdict and specific feedback for NEEDS_CHANGES

## Dimension Thresholds

| Dimension | Weight | Threshold |
|-----------|--------|-----------|
| Functionality | 3 | 7 |
| Correctness | 3 | 7 |
| Design Fidelity | 2 | 6 |
| Code Quality | 1 | 5 |

## Integration with Paperclip

After the debate:
1. Comment on the task with the verdict and score summary
2. For NEEDS_CHANGES, create subtasks for each failed criterion
3. Track QA rounds for regression detection across sprints

## References

- `references/personas.md` — Persona definitions with incentives and constraints
- `references/sprint-evaluation-template.md` — Output format template
- `agents/debate/eval/eval-advocate.md` — Advocate agent definition
- `agents/debate/eval/eval-critic.md` — Critic agent definition
- `agents/debate/eval/eval-arbiter.md` — Arbiter agent definition
- `agents/_shared/evaluation-criteria.md` — Scoring calibration guide
- `agents/_shared/verification-protocol.md` — Shared verification protocol
