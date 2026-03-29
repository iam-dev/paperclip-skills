# Technical Decision: Should we migrate from custom JWT auth to Auth0, or harden the existing system?

**Date**: 2026-03-29
**Verdict**: proceed-with-conditions
**Confidence**: 7/10

---

## Output Format

Using **Decision Document** rather than ADR. This decision involves team allocation, vendor evaluation, operational process changes, and timeline trade-offs that go beyond pure system architecture. It does not need to be versioned alongside the codebase.

---

## Round 1: Architect Proposes

**Thesis**: Migrate from our custom JWT authentication system to Auth0, executed as a phased rollout over 2 sprints (8 weeks), to eliminate the class of auth bugs generating 500 support tickets/month and free the team from maintaining undifferentiated security-critical infrastructure.

**Architecture**:

The current system is a custom JWT implementation handling token issuance, validation, refresh, revocation, and session management. Based on the 500 tickets/month signal, the likely failure points are token refresh edge cases, session invalidation gaps, and clock-skew issues across services.

The proposed Auth0 integration would work as follows:

- **Auth0 tenant** handles all identity operations: login, signup, MFA, token issuance, token refresh, and session management.
- **Application layer** uses Auth0 SDKs for client-side flows (Universal Login or embedded Lock widget) and server-side middleware for token validation via JWKS endpoint.
- **Migration adapter**: A thin abstraction layer sits between our application code and the auth provider. During migration, this adapter routes traffic to either the custom system or Auth0 based on a feature flag (per-user or percentage-based rollout).
- **User migration**: Auth0's automatic migration feature -- on first login, Auth0 calls a custom DB endpoint that verifies credentials against our existing user store and imports the user. No big-bang data migration required.
- **Token format**: Auth0 issues RS256-signed JWTs. All downstream services validate via Auth0's JWKS endpoint. Custom claims (roles, permissions, tenant ID) are injected via Auth0 Rules/Actions.
- **Rollback path**: The migration adapter can revert to the custom system by flipping the feature flag. Both systems run in parallel until migration is confirmed complete.

**Rationale**:

1. **Support cost is unsustainable**: 500 tickets/month at an estimated 30 min/ticket = ~250 engineering-hours/month consumed by auth support. That is more than 1.5 FTEs of capacity burned on incident response for a solved problem.
2. **Bus factor of 2**: Only 2 of 8 engineers have auth domain knowledge. If either leaves, we lose the ability to safely modify the auth system. Auth0 reduces the required domain expertise to "knows how to configure a dashboard and read SDK docs."
3. **Security liability**: Custom auth is a security-critical system we are maintaining without a dedicated security team. Auth0's SOC2 compliance, breach detection, bot protection, and anomaly detection are capabilities we cannot realistically build in 2 sprints.
4. **Hardening is treating symptoms, not the disease**: 2 sprints of hardening will fix the known bugs but won't prevent the next class of auth issues. The custom system's complexity is the root cause -- every new feature (MFA, SSO, passwordless) adds more surface area we must maintain.
5. **Total cost of ownership favors Auth0**: Auth0 Professional plan at ~$23K/year vs. the current hidden cost of ~$300K/year in engineering time (support + maintenance + opportunity cost of the 2 auth-knowledgeable engineers being tied to auth work).

**Timeline**:

- Phase 1 (Weeks 1-2): Auth0 tenant setup, migration adapter implementation, automatic user migration endpoint, SDK integration in staging. Gate: successful login/signup flow in staging with 100 test users.
- Phase 2 (Weeks 3-5): Canary rollout -- 5% of new logins route through Auth0. Monitor error rates, latency, and support ticket volume for the canary cohort. Gate: error rate below 0.1%, P99 login latency under 800ms.
- Phase 3 (Weeks 6-8): Ramp to 100% of traffic. Migrate remaining users who haven't logged in via batch import. Decommission custom auth system after 2-week bake period with no rollbacks.

**Resource cost**:

- Engineering effort: 2 engineers full-time for 8 weeks (~640 engineer-hours). The 2 auth-domain engineers lead; 1-2 additional engineers handle SDK integration on client surfaces.
- Auth0 cost: ~$23K/year (Professional plan, estimated 50K MAU). Current custom system infra cost is ~$3K/year (compute + DB), so net increase of ~$20K/year.
- Operational burden change: Eliminates on-call burden for auth incidents. Auth0 provides 99.99% SLA with their own incident response.

