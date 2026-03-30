# Tools

## Belief Engine — Langetermijngeheugen

De belief engine biedt cross-sessie geheugen met bewijstracking en contradictiedetectie. Gebruik het om strategische beslissingen, brainstorm-uitkomsten en organisatiekennis vast te leggen.

### Context laden (voor beslissingen)

```bash
node dist/cli/belief-engine.js context "<strategisch onderwerp>" 2>/dev/null || true
```

### Beslissingen vastleggen

```bash
node dist/cli/belief-engine.js believe \
  "<beslissing of inzicht>" \
  --evidence="agent:ceo:strategy" --category=decision --agent=ceo --phase=strategy 2>/dev/null || true
```

### Contradicties opsporen

Wanneer een nieuwe beslissing in strijd is met een eerdere:

```bash
node dist/cli/belief-engine.js contradict 2>/dev/null || true
```

Bekijk contradicties voor belangrijke strategische beslissingen — ze onthullen waar het denken is geevolueerd of waar onopgeloste spanningen bestaan.

### Categorieen voor CEO

- `decision` — strategische beslissingen, prioriteitswijzigingen, go/no-go
- `communication` — delegatieverslagen, cross-team richtlijnen
- `risk` — geidentificeerde risico's, mitigatiestrategieen
- `contradiction` — wanneer nieuw bewijs in strijd is met eerdere overtuigingen

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
