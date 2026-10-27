# 30-day launch checklist (Oct 28 to Nov 30, 2026)

Goal: first paying church signed by November 30. The site system and demos come first, so every
outreach email can link to a real preview. Thanksgiving (Nov 26) slows replies; book calls before it.

## Week 1 (Oct 28 to Nov 3): set up
- [ ] Pick the business name; register the domain on Cloudflare; update `brand.json`
- [ ] File the NJ LLC, get the EIN, open the business bank account
- [ ] Create Cloudflare, GitHub, Google Workspace and Stripe accounts in the business's name
- [x] Scaffold the Astro repo, church.json format and page templates (this repo)

## Week 2 (Nov 4 to Nov 10): build the system
- [x] All page templates and 5 style presets; forms, YouTube and Google Calendar embeds
- [x] Intake form and service agreement drafts (`/intake/`, docs/service-agreement-draft.md)
- [ ] Send the agreement to a lawyer
- [x] 3 demo sites (traditional, contemporary, small rural)
- [ ] Add Cloudflare secrets to GitHub (docs/deploy.md); deploy demos at `<slug>.<domain>`
- [ ] Sign up for a form service and a booking link; put the keys/links in `brand.json`

## Week 3 (Nov 11 to Nov 17): go public
- [ ] Launch the business site (`business/`): review copy, deploy, point the domain
- [x] Lead engine built (`leads/`)
- [ ] Add `SERPAPI_KEY`; pull the first 200 local churches; score them
- [ ] Message pastors and church leaders you know (docs/sales-playbook.md)
- [ ] `node --env-file=.env scripts/stripe-setup.mjs` with a test key, then live; turn on ACH
- [ ] Google Business Profile

## Week 4 (Nov 18 to Nov 30): sell
- [ ] Generate previews for the top 20 leads, review each REVIEW.md, deploy
- [ ] Draft and send personal emails (20 to 30 a week); follow up once after 5 days
- [ ] Run sales calls; send proposals the same day
- [ ] Sign the first church and start its build

## Before the first contract
- [ ] Privacy policy and terms on the business site reviewed (drafts in business/src/pages/)
- [ ] Liability insurance quote once you have recurring clients
- [ ] Set aside ~25% of profit for taxes; ask an accountant about quarterly estimates
