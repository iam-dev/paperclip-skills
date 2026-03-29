# Operations Decision Brief: Outsource Tier-1 Support to BPO vs. Hire 3 Internal Agents

**Date**: 2026-03-29
**From**: COO
**Recommendation**: pilot-first
**Confidence**: 7/10
**Budget impact**: Pilot phase ~$38K/month (short-term increase), target steady-state $30-33K/month
**People impact**: No immediate headcount reduction; 5 existing agents shift toward tier-2/escalation; 1 internal hire (team lead) added during pilot

---

## CEO Summary

We should pilot a hybrid model: outsource 60% of tier-1 ticket volume to a BPO while hiring one internal team lead to manage the BPO relationship and quality, rather than committing fully to either path. The pure outsource option saves money on paper but carries serious quality and transition risk given that our current agents hold significant product knowledge that a BPO cannot absorb quickly. Hiring 3 more internal agents solves the immediate SLA problem but locks us into a $56K/month cost structure that scales linearly. The pilot lets us validate BPO quality on straightforward tickets over 90 days before making a full commitment. CEO approval needed for: BPO vendor selection budget ($2-3K for evaluation), one team lead hire (estimated $8-9K/month fully loaded), and a 90-day pilot contract with a BPO provider at approximately $12-15K/month for 1,200 tickets.

---

## Recommendation Details

**Recommendation**: pilot-first

**Rationale**: The Optimizer made a compelling case that outsourcing tier-1 frees existing agents for higher-value work and breaks the linear cost scaling, but the Frontline Operator exposed critical risks around knowledge transfer, quality degradation during transition, and attrition of experienced agents whose roles would change. A pilot scoped to the most routine, well-documented ticket categories (password resets, billing inquiries, standard how-to questions) tests the BPO model where it is most likely to succeed while protecting the customer experience on complex tickets.

**Operating model modifications**: The original proposal was full tier-1 outsource. After debate, this was modified to: (1) pilot scoped to ~60% of tier-1 volume (routine/documented categories only), (2) addition of a dedicated internal team lead role to manage BPO quality, (3) 90-day pilot with explicit quality gates before expansion, (4) existing agents retain ownership of complex tier-1 and all tier-2.

**Action items**:
1. Support Manager — Categorize all 2,000 monthly tickets by complexity tier and identify the subset suitable for BPO handling — by 2026-04-12
2. Support Manager — Evaluate 3 BPO vendors with support-specific experience; shortlist 2 for pilot proposals — by 2026-04-26
3. HR/Hiring Manager — Post and begin recruiting for BPO Relationship/Quality Lead (internal hire) — by 2026-04-12
4. Support Manager — Build tier-1 knowledge base and runbooks for BPO-eligible ticket categories — by 2026-05-10
5. COO — Negotiate 90-day pilot contract with selected BPO vendor, including SLA guarantees and exit clause — by 2026-05-17
6. COO — Launch pilot with BPO handling routine tier-1; begin weekly quality reviews — by 2026-06-01
7. COO — Pilot evaluation and go/no-go decision on expansion — by 2026-09-01

**Conditions / Gates**:
- BPO must demonstrate CSAT >= 85% on handled tickets during pilot (current baseline to be measured in April)
- BPO first-response time must meet 4-hour SLA on their ticket subset within 30 days of launch
- Internal agent attrition: if any of the 5 current agents resign during pilot citing role dissatisfaction, pause and reassess
- Escalation rate from BPO to internal team must be < 20% of BPO-handled tickets by month 2 of pilot

**Risks accepted**:
- Short-term cost increase during pilot (~$3-5K/month above current) — accepted because validating the model before full commitment avoids a much larger potential loss from a failed full rollout
- Customer experience variance during BPO ramp-up on routine tickets — accepted because pilot scope is limited to lowest-complexity tickets and internal team handles all escalations
- Possible BPO vendor lock-in if pilot succeeds and we scale — accepted because exit clause in pilot contract and maintained internal capability provide leverage

