# Skill Debate: PostgreSQL vs MongoDB for E-Commerce Product Catalog

## Decision Context

**Question:** Should we use PostgreSQL or MongoDB for a new e-commerce product catalog?

**Constraints:**
- 50K SKUs, 100K daily queries
- Faceted search required
- Catalog items have highly variable attributes (clothing: size/color; electronics: specs/warranty; books: ISBN/author)
- Team: 3 backend engineers, all experienced with PostgreSQL, no MongoDB experience
- Need consistency guarantees for an e-commerce system

---

## Stage 1: Advocate Report

*The advocate argues FOR each option's strengths, identifying unique benefits, best-fit scenarios, and hidden advantages.*

### Option A: PostgreSQL

**Strengths:**

- **A-001: Team expertise eliminates ramp-up risk.** All 3 engineers are experienced with PostgreSQL. This means zero learning curve, faster time-to-market, and the team can handle production incidents confidently from day one. For a 3-person team, this is a force multiplier — there is no slack to absorb the productivity loss of learning a new database.

- **A-002: JSONB columns solve the variable-attribute problem elegantly.** PostgreSQL's `jsonb` data type lets you store arbitrary attributes per product category while keeping the relational core for shared fields (price, name, SKU, stock, category). You get the flexibility of a document model inside a relational database. `jsonb` supports indexing via GIN indexes, partial indexes, and expression indexes, enabling fast queries on variable attributes without sacrificing schema integrity for the fixed fields.

- **A-003: ACID compliance is critical for e-commerce.** Product catalog changes (price updates, inventory adjustments, bulk imports) must be consistent. PostgreSQL guarantees that a bulk catalog update either fully commits or fully rolls back. In an e-commerce context, a partially-applied price change could mean selling items at the wrong price — a direct business risk.

- **A-004: Mature ecosystem for faceted search.** PostgreSQL supports faceted search through several proven approaches:
  - GIN indexes on `jsonb` for attribute filtering
  - `pg_trgm` for text search
  - Materialized views for pre-computed facet counts
  - Integration with Elasticsearch/OpenSearch as a dedicated search layer when needed (a common pattern that works with any database)

- **A-005: Scale is well within PostgreSQL's comfort zone.** 50K rows is trivial for PostgreSQL. 100K daily queries (~1.2 queries/second average) is orders of magnitude below PostgreSQL's capacity. Even at 10x peak load, a single PostgreSQL instance handles this effortlessly. There is no scaling problem to solve here.

- **A-006: Strong typing for core catalog fields.** Prices, stock quantities, SKUs, and category hierarchies benefit from enforced types, constraints, and foreign keys. This prevents data integrity issues that are costly in e-commerce (e.g., a null price, a negative stock count, an orphaned category reference).

**Best-fit scenarios:** Small-to-medium catalog sizes; teams with relational expertise; systems where consistency matters more than write throughput; products with a mix of fixed and variable attributes.

**Hidden advantages:**
- PostgreSQL's `GENERATED COLUMNS` and `CHECK CONSTRAINTS` can enforce business rules at the data layer (e.g., ensuring sale_price < regular_price)
- Row-level security can support multi-tenant catalog scenarios if the business expands
- Window functions and CTEs make complex catalog reports (top sellers by category, price distribution analysis) straightforward

---

### Option B: MongoDB

**Strengths:**

- **A-007: Native document model mirrors product catalog structure.** Each product is naturally a document with its own shape. A clothing item `{size: "M", color: "red", material: "cotton"}` and an electronics item `{specs: {...}, warranty: "2yr"}` coexist without any schema gymnastics. No JSONB workarounds — this is the primary data model.

- **A-008: Schema evolution is frictionless.** Adding a new attribute to a product category requires no migration. In a fast-moving e-commerce business where product types expand frequently (adding "garden supplies" with attributes like "soil type" and "sun exposure"), MongoDB handles this without ALTER TABLE or migration scripts.

- **A-009: Horizontal scaling built in.** MongoDB's sharding distributes data across nodes automatically. If the catalog grows from 50K to 5M SKUs, or query volume jumps from 100K to 10M daily, MongoDB scales horizontally without re-architecture. PostgreSQL scaling at that level requires read replicas, Citus, or application-level sharding — all more complex.

- **A-010: Aggregation pipeline for faceted search.** MongoDB's aggregation framework supports `$facet` as a first-class operation. Building faceted search (e.g., "show me all laptops under $1000 with 16GB RAM, and also show me the count of results per brand and per price range") maps directly to MongoDB's aggregation pipeline with purpose-built operators.

- **A-011: Flexible indexing on nested fields.** MongoDB supports indexes on any nested document field, wildcard indexes across all attributes, and compound indexes mixing fixed and variable fields. This supports the variable-attribute query pattern without the GIN index overhead model of PostgreSQL.

