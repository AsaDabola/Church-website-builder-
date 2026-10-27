# Church Website Builder

The site system for a one-person church website subscription business: every client site, the
business website, and the lead engine, in one repo. Static sites built with Astro, hosted on
Cloudflare Pages (free), edited by Claude Code from plain-English requests.

```
churches/<slug>/church.json   one church's content (schema: lib/schema.mjs)
churches/<slug>/public/       its logo and photos
churches/_template/           starting point for new churches
src/                          shared components, pages and the 5 style presets
business/                     your own website: pricing, demos, FAQ, intake form, audit form
leads/                        Google Maps pull (SerpApi), site scoring, previews, email drafts
scripts/                      build, validate, link check, monthly reports, Stripe, deploy
docs/                         intake form, service agreement draft, playbooks, launch checklist
brand.json / pricing.json     your business details and prices, used everywhere
```

## Quick start

```bash
npm install
npm run validate
npm run dev -- old-stone-presbyterian      # http://localhost:4321
npm run build:all && npm run check-links
npm run business:dev
```

## What's included

**Tiers** (enforced by the schema)

| Tier | Pages | Design |
|---|---|---|
| Essentials | Home, About, Plan a Visit, Contact | Preset as-is |
| Ministry | + Sermons (YouTube, self-updating), Events (Google Calendar), Ministries, Give | Preset + own colors, fonts, logo |
| Custom | Same pages | + `custom.css` for a unique design |

**Style presets:** `heritage` (traditional), `modern` (contemporary), `harvest` (small town / rural),
`coastal` (light and friendly), `bold` (high contrast). See `src/styles/presets.mjs`.

**Demo sites** (fictional churches, one per tier and style):
`old-stone-presbyterian` (Ministry, heritage), `riverlight-church` (Custom, modern),
`cedar-hollow-community` (Essentials, harvest).

**Every site gets:** mobile-first layout, service times on the home page, special-service banners
that expire on their own, plan-a-visit / contact / prayer forms, map and directions, schema.org data
for Google, Open Graph tags, a 404 page, and no trackers.

## Before launch: replace placeholders

1. `brand.json` — business name, domain, emails, phone, mailing address (needed for outreach emails),
   booking link (Cal.com or Calendly), form service key, Cloudflare project prefix.
2. `pricing.json` — only if prices change.
3. Set up accounts and secrets: see [docs/deploy.md](docs/deploy.md) and [docs/launch-checklist.md](docs/launch-checklist.md).

## New church, start to finish

See [docs/client-workflow.md](docs/client-workflow.md). Short version:

```bash
npm run new-church -- grace-chapel "Grace Chapel" --tier ministry --preset coastal
# fill church.json from the intake answers (Claude Code can do this from the form email)
npm run validate -- grace-chapel && npm run dev -- grace-chapel
git commit -am "grace-chapel: first draft" && git push      # CI deploys grace-chapel.<domain>
```
