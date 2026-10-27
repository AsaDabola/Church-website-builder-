// The church being built, injected by astro.config.mjs after validation.
import type { z } from 'zod';
import type { churchSchema } from '../../lib/schema.mjs';
import brandJson from '../../brand.json';

export type Church = z.infer<typeof churchSchema>;

declare const __CHURCH__: Church;
declare const __PAGES__: string[];
declare const __CUSTOM_CSS__: string;

export const church: Church = __CHURCH__;
export const pages: string[] = __PAGES__;
export const customCss: string = __CUSTOM_CSS__;
export const brand = brandJson;

export const PAGE_TITLES: Record<string, string> = {
  about: 'About',
  visit: 'Plan a Visit',
  sermons: 'Sermons',
  events: 'Events',
  ministries: 'Ministries',
  give: 'Give',
  contact: 'Contact',
};

export const nav = pages.map((p) => ({ href: `/${p}/`, label: PAGE_TITLES[p] ?? p }));

export const displayName = church.shortName ?? church.name;

// YouTube: a channel's uploads playlist is its channel ID with "UC" swapped for "UU",
// so this embed always shows the newest sermon without anyone touching the site.
export function sermonEmbedUrl(): string | undefined {
  const s = church.sermons;
  if (s?.youtubePlaylistId) return `https://www.youtube-nocookie.com/embed/videoseries?list=${s.youtubePlaylistId}`;
  if (s?.youtubeChannelId) return `https://www.youtube-nocookie.com/embed/videoseries?list=UU${s.youtubeChannelId.slice(2)}`;
}

export function calendarEmbedUrl(): string | undefined {
  const e = church.events;
  if (!e?.googleCalendarId) return;
  const params = new URLSearchParams({
    src: e.googleCalendarId,
    ctz: e.timezone,
    mode: 'AGENDA',
    showTitle: '0',
    showPrint: '0',
    showTabs: '1',
    showCalendars: '0',
  });
  return `https://calendar.google.com/calendar/embed?${params}`;
}

export function fullAddress(): string | undefined {
  const a = church.contact.address;
  return a ? `${a.street}, ${a.city}, ${a.state} ${a.zip}` : undefined;
}

export function mapEmbedUrl(): string | undefined {
  const a = fullAddress();
  return a ? `https://maps.google.com/maps?q=${encodeURIComponent(`${church.name}, ${a}`)}&output=embed` : undefined;
}

export function directionsUrl(): string | undefined {
  const a = fullAddress();
  return a ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(a)}` : undefined;
}

export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

export function img(path?: string): string | undefined {
  return path ? `/${path.replace(/^\//, '')}` : undefined;
}
