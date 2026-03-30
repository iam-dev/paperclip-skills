---
name: cto-brainstorm
description: >
  Adversarial technical debate skill for architecture and engineering decisions.
  Three personas (Architect, Operator, CTO) debate a technical question across
  6 rounds with escalating stress-testing. Produces either a decision document
  or a versioned Architecture Decision Record (ADR) depending on the nature of
  the decision. Use when evaluating technical architecture choices, build-vs-buy
  decisions, migration strategies, technology adoption, infrastructure changes,
  or any engineering decision with significant trade-offs. Trigger this whenever
  someone mentions "technical decision", "architecture review", "should we migrate",
  "build or buy", "tech stack", "infrastructure change", "system design decision",
  or any engineering trade-off that reasonable engineers would disagree on.
  Do NOT use for business strategy (use ceo-brainstorm), routine bug fixes,
  or simple implementation questions with obvious answers.
---

# CTO Brainstorm (Adversarial Technical Debate)

Three personas stress-test a technical decision across 6 rounds — two full attack/defend cycles before the decider weighs in. Inspired by the finder/adversary/referee pattern, but cranked up: the Operator gets a second pass to attack the Architect's defenses, and the Architect must survive that before the CTO rules.

## When to Use

- Architecture decisions (monolith vs microservices, event-driven vs request-response)
- Build vs buy (auth, search, payments, observability)
- Technology adoption (new language, framework, database, cloud provider)
- Migration strategies (database, cloud, API versioning, monolith decomposition)
- Infrastructure changes with blast radius (Kubernetes, serverless, multi-region)
- Scaling decisions where the wrong call costs months of engineering time

## When NOT to Use

- Business strategy decisions (use `ceo-brainstorm` instead)
- Routine implementation choices with obvious answers
- Bug fixes or feature work that needs execution, not deliberation

## Input

You need a **technical question** — a specific architecture or engineering decision. Examples:
- "Should we migrate from PostgreSQL to DynamoDB for our event store?"
- "Should we build our own auth system or adopt Auth0?"
- "Should we rewrite the data pipeline in Rust or optimize the Python version?"
- "Should we move to a microservices architecture before scaling to 10x traffic?"

If the task doesn't contain a clear technical question, extract one from the context before starting.

## Output Format Selection

Before starting the debate, determine the output format:

- **ADR (Architecture Decision Record)**: Use when the decision is about system architecture, technology choices, or infrastructure — things that affect the codebase long-term and should be versioned alongside it. Use the template in `references/adr-template.md`.
- **Decision Document**: Use when the decision is more operational or strategic-technical (team structure, process changes, timeline trade-offs) and doesn't need to live in the repo. Use the template in `references/decision-document-template.md`.

State which format you're using and why before Round 1.

## Competing Incentives

Each persona is scored differently — this is what creates the adversarial tension:

| Persona | Incentive | Scores by |
|---------|-----------|-----------|
| **Architect** | +1 per viable architecture that survives stress-testing | Proposing specific, grounded designs the Operator can't break |
| **Operator** | +1 per real failure mode exposed | Finding specific reliability risks, migration traps, and operational burden |
| **CTO** | +1 per correct ruling | Accurate verdict, clear conditions, executable action items |

The Architect is incentivized to over-design. The Operator is incentivized to over-challenge. The CTO only cares about getting the final call right. Two rounds of attack (Rounds 2 and 4) mean weak proposals get dismantled — not accepted.

## Priority-Based Loops

The issue priority determines how many times the full brainstorm runs:

| Priority | Loops | Effect |
|----------|-------|--------|
| **Low** | 1 | Single 6-round debate |
| **Medium** | 2 | One refinement — Architect revises based on CTO feedback |
| **High** | 3 | Two refinement rounds |
| **Critical** | 5 | Four refinement rounds — maximum rigor for high-stakes decisions |

On loop > 1, the CTO's verdict feeds back to the Architect, who revises the proposal. Each loop deepens analysis rather than restarting. Stop early if no positions change.

## The 6-Round Protocol

Run all 6 rounds in a single response. For each round, adopt the persona fully (see `references/personas.md`). The key difference from lighter debate formats: the Operator gets a second attack after seeing the Architect's defenses — weak defenses get dismantled, not accepted.

### Round 1: Architect Proposes

Adopt the **Architect** persona. Present the technical proposal:

- **Thesis**: One-sentence technical position
- **Architecture**: How the system would work — components, data flow, integration points. Be specific enough that an engineer could start a design doc from this.
- **Rationale**: 3-5 supporting arguments grounded in the actual system context (current stack, team expertise, scale requirements, existing technical debt)
- **Timeline**: Migration/implementation phases with milestones
- **Resource cost**: Engineering effort, infrastructure cost delta, operational burden change
- **Success criteria**: Measurable outcomes (latency targets, throughput, reliability SLAs, developer velocity metrics)

