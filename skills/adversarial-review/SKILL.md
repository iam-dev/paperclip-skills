---
name: adversarial-review
description: >
  Sycophancy-free code review using 3 competing agents: finder (finds all issues),
  adversary (disproves false positives), referee (rules on disputes). Produces a
  definitive issue list with severity ratings and final verdict (APPROVED/NEEDS CHANGES).
  Use for code review, security audit, pre-merge validation, or any quality gate where
  single-reviewer bias is a risk. Replaces a single reviewer with competing incentives.
  Do NOT use for sprint QA (use eval-debate) or option evaluation (use skill-debate).
---

# Adversarial Review (3-Agent Code Review)

Three agents with competing incentives review code changes. The finder wants to find everything, the adversary wants to disprove false positives, and the referee just wants to get it right.

## Flow

```
finder → adversary → referee
```

## When to Use

- Code review before merge
- Security audit of changes
- Pre-deploy validation
- Any quality gate where rubber-stamping is a risk
- Long-running autonomous pipelines without human review

## When NOT to Use

- Sprint QA / implementation quality → use `eval-debate`
- Evaluating options or approaches → use `skill-debate`
- Strategic decisions → use `ceo/cto/cmo/coo-brainstorm`

## Agent Roles

| Agent | Incentive | Job |
|-------|-----------|-----|
| **finder** | +1 per real issue | Scans ALL categories: integrity, hallucination, security, logic, performance, test quality, architecture, accessibility. Errs on over-reporting. |
| **adversary** | +1 per false positive killed | Challenges every finding with evidence. Checks context the finder missed (upstream guards, framework handling, intent). |
| **referee** | +1 per correct ruling | Rules on disputed issues with independent verification. Spot-checks ~20% of kills and survives. Can overturn bad calls. |

## Competing Incentives

Each agent is scored differently — this is what creates the adversarial tension:

| Agent | Incentive | Scores by |
|-------|-----------|-----------|
| **Finder** | +1 per real issue found | Scanning all 8 categories thoroughly, citing exact file:line evidence |
| **Adversary** | +1 per false positive killed | Disproving findings with framework defenses, upstream guards, and context |
| **Referee** | +1 per correct ruling | Independent verification, spot-checking both sides, ruling definitively |

The Finder is incentivized to over-report. The Adversary is incentivized to over-kill. The Referee only cares about getting the final call right. This three-way tension means no single agent's bias dominates.

## Reporting Chain

The verdict reports to whoever triggered the review:
- **Engineering tasks** → CTO (or the task assignee)
- **Pipeline / CI** → the pipeline orchestrator
- **Cross-functional** → the relevant C-suite lead

Use the template in `references/verdict-report-template.md` for the complete output.

## Protocol

### Step 1: Finder Scans

The finder reads all changed files and reports every issue found across 8 categories:
1. Integrity violations (stubs, placeholders, swallowed errors)
2. Hallucinated code (non-existent imports, missing packages)
3. Security issues (injection, hardcoded secrets, eval)
4. Logic errors (off-by-one, null handling, race conditions)
5. Performance issues (N+1, blocking main thread)
6. Test quality (skipped tests, weak assertions)
7. Architecture (cross-layer imports, circular deps)
8. Accessibility (missing alt text, missing labels)

Each issue gets an ID (F-001), file:line, severity (BLOCKER/WARNING/SUGGESTION), category, and evidence.

### Step 2: Adversary Challenges

For each finding, the adversary issues a verdict:
- **KILL** — false positive, with proof (guard exists upstream, framework handles it, intentional pattern)
- **SURVIVE** — real issue, adversary concedes
- **DISPUTED** — genuinely ambiguous, needs referee

### Step 3: Referee Rules

The referee:
- Rules on all DISPUTED items with independent code verification
- Spot-checks ~20% of KILLs (catches lazy adversary)
- Spot-checks ~20% of SURVIVEs (catches lazy finder)
- Produces the final issue list with definitive severities

## Output

The referee produces the verdict report using the template in `references/verdict-report-template.md`:
- Executive summary for the CTO / decision-maker
- Final issue list (real issues that must be addressed)
- Verdict: **APPROVED** (no blockers) or **NEEDS CHANGES** (blockers exist)
- Debate metrics: finder accuracy %, false positive rate %

## Integration with Paperclip

After the debate:
1. If the review was triggered by a task, comment on the task with the verdict and issue summary
2. For NEEDS CHANGES, create subtasks for each BLOCKER finding
3. Store the verdict in the agent's memory for trend tracking

## References

- `references/personas.md` — Persona definitions with incentives and constraints
- `references/verdict-report-template.md` — Output format template
- `agents/adversarial-review/finder.md` — Finder agent definition
- `agents/adversarial-review/adversary.md` — Adversary agent definition
- `agents/adversarial-review/referee.md` — Referee agent definition
- `agents/_shared/verification-protocol.md` — Shared verification protocol
