# Referee Verdict

**Total findings reviewed**: 5 (from Finder)
**Adversary killed**: 2
**Adversary survived**: 2
**Disputed to referee**: 1

## Final Tally
- **Real issues**: 2 (survived + referee-confirmed disputed + overturned kills)
- **False positives eliminated**: 3 (killed + referee-rejected disputed)
- **Finder accuracy**: 2/5 = 40%
- **Adversary accuracy**: 5/5 = 100%

## Finder Report (Stage 1)

**Scope**: 1 file changed (utils.ts)
**Issues found**: 5

### F-001: [Logic] -- formatCurrency hardcodes locale to 'en-US' despite accepting dynamic currency
- **File**: `utils.ts:3`
- **Severity**: WARNING
- **Category**: logic
- **Evidence**: The function accepts any ISO 4217 currency code (e.g., 'JPY', 'EUR') but hardcodes the locale to `'en-US'`. Formatting non-USD currencies with en-US locale can produce mismatched symbols and US-style grouping/decimal separators.
- **Why it matters**: Currency formatting with mismatched locale can display confusing or incorrect symbols and separators to users.

### F-002: [Logic] -- formatCurrency forces 2 decimal places for all currencies
- **File**: `utils.ts:6-7`
- **Severity**: WARNING
- **Category**: logic
- **Evidence**: `minimumFractionDigits: 2, maximumFractionDigits: 2` is hardcoded. Currencies like JPY have 0 decimal places by convention. Formatting 1000 JPY produces "JP¥1,000.00" instead of the correct "JP¥1,000".
- **Why it matters**: Displaying fractional amounts for zero-decimal currencies is financially incorrect.

### F-003: [Logic] -- formatCurrency does not handle NaN, Infinity, or negative zero
- **File**: `utils.ts:2`
- **Severity**: SUGGESTION
- **Category**: logic
- **Evidence**: `NaN`, `Infinity`, `-Infinity`, and `-0` are valid `number` values. `Intl.NumberFormat.format(NaN)` returns "NaN", which is not a desirable currency string.
- **Why it matters**: Edge case inputs could produce nonsensical currency strings.

### F-004: [Performance] -- formatCurrency creates a new Intl.NumberFormat instance on every call
- **File**: `utils.ts:3`
- **Severity**: SUGGESTION
- **Category**: performance
- **Evidence**: `new Intl.NumberFormat(...)` is constructed on every invocation. Construction parses locale data and is relatively expensive if called in a hot loop.
- **Why it matters**: Repeated construction in render paths can cause measurable performance degradation.

### F-005: [Logic] -- clamp does not handle case where min > max
- **File**: `utils.ts:11`
- **Severity**: SUGGESTION
- **Category**: logic
- **Evidence**: `clamp(5, 10, 3)` where min=10, max=3 returns 3, which is below the stated minimum. No validation guards against this misuse.
- **Why it matters**: Callers passing swapped min/max get silently wrong results.

## Adversary Report (Stage 2)

**Findings reviewed**: 5
**Killed**: 2 (false positives eliminated)
**Survived**: 2 (confirmed real)
**Disputed**: 1 (sent to referee)

### F-001: SURVIVE
**Reason**: The function name and `currency` parameter imply multi-currency support, but the hardcoded `'en-US'` locale contradicts that. A principal engineer would flag this mismatch.

### F-002: SURVIVE
**Reason**: JPY, KRW, VND, and other zero-decimal currencies will display incorrect fractional amounts. `Intl.NumberFormat` already handles this correctly when `minimumFractionDigits`/`maximumFractionDigits` are omitted. The explicit override breaks built-in correct behavior.

### F-003: KILL
**Reason**: Theoretical edge case. Callers passing `NaN` or `Infinity` as a currency amount represents a bug at the call site, not in this utility. Input validation belongs at the boundary, not in a formatting utility. All built-in JS number formatting functions accept these values without throwing.

### F-004: KILL
**Reason**: Modern JS engines cache `Intl.NumberFormat` locale data internally. No evidence this function is called in a hot path. Adding a manual cache introduces complexity (cache invalidation, memory management) for speculative benefit. Premature optimization.

### F-005: DISPUTED
**Finder's argument**: `clamp(5, 10, 3)` silently returns 3, which is below the stated minimum. This is a logical error producing hard-to-debug results.
**Adversary's counter**: This is the standard `clamp` implementation used across every major math/utility library (lodash, GLSL, Unity, Rust, C++20). The contract is that the caller provides valid min <= max. Adding runtime checks adds overhead for a misuse case.
**Key question**: Should a low-level math utility validate its preconditions, or is the standard "caller's responsibility" contract acceptable?

## Referee Rulings (Stage 3)

### Disputed Rulings

### F-005: NOT AN ISSUE
**Finder said**: `clamp` silently produces wrong results when min > max.
**Adversary said**: This is the universal standard implementation; precondition enforcement is the caller's responsibility.
**Referee ruling**: NOT AN ISSUE
**Reasoning**: The adversary is correct. This is the canonical `clamp` implementation found in every major math library, game engine, shader language, and standard library (Rust, C++20, GLSL, lodash). None validate min <= max at runtime. A principal engineer would not flag this. The TypeScript type system cannot express min <= max. If defensive behavior were desired, it would be a deliberate design choice, not a bug fix.

### Spot-Check of Kills

**F-004 (Intl.NumberFormat perf)**: UPHELD. The cost is negligible for a utility function without evidence of hot-path usage. A principal engineer would not block a PR for this.

### Spot-Check of Survives

**F-002 (forced 2 decimal places)**: UPHELD. Severity adjusted from WARNING to **BLOCKER**. This is a correctness bug: formatting JPY with 2 decimal places produces "JP¥1,000.00" which is financially incorrect. The fix is trivial -- remove `minimumFractionDigits` and `maximumFractionDigits` and let `Intl.NumberFormat` use the currency's default fraction digits.

### Severity Adjustments

### F-002: WARNING -> BLOCKER
**Reason**: Displaying fractional amounts for zero-decimal currencies (JPY, KRW, VND) is a correctness bug, not merely a style concern. The hardcoded fraction digits actively override correct behavior that `Intl.NumberFormat` provides by default. This will produce financially incorrect output for any non-2-decimal currency.

## Final Issue List

The definitive list of real issues that must be addressed:

| ID | File | Severity | Category | Description |
|----|------|----------|----------|-------------|
| F-001 | utils.ts:3 | WARNING | logic | Locale hardcoded to 'en-US' despite accepting dynamic currency codes; mismatched locale/currency produces incorrect formatting |
| F-002 | utils.ts:6-7 | BLOCKER | logic | Hardcoded 2 decimal places breaks zero-decimal currencies (JPY, KRW, VND); remove fraction digit overrides to use currency defaults |

## Verdict: NEEDS CHANGES

**BLOCKERS**: 1
**WARNINGS**: 1
**SUGGESTIONS**: 0

F-002 is a correctness bug that will produce financially incorrect output for zero-decimal currencies. The fix is to remove the `minimumFractionDigits` and `maximumFractionDigits` options from the `Intl.NumberFormat` constructor, allowing the API to use each currency's standard fraction digit count.

## Debate Metrics

- **Finder accuracy**: 40% (2 real issues out of 5 reported)
- **False positive rate**: 60% (3 out of 5 findings were not real issues)
- **Adversary accuracy**: 100% (all kills and survives were correct)
