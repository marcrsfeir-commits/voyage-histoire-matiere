/* Interactive frise: a proportional ruler with clickable, draggable markers on wide screens,
   and an expandable vertical rail on phones and tablets. */
(function () {
  "use strict";
  const { ICONS, ORIGIN, EVENTS, ERAS, KINDS, DISCIPLINES } = window.VM.frise;
  const { prefersReducedMotion } = window.VM;

  const ALL = [ORIGIN, ...EVENTS];
  const SVG_NS = "http://www.w3.org/2000/svg";
  const VERTICAL_QUERY = matchMedia("(max-width: 979px)");
  const TOUR_MS = 3800;
  const GEO = {
    firstYear: 1580, lastYear: 2025,
    originX: 46, breakX: 108, x0: 156, padRight: 46,
    markerBlock: 78, minGap: 62, laneStep: 86, stemMin: 34, eraTop: 40, rulerH: 62,
  };
  const V_GAP = { pxPerYear: 0.5, min: 6, max: 56 };

  /* ---------- small DOM helpers ---------- */
  function el(tag, cls, text) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }
  function icon(name) {
    const svg = document.createElementNS(SVG_NS, "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");
    svg.innerHTML = ICONS[name]; // static, trusted icon markup from frise-data.js
    return svg;
  }
  const yearText = (ev) => ev.label || String(ev.year);
  const matches = (ev, filter) =>
    filter === "all" || (filter === "tech" || filter === "sci" ? ev.kind === filter : ev.disc === filter);

  /* ---------- detail content (shared by the card and the phone rail) ---------- */
  function mediaNode(ev) {
    const media = el("div", "fr-media");
    if (ev.img) {
      const img = el("img");
      img.src = ev.img;
      img.alt = ev.imgAlt || "";
      img.loading = "lazy";
      img.width = 400;
      img.height = 400;
      media.append(img);
    } else {
      media.classList.add("is-icon");
      media.append(icon(ev.icon));
    }
    return media;
  }
  function chapterLink(ev) {
    if (!ev.href) return el("p", "fr-note", "Événement de la frise, sans chapitre dédié sur ce site.");
    const a = el("a", "btn fr-go", "Ouvrir le chapitre →");
    a.href = ev.href;
    return a;
  }

  function initFrise() {
    const app = document.getElementById("frise-app");
    const track = document.getElementById("frise-track");
    const card = document.getElementById("frise-card");
    if (!app || !track || !card) return;
    const chips = [...app.querySelectorAll(".chip")];
    const prevBtn = document.getElementById("frise-prev");
    const nextBtn = document.getElementById("frise-next");
    const playBtn = document.getElementById("frise-play");

    const state = { selected: 0, filter: "all", playing: false, timer: 0, layoutKey: "", markers: [], xs: [] };

    const visible = () => ALL.map((ev, i) => (matches(ev, state.filter) ? i : -1)).filter((i) => i >= 0);

    /* ---------- selection ---------- */
    function select(i, { scroll = false } = {}) {
      state.selected = i;
      state.markers.forEach((m, k) => {
        const on = k === i;
        m.classList.toggle("is-active", on);
        m.setAttribute("aria-pressed", String(on));
        (m._parts || []).forEach((part) => part.classList.toggle("is-active", on));
        if (m.tagName === "BUTTON" && m.classList.contains("fr-marker")) m.tabIndex = on ? 0 : -1;
      });
      if (VERTICAL_QUERY.matches) updateRail(scroll);
      else renderCard();
    }

    function step(dir) {
      const vis = visible();
      if (!vis.length) return;
      const pos = vis.indexOf(state.selected);
      const next = pos === -1 ? vis[0] : vis[(pos + dir + vis.length) % vis.length];
      select(next);
    }

    /* ---------- guided tour ---------- */
    function setPlaying(on) {
      state.playing = on && !VERTICAL_QUERY.matches;
      clearInterval(state.timer);
      playBtn.setAttribute("aria-pressed", String(state.playing));
      playBtn.querySelector("span").textContent = state.playing ? "Pause" : "Visite guidée";
      card.classList.toggle("is-touring", state.playing);
      if (state.playing) state.timer = setInterval(() => step(1), TOUR_MS);
      renderCard();
    }
    const stopTour = () => { if (state.playing) setPlaying(false); };

    /* ---------- card (wide screens) ---------- */
    function renderCard() {
      if (VERTICAL_QUERY.matches) return;
      const ev = ALL[state.selected];
      const vis = visible();
      card.className = `frise-card ${ev.kind}${state.playing ? " is-touring" : ""}`;
      card.style.setProperty("--tour", `${TOUR_MS}ms`);
      card.textContent = "";

      const body = el("div", "fr-body");
      const meta = el("p", "fr-meta");
      meta.append(el("span", "fr-kind", KINDS[ev.kind]), el("span", "fr-disc", DISCIPLINES[ev.disc]));
      const pos = vis.indexOf(state.selected);
      meta.append(el("span", "fr-count", `${pos + 1} / ${vis.length}`));
      body.append(
        meta,
        el("p", "fr-year", ev.year == null ? "−13,8 milliards d'années" : yearText(ev)),
        el("h3", "fr-title", ev.title),
        el("p", "fr-who", ev.who),
        el("p", "fr-desc", ev.desc),
        chapterLink(ev),
      );
      card.append(mediaNode(ev), body, el("span", "fr-progress"));
      if (!prefersReducedMotion()) {
        card.classList.remove("is-swapping");
        void card.offsetWidth; // restart the swap animation
        card.classList.add("is-swapping");
      }
    }

    /* ---------- wide screens: proportional ruler ---------- */
    function layoutHorizontal(width) {
      track.textContent = "";
      track.style.height = "";
      const usable = width - GEO.x0 - GEO.padRight;
      const xOf = (year) => GEO.x0 + ((year - GEO.firstYear) / (GEO.lastYear - GEO.firstYear)) * usable;
      const yearOf = (x) => GEO.firstYear + ((x - GEO.x0) / usable) * (GEO.lastYear - GEO.firstYear);

      const lastX = [];
      const placed = ALL.map((ev) => {
        const x = ev.year == null ? GEO.originX : xOf(ev.year);
        let lane = lastX.findIndex((lx) => x - lx >= GEO.minGap);
        if (lane === -1) lane = lastX.length;
        lastX[lane] = x;
        return { ev, x, lane };
      });
      const lanes = lastX.length;
      const axisY = GEO.eraTop + 8 + GEO.markerBlock + (lanes - 1) * GEO.laneStep + GEO.stemMin;
      track.style.height = `${axisY + GEO.rulerH}px`;
      state.xs = placed.map((p) => p.x);

      const frag = document.createDocumentFragment();
      const cosmos = el("div", "fr-cosmos");
      cosmos.style.cssText = `width:${GEO.breakX - 10}px;height:${axisY}px`;
      cosmos.append(el("span", "fr-era-label", "Il y a 13,8 milliards d'années"));
      frag.append(cosmos);
      ERAS.forEach((era, k) => {
        const band = el("div", `fr-era tone-${k % 2}`);
        const left = xOf(era.from), w = xOf(era.to) - left;
        band.style.cssText = `left:${left}px;width:${w}px;height:${axisY}px`;
        band.append(el("span", "fr-era-label", w > 175 ? era.label : era.short));
        frag.append(band);
      });

      const axis = el("div", "fr-axis");
      axis.style.cssText = `left:12px;right:12px;top:${axisY - 1}px`;
      const brk = el("div", "fr-break");
      brk.style.cssText = `left:${GEO.breakX - 7}px;top:${axisY - 13}px`;
      frag.append(axis, brk);
      for (let y = 1580; y <= 2020; y += 10) {
        const major = y % 100 === 0, mid = y % 50 === 0;
        const tick = el("span", `fr-tick${major ? " major" : mid ? " mid" : ""}`);
        tick.style.cssText = `left:${xOf(y)}px;top:${axisY + 3}px`;
        frag.append(tick);
        if (major || (mid && usable > 1100)) {
          const lab = el("span", `fr-tick-label${major ? " major" : ""}`, String(y));
          lab.style.cssText = `left:${xOf(y)}px;top:${axisY + 22}px`;
          frag.append(lab);
        }
      }

      state.markers = placed.map(({ ev, x, lane }, i) => {
        const bottom = axisY - GEO.stemMin - lane * GEO.laneStep;
        const stem = el("span", `fr-stem ${ev.kind}`);
        stem.style.cssText = `left:${x}px;top:${bottom}px;height:${axisY - bottom}px`;
        const dot = el("span", `fr-dot ${ev.kind}`);
        dot.style.cssText = `left:${x}px;top:${axisY}px`;
        const btn = el("button", `fr-marker ${ev.kind}`);
        btn.type = "button";
        btn.style.cssText = `left:${x}px;top:${bottom - GEO.markerBlock}px`;
        btn.setAttribute("aria-label", `${ev.year == null ? "Il y a 13,8 milliards d'années" : yearText(ev)} : ${ev.title}`);
        const ic = el("span", "fr-ic");
        ic.append(icon(ev.icon));
        btn.append(ic, el("span", "fr-yr", ev.year == null ? ev.label : yearText(ev)));
        btn.addEventListener("click", () => { stopTour(); select(i); });
        btn._parts = [stem, dot];
        frag.append(stem, dot, btn);
        return btn;
      });

      const cursor = el("div", "fr-cursor");
      cursor.style.height = `${axisY}px`;
      const bubble = el("b", "fr-bubble");
      bubble.style.top = `${axisY + 6}px`;
      cursor.append(bubble);
      frag.append(cursor);
      track.append(frag);
      track._cursor = cursor;
      track._bubble = bubble;
      track._yearOf = yearOf;
      applyFilter();
    }

    /* Hover shows a reading line; pressing and dragging scrubs through time. */
    function trackX(e) { return e.clientX - track.getBoundingClientRect().left; }
    function showCursor(x) {
      if (!track._cursor) return;
      track._cursor.style.transform = `translateX(${x}px)`;
      track._cursor.classList.add("is-on");
      const year = Math.round(Math.min(GEO.lastYear, Math.max(GEO.firstYear, track._yearOf(x))));
      track._bubble.textContent = x < GEO.breakX ? "Big Bang" : String(year);
    }
    function nearestVisible(x) {
      return visible().reduce((best, i) => (Math.abs(state.xs[i] - x) < Math.abs(state.xs[best] - x) ? i : best), visible()[0]);
    }
    let dragging = false;
    track.addEventListener("pointerdown", (e) => {
      if (VERTICAL_QUERY.matches || e.button > 0) return;
      if (e.target.closest(".fr-marker")) { stopTour(); return; } // the marker's own click selects it
      dragging = true;
      try { track.setPointerCapture(e.pointerId); } catch { /* capture is a convenience: dragging still works without it */ }
      stopTour();
      const x = trackX(e);
      showCursor(x);
      const i = nearestVisible(x);
      if (i !== state.selected) select(i);
    });
    track.addEventListener("pointermove", (e) => {
      if (VERTICAL_QUERY.matches) return;
      const x = trackX(e);
      showCursor(x);
      if (!dragging) return;
      const i = nearestVisible(x);
      if (i !== state.selected) select(i);
    });
    const endDrag = () => { dragging = false; };
    track.addEventListener("pointerup", endDrag);
    track.addEventListener("pointercancel", endDrag);
    track.addEventListener("pointerleave", () => { if (!dragging && track._cursor) track._cursor.classList.remove("is-on"); });
    track.addEventListener("keydown", (e) => {
      const keys = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
      if (e.key in keys) { e.preventDefault(); stopTour(); step(keys[e.key]); state.markers[state.selected]?.focus(); }
      if (e.key === "Home" || e.key === "End") {
        e.preventDefault(); stopTour();
        const vis = visible();
        select(e.key === "Home" ? vis[0] : vis[vis.length - 1]);
        state.markers[state.selected]?.focus();
      }
    });

    /* ---------- phones: vertical rail with expandable cards ---------- */
    function layoutVertical() {
      track.textContent = "";
      track.style.height = "";
      state.xs = [];
      const rail = el("ol", "fr-rail");
      let eraIndex = -1;
      state.markers = ALL.map((ev, i) => {
        /* the gap grows with the time elapsed since the previous event */
        const prev = ALL[i - 1];
        const gap = prev && prev.year != null && ev.year != null
          ? Math.round(Math.min(V_GAP.max, Math.max(V_GAP.min, (ev.year - prev.year) * V_GAP.pxPerYear)))
          : 0;
        let gapTarget = null;
        if (ev.year != null) {
          const era = ERAS.findIndex((er) => ev.year >= er.from && ev.year <= er.to);
          if (era !== -1 && era !== eraIndex) {
            eraIndex = era;
            gapTarget = el("li", "fr-era-head", ERAS[era].label);
            rail.append(gapTarget);
          }
        }
        const li = el("li", `fr-item ${ev.kind}`);
        if (gap) (gapTarget || li).style.marginTop = `${gapTarget ? gap + 12 : gap}px`;
        const row = el("button", "fr-row");
        row.type = "button";
        row.setAttribute("aria-expanded", "false");
        const ic = el("span", "fr-ic");
        ic.append(icon(ev.icon));
        const text = el("span", "fr-row-text");
        text.append(el("span", "fr-yr", ev.year == null ? "−13,8 milliards d'années" : yearText(ev)), el("span", "fr-title", ev.title), el("span", "fr-who", ev.who));
        row.append(ic, text, el("span", "fr-chev"));
        const detail = el("div", "fr-detail");
        detail.hidden = true;
        detail.id = `fr-detail-${i}`;
        row.setAttribute("aria-controls", detail.id);
        const detailText = el("div", "fr-detail-text");
        const meta = el("p", "fr-meta");
        meta.append(el("span", "fr-kind", KINDS[ev.kind]), el("span", "fr-disc", DISCIPLINES[ev.disc]));
        detailText.append(meta, el("p", "fr-desc", ev.desc), chapterLink(ev));
        detail.append(mediaNode(ev), detailText);
        row.addEventListener("click", () => {
          const open = state.selected === i && row.getAttribute("aria-expanded") === "true";
          select(open ? -1 : i, { scroll: !open });
        });
        li.append(row, detail);
        rail.append(li);
        if (i === 0) rail.append(el("li", "fr-gap-note", "… 13,8 milliards d'années plus tard …"));
        return li;
      });
      track.append(rail);
      applyFilter();
    }

    function updateRail(scroll) {
      state.markers.forEach((li, k) => {
        const on = k === state.selected;
        li.classList.toggle("is-active", on);
        li.querySelector(".fr-row").setAttribute("aria-expanded", String(on));
        li.querySelector(".fr-detail").hidden = !on;
      });
      const active = state.markers[state.selected];
      if (scroll && active) {
        const top = active.getBoundingClientRect().top;
        if (top < 70 || top > innerHeight - 160) active.scrollIntoView({ block: "center", behavior: prefersReducedMotion() ? "auto" : "smooth" });
      }
    }

    /* ---------- filters ---------- */
    function applyFilter() {
      state.markers.forEach((m, i) => {
        const out = !matches(ALL[i], state.filter);
        m.classList.toggle("is-out", out);
        (m._parts || []).forEach((p) => p.classList.toggle("is-out", out));
      });
      const vertical = VERTICAL_QUERY.matches;
      if (vertical) track.querySelectorAll(".fr-era-head").forEach((h) => { h.hidden = state.filter !== "all"; });
      if (state.selected >= 0 && !matches(ALL[state.selected], state.filter)) select(vertical ? -1 : visible()[0]);
      else select(state.selected);
    }
    chips.forEach((chip) => chip.addEventListener("click", () => {
      stopTour();
      state.filter = chip.dataset.filter;
      chips.forEach((c) => c.setAttribute("aria-pressed", String(c === chip)));
      applyFilter();
    }));

    prevBtn.addEventListener("click", () => { stopTour(); step(-1); });
    nextBtn.addEventListener("click", () => { stopTour(); step(1); });
    playBtn.addEventListener("click", () => {
      if (state.playing) return setPlaying(false);
      setPlaying(true);
      step(1);
    });

    /* Stop the tour when the frise leaves the screen. */
    new IntersectionObserver(([entry]) => { if (!entry.isIntersecting) stopTour(); }).observe(app);

    /* ---------- layout switching ---------- */
    function render() {
      const vertical = VERTICAL_QUERY.matches;
      const width = track.clientWidth;
      const key = vertical ? "v" : `h${width}`;
      if (key === state.layoutKey || !width) return;
      state.layoutKey = key;
      app.classList.toggle("is-vertical", vertical);
      if (vertical) {
        stopTour();
        if (state.selected === 0) state.selected = -1; // phones start with every card closed
        layoutVertical();
      } else {
        if (state.selected < 0) state.selected = 0;
        layoutHorizontal(width);
      }
    }
    let pending = 0;
    new ResizeObserver(() => { cancelAnimationFrame(pending); pending = requestAnimationFrame(render); }).observe(track);
    render();
  }

  initFrise();
})();
