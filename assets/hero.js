// Hero: one markets-meets-math object per visit, drawn as a rotatable wire figure.
// Drag or arrow keys rotate; Space pauses; "Show another" or returning to About reshuffles.
(() => {
  const canvas = document.getElementById('hero-canvas');
  const stage = document.getElementById('hero-stage');
  if (!(canvas instanceof HTMLCanvasElement) || !stage) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const nameEl = document.getElementById('hero-name');
  const tagEl = document.getElementById('hero-tag');
  const eqEl = document.getElementById('hero-eq');
  const hintEl = document.getElementById('hero-hint-text');
  const nextBtn = document.getElementById('hero-next');
  const about = document.getElementById('about');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (window.matchMedia('(pointer: coarse)').matches && hintEl) hintEl.textContent = 'Drag to rotate';

  const INK = [29, 28, 26], ACC = [123, 43, 35];

  // ---------- random helpers ----------
  const rnd = Math.random;
  function gauss() { let u = 0, v = 0; while (!u) u = rnd(); while (!v) v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }

  // Each builder returns { lines: [{ p: number[] (xyz...), c: 0 ink | 1 accent, w?: weight }], yaw, pitch }
  // Coordinates are roughly within [-1, 1].
  const objects = {
    brownian: {
      name: 'Brownian paths, settling into a Gaussian',
      tag: 'Random walk',
      eq: 'dX<sub>t</sub> = σ dW<sub>t</sub> &nbsp;⇒&nbsp; X<sub>T</sub> ∼ 𝒩(0, σ<sup>2</sup>T)',
      label: 'Brownian motion sample paths fanning out over time, with the Gaussian density of their endpoints drawn as a surface at the final time.',
      build() {
        const lines = [], N = 28, S = 120, x0 = -1, x1 = 0.55, sc = 0.5;
        for (let n = 0; n < N; n++) {
          const z = -0.55 + 1.1 * (n / (N - 1));
          let w = 0; const p = [x0, 0, z];
          for (let s = 1; s <= S; s++) { w += gauss() * Math.sqrt(1 / S); p.push(x0 + (x1 - x0) * s / S, Math.max(-1.25, Math.min(1.25, w * sc)), z); }
          lines.push({ p, c: 0 });
        }
        // density surface at t = T: bulges forward along time, across the depth of the sheet
        const dens = y => Math.exp(-(y * y) / (2 * sc * sc));
        for (let k = 0; k <= 8; k++) {
          const z = -0.55 + 1.1 * k / 8, p = [];
          for (let j = 0; j <= 60; j++) { const y = -1.25 + 2.5 * j / 60; p.push(x1 + 0.42 * dens(y), y, z); }
          lines.push({ p, c: 1 });
        }
        for (let j = 0; j <= 12; j++) {
          const y = -1.1 + 2.2 * j / 12, p = [];
          for (let k = 0; k <= 8; k++) p.push(x1 + 0.42 * dens(y), y, -0.55 + 1.1 * k / 8);
          lines.push({ p, c: 1, w: 0.5 });
        }
        return { lines, yaw: -0.62, pitch: 0.32 };
      }
    },
    smile: {
      name: 'Implied-volatility smile surface',
      tag: 'Illustrative · SVI',
      eq: 'w(k) = a + b{ρ(k − m) + √((k − m)<sup>2</sup> + s<sup>2</sup>)}, &nbsp;σ = √(w/τ)',
      label: 'An illustrative implied-volatility surface across log-moneyness and maturity, generated from a raw SVI parameterisation, not market data.',
      build() {
        const rho = -0.35 - 0.3 * rnd(), m = 0.02 + 0.04 * rnd();
        const vol = (k, tau) => {
          const a = 0.012 + 0.028 * tau, b = 0.09 + 0.03 * rnd() * 0, s = 0.08 + 0.12 * tau;
          const w = a + b * (rho * (k - m) + Math.sqrt((k - m) * (k - m) + s * s));
          return Math.sqrt(Math.max(w, 1e-6) / tau);
        };
        const K = 40, T = 18, ks = [], ts = [];
        for (let i = 0; i <= K; i++) ks.push(-0.6 + 1.2 * i / K);
        for (let j = 0; j <= T; j++) ts.push(0.08 + 1.9 * j / T);
        let lo = Infinity, hi = -Infinity;
        const grid = ts.map(tau => ks.map(k => { const v = vol(k, tau); lo = Math.min(lo, v); hi = Math.max(hi, v); return v; }));
        const Y = v => -0.55 + 1.15 * (v - lo) / (hi - lo);
        const X = i => -0.9 + 1.8 * i / K, Z = j => -0.8 + 1.6 * j / T;
        const lines = [];
        grid.forEach((row, j) => { const p = []; row.forEach((v, i) => p.push(X(i), Y(v), Z(j))); lines.push({ p, c: j === 0 ? 1 : 0 }); });
        for (let i = 0; i <= K; i += 4) { const p = []; for (let j = 0; j <= T; j++) p.push(X(i), Y(grid[j][i]), Z(j)); lines.push({ p, c: 0, w: 0.55 }); }
        return { lines, yaw: 0.42, pitch: 0.38 };
      }
    },
    ou: {
      name: 'Ornstein–Uhlenbeck: mean reversion',
      tag: 'Spread dynamics',
      eq: 'dX<sub>t</sub> = κ(θ − X<sub>t</sub>) dt + σ dW<sub>t</sub>',
      label: 'Ornstein–Uhlenbeck sample paths starting far apart and reverting toward a common mean, inside the stationary band.',
      build() {
        const lines = [], N = 22, S = 120, kappa = 1.9 + rnd() * 0.6, sig = 0.24, dt = 1.6 / S, x0 = -1, x1 = 1;
        for (let n = 0; n < N; n++) {
          const z = -0.7 + 1.4 * n / (N - 1);
          let x = -1 + 2 * n / (N - 1) + 0.08 * gauss();
          const p = [x0, x, z];
          for (let s = 1; s <= S; s++) {
            x += kappa * (0 - x) * dt + sig * Math.sqrt(dt) * gauss();
            p.push(x0 + (x1 - x0) * s / S, Math.max(-1.2, Math.min(1.2, x)), z);
          }
          lines.push({ p, c: 0 });
        }
        const band = sig / Math.sqrt(2 * kappa);
        [-band, 0, band].forEach((y, i) => {
          lines.push({ p: [x0, y, -0.7, x1, y, -0.7], c: 1, w: i === 1 ? 1 : 0.5 });
          lines.push({ p: [x1, y, -0.7, x1, y, 0.7], c: 1, w: i === 1 ? 1 : 0.5 });
          lines.push({ p: [x0, y, 0.7, x1, y, 0.7], c: 1, w: 0.5 });
        });
        return { lines, yaw: -0.3, pitch: 0.3 };
      }
    },
    lorenz: {
      name: 'Lorenz system, read as two regimes',
      tag: 'Regime switching',
      eq: 'ẋ = σ(y − x), &nbsp;ẏ = x(ρ − z) − y, &nbsp;ż = xy − βz',
      label: 'A Lorenz trajectory whose two lobes are shaded as two market regimes; the path switches between them irregularly.',
      build() {
        const s = 10, r = 28, b = 8 / 3, h = 0.006;
        let x = 0.1 + rnd(), y = rnd(), z = 20 + rnd() * 5;
        const f = (x, y, z) => [s * (y - x), x * (r - z) - y, x * y - b * z];
        const step = () => {
          const k1 = f(x, y, z), k2 = f(x + h / 2 * k1[0], y + h / 2 * k1[1], z + h / 2 * k1[2]);
          const k3 = f(x + h / 2 * k2[0], y + h / 2 * k2[1], z + h / 2 * k2[2]), k4 = f(x + h * k3[0], y + h * k3[1], z + h * k3[2]);
          x += h / 6 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]); y += h / 6 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]); z += h / 6 * (k1[2] + 2 * k2[2] + 2 * k3[2] + k4[2]);
        };
        for (let i = 0; i < 1500; i++) step();
        const lines = []; let cur = null, side = null;
        for (let i = 0; i < 7200; i++) {
          step();
          const P = [x / 22, (z - 25) / 22, y / 22];
          const sd = x >= 0 ? 1 : 0;
          if (sd !== side) { if (cur) { cur.p.push(...P); } cur = { p: [...P], c: sd }; lines.push(cur); side = sd; }
          else cur.p.push(...P);
        }
        return { lines, yaw: 0.35, pitch: 0.15, serial: true };
      }
    },
    book: {
      name: 'Limit-order-book depth through time',
      tag: 'Illustrative · synthetic',
      eq: 'D<sub>ask</sub>(p) = Σ<sub>p<sub>i</sub> ≤ p</sub> q<sub>i</sub>, &nbsp;D<sub>bid</sub>(p) = Σ<sub>p<sub>i</sub> ≥ p</sub> q<sub>i</sub>',
      label: 'An illustrative, synthetic order book: cumulative bid and ask depth around a drifting mid price, drawn for successive snapshots in time.',
      build() {
        const L = 30, T = 22, lines = [];
        let mid = 0, maxD = 0;
        const snaps = [];
        const shape = Array.from({ length: L }, (_, i) => 0.4 + 0.9 * Math.exp(-((i - 9) ** 2) / 40) + 0.3 * rnd());
        for (let t = 0; t < T; t++) {
          mid += gauss() * 0.9;
          const bids = [], asks = [];
          let cb = 0, ca = 0;
          for (let i = 0; i < L; i++) {
            cb += shape[i] * (0.6 + 0.8 * rnd()) * (1 + 0.15 * Math.sin(t * 0.4 + i));
            ca += shape[i] * (0.6 + 0.8 * rnd()) * (1 + 0.15 * Math.cos(t * 0.35 + i));
            bids.push(cb); asks.push(ca);
          }
          maxD = Math.max(maxD, cb, ca);
          snaps.push({ mid, bids, asks });
        }
        const spanP = L + 8;
        const X = p => p / spanP, Y = d => -0.7 + 1.45 * d / maxD, Z = t => -0.85 + 1.7 * t / (T - 1);
        snaps.forEach((s, t) => {
          const bp = [], ap = [];
          for (let i = L - 1; i >= 0; i--) bp.push(X(s.mid - 1 - i), Y(s.bids[i]), Z(t));
          bp.push(X(s.mid - 1), Y(0), Z(t));
          ap.push(X(s.mid + 1), Y(0), Z(t));
          for (let i = 0; i < L; i++) ap.push(X(s.mid + 1 + i), Y(s.asks[i]), Z(t));
          lines.push({ p: bp, c: 0 }); lines.push({ p: ap, c: 1 });
        });
        for (let i = 4; i < L; i += 5) {
          const bl = [], al = [];
          snaps.forEach((s, t) => { bl.push(X(s.mid - 1 - i), Y(s.bids[i]), Z(t)); al.push(X(s.mid + 1 + i), Y(s.asks[i]), Z(t)); });
          lines.push({ p: bl, c: 0, w: 0.5 }); lines.push({ p: al, c: 1, w: 0.5 });
        }
        const mp = []; snaps.forEach((s, t) => mp.push(X(s.mid), -0.7, Z(t)));
        lines.push({ p: mp, c: 1, w: 0.8 });
        return { lines, yaw: -0.38, pitch: 0.42 };
      }
    }
  };
  const keys = Object.keys(objects);

  // ---------- state ----------
  let key = keys[Math.floor(rnd() * keys.length)];
  let model = null, total = 0;
  let yaw = 0, pitch = 0, vy = 0, paused = false, dragging = false, phase = 0, baseYaw = 0;
  let progress = 1, born = 0;
  let w = 0, h = 0, dpr = 1, raf = 0, last = 0, visible = true;

  function choose(k) {
    key = k;
    const o = objects[k];
    model = o.build();
    total = model.lines.reduce((a, l) => a + l.p.length / 3, 0);
    baseYaw = model.yaw; phase = 0; yaw = baseYaw; pitch = model.pitch;
    if (nameEl) nameEl.textContent = o.name;
    if (tagEl) tagEl.textContent = o.tag;
    if (eqEl) eqEl.innerHTML = o.eq;
    canvas.setAttribute('aria-label', o.label + ' Drag or use the arrow keys to rotate; press Space to pause.');
    progress = reduced.matches ? 1 : 0; born = performance.now();
    kick();
  }
  function shuffle() {
    const others = keys.filter(k => k !== key);
    choose(others[Math.floor(rnd() * others.length)]);
  }

  function resize() {
    const r = stage.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = r.width; h = r.height;
    canvas.width = Math.max(1, Math.round(w * dpr)); canvas.height = Math.max(1, Math.round(h * dpr));
    draw();
  }

  const BUCKETS = 7;
  const paths = [[], []];
  function draw() {
    if (!model || !w) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    const R = Math.min(w, h) * 0.36, ox = w / 2, oy = h / 2, cam = 3.6;
    for (let c = 0; c < 2; c++) for (let b = 0; b < BUCKETS; b++) paths[c][b] = new Path2D();
    const ease = 1 - Math.pow(1 - progress, 3);
    // serial objects (one long trajectory) draw in sequence; the rest grow together
    let budget = model.serial ? Math.floor(total * ease) : Infinity;
    for (const line of model.lines) {
      const p = line.p, n = p.length / 3;
      let upto = model.serial ? Math.min(n, budget) : Math.max(2, Math.floor(n * ease));
      if (model.serial) budget -= upto;
      if (upto < 2) { if (model.serial) break; continue; }
      let px = 0, py = 0, pz = 0;
      for (let i = 0; i < upto; i++) {
        const x = p[3 * i], y = p[3 * i + 1], z = p[3 * i + 2];
        // yaw about vertical axis, then pitch about horizontal axis
        const x1 = cy * x + sy * z, z1 = -sy * x + cy * z;
        const y2 = cp * y - sp * z1, z2 = sp * y + cp * z1;
        const s = cam / (cam + z2);
        const X = ox + x1 * R * s, Y = oy - y2 * R * s;
        if (i > 0) {
          const zm = (z2 + pz) / 2; // -1.7 (near) .. 1.7 (far)
          let bk = Math.floor((1 - (zm + 1.7) / 3.4) * BUCKETS);
          bk = bk < 0 ? 0 : bk >= BUCKETS ? BUCKETS - 1 : bk;
          const path = paths[line.c][line.w && line.w < 0.7 ? Math.max(0, bk - 2) : bk];
          path.moveTo(px, py); path.lineTo(X, Y);
        }
        px = X; py = Y; pz = z2;
      }
    }
    for (let c = 0; c < 2; c++) {
      const col = c ? ACC : INK;
      for (let b = 0; b < BUCKETS; b++) {
        const a = 0.12 + 0.7 * Math.pow(b / (BUCKETS - 1), 1.4);
        ctx.strokeStyle = `rgba(${col[0]},${col[1]},${col[2]},${(c ? a * 1.05 : a * 0.92).toFixed(3)})`;
        ctx.lineWidth = 0.55 + 0.6 * b / (BUCKETS - 1);
        ctx.stroke(paths[c][b]);
      }
    }
  }

  function frame(now) {
    raf = 0;
    const dt = Math.min(50, now - (last || now)); last = now;
    let moving = false;
    if (progress < 1) { progress = Math.min(1, (now - born) / (model.serial ? 2600 : 1500)); moving = true; }
    if (!dragging) {
      if (!paused && !reduced.matches) {
        if (model.serial) yaw += dt * 0.00011;
        else { const prev = Math.sin(phase); phase += dt * 0.00026; yaw += 0.45 * (Math.sin(phase) - prev); }
        moving = true;
      }
      if (Math.abs(vy) > 1e-5) { yaw += vy * dt; vy *= Math.pow(0.9, dt / 16); moving = true; }
    }
    draw();
    if ((moving || dragging) && visible && !about.hidden) raf = requestAnimationFrame(frame);
  }
  function kick() { if (!raf && visible && !about.hidden) { last = 0; raf = requestAnimationFrame(frame); } else if (!raf) draw(); }

  // ---------- interaction ----------
  let lx = 0, ly = 0, lt = 0;
  stage.addEventListener('pointerdown', e => {
    dragging = true; lx = e.clientX; ly = e.clientY; lt = performance.now(); vy = 0;
    stage.classList.add('dragging'); stage.setPointerCapture?.(e.pointerId); kick();
  });
  stage.addEventListener('pointermove', e => {
    if (!dragging) return;
    const now = performance.now(), dx = e.clientX - lx, dy = e.clientY - ly;
    yaw += dx * 0.008; pitch = Math.max(-1.3, Math.min(1.3, pitch + dy * 0.006));
    vy = (dx * 0.008) / Math.max(8, now - lt);
    lx = e.clientX; ly = e.clientY; lt = now;
    if (!raf) draw();
  });
  const end = () => { if (!dragging) return; dragging = false; stage.classList.remove('dragging'); if (reduced.matches) vy = 0; kick(); };
  stage.addEventListener('pointerup', end); stage.addEventListener('pointercancel', end);
  canvas.addEventListener('keydown', e => {
    const step = 0.09;
    if (e.key === 'ArrowLeft') yaw -= step;
    else if (e.key === 'ArrowRight') yaw += step;
    else if (e.key === 'ArrowUp') pitch = Math.max(-1.3, pitch - step);
    else if (e.key === 'ArrowDown') pitch = Math.min(1.3, pitch + step);
    else if (e.key === ' ' || e.code === 'Space') { paused = !paused; }
    else return;
    e.preventDefault(); kick(); draw();
  });
  // Space pauses from anywhere on About, unless the user is in a control
  document.addEventListener('keydown', e => {
    if (e.key !== ' ' || about.hidden || e.target === canvas) return;
    const t = e.target;
    if (t && (t.closest('a, button, input, textarea, select, [contenteditable]'))) return;
    e.preventDefault(); paused = !paused; kick();
  });
  nextBtn?.addEventListener('click', shuffle);

  document.addEventListener('sectionchange', e => {
    if (e.detail.page === 'about') {
      if (e.detail.prev && e.detail.prev !== 'about') shuffle();
      requestAnimationFrame(resize); kick();
    }
  });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible) kick(); }).observe(stage);
  }
  document.addEventListener('visibilitychange', () => { visible = !document.hidden; if (visible) kick(); });
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(stage);
  else window.addEventListener('resize', resize);

  choose(key);
  resize();
  window.__hero = { choose, keys, set paused(v) { paused = v; } };
})();
