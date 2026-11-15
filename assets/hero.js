// Hero: one mathematical object per visit, drawn as a rotatable wire figure.
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

  const rnd = Math.random;
  const TAU = 2 * Math.PI;

  // Grid helper: f(u, v) -> [x, y, z]; draws `nu` u-lines and `nv` v-lines, each finely sampled.
  function mesh(f, u0, u1, v0, v1, nu, nv, su, sv, style = {}) {
    const lines = [];
    for (let i = 0; i <= nu; i++) {
      const u = u0 + (u1 - u0) * i / nu, p = [];
      for (let j = 0; j <= sv; j++) p.push(...f(u, v0 + (v1 - v0) * j / sv));
      lines.push({ p, c: style.uc ? style.uc(i, nu) : 0 });
    }
    for (let j = 0; j <= nv; j++) {
      const v = v0 + (v1 - v0) * j / nv, p = [];
      for (let i = 0; i <= su; i++) p.push(...f(u0 + (u1 - u0) * i / su, v));
      lines.push({ p, c: style.vc ? style.vc(j, nv) : 0 });
    }
    return lines;
  }

  // Each builder returns { lines: [{ p: number[] (xyz...), c: 0 ink | 1 accent }], yaw, pitch, ... }.
  // fit() then centres the figure and scales it into the unit ball, so no rotation can clip it.
  const objects = {
    breather: {
      name: 'A breather surface',
      tag: 'Sine-Gordon soliton',
      eq: 'φ<sub>uv</sub> = sin φ',
      label: 'A breather surface: a surface of constant negative curvature built from the breather solution of the sine-Gordon equation, a ring of scalloped lobes around a narrow throat, drawn as a wire mesh with its cuspidal rim highlighted.',
      // a = 0.4: the classic 13-lobed breather; v ∈ [−37.4, 37.4] closes it up to a sliver, u ∈ [−6.5, 6.5] trims the long spines
      build() {
        const a = 0.4, wq = Math.sqrt(1 - a * a);
        const f = (u, v) => {
          const ch = Math.cosh(a * u), sh = Math.sinh(a * u), d = a * ((wq * ch) ** 2 + (a * Math.sin(wq * v)) ** 2);
          return [
            2 * wq * ch * (-(wq * Math.cos(v) * Math.cos(wq * v)) - Math.sin(v) * Math.sin(wq * v)) / d,
            -u + 2 * (1 - a * a) * ch * sh / d,
            2 * wq * ch * (-(wq * Math.sin(v) * Math.cos(wq * v)) + Math.cos(v) * Math.sin(wq * v)) / d
          ];
        };
        const lines = mesh(f, -6.5, 6.5, -37.4, 37.4, 18, 150, 160, 1400, { uc: (i, n) => (i === n / 2 ? 1 : 0) });
        return { lines, yaw: 0.4, pitch: 0.25, alpha: 0.75, tilt: -1.2 };
      }
    },
    enneper: {
      name: 'Enneper’s minimal surface',
      tag: 'Differential geometry',
      eq: 'x = u − u<sup>3</sup>/3 + uv<sup>2</sup>, &nbsp;y = v − v<sup>3</sup>/3 + u<sup>2</sup>v, &nbsp;z = u<sup>2</sup> − v<sup>2</sup>',
      label: 'Enneper’s minimal surface, a saddle whose edge folds back over itself, drawn as a wire mesh of circles and radial lines in polar coordinates.',
      build() {
        const R = 1.55 + 0.25 * rnd();
        const f = (r, th) => { const u = r * Math.cos(th), v = r * Math.sin(th); return [u - u * u * u / 3 + u * v * v, u * u - v * v, v - v * v * v / 3 + u * u * v]; };
        const lines = mesh(f, 0.02, R, 0, TAU, 16, 48, 60, 220, { uc: (i, n) => (i === n ? 1 : 0) });
        return { lines, yaw: 0.6, pitch: 0.42, alpha: 0.85 };
      }
    },
    cyclide: {
      name: 'A Dupin cyclide, every curvature line a circle',
      tag: 'Inversive geometry',
      eq: '(x<sup>2</sup> + y<sup>2</sup> + z<sup>2</sup> + b<sup>2</sup> − d<sup>2</sup>)<sup>2</sup> = 4(ax − cd)<sup>2</sup> + 4b<sup>2</sup>y<sup>2</sup>, &nbsp;c<sup>2</sup> = a<sup>2</sup> − b<sup>2</sup>',
      label: 'A ring-shaped Dupin cyclide, thick on one side and thin on the other, drawn along its lines of curvature, all of which are circles.',
      build() {
        const a = 1, b = 0.84 + 0.06 * rnd(), c = Math.sqrt(a * a - b * b), d = 0.36 + 0.06 * rnd();
        const f = (u, v) => {
          const den = a - c * Math.cos(u) * Math.cos(v);
          return [
            (d * (c - a * Math.cos(u) * Math.cos(v)) + b * b * Math.cos(u)) / den,
            b * Math.sin(v) * (c * Math.cos(u) - d) / den,
            b * Math.sin(u) * (a - d * Math.cos(v)) / den
          ];
        };
        const lines = mesh(f, 0, TAU, 0, TAU, 48, 20, 160, 80, { vc: j => (j === 0 ? 1 : 0), uc: i => (i === 14 ? 1 : 0) });
        return { lines, yaw: -0.5, pitch: 0.62, alpha: 0.8 };
      }
    },
    dini: {
      name: 'Dini’s surface, a twisted pseudosphere',
      tag: 'Constant negative curvature',
      eq: 'x = a cos u sin v, &nbsp;y = a sin u sin v, &nbsp;z = a(cos v + ln tan(v/2)) + bu',
      label: 'Dini’s surface: a pseudosphere twisted into a spiral horn, with constant negative Gaussian curvature, drawn as a wire mesh.',
      build() {
        const A = 1, B = 0.15 + 0.04 * rnd(), U = 4 * Math.PI;
        const f = (u, v) => [A * Math.cos(u) * Math.sin(v), A * (Math.cos(v) + Math.log(Math.tan(v / 2))) + B * u, A * Math.sin(u) * Math.sin(v)];
        const lines = mesh(f, 0, U, 0.06, 1.75, 80, 12, 300, 60, { vc: (j, n) => (j === n ? 1 : 0) });
        return { lines, yaw: 0.3, pitch: 0.18, alpha: 0.8, tilt: -0.42 };
      }
    },
    smile: {
      name: 'Implied-volatility smile surface',
      tag: 'Illustrative · SVI',
      eq: 'w(k) = a + b{ρ(k − m) + √((k − m)<sup>2</sup> + s<sup>2</sup>)}, &nbsp;σ<sub>BS</sub> = √(w/τ)',
      label: 'An illustrative implied-volatility surface across log-moneyness and maturity, generated from a raw SVI parameterisation, not market data.',
      build() {
        const rho = -0.35 - 0.3 * rnd(), m = 0.02 + 0.04 * rnd(), b = 0.09 + 0.03 * rnd();
        const vol = (k, tau) => {
          const a = 0.012 + 0.028 * tau, s = 0.08 + 0.12 * tau;
          const w = a + b * (rho * (k - m) + Math.sqrt((k - m) * (k - m) + s * s));
          return Math.sqrt(Math.max(w, 1e-6) / tau);
        };
        const K = 120, T = 22, ks = [], ts = [];
        for (let i = 0; i <= K; i++) ks.push(-0.6 + 1.2 * i / K);
        for (let j = 0; j <= T; j++) ts.push(0.08 + 1.9 * j / T);
        let lo = Infinity, hi = -Infinity;
        const grid = ts.map(tau => ks.map(k => { const v = vol(k, tau); lo = Math.min(lo, v); hi = Math.max(hi, v); return v; }));
        const Y = v => -0.55 + 1.0 * (v - lo) / (hi - lo);
        const X = i => -0.9 + 1.8 * i / K, Z = j => -0.8 + 1.6 * j / T;
        const lines = [];
        grid.forEach((row, j) => { const p = []; row.forEach((v, i) => p.push(X(i), Y(v), Z(j))); lines.push({ p, c: j === 0 ? 1 : 0 }); });
        for (let i = 0; i <= K; i += 8) { const p = []; for (let j = 0; j <= T; j++) p.push(X(i), Y(grid[j][i]), Z(j)); lines.push({ p, c: 0, w: 0.5 }); }
        // floor frame, hairline, so the surface reads as standing over the (k, τ) plane
        lines.push({ p: [X(0), -0.6, Z(0), X(K), -0.6, Z(0), X(K), -0.6, Z(T), X(0), -0.6, Z(T), X(0), -0.6, Z(0)], c: 0, w: 0.5 });
        return { lines, yaw: 0.42, pitch: 0.38 };
      }
    },
    lorenz: {
      name: 'Lorenz system, read as two regimes',
      tag: 'Regime switching',
      eq: 'ẋ = σ(y − x), &nbsp;ẏ = x(ρ − z) − y, &nbsp;ż = xy − βz',
      label: 'A Lorenz trajectory whose two lobes are shaded as two market regimes; the path switches between them irregularly.',
      build() {
        const s = 10, r = 28, b = 8 / 3, h = 0.005;
        let x = 0.1 + rnd(), y = rnd(), z = 20 + rnd() * 5;
        const f = (x, y, z) => [s * (y - x), x * (r - z) - y, x * y - b * z];
        const step = () => {
          const k1 = f(x, y, z), k2 = f(x + h / 2 * k1[0], y + h / 2 * k1[1], z + h / 2 * k1[2]);
          const k3 = f(x + h / 2 * k2[0], y + h / 2 * k2[1], z + h / 2 * k2[2]), k4 = f(x + h * k3[0], y + h * k3[1], z + h * k3[2]);
          x += h / 6 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]); y += h / 6 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]); z += h / 6 * (k1[2] + 2 * k2[2] + 2 * k3[2] + k4[2]);
        };
        for (let i = 0; i < 1500; i++) step();
        const lines = []; let cur = null, side = null;
        for (let i = 0; i < 9000; i++) {
          step();
          const P = [x, z - 25, y];
          const sd = x >= 0 ? 1 : 0;
          if (sd !== side) { if (cur) cur.p.push(...P); cur = { p: [...P], c: sd }; lines.push(cur); side = sd; }
          else cur.p.push(...P);
        }
        return { lines, yaw: 0.35, pitch: 0.15, serial: true, alpha: 0.9 };
      }
    }
  };

  // Centre (bounding-box centre or centroid) and scale into the unit ball.
  function fit(model) {
    let mx = [Infinity, Infinity, Infinity], Mx = [-Infinity, -Infinity, -Infinity];
    for (const l of model.lines) for (let i = 0; i < l.p.length; i += 3) for (let k = 0; k < 3; k++) { mx[k] = Math.min(mx[k], l.p[i + k]); Mx[k] = Math.max(Mx[k], l.p[i + k]); }
    const c = [0, 1, 2].map(k => (mx[k] + Mx[k]) / 2);
    let r = 0;
    for (const l of model.lines) for (let i = 0; i < l.p.length; i += 3) r = Math.max(r, Math.hypot(l.p[i] - c[0], l.p[i + 1] - c[1], l.p[i + 2] - c[2]));
    for (const l of model.lines) { const q = new Float32Array(l.p.length); for (let i = 0; i < l.p.length; i += 3) for (let k = 0; k < 3; k++) q[i + k] = (l.p[i + k] - c[k]) / r; l.p = q; }
    if (model.tilt) { // a fixed roll, so a tall figure leans into the frame and its sway reads as a slow precession
      const ct = Math.cos(model.tilt), st = Math.sin(model.tilt);
      for (const l of model.lines) for (let i = 0; i < l.p.length; i += 3) { const x = l.p[i], y = l.p[i + 1]; l.p[i] = ct * x - st * y; l.p[i + 1] = st * x + ct * y; }
    }
    return model;
  }
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
    model = fit(o.build());
    total = model.lines.reduce((a, l) => a + l.p.length / 3, 0);
    baseYaw = model.yaw; phase = 0; yaw = baseYaw; pitch = model.pitch;
    if (nameEl) nameEl.textContent = o.name;
    if (tagEl) tagEl.textContent = o.tag;
    if (eqEl) eqEl.innerHTML = o.eq.split(', &nbsp;').map(t => `<span class="nw">${t}</span>`).join(', ');
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

  // Depth cue: segments are binned by depth into BUCKETS paths per colour; far = faint and thin, near = darker.
  const BUCKETS = 10;
  const paths = [[], []];
  function draw() {
    if (!model || !w) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    // figures live in the unit ball; with cam = 3.6 the widest projected extent is ~1.04, so 0.46 keeps a margin
    const R = Math.min(w, h) * 0.46, ox = w / 2, oy = h / 2, cam = 3.6;
    for (let c = 0; c < 2; c++) for (let b = 0; b < BUCKETS; b++) paths[c][b] = new Path2D();
    const ease = 1 - Math.pow(1 - progress, 3);
    // serial objects (one long trajectory) draw in sequence; the rest grow together
    let budget = model.serial ? Math.floor(total * ease) : Infinity;
    for (const line of model.lines) {
      const p = line.p, n = p.length / 3;
      const upto = model.serial ? Math.min(n, budget) : Math.max(2, Math.floor(n * ease));
      if (model.serial) budget -= upto;
      if (upto < 2) { if (model.serial) break; continue; }
      const faint = line.w && line.w < 0.7 ? 3 : 0;
      let px = 0, py = 0, pz = 0;
      for (let i = 0; i < upto; i++) {
        const x = p[3 * i], y = p[3 * i + 1], z = p[3 * i + 2];
        // yaw about the vertical axis, then pitch about the horizontal axis
        const x1 = cy * x + sy * z, z1 = -sy * x + cy * z;
        const y2 = cp * y - sp * z1, z2 = sp * y + cp * z1;
        const s = cam / (cam + z2);
        const X = ox + x1 * R * s, Y = oy - y2 * R * s;
        if (i > 0) {
          const zm = (z2 + pz) / 2; // -1 (near) .. 1 (far)
          let bk = Math.floor((1 - zm) * 0.5 * BUCKETS) - faint;
          bk = bk < 0 ? 0 : bk >= BUCKETS ? BUCKETS - 1 : bk;
          const path = paths[line.c][bk];
          path.moveTo(px, py); path.lineTo(X, Y);
        }
        px = X; py = Y; pz = z2;
      }
    }
    const k = model.alpha || 1;
    for (let c = 0; c < 2; c++) {
      const col = c ? ACC : INK;
      for (let b = 0; b < BUCKETS; b++) {
        const t = b / (BUCKETS - 1);
        const a = k * (0.07 + 0.78 * Math.pow(t, 1.6));
        ctx.strokeStyle = `rgba(${col[0]},${col[1]},${col[2]},${(c ? Math.min(1, a * 1.1) : a).toFixed(3)})`;
        ctx.lineWidth = 0.5 + 0.7 * t;
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
