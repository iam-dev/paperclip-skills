# ADR-001: Real-Time Collaboration Architecture for Rails Monolith

**Status**: proposed
**Date**: 2026-03-29
**Deciders**: CTO, Backend Architect, Platform/Ops Lead
**Confidence**: 7/10

## Context

The application is a Rails monolith currently serving 200 RPS. Product has prioritized a real-time collaboration feature — multiplayer document editing — with an 8-week delivery deadline. The core technical question is whether to extract a dedicated WebSocket service in Go or Elixir, or to add ActionCable to the existing Rails monolith. The decision carries significant implications for operational complexity, team velocity, hiring, and the long-term architecture trajectory. The team presumably has deep Rails expertise; Go/Elixir expertise is unknown but likely limited. The 8-week timeline is aggressive for either path but especially so for a greenfield service in a new language.

## Decision

Add ActionCable to the Rails monolith for the initial real-time collaboration feature, with an explicit architectural boundary that isolates WebSocket concerns and enables future extraction if connection counts exceed ActionCable's operational ceiling.

**Verdict**: proceed-with-conditions

## Consequences

### Positive
- Ships within the 8-week window by leveraging existing Rails expertise and infrastructure
- No new deployment pipeline, service discovery, or inter-service authentication required
- Single codebase keeps cognitive load low and debugging straightforward
- ActionCable's integration with Active Record and the existing auth stack eliminates an entire class of data synchronization problems

### Negative
- ActionCable on MRI Ruby has a lower WebSocket connection ceiling per process (~4K connections) compared to Go/Elixir (~100K+)
- Ruby's per-process memory cost for persistent connections is materially higher than Go/Elixir
- If the feature succeeds and scales, extraction becomes a future tax — but it is a known, bounded tax
- Real-time collaboration logic (OT/CRDT) in Ruby will be slower than in Go, though for document editing the bottleneck is rarely CPU

### Neutral
- Introduces Redis pub/sub as a dependency for ActionCable (may already be present for caching/Sidekiq)
- Establishes a precedent for how the team handles future real-time features

## Conditions / Gates

- [ ] Load test must demonstrate stable P99 latency under 150ms for WebSocket message broadcast at 3x projected concurrent connection count before production launch
- [ ] ActionCable WebSocket handling must be isolated behind a clear module boundary (dedicated namespace, separate Redis channel configuration) so extraction to a standalone service requires no changes to client protocol
- [ ] Redis pub/sub infrastructure must be provisioned on a dedicated instance (not shared with Sidekiq/cache) to prevent noisy-neighbor latency spikes
- [ ] Circuit breaker on WebSocket connections: if concurrent connections exceed 80% of tested ceiling, new connections are gracefully rejected with a retry-after header rather than degrading existing sessions

## Action Items

1. Backend lead — Spike ActionCable integration with a basic shared-cursor feature (proof of collaboration plumbing) — by end of week 2
2. Backend lead — Define the collaboration module boundary: namespace, message protocol (JSON schema), Redis channel naming convention — by end of week 2
3. Ops/SRE — Provision dedicated Redis instance for ActionCable pub/sub and establish monitoring dashboards (connection count, message throughput, Redis memory) — by end of week 3
4. Backend team — Implement CRDT/OT layer for document state reconciliation behind the ActionCable transport — weeks 3-6
5. Backend team + QA — Load test at 3x projected concurrency; document results and connection ceiling — by end of week 7
6. Ops/SRE — Implement connection circuit breaker and alerting on connection count thresholds — by end of week 7
7. CTO — Review load test results and make go/no-go call for production launch — week 8

## Risks Accepted

- **ActionCable connection ceiling may be hit sooner than projected** — accepted because the modular boundary makes extraction a 4-6 week project (not a rewrite), and the alternative (building a Go/Elixir service now) has a high probability of missing the 8-week deadline entirely
- **Ruby memory overhead for persistent connections** — accepted because at the projected scale (low thousands of concurrent connections) the cost is manageable (~2-4 additional Rails processes, roughly $200-400/mo in compute) and does not justify the operational complexity of a polyglot architecture today
- **CRDT/OT implementation in Ruby may need optimization** — accepted because document editing payloads are small and infrequent relative to, say, real-time gaming; if profiling reveals CPU bottleneck, the collaboration logic can be extracted to a Rust native extension without changing the transport layer

