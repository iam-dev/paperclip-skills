# Auth Build vs. Buy Decision: Harden In-House vs. Migrate to Auth0

## Recommendation: Harden What You Have (2 Sprints)

Auth0 migration is not warranted given the current architecture. The codebase already uses Better Auth (a mature open-source auth library) for session management and has a well-structured custom JWT layer for agent authentication. This is not a fragile hand-rolled auth system -- it is a layered architecture with distinct, well-separated concerns. The 500 tickets/month problem is almost certainly addressable with targeted hardening rather than a full platform swap.

---

## Analysis of Current Auth Architecture

After reviewing the codebase, the system has four distinct auth mechanisms:

1. **Better Auth sessions** (`server/src/auth/better-auth.ts`) -- Handles human user login with email/password, session cookies, and trusted origins. This is already using a maintained open-source library, not custom crypto.

2. **Agent JWT tokens** (`server/src/agent-auth-jwt.ts`) -- Custom HS256 JWT implementation for agent-to-server authentication. Uses timing-safe comparison, proper base64url encoding, configurable TTL (default 48h), and issuer/audience validation.

3. **Board API keys** (`server/src/services/board-auth.ts`) -- SHA-256 hashed bearer tokens with expiration (30-day TTL) and revocation support for CLI/board access.

4. **Agent API keys** -- Hashed bearer tokens stored in `agentApiKeys` table with revocation tracking.

The actor middleware (`server/src/middleware/auth.ts`) dispatches across all four mechanisms in a single request pipeline, resolving the caller identity into a typed `actor` object. The deployment mode system (`local_trusted` vs `authenticated`) adds another dimension.

**Key observation:** This is not one monolithic custom auth system. It is four distinct auth flows serving different actor types, and the human-facing flow already delegates to Better Auth. Ripping this out to replace it with Auth0 would only address mechanism #1, while the majority of support tickets likely stem from the interaction complexity between all four mechanisms.

---

## Why Auth0 Migration Is the Wrong Move

### 1. You are not actually running custom auth for humans

Better Auth already handles session management, password hashing, CSRF protection, and cookie security. Migrating to Auth0 replaces one auth library with another -- it does not eliminate custom code. The agent JWT, board API key, and agent API key flows would all remain unchanged.

### 2. Migration cost is higher than it appears

- The actor middleware resolves four auth mechanisms into a unified actor type. Auth0 would replace only one of those paths.
- The deployment mode system (`local_trusted` with synthetic board identity vs `authenticated` with real user rows) has deep integration points. The February 2026 consolidation plan (`doc/plans/2026-02-23-deployment-auth-mode-consolidation.md`) shows active work to simplify this. Auth0 migration would collide with that effort.
- CLI auth challenge flow (challenge/approve/cancel with pending board tokens) is tightly coupled to the current board API key system. This would need to be rearchitected alongside any Auth0 migration.
- Better Auth's drizzle adapter maps directly to your existing schema tables (`authUsers`, `authSessions`, `authAccounts`, `authVerifications`). Auth0 would require a separate user store or sync layer.

### 3. Auth0 introduces operational dependencies you do not currently have

- External service dependency for every auth request (or session validation).
- `local_trusted` mode (the default, no-login mode for single-operator local setups) would need special handling since Auth0 assumes a hosted identity provider.
- Pricing scales with MAU. Your current system has zero marginal cost per user.

### 4. Two engineers with auth domain knowledge is sufficient for hardening

Two out of eight engineers (25%) having auth expertise is a reasonable ratio. Auth0 migration would still require those same two engineers to lead the integration, plus the other six would need to learn Auth0's SDK patterns. Net knowledge transfer cost is likely higher for migration than for hardening.

---

## Root Cause Analysis: Where the 500 Tickets Are Coming From

Before committing either path, categorize the tickets. Based on the architecture, the most likely sources are:

| Likely Category | Evidence from Codebase | Estimated % |
|---|---|---|
| Token expiration confusion (agent JWT 48h TTL, board key 30d TTL) | Multiple TTL constants, no refresh flow visible for agent JWTs | 25-35% |
| Deployment mode misconfiguration (local_trusted vs authenticated) | Complex mode-dependent actor resolution in middleware | 20-30% |
| Session/cookie issues in authenticated mode (trusted origins, secure cookies, base URL) | `deriveAuthTrustedOrigins` logic, `useSecureCookies` conditional | 15-25% |
| CLI auth challenge flow failures (pending/approved/expired/cancelled states) | Four-state challenge lifecycle with 10-minute TTL | 10-20% |
| Silent auth failures (middleware calls `next()` with `type: "none"` actor on any failure) | No error responses in auth middleware -- all failures are silent | 10-15% |