**People impact summary**:
- Headcount: +1 (BPO Relationship/Quality Lead). No reductions. If pilot succeeds and scales, future state is 5 internal agents (focused on tier-2/complex) + 1 team lead + BPO contract.
- Roles affected: 5 existing support agents will see ~60% of routine volume shift to BPO during pilot. Their role shifts toward complex tickets, escalation handling, QA review of BPO work, and knowledge base maintenance. This is a skill upgrade, not a downgrade, but must be communicated carefully.
- Transition support: All 5 agents briefed on pilot plan before launch. Clear communication that this is not a precursor to layoffs — it is a capacity play. Agents involved in BPO quality scoring to maintain ownership.
- Attrition risk: Moderate. Senior agents may perceive BPO introduction as a signal their roles are being commoditized. Mitigation: involve agents in BPO vendor selection, position their role shift as career growth toward tier-2/specialist, and consider retention bonuses for the pilot period if budget allows.

**Budget impact**:
- Current cost: $35,000/month (5 agents, fully loaded)
- Proposed cost (pilot phase): ~$38,000-$40,000/month ($35K existing team + $12-15K BPO pilot contract + $8-9K new team lead hire, offset partially by overtime/contractor savings if any)
- Note: Pilot phase is intentionally higher because we are running parallel — maintaining full internal team while testing BPO.
- Proposed cost (steady-state, if pilot succeeds): ~$30,000-$33,000/month. Internal team may reduce to 4 agents via natural attrition (not layoffs) + team lead ($8-9K) + BPO contract ($12-15K for 1,200 tickets/month). Net saving of $2-5K/month vs. current, with capacity to handle up to 3,000 tickets/month.
- Transition cost (one-time): ~$8,000-$12,000 (knowledge base build-out, BPO onboarding, vendor evaluation, internal training)
- Comparison — hire 3 agents alternative: $56K/month ongoing (8 agents fully loaded at ~$7K each). Solves SLA immediately but cost scales linearly with volume.
- Expected savings/ROI: Break-even vs. current cost by month 5-6 post-pilot. Significant savings vs. the hire-3-agents path ($23-26K/month lower).

**Review date**: 2026-09-01 — Evaluate pilot metrics (CSAT, SLA compliance, escalation rate, agent satisfaction, cost per ticket). Go/no-go on BPO expansion or pivot to internal hiring.

---

## Full Debate Record

### Round 1: Optimizer Proposes

**Thesis**: Outsource tier-1 support to a BPO to break the linear headcount-to-volume cost curve, freeing internal agents to specialize in complex/high-value support and reducing cost-per-ticket by 35-40%.

**Operating model**:
Tier-1 tickets (password resets, billing questions, standard how-to, feature availability inquiries — estimated 70% of volume, ~1,400 tickets/month) route to BPO agents via our existing ticketing system. BPO operates on defined runbooks with scripted responses and clear escalation criteria. Tickets that require product-specific judgment, account-level decisions, or multi-step troubleshooting escalate to the internal team as tier-2. Internal agents shift from general support to escalation handling, QA oversight of BPO output, knowledge base maintenance, and complex case resolution. A shared Slack channel and weekly calibration calls maintain alignment between BPO and internal team.

**Rationale**:
1. **Cost math favors outsourcing at this volume.** Current cost is $7K/agent/month fully loaded. A quality BPO handles tier-1 tickets at $8-12 per ticket. At 1,400 tier-1 tickets/month, BPO cost is $11,200-$16,800/month vs. the equivalent internal capacity of ~3.5 agents ($24,500/month). Net saving: $8-13K/month.
2. **Hiring 3 agents solves today's problem but not tomorrow's.** If ticket volume grows 20% YoY (typical for scaling companies), 8 agents hit the same SLA wall by Q1 2027. BPO scales elastically — we buy tickets, not headcount.
3. **Internal agents are overqualified for tier-1.** Agents handling password resets and "how do I export a CSV" tickets are not using their product knowledge. Shifting them to complex cases improves job satisfaction and retention for your best people.
4. **Response time math.** 2,000 tickets / 5 agents = 400 tickets/agent/month = ~20/day. At 15-20 min per tier-1 ticket, each agent spends 5-6 hours/day on routine work, leaving minimal capacity for complex cases. Outsourcing tier-1 drops internal load to ~600 complex tickets across 5 agents = 120/agent/month = ~6/day, well within SLA capacity.
5. **Industry benchmark.** BPO tier-1 support is a mature, well-understood operational model. Companies at our scale (Intercom, Zendesk customers, mid-market SaaS) routinely outsource tier-1 with CSAT maintenance when runbooks are solid.