## Review Date

2026-06-29 — Evaluate: (1) actual concurrent WebSocket connection counts vs. tested ceiling, (2) Redis pub/sub latency percentiles in production, (3) whether the collaboration feature adoption trajectory warrants beginning extraction planning for a dedicated WebSocket service

---

## Debate Record

<details>
<summary>Full adversarial debate (6 rounds)</summary>

### Round 1: Architect Proposes

**Thesis**: Add ActionCable to the existing Rails monolith with a well-defined module boundary, shipping real-time collaboration within 8 weeks while preserving an extraction path for a dedicated WebSocket service if scale demands it.

**Architecture**:

The system adds three components to the existing monolith:

1. **ActionCable WebSocket Server**: Runs as part of the Rails process (or as a dedicated Puma worker pool configured for WebSocket connections). Handles connection lifecycle, authentication (reuses existing session/token auth via `ApplicationCable::Connection`), and channel subscriptions. Clients connect via `wss://app.example.com/cable`.

2. **Collaboration Channel + CRDT Engine**: A `CollaborationChannel` class handles per-document subscriptions. When a client sends an edit operation, the channel passes it to a `CollaborationEngine` service object that implements a CRDT (Conflict-free Replicated Data Type) algorithm — specifically, an RGA (Replicated Growable Array) for text sequences. The engine merges operations, resolves conflicts, and broadcasts the resolved state delta to all subscribers on that document's stream. Document state is periodically persisted to PostgreSQL (debounced, every 5 seconds of inactivity or every 30 seconds regardless).

3. **Redis Pub/Sub Backend**: ActionCable uses Redis as its pub/sub adapter, enabling horizontal scaling across multiple Rails processes/servers. Each document gets a dedicated Redis channel (`collaboration:doc:<id>`). This is standard ActionCable configuration.

**Data flow**: Client A sends edit op via WebSocket -> ActionCable routes to `CollaborationChannel#receive` -> `CollaborationEngine` merges op into in-memory document state -> Engine broadcasts merged delta to Redis channel -> All subscribed ActionCable processes receive and push to their local clients -> Periodic async persist to PostgreSQL.

**Integration points**: Existing authentication (no new auth system), existing PostgreSQL (document storage), new dedicated Redis instance (pub/sub only). Client uses `@rails/actioncable` npm package or a thin custom WebSocket client that speaks the ActionCable protocol.

**Rationale**:
1. **Team velocity**: The team already knows Rails. ActionCable is a first-party Rails component with mature documentation. Estimated ramp-up time: days, not weeks. A Go or Elixir service requires learning a new language, ecosystem, deployment pipeline, and debugging toolchain — each of those is a week-level cost, and together they consume half the timeline before a line of feature code is written.
2. **Operational simplicity**: Zero new services means zero new deployment pipelines, no service discovery, no inter-service authentication, no distributed tracing across service boundaries, no new on-call runbook. The monolith's existing monitoring, logging, and alerting cover the new feature automatically.
3. **Shared state access**: Real-time collaboration needs access to document permissions, user profiles, and document content. In the monolith, these are Active Record calls. In a separate service, each of these becomes an API call or a shared database connection — both of which introduce latency, failure modes, and consistency headaches.
4. **Sufficient scale headroom**: At 200 RPS, even assuming 10% of users are concurrently collaborating, we are looking at low hundreds to low thousands of concurrent WebSocket connections. A single Puma process with ActionCable can handle ~4K connections. With 2-4 processes, we have 8-16K connection headroom — likely 5-10x what we need at launch.
5. **Extraction is bounded, not blocked**: By isolating the collaboration logic in a dedicated module with a defined message protocol (JSON over WebSocket), future extraction to a Go/Elixir service means reimplementing the server side of that protocol — the client code does not change. This is a 4-6 week project when (and if) it becomes necessary, not a rewrite.

