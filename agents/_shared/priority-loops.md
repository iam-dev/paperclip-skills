# Priority-Based Iteration Loops

Paperclip issues have four priority levels. The priority determines how many times an agent loop runs — more iterations mean deeper analysis, more refinement, and higher confidence in the outcome.

## Loop Table

| Priority | Loops | Behavior |
|----------|-------|----------|
| **Low** | 1 | Single pass. Run the flow once. |
| **Medium** | 2 | One refinement round. After the first pass, the lead agent reviews feedback and runs again. |
| **High** | 3 | Two refinement rounds. Deeper analysis, more edge cases caught. |
| **Critical** | 5 | Four refinement rounds. Maximum rigor for high-stakes decisions. |

## How to Read Priority

Priority comes from the Paperclip issue. Check it via:

```bash
# From the issue payload (already available in task context)
priority = issue.priority  # "low" | "medium" | "high" | "critical"
```

If priority is not set, default to **medium** (2 loops).

## How Loops Work

### For Debates (adversarial-review, eval-debate, skill-debate)

Each loop is a full `Agent 1 → Agent 2 → Agent 3` pass. After Agent 3 (referee/arbiter) delivers the verdict:

1. The verdict and feedback go back to Agent 1 (finder/advocate)
2. Agent 1 runs again with the previous verdict as additional input — focusing on issues missed, challenges to address, or areas the referee flagged
3. Agent 2 challenges the new findings alongside the previous round
4. Agent 3 produces an updated verdict incorporating both rounds

Each subsequent loop narrows scope — Agent 1 focuses on what was missed or disputed, not re-scanning everything.

### For Brainstorms (ceo/cto/cmo/coo-brainstorm)

Each loop is a full brainstorm debate cycle. After the decider delivers the verdict:

1. The verdict goes back to the proposer
2. The proposer runs again, incorporating the decider's feedback — strengthening weak arguments, addressing unresolved objections, exploring alternatives the decider flagged
3. The challenger challenges the revised proposal
4. The decider produces an updated verdict

Each subsequent loop deepens the analysis rather than restarting from scratch.

## Loop Tracking

Track the current loop number in state:

```bash
# Debate orchestrator
bash scripts/state-tracker.sh qa-round <phase> <sprint> <round> <verdict> '<scores-json>'

# The round parameter tracks which loop iteration this is
```

## Diminishing Returns

If a loop produces no new findings (debates) or no changed positions (brainstorms), stop early regardless of remaining loops. Record the early exit reason.
