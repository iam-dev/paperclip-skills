# HEARTBEAT.md — Debate Orchestrator Checklist

Run this checklist every time a debate is triggered.

## 1. Identify the Debate Flow

- Check activation: `--adversarial-review`, `--evaluator-debate`, or `--skill-approval=debate`
- Check `.paperclip.json` for config overrides
- Determine the correct 3-agent chain

## 2. Load Context

Load context from both memory systems:

**Belief Engine** (cross-agent, cross-session):
Use the commands in `TOOLS.md` to load prior findings and surface contradictions for the topic being debated.

**PARA Files** (local, orchestrator history):
Search for past debates on the same topic:
```bash
qmd query "<topic being debated>" 2>/dev/null || true
```
Check `$AGENT_HOME/life/projects/` for recurring debate topics with prior summaries.

## 3. Determine Loop Count

Read the issue priority and determine how many loops to run. See `agents/_shared/priority-loops.md` for the full protocol.

| Priority | Loops |
|----------|-------|
| Low | 1 |
| Medium | 2 |
| High | 3 |
| Critical | 5 |

Default to **medium** (2 loops) if priority is not set.

## 4. Dispatch Agent Chain (per loop)

For each loop iteration, execute sequentially — each agent gets the previous agent's full output plus the previous round's verdict (if loop > 1):

**Adversarial Review** (`adversarial-review/`):
1. `review-finder` → produces finding list (F-001, F-002, ...)
   - On loop > 1: receives previous referee verdict, focuses on missed issues and disputed areas
2. `review-adversary` → produces challenges (KILL/SURVIVE/DISPUTED per finding)
3. `review-referee` → produces final verdict

**Evaluator Debate** (`eval/`):
1. `eval-advocate` → produces criteria scores and strengths
   - On loop > 1: receives previous arbiter verdict, strengthens defense of contested areas
2. `eval-critic` → produces challenges and issues
3. `eval-arbiter` → produces final evaluation file

**Skill Debate** (`skill/`):
1. `skill-advocate` → produces per-option strengths
   - On loop > 1: receives previous arbiter ranking, deepens analysis of top-ranked options
2. `skill-critic` → produces per-option weaknesses
3. `skill-arbiter` → produces final ranking

**Early exit**: If a loop produces no new findings or no changed verdicts, stop early and record the reason.

## 5. Verify State Recording

After the final agent completes:
- Confirm beliefs were recorded (see `TOOLS.md` for state tracker commands)
- Confirm state was tracked via `state-tracker.sh` (adversarial review and eval debate)
- Confirm evaluation file was written (eval debate only)

## 6. Report Results

- Return the final agent's output as the debate result
- Flag any contradictions discovered during the debate
