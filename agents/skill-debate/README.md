# Skill Debate (3-Agent Option Evaluation)

**Flow:** `advocate` → `critic` → `arbiter`

**Activated by:** `--skill-approval=debate` flag or `skillApproval: "debate"` in `.dirigent.json`

**Phase:** any phase with skill steps that present options (design, plan, etc.)

## Purpose

Rigorous evaluation of options and approaches. When a skill step presents multiple choices (e.g., architecture options, plan alternatives, technology choices), three agents debate the merits instead of a single agent picking or the user choosing blind.

## Agent Roles

| Agent | Incentive | Job |
|-------|-----------|-----|
| **advocate** | Thorough analysis | Argues FOR each option's strengths. Identifies unique benefits, best-fit scenarios, and hidden advantages of each approach. |
| **critic** | Find weaknesses | Challenges each option. Finds risks, scalability issues, maintenance burden, edge cases, and hidden costs. |
| **arbiter** | Accurate ranking | Weighs advocate and critic arguments, ranks options, provides final recommendation with reasoning. |

## Flow

```
Skill step presents 2-3 options (e.g., architecture approaches)
    ↓
advocate evaluates each option's strengths with evidence
    ↓
critic challenges each option, finds weaknesses and risks
    ↓
arbiter weighs both sides, ranks options, recommends best
    ↓
--auto mode → use arbiter's top pick  |  interactive → user picks (informed by debate)
```

## Outputs

- **advocate**: Per-option strength analysis with evidence
- **critic**: Per-option weakness analysis with risks and counter-evidence
- **arbiter**: Ranked options with reasoning, final recommendation

## When to Use

- Design phase brainstorming where multiple valid approaches exist
- Plan phase when choosing between implementation strategies
- Any skill step with `approval: debate` in workflow YAML
- When the user wants informed option selection without doing the analysis themselves

## Relationship to Other Debate Patterns

| Pattern | Phase | What's Evaluated | Agents |
|---------|-------|-----------------|--------|
| [Evaluator Debate](../eval-debate/) | implement | Sprint quality vs contracts | eval-advocate, eval-critic, eval-arbiter |
| [Adversarial Review](../adversarial-review/) | validate | Code quality, security, integrity | finder, adversary, referee |
| **Skill Debate** (this) | any (skill steps) | Options/approaches | advocate, critic, arbiter |
