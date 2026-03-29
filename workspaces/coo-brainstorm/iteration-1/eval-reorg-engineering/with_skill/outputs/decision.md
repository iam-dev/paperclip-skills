# Operations Decision Brief: Platform Team Formation Strategy

**Date**: 2026-03-29
**From**: COO
**Recommendation**: pilot-first
**Confidence**: 7/10
**Budget impact**: ~$80K-$120K transition cost (internal reallocation option); ~$600K-$800K/year fully loaded (external hire option)
**People impact**: 4 engineers reassigned (internal option) or 4 net-new hires; all 20 current engineers affected by workflow changes

---

## CEO Summary

Shared infrastructure — CI pipelines, monitoring, and developer tooling — is degrading because no one owns it, creating growing drag on all 4 feature teams. I recommend a **pilot-first approach**: immediately reassign 2 engineers (from the 2 least capacity-constrained feature teams) to form a platform team nucleus, run that for 90 days, then decide whether to backfill those 2 seats and hire 2 more externally, or pull 2 additional engineers internally. This avoids the 4-6 month hiring lag of going fully external, limits the blast radius to feature team velocity if the internal pull hits harder than expected, and gives us real data before committing to either full option. The CEO needs to approve the initial 2-person reassignment and a $100K contingency budget for backfill hiring if the pilot validates the model.

---

## Recommendation Details

**Recommendation**: pilot-first

**Rationale**: The Optimizer made a strong case that internal reallocation is faster and leverages existing codebase knowledge, but the Frontline Operator successfully demonstrated that pulling 4 engineers simultaneously from feature teams creates unacceptable delivery risk — each team drops from 5 to 4 engineers (a 20% capacity hit) precisely when infrastructure debt means they already have less effective capacity. The external-hire-only path solves the capacity problem but introduces a 4-6 month lag during which infrastructure continues to degrade and new hires lack institutional context. The hybrid pilot lets us move immediately with reduced risk.

**Operating model modifications**: The original proposal was to pull 1 engineer from each of the 4 feature teams simultaneously. The modified proposal stages this: start with 2 engineers from the 2 teams with the most infrastructure pain (and thus the most to gain from a platform team), run 90 days, then expand based on data.

**Action items**:
1. Engineering Director — Identify the 2 feature teams with highest infrastructure burden (measured by time spent on CI fixes, monitoring gaps, tooling workarounds) — by 2026-04-05
2. Engineering Director — Select 2 engineers (1 from each identified team) who have strong infrastructure interest and institutional knowledge; confirm with their managers — by 2026-04-12
3. New Platform Team Lead (one of the 2 engineers) — Define the platform team charter, initial backlog (top 5 infrastructure pain points), and SLA for internal requests — by 2026-04-26
4. VP Engineering — Open 2 external platform engineer requisitions immediately as contingency pipeline — by 2026-04-12
5. COO — Conduct 90-day pilot review with feature team velocity data, infrastructure incident metrics, and platform team output — by 2026-07-26

**Conditions / Gates**:
- Gate 1 (Day 30): Feature teams that lost an engineer have not missed sprint commitments by >15%. If they have, activate backfill hiring for those seats.
- Gate 2 (Day 60): Platform team has shipped at least 2 measurable infrastructure improvements (e.g., CI pipeline time reduction, monitoring coverage increase).
- Gate 3 (Day 90): Full review — decide whether to expand to 4-person platform team via internal moves, external hires, or a mix.

**Risks accepted**:
- 2 feature teams will lose 20% capacity for at least 90 days — accepted because infrastructure debt is already costing all 4 teams more than 20% in aggregate drag
- Platform team of 2 is undersized for the full infrastructure scope — accepted because the goal of the pilot is to validate the model and prioritize ruthlessly, not to solve everything
- Selected engineers may not want to move — accepted with the condition that this must be voluntary; forced reassignment poisons the platform team from day one

