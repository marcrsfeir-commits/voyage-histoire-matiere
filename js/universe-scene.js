/* Builds the 3D model of the history of the Universe (Three.js r128): an expanding "trumpet"
   whose length is time (Big Bang on the left, today on the right) and whose width is the size of
   the Universe. Inside: hot plasma, the cosmic microwave background, the cosmic web, the first
   stars, galaxies, the Milky Way and a zoomed Solar System. Used by js/universe3d.js. */
(function () {
  "use strict";
  window.VM = window.VM || {};

  const LENGTH = 40;
  const HALF = LENGTH / 2;

  /* Radius of the Universe along the time axis: inflation flare, slow growth, then acceleration. */
  function radius(u) {
    if (u < 1.4) return 0.1 + 2.1 * (1 - Math.pow(1 - u / 1.4, 3));
    return 2.2 + 0.075 * (u - 1.4) + 0.0016 * Math.pow(Math.max(0, u - 24), 2.4);
  }

  function seeded(seed) {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const rand = seeded(1927);
  const gauss = () => (rand() + rand() + rand() - 1.5) / 1.5;
  const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
  function ramp(stops, t) {
    for (let i = 1; i < stops.length; i++) {
      if (t <= stops[i][0]) return mix(stops[i - 1][1], stops[i][1], (t - stops[i - 1][0]) / (stops[i][0] - stops[i - 1][0]));
    }
    return stops[stops.length - 1][1];
  }
  function inCone(u, f = 1) {
    const a = rand() * Math.PI * 2;
    const r = radius(u) * f * Math.sqrt(rand());
    return new THREE.Vector3(u - HALF, r * Math.cos(a), r * Math.sin(a));
  }

  /* kind: 0 jittering plasma, 1 static, 2 twinkling star, 3 supernova, 4 background sky */
  function pointCloud() {
    const pos = [], col = [], size = [], phase = [], kind = [];
    return {
      add(p, c, s, k) { pos.push(p.x, p.y, p.z); col.push(...c); size.push(s); phase.push(rand()); kind.push(k); },
      geometry() {
        const g = new THREE.BufferGeometry();
        g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
        g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
        g.setAttribute("size", new THREE.Float32BufferAttribute(size, 1));
        g.setAttribute("phase", new THREE.Float32BufferAttribute(phase, 1));
        g.setAttribute("kind", new THREE.Float32BufferAttribute(kind, 1));
        return g;
      },
    };
  }

  const HOT = [[0, [1, 1, 1]], [0.25, [1, 0.94, 0.72]], [0.6, [1, 0.68, 0.32]], [1, [0.95, 0.4, 0.2]]];

  function addPlasma(cloud, q) {
    for (let i = 0; i < 9000 * q; i++) {
      const u = 7.1 * Math.pow(rand(), 1.5);
      const t = u / 7.1;
      const nucleus = u > 3.5 && rand() < 0.14;
      cloud.add(inCone(u, 0.96), nucleus ? [1, 0.82, 0.9] : ramp(HOT, t), nucleus ? 0.17 : 0.1 + 0.08 * (1 - t), 0);
    }
  }

  /* Filaments of the cosmic web: random walks drifting forward in time, kept inside the cone. */
  function buildWeb() {
    const nodes = [];
    for (let f = 0; f < 64; f++) {
      const u0 = 7.4 + rand() * 31;
      let p = inCone(u0, 0.8);
      let dir = new THREE.Vector3(0.6 + rand(), gauss(), gauss()).normalize();
      for (let s = 0; s < 14; s++) {
        const next = p.clone().addScaledVector(dir, 0.85);
        const u = next.x + HALF;
        if (u > LENGTH - 0.3) break;
        const radial = Math.hypot(next.y, next.z);
        if (radial > radius(u) * 0.85) { next.y *= 0.85; next.z *= 0.85; }
        nodes.push({ a: p, b: next, u });
        p = next;
        dir = dir.add(new THREE.Vector3(gauss() * 0.4, gauss() * 0.5, gauss() * 0.5)).normalize();
      }
    }
    return nodes;
  }

  function addWeb(cloud, nodes, q) {
    nodes.forEach(({ a, b, u }) => {
      const t = Math.min(1, Math.max(0, (u - 7) / 12));
      const c = mix([0.62, 0.32, 0.42], [0.45, 0.55, 1], t);
      for (let i = 0; i < 9 * q; i++) {
        const p = a.clone().lerp(b, rand()).add(new THREE.Vector3(gauss() * 0.1, gauss() * 0.14, gauss() * 0.14));
        cloud.add(p, c, 0.09, 1);
      }
    });
    for (let i = 0; i < 2600 * q; i++) {
      const u = 7.3 + rand() * 32.5;
      const t = Math.min(1, (u - 7) / 12);
      cloud.add(inCone(u, 0.92), mix([0.32, 0.18, 0.22], [0.22, 0.28, 0.5], t), 0.07, 1);
    }
  }

  function nodeNear(nodes, lo, hi) {
    const pool = nodes.filter((n) => n.u > lo && n.u < hi);
    if (!pool.length) return inCone(lo + rand() * (hi - lo), 0.8);
    const n = pool[Math.floor(rand() * pool.length)];
    return n.a.clone().lerp(n.b, rand());
  }

  function addStars(cloud, nodes, q) {
    for (let i = 0; i < 700 * q; i++) {
      const p = nodeNear(nodes, 13.5, 21).add(new THREE.Vector3(gauss() * 0.12, gauss() * 0.12, gauss() * 0.12));
      const sn = rand() < 0.07;
      cloud.add(p, sn ? [1, 0.88, 0.62] : [0.72, 0.84, 1], sn ? 0.2 : 0.15, sn ? 3 : 2);
    }
  }

  function addGalaxy(cloud, center, gr, n, tilt, elliptical) {
    const q = new THREE.Quaternion().setFromEuler(tilt);
    for (let j = 0; j < n; j++) {
      const t = rand();
      let local;
      if (elliptical) {
        local = new THREE.Vector3(gauss() * gr * 0.6, gauss() * gr * 0.4, gauss() * gr * 0.5);
      } else {
        const ang = t * 4.4 + (j % 2) * Math.PI + gauss() * 0.3;
        local = new THREE.Vector3(gr * t * Math.cos(ang), gauss() * gr * 0.05, gr * t * Math.sin(ang));
      }
      const c = elliptical ? [1, 0.82, 0.6] : t < 0.22 ? [1, 0.9, 0.72] : [0.62, 0.76, 1];
      cloud.add(local.applyQuaternion(q).add(center), c, 0.09, 1);
    }
  }

  function addGalaxies(cloud, nodes, q) {
    for (let g = 0; g < 150 * q; g++) {
      const u = 18.5 + 21 * Math.pow(rand(), 0.75);
      const center = nodeNear(nodes, u - 1.5, u + 1.5);
      const tilt = new THREE.Euler(rand() * Math.PI, rand() * Math.PI, rand() * Math.PI);
      addGalaxy(cloud, center, 0.14 + rand() * 0.24, 55, tilt, rand() < 0.25);
    }
  }

  function addSky(cloud, q) {
    for (let i = 0; i < 1800 * q; i++) {
      const v = new THREE.Vector3(gauss(), gauss(), gauss()).normalize().multiplyScalar(150 + rand() * 60);
      cloud.add(v, mix([0.7, 0.78, 1], [1, 0.9, 0.8], rand()), 0.9 + rand() * 0.9, 4);
    }
  }

  const VERTEX = `
    attribute float size; attribute float phase; attribute float kind; attribute vec3 color;
    uniform float uTime; uniform float uPR; uniform float uScale; uniform float uLo; uniform float uHi; uniform float uFocus;
    varying vec3 vColor; varying float vAlpha;
    void main() {
      vec3 p = position;
      float s = size;
      if (kind < 0.5) p += 0.035 * vec3(sin(uTime * 2.1 + phase * 40.0), sin(uTime * 1.7 + phase * 31.0), cos(uTime * 1.9 + phase * 27.0));
      if (kind > 1.5 && kind < 2.5) s *= 0.75 + 0.35 * sin(uTime * 2.5 + phase * 60.0);
      if (kind > 2.5 && kind < 3.5) s *= 1.0 + 5.0 * pow(max(0.0, sin(uTime * 0.7 + phase * 90.0)), 30.0);
      float inside = smoothstep(uLo - 1.0, uLo + 0.2, position.x) * (1.0 - smoothstep(uHi - 0.2, uHi + 1.0, position.x));
      vAlpha = kind > 3.5 ? 0.8 : mix(1.0, mix(0.18, 1.0, inside), uFocus);
      vColor = color;
      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      gl_PointSize = clamp(s * uScale * uPR * (420.0 / -mv.z), 0.0, (kind > 2.5 && kind < 3.5 ? 26.0 : 9.0) * uPR);
      gl_Position = projectionMatrix * mv;
    }`;
  const FRAGMENT = `
    varying vec3 vColor; varying float vAlpha;
    void main() {
      float d = length(gl_PointCoord - 0.5);
      float a = smoothstep(0.5, 0.0, d);
      gl_FragColor = vec4(vColor, a * a * vAlpha);
    }`;

  function canvasTexture(size, draw) {
    const c = document.createElement("canvas");
    c.width = c.height = size;
    draw(c.getContext("2d"), size);
    const tex = new THREE.CanvasTexture(c);
    tex.needsUpdate = true;
    return tex;
  }

  const glowTexture = () => canvasTexture(128, (ctx, s) => {
    const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.2, "rgba(255,240,200,0.7)");
    g.addColorStop(0.5, "rgba(255,170,90,0.18)");
    g.addColorStop(1, "rgba(255,120,60,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
  });

  /* Mottled map like the WMAP / Planck images of the cosmic microwave background. */
  const cmbTexture = () => canvasTexture(512, (ctx, s) => {
    ctx.fillStyle = "#3a9a6a";
    ctx.fillRect(0, 0, s, s);
    const palette = ["#1d2f9c", "#2f6fd0", "#36b1c4", "#5cc46a", "#e8d84a", "#f09a32", "#d8442a"];
    for (let i = 0; i < 1400; i++) {
      const x = rand() * s, y = rand() * s, r = 6 + rand() * 30;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, palette[Math.floor(rand() * palette.length)]);
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.globalAlpha = 0.45;
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
  });

  function coneLines() {
    const group = new THREE.Group();
    const mat = new THREE.LineBasicMaterial({ color: 0x9fb8ff, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false });
    for (let u = 0.5; u <= LENGTH; u += 1) {
      const pts = [];
      for (let k = 0; k <= 72; k++) {
        const a = (k / 72) * Math.PI * 2;
        pts.push(new THREE.Vector3(u - HALF, radius(u) * Math.cos(a), radius(u) * Math.sin(a)));
      }
      group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat));
    }
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2;
      const pts = [];
      for (let u = 0; u <= LENGTH; u += 0.25) pts.push(new THREE.Vector3(u - HALF, radius(u) * Math.cos(a), radius(u) * Math.sin(a)));
      group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat));
    }
    return group;
  }

  /* Zoomed Solar System: Sun and the 8 planets (distances compressed). */
  function solarSystem(glow) {
    const g = new THREE.Group();
    const sun = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: 0xffd27a, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    sun.scale.set(0.42, 0.42, 1);
    g.add(sun);
    const planets = [
      [0.13, 0.018, 0xb8a79a], [0.19, 0.026, 0xe8c27a], [0.26, 0.028, 0x5aa0ff], [0.33, 0.022, 0xe0643a],
      [0.47, 0.06, 0xd8b48a], [0.6, 0.052, 0xe8d6a0], [0.72, 0.038, 0x9fe0f0], [0.82, 0.036, 0x5b7bff],
    ];
    const ringMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.22, depthWrite: false });
    const bodies = planets.map(([r, s, c], i) => {
      const pts = [];
      for (let k = 0; k <= 96; k++) { const a = (k / 96) * Math.PI * 2; pts.push(new THREE.Vector3(r * Math.cos(a), 0, r * Math.sin(a))); }
      g.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), ringMat));
      const m = new THREE.Mesh(new THREE.SphereGeometry(s, 16, 12), new THREE.MeshBasicMaterial({ color: c, transparent: true }));
      g.add(m);
      return { m, r, speed: 1.6 / Math.pow(r, 1.5) * 0.08, a: i * 1.7 };
    });
    g.rotation.x = 0.55;
    g.userData.tick = (t) => bodies.forEach((b) => b.m.position.set(b.r * Math.cos(b.a + t * b.speed), 0, b.r * Math.sin(b.a + t * b.speed)));
    g.userData.fade = (o) => g.traverse((n) => { if (n.material) n.material.opacity = n.isLine ? 0.22 * o : o; });
    return g;
  }

  function build({ small }) {
    const q = small ? 0.55 : 1;
    const group = new THREE.Group();
    const uniforms = {
      uTime: { value: 0 }, uPR: { value: 1 }, uScale: { value: small ? 2 : 1.6 },
      uLo: { value: -99 }, uHi: { value: 99 }, uFocus: { value: 0 },
    };
    const material = new THREE.ShaderMaterial({ uniforms, vertexShader: VERTEX, fragmentShader: FRAGMENT, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });

    const cloud = pointCloud();
    const nodes = buildWeb();
    addPlasma(cloud, q);
    addWeb(cloud, nodes, q);
    addStars(cloud, nodes, q);
    addGalaxies(cloud, nodes, q);
    const milkyWay = new THREE.Vector3(30 - HALF, 1.1, 0.9);
    addGalaxy(cloud, milkyWay, 1.0, 1100 * q, new THREE.Euler(1.15, 0.2, 0.3), false);
    group.add(new THREE.Points(cloud.geometry(), material));

    const glow = glowTexture();
    const bang = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: 0xffffff, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    bang.position.set(-HALF, 0, 0);
    bang.scale.set(1.6, 1.6, 1);
    group.add(bang);
    const heat = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, color: 0xff9a50, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
    heat.position.set(2.5 - HALF, 0, 0);
    heat.scale.set(7, 7, 1);
    group.add(heat);

    const cmb = new THREE.Mesh(new THREE.CircleGeometry(radius(7) * 0.98, 72),
      new THREE.MeshBasicMaterial({ map: cmbTexture(), transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false }));
    cmb.position.set(7 - HALF, 0, 0);
    cmb.rotation.y = Math.PI / 2;
    group.add(cmb);

    group.add(coneLines());
    const solar = solarSystem(glow);
    solar.position.copy(milkyWay);
    solar.userData.fade(0);
    group.add(solar);

    const sky = pointCloud();
    addSky(sky, q);
    const skyPoints = new THREE.Points(sky.geometry(), material);

    return { group, sky: skyPoints, uniforms, solar, milkyWay, bang, cmb, radius, HALF, LENGTH };
  }

  window.VM.universeScene = { build, radius, HALF, LENGTH };
})();