**Timeline**:
- Phase 1 (Weeks 1-2): ActionCable setup, auth integration, basic channel subscription, shared-cursor proof-of-concept, Redis provisioning
- Phase 2 (Weeks 3-6): CRDT engine implementation, document state management, conflict resolution, persistence layer, client-side integration
- Phase 3 (Weeks 7-8): Load testing, connection circuit breaker, monitoring dashboards, staged rollout (feature flag to 10% -> 50% -> 100%)

**Resource cost**: 2-3 backend engineers full-time for 8 weeks. 1 frontend engineer for client integration (weeks 3-7). 0.5 SRE/ops for Redis provisioning and monitoring (weeks 1-3). Infrastructure delta: 1 dedicated Redis instance (~$100-200/mo), potential 2-4 additional Puma workers for WebSocket capacity (~$200-400/mo). Total incremental infra: ~$300-600/mo.

**Success criteria**:
- P99 WebSocket message broadcast latency < 150ms at 3x projected concurrent connections
- Zero data loss on document state (every accepted edit persisted within 60 seconds)
- Collaboration feature functional with 50+ concurrent editors on a single document
- No degradation to existing HTTP request latency (P99 stays within 10% of baseline)
- Ship to production within 8 weeks

---

### Round 2: Operator Challenges

1. **ActionCable connection ceiling under load** (critical) [reliability]: ActionCable on MRI Ruby uses one thread per WebSocket connection in threaded mode, or relies on EventMachine/nio4r. At 4K connections per process, each connection holds a file descriptor and a thread-local allocation. Under realistic conditions with GC pressure from the main Rails application handling 200 RPS of HTTP traffic, the effective ceiling is likely 2-2.5K connections per process, not the theoretical 4K. If the collaboration feature succeeds and even 5% of DAU maintains a persistent connection, you hit this ceiling within months. The Architect's "5-10x headroom" estimate is optimistic by at least 2x.

2. **Head-of-line blocking from shared Puma worker pool** (critical) [reliability]: If ActionCable runs in the same Puma process as HTTP requests, a slow WebSocket broadcast or a spike in connection churn can starve HTTP request processing. At 200 RPS, a 500ms stall in the Puma thread pool means 100 queued HTTP requests. The Architect hand-waves this by mentioning "dedicated Puma worker pool" parenthetically but does not commit to a concrete isolation strategy.

3. **CRDT implementation complexity in 4 weeks** (significant) [team-capability]: Building a correct CRDT for collaborative text editing (even RGA) is a non-trivial computer science problem. Off-the-shelf Ruby CRDT libraries are immature compared to the JavaScript ecosystem (Yjs, Automerge). The Architect allocates weeks 3-6 for the CRDT engine, persistence, conflict resolution, AND client integration. This is the highest-risk item on the timeline and has no slack.

4. **Redis pub/sub single point of failure** (significant) [reliability]: The entire collaboration feature depends on a single Redis instance for message routing. Redis pub/sub has no persistence — if the Redis instance restarts, all in-flight messages are lost and all WebSocket connections must reconnect and resynchronize document state. The Architect does not describe a recovery protocol for this scenario.

5. **In-memory document state and process restarts** (significant) [reliability]: The CRDT engine holds document state in memory with async persistence (5-30 second debounce). If a Rails process crashes or is restarted during a deploy, up to 30 seconds of collaborative edits are lost for documents active on that process. With rolling deploys happening multiple times per day, this is not an edge case — it is a regular occurrence.

6. **WebSocket connections and horizontal autoscaling** (significant) [complexity]: Persistent WebSocket connections are inherently stateful. If the infrastructure uses horizontal autoscaling (add/remove Puma instances based on CPU/memory), scaling down kills WebSocket connections. The Architect does not address connection draining or graceful shutdown behavior.

