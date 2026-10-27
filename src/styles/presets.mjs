// The 5 style presets. Each sets the design tokens used by global.css.
// A Ministry or Custom church can override primary/accent and the two fonts in church.json.
export const presets = {
  // Traditional: serif type, deep burgundy, cream paper.
  heritage: {
    label: 'Heritage (traditional)',
    fonts: { heading: 'Cormorant Garamond', body: 'Source Serif 4' },
    tokens: {
      primary: '#7a1f2b',
      accent: '#b48a3c',
      bg: '#faf6ef',
      surface: '#ffffff',
      text: '#2a2321',
      muted: '#6b5f5a',
      line: '#e6ddd0',
      radius: '2px',
      'hero-overlay': 'rgba(35, 15, 15, 0.55)',
      'heading-weight': '600',
      'heading-case': 'none',
    },
  },
  // Contemporary: clean sans, dark hero, bright accent.
  modern: {
    label: 'Modern (contemporary)',
    fonts: { heading: 'Space Grotesk', body: 'Inter' },
    tokens: {
      primary: '#111418',
      accent: '#ff6a3d',
      bg: '#ffffff',
      surface: '#f4f5f7',
      text: '#14171c',
      muted: '#5d6470',
      line: '#e3e6ea',
      radius: '14px',
      'hero-overlay': 'rgba(10, 12, 16, 0.6)',
      'heading-weight': '700',
      'heading-case': 'none',
    },
  },
  // Small-town and rural: warm greens and wheat.
  harvest: {
    label: 'Harvest (small town / rural)',
    fonts: { heading: 'Merriweather', body: 'Source Sans 3' },
    tokens: {
      primary: '#3f5b3a',
      accent: '#c7772f',
      bg: '#f7f3ea',
      surface: '#fffdf8',
      text: '#2b2a24',
      muted: '#6a665a',
      line: '#e4dccb',
      radius: '8px',
      'hero-overlay': 'rgba(30, 36, 22, 0.5)',
      'heading-weight': '700',
      'heading-case': 'none',
    },
  },
  // Light and friendly: navy and sea blue.
  coastal: {
    label: 'Coastal (light and friendly)',
    fonts: { heading: 'DM Serif Display', body: 'DM Sans' },
    tokens: {
      primary: '#1d3a5f',
      accent: '#3e9db3',
      bg: '#f5f9fb',
      surface: '#ffffff',
      text: '#1b2733',
      muted: '#586877',
      line: '#dbe6ec',
      radius: '10px',
      'hero-overlay': 'rgba(14, 32, 54, 0.5)',
      'heading-weight': '400',
      'heading-case': 'none',
    },
  },
  // High contrast: heavy type, royal purple and gold.
  bold: {
    label: 'Bold (high contrast)',
    fonts: { heading: 'Archivo', body: 'Archivo' },
    tokens: {
      primary: '#3f2382',
      accent: '#f2b134',
      bg: '#ffffff',
      surface: '#f3f0fa',
      text: '#16121f',
      muted: '#5b5570',
      line: '#e3ddf0',
      radius: '0px',
      'hero-overlay': 'rgba(28, 14, 60, 0.62)',
      'heading-weight': '800',
      'heading-case': 'uppercase',
    },
  },
};

// Google Fonts rejects weights a family doesn't have, so list them per family.
// Fonts not listed here (custom picks in church.json) get 400 and 700.
const FONT_WEIGHTS = {
  'Cormorant Garamond': ':wght@500;600;700',
  'Source Serif 4': ':wght@400;600;700',
  'Space Grotesk': ':wght@400;500;700',
  Inter: ':wght@400;500;600;700',
  Merriweather: ':wght@400;700',
  'Source Sans 3': ':wght@400;600;700',
  'DM Serif Display': '',
  'DM Sans': ':wght@400;500;700',
  Archivo: ':wght@400;600;800',
};

export function themeFor(church) {
  const preset = presets[church.preset];
  const tokens = { ...preset.tokens };
  if (church.colors?.primary) tokens.primary = church.colors.primary;
  if (church.colors?.accent) tokens.accent = church.colors.accent;
  const fonts = { ...preset.fonts, ...(church.fonts ?? {}) };
  tokens['heading-font'] = `'${fonts.heading}', Georgia, serif`;
  tokens['body-font'] = `'${fonts.body}', system-ui, sans-serif`;
  const css = `:root{${Object.entries(tokens).map(([k, v]) => `--${k}:${v}`).join(';')}}`;
  const families = [...new Set([fonts.heading, fonts.body])]
    .map((f) => `family=${encodeURIComponent(f).replace(/%20/g, '+')}${FONT_WEIGHTS[f] ?? ':wght@400;700'}`)
    .join('&');
  return { css, fontsHref: `https://fonts.googleapis.com/css2?${families}&display=swap` };
}
