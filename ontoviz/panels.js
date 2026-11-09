/* 3D type — every line on the WebGPU page is a CanvasTexture.
 *
 * No HTML text sits over the canvas: the cards, the frame, the inspector and
 * the buttons are all planes with UV hotspots. Panels are drawn at device
 * pixel density (see ssOf) while their coordinates stay in logical px, so
 * text is sharp on a retina screen and hotspots never move.
 */
import { COL, RELCOL, SCENES, BRAND } from './ontology.js';

const SERIF = '"Cormorant Garamond", Georgia, "Times New Roman", serif';
const SANS = '"DM Sans", system-ui, "Noto Sans KR", sans-serif';
const MONO = '"JetBrains Mono", ui-monospace, Menlo, monospace';

const ACCENT = {
  cover: '#d4a84b', daily: '#f0c75e', faith: '#8fb3c9', music: '#8b7cf0',
  care: '#3db8a8', systems: '#e85d4c', record: '#f4efe6', doors: '#b5a999'
};
const INK = '#f4efe6', DIM = '#b5a999', MUTE = '#7a7064', PAPER = '#0a0908';

export async function loadFonts() {
  if (!document.fonts) return;
  const jobs = [
    `600 100px ${SERIF}`, `500 100px ${SERIF}`, `italic 400 100px ${SERIF}`,
    `300 40px ${SANS}`, `400 40px ${SANS}`, `500 40px ${SANS}`, `600 40px ${SANS}`,
    `400 30px ${MONO}`, `500 30px ${MONO}`, `400 30px "Noto Sans KR"`, `500 30px "Noto Sans KR"`
  ].map((f) => document.fonts.load(f).catch(() => {}));
  await Promise.race([Promise.all(jobs), new Promise((r) => setTimeout(r, 2600))]);
}

/* 화질: 기기 픽셀에 맞춰 S배로 그리고 좌표는 논리 px 로 둔다. */
const DPR = Math.max(1, Math.min(2, (typeof devicePixelRatio === 'number' && devicePixelRatio) || 1));
const ssOf = (W, H, budget = 2.6e6) => {
  const cap = W <= 420 ? Math.min(DPR, 1.8) : DPR;
  return Math.max(1, Math.min(cap, Math.sqrt(budget / Math.max(1, W * H))));
};
function surface(W, H, s = ssOf(W, H)) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(W * s);
  canvas.height = Math.round(H * s);
  const ctx = canvas.getContext('2d');
  ctx.scale(s, s);
  return { canvas, ctx, s };
}

export const rr = (ctx, x, y, w, h, r) => {
  const k = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  if (ctx.roundRect) { ctx.roundRect(x, y, w, h, k); return; }
  ctx.moveTo(x + k, y); ctx.arcTo(x + w, y, x + w, y + h, k); ctx.arcTo(x + w, y + h, x, y + h, k);
  ctx.arcTo(x, y + h, x, y, k); ctx.arcTo(x, y, x + w, y, k); ctx.closePath();
};

