// A cube of points from the integer lattice Z^3, drawn on a canvas.
// The cube turns slowly; a target point drifts through it, joined by a dashed
// segment to its closest lattice point (the closest-vector problem, in three
// dimensions). Basis vectors run from one corner. Honors prefers-reduced-motion.
(() => {
  const canvas = document.getElementById("lattice3d");
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext("2d");

  // Swap the static SVG fallback for the canvas.
  const fallback = document.querySelector(".lattice-fallback");
  if (fallback) fallback.hidden = true;
  canvas.hidden = false;

  const N = 6;                 // points per cube edge
  const H = (N - 1) / 2;       // points sit at k - H, so the cube is centered
  const points = [];
  for (let x = 0; x < N; x++)
    for (let y = 0; y < N; y++)
      for (let z = 0; z < N; z++) points.push([x - H, y - H, z - H]);


  const motionQuery = matchMedia("(prefers-reduced-motion: reduce)");
  let reduced = motionQuery.matches;

  let yaw = -0.62;                  // view rotation (radians)
  const pitch = -0.42;
  let drift = 7;                    // time parameter for the target's path
  let intro = reduced ? 1 : 0;      // 0 → 1 load-in progress
  let colors = {};
  let w = 0, h = 0, dpr = 1;
  let visible = true, raf = 0, lastFrame = 0;

  function readColors() {
    const cs = getComputedStyle(canvas);
    const v = (name, fb) => cs.getPropertyValue(name).trim() || fb;
    colors = {
      point: v("--lattice-point", "#8E9AAB"),
      accent: v("--lattice-accent", "#1D5BA8"),
      target: v("--lattice-target", "#16202E"),
      bg: v("--lattice-bg", "#F1F2EE"),
    };
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = rect.width; h = rect.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    readColors();
    draw();
  }

  // Smooth closed path that stays inside the cube.
  function target(t) {
    return [
      H * 0.86 * Math.sin(0.23 * t),
      H * 0.80 * Math.sin(0.31 * t + 1.1),
      H * 0.86 * Math.sin(0.17 * t + 2.3),
    ];
  }
  // For Z^3 the closest point is coordinate-wise rounding (clamped to the cube).
  function nearest(p) {
    return p.map((c) => Math.max(-H, Math.min(H, Math.round(c + H) - H)));
  }

  function project(p) {
    const [x, y, z] = p;
    const cy = Math.cos(yaw), sy = Math.sin(yaw);
    const cp = Math.cos(pitch), sp = Math.sin(pitch);
    const x1 = cy * x + sy * z, z1 = -sy * x + cy * z;
    const y2 = cp * y - sp * z1, z2 = sp * y + cp * z1;
    const D = N * 4;
    const f = D / (D + z2);
    // Fit the cube's space diagonal, with perspective, at any rotation.
    const s = Math.min(w, h) / (Math.sqrt(3) * (N - 1) * 1.24);
    return { x: w / 2 + x1 * s * f, y: h / 2 - y2 * s * f, z: z2, f };
  }


  function line(a, b, color, width, dash) {
    ctx.beginPath();
    ctx.setLineDash(dash || []);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function draw() {
    if (!w || !h) return;
    ctx.clearRect(0, 0, w, h);
    const ease = 1 - Math.pow(1 - intro, 3);

    // Lattice points, back to front, sized and faded by depth
    const proj = points.map((p, i) => ({ ...project(p), i }));
    proj.sort((a, b) => b.z - a.z);
    const zMax = H * 1.8;
    ctx.fillStyle = colors.point;
    for (const q of proj) {
      const depth = (zMax - q.z) / (2 * zMax);           // 0 far … 1 near
      const p = points[q.i];
      const order = (p[0] + p[1] + p[2] + 3 * H) / (6 * H); // load-in from one corner
      const local = Math.max(0, Math.min(1, (ease * 1.6 - order * 0.6)));
      ctx.globalAlpha = (0.28 + 0.72 * depth) * local;
      ctx.beginPath();
      ctx.arc(q.x, q.y, (1.3 + 1.9 * depth) * q.f, 0, Math.PI * 2);
      ctx.fill();
    }

    // Basis vectors from the origin corner
    ctx.globalAlpha = Math.max(0, (ease - 0.4) / 0.6);
    const o = [-H, -H, -H];
    const po = project(o);
    for (const e of [[1, 0, 0], [0, 1, 0], [0, 0, 1]]) {
      const tip = project([o[0] + 2 * e[0], o[1] + 2 * e[1], o[2] + 2 * e[2]]);
      line(po, tip, colors.accent, 2.5);
    }
    ctx.fillStyle = colors.accent;
    ctx.beginPath(); ctx.arc(po.x, po.y, 4 * po.f, 0, Math.PI * 2); ctx.fill();

    // Target, dashed segment, and its closest lattice point
    ctx.globalAlpha = Math.max(0, (ease - 0.6) / 0.4);
    const t = target(drift);
    const pt = project(t), pn = project(nearest(t));
    line(pt, pn, colors.target, 1.6, [4, 4]);
    ctx.beginPath();
    ctx.arc(pn.x, pn.y, 6.5 * pn.f, 0, Math.PI * 2);
    ctx.fillStyle = colors.bg; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = colors.target; ctx.stroke();
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 5 * pt.f, 0, Math.PI * 2);
    ctx.fillStyle = colors.target; ctx.fill();
    ctx.globalAlpha = 1;
  }

  function animating() {
    return !reduced;
  }

  function frame(now) {
    raf = 0;
    const dt = Math.min(0.05, (now - (lastFrame || now)) / 1000);
    lastFrame = now;
    if (intro < 1) intro = Math.min(1, intro + dt / 1.4);
    yaw += 0.16 * dt;
    drift += dt * 0.9;
    draw();
    schedule();
  }

  function schedule() {
    if (!raf && visible && !document.hidden && animating()) {
      raf = requestAnimationFrame(frame);
    } else if (!animating()) {
      lastFrame = 0;
    }
  }

  // Pause when off screen or in a background tab
  if ("IntersectionObserver" in window) {
    new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting;
      schedule();
    }).observe(canvas);
  }
  document.addEventListener("visibilitychange", schedule);
  motionQuery.addEventListener?.("change", (e) => { reduced = e.matches; intro = 1; schedule(); draw(); });

  new ResizeObserver(resize).observe(canvas);
  resize();
  if (reduced) draw(); else schedule();
})();
