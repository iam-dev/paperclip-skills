# Adversarial Review Verdict Report Template

This is the final output format produced by the Referee. It reports to whoever triggered the review — typically the CTO (for engineering tasks) or the task assignee. If the review was triggered by a Paperclip task, comment on the task with the verdict summary.

---

```markdown
# Adversarial Review: [Feature/PR Description]

**Date**: [YYYY-MM-DD]
**Scope**: [N] files changed
**Verdict**: APPROVED | NEEDS CHANGES
**Requested by**: [CTO / task assignee / pipeline]

---

## Executive Summary

[2-3 sentences. What was reviewed, what the verdict is, and the key finding (if any). The CTO should be able to read this and know whether to proceed.]

---

## Final Issue List

The definitive list of real issues that must be addressed:

| ID | File | Severity | Category | Description |
|----|------|----------|----------|-------------|
| F-001 | path:line | BLOCKER | security | ... |
| F-003 | path:line | WARNING | logic | ... |
| ... | ... | ... | ... | ... |

**BLOCKERS**: [N]
**WARNINGS**: [N]
**SUGGESTIONS**: [N]

---

## Disputed Rulings

### F-001: REAL ISSUE | NOT AN ISSUE
**Finder said**: [summary]
**Adversary said**: [summary]
**Referee ruling**: [verdict]
**Reasoning**: [why, citing specific code evidence]
**Final severity**: BLOCKER | WARNING | SUGGESTION

### F-002: ...

---

## Overturned Kills (if any)

### F-005: OVERTURNED — REAL ISSUE
**Adversary claimed**: [their reason for killing]
**Referee found**: [why it's actually real]
**Final severity**: BLOCKER | WARNING | SUGGESTION

---

## Severity Adjustments (if any)

### F-008: WARNING → BLOCKER
**Reason**: [why severity should change]

---

## Debate Metrics

| Metric | Value |
|--------|-------|
| totalFindings | [N] (from Finder) |
| killed | [N] (false positives eliminated) |
| survived | [N] (confirmed real) |
| disputed | [N] (sent to Referee) |
| realIssues | [N] (final count) |
| finderAccuracy | [X]% (real / total) |
| adversaryAccuracy | [Y]% (correct kills + correct survives / total) |

---

## Verdict

**APPROVED** — No blockers found. Proceed to ship.

OR

**NEEDS CHANGES** — [N] blockers must be resolved before merge.

Action items:
1. [Who] — Fix [F-001 description] — by [When]
2. [Who] — Fix [F-003 description] — by [When]
```
