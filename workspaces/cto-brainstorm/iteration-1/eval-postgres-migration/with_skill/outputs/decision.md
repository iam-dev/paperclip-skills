# ADR-001: Migrate Analytics Workload from PostgreSQL to ClickHouse

**Status**: proposed
**Date**: 2026-03-29
**Deciders**: CTO, Data Team Lead, Platform Engineering Lead
**Confidence**: 7/10

## Context

Our PostgreSQL instance is hitting 80% CPU utilization at peak, driven primarily by analytical queries over a 3TB event dataset growing at 50M events/day (~60GB/day uncompressed). Current analytical queries take 15-30 seconds, which is degrading both the data team's productivity and the responsiveness of any customer-facing dashboards backed by this data. The PostgreSQL instance serves both OLTP (application) and OLAP (analytics) workloads, meaning analytical load directly competes with transactional operations for CPU and I/O.

ClickHouse is a columnar OLAP database purpose-built for the kind of aggregation-heavy, scan-intensive queries the data team runs. The proposal is to offload the analytics workload to ClickHouse while keeping PostgreSQL as the primary OLTP store, effectively splitting read paths by workload type.

This decision affects core infrastructure (database topology, data pipeline architecture, operational tooling) and should be versioned alongside the codebase. Using the ADR format.

## Decision

Proceed with migrating the analytics workload to ClickHouse, conditional on a successful 4-week prototype that validates query performance, data pipeline reliability, and operational readiness against specific gates defined below.

**Verdict**: prototype-first

## Consequences

### Positive
- Analytics queries expected to drop from 15-30s to sub-second or low single-digit seconds on ClickHouse's columnar engine with compression
- PostgreSQL CPU freed from analytical scan pressure, reducing peak utilization to an estimated 40-50% and extending headroom for OLTP growth
- ClickHouse's compression (typically 10-15x on event data) reduces the 3TB footprint to ~200-300GB, lowering storage cost
- Data team unblocked to run more complex, exploratory queries without worrying about production database impact
- Clean separation of OLTP and OLAP concerns enables independent scaling of each

### Negative
- Introduces a second database system to operate, monitor, and maintain -- increased cognitive load and on-call surface area
- Requires building and operating a data pipeline (CDC or batch ETL) between PostgreSQL and ClickHouse, adding a new failure domain
- Team must develop ClickHouse expertise (schema design, materialized views, MergeTree engine tuning, cluster operations)
- Migration period with dual systems increases infrastructure cost and operational complexity
- ClickHouse's eventual consistency model means analytics may lag behind real-time OLTP state

### Neutral
- Query syntax differences between PostgreSQL and ClickHouse will require rewriting existing analytical queries and dashboards
- May shift future data architecture decisions toward the ClickHouse ecosystem (e.g., using ClickHouse materialized views instead of dbt models)

## Conditions / Gates

- [ ] Prototype loads 30 days of historical event data (~1.5B events) into ClickHouse and demonstrates the 5 most expensive current PostgreSQL analytics queries completing in under 3 seconds
- [ ] Data pipeline (CDC via Debezium or batch ETL) sustains 50M events/day ingestion with less than 5 minutes end-to-end latency and zero data loss over a 7-day test
- [ ] Runbook and alerting coverage: at minimum, ClickHouse disk space, replication lag, ingestion pipeline health, and query latency P99 are monitored with alerts
- [ ] At least 2 engineers (1 platform, 1 data) complete ClickHouse operational training sufficient to troubleshoot ingestion failures, run backups, and interpret query explain plans

## Action Items

1. Platform Engineering Lead -- Stand up a ClickHouse single-node test instance and design the table schema for the events dataset using MergeTree with appropriate partitioning (by day) and ordering key -- by 2026-04-12
2. Data Engineer -- Build a CDC pipeline (evaluate Debezium + Kafka vs. a lighter batch approach) to replicate events from PostgreSQL to ClickHouse -- by 2026-04-19
3. Data Team Lead -- Identify and port the top 10 most expensive analytics queries to ClickHouse SQL; benchmark against PostgreSQL baselines -- by 2026-04-26
4. Platform Engineering Lead -- Produce a ClickHouse operational runbook (backup/restore, monitoring, scaling) and configure alerting -- by 2026-04-26
5. CTO -- Gate review: evaluate prototype results against conditions above and issue proceed/reject decision -- by 2026-04-30

