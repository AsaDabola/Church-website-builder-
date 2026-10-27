# Intake form → church.json

The form lives at `/intake/` on the business site (`business/src/pages/intake.astro`). Each answer maps
onto `churches/<slug>/church.json`. Paste the submission into Claude Code and ask it to fill the file.

| Form field | church.json |
|---|---|
| Church name / short name / denomination | `name`, `shortName`, `denomination` |
| Address, phone, email, office hours | `contact.address`, `contact.phone`, `contact.email`, `contact.officeHours` |
| Plan | `tier` |
| Weekly service times | `serviceTimes[]` (`day`, `time`, `label`, `note`) |
| Special services | `specialServices[]` (`title`, `date` YYYY-MM-DD, `times[]`, `location`, `note`) |
| Who we are | `tagline`, `hero.headline`, `hero.subhead`, `welcome` (drafted, pastor approves) |
| History | `about.story[]` |
| Beliefs | `about.beliefs[]` (`title`, `text`) or `about.beliefsUrl` |
| First visit, kids, parking/accessibility | `visit.expect[]`, `visit.kids`, `visit.parking`, `visit.accessibility` |
| Staff | `staff[]` (`name`, `role`, `bio`, `photo`, `email`) |
| Ministries | `ministries[]` (`name`, `description`, `schedule`, `contact`, `image`) |
| Giving page | `giving.url`, `giving.provider` |
| YouTube channel | `sermons.youtubeChannelId` (the `UC...` ID: youtube.com/account_advanced, or "Share channel → Copy channel ID") |
| Livestream | `livestream.url` |
| Google Calendar | `events.googleCalendarId` (Calendar settings → Integrate calendar → Calendar ID; the calendar must be public) |
| Facebook / Instagram | `social.facebook`, `social.instagram`, `social.youtube` |
| Photos folder | download into `public/images/`; logo → `logo`, best wide photo → `hero.image` |
| Domain, registrar | `domain` (set at launch); arrange DNS access on a call, never by form |
| Colors/style | `preset`; Ministry+ can set `colors.primary`, `colors.accent`, `fonts` |

Run `npm run validate -- <slug>` when done; it lists any missing images and leftover TODOs.
