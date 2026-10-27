# Church website builder

One repo holds every church site. Each church is a folder in `churches/<slug>/` with a `church.json`
(content), a `public/` folder (logo, photos) and, for Custom-tier churches only, an optional `custom.css`.
All sites share the Astro components in `src/`. The business's own site is `business/`.

## Commands

- `npm run validate [-- <slug>]` — check church.json files against `lib/schema.mjs`. Run after every edit.
- `npm run dev -- <slug>` — local preview of one church.
- `npm run build -- <slug>` / `npm run build:all` — build into `dist/<slug>`.
- `npm run check-links [-- <slug>] [-- --external]` — broken links in built sites.
- `npm run new-church -- <slug> "<Name>" --tier ministry --preset coastal`
- `npm run business:dev` / `business:build`
- Lead engine: `leads:pull` → `leads:score` → `leads:preview -- --top 10` → `leads:emails` (see leads/README.md).

## Handling an edit request

Asa pastes a church's email, e.g. "add Christmas Eve services at 5 and 11 pm", while working in that church.

1. Make the change in `churches/<slug>/church.json` whenever the field exists. Special services
   (Christmas, Easter, VBS) go in `specialServices` with an ISO date; they show as a banner and on the
   visit page and hide themselves after the date. Don't add one-off HTML for something the schema covers.
2. Photos go in `churches/<slug>/public/images/`, referenced as `images/name.jpg`. Resize large photos to
   about 2000px wide first.
3. Run `npm run validate -- <slug>` and `npm run build -- <slug>`.
4. Show Asa the diff and a one-line summary to send back to the church. Commit message:
   `<slug>: <what changed>` (the monthly report is drafted from these, so write them for the pastor).
5. Never change shared code in `src/` for one church's request; that changes every site. Custom-tier
   design changes go in that church's `custom.css`. If several churches need a new feature, add it to the
   schema and components, keep it optional, and rebuild all sites.

Tier limits are enforced in `lib/schema.mjs` (`TIER_PAGES`; colors and fonts only on Ministry and Custom).
If a request is outside the church's tier (e.g. an Essentials church asks for a sermons page), say so and
suggest the upgrade or add-on instead of working around the limit.

## Writing copy

Draft from the church's own materials (intake answers, bulletins, old site) in their voice. Plain, warm,
specific; no invented facts, staff, history or beliefs. Anything you couldn't confirm gets flagged to Asa,
not guessed. The pastor approves all copy before launch.

## Previews

Lead-engine previews are normal church folders with `"preview": true` (ribbon + noindex). Each has a
`REVIEW.md` listing guesses to confirm. When a church signs: set `preview` to false, set its tier,
delete `REVIEW.md`. Demo sites (`"demo": true`) are fictional portfolio churches.
