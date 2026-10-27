# Sales playbook

## Phase 1: warm network (first 5 churches)

1. Demo sites are built (`old-stone-presbyterian`, `riverlight-church`, `cedar-hollow-community`).
   Deploy them at `<slug>.<your domain>` and link them from the business site.
2. Offer your own church or a friend's a free or heavily discounted build for a testimonial.
3. List every pastor, administrator and ministry leader you know. Message each one (template below).
4. Ask your fellowship group and pastors you know for one introduction each.

**Warm message template**
> Hi [name], I've started a small business building and running websites for churches. You email
> me a change and it's done that week, for a flat monthly fee. I'm offering my first 5 churches the
> setup for free in exchange for a testimonial. Would [church] be interested, or do you know a
> church whose website could use some love? Here's an example: [demo link]

## Phase 2: repeatable channels (churches 6 to 20)

- **Audits as a door-opener**: `npm run leads:score`, then email a free 5-point audit with screenshots.
- **Lead engine with previews**: see [../leads/README.md](../leads/README.md).
- **Referral reward**: one free month for any church that refers another that signs.
- **Pastor networks**: local ministerial associations, pastor breakfasts, regional conferences.
- **Google Business Profile** and local SEO pages (`business/src/data/towns.json`), each with a real
  local example and specific content.

## Sales call (20 minutes)

1. What's frustrating about your current website?
2. Who updates it now, and how often?
3. What should a first-time visitor be able to do on it?
4. Do you use an online giving or livestream provider?
5. Recommend a tier, explain the 12-month term, and send the proposal the same day.

**Picking a tier:** weekly sermon video or regular events → Ministry. Under ~100 people, few
changes → Essentials. Wants something unlike any template, or a large church → Custom.

**Price objections:** lead with Essentials, offer annual prepay (2 months free), and compare the cost to
a volunteer's time or a single family who couldn't find the service times.

## Proposal template

> **Website proposal for [Church]**
> Plan: [Ministry], $[299] setup + $[99]/month, 12-month term, then month to month.
> Includes: [features from pricing.json]. Launch target: [date, ~2 weeks after intake].
> Next steps: sign the agreement, pay the setup fee here [Stripe link], fill out the intake form [link].
> Launch offer: setup fee waived for a testimonial and permission to show your site as an example.