7. **Monitoring blind spots** (minor) [complexity]: The Architect claims existing monitoring covers the new feature. ActionCable has limited built-in instrumentation compared to HTTP request middleware. WebSocket-specific metrics — connection duration, message rate per channel, fan-out latency, CRDT merge time — require custom instrumentation that is not mentioned in the timeline.

---

### Round 3: Architect Defends

1. **Concede (with mitigation)**: The 4K theoretical ceiling is optimistic under GC pressure. Realistic ceiling is likely 2.5-3K per process. Mitigation: run ActionCable on **dedicated Puma instances** that serve only WebSocket traffic — no HTTP requests. This eliminates GC pressure from the request cycle and keeps the connection ceiling closer to 3.5-4K. Configuration: separate Puma config binding only the `/cable` path, deployed as a separate process group behind the load balancer. At 2 dedicated processes, that is 7-8K connections — still 5x+ what we need at launch. Effort: 2-3 days of ops work in Phase 1.

2. **Counter**: This challenge is addressed by the mitigation in #1. Dedicated ActionCable Puma processes eliminate head-of-line blocking entirely. HTTP traffic and WebSocket traffic never share a thread pool. The load balancer routes `/cable` to the WebSocket process group and all other paths to the HTTP process group. This is a well-documented ActionCable deployment pattern (Basecamp runs this way). No additional effort beyond what is already described in #1.

3. **Partially concede**: The CRDT timeline is tight. However, the proposal is not to build a research-grade CRDT from scratch. For the MVP, we can use a simplified operational transform (OT) approach — last-writer-wins at the character level with a central server as the authority (since ActionCable gives us a natural central broker). This is simpler than full CRDT and sufficient for the initial feature. If we later need offline editing or true P2P conflict resolution, we upgrade to a full CRDT. Revised timeline for OT implementation: 2 weeks (weeks 3-4), leaving weeks 5-6 for client integration and edge case hardening. Additionally, we evaluate adopting the `y-rb` gem (Ruby bindings for Yjs via Rust FFI) as a drop-in CRDT engine, which would reduce custom implementation to integration work. Decision on OT vs y-rb made by end of week 2 spike.

4. **Concede (with mitigation)**: Redis pub/sub has no durability guarantees. Mitigation: (a) Use Redis Sentinel or Redis Cluster for high availability, reducing single-instance failure risk. (b) Implement a client-side reconnection protocol: on WebSocket disconnect, the client re-fetches the latest persisted document state from the HTTP API and replays any locally buffered operations. This is necessary regardless of architecture (even a Go/Elixir service needs a reconnection strategy). (c) The CRDT/OT state is the source of truth, not Redis messages — Redis is purely a transport. Lost messages mean clients temporarily diverge but reconverge on reconnect. Effort: Redis Sentinel setup is 1 day of ops work. Client reconnection protocol is part of the standard ActionCable client lifecycle (already handled by `@rails/actioncable` with exponential backoff).

5. **Concede (with mitigation)**: This is a real risk. Mitigation: (a) Reduce the persistence debounce to 2 seconds, accepting higher write load to PostgreSQL. (b) Implement a `before_shutdown` hook in the Puma worker that triggers an immediate flush of all in-memory document states before the process exits. Puma supports `on_worker_shutdown` callbacks. (c) For deploys, use a rolling restart with a drain period — the load balancer stops sending new WebSocket connections to the old process, existing connections are given 10 seconds to flush and close gracefully. Worst-case data loss window drops from 30 seconds to ~2 seconds. Effort: 1 day of implementation in Phase 3.

6. **Partially concede**: Autoscaling with persistent connections is a known challenge, but it is solvable. Mitigation: (a) Use a connection-count-based autoscaling metric rather than CPU — scale up when connections per instance exceed 70% of ceiling, never scale down below a minimum instance count. (b) Implement graceful connection draining: when scaling down, the instance stops accepting new connections and gives existing connections 30 seconds to migrate (client reconnects to a healthy instance automatically via the ActionCable reconnection protocol). (c) For the 8-week launch, start with a fixed instance count (no autoscaling for the WebSocket process group) and add autoscaling in a fast-follow. Effort: fixed instance count is zero effort; connection-aware autoscaling is a Phase 4 (post-launch) item.

