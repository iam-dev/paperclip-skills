# Marketing Decision Brief: Should We Launch a Free Tier to Drive PLG Growth?

**Date**: 2026-03-29
**From**: CMO
**Recommendation**: pilot-first
**Confidence**: 7/10
**Budget request**: $85K over 90 days (pilot phase), up from $0 incremental today; full rollout would require ~$240K/year in additional infrastructure, support, and marketing spend

---

## CEO Summary

We should test a limited free tier, not launch one broadly. At $60K MRR with 15% MoM growth and 5K paying customers, our current trajectory is strong -- a poorly executed free tier risks diluting brand value and overwhelming support capacity without converting enough free users to justify the cost. However, ignoring the competitive threat is also a risk: our competitor's free launch will shift buyer expectations in our category. The recommendation is a 90-day gated pilot -- a free tier offered to a controlled audience segment with strict conversion gates -- so we can measure real conversion economics before committing. You need to approve $85K in pilot spend and accept the risk that we publicly acknowledge a free option exists, which cannot be easily walked back.

---

## Recommendation Details

**Recommendation**: pilot-first

**Rationale**: The Growth Strategist made a compelling case that the competitive window is real and that PLG is the dominant acquisition motion in our category. However, the Brand Guardian exposed critical risks around support cost modeling, brand perception among our 5K paying customers, and the assumption that free-to-paid conversion rates from industry benchmarks apply to our product. The decisive challenge was that our current 15% MoM growth is already strong -- a free tier launch is a response to competitor noise, not a response to a growth ceiling. A pilot lets us validate economics without betting the trajectory we already have.

**Strategy modifications**: The original proposal called for a full public launch of a free tier with a $200K marketing push. After debate, this was narrowed to a gated pilot targeting a single audience segment (individual practitioners, not teams) with a 90-day evaluation window before any decision to scale.

**Action items**:
1. Product team -- Define free tier feature scope with hard usage caps (max 1 user, limited to core workflow only, no integrations) -- by 2026-04-12
2. Marketing team -- Design pilot landing page and acquisition funnel targeting individual practitioners via organic search and one paid channel -- by 2026-04-19
3. Engineering team -- Implement usage-gating infrastructure and free-to-paid upgrade prompts -- by 2026-04-26
4. Growth team -- Launch pilot to controlled audience (target: 500 free signups in first 30 days) -- by 2026-05-03
5. CMO -- Present pilot results and conversion data to CEO with go/no-go recommendation -- by 2026-07-05

**Conditions / Gates**:
- Pilot proceeds to full launch ONLY if: free-to-paid conversion rate exceeds 5% within 60 days of signup, AND support ticket volume per free user is below 0.5 tickets/month, AND no measurable churn increase among existing paying customers
- If conversion rate is 3-5%, revisit feature gating before scaling
- If conversion rate is below 3%, kill the free tier and redirect budget to paid acquisition

**Risks accepted**:
- Competitor continues to capture top-of-funnel mindshare during our 90-day pilot -- accepted because our current growth rate suggests we are not losing deals at the rate the competitor's PR implies, and a rushed launch carries more downside than a deliberate one
- Some existing customers may question why new users get the product free -- accepted because the pilot is gated to individuals (not teams) and feature-limited, which we can message clearly
- Pilot results may not be statistically significant at 500 users -- accepted because directional signal on conversion rate and support load is sufficient for a go/no-go decision

**Budget impact**:
- Original ask: $200K (full launch marketing + infrastructure)
- Revised ask: $85K (pilot infrastructure $35K, limited paid acquisition $30K, landing page + content $20K)
- Expected ROI: If pilot converts at 5%+, the full rollout projects to add 200-400 net new paying customers in 6 months ($20K-$40K incremental MRR), yielding 3-6x return on the full $240K annual investment

**Review date**: 2026-07-05 -- Evaluate pilot conversion rates, support costs per free user, impact on existing customer churn, and competitive landscape changes

---

## Full Debate Record

### Round 1: Growth Strategist Proposes

**Thesis**: Launch a feature-limited free tier to capture the top-of-funnel demand our competitor is now vacuuming up, converting free users into paying customers through product-led growth and establishing our product as the default starting point in the category.

**Strategy**:
Target individual practitioners and small teams who are currently evaluating our competitor's free offering. The free tier includes core workflow functionality for a single user with hard caps: no integrations, no team features, no API access, limited storage. The upgrade path is natural -- users hit the cap and convert when they need team collaboration or integrations.

Acquisition channels: (1) Organic search -- create comparison content ("Us vs Competitor Free Tier") targeting high-intent keywords, (2) Product Hunt and community launches to generate initial wave, (3) Targeted paid ads on Google and LinkedIn focused on practitioners in our ICP, (4) In-app viral loops -- free users can invite others, creating network effects.

