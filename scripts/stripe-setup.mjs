// Create (or update) the Stripe products and prices from pricing.json.
//   node --env-file=.env scripts/stripe-setup.mjs     (STRIPE_SECRET_KEY in .env)
// Safe to re-run: every price has a lookup_key, and existing ones are left alone.
// Run with a test key first, check the Stripe dashboard, then with the live key.
//
// For each tier it creates:  <tier>-setup (one-time), <tier>-monthly, <tier>-annual (prepay).
// For each add-on:           addon-<id> (one-time; edit hours are per hour, billed as quantity).
// Then make a Payment Link or Checkout Session per client from these prices.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from '../lib/load.mjs';

const key = process.env.STRIPE_SECRET_KEY;
if (!key) {
  console.error('Set STRIPE_SECRET_KEY (use an sk_test_ key first).');
  process.exit(1);
}
const pricing = JSON.parse(fs.readFileSync(path.join(ROOT, 'pricing.json'), 'utf8'));

async function stripe(method, endpoint, params) {
  const body = params ? new URLSearchParams(flatten(params)) : undefined;
  const url = `https://api.stripe.com/v1/${endpoint}${method === 'GET' && body ? `?${body}` : ''}`;
  const r = await fetch(url, {
    method,
    headers: { authorization: `Bearer ${key}`, 'content-type': 'application/x-www-form-urlencoded' },
    body: method === 'GET' ? undefined : body,
  });
  const data = await r.json();
  if (data.error) throw new Error(`${endpoint}: ${data.error.message}`);
  return data;
}
function flatten(obj, prefix = '') {
  return Object.entries(obj).flatMap(([k, v]) => {
    const name = prefix ? `${prefix}[${k}]` : k;
    if (Array.isArray(v)) return v.map((x, i) => [`${name}[${i}]`, x]);
    return v && typeof v === 'object' ? flatten(v, name) : [[name, String(v)]];
  });
}

const wanted = [];
for (const t of pricing.tiers) {
  wanted.push({ product: `${t.name} plan`, productId: `tier-${t.id}`, lookup: `${t.id}-setup`, amount: t.setup, nickname: `${t.name} ${t.setupLabel} fee` });
  wanted.push({ product: `${t.name} plan`, productId: `tier-${t.id}`, lookup: `${t.id}-monthly`, amount: t.monthly, nickname: `${t.name} monthly`, interval: 'month' });
  wanted.push({ product: `${t.name} plan`, productId: `tier-${t.id}`, lookup: `${t.id}-annual`, amount: t.monthly * pricing.terms.annualPrepayMonths, nickname: `${t.name} annual prepay`, interval: 'year' });
}
for (const a of pricing.addons) {
  wanted.push({ product: a.name, productId: `addon-${a.id}`, lookup: `addon-${a.id}`, amount: a.price, nickname: `${a.name} (${a.unit})` });
}

const existing = await stripe('GET', 'prices', { 'lookup_keys': wanted.map((w) => w.lookup), limit: 100 });
const have = new Map(existing.data.map((p) => [p.lookup_key, p]));
const products = new Set();

for (const w of wanted) {
  if (!products.has(w.productId)) {
    try {
      await stripe('GET', `products/${w.productId}`);
    } catch {
      await stripe('POST', 'products', { id: w.productId, name: w.product });
      console.log(`+ product ${w.product}`);
    }
    products.add(w.productId);
  }
  const cents = Math.round(w.amount * 100);
  const cur = have.get(w.lookup);
  if (cur && cur.unit_amount === cents) {
    console.log(`= ${w.lookup} $${w.amount}`);
    continue;
  }
  // Prices can't be edited in Stripe; a new price takes over the lookup key.
  await stripe('POST', 'prices', {
    product: w.productId,
    currency: 'usd',
    unit_amount: cents,
    nickname: w.nickname,
    lookup_key: w.lookup,
    transfer_lookup_key: 'true',
    ...(w.interval ? { recurring: { interval: w.interval } } : {}),
  });
  console.log(`${cur ? '~' : '+'} ${w.lookup} $${w.amount}${w.interval ? `/${w.interval}` : ''}`);
}
console.log('\nDone. Turn on ACH (US bank account) under Settings → Payment methods to accept bank payments.');
