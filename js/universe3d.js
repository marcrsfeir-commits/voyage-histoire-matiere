/* Interactive 3D model of the history of the Universe (section #univers-3d).
   Click a stage (timeline, numbered markers or ‹ ›) to fly the camera there and read its detailed
   description; drag to turn the model; "Lancer le voyage" plays the 10 stages in order.
   Without WebGL the stage list and descriptions still work. */
(function () {
  "use strict";
  const root = document.getElementById("univers-3d");
  const STAGES = window.VM && window.VM.universe;
  if (!root || !STAGES) return;

  const $ = (sel) => root.querySelector(sel);
  const canvas = $("#u3d-canvas");
  const view = $(".u3d-view");
  const info = $(".u3d-info");
  const steps = $(".u3d-steps");
  const markers = $(".u3d-markers");
  const hudTime = $(".u3d-hud-time");
  const hudName = $(".u3d-hud-name");
  const playBtn = $(".u3d-play");
  const overviewBtn = $(".u3d-overview");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const TOUR_MS = 7500;
  const OVERVIEW = { az: -0.14, el: 0.24 };
  let current = -1;
  let tourTimer = 0;

  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  /* ---------- stage list and description panel ---------- */
  const stepButtons = STAGES.map((s, i) => {
    const li = el("li");
    const b = el("button", "u3d-step");
    b.type = "button";
    b.append(el("span", "u3d-step-n", String(i + 1)), el("span", "u3d-step-time", s.time), el("span", "u3d-step-name", s.name));
    b.addEventListener("click", () => { stopTour(); select(i); });
    li.append(b);
    steps.append(li);
    return b;
  });

  function renderInfo(i) {
    const s = STAGES[i];
    info.replaceChildren();
    const stats = el("dl", "u3d-stats");
    [["Âge de l'Univers", s.age], ["Température", s.temp]].forEach(([k, v]) => {
      const d = el("div");
      d.append(el("dt", null, k), el("dd", null, v));
      stats.append(d);
    });
    const forms = el("ul", "u3d-forms");
    s.forms.forEach((f) => forms.append(el("li", null, f)));
    const fact = el("p", "u3d-fact");
    fact.append(el("b", null, "Le saviez-vous ? "), s.fact);
    const nav = el("div", "u3d-nav");
    const prev = el("button", "u3d-arrow", "‹");
    const next = el("button", "u3d-arrow", "›");
    prev.type = next.type = "button";
    prev.setAttribute("aria-label", "Étape précédente");
    next.setAttribute("aria-label", "Étape suivante");
    prev.disabled = i === 0;
    next.disabled = i === STAGES.length - 1;
    prev.addEventListener("click", () => { stopTour(); select(i - 1); });
    next.addEventListener("click", () => { stopTour(); select(i + 1); });
    nav.append(el("span", "u3d-count", `${i + 1} / ${STAGES.length}`), prev, next);
    info.append(
      el("p", "u3d-kicker", `Étape ${i + 1} · ${s.time}`),
      el("h4", "u3d-name", s.name),
      stats,
      ...s.text.map((t) => el("p", "u3d-text", t)),
      el("p", "u3d-forms-title", "Ce qui apparaît"),
      forms, fact, nav,
    );
    fitInfo();
  }

  /* Shrinks the card's text step by step until everything fits without scrolling (desktop,
     where the card is as tall as the 3D view). On phones the card simply grows. */
  const MIN_FONT = 0.72;
  function fitInfo() {
    info.style.setProperty("--u3d-fs", "1");
    if (!matchMedia("(min-width: 901px)").matches) return;
    for (let f = 1; f > MIN_FONT && info.scrollHeight > info.clientHeight + 1; f -= 0.03) {
      info.style.setProperty("--u3d-fs", f.toFixed(2));
    }
  }
  new ResizeObserver(() => fitInfo()).observe(view);
  if (document.fonts) document.fonts.ready.then(fitInfo);

  function renderOverview() {
    info.replaceChildren();
    const list = el("ol", "u3d-mini");
    STAGES.forEach((s, i) => {
      const b = el("button", null);
      b.type = "button";
      b.append(el("span", "mono", s.time), el("b", null, s.name));
      b.addEventListener("click", () => { stopTour(); select(i); });
      const li = el("li");
      li.append(b);
      list.append(li);
    });
    info.append(
      el("p", "u3d-kicker", "Vue d'ensemble · 13,8 milliards d'années"),
      el("h4", "u3d-name", "Toute l'histoire de l'Univers"),
      el("p", "u3d-text", "Le temps s'écoule de gauche à droite. La largeur du modèle représente la taille de l'Univers : minuscule au Big Bang, il ne cesse de grandir. Choisissez une étape pour zoomer dessus."),
      list,
    );
    fitInfo();
  }

  /* ---------- 3D ---------- */
  let three = null;
  try {
    three = window.THREE && window.VM.universeScene ? initThree() : null;
  } catch (err) {
    console.warn("Modèle 3D indisponible :", err); // eslint-disable-line no-console
    three = null;
  }
  if (!three) root.classList.add("u3d--static");

  function initThree() {
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: "high-performance" });
    if (!renderer.getContext()) return null;
    const small = matchMedia("(max-width: 760px)").matches;
    const world = window.VM.universeScene.build({ small });
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x04070b);
    scene.add(world.group, world.sky);
    const camera = new THREE.PerspectiveCamera(40, 1, 0.05, 600);
    const rig = { tx: 0, ty: 0, tz: 0, r: 46, az: OVERVIEW.az, el: OVERVIEW.el, lo: -99, hi: 99, focus: 0, solar: 0 };
    const state = { visible: false, spin: !reduce, t0: performance.now(), time: 0, last: performance.now(), raf: 0 };

    function overviewDistance() {
      const aspect = Math.max(0.6, view.clientWidth / Math.max(1, view.clientHeight));
      const fit = (world.HALF * 1.32) / (Math.tan((camera.fov * Math.PI) / 360) * aspect);
      return Math.max(30, Math.min(110, fit));
    }

    function resize() {
      const w = view.clientWidth, h = view.clientHeight;
      if (!w || !h) return;
      const pr = Math.min(window.devicePixelRatio || 1, 2);
      renderer.setPixelRatio(pr);
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      world.uniforms.uPR.value = pr;
      if (current < 0) rig.r = overviewDistance();
    }

    function placeCamera() {
      const ce = Math.cos(rig.el);
      camera.position.set(rig.tx + rig.r * ce * Math.sin(rig.az), rig.ty + rig.r * Math.sin(rig.el), rig.tz + rig.r * ce * Math.cos(rig.az));
      camera.lookAt(rig.tx, rig.ty, rig.tz);
    }

    /* numbered markers above the model, projected every frame */
    const markerButtons = STAGES.map((s, i) => {
      const b = el("button", "u3d-mk");
      b.type = "button";
      b.tabIndex = -1; // the stage list below gives keyboard access
      b.append(el("span", "u3d-mk-n", String(i + 1)), el("span", "u3d-mk-label", s.name));
      b.addEventListener("click", () => { stopTour(); select(i); });
      markers.append(b);
      return b;
    });
    const tmp = new THREE.Vector3();
    const SOLAR_MARKER_OFFSET = new THREE.Vector3(0, 1.25, 0);
    function markerPoint(i) {
      const s = STAGES[i];
      if (s.solar) return world.group.localToWorld(tmp.copy(world.milkyWay)).add(SOLAR_MARKER_OFFSET);
      const side = i % 2 ? -1 : 1;
      return tmp.set(s.u - world.HALF, side * (world.radius(s.u) + 0.5), 0);
    }
    function drawMarkers() {
      const w = view.clientWidth, h = view.clientHeight;
      markerButtons.forEach((b, i) => {
        const p = markerPoint(i).project(camera);
        const hidden = p.z > 1 || Math.abs(p.x) > 1.05 || Math.abs(p.y) > 1.05;
        b.style.visibility = hidden ? "hidden" : "visible";
        if (!hidden) b.style.transform = `translate(${((p.x + 1) / 2) * w}px, ${((1 - p.y) / 2) * h}px)`;
      });
    }

    function frame(now) {
      state.raf = 0;
      if (!state.visible) return;
      const dt = Math.min(0.05, (now - state.last) / 1000);
      state.last = now;
      if (!reduce) state.time += dt;
      world.uniforms.uTime.value = state.time;
      world.uniforms.uLo.value = rig.lo;
      world.uniforms.uHi.value = rig.hi;
      world.uniforms.uFocus.value = rig.focus;
      if (state.spin && current < 0) world.group.rotation.x += dt * 0.08;
      world.bang.scale.setScalar(1.4 + (reduce ? 0 : 0.25 * Math.sin(state.time * 3)));
      world.solar.userData.tick(state.time);
      world.solar.userData.fade(rig.solar);
      placeCamera();
      renderer.render(scene, camera);
      drawMarkers();
      state.raf = requestAnimationFrame(frame);
    }
    function wake() { if (!state.raf && state.visible) { state.last = performance.now(); state.raf = requestAnimationFrame(frame); } }

    new IntersectionObserver((entries) => { state.visible = entries[0].isIntersecting; wake(); }, { rootMargin: "100px" }).observe(view);
    new ResizeObserver(() => { resize(); wake(); }).observe(view);
    resize();

    /* drag to turn the model around its current target */
    let drag = null;
    canvas.addEventListener("pointerdown", (e) => { drag = { x: e.clientX, y: e.clientY, az: rig.az, el: rig.el }; canvas.setPointerCapture(e.pointerId); stopTour(); root.classList.add("u3d--dragged"); });
    canvas.addEventListener("pointermove", (e) => {
      if (!drag) return;
      rig.az = drag.az - (e.clientX - drag.x) * 0.006;
      rig.el = Math.max(-1.1, Math.min(1.3, drag.el + (e.clientY - drag.y) * 0.005));
    });
    const endDrag = () => { drag = null; };
    canvas.addEventListener("pointerup", endDrag);
    canvas.addEventListener("pointercancel", endDrag);

    function flyTo(target, dur) {
      if (window.gsap && dur > 0) gsap.to(rig, { ...target, duration: dur, ease: "power3.inOut", overwrite: true });
      else Object.assign(rig, target);
    }

    return {
      focus(i) {
        const s = STAGES[i];
        const t = s.solar ? world.group.localToWorld(world.milkyWay.clone()) : new THREE.Vector3(s.u - world.HALF, 0, 0);
        flyTo({ tx: t.x, ty: t.y, tz: t.z, r: s.view.r, az: s.view.az, el: s.view.el, lo: s.span[0] - world.HALF, hi: s.span[1] - world.HALF, focus: 1, solar: s.solar ? 1 : 0 }, reduce ? 0 : 1.8);
      },
      overview() {
        flyTo({ tx: 0, ty: 0, tz: 0, r: overviewDistance(), az: OVERVIEW.az, el: OVERVIEW.el, lo: -99, hi: 99, focus: 0, solar: 0 }, reduce ? 0 : 1.6);
      },
      markActive(i) { markerButtons.forEach((b, k) => b.classList.toggle("is-on", k === i)); },
    };
  }

  /* ---------- navigation ---------- */
  function select(i) {
    current = i;
    stepButtons.forEach((b, k) => { b.classList.toggle("is-on", k === i); b.setAttribute("aria-pressed", String(k === i)); });
    stepButtons[i].scrollIntoView({ block: "nearest", inline: "center", behavior: reduce ? "auto" : "smooth" });
    hudTime.textContent = STAGES[i].time;
    hudName.textContent = STAGES[i].name;
    renderInfo(i);
    if (three) { three.focus(i); three.markActive(i); }
    root.classList.add("u3d--focused");
  }

  function overview() {
    current = -1;
    stepButtons.forEach((b) => { b.classList.remove("is-on"); b.setAttribute("aria-pressed", "false"); });
    hudTime.textContent = "13,8 milliards d'années";
    hudName.textContent = "Vue d'ensemble";
    renderOverview();
    if (three) { three.overview(); three.markActive(-1); }
    root.classList.remove("u3d--focused");
  }

  function stopTour() {
    if (!tourTimer) return;
    clearInterval(tourTimer);
    tourTimer = 0;
    playBtn.textContent = "▶ Lancer le voyage";
    playBtn.setAttribute("aria-pressed", "false");
  }

  function startTour() {
    select(0);
    playBtn.textContent = "❚❚ Pause";
    playBtn.setAttribute("aria-pressed", "true");
    tourTimer = setInterval(() => {
      if (current >= STAGES.length - 1) { stopTour(); overview(); return; }
      select(current + 1);
    }, TOUR_MS);
  }

  playBtn.addEventListener("click", () => (tourTimer ? stopTour() : startTour()));
  overviewBtn.addEventListener("click", () => { stopTour(); overview(); });
  root.addEventListener("keydown", (e) => {
    if (e.target.closest("input, textarea")) return;
    if (e.key === "ArrowRight" && current < STAGES.length - 1) { stopTour(); select(current + 1); }
    if (e.key === "ArrowLeft" && current > 0) { stopTour(); select(current - 1); }
  });

  overview();
})();
