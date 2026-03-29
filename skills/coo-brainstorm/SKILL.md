---
name: coo-brainstorm
description: >
  Adversarial debate skill for operations, process, and organizational decisions.
  Three personas (Optimizer, Frontline Operator, COO) debate an operational
  question across 6 rounds with escalating stress-testing, then present the
  result to the CEO for final approval. Produces a structured CEO Decision
  Brief. Use when evaluating team restructuring, build-vs-outsource decisions,
  process optimization, scaling operations, quality-vs-speed tradeoffs, vendor
  decisions, automation investments, hiring plans, cross-functional coordination
  changes, or any operational decision with significant org-wide impact.
  Trigger this whenever someone mentions "operations", "team structure",
  "outsource", "vendor selection", "process improvement", "automation",
  "scaling the team", "hiring plan", "reorg", "operational efficiency",
  "SLA decisions", "support operations", "onboarding process", or any
  organizational/operational trade-off where reasonable operators would disagree.
  Do NOT use for business strategy (use ceo-brainstorm), technical architecture
  (use cto-brainstorm), marketing decisions (use cmo-brainstorm), or routine
  task management.
---

# COO Brainstorm (Adversarial Operations Debate)

Three personas stress-test an operational decision across 6 rounds — two full attack/defend cycles before the COO weighs in and presents to the CEO. The Optimizer pushes for efficiency and scale; the Frontline Operator represents the people who actually execute and challenges assumptions about what's realistic on the ground; the COO synthesizes and decides.

The tension here is different from technical or marketing debates. Operational decisions affect people directly — their workload, their processes, their daily experience. The Frontline Operator exists because the gap between "how leadership thinks the operation works" and "how the operation actually works" is where most operational failures originate.

## When to Use

- Team restructuring (reorgs, reporting changes, new functions)
- Build vs outsource (support, QA, ops functions, managed services)
- Process optimization (workflow changes, tool migrations, automation)
- Scaling operations (hiring plans, capacity planning, geographic expansion)
- Quality vs speed tradeoffs (SLAs, release cadence, support tiers)
- Vendor decisions (tooling, outsourced services, platform changes)
- Cross-functional coordination changes (handoff processes, shared services)
- Automation investments (what to automate, what stays manual, transition plans)

## When NOT to Use

- Business strategy (market entry, pivots) → use `ceo-brainstorm`
- Technical architecture → use `cto-brainstorm`
- Marketing/growth decisions → use `cmo-brainstorm`
- Routine process execution or task management

## Input

You need an **operational question** — a specific process, org, or scaling decision. Examples:
- "Should we outsource tier-1 support or build an internal team?"
- "Should we restructure engineering from feature teams to platform + product teams?"
- "Should we automate our customer onboarding or keep it white-glove?"
- "Should we consolidate our 3 regional ops teams into one centralized function?"

If the task doesn't contain a clear operational question, extract one from the context before starting.

## Output Format

The output is a **CEO Decision Brief** — the COO's recommendation packaged for the CEO to approve, modify, or reject. Use the template in `references/ceo-decision-brief-template.md`.

## The 6-Round Protocol

Run all 6 rounds in a single response. For each round, adopt the persona fully (see `references/personas.md`).

### Round 1: Optimizer Proposes

Adopt the **Optimizer** persona. Present the operational proposal:

- **Thesis**: One-sentence operational position
- **Operating model**: How this works day-to-day — people, processes, tools, handoffs. Be specific enough that an ops manager could start implementing.
- **Rationale**: 3-5 supporting arguments grounded in actual company context (team size, current throughput, bottlenecks, cost structure, growth trajectory)
- **Timeline**: Implementation phases with milestones
- **Resource cost**: Headcount changes, tooling costs, transition effort, training investment
- **Success metrics**: Measurable outcomes (throughput, cost per unit, SLA targets, employee satisfaction, quality scores)

### Round 2: Frontline Operator Challenges (First Pass)

Adopt the **Frontline Operator** persona. Issue numbered challenges:

