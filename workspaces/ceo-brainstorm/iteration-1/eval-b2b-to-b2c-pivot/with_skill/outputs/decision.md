# Strategic Decision: Should we pivot from B2B SaaS to a B2C model for our project management tool?

**Date**: 2026-03-29
**Verdict**: modify-and-proceed
**Confidence**: 5/10

---

## Round 1: Visionary Proposes

**Thesis**: We should launch a B2C product line as a parallel track alongside our B2B business, using the 10K waitlist as a beachhead to build a consumer-grade product that eventually becomes our primary growth engine.

**Rationale**:
1. **The waitlist is a demand signal we cannot ignore.** 10,000 organic signups from a single Product Hunt launch -- without paid acquisition -- indicates genuine consumer pull. Most B2B tools never see this kind of inbound interest. The CAC on these signups is effectively zero, and the intent is high because they came to us.
2. **B2C unlocks a fundamentally different growth ceiling.** Our B2B business serves 200 customers at $50K/yr average. That is a $10M ceiling if we 10x the customer base -- achievable but slow. B2C project management (think Notion, Todoist, Monday.com's consumer tier) addresses a market of tens of millions of users with viral, bottom-up adoption that can feed back into enterprise sales.
3. **The product-market timing is right.** The consumer productivity space is being reshaped by AI-native tools. Our existing product has the core engine; a consumer-grade UX layer on top would let us compete in this wave rather than watch it from the B2B sideline.
4. **Bottom-up adoption creates a B2B moat.** The most defensible enterprise sales motion today is PLG (product-led growth). If individuals adopt our consumer product at work, we get organic enterprise pipeline. Slack, Figma, and Notion all proved this path. We would be building a flywheel, not abandoning B2B.
5. **Our 18-month runway gives us room to experiment.** With $2M ARR and 18 months of runway, we can fund a focused B2C experiment for 6 months without jeopardizing the core business -- if we scope it correctly.

**Timeline**:
- Month 1-2 (April-May 2026) -- Assemble a dedicated 5-person B2C squad (PM, 2 engineers, 1 designer, 1 growth marketer) from the existing team. Ship a closed beta to 1,000 waitlist users.
- Month 3-4 (June-July 2026) -- Iterate on retention and activation metrics. Target 40% D7 retention and 20% weekly active usage.
- Month 5-6 (August-September 2026) -- Open public launch with freemium model. Target 50K free users and 2% conversion to a $10/mo plan ($10K MRR from B2C by end of Month 6).
- Month 9 (December 2026) -- Evaluate B2C unit economics. If LTV:CAC > 3:1 and net revenue retention > 100%, begin shifting company center of gravity toward B2C.
- Month 12 (March 2027) -- Decision point: full pivot, dual-track, or sunset B2C.

**Resources needed**:
- 5 people reallocated from the 30-person team (17% of headcount)
- $150K incremental spend on infrastructure, tooling, and growth experiments over 6 months
- Consumer-grade onboarding and self-serve billing infrastructure
- Analytics stack upgrade (Mixpanel/Amplitude tier for cohort analysis)
- Potential hire: 1 senior growth engineer (Month 3 if early signals are positive)

**Upside scenario**: By Month 12, the B2C product reaches 200K free users, 4K paying users at $10/mo ($480K ARR run rate from B2C alone), and generates 30 qualified enterprise leads per month through bottom-up adoption. Total company ARR reaches $3M+, growth rate accelerates from ~0% to 50%+ YoY, and we raise a Series A at a $30M+ valuation on the strength of the dual-motion story. The B2C channel becomes the primary enterprise pipeline source by Month 18.

---

## Round 2: Skeptic Challenges

1. **Revenue concentration risk** (critical): You are proposing to pull 17% of headcount off a business that generates 100% of revenue. Those 200 enterprise customers paying $50K/yr are not locked in forever. Enterprise churn in project management tools runs 10-15% annually. If we lose focus and churn ticks up from, say, 10% to 15%, that is $500K in lost ARR -- a quarter of total revenue. Who is servicing enterprise accounts while the best engineers are building a consumer MVP?

2. **Waitlist-to-retention gap** (critical): 10K waitlist signups from Product Hunt is a vanity metric. Product Hunt audiences are early-adopter enthusiasts who sign up for everything and retain on almost nothing. The base rate for Product Hunt waitlist-to-active-user conversion is typically 5-15%, and D30 retention for consumer productivity tools averages 8-12%. You could launch to 10K signups and end up with 200 active users in 60 days. That is not a business -- that is a distraction.

3. **Unit economics are unproven and likely unfavorable** (critical): You are comparing $50K/yr enterprise contracts with $120/yr consumer subscriptions. To replace one lost enterprise customer, you need 417 paying consumer users. At a 2% free-to-paid conversion rate, that requires 20,850 free users per lost enterprise customer. Your upside scenario projects 4K paying users after 12 months of effort. That does not come close to compensating for enterprise risk, and consumer CAC will not stay at zero once you exhaust the waitlist.

4. **Team dilution and morale** (significant): A 30-person team running two fundamentally different go-to-market motions is a recipe for organizational chaos. B2B and B2C product management tools have different UX expectations, different support models, different pricing psychology, and different infrastructure requirements (self-serve billing, abuse prevention, content moderation). You are not adding a feature -- you are starting a second company inside a 30-person startup that has not yet proven it can scale the first one.

5. **Competitive landscape mismatch** (significant): The consumer project management space is dominated by well-funded incumbents -- Notion ($10B valuation), Todoist (20M+ users), Asana, Monday.com. These companies have hundreds of engineers, massive brand awareness, and years of consumer UX refinement. Entering this market with a 5-person squad and a 6-month timeline is bringing a knife to a gunfight. Our B2B differentiation (enterprise features, integrations, compliance) is precisely what consumers do not want.

6. **Runway arithmetic does not support experimentation** (significant): 18 months of runway with $2M ARR and a 30-person team implies roughly $370K/mo burn rate. That is tight. The Visionary's plan adds $25K/mo in incremental costs and diverts 5 engineers whose opportunity cost is maintaining and growing the enterprise product. If the B2C experiment fails at Month 6 and enterprise growth has stalled due to neglect, you are at Month 6 with 12 months of runway, a damaged enterprise product, and nothing to show for B2C. That is a fundraising crisis, not a learning experience.

7. **Conflated signal: PLG is not B2C** (minor): The Visionary cites Slack, Figma, and Notion as precedents, but those companies did not pivot from B2B to B2C -- they built PLG (product-led growth) motions that were always designed to feed enterprise sales. What you actually need is a freemium tier or self-serve onboarding for your existing B2B product, not a separate consumer product. The strategic insight is correct; the proposed execution is wrong.

---

## Round 3: Visionary Defends

1. **Concede (Revenue concentration risk)**: This is valid. Pulling 5 people from a 30-person team while serving 200 enterprise accounts is a real risk. Mitigation: We designate the B2C squad explicitly and ring-fence the remaining 25 people for enterprise. We set a hard rule -- no B2C work leaks into the enterprise team's sprint. We also instrument enterprise health metrics (NPS, support ticket volume, feature delivery cadence) as a kill switch. If any enterprise health metric drops below threshold, we pause B2C and redirect resources. The enterprise business is the oxygen supply; we do not cut it.

2. **Concede (Waitlist-to-retention gap)**: The Skeptic is right that Product Hunt signups are not validated demand. 10K signups could easily yield 500 active users. Mitigation: We treat the waitlist as a hypothesis, not a business case. The closed beta in Month 1-2 is explicitly designed to test retention, not to scale. We set a hard go/no-go gate: if D7 retention among beta users is below 25% after 8 weeks, we kill B2C and redirect resources. We do not proceed to public launch without validated retention.

3. **Counter (Unit economics are unproven)**: The Skeptic is right on the direct revenue comparison, but is framing B2C as a revenue replacement when it is actually a growth channel. We are not trying to replace $50K enterprise contracts with $120 consumer subscriptions. The strategic bet is that consumer adoption feeds enterprise pipeline. If 5% of free consumer users bring the tool into their workplace and 2% of those convert to enterprise contracts, 200K free users generates 200 enterprise leads -- equaling our entire current customer base as pipeline. The consumer product is a distribution channel, not a revenue center in Year 1. That said, I concede we need to model this funnel rigorously before Month 3 go/no-go, not assume it.

4. **Concede (Team dilution and morale)**: Running two GTM motions in a 30-person company is genuinely hard. Mitigation: We do not run two motions in parallel indefinitely. The 6-month experiment has a clear kill criteria. The B2C squad operates as an autonomous unit with its own metrics, its own standups, and a dedicated PM. We communicate to the full team that this is a time-boxed experiment, not a strategic shift -- yet. If it works, we hire to support it rather than further cannibalizing the enterprise team.

5. **Counter (Competitive landscape mismatch)**: The incumbents are large but they are also slow. Notion is bloated and losing individual users to simpler tools. Todoist has not meaningfully innovated in 3 years. The AI-native wave is creating genuine whitespace -- no incumbent has shipped a truly AI-first project management experience for individuals. Our 5-person squad is not competing with Notion's entire product; we are targeting a specific wedge (AI-powered personal task management) where incumbents are weakest. We do not need to win the market -- we need 50K users to prove the channel works.

6. **Concede (Runway arithmetic)**: The Skeptic's math is uncomfortably accurate. At $370K/mo burn with 18 months of runway, we have approximately $6.7M total. Pulling 5 people and adding $150K costs over 6 months means roughly $250K total incremental investment. If the experiment fails and enterprise growth stalls, we are in trouble. Mitigation: We reduce the squad to 4 people (1 PM, 2 engineers, 1 designer -- no dedicated growth marketer until Month 3 validation). We cap incremental spend at $75K for the first 3 months. And we set the kill decision at Month 3, not Month 6 -- if retention and activation metrics are not trending toward targets by Month 3, we stop. This limits total downside exposure to approximately $125K and 3 months of partial team diversion.

7. **Concede (PLG is not B2C)**: The Skeptic makes a sharp distinction here. What we actually want may be a self-serve PLG tier of our existing B2B product, not a separate consumer product. Mitigation: We reframe the experiment. Instead of building a separate B2C product, we build a free individual tier of our existing product with simplified onboarding and a consumer-grade UX. This is cheaper to build (shared codebase), easier to convert to enterprise (same product, just upgrade), and directly tests the PLG hypothesis. The waitlist users get access to a free tier, not a different product.

---

## Round 4: Pragmatist Decides

**Verdict**: modify-and-proceed

**Rationale**: The Visionary identified a real strategic opportunity -- the 10K waitlist and the PLG channel thesis are worth testing. But the Skeptic exposed three critical flaws in the original proposal: the waitlist is unvalidated, the revenue math does not work as a direct B2C play, and a full B2C product is the wrong execution vehicle. The Visionary's own concessions in Round 3 effectively redesigned the proposal into something different and better: a time-boxed, resource-capped PLG experiment using a free tier of the existing product, with hard kill criteria at Month 3. That modified version is worth pursuing. The original proposal -- a full B2C pivot with a 5-person squad and 6-month timeline -- is rejected.

**Action items**:
1. VP Product -- Define the free individual tier: feature set, onboarding flow, and upgrade path to enterprise. Deliverable: PRD with scope and technical requirements -- by April 12, 2026.
2. CTO -- Assemble a 4-person PLG squad (1 PM, 2 engineers, 1 designer) and establish separation from enterprise team workflows. Confirm team composition -- by April 15, 2026.
3. VP Product -- Define go/no-go metrics for Month 3 gate: D7 retention target (minimum 25%), weekly active usage target (minimum 20%), and enterprise lead conversion signal. Document and share with leadership -- by April 12, 2026.
4. CFO/Finance Lead -- Model the cash impact: $75K cap on incremental spend for 3 months, opportunity cost of 4 reallocated people, and worst-case runway scenario if experiment fails and enterprise churn increases to 15%. Present analysis -- by April 19, 2026.
5. Head of Customer Success -- Establish enterprise health monitoring dashboard: NPS trend, support ticket volume, feature delivery cadence, churn signals. Set threshold alerts. Operational -- by April 22, 2026.
6. PLG Squad -- Ship closed beta to 1,000 waitlist users. Target: live product with analytics instrumentation -- by May 31, 2026.
7. CEO -- Month 3 kill/continue decision. Review retention, activation, and enterprise health metrics. Hard decision -- by July 15, 2026.

**Risks accepted**:
- Partial team diversion (4 of 30 people) may slow enterprise feature delivery -- accepted because the 3-month time box limits exposure, and enterprise health monitoring provides an early warning system.
- Waitlist may not convert to retained users -- accepted because the closed beta is designed to test this hypothesis cheaply before any public launch commitment.
- Consumer UX work may not translate to enterprise value -- accepted because the PLG approach uses the existing product (shared codebase), so UX improvements benefit both tiers.
- Runway pressure increases if experiment runs full 3 months without clear signal -- accepted because the $75K cap and 4-person team limit total downside to approximately $125K and the experiment enriches our fundraising narrative regardless of outcome.

**Review date**: 2026-07-15

---

## Debate Metrics

| Metric | Value |
|--------|-------|
| challengesRaised | 7 |
| challengesSurvived | 2 |
| challengesDefeated | 0 |
| challengesConceded | 5 |
| confidenceScore | 5 |
