/* Drawings shown inside the round "field of view": one function per object, all centred on (S/2, S/2).
   Colours inside the lens imitate real microscope images (stains, false colour), so they stay fixed in both themes. */
(function () {
  "use strict";
  const { seeded, tokens, rgba } = window.VM;
  const TAU = Math.PI * 2;

  const BRIGHT_FIELD = ["#f7f2e4", "#e4dcc6"];
  const DARK_FIELD = ["#0f1b21", "#05090b"];

  function fieldBackground(ctx, S, mode) {
    const [inner, outer] = mode === "bright" ? BRIGHT_FIELD : DARK_FIELD;
    const g = ctx.createRadialGradient(S * 0.45, S * 0.42, 0, S / 2, S / 2, S * 0.55);
    g.addColorStop(0, inner);
    g.addColorStop(1, outer);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, S, S);
  }

  /* Clip to the eyepiece circle, paint layers, then add vignette + bezel. */
  function lens(ctx, S, layers) {
    const r = S / 2 - S * 0.03;
    ctx.clearRect(0, 0, S, S);
    ctx.save();
    ctx.beginPath();
    ctx.arc(S / 2, S / 2, r, 0, TAU);
    ctx.clip();
    layers.forEach(({ mode, alpha = 1, draw }) => {
      if (alpha <= 0.002) return;
      ctx.save();
      ctx.globalAlpha = alpha;
      fieldBackground(ctx, S, mode);
      draw(ctx, S);
      ctx.restore();
    });
    const v = ctx.createRadialGradient(S / 2, S / 2, r * 0.62, S / 2, S / 2, r);
    v.addColorStop(0, "rgba(0,0,0,0)");
    v.addColorStop(1, "rgba(0,0,0,0.55)");
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, S, S);
    ctx.restore();

    const tk = tokens();
    ctx.lineWidth = S * 0.026;
    ctx.strokeStyle = rgba(tk.ink);
    ctx.beginPath();
    ctx.arc(S / 2, S / 2, r + S * 0.012, 0, TAU);
    ctx.stroke();
    ctx.lineWidth = S * 0.004;
    ctx.strokeStyle = rgba(tk.brass);
    ctx.beginPath();
    ctx.arc(S / 2, S / 2, r - S * 0.004, 0, TAU);
    ctx.stroke();
  }

  function scaleBar(ctx, S, label, mode, widthFrac = 0.28) {
    const color = mode === "bright" ? "rgba(20,24,28,0.85)" : "rgba(235,240,238,0.9)";
    const w = S * widthFrac, x = S / 2 - w / 2, y = S * 0.84;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = S * 0.006;
    ctx.beginPath();
    ctx.moveTo(x, y); ctx.lineTo(x + w, y);
    ctx.moveTo(x, y - S * 0.012); ctx.lineTo(x, y + S * 0.012);
    ctx.moveTo(x + w, y - S * 0.012); ctx.lineTo(x + w, y + S * 0.012);
    ctx.stroke();
    ctx.font = `700 ${Math.round(S * 0.032)}px "JetBrains Mono", monospace`;
    ctx.textAlign = "center";
    ctx.fillText(label, x + w / 2, y - S * 0.024);
    ctx.restore();
  }

  /* ---------- Objects ---------- */

  function ant(ctx, S) {
    const c = S / 2;
    ctx.save();
    ctx.translate(c, c);
    ctx.rotate(-0.5);
    ctx.strokeStyle = "#2b1d14";
    ctx.fillStyle = "#2b1d14";
    ctx.lineCap = "round";
    ctx.lineWidth = S * 0.011;
    const legs = [[-0.02, -1], [0.04, -1], [0.1, -1], [-0.02, 1], [0.04, 1], [0.1, 1]];
    legs.forEach(([dx, side], i) => {
      const bx = S * dx, sweep = (i % 3 - 1) * 0.55;
      ctx.beginPath();
      ctx.moveTo(bx, 0);
      ctx.lineTo(bx + S * 0.09 * Math.sin(sweep), side * S * 0.12);
      ctx.lineTo(bx + S * 0.2 * Math.sin(sweep) + S * 0.02, side * S * 0.24);
      ctx.stroke();
    });
    ctx.beginPath(); ctx.ellipse(-S * 0.2, 0, S * 0.15, S * 0.1, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(S * 0.04, 0, S * 0.1, S * 0.045, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.ellipse(S * 0.21, 0, S * 0.07, S * 0.065, 0, 0, TAU); ctx.fill();
    ctx.lineWidth = S * 0.007;
    [-1, 1].forEach((side) => {
      ctx.beginPath();
      ctx.moveTo(S * 0.26, side * S * 0.03);
      ctx.lineTo(S * 0.34, side * S * 0.09);
      ctx.lineTo(S * 0.42, side * S * 0.06);
      ctx.stroke();
    });
    ctx.fillStyle = "rgba(255,255,255,0.22)";
    ctx.beginPath(); ctx.ellipse(-S * 0.23, -S * 0.04, S * 0.06, S * 0.025, 0, 0, TAU); ctx.fill();
    ctx.restore();
  }

  function onion(ctx, S) {
    const rand = seeded(7);
    const w = S * 0.34, h = S * 0.11, patch = S * 0.78;
    ctx.save();
    ctx.translate(S / 2, S / 2);
    ctx.rotate(-0.18);
    for (let row = -8; row <= 8; row++) {
      const y = row * h;
      const offset = (row % 2) * w * 0.5;
      for (let col = -4; col <= 4; col++) {
        const x = col * w + offset;
        if (Math.hypot(x, y) > patch) continue;
        const jw = w * (0.92 + rand() * 0.12);
        ctx.fillStyle = "rgba(120,104,196,0.16)";
        ctx.strokeStyle = "rgba(76,62,150,0.85)";
        ctx.lineWidth = S * 0.006;
        ctx.beginPath();
        ctx.roundRect(x - jw / 2, y - h / 2, jw, h, S * 0.012);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "rgba(70,50,140,0.75)";
        ctx.beginPath();
        ctx.ellipse(x + (rand() - 0.5) * jw * 0.6, y + (rand() - 0.5) * h * 0.3, S * 0.022, S * 0.017, 0, 0, TAU);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  function hair(ctx, S) {
    ctx.save();
    ctx.translate(S / 2, S / 2);
    ctx.rotate(0.6);
    const half = S * 0.2;
    const g = ctx.createLinearGradient(0, -half, 0, half);
    g.addColorStop(0, "#5e3a24");
    g.addColorStop(0.5, "#b7875f");
    g.addColorStop(1, "#5e3a24");
    ctx.fillStyle = g;
    ctx.fillRect(-S * 1.4, -half, S * 2.8, half * 2);
    ctx.strokeStyle = "rgba(60,32,18,0.55)";
    ctx.lineWidth = S * 0.005;
    for (let x = -S * 1.4; x < S * 1.4; x += S * 0.055) {
      ctx.beginPath();
      ctx.moveTo(x, -half);
      ctx.bezierCurveTo(x + S * 0.04, -half * 0.3, x - S * 0.02, half * 0.3, x + S * 0.03, half);
      ctx.stroke();
    }
    ctx.restore();
  }

  function redCells(ctx, S) {
    const rand = seeded(11);
    for (let i = 0; i < 16; i++) {
      const a = rand() * TAU, d = i === 0 ? 0 : Math.sqrt(rand()) * S * 0.62;
      const x = S / 2 + Math.cos(a) * d, y = S / 2 + Math.sin(a) * d, r = S * (0.09 + rand() * 0.025);
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, "#efa59a");
      g.addColorStop(0.45, "#d8665c");
      g.addColorStop(0.85, "#b8322f");
      g.addColorStop(1, "rgba(150,30,30,0.6)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(x, y, r, r * (0.9 + rand() * 0.1), rand() * TAU, 0, TAU);
      ctx.fill();
    }
  }

  function bacteria(ctx, S, t = 0) {
    const rand = seeded(23);
    ctx.lineCap = "round";
    for (let i = 0; i < 22; i++) {
      const x = i === 0 ? S / 2 : S * (0.08 + rand() * 0.84), y = i === 0 ? S / 2 : S * (0.08 + rand() * 0.84), a = rand() * TAU;
      const len = S * (0.12 + rand() * 0.06), wid = S * 0.05;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(a);
      ctx.strokeStyle = "rgba(90,40,120,0.55)";
      ctx.lineWidth = S * 0.004;
      ctx.beginPath();
      for (let k = 0; k <= 20; k++) {
        const fx = -len / 2 - k * S * 0.008;
        const fy = Math.sin(k * 0.7 + t * 0.006 + i) * S * 0.012;
        k ? ctx.lineTo(fx, fy) : ctx.moveTo(fx, fy);
      }
      ctx.stroke();
      ctx.strokeStyle = i % 3 ? "#7b3fa0" : "#c0457a";
      ctx.lineWidth = wid;
      ctx.beginPath();
      ctx.moveTo(-len / 2 + wid / 2, 0);
      ctx.lineTo(len / 2 - wid / 2, 0);
      ctx.stroke();
      ctx.restore();
    }
  }

  function virion(ctx, x, y, r) {
    ctx.strokeStyle = "#a8c4b5";
    ctx.fillStyle = "#a8c4b5";
    ctx.lineWidth = r * 0.04;
    const spikes = 26;
    for (let i = 0; i < spikes; i++) {
      const a = (i / spikes) * TAU;
      const x1 = x + Math.cos(a) * r, y1 = y + Math.sin(a) * r;
      const x2 = x + Math.cos(a) * r * 1.22, y2 = y + Math.sin(a) * r * 1.22;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      ctx.beginPath(); ctx.arc(x2, y2, r * 0.05, 0, TAU); ctx.fill();
    }
    const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
    g.addColorStop(0, "#5f7d70");
    g.addColorStop(1, "#22362e");
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    ctx.lineWidth = r * 0.06;
    ctx.beginPath(); ctx.arc(x, y, r * 0.98, 0, TAU); ctx.stroke();
    ctx.fillStyle = "rgba(200,225,210,0.55)";
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU;
      ctx.beginPath(); ctx.ellipse(x + Math.cos(a) * r * 0.45, y + Math.sin(a) * r * 0.45, r * 0.16, r * 0.07, a, 0, TAU); ctx.fill();
    }
  }

  function virus(ctx, S) {
    virion(ctx, S / 2, S / 2, S * 0.2);
    virion(ctx, S * 0.18, S * 0.24, S * 0.09);
    virion(ctx, S * 0.82, S * 0.3, S * 0.11);
    virion(ctx, S * 0.25, S * 0.8, S * 0.1);
    virion(ctx, S * 0.8, S * 0.78, S * 0.08);
  }

  function dna(ctx, S, t = 0) {
    const tk = tokens();
    const amp = S * 0.13, period = S * 0.46, phase = t * 0.0009;
    ctx.save();
    ctx.translate(S / 2, S / 2);
    ctx.rotate(-0.35);
    ctx.lineCap = "round";
    for (let x = -S * 1.2; x < S * 1.2; x += S * 0.038) {
      const a = (x / period) * TAU + phase;
      const y1 = Math.sin(a) * amp, y2 = Math.sin(a + Math.PI) * amp;
      ctx.strokeStyle = `rgba(230,236,232,${0.25 + 0.3 * Math.abs(Math.cos(a))})`;
      ctx.lineWidth = S * 0.012;
      ctx.beginPath(); ctx.moveTo(x, y1); ctx.lineTo(x, y2); ctx.stroke();
    }
    [[0, "#88a9f2"], [Math.PI, "#f182ad"]].forEach(([off, color]) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = S * 0.03;
      ctx.beginPath();
      for (let x = -S * 1.2; x < S * 1.2; x += S * 0.01) {
        const y = Math.sin((x / period) * TAU + phase + off) * amp;
        x === -S * 1.2 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    });
    ctx.restore();
    void tk;
  }

  function atoms(ctx, S, t = 0) {
    const step = S * 0.13, patch = S * 0.8;
    const pulse = 1 + Math.sin(t * 0.002) * 0.03;
    for (let row = -8; row <= 8; row++) {
      for (let col = -8; col <= 8; col++) {
        const x = S / 2 + (col + (row % 2) * 0.5) * step;
        const y = S / 2 + row * step * 0.866;
        if (Math.hypot(x - S / 2, y - S / 2) > patch) continue;
        const r = step * 0.62 * pulse;
        const g = ctx.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, "#fff1c4");
        g.addColorStop(0.35, "#f2b65a");
        g.addColorStop(0.75, "rgba(170,90,30,0.55)");
        g.addColorStop(1, "rgba(120,50,20,0)");
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
      }
    }
  }

  function galaxies(ctx, S, t = 0) {
    const rand = seeded(5);
    for (let i = 0; i < 260; i++) {
      const x = rand() * S, y = rand() * S, r = rand() * S * 0.0035 + 0.6;
      const tw = 0.55 + 0.45 * Math.sin(t * 0.002 + i);
      ctx.fillStyle = `rgba(235,240,255,${(0.25 + rand() * 0.6) * tw})`;
      ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    }
    const colors = [["#ffe2b0", "#c77a3a"], ["#cfe0ff", "#5a74c9"], ["#ffd0e6", "#b04a7e"]];
    for (let i = 0; i < 9; i++) {
      const x = S * (0.12 + rand() * 0.76), y = S * (0.12 + rand() * 0.76);
      const r = S * (0.03 + rand() * 0.07), [c1, c2] = colors[i % 3];
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rand() * TAU);
      ctx.scale(1, 0.35 + rand() * 0.4);
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
      g.addColorStop(0, "#fffaf0");
      g.addColorStop(0.25, c1);
      g.addColorStop(0.7, c2 + "66");
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
      ctx.restore();
    }
  }

  window.VM.draw = { lens, scaleBar, objects: { ant, onion, hair, redCells, bacteria, virus, dna, atoms, galaxies } };
})();