7. **Concede**: Fair point. Custom ActionCable instrumentation is needed. Mitigation: Add ActiveSupport::Notifications subscribers for ActionCable events (`perform_action.action_cable`, `transmit.action_cable`) and emit custom StatsD/Datadog metrics for connection count, message rate, broadcast latency, and CRDT merge time. This is 1-2 days of work, added to Phase 3 timeline. Already accounted for in the "monitoring dashboards" line item but I should have been explicit.

---

### Round 4: Operator Stress-Tests

1. **Dedicated Puma WebSocket process viability under deploy churn** (significant): The Architect now proposes dedicated Puma instances for WebSocket traffic — good. But this means deploys must now coordinate two process groups. During a rolling deploy of the WebSocket process group, every connection on the draining instance must reconnect. With 3K connections per instance, that is 3K near-simultaneous reconnections hitting the remaining instances. At 2 instances, the surviving instance must absorb 3K + its own 3K = 6K connections momentarily, exceeding the per-process ceiling. Concrete scenario: deploy at 2:30 PM, 5K active collaboration sessions. The deploy triggers a reconnection storm. The surviving WebSocket instance hits its connection ceiling. New connections are refused. Users see "collaboration unavailable" for 30-60 seconds. This happens on every deploy.

2. **OT with central authority vs. CRDT: the pivot increases fragility** (significant): The Architect pivoted from CRDT to server-authoritative OT as a simplification. But server-authoritative OT means the Rails process is a bottleneck for every edit operation on every document it hosts. If one document has 50 concurrent editors producing 5 ops/second each, that is 250 OT transforms per second on a single Ruby process — each requiring a lock on the document state. MRI's GIL means these transforms are serialized. What happens when 10 active documents with 20+ editors each land on the same process? That is 1000+ serialized transforms/second in Ruby. Latency for edit acknowledgment will spike, and users will perceive lag.

3. **`on_worker_shutdown` flush is a race condition** (critical): The Architect proposes flushing in-memory state on Puma shutdown. But `on_worker_shutdown` has a timeout — Puma will SIGKILL the worker after `worker_shutdown_timeout` (default 60 seconds, but often set lower in production). If the flush involves writing state for hundreds of active documents to PostgreSQL, and the database is under load, the flush may not complete. Worse: if the process receives SIGKILL mid-flush, document state may be partially written, leaving corrupt collaboration state. This is not a theoretical concern — it is what happens during memory-triggered OOM kills, which are common in Rails processes.

4. **Client reconnection thundering herd on Redis failure** (significant): The Architect's mitigation for Redis failure is client reconnection with state re-fetch from the HTTP API. But if Redis goes down, ALL collaboration connections drop simultaneously. Every client hits the HTTP API to re-fetch document state at the same moment. At 5K concurrent collaboration sessions, that is 5K sudden HTTP requests to an endpoint that reads from PostgreSQL (fetching the last persisted CRDT/OT state). This thundering herd hits the same monolith that is already serving 200 RPS of normal traffic — a 25x spike on the document endpoint. The monolith falls over, taking down not just collaboration but the entire application.

---

### Round 5: Architect Final Stand

1. **Deploy reconnection storm**: This is a real operational risk. Defense: (a) Increase the minimum WebSocket instance count to 3 (not 2). During a rolling deploy, 2 instances remain active, each absorbing 1.5K additional connections — well within the 3.5K ceiling. (b) Stagger the rolling deploy with a 60-second delay between instances, giving connections time to redistribute. (c) Implement connection admission control: if an instance is above 80% connection capacity, it returns a `retry-after` on new WebSocket handshakes, and the client backs off for 2-5 seconds with jitter. This converts a thundering herd into a staggered reconnection wave. **Fallback plan**: If deploy-triggered reconnection storms prove too disruptive despite these mitigations, move to blue-green deploys for the WebSocket process group, where the new process group is fully spun up before the old one drains. This costs more instances during deploy windows (~5 minutes of double capacity) but eliminates the storm entirely.

