# Tools

## Belief Engine — Long-Term Memory

The belief engine provides cross-session memory with evidence tracking and contradiction detection. Use it to persist strategic decisions, brainstorm outcomes, and organizational knowledge.

### Load Context (before decisions)

```bash
node dist/cli/belief-engine.js context "<strategic topic>" 2>/dev/null || true
```

### Record Decisions

```bash
node dist/cli/belief-engine.js believe \
  "<decision or insight>" \
  --evidence="agent:ceo:strategy" --category=decision --agent=ceo --phase=strategy 2>/dev/null || true
```

### Surface Contradictions

When a new decision conflicts with a prior one, the belief engine tracks both sides:

```bash
node dist/cli/belief-engine.js contradict 2>/dev/null || true
```

Review contradictions before major strategic decisions — they reveal where thinking has evolved or where unresolved tensions exist.

### Categories for CEO

- `decision` — strategic decisions, priority changes, go/no-go calls
- `communication` — delegation records, cross-team directives
- `risk` — identified risks, mitigation strategies
- `contradiction` — when new evidence conflicts with prior beliefs

## PARA Memory — Local Knowledge Graph

File-based memory organized by the PARA method. See the `para-memory-files` skill for the full protocol.

### Search Memory

```bash
qmd query "what was decided about pricing"    # Semantic search
qmd search "pricing strategy"                 # BM25 keyword search
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