## Risks Accepted

- Data pipeline lag means analytics will not be real-time; up to 5 minutes of delay is accepted because the data team's current queries already operate on data that is minutes to hours old
- Single-node ClickHouse for prototype phase means no HA; accepted because this is analytics-only (not serving transactional traffic) and a brief outage loses dashboard access, not customer data
- Team ClickHouse expertise is shallow initially; accepted because the prototype phase is explicitly designed to build this expertise before committing to production

## Review Date

2026-04-30 -- Evaluate prototype gate results. If gates are met, proceed to production migration planning. If not, assess whether to iterate on the prototype or reject the migration and pursue PostgreSQL optimization alternatives (read replicas, partitioning, query optimization, or materialized views).

---

## Debate Record

<details>
<summary>Full adversarial debate (6 rounds)</summary>

### Round 1: Architect Proposes

**Thesis**: We should offload the analytics workload from PostgreSQL to ClickHouse, deploying a dual-database architecture where PostgreSQL remains the OLTP store and ClickHouse serves as a dedicated OLAP engine, connected by a CDC-based data pipeline.

**Architecture**:

The system splits into three components:

1. **PostgreSQL (existing)**: Continues as the primary OLTP database for application reads and writes. No schema changes required. The analytics queries are removed from this instance, freeing CPU and I/O.

2. **Data Pipeline (new)**: A CDC pipeline using Debezium connected to PostgreSQL's logical replication slot, publishing change events to a Kafka topic. A ClickHouse Kafka engine table (or a lightweight consumer service) reads from Kafka and inserts into ClickHouse. Alternative: a simpler batch ETL using a scheduled job that queries PostgreSQL for new events since the last watermark and bulk-inserts into ClickHouse via `clickhouse-client`. The CDC approach is preferred for lower latency and better reliability at scale.

3. **ClickHouse (new)**: Single-node deployment for prototype, graduating to a 3-node ReplicatedMergeTree cluster for production. Table schema mirrors the events table with a MergeTree engine, partitioned by `toYYYYMMDD(event_timestamp)`, ordered by `(event_type, user_id, event_timestamp)`. This ordering key is optimized for the most common analytical access patterns: filtering by event type, then by user, with time-range scans. Materialized views pre-aggregate the top 3 most common dashboard queries.

Data flow: Application writes -> PostgreSQL -> Debezium CDC -> Kafka -> ClickHouse Kafka engine table -> MergeTree target table.

Query path: Data team and dashboards query ClickHouse directly via its HTTP or native TCP interface. Existing BI tools (assuming Metabase, Grafana, or similar) support ClickHouse via official drivers.

**Rationale**:

1. **Workload mismatch is the root cause**: PostgreSQL is a row-oriented OLTP database. Analytical queries scanning 3TB of event data force full-table or large-partition sequential scans, consuming CPU for decompression and row-to-column transformation that a columnar store handles natively. This is not a tuning problem -- it is a fundamental architecture mismatch. Adding read replicas would duplicate the mismatch.

2. **ClickHouse delivers 10-100x query speedup for this workload**: Columnar storage, vectorized execution, and aggressive compression (LZ4 default, ZSTD for cold data) mean that scanning 3TB of events in ClickHouse is equivalent to scanning ~200-300GB of compressed columnar data. Benchmark data from ClickHouse's published benchmarks and industry reports (Uber, Cloudflare, GitLab) consistently show sub-second response for aggregation queries over billions of rows.

3. **50M events/day is well within ClickHouse's ingestion comfort zone**: ClickHouse routinely handles hundreds of millions of inserts per day on modest hardware. A single node with 16 cores and 64GB RAM can sustain this ingestion rate with headroom.

