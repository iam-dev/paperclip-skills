# Evaluation Criteria — Calibration Guide

Shared reference for the `evaluator` agent. Provides calibrated scoring examples per dimension to ensure consistent grading across evaluations.

## How Verdicts Work

- **Per-dimension thresholds** are the sole source of truth for pass/fail
- **PASS** if and only if every dimension meets its individual threshold AND no criteria scored FAIL
- **Weighted average** is computed for reporting and trend tracking, not for pass/fail decisions
- A high score in one dimension does NOT compensate for a below-threshold score in another

## Dimension: Functionality

**What it measures**: Do all acceptance criteria pass as specified in the sprint contract?

### Score 9-10: Exceeds criteria
- All acceptance criteria pass with automated tests
- Edge cases beyond the contract are handled
- Error states produce helpful, specific messages
- Feature is discoverable and intuitive beyond the spec

### Score 7-8: Meets criteria
- All acceptance criteria pass
- Basic error handling present
- No broken or missing features within the contract scope
- Tests exist and pass for each criterion

### Score 5-6: Partially meets
- Most criteria pass but 1-2 are FAIL
- Some error paths untested or returning generic errors
- Feature works for happy path only
- Missing boundary condition handling

### Score 3-4: Below bar
- Multiple criteria FAIL
- Core functionality broken or incomplete
- Error handling missing or incorrect (wrong status codes, swallowed errors)
- Tests missing or failing

### Score 1-2: Not functional
- Feature doesn't work at all
- Crashes, unhandled exceptions, or infinite loops
- Placeholder/stub code present
- No tests

---

## Dimension: Correctness

**What it measures**: Is the logic correct? Are edge cases handled? Is error handling real?

### Score 9-10: Robust
- All code paths tested including error paths
- Race conditions and concurrent access considered
- Input validation on all public APIs
- Proper error types (not generic Error)
- Null/undefined handled explicitly

### Score 7-8: Correct
- Happy path and primary error paths correct
- Input validation present on external boundaries
- Errors propagated with useful context
- No obvious race conditions

### Score 5-6: Mostly correct
- Happy path works but edge cases missed
- Some error paths return generic errors or wrong status codes
- Input validation incomplete
- Potential null reference issues

### Score 3-4: Flawed
- Logic errors in core paths
- Error handling is catch-and-swallow or catch-and-log-only
- Missing input validation allows invalid state
- Type safety bypassed (any, as, @ts-ignore)

### Score 1-2: Broken
- Core logic incorrect
- No error handling
- Type system defeated throughout
- Security-relevant bugs (injection, auth bypass)

---

## Dimension: Design Fidelity

**What it measures**: Does the implementation match the design spec?

### Score 9-10: Exceeds design
- All design spec requirements implemented
- Component boundaries match the architecture doc
- API contracts exactly as specified
- Data flow matches the design diagrams

### Score 7-8: Matches design
- Design spec requirements met
- Component structure follows the design
- API shapes match (endpoints, request/response types)
- Minor deviations documented with rationale

### Score 5-6: Partially matches
- Most design requirements met but some deviated without documentation
- Component boundaries shifted from design
- Some API shapes differ from spec
- Architecture generally follows design but with ad-hoc changes

### Score 3-4: Diverges from design
- Significant deviations from design spec without justification
- Component structure reorganized without architect sign-off
- API contracts changed substantially
- Different patterns used than what was designed

### Score 1-2: Ignores design
- Implementation bears little resemblance to design
- Architecture completely different
- No evidence the design doc was consulted

---

## Dimension: Code Quality

**What it measures**: Is the code clean, readable, maintainable?

### Score 9-10: Exemplary
- Named exports, descriptive names, single responsibility
- Consistent with existing codebase patterns
- No files > 400 lines, no functions > 50 lines
- Comprehensive JSDoc on exports
- Zero linter warnings

### Score 7-8: Clean
- Code is readable and well-structured
- Follows existing patterns
- Error handling consistent
- Tests colocated and descriptive
- Minor style issues only

### Score 5-6: Acceptable
- Code works but has readability issues
- Some inconsistency with existing patterns
- A few long functions or files
- Test names not descriptive
- Some dead code or unused imports

### Score 3-4: Messy
- Hard to follow logic
- Inconsistent naming and patterns
- Large files with mixed responsibilities
- Poor test quality (weak assertions, no error path tests)
- Console.log debugging left in

### Score 1-2: Unmaintainable
- Spaghetti code, no structure
- No tests or tests that don't test anything
- Copy-pasted code throughout
- Magic numbers, abbreviations, single-letter variables
