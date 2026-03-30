# Shared Verification Protocol — All Specialists

This file defines the verification protocol that all specialist agents follow.
Agents reference this protocol instead of duplicating it inline.

## Version Verification (Required)

Before implementing any feature, verify the technology version in the project:
- Check `package.json`, `Cargo.toml`, `pyproject.toml`, or equivalent config
- Verify the API/feature you plan to use is available in that version
- Check for deprecated APIs in the target version

## Security Check (Required)

- Run `cargo audit`, `pnpm audit`, or `pip-audit` as appropriate
- For critical security work, WebSearch for recent CVEs (current year)
- Never use libraries with known unpatched critical vulnerabilities

## When to Use WebSearch

WebSearch is **expensive and slow**. Use it selectively:

**DO use WebSearch for:**
- Security advisories and CVEs (especially for the current year)
- Verifying if a newly released API exists (when local docs are insufficient)
- Checking known bugs for a specific version + feature combination

**DO NOT use WebSearch for:**
- Routine API lookups — use local types, `node_modules`, and `docs.rs` first
- General patterns — trust your training and verify against local code
- Version checking — use CLI tools (`tsc --version`, `rustc --version`, etc.)

## Anti-Hallucination Protocol

- NEVER reference an API, method, or file without verifying it exists
- Use `grep`, `ls`, `find` to verify paths and exports
- Check `node_modules/<package>/dist/index.d.ts` for TypeScript packages
- Check `docs.rs/<crate>` for Rust crates
- If unsure: say so, then verify before using

## Memory Systems

All agents have access to two complementary memory systems. Use both as appropriate.

### Long-Term Memory — Belief Engine (MnemeBrain)

Shared, API-based, cross-agent. Persist significant findings, decisions, and contradictions for cross-session memory. The belief engine is available when MnemeBrain is running; if unavailable, commands fail silently (exit 0).

**When to record beliefs:**
- **On completion**: Record your final output/verdict with evidence
- **On contradiction**: When you discover conflicting information, record both sides
- **On decision**: When you make a judgment call, record the reasoning

```bash
# Record a belief
node dist/cli/belief-engine.js believe \
  "<what you learned or decided>" \
  --evidence="agent:<your-name>:<phase>" \
  --category=<category> --agent=<your-name> --phase=<phase> 2>/dev/null || true

# Load context before starting work
node dist/cli/belief-engine.js context "<your task or feature>" 2>/dev/null || true

# Surface contradictions before final judgments
node dist/cli/belief-engine.js contradict 2>/dev/null || true
```

Categories: `review_finding`, `decision`, `contradiction`, `architecture`, `communication`, `quality`, `security`, `risk`

### Working Memory — PARA Files (`para-memory-files` skill)

Local, file-based, per-agent. Handles entity knowledge, daily notes, and tacit knowledge. Invoke the `para-memory-files` skill for all local memory operations.

- **Knowledge graph** (`$AGENT_HOME/life/`) — PARA folders with atomic YAML facts and entity summaries
- **Daily notes** (`$AGENT_HOME/memory/YYYY-MM-DD.md`) — raw timeline of events
- **Tacit knowledge** (`$AGENT_HOME/MEMORY.md`) — patterns, preferences, lessons learned
- **Search**: `qmd query "topic"` (semantic) or `qmd search "phrase"` (keyword)

### Integration Between Systems

- **Before decisions**: Load belief context (cross-session) + read relevant PARA entity summaries (local)
- **After decisions**: Record verdict in belief engine (shared) + write to daily notes (local) + extract durable facts to PARA entities
- **On contradiction**: Belief engine surfaces conflicts → check PARA facts for prior context. When PARA facts are superseded, revise the belief in MnemeBrain too.
- **Debate sub-agents**: Stateless per-debate — they use belief engine but not PARA files. Only orchestrators and C-suite agents maintain PARA files.

## Agent Collaboration

All specialists collaborate with other agents in the system:
- **Architect**: validates technology decisions and patterns
- **Designer**: defines component boundaries and UI patterns
- **Implementer**: delegates stack-specific work to specialists
- **Tester**: uses specialist knowledge for testing strategy
- **Guardian**: runs quality gates (`build`, `typecheck`, `lint`, `test`)