Messaging: "Start free. Scale when you're ready." Position the free tier as the on-ramp, not the destination. Make it clear this is a taste of the full product, not a standalone offering.

**Rationale**:
1. **Competitive urgency**: Our competitor just launched free and is capturing massive signup volume. Every signup they get is a user who builds habits in their product, not ours. Switching costs compound monthly. Waiting 6 months means those users are locked in.
2. **PLG is the dominant motion in our category**: The top 5 companies in adjacent categories (Notion, Figma, Slack, Canva, Calendly) all built on free-to-paid conversion. The buyers in our market expect to try before they buy. Our $99/mo paywall is increasingly an outlier.
3. **Our unit economics support it**: At $99/mo ($1,188/year LTV assuming 12-month average retention), we can afford a free tier if conversion rates hit 4-6%. Industry benchmarks for B2B SaaS free-to-paid conversion range 2-8%, with product-led companies at the high end.
4. **Expand TAM**: Our current 5K customers represent only the segment willing to pay $99/mo sight unseen. There is a larger pool of users who would try the product but won't commit $99 without hands-on experience. A free tier unlocks this demand.
5. **Data flywheel**: Free users generate usage data that improves the product for everyone. More users = better analytics on feature usage, better onboarding optimization, and a larger base for testing.

**Timeline**:
- Phase 1 (Weeks 1-4): Define free tier scope, build gating infrastructure, create landing page and onboarding flow
- Phase 2 (Weeks 5-8): Soft launch -- organic channels, Product Hunt, community seeding. Target 1,000 free signups.
- Phase 3 (Weeks 9-16): Scale paid acquisition. Target 5,000 free signups. Optimize conversion funnel based on Phase 2 data.
- Phase 4 (Weeks 17-24): Evaluate. Target 10,000 free users, 400-600 paid conversions. Decision point on scaling further.

**Budget**: $200K total over 6 months
- Infrastructure and engineering: $60K (gating, onboarding, upgrade prompts, support tooling)
- Paid acquisition: $80K ($20K/mo in Phases 2-3, scaling based on CPA)
- Content and creative: $35K (comparison pages, launch content, email sequences)
- Support overhead: $25K (estimated incremental support for free users)
- Target CPA for free signup: $8-12; target CPA for paid conversion: $150-250 (assuming 5% free-to-paid)

**Success metrics**:
- Free signups: 10,000 in 6 months
- Free-to-paid conversion: 5% within 90 days of signup (500 new paying customers)
- Blended CAC including free users: under $250
- No increase in churn among existing paying customers (baseline: current churn rate)
- NPS among free users: 40+ (indicating product-market fit for the free tier)

---

### Round 2: Brand Guardian Challenges

1. **Brand dilution among enterprise prospects** (critical) [brand-risk]: Our $99/mo price point signals "professional-grade tool." Launching a free tier risks repositioning us as a freemium commodity in the minds of enterprise buyers evaluating us for team-wide deployment. When Evernote went freemium-first, enterprise adoption stalled because procurement teams questioned whether a "free tool" was enterprise-ready. Our 5K paying customers chose us partly because the price signals quality -- a free tier undermines that signal.

2. **Conversion rate assumptions are borrowed, not earned** (critical) [audience-assumption]: The 4-6% free-to-paid conversion target is based on industry benchmarks from companies like Slack, Notion, and Figma -- all of which have massive brand awareness, network effects, and multi-year investment in their free-to-paid funnels. We have 5K customers and no experience running a PLG motion. Assuming we will hit benchmark conversion rates in our first attempt is a dangerous foundation for a $200K bet.

3. **Support cost explosion** (significant) [budget-efficiency]: Free users generate disproportionate support volume. Atlassian's community data shows free-tier users submit 3-4x more support tickets per user than paid users because they lack the commitment to self-serve through documentation. The $25K support budget assumes 0.5 tickets/user/month -- if it's actually 1.5-2 tickets/user/month (which is common for new free users on complex products), support costs triple and the unit economics collapse.

4. **Existing customer backlash** (significant) [brand-risk]: Our 5K paying customers have been paying $99/mo. Some have been with us for years. Announcing a free tier without careful messaging risks a wave of "why am I paying when others get it free?" complaints. Even if the free tier is feature-limited, the optics matter. This is particularly acute if any paying customer discovers the free tier covers their use case.

5. **Reactive strategy, not proactive** (significant) [competitive-response]: This proposal is a direct reaction to a competitor's move. Reactive strategies typically underperform because they fight on the competitor's terms. The competitor chose free because their product is less differentiated and they need volume. We have 15% MoM growth and $60K MRR -- our current motion is working. The proposal assumes the competitor's strategy is the right one for our situation without establishing why.

