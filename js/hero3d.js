/* Hero: thousands of glowing particles morph from a galaxy to a cell, to DNA, to an atom —
   a journey down the scales of matter. Three.js (WebGL) with a custom shader; falls back to the
   2D eyepiece animation when WebGL is unavailable. */
(function () {
  "use strict";
  const canvas = document.getElementById("hero-3d");
  const hero = document.getElementById("top");
  if (!canvas || !hero) return;

  const STAGES = [
    { name: "Une galaxie", scale: "≈ 100 000 années-lumière", note: "Des milliards d'étoiles, nées de la matière du Big Bang." },
    { name: "Une cellule", scale: "≈ 0,1 mm", note: "La plus petite unité du vivant, vue pour la première fois en 1665." },
    { name: "L'ADN", scale: "≈ 2 nm de large", note: "La double hélice qui porte l'information de chaque cellule." },
    { name: "Un atome", scale: "≈ 0,1 nm", note: "Un noyau minuscule et des électrons : presque du vide." },
  ];
  const HOLD_MS = 4200;
  const MORPH_S = 2.4;
  const TAU = Math.PI * 2;

  function fallback() {
    hero.classList.add("no-webgl");
    const lens = document.querySelector(".hero .eyepiece");
    if (lens) lens.hidden = false;
  }

  let renderer;
  try {
    if (!window.THREE) throw new Error("three.js missing");
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: "high-performance" });
  } catch (err) {
    fallback();
    return;
  }

  const small = window.innerWidth < 700;
  const N = small ? 5200 : 11000;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- point clouds for each stage ---------- */
  const rand = (() => { let a = 1234567; return () => { a = (a * 1664525 + 1013904223) >>> 0; return a / 4294967296; }; })();
  const gauss = () => { let u = 0, v = 0; while (!u) u = rand(); while (!v) v = rand(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * v); };
  const hex = (h) => [((h >> 16) & 255) / 255, ((h >> 8) & 255) / 255, (h & 255) / 255];
  const mixc = (a, b, t) => a.map((x, i) => x + (b[i] - x) * t);

  function cloud(fn) {
    const pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) {
      const { p, c } = fn(i);
      pos.set(p, i * 3);
      col.set(c, i * 3);
    }
    return { pos, col };
  }

  const galaxy = cloud((i) => {
    const arm = i % 3, r = Math.pow(rand(), 0.6) * 6.2;
    const ang = arm * (TAU / 3) + r * 0.95 + gauss() * 0.28 / (0.4 + r * 0.3);
    const spread = 0.35 + r * 0.06;
    const core = rand() < 0.18;
    const rr = core ? Math.abs(gauss()) * 0.9 : r;
    const a2 = core ? rand() * TAU : ang;
    const p = [Math.cos(a2) * rr + gauss() * spread * 0.4, gauss() * (core ? 0.35 : 0.14) * (1.4 - rr / 6.2), Math.sin(a2) * rr + gauss() * spread * 0.4];
    const c = core ? hex(0xfff1d6) : mixc(hex(0x9ab6ff), hex(0xff7fb5), Math.min(1, r / 6.2) * rand());
    return { p, c };
  });

  const cell = cloud(() => {
    const k = rand();
    if (k < 0.5) { // membrane
      const u = rand() * TAU, v = Math.acos(2 * rand() - 1), r = 4.2 + gauss() * 0.06;
      return { p: [r * Math.sin(v) * Math.cos(u), r * Math.cos(v) * 0.82, r * Math.sin(v) * Math.sin(u)], c: mixc(hex(0xff8fb8), hex(0xffd2e1), rand()) };
    }
    if (k < 0.75) { // nucleus
      const u = rand() * TAU, v = Math.acos(2 * rand() - 1), r = Math.cbrt(rand()) * 1.45;
      return { p: [r * Math.sin(v) * Math.cos(u) + 0.6, r * Math.cos(v), r * Math.sin(v) * Math.sin(u) - 0.3], c: mixc(hex(0x9b6bff), hex(0xd9c2ff), rand()) };
    }
    if (k < 0.88) { // mitochondria: small capsules
      const m = Math.floor(rand() * 5), seedA = m * 1.37, t = gauss() * 0.45;
      const cx = Math.cos(seedA * 2.1) * 2.5, cy = Math.sin(seedA * 3.3) * 1.6, cz = Math.sin(seedA * 1.7) * 2.2;
      return { p: [cx + t * Math.cos(seedA), cy + gauss() * 0.14, cz + t * Math.sin(seedA)], c: hex(0x7ff0c4) };
    }
    const u = rand() * TAU, v = Math.acos(2 * rand() - 1), r = Math.cbrt(rand()) * 3.9; // cytoplasm
    return { p: [r * Math.sin(v) * Math.cos(u), r * Math.cos(v) * 0.82, r * Math.sin(v) * Math.sin(u)], c: [0.55, 0.62, 0.72] };
  });

  const dna = cloud((i) => {
    const t = (rand() - 0.5) * 10.5, phase = t * 1.2;
    const k = i % 5;
    if (k < 4) { // two backbones
      const strand = k % 2 ? Math.PI : 0;
      return { p: [t, Math.cos(phase + strand) * 1.6 + gauss() * 0.06, Math.sin(phase + strand) * 1.6 + gauss() * 0.06], c: strand ? hex(0xff7fb5) : hex(0x86a8ff) };
    }
    const rung = Math.round(t * 2.2) / 2.2, ph = rung * 1.1, s = rand() * 2 - 1; // base pairs
    return { p: [rung, Math.cos(ph) * 1.6 * s, Math.sin(ph) * 1.6 * s], c: s > 0 ? hex(0xffd27a) : hex(0x7ff0c4) };
  });

  const atom = cloud((i) => {
    const k = rand();
    if (k < 0.2) { // nucleus: protons and neutrons
      const u = rand() * TAU, v = Math.acos(2 * rand() - 1), r = Math.cbrt(rand()) * 0.75;
      return { p: [r * Math.sin(v) * Math.cos(u), r * Math.cos(v), r * Math.sin(v) * Math.sin(u)], c: i % 2 ? hex(0xff6f9e) : hex(0xa9c4ff) };
    }
    if (k < 0.82) { // three orbits
      const a = rand() * TAU; // ellipse in the XY plane, tilted per orbit below
      return { p: [Math.cos(a) * 4.6, Math.sin(a) * 1.7, gauss() * 0.05], c: mixc(hex(0x86e3ff), hex(0xffffff), rand() * 0.5) };
    }
    const u = rand() * TAU, v = Math.acos(2 * rand() - 1), r = 1.2 + Math.abs(gauss()) * 2.4; // electron cloud
    return { p: [r * Math.sin(v) * Math.cos(u), r * Math.cos(v), r * Math.sin(v) * Math.sin(u)], c: [0.45, 0.6, 0.95] };
  });

  // spread the orbits over three planes (rotated around Z), the classic picture of an atom
  (function tiltOrbits() {
    const p = atom.pos;
    for (let i = 0; i < N; i++) {
      const x = p[i * 3], y = p[i * 3 + 1];
      const r = Math.hypot(x, y);
      if (r < 1) continue;
      const o = i % 3, a = o * (Math.PI / 3);
      p[i * 3] = x * Math.cos(a) - y * Math.sin(a);
      p[i * 3 + 1] = x * Math.sin(a) + y * Math.cos(a);
    }
  })();

  const SHAPES = [galaxy, cell, dna, atom];

  /* ---------- scene ---------- */
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.set(0, 2.2, 14);
  const geo = new THREE.BufferGeometry();
  const attr = (arr) => new THREE.BufferAttribute(arr, 3);
  const randAttr = new Float32Array(N).map(() => rand());
  geo.setAttribute("position", attr(new Float32Array(N * 3)));
  geo.setAttribute("aFrom", attr(SHAPES[0].pos));
  geo.setAttribute("aTo", attr(SHAPES[1].pos));
  geo.setAttribute("cFrom", attr(SHAPES[0].col));
  geo.setAttribute("cTo", attr(SHAPES[1].col));
  geo.setAttribute("aRand", new THREE.BufferAttribute(randAttr, 1));
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 20);

  const uniforms = {
    uMix: { value: 0 },
    uTime: { value: 0 },
    uSize: { value: small ? 4.2 : 3.8 },
    uPR: { value: Math.min(window.devicePixelRatio || 1, 2) },
  };
  const material = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: `
      attribute vec3 aFrom; attribute vec3 aTo; attribute vec3 cFrom; attribute vec3 cTo; attribute float aRand;
      uniform float uMix; uniform float uTime; uniform float uSize; uniform float uPR;
      varying vec3 vColor; varying float vAlpha;
      void main() {
        float t = clamp((uMix - aRand * 0.35) / 0.65, 0.0, 1.0);
        t = t * t * (3.0 - 2.0 * t);
        vec3 p = mix(aFrom, aTo, t);
        float burst = sin(t * 3.14159);
        p += normalize(p + vec3(0.001)) * burst * (0.6 + aRand * 1.8);
        p += vec3(sin(uTime * 0.7 + aRand * 31.0), cos(uTime * 0.6 + aRand * 17.0), sin(uTime * 0.5 + aRand * 11.0)) * 0.045;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = uSize * uPR * (0.6 + aRand * 1.2) * (10.0 / -mv.z);
        vColor = mix(cFrom, cTo, t);
        vAlpha = 0.75 + 0.25 * sin(uTime * 1.6 + aRand * 40.0);
      }`,
    fragmentShader: `
      varying vec3 vColor; varying float vAlpha;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float core = smoothstep(0.5, 0.0, d);
        float a = pow(core, 1.4) + 0.6 * pow(core, 6.0);
        gl_FragColor = vec4(vColor * (1.0 + 0.6 * pow(core, 6.0)), min(1.0, a * vAlpha));
      }`,
  });
  const points = new THREE.Points(geo, material);
  const group = new THREE.Group();
  group.add(points);
  scene.add(group);

  /* ---------- sizing ---------- */
  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // wide screens: cloud on the right of the text; narrow screens: cloud in the empty top area,
    // with the camera further back so the whole shape fits a tall screen
    const wide = w > 900;
    camera.setViewOffset(w, h, wide ? -w * 0.18 : 0, wide ? 0 : h * 0.24, w, h);
    camera.updateProjectionMatrix();
    baseZ = camera.aspect < 1 ? 14 + 8 * (1 - camera.aspect) : 14;
  }
  let baseZ = 14;
  new ResizeObserver(resize).observe(canvas);
  resize();

  /* ---------- stage label + dots ---------- */
  const nameEl = document.getElementById("hs-name");
  const scaleEl = document.getElementById("hs-scale");
  const noteEl = document.getElementById("hs-note");
  const dotsEl = document.getElementById("hs-dots");
  let stage = 0;
  const dots = STAGES.map((s, k) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "hs-dot";
    b.setAttribute("aria-label", `Voir : ${s.name}`);
    b.addEventListener("click", () => goTo(k, true));
    dotsEl.append(b);
    return b;
  });
  function label(k) {
    nameEl.textContent = STAGES[k].name;
    scaleEl.textContent = STAGES[k].scale;
    noteEl.textContent = STAGES[k].note;
    dots.forEach((d, i) => d.classList.toggle("is-on", i === k));
    if (window.gsap && !reduced) gsap.fromTo([nameEl, scaleEl, noteEl], { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, stagger: 0.07, ease: "power3.out" });
  }

  /* ---------- morph sequence ---------- */
  let timer = 0, morphing = false;
  function setPair(from, to) {
    geo.setAttribute("aFrom", attr(SHAPES[from].pos));
    geo.setAttribute("cFrom", attr(SHAPES[from].col));
    geo.setAttribute("aTo", attr(SHAPES[to].pos));
    geo.setAttribute("cTo", attr(SHAPES[to].col));
  }
  function goTo(k, user) {
    if (k === stage || morphing) return;
    clearTimeout(timer);
    setPair(stage, k);
    uniforms.uMix.value = 0;
    morphing = true;
    stage = k;
    label(k);
    const done = () => { morphing = false; setPair(k, k); uniforms.uMix.value = 0; schedule(); };
    if (window.gsap && !reduced) gsap.to(uniforms.uMix, { value: 1, duration: MORPH_S, ease: "power2.inOut", onComplete: done });
    else { uniforms.uMix.value = 1; done(); }
    if (user) clearTimeout(timer);
  }
  function schedule() {
    clearTimeout(timer);
    if (reduced) return;
    timer = setTimeout(() => goTo((stage + 1) % STAGES.length), HOLD_MS);
  }
  setPair(0, 0);
  label(0);
  schedule();

  /* ---------- pointer parallax + scroll ---------- */
  const tilt = { x: 0, y: 0, tx: 0, ty: 0 };
  hero.addEventListener("pointermove", (e) => {
    const r = hero.getBoundingClientRect();
    tilt.tx = ((e.clientY - r.top) / r.height - 0.5) * 0.5;
    tilt.ty = ((e.clientX - r.left) / r.width - 0.5) * 0.8;
  });
  let scrollFade = 0;
  if (window.gsap && window.ScrollTrigger) {
    ScrollTrigger.create({ trigger: hero, start: "top top", end: "bottom top", scrub: true, onUpdate: (s) => { scrollFade = s.progress; } });
  }

  /* ---------- render loop (only while visible) ---------- */
  let visible = true, last = performance.now(), spin = 0;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) { last = performance.now(); requestAnimationFrame(loop); } }).observe(hero);
  function loop(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    uniforms.uTime.value += reduced ? 0 : dt;
    if (!reduced) spin += dt * (stage === 2 ? 0.25 : 0.12);
    tilt.x += (tilt.tx - tilt.x) * 0.05;
    tilt.y += (tilt.ty - tilt.y) * 0.05;
    group.rotation.set(0.35 + tilt.x + (stage === 0 ? 0.25 : 0), spin + tilt.y, stage === 2 ? 0.25 : 0);
    camera.position.z = baseZ + scrollFade * 7;
    camera.position.y = 2.2 - scrollFade * 2;
    camera.lookAt(0, 0, 0);
    canvas.style.opacity = String(1 - scrollFade * 0.85);
    renderer.render(scene, camera);
    if (visible && !reduced) requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
