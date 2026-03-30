# Deployment Strategy Decision — Webhook Processing Microservice (Debate Verdict)

## Context

**Service**: Webhook processing microservice
**Traffic**: Bursty, 0-500 RPS
**P95 processing time**: 8 seconds
**SLA**: Process within 30 seconds
**Team**: Strong Kubernetes experience, no Lambda production experience

**Options**:
- **Option A**: Kubernetes (EKS) — full orchestration, auto-scaling, existing cluster
- **Option B**: AWS Lambda — serverless, pay-per-invocation, no server management

---

## Stage 1: Advocate Report

### Option A — Kubernetes (EKS)

#### Strengths

- **A-001: Team expertise alignment.** The team has strong K8s production experience. This eliminates ramp-up time, reduces operational risk during incidents, and means runbooks, alerting, and debugging workflows already exist. Deploying on a known platform means faster time-to-production and fewer surprise failure modes.
- **A-002: Existing cluster reduces infrastructure cost.** An EKS cluster is already running. Adding a new deployment to an existing cluster has marginal cost — no new control plane fees, existing node groups can absorb initial load, and shared infrastructure (ingress controllers, monitoring, logging) is already provisioned.
- **A-003: No execution time limits.** The 8-second P95 processing time fits comfortably, with no artificial ceiling. If edge cases push processing to 20-25 seconds, Kubernetes handles this without any architectural changes. There is no timeout cliff to worry about.
- **A-004: Predictable scaling behavior.** Horizontal Pod Autoscaler (HPA) with custom metrics (e.g., queue depth or RPS) provides well-understood, tunable scaling. The team can set precise scaling thresholds, cooldown periods, and min/max replicas. Scaling from 0-500 RPS is a solved problem with HPA + Cluster Autoscaler.
- **A-005: Full control over runtime environment.** Custom base images, sidecar containers for logging/tracing, init containers for config, persistent connections to downstream services (connection pooling), and long-lived in-memory caches are all available.

#### Best-Fit Scenarios

- When the team needs to ship quickly with high confidence in operations
- When processing times may grow beyond current P95
- When connection pooling to downstream databases/services matters

#### Hidden Advantages

- Pod Disruption Budgets ensure zero-downtime deploys during webhook bursts
- Can run the same container locally via Docker Compose for development parity
- Network policies provide fine-grained security controls between services

---

### Option B — AWS Lambda

#### Strengths

- **A-006: Zero server management.** No patching, no node draining, no cluster upgrades, no AMI updates. Operational burden drops to near-zero for infrastructure. The team focuses purely on application code.
- **A-007: Pay-per-invocation economics during low traffic.** At 0 RPS (idle periods), cost is literally zero. For bursty workloads that spend significant time at low or zero traffic, Lambda can be dramatically cheaper than maintaining always-on pods.
- **A-008: Massive burst scaling.** Lambda can scale to 1,000+ concurrent executions almost instantly (within account limits). The 0-to-500 RPS burst pattern is exactly the workload Lambda excels at — no pre-warming, no HPA lag, no waiting for new nodes to join the cluster.
- **A-009: Built-in retry and dead-letter queue integration.** Lambda natively integrates with SQS, SNS, and EventBridge for webhook ingestion, with built-in retry policies and DLQ routing for failed invocations. This is table-stakes infrastructure that would need to be built manually on K8s.
- **A-010: Reduced blast radius.** Each invocation is isolated. A memory leak or crash in one invocation does not affect others. On K8s, a crashing pod can cause cascading failures if readiness probes are misconfigured.

#### Best-Fit Scenarios

- When traffic is heavily bursty with long idle periods
- When the team wants to minimize operational overhead long-term
- When per-invocation cost is favorable vs. sustained compute

#### Hidden Advantages

- Provisioned concurrency can eliminate cold starts for a predictable baseline
- Lambda Destinations simplify success/failure routing without extra code
- ARM64 (Graviton2) Lambda functions offer ~20% cost savings

---

## Stage 2: Critic Report

### Challenge to Option A — Kubernetes (EKS)

