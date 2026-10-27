# Hosting and deployment

Every church is its own Cloudflare Pages project (free plan: unlimited sites and bandwidth).
GitHub Actions builds only the sites a push changed and uploads them with Wrangler, so day-to-day
edits redeploy in about a minute. Direct uploads don't use Cloudflare's 500 builds/month allowance.

## One-time setup

1. **GitHub**: keep this repo private, under the business account.
2. **Cloudflare**: create the account in the business's name. Add your brand domain to Cloudflare DNS.
3. **API token**: Cloudflare dashboard → My Profile → API Tokens → Create Token → "Edit Cloudflare Pages"
   template (Account → Cloudflare Pages → Edit). Copy your Account ID from the Workers & Pages overview.
4. **GitHub secrets**: repo → Settings → Secrets and variables → Actions → add
   `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.
5. Push to `main`. The workflow creates a Pages project per site, named `<pagesProjectPrefix><slug>`
   (set the prefix in `brand.json`; Pages names must be unique across Cloudflare).

## Domains

- **Previews and demos**: in each Pages project → Custom domains → add `<slug>.<your domain>`.
  Cloudflare creates the DNS record and SSL certificate.
- **Launch**: add the church's domain to the same project. If the church keeps its registrar, have them
  point DNS (a CNAME for `www` to `<project>.pages.dev`, and the apex per Cloudflare's instructions),
  or move the domain's nameservers to Cloudflare (simplest; Cloudflare Registrar is at-cost).
  Redirect the apex to `www` or the reverse, and confirm the padlock shows.
- After launch: submit the site in Google Search Console, and add an uptime check
  (UptimeRobot or Cloudflare health checks, both free) pointed at the home page.

## Forms

Church forms post to any HTML form service set in `church.json` → `forms.action` (plus `accessKey` for
Web3Forms). Make one form endpoint per church, delivering to the church's email, so messages go
straight to them. Without `forms`, the forms fall back to opening the visitor's email app.
The business site's forms use `formAction` / `formAccessKey` in `brand.json`.

## Backups and restores

The git repo is the backup: every version of every site is in history, and GitHub stores it off-site.
Cloudflare also keeps every deployment and can roll back in one click (project → Deployments →
Rollback). Once a quarter, test a restore: check out an old commit, build one site, compare.

## Deploy by hand

```bash
npm run build -- <slug>
CLOUDFLARE_API_TOKEN=... CLOUDFLARE_ACCOUNT_ID=... node scripts/deploy.mjs <slug>
```
Or run the workflow manually from the Actions tab with a list of slugs.