2. **OT transform bottleneck**: Partially concede — the serialization concern is valid for hot documents. Defense: (a) Implement per-document operation batching: edits are collected in a 50ms window and merged in a single transform pass, reducing transform count by 5-10x for active documents. (b) For the launch, cap concurrent editors per document at 25 (product-acceptable for V1). At 25 editors x 5 ops/sec x 10 documents per process = 1250 raw ops, batched to ~125-250 transform passes/second. Benchmarking in Ruby shows OT character-level transforms at ~10 microseconds each; 250/second is 2.5ms of CPU — negligible. (c) If y-rb (Yjs Rust bindings) is adopted per the week 2 evaluation, the transform runs in Rust via FFI, eliminating Ruby GIL concern entirely. **Fallback plan**: If OT transform latency exceeds 50ms P99 in production, move the transform engine to a Rust native extension (y-rb or custom) behind the same Ruby interface. This is a 1-2 week project that does not change the architecture.

3. **Shutdown flush race condition**: Concede — the flush-on-shutdown approach is fragile. **Modified proposal**: Abandon the debounced in-memory-only approach. Instead, use a **write-ahead log (WAL) pattern**: every edit operation is appended to a Redis Stream (not pub/sub) before being applied to in-memory state. The Redis Stream serves as a durable operation log. On process restart, the new process replays the stream from the last persisted checkpoint to reconstruct document state. Periodic persistence to PostgreSQL becomes a checkpoint operation (snapshotting the stream position + document state). Process crashes lose zero edits because the WAL is in Redis, not process memory. This is a meaningful architecture change — adding it to Phase 2 timeline (1 additional week of work). **Fallback plan**: If Redis Stream reliability is insufficient (Redis itself crashes), the client-side operation buffer provides a second recovery path — the client re-sends unacknowledged operations on reconnect.

4. **Thundering herd on Redis failure**: Concede — the naive reconnection strategy will DDoS the monolith. Defense: (a) Client reconnection uses **exponential backoff with jitter** (already standard in `@rails/actioncable` but verify the jitter implementation). Configure: initial backoff 1 second, max backoff 30 seconds, jitter factor 0.5. This spreads 5K reconnections over ~30 seconds instead of 1 second. (b) The document state re-fetch endpoint is **rate-limited** at the application level (100 requests/second with a queue) and **cached** — since all clients for the same document need the same state, the first request populates a cache (Redis or in-memory) and subsequent requests are served from cache. At 5K sessions across, say, 500 documents, that is 500 unique cache misses + 4.5K cache hits. (c) Add a **circuit breaker** on the collaboration feature: if Redis is unreachable for >10 seconds, the feature degrades to read-only mode (users see the last persisted state, editing is disabled) rather than attempting reconnection. **Fallback plan**: If Redis failure cascades to the monolith despite these protections, the collaboration feature has a kill switch (feature flag) that disables WebSocket connections entirely, protecting the core application.

**Proposal modifications after two rounds of challenge**:
- ActionCable runs on **dedicated Puma instances** (minimum 3) with connection-aware load balancing — not shared with HTTP traffic
- Replaced debounced in-memory persistence with a **Redis Stream WAL** for durability — zero-data-loss on process crash
- Added **connection admission control** (80% threshold circuit breaker) to prevent overload
- OT transforms use **operation batching** (50ms window) to handle hot documents
- Concurrent editor cap of **25 per document** for V1
- Client reconnection uses **exponential backoff with jitter + document state caching** to prevent thundering herd
- Week 2 spike now includes OT vs y-rb decision AND Redis Stream WAL prototype
- Timeline is tighter: Phase 2 absorbs 1 additional week of WAL work, reducing edge-case hardening time in weeks 5-6

---

### Round 6: CTO Decides

**Verdict**: proceed-with-conditions

