---
name: skill-debate
description: >
  Rigorous evaluation of options and approaches using 3 competing agents: advocate
  (argues for each option's strengths), critic (finds weaknesses and risks in each),
  arbiter (weighs both sides, ranks options, recommends best). Use when a decision
  presents 2-3 valid approaches and you need structured analysis before picking.
  Works for architecture choices, implementation strategies, technology selection,
  or any decision where multiple valid paths exist. Do NOT use for code review
  (use adversarial-review) or sprint QA (use eval-debate).
---

# Skill Debate (3-Agent Option Evaluation)

Three agents evaluate multiple options or approaches through structured debate. The advocate finds strengths, the critic finds weaknesses, and the arbiter ranks and recommends.

## Flow

```
advocate → critic → arbiter
```

## When to Use

- Architecture decisions with multiple valid approaches
- Implementation strategy selection
- Technology choices (framework, library, infrastructure)
- Design phase brainstorming where multiple options exist
- Any decision where 2-3 valid paths need rigorous comparison

## When NOT to Use

- Code review / security audit → use `adversarial-review`
- Sprint QA / implementation quality → use `eval-debate`
- Strategic business decisions → use brainstorm skills (ceo/cto/cmo/coo)

## Agent Roles

| Agent | Incentive | Job |
|-------|-----------|-----|
| **advocate** | Thorough analysis | Argues FOR each option's strengths. Identifies unique benefits, best-fit scenarios, and hidden advantages. |
| **critic** | Find weaknesses | Challenges each option. Finds risks, scalability issues, maintenance burden, edge cases, hidden costs. |
| **arbiter** | Accurate ranking | Weighs advocate and critic arguments, ranks options, provides final recommendation with reasoning. |

## Protocol

### Step 1: Advocate Evaluates

For each option presented:
- **Strengths**: What makes this option good? Technical merit, team fit, timeline advantage
- **Best-fit scenarios**: When would this option clearly be the right choice?
- **Hidden advantages**: Benefits that aren't obvious at first glance
- **Evidence**: Prior art, benchmarks, existing codebase compatibility

### Step 2: Critic Challenges

For each option:
- **Weaknesses**: What can go wrong? Technical risks, scaling limits, maintenance burden
- **Hidden costs**: Migration effort, learning curve, operational complexity, vendor lock-in
- **Edge cases**: Scenarios where this option breaks down
- **Counter-evidence**: Failures of this approach in similar contexts

### Step 3: Arbiter Decides

The arbiter:
- Weighs advocate's strengths against critic's weaknesses for each option
- Ranks options from best to worst with reasoning
- Identifies the decisive factors that separated the top options
- Provides a clear recommendation with conditions or caveats

## Output

The arbiter produces:
- Ranked options with reasoning
- Per-option strength/weakness summary
- Final recommendation with confidence level
- Conditions under which the recommendation would change

## Integration with Paperclip

After the debate:
1. Comment on the task with the recommendation and ranking
2. If the decision needs CEO/CTO approval, format as a decision brief
3. Store the decision rationale for future reference

## References

- `agents/skill-debate/advocate.md` — Advocate agent definition
- `agents/skill-debate/critic.md` — Critic agent definition
- `agents/skill-debate/arbiter.md` — Arbiter agent definition
- `agents/_shared/verification-protocol.md` — Shared verification protocol
