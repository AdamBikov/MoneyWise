/* Единен набор линейни SVG икони (24×24, stroke) — вместо емоджита */
const ICONS = {
  home: '<path d="M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10"/>',
  list: '<path d="M4 6h16M4 12h16M4 18h10"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r=".8"/>',
  flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
  chart: '<path d="M4 20V11M10 20V4M16 20v-8M22 20H2"/>',
  sliders: '<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5"/>',
  moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/>',
  cloud: '<path d="M7 18h10a4 4 0 0 0 .6-7.9A6 6 0 0 0 6 10a4 4 0 0 0 1 8z"/>',
  db: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  trend: '<path d="M3 17l6-6 4 4 8-8M15 7h6v6"/>',
  trenddown: '<path d="M3 7l6 6 4-4 8 8M15 17h6v-6"/>',
  alert: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.01"/>',
  eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  check: '<path d="M4 12l5 5L20 6"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7v.01"/>',
  refresh: '<path d="M20 11a8 8 0 0 0-14-4L4 9M4 4v5h5M4 13a8 8 0 0 0 14 4l2-2M20 20v-5h-5"/>',
  bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
  arrowdown: '<path d="M12 4v16M6 14l6 6 6-6"/>',
  arrowup: '<path d="M12 20V4M6 10l6-6 6 6"/>',
  equal: '<path d="M5 9h14M5 15h14"/>',
  percent: '<path d="M19 5L5 19"/><circle cx="7" cy="7" r="2"/><circle cx="17" cy="17" r="2"/>',
  pulse: '<path d="M3 12h4l3-8 4 16 3-8h4"/>',
  pie: '<path d="M21 12A9 9 0 1 1 12 3v9z"/>',
  inbox: '<path d="M3 13l3-8h12l3 8v6H3zM3 13h5l1 3h6l1-3h5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
  download: '<path d="M12 4v12M6 10l6 6 6-6M4 20h16"/>',
  upload: '<path d="M12 16V4M6 10l6-6 6 6M4 20h16"/>',
  receipt: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>',
  tag: '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="7.5" r="1"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M14 6l4 4"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  cube: '<path d="M12 3l9 5v8l-9 5-9-5V8zM3 8l9 5 9-5M12 13v8"/>',
  calendar: '<rect x="4" y="5" width="16" height="16" rx="2"/><path d="M4 10h16M8 3v4M16 3v4"/>',
  store: '<path d="M4 9l1.5-5h13L20 9M4 9h16M5 9v11h14V9M10 20v-5h4v5"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
  cart: '<path d="M3 4h2l2 11h11l2-8H6"/><circle cx="9" cy="20" r="1.2"/><circle cx="17" cy="20" r="1.2"/>',
  utensils: '<path d="M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10M17 3c-2 2-3 5-3 8h3v10"/>',
  bus: '<rect x="4" y="4" width="16" height="13" rx="2"/><path d="M4 11h16M7 17v3M17 17v3M8 14h.01M16 14h.01"/>',
  play: '<circle cx="12" cy="12" r="9"/><path d="M10 8l6 4-6 4z"/>',
  heart: '<path d="M12 20s-8-5-8-11a4.5 4.5 0 0 1 8-2.5A4.5 4.5 0 0 1 20 9c0 6-8 11-8 11z"/>',
  bag: '<path d="M5 8h14l-1 13H6zM9 8V6a3 3 0 0 1 6 0v2"/>',
  book: '<path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3zM5 17a3 3 0 0 1 3-3h11"/>',
  dots: '<path d="M6 12h.01M12 12h.01M18 12h.01"/>',
  briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5h6v2M3 13h18"/>',
  laptop: '<rect x="5" y="5" width="14" height="10" rx="1"/><path d="M2 19h20"/>',
  gift: '<rect x="3" y="8" width="18" height="4"/><path d="M5 12v9h14v-9M12 8v13M12 8c-3 0-4-4-1.5-4S12 8 12 8zM12 8c3 0 4-4 1.5-4S12 8 12 8z"/>',
  car: '<path d="M5 16l1.5-6h11L19 16M3 16h18v3H3zM7 19v1M17 19v1"/>',
  cap: '<path d="M2 9l10-5 10 5-10 5zM6 11v5c0 1 3 3 6 3s6-2 6-3v-5"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>',
  phone: '<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>',
  plane: '<path d="M21 3L3 11l7 3 3 7z"/>',
  star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
};
const CAT_ICON_BY_KEY = { food: 'cart', eatout: 'utensils', transport: 'bus', housing: 'home', fun: 'play', health: 'heart', shopping: 'bag', education: 'book', other: 'dots', salary: 'briefcase', freelance: 'laptop', gift: 'gift' };
const CAT_PICK = ['cart', 'utensils', 'bus', 'home', 'play', 'heart', 'bag', 'book', 'briefcase', 'laptop', 'gift', 'tag'];
const GOAL_PICK = ['flag', 'laptop', 'car', 'home', 'cap', 'shield', 'phone', 'plane', 'gift', 'star', 'heart', 'bag'];

function I(name, size) {
  const s = ICONS[name] || ICONS.tag;
  return `<svg class="i" viewBox="0 0 24 24"${size ? ` width="${size}" height="${size}"` : ''} fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${s}</svg>`;
}
/* икона на категория / цел (с резервен вариант за стари данни с емоджи) */
const CI = c => I(c ? (ICONS[c.icon] ? c.icon : CAT_ICON_BY_KEY[c.key] || 'tag') : 'tag');
const GI = g => I(g && ICONS[g.icon] ? g.icon : 'flag');