### Round 2: Operator Challenges (First Pass)

Adopt the **Operator** persona. Issue numbered challenges:

- Each challenge must be **specific** — name the exact failure mode, operational risk, or flawed assumption
- Each challenge gets a **severity rating**: `critical` / `significant` / `minor`
  - Critical = could cause outages, data loss, or multi-month setbacks
  - Significant = materially increases operational burden or reduces reliability
  - Minor = worth noting but manageable with standard practices
- Each challenge gets a **category**: `reliability` / `complexity` / `migration-risk` / `team-capability` / `cost` / `dependency` / `security`
- Aim for **5-8 challenges** — be thorough, not theatrical
- Attack assumptions, not conclusions. If the Architect says "this will handle 10x scale," challenge the specific bottleneck, not the ambition.

### Round 3: Architect Defends

Return to the **Architect** persona. Respond to each numbered challenge:

- **Concede** challenges that are valid — acknowledge the risk and propose a concrete mitigation with estimated effort
- **Counter** challenges that are wrong — provide evidence: benchmarks, prior art, architecture patterns, or logical reasoning
- **Partially concede** where appropriate — "the risk is real but the severity is overstated because..."
- Honesty matters. A concession with a strong mitigation is worth more than a weak counter. The CTO will notice.

### Round 4: Operator Stress-Tests (Second Pass)

Return to the **Operator** persona. This is the adversarial escalation round — the one that separates this from a polite architecture review. Examine the Architect's defenses and:

- **Probe mitigations**: For each conceded challenge, attack the proposed mitigation. Is it realistic? Does it introduce new risks? Does it actually address the root cause or just shift the problem?
- **Escalate surviving challenges**: For countered challenges where the counter was weak, escalate with a more specific failure scenario.
- **Identify new risks** exposed by the defense. Sometimes the Architect's defense reveals an assumption or dependency that wasn't visible before.
- **Drop resolved challenges**: If a counter was genuinely strong, acknowledge it and move on. Don't waste time on dead arguments.
- Issue **3-5 stress-test items**, each with severity and a concrete failure scenario ("On day 45 of the migration, when both systems are running in parallel, what happens when...")

### Round 5: Architect Final Stand

Return to the **Architect** persona. This is the last chance to defend:

- Address each stress-test item directly
- For any challenge that has survived two rounds of attack, propose a **concrete fallback plan** — not a mitigation, but a "if this goes wrong, here's the escape hatch"
- Be willing to **modify the original proposal** based on what the debate has revealed. The best architects adapt.
- Summarize: what has changed from the original proposal after two rounds of challenge?

### Round 6: CTO Decides

Adopt the **CTO** persona. Deliver the final verdict:

- **Verdict**: One of: `proceed` / `proceed-with-conditions` / `prototype-first` / `defer` / `reject`
  - `proceed` = green light as proposed (with adaptations from the debate)
  - `proceed-with-conditions` = green light but specific conditions must be met before/during execution
  - `prototype-first` = the idea has merit but the risk profile demands a proof-of-concept before committing
  - `defer` = not now — specify what needs to change (market conditions, team readiness, dependencies)
  - `reject` = the proposal doesn't survive the debate
- **Rationale**: Reference specific arguments from both sides. Name which challenges were decisive and why.
- **Architecture modifications**: What changed from the original proposal based on the debate
- **Action items**: Numbered, concrete next steps (who, what, by when)
- **Conditions / Gates**: For `proceed-with-conditions` or `prototype-first`, specify the exact criteria
- **Risks accepted**: Which surviving challenges are being accepted, with justification
- **Review date**: When to revisit this decision
- **Debate metrics**: Fill in the metrics table (see below)

## Debate Metrics

Track these at the end of Round 6:

| Metric | Value |
|--------|-------|
| challengesRaised | (total from Round 2) |
| stressTestsRaised | (total from Round 4) |
| challengesSurvived | (successfully countered) |
| challengesConceded | (acknowledged as valid) |
| mitigationsHeld | (mitigations that survived stress-testing) |
| mitigationsBroken | (mitigations that failed under stress-testing) |
| proposalModified | (yes/no — did the original proposal change?) |
| confidenceScore | (1-10, CTO's confidence in the verdict) |

## Integration

After the debate completes:

1. **Store the decision**: Save the output document to the appropriate location. For ADRs, save to the project's `docs/adr/` directory (or equivalent). For decision documents, save to `$AGENT_HOME/life/projects/<topic>/`.
2. **Create action items** as subtasks via the Paperclip API if the verdict is `proceed`, `proceed-with-conditions`, or `prototype-first`. Each action item from Round 6 becomes a subtask.
3. **Comment on the task** with a summary: the verdict, confidence score, and link to the stored decision.
