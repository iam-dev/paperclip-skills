# Should We Create a Platform Team? Internal Reallocation vs. New Hires

## Situation

20 engineers across 4 feature teams. Shared infrastructure — CI pipelines, monitoring, and developer tooling — has no clear ownership and is degrading as a result.

## Recommendation

**Hybrid approach: Pull 2 engineers from feature teams now and hire 2 new platform engineers over the next quarter.** Neither of the two pure options is ideal on its own. Here is the reasoning.

---

## Analysis of Option A: Pull 1 Engineer from Each Feature Team

**Pros:**
- Immediate availability — the team can start in weeks, not months.
- These engineers already know the codebase, the deployment process, and the pain points firsthand.
- Each person brings context from their feature team, which helps prioritize platform work that actually matters.
- No additional headcount cost.

**Cons:**
- Each feature team drops from 5 to 4 engineers, a 20% capacity reduction. That is significant and will slow feature delivery across all four teams simultaneously.
- Pulled engineers may feel the move is involuntary or a demotion, creating retention risk.
- Feature teams will keep filing urgent requests with "their" former teammate, blurring the boundary between platform work and feature work.
- You are selecting from a pool that was hired for feature development skills, not necessarily infrastructure expertise.

---

## Analysis of Option B: Hire 4 New Platform Engineers

**Pros:**
- Zero impact on current feature team velocity.
- You can hire specifically for platform/infrastructure skill sets (CI/CD, observability, IaC, developer experience).
- New hires bring fresh perspectives and may have seen better patterns at other organizations.

**Cons:**
- Hiring 4 specialized engineers takes 3-6 months in a competitive market.
- During that time, the infrastructure problems continue to worsen.
- New hires lack organizational context — they do not know which pipelines are fragile, which services are critical, or which teams have the worst pain points. Onboarding to full productivity takes another 3-6 months.
- Adds permanent headcount cost (salary, benefits, equipment) for 4 people, roughly $600K-$1.2M/year depending on market and seniority.
- A team of all-new members with no internal champion is at risk of building the wrong things.

---

## Recommended Hybrid Approach

### Phase 1 — Weeks 1-2: Bootstrap with Internal Engineers

- Identify 2 engineers across the four teams who (a) are genuinely interested in infrastructure work and (b) have demonstrated relevant skills. Do not force anyone into the role.
- These two form the founding platform team. Their first job is to triage: catalog every piece of shared infrastructure, assess severity, and create a prioritized backlog.
- Backfill their feature team seats by redistributing work across the remaining team members temporarily. Two teams losing one person each is more manageable than all four teams losing someone.

### Phase 2 — Weeks 2-8: Hire 2 External Platform Engineers

- Open two senior platform engineering roles. Target people with strong CI/CD, observability, and developer tooling backgrounds.
- The two internal engineers provide the organizational context that new hires will need. This dramatically shortens onboarding time.
- A 4-person team (2 internal + 2 external) gives you the right blend of institutional knowledge and specialized expertise.

### Phase 3 — Month 3+: Stabilize and Evaluate

- Once all four platform engineers are productive, evaluate whether the team size is sufficient.
- Consider rotating one feature engineer through the platform team each quarter (on a volunteer basis) to maintain cross-pollination and keep the platform team connected to real user needs.
- If two feature teams are still understaffed, hire backfills for those teams rather than pulling more people.

---

## Operating Model for the Platform Team

Regardless of how you staff the team, you need to define how it operates. Without this, you will recreate the same ownership vacuum.

1. **Ownership boundaries.** Write down explicitly what the platform team owns (CI pipelines, monitoring stack, developer tooling, shared test infrastructure) and what it does not own (service-level alerting, feature-specific test suites).

2. **SLAs and intake process.** Feature teams should submit platform requests through a defined channel (e.g., a shared board or ticket queue). The platform team commits to response-time SLAs — for example, P1 production issues within 2 hours, tooling requests triaged within 1 week.

3. **On-call rotation.** The platform team should own on-call for shared infrastructure. This is one of the clearest signals of ownership.

4. **Success metrics.** Track deployment frequency, CI build times, mean time to recovery, and developer satisfaction scores. These give the platform team clear goals and make their value visible to leadership.

5. **Reporting line.** The platform team should report to an engineering manager or director, not be embedded under one of the feature teams. This prevents their work from being deprioritized in favor of feature deadlines.

---

## Risks to Monitor

| Risk | Mitigation |
|---|---|
| Internal engineers want to return to feature work after 6 months | Set expectations upfront; make the platform role a genuine career track with its own growth ladder |
| Feature teams treat the platform team as a service desk | Establish clear boundaries; platform team builds tools and systems, not one-off scripts for individual teams |
| New hires take too long to ramp up | Pair them with internal engineers from day one; assign them ownership of a specific subsystem early |
| Platform team becomes a bottleneck | Emphasize self-service: build platforms that feature teams can use independently rather than requiring platform team intervention for every change |

---

## Bottom Line

The infrastructure ownership gap is causing real damage now, so waiting 6 months for a fully external hire is too slow. But gutting all four feature teams simultaneously is too disruptive. The hybrid path — 2 internal transfers plus 2 targeted hires — gets you moving within weeks, brings in specialized expertise within a quarter, and limits the impact on feature delivery to two teams instead of four.
