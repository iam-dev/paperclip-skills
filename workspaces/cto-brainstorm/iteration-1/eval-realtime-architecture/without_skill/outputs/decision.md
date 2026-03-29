# Real-Time Collaboration Architecture Decision

## Context

- Rails monolith serving 200 RPS
- Product requirement: real-time multiplayer editing (collaborative document editing)
- Timeline: 8 weeks to ship

## Recommendation: ActionCable on the Monolith (with a clear extraction path)

Ship with ActionCable now. Plan the Go/Elixir extraction as a follow-up if usage validates the feature.

## Rationale

### Why ActionCable wins for an 8-week timeline

1. **No new infrastructure.** ActionCable ships with Rails. You need Redis (which you likely already run for caching/Sidekiq) and that is it. A separate WebSocket service means a new deployment pipeline, new monitoring, new on-call runbooks, a new CI build, service discovery, and an authentication handoff -- all within 8 weeks on top of building the feature itself.

2. **Shared models and business logic.** Multiplayer editing is not just socket plumbing. You need authorization (who can edit this document?), persistence (save operations to the database), conflict resolution (operational transforms or CRDTs), and presence tracking. In ActionCable, all of this lives in the same process with direct access to your ActiveRecord models, your authorization layer, and your existing test suite. In a separate service, you either duplicate that logic or introduce synchronous calls back to the monolith, which adds latency and failure modes.

3. **Team velocity.** Your team already writes Ruby daily. Introducing Go or Elixir means hiring, ramping, or pulling senior engineers off other work to learn a new ecosystem. In 8 weeks, that cost is prohibitive.

4. **200 RPS is well within ActionCable's capacity.** ActionCable backed by Redis can handle tens of thousands of concurrent WebSocket connections per process. At 200 RPS total across your app, even if every request user also holds an open socket, you are nowhere near the ceiling. You would need to be at 50k+ concurrent connections before the per-connection memory overhead of Ruby becomes a genuine problem.

### When you should extract

Plan extraction if any of the following become true:

| Signal | Threshold | Why it matters |
|--------|-----------|----------------|
| Concurrent WebSocket connections | >20,000 per box | Ruby's per-connection memory (~1-2 MB) starts to matter |
| Tail latency on broadcast | p99 > 200 ms | Indicates GC pressure or thread contention in Ruby |
| Feature divergence | Real-time features need independent deploy cadence | Coupling to monolith deploys slows iteration |
| Team growth | Dedicated real-time team of 3+ engineers | Justifies owning a separate service and on-call rotation |

If extraction happens, Elixir (Phoenix Channels) is the stronger choice over Go for this problem. The BEAM VM was purpose-built for massive numbers of lightweight concurrent connections, and Phoenix Channels provides primitives (presence, pubsub, topic routing) that you would otherwise hand-roll in Go.

## Architecture for the 8-Week Build

### Week 1-2: Foundation

- Add `redis` adapter for ActionCable (replace the default async adapter).
- Set up ActionCable channel structure: `CollaborationChannel` per document.
- Define the wire protocol: JSON messages for operations, cursors, presence.
- Decide on conflict resolution strategy (see below).

### Week 3-5: Core Editing

- Implement operational transform (OT) or CRDT logic. For an 8-week timeline, consider using an existing library:
  - **Yjs** (CRDT, JS) on the client with a thin Rails relay -- the server mostly forwards binary sync messages between clients and persists snapshots. This is the fastest path to correct multiplayer editing.
  - **Custom OT** if your editing model is simple (e.g., a structured form, not free-text).
- Implement presence (who is viewing/editing) via ActionCable's built-in connection tracking or a lightweight Redis set.
- Persistence layer: periodic snapshots to Postgres, not on every keystroke.

### Week 6-7: Hardening

- Add reconnection logic on the client (exponential backoff, state resync on reconnect).
- Load test with a realistic number of concurrent editors per document (likely 2-10, not 1,000).
- Add monitoring: ActionCable connection count, Redis pubsub channel count, broadcast latency.
- Handle edge cases: stale connections, user going offline mid-edit, merge on reconnect.

### Week 8: Ship

- Feature flag rollout (staff -> beta users -> GA).
- Runbook for common failure modes (Redis down, connection storms on deploy).
- Dashboard in your existing monitoring (Datadog/Grafana/etc.).

## Key Design Decisions

### Conflict Resolution

| Approach | Complexity | Best for |
|----------|-----------|----------|
| **Last-write-wins** | Low | Structured forms, settings panels |
| **Operational Transform (OT)** | High | Rich text, Google Docs-style |
| **CRDT (e.g., Yjs)** | Medium (with library) | Rich text, offline-capable editing |

**Recommendation:** Use **Yjs** on the client. The server acts as a relay and persistence layer, not a transform engine. This keeps the Rails side simple -- it receives binary Yjs update messages via ActionCable and broadcasts them to other clients, plus periodically writes the document state to Postgres. The heavy lifting (merge, conflict resolution) happens in the client-side Yjs library, which is battle-tested.

### Scaling ActionCable

- **Separate ActionCable process(es).** Run dedicated Puma instances for WebSocket traffic behind a separate load balancer endpoint (`wss://ws.yourapp.com`). This isolates long-lived socket connections from your request/response HTTP traffic, preventing socket connections from consuming your HTTP worker pool.
- **Redis pubsub.** ActionCable already uses Redis pubsub for multi-process broadcast. This scales horizontally -- add more ActionCable processes and they all share the same Redis pubsub channels.
- **Sticky sessions.** Configure your load balancer for sticky sessions (or use the document ID for consistent hashing) so that editors of the same document tend to land on the same ActionCable process, reducing cross-process broadcast overhead.

### Authentication

ActionCable connections authenticate using your existing Rails session cookies. No token exchange, no separate auth service, no additional attack surface. This is a significant advantage over a separate service.

## Risks and Mitigations

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| ActionCable performance under load | Low (at 200 RPS) | Dedicated WebSocket processes, load testing in week 6 |
| Conflict resolution bugs | Medium | Use Yjs (proven library) rather than rolling your own |
| Redis single point of failure | Medium | Redis Sentinel or Cluster; graceful degradation to read-only mode |
| Deploy-time connection drops | High | Client-side reconnect with exponential backoff; rolling deploys |
| Scope creep beyond 8 weeks | High | Define MVP: 2-person editing with presence. Cut offline support, comments, and version history to v2 |

## What This Decision Does NOT Recommend

- **AnyCable.** AnyCable (a Go-based ActionCable-compatible server) is a valid middle ground if you hit performance limits, but it adds operational complexity. Do not introduce it preemptively. It is a good "escape hatch" if you find Ruby's per-connection overhead is too high after launch.
- **Building a Go/Elixir service from scratch in 8 weeks.** The infrastructure overhead alone (deployment, auth, monitoring, data access) would consume 3-4 of your 8 weeks, leaving insufficient time for the actual collaboration logic.
- **Firebase/Supabase Realtime as a managed service.** Worth considering if your team is very small, but introduces vendor lock-in and complicates authorization logic that currently lives in Rails.

## Summary

ActionCable is the right tool for this timeline and this scale. It lets you focus 100% of your engineering effort on the actual product problem (multiplayer editing) rather than on infrastructure. If the feature succeeds and pushes you past ActionCable's limits, you will have clear signals (connection count, latency) and a well-understood extraction path to Elixir/Phoenix. Ship the feature first, optimize the infrastructure second.