**People impact summary**:
- Headcount: Net zero during pilot (internal reallocation); potential +2 to +4 after pilot depending on outcome
- Roles affected: 2 engineers transition from feature work to platform/infrastructure; their feature teams absorb the capacity reduction
- Transition support: 2-week handoff period for each departing engineer to transfer feature work context; platform team gets dedicated onboarding sprint to audit infrastructure and define their roadmap
- Attrition risk: Moderate — engineers pulled to platform work may thrive (many engineers prefer infrastructure work) or may feel sidelined from product impact. Voluntary selection and a clear charter mitigate this. Feature team engineers who stay may feel overloaded; sprint scope must be adjusted.

**Budget impact**:
- Current cost: $0 dedicated platform spend (infrastructure work is unfunded, absorbed ad-hoc by feature teams)
- Proposed cost (pilot): ~$0 incremental (internal reallocation of existing salary)
- Transition cost: ~$80K-$120K (reduced sprint output during handoff, tooling setup, potential contractor backfill for critical feature work)
- Post-pilot cost (if expanded to 4 via external hires): ~$600K-$800K/year fully loaded for 2-4 new platform engineers
- Expected ROI: Industry benchmarks suggest a well-functioning platform team serving 16-20 engineers reduces per-engineer infrastructure drag by 3-5 hours/week. At 18 remaining feature engineers, that is 54-90 hours/week recovered — equivalent to 1.5-2.5 FTE of recaptured capacity.

**Review date**: 2026-07-26 — Evaluate feature team velocity trends, infrastructure incident frequency, platform team output, and engineer satisfaction surveys. Decide on permanent team size and composition.

---

## Full Debate Record

### Round 1: Optimizer Proposes

**Thesis**: Create a dedicated 4-person platform team by pulling 1 engineer from each feature team immediately, rather than waiting 4-6 months to hire externally, because the infrastructure debt is compounding daily and internal engineers already understand the systems.

**Operating model**:
The platform team operates as an internal service team. They own CI/CD pipelines, monitoring/observability stack, developer tooling (local dev environments, test infrastructure, deployment automation), and shared libraries. Feature teams file requests via a lightweight internal ticketing system. The platform team works in 2-week sprints, splitting time roughly 60/40 between proactive infrastructure improvement and reactive support requests. One engineer rotates weekly as "on-call" for urgent infrastructure issues, freeing the other 3 for project work. The platform team lead (selected from the 4 for strongest infrastructure experience) reports to the VP Engineering and attends all feature team standups weekly to stay connected to pain points.

**Rationale**:
1. **Speed**: Internal reallocation can happen in 2 weeks. External hiring takes 4-6 months (sourcing, interviewing, onboarding). Infrastructure is degrading now — every month of delay means more accumulated debt.
2. **Context**: Internal engineers already know the codebase, the CI quirks, the monitoring gaps, and the tribal knowledge about why things are configured the way they are. External hires need 2-3 months just to reach baseline productivity.
3. **Cost efficiency**: No incremental salary cost. The same 20 engineers, reorganized for better leverage. Hiring 4 new platform engineers at $150K-$200K fully loaded each adds $600K-$800K/year permanently.
4. **Ownership clarity**: The current "everyone owns it, no one owns it" model is the root cause. Any solution that doesn't establish clear ownership quickly will fail, and internal reallocation establishes ownership fastest.
5. **Reversibility**: If the platform team model doesn't work, engineers can return to their feature teams. External hires are a permanent cost commitment.

**Timeline**:
- Phase 1 (Weeks 1-2): Select engineers, begin knowledge transfer from feature teams
- Phase 2 (Weeks 3-4): Platform team forms, audits all shared infrastructure, defines charter and initial backlog
- Phase 3 (Weeks 5-12): First sprint cycle — tackle top 3 infrastructure pain points
- Phase 4 (Months 4-6): Steady state — platform team operating at full capacity with established SLAs

**Resource cost**: 4 engineers reallocated (zero incremental headcount cost). Transition effort: ~2 weeks reduced velocity per feature team during handoff. Tooling: ~$5K-$15K for any new infrastructure tooling the platform team identifies as needed.