4. **PostgreSQL headroom is critical**: At 80% CPU peak, we are one traffic spike or slow query away from cascading degradation on the OLTP side. Removing the analytics workload is the fastest path to restoring headroom without scaling up the PostgreSQL instance (which has its own cost and operational implications).

5. **ClickHouse is operationally mature for this use case**: Unlike adopting a bleeding-edge technology, ClickHouse has a well-established operational track record for event analytics (Yandex, Cloudflare, eBay, GitLab). The failure modes are well-documented, and the community is active.

**Timeline**:
- Phase 1 (Weeks 1-4): Prototype -- single-node ClickHouse, batch ETL for initial data load, CDC pipeline for ongoing sync, port top 10 queries
- Phase 2 (Weeks 5-8): Production hardening -- 3-node replicated cluster, monitoring/alerting, runbooks, BI tool integration, data team training
- Phase 3 (Weeks 9-12): Migration cutover -- switch dashboards and analytics queries to ClickHouse, decommission analytics queries from PostgreSQL, validate CPU reduction
- Phase 4 (Weeks 13-16): Optimization -- materialized views for hot queries, cold data tiering, cost optimization

**Resource cost**:
- Engineering effort: 2 engineers for 4 months (1 platform, 1 data), ~50% allocation
- Infrastructure cost delta: ClickHouse cluster (3 nodes, 16-core, 64GB RAM, 1TB NVMe each) estimated at ~$2,500/month on cloud. Kafka cluster (if not already present) adds ~$500-1,000/month. Offset partially by potential PostgreSQL downsize after migration.
- Operational burden: Adds one more system to on-call rotation. Mitigated by ClickHouse being analytics-only (lower severity for outages).

**Success criteria**:
- Top 10 analytics queries complete in under 3 seconds on ClickHouse (down from 15-30s on PostgreSQL)
- PostgreSQL peak CPU drops below 50% after analytics offload
- Data pipeline achieves less than 5-minute end-to-end latency with zero data loss over 30 days
- No increase in P1/P2 incidents attributable to the new infrastructure within 60 days of cutover
- Data team self-reports improved productivity in quarterly survey

---

### Round 2: Operator Challenges

1. **CDC pipeline is a new critical-path dependency** (critical) [reliability]: You're introducing Debezium + Kafka as a data pipeline between your primary database and your analytics store. That is three new components (Debezium connector, Kafka cluster, ClickHouse consumer) in the critical path for analytics freshness. Each is a distinct failure mode: Debezium can stall on DDL changes or large transactions, Kafka can lose messages if retention is misconfigured, and the ClickHouse consumer can fall behind if insert throughput drops. When this pipeline breaks at 2 AM, who is debugging it? The PostgreSQL DBA? The data engineer? The platform team? The on-call surface area just tripled.

2. **3TB historical data migration is underestimated** (significant) [migration-risk]: You said "batch ETL for initial data load" in Phase 1 as if it is a line item. Loading 3TB of event data from PostgreSQL into ClickHouse means reading 3TB from PostgreSQL (which is already at 80% CPU) while simultaneously writing it to ClickHouse. At what rate? If you read at full speed, you tank PostgreSQL production performance. If you throttle, the initial load takes weeks. Have you calculated the actual transfer time at a safe read rate?

3. **Schema evolution and DDL changes** (significant) [complexity]: Event schemas evolve. Columns get added, types change, new event types appear. In PostgreSQL, your application manages this via migrations. In the dual-database world, every schema change must be coordinated across PostgreSQL, the CDC pipeline (Debezium schema registry), and ClickHouse. ClickHouse's ALTER TABLE semantics are different from PostgreSQL's -- some operations that are instant in PostgreSQL (adding a nullable column) require mutations in ClickHouse that rewrite data in the background. Who owns this coordination? What happens when someone adds a column to PostgreSQL and forgets to update the ClickHouse schema?

