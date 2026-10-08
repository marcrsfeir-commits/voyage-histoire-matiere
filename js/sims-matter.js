/* Physique-Chimie simulations: decay, Rutherford, Big Bang, tunnel microscope, crystals in microgravity. */
(function () {
  "use strict";
  const { animate, tokens, rgba, seeded, clamp, lerp, smooth, prefersReducedMotion, logicalSize, setLogicalSize, uiScale } = window.VM;
  const { lens } = window.VM.draw;
  const TAU = Math.PI * 2;
  const COMPACT_MAX_CSS = 560; // below this on-screen width, wide simulations use their phone layout

  function setupCanvas(id, compactSize) {
    const canvas = document.getElementById(id);
    if (!canvas) return null;
    const full = { ...logicalSize(canvas) };
    const listeners = [];
    const env = {
      canvas,
      ctx: canvas.getContext("2d"),
      W: full.W,
      H: full.H,
      compact: false,
      ui: () => uiScale(canvas),
      onLayout: (fn) => listeners.push(fn),
      /* Switches between the wide and the taller phone layout; returns true when it changed. */
      sync() {
        const wantCompact = Boolean(compactSize) && canvas.clientWidth > 0 && canvas.clientWidth < COMPACT_MAX_CSS;
        if (wantCompact === env.compact) return false;
        const size = wantCompact ? compactSize : full;
        Object.assign(env, { compact: wantCompact, W: size.W, H: size.H });
        setLogicalSize(canvas, size.W, size.H);
        listeners.forEach((fn) => fn());
        return true;
      },
    };
    env.sync();
    return env;
  }

  /* Text grows on small screens (see VM.uiScale); beginDraw sets textScale for each frame. */
  let textScale = 1;
  function label(ctx, text, x, y, { size = 22, color, align = "left", weight = 400, font = "Lexend" } = {}) {
    ctx.font = `${weight} ${Math.round(size * textScale)}px "${font}", system-ui, sans-serif`;
    ctx.fillStyle = color || rgba(tokens().ink);
    ctx.textAlign = align;
    ctx.fillText(text, x, y);
  }

  function beginDraw(env) {
    env.sync();
    const { ctx, W, H } = env;
    const tk = tokens();
    textScale = env.ui();
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = rgba(tk.bg);
    ctx.beginPath(); ctx.roundRect(0, 0, W, H, W * 0.02); ctx.fill();
    return tk;
  }

  /* ---------- Radioactive decay ---------- */
  const NUCLEI = 100;
  const MAX_HALF_LIVES = 8;
  const RADIUM_HALF_LIFE_YEARS = 1600;
  const DECAY_LAYOUTS = {
    wide: { title: [50, 62], grid: { x: 75, y: 120, step: 48, r: 17 }, legend: { x: 70, y: [640, 682] }, chartTitle: [630, 62], chart: { x: 650, y: 110, w: 500, h: 500 }, law: ["loi théorique : ÷ 2 à chaque demi-vie", 2.2] },
    compact: { title: [36, 56], grid: { x: 84, y: 112, step: 48, r: 17 }, legend: { x: 66, y: [590, 630] }, chartTitle: [36, 716], chart: { x: 90, y: 756, w: 470, h: 240 }, law: ["÷ 2 à chaque demi-vie", 1.7] },
  };

  function initDecay() {
    const env = setupCanvas("sim-decay", { W: 600, H: 1100 });
    if (!env) return;
    const { canvas, ctx } = env;
    const stepBtn = document.getElementById("decay-step");
    const autoBtn = document.getElementById("decay-auto");
    const resetBtn = document.getElementById("decay-reset");
    const readout = document.getElementById("decay-readout");
    let alive, flashAt, history, timer = 0;

    function reset() {
      alive = Array(NUCLEI).fill(true);
      flashAt = Array(NUCLEI).fill(-1e9);
      history = [NUCLEI];
      stopAuto();
      update();
    }

    function step() {
      if (history.length > MAX_HALF_LIVES) return stopAuto();
      const now = performance.now();
      alive = alive.map((isAlive, i) => {
        if (isAlive && Math.random() < 0.5) { flashAt[i] = now; return false; }
        return isAlive;
      });
      history = [...history, alive.filter(Boolean).length];
      if (history.length > MAX_HALF_LIVES) stopAuto();
      update();
    }

    function stopAuto() {
      clearInterval(timer);
      timer = 0;
      autoBtn.setAttribute("aria-pressed", "false");
    }

    function update() {
      const n = history.length - 1;
      const left = history[n];
      const expected = NUCLEI / 2 ** n;
      readout.innerHTML = n === 0
        ? "<b>100</b> noyaux de radium au départ. Appuyez sur « Une demi-vie passe »."
        : `Après <b>${n}</b> demi-vie${n > 1 ? "s" : ""} (≈ ${(n * RADIUM_HALF_LIFE_YEARS).toLocaleString("fr-FR")} ans) : <b>${left}</b> noyaux restants · prévu en moyenne : ${expected.toLocaleString("fr-FR", { maximumFractionDigits: 1 })}`;
      stepBtn.disabled = n >= MAX_HALF_LIVES;
      loop.redraw();
    }

    function draw(now) {
      const tk = beginDraw(env);
      const L = env.compact ? DECAY_LAYOUTS.compact : DECAY_LAYOUTS.wide;
      label(ctx, "100 noyaux", ...L.title, { size: 26, weight: 700 });
      const { x: gx, y: gy, step: gs, r } = L.grid;
      for (let i = 0; i < NUCLEI; i++) {
        const x = gx + (i % 10) * gs, y = gy + Math.floor(i / 10) * gs;
        const flash = clamp(1 - (now - flashAt[i]) / 700, 0, 1);
        ctx.beginPath();
        ctx.arc(x, y, r + flash * 8, 0, TAU);
        if (alive[i]) { ctx.fillStyle = rgba(tk.pink); ctx.fill(); }
        else {
          ctx.fillStyle = rgba(tk.brass, 0.15 + flash * 0.6);
          ctx.fill();
          ctx.strokeStyle = rgba(tk.muted, 0.6);
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }
      const { x: lx, y: [ly1, ly2] } = L.legend;
      ctx.fillStyle = rgba(tk.pink); ctx.beginPath(); ctx.arc(lx, ly1, 11, 0, TAU); ctx.fill();
      label(ctx, "radium (instable)", lx + 22, ly1 + 8, { size: 20, color: rgba(tk.muted) });
      ctx.fillStyle = rgba(tk.brass, 0.15); ctx.beginPath(); ctx.arc(lx, ly2, 11, 0, TAU); ctx.fill();
      ctx.strokeStyle = rgba(tk.muted, 0.6); ctx.stroke();
      label(ctx, "désintégré (devenu radon)", lx + 22, ly2 + 8, { size: 20, color: rgba(tk.muted) });

      const { x: cx, y: cy, w: cw, h: ch } = L.chart;
      const px = (n) => cx + (n / MAX_HALF_LIVES) * cw;
      const py = (v) => cy + ch - (v / NUCLEI) * ch;
      label(ctx, "Noyaux restants", ...L.chartTitle, { size: 26, weight: 700 });
      ctx.strokeStyle = rgba(tk.rule);
      ctx.lineWidth = 1.5;
      [0, 25, 50, 75, 100].forEach((v) => {
        ctx.beginPath(); ctx.moveTo(cx, py(v)); ctx.lineTo(cx + cw, py(v)); ctx.stroke();
        label(ctx, String(v), cx - 14, py(v) + 7, { size: 18, align: "right", color: rgba(tk.muted), font: "JetBrains Mono" });
      });
      for (let n = 0; n <= MAX_HALF_LIVES; n++) label(ctx, String(n), px(n), cy + ch + 32, { size: 18, align: "center", color: rgba(tk.muted), font: "JetBrains Mono" });
      label(ctx, "nombre de demi-vies", cx + cw / 2, cy + ch + 66, { size: 20, align: "center", color: rgba(tk.muted) });

      ctx.setLineDash([8, 8]);
      ctx.strokeStyle = rgba(tk.muted);
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let k = 0; k <= 160; k++) { const n = (k / 160) * MAX_HALF_LIVES; const y = py(NUCLEI / 2 ** n); k ? ctx.lineTo(px(n), y) : ctx.moveTo(px(n), y); }
      ctx.stroke();
      ctx.setLineDash([]);
      label(ctx, L.law[0], px(L.law[1]), py(62), { size: 19, color: rgba(tk.muted) });

      ctx.strokeStyle = rgba(tk.pink);
      ctx.lineWidth = 4;
      ctx.beginPath();
      history.forEach((v, n) => (n ? ctx.lineTo(px(n), py(v)) : ctx.moveTo(px(n), py(v))));
      ctx.stroke();
      history.forEach((v, n) => {
        ctx.fillStyle = rgba(tk.pink);
        ctx.beginPath(); ctx.arc(px(n), py(v), 9, 0, TAU); ctx.fill();
        ctx.strokeStyle = rgba(tk.bg); ctx.lineWidth = 3; ctx.stroke();
      });
    }

    const loop = animate(canvas, (now) => { if (alive) draw(now); });
    stepBtn.addEventListener("click", step);
    resetBtn.addEventListener("click", reset);
    autoBtn.addEventListener("click", () => {
      if (timer) return stopAuto();
      if (history.length > MAX_HALF_LIVES) reset();
      autoBtn.setAttribute("aria-pressed", "true");
      step();
      timer = setInterval(step, 1100);
    });
    reset();
  }

  /* ---------- Rutherford's gold foil ---------- */
  /* Geometry is defined for a 1200-wide scene and scaled by s = W / 1200 (phone layout: W = 600). */
  const FOIL_X = 720;
  const ATOM_SPACING = 84;
  const ALPHA_SPEED = 5;
  const COULOMB_K = 19; // closest head-on approach ≈ 1,5 px
  const SPAWN_MS = 70;
  const MAX_PARTICLES = 90;

  function initRutherford() {
    const env = setupCanvas("sim-rutherford", { W: 600, H: 640 });
    if (!env) return;
    const { canvas, ctx } = env;
    const readout = document.getElementById("ruth-readout");
    const modeButtons = document.querySelectorAll("[data-model]");
    let model = "rutherford";
    let particles = [];
    let counts = { straight: 0, deflected: 0, back: 0 };
    let spawnClock = 0;
    let geo;

    function buildGeometry() {
      const s = env.W / 1200;
      const nuclei = [];
      for (let y = env.compact ? 74 : 30; y < env.H - (env.compact ? 46 : 56); y += ATOM_SPACING * s) nuclei.push({ x: FOIL_X * s, y });
      geo = { s, foilX: FOIL_X * s, nuclei, atomR: 42 * s, speed: ALPHA_SPEED * s, k: COULOMB_K * s ** 3, reach2: (60 * s) ** 2, spawnX: 120 * s };
      particles = [];
      counts = { straight: 0, deflected: 0, back: 0 };
    }
    env.onLayout(buildGeometry);
    buildGeometry();

    function newParticle(y) {
      return { x: geo.spawnX, y: y ?? 50 * geo.s + Math.random() * (env.H - 100 * geo.s), vx: geo.speed, vy: 0, trail: [] };
    }

    function advance(p, frames) {
      const sub = 8;
      for (let s = 0; s < sub; s++) {
        const h = frames / sub;
        if (model === "rutherford") {
          geo.nuclei.forEach((n) => {
            const dx = p.x - n.x, dy = p.y - n.y;
            const r2 = dx * dx + dy * dy;
            if (r2 > geo.reach2) return;
            const r = Math.sqrt(r2 + 0.4 * geo.s * geo.s);
            const f = geo.k / (r * r * r);
            p.vx += dx * f * h;
            p.vy += dy * f * h;
          });
        } else if (Math.abs(p.x - geo.foilX) < geo.atomR) {
          p.vy += (Math.random() - 0.5) * 0.004 * geo.s * h;
        }
        p.x += p.vx * h;
        p.y += p.vy * h;
      }
    }

    function classify(p) {
      const angle = Math.abs(Math.atan2(p.vy, p.vx)) * 180 / Math.PI;
      if (angle > 90) counts.back += 1;
      else if (angle > 15) counts.deflected += 1;
      else counts.straight += 1;
    }

    const isOut = (p) => p.x > env.W + 20 || p.x < -20 || p.y < -20 || p.y > env.H + 20;

    function updateReadout() {
      const total = counts.straight + counts.deflected + counts.back;
      readout.innerHTML = `Sur <b>${total}</b> particules : ${counts.straight} tout droit · ${counts.deflected} déviées · <b>${counts.back}</b> renvoyées. <br>Dans la vraie expérience, à peine 1 sur 8 000 revenait en arrière : ici l'effet est exagéré pour être visible.`;
    }

    function drawScene() {
      const tk = beginDraw(env);
      const { W, H } = env;
      const { s, foilX, atomR } = geo;
      ctx.strokeStyle = rgba(tk.muted, 0.35);
      ctx.setLineDash([6, 10]);
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(foilX, H / 2, 330 * s, -1.2, 1.2); ctx.stroke();
      ctx.beginPath(); ctx.arc(foilX, H / 2, 330 * s, Math.PI - 0.9, Math.PI + 0.9); ctx.stroke();
      ctx.setLineDash([]);
      label(ctx, "écran détecteur", W - 20, 40, { size: 19, color: rgba(tk.muted), align: "right" });
      label(ctx, model === "thomson" ? "charge positive étalée" : "noyau minuscule au centre", 20, 40, { size: 18, color: rgba(tk.muted) });

      const boxW = env.compact ? 64 : 100, boxH = env.compact ? 72 : 120;
      ctx.fillStyle = rgba(tk.ink);
      ctx.beginPath(); ctx.roundRect(12, H / 2 - boxH / 2, boxW, boxH, 10); ctx.fill();
      label(ctx, env.compact ? "α" : "source α", 12 + boxW / 2, H / 2 + 8, { size: env.compact ? 26 : 20, align: "center", color: rgba(tk.bg), weight: 700 });
      if (env.compact) label(ctx, "source", 12 + boxW / 2, H / 2 - boxH / 2 - 10, { size: 17, align: "center", color: rgba(tk.muted) });

      geo.nuclei.forEach((n) => {
        if (model === "thomson") {
          const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, atomR);
          g.addColorStop(0, rgba(tk.pink, 0.35));
          g.addColorStop(1, rgba(tk.pink, 0.08));
          ctx.fillStyle = g;
          ctx.beginPath(); ctx.arc(n.x, n.y, atomR, 0, TAU); ctx.fill();
          ctx.fillStyle = rgba(tk.blue);
          for (let e = 0; e < 4; e++) { ctx.beginPath(); ctx.arc(n.x + Math.cos(e * 1.7 + n.y) * atomR * 0.52, n.y + Math.sin(e * 1.7 + n.y) * atomR * 0.52, 4 * Math.max(s, 0.75), 0, TAU); ctx.fill(); }
        } else {
          ctx.strokeStyle = rgba(tk.muted, 0.35);
          ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.arc(n.x, n.y, atomR, 0, TAU); ctx.stroke();
          ctx.fillStyle = rgba(tk.brass);
          ctx.beginPath(); ctx.arc(n.x, n.y, 4.5 * Math.max(s, 0.75) * Math.sqrt(textScale), 0, TAU); ctx.fill();
        }
      });
      label(ctx, "feuille d'or", foilX, H - 14, { size: 20, align: "center", weight: 700 });

      const dot = 5 * Math.max(s, 0.75) * textScale;
      particles.forEach((p) => {
        if (p.trail.length > 1) {
          ctx.strokeStyle = rgba(tk.pink, 0.4);
          ctx.lineWidth = dot * 0.4;
          ctx.beginPath();
          p.trail.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
          ctx.lineTo(p.x, p.y);
          ctx.stroke();
        }
        ctx.fillStyle = rgba(tk.pink);
        ctx.beginPath(); ctx.arc(p.x, p.y, dot, 0, TAU); ctx.fill();
      });
    }

    function staticRun() {
      particles = [];
      counts = { straight: 0, deflected: 0, back: 0 };
      const done = [];
      for (let i = 0; i < MAX_PARTICLES; i++) {
        const p = newParticle(40 * geo.s + (i / MAX_PARTICLES) * (env.H - 80 * geo.s) + 0.37 * geo.s);
        for (let k = 0; k < 1200 && !isOut(p); k++) { advance(p, 1); if (k % 3 === 0) p.trail.push([p.x, p.y]); }
        classify(p);
        done.push(p);
      }
      particles = done;
      updateReadout();
    }

    const loop = animate(canvas, (now, dt) => {
      if (env.sync()) updateReadout();
      if (prefersReducedMotion()) { if (!particles.length) staticRun(); drawScene(); return; }
      const frames = dt / 16;
      spawnClock += dt;
      while (spawnClock > SPAWN_MS) { spawnClock -= SPAWN_MS; if (particles.length < MAX_PARTICLES) particles.push(newParticle()); }
      particles.forEach((p) => {
        advance(p, frames);
        p.trail.push([p.x, p.y]);
        if (p.trail.length > 46) p.trail.shift();
      });
      const exiting = particles.filter(isOut);
      if (exiting.length) { exiting.forEach(classify); updateReadout(); }
      particles = particles.filter((p) => !isOut(p));
      drawScene();
    });

    modeButtons.forEach((btn) => btn.addEventListener("click", () => {
      model = btn.dataset.model;
      modeButtons.forEach((b) => b.setAttribute("aria-pressed", String(b === btn)));
      particles = [];
      counts = { straight: 0, deflected: 0, back: 0 };
      if (prefersReducedMotion()) staticRun();
      updateReadout();
      loop.redraw();
    }));
    updateReadout();
  }

  /* ---------- Big Bang slider ---------- */
  const COSMOS_STAGES = [
    { title: "Le Big Bang", age: "0", temp: "inimaginable", text: "Tout l'Univers observable est extrêmement chaud et dense. Ce n'est pas une explosion dans le vide : c'est l'espace lui-même qui commence à grandir partout à la fois." },
    { title: "Les premiers noyaux", age: "3 minutes", temp: "≈ 1 milliard °C", text: "Protons et neutrons s'assemblent : les premiers noyaux d'hydrogène et d'hélium apparaissent. Il fait encore trop chaud pour former des atomes." },
    { title: "Les premiers atomes", age: "380 000 ans", temp: "≈ 3 000 °C", text: "Les électrons s'accrochent enfin aux noyaux : les atomes naissent. La lumière peut voyager librement ; c'est elle que l'on capte aujourd'hui comme fond diffus cosmologique." },
    { title: "Les premières étoiles", age: "≈ 200 millions d'années", temp: "≈ −220 °C", text: "Les nuages de gaz s'effondrent sous leur propre poids et s'allument : les étoiles fabriquent dans leur cœur le carbone, l'oxygène, le fer…" },
    { title: "Le Soleil et la Terre", age: "≈ 9,2 milliards d'années", temp: "≈ −269 °C", text: "Notre système solaire se forme avec du gaz et des poussières laissés par des étoiles plus anciennes. Les atomes de notre corps en viennent." },
    { title: "Aujourd'hui", age: "13,8 milliards d'années", temp: "−270 °C (2,7 K)", text: "Les galaxies continuent de s'éloigner les unes des autres. L'expansion de l'Univers prédite par Lemaître se poursuit, et elle accélère même." },
  ];

  function initCosmos() {
    const env = setupCanvas("sim-cosmos");
    const range = document.getElementById("cosmos-range");
    if (!env || !range) return;
    const { canvas, ctx, W: S } = env;
    const titleEl = document.getElementById("cosmos-title");
    const textEl = document.getElementById("cosmos-text");
    const readout = document.getElementById("cosmos-readout");
    const rand = seeded(77);
    const clusters = [{ x: 0.2, y: 0.25 }, { x: 0.7, y: 0.15 }, { x: 0.5, y: 0.55 }, { x: 0.15, y: 0.8 }, { x: 0.8, y: 0.75 }];
    const cell = Array.from({ length: 26 }, () => ({ x: rand(), y: rand(), hue: rand(), cl: Math.floor(rand() * clusters.length) }));
    const blobs = Array.from({ length: 70 }, () => ({ x: rand(), y: rand(), r: 0.04 + rand() * 0.08, warm: rand() < 0.5 }));
    let shown = -1;

    function drawUniverse(c, v, now) {
      const a = 0.06 + 0.94 * Math.pow(v / 5, 0.75);
      const plasma = 1 - smooth(clamp((v - 1.55) / 0.55, 0, 1));
      const cmb = clamp(1 - Math.abs(v - 2) / 0.55, 0, 1);
      const starLight = smooth(clamp((v - 2.6) / 0.7, 0, 1));
      const gather = smooth(clamp((v - 3.3) / 1.2, 0, 1));

      if (plasma < 0.97) {
        const size = a * S * 0.4;
        const n = Math.ceil(S / size / 2) + 1;
        for (let i = -n; i <= n; i++) {
          for (let j = -n; j <= n; j++) {
            cell.forEach((p, k) => {
              const cl = clusters[p.cl];
              const px = lerp(p.x, cl.x + (p.x - 0.5) * 0.12, gather);
              const py = lerp(p.y, cl.y + (p.y - 0.5) * 0.08, gather);
              const x = S / 2 + (i + px - 0.5) * size, y = S / 2 + (j + py - 0.5) * size;
              if (x < -10 || x > S + 10 || y < -10 || y > S + 10) return;
              const tw = 0.7 + 0.3 * Math.sin(now * 0.003 + k * 7 + i * 3 + j);
              const bright = lerp(0.25, 0.95 * tw, starLight);
              const col = p.hue < 0.33 ? "255,214,160" : p.hue < 0.66 ? "200,215,255" : "255,245,235";
              c.fillStyle = `rgba(${col},${bright})`;
              c.beginPath(); c.arc(x, y, lerp(1.6, 2.8, starLight), 0, TAU); c.fill();
            });
            if (gather > 0.05) {
              clusters.forEach((cl, ci) => {
                const x = S / 2 + (i + cl.x - 0.5) * size, y = S / 2 + (j + cl.y - 0.5) * size;
                if (x < -60 || x > S + 60 || y < -60 || y > S + 60) return;
                const r = size * 0.11;
                c.save(); c.translate(x, y); c.rotate(ci * 1.1 + i + j); c.scale(1, 0.45);
                const g = c.createRadialGradient(0, 0, 0, 0, 0, r);
                g.addColorStop(0, `rgba(255,248,230,${0.85 * gather})`);
                g.addColorStop(0.4, ci ? `rgba(150,170,255,${0.45 * gather})` : `rgba(255,190,130,${0.45 * gather})`);
                g.addColorStop(1, "rgba(0,0,0,0)");
                c.fillStyle = g; c.beginPath(); c.arc(0, 0, r, 0, TAU); c.fill(); c.restore();
              });
            }
          }
        }
      }
      if (cmb > 0) {
        blobs.forEach((b) => {
          const g = c.createRadialGradient(b.x * S, b.y * S, 0, b.x * S, b.y * S, b.r * S);
          g.addColorStop(0, b.warm ? `rgba(255,150,70,${0.35 * cmb})` : `rgba(80,140,255,${0.3 * cmb})`);
          g.addColorStop(1, "rgba(0,0,0,0)");
          c.fillStyle = g; c.beginPath(); c.arc(b.x * S, b.y * S, b.r * S, 0, TAU); c.fill();
        });
      }
      if (plasma > 0) {
        const heat = clamp(v / 1.6, 0, 1);
        const g = c.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S * 0.7);
        g.addColorStop(0, heat < 0.5 ? `rgba(255,255,240,${plasma})` : `rgba(255,${Math.round(lerp(230, 140, heat))},${Math.round(lerp(180, 60, heat))},${plasma})`);
        g.addColorStop(1, `rgba(${Math.round(lerp(255, 180, heat))},${Math.round(lerp(200, 60, heat))},${Math.round(lerp(120, 30, heat))},${plasma})`);
        c.fillStyle = g; c.fillRect(0, 0, S, S);
        const r2 = seeded(3);
        c.fillStyle = `rgba(255,255,255,${0.5 * plasma})`;
        for (let i = 0; i < 220; i++) {
          const x = (r2() * S + now * 0.05 * (r2() - 0.5) * 8) % S, y = (r2() * S + now * 0.04 * (r2() - 0.5) * 8) % S;
          c.beginPath(); c.arc((x + S) % S, (y + S) % S, 1.6, 0, TAU); c.fill();
        }
      }
    }

    const loop = animate(canvas, (now) => {
      const v = Number(range.value);
      lens(ctx, S, [{ mode: "dark", draw: (c) => drawUniverse(c, v, now) }]);
      const stage = Math.round(v);
      if (stage !== shown) {
        shown = stage;
        const st = COSMOS_STAGES[stage];
        titleEl.textContent = st.title;
        textEl.textContent = st.text;
        readout.innerHTML = `Âge de l'Univers : <b>${st.age}</b> · température : ${st.temp}`;
      }
    });
    range.addEventListener("input", loop.redraw);
  }

  /* ---------- Scanning tunnelling microscope ---------- */
  const STM_ROWS = 10;
  const SCAN_PX_PER_MS = 0.6;
  const STM_LAYOUTS = {
    wide: { base: 290, x0: 70, x1: 1130, r: 40, step: 90, gap: 16, tipHalf: 46, tipTop: 30, surfaceY: 364, traceY: 490, traceH: 60, imageY: 548, rowH: 13, sample: 6 },
    compact: { base: 214, x0: 30, x1: 570, r: 24, step: 54, gap: 12, tipHalf: 26, tipTop: 22, surfaceY: 290, traceY: 446, traceH: 56, imageY: 524, rowH: 30, sample: 4 },
  };

  function initStm() {
    const env = setupCanvas("sim-stm", { W: 600, H: 850 });
    if (!env) return;
    const { canvas, ctx } = env;
    const readout = document.getElementById("stm-readout");
    let L, row, tipX, trace, image, electrons = [];
    let lastRowShown = -1;

    const atomXs = (r) => Array.from({ length: Math.ceil((L.x1 - L.x0) / L.step) + 3 }, (_, i) => L.x0 - L.step / 4 + i * L.step + (r % 2) * L.step / 2);
    const heightAt = (x, r) => Math.max(0, ...atomXs(r).map((ax) => { const d = Math.abs(x - ax); return d < L.r ? Math.sqrt(L.r * L.r - d * d) : 0; }));

    function rowSamples(r) {
      const out = [];
      for (let x = L.x0; x <= L.x1; x += L.sample) out.push(heightAt(x, r));
      return out;
    }

    function restart() {
      L = env.compact ? STM_LAYOUTS.compact : STM_LAYOUTS.wide;
      row = 0; tipX = L.x0; trace = []; image = [];
      if (prefersReducedMotion()) {
        for (let r = 0; r < STM_ROWS; r++) image.push(rowSamples(r));
        row = STM_ROWS - 1;
        tipX = (L.x0 + L.x1) / 2;
        for (let x = L.x0; x <= tipX; x += 4) trace.push([x, heightAt(x, row)]);
      }
    }
    env.onLayout(restart);
    restart();

    function draw(now) {
      const tk = beginDraw(env);
      const { W } = env;
      atomXs(row).forEach((ax) => {
        const g = ctx.createRadialGradient(ax - L.r / 4, L.base - L.r / 3, 0, ax, L.base, L.r);
        g.addColorStop(0, rgba(tk.brass, 0.95));
        g.addColorStop(1, rgba(tk.brass, 0.35));
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(ax, L.base, L.r, 0, TAU); ctx.fill();
      });
      ctx.fillStyle = rgba(tk.muted, 0.25);
      ctx.fillRect(0, L.base, W, L.r * 1.15);
      label(ctx, "surface du métal (atomes)", W - 20, L.surfaceY, { size: 19, color: rgba(tk.muted), align: "right" });

      const apexY = L.base - heightAt(tipX, row) - L.gap;
      const neck = L.tipHalf * 0.13;
      ctx.fillStyle = rgba(tk.ink);
      ctx.beginPath(); ctx.moveTo(tipX - L.tipHalf, L.tipTop); ctx.lineTo(tipX + L.tipHalf, L.tipTop); ctx.lineTo(tipX + neck, apexY - L.gap * 0.6); ctx.lineTo(tipX - neck, apexY - L.gap * 0.6); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.arc(tipX, apexY - L.gap * 0.3, L.gap * 0.55, 0, TAU); ctx.fill();
      const onRight = tipX > W * 0.62;
      const side = onRight ? -1 : 1;
      label(ctx, "pointe", tipX + side * (L.tipHalf + 10), L.tipTop + 34, { size: 19, weight: 700, align: onRight ? "right" : "left" });

      if (!prefersReducedMotion() && Math.random() < 0.5) electrons.push({ x: tipX + (Math.random() - 0.5) * 8, y: apexY + 4, born: now });
      electrons = electrons.filter((e) => now - e.born < 260);
      electrons.forEach((e) => {
        const t = (now - e.born) / 260;
        ctx.fillStyle = rgba(tk.blue, 1 - t);
        ctx.beginPath(); ctx.arc(e.x, lerp(e.y, e.y + L.gap - 2, t), 3.5, 0, TAU); ctx.fill();
      });
      if (prefersReducedMotion()) {
        ctx.fillStyle = rgba(tk.blue);
        [0.2, 0.5, 0.8].forEach((t) => { ctx.beginPath(); ctx.arc(tipX, apexY + 4 + t * (L.gap - 6), 3.5, 0, TAU); ctx.fill(); });
      }
      label(ctx, "e⁻ effet tunnel", tipX + side * 16, apexY + 4, { size: 17, color: rgba(tk.blue), weight: 700, align: onRight ? "right" : "left" });

      const { traceY: TY, traceH: TH } = L;
      label(ctx, "hauteur de la pointe enregistrée", L.x0, TY - TH - 20, { size: 19, color: rgba(tk.muted) });
      ctx.strokeStyle = rgba(tk.rule);
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(L.x0, TY); ctx.lineTo(L.x1, TY); ctx.stroke();
      ctx.strokeStyle = rgba(tk.blue);
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      trace.forEach(([x, h], i) => { const y = TY - (h / L.r) * TH; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
      ctx.stroke();

      label(ctx, "image reconstruite, ligne après ligne", L.x0, L.imageY - 12, { size: 19, color: rgba(tk.muted) });
      ctx.fillStyle = "#120a04";
      ctx.fillRect(L.x0, L.imageY, L.x1 - L.x0, STM_ROWS * L.rowH);
      image.forEach((samples, r) => {
        samples.forEach((h, k) => {
          const b = h / L.r;
          if (b <= 0.02) return;
          ctx.fillStyle = `rgba(${Math.round(120 + 135 * b)},${Math.round(60 + 150 * b * b)},${Math.round(20 + 80 * b * b * b)},1)`;
          ctx.fillRect(L.x0 + k * L.sample, L.imageY + r * L.rowH, L.sample, L.rowH);
        });
      });
    }

    animate(canvas, (now, dt) => {
      env.sync();
      if (!prefersReducedMotion()) {
        tipX += dt * SCAN_PX_PER_MS * ((L.x1 - L.x0) / 1060);
        trace.push([tipX, heightAt(tipX, row)]);
        if (tipX > L.x1) {
          image.push(rowSamples(row));
          row += 1;
          if (row >= STM_ROWS) { row = 0; image = []; }
          tipX = L.x0;
          trace = [];
        }
      }
      draw(now);
      if (row !== lastRowShown) {
        lastRowShown = row;
        readout.innerHTML = `Ligne <b>${row + 1}</b> / ${STM_ROWS} · la pointe reste à environ <b>0,5 nm</b> de la surface`;
      }
    });
  }

  /* ---------- Crystals: Earth vs ISS ---------- */
  const CRYSTALS = 34;
  const GROW_MS = 7000;
  const PILE_BIN = 22;
  const GRAVITY_LAYOUTS = {
    wide: { box: { top: 110, bottom: 650, w: 470 }, xs: [60, 670], titles: ["Sur Terre · pesanteur", "Dans l'ISS · microgravité"], titleY: 64 },
    compact: { box: { top: 100, bottom: 790, w: 264 }, xs: [24, 312], titles: ["Sur Terre", "Dans l'ISS"], titleY: 60 },
  };

  function initGravity() {
    const env = setupCanvas("sim-gravity", { W: 600, H: 820 });
    if (!env) return;
    const { canvas, ctx } = env;
    const resetBtn = document.getElementById("gravity-reset");
    const readout = document.getElementById("gravity-readout");
    let L, BOX, boxes, crystals, elapsed, piles;
    let reported = false;

    function reset() {
      L = env.compact ? GRAVITY_LAYOUTS.compact : GRAVITY_LAYOUTS.wide;
      BOX = L.box;
      boxes = L.xs.map((x, i) => ({ x, earth: i === 0 }));
      const rand = seeded(Math.floor(Math.random() * 1e6));
      elapsed = 0;
      reported = false;
      piles = Array(Math.ceil(BOX.w / PILE_BIN)).fill(0);
      crystals = boxes.flatMap((box) => Array.from({ length: CRYSTALS }, () => ({
        box,
        x: box.x + 30 + rand() * (BOX.w - 60),
        y: BOX.top + 40 + rand() * (BOX.bottom - BOX.top - 90),
        vy: 0,
        size: 3,
        rate: box.earth ? 0.35 + rand() * 1.5 : 0.95 + rand() * 0.1,
        angle: rand() * TAU,
        settled: false,
      })));
      readout.textContent = "Les cristaux grandissent…";
      if (prefersReducedMotion()) { for (let t = 0; t < GROW_MS + 2000; t += 32) stepSim(32); report(); reported = true; }
    }
    env.onLayout(reset);

    function stepSim(dt) {
      elapsed += dt;
      const growing = elapsed < GROW_MS;
      crystals.forEach((c) => {
        if (growing) c.size += c.rate * dt * (c.settled ? 0.0009 : 0.0028);
        if (!c.box.earth) {
          c.x += Math.sin(elapsed * 0.0007 + c.angle * 9) * 0.03;
          c.y += Math.cos(elapsed * 0.0006 + c.angle * 7) * 0.03;
          return;
        }
        if (c.settled) return;
        const rel = (c.x - c.box.x) / BOX.w;
        c.x += Math.sin(rel * TAU) * Math.cos(((c.y - BOX.top) / (BOX.bottom - BOX.top)) * Math.PI) * 0.09 * dt * 0.06;
        c.x = clamp(c.x, c.box.x + 14, c.box.x + BOX.w - 14);
        c.vy += c.size * 0.00004 * dt;
        c.vy *= 0.97;
        c.y += c.vy * dt;
        const bin = clamp(Math.floor((c.x - c.box.x) / PILE_BIN), 0, piles.length - 1);
        const floor = BOX.bottom - piles[bin] - c.size;
        if (c.y >= floor) { c.y = floor; c.settled = true; piles[bin] += c.size * 0.9; }
      });
    }

    function spread(list) {
      const sizes = list.map((c) => c.size);
      const mean = sizes.reduce((a, b) => a + b, 0) / sizes.length;
      const sd = Math.sqrt(sizes.reduce((a, b) => a + (b - mean) ** 2, 0) / sizes.length);
      return Math.round((sd / mean) * 100);
    }

    function report() {
      const earth = spread(crystals.filter((c) => c.box.earth));
      const iss = spread(crystals.filter((c) => !c.box.earth));
      readout.innerHTML = `Écart de taille entre cristaux : Terre <b>± ${earth} %</b> · ISS <b>± ${iss} %</b>. Des cristaux réguliers donnent un médicament plus fluide.`;
    }

    function draw() {
      const tk = beginDraw(env);
      boxes.forEach((box, i) => {
        label(ctx, L.titles[i], box.x + BOX.w / 2, L.titleY, { size: 24, weight: 700, align: "center" });
        ctx.fillStyle = rgba(tk.blue, 0.08);
        ctx.fillRect(box.x, BOX.top, BOX.w, BOX.bottom - BOX.top);
        ctx.strokeStyle = rgba(tk.ink);
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(box.x, BOX.top - 20); ctx.lineTo(box.x, BOX.bottom); ctx.lineTo(box.x + BOX.w, BOX.bottom); ctx.lineTo(box.x + BOX.w, BOX.top - 20); ctx.stroke();
        if (box.earth) {
          ctx.strokeStyle = rgba(tk.muted, 0.45);
          ctx.lineWidth = 2;
          [0.25, 0.75].forEach((f, k) => {
            const cx = box.x + BOX.w * f, cy = (BOX.top + BOX.bottom) / 2;
            ctx.beginPath(); ctx.ellipse(cx, cy, BOX.w * 0.17, (BOX.bottom - BOX.top) * 0.32, 0, k ? 0.3 : Math.PI + 0.3, k ? Math.PI - 0.3 : TAU - 0.3); ctx.stroke();
          });
          label(ctx, "convection", box.x + 12, BOX.top + 28, { size: 17, color: rgba(tk.muted) });
          label(ctx, "sédimentation ↓", box.x + BOX.w - 12, BOX.bottom - 14 - Math.max(...piles), { size: 17, color: rgba(tk.muted), align: "right" });
        }
      });
      crystals.forEach((c) => {
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.rotate(c.angle);
        ctx.fillStyle = rgba(tk.blue, 0.35);
        ctx.strokeStyle = rgba(tk.blue);
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let k = 0; k < 6; k++) { const a = (k / 6) * TAU; k ? ctx.lineTo(Math.cos(a) * c.size, Math.sin(a) * c.size) : ctx.moveTo(c.size, 0); }
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.restore();
      });
    }

    reset();
    const loop = animate(canvas, (now, dt) => {
      env.sync();
      if (!prefersReducedMotion() && elapsed < GROW_MS + 2500) stepSim(dt);
      else if (!reported) { report(); reported = true; }
      draw();
    });
    resetBtn.addEventListener("click", () => { reset(); loop.redraw(); });
  }

  initDecay();
  initRutherford();
  initCosmos();
  initStm();
  initGravity();
})();
