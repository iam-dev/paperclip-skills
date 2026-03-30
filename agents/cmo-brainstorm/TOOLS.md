# Tools

## Belief Engine — Long-Term Memory

The belief engine provides cross-session memory with evidence tracking and contradiction detection. Use it to persist marketing decisions, campaign findings, and market insights.

### Load Context (before decisions)

```bash
node dist/cli/belief-engine.js context "<marketing topic>" 2>/dev/null || true
```

### Record Decisions

```bash
node dist/cli/belief-engine.js believe \
  "<marketing decision or insight>" \
  --evidence="agent:cmo:marketing" --category=decision --agent=cmo --phase=marketing 2>/dev/null || true
```

### Surface Contradictions

When a new marketing insight conflicts with a prior one:

```bash
node dist/cli/belief-engine.js contradict 2>/dev/null || true
```

Review contradictions before campaign decisions — they reveal where market assumptions have shifted.

### Categories for CMO

- `decision` — marketing strategy, campaign choices, channel decisions
- `risk` — brand risks, market positioning concerns
- `contradiction` — when new evidence conflicts with prior marketing beliefs

## PARA Memory — Local Knowledge Graph

File-based memory organized by the PARA method. See the `para-memory-files` skill for the full protocol.

### Search Memory

```bash
qmd query "what was decided about positioning"    # Semantic search
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