**Timeline**:
- Phase 1 (Weeks 1-4): Vendor evaluation, runbook documentation, ticket categorization
- Phase 2 (Weeks 5-8): BPO onboarding, parallel running (BPO shadows internal team)
- Phase 3 (Weeks 9-12): BPO handles tier-1 live with internal QA oversight
- Phase 4 (Week 13+): Steady-state, reduce internal oversight cadence

**Resource cost**: BPO contract ~$12-16K/month. Internal effort: ~80 hours to build runbooks and onboard BPO (2 agent-weeks). Possible need for 1 QA/team-lead hire to manage BPO relationship ($8-9K/month). Total steady-state: $20-25K/month vs. current $35K, or vs. $56K with 3 new hires.

**Success metrics**:
- First-response time < 4 hours (from current 24 hours)
- CSAT on tier-1 tickets >= 85% (baseline to be measured)
- Escalation rate < 15% of tier-1 volume
- Cost per ticket: target $10 (from current ~$17.50)
- Internal agent retention: 0 attrition in first 6 months
- Complex ticket resolution time improvement: 20% faster (agents freed from tier-1 load)

---

### Round 2: Frontline Operator Challenges

1. **Knowledge transfer underestimated** (critical) [execution-risk]: Our tier-1 tickets are not as "routine" as the categorization suggests. Even a password reset often involves verifying account status, checking subscription tier, and navigating our custom auth system. The runbook for a "simple" password reset is actually 8 steps with 3 branch points. Multiply that across 40+ ticket categories and you need 3-6 months of runbook development, not 4 weeks. The agents who know these flows are the same agents who are currently drowning in volume — when do they build the runbooks?

2. **Senior agent attrition risk from role change** (critical) [people-impact]: The 2-3 most experienced agents did not sign up to be "BPO quality reviewers." They are support professionals who take pride in direct customer relationships. Redefining their role as oversight/QA without their input risks losing the very people whose knowledge makes the outsourcing viable. Industry data shows 30-40% attrition in internal support teams within 12 months of outsourcing tier-1.

3. **BPO ramp-up valley of death** (significant) [transition-cost]: During weeks 5-12, you are running both the BPO (ramping, making mistakes, escalating heavily) AND the internal team (now also training the BPO, doing QA, and handling their regular load). Net capacity during this period actually decreases. The SLA problem gets worse before it gets better — and it is already at 2x the target.

4. **Escalation rate assumption is fantasy** (significant) [measurement]: The 15% escalation target assumes clean ticket categorization at intake. In practice, tickets arrive ambiguous. "I can't log in" might be a password reset or a permissions bug or an account suspension. BPO agents without product context will over-escalate (30-40% is typical in month 1-3), flooding the internal team with tickets that are actually tier-1 but got mis-routed.

5. **Quality degradation on "borderline" tickets** (significant) [quality-risk]: There is a large gray zone between clear tier-1 and clear tier-2. Tickets like "the export is missing data" could be user error (tier-1) or a bug (tier-2). BPO agents will either escalate everything in this zone (capacity problem) or attempt resolution and get it wrong (customer experience problem). This gray zone is typically 20-30% of total volume.

6. **Vendor dependency and switching costs** (minor) [dependency]: Once the BPO has our runbooks, handles our customers, and our internal team has been restructured around oversight, switching vendors or bringing it back in-house becomes expensive ($30-50K in transition costs and 2-3 months of disruption).

7. **Existing team morale during evaluation** (significant) [people-impact]: The moment agents hear "we are evaluating outsourcing tier-1," the narrative becomes "they are replacing us." Even if that is not the intent, the most marketable agents start interviewing. You could lose 1-2 agents before the BPO is even onboarded, making the current SLA crisis worse.

---

### Round 3: Optimizer Defends

1. **Knowledge transfer underestimated — Partial concede.** Fair point on timeline. Revising: Phase 1 extends to 6 weeks, with 2 agents allocated 50% time to runbook development. However, this does not require documenting every edge case upfront. BPO onboarding follows a "start narrow, expand" model — begin with the 10 most common, most scripted ticket types (est. 40% of tier-1 volume), then expand categories monthly. This reduces the upfront documentation burden from 40+ categories to 10.

