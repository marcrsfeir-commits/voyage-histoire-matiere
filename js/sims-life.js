/* SVT simulations: Leeuwenhoek's pond drop and cell division. */
(function () {
  "use strict";
  const { animate, seeded, clamp, lerp, smooth, prefersReducedMotion } = window.VM;
  const { lens } = window.VM.draw;
  const TAU = Math.PI * 2;

  /* ---------- Pond drop ---------- */
  const MAX_MAG = 270;
  const EYE_LIMIT_UM = 100; // l'œil distingue environ 0,1 mm
  const DROP_RADIUS_UM = 2000; // une goutte de 4 mm
  const FIELD_UM_AT_MAX = 400; // champ réel vu à ×270

  function makeCreatures() {
    const rand = seeded(42);
    const list = [];
    const add = (n, kind, size, speed) => {
      for (let i = 0; i < n; i++) {
        const a = rand() * TAU, d = Math.sqrt(rand()) * (DROP_RADIUS_UM - 60);
        list.push({ kind, size: size * (0.7 + rand() * 0.6), x: Math.cos(a) * d, y: Math.sin(a) * d, heading: rand() * TAU, speed: (0.5 + rand()) * speed, phase: rand() * TAU });
      }
    };
    add(260, "cilie", 90, 90);
    add(160, "algue", 35, 6);
    add(380, "spire", 14, 40);
    add(5200, "bact", 3, 12);
    return list;
  }

  function drawCreature(ctx, c, px) {
    ctx.save();
    ctx.translate(c.sx, c.sy);
    ctx.rotate(c.heading);
    const L = c.size * px;
    if (c.kind === "cilie") {
      ctx.fillStyle = "rgba(120,150,90,0.55)";
      ctx.strokeStyle = "rgba(70,95,50,0.9)";
      ctx.lineWidth = Math.max(1, L * 0.02);
      ctx.beginPath(); ctx.ellipse(0, 0, L / 2, L / 5, 0, 0, TAU); ctx.fill(); ctx.stroke();
      if (L > 30) {
        ctx.beginPath();
        for (let i = 0; i < 28; i++) {
          const a = (i / 28) * TAU, wob = Math.sin(c.phase * 6 + i) * 0.3;
          const x = Math.cos(a) * L / 2, y = Math.sin(a) * L / 5;
          ctx.moveTo(x, y);
          ctx.lineTo(x * (1.12 + wob * 0.05), y * (1.3 + wob * 0.1));
        }
        ctx.stroke();
        ctx.fillStyle = "rgba(60,80,40,0.6)";
        ctx.beginPath(); ctx.ellipse(L * 0.05, 0, L * 0.09, L * 0.06, 0, 0, TAU); ctx.fill();
      }
    } else if (c.kind === "algue") {
      ctx.fillStyle = "rgba(60,140,80,0.6)";
      ctx.beginPath(); ctx.arc(0, 0, L / 2, 0, TAU); ctx.fill();
      ctx.fillStyle = "rgba(30,90,40,0.7)";
      for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(Math.cos(i * 1.3) * L * 0.22, Math.sin(i * 1.3) * L * 0.22, L * 0.1, 0, TAU); ctx.fill(); }
    } else if (c.kind === "spire") {
      ctx.strokeStyle = "rgba(110,70,130,0.85)";
      ctx.lineWidth = Math.max(1, L * 0.12);
      ctx.beginPath();
      for (let k = 0; k <= 16; k++) { const x = -L / 2 + (k / 16) * L, y = Math.sin(k * 1.2 + c.phase * 4) * L * 0.12; k ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.stroke();
    } else {
      ctx.strokeStyle = "rgba(110,60,140,0.85)";
      ctx.lineCap = "round";
      ctx.lineWidth = Math.max(1, L * 0.45);
      ctx.beginPath(); ctx.moveTo(-L / 2, 0); ctx.lineTo(L / 2, 0); ctx.stroke();
    }
    ctx.restore();
  }

  function initPond() {
    const canvas = document.getElementById("sim-pond");
    const range = document.getElementById("pond-zoom");
    const readout = document.getElementById("pond-readout");
    if (!canvas || !range) return;
    const ctx = canvas.getContext("2d");
    const S = canvas.width;
    const creatures = makeCreatures();
    let lastMag = -1;

    const magnification = () => Math.pow(MAX_MAG, Number(range.value));

    function describe(mag) {
      const seen = [];
      if (110 * mag >= EYE_LIMIT_UM * 1.3) seen.push("les infusoires");
      if (14 * mag >= EYE_LIMIT_UM * 1.3) seen.push("les spirilles");
      if (3 * mag >= EYE_LIMIT_UM * 1.3) seen.push("les bactéries");
      const what = seen.length ? `on distingue ${seen.join(", ")}` : "la goutte paraît vide";
      const apparent = 3 * mag;
      const apparentText = apparent >= 1000 ? `${(apparent / 1000).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} mm` : `${Math.round(apparent)} µm`;
      return `<b>×${Math.round(mag)}</b> · ${what}. Une bactérie de 3 µm paraît mesurer ${apparentText} (l'œil voit à partir de 100 µm).`;
    }

    const loop = animate(canvas, (now, dt) => {
      const mag = magnification();
      const px = (S / (FIELD_UM_AT_MAX * MAX_MAG)) * mag; // pixels per real micrometre
      creatures.forEach((c) => {
        c.phase += dt * 0.001;
        c.heading += Math.sin(c.phase * 1.7) * 0.02;
        c.x += Math.cos(c.heading) * c.speed * dt * 0.001;
        c.y += Math.sin(c.heading) * c.speed * dt * 0.001;
        if (Math.hypot(c.x, c.y) > DROP_RADIUS_UM - 40) c.heading = Math.atan2(-c.y, -c.x) + (Math.random() - 0.5);
      });
      lens(ctx, S, [{
        mode: "bright",
        draw(c) {
          const dropR = DROP_RADIUS_UM * px;
          const g = c.createRadialGradient(S / 2 - dropR * 0.3, S / 2 - dropR * 0.3, 0, S / 2, S / 2, dropR);
          g.addColorStop(0, "rgba(214,232,226,0.95)");
          g.addColorStop(0.9, "rgba(190,214,206,0.9)");
          g.addColorStop(1, "rgba(120,150,140,0.9)");
          c.fillStyle = g;
          c.beginPath(); c.arc(S / 2, S / 2, dropR, 0, TAU); c.fill();
          creatures.forEach((cr) => {
            const visibility = clamp((cr.size * mag - EYE_LIMIT_UM * 0.6) / (EYE_LIMIT_UM * 0.9), 0, 1);
            if (visibility <= 0) return;
            cr.sx = S / 2 + cr.x * px;
            cr.sy = S / 2 + cr.y * px;
            const reach = cr.size * px;
            if (cr.sx < -reach || cr.sx > S + reach || cr.sy < -reach || cr.sy > S + reach) return;
            c.globalAlpha = visibility;
            drawCreature(c, cr, px);
          });
          c.globalAlpha = 1;
        },
      }]);
      if (Math.abs(mag - lastMag) > 0.5) {
        lastMag = mag;
        readout.innerHTML = describe(mag);
      }
    });
    range.addEventListener("input", loop.redraw);
  }

  /* ---------- Cell division ---------- */
  const PHASE_MS = 2200;
  const PHASES = 5;
  const CELL_FILL = "#eccfd8";
  const CELL_EDGE = "#a24a6f";
  const CHROMO = "#5a2a7a";

  function cellBodies(ctx, centers, r) {
    ctx.fillStyle = CELL_EDGE;
    centers.forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x, y, r + 5, 0, TAU); ctx.fill(); });
    ctx.fillStyle = CELL_FILL;
    centers.forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); });
  }

  function chromosome(ctx, x, y, angle, size, split) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.strokeStyle = CHROMO;
    ctx.lineCap = "round";
    ctx.lineWidth = size * 0.32;
    const arms = split ? [0] : [-1, 1];
    arms.forEach((s) => {
      ctx.beginPath();
      ctx.moveTo(-size * 0.5, s * size * 0.12);
      ctx.quadraticCurveTo(0, s * size * 0.02, size * 0.5, s * size * 0.12);
      ctx.stroke();
    });
    ctx.restore();
  }

  function drawMitosis(ctx, S, p) {
    const c = S / 2;
    const rand = seeded(9);
    const chromos = Array.from({ length: 6 }, (_, i) => ({ x: (rand() - 0.5) * 90, y: (rand() - 0.5) * 90, a: rand() * Math.PI, ty: (i - 2.5) * 30 }));
    const stage = Math.floor(p), f = smooth(p - stage);

    const sep = stage < 3 ? 0 : stage === 3 ? f * 125 : 125 + f * 25;
    const radius = stage < 3 ? 165 : stage === 3 ? lerp(165, 128, f) : 128;
    cellBodies(ctx, sep ? [[c - sep, c], [c + sep, c]] : [[c, c]], radius);

    const nucleusAlpha = stage === 0 ? 1 : stage === 1 ? 1 - f : 0;
    if (nucleusAlpha > 0) {
      ctx.globalAlpha = nucleusAlpha;
      ctx.fillStyle = "rgba(150,90,160,0.35)";
      ctx.strokeStyle = "rgba(110,60,130,0.8)";
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(c, c, 72, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "rgba(90,42,122,0.5)";
      for (let i = 0; i < 40; i++) { const a = rand() * TAU, d = Math.sqrt(rand()) * 60; ctx.beginPath(); ctx.arc(c + Math.cos(a) * d, c + Math.sin(a) * d, 3, 0, TAU); ctx.fill(); }
      ctx.globalAlpha = 1;
    }

    if (stage === 1) {
      ctx.globalAlpha = f;
      chromos.forEach((ch) => chromosome(ctx, c + ch.x, c + ch.y, ch.a, 44, false));
      ctx.globalAlpha = 1;
    } else if (stage === 2) {
      const align = smooth(clamp(f * 2, 0, 1)), pull = smooth(clamp(f * 2 - 1, 0, 1));
      ctx.strokeStyle = "rgba(120,90,140,0.35)";
      ctx.lineWidth = 2;
      chromos.forEach((ch) => {
        const y = c + lerp(ch.y, ch.ty, align), angle = lerp(ch.a, 0, align);
        [-1, 1].forEach((s) => {
          const x = c + s * pull * 110;
          ctx.beginPath(); ctx.moveTo(c + s * 150, c); ctx.lineTo(x, y); ctx.stroke();
          chromosome(ctx, x, y, angle, 44, pull > 0.05);
        });
      });
    } else if (stage >= 3) {
      const poleX = Math.max(110, sep);
      chromos.forEach((ch) => [-1, 1].forEach((s) => chromosome(ctx, c + s * poleX, c + ch.ty * 0.7, (ch.a - 1.5) * 0.25, 38, true)));
      if (stage === 4) {
        [-1, 1].forEach((s) => {
          ctx.globalAlpha = f;
          ctx.fillStyle = "rgba(150,90,160,0.45)";
          ctx.strokeStyle = "rgba(110,60,130,0.8)";
          ctx.lineWidth = 4;
          ctx.beginPath(); ctx.arc(c + s * (sep + 4), c, 58, 0, TAU); ctx.fill(); ctx.stroke();
          ctx.globalAlpha = 1;
        });
      }
    }
  }

  function initMitosis() {
    const canvas = document.getElementById("sim-mitosis");
    const playBtn = document.getElementById("mitosis-play");
    const stepBtn = document.getElementById("mitosis-step");
    const steps = document.querySelectorAll("#mitosis-steps li");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const S = canvas.width;
    let playing = !prefersReducedMotion();
    let progress = prefersReducedMotion() ? 0.6 : 0;
    let shownStep = -1;
    playBtn.setAttribute("aria-pressed", String(playing));
    playBtn.textContent = playing ? "Pause" : "Lecture";

    const loop = animate(canvas, (now, dt) => {
      if (playing) progress = (progress + dt / PHASE_MS) % (PHASES + 0.6);
      const p = Math.min(progress, PHASES - 0.001);
      lens(ctx, S, [{ mode: "bright", draw: (c) => drawMitosis(c, S, p) }]);
      const step = Math.floor(p);
      if (step !== shownStep) {
        shownStep = step;
        steps.forEach((li, i) => li.classList.toggle("on", i === step));
      }
    });

    playBtn.addEventListener("click", () => {
      playing = !playing;
      playBtn.setAttribute("aria-pressed", String(playing));
      playBtn.textContent = playing ? "Pause" : "Lecture";
      loop.redraw();
    });
    stepBtn.addEventListener("click", () => {
      playing = false;
      playBtn.setAttribute("aria-pressed", "false");
      playBtn.textContent = "Lecture";
      progress = (Math.floor(Math.min(progress, PHASES - 0.001)) + 1) % PHASES + 0.6;
      loop.redraw();
    });
  }

  initPond();
  initMitosis();
})();
