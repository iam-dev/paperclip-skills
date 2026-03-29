# Contributing to @paperclip/skills

## Getting Started

```bash
git clone git@github.com:iam-dev/paperclip-skills.git
cd paperclip-skills
npm install
npm run build
```

## Project Structure

- **`skills/<name>/SKILL.md`** — Skill definition with frontmatter, protocol, and integration notes
- **`skills/<name>/references/`** — Templates and persona definitions referenced by the skill
- **`skills/<name>/evals/evals.json`** — Eval scenarios with prompts and assertion sets
- **`agents/<name>/`** — Agent onboarding assets (AGENTS.md, SOUL.md, HEARTBEAT.md, TOOLS.md)
- **`workspaces/<name>/`** — Eval test results organized by iteration

## Adding a New Skill

1. Create `skills/<name>/SKILL.md` with the standard frontmatter:
   ```yaml
   ---
   name: <name>
   description: >
     One-paragraph description of when and how to use the skill.
   ---
   ```
2. Add reference files in `skills/<name>/references/` (personas, templates)
3. Add evals in `skills/<name>/evals/evals.json` with at least 3 scenarios
4. Run `npm run build` to verify the skill is picked up by the index

## Adding Agent Assets

1. Create `agents/<name>/` with the standard files:
   - `AGENTS.md` — Role definition and delegation rules
   - `SOUL.md` — Persona, voice, and strategic posture
   - `HEARTBEAT.md` — Execution checklist
   - `TOOLS.md` — Tool inventory
2. Run `npm run build` to verify exports

## Eval Workspace Convention

Test results go in `workspaces/<skill-name>/iteration-<N>/`:

```
iteration-1/
├── benchmark.json          # Aggregate scores
├── eval-<scenario>/
│   ├── eval_metadata.json
│   ├── with_skill/
│   │   ├── grading.json
│   │   ├── timing.json
│   │   └── outputs/
│   └── without_skill/
│       ├── grading.json
│       ├── timing.json
│       └── outputs/
```

## Code Style

- TypeScript with strict mode
- No external runtime dependencies
- All file reads happen at build time, not runtime

## Submitting Changes

1. Create a feature branch from `main`
2. Make your changes
3. Run `npm run build && npm test`
4. Open a PR with a clear description of what changed and why
