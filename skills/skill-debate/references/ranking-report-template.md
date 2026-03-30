# Skill Debate Ranking Report Template

This is the final output format produced by the Arbiter. It reports to whoever triggered the debate — typically the CTO (for technical options), CMO (for marketing options), COO (for operational options), or CEO (for strategic options). If the decision needs approval from a superior, format the recommendation section as a brief for that superior.

---

```markdown
# Option Evaluation: [Decision Question]

**Date**: [YYYY-MM-DD]
**Options evaluated**: [N]
**Recommended option**: [Name]
**Confidence**: high | medium | low
**Reported to**: [CTO / CMO / COO / CEO / task assignee]

---

## Executive Summary

[2-3 sentences. What was evaluated, which option won, and why. The decision-maker should be able to read this and act.]

---

## Final Ranking

| Rank | Option | Confidence | Key Reason |
|------|--------|------------|------------|
| 1 | [name] | high/medium/low | [one-sentence reason] |
| 2 | [name] | ... | ... |
| 3 | [name] | ... | ... |

---

## Option Scorecards

### Option A: [name]

| Criterion | Score | Key Evidence |
|-----------|-------|-------------|
| [criterion 1] | strong/medium/weak | [what survived the debate] |
| [criterion 2] | ... | ... |

**Validated strengths**: [N]
**Confirmed weaknesses**: [N]
**Risk level**: low / medium / high

### Option B: [name]
...

---

## Dispute Resolutions

### S-001: [Advocate claim] — VALID / OVERSTATED / WRONG
**Advocate said**: [summary]
**Critic said**: [summary]
**Arbiter ruling**: [verdict with evidence]

### W-001: [Critic weakness] — CONFIRMED / MANAGEABLE
...

---

## Deal-Breaker Rulings

| Option | Deal-Breaker | Ruling | Reasoning |
|--------|-------------|--------|-----------|
| [name] | [if any] | CONFIRMED / MANAGEABLE | [why] |

---

## Recommendation

**Best option**: [which]
**Confidence**: [high/medium/low]
**Conditions**: [what must be true for this to work]
**Risks accepted**: [what we're knowingly taking on]
**Review date**: [YYYY-MM-DD] — [what to evaluate]

---

## Debate Metrics

| Metric | Value |
|--------|-------|
| strengthsClaimed | [N] (total from Advocate) |
| strengthsValidated | [N] (survived Critic + Arbiter) |
| strengthsOverturned | [N] (Critic was right) |
| weaknessesFound | [N] (total from Critic) |
| weaknessesConfirmed | [N] (Arbiter confirmed) |
| dealBreakersConfirmed | [N] (options disqualified) |
| advocateAccuracy | [X]% |
| criticAccuracy | [Y]% |
| confidenceScore | [1-10] |
```