4. **ClickHouse operational expertise gap** (significant) [team-capability]: You mention "data team training" in Phase 2 as a line item. ClickHouse's MergeTree engine, merge operations, partition management, and replication model are fundamentally different from PostgreSQL. The team will hit issues with: too many parts (common with high-frequency small inserts), merge throttling, incorrect ORDER BY key selection causing slow queries on unexpected access patterns, and distributed table routing in a replicated setup. How much time is actually budgeted for the team to become production-competent?

5. **Kafka dependency may be over-engineered** (minor) [complexity]: If you do not already have Kafka in your stack, introducing it solely as a CDC transport adds significant operational overhead (ZooKeeper or KRaft, broker management, topic configuration, consumer group management). Debezium can write directly to ClickHouse via the JDBC sink connector, or you could use PostgreSQL's native logical replication plus a lightweight consumer. Have you evaluated lighter alternatives?

6. **Query rewrite effort is non-trivial** (significant) [migration-risk]: ClickHouse SQL is not PostgreSQL SQL. Window functions behave differently, JOIN performance characteristics are radically different (ClickHouse is weak on JOINs -- it prefers denormalized tables), date/time functions have different names and semantics, and there is no MVCC so queries against actively-mutating data can return inconsistent results. "Port top 10 queries" is not just a syntax translation -- it may require restructuring the data model (denormalization) and the queries themselves. This could easily consume more time than estimated.

7. **Fallback plan is unclear** (significant) [migration-risk]: If the migration fails at week 8 -- the pipeline is unreliable, queries are not faster than expected, or the team cannot operate ClickHouse -- what is the rollback plan? You have 4 engineers with 2 months of sunk time. PostgreSQL is still at 80% CPU. Do you just go back to where you started? What is the alternative if ClickHouse does not work out?

---

### Round 3: Architect Defends

1. **Concede (CDC pipeline complexity)**: Valid. The CDC pipeline is the riskiest new component. Mitigation: Start with a simpler architecture in the prototype phase -- use a batch ETL (scheduled every 5 minutes via a cron job querying `WHERE event_timestamp > last_watermark`) instead of Debezium + Kafka. This eliminates Kafka and Debezium from the prototype entirely. If the batch approach meets the 5-minute latency SLA (which it likely will for analytics), we may never need CDC at all. If we do need sub-minute freshness later, we introduce CDC as a Phase 2 upgrade with a proven fallback. This reduces the on-call surface from 3 new components to 1 (the ETL job). Effort to implement the batch ETL: ~3 days.

2. **Partially concede (3TB historical migration)**: The risk is real but the severity is manageable. Mitigation: Run the initial load from a PostgreSQL read replica (if one exists) or from a recent backup/snapshot restore to a temporary instance. This avoids any load on the primary. If no replica exists, run the export during off-peak hours (overnight) at a throttled rate of ~50MB/s, which completes the 3TB transfer in ~17 hours. ClickHouse's bulk insert performance is not the bottleneck -- a single node can ingest 200-500MB/s. We should also evaluate using `pg_dump` piped through a format converter, or exporting to Parquet files (via `COPY TO` with a Parquet extension) and bulk-loading into ClickHouse, which is the fastest path.

3. **Partially concede (Schema evolution)**: Valid concern, but manageable with discipline. Mitigation: The ETL job (or CDC pipeline) includes a schema validation step that compares source and target schemas before each run. Schema changes to the events table require a paired migration: a PostgreSQL migration and a ClickHouse ALTER TABLE, enforced via CI check (a test that compares the two schemas). For the prototype, we freeze the schema. For production, we add this to the migration checklist and CI pipeline. ClickHouse's `Nullable` columns and `DEFAULT` expressions handle most additive schema changes without mutations. Destructive changes (column type changes) are rare for event data -- events are typically append-only with stable schemas.

4. **Concede (Operational expertise gap)**: Valid. Mitigation: Allocate 2 dedicated days in Phase 1 for the platform engineer to complete Altinity's ClickHouse operations training (free, online). During Phase 2, pair the data engineer with the platform engineer for hands-on ClickHouse operational tasks. Budget an additional 3 days in Phase 2 explicitly for "break and fix" exercises -- intentionally create failure scenarios (too many parts, merge stalls, disk full) and practice recovery. Total training investment: ~7 engineering-days, which I am adding to the timeline.