- **C-001: Operational complexity is real and ongoing (severity: medium).** The Advocate cites "existing cluster" as a cost advantage, but this ignores ongoing burden: node upgrades, K8s version upgrades (annual), security patches, and capacity planning. Adding a bursty 0-500 RPS workload to a shared cluster risks noisy-neighbor issues and requires careful resource requests/limits tuning.
- **C-002: Scaling lag for bursty traffic (severity: high).** HPA + Cluster Autoscaler has a cold path: metric collection (15s) -> HPA evaluation (15-30s) -> pod scheduling (5-10s) -> if new node needed, Cluster Autoscaler adds node (2-5 min). A burst from 0 to 500 RPS can arrive faster than K8s can scale. The team must over-provision (min replicas > 0) to compensate, which negates cost savings during idle periods.
- **C-003: Over-engineering risk (severity: medium).** Kubernetes provides capabilities (service mesh, network policies, pod disruption budgets) that the Advocate lists as advantages — but for a webhook processor, many of these are unnecessary complexity. A simpler platform might be more appropriate for this service's scope.
- **C-004: Resource waste during idle periods (severity: medium).** Even with scale-to-zero solutions like KEDA, Kubernetes fundamentally requires minimum infrastructure running. At 0 RPS, the team still pays for node capacity, control plane, and monitoring overhead.

### Challenge to Option B — AWS Lambda

- **C-005: Cold start risk under SLA pressure (severity: high).** Lambda cold starts for compiled runtimes (Java, .NET) can reach 5-10 seconds. Combined with the 8-second P95 processing time, a cold-start invocation could take 13-18 seconds — still within the 30-second SLA, but uncomfortably close. For interpreted runtimes (Node.js, Python), cold starts are 200-500ms, which is manageable. The severity depends entirely on language choice.
- **C-006: 15-minute timeout is sufficient but creates architectural constraints (severity: medium).** The 8-second P95 fits well within 15 minutes. However, if future requirements add batch processing, long-running workflows, or webhook chains, the timeout becomes a hard wall requiring architectural decomposition (Step Functions, SQS fan-out).
- **C-007: No team production experience with Lambda (severity: high).** This is a genuine risk. Lambda debugging, observability (X-Ray, CloudWatch Logs Insights), deployment patterns (SAM, CDK, Serverless Framework), local testing (SAM local), and cold-start optimization are all skills the team must build from scratch. First production incident response will be slower and more stressful.
- **C-008: Vendor lock-in (severity: medium).** Lambda's event source mappings, execution model, and deployment tooling are deeply AWS-specific. Migrating away requires rewriting the deployment and potentially the invocation layer. K8s deployments are portable across cloud providers.
- **C-009: Concurrency limits can cause throttling (severity: medium).** AWS Lambda has account-level concurrency limits (default 1,000, but shared across all functions). At 500 RPS with 8-second processing, peak concurrency is ~4,000 simultaneous executions (500 * 8). This exceeds default limits and requires a limit increase request, plus reserved concurrency configuration. If not planned for, webhooks will be throttled and dropped.

### Advocate Accuracy

- **Over-stated on Option A**: A-002 (existing cluster cost) understates ongoing operational burden
- **Over-stated on Option B**: A-008 (burst scaling) ignores concurrency limit math
- **Correctly identified**: A-001 (team expertise), A-003 (no time limits), A-007 (idle cost)
- **Missed entirely**: Concurrency math for Lambda at 500 RPS * 8s processing

---

## Stage 3: Arbiter Decision

### Dispute Resolutions

