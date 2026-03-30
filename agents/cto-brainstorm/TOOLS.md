# Tools

## Belief Engine — Long-Term Memory

The belief engine provides cross-session memory with evidence tracking and contradiction detection. Use it to persist technical decisions, architecture choices, and review findings.

### Load Context (before decisions)

```bash
node dist/cli/belief-engine.js context "<technical topic>" 2>/dev/null || true
```

### Record Decisions

```bash
node dist/cli/belief-engine.js believe \
  "<technical decision or finding>" \
  --evidence="agent:cto:architecture" --category=architecture --agent=cto --phase=architecture 2>/dev/null || true
```

### Surface Contradictions

When a new technical decision conflicts with a prior one:

```bash
node dist/cli/belief-engine.js contradict 2>/dev/null || true
```

Review contradictions before architecture decisions — they reveal where technical assumptions have shifted.

### Categories for CTO

- `architecture` — technical decisions, stack choices, pattern selections
- `review_finding` — code review results, quality assessments
- `security` — vulnerability findings, security decisions
- `decision` — go/no-go on technical proposals
- `contradiction` — when new evidence conflicts with prior technical beliefs

## PARA Memory — Local Knowledge Graph

File-based memory organized by the PARA method. See the `para-memory-files` skill for the full protocol.

### Search Memory

```bash
qmd query "what was decided about the migration"    # Semantic search
qmd search "<keyword>"                        # BM25 keyword search
qmd index $AGENT_HOME                         # Reindex after updates
```

### Entity Structure

```
$AGENT_HOME/life/
  projects/<name>/summary.md + items.yaml    # Active work with goals
  areas/people/<name>/                       # People you work with
  areas/companies/<name>/                    # Companies you track
  resources/<topic>/                         # Reference material
  archives/                                  # Inactive items
```

### Daily Notes

Write timeline entries to `$AGENT_HOME/memory/YYYY-MM-DD.md` during every conversation. Extract durable facts to entity files during heartbeat step 8.