5. **Counter (Kafka over-engineering)**: Agreed -- this is why the revised proposal starts with batch ETL, not Kafka + Debezium. If we already had Kafka, CDC would be the obvious choice. Since we do not, the batch ETL is the right starting point. Kafka is only introduced if we later need sub-minute freshness, which the data team has not requested.

6. **Partially concede (Query rewrite effort)**: The syntax differences are real, and JOIN performance is a genuine ClickHouse weakness. Mitigation: The data model in ClickHouse should be denormalized at ingestion time -- the ETL job joins the events table with dimension tables (users, products, etc.) in PostgreSQL and writes a flat, wide table to ClickHouse. This eliminates most JOINs at query time. For the top 10 queries, we budget 2 days per query for rewrite and validation (20 engineering-days total, not the implicit 5 days I had originally). This is a significant revision to the timeline.

7. **Concede (Fallback plan)**: Fair challenge. Fallback plan: If the prototype fails to meet gates at week 4, we stop and pivot to a PostgreSQL optimization path: (a) add a read replica dedicated to analytics, (b) implement aggressive partitioning on the events table by month, (c) create materialized views for the top 10 queries, and (d) evaluate pg_analytics or DuckDB as a lighter OLAP solution. This PostgreSQL-native path is estimated at 3-4 weeks and would reduce query times to 3-8 seconds (not as fast as ClickHouse, but a meaningful improvement). We should sketch this fallback plan in the design doc before starting.

---

### Round 4: Operator Stress-Tests

1. **Batch ETL reliability under load** (significant): You replaced the CDC pipeline with a batch ETL querying PostgreSQL every 5 minutes. At 50M events/day, that is ~175K events per 5-minute batch. The ETL job must: query PostgreSQL (`SELECT * FROM events WHERE timestamp > X`), format/denormalize the data, and bulk-insert into ClickHouse -- all within the 5-minute window to avoid falling behind. What happens when PostgreSQL is slow (remember, it is at 80% CPU)? What happens when a batch takes 6 minutes and overlaps with the next batch? What happens on the day you have 100M events instead of 50M (a 2x traffic spike)? The batch approach trades CDC's complexity for a different fragility: it is tightly coupled to PostgreSQL's query performance at the exact moment PostgreSQL is most stressed.

2. **Denormalization at ETL time creates a tightly coupled pipeline** (significant): Your mitigation for JOIN weakness is to denormalize at ingestion -- the ETL joins events with dimension tables in PostgreSQL. Now every ETL run executes JOINs against the production PostgreSQL database. If the users table grows, or a new dimension is added, the ETL query gets slower. If a dimension table schema changes, the ETL breaks and ClickHouse data is stale. You have moved complexity out of ClickHouse queries and into the pipeline. The pipeline is now schema-aware, business-logic-aware, and PostgreSQL-performance-sensitive. This is a hidden coupling that will bite during schema changes or traffic spikes.

3. **Prototype-to-production gap with single-node to cluster transition** (significant): The prototype is a single ClickHouse node. Production is a 3-node ReplicatedMergeTree cluster. These are operationally different systems. Replication adds: ZooKeeper (or ClickHouse Keeper) dependency, distributed DDL, replica lag, quorum writes, and split-brain scenarios. The prototype will not surface any of these failure modes. You could pass all prototype gates and still fail in production because the replicated setup introduces a different class of problems. Are you testing the thing you are actually going to run?

4. **20 engineering-days for query rewrites may still be low** (minor): You budgeted 2 days per query for the top 10. But the data team presumably has more than 10 queries. What about ad-hoc queries? What about the BI tool's auto-generated SQL? Metabase and Grafana generate SQL that is optimized for PostgreSQL -- GROUP BY patterns, subqueries, CTEs. ClickHouse handles some of these poorly. The long tail of query migration could take months, not weeks, and during that time the data team is running queries on two different systems with different behavior.

