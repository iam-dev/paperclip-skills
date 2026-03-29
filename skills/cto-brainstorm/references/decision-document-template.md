# Decision Document Template

Use this structure when the decision is operational or strategic-technical (not a pure architecture decision that should live in the codebase).

---

```markdown
# Technical Decision: [Question]

**Date**: [YYYY-MM-DD]
**Verdict**: [proceed / proceed-with-conditions / prototype-first / defer / reject]
**Confidence**: [1-10]/10

---

## Round 1: Architect Proposes

**Thesis**: [One-sentence technical position]

**Architecture**:
[Component descriptions, data flow, integration points — specific enough to start a design doc]

**Rationale**:
1. [Argument 1]
2. [Argument 2]
3. [Argument 3]
[... up to 5]

**Timeline**:
- Phase 1: [What] — [Date]
- Phase 2: [What] — [Date]
- Phase 3: [What] — [Date]

**Resource cost**: [Engineering effort, infra cost delta, operational burden change]

**Success criteria**: [Measurable outcomes — latency, throughput, reliability SLAs, velocity metrics]

---

## Round 2: Operator Challenges

1. **[Challenge title]** (critical/significant/minor) [category]: [Specific failure mode or risk]
2. **[Challenge title]** (critical/significant/minor) [category]: [Specific failure mode or risk]
3. **[Challenge title]** (critical/significant/minor) [category]: [Specific failure mode or risk]
[... 5-8 challenges]

---

## Round 3: Architect Defends

1. **[Concede/Counter/Partially concede]**: [Response to challenge 1]
2. **[Concede/Counter/Partially concede]**: [Response to challenge 2]
3. **[Concede/Counter/Partially concede]**: [Response to challenge 3]
[... matching each challenge]

---

## Round 4: Operator Stress-Tests

1. **[Stress-test title]** (critical/significant/minor): [Attack on mitigation or escalated challenge — with concrete failure scenario]
2. **[Stress-test title]** (critical/significant/minor): [Attack on mitigation or escalated challenge]
3. **[Stress-test title]** (critical/significant/minor): [New risk exposed by the defense]
[... 3-5 stress-tests]

---

## Round 5: Architect Final Stand

1. **[Response]**: [Address stress-test 1 — defense or fallback plan]
2. **[Response]**: [Address stress-test 2 — defense or fallback plan]
3. **[Response]**: [Address stress-test 3 — defense or fallback plan]

**Proposal modifications**: [What changed from the original proposal after two rounds of challenge]

---

## Round 6: CTO Decides

**Verdict**: [proceed / proceed-with-conditions / prototype-first / defer / reject]

**Rationale**: [2-4 sentences referencing specific arguments from both sides. Name which challenges were decisive.]

**Architecture modifications**: [What changed from the original proposal]

**Action items**:
1. [Who] — [What] — by [When]
2. [Who] — [What] — by [When]
3. [Who] — [What] — by [When]

**Conditions / Gates**: [For proceed-with-conditions or prototype-first: specific, verifiable criteria]

**Risks accepted**:
- [Risk from debate] — accepted because [reason]

**Review date**: [YYYY-MM-DD]

---

## Debate Metrics

| Metric | Value |
|--------|-------|
| challengesRaised | [N] |
| stressTestsRaised | [N] |
| challengesSurvived | [N] |
| challengesConceded | [N] |
| mitigationsHeld | [N] |
| mitigationsBroken | [N] |
| proposalModified | [yes/no] |
| confidenceScore | [1-10] |
```