2. **Senior agent attrition risk — Concede.** This is the biggest risk. Mitigation: involve the 2-3 senior agents in the design from day one. Position it as "you are being promoted to tier-2 specialists and BPO quality leads, not demoted to reviewers." Offer a title change and, if budget allows, a modest raise ($500-1K/month) reflecting the expanded scope. Give them veto power over BPO quality — if they say the BPO is not ready to handle a category, that category stays internal.

3. **BPO ramp-up valley of death — Concede.** The parallel running period will be painful. Mitigation: during weeks 5-12, temporarily reduce internal SLA targets for complex tickets (communicate to customers: "we are improving our support infrastructure"). Alternatively, hire 1 temporary contractor to absorb overflow during the transition. Cost: ~$5-7K for 2 months. This is a transition investment, not ongoing cost.

4. **Escalation rate assumption — Partial concede.** 15% is the steady-state target, not the ramp target. Revising: expect 35-40% escalation in month 1, declining to 20% by month 3, targeting 15% by month 6. The declining curve depends on feedback loops: every escalated ticket becomes a runbook update. Budget for higher internal load in months 1-3.

5. **Quality degradation on borderline tickets — Partial concede.** The gray zone is real. Counter: this is exactly why we start narrow. The initial BPO scope excludes borderline categories entirely. "I can't log in" goes to BPO only after we build a decision tree that routes ambiguous cases to internal. Over time, the gray zone shrinks as runbooks improve and BPO agents gain product familiarity. It never goes to zero, and that is fine — that is what the internal team is for.

6. **Vendor dependency — Counter.** Switching costs are real but manageable with proper contract structure: 90-day exit clause, IP ownership of all runbooks stays with us, and we maintain internal capability on all ticket types (agents stay cross-trained). The dependency risk is lower than the alternative risk of an $56K/month linear cost structure.

7. **Existing team morale during evaluation — Concede.** This requires careful change management. Mitigation: before any vendor conversations, brief the full team on the plan, the rationale (freeing them from routine work, not replacing them), and the guarantee that no current headcount is being cut. Involve agents in vendor selection. Transparency is the only antidote to rumor.

---

### Round 4: Frontline Operator Stress-Tests

1. **Runbook "start narrow" still breaks at the seams** (significant): You say start with the 10 most scripted categories. But here is what happens on a Tuesday at 2 PM: a ticket comes in tagged "password reset" by the customer but it is actually an SSO configuration issue that requires admin console access. The BPO agent follows the password reset runbook, sends a generic response, the customer replies frustrated, the ticket bounces back to internal with a now-angry customer and a 2-hour delay baked in. Multiply this by 15-20 tickets/day of miscategorized volume. The internal team is now handling their own complex tickets PLUS cleaning up BPO misfires, and the customer got a worse experience than if an internal agent had handled it from the start. How does the model handle systematic miscategorization during the first 90 days?

2. **The "involve senior agents in design" mitigation requires time they don't have** (critical): You want the 2-3 senior agents to: (a) build runbooks at 50% time, (b) participate in BPO vendor selection, (c) design the escalation criteria, (d) train BPO agents during shadow period, AND (e) continue handling their share of the 2,000 monthly tickets that are already blowing SLAs. That is not 50% allocation — that is 150% allocation. Something breaks. Either the runbooks are rushed and low-quality (causing BPO failures), or the current SLA gets even worse during the 6-week build phase, or the senior agents burn out and leave — which is the exact attrition risk you conceded. What gives?

3. **Temporary contractor during valley of death is its own problem** (significant): You proposed a contractor to absorb overflow during transition. But a contractor needs onboarding too — they need to learn the product, the ticketing system, the tone of voice. A contractor who starts in week 5 is not productive until week 7-8, which is exactly when the BPO is also ramping. You have now added a third group (contractor) learning the system simultaneously with the BPO, while the internal team is stretched across training, QA, and their own tickets. This is three learning curves competing for the same senior-agent attention.

