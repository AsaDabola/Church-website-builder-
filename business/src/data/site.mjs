import brand from '../../../brand.json';
import pricing from '../../../pricing.json';

export { brand, pricing };

// Portfolio. Demo sites are fictional churches; add real clients here as they launch
// (with permission, which the launch offer includes).
export const examples = [
  { slug: 'old-stone-presbyterian', name: 'Old Stone Presbyterian Church', style: 'Traditional', tier: 'Ministry', demo: true },
  { slug: 'riverlight-church', name: 'Riverlight Church', style: 'Contemporary', tier: 'Custom', demo: true },
  { slug: 'cedar-hollow-community', name: 'Cedar Hollow Community Church', style: 'Small town', tier: 'Essentials', demo: true },
].map((e) => ({ ...e, url: e.url ?? `https://${e.slug}.${brand.domain}` }));

// Real quotes only, with the pastor's permission. The section stays hidden while this is empty.
export const testimonials = [
  // { quote: '...', name: 'Pastor Jane Smith', church: 'Grace Church, Hamilton' },
];

export const faq = [
  { q: 'Do we have to learn how to use a website builder?', a: "No. That's the point. You email or text the change you want (\"add the Christmas Eve service times\") and it's done, usually the same week." },
  { q: 'What counts as an edit?', a: 'Updating service times, adding an event, swapping a photo, changing staff, rewording a page. New pages or a redesign are quoted separately. Extra edit time beyond your plan is $60 an hour, and we always ask first.' },
  { q: 'Do sermons and events update on their own?', a: 'Yes, on the Ministry and Custom plans. Your latest YouTube sermons and your Google Calendar events appear on the site automatically, with no edit needed.' },
  { q: 'Is there a contract?', a: "Plans are 12 months, then month to month. If you need to cancel early, you pay the lower of the remaining months or a $300 exit fee. Pay for the year up front and get 2 months free." },
  { q: 'Who owns our website and domain?', a: "You do. Your content and domain are always yours. If you ever leave, you get a full export of your site." },
  { q: 'Can we keep our online giving provider?', a: 'Yes. We link to or embed the giving provider you already use, like Tithe.ly, Pushpay, Vanco or PayPal.' },
  { q: 'How long does it take?', a: 'About 2 weeks from signed agreement to live site for Essentials and Ministry, and 4 to 6 weeks for a Custom design. We start once your content intake form is complete.' },
  { q: 'What if our site goes down or gets hacked?', a: "Sites are static, so there are no plugins to hack. They're hosted on Cloudflare's global network with SSL, daily backups and uptime monitoring." },
];