**Success criteria**:

- Auth-related support tickets drop from 500/month to under 50/month within 30 days of full rollout
- Zero auth-related P1 incidents in the 60 days post-migration
- P99 login latency under 800ms (measure baseline first; target is no regression)
- Auth-domain engineers freed to work on product features within 10 weeks
- Successful MFA rollout within 4 weeks of migration completion (validates extensibility)

---

## Round 2: Operator Challenges

1. **Parallel system complexity during migration** (critical) [migration-risk]: Running two auth systems simultaneously for 6+ weeks is not "a simple feature flag." Token formats differ (your custom JWT vs. Auth0's RS256 JWT). Downstream services validating tokens need to handle both formats. Session state lives in two places. A user who logs in via the custom system, then gets routed to Auth0 on their next request, will appear unauthenticated. The migration adapter is itself a critical, bespoke piece of auth infrastructure -- exactly the kind of thing we're trying to stop building.

2. **Automatic user migration is not seamless** (significant) [migration-risk]: Auth0's automatic migration requires users to log in at least once. Users who haven't logged in during the migration window (dormant accounts, seasonal users, API-only integrations using service tokens) will not be migrated. The "batch import" in Phase 3 requires hashing compatibility between your current password storage and Auth0's import format. If your custom system uses a non-standard hashing scheme (bcrypt with custom rounds, argon2 with specific parameters), batch import may force password resets for thousands of users -- creating more support tickets than it solves.

3. **Auth0 vendor lock-in and rate limits** (significant) [dependency]: Auth0 imposes rate limits on authentication endpoints (typically 300 requests/second on Professional plans). During peak traffic or a retry storm after a brief Auth0 outage, you could hit rate limits and lock out legitimate users. Additionally, Auth0's pricing scales with MAU -- if the product grows to 200K MAU, you're looking at $80K+/year, and switching away from Auth0 is its own multi-month migration.

4. **Custom claims and authorization logic coupling** (significant) [complexity]: The proposal mentions injecting custom claims via Auth0 Rules/Actions, but our authorization logic likely depends on specific token structures, claim names, and possibly nested claims. Every downstream service that reads JWT claims needs to be updated to handle the new token format. This is not SDK integration work -- it's a distributed system migration touching every service boundary.

5. **The 500 tickets/month problem may not be auth-system bugs** (critical) [reliability]: Before committing to a migration, have we actually categorized these 500 tickets? If 300 of them are "I forgot my password" and the password reset flow works fine, Auth0 doesn't fix that -- users will still forget passwords. If 200 are "my session expired unexpectedly," that could be a frontend token refresh bug, not a backend auth bug. Migrating the backend auth system won't fix a client-side token management issue. We could spend 8 weeks migrating and still have 400 tickets/month.

6. **Two-sprint hardening is being strawmanned** (significant) [cost]: The proposal frames the alternative as "2 sprints of hardening treats symptoms." But a focused hardening sprint with the 2 auth-domain engineers could: fix the specific bugs generating tickets, add monitoring and alerting for auth failures, implement automated token refresh health checks, and document the system for the other 6 engineers. Cost: 2 engineers x 4 weeks = 320 engineer-hours, half the migration cost, with zero migration risk.

7. **Auth0 outage blast radius** (significant) [reliability]: With custom auth, an auth outage is within our control to diagnose and fix. With Auth0, an outage means our entire application is down and we can do nothing but wait. Auth0 has had multiple significant outages (2021, 2023). Our SLA to our customers doesn't care that our vendor is down -- we are down.

---

## Round 3: Architect Defends

1. **Concede (parallel system complexity)**: This is the hardest part of the migration and I underplayed it. The migration adapter needs to be more than a feature flag -- it needs to be a token-format-aware proxy that can validate both token types and translate session state. Mitigation: Implement the adapter as a dedicated middleware service with explicit token type detection (inspect the `iss` claim). Downstream services continue to validate JWTs as before but accept tokens from either issuer during the migration window. Estimated additional effort: +1 week in Phase 1 for the adapter, bringing total to ~9 weeks. The adapter is temporary infrastructure with a hard decommission date.

2. **Counter (automatic user migration)**: This is a known pattern with Auth0 and well-documented. For password hashing compatibility: Auth0's custom DB connection supports bcrypt and argon2 natively. If we use either (and virtually every modern auth system does), automatic migration works without password resets. For dormant users: we do a bulk import at the end of Phase 3. Auth0's bulk import API supports bcrypt hashes directly -- users log in with existing passwords, no reset required. For API-only service tokens: these are not user authentication and should not go through Auth0 at all. Service-to-service auth (API keys, client credentials) stays on our own infrastructure. This actually simplifies the migration scope.

3. **Partially concede (vendor lock-in and rate limits)**: Rate limits are a real operational concern. Mitigation: implement client-side rate limiting and retry-with-backoff in the migration adapter. For sustained high traffic, Auth0 Enterprise plans offer custom rate limits, but I'd rather not jump to Enterprise pricing. For vendor lock-in: the migration adapter we're building in Phase 1 is itself the escape hatch. If we design it as a provider-agnostic auth interface, switching from Auth0 to Cognito or a self-hosted solution later requires only swapping the adapter implementation, not touching every service. Lock-in risk is real but manageable with this abstraction.

4. **Partially concede (custom claims coupling)**: The claim format change is real work, but it's bounded. Mitigation: Use Auth0 Actions to emit tokens with the exact same claim structure our services currently expect. Auth0 Actions are JavaScript functions that run post-authentication and can inject arbitrary claims. We match the current token schema exactly, so downstream services need zero changes during migration. After migration stabilizes, we can refactor to idiomatic Auth0 claim structures at our own pace. Estimated effort for writing and testing Actions: 2-3 days.

5. **Concede (ticket categorization)**: This is a legitimate gap in the proposal. We should not migrate without understanding what the 500 tickets actually are. Mitigation: Before starting Phase 1, spend 1 week categorizing the last 3 months of auth tickets. If fewer than 60% are attributable to backend auth system bugs (token refresh failures, session invalidation, JWT validation errors), we re-evaluate the migration. If the majority are UX issues (forgot password, confusing login flow), Auth0's Universal Login and built-in password reset flow would still address many of them, but the ROI calculus changes.

6. **Counter (hardening strawman)**: The hardening approach fixes known bugs but does not address the structural problem: we have 2 engineers maintaining a security-critical system that 6 others cannot safely modify. After hardening, we still have a bus factor of 2, we still cannot add MFA or SSO without significant custom development, and we still carry the operational burden. The 320 engineer-hours for hardening is not half the cost -- it's 320 hours now plus ongoing maintenance of ~50 hours/month (support + on-call + incremental fixes), which exceeds the migration cost within 7 months.

7. **Partially concede (Auth0 outage blast radius)**: Auth0 outages are real and we lose control. Mitigations: (a) Implement token caching -- once a user has a valid token, they don't need to re-authenticate for the token's lifetime. A 1-hour token with a 15-minute refresh window means an Auth0 outage under 45 minutes is invisible to active users. (b) Consider Auth0's private cloud deployment option (Enterprise tier) for guaranteed isolation, though this increases cost. (c) The migration adapter can include a circuit breaker that falls back to cached session validation during Auth0 outages, degrading gracefully rather than failing completely.

---

## Round 4: Operator Stress-Tests

1. **The migration adapter is now a permanent abstraction layer** (critical): The Architect conceded the adapter needs to be more complex (token-format-aware proxy with session translation) and then in Challenge 3 proposed keeping it permanently as a "provider-agnostic auth interface" for future portability. So we're not eliminating custom auth infrastructure -- we're replacing it with different custom auth infrastructure. This adapter sits in the critical path of every authenticated request. Who maintains it? The same 2 auth-domain engineers? We've traded one maintenance burden for another, and now the adapter has to understand both Auth0's quirks and our internal requirements. On month 6 post-migration, when a subtle token validation bug appears in the adapter, we're back to the same bus-factor-of-2 problem.

2. **Ticket categorization gate may kill the project after sunk setup cost** (significant): The Architect conceded we need to categorize tickets first and proposed a gate: if fewer than 60% are backend auth bugs, we re-evaluate. But the Auth0 tenant setup, migration adapter design, and team context-loading have already started in engineers' minds. If the categorization reveals the tickets are mostly UX issues, the team has lost momentum and the 2 auth engineers have context-switched for nothing. The categorization should happen before any migration planning, not as "Phase 0."

3. **Auth0 Actions as claim compatibility layer is fragile** (significant): The defense proposes using Auth0 Actions to emit tokens with identical claim structures. Auth0 Actions execute in a sandboxed Node.js environment with a 20-second timeout and limited library access. If our claim logic involves database lookups (e.g., fetching user roles from our DB, checking tenant-specific permissions), those Actions become a latency-adding, failure-prone dependency. When an Action fails, Auth0 returns a generic error -- debugging requires Auth0's logging dashboard, not our own observability stack. On day 30, when a subtle Action bug causes 2% of users to get tokens with missing role claims, how long does it take to diagnose when our logs show nothing and Auth0's real-time logs have a 5-minute retention?

4. **Circuit breaker fallback during Auth0 outage creates a security gap** (critical): The proposed circuit breaker that falls back to "cached session validation" during Auth0 outages means that during an outage, we're accepting tokens we cannot verify against the issuer. If an attacker obtains a revoked or expired token during an Auth0 outage window, the circuit breaker would accept it. This is a security regression from the current system where we control token validation end-to-end. The "Auth0 outage is invisible for 45 minutes" claim also assumes all users have recently refreshed tokens -- in practice, users who open the app during the outage and need to authenticate are completely locked out.

---

## Round 5: Architect Final Stand

1. **Migration adapter as permanent infrastructure**: This is the strongest surviving challenge and I'll modify the proposal. The adapter should NOT become a permanent abstraction layer. It is temporary migration infrastructure with a hard decommission date (end of Phase 3 + 2-week bake period). After migration, all services talk directly to Auth0 via their SDKs -- no intermediary. The "future portability" argument was overreach. If we ever need to leave Auth0, we'll build a new migration path at that time, informed by the experience of this migration. Fallback plan: if the adapter proves too complex during Phase 1 (more than 1.5 weeks to build and test), we abort and fall back to the hardening approach. This is a concrete kill switch.

2. **Ticket categorization timing**: Accepted. The categorization must happen before any migration work begins, not as Phase 0 of the migration. Revised timeline: Week 0 (pre-migration) is ticket categorization. The 8-week migration clock starts only if the categorization supports the migration thesis. This is a sunk cost of 1 engineer-week, which is acceptable as a decision-quality investment. Fallback plan: if categorization shows fewer than 50% backend auth bugs, we pivot to the hardening approach with a targeted fix list derived from the categorization itself.

3. **Auth0 Actions fragility**: Partially concede. Complex claim logic should not live in Auth0 Actions. Revised approach: Auth0 Actions handle only static claim injection (mapping Auth0 user metadata to our expected claim format). Any dynamic authorization logic (role lookups, tenant permissions) stays in our application middleware, post-token-validation, exactly as it works today. This means tokens from Auth0 carry identity claims only; authorization enrichment happens in our stack where we control observability, latency, and debugging. This is actually a cleaner separation than what we have now. Fallback plan: if Auth0 Actions cannot reliably emit the minimum required claims (user ID, email, basic role), we use Auth0's custom DB connection to sync all user metadata and skip Actions entirely.

4. **Circuit breaker security gap**: Concede. The circuit breaker as described is a security hole. Revised approach: during an Auth0 outage, we do NOT fall back to cached validation. Instead, already-authenticated users with valid (non-expired) tokens continue to operate because token validation uses the cached JWKS public key (which rotates infrequently). Users who need to authenticate during an outage see a maintenance page explaining the situation. This is a degraded experience, not a security compromise. Fallback plan: maintain a cold-standby custom login endpoint that can be activated manually (not automatically) by on-call in the event of an extended Auth0 outage (>2 hours). This is emergency-only, requires human judgment, and is documented in the runbook.

**Proposal modifications after two rounds of challenge**:

- The migration adapter is now explicitly temporary with a hard decommission date and a complexity kill switch.
- Ticket categorization moves to a mandatory pre-migration phase (Week 0), with a clear abort criterion.
- Auth0 Actions are limited to static claim mapping; dynamic authorization stays in our middleware.
- The circuit breaker is replaced with JWKS caching for active sessions + maintenance page for new logins during outages + a manual cold-standby emergency login endpoint.
- Total timeline extended to ~9 weeks (1 week categorization + 8 weeks migration), with an explicit abort-to-hardening path if categorization or Phase 1 fails.

---

## Round 6: CTO Decides

**Verdict**: proceed-with-conditions

**Rationale**: The migration survives the debate, but only after significant modifications. The Operator's most decisive challenge was the ticket categorization gap (Challenge 5 / Stress-Test 2): we cannot justify an 8-week migration without data confirming the root cause is actually the auth backend. The Architect's strongest argument is the structural one -- hardening fixes bugs but doesn't fix the bus factor, the inability to add MFA/SSO, or the ongoing maintenance drain. The math on engineering time ($300K/year hidden cost vs. $23K/year + 640 hours of migration effort) is compelling if the ticket categorization confirms the thesis. The Operator's circuit breaker security challenge (Stress-Test 4) was correctly conceded and the revised approach (JWKS caching + degraded mode + manual emergency endpoint) is sound. The adapter-as-permanent-infrastructure challenge (Stress-Test 1) was also correctly resolved by making the adapter explicitly temporary with a kill switch.

**Architecture modifications**:

- Migration adapter is temporary infrastructure, decommissioned at migration completion, with a complexity kill switch at Week 3.
- Auth0 Actions limited to static claim mapping; authorization logic remains in application middleware.
- No automatic circuit breaker fallback; JWKS caching for active sessions, maintenance page for new authentications during Auth0 outages, manual cold-standby endpoint for extended outages.
- Service-to-service auth (API keys, client credentials) excluded from migration scope; remains on internal infrastructure.

**Action items**:

1. Auth-domain engineer 1 -- Categorize last 3 months of auth support tickets (root cause, affected component, user impact) -- by 2026-04-05
2. Auth-domain engineer 2 -- Audit current JWT claim structure and document all downstream consumers and their claim dependencies -- by 2026-04-05
3. Engineering lead -- Review categorization results; if 50%+ tickets are backend auth bugs, greenlight Phase 1; if not, pivot to targeted hardening plan derived from the categorization -- by 2026-04-07
4. Auth-domain engineers 1 & 2 -- Implement migration adapter and Auth0 tenant setup (Phase 1) -- by 2026-04-21 (2 weeks from greenlight)
5. Auth-domain engineer 1 + 1 frontend engineer -- SDK integration and canary rollout (Phase 2) -- by 2026-05-12
6. Full team -- Ramp to 100%, batch import dormant users, decommission custom auth system (Phase 3) -- by 2026-05-26
7. Auth-domain engineer 2 -- Write runbook for Auth0 outage response including manual cold-standby activation procedure -- by 2026-04-21

**Conditions / Gates**:

- **Gate 1 (proceed/abort)**: Ticket categorization must show 50%+ of auth support tickets are attributable to backend auth system bugs. If not met, abort migration and execute hardening plan. Deadline: 2026-04-07.
- **Gate 2 (proceed/abort)**: Migration adapter must be functional in staging within 1.5 weeks of Phase 1 start. If adapter complexity exceeds estimate, abort and fall back to hardening. Deadline: 2026-04-18.
- **Gate 3 (proceed/rollback)**: Canary cohort (5% of traffic) must show auth error rate below 0.1% and P99 login latency under 800ms for 1 full week before ramping. If not met, hold at canary and debug; if not resolved within 1 week, roll back.
- **Gate 4 (decommission)**: Custom auth system decommission requires 2 weeks of zero rollbacks at 100% Auth0 traffic. No exceptions.

**Risks accepted**:

- **Auth0 vendor dependency**: Accepted because the abstraction cost of maintaining a provider-agnostic layer exceeds the switching cost of a future migration. Auth0's 99.99% SLA and our JWKS caching strategy make outage risk manageable. Revisit if Auth0 pricing exceeds $50K/year or if uptime drops below 99.95% over any rolling 3-month period.
- **9-week timeline consuming auth-domain engineers**: Accepted because the alternative (hardening) consumes the same engineers for 4 weeks with lower long-term payoff. The ticket categorization gate (Week 0) protects against committing to migration on a false premise.
- **Dormant user batch import friction**: Accepted because Auth0's bulk import supports bcrypt hashes natively, and the small number of users requiring password resets (those using non-standard hash formats, if any) is bounded and manageable.

**Review date**: 2026-06-29 -- 30 days after projected migration completion. Evaluate: auth ticket volume (target: <50/month), auth-related incidents (target: 0 P1s), Auth0 cost vs. projection, team velocity improvement (are auth engineers shipping product features?), and any Auth0 operational pain points.

---

## Debate Metrics

| Metric | Value |
|--------|-------|
| challengesRaised | 7 |
| stressTestsRaised | 4 |
| challengesSurvived | 2 |
| challengesConceded | 3 |
| mitigationsHeld | 2 |
| mitigationsBroken | 2 |
| proposalModified | yes |
| confidenceScore | 7 |