---

### Round 5: Architect Final Stand

1. **Batch ETL reliability**: Addressed with three mitigations. (a) The ETL reads from a PostgreSQL read replica, not the primary -- isolating it from the 80% CPU issue entirely. If no replica exists, standing one up is a 1-day task and useful independently of the ClickHouse migration. (b) The ETL uses cursor-based pagination with a configurable batch size (e.g., 50K rows per fetch) and writes to ClickHouse incrementally, so it never holds 175K rows in memory and can resume from the last cursor if interrupted. (c) A simple overlap guard: the ETL acquires an advisory lock before running; if the previous batch is still running, the new batch logs a warning and skips. If 3 consecutive skips occur, an alert fires. At 2x traffic spike (100M events/day = 350K per batch), the ETL processes 350K rows from a replica in well under 5 minutes -- ClickHouse can ingest 1M+ rows/second. **Fallback**: If the batch ETL consistently cannot keep up, we add a second ETL worker or switch to a streaming approach. But the math says we have 10x headroom on ingestion rate.

2. **Denormalization coupling**: Partially concede. The tight coupling is real. Revised approach: Do not denormalize at ETL time. Instead, load raw events into ClickHouse as-is and load dimension tables as separate ClickHouse dictionaries (ClickHouse's dictionary feature is designed exactly for this -- small lookup tables loaded from external sources on a schedule). Queries use `dictGet()` for dimension lookups, which is faster than JOINs and decouples the ETL from dimension table schemas. The ETL becomes a simple `SELECT * FROM events WHERE timestamp > X` with no JOINs. Dimension dictionaries refresh independently on a 15-minute schedule. This is a meaningful proposal modification.

3. **Prototype-to-production gap**: Valid concern. Revised approach: The prototype runs a 3-node ClickHouse Keeper + ReplicatedMergeTree cluster from day 1, not a single node. Yes, this adds ~2 days of setup time and higher prototype infrastructure cost (~$7,500/month for 3 nodes instead of ~$2,500 for 1). But the Operator is right: testing a single node and deploying a cluster is testing the wrong thing. This change is accepted. **Fallback**: If the cluster setup proves too complex for the prototype timeline, we fall back to single-node for prototype but add an explicit "cluster validation" gate in Phase 2 before production cutover, with a 2-week buffer.

4. **Long tail of query migration**: Concede that the long tail is real. Mitigation: The prototype gates only require the top 10 queries. After cutover, the data team runs ad-hoc queries on ClickHouse with a published "ClickHouse SQL cookbook" that covers the 20 most common PostgreSQL-to-ClickHouse translation patterns (CTEs, window functions, date handling, approximate functions). For BI tool compatibility, we validate Metabase/Grafana's ClickHouse driver generates acceptable SQL for the 5 most-used dashboard panels before cutover. The long tail is accepted as an ongoing effort over months, not a gate for the initial migration. **Fallback**: If a specific critical query cannot be translated to ClickHouse, it stays on the PostgreSQL read replica. Dual-querying is acceptable for a small number of queries during the transition period.

**Proposal modifications after two rounds of challenge**:
- Replaced CDC (Debezium + Kafka) with batch ETL from a PostgreSQL read replica
- Replaced denormalization-at-ETL with ClickHouse dictionaries for dimension lookups
- Upgraded prototype from single-node to 3-node replicated cluster
- Added 7 engineering-days of explicit ClickHouse training
- Increased query rewrite budget from ~5 days to 20 engineering-days
- Added explicit PostgreSQL fallback plan (read replica + partitioning + materialized views)
- Total timeline extended from 16 weeks to ~18 weeks

---

### Round 6: CTO Decides

**Verdict**: prototype-first

**Rationale**: The Architect presented a sound case for workload separation -- the fundamental mismatch between OLTP and OLAP workloads on a single PostgreSQL instance is real and will only worsen as event volume grows. The Operator's challenges were substantive and forced three significant proposal modifications: simplifying the data pipeline (batch ETL over CDC), decoupling dimension lookups (dictionaries over denormalized ETL), and testing the actual production topology (3-node cluster from day 1). These improvements make the proposal materially stronger.

However, the Operator's challenge on team capability and the prototype-to-production gap was decisive in downgrading from `proceed` to `prototype-first`. The team has zero ClickHouse operational experience, and the data pipeline -- even in its simplified batch form -- introduces a new failure domain. The 3TB migration, query rewrite effort, and operational learning curve each carry enough uncertainty that committing to a 4-month production migration without a validated prototype is premature.

The PostgreSQL fallback plan (read replica + partitioning + materialized views) is a credible alternative that should be sketched in parallel, so we are not locked into ClickHouse by sunk cost if the prototype reveals showstoppers.

**Architecture modifications**:
- Batch ETL from PostgreSQL read replica (not CDC) as the data pipeline
- ClickHouse dictionaries for dimension lookups (not denormalized ETL)
- 3-node ReplicatedMergeTree cluster for prototype (not single-node)
- Explicit training budget of 7 engineering-days
- Query rewrite budget of 20 engineering-days for top 10 queries

**Action items**:
1. Platform Engineering Lead -- Provision a 3-node ClickHouse cluster (ClickHouse Keeper + ReplicatedMergeTree) in the staging environment and design the events table schema -- by 2026-04-12
2. Platform Engineering Lead -- Stand up a PostgreSQL read replica (if one does not exist) dedicated to ETL reads -- by 2026-04-08
3. Data Engineer -- Build the batch ETL job: query read replica, load into ClickHouse, with cursor-based pagination, overlap guard, and monitoring -- by 2026-04-19
4. Data Engineer -- Load 30 days of historical data into ClickHouse and configure dictionaries for dimension tables -- by 2026-04-22
5. Data Team Lead -- Port and benchmark top 10 analytics queries on ClickHouse; document performance comparison vs PostgreSQL -- by 2026-04-26
6. Platform Engineering Lead -- Complete ClickHouse operations training and produce an operational runbook with alerting -- by 2026-04-26
7. Architect -- Document the PostgreSQL fallback plan (read replica + partitioning + materialized views) as an alternative path with estimated timeline and expected performance -- by 2026-04-12
8. CTO -- Gate review meeting to evaluate prototype against conditions -- 2026-04-30

**Conditions / Gates**:
- Top 5 most expensive analytics queries complete in under 3 seconds on ClickHouse (baseline: 15-30s on PostgreSQL)
- Batch ETL sustains 50M events/day ingestion with less than 5-minute end-to-end latency and zero data loss over 7 consecutive days
- ClickHouse cluster operates with no manual intervention required for merge operations, replication, or partition management over 7 consecutive days
- Monitoring and alerting in place for: ingestion lag, query P99 latency, disk usage, replication status, merge health
- At least 2 engineers can independently troubleshoot a simulated ClickHouse ingestion failure and a simulated node loss within 30 minutes

**Risks accepted**:
- Analytics data will lag real-time by up to 5 minutes -- accepted because the data team's current workflow already tolerates minutes-to-hours-old data
- Long tail of query migration will take months beyond initial cutover -- accepted because the top 10 queries cover ~80% of analytics compute, and remaining queries can run on the PostgreSQL read replica during the transition
- ClickHouse ecosystem is smaller than PostgreSQL's -- accepted because the use case (event analytics) is ClickHouse's core strength with extensive community support and production references

**Review date**: 2026-04-30 -- Evaluate prototype gate results. Decision branches: (a) gates met -> proceed to Phase 2 production hardening, (b) gates partially met -> extend prototype by 2 weeks with specific remediation, (c) gates failed -> pivot to PostgreSQL optimization fallback path.

### Debate Metrics

| Metric | Value |
|--------|-------|
| challengesRaised | 7 |
| stressTestsRaised | 4 |
| challengesSurvived | 2 |
| challengesConceded | 3 |
| mitigationsHeld | 3 |
| mitigationsBroken | 1 |
| proposalModified | yes |
| confidenceScore | 7 |

</details>