**Success metrics**:
- CI pipeline reliability: from current ~85% green rate to 95%+ within 3 months
- Mean time to resolve infrastructure incidents: 50% reduction within 3 months
- Developer tooling satisfaction (internal survey): from current estimated 4/10 to 7/10 within 6 months
- Feature team time spent on infrastructure workarounds: from estimated 5-8 hours/engineer/week to <2 hours/engineer/week

---

### Round 2: Frontline Operator Challenges

1. **Simultaneous 20% capacity hit across all 4 teams** (critical) [capacity]: Each feature team goes from 5 to 4 engineers overnight. That is not a rounding error — it is the difference between delivering 4 features per sprint and delivering 3. If all 4 teams are mid-sprint on committed work, who absorbs the in-progress tasks of the departing engineers? You are proposing to slow down every product delivery pipeline simultaneously to fix the infrastructure pipeline. Leadership will see feature velocity drop in the first month and panic.

2. **You are pulling your best infrastructure people out of feature teams** (critical) [people-impact]: The engineers most qualified for platform work are the same ones who are currently the informal infrastructure heroes on their feature teams. They are the ones other engineers go to when the build breaks. When they leave, the feature teams don't just lose 20% capacity — they lose their local infrastructure knowledge. The remaining 4 engineers on each team will hit infrastructure issues they used to ask that person about, and now that person is on a different team with a different backlog.

3. **"Voluntary" selection is a fiction at this team size** (significant) [people-impact]: With 5 engineers per team, there are maybe 1-2 per team with the right infrastructure skills. The "choice" is between volunteering and watching someone less qualified get volun-told. And if the strongest infrastructure engineer on a team genuinely does not want to leave their feature work, do you force them or do you send someone less capable? Either answer has consequences.

4. **No backfill means compounding velocity loss** (significant) [capacity]: The proposal frames zero incremental cost as a benefit. But the feature teams are presumably staffed at 5 for a reason — they have roadmap commitments. Losing 1 engineer with no backfill means either the roadmap slips, quality drops (less code review, less testing, more shortcuts), or the remaining 4 engineers absorb the work through overtime. None of these are free.

5. **Platform team of 4 is too small for the scope** (significant) [capacity]: CI pipelines, monitoring, developer tooling — that is 3 major domains. With 1 engineer on weekly rotation for reactive support, you have 3 engineers covering 3 domains. There is zero slack for illness, vacation, or deep-focus project work. When one person is on PTO, their domain gets zero proactive investment for that sprint.

6. **Informal-to-formal ownership transition breaks existing patterns** (significant) [execution-risk]: Right now, when CI breaks, the nearest capable engineer fixes it in 15 minutes. Under the new model, that engineer is supposed to file a ticket with the platform team. If the platform team's on-call person is deep in a different task, the response time goes from 15 minutes to hours. You have replaced organic, fast, distributed response with a centralized bottleneck.

7. **Feature teams will resent the platform team within 3 months** (minor) [people-impact]: Feature teams lose capacity, then have to wait for the platform team to prioritize their infrastructure requests. The platform team, staffed by their former teammates, will be perceived as having escaped the pressure of product delivery deadlines. "Must be nice to work on whatever you want while we are down an engineer and behind on the roadmap." This resentment is predictable and corrosive.

---

### Round 3: Optimizer Defends

1. **Concede (simultaneous capacity hit)**: This is valid. Pulling all 4 simultaneously is higher risk than necessary. I modify the proposal: **stage the transition** — pull 2 engineers in the first wave, then 2 more after 4-6 weeks once the first pair has established working patterns and the feature teams have adjusted. This halves the initial blast radius.

2. **Partial concede (losing infrastructure heroes)**: The concern is real but cuts both ways. These engineers are currently spending significant time as informal infrastructure support *on top of their feature work*. They are already not fully available for feature delivery. Formalizing their infrastructure role actually makes the capacity math more honest. Mitigation: each departing engineer spends their first 2 weeks documenting the top 10 infrastructure runbooks for their former team, creating self-serve guides for the most common issues.

