# Adversarial Review (3-Agent Code Review)

**Flow:** `finder` → `adversary` → `referee`

**Activated by:** `--adversarial-review` flag or `adversarialReview.enabled: true` in `.dirigent.json`

**Phase:** validate (replaces single `reviewer` agent)

## Purpose

Sycophancy-free code review using competing incentives. Instead of a single reviewer (who may unconsciously rubber-stamp), three agents argue about issues — the finder wants to find problems, the adversary wants to disprove them, and the referee just wants to be right.

## Agent Roles

| Agent | Incentive | Job |
|-------|-----------|-----|
| **finder** | +1 per real issue found | Scans ALL categories: integrity, hallucination, security, logic, performance, test quality, architecture, accessibility. Errs on side of over-reporting. |
| **adversary** | +1 per false positive killed | Challenges every finding with evidence. Checks context the finder may have missed (upstream guards, framework handling, intent). |
| **referee** | +1 per correct ruling | Rules on disputed issues with independent verification. Spot-checks ~20% of kills and survives. Can overturn bad calls. |

## Flow

```
All code changes ready for review
    ↓
finder scans 8 categories, outputs findings (F-001, F-002, ...)
    ↓
adversary challenges each finding: KILL (false positive) / SURVIVE (real) / DISPUTED
    ↓
referee rules on DISPUTED items, spot-checks KILLs and SURVIVEs, produces final issue list
    ↓
Real issues → must be fixed before ship  |  Zero issues → proceed to ship
```

## Outputs

- **finder**: Structured findings with IDs, categories, severities, evidence
- **adversary**: Per-finding verdicts (KILL/SURVIVE/DISPUTED) with counter-evidence
- **referee**: Final issue list with definitive severities, spot-check results

## State Tracking

```bash
bash .dirigent/scripts/dirigent-state.sh adversarial-report <found> <killed> <survived> <disputed> <real>
```

## When to Use

- Any workflow with a validate phase: feature, bugfix, refactor, security-fix, optimization, migration
- When single-reviewer quality isn't sufficient (complex changes, security-sensitive code)
- Long-running autonomous pipelines where human review isn't available

## Relationship to Other Debate Patterns

| Pattern | Phase | What's Evaluated | Agents |
|---------|-------|-----------------|--------|
| [Evaluator Debate](../eval-debate/) | implement | Sprint quality vs contracts | eval-advocate, eval-critic, eval-arbiter |
| **Adversarial Review** (this) | validate | Code quality, security, integrity | finder, adversary, referee |
| [Skill Debate](../skill-debate/) | any (skill steps) | Options/approaches | advocate, critic, arbiter |
