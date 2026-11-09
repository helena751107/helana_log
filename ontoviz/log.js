/* HOW HELENA LIVES — the page itself is the WebGPU scene.
 *
 * Eight stations walked by scroll: cover, five scenes, the record, the doors.
 * Each station is an editorial card painted into a CanvasTexture, flanked by
 * the entities of that scene as GPU glows. Typography, buttons and the frame
 * are 3D planes with UV hotspots — no HTML sits over the canvas.
 *
 * Renderer: three.js WebGPURenderer (GPU compute graph) with WebGL2 fallback.
 * If neither starts, the plain webzine returns unchanged.
 */
/* three is fetched only when the GPU page actually opens: ?text must stay a
   plain document and never pay for a 3.8 MB renderer. */
let THREE = null, createGraph = null;
import { NODES, LINKS, COL, SECTIONS, SCENES, RELCOL, RELALPHA, BRAND, GAP } from './ontology.js';
import { loadFonts, coverTexture, chapterTexture, inspectorTexture, chromeTexture, numeralTexture } from './panels.js';

const MODE_KEY = 'hl-mode';
const zOf = (i) => -i * GAP;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const norm = (s) => String(s || '').replace(/\s+/g, ' ').trim();

let inst = null;

export async function initOnto(opts = {}) {
  if (inst) return inst.api;
  const html = document.documentElement;
  const params = new URLSearchParams(location.search);
  const touch = matchMedia('(pointer: coarse)').matches;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const startReader = params.has('text') || params.get('mode') === 'reader';
  const narrow = innerWidth / innerHeight < 0.9;
  const TOTAL = SCENES.length;
  /* logical width of the cards — height always follows the painted texture */
  const DIM = { cover: [narrow ? 300 : 780], card: [narrow ? 300 : 780] };

  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  if (startReader) {
    html.removeAttribute('data-onto');
    inst = { api: stubApi(html) };
    return inst.api;
  }

  try { await loadFonts(); } catch (e) {}
  html.setAttribute('data-onto', 'on');

  /* ── shell: a scroll surface and one fixed WebGPU canvas ───────── */
  const root = document.createElement('div');
  root.className = 'onto';
  root.id = 'onto';
  root.innerHTML = `<div id="ontoGl" aria-hidden="true"></div>
    <a class="ov-sr" href="?text">Read this page as text instead</a>
    <div class="ov-scroll" aria-hidden="true"></div>`;
  document.body.appendChild(root);
  const glHost = root.querySelector('#ontoGl');
  const scrollEl = root.querySelector('.ov-scroll');
  scrollEl.style.height = `${TOTAL * 100}vh`;

  const stepPx = () => {
    const h = scrollEl.getBoundingClientRect().height / TOTAL;
    return h > 10 ? h : Math.max(1, innerHeight);
  };
  const stationY = (i) => Math.round(i * stepPx());

  /* ── layout: one constellation per station, a spine through all ── */
  const P = layoutPositions(narrow);
  const glNodes = NODES.map((n) => ({ ...n, x: P.get(n.id).x, y: P.get(n.id).y, z: P.get(n.id).z }));
  const glLinks = LINKS.map((l) => ({ source: l.source, target: l.target, rel: l.rel }));

  let G;
  try {
    if (!THREE) {
      THREE = await import('three/webgpu');
      ({ createGraph } = await import('./graph.js'));
    }
    G = await createGraph(glHost, { nodes: glNodes, links: glLinks });
  } catch (e) {
    console.warn('[onto] renderer unavailable:', e && e.message);
    root.remove();
    html.removeAttribute('data-onto');
    inst = { api: stubApi(html) };
    return inst.api;
  }

  const scene = G.scene(), camera = G.camera(), controls = G.controls();
  const renderer = G.renderer();
  controls.autoRotate = false;
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.enableRotate = false;          /* dragging pans the page, never the world */
  controls.enableDamping = true;
  G.U.rep.value = 520; G.U.len.value = 44; G.U.spring.value = 0.024; G.U.damp.value = 0.9; G.U.fireRate.value = 0.0016;

  /* the room: warm dark, fog for depth, a clear colour that matches the paper */
  renderer.setClearColor(0x0a0908, 1);
  scene.fog = new THREE.FogExp2(0x0a0908, 0.00026);

  const byId = new Map(NODES.map((n) => [n.id, n]));
  const dimOf = () => 1;
  const BIG = (n) => (n.hero ? 38 : n.chapterNode ? 26 : n.dust ? 2 + Math.random() * 1.4 : 10 + Math.sqrt(n.val || 1) * 3.6);

  function applyStyle() {
    G.nodeColor((n) => COL[n.cls] || '#d4a84b')
      .nodeAlpha((n) => (n.dust ? 0.22 : n.hero ? 0.95 : 0.9))
      .nodeSize(BIG)
      .nodeHot(() => 0)
      .linkColor((l) => RELCOL[l.rel] || '#b5a999')
      .linkAlpha((l) => (l.rel === 'chapter' ? 0.035 : RELALPHA[l.rel] ?? 0.12))
      .linkDirectionalParticles((l) => (l.rel === 'flow' ? 1 : 0))
      .restyle();
  }
  applyStyle();
  G.setTargets((n) => {
    const p = P.get(n.id);
    return p ? [p.x, p.y, p.z, n.dust ? 0.55 : 0.92] : null;
  });

  /* ── stage light behind each card ─────────────────────────────── */
  const haloTex = (() => {
    const c = document.createElement('canvas');
    c.width = c.height = 512;
    const x = c.getContext('2d');
    const g = x.createRadialGradient(256, 256, 8, 256, 256, 254);
    g.addColorStop(0, 'rgba(255,255,255,.85)');
    g.addColorStop(0.35, 'rgba(255,255,255,.24)');
    g.addColorStop(0.72, 'rgba(255,255,255,.05)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, 512, 512);
    return new THREE.CanvasTexture(c);
  })();
  SCENES.forEach((sc, i) => {
    const m = new THREE.SpriteMaterial({
      map: haloTex, color: new THREE.Color(ACCENT_OF(sc.id)), transparent: true,
      opacity: i === 0 ? 0.3 : 0.24, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false
    });
    const s = new THREE.Sprite(m);
    s.position.set(0, 90, zOf(i) - 300);
    s.scale.set(1900, 1250, 1);
    s.renderOrder = 1;
    scene.add(s);
  });

  /* ── 3D typography ────────────────────────────────────────────── */
  const panels = [];
  function setTexture(mesh, tex) {
    const m = mesh.material;
    if (m.map) m.map.dispose();
    const t = new THREE.CanvasTexture(tex.canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = Math.min(8, renderer.getMaxAnisotropy ? renderer.getMaxAnisotropy() : 8);
    m.map = t;
    m.needsUpdate = true;
    mesh.userData.tex = tex;
    mesh.userData.hotspots = tex.hotspots || [];
  }
  function addPanel(tex, w, h, x, y, z, kind, opts2 = {}) {
    const t = new THREE.CanvasTexture(tex.canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = Math.min(8, renderer.getMaxAnisotropy ? renderer.getMaxAnisotropy() : 8);
    const mat = new THREE.MeshBasicMaterial({
      map: t, transparent: true, depthWrite: false, toneMapped: false, opacity: 1,
      depthTest: opts2.depthTest !== false, fog: opts2.fog !== false
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    mesh.position.set(x, y, z);
    mesh.renderOrder = opts2.renderOrder || 4;
    mesh.userData = { tex, hotspots: tex.hotspots || [], w, h, gw: w, gh: h, kind };
    scene.add(mesh);
    panels.push(mesh);
    return mesh;
  }

  const cover = SCENES[0];
  const coverTex = coverTexture(cover, TOTAL, narrow);
  const coverMesh = addPanel(coverTex, DIM.cover[0], DIM.cover[0] * coverTex.h / coverTex.w, 0, 90, zOf(0), 'cover');
  const cardMeshes = SCENES.slice(1).map((sc, k) => {
    const tex = chapterTexture(sc, k + 1, TOTAL, narrow);
    return addPanel(tex, DIM.card[0], DIM.card[0] * tex.h / tex.w, 0, 90, zOf(k + 1), 'card');
  });
  const cards = [coverMesh, ...cardMeshes];

  /* depth typography: the scene numeral floats behind its card and peeks past
     the edge, so the page has a middle distance as well as a front plane */
  if (!narrow) {
    SCENES.forEach((sc, i) => {
      const tex = numeralTexture(sc, i);
      const t = new THREE.CanvasTexture(tex.canvas);
      t.colorSpace = THREE.SRGBColorSpace;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(540, (540 * tex.h) / tex.w),
        new THREE.MeshBasicMaterial({ map: t, transparent: true, opacity: 0.42, depthWrite: false, toneMapped: false, fog: true }));
      m.position.set(i % 2 ? 520 : -520, 246, zOf(i) - 210);
      m.renderOrder = 2;
      scene.add(m);
    });
  }

  const ins0 = inspectorTexture(byId.get('meds'), [], narrow);
  const insMesh = addPanel(ins0, 400, 400 * ins0.h / ins0.w, 0, 90, 60, 'ins', { renderOrder: 8 });
  insMesh.visible = false;

  /* frame: brand + progress + text switch, riding on the camera */
  scene.add(camera);
  let chromeTex = chromeTexture({ idx: 0, total: TOTAL, label: SCENES[0].en, narrow });
  const chromeMat = new THREE.MeshBasicMaterial({
    map: new THREE.CanvasTexture(chromeTex.canvas), transparent: true, depthTest: false,
    depthWrite: false, toneMapped: false, fog: false, opacity: 0.94
  });
  chromeMat.map.colorSpace = THREE.SRGBColorSpace;
  const chrome = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), chromeMat);
  chrome.position.set(0, 0, -1000);
  chrome.renderOrder = 30;
  chrome.userData = { tex: chromeTex, hotspots: chromeTex.hotspots, w: chromeTex.w, h: chromeTex.h, kind: 'chrome' };
  camera.add(chrome);

  function sizeChrome() {
    const d = 1000, tan = Math.tan(((camera.fov || 42) * Math.PI) / 360);
    const visH = 2 * tan * d, visW = visH * camera.aspect;
    const w = visW * 0.92;
    const h = (w * chromeTex.h) / chromeTex.w;
    chrome.scale.set(w, h, 1);
    chrome.userData.gw = w; chrome.userData.gh = h;
    chrome.position.set(0, visH / 2 - h / 2 - visH * 0.05, -d);
  }
  function updateChrome(i) {
    chromeTex = chromeTexture({ idx: i, total: TOTAL, label: SCENES[i].en, narrow });
    setTexture(chrome, chromeTex);
    chromeMat.opacity = 0.94;
    sizeChrome();
  }

  /* hover highlight */
  const hl = new THREE.Mesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({ color: 0xf0c75e, transparent: true, opacity: 0.12, depthWrite: false, depthTest: false, toneMapped: false })
  );
  hl.renderOrder = 31; hl.visible = false; scene.add(hl);
  function showHighlight(mesh, spot) {
    const d = mesh.userData;
    const gw = d.gw || d.w, gh = d.gh || d.h;
    const fx = (spot.x + spot.w / 2) / d.tex.w, fy = (spot.y + spot.h / 2) / d.tex.h;
    const w = (gw * spot.w) / d.tex.w, h = (gh * spot.h) / d.tex.h;
    hl.position.copy(mesh.localToWorld(new THREE.Vector3((fx - 0.5) * gw, (0.5 - fy) * gh, 0.6)));
    hl.quaternion.copy(mesh.getWorldQuaternion(new THREE.Quaternion()));
    hl.scale.set(w, h, 1);
    hl.visible = true;
  }
  const hideHighlight = () => { hl.visible = false; };

  /* ── camera stations ──────────────────────────────────────────── */
  let current = -1, selected = null, paused = false;
  const dimOfStation = (i) => [cards[i].userData.w, cards[i].userData.h];
  /* The card sits low in the frame: the top band belongs to the frame chrome,
     the bottom edge almost touches the screen edge. One distance for every
     station, so the page never re-scales between scenes. */
  const TOP = narrow ? 46 : 62;
  let frameD = 900;
  function computeFrameD() {
    const aspect = Math.max(0.3, innerWidth / innerHeight);
    const tan = Math.tan(((camera.fov || 42) * Math.PI) / 360);
    let d = 300;
    for (let i = 0; i < TOTAL; i++) {
      const [w, h] = dimOfStation(i);
      d = Math.max(d,
        ((h / 2 + TOP) * 1.04) / tan,
        ((h / 2 - TOP) * 1.05) / (tan * 0.72),
        (w * 1.06) / (2 * tan * aspect));
    }
    frameD = d;
  }
  function frameFor(i) {
    const d = frameD || 900;
    return { pos: { x: 0, y: 90 + TOP, z: zOf(i) + d }, look: { x: 0, y: 90 + TOP, z: zOf(i) } };
  }

  let fadeRaf = 0;
  function arrive(mesh, to) {
    if (!mesh) return;
    cancelAnimationFrame(fadeRaf);
    if (reduce) { mesh.material.opacity = to; return; }
    const t0 = performance.now();
    mesh.material.opacity = 0;
    const step = () => {
      const k = Math.min(1, (performance.now() - t0) / 150);
      mesh.material.opacity = to * (0.25 + 0.75 * k);
      if (k < 1) fadeRaf = requestAnimationFrame(step);
      else mesh.material.opacity = to;
    };
    fadeRaf = requestAnimationFrame(step);
  }

  function reframe(i = current) {
    if (i < 0) return;
    const f = frameFor(i);
    G.cameraPosition(f.pos, f.look, 0);
    arrive(cards[i], selected ? 0.14 : 1);
    updateChrome(i);
  }

  function go(i) {
    hideHighlight();
    i = clamp(i, 0, TOTAL - 1);
    if (i === current) return;
    current = i;
    deselect();
    reframe(i);
    try { history.replaceState(null, '', location.pathname + location.search + '#' + SECTIONS[i]); } catch (e) {}
  }

  /* ── scroll ⇄ camera agreement (the proven model) ─────────────── */
  let settling = false, settleTo = 0, settleT = 0, idleT = 0;

  function settleToStation(i, smooth = true) {
    const y = stationY(i);
    if (i !== current) go(i);
    if (Math.abs(scrollY - y) < 1) { settling = false; return; }
    settleTo = y; settling = true;
    clearTimeout(settleT);
    if (!smooth) { window.scrollTo(0, y); settleT = setTimeout(() => { settling = false; }, 90); return; }
    const from = scrollY, d = y - from, t0 = performance.now();
    const tick = () => {
      if (!settling) return;
      const k = Math.min(1, (performance.now() - t0) / 420);
      const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      window.scrollTo(0, Math.round(from + d * e));
      if (k < 1) requestAnimationFrame(tick); else settling = false;
    };
    requestAnimationFrame(tick);
    settleT = setTimeout(() => { settling = false; }, 900);
  }
  const breakSettle = () => { settling = false; clearTimeout(settleT); };
  const jumpTo = (i) => { clearTimeout(idleT); settleToStation(i, false); };

  /* ── selection ────────────────────────────────────────────────── */
  function fitInspector(tex) {
    const w = Math.max(220, Math.min(narrow ? 250 : 420, cards[Math.max(0, current)].userData.w - (narrow ? 8 : 20)));
    const h = (w * tex.h) / tex.w;
    setTexture(insMesh, tex);
    insMesh.geometry.dispose();
    insMesh.geometry = new THREE.PlaneGeometry(w, h);
    insMesh.userData.w = w; insMesh.userData.h = h;
    insMesh.userData.hotspots = tex.hotspots;
  }
  function select(n) {
    if (!n || n.dust) return;
    hideHighlight();
    selected = n;
    G.fire(n);
    const rels = LINKS.filter((l) => l.source === n.id || l.target === n.id).map((l) => {
      const other = byId.get(l.source === n.id ? l.target : l.source);
      return other ? { node: other, rel: l.rel, dir: l.source === n.id ? 'out' : 'in' } : null;
    }).filter(Boolean);
    fitInspector(inspectorTexture(n, rels, narrow));
    insMesh.visible = true;
    insMesh.material.opacity = 1;
    insMesh.position.set(0, 90, zOf(Math.max(0, current)) + 4);
    cards.forEach((m, k) => { if (k === current) m.material.opacity = 0.14; });
    insMesh.scale.setScalar(0.94);
    const t0 = performance.now();
    const step = () => { const k = Math.min(1, (performance.now() - t0) / 240); insMesh.scale.setScalar(0.94 + 0.06 * k); if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }
  function deselect() {
    hideHighlight();
    selected = null;
    insMesh.visible = false;
    cards.forEach((m) => (m.material.opacity = 1));
  }

  /* ── reader mode: the plain webzine, with a way back ──────────── */
  function enterReader(secId) {
    try { localStorage.removeItem(MODE_KEY); } catch (e) {}
    html.removeAttribute('data-onto');
    try { history.replaceState(null, '', location.pathname + '?text' + (SECTIONS.includes(secId) ? '#' + secId : '')); } catch (e) {}
    root.style.display = 'none';
    G.pause(true);
    paused = true;
    backTo3D();
    const id = SECTIONS.includes(secId) ? secId : SECTIONS[Math.max(0, current)];
    const el = document.getElementById(id);
    if (el) {
      setTimeout(() => {
        const prev = html.style.scrollBehavior;
        html.style.scrollBehavior = 'auto';
        el.scrollIntoView({ behavior: 'auto', block: 'start' });
        html.style.scrollBehavior = prev;
      }, 60);
    }
  }

  /* map a hotspot centre back to screen px (used by the frame/MCP tools) */
  function screenOf(mesh, spot) {
    const d = mesh.userData, gw = d.gw || d.w, gh = d.gh || d.h;
    const fx = (spot.x + spot.w / 2) / d.tex.w, fy = (spot.y + spot.h / 2) / d.tex.h;
    const v = mesh.localToWorld(new THREE.Vector3((fx - 0.5) * gw, (0.5 - fy) * gh, 0)).project(camera);
    return { x: (v.x + 1) * innerWidth / 2, y: (1 - v.y) * innerHeight / 2 };
  }

  /* ── pointer ──────────────────────────────────────────────────── */
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const V3 = new THREE.Vector3();

  function hitPanel(cx, cy) {
    ndc.set((cx / innerWidth) * 2 - 1, -(cy / innerHeight) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const list = [chrome, insMesh, ...cards].filter((m) => m.visible && m.material.opacity > 0.25);
    const hits = raycaster.intersectObjects(list, false);
    for (const h of hits) {
      const m = h.object, d = m.userData;
      if (!h.uv || !d.tex) continue;
      const px = h.uv.x * d.tex.w, py = (1 - h.uv.y) * d.tex.h;
      const pad = touch ? 10 : 5;
      const spot = (d.hotspots || []).find((s) => px >= s.x - pad && px <= s.x + s.w + pad && py >= s.y - pad && py <= s.y + s.h + pad);
      if (spot) return { mesh: m, spot };
      return { mesh: m, spot: null };
    }
    return null;
  }

  function pickNode(cx, cy, rad = 18) {
    let best = null, bd = rad * rad;
    const w2 = innerWidth / 2, h2 = innerHeight / 2;
    for (const n of glNodes) {
      if (n.dust || typeof n.x !== 'number') continue;
      V3.set(n.x, n.y, n.z).project(camera);
      if (V3.z > 1) continue;
      const dx = (V3.x + 1) * w2 - cx, dy = (1 - V3.y) * h2 - cy, d = dx * dx + dy * dy;
      if (d < bd) { bd = d; best = n; }
    }
    return best;
  }

  function doAction(a) {
    if (!a) return;
    if (a.type === 'station') { jumpTo(a.i); return; }
    if (a.type === 'reader') return enterReader(a.id || SECTIONS[Math.max(0, current)]);
    if (a.type === 'node') { const n = byId.get(a.id); if (n) { const si = SECTIONS.indexOf(n.chapter); if (si >= 0 && si !== current) jumpTo(si); select(n); } return; }
    if (a.type === 'close') return deselect();
    if (a.type === 'href') return window.open(a.href, '_blank', 'noopener');
  }

  const canvas = renderer.domElement;
  canvas.style.touchAction = 'pan-y';
  let down = null, lastHover = 0;

  canvas.addEventListener('pointerdown', (e) => { down = [e.clientX, e.clientY, performance.now()]; }, { passive: true });
  canvas.addEventListener('pointerup', (e) => {
    if (!down) return;
    const dx = e.clientX - down[0], dy = e.clientY - down[1];
    down = null;
    if (Math.hypot(dx, dy) > (touch ? 16 : 10)) {
      if (touch && Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.6) {
        jumpTo(clamp((current < 0 ? 0 : current) + (dx < 0 ? 1 : -1), 0, TOTAL - 1));
      }
      return;
    }
    hideHighlight();
    const hit = hitPanel(e.clientX, e.clientY);
    if (hit) {
      if (hit.spot) doAction(hit.spot.action);
      else if (hit.mesh.userData.kind !== 'chrome') deselect();
      return;
    }
    const n = pickNode(e.clientX, e.clientY, touch ? 32 : 20);
    if (n) select(n); else deselect();
  }, { capture: true });

  canvas.addEventListener('pointermove', (e) => {
    const now = performance.now();
    if (now - lastHover < 60) return;
    lastHover = now;
    const hit = hitPanel(e.clientX, e.clientY);
    if (hit && hit.spot) {
      canvas.style.cursor = 'pointer';
      showHighlight(hit.mesh, hit.spot);
    } else hideHighlight();
  }, { passive: true });
  canvas.addEventListener('pointerleave', hideHighlight);

  /* ── scroll · keys ────────────────────────────────────────────── */
  addEventListener('scroll', () => {
    if (paused) return;
    if (settling) { if (Math.abs(scrollY - settleTo) <= 2) settling = false; return; }
    const s = scrollY / stepPx();
    const cur = current < 0 ? 0 : current;
    if (s - cur > 0.52 || s - cur < -0.52) {
      const i = clamp(Math.round(s), 0, TOTAL - 1);
      if (i !== cur) go(i);
    }
    clearTimeout(idleT);
    idleT = setTimeout(snapIdle, 150);
  }, { passive: true });

  function snapIdle() {
    if (paused || settling || down) return;
    const s = scrollY / stepPx();
    const i = clamp(Math.round(s), 0, TOTAL - 1);
    if (Math.abs(scrollY - stationY(i)) <= 2) { if (i !== current) go(i); return; }
    settleToStation(i, true);
  }

  let stepT = 0;
  addEventListener('wheel', (e) => {
    if (paused || e.ctrlKey || e.metaKey) return;
    const notch = e.deltaMode === 1 || Math.abs(e.deltaY) >= 50;
    if (!notch) return;
    e.preventDefault();
    const now = performance.now();
    if (now - stepT < 90) return;
    stepT = now;
    clearTimeout(idleT);
    jumpTo(clamp((current < 0 ? 0 : current) + (e.deltaY > 0 ? 1 : -1), 0, TOTAL - 1));
  }, { passive: false });

  addEventListener('wheel', breakSettle, { passive: true, capture: true });
  addEventListener('touchstart', breakSettle, { passive: true, capture: true });
  addEventListener('pointerdown', breakSettle, { passive: true, capture: true });
  addEventListener('keydown', breakSettle, { capture: true });

  addEventListener('keydown', (e) => {
    const tag = (e.target && e.target.tagName) || '';
    if (/INPUT|TEXTAREA|SELECT/.test(tag)) return;
    const i = current < 0 ? 0 : current;
    if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
      e.preventDefault(); jumpTo(clamp(i + 1, 0, TOTAL - 1));
    } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
      e.preventDefault(); jumpTo(clamp(i - 1, 0, TOTAL - 1));
    } else if (e.key === 'Home') { e.preventDefault(); window.scrollTo(0, 0); go(0); }
    else if (e.key === 'End') { e.preventDefault(); jumpTo(TOTAL - 1); }
    else if (e.key === 'Escape') deselect();
  });

  let rz = 0;
  addEventListener('resize', () => {
    clearTimeout(rz);
    rz = setTimeout(() => {
      if (paused) return;
      computeFrameD();
      reframe(current);
    }, 160);
  });

  /* ── pointer parallax: the scene has depth, so let the hand feel it ── */
  let mx = 0, my = 0, px = 0, py = 0;
  addEventListener('pointermove', (e) => {
    mx = (e.clientX / innerWidth - 0.5) * 2;
    my = (e.clientY / innerHeight - 0.5) * 2;
  }, { passive: true });
  function parallaxTick() {
    if (paused) return;
    px += (mx - px) * 0.055;
    py += (my - py) * 0.055;
    if (Math.abs(px) + Math.abs(py) < 0.0006) { requestAnimationFrame(parallaxTick); return; }
    if (current >= 0) {
      const f = frameFor(current);
      G.cameraPosition({ x: f.pos.x - px * 16, y: f.pos.y - py * 11, z: f.pos.z }, { x: f.look.x - px * 5, y: f.look.y - py * 4, z: f.look.z }, 0);
    }
    requestAnimationFrame(parallaxTick);
  }

  /* ── boot ─────────────────────────────────────────────────────── */
  sizeChrome();
  computeFrameD();
  const linked = Math.max(0, SECTIONS.indexOf(decodeURIComponent((location.hash || '').slice(1))));
  current = 0;
  const bootFrame = frameFor(0);
  G.cameraPosition(bootFrame.pos, bootFrame.look, 0);
  updateChrome(0);
  if (linked > 0) jumpTo(linked);
  requestAnimationFrame(parallaxTick);

  addEventListener('hashchange', () => {
    const i = SECTIONS.indexOf(decodeURIComponent((location.hash || '').slice(1)));
    if (i < 0 || i === current) return;
    jumpTo(i);
  });

  /* the frame must survive a landscape⇄portrait flip */
  addEventListener('resize', () => setTimeout(sizeChrome, 180));

  /* ── public API (WebMCP) ──────────────────────────────────────── */
  const api = {
    enter({ section } = {}) {
      if (html.getAttribute('data-onto') !== 'on') {
        html.setAttribute('data-onto', 'on');
        root.style.display = '';
        try { localStorage.setItem(MODE_KEY, 'ontology'); } catch (e) {}
        window.scrollTo(0, 0);
        G.pause(false); paused = false;
        requestAnimationFrame(parallaxTick);
        go(0);
      }
      if (section) { const i = SECTIONS.indexOf(section); if (i >= 0) jumpTo(i); }
      return api.state();
    },
    exit({ section } = {}) { enterReader(section); return api.state(); },
    focus({ target } = {}) {
      const q = norm(target).toLowerCase();
      if (!q) return { ok: false, note: 'target required' };
      const n = NODES.find((x) => !x.dust && x.id === target)
        || NODES.find((x) => !x.dust && `${x.id} ${x.label}`.toLowerCase() === q)
        || NODES.find((x) => !x.dust && `${x.id} ${x.label} ${x.kr || ''}`.toLowerCase().includes(q))
        || NODES.find((x) => !x.dust && `${x.desc || ''} ${x.quote || ''}`.toLowerCase().includes(q));
      if (!n) {
        const si = SECTIONS.findIndex((s) => s === q || s.includes(q));
        if (si >= 0) { jumpTo(si); return { ok: true, section: SECTIONS[si], station: si }; }
        return { ok: false, note: `no node or scene matches "${target}"` };
      }
      const si = SECTIONS.indexOf(n.chapter);
      if (si >= 0) jumpTo(si);
      select(n);
      return { ok: true, node: n.id, label: n.label, class: n.cls, station: si, section: SECTIONS[si] };
    },
    camera({ preset } = {}) {
      if (preset === 'overview') { G.cameraPosition({ x: 520, y: 900, z: 1500 }, { x: 0, y: 120, z: -2600 }, 1200); return true; }
      if (preset) { const i = SECTIONS.indexOf(preset); if (i >= 0) { jumpTo(i); return true; } }
      return false;
    },
    pause() { G.pause(true); paused = true; return true; },
    resume() { if (html.getAttribute('data-onto') !== 'on') return false; G.pause(false); paused = false; requestAnimationFrame(parallaxTick); return true; },
    renderAt({ t } = {}) {
      const idx = typeof t === 'number' ? (t <= 1 ? Math.round(t * (TOTAL - 1)) : clamp(Math.round(t), 0, TOTAL - 1)) : (current < 0 ? 0 : current);
      if (current !== idx) go(idx); else reframe(idx);
      G.renderOnce(typeof t === 'number' ? t * 9 + 3 : 6);
      return api.state();
    },
    state() {
      return {
        mode: html.getAttribute('data-onto') === 'on' ? 'ontology' : 'reader',
        section: current < 0 ? 'cover' : SECTIONS[current],
        station: current,
        backend: G.backend,
        nodes: NODES.length,
        relations: LINKS.length,
        selected: selected ? selected.id : null,
        paused,
        fps: G.stats().fps
      };
    },
    sections() { return SCENES.map((s) => ({ id: s.id, num: s.num, label: s.en, kr: s.kr, station: s.station })); },
    nodes() { return NODES.filter((n) => !n.dust).map((n) => ({ id: n.id, label: n.label, class: n.cls, scene: n.chapter })); },
    relations() { return LINKS.map((l) => ({ source: l.source, target: l.target, relation: l.rel })); },
    stats() { return { ...G.stats() }; }
  };

  window.__onto = { api, graph: G, panels, cards, chrome, go, select, jumpTo, P, get frameD() { return frameD; }, hit: hitPanel, screenOf };
  inst = { api };
  return api;
}

/* ── palette per scene (stage light) ─────────────────────────────── */
function ACCENT_OF(id) {
  return {
    cover: '#d4a84b', daily: '#f0c75e', faith: '#8fb3c9', music: '#8b7cf0',
    care: '#3db8a8', systems: '#e85d4c', record: '#f4efe6', doors: '#b5a999'
  }[id] || '#d4a84b';
}

/* ── layout: a spine of scenes, a constellation at each stop ───── */
function layoutPositions(narrow) {
  const P = new Map();
  const dz = GAP;
  SCENES.forEach((sc, i) => {
    const z = -i * dz;
    const side = i % 2 ? 1 : -1;
    if (!i) {
      P.set('helena', narrow ? { x: 0, y: 540, z: -300 } : { x: -640, y: 210, z: -60 });
      return;
    }
    P.set('ch.' + sc.id, narrow
      ? { x: side * 236, y: 320 - (i % 3) * 34, z: z - 130 }
      : { x: side * 592, y: 300 - (i % 3) * 40, z: z - 120 });
    sc.items.forEach((it, k) => {
      const s2 = k % 2 ? 1 : -1, row = Math.floor(k / 2);
      P.set(it.id, narrow
        ? { x: s2 * (168 + (row % 2) * 28), y: 320 - row * 112, z: z - 80 - row * 44 }
        : { x: s2 * (468 + (row % 2) * 46), y: 330 - row * 116, z: z - 100 - row * 52 });
    });
  });
  NODES.forEach((n) => {
    if (n.dust) { P.set(n.id, { x: n.x || 0, y: n.y || 0, z: n.z || 0 }); return; }
    if (!P.has(n.id)) P.set(n.id, { x: 0, y: 200, z: -200 });
  });
  return P;
}

/* ── reader-mode API (3D not started) ───────────────────────────── */
function backTo3D() {
  if (document.getElementById('ontoBack')) return;
  const a = document.createElement('a');
  a.id = 'ontoBack';
  a.href = location.pathname + (location.hash || '#cover');
  a.setAttribute('aria-label', 'Open the interactive 3D record');
  a.innerHTML = '<span aria-hidden="true">◈</span> Open the 3D record';
  a.style.cssText =
    'position:fixed;right:16px;bottom:16px;z-index:99999;display:inline-flex;align-items:center;gap:9px;' +
    'padding:13px 19px;border-radius:999px;background:#0a0908;border:1px solid rgba(212,168,75,.6);' +
    'color:#f0c75e;font:600 11px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.16em;' +
    'text-transform:uppercase;text-decoration:none;box-shadow:0 12px 34px rgba(0,0,0,.65)';
  document.body.appendChild(a);
}

function stubApi(html) {
  const state = () => ({
    mode: 'reader',
    section: (location.hash || '#cover').slice(1),
    station: -1, backend: null, nodes: NODES.length, relations: LINKS.length,
    selected: null, paused: true, fps: 0
  });
  backTo3D();
  return {
    enter() {
      try { localStorage.removeItem(MODE_KEY); } catch (e) {}
      location.replace(location.pathname + (location.hash || '#cover'));
      return state();
    },
    exit() { return state(); },
    focus() { return { ok: false, note: 'reader mode — call onto.enter first' }; },
    camera() { return false; },
    pause() { return true; },
    resume() { return false; },
    renderAt() { return state(); },
    state,
    sections() { return SCENES.map((s) => ({ id: s.id, num: s.num, label: s.en, kr: s.kr, station: s.station })); },
    nodes() { return NODES.filter((n) => !n.dust).map((n) => ({ id: n.id, label: n.label, class: n.cls, scene: n.chapter })); },
    relations() { return LINKS.map((l) => ({ source: l.source, target: l.target, relation: l.rel })); },
    stats() { return { backend: null, fps: 0 }; }
  };
}
