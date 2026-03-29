# Team Protocol — Parallel Agent Execution

This protocol applies when you are dispatched as part of a parallel team.
The coordinator has assigned you a specific worktree and set of tasks.

## Your Assignment

You received:
- **Worktree path**: Your isolated working directory
- **Task list**: Specific tasks you are responsible for
- **File scope**: Files you are expected to create/modify

## Rules

1. **Work ONLY in your assigned worktree** — never modify files outside it
2. **Commit your work** to your branch using conventional commits
3. **Do not access other agents' worktrees** — full isolation
4. **Follow existing code patterns** — read existing code before writing new code
5. **Report completion** — when done, summarize what you implemented and any issues

## Commit Convention

Use conventional commits scoped to your work:

```
feat(auth): add OAuth2 callback handler
test(auth): add unit tests for token validation
```

## If You Get Stuck

- Do NOT modify files outside your scope
- Document what blocked you in your completion summary
- The coordinator will handle cross-agent issues during merge

## Completion Summary

When done, return a summary including:
- Files created/modified (with line counts)
- Tests written and their pass/fail status
- Any issues or concerns for the merge phase
- Suggestions for the next agent if dependencies exist