6. **Free users crowd out paying customer priorities** (significant) [budget-efficiency]: Engineering and product time spent on free tier infrastructure, gating, onboarding optimization, and conversion funnels is time not spent improving the product for paying customers. At 5K customers and 15% MoM growth, the highest-ROI investment is likely improving the product for paying users, not building infrastructure for free users who may never convert.

7. **Irreversibility** (significant) [timing]: Once a free tier is public, it cannot be removed without massive backlash. If the free tier fails to convert but accumulates 10,000 users, we are stuck supporting them indefinitely or facing a PR crisis by shutting it down. This is a one-way door -- the proposal should be evaluated with that irreversibility in mind.

---

### Round 3: Growth Strategist Defends

1. **Concede (brand dilution among enterprise)**: The risk is real. Enterprise buyers do price-anchor on free tiers. Mitigation: the free tier is explicitly positioned as "individual" -- no team features, no admin controls, no SSO, no SLA. The enterprise product remains $99/user/mo with the full feature set. We add an enterprise landing page that never mentions "free" and leads with security, compliance, and team features. This is how Figma and Notion handle it -- the free tier exists but enterprise buyers encounter a completely different positioning.

2. **Partially concede (conversion rate assumptions)**: Fair challenge on borrowing benchmarks. However, I'm not assuming 5% -- I'm using it as the success threshold. If we hit 3%, the economics still work at our price point ($99/mo). And we don't need to bet $200K to find out. Mitigation: we can run a smaller pilot -- 500-1,000 free users from a single channel -- and measure actual conversion before scaling spend. The benchmarks set the range; our data sets the decision.

3. **Partially concede (support costs)**: The 0.5 tickets/user/month estimate may be low for early free users. Mitigation: (a) gate the free tier behind product-qualified criteria -- users must complete onboarding before accessing support, (b) build self-serve support (docs, in-app tooltips, community forum) before launch, (c) set a hard support SLA for free users (community-only, no email/chat) to bound costs. If support costs per user exceed $3/month, we pause free acquisition and fix the self-serve experience.

4. **Counter (existing customer backlash)**: This is manageable with standard practices. The free tier is a single-user, feature-limited version. No paying customer's use case is covered by it -- the moment you need a second seat, integrations, or API access, you're on paid. We communicate proactively to existing customers: "We're making it easier for others to discover what you already know." Frame it as expanding the community, not devaluing the product. Slack, Zoom, and Dropbox all navigated this transition with minimal churn.

5. **Counter (reactive strategy)**: The strategy is reactive to a trigger, but the underlying thesis is proactive: PLG is the growth motion we should have been building toward anyway. Our 15% MoM growth is strong but it's primarily from paid acquisition and sales-assisted conversion. That motion has a ceiling -- paid CAC increases as we exhaust high-intent audiences. PLG gives us a compounding growth channel. The competitor's move accelerated our timeline, but it didn't create the opportunity.

6. **Partially concede (crowding out paying customer priorities)**: Valid concern. Mitigation: the pilot phase uses minimal engineering resources -- gating can be implemented with feature flags on existing infrastructure, and onboarding uses existing flows with minor modifications. We allocate a maximum of 20% of engineering time to free-tier work during the pilot. If the pilot succeeds, we staff a dedicated growth engineering team rather than pulling from core product.

7. **Concede (irreversibility)**: This is why a pilot matters. If we gate the free tier to a limited audience (e.g., only available through a specific landing page, not announced broadly), we can shut it down without the PR crisis of revoking a publicly launched free product. The pilot lets us validate before committing to the one-way door.

---

### Round 4: Brand Guardian Stress-Tests

1. **The "individual" positioning wall is porous** (critical): The mitigation for enterprise brand dilution relies on maintaining a clean separation between "free = individual" and "paid = team/enterprise." In practice, this wall breaks fast. Enterprise prospects Google your product and find the free tier. Their first experience is the free product, not your enterprise landing page. Procurement asks "why do we need to pay $99/user when the product is available for free?" Now your sales team is spending cycles justifying the paid tier instead of selling value. Figma pulled this off because they had years to build the separation and massive design community advocacy. We have 5K customers and no PLG infrastructure. Concrete scenario: three months post-launch, your enterprise AE loses a $50K deal because the prospect's team started on free, decided it was "good enough," and never engaged with the paid evaluation.

2. **The pilot-to-full-launch ratchet** (significant): The Growth Strategist conceded on irreversibility by proposing a gated pilot. But a "gated" pilot still creates free users who expect continued access. If the pilot shows 3% conversion (below the 5% target but above the kill threshold the Growth Strategist just proposed), what happens? You have 500 free users, ambiguous data, and pressure to "give it more time" or "expand the pilot." The pilot becomes a zombie -- not successful enough to scale, not failed enough to kill. Meanwhile, you've spent $85K and 90 days of team attention. What is the hard kill criteria, and who has the authority to pull the plug if the data is ambiguous?

