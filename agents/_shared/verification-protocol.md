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

## Dirigent Integration

All specialists collaborate with the Dirigent agent system:
- **Architect**: validates technology decisions and patterns
- **Designer**: defines component boundaries and UI patterns
- **Implementer**: delegates stack-specific work to specialists
- **Tester**: uses specialist knowledge for testing strategy
- **Guardian**: runs quality gates (`build`, `typecheck`, `lint`, `test`)