4. **The cost comparison ignores the hidden costs of the hybrid model** (significant): The Optimizer's cost math compares BPO ($20-25K) vs. internal ($56K with 3 hires). But the hybrid model has hidden ongoing costs: team lead hire ($8-9K/month), QA time from internal agents (est. 20% of their time = effectively losing 1 agent to oversight), calibration meetings, runbook maintenance, escalation handling overhead. Real steady-state cost is closer to $30-33K/month, not $20-25K. The savings over "hire 3 agents" shrink from $30K/month to $23-26K/month. Still significant, but the ROI timeline extends and the operational complexity is higher.

---

### Round 5: Optimizer Final Stand

1. **Systematic miscategorization — addressed with routing layer.** Install a triage layer (can be rule-based in the ticketing system or a lightweight AI classifier) that routes based on ticket content, not customer-selected category. Tickets with keywords like "SSO," "admin," "configuration" bypass BPO entirely regardless of what the customer labeled them. This is a one-time setup (~20 hours of engineering time) that dramatically reduces miscategorization. For tickets that slip through: BPO agents are trained with a "when in doubt, escalate" rule for the first 60 days. Yes, this means higher escalation rates early, but it prevents the "wrong answer to angry customer" scenario. Fallback: if miscategorization rates exceed 10% of BPO-handled tickets after 60 days, we pause BPO expansion and invest in better routing before adding categories.

2. **Senior agent overload — this is the proposal modification.** I concede the 50% allocation is unrealistic given current load. Modified proposal: hire the team lead FIRST (before BPO engagement). The team lead spends their first 6 weeks building runbooks and designing escalation criteria, taking this burden off senior agents entirely. Senior agents contribute 2 hours/week of review and feedback, not 50% of their time. This delays the BPO launch by 6 weeks (team lead hire + their ramp) but protects the current team. The BPO vendor selection runs in parallel with team lead onboarding. New timeline: team lead starts week 1, runbook build weeks 1-6, BPO onboarding weeks 7-10, BPO live week 11+.

3. **Drop the temporary contractor.** The Frontline Operator is right — a contractor adds complexity without enough value during the transition. Instead, accept that weeks 7-12 (BPO shadow + early live) will have degraded SLAs on tier-2 while internal agents support the BPO ramp. Communicate proactively to customers. This is a 6-week investment in a permanent fix vs. indefinite SLA violations under the status quo.

4. **Hidden costs acknowledged.** Revising steady-state cost to $30-33K/month, not $20-25K. The savings vs. hiring 3 agents are $23-26K/month, which is still $276-312K/year. The savings vs. status quo are $2-5K/month with dramatically better SLA performance and scalability. The real comparison is not just cost — it is cost + scalability. At 3,000 tickets/month (12-18 months out if growth continues), the BPO model costs ~$38-40K/month while the internal model costs $70K+ (needs 10 agents).

**Proposal modifications from original**:
- Timeline extended: +6 weeks for team lead hire before BPO engagement
- Scope narrowed: start with 60% of tier-1 (most routine), not 70%
- Dropped temporary contractor
- Added dedicated team lead hire as prerequisite (not optional)
- Revised cost from $20-25K to $30-33K/month steady-state
- Added triage/routing layer as prerequisite
- Added explicit quality gates before expanding BPO scope

---

### Round 6: COO Decides

The debate clarified that full outsource-or-hire is a false binary. The right answer is a phased hybrid: hire a team lead, pilot the BPO on the most routine tickets, and expand only when quality gates are met.

The Optimizer's core argument holds — at 2,000 tickets/month growing 20% YoY, linear headcount scaling is not sustainable. The cost difference between BPO-hybrid and full-internal is $23-26K/month, or over $300K/year. That is real money. But the Frontline Operator correctly identified that the transition is where this model lives or dies. The original proposal underestimated runbook effort, overloaded senior agents, and used optimistic escalation targets.

The modified proposal addresses these concerns: a dedicated team lead owns the BPO relationship and runbook development, the pilot scope is limited to truly routine tickets, and explicit quality gates prevent expansion before readiness. The accepted risk is a short-term cost increase during the pilot and a 6-week SLA degradation acceptance during BPO ramp.

The hire-3-agents path is not wrong — it is the lower-risk, higher-cost option. If the pilot fails, we still have that option. But we should test the scalable model first because the cost trajectory difference is too significant to ignore.

### Debate Metrics

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
