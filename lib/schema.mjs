// The church.json format. One file per church in churches/<slug>/church.json.
// Shared by the Astro build and the Node scripts, so it stays plain JS.
import { z } from 'zod';

export const TIERS = ['essentials', 'ministry', 'custom'];
export const PRESETS = ['heritage', 'modern', 'harvest', 'coastal', 'bold'];

// Pages each tier gets. Home is always built.
export const TIER_PAGES = {
  essentials: ['about', 'visit', 'contact'],
  ministry: ['about', 'visit', 'sermons', 'events', 'ministries', 'give', 'contact'],
  custom: ['about', 'visit', 'sermons', 'events', 'ministries', 'give', 'contact'],
};

const url = z.string().url();
const text = z.string().trim().min(1);
const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'use a 6-digit hex color like #7a1f2b');
// Image paths are relative to churches/<slug>/public, e.g. "images/hero.jpg".
const image = z.string().regex(/^[\w./-]+\.(jpe?g|png|webp|avif|svg|gif)$/i, 'image path like images/hero.jpg');

const serviceTime = z.object({
  day: text, // "Sunday"
  time: text, // "10:30 AM"
  label: z.string().optional(), // "Worship Service"
  note: z.string().optional(), // "Nursery available"
});

const specialService = z.object({
  title: text, // "Christmas Eve Candlelight Service"
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date as YYYY-MM-DD'),
  times: z.array(text).min(1),
  location: z.string().optional(),
  note: z.string().optional(),
  // Hidden after this date (defaults to the service date).
  showUntil: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

const person = z.object({
  name: text,
  role: text,
  bio: z.string().optional(),
  photo: image.optional(),
  email: z.string().email().optional(),
});

const ministry = z.object({
  name: text,
  description: text,
  schedule: z.string().optional(),
  image: image.optional(),
  contact: z.string().optional(),
});

export const churchSchema = z
  .object({
    slug: z.string().regex(/^[a-z0-9-]+$/, 'lowercase letters, numbers and dashes'),
    name: text,
    shortName: z.string().optional(),
    tier: z.enum(TIERS),
    preset: z.enum(PRESETS),
    demo: z.boolean().default(false), // fictional church used as a portfolio example
    preview: z.boolean().default(false), // unsolicited preview built by the lead engine
    domain: z.string().optional(), // "gracechurchtrenton.org"; preview subdomain is used until set
    denomination: z.string().optional(),
    tagline: z.string().optional(),
    logo: image.optional(),
    // Ministry and Custom only. Ignored with a warning on Essentials.
    colors: z.object({ primary: hex.optional(), accent: hex.optional() }).optional(),
    fonts: z.object({ heading: z.string().optional(), body: z.string().optional() }).optional(),

    seo: z.object({ description: text }).optional(),

    contact: z.object({
      email: z.string().email().optional(),
      phone: z.string().optional(),
      address: z
        .object({ street: text, city: text, state: text, zip: text })
        .optional(),
      officeHours: z.string().optional(),
    }),

    serviceTimes: z.array(serviceTime).min(1),
    specialServices: z.array(specialService).default([]),

    hero: z.object({
      headline: text,
      subhead: z.string().optional(),
      image: image.optional(),
    }),

    welcome: z
      .object({ heading: text, paragraphs: z.array(text).min(1) })
      .optional(),

    about: z
      .object({
        story: z.array(text).default([]),
        beliefs: z.array(z.object({ title: text, text: text })).default([]),
        beliefsUrl: url.optional(),
      })
      .default({}),

    staff: z.array(person).default([]),
    ministries: z.array(ministry).default([]),

    sermons: z
      .object({
        youtubeChannelId: z.string().regex(/^UC[\w-]{22}$/, 'YouTube channel IDs start with UC and are 24 characters').optional(),
        youtubePlaylistId: z.string().optional(),
        podcastUrl: url.optional(),
        note: z.string().optional(),
      })
      .optional(),

    livestream: z.object({ url: url, note: z.string().optional() }).optional(),

    events: z
      .object({
        googleCalendarId: z.string().optional(),
        timezone: z.string().default('America/New_York'),
        highlights: z
          .array(z.object({ title: text, date: z.string().optional(), description: z.string().optional() }))
          .default([]),
      })
      .optional(),

    giving: z
      .object({
        url: url,
        provider: z.string().optional(), // "Tithe.ly", "Pushpay", "PayPal"...
        message: z.string().optional(),
        mailTo: z.string().optional(), // "Mail checks to ..."
      })
      .optional(),

    visit: z
      .object({
        intro: z.string().optional(),
        expect: z.array(z.object({ title: text, text: text })).default([]),
        kids: z.string().optional(),
        parking: z.string().optional(),
        accessibility: z.string().optional(),
      })
      .default({}),

    social: z
      .object({ facebook: url.optional(), instagram: url.optional(), youtube: url.optional() })
      .default({}),

    // Where contact, prayer and plan-a-visit forms post. Any form service that
    // accepts a plain HTML POST works (Formspree, Web3Forms, Basin...).
    forms: z
      .object({
        action: url,
        accessKey: z.string().optional(), // Web3Forms-style hidden key, if the service needs one
      })
      .optional(),

    // Turn individual pages off (or on, within the tier).
    pages: z.record(z.string(), z.boolean()).optional(),
  })
  .strict();

// Returns { church, pages, warnings } or throws with readable messages.
export function parseChurch(raw, file = 'church.json') {
  const result = churchSchema.safeParse(raw);
  if (!result.success) {
    const lines = result.error.issues.map((i) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`);
    throw new Error(`${file} is not valid:\n${lines.join('\n')}`);
  }
  const church = result.data;
  const warnings = [];

  if (church.tier === 'essentials' && (church.colors || church.fonts)) {
    warnings.push('colors/fonts are a Ministry feature; Essentials uses the preset as-is.');
    delete church.colors;
    delete church.fonts;
  }

  const allowed = TIER_PAGES[church.tier];
  const pages = allowed.filter((p) => church.pages?.[p] !== false);
  for (const [p, on] of Object.entries(church.pages ?? {})) {
    if (on && !allowed.includes(p)) warnings.push(`page "${p}" is not included in the ${church.tier} tier; skipped.`);
  }

  // Drop pages that would be empty.
  // Demo sites show placeholders for the embeds, so prospects see the full page set.
  const has = {
    sermons: church.demo || church.sermons?.youtubeChannelId || church.sermons?.youtubePlaylistId || church.sermons?.podcastUrl || church.livestream,
    events: church.demo || church.events?.googleCalendarId || church.events?.highlights?.length,
    ministries: church.ministries.length,
    give: church.giving,
    contact: true,
    visit: true,
    about: church.about.story.length || church.about.beliefs.length || church.staff.length,
  };
  const built = pages.filter((p) => {
    if (has[p]) return true;
    warnings.push(`page "${p}" has no content in church.json; skipped.`);
    return false;
  });

  return { church, pages: built, warnings };
}
