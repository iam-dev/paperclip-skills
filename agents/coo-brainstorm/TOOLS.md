# Tools

## Belief Engine — Long-Term Memory

The belief engine provides cross-session memory with evidence tracking and contradiction detection. Use it to persist operational decisions, process changes, and workflow findings.

### Load Context (before decisions)

```bash
node dist/cli/belief-engine.js context "<operational topic>" 2>/dev/null || true
```

### Record Decisions

```bash
node dist/cli/belief-engine.js believe \
  "<operational decision or finding>" \
  --evidence="agent:coo:operations" --category=decision --agent=coo --phase=operations 2>/dev/null || true
```

### Surface Contradictions

When a new operational decision conflicts with a prior one:

```bash
node dist/cli/belief-engine.js contradict 2>/dev/null || true
```

Review contradictions before process changes — they reveal where operational assumptions have shifted.

### Categories for COO

- `decision` — process decisions, workflow changes, tooling choices
- `quality` — quality assessments, process health findings
- `risk` — operational risks, capacity concerns
- `contradiction` — when new evidence conflicts with prior operational beliefs

## PARA Memory — Local Knowledge Graph

File-based memory organized by the PARA method. See the `para-memory-files` skill for the full protocol.

### Search Memory

```bash
qmd query "what was decided about team structure"    # Semantic search
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