**Best-fit scenarios:** Rapidly evolving catalog schemas; very large catalogs (millions of SKUs); high write throughput for catalog ingestion; teams already familiar with MongoDB.

**Hidden advantages:**
- MongoDB Atlas Search (built on Lucene) provides full-text and faceted search without a separate Elasticsearch deployment
- Change streams enable real-time catalog sync to other services
- The document model simplifies API serialization (document -> JSON response with minimal transformation)

---

## Stage 2: Critic Report

*The critic challenges each option, finding weaknesses, risks, hidden costs, and edge cases.*

### Challenging Option A: PostgreSQL

- **C-001: JSONB is a compromise, not a native solution (severity: medium).** The Advocate (A-002) claims JSONB "solves the variable-attribute problem elegantly." This overstates it. JSONB queries use different syntax than standard SQL (`->`, `->>`, `@>`, `?`), creating a hybrid query language that is harder to maintain. There is no schema enforcement on the JSONB portion — you can accidentally store `{"colour": "red"}` instead of `{"color": "red"}` with no error. You lose the strong typing advantage (A-006) for the very fields that vary most.

- **C-002: Faceted search requires significant engineering (severity: medium).** The Advocate (A-004) lists several faceted search approaches but understates the work. Materialized views need manual refresh strategies. GIN indexes on large JSONB blobs can be slow to update. Building a proper faceted search (with counts per facet value, range facets, hierarchical facets) in pure PostgreSQL requires substantial custom SQL — there is no `$facet` equivalent. In practice, most PostgreSQL e-commerce systems add Elasticsearch for search, which means running two data stores anyway.

- **C-003: Schema migrations for structural changes are still needed (severity: low).** Adding a new shared column (e.g., "sustainability_rating" across all products) requires an ALTER TABLE and migration, unlike MongoDB where it is a no-op. For a 50K-row table this is fast, but it introduces process overhead.

### Challenging Option B: MongoDB

- **C-004: Zero team experience is a critical risk (severity: critical).** The Advocate (A-007 through A-011) lists MongoDB's technical merits but never addresses that no one on the team has used it. Learning MongoDB properly — including its consistency model, indexing strategy, aggregation pipeline, connection pooling, and operational practices — takes months. A 3-person team cannot afford to have all engineers on a learning curve simultaneously. Production incidents during the learning phase will be handled slowly and incorrectly. This is the single largest risk factor in this decision.

- **C-005: Weaker consistency guarantees are dangerous for e-commerce (severity: high).** MongoDB's default `readConcern` is "local" and default `writeConcern` is `{w: 1}`. This means reads can return data that may be rolled back, and writes are acknowledged before replication. For an e-commerce catalog where price accuracy and stock availability drive purchasing decisions, this is a real risk. You can configure stronger consistency (`readConcern: "majority"`, `writeConcern: "majority"`), but this requires the team to understand and correctly configure these settings — see C-004.

- **C-006: The scale argument is irrelevant at 50K SKUs (severity: high).** The Advocate (A-009) argues horizontal scaling as a strength, but 50K SKUs and 100K daily queries do not require horizontal scaling. This advantage is entirely theoretical for the stated requirements. Choosing a database for scaling you do not need — while accepting risks you do face (C-004, C-005) — is poor engineering judgment.

- **C-007: MongoDB Atlas Search adds vendor lock-in (severity: medium).** The Advocate mentions Atlas Search as a hidden advantage. This is only available on MongoDB Atlas (the managed cloud service), not self-hosted MongoDB. It creates vendor dependency. If the team uses self-hosted MongoDB, they still need a separate search solution.

- **C-008: Aggregation pipeline complexity (severity: medium).** While `$facet` is powerful, the MongoDB aggregation pipeline syntax is notoriously difficult to read and debug for newcomers. Combined with C-004, the team will struggle to build, optimize, and maintain aggregation pipelines.

### Critic Summary

| Option | Critical Issues | High Issues | Medium Issues | Low Issues |
|--------|----------------|-------------|---------------|------------|
| PostgreSQL | 0 | 0 | 2 | 1 |
| MongoDB | 1 | 2 | 2 | 0 |

