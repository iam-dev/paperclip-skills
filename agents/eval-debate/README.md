# Evaluator Debate (3-Agent Sprint QA)

**Flow:** `eval-advocate` → `eval-critic` → `eval-arbiter`

**Activated by:** `--evaluator-debate` flag or `harness.evaluatorDebate: true` in `.dirigent.json`

**Phase:** implement (replaces single `evaluator` agent during sprint QA loop)

## Purpose

Mid-implementation quality assessment using competing incentives. Instead of a single evaluator grading sprints, three agents debate the quality — eliminating self-evaluation bias and producing more accurate verdicts.

## Agent Roles

| Agent | Incentive | Job |
|-------|-----------|-----|
| **eval-advocate** | +1 per valid strength found | Argues implementation MEETS sprint contracts. Finds every way the code satisfies acceptance criteria. Must be honest — no inflating scores. |
| **eval-critic** | +1 per valid issue found | Challenges the advocate's claims. Re-runs tests, traces code, finds gaps. Every challenge must have evidence. |
| **eval-arbiter** | +1 per correct ruling | Resolves disputes, spot-checks ~20% of unchallenged claims, writes final evaluation file, records QA round in state. |

## Flow

```
Sprint code committed
    ↓
eval-advocate reads sprint contract + code, scores criteria, defends strengths
    ↓
eval-critic receives advocate report, verifies claims, challenges scores, finds issues
    ↓
eval-arbiter receives both reports, resolves disputes, spot-checks, writes verdict
    ↓
PASS → next sprint  |  NEEDS_CHANGES → implementer fixes, re-evaluate
```

## Outputs

- **eval-advocate**: Criteria assessment table, dimension scores, strengths detail
- **eval-critic**: Challenges table, score disputes, issues detail, deal-breakers
- **eval-arbiter**: `docs/features/<slug>/sprint-N-evaluation.md` with definitive scores + QA round recorded in `.dirigent/state.json`

## When to Use

- Long-running autonomous pipelines (`--auto`) where quality assurance must be rigorous without human oversight
- Features with complex acceptance criteria where single-evaluator bias is a risk
- When you want the same rigor as `--adversarial-review` but applied during implementation, not just at validate

## Safety Considerations

The evaluator debate pattern is manipulation-resistant by design — competing incentives mean one compromised agent gets caught by another. However, specific attack vectors exist:

- **Sprint contract manipulation**: If an attacker can modify the contract file, they can redefine what "passing" means — making a broken sprint look good. **Mitigation**: Contract files should be versioned and reviewed. The arbiter should flag if the contract seems inconsistent with the feature scope.
- **Test result manipulation**: An attacker could inject tests that always pass or always fail to influence the debate. **Mitigation**: All three agents independently run tests. Discrepancies between agents' test results should trigger investigation.
- **Evaluation file tampering**: The arbiter writes evaluation files to disk. An attacker could try to make it write falsified results. **Mitigation**: Evaluation file content must match the arbiter's JSON return format. State recording is mandatory and auditable.
- **Report chain poisoning**: The sequential flow means each agent consumes the previous agent's output. **Mitigation**: Each agent treats upstream reports as claims to verify against actual code and tests.

## Relationship to Other Debate Patterns

| Pattern | Phase | What's Evaluated | Agents |
|---------|-------|-----------------|--------|
| **Evaluator Debate** (this) | implement | Sprint quality vs contracts | eval-advocate, eval-critic, eval-arbiter |
| [Adversarial Review](../adversarial-review/) | validate | Code quality, security, integrity | finder, adversary, referee |
| [Skill Debate](../skill-debate/) | any (skill steps) | Options/approaches | advocate, critic, arbiter |