| Factor | Advocate Position | Critic Position | Arbiter Ruling |
|--------|------------------|-----------------|----------------|
| K8s scaling lag (C-002) | HPA handles 0-500 RPS | Scaling lag causes dropped requests | **Critic is right.** Must over-provision with min replicas (e.g., 5-10 pods) to absorb initial burst. This is a known K8s pattern, manageable but not free. |
| Lambda cold starts (C-005) | Near-instant scaling | Cold starts risk SLA breach | **Partially valid.** For Node.js/Python runtimes, cold starts are ~300ms — negligible against 30s SLA. For JVM/.NET, provisioned concurrency solves it at added cost. Not a deal-breaker. |
| Lambda concurrency (C-009) | Massive burst scaling | 500 RPS * 8s = 4,000 concurrent | **Critic is right.** This is the critical finding. 4,000 concurrent executions exceeds default limits. Requires planning: reserved concurrency, limit increase, and potentially SQS buffering. Solvable but must be addressed up-front. |
| Team experience (C-007) | Lambda reduces ops burden | No Lambda production experience | **Critic is right.** First incident without production experience is a real risk. However, webhook processing is a well-documented Lambda use case with extensive AWS reference architectures. Risk is bounded. |

### Ranked Options

#### Rank 1: Option A — Kubernetes (EKS)

**Decisive factors:**
1. **Team expertise is the strongest signal.** The team can ship, operate, and debug this on day one. For a production service with a 30-second SLA, operational confidence matters more than theoretical elegance.
2. **No execution time limits.** The 8-second P95 has room to grow without architectural changes. If webhook processing becomes more complex, K8s absorbs it.
3. **Scaling lag is manageable.** Running 5-10 minimum replicas handles burst absorption. The cost is modest on an existing cluster.
4. **Proven patterns.** The team already has monitoring, alerting, CI/CD, and incident response for K8s workloads.

**Conditions/caveats:**
- Must configure min replicas (5-10) to handle burst arrival before HPA scales
- Should use KEDA for queue-based autoscaling rather than CPU-based HPA for webhook workloads
- Monitor for noisy-neighbor effects on the shared cluster

#### Rank 2: Option B — AWS Lambda

**Why it ranks lower:**
1. Concurrency math (4,000 concurrent at peak) requires careful limit management and SQS buffering — additional complexity that offsets "serverless simplicity"
2. Team has zero Lambda production experience — first incident will be slower to resolve
3. The benefits (zero idle cost, no server management) are real but less impactful given an existing cluster with experienced operators

**When this ranking would flip:**
- If the team had Lambda production experience
- If idle periods dominate (>90% of time at <10 RPS), making cost the primary concern
- If the existing K8s cluster were being decommissioned
- If the team were greenfield with no existing infrastructure

### Per-Option Summary

| Dimension | Option A (K8s) | Option B (Lambda) |
|-----------|---------------|-------------------|
| Team readiness | Strong — production experience | Weak — no production experience |
| Time to production | Fast — known platform | Moderate — learning curve |
| Scaling | Good with min replicas | Excellent but needs concurrency planning |
| Idle cost | Moderate — min replicas always running | Excellent — zero at idle |
| Operational burden | Moderate — ongoing cluster ops | Low — managed service |
| SLA confidence | High — no time limits, known failure modes | Moderate — cold starts, concurrency limits |
| Future flexibility | High — no constraints | Moderate — 15-min timeout ceiling |

### Final Recommendation

**Recommendation: Option A — Kubernetes (EKS)**
**Confidence: High (8/10)**

The team's existing Kubernetes expertise combined with the existing cluster makes this the lower-risk, faster path to production. The webhook processing workload (bursty, 8-second P95, 30-second SLA) is well within K8s capabilities, especially with queue-based autoscaling (KEDA) and appropriately set minimum replicas.

Lambda is a strong technical fit for bursty webhook processing in the abstract, but the concurrency math at peak load (4,000 concurrent executions) and the team's lack of Lambda production experience introduce risks that outweigh the operational simplicity benefits — particularly given that K8s operational simplicity is already "solved" for this team.

### Conditions That Would Change This Recommendation

1. **Team gains Lambda experience** through a lower-stakes service first — then revisit for this workload
2. **Cost analysis shows >3x savings** with Lambda due to very high idle-to-active ratio
3. **K8s cluster is being sunset** or the team is moving to a serverless-first architecture
4. **Processing requirements change** to event-driven fan-out patterns where Lambda + Step Functions is architecturally superior
