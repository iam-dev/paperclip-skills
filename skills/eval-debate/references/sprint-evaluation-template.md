# Sprint Evaluation Template

This is the final output format produced by the Eval-Arbiter. It reports to the implementer (for feedback) and the coordinator (for workflow progression). If triggered by a Paperclip task, comment on the task with the verdict and score summary.

---

```markdown
# Sprint [N] Evaluation — [Feature Slug] (Debate Verdict)

**Date**: [YYYY-MM-DD]
**Verdict**: PASS | NEEDS_CHANGES | REGRESSION_DETECTED
**QA Round**: [N]
**Reported to**: Implementer, Coordinator

---

## Summary

[2-3 sentences. What was evaluated, the verdict, and the key finding. The implementer should know exactly what passed and what needs work.]

---

## Debate Summary

- Advocate defended: [X]/[Y] criteria as PASS
- Critic challenged: [Z] criteria, found [N] issues
- Arbiter resolved: [M] disputes, overturned [K] claims

---

## Criteria Results (Definitive)

| # | Criterion | Advocate | Critic | Arbiter | Evidence |
|---|-----------|----------|--------|---------|----------|
| 1 | [description] | PASS | AGREE | PASS | file:line |
| 2 | [description] | PASS | CHALLENGE | FAIL | test output |
| 3 | [description] | ACKNOWLEDGE_GAP | CONFIRM_GAP | FAIL | — |

---

## Dimension Scores (Definitive)

| Dimension | Advocate | Critic | Arbiter | Threshold | Status |
|-----------|----------|--------|---------|-----------|--------|
| Functionality | [N] | [N] | [N] | 7 | MET / NOT MET |
| Correctness | [N] | [N] | [N] | 7 | MET / NOT MET |
| Design Fidelity | [N] | [N] | [N] | 6 | MET / NOT MET |
| Code Quality | [N] | [N] | [N] | 5 | MET / NOT MET |

**Weighted Average**: [N.N]/10

---

## Dispute Resolutions

### [Dimension]: Advocate [N] → Critic [N] → Arbiter [N]
**Reasoning**: [Why the Arbiter set this score, citing evidence]

---

## Deal-Breaker Rulings

| Issue | Critic Claim | Arbiter Ruling | Reasoning |
|-------|-------------|----------------|-----------|
| [C-001] | Deal-breaker | CONFIRMED / MANAGEABLE | [why] |

---

## Feedback (if NEEDS_CHANGES)

Specific, actionable items per failed criterion — what's wrong, not how to fix it:

1. [Criterion N]: [What failed and what evidence shows it]
2. [Criterion M]: [What failed and what evidence shows it]

---

## Debate Metrics

| Metric | Value |
|--------|-------|
| criteriaTotal | [N] |
| criteriaPassed | [N] |
| criteriaFailed | [N] |
| advocateAccuracy | [X]% (claims verified by Arbiter) |
| criticAccuracy | [Y]% (challenges confirmed by Arbiter) |
| disputesResolved | [N] |
| dealBreakersConfirmed | [N] |
| confidenceScore | [1-10] |
```