const decode = (s) => String(s)
  .replace(/&nbsp;/g, ' ')
  .replace(/&#8217;|&rsquo;/g, '’').replace(/&#8216;|&lsquo;/g, '‘')
  .replace(/&#8220;|&ldquo;/g, '“').replace(/&#8221;|&rdquo;/g, '”')
  .replace(/&#8212;|&mdash;/g, '—').replace(/&#8211;|&ndash;/g, '–')
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');

export function parseRich(str) {
  str = decode(str);
  const out = [];
  const re = /<em>([\s\S]*?)<\/em>|<br\s*\/?>|([^<]+)/gi;
  let m;
  while ((m = re.exec(str))) {
    if (m[1] != null) out.push({ text: m[1], em: true });
    else if (m[0].toLowerCase().startsWith('<br')) out.push({ br: true });
    else if (m[2]) out.push({ text: m[2], em: false });
  }
  return out;
}

function wrapRich(ctx, runs, maxW, fonts) {
  const words = [];
  runs.forEach((run) => {
    if (run.br) { words.push({ br: true }); return; }
    const font = run.em ? fonts.em : fonts.base;
    run.text.split(/\s+/).filter(Boolean).forEach((w) => words.push({ w, em: !!run.em, font }));
  });
  const lines = [];
  let line = [], width = 0;
  const PUNCT = /^[.,;:!?…·'"”’)\]]+$/;
  words.forEach((word) => {
    if (word.br) { if (line.length) lines.push(line); line = []; width = 0; return; }
    ctx.font = word.font;
    const ww = ctx.measureText(word.w).width;
    /* a lone full stop after </em> belongs to the word before it */
    const gap = line.length ? (PUNCT.test(word.w) ? 0 : 13) : 0;
    if (line.length && width + gap + ww > maxW) { lines.push(line); line = []; width = 0; }
    const g2 = line.length ? (PUNCT.test(word.w) ? 0 : 13) : 0;
    line.push({ ...word, x: width + g2 });
    width += g2 + ww;
  });
  if (line.length) lines.push(line);
  return lines;
}

function drawRich(ctx, str, { x, y, maxW, size = 58, lh = 1.06, color = INK, emColor = '#d4a84b', weight = 500 }) {
  const fonts = { base: `${weight} ${size}px ${SERIF}`, em: `italic 400 ${size}px ${SERIF}` };
  const lines = wrapRich(ctx, parseRich(str), maxW, fonts);
  let cy = y;
  lines.forEach((line) => {
    line.forEach((word) => {
      ctx.font = word.font;
      ctx.fillStyle = word.em ? emColor : color;
      ctx.fillText(word.w, x + word.x, cy);
    });
    cy += size * lh;
  });
  return cy;
}

function wrapText(ctx, text, maxW, font, size, lh) {
  ctx.font = font;
  const words = String(text || '').split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  words.forEach((w) => {
    const t = line ? line + ' ' + w : w;
    if (line && ctx.measureText(t).width > maxW) { lines.push(line); line = w; }
    else line = t;
  });
  if (line) lines.push(line);
  return { lines, height: lines.length * size * lh, step: size * lh };
}

/* letter-spaced type without relying on ctx.letterSpacing */
function spaced(ctx, text, x, y, sp) {
  let cx = x;
  for (const ch of String(text)) { ctx.fillText(ch, cx, y); cx += ctx.measureText(ch).width + sp; }
  return cx - x - sp;
}
function spacedW(ctx, text, sp) {
  let w = 0;
  for (const ch of String(text)) w += ctx.measureText(ch).width + sp;
  return w;
}
function kicker(ctx, text, x, y, { color = '#d4a84b', size = 19, sp = 3.2, maxW = 0 } = {}) {
  ctx.save();
  let s2 = size, s3 = sp, t = String(text).toUpperCase();
  ctx.font = `500 ${s2}px ${MONO}`;
  while (maxW && spacedW(ctx, t, s3) > maxW && s3 > 0.6) { s3 -= 0.15; }
  while (maxW && spacedW(ctx, t, s3) > maxW && s2 > 6) { s2 -= 0.5; ctx.font = `500 ${s2}px ${MONO}`; }
  ctx.fillStyle = color;
  spaced(ctx, t, x, y, s3);
  ctx.restore();
}

function card(ctx, w, h, accent) {
  const g = ctx.createLinearGradient(0, 0, w * 0.6, h);
  g.addColorStop(0, '#14110d');
  g.addColorStop(0.55, '#100e0b');
  g.addColorStop(1, '#0b0a08');
  rr(ctx, 1.5, 1.5, w - 3, h - 3, 18);
  ctx.fillStyle = g; ctx.fill();
  ctx.strokeStyle = 'rgba(244,239,230,.13)'; ctx.lineWidth = 1.6; ctx.stroke();
  /* top light + accent spine */
  ctx.save();
  rr(ctx, 1.5, 1.5, w - 3, h - 3, 18); ctx.clip();
  const tg = ctx.createLinearGradient(0, 0, 0, 90);
  tg.addColorStop(0, 'rgba(255,255,255,.045)'); tg.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = tg; ctx.fillRect(0, 0, w, 90);
  const lg = ctx.createLinearGradient(0, 0, 0, h);
  lg.addColorStop(0, accent + '00'); lg.addColorStop(0.12, accent + 'cc'); lg.addColorStop(0.9, accent + '33'); lg.addColorStop(1, accent + '00');
  ctx.fillStyle = lg; ctx.fillRect(0, 0, 2.5, h);
  ctx.restore();
  /* corner ticks */
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2;
  [[14, 14, 1, 1], [w - 14, 14, -1, 1], [14, h - 14, 1, -1], [w - 14, h - 14, -1, -1]].forEach(([x, y, sx, sy]) => {
    ctx.beginPath(); ctx.moveTo(x, y + 16 * sy); ctx.lineTo(x, y); ctx.lineTo(x + 16 * sx, y); ctx.stroke();
  });
}

function chip(ctx, x, y, label, { solid = false, accent = '#d4a84b', size = 18, padX = 20, h = 46, mono = true } = {}) {
  ctx.font = `${mono ? '500' : '500'} ${size}px ${mono ? MONO : SANS}`;
  const sp = 2.4;
  const tw = spacedW(ctx, label.toUpperCase(), sp);
  const w = tw + padX * 2;
  rr(ctx, x, y, w, h, 4);
  if (solid) { ctx.fillStyle = accent; ctx.fill(); }
  else { ctx.strokeStyle = 'rgba(244,239,230,.22)'; ctx.lineWidth = 1.4; ctx.stroke(); }
  ctx.fillStyle = solid ? '#14110d' : INK;
  spaced(ctx, label.toUpperCase(), x + padX, y + h / 2 + size * 0.36, sp);
  return { x, y, w, h };
}

function pill(ctx, x, y, label, { accent = '#d4a84b', size = 17, h = 40 } = {}) {
  ctx.font = `500 ${size}px ${MONO}`;
  const tw = spacedW(ctx, label.toUpperCase(), 2.2);
  const w = tw + (h > 32 ? 30 : 24);
  const px = h > 32 ? 15 : 12;
  rr(ctx, x, y, w, h, h / 2);
  ctx.strokeStyle = accent + '99'; ctx.lineWidth = 1.4; ctx.stroke();
  ctx.fillStyle = accent;
  spaced(ctx, label.toUpperCase(), x + px, y + h / 2 + size * 0.36, 2.2);
  return { x, y, w, h };
}

function glowDot(ctx, x, y, r, color, alpha = 1) {
  ctx.save();
  ctx.shadowColor = color; ctx.shadowBlur = r * 3.2;
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

/* ── the scene card ──────────────────────────────────────────────── */
export function chapterTexture(sc, idx, total, narrow) {
  const accent = ACCENT[sc.id] || '#d4a84b';
  const W = narrow ? 300 : 780;
  const pad = narrow ? 24 : 44;
  const H = 1400;                       /* generous scratch height; we crop */
  const { canvas, ctx: x } = surface(W, H);
  const hot = [];

  const CARD_H = 700;                   /* wide-card body height, before padding */
  const bh = narrow ? 36 : 44;          /* footer: height of the action chips */
  const FOOT = bh + (narrow ? 16 : 26) + (narrow ? 18 : 24);
  const kickerSize = narrow ? 11 : 17;
  const deckSize = narrow ? 15 : 21;
  const titleSize = narrow ? 30 : 57;

  let y = pad + (narrow ? 18 : 26);
  kicker(x, sc.kicker, pad, y, { color: accent, size: kickerSize, sp: narrow ? 1.9 : 2.7, maxW: W - pad * 2 - (narrow ? 62 : 130) });


  /* title */
  y += narrow ? 30 : 50;
  const leftW = narrow ? W - pad * 2 : 470;
  y = drawRich(x, sc.title, { x: pad, y, maxW: leftW, size: titleSize, lh: 1.04, color: INK, emColor: accent, weight: 500 });

  /* watermark numeral */
  x.save();
  x.font = `600 ${narrow ? 120 : 260}px ${SERIF}`;
  x.fillStyle = 'rgba(244,239,230,.032)';
  x.fillText(sc.num, W - x.measureText(sc.num).width - (narrow ? 12 : 22), y + (narrow ? 66 : 190));
  x.restore();

  /* deck */
  y += narrow ? 10 : 16;
  const deckText = narrow ? (sc.short || sc.deck) : sc.deck;
  const d = wrapText(x, deckText, leftW, `300 ${deckSize}px ${SANS}`, deckSize, 1.52);
  x.save();
  x.fillStyle = DIM;
  x.font = `300 ${deckSize}px ${SANS}`;
  d.lines.forEach((line, k) => x.fillText(line, pad, y + k * deckSize * 1.52));
  x.restore();
  y += d.height;

  /* items */
  const items = (sc.items || []).slice(0, narrow ? 4 : 5);
  if (narrow) {
    y += 18;
    kicker(x, BRAND.itemHead, pad, y, { color: MUTE, size: 9.5, sp: 2 });
    y += 12;
    const colW = (W - pad * 2 - 10) / 2;
    items.forEach((it, k) => {
      const cx = pad + (k % 2) * (colW + 10);
      const cy = y + Math.floor(k / 2) * 34;
      glowDot(x, cx + 3, cy - 4, 2.2, COL[clsOfCol(it.id, sc.id)] || accent, 0.9);
      x.font = `500 11.5px ${SANS}`;
      x.fillStyle = INK;
      const nm = fit(x, narrow ? (it.en2 || it.en) : it.en, colW - 16);
      x.fillText(nm, cx + 12, cy);
      x.font = `400 9px "Noto Sans KR", ${SANS}`;
      x.fillStyle = MUTE;
      x.fillText(it.kr, cx + 12, cy + 11);
      hot.push({ x: cx - 4, y: cy - 14, w: colW + 6, h: 30, action: { type: 'node', id: it.id } });
    });
    y += Math.ceil(items.length / 2) * 34;
  } else {
    const colX = 548, colW = 196;
    let iy = pad + 96;
    x.strokeStyle = 'rgba(244,239,230,.08)'; x.lineWidth = 1;
    x.beginPath(); x.moveTo(524, pad + 88); x.lineTo(524, iy + 300); x.stroke();
    kicker(x, BRAND.itemHead, colX, iy, { color: MUTE, size: 12, sp: 2 });
    iy += 26;
    const rowH = 50;
    items.forEach((it, k) => {
      const cy = iy + rowH * k;
      glowDot(x, colX + 4, cy - 4, 3.2, COL[clsOfCol(it.id, sc.id)] || accent, 0.95);
      x.font = `500 16.5px ${SANS}`;
      x.fillStyle = INK;
      const nm = fit(x, it.en, colW - 16);
      x.fillText(nm, colX + 18, cy);
      x.font = `400 11.5px "Noto Sans KR", ${SANS}`;
      x.fillStyle = MUTE;
      x.fillText(it.kr, colX + 18, cy + 15);
      if (k < items.length - 1) {
        x.strokeStyle = 'rgba(244,239,230,.05)'; x.lineWidth = 1;
        x.beginPath(); x.moveTo(colX, cy + 26); x.lineTo(colX + colW, cy + 26); x.stroke();
      }
      hot.push({ x: colX - 8, y: cy - 20, w: colW + 16, h: 42, action: { type: 'node', id: it.id } });
    });
  }

  /* quote — measured first, then floated inside the slack so the space above
     and below it is split evenly; every wide card is the same size, and a short
     scene breathes instead of leaving a dead band above the footer */
  const qSize = narrow ? 17 : 24;
  const qeSize = narrow ? 10.5 : 14;
  const lead = narrow ? 26 : 36;
  const trail = narrow ? 20 : 32;
  const q = wrapText(x, sc.quote, leftW - 18, `italic 500 ${qSize}px ${SERIF}`, qSize, 1.32);
  const qe = wrapText(x, sc.quoteEn, leftW - 18, `300 ${qeSize}px ${SANS}`, qeSize, 1.4);
  const blockH = lead + q.height + (narrow ? 2 : 4) + qe.height + trail;
  const footerTop = CARD_H - FOOT;
  y += narrow ? 20 : 30;
  if (!narrow && footerTop - y > blockH) y += Math.round((footerTop - y - blockH) * 0.5);

  x.strokeStyle = 'rgba(244,239,230,.08)'; x.lineWidth = 1;
  x.beginPath(); x.moveTo(pad, y); x.lineTo(W - pad, y); x.stroke();
  y += lead;
  x.fillStyle = accent;
  x.fillRect(pad, y - qSize * 0.86, 2, qSize * (narrow ? 2.1 : 2.6));
  x.font = `italic 500 ${qSize}px ${SERIF}`;
  x.fillStyle = INK;
  q.lines.forEach((line, k) => x.fillText(line, pad + 14, y + k * qSize * 1.32));
  y += q.height + (narrow ? 2 : 4);
  x.font = `300 ${qeSize}px ${SANS}`;
  x.fillStyle = MUTE;
  qe.lines.forEach((line, k) => x.fillText(line, pad + 14, y + k * qeSize * 1.4));
  y += qe.height + trail;

  /* footer — pinned to the bottom edge of the fixed-height wide card */
  if (!narrow) y = Math.max(y, footerTop);
  const b1 = chip(x, pad, y, 'Read the stories', { solid: false, accent, size: narrow ? 10 : 15, padX: narrow ? 12 : 18, h: bh });
  hot.push({ ...b1, action: { type: 'reader', id: sc.id } });
  if (idx < total - 1) {
    const nx = SCENES[idx + 1];
    const label = `${BRAND.nextLabel} · ${nx.kr}`;
    const b2 = chip(x, pad + b1.w + (narrow ? 8 : 12), y, label, { solid: true, accent, size: narrow ? 10 : 15, padX: narrow ? 12 : 18, h: bh });
    hot.push({ ...b2, action: { type: 'station', i: idx + 1 } });
  } else {
    /* last scene: the walk loops back to the cover */
    const label = narrow ? 'Start over' : 'Start over · 표지';
    const b2 = chip(x, pad + b1.w + (narrow ? 8 : 12), y, label, { solid: true, accent, size: narrow ? 10 : 15, padX: narrow ? 12 : 18, h: bh });
    hot.push({ ...b2, action: { type: 'station', i: 0 } });
  }
  y += bh + (narrow ? 16 : 26);

  x.font = `400 ${narrow ? 9 : 12.5}px ${MONO}`;
  x.fillStyle = MUTE;
  x.fillText(`${BRAND.sourceLabel}: ${fit(x, sc.source, W - pad * 2)}`, pad, y);
  y += narrow ? 18 : 24;

  return finish(canvas, W, H, y + pad * (narrow ? 0.85 : 0.5), accent, hot);
}

/* clip a label to the column without breaking the card */
function fit(ctx, text, maxW) {
  if (ctx.measureText(text).width <= maxW) return text;
  let s = text;
  while (s.length > 3 && ctx.measureText(s + '…').width > maxW) s = s.slice(0, -1);
  return s.trimEnd() + '…';
}

function clsOfCol(id, sceneId) {
  return {
    daily: 'Day', faith: 'Faith', music: 'Music', care: 'Care',
    systems: 'System', record: 'Record', doors: 'Door'
  }[sceneId] || 'Record';
}

function finish(scratch, W, sH, usedH, accent, hot) {
  const H = Math.max(360, Math.round(usedH));
  const out = surface(W, H, ssOf(W, H));
  const o = out.ctx;
  o.clearRect(0, 0, W, H);
  card(o, W, H, accent);
  o.drawImage(scratch, 0, 0, scratch.width, (usedH / sH) * scratch.height, 0, 0, W, H);
  return { canvas: out.canvas, w: W, h: H, hotspots: hot };
}

/* ── cover card ─────────────────────────────────────────────────── */
export function coverTexture(sc, total, narrow) {
  const W = narrow ? 300 : 780, pad = narrow ? 24 : 44, H = 1400;
  const { canvas, ctx: x } = surface(W, H);
  const hot = [];
  const accent = ACCENT.cover;

  let y = pad + (narrow ? 22 : 30);
  kicker(x, BRAND.coverKicker, pad, y, { color: accent, size: narrow ? 10.5 : 16, sp: narrow ? 1.9 : 2.7, maxW: W - pad * 2 });
  y += narrow ? 42 : 74;
  y = drawRich(x, sc.title, { x: pad, y, maxW: narrow ? W - pad * 2 : 470, size: narrow ? 44 : 96, lh: 0.98, color: INK, emColor: accent, weight: 500 });

  y += narrow ? 6 : 12;
  const leftW = narrow ? W - pad * 2 : 470;
  const ds = narrow ? 14.5 : 24;
  const d = wrapText(x, sc.deck, leftW, `300 ${ds}px ${SANS}`, ds, 1.5);
  x.font = `300 ${ds}px ${SANS}`; x.fillStyle = DIM;
  d.lines.forEach((line, k) => x.fillText(line, pad, y + k * ds * 1.5));
  y += d.height + (narrow ? 26 : 40);

  const b1 = chip(x, pad, y, BRAND.startLabel, { solid: true, accent: '#d4a84b', size: narrow ? 11 : 15, padX: narrow ? 16 : 22, h: narrow ? 42 : 50 });
  hot.push({ ...b1, action: { type: 'station', i: 1 } });
  if (narrow) {
    /* a 300px card cannot hold two chips side by side — stack them */
    const b2 = chip(x, pad, y + b1.h + 10, BRAND.textLabel, { solid: false, accent: '#d4a84b', size: 11, padX: 16, h: 42 });
    hot.push({ ...b2, action: { type: 'reader', id: 'cover' } });
    y += b1.h + 10 + 42 + 24;
  } else {
    const b2 = chip(x, pad + b1.w + 12, y, BRAND.textLabel, { solid: false, accent: '#d4a84b', size: 15, padX: 22, h: 50 });
    hot.push({ ...b2, action: { type: 'reader', id: 'cover' } });
    y += 50 + 34;
  }

  /* the seven scenes as an index — the cover doubles as the table of contents */
  if (!narrow) {
    const ix = 544, iy0 = pad + 96, rowH = 62;
    kicker(x, 'The scenes', ix, iy0, { color: MUTE, size: 12, sp: 2.4 });
    x.strokeStyle = 'rgba(244,239,230,.1)'; x.lineWidth = 1;
    x.beginPath(); x.moveTo(528, pad + 86); x.lineTo(528, iy0 + rowH * (total - 1) + 8); x.stroke();
    SCENES.slice(1).forEach((s2, k) => {
      const cy = iy0 + 30 + rowH * k;
      x.save();
      x.font = `500 26px ${SERIF}`;
      x.textAlign = 'right';
      x.fillStyle = ACCENT[s2.id] || accent;
      x.fillText(s2.num, ix + 26, cy + 4);
      x.restore();
      x.font = `500 16px ${SANS}`;
      x.fillStyle = 'rgba(244,239,230,.82)';
      x.fillText(s2.en, ix + 42, cy);
      x.font = `400 11px "Noto Sans KR", ${SANS}`;
      x.fillStyle = MUTE;
      x.fillText(s2.kr, ix + 42, cy + 15);
      x.strokeStyle = 'rgba(244,239,230,.06)';
      x.beginPath(); x.moveTo(ix, cy + 30); x.lineTo(W - pad, cy + 30); x.stroke();
      hot.push({ x: ix - 6, y: cy - 24, w: W - pad - ix + 12, h: 50, action: { type: 'station', i: k + 1 } });
    });
  }

  /* ecosystem row */
  x.strokeStyle = 'rgba(244,239,230,.1)'; x.lineWidth = 1;
  x.beginPath(); x.moveTo(pad, y); x.lineTo(W - pad, y); x.stroke();
  y += narrow ? 20 : 26;
  kicker(x, 'The ecosystem', pad, y, { color: MUTE, size: narrow ? 8.5 : 11.5, sp: 2 });
  y += narrow ? 14 : 20;
  x.font = `400 ${narrow ? 10 : 14}px ${MONO}`;
  const eco = ['S21 Phone Hub', 'Log', 'Faith', 'Piano', 'MetalCare', 'GitHub'];
  const hrefs = [
    'https://helena751107.github.io/helena_phone/', '', 'https://helena751107.github.io/helena-faith/',
    'https://helena751107.github.io/helena-piano/', 'https://helena751107.github.io/helena-metalcare/',
    'https://github.com/helena751107/helana_log'
  ];
  let ex = pad;
  eco.forEach((label, k) => {
    const w = x.measureText(label).width + 16;
    if (ex + w > W - pad) { ex = pad; y += narrow ? 22 : 26; }
    if (hrefs[k]) hot.push({ x: ex - 6, y: y - 14, w, h: 24, action: { type: 'href', href: hrefs[k] } });
    x.fillStyle = k === 1 ? accent : 'rgba(244,239,230,.42)';
    x.fillText(label, ex + 2, y);
    ex += w;
  });
  y += narrow ? 34 : 50;

  x.font = `italic 400 ${narrow ? 11.5 : 16}px ${SERIF}`;
  x.fillStyle = 'rgba(244,239,230,.42)';
  x.fillText(sc.note, pad, y);
  y += narrow ? 16 : 24;

  if (!narrow) y = Math.max(y, 700);
  return finish(canvas, W, H, y + pad * (narrow ? 0.85 : 0.5), accent, hot);
}

/* ── inspector: one entity, its line, its scene ─────────────────── */
export function inspectorTexture(node, rels, narrow) {
  const W = narrow ? 252 : 430, pad = narrow ? 20 : 34, H = 1200;
  const { canvas, ctx: x } = surface(W, H);
  const accent = COL[node.cls] || '#d4a84b';
  const hot = [];
  let y = pad + 20;

  const chap = SCENES.find((s) => s.id === node.chapter);
  const kickTxt = `${node.cls || 'Entity'}${chap ? ` · scene ${chap.num}` : ''}`;
  kicker(x, kickTxt, pad, y, { color: accent, size: narrow ? 10 : 13, sp: 2.2, maxW: W - pad * 2 - 84 });
  const close = pill(x, W - pad - 76, y - 24, 'Close', { accent: MUTE, size: narrow ? 9 : 11 });
  hot.push({ ...close, action: { type: 'close' } });
  y += narrow ? 26 : 34;

  x.font = `500 ${narrow ? 22 : 34}px ${SERIF}`;
  x.fillStyle = INK;
  const t = wrapText(x, node.label, W - pad * 2, `500 ${narrow ? 22 : 34}px ${SERIF}`, narrow ? 22 : 34, 1.08);
  t.lines.forEach((line, k) => x.fillText(line, pad, y + k * (narrow ? 24 : 37)));
  y += t.height + (narrow ? 10 : 16);

  if (node.kr) {
    x.font = `400 ${narrow ? 11 : 15}px "Noto Sans KR", ${SANS}`;
    x.fillStyle = MUTE;
    x.fillText(node.kr, pad, y);
    y += narrow ? 16 : 22;
  }

  x.strokeStyle = 'rgba(244,239,230,.1)'; x.lineWidth = 1;
  x.beginPath(); x.moveTo(pad, y); x.lineTo(W - pad, y); x.stroke();
  y += narrow ? 22 : 30;

  if (node.quote) {
    x.fillStyle = accent;
    x.fillRect(pad, y - 14, 2, 30);
    x.font = `italic 500 ${narrow ? 14 : 21}px ${SERIF}`;
    x.fillStyle = INK;
    const q = wrapText(x, node.quote, W - pad * 2 - 14, `italic 500 ${narrow ? 14 : 21}px ${SERIF}`, narrow ? 14 : 21, 1.4);
    q.lines.forEach((line, k) => x.fillText(line, pad + 12, y + k * (narrow ? 20 : 29)));
    y += q.height + (narrow ? 14 : 20);
  }

  if (node.desc && node.desc !== node.kr) {
    const ds = narrow ? 12 : 17;
    const dd = wrapText(x, node.desc, W - pad * 2, `300 ${ds}px ${SANS}`, ds, 1.5);
    x.font = `300 ${ds}px ${SANS}`; x.fillStyle = DIM;
    dd.lines.forEach((line, k) => x.fillText(line, pad, y + k * ds * 1.5));
    y += dd.height + (narrow ? 14 : 20);
  }

  if (rels && rels.length) {
    kicker(x, 'Linked', pad, y, { color: MUTE, size: narrow ? 9 : 11.5, sp: 1.8 });
    y += narrow ? 16 : 22;
    rels.slice(0, 5).forEach((r) => {
      x.font = `400 ${narrow ? 10.5 : 14}px ${MONO}`;
      const arrow = r.dir === 'out' ? '→' : '←';
      x.fillStyle = RELCOL[r.rel] || 'rgba(244,239,230,.55)';
      x.fillText(arrow, pad, y);
      x.fillStyle = 'rgba(244,239,230,.55)';
      const txt = r.node.label;
      const clipped = txt.length > (narrow ? 26 : 40) ? txt.slice(0, narrow ? 25 : 39) + '…' : txt;
      x.fillText(clipped, pad + (narrow ? 14 : 20), y);
      y += narrow ? 15 : 21;
      hot.push({ x: pad - 6, y: y - (narrow ? 27 : 36), w: W - pad * 2, h: narrow ? 20 : 28, action: { type: 'node', id: r.node.id } });
    });
    y += narrow ? 6 : 10;
  }

  x.font = `400 ${narrow ? 9.5 : 12.5}px ${MONO}`;
  x.fillStyle = MUTE;
  const tail = chap ? `in ${chap.kr} · ${chap.en.toLowerCase()}` : `source: ${node.ref || '—'}`;
  x.fillText(fit(x, tail, W - pad * 2), pad, y + (narrow ? 14 : 18));
  y += narrow ? 30 : 42;

  const Hn = Math.max(220, Math.round(y + pad));
  const out = surface(W, Hn, ssOf(W, Hn));
  const o = out.ctx;
  card(o, W, Hn, accent);
  o.drawImage(canvas, 0, 0, W * (canvas.width / W), Hn * (canvas.height / 1200), 0, 0, W, Hn);
  return { canvas: out.canvas, w: W, h: Hn, hotspots: hot };
}

/* ── frame: brand, progress dots, text switch (attached to camera) ─ */
export function chromeTexture({ idx, total, label, narrow }) {
  const W = narrow ? 640 : 1280, H = narrow ? 118 : 64;
  const { canvas, ctx: x } = surface(W, H);
  const hot = [];

  const base = narrow ? 28 : 42;
  const bsize = narrow ? 20 : 23;
  x.font = `500 ${bsize}px ${SERIF}`;
  x.fillStyle = 'rgba(244,239,230,.86)';
  const a = 'How Helena ';
  const aw = x.measureText(a).width;
  x.fillText(a, 0, base);
  x.font = `italic 400 ${bsize}px ${SERIF}`;
  x.fillStyle = ACCENT.cover;
  x.fillText('Lives', aw, base);
  const brandW = aw + x.measureText('Lives').width;
  hot.push({ x: -10, y: base - 24, w: brandW + 20, h: 34, action: { type: 'station', i: 0 } });

  const step = narrow ? 26 : 26;
  let dx = narrow ? 0 : Math.round(W / 2 - ((total - 1) * step + 26) / 2);
  const dotY = narrow ? 60 : 26;
  for (let k = 0; k < total; k++) {
    if (k === idx) {
      rr(x, dx, dotY - 3.5, 26, 7, 3.5);
      x.fillStyle = ACCENT.cover; x.fill();
      hot.push({ x: dx - 6, y: dotY - 16, w: 38, h: 32, action: { type: 'station', i: k } });
      dx += 26 + (step - 7);
    } else {
      x.beginPath(); x.arc(dx + 3.5, dotY, 3, 0, Math.PI * 2);
      x.fillStyle = 'rgba(244,239,230,.3)'; x.fill();
      hot.push({ x: dx - 9, y: dotY - 16, w: 26, h: 32, action: { type: 'station', i: k } });
      dx += step;
    }
  }

  x.font = `400 ${narrow ? 11 : 10.5}px ${MONO}`;
  x.fillStyle = 'rgba(244,239,230,.42)';
  const numTxt = `${String(idx).padStart(2, '0')} / ${String(total - 1).padStart(2, '0')}`;
  if (narrow) {
    /* the scene name sits under the dots, mirroring the wide layout */
    if (label) kicker(x, label, 0, 96, { color: 'rgba(244,239,230,.32)', size: 11, sp: 2.2, maxW: W - 160 });
    x.font = `400 11px ${MONO}`;
    x.fillStyle = 'rgba(244,239,230,.45)';
    x.fillText(numTxt, W - x.measureText(numTxt).width, 96);
  } else {
    const lab = String(label || '').toUpperCase();
    x.fillStyle = 'rgba(244,239,230,.32)';
    x.fillText(lab, Math.round(W / 2 - x.measureText(lab).width / 2), 54);
    x.fillStyle = 'rgba(244,239,230,.45)';
    x.fillText(numTxt, W - 84 - x.measureText(numTxt).width, 42);
  }

  const t = pill(x, W - 72, narrow ? 2 : 14, 'Text', { accent: '#b5a999', size: narrow ? 9.5 : 10, h: narrow ? 28 : 28 });
  hot.push({ ...t, action: { type: 'reader', id: null } });

  return { canvas, w: W, h: H, hotspots: hot };
}

/* ── the giant numeral that sits behind a card (depth typography) ── */
export function numeralTexture(sc, idx) {
  const W = 512, H = 640;
  const { canvas, ctx: x } = surface(W, H);
  const accent = ACCENT[sc.id] || '#d4a84b';

  x.save();
  const g = x.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, accent + 'aa');
  g.addColorStop(0.55, accent + '55');
  g.addColorStop(1, accent + '0a');
  x.fillStyle = g;
  x.font = `500 520px ${SERIF}`;
  x.textAlign = 'center';
  x.fillText(sc.num, W / 2, H * 0.72);
  x.restore();

  return { canvas, w: W, h: H };
}