**Deal-breaker assessment:** C-004 (zero MongoDB experience on a 3-person team) combined with C-005 (consistency risks in e-commerce) and C-006 (no actual need for MongoDB's scaling advantage) collectively form a strong case against MongoDB for this specific situation.

---

## Stage 3: Arbiter Decision

*The arbiter weighs advocate and critic arguments, ranks options, and provides the final recommendation.*

### Dispute Resolution

**Dispute 1: Is PostgreSQL JSONB adequate for variable attributes?**
- Advocate (A-002): JSONB solves the problem elegantly
- Critic (C-001): JSONB is a compromise with no schema enforcement on variable fields

**Arbiter ruling:** The Critic is partially right — JSONB is a compromise. However, this compromise is well-understood, widely used in production (Shopify's core catalog ran on PostgreSQL for years), and the lack of schema enforcement on variable attributes can be mitigated with application-level validation (which you need regardless of database choice). The "hybrid query syntax" concern is real but minor — ORMs and query builders abstract this. **Verdict: JSONB is adequate, not perfect. Slight edge to Critic on nuance, but does not change the recommendation.**

**Dispute 2: Is MongoDB's scaling advantage relevant?**
- Advocate (A-009): Horizontal scaling is a built-in advantage
- Critic (C-006): Irrelevant at 50K SKUs / 100K daily queries

**Arbiter ruling:** The Critic is clearly right. At 50K rows and ~1.2 QPS average, PostgreSQL handles this with zero stress on modest hardware. Choosing a database for hypothetical future scale when there are concrete present-day risks (team inexperience) is not justified. If the catalog grows to millions of SKUs, the team can evaluate migration at that point — with more experience and data about actual usage patterns. **Verdict: Critic wins this dispute.**

**Dispute 3: How critical is team inexperience with MongoDB?**
- Advocate: Not directly addressed (acknowledged implicitly by omission)
- Critic (C-004): Critical risk for a 3-person team

**Arbiter ruling:** The Critic is right, and this is the decisive factor. Database choice is not just about technical fit — it is about the team's ability to operate the system in production. A 3-person team with zero MongoDB experience will face: slower development velocity, higher risk of data modeling mistakes, slower incident response, and inability to optimize queries and indexes effectively. These are not theoretical risks — they are near-certainties. **Verdict: Critic wins decisively.**

### Ranked Options

| Rank | Option | Confidence |
|------|--------|------------|
| **1** | **PostgreSQL** | **High** |
| 2 | MongoDB | Low |

### Per-Option Summary

| Factor | PostgreSQL | MongoDB |
|--------|-----------|---------|
| Team readiness | Strong (all 3 engineers experienced) | Weak (zero experience) |
| Variable attributes | Good (JSONB with GIN indexes) | Excellent (native document model) |
| Consistency | Excellent (ACID) | Adequate (requires careful configuration) |
| Faceted search | Moderate (requires engineering or Elasticsearch) | Good (native $facet, Atlas Search) |
| Scale fit | Excellent (50K SKUs is trivial) | Overkill (designed for much larger scale) |
| Risk profile | Low | High |

### Final Recommendation

**Use PostgreSQL** with the following architecture:

1. **Core schema:** Relational tables for shared product fields (id, sku, name, price, stock, category_id, created_at, updated_at) with a `jsonb` column for category-specific attributes.

2. **Indexing strategy:** GIN index on the attributes JSONB column; B-tree indexes on price, category, and commonly filtered fields; partial indexes for active/in-stock products.

3. **Faceted search:** Start with PostgreSQL-native queries using `jsonb` aggregation. If search requirements grow complex (autocomplete, typo tolerance, relevance ranking), add Elasticsearch/OpenSearch as a read-only search index — this is the industry-standard pattern used by most e-commerce platforms regardless of primary database.

4. **Schema pattern example:**
   ```sql
   CREATE TABLE products (
       id          BIGSERIAL PRIMARY KEY,
       sku         VARCHAR(50) UNIQUE NOT NULL,
       name        TEXT NOT NULL,
       price       NUMERIC(10,2) NOT NULL CHECK (price > 0),
       category_id INTEGER REFERENCES categories(id),
       attributes  JSONB NOT NULL DEFAULT '{}',
       is_active   BOOLEAN DEFAULT true,
       created_at  TIMESTAMPTZ DEFAULT now(),
       updated_at  TIMESTAMPTZ DEFAULT now()
   );

   CREATE INDEX idx_products_attributes ON products USING GIN (attributes);
   CREATE INDEX idx_products_category ON products (category_id) WHERE is_active;
   ```

**Confidence level:** High. The scale requirements clearly fit PostgreSQL. The team expertise strongly favors PostgreSQL. The variable-attribute challenge is well-handled by JSONB. The only scenario where MongoDB would be clearly better — millions of SKUs with extreme schema variability and a MongoDB-experienced team — does not apply here.

### Conditions Under Which This Recommendation Would Change

- **If the team had MongoDB experience** and PostgreSQL was unknown: MongoDB would be the stronger choice for the same reasons (team expertise dominates at this team size).
- **If the catalog were 5M+ SKUs with 10M+ daily queries:** MongoDB's horizontal scaling would become a relevant advantage worth the learning investment.
- **If product schemas changed daily with hundreds of unique attribute sets:** Pure document model would reduce friction compared to JSONB validation, though this scenario is unusual in practice.
- **If the team grew to 10+ engineers with mixed experience:** The team expertise factor would be diluted, making the technical merits a larger portion of the decision.
