// Kelly bankroll simulator. Same random draws across slider moves; Reset draws new ones.
(() => {
  const cv = document.getElementById('kelly-paths');
  const gv = document.getElementById('kelly-g');
  if (!(cv instanceof HTMLCanvasElement) || !(gv instanceof HTMLCanvasElement)) return;
  const c = cv.getContext('2d'), g = gv.getContext('2d');
  const $ = id => document.getElementById(id);
  const inP = $('k-p'), inB = $('k-b'), inM = $('k-m');
  const outP = $('k-p-out'), outB = $('k-b-out'), outM = $('k-m-out');
  const btnPause = $('kelly-pause'), btnReset = $('kelly-reset');
  const nEl = $('kelly-n'), gAxis = $('kelly-g-axis');
  const R = { fstar: $('r-fstar'), f: $('r-f'), g: $('r-g'), med: $('r-med') };
  const section = document.getElementById('play');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  const N = 20, T = 400;
  const INK = 'rgba(29,28,26,', ACC = 'rgba(123,43,35,';
  const MONO = '"IBM Plex Mono", ui-monospace, Menlo, monospace';
  let U = new Float32Array(N * T);
  let L = new Float64Array(N * (T + 1));   // log10 bankroll
  let K = new Float64Array(T + 1);         // log10 typical path at Kelly
  let p = 0.55, b = 1, m = 1, fstar = 0, f = 0, gf = 0, gk = 0;
  let idx = 0, paused = false, raf = 0, visible = false;
  let lo = -1, hi = 1, tlo = -1, thi = 1;
  const FLOOR = -12;

  function draws() { for (let i = 0; i < U.length; i++) U[i] = Math.random(); }
  const growth = (x) => p * Math.log(1 + b * x) + (1 - p) * Math.log(1 - x);

  function compute() {
    const q = 1 - p;
    fstar = p - q / b;
    f = fstar > 0 ? Math.min(0.99, m * fstar) : 0;
    gf = f > 0 ? growth(f) : 0;
    gk = fstar > 0 ? growth(Math.min(0.99, fstar)) : 0;
    const up = Math.log10(1 + b * f), dn = Math.log10(1 - f);
    let mn = 0, mx = 0;
    for (let n = 0; n < N; n++) {
      let v = 0; L[n * (T + 1)] = 0;
      for (let t = 0; t < T; t++) {
        v += U[n * T + t] < p ? up : dn;
        if (v < FLOOR) v = FLOOR;
        L[n * (T + 1) + t + 1] = v;
        if (v < mn) mn = v; if (v > mx) mx = v;
      }
    }
    const e = gf / Math.LN10 * T, ek = gk / Math.LN10 * T;
    mn = Math.min(mn, e, -1); mx = Math.max(mx, e, ek * (m !== 1 ? 1 : 0), 1);
    const pad = (mx - mn) * 0.06;
    tlo = Math.floor(mn - pad); thi = Math.ceil(mx + pad);
    // readouts
    outP.textContent = p.toFixed(2); outB.textContent = b.toFixed(1); outM.textContent = m.toFixed(2) + '×';
    R.fstar.textContent = fstar > 0 ? fstar.toFixed(3) : 'no edge';
    R.f.textContent = f.toFixed(3);
    R.g.textContent = (gf >= 0 ? '+' : '−') + Math.abs(gf).toFixed(4);
  }

  function fmtMult(l10) {
    if (l10 <= FLOOR + 0.01) return '≈ 0×';
    const v = Math.pow(10, l10);
    if (l10 >= 6 || l10 <= -3) return '10' + sup(Math.round(l10)) + '×';
    if (v >= 100) return Math.round(v).toLocaleString('en-US') + '×';
    if (v >= 1) return v.toFixed(v < 10 ? 2 : 1) + '×';
    return v.toPrecision(2) + '×';
  }
  function tick(k) {
    if (k >= 0 && k <= 6) return Math.pow(10, k).toLocaleString('en-US') + '×';
    if (k < 0 && k >= -4) return '0.' + '0'.repeat(-k - 1) + '1×';
    return '10' + sup(k) + '×';
  }
  function sup(n) { const m = '⁰¹²³⁴⁵⁶⁷⁸⁹'; return (n < 0 ? '⁻' : '') + String(Math.abs(n)).split('').map(d => m[+d]).join(''); }

  function size(canvas, ctx) {
    const r = canvas.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, 2);
    const W = Math.max(1, Math.round(r.width * d)), H = Math.max(1, Math.round(r.height * d));
    if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; }
    ctx.setTransform(d, 0, 0, d, 0, 0);
    return [r.width, r.height];
  }

  function drawPaths() {
    const [w, h] = size(cv, c);
    c.clearRect(0, 0, w, h);
    const padL = 58, padR = 10, padT = 14, padB = 22;
    const X = t => padL + (w - padL - padR) * t / T;
    const Y = v => padT + (h - padT - padB) * (1 - (v - lo) / (hi - lo));
    // ticks (decades)
    const span = hi - lo, step = Math.max(1, Math.ceil(span / 5));
    c.font = `11px ${MONO}`; c.textBaseline = 'middle'; c.textAlign = 'right';
    for (let k = Math.ceil(lo / step) * step; k <= hi; k += step) {
      const y = Y(k);
      c.strokeStyle = k === 0 ? INK + '0.45)' : INK + '0.08)';
      c.lineWidth = 1;
      c.beginPath(); c.moveTo(padL, Math.round(y) + 0.5); c.lineTo(w - padR, Math.round(y) + 0.5); c.stroke();
      c.fillStyle = INK + (k === 0 ? '0.75)' : '0.45)');
      c.fillText(tick(k), padL - 10, y);
    }
    c.textAlign = 'left'; c.textBaseline = 'alphabetic'; c.fillStyle = INK + '0.45)';
    c.fillText('0', padL, h - 5);
    c.textAlign = 'right'; c.fillText(String(T) + ' bets', w - padR, h - 5);
    // Kelly ghost
    if (m !== 1 && fstar > 0) {
      c.setLineDash([3, 4]); c.strokeStyle = ACC + '0.45)'; c.lineWidth = 1;
      c.beginPath(); c.moveTo(X(0), Y(0)); c.lineTo(X(T), Y(gk / Math.LN10 * T)); c.stroke(); c.setLineDash([]);
    }
    // sample paths
    c.save(); c.beginPath(); c.rect(padL, padT - 2, w - padL - padR, h - padT - padB + 4); c.clip();
    c.lineWidth = 1; c.lineJoin = 'round';
    for (let n = 0; n < N; n++) {
      c.strokeStyle = INK + (n === 0 ? '0.62)' : '0.24)');
      c.beginPath();
      for (let t = 0; t <= idx; t++) { const x = X(t), y = Y(L[n * (T + 1) + t]); t ? c.lineTo(x, y) : c.moveTo(x, y); }
      c.stroke();
    }
    // expectation line e^{n g(f)}
    c.strokeStyle = ACC + '0.95)'; c.lineWidth = 1.6;
    c.beginPath(); c.moveTo(X(0), Y(0)); c.lineTo(X(idx), Y(gf / Math.LN10 * idx)); c.stroke();
    // endpoints
    c.fillStyle = INK + '0.7)';
    for (let n = 0; n < N; n++) { c.beginPath(); c.arc(X(idx), Y(L[n * (T + 1) + idx]), 1.6, 0, 7); c.fill(); }
    c.restore();
    // readouts that depend on idx
    nEl.textContent = String(idx);
    const ends = []; for (let n = 0; n < N; n++) ends.push(L[n * (T + 1) + idx]);
    ends.sort((a, z) => a - z);
    R.med.textContent = idx ? fmtMult((ends[N / 2 - 1] + ends[N / 2]) / 2) : '1.00×';
  }

  function drawG() {
    const [w, h] = size(gv, g);
    g.clearRect(0, 0, w, h);
    const fmax = fstar > 0 ? Math.min(0.99, Math.max(3 * fstar, 0.05)) : 0.5;
    const S = 120, xs = [], ys = [];
    let gmin = 0, gmaxv = 0;
    for (let i = 0; i <= S; i++) { const x = fmax * i / S, v = growth(x); xs.push(x); ys.push(v); gmaxv = Math.max(gmaxv, v); gmin = Math.min(gmin, v); }
    const top = gmaxv > 0 ? gmaxv * 1.35 : 0.01;
    const bot = gmaxv > 0 ? Math.max(gmin * 1.08, -6 * gmaxv) : Math.max(gmin * 1.08, -0.3);
    const pad = 8;
    const X = x => pad + (w - 2 * pad) * x / fmax;
    const Y = v => pad + (h - 2 * pad) * (1 - (v - bot) / (top - bot));
    g.save(); g.beginPath(); g.rect(0, pad - 2, w, h - 2 * pad + 4); g.clip();
    g.strokeStyle = INK + '0.35)'; g.lineWidth = 1;
    g.beginPath(); g.moveTo(pad, Math.round(Y(0)) + 0.5); g.lineTo(w - pad, Math.round(Y(0)) + 0.5); g.stroke();
    g.strokeStyle = INK + '0.85)'; g.lineWidth = 1.3; g.beginPath();
    xs.forEach((x, i) => (i ? g.lineTo(X(x), Y(ys[i])) : g.moveTo(X(x), Y(ys[i])))); g.stroke();
    g.font = `11px ${MONO}`; g.fillStyle = ACC + '0.9)';
    if (fstar > 0) {
      g.strokeStyle = ACC + '0.5)'; g.setLineDash([2, 3]);
      g.beginPath(); g.moveTo(X(fstar), Y(top)); g.lineTo(X(fstar), Y(bot)); g.stroke(); g.setLineDash([]);
      g.textAlign = fstar / fmax > 0.8 ? 'right' : 'left';
      g.fillText('f*', X(fstar) + (g.textAlign === 'right' ? -5 : 5), pad + 10);
    }
    g.beginPath(); g.arc(X(f), Y(gf), 4, 0, 7); g.fillStyle = ACC + '1)'; g.fill();
    g.beginPath(); g.arc(X(f), Y(gf), 7, 0, 7); g.strokeStyle = ACC + '0.3)'; g.lineWidth = 1; g.stroke();
    g.restore();
    gAxis.textContent = '0 – ' + fmax.toFixed(2);
  }

  function frame() {
    raf = 0;
    let more = false;
    if (!paused && idx < T) { idx = Math.min(T, idx + 3); more = true; if (idx >= T) { btnPause.textContent = 'Replay'; } }
    const dl = tlo - lo, dh = thi - hi;
    if (Math.abs(dl) > 0.01 || Math.abs(dh) > 0.01) { lo += dl * 0.18; hi += dh * 0.18; more = true; } else { lo = tlo; hi = thi; }
    drawPaths();
    if (more && visible) raf = requestAnimationFrame(frame);
  }
  function kick() { if (!raf && visible) raf = requestAnimationFrame(frame); else if (!visible) drawPaths(); }

  function readInputs() { p = +inP.value; b = +inB.value; m = +inM.value; compute(); drawG(); kick(); }
  [inP, inB, inM].forEach(el => el.addEventListener('input', readInputs));
  btnPause.addEventListener('click', () => {
    if (idx >= T) { idx = 0; paused = false; btnPause.textContent = 'Pause'; btnPause.setAttribute('aria-pressed', 'false'); kick(); return; }
    else paused = !paused;
    btnPause.textContent = paused ? 'Resume' : 'Pause';
    btnPause.setAttribute('aria-pressed', String(paused));
    kick();
  });
  btnReset.addEventListener('click', () => {
    draws(); compute(); drawG();
    idx = reduced.matches ? T : 0; paused = false;
    btnPause.textContent = 'Pause'; btnPause.setAttribute('aria-pressed', 'false');
    kick();
  });

  const isShown = () => !section.hidden;
  document.addEventListener('sectionchange', () => { if (isShown()) requestAnimationFrame(() => { drawG(); kick(); }); });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(es => { visible = es[0].isIntersecting && isShown(); if (visible) kick(); }).observe(cv);
  } else visible = true;
  if ('ResizeObserver' in window) new ResizeObserver(() => { drawPaths(); drawG(); }).observe(cv);
  document.fonts?.ready.then(() => { drawPaths(); drawG(); });

  draws(); compute(); lo = tlo; hi = thi;
  if (reduced.matches) { idx = T; btnPause.textContent = 'Replay'; }
  drawG(); drawPaths();
})();