3. **Counter (voluntary selection)**: At a 20-person engineering org, people know each other well enough that this can be handled through honest conversation, not corporate voluntelling. The platform team should be positioned as a career opportunity (infrastructure engineering is a valued specialization, not a demotion). If someone genuinely does not want to move, respect that — the platform team needs motivated people, not conscripts. In practice, in a 20-person org, there are usually 3-6 engineers who would prefer infrastructure work.

4. **Concede (no backfill)**: Fair point. I add to the proposal: **authorize backfill hiring for the 2 hardest-hit feature teams**, to begin immediately. This means the steady-state cost is not zero — it is 2 new hires — but it is still significantly less than 4 new platform hires and the feature teams recover capacity within a hiring cycle.

5. **Partial concede (team too small)**: 4 is tight, but it is a starting point, not the end state. The team should ruthlessly prioritize — they do not need to own all 3 domains equally in month 1. Start with CI (the highest pain point), establish patterns, then expand scope. If the team proves its value (which it will, given the current pain), headcount expansion is an easy sell. Mitigation: first month is pure triage and audit, not boiling the ocean.

6. **Partial concede (centralized bottleneck)**: Valid failure mode if implemented poorly. Mitigation: the platform team does not replace all distributed response. Feature team engineers can still fix urgent CI breaks — the platform team owns the *systemic* fixes (why does CI break so often?), not every individual incident. Clear SLA: platform team responds to P1 infrastructure issues within 30 minutes; P2 within 4 hours. Feature teams retain ability and permission to apply hotfixes.

7. **Counter (resentment)**: Resentment is a management problem, not a structural problem. It happens with any specialization (security teams, SRE teams, QA teams all face this). The antidote is transparency: the platform team's backlog and progress are visible to all, they attend feature team standups, and their success metrics are tied to feature team productivity. If the platform team is clearly making everyone else's life better, resentment fades. If they are not, that is a signal to change course.

---

### Round 4: Frontline Operator Stress-Tests

1. **Staged rollout still hits 2 teams hard, and you just added backfill hiring that takes 4-6 months** (significant): You conceded that 2 teams need backfill, but hiring takes 4-6 months. So for the first wave, 2 feature teams lose an engineer for 4-6 months with no replacement. During that time, they are carrying roadmap commitments designed for 5 engineers with 4. "We will hire a backfill" is not the same as having one. Day-in-the-life: It is Week 6. Team Alpha shipped their infrastructure engineer to the platform team. The backfill job posting has 12 applicants, 3 worth interviewing, 0 offers extended yet. Team Alpha just got assigned a high-priority customer feature with a hard deadline. The 4 remaining engineers are already at capacity. What gives?

2. **The runbook documentation mitigation is a fantasy** (significant): You proposed that departing engineers spend 2 weeks writing runbooks. In practice, infrastructure knowledge is deeply contextual — "when the build fails with error X, check if someone merged to the shared config repo because 8 months ago we added a dependency that..." This kind of knowledge does not transfer through documentation. It transfers through months of pairing. After the 2 weeks of documentation, the feature team will hit an issue not covered by the runbooks within the first week, and the person who knew the answer is now on a different team with different priorities.

3. **The "feature teams can still fix urgent issues" escape valve undermines the entire model** (significant): You said feature teams retain the ability to hotfix infrastructure. But the whole premise of the platform team is that no one owns infrastructure. If feature team engineers are still expected to jump on CI breaks, you have not actually solved the ownership problem — you have just added a new team while keeping the old expectation. The feature team engineer now has to make a judgment call every time: "Is this a P1 I should fix, or should I file a ticket?" That ambiguity is worse than the current state, where at least everyone knows they are all responsible.

4. **Your timeline assumes the platform team is productive immediately** (minor): You have 2 engineers forming a new team, defining a charter, auditing infrastructure, and shipping improvements — all within the first month. But forming a new team has overhead: aligning on working agreements, setting up their own processes, negotiating scope with stakeholders. In practice, a new 2-person team spends the first 3-4 weeks just figuring out how to work together and what to work on. Real output starts month 2 at the earliest.