**The silent failure pattern is the single biggest architectural issue.** The auth middleware never returns 401. It always calls `next()`, setting the actor to `type: "none"` when auth fails. Downstream routes must check the actor type themselves. This means users get confusing 403s or unexpected behavior instead of clear "your token is expired/invalid" messages.

---

## Hardening Plan: 2 Sprints

### Sprint 1: Observability and Error Clarity

**Goal: Understand the tickets and make auth failures visible.**

1. **Add structured auth failure logging.** The middleware currently has a single `logger.warn` for session resolution failures. Add explicit logging for every auth path failure with categorized reason codes:
   - `token_missing`, `token_expired`, `token_invalid_signature`, `token_revoked`
   - `session_missing`, `session_expired`, `session_invalid`
   - `board_key_expired`, `board_key_revoked`, `board_key_not_found`
   - `agent_terminated`, `agent_pending_approval`, `company_mismatch`

2. **Add a `WWW-Authenticate` response header** on auth failures instead of silently falling through. Create an optional `requireAuth` middleware that returns 401 with a clear error body explaining which auth mechanism failed and why. This alone will likely cut tickets by 30-40%.

3. **Add auth metrics/dashboards.** Track: auth attempts by mechanism, failure rates by reason code, token age at failure time, deployment mode distribution.

4. **Instrument the CLI auth challenge flow.** The 10-minute challenge TTL with four states is a UX landmine. Add client-side countdown and clear error messages for expired challenges.

### Sprint 2: Robustness and UX

**Goal: Fix the identified failure modes.**

1. **Implement agent JWT refresh.** The 48-hour TTL with no refresh mechanism means agents silently lose access. Add a refresh endpoint that issues a new JWT before the current one expires, triggered by the agent runtime.

2. **Improve deployment mode onboarding validation.** The auth mode consolidation plan (already in progress) should include a `doctor` check that validates the auth configuration is consistent. Accelerate this work.

3. **Add token expiration warnings.** For board API keys approaching their 30-day expiry, surface warnings in the UI and CLI. For agent JWTs, log warnings when tokens are within 10% of their TTL.

4. **Harden the trusted origins logic.** The `deriveAuthTrustedOrigins` function derives origins from `allowedHostnames` config. Add validation that catches common misconfigurations (missing protocol, trailing slashes, wildcard mistakes).

5. **Add auth health check endpoint.** Extend the existing `/health` route to include auth subsystem status: whether Better Auth is reachable, whether JWT secret is configured, whether board key table is accessible.

6. **Write integration tests for the complete auth matrix.** The test coverage for the four-mechanism auth flow appears thin. Cover: expired tokens, revoked keys, mode transitions, concurrent challenge approvals.

---

## Decision Framework: When Auth0 Would Make Sense

Revisit the buy decision if any of these conditions become true:

- You need SSO/SAML/OIDC federation with customer identity providers (enterprise sales requirement).
- You need MFA and cannot use Better Auth's plugin ecosystem for it.
- You expand to multiple services that need centralized identity (microservices decomposition).
- The hardening sprint does not reduce tickets by at least 50%.
- Auth compliance requirements (SOC 2, HIPAA) mandate a certified identity provider.

None of these appear to be current requirements based on the codebase.

---

## Cost Comparison Summary

| Factor | Harden (2 Sprints) | Auth0 Migration |
|---|---|---|
| Engineering time | 2 sprints, 2 engineers primary | 4-6 sprints minimum, 2 engineers primary + 6 for integration testing |
| Risk to existing users | Low (additive changes) | High (auth migration requires downtime or dual-running) |
| Ongoing cost | Zero (open-source stack) | $0.07-0.23/MAU (Auth0 pricing) |
| Agent JWT system | Unchanged | Unchanged (Auth0 does not replace this) |
| Board API key system | Unchanged | Unchanged (Auth0 does not replace this) |
| CLI challenge flow | Unchanged | Needs rearchitecting |
| Deployment mode compatibility | Full | Requires `local_trusted` workaround |
| Ticket reduction (estimated) | 50-70% from observability + error clarity alone | 20-30% (only addresses session-related tickets) |

---

## Final Verdict

Invest the 2 sprints in hardening. The root cause of 500 tickets/month is almost certainly not "we need a different auth library" -- it is "our auth failures are silent and our error messages are unhelpful." The architecture is sound; the observability and error handling are not. Fix those first, measure the impact, then make a data-driven decision about whether a platform migration is warranted.