3. **15% MoM growth is the buried lede** (significant): The Growth Strategist acknowledged that current growth is strong but argued PLG adds a "compounding channel." But 15% MoM at $60K MRR means you hit $200K MRR in 9 months on your current trajectory. That's extraordinary growth without any free tier. The real question the CEO should ask: what is the evidence that our current growth motion is hitting a ceiling? If it isn't, the free tier isn't an investment in growth -- it's a distraction from the growth we already have, motivated by competitor anxiety rather than data. Show me the leading indicators that paid acquisition CAC is rising or conversion rates are declining.

4. **Self-serve support as a mitigation is itself a project** (significant): The support cost mitigation requires building "docs, in-app tooltips, community forum" before launch. That's not a mitigation -- that's a prerequisite project that itself requires engineering and content investment not accounted for in the $85K pilot budget. If self-serve support isn't excellent at launch, free users hit paid support channels and the cost model breaks. This mitigation has a dependency that hasn't been scoped or budgeted.

---

### Round 5: Growth Strategist Final Stand

1. **The porous positioning wall**: This is the strongest surviving challenge. Fallback plan: if enterprise pipeline metrics decline by more than 10% in any month during the pilot, we immediately restrict the free tier to non-ICP domains (e.g., personal email only, no business domains that match our enterprise target accounts). This is aggressive but preserves the option. For the pilot specifically, we limit free tier availability to a single landing page not indexed by search engines (noindex, nofollow) and drive traffic only through targeted paid ads to individual practitioners. Enterprise prospects will not encounter it organically during the pilot window.

2. **The pilot zombie scenario**: Fair challenge. Here are the hard kill criteria: (a) If free-to-paid conversion is below 3% at day 60, we kill the pilot and migrate remaining free users to a 30-day trial. (b) If support costs exceed $3/user/month at day 45, we kill the pilot. (c) The CMO has sole authority to kill the pilot -- no committee, no "let's give it another month." (d) If the data is ambiguous at day 90 (conversion between 3-5%), we extend for 30 days with zero additional spend. If it's still ambiguous at day 120, we kill it. These criteria are written into the launch plan, not decided retroactively.

3. **The buried lede of 15% MoM growth**: I want to be honest here -- I cannot prove the current growth motion is hitting a ceiling today. The argument for the free tier is not "growth is slowing" but "we should diversify the growth engine before it slows." Paid acquisition CAC has increased 12% QoQ over the last two quarters. That's not a crisis, but it's a leading indicator. The pilot is a $85K insurance policy against the scenario where paid CAC continues rising and we need a PLG channel. If growth stays strong through the pilot, we have the luxury of evaluating free-tier data without urgency.

4. **Self-serve support scoping**: Concede. The support infrastructure needs to be scoped and budgeted separately. Revised approach: for the pilot, free users get community support only (existing forum) and a curated FAQ. No in-app tooltips, no new docs. If support volume exceeds the threshold, we pause signups and build the infrastructure before resuming. This keeps the pilot budget at $85K and avoids the hidden prerequisite.

**Proposal modifications**: The original proposal was a 6-month, $200K full launch targeting 10,000 free users. After two rounds of challenge, the proposal is now:
- A 90-day gated pilot targeting 500 free signups
- Budget reduced to $85K
- Free tier limited to individual practitioners, single user, no team features
- Not publicly announced or search-indexed during pilot
- Hard kill criteria at days 45, 60, and 90
- CMO has sole kill authority
- Community-only support for free users
- Enterprise pipeline monitored monthly as a safety metric
- Full launch decision deferred until pilot data is in hand

---

### Round 6: CMO Decides

**Recommendation**: pilot-first

The debate produced a clear signal: the strategic case for a free tier is sound but the execution risk at our current scale is high. We are a $60K MRR company with 15% MoM growth -- we have momentum to protect. The Growth Strategist's original $200K launch was too aggressive given two critical uncertainties: (1) we have no data on our own free-to-paid conversion rates, and (2) the brand risk to enterprise prospects is real and unmitigated at full scale.

The Brand Guardian's most decisive challenges were the porous positioning wall (Challenge 1, Round 4) and the "buried lede" of strong existing growth (Challenge 3, Round 4). Both survived two rounds of debate. The Growth Strategist responded well by narrowing the proposal to a controlled pilot with hard kill criteria, which directly addresses the irreversibility concern that underpinned several challenges.

The pilot-first approach gives us real data on conversion economics, support costs, and brand impact at a fraction of the risk. If the pilot succeeds, we launch with confidence and evidence. If it fails, we've spent $85K to confirm that our current growth motion is the right one -- that's cheap market research.

The CEO should know: this is not a bet on freemium. This is a bet on learning whether freemium works for us, with clear exit ramps if it doesn't.

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
