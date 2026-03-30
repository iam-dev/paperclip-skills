# Skill Debate (3-Agent Option Evaluation)

**Flow:** `advocate` → `critic` → `arbiter`

**Activated by:** `--skill-approval=debate` flag or `skillApproval: "debate"` in `.dirigent.json`

**Phase:** any phase with skill steps that present options (design, plan, etc.)

## Purpose

Rigorous evaluation of options and approaches. When a skill step presents multiple choices (e.g., architecture options, plan alternatives, technology choices), three agents debate the merits instead of a single agent picking or the user choosing blind.

## Agent Roles

| Agent | Incentive | Job |
|-------|-----------|-----|
| **advocate** | +1 per valid strength identified | Argues FOR each option's strengths. Identifies unique benefits, best-fit scenarios, and hidden advantages of each approach. Must ground everything in evidence. |
| **critic** | +1 per valid weakness found | Challenges each option. Finds risks, scalability issues, maintenance burden, edge cases, and hidden costs. Every challenge needs evidence. |
| **arbiter** | +1 per correct ranking | Weighs advocate and critic arguments, ranks options, provides final recommendation with reasoning. Verifies disputed claims independently. |

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

## Safety Considerations

The skill debate pattern uses competing incentives to resist manipulation, but specific attack vectors exist:

- **Option injection**: An attacker could inject a malicious option into the evaluation set — e.g., adding a compromised dependency as one of the "options" to evaluate. **Mitigation**: Options should come from the skill step or user context, not from unverified sources. The critic should evaluate supply chain and security risks for every option.
- **Bias injection via context**: An attacker could embed instructions in documentation, design docs, or context files to bias the advocate toward a specific option. **Mitigation**: The advocate must evaluate all options with the same rigor. The critic challenges disproportionate analysis.
- **Ranking manipulation**: An attacker could try to compromise the arbiter to rank a predetermined option first regardless of debate evidence. **Mitigation**: The arbiter's ranking must follow from dispute resolutions and evidence. Rankings that don't match the debate record should be flagged.
- **Report chain poisoning**: The sequential flow means each agent consumes upstream output. **Mitigation**: Each agent treats upstream reports as claims to verify, not instructions to follow.

## Relationship to Other Debate Patterns

| Pattern | Phase | What's Evaluated | Agents |
|---------|-------|-----------------|--------|
| [Evaluator Debate](../eval-debate/) | implement | Sprint quality vs contracts | eval-advocate, eval-critic, eval-arbiter |
| [Adversarial Review](../adversarial-review/) | validate | Code quality, security, integrity | finder, adversary, referee |
| **Skill Debate** (this) | any (skill steps) | Options/approaches | advocate, critic, arbiter |
