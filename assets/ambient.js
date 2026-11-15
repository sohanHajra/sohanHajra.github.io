// Ambient field: faint topographic contours of a slow scalar field.
// The cursor raises a soft hill; the isolines bend around it and settle back.
(() => {
  const canvas = document.getElementById('ambient');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const fine = window.matchMedia('(pointer: fine)');

  const CELL = 20;                    // CSS px per grid cell
  const LEVELS = [-1.2, -0.9, -0.6, -0.3, 0, 0.3, 0.6, 0.9, 1.2];
  let w = 0, h = 0, dpr = 1, cols = 0, rows = 0, field = new Float32Array(0);
  let t = Math.random() * 100;
  const ptr = { x: -9999, y: -9999, tx: -9999, ty: -9999, amp: 0, target: 0 };
  let raf = 0, last = 0, running = false;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth; h = window.innerHeight;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    cols = Math.ceil(w / CELL) + 2; rows = Math.ceil(h / CELL) + 2;
    field = new Float32Array(cols * rows);
    draw();
  }

  function sample() {
    const s = Math.min(w, h);
    const k1 = 5.2 / s, k2 = 7.4 / s, k3 = 3.1 / s;
    const r2 = 2 * 150 * 150;
    for (let j = 0; j < rows; j++) {
      const y = (j - 1) * CELL;
      for (let i = 0; i < cols; i++) {
        const x = (i - 1) * CELL;
        let v = 0.62 * Math.sin(x * k1 + t * 0.11) * Math.cos(y * k1 * 0.8 - t * 0.07)
              + 0.38 * Math.sin((x + y) * k2 * 0.7 - t * 0.09)
              + 0.30 * Math.cos(x * k3 * 0.6 - y * k3 + t * 0.05);
        if (ptr.amp > 0.002) {
          const dx = x - ptr.x, dy = y - ptr.y;
          v += 0.95 * ptr.amp * Math.exp(-(dx * dx + dy * dy) / r2);
        }
        field[j * cols + i] = v;
      }
    }
  }

  function draw() {
    sample();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.lineWidth = 1;
    for (let L = 0; L < LEVELS.length; L++) {
      const lv = LEVELS[L];
      ctx.beginPath();
      for (let j = 0; j < rows - 1; j++) {
        for (let i = 0; i < cols - 1; i++) {
          const a = field[j * cols + i] - lv, b = field[j * cols + i + 1] - lv;
          const c = field[(j + 1) * cols + i + 1] - lv, d = field[(j + 1) * cols + i] - lv;
          const code = (a > 0 ? 8 : 0) | (b > 0 ? 4 : 0) | (c > 0 ? 2 : 0) | (d > 0 ? 1 : 0);
          if (code === 0 || code === 15) continue;
          const x0 = (i - 1) * CELL, y0 = (j - 1) * CELL;
          // edge crossings: top(a-b), right(b-c), bottom(d-c), left(a-d)
          const top = () => [x0 + CELL * a / (a - b), y0];
          const right = () => [x0 + CELL, y0 + CELL * b / (b - c)];
          const bottom = () => [x0 + CELL * d / (d - c), y0 + CELL];
          const left = () => [x0, y0 + CELL * a / (a - d)];
          const seg = (p, q) => { ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); };
          switch (code) {
            case 1: case 14: seg(left(), bottom()); break;
            case 2: case 13: seg(bottom(), right()); break;
            case 3: case 12: seg(left(), right()); break;
            case 4: case 11: seg(top(), right()); break;
            case 6: case 9: seg(top(), bottom()); break;
            case 7: case 8: seg(left(), top()); break;
            case 5: seg(left(), top()); seg(bottom(), right()); break;
            case 10: seg(left(), bottom()); seg(top(), right()); break;
          }
        }
      }
      // the zero line is the "datum": a touch of the accent; the rest is ink
      ctx.strokeStyle = lv === 0 ? 'rgba(123, 43, 35, 0.085)' : 'rgba(29, 28, 26, 0.05)';
      ctx.stroke();
    }
  }

  function frame(now) {
    raf = 0;
    const dt = Math.min(64, now - (last || now)); last = now;
    t += dt * 0.001;
    ptr.x += (ptr.tx - ptr.x) * 0.09; ptr.y += (ptr.ty - ptr.y) * 0.09;
    ptr.amp += (ptr.target - ptr.amp) * 0.035;
    ptr.target *= 0.992;              // the hill slowly settles if the cursor rests
    draw();
    if (running) raf = requestAnimationFrame(frame);
  }

  function start() { if (running || reduced.matches || document.hidden) return; running = true; last = 0; raf = requestAnimationFrame(frame); }
  function stop() { running = false; if (raf) cancelAnimationFrame(raf); raf = 0; }

  window.addEventListener('pointermove', e => {
    if (!fine.matches || reduced.matches) return;
    if (ptr.x < -9000) { ptr.x = e.clientX; ptr.y = e.clientY; }
    ptr.tx = e.clientX; ptr.ty = e.clientY; ptr.target = 1;
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', () => { ptr.target = 0; });
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  reduced.addEventListener?.('change', () => { if (reduced.matches) { stop(); ptr.amp = 0; draw(); } else start(); });
  let rt;
  window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(resize, 120); });

  resize();
  start();
})();
