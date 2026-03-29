# Support Operations Decision: BPO Outsourcing vs. Internal Hiring

## Situation Summary

| Metric | Current | Target |
|---|---|---|
| Ticket volume | 2,000/month | -- |
| Headcount | 5 FT agents | -- |
| Tickets/agent/month | 400 | -- |
| Avg response time | 24 hours | 12 hours (SLA) |
| Monthly cost (fully loaded) | $35,000 | -- |
| Cost per agent | ~$7,000/month | -- |

The team is at roughly 2x the response-time SLA. Assuming a roughly linear relationship between capacity and response time, you need to approximately double throughput to halve response times back to the 12-hour target. That implies adding capacity equivalent to ~5 more agents, not 3. However, 3 additional agents (a 60% capacity increase) would likely bring response times to around 15 hours -- a significant improvement that gets close to SLA, especially if paired with process improvements.

---

## Option A: Hire 3 Internal Agents

### Cost Estimate
- 3 agents x $7,000/month fully loaded = **$21,000/month incremental**
- Total: **$56,000/month** for 8 agents
- One-time: recruiting costs (~$5K-10K), equipment, onboarding (4-6 weeks ramp)

### Pros
- Full control over quality, training, and culture
- Agents develop deep product knowledge over time
- Easier to handle escalations and edge cases
- Single management layer; no vendor coordination overhead
- Can flex agents across tiers as needed
- Better feedback loop to product/engineering teams

### Cons
- Higher per-agent cost
- Slower to ramp (recruiting + onboarding = 2-3 months before impact)
- 3 agents may not be enough to meet the 12-hour SLA -- math suggests you need closer to 5
- Fixed cost regardless of volume fluctuations
- Management burden increases (may need a team lead)

### Projected Impact
- Capacity: ~267 tickets/agent/month (8 agents, 2,000 tickets)
- Estimated response time: ~15 hours (still above 12-hour SLA)
- To reliably hit 12 hours, plan for 4-5 hires, bringing cost to $63K-70K/month

---

## Option B: Outsource Tier-1 to a BPO

### Cost Estimate
- BPO tier-1 agents typically cost $1,500-3,000/month per agent (varies by region: Philippines/India on the lower end, nearshore LATAM in the middle, domestic on the higher end)
- To cover ~1,200 tier-1 tickets (assuming 60% of volume is tier-1): 4-5 BPO agents at ~$2,500/month = **$10,000-12,500/month incremental**
- Total: **$45,000-47,500/month** (5 internal agents handling tier-2/3 + BPO for tier-1)
- One-time: vendor selection, knowledge base documentation, integration setup (6-10 weeks)

### Pros
- Significantly lower cost per agent (50-65% savings)
- Faster to scale up or down with volume changes
- Frees internal agents to focus on complex/high-value tickets
- BPOs often provide coverage across shifts (potential for 24/7)
- Can trial with a small batch before committing fully

### Cons
- Quality risk: BPO agents lack product depth and institutional context
- Ramp time is real despite the "plug and play" perception (4-8 weeks for reasonable quality)
- Requires investment in documentation, playbooks, and QA processes
- Vendor management overhead (weekly reviews, escalation paths, SLA tracking)
- Customer experience may suffer if handoffs between tiers are clumsy
- Data security and compliance review needed (especially if handling PII)
- Contractual lock-in or minimum commitments with some BPOs

### Projected Impact
- Internal agents handle ~800 tier-2/3 tickets (160/agent) -- much more manageable
- BPO handles ~1,200 tier-1 tickets with scripted responses
- Estimated response time: 8-12 hours for tier-1 (BPO), 12-16 hours for tier-2/3
- Blended average likely around 10-13 hours -- close to or at SLA

---

## Recommendation

**Go with a phased hybrid approach, leading with BPO for tier-1.**

Here is the reasoning:

### Phase 1 (Months 1-3): Outsource Tier-1
1. Select a BPO partner and outsource the bottom 50-60% of ticket volume (password resets, status checks, how-to questions, standard troubleshooting).
2. Invest 2-3 weeks upfront building a solid knowledge base and response playbooks -- this is non-negotiable and the single biggest determinant of BPO success.
3. Keep all 5 internal agents, shift them toward tier-2/3 and QA oversight of BPO output.
4. Target: reduce average response time to 12-14 hours within 60 days.

### Phase 2 (Months 3-6): Evaluate and Adjust
1. If BPO quality holds and volume keeps growing, add 1-2 internal agents focused on tier-2/3 and escalation management.
2. If BPO quality is poor or customer satisfaction drops, pivot to internal hiring with the playbooks you built (which now make onboarding faster).

### Why Not Pure Internal Hiring?
- The math does not work cleanly. Three hires at $21K/month still leaves you above SLA. Five hires at $35K/month doubles your cost. The BPO path gets you to SLA compliance at roughly $10-12K incremental spend.
- Speed matters. You are breaching SLA now. A BPO can start delivering in 4-6 weeks; internal hires take 2-3 months to recruit and onboard.

### Why Not Pure BPO?
- You need internal expertise for complex tickets, product feedback loops, and quality control. A fully outsourced model at your scale creates fragility and knowledge loss.

---

## Financial Summary

| Scenario | Monthly Cost | Delta vs. Today | Est. Response Time |
|---|---|---|---|
| Status quo | $35,000 | -- | 24 hours |
| +3 internal agents | $56,000 | +$21,000 | ~15 hours |
| +5 internal agents | $70,000 | +$35,000 | ~12 hours |
| BPO tier-1 (recommended) | $45,000-47,500 | +$10,000-12,500 | ~10-13 hours |
| BPO tier-1 + 1 internal hire | $52,000-54,500 | +$17,000-19,500 | ~10-12 hours |

---

## Key Risks to Monitor

1. **BPO quality degradation** -- Mitigate with weekly QA reviews, CSAT tracking per agent, and a 90-day performance clause in the contract.
2. **Tier classification accuracy** -- If too many tickets get misrouted to BPO that should be tier-2, customer experience suffers. Invest in clear routing rules.
3. **Volume growth** -- If tickets are growing month-over-month, the capacity gap will widen. Revisit headcount quarterly.
4. **Internal team morale** -- Outsourcing can create anxiety. Frame it as freeing the team for more interesting work, not replacing them.

---

## Decision Criteria Checklist

- [ ] Confirm tier-1 vs. tier-2/3 ticket split (assumed 60/40 -- validate with actual data)
- [ ] Assess data security requirements before sharing customer data with a BPO
- [ ] Get 2-3 BPO quotes with pilot terms (30-60 day trial, no long-term lock-in)
- [ ] Audit current knowledge base completeness -- if it is thin, budget 2-3 weeks to build it out before BPO launch
- [ ] Define escalation SLAs between BPO tier-1 and internal tier-2/3