---

### Round 5: Optimizer Final Stand

1. **Staged rollout + backfill timing**: I concede the gap is real. Modified proposal: **begin backfill hiring on day 1, before the platform team even forms**. Open the requisitions now. If we start hiring immediately, we can have candidates in pipeline by the time the first 2 engineers move. Additionally, during the gap, the 2 affected feature teams should have their sprint commitments explicitly reduced by 20% — this is not optional capacity planning, it is a hard adjustment communicated to product leadership upfront. The fallback: if no backfill is hired within 90 days, we pause the second wave and reassess. The platform team runs at 2 until capacity is restored.

2. **Runbook limitations**: Fair. Runbooks are a floor, not a ceiling. Modified mitigation: the 2 platform engineers remain available for **30 minutes per day** to their former feature teams for the first 6 weeks — a structured "office hours" model rather than a clean break. This is a real cost to the platform team's productivity, but it is more realistic than pretending documentation solves tribal knowledge transfer. After 6 weeks, the office hours taper to weekly.

3. **Ownership ambiguity**: This is the strongest challenge. I modify the model: **clear ownership boundary based on time horizon, not severity**. Feature team engineers own immediate incident response (get the build green again). Platform team owns root-cause fixes (make sure this class of failure does not recur). This is the standard SRE model — "you break it, you stabilize it; we make sure it does not break that way again." No judgment calls about P1 vs. P2 in the moment. You always stabilize first, then file a ticket for the systemic fix.

4. **New team ramp-up**: Concede. Adjusted timeline: productive output begins Week 6, not Week 3. First 4-5 weeks are audit, charter, process setup, and quick wins (fixing the most obvious, low-effort infrastructure pain). Major infrastructure projects begin Month 2.

**Proposal modifications from original**:
- Staged rollout (2 then 2) instead of all 4 simultaneous
- Backfill hiring begins immediately for the 2 affected feature teams
- Sprint commitments reduced 20% for affected teams during gap
- Office hours model (30 min/day for 6 weeks) for knowledge transfer
- Clear incident response vs. root-cause ownership boundary
- Adjusted timeline: meaningful output begins Week 6, not Week 3
- If backfill not hired within 90 days, second wave pauses

---

### Round 6: COO Decides

The Optimizer made the right core diagnosis: the "everyone owns infrastructure, no one owns infrastructure" model is actively degrading engineering output across all 4 teams, and the cost of inaction compounds monthly. The Frontline Operator correctly identified that the original proposal — pull 4 engineers simultaneously with no backfill — would have created an immediate velocity crisis that could have undermined the entire platform team initiative before it proved its value.

The modified proposal after 2 rounds of challenge is substantially better than the original: staged rollout, immediate backfill hiring, explicit capacity reduction for affected teams, structured knowledge transfer, and clear ownership boundaries. However, I am not confident enough in the assumptions to approve the full 4-person internal reallocation upfront.

My recommendation is **pilot-first**: start with 2 engineers, run for 90 days, and use real data to decide the expansion path. This is not indecision — it is operational prudence. The biggest remaining risk is that 2 engineers is too small to demonstrate the platform team's value within 90 days, creating a self-fulfilling prophecy of failure. To mitigate this, the pilot must have ruthlessly scoped goals (CI pipeline reliability and one other high-impact domain, not all three) and executive air cover (the pilot is not expected to solve everything, it is expected to prove the model).

The external-hire-only path remains available as the expansion mechanism after the pilot. The 90-day pilot gives us time to build a hiring pipeline so that if the decision is to hire externally, we are not starting from zero.

### Debate Metrics

| Metric | Value |
|--------|-------|
| challengesRaised | 7 |
| stressTestsRaised | 4 |
| challengesSurvived | 2 |
| challengesConceded | 3 |
| mitigationsHeld | 3 |
| mitigationsBroken | 2 |
| proposalModified | yes |
| confidenceScore | 7 |
