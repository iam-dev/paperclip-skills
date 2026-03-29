# Architecture Decision Record Template

Use this structure when the decision is about system architecture, technology choices, or infrastructure — things that should be versioned alongside the codebase.

ADRs are immutable once accepted. If the decision changes, create a new ADR that supersedes the old one.

---

```markdown
# ADR-[NNN]: [Short title — e.g., "Adopt DynamoDB for Event Store"]

**Status**: [proposed / accepted / superseded by ADR-NNN / deprecated]
**Date**: [YYYY-MM-DD]
**Deciders**: [Who was involved — roles, not necessarily names]
**Confidence**: [1-10]/10

## Context

[What is the technical situation? What forces are at play? What constraints exist? 2-4 paragraphs that give a reader enough context to understand the decision without reading the full debate.]

## Decision

[The technical decision in 1-3 sentences. Clear and unambiguous.]

**Verdict**: [proceed / proceed-with-conditions / prototype-first / defer / reject]

## Consequences

### Positive
- [Benefit 1]
- [Benefit 2]

### Negative
- [Trade-off 1]
- [Trade-off 2]

### Neutral
- [Side effect that is neither clearly positive nor negative]

## Conditions / Gates

[For proceed-with-conditions or prototype-first. Omit section if verdict is proceed/defer/reject.]

- [ ] [Condition 1 — specific and verifiable]
- [ ] [Condition 2]

## Action Items

1. [Who] — [What] — by [When]
2. [Who] — [What] — by [When]
3. [Who] — [What] — by [When]

## Risks Accepted

- [Risk] — accepted because [justification]

## Review Date

[YYYY-MM-DD] — [What specifically should be evaluated at review time]

---

## Debate Record

<details>
<summary>Full adversarial debate (6 rounds)</summary>

### Round 1: Architect Proposes

**Thesis**: [One-sentence technical position]

**Architecture**:
[Component descriptions, data flow, integration points]

**Rationale**:
1. [Argument 1]
2. [Argument 2]
3. [Argument 3]

**Timeline**:
- Phase 1: [What] — [Date]
- Phase 2: [What] — [Date]

**Resource cost**: [Engineering effort, infra cost delta, operational burden]

**Success criteria**: [Measurable outcomes]

---

### Round 2: Operator Challenges

1. **[Challenge]** (severity) [category]: [Details]
2. **[Challenge]** (severity) [category]: [Details]
[... 5-8 challenges]

---

### Round 3: Architect Defends

1. **[Concede/Counter/Partial]**: [Response]
2. **[Concede/Counter/Partial]**: [Response]

---

### Round 4: Operator Stress-Tests

1. **[Stress-test]** (severity): [Concrete failure scenario]
2. **[Stress-test]** (severity): [Concrete failure scenario]
[... 3-5 stress-tests]

---

### Round 5: Architect Final Stand

1. [Response with fallback plan]
2. [Response with fallback plan]

**Proposal modifications**: [What changed]

---

### Round 6: CTO Decides

[Full decision rationale — this is the expanded version of the Decision section above]

### Debate Metrics

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

</details>
```

## Versioning

ADRs follow a sequential numbering scheme. To find the next number:

1. Check the project's `docs/adr/` directory (or equivalent)
2. Find the highest existing ADR number
3. Increment by 1

If no ADR directory exists, create `docs/adr/` and start at ADR-001.

When an ADR supersedes a previous one:
1. Update the old ADR's status to `superseded by ADR-[NNN]`
2. Reference the old ADR in the new one's Context section
