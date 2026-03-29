# Should We Migrate Analytics from PostgreSQL to ClickHouse?

## Recommendation: Yes, but with a phased dual-write approach -- not a hard cutover.

The numbers make a strong case. Here is the full analysis.

---

## 1. Problem Assessment

| Metric | Current State | Concern Level |
|---|---|---|
| Peak CPU | 80% | High -- leaves no headroom for spikes or growth |
| Data volume | 3 TB | Moderate -- manageable for Postgres, but column-oriented stores are far more efficient here |
| Ingestion rate | 50M events/day (~580 events/sec avg) | Moderate -- Postgres can handle this, but it competes with read queries for CPU |
| Query latency | 15-30 seconds | High -- unacceptable for interactive analytics |

The core issue is that PostgreSQL is a row-oriented OLTP database being asked to do OLAP work. Aggregating over billions of rows in a row store means full scans across wide rows, heavy CPU for decompression and aggregation, and constant contention between writes and reads.

---

## 2. Why ClickHouse Is the Right Tool

**Query performance**: ClickHouse is a columnar store designed for exactly this workload. Queries that take 15-30 seconds in PostgreSQL will typically run in sub-second to low single-digit seconds in ClickHouse on the same hardware. This is not marketing; it is the architectural advantage of reading only the columns you need and applying vectorized execution.

**Compression**: 3 TB of event data in PostgreSQL will likely compress to 300-500 GB in ClickHouse (typical 6-10x compression for event data), reducing storage costs and I/O.

**Ingestion**: ClickHouse handles 50M events/day trivially. It is designed for high-throughput batch inserts and can sustain millions of rows per second on modest hardware.

**CPU relief**: Moving the analytics workload off PostgreSQL frees that 80% CPU for what Postgres is good at -- transactional workloads, CRUD operations, and serving your application.

---

## 3. What ClickHouse Will NOT Solve

- **Point lookups by primary key**: Postgres is better for this. Keep your application data in Postgres.
- **Frequent updates/deletes**: ClickHouse uses a merge-tree engine. Mutations are expensive and asynchronous. If analytics queries need real-time row-level updates, you need a different pattern.
- **Joins across many tables**: ClickHouse can do joins, but it is optimized for wide denormalized tables and star schemas. If your analytics queries rely on complex multi-table joins, you will need to rethink the data model (which is usually the right move for analytics anyway).

---

## 4. Recommended Migration Plan

### Phase 1: Dual-Write (Weeks 1-3)
- Set up ClickHouse (self-hosted or ClickHouse Cloud).
- Implement dual-write: new events go to both PostgreSQL and ClickHouse.
- Use a message queue (Kafka, or even a simple CDC pipeline with Debezium) to decouple the write path.
- This is zero-risk to the existing system.

### Phase 2: Backfill Historical Data (Weeks 2-4)
- Export the 3 TB of historical event data from Postgres into ClickHouse.
- Use `clickhouse-client` with parallel inserts from CSV/Parquet dumps, or use `clickhouse-local` for transformation.
- Design the ClickHouse table schema with appropriate `ORDER BY` keys based on your most common query patterns (typically timestamp + tenant/user ID).
- Create materialized views for the heaviest aggregation queries.

### Phase 3: Validate and Shadow (Weeks 4-6)
- Run analytics queries against both systems in parallel.
- Compare results for correctness.
- Measure latency improvements.
- Let the data team trial ClickHouse directly (via Grafana, Metabase, or a SQL client).

### Phase 4: Cut Over Analytics (Week 7)
- Point analytics dashboards and data team queries at ClickHouse.
- Keep PostgreSQL as the source of truth for transactional data.
- Stop writing event data to PostgreSQL (or keep a short retention window for debugging).

### Phase 5: Decommission (Week 8+)
- Drop or archive the event tables in PostgreSQL.
- Right-size the PostgreSQL instance now that the analytics load is gone.
- Monitor CPU -- you should see a dramatic drop.

---

## 5. Risks and Mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| Data inconsistency during dual-write | Medium | Use CDC or queue-based ingestion; validate with checksums during shadow phase |
| Team unfamiliar with ClickHouse SQL dialect | Medium | ClickHouse SQL is close to standard SQL; main differences are in DDL and some functions. Budget a few days for the data team to ramp up |
| Operational complexity of running another database | Medium | Consider ClickHouse Cloud (managed) to minimize ops burden. If self-hosted, it runs well on 2-3 nodes for this data volume |
| Schema design mistakes | Medium | Start with a single denormalized events table ordered by (tenant_id, timestamp). Iterate once you see real query patterns |
| ClickHouse not suitable for some query patterns | Low | Keep Postgres available for any edge-case queries that need transactional semantics |

---

## 6. Cost Estimate

- **ClickHouse Cloud**: For 3 TB compressed (~400 GB), 50M inserts/day, and moderate query load, expect roughly $500-1,500/month depending on compute scaling.
- **Self-hosted**: 2-3 nodes with 16 cores, 64 GB RAM, and NVMe storage each. Likely comparable cost on cloud VMs, but with ops overhead.
- **Savings**: You can likely downsize your PostgreSQL instance once the analytics workload is removed, offsetting part of the ClickHouse cost.

---

## 7. Alternatives Considered

| Alternative | Verdict |
|---|---|
| **Optimize PostgreSQL** (partitioning, BRIN indexes, pg_cron for pre-aggregation) | Buys time but does not solve the fundamental row-vs-column mismatch. Worth doing in the short term while migration proceeds. |
| **TimescaleDB** (PostgreSQL extension) | Better than vanilla Postgres for time-series, but still row-oriented under the hood. Will not match ClickHouse performance for analytical aggregations at this scale. |
| **BigQuery / Redshift / Snowflake** | Viable but more expensive and introduces cloud vendor lock-in. ClickHouse gives better price/performance for this workload and can run anywhere. |
| **DuckDB** | Excellent for single-node analytics, but lacks the distributed ingestion and concurrency model needed for 50M events/day with multiple concurrent users. Better suited as a local analysis tool. |

---

## 8. Decision Summary

**Do it.** The workload profile (append-heavy event data, large aggregation queries, high volume) is precisely what ClickHouse was built for. The migration is low-risk with a dual-write approach, the performance improvement will be 10-50x for most queries, and it relieves the CPU pressure on PostgreSQL so it can do what it does best.

Start Phase 1 this sprint. Target analytics cutover in 6-8 weeks.
