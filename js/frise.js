/* Cinematic frise. Wide screens: the section pins and scrolling travels horizontally through time
   (GSAP ScrollTrigger), with a glowing time cursor and a background that changes with each era.
   Phones, tablets and reduced motion: the same panels stacked vertically with gentle reveals. */
(function () {
  "use strict";
  const { ERAS, EVENTS, KINDS } = window.VM.frise;
  const app = document.getElementById("frise-app");
  if (!app || !window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);

  const WIDE = "(min-width: 980px) and (prefers-reduced-motion: no-preference)";

  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  const dateOf = (ev) => ev.label || String(ev.year);

  /* ---------- markup ---------- */
  function panel(ev, i) {
    const a = el("article", `cp ${ev.kind}`);
    a.dataset.index = i;
    a.dataset.era = ev.era;
    a.append(el("p", "cp-ghost", dateOf(ev)));
    const media = el("figure", `cp-media n${ev.imgs.length}`);
    ev.imgs.forEach((src) => {
      const img = el("img");
      img.src = src;
      img.alt = `${ev.who} · ${ev.title}`;
      img.loading = i < 4 ? "eager" : "lazy";
      img.decoding = "async";
      media.append(img);
    });
    const body = el("div", "cp-body");
    body.append(
      el("p", "cp-kind", KINDS[ev.kind]),
      el("p", "cp-date", dateOf(ev)),
      el("h3", "cp-title", ev.title),
      el("p", "cp-who", ev.who),
      el("p", "cp-desc", ev.desc),
    );
    body.append(el("span", "cp-go", "Voir la fiche"));
    a.append(media, body);
    clickable(a, `Voir la fiche : ${dateOf(ev)}, ${ev.title}`, () => openEvent(i));
    return a;
  }

  function eraCard(era, k) {
    const c = el("section", "cp-era");
    c.dataset.era = k;
    c.append(el("p", "cp-era-num", `Époque ${k + 1} / ${ERAS.length}`), el("h3", "cp-era-title", era.label), el("p", "cp-era-range", era.range), el("span", "cp-go", "Voir l'époque"));
    clickable(c, `Voir l'époque : ${era.label}`, () => openEra(k));
    return c;
  }

  /* Whole cards act as buttons: click, Enter or Space opens their info sheet. */
  function clickable(node, label, open) {
    node.classList.add("is-clickable");
    node.tabIndex = 0;
    node.setAttribute("role", "button");
    node.setAttribute("aria-haspopup", "dialog");
    node.setAttribute("aria-label", label);
    node.addEventListener("click", open);
    node.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); }
    });
  }

  function build() {
    app.textContent = "";
    const cine = el("div", "cine");
    const bgs = el("div", "cine-bgs");
    ERAS.forEach((era, k) => {
      const b = el("div", `cine-bg tone-${era.tone}`);
      if (k === 0) b.classList.add("is-on");
      bgs.append(b);
    });
    const dust = el("canvas", "cine-dust");

    const top = el("div", "cine-top");
    const eras = el("nav", "cine-eras");
    eras.setAttribute("aria-label", "Aller à une époque");
    ERAS.forEach((era, k) => {
      const b = el("button", "cine-era", era.label);
      b.type = "button";
      b.dataset.era = k;
      eras.append(b);
    });
    const ruler = el("div", "cine-ruler");
    const dots = el("div", "cine-dots");
    EVENTS.forEach((ev, i) => {
      const d = el("button", `cine-dot ${ev.kind}`);
      d.type = "button";
      d.dataset.index = i;
      d.setAttribute("aria-label", `Voir la fiche : ${dateOf(ev)}, ${ev.title}`);
      d.setAttribute("aria-haspopup", "dialog");
      d.addEventListener("click", () => openEvent(i));
      d.style.left = `${(i / (EVENTS.length - 1)) * 100}%`;
      dots.append(d);
    });
    const fill = el("div", "cine-fill");
    const cursor = el("div", "cine-cursor");
    cursor.append(el("b", "cine-year", dateOf(EVENTS[0])));
    ruler.append(el("div", "cine-line"), fill, dots, cursor);
    top.append(eras, ruler);

    const track = el("div", "cine-track");
    const intro = el("section", "cp-intro");
    intro.append(
      el("p", "cp-intro-kicker", "23 étapes · 13,8 milliards d'années"),
      el("h3", "cp-intro-title", "Remontez le temps de la matière"),
      el("p", "cp-intro-hint", "Faites défiler : la frise avance toute seule"),
    );
    track.append(intro);
    let lastEra = -1;
    EVENTS.forEach((ev, i) => {
      if (ev.era !== lastEra) { track.append(eraCard(ERAS[ev.era], ev.era)); lastEra = ev.era; }
      track.append(panel(ev, i));
    });
    const outro = el("section", "cp-intro cp-outro");
    const link = el("a", "cp-go", "Explorer les chapitres");
    link.href = "#chapitres";
    outro.append(el("p", "cp-intro-kicker", "Fin du voyage… pour l'instant"), el("h3", "cp-intro-title", "Et la suite ? Elle s'écrit dans les laboratoires."), link);
    track.append(outro);

    cine.append(bgs, dust, top, track);
    app.append(cine);
    return { cine, bgs: [...bgs.children], dust, eras: [...eras.children], dots: [...dots.children], fill, cursor, track, panels: [...track.querySelectorAll(".cp")] };
  }

  /* ---------- info sheet (native <dialog>: Esc closes, arrows change event) ---------- */
  let sheet = null;
  let sheetIndex = -1;

  function buildSheet() {
    const d = el("dialog", "fr-sheet");
    d.setAttribute("aria-labelledby", "frs-title");
    const inner = el("div", "frs-inner");
    const close = el("button", "frs-close");
    close.type = "button";
    close.setAttribute("aria-label", "Fermer la fiche");
    close.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
    close.addEventListener("click", () => d.close());
    const media = el("div", "frs-media");
    const body = el("div", "frs-body");
    inner.append(close, media, body);
    d.append(inner);
    d.addEventListener("click", (e) => { if (e.target === d) d.close(); }); // click outside the sheet
    d.addEventListener("keydown", (e) => {
      if (sheetIndex < 0) return;
      if (e.key === "ArrowRight") { e.preventDefault(); openEvent((sheetIndex + 1) % EVENTS.length); }
      if (e.key === "ArrowLeft") { e.preventDefault(); openEvent((sheetIndex - 1 + EVENTS.length) % EVENTS.length); }
    });
    d.addEventListener("close", () => document.documentElement.classList.remove("has-sheet"));
    document.body.append(d);
    return { d, inner, media, body };
  }

  function showSheet() {
    if (!sheet.d.open) {
      sheet.d.showModal();
      document.documentElement.classList.add("has-sheet");
      if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.fromTo(sheet.inner, { y: 30, scale: 0.96, opacity: 0 }, { y: 0, scale: 1, opacity: 1, duration: 0.45, ease: "power3.out" });
      }
    } else if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.fromTo([sheet.media, sheet.body], { opacity: 0, x: 18 }, { opacity: 1, x: 0, duration: 0.35, stagger: 0.05, ease: "power2.out" });
    }
    sheet.body.scrollTop = 0;
    sheet.d.querySelector(".frs-close").focus();
  }

  function openEvent(i) {
    sheet = sheet || buildSheet();
    sheetIndex = i;
    const ev = EVENTS[i];
    sheet.inner.className = `frs-inner ${ev.kind}`;
    sheet.media.className = `frs-media n${ev.imgs.length}`;
    sheet.media.textContent = "";
    ev.imgs.forEach((src) => {
      const img = el("img");
      img.src = src;
      img.alt = `${ev.who} · ${ev.title}`;
      sheet.media.append(img);
    });
    const meta = el("p", "frs-meta");
    meta.append(el("span", "frs-kind", KINDS[ev.kind]), el("span", "frs-era", ERAS[ev.era].label), el("span", "frs-count", `${i + 1} / ${EVENTS.length}`));
    const title = el("h3", "frs-title", ev.title);
    title.id = "frs-title";
    const fact = el("p", "frs-fact");
    fact.append(el("b", null, "Le saviez-vous ? "), ev.fact);
    const actions = el("div", "frs-actions");
    if (ev.href) {
      const go = el("a", "btn frs-chapter", "Lire le chapitre complet");
      go.href = ev.href;
      go.addEventListener("click", () => sheet.d.close());
      actions.append(go);
    }
    const nav = el("div", "frs-nav");
    [["‹", "Événement précédent", -1], ["›", "Événement suivant", 1]].forEach(([t, l, step]) => {
      const b = el("button", "frs-step", t);
      b.type = "button";
      b.setAttribute("aria-label", l);
      b.addEventListener("click", () => openEvent((i + step + EVENTS.length) % EVENTS.length));
      nav.append(b);
    });
    actions.append(nav);
    sheet.body.textContent = "";
    sheet.body.append(meta, el("p", "frs-date", dateOf(ev)), title, el("p", "frs-who", ev.who), el("p", "frs-lead", ev.desc), el("p", "frs-more", ev.more), fact, actions);
    showSheet();
  }

  function openEra(k) {
    sheet = sheet || buildSheet();
    sheetIndex = -1;
    const era = ERAS[k];
    sheet.inner.className = "frs-inner is-era";
    sheet.media.className = "frs-media is-era";
    sheet.media.textContent = "";
    sheet.media.append(el("p", "frs-era-num", `Époque ${k + 1} / ${ERAS.length}`), el("p", "frs-era-big", era.label), el("p", "frs-era-range", era.range));
    const title = el("h3", "frs-title", era.label);
    title.id = "frs-title";
    const list = el("ul", "frs-list");
    EVENTS.forEach((ev, i) => {
      if (ev.era !== k) return;
      const li = el("li");
      const b = el("button", `frs-item ${ev.kind}`);
      b.type = "button";
      const img = el("img");
      img.src = ev.imgs[0];
      img.alt = "";
      b.append(img, el("span", "frs-item-date", dateOf(ev)), el("span", "frs-item-title", ev.title));
      b.addEventListener("click", () => openEvent(i));
      li.append(b);
      list.append(li);
    });
    sheet.body.textContent = "";
    sheet.body.append(el("p", "frs-meta", "Choisissez un événement"), title, el("p", "frs-lead", era.desc), list);
    showSheet();
  }

  const ui = build();

  /* ---------- shared state: which event is in focus ---------- */
  let current = -1;
  function setCurrent(i) {
    if (i === current || i < 0) return;
    current = i;
    const ev = EVENTS[i];
    ui.cursor.querySelector(".cine-year").textContent = dateOf(ev);
    ui.dots.forEach((d, k) => d.classList.toggle("is-on", k === i));
    ui.dots.forEach((d, k) => d.classList.toggle("is-past", k < i));
    ui.panels.forEach((p, k) => p.classList.toggle("is-focus", k === i));
    ui.bgs.forEach((b, k) => b.classList.toggle("is-on", k === ev.era));
    ui.eras.forEach((b, k) => b.classList.toggle("is-on", k === ev.era));
    dustTone = ERAS[ev.era].tone;
  }

  /* ---------- floating dust (canvas, very light) ---------- */
  const DUST_TOKENS = { cosmos: "blue", parchment: "brass", laboratory: "blue", radiant: "pink", orbit: "blue" };
  let dustTone = "cosmos";
  let dustOffset = 0;
  (function dustLoop() {
    const c = ui.dust;
    const ctx = c.getContext("2d");
    const motes = Array.from({ length: 90 }, () => ({ x: Math.random(), y: Math.random(), r: 0.4 + Math.random() * 1.8, z: 0.2 + Math.random(), tw: Math.random() * 6 }));
    let visible = false;
    new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) requestAnimationFrame(frame); }).observe(c);
    function frame(t) {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      const w = c.clientWidth, h = c.clientHeight;
      if (c.width !== Math.round(w * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const tone = window.VM.tokens()[DUST_TOKENS[dustTone]];
      motes.forEach((m) => {
        const x = ((m.x * w - dustOffset * m.z * 0.6) % w + w) % w;
        const y = (m.y * h + Math.sin(t * 0.0004 * m.z + m.tw) * 12) % h;
        const a = 0.25 + 0.35 * Math.sin(t * 0.0012 + m.tw) ** 2;
        ctx.fillStyle = window.VM.rgba(tone, a * 0.7);
        ctx.beginPath(); ctx.arc(x, y, m.r * m.z, 0, Math.PI * 2); ctx.fill();
      });
      if (visible && !matchMedia("(prefers-reduced-motion: reduce)").matches) requestAnimationFrame(frame);
    }
  })();

  /* ---------- modes ---------- */
  const mm = gsap.matchMedia();

  mm.add(WIDE, () => {
    ui.cine.classList.add("is-cinema");
    const distance = () => ui.track.scrollWidth - window.innerWidth;
    const travel = gsap.to(ui.track, {
      x: () => -distance(),
      ease: "none",
      scrollTrigger: {
        trigger: ui.cine,
        pin: true,
        start: "top top",
        end: () => `+=${distance()}`,
        scrub: 0.8,
        invalidateOnRefresh: true,
        onUpdate(self) {
          ui.fill.style.transform = `scaleX(${self.progress})`;
          ui.cursor.style.left = `${self.progress * 100}%`;
          dustOffset = self.progress * window.innerWidth * 1.5;
          // the panel closest to the middle of the screen is the one in focus
          const mid = window.innerWidth / 2;
          let best = -1, bestD = Infinity;
          ui.panels.forEach((p, k) => {
            const r = p.getBoundingClientRect();
            const d = Math.abs(r.left + r.width / 2 - mid);
            if (d < bestD) { bestD = d; best = k; }
          });
          setCurrent(best);
        },
      },
    });

    // each panel comes alive as it reaches the centre
    ui.panels.forEach((p) => {
      gsap.fromTo(p.querySelector(".cp-media"), { scale: 0.82, rotate: -3, opacity: 0.35, filter: "blur(6px)" },
        { scale: 1, rotate: 0, opacity: 1, filter: "blur(0px)", ease: "power2.out",
          scrollTrigger: { trigger: p, containerAnimation: travel, start: "left 85%", end: "left 35%", scrub: true } });
      gsap.fromTo(p.querySelector(".cp-ghost"), { xPercent: 30 }, { xPercent: -30, ease: "none",
        scrollTrigger: { trigger: p, containerAnimation: travel, start: "left right", end: "right left", scrub: true } });
      gsap.from(p.querySelectorAll(".cp-body > *"), { y: 26, opacity: 0, stagger: 0.06, ease: "power3.out",
        scrollTrigger: { trigger: p, containerAnimation: travel, start: "left 75%", end: "left 45%", scrub: true } });
    });
    ui.track.querySelectorAll(".cp-era").forEach((c) => {
      gsap.from(c.querySelector(".cp-era-title"), { yPercent: 60, opacity: 0, ease: "power3.out",
        scrollTrigger: { trigger: c, containerAnimation: travel, start: "left 80%", end: "left 40%", scrub: true } });
    });

    // jump to an era or an event from the ruler
    const jumpTo = (target) => {
      const st = travel.scrollTrigger;
      const x = target.offsetLeft - window.innerWidth * 0.5 + target.offsetWidth / 2;
      const p = Math.min(1, Math.max(0, x / distance()));
      window.scrollTo({ top: st.start + p * (st.end - st.start), behavior: "smooth" });
    };
    const onEra = (e) => jumpTo(ui.track.querySelector(`.cp-era[data-era="${e.currentTarget.dataset.era}"]`));
    const onDot = (e) => jumpTo(ui.panels[+e.currentTarget.dataset.index]); // the sheet opens on top
    ui.eras.forEach((b) => b.addEventListener("click", onEra));
    ui.dots.forEach((d) => d.addEventListener("click", onDot));
    setCurrent(0);
    return () => {
      ui.cine.classList.remove("is-cinema");
      ui.eras.forEach((b) => b.removeEventListener("click", onEra));
      ui.dots.forEach((d) => d.removeEventListener("click", onDot));
      gsap.set(ui.track, { clearProps: "transform" });
    };
  });

  /* Phones, tablets, reduced motion: vertical story with simple reveals. */
  mm.add("(max-width: 979px), (prefers-reduced-motion: reduce)", () => {
    ui.cine.classList.add("is-story");
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const triggers = ui.panels.map((p, k) => ScrollTrigger.create({
      trigger: p, start: "top 60%", end: "bottom 40%",
      onToggle: (self) => { if (self.isActive) setCurrent(k); },
    }));
    if (!reduce) {
      ui.panels.forEach((p) => {
        gsap.from(p, { y: 50, opacity: 0, duration: 0.8, ease: "power3.out", scrollTrigger: { trigger: p, start: "top 88%", once: true } });
        gsap.from(p.querySelector(".cp-media"), { scale: 0.9, duration: 1, ease: "power3.out", scrollTrigger: { trigger: p, start: "top 88%", once: true } });
      });
    }
    setCurrent(0);
    return () => { ui.cine.classList.remove("is-story"); triggers.forEach((t) => t.kill()); };
  });

  // images load lazily: recompute the scroll length once they have their size
  window.addEventListener("load", () => ScrollTrigger.refresh());
})();
