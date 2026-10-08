/* Physique-Chimie simulations: decay, Rutherford, Big Bang, tunnel microscope, crystals in microgravity. */
(function () {
  "use strict";
  const { animate, tokens, rgba, seeded, clamp, lerp, smooth, prefersReducedMotion } = window.VM;
  const { lens } = window.VM.draw;
  const TAU = Math.PI * 2;

  function setupCanvas(id) {
    const canvas = document.getElementById(id);
    if (!canvas) return null;
    return { canvas, ctx: canvas.getContext("2d"), W: canvas.width, H: canvas.height };
  }

  function label(ctx, text, x, y, { size = 22, color, align = "left", weight = 400, font = "Lexend" } = {}) {
    ctx.font = `${weight} ${size}px "${font}", system-ui, sans-serif`;
    ctx.fillStyle = color || rgba(tokens().ink);
    ctx.textAlign = align;
    ctx.fillText(text, x, y);
  }

  /* ---------- Radioactive decay ---------- */
  const NUCLEI = 100;
  const MAX_HALF_LIVES = 8;
  const RADIUM_HALF_LIFE_YEARS = 1600;

  function initDecay() {
    const env = setupCanvas("sim-decay");
    if (!env) return;
    const { canvas, ctx, W, H } = env;
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
        ? "<b>100</b> noyaux de radium au départ. Appuyez sur « Une demi-vie passe »."
        : `Après <b>${n}</b> demi-vie${n > 1 ? "s" : ""} (≈ ${(n * RADIUM_HALF_LIFE_YEARS).toLocaleString("fr-FR")} ans) : <b>${left}</b> noyaux restants · prévu en moyenne : ${expected.toLocaleString("fr-FR", { maximumFractionDigits: 1 })}`;
      stepBtn.disabled = n >= MAX_HALF_LIVES;
      loop.redraw();
    }

    function draw(now) {
      const tk = tokens();
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = rgba(tk.bg);
      ctx.beginPath(); ctx.roundRect(0, 0, W, H, 24); ctx.fill();
      label(ctx, "100 noyaux", 50, 62, { size: 26, weight: 700 });
      for (let i = 0; i < NUCLEI; i++) {
        const x = 75 + (i % 10) * 48, y = 120 + Math.floor(i / 10) * 48;
        const flash = clamp(1 - (now - flashAt[i]) / 700, 0, 1);
        ctx.beginPath();
        ctx.arc(x, y, 17 + flash * 8, 0, TAU);
        if (alive[i]) { ctx.fillStyle = rgba(tk.pink); ctx.fill(); }
        else {
          ctx.fillStyle = rgba(tk.brass, 0.15 + flash * 0.6);
          ctx.fill();
          ctx.strokeStyle = rgba(tk.muted, 0.6);
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }
      ctx.fillStyle = rgba(tk.pink); ctx.beginPath(); ctx.arc(70, 640, 11, 0, TAU); ctx.fill();
      label(ctx, "radium (instable)", 90, 648, { size: 20, color: rgba(tk.muted) });
      ctx.fillStyle = rgba(tk.brass, 0.15); ctx.beginPath(); ctx.arc(70, 682, 11, 0, TAU); ctx.fill();
      ctx.strokeStyle = rgba(tk.muted, 0.6); ctx.stroke();
      label(ctx, "désintégré (devenu radon)", 90, 690, { size: 20, color: rgba(tk.muted) });

      const cx = 650, cy = 110, cw = 500, ch = 500;
      const px = (n) => cx + (n / MAX_HALF_LIVES) * cw;
      const py = (v) => cy + ch - (v / NUCLEI) * ch;
      label(ctx, "Noyaux restants", cx - 20, 62, { size: 26, weight: 700 });
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
      label(ctx, "loi théorique : ÷ 2 à chaque demi-vie", px(2.2), py(62), { size: 19, color: rgba(tk.muted) });

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
  const FOIL_X = 720;
  const ATOM_SPACING = 84;
  const ALPHA_SPEED = 5;
  const COULOMB_K = 19; // closest head-on approach ≈ 1,5 px
  const SPAWN_MS = 70;

  function initRutherford() {
    const env = setupCanvas("sim-rutherford");
    if (!env) return;
    const { canvas, ctx, W, H } = env;
    const readout = document.getElementById("ruth-readout");
    const modeButtons = document.querySelectorAll("[data-model]");
    const nuclei = [];
    for (let y = 30; y < H; y += ATOM_SPACING) nuclei.push({ x: FOIL_X, y });
    let model = "rutherford";
    let particles = [];
    let counts = { straight: 0, deflected: 0, back: 0 };
    let spawnClock = 0;

    function newParticle(y) {
      return { x: 120, y: y ?? 50 + Math.random() * (H - 100), vx: ALPHA_SPEED, vy: 0, trail: [] };
    }

    function advance(p, frames) {
      const sub = 8;
      for (let s = 0; s < sub; s++) {
        const h = frames / sub;
        if (model === "rutherford") {
          nuclei.forEach((n) => {
            const dx = p.x - n.x, dy = p.y - n.y;
            const r2 = dx * dx + dy * dy;
            if (r2 > 3600) return;
            const r = Math.sqrt(r2 + 0.4);
            const f = COULOMB_K / (r * r * r);
            p.vx += dx * f * h;
            p.vy += dy * f * h;
          });
        } else if (Math.abs(p.x - FOIL_X) < 40) {
          p.vy += (Math.random() - 0.5) * 0.004 * h;
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

    const isOut = (p) => p.x > W + 20 || p.x < -20 || p.y < -20 || p.y > H + 20;

    function updateReadout() {
      const total = counts.straight + counts.deflected + counts.back;
      readout.innerHTML = `Sur <b>${total}</b> particules : ${counts.straight} tout droit · ${counts.deflected} déviées · <b>${counts.back}</b> renvoyées. <br>Dans la vraie expérience, à peine 1 sur 8 000 revenait en arrière : ici l'effet est exagéré pour être visible.`;
    }

    function drawScene() {
      const tk = tokens();
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = rgba(tk.bg);
      ctx.beginPath(); ctx.roundRect(0, 0, W, H, 24); ctx.fill();
      ctx.strokeStyle = rgba(tk.muted, 0.35);
      ctx.setLineDash([6, 10]);
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(FOIL_X, H / 2, 330, -1.2, 1.2); ctx.stroke();
      ctx.beginPath(); ctx.arc(FOIL_X, H / 2, 330, Math.PI - 0.9, Math.PI + 0.9); ctx.stroke();
      ctx.setLineDash([]);
      label(ctx, "écran détecteur", FOIL_X + 250, 50, { size: 19, color: rgba(tk.muted) });

      ctx.fillStyle = rgba(tk.ink);
      ctx.beginPath(); ctx.roundRect(20, H / 2 - 60, 100, 120, 12); ctx.fill();
      label(ctx, "source α", 70, H / 2 + 7, { size: 20, align: "center", color: rgba(tk.bg), weight: 700 });

      nuclei.forEach((n) => {
        if (model === "thomson") {
          const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, 42);
          g.addColorStop(0, rgba(tk.pink, 0.35));
          g.addColorStop(1, rgba(tk.pink, 0.08));
          ctx.fillStyle = g;
          ctx.beginPath(); ctx.arc(n.x, n.y, 42, 0, TAU); ctx.fill();
          ctx.fillStyle = rgba(tk.blue);
          for (let e = 0; e < 4; e++) { ctx.beginPath(); ctx.arc(n.x + Math.cos(e * 1.7 + n.y) * 22, n.y + Math.sin(e * 1.7 + n.y) * 22, 4, 0, TAU); ctx.fill(); }
        } else {
          ctx.strokeStyle = rgba(tk.muted, 0.35);
          ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.arc(n.x, n.y, 42, 0, TAU); ctx.stroke();
          ctx.fillStyle = rgba(tk.brass);
          ctx.beginPath(); ctx.arc(n.x, n.y, 4.5, 0, TAU); ctx.fill();
        }
      });
      label(ctx, "feuille d'or", FOIL_X, H - 16, { size: 20, align: "center", weight: 700 });
      label(ctx, model === "thomson" ? "· charge positive étalée" : "· noyau minuscule au centre", FOIL_X + 70, H - 16, { size: 18, color: rgba(tk.muted) });

      particles.forEach((p) => {
        if (p.trail.length > 1) {
          ctx.strokeStyle = rgba(tk.pink, 0.4);
          ctx.lineWidth = 2;
          ctx.beginPath();
          p.trail.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
          ctx.lineTo(p.x, p.y);
          ctx.stroke();
        }
        ctx.fillStyle = rgba(tk.pink);
        ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, TAU); ctx.fill();
      });
    }

    function staticRun() {
      particles = [];
      counts = { straight: 0, deflected: 0, back: 0 };
      const done = [];
      for (let i = 0; i < 90; i++) {
        const p = newParticle(40 + (i / 90) * (H - 80) + 0.37);
        p.trail = [];
        for (let k = 0; k < 600 && !isOut(p); k++) { advance(p, 1); if (k % 3 === 0) p.trail.push([p.x, p.y]); }
        classify(p);
        done.push(p);
      }
      particles = done;
      updateReadout();
    }

    const loop = animate(canvas, (now, dt) => {
      if (prefersReducedMotion()) { if (!particles.length) staticRun(); drawScene(); return; }
      const frames = dt / 16;
      spawnClock += dt;
      while (spawnClock > SPAWN_MS) { spawnClock -= SPAWN_MS; if (particles.length < 90) particles.push(newParticle()); }
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
  const ATOM_R = 40;
  const ATOM_STEP = 90;
  const TIP_GAP = 16;
  const SCAN_PX_PER_MS = 0.6;

  function initStm() {
    const env = setupCanvas("sim-stm");
    if (!env) return;
    const { canvas, ctx, W, H } = env;
    const readout = document.getElementById("stm-readout");
    const BASE = 290, X0 = 70, X1 = W - 70;
    const atomXs = (row) => Array.from({ length: 14 }, (_, i) => X0 - 20 + i * ATOM_STEP + (row % 2) * ATOM_STEP / 2);
    const heightAt = (x, row) => Math.max(0, ...atomXs(row).map((ax) => { const d = Math.abs(x - ax); return d < ATOM_R ? Math.sqrt(ATOM_R * ATOM_R - d * d) : 0; }));
    let row = 0, tipX = X0, trace = [], image = [], electrons = [];
    let lastRowShown = -1;

    if (prefersReducedMotion()) {
      for (let r = 0; r < STM_ROWS; r++) image.push(rowSamples(r));
      row = STM_ROWS - 1;
      tipX = W / 2;
      for (let x = X0; x <= tipX; x += 4) trace.push([x, heightAt(x, row)]);
    }

    function rowSamples(r) {
      const out = [];
      for (let x = X0; x <= X1; x += 6) out.push(heightAt(x, r));
      return out;
    }

    function draw(now) {
      const tk = tokens();
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = rgba(tk.bg);
      ctx.beginPath(); ctx.roundRect(0, 0, W, H, 24); ctx.fill();

      atomXs(row).forEach((ax) => {
        const g = ctx.createRadialGradient(ax - 10, BASE - 12, 0, ax, BASE, ATOM_R);
        g.addColorStop(0, rgba(tk.brass, 0.95));
        g.addColorStop(1, rgba(tk.brass, 0.35));
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(ax, BASE, ATOM_R, 0, TAU); ctx.fill();
      });
      ctx.fillStyle = rgba(tk.muted, 0.25);
      ctx.fillRect(0, BASE, W, 46);
      label(ctx, "surface du métal (atomes)", W - 24, BASE + 74, { size: 19, color: rgba(tk.muted), align: "right" });

      const apexY = BASE - heightAt(tipX, row) - TIP_GAP;
      ctx.fillStyle = rgba(tk.ink);
      ctx.beginPath(); ctx.moveTo(tipX - 46, 30); ctx.lineTo(tipX + 46, 30); ctx.lineTo(tipX + 6, apexY - 10); ctx.lineTo(tipX - 6, apexY - 10); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.arc(tipX, apexY - 5, 9, 0, TAU); ctx.fill();
      label(ctx, "pointe", tipX + 54, 64, { size: 19, weight: 700 });

      if (!prefersReducedMotion() && Math.random() < 0.5) electrons.push({ x: tipX + (Math.random() - 0.5) * 8, y: apexY + 4, born: now });
      electrons = electrons.filter((e) => now - e.born < 260);
      electrons.forEach((e) => {
        const t = (now - e.born) / 260;
        ctx.fillStyle = rgba(tk.blue, 1 - t);
        ctx.beginPath(); ctx.arc(e.x, lerp(e.y, e.y + TIP_GAP - 2, t), 3.5, 0, TAU); ctx.fill();
      });
      if (prefersReducedMotion()) {
        ctx.fillStyle = rgba(tk.blue);
        [0.2, 0.5, 0.8].forEach((t) => { ctx.beginPath(); ctx.arc(tipX, apexY + 4 + t * (TIP_GAP - 6), 3.5, 0, TAU); ctx.fill(); });
      }
      label(ctx, "e⁻ effet tunnel", tipX + 18, apexY + 12, { size: 17, color: rgba(tk.blue), weight: 700 });

      const TY = 490, TH = 60;
      label(ctx, "hauteur de la pointe enregistrée", X0, TY - TH - 20, { size: 19, color: rgba(tk.muted) });
      ctx.strokeStyle = rgba(tk.rule);
      ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(X0, TY); ctx.lineTo(X1, TY); ctx.stroke();
      ctx.strokeStyle = rgba(tk.blue);
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      trace.forEach(([x, h], i) => { const y = TY - (h / ATOM_R) * TH; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
      ctx.stroke();

      const IY = 548, rowH = 13;
      label(ctx, "image reconstruite, ligne après ligne", X0, IY - 10, { size: 19, color: rgba(tk.muted) });
      ctx.fillStyle = "#120a04";
      ctx.fillRect(X0, IY, X1 - X0, STM_ROWS * rowH);
      image.forEach((samples, r) => {
        samples.forEach((h, k) => {
          const b = h / ATOM_R;
          if (b <= 0.02) return;
          ctx.fillStyle = `rgba(${Math.round(120 + 135 * b)},${Math.round(60 + 150 * b * b)},${Math.round(20 + 80 * b * b * b)},1)`;
          ctx.fillRect(X0 + k * 6, IY + r * rowH, 6, rowH);
        });
      });
    }

    const loop = animate(canvas, (now, dt) => {
      if (!prefersReducedMotion()) {
        tipX += dt * SCAN_PX_PER_MS;
        trace.push([tipX, heightAt(tipX, row)]);
        if (tipX > X1) {
          image.push(rowSamples(row));
          row += 1;
          if (row >= STM_ROWS) { row = 0; image = []; }
          tipX = X0;
          trace = [];
        }
      }
      draw(now);
      if (row !== lastRowShown) {
        lastRowShown = row;
        readout.innerHTML = `Ligne <b>${row + 1}</b> / ${STM_ROWS} · la pointe reste à environ <b>0,5 nm</b> de la surface`;
      }
    });
    void loop;
  }

  /* ---------- Crystals: Earth vs ISS ---------- */
  const CRYSTALS = 34;
  const GROW_MS = 7000;

  function initGravity() {
    const env = setupCanvas("sim-gravity");
    if (!env) return;
    const { canvas, ctx, W, H } = env;
    const resetBtn = document.getElementById("gravity-reset");
    const readout = document.getElementById("gravity-readout");
    const BOX = { top: 110, bottom: H - 50, w: 470 };
    const boxes = [{ x: 60, earth: true }, { x: W - 60 - BOX.w, earth: false }];
    let crystals, elapsed, piles;

    function reset() {
      const rand = seeded(Math.floor(Math.random() * 1e6));
      elapsed = 0;
      piles = Array(Math.ceil(BOX.w / 22)).fill(0);
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
      if (prefersReducedMotion()) { for (let t = 0; t < GROW_MS + 2000; t += 32) stepSim(32); report(); }
      loop.redraw();
    }

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
        const bin = clamp(Math.floor((c.x - c.box.x) / 22), 0, piles.length - 1);
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
      const tk = tokens();
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = rgba(tk.bg);
      ctx.beginPath(); ctx.roundRect(0, 0, W, H, 24); ctx.fill();
      boxes.forEach((box) => {
        label(ctx, box.earth ? "Sur Terre · pesanteur" : "Dans l'ISS · microgravité", box.x + BOX.w / 2, 64, { size: 24, weight: 700, align: "center" });
        ctx.fillStyle = rgba(tk.blue, 0.08);
        ctx.fillRect(box.x, BOX.top, BOX.w, BOX.bottom - BOX.top);
        ctx.strokeStyle = rgba(tk.ink);
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(box.x, BOX.top - 20); ctx.lineTo(box.x, BOX.bottom); ctx.lineTo(box.x + BOX.w, BOX.bottom); ctx.lineTo(box.x + BOX.w, BOX.top - 20); ctx.stroke();
        if (box.earth) {
          ctx.strokeStyle = rgba(tk.muted, 0.45);
          ctx.lineWidth = 2;
          [0.25, 0.75].forEach((f, i) => {
            const cx = box.x + BOX.w * f, cy = (BOX.top + BOX.bottom) / 2;
            ctx.beginPath(); ctx.ellipse(cx, cy, BOX.w * 0.17, (BOX.bottom - BOX.top) * 0.32, 0, i ? 0.3 : Math.PI + 0.3, i ? Math.PI - 0.3 : TAU - 0.3); ctx.stroke();
          });
          label(ctx, "convection", box.x + 14, BOX.top + 26, { size: 17, color: rgba(tk.muted) });
          label(ctx, "sédimentation ↓", box.x + BOX.w - 14, BOX.bottom - 14 - Math.max(...piles), { size: 17, color: rgba(tk.muted), align: "right" });
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
        for (let k = 0; k < 6; k++) { const a = (k / 6) * TAU; const r = c.size; k ? ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r) : ctx.moveTo(r, 0); }
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.restore();
      });
    }

    let reported = false;
    const loop = animate(canvas, (now, dt) => {
      if (!crystals) return;
      if (!prefersReducedMotion() && elapsed < GROW_MS + 2500) {
        stepSim(dt);
        reported = false;
      } else if (!reported) { report(); reported = true; }
      draw();
    });
    resetBtn.addEventListener("click", () => { reported = false; reset(); });
    reset();
  }

  initDecay();
  initRutherford();
  initCosmos();
  initStm();
  initGravity();
})();
