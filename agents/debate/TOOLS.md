# Tools

## Belief Engine — Long-Term Memory

The belief engine provides cross-session memory with evidence tracking and contradiction detection. All debate sub-agents use it for context loading and result recording.

### Load Context (before each debate)

```bash
node dist/cli/belief-engine.js context "<topic being debated>" 2>/dev/null || true
```

### Record Results (after each debate)

Each final agent in the chain records the verdict:

```bash
node dist/cli/belief-engine.js believe \
  "<verdict summary with key findings>" \
  --evidence="agent:<agent-name>:<phase>" \
  --category=<category> --agent=<agent-name> --phase=<phase> 2>/dev/null || true
```

### Surface Contradictions

Before starting any debate, check for conflicts with prior beliefs:

```bash
node dist/cli/belief-engine.js contradict 2>/dev/null || true
```

Contradictions reveal where understanding has evolved across sessions — they should inform the current debate.

### Categories

- `review_finding` — adversarial review verdicts, code quality findings
- `decision` — skill debate rankings, architecture choices
- `quality` — evaluator debate sprint scores and verdicts
- `contradiction` — when new evidence conflicts with prior beliefs
- `communication` — inter-agent coordination records

## State Tracker

```bash
# Adversarial review results
bash scripts/state-tracker.sh adversarial-report <found> <killed> <survived> <disputed> <real>

# Eval debate QA rounds
bash scripts/state-tracker.sh qa-round implement <sprint> <round> <verdict> '<scores-json>'

# Check for QA regression
bash scripts/state-tracker.sh check-qa-regression implement <sprint> '<scores-json>'
```

## PARA Memory — Local Knowledge Graph

File-based memory for the orchestrator. See the `para-memory-files` skill for the full protocol. Sub-agents do not use PARA files — they are stateless per-debate.

### Search Past Debates

```bash
qmd query "auth middleware review findings"   # Semantic search
qmd search "adversarial-review verdict"       # BM25 keyword search
qmd index $AGENT_HOME                         # Reindex after updates
```

### Entity Structure

```
$AGENT_HOME/life/
  projects/<topic>/summary.md + items.yaml   # Recurring debate topics
  resources/<pattern>/                       # Debate pattern learnings
  archives/                                  # Completed debate series
```

### Daily Notes

Write debate execution summaries to `$AGENT_HOME/memory/YYYY-MM-DD.md` after each completed debate.
