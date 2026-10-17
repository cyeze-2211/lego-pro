(() => {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const slides = [...document.querySelectorAll('.slide')];

  /* ---------- side dots ---------- */
  const dotsNav = document.getElementById('dots');
  slides.forEach((s) => {
    const a = document.createElement('a');
    a.href = '#' + s.id;
    a.dataset.label = s.dataset.title;
    a.setAttribute('aria-label', s.dataset.title);
    dotsNav.appendChild(a);
  });
  const dots = [...dotsNav.children];

  /* ---------- progress, active dot, timeline fill ---------- */
  const bar = document.getElementById('progressBar');
  const timeline = document.getElementById('timeline');
  const fill = document.getElementById('timelineFill');
  let current = 0;

  function onScroll() {
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.width = (scrollY / max) * 100 + '%';

    const mid = scrollY + innerHeight * 0.45;
    slides.forEach((s, i) => { if (s.offsetTop <= mid) current = i; });
    dots.forEach((d, i) => d.classList.toggle('active', i === current));

    const r = timeline.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (innerHeight * 0.8 - r.top) / (r.height + innerHeight * 0.2)));
    fill.style.width = p * 100 + '%';
  }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();

  /* ---------- keyboard slide navigation ---------- */
  addEventListener('keydown', (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey || e.target.closest?.('input, textarea')) return;
    const next = ['ArrowDown', 'PageDown', 'ArrowRight'].includes(e.key) || (e.key === ' ' && !e.shiftKey);
    const prev = ['ArrowUp', 'PageUp', 'ArrowLeft'].includes(e.key) || (e.key === ' ' && e.shiftKey);
    if (!next && !prev) return;
    e.preventDefault();
    const i = Math.max(0, Math.min(slides.length - 1, current + (next ? 1 : -1)));
    slides[i].scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' });
  });

  /* ---------- reveal + counters ---------- */
  function countUp(el) {
    const target = +el.dataset.count;
    if (reduce) { el.textContent = target; return; }
    const dur = 1400, t0 = performance.now();
    const step = (t) => {
      const k = Math.min(1, (t - t0) / dur);
      el.textContent = Math.round(target * (1 - Math.pow(1 - k, 3)));
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const el = en.target;
      // stagger siblings
      const sibs = [...el.parentElement.children].filter((c) => c.classList.contains('reveal'));
      el.style.transitionDelay = Math.min(sibs.indexOf(el), 5) * 90 + 'ms';
      el.classList.add('in');
      el.querySelectorAll('[data-count]').forEach(countUp);
      el.querySelectorAll('.step, .funnel__step').forEach((c, i) => (c.style.transitionDelay = 150 + i * 120 + 'ms'));
      setTimeout(() => (el.style.transitionDelay = ''), 1200);
      io.unobserve(el);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

  /* ---------- team dots: 18 people, 8 developers ---------- */
  const people = document.getElementById('people');
  for (let i = 0; i < 18; i++) {
    const d = document.createElement('i');
    if (i < 8) d.className = 'dev';
    d.style.transitionDelay = 400 + i * 50 + 'ms';
    people.appendChild(d);
  }

  /* ---------- 3D tilt cards ---------- */
  if (!reduce && matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('.tilt').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        el.classList.add('is-tilting');
        el.style.setProperty('--ry', (x - 0.5) * 12 + 'deg');
        el.style.setProperty('--rx', (0.5 - y) * 10 + 'deg');
        el.style.setProperty('--mx', x * 100 + '%');
        el.style.setProperty('--my', y * 100 + '%');
      });
      el.addEventListener('pointerleave', () => {
        el.classList.remove('is-tilting');
        el.style.setProperty('--rx', '0deg');
        el.style.setProperty('--ry', '0deg');
      });
    });

    // isometric plane follows pointer slightly
    const plane = document.getElementById('isoPlane');
    plane.closest('.zones').addEventListener('pointermove', (e) => {
      const r = plane.closest('.zones').getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      plane.style.transform = `rotateX(${58 - y * 10}deg) rotateZ(${-40 + x * 14}deg)`;
    });
  }

  /* ---------- zones: list <-> 3D blocks ---------- */
  const blocks = document.querySelectorAll('.iso__block');
  const zones = document.querySelectorAll('.zone');
  const setZone = (z) => {
    blocks.forEach((b) => b.classList.toggle('hot', b.dataset.z === z));
    zones.forEach((b) => b.classList.toggle('hot', b.dataset.z === z));
  };
  zones.forEach((zn) => {
    zn.addEventListener('pointerenter', () => setZone(zn.dataset.z));
    zn.addEventListener('click', () => setZone(zn.dataset.z));
  });
  document.querySelector('.zone-list').addEventListener('pointerleave', () => setZone(null));
  // auto-cycle until the viewer interacts
  let zi = 0, zTimer = null;
  const zoneObs = new IntersectionObserver(([en]) => {
    clearInterval(zTimer);
    if (en.isIntersecting && !reduce) {
      zTimer = setInterval(() => { zi = (zi % 4) + 1; setZone(String(zi)); }, 2200);
    }
  }, { threshold: 0.4 });
  zoneObs.observe(document.querySelector('.zones'));
  document.querySelector('.zones').addEventListener('pointerenter', () => clearInterval(zTimer), { once: true });

  /* ---------- hero: 3D network globe (canvas) ---------- */
  const cv = document.getElementById('globe');
  const ctx = cv.getContext('2d');
  let W, H, DPR, R, cx, cy;
  const N = innerWidth < 700 ? 140 : 240;
  const pts = [];
  // fibonacci sphere
  for (let i = 0; i < N; i++) {
    const y = 1 - (i / (N - 1)) * 2;
    const rad = Math.sqrt(1 - y * y);
    const th = Math.PI * (3 - Math.sqrt(5)) * i;
    pts.push([Math.cos(th) * rad, y, Math.sin(th) * rad]);
  }
  // edges between near neighbours
  const edges = [];
  const maxD = innerWidth < 700 ? 0.36 : 0.28;
  for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) {
    const dx = pts[i][0] - pts[j][0], dy = pts[i][1] - pts[j][1], dz = pts[i][2] - pts[j][2];
    if (dx * dx + dy * dy + dz * dz < maxD * maxD) edges.push([i, j]);
  }
  // data pulses travelling along edges
  const pulses = Array.from({ length: 14 }, () => ({ e: (Math.random() * edges.length) | 0, t: Math.random() }));

  function size() {
    DPR = Math.min(devicePixelRatio || 1, 2);
    W = cv.clientWidth; H = cv.clientHeight;
    cv.width = W * DPR; cv.height = H * DPR;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    const mobile = W < 860;
    R = mobile ? Math.min(W, H) * 0.5 : Math.min(W * 0.27, H * 0.36);
    cx = mobile ? W * 0.5 : W * 0.72;
    cy = mobile ? H * 0.32 : H * 0.52;
  }
  size();
  addEventListener('resize', size);

  let rotY = 0, tiltX = -0.35, targetTilt = -0.35, mouseY = 0;
  document.getElementById('hero').addEventListener('pointermove', (e) => {
    targetTilt = -0.35 + (e.clientY / innerHeight - 0.5) * 0.5;
    mouseY = (e.clientX / innerWidth - 0.5) * 0.004;
  });

  const proj = new Array(N);
  function frame() {
    rotY += 0.0022 + mouseY;
    tiltX += (targetTilt - tiltX) * 0.05;
    const cY = Math.cos(rotY), sY = Math.sin(rotY), cX = Math.cos(tiltX), sX = Math.sin(tiltX);

    for (let i = 0; i < N; i++) {
      let [x, y, z] = pts[i];
      const x1 = x * cY - z * sY, z1 = x * sY + z * cY;
      const y2 = y * cX - z1 * sX, z2 = y * sX + z1 * cX;
      const f = 2.6 / (2.6 + z2);
      proj[i] = [cx + x1 * R * f, cy + y2 * R * f, z2];
    }

    ctx.clearRect(0, 0, W, H);

    // orbit swoosh (like the logo)
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-0.32);
    const g = ctx.createLinearGradient(-R * 1.4, 0, R * 1.4, 0);
    g.addColorStop(0, 'rgba(141,204,66,0)');
    g.addColorStop(0.35, 'rgba(141,204,66,.75)');
    g.addColorStop(1, 'rgba(181,232,106,0)');
    ctx.strokeStyle = g; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(0, 0, R * 1.32, R * 0.36, 0, 0.15 * Math.PI, 1.05 * Math.PI); ctx.stroke();
    ctx.restore();

    // edges
    ctx.lineWidth = 1;
    for (const [a, b] of edges) {
      const za = proj[a][2], zb = proj[b][2];
      const depth = 1 - (za + zb + 2) / 4; // 1 = front
      ctx.strokeStyle = `rgba(141,204,66,${0.05 + depth * 0.38})`;
      ctx.beginPath(); ctx.moveTo(proj[a][0], proj[a][1]); ctx.lineTo(proj[b][0], proj[b][1]); ctx.stroke();
    }

    // nodes
    for (let i = 0; i < N; i++) {
      const [x, y, z] = proj[i];
      const depth = 1 - (z + 1) / 2;
      const r = 0.8 + depth * 2.2;
      ctx.fillStyle = `rgba(${150 + depth * 50 | 0},${210 + depth * 30 | 0},${80 + depth * 40 | 0},${0.2 + depth * 0.8})`;
      ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283); ctx.fill();
    }

    // pulses
    for (const p of pulses) {
      p.t += 0.015;
      if (p.t >= 1) { p.t = 0; p.e = (Math.random() * edges.length) | 0; }
      const [a, b] = edges[p.e];
      const x = proj[a][0] + (proj[b][0] - proj[a][0]) * p.t;
      const y = proj[a][1] + (proj[b][1] - proj[a][1]) * p.t;
      const depth = 1 - ((proj[a][2] + proj[b][2]) / 2 + 1) / 2;
      if (depth < 0.45) continue;
      ctx.fillStyle = 'rgba(220,255,170,.95)';
      ctx.shadowColor = '#8dcc42'; ctx.shadowBlur = 12;
      ctx.beginPath(); ctx.arc(x, y, 2.4, 0, 6.283); ctx.fill();
      ctx.shadowBlur = 0;
    }

  }

  // run only while the hero is on screen
  let running = false;
  function tick() {
    if (!running) return;
    frame();
    requestAnimationFrame(tick);
  }
  if (reduce) frame();
  else new IntersectionObserver(([en]) => {
    const was = running;
    running = en.isIntersecting;
    if (running && !was) tick();
  }).observe(cv);
})();