**Rationale**: The Architect's core thesis — that ActionCable in the monolith is the right call for an 8-week deadline with a Rails-experienced team — survived the debate, though the proposal was materially improved by the Operator's challenges. The critical argument is timeline: extracting a Go/Elixir WebSocket service requires the team to learn a new language, build a new deployment pipeline, implement inter-service auth, and solve the same collaboration logic problems — all in 8 weeks. That is not credible. The Operator's most impactful challenges (shutdown data loss, deploy reconnection storms, thundering herd) were all valid and forced genuine architectural improvements (Redis Stream WAL, dedicated instances with admission control, client-side backoff + caching). The OT transform bottleneck concern is real but bounded by the 25-editor cap and the y-rb escape hatch. The modified proposal is meaningfully more robust than the original. The key risk being accepted is ActionCable's connection ceiling — if the feature is wildly successful, extraction will be necessary within 6-12 months. But that is a good problem to have, and the modular boundary ensures extraction is a bounded project.

**Architecture modifications**:
- Dedicated WebSocket Puma instances (minimum 3) instead of shared process pool
- Redis Stream WAL for edit durability instead of in-memory debounced persistence
- Connection admission control with 80% threshold
- Operation batching (50ms window) for OT transforms
- 25 concurrent editor cap per document for V1
- Client exponential backoff with jitter + server-side document state caching

**Action items**:
1. Backend lead — Spike ActionCable on dedicated Puma instances + basic shared-cursor feature + evaluate OT vs y-rb — by end of week 2
2. Backend lead — Prototype Redis Stream WAL for edit durability and validate recovery on process crash — by end of week 2
3. Ops/SRE — Provision dedicated Redis instance (with Sentinel) for ActionCable pub/sub + Streams, set up monitoring dashboards — by end of week 3
4. Backend team — Implement collaboration engine (OT or y-rb based on spike), operation batching, document state management, persistence checkpointing — weeks 3-6
5. Frontend engineer — Client-side ActionCable integration with reconnection protocol, exponential backoff with jitter, local operation buffer — weeks 3-7
6. Backend team + QA — Load test at 3x projected concurrency (target: 5K concurrent connections, 50 editors/document); document P99 latency, connection ceiling, and reconnection behavior during rolling deploy — by end of week 7
7. Ops/SRE — Implement connection admission control (80% circuit breaker), feature kill switch, rate limiting on document state endpoint — by end of week 7
8. CTO — Review load test results, make go/no-go call — week 8

**Conditions / Gates**:
- Load test must demonstrate P99 broadcast latency < 150ms at 5K concurrent connections
- Rolling deploy of WebSocket instances must complete with < 5 seconds of user-visible collaboration interruption
- Redis Stream WAL must demonstrate zero edit loss on forced process kill in staging
- No regression in HTTP request P99 latency (within 10% of current baseline)

**Risks accepted**:
- **ActionCable connection ceiling (~10-12K with 3 dedicated instances)** — accepted because projected launch load is 1-2K connections, giving 5-10x headroom; extraction plan is documented and bounded at 4-6 weeks if needed
- **OT instead of CRDT for V1** — accepted because server-authoritative OT is sufficient for online-only editing; upgrading to CRDT (via y-rb) is a drop-in replacement behind the same interface if offline editing is required later
- **Ruby performance for OT transforms** — accepted because operation batching and the 25-editor cap keep the load tractable; y-rb (Rust FFI) is the escape hatch if profiling shows CPU bottleneck
- **Tighter Phase 2 timeline due to Redis Stream WAL work** — accepted because the WAL eliminates a class of data-loss bugs that would otherwise surface as post-launch incidents; the engineering cost is front-loaded but the operational cost is lower

**Review date**: 2026-06-29 — Evaluate actual connection counts vs ceiling, collaboration feature adoption rate, OT transform latency percentiles, Redis Stream memory usage, and whether extraction planning should begin.

### Debate Metrics

| Metric | Value |
|--------|-------|
| challengesRaised | 7 |
| stressTestsRaised | 4 |
| challengesSurvived | 2 |
| challengesConceded | 5 |
| mitigationsHeld | 3 |
| mitigationsBroken | 2 |
| proposalModified | yes |
| confidenceScore | 7 |

</details>
