---
name: ceo-brainstorm
description: >
  Adversarial debate skill for strategic decision-making. Three CEO personas
  (Visionary, Skeptic, Pragmatist) debate a strategic question in 4 rounds,
  producing a structured decision document with verdict, action items, and
  confidence score. Use when facing strategic decisions, evaluating new
  initiatives, assessing risks, or resolving cross-functional trade-offs.
  Do NOT use for routine operational tasks, delegation, or simple yes/no questions.
---

# CEO Brainstorm (Adversarial Debate)

Three personas debate a strategic question in 4 rounds, producing a decision document. Inspired by the finder/adversary/referee adversarial review pattern.

## When to Use

- Major strategic decisions (new markets, pricing, pivots, partnerships)
- Evaluating initiatives with significant resource commitment
- Resolving trade-offs where reasonable people disagree
- Any decision the CEO would normally sleep on

## When NOT to Use

- Routine delegation or task assignment
- Simple operational decisions with obvious answers
- Tasks that need execution, not deliberation

## Input

You need a **strategic question** -- a clear, specific decision to evaluate. Examples:
- "Should we pivot from B2B to B2C in Q3?"
- "Should we acquire CompanyX for $2M?"
- "Should we double engineering headcount before product-market fit?"

If the task doesn't contain a clear strategic question, extract one from the context before starting.

## Competing Incentives

Each persona is scored differently — this is what creates the adversarial tension:

| Persona | Incentive | Scores by |
|---------|-----------|-----------|
| **Visionary** | +1 per bold opportunity surfaced that survives scrutiny | Proposing concrete, grounded strategies the Skeptic can't kill |
| **Skeptic** | +1 per real flaw exposed | Finding specific risks, dependencies, and flawed assumptions |
| **Pragmatist** | +1 per correct ruling | Accurate verdict, clear rationale, executable action items |

The Visionary is incentivized to over-propose. The Skeptic is incentivized to over-challenge. The Pragmatist only cares about getting the final call right. This tension is the mechanism — without it, a single agent would confirm its own bias.

## Priority-Based Loops

The issue priority determines how many times the full brainstorm runs:

| Priority | Loops | Effect |
|----------|-------|--------|
| **Low** | 1 | Single 4-round debate |
| **Medium** | 2 | One refinement — proposer revises based on decider feedback |
| **High** | 3 | Two refinement rounds |
| **Critical** | 5 | Four refinement rounds — maximum rigor for high-stakes decisions |

On loop > 1, the Pragmatist's verdict feeds back to the Visionary, who revises the proposal incorporating feedback. Each loop deepens analysis rather than restarting. Stop early if no positions change.

## The 4-Round Protocol

Run all 4 rounds in a single response. For each round, adopt the persona fully (see `references/personas.md`). Use the persona's voice, incentives, and constraints.

### Round 1: Visionary Proposes

Adopt the **Visionary** persona. Present a bold strategic proposal:

- **Thesis**: One-sentence position
- **Rationale**: 3-5 supporting arguments grounded in company context
- **Timeline**: Key milestones and target dates
- **Resources needed**: People, money, technology, partnerships
- **Upside scenario**: What success looks like, quantified where possible

### Round 2: Skeptic Challenges

Adopt the **Skeptic** persona. Issue numbered challenges against the Visionary's proposal:

- Each challenge must be **specific** (not generic pessimism)
- Each challenge gets a **severity rating**: critical / significant / minor
- Critical = could kill the initiative or the company
- Significant = materially affects success probability
- Minor = worth noting but manageable
- Aim for 4-7 challenges total

### Round 3: Visionary Defends

Return to the **Visionary** persona. Respond to each numbered challenge:

- **Concede** challenges that are valid -- acknowledge the risk and propose a mitigation
- **Counter** challenges that are wrong or overstated -- provide evidence or reasoning
- Be honest. Conceding a strong challenge is better than a weak defense.

### Round 4: Pragmatist Decides

Adopt the **Pragmatist** persona. Deliver the final verdict:

- **Verdict**: One of: `proceed` / `modify-and-proceed` / `defer` / `reject`
- **Rationale**: Reference specific arguments from both sides
- **Action items**: Numbered, concrete next steps (who, what, by when)
- **Risks accepted**: Which challenges are being accepted and why
- **Review date**: When to revisit this decision
- **Debate metrics**: Fill in the metrics table (see below)

## Debate Metrics

Track these at the end of Round 4:

| Metric | Value |
|--------|-------|
| challengesRaised | (total challenges from Round 2) |
| challengesSurvived | (countered successfully in Round 3) |
| challengesDefeated | (proven wrong or irrelevant) |
| challengesConceded | (acknowledged as valid risks) |
| confidenceScore | (1-10, Pragmatist's confidence in the verdict) |

## Output Format

Use the template in `references/decision-document-template.md` for the complete output.

## Integration

After the debate completes:

1. **Store the decision** using `para-memory-files`: save the decision document to `$AGENT_HOME/life/projects/<topic>/` as a decision record.
2. **Create action items** as subtasks via the Paperclip API if the verdict is `proceed` or `modify-and-proceed`. Each action item from Round 4 becomes a subtask of the current task, delegated to the appropriate report.
3. **Comment on the task** with a summary: the verdict, confidence score, and link to the stored decision.
