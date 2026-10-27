# Client workflow

Template tiers: signed to live in about 2 weeks. Custom: 4 to 6 weeks.

1. **Discovery call** (20 min, see [sales-playbook.md](sales-playbook.md)). Recommend a tier.
2. **Proposal and agreement**, sent the same day. They sign and pay the setup fee through a Stripe
   Payment Link using the `<tier>-setup` price. Create the subscription (`<tier>-monthly` or
   `<tier>-annual`) to start on launch day.
3. **Intake form**: send them `https://<your domain>/intake/`. Building starts only when it's complete.
4. **Build**
   ```bash
   npm run new-church -- <slug> "<Church Name>" --tier ministry --preset heritage
   ```
   Paste the intake email into Claude Code: *"Fill churches/<slug>/church.json from these intake
   answers. Draft the copy from their old site and bulletins. List anything you couldn't confirm."*
   Add their logo and photos to `public/images/`. Then review every page yourself:
   `npm run dev -- <slug>`. Push; CI deploys the preview at `<slug>.<your domain>`.
5. **Review round**: send the preview link. One round of revisions (two for Custom).
6. **Launch**: set `domain` in church.json, add the domain to the Pages project, confirm SSL, set up
   the church's form endpoint, submit to Google Search Console, add uptime monitoring.
7. **Handoff**: 15-minute walkthrough. Send the one-page guide ([client-guide.md](client-guide.md)).
8. **Monthly care**: edits within 3 business days (Custom: 1 to 2). On the 1st, the maintenance
   workflow checks every link; run `npm run report` and send each church its report. Quarterly, ask
   about seasonal pages (Easter, VBS, Christmas).
9. **Annual renewal**: at month 11, send a year-in-review and offer an upgrade if they used more edit
   time than their tier covers.

## Edits

Batch edits on two set days a week. For each request: open Claude Code in the repo, paste the
request, review the diff, push. Log time on anything over 15 minutes; overages are $60/hour, and
always ask before doing billable work. See CLAUDE.md for how changes should be made.

Scaling rule: when edits regularly exceed 4 hours a week, raise prices or hire a part-time assistant
for intake and email before taking more churches.