- Each challenge must be **specific** — name the exact execution risk, people impact, or flawed assumption about how the work actually gets done
- Each challenge gets a **severity rating**: `critical` / `significant` / `minor`
  - Critical = could cause service outages, mass attrition, or complete process breakdown
  - Significant = materially degrades quality, morale, or throughput during/after transition
  - Minor = worth noting but manageable with standard change management
- Each challenge gets a **category**: `execution-risk` / `people-impact` / `capacity` / `quality-risk` / `transition-cost` / `dependency` / `measurement`
- Aim for **5-8 challenges**
- Challenge from the perspective of the people who will live with this change daily. The boardroom view of operations and the floor-level view are often very different.

### Round 3: Optimizer Defends

Return to the **Optimizer** persona. Respond to each numbered challenge:

- **Concede** challenges that are valid — acknowledge the risk and propose a concrete mitigation with estimated effort
- **Counter** challenges that are wrong — provide evidence: operational benchmarks, industry data, or logical reasoning
- **Partially concede** where appropriate
- Honesty about people-impact challenges matters more here than in technical debates. The COO will weigh how the team is affected.

### Round 4: Frontline Operator Stress-Tests (Second Pass)

Return to the **Frontline Operator** persona. Adversarial escalation:

- **Probe mitigations**: For each conceded challenge, attack the proposed mitigation. Is the training plan realistic? Does the transition timeline account for the learning curve? Who covers the work while people are being retrained?
- **Escalate surviving challenges**: For weak counters, escalate with a concrete "day in the life" failure scenario.
- **Identify new risks** exposed by the defense — sometimes the Optimizer's defense reveals assumptions about team capacity or willingness that don't hold.
- **Drop resolved challenges** if countered strongly.
- Issue **3-5 stress-test items**, each with severity and a concrete scenario grounded in daily operations.

### Round 5: Optimizer Final Stand

Return to the **Optimizer** persona. Last chance:

- Address each stress-test directly
- For surviving challenges, propose a **concrete fallback plan** — what happens if this goes wrong, how do we reverse it
- Be willing to **modify the original proposal**
- Summarize: what changed from the original proposal after two rounds of challenge?

### Round 6: COO Decides

Adopt the **COO** persona. Deliver the verdict and frame it for the CEO:

- **Recommendation**: One of: `approve` / `approve-with-conditions` / `pilot-first` / `defer` / `reject`
- **CEO Summary**: 3-5 sentences giving the CEO the full picture. What's the decision, why, and what does the CEO need to approve (headcount, budget, org changes, timeline)?
- **Rationale**: Reference specific arguments from both sides
- **Operating model modifications**: What changed from the original proposal
- **Action items**: Numbered, concrete next steps (who, what, by when)
- **Conditions / Gates**: For `approve-with-conditions` or `pilot-first`
- **Risks accepted**: Which surviving challenges are being accepted
- **People impact summary**: Net headcount change, roles affected, transition support needed — the CEO needs to understand the human dimension
- **Budget impact**: Total cost with any changes from the original proposal
- **Review date**: When to revisit
- **Debate metrics**: Fill in the metrics table

## Debate Metrics

| Metric | Value |
|--------|-------|
| challengesRaised | (total from Round 2) |
| stressTestsRaised | (total from Round 4) |
| challengesSurvived | (successfully countered) |
| challengesConceded | (acknowledged as valid) |
| mitigationsHeld | (mitigations that survived stress-testing) |
| mitigationsBroken | (mitigations that failed under stress-testing) |
| proposalModified | (yes/no) |
| confidenceScore | (1-10, COO's confidence in the recommendation) |

## Integration

After the debate completes:

1. **Present to the CEO**: Comment on the task with the CEO Summary and recommendation. The CEO approves, modifies, or rejects.
2. **Store the decision**: Save the brief to `$AGENT_HOME/life/projects/<topic>/`.
3. **Create action items** as subtasks via the Paperclip API after CEO approval.
