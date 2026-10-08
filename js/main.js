/* Page wiring: hero eyepiece, timeline navigator, scale explorer and quiz. */
(function () {
  "use strict";
  const { animate, smooth, clamp } = window.VM;
  const { lens, scaleBar, objects } = window.VM.draw;

  /* ---------- Hero: one eyepiece, three scales of matter ---------- */
  const HERO_SCENES = [
    { mode: "dark", draw: objects.galaxies, bar: null, caption: "Télescope · des galaxies, faites de la matière née du Big Bang" },
    { mode: "bright", draw: objects.onion, bar: ["100 µm", 0.136], caption: "Microscope optique ×400 · cellules d'épiderme d'oignon" },
    { mode: "dark", draw: objects.atoms, bar: ["0,3 nm", 0.3], caption: "Microscope à effet tunnel · les atomes un par un" },
  ];
  const SCENE_MS = 4800;
  const FADE_MS = 1100;

  function initHero() {
    const canvas = document.getElementById("hero-lens");
    const caption = document.getElementById("hero-caption");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const S = window.VM.logicalSize(canvas).W;
    const start = performance.now();
    let shownCaption = -1;

    function sceneLayer(index, alpha, age, now) {
      const scene = HERO_SCENES[index];
      const zoom = 1 + Math.min(age, SCENE_MS + FADE_MS) / (SCENE_MS + FADE_MS) * 0.08;
      return {
        mode: scene.mode,
        alpha,
        draw(c, size) {
          c.translate(size / 2, size / 2);
          c.scale(zoom, zoom);
          c.translate(-size / 2, -size / 2);
          scene.draw(c, size, now);
          c.setTransform(1, 0, 0, 1, 0, 0);
          if (scene.bar) scaleBar(c, size, scene.bar[0], scene.mode, scene.bar[1]);
        },
      };
    }

    animate(canvas, (now) => {
      const elapsed = window.VM.prefersReducedMotion() ? SCENE_MS * 0.3 + SCENE_MS * 1 : now - start;
      const index = Math.floor(elapsed / SCENE_MS) % HERO_SCENES.length;
      const age = elapsed % SCENE_MS;
      const next = (index + 1) % HERO_SCENES.length;
      const fade = smooth(clamp((age - (SCENE_MS - FADE_MS)) / FADE_MS, 0, 1));
      lens(ctx, S, [sceneLayer(index, 1, age, now), sceneLayer(next, fade, age - SCENE_MS, now)]);
      const captionIndex = fade > 0.5 ? next : index;
      if (captionIndex !== shownCaption) {
        shownCaption = captionIndex;
        caption.textContent = HERO_SCENES[captionIndex].caption;
      }
    });
  }

  /* ---------- Timeline navigator ---------- */
  const EVENTS = [
    { year: 1590, label: "vers 1590", kind: "tech", what: "Microscope composé", who: "attribué aux Janssen", href: "#hooke" },
    { year: 1665, kind: "sci", what: "Hooke nomme la « cellule »", who: "Robert Hooke", href: "#hooke" },
    { year: 1674, kind: "sci", what: "Les « animalcules »", who: "Antoni van Leeuwenhoek", href: "#hooke" },
    { year: 1803, kind: "sci", what: "Théorie atomique", who: "John Dalton" },
    { year: 1838, label: "1838-39", kind: "sci", what: "Théorie cellulaire", who: "Schleiden et Schwann", href: "#cellule" },
    { year: 1855, kind: "sci", what: "Toute cellule vient d'une cellule", who: "Rudolf Virchow", href: "#cellule" },
    { year: 1869, kind: "sci", what: "Tableau périodique", who: "Dmitri Mendeleïev" },
    { year: 1897, label: "1896-98", kind: "sci", what: "Radioactivité, polonium, radium", who: "Becquerel, Marie et Pierre Curie", href: "#radioactivite" },
    { year: 1911, kind: "sci", what: "Le noyau de l'atome", who: "Ernest Rutherford", href: "#atome" },
    { year: 1927, kind: "sci", what: "L'Univers est en expansion", who: "Georges Lemaître", href: "#big-bang" },
    { year: 1931, kind: "tech", what: "Microscope électronique", who: "Ernst Ruska et Max Knoll", href: "#voir-atomes" },
    { year: 1965, kind: "sci", what: "Lumière fossile du Big Bang", who: "Penzias et Wilson", href: "#big-bang" },
    { year: 1981, kind: "tech", what: "Microscope à effet tunnel", who: "Binnig et Rohrer", href: "#voir-atomes" },
    { year: 2017, kind: "sci", what: "Cristaux d'un anticancéreux dans l'ISS", who: "Thomas Pesquet", href: "#espace" },
    { year: 2023, kind: "tech", what: "Bio-impression 3D dans l'ISS", who: "Sultan Al Neyadi", href: "#espace" },
  ];
  const TL = { firstYear: 1580, lastYear: 2025, originW: 150, x0: 186, labelW: 126 };
  const ORIGIN = { label: "−13,8 milliards d'années", kind: "origin", what: "Big Bang", who: "naissance de l'Univers et de la matière", href: "#big-bang" };
  const VERTICAL_QUERY = matchMedia("(max-width: 979px)");

  function eventNode({ label, year, kind, what, who, href }) {
    const el = document.createElement(href ? "a" : "div");
    if (href) el.href = href;
    el.className = `event ${kind}`;
    const dot = document.createElement("i");
    dot.className = "dot";
    const yr = document.createElement("span");
    yr.className = "yr";
    yr.textContent = label || String(year);
    const whatEl = document.createElement("span");
    whatEl.className = "what";
    whatEl.textContent = what;
    const whoEl = document.createElement("span");
    whoEl.className = "who";
    whoEl.textContent = who;
    el.append(dot, yr, whatEl, whoEl);
    return el;
  }

  /* Wide screens: proportional horizontal axis that fits the width, labels stacked in rows.
     Rows are sized from the labels' measured heights, so long labels never collide. */
  const ROW_GAP = 10;
  const LEG_UP = 8;
  const LEG_DOWN = 22;

  function assignLanes(xOf) {
    const lastX = { up: [], down: [] };
    return EVENTS.map((ev) => {
      const x = xOf(ev.year);
      let side = null, lane = -1;
      for (let i = 0; i < 16 && lane === -1; i++) {
        const s = i % 2 ? "down" : "up", l = Math.floor(i / 2);
        if ((lastX[s][l] ?? -Infinity) <= x - TL.labelW - 4) { side = s; lane = l; }
      }
      if (lane === -1) { side = "up"; lane = lastX.up.indexOf(Math.min(...lastX.up)); }
      lastX[side][lane] = x;
      return { node: eventNode(ev), x, side, lane };
    });
  }

  /* Offset of each row from the axis = sum of the tallest label in each row below it. */
  function rowOffsets(items, side, base) {
    const tallest = [];
    items.filter((it) => it.side === side).forEach((it) => { tallest[it.lane] = Math.max(tallest[it.lane] || 0, it.h); });
    const offsets = [base];
    for (let l = 1; l < tallest.length; l++) offsets[l] = offsets[l - 1] + (tallest[l - 1] || 0) + ROW_GAP;
    const total = tallest.length ? offsets[tallest.length - 1] + tallest[tallest.length - 1] : base;
    return { offsets, total };
  }

  function layoutHorizontal(host, width) {
    const usable = width - TL.x0 - TL.labelW;
    const xOf = (year) => TL.x0 + ((year - TL.firstYear) / (TL.lastYear - TL.firstYear)) * usable;
    const items = [{ node: eventNode(ORIGIN), x: 10, side: "down", lane: 0 }, ...assignLanes(xOf)];

    host.style.height = "0px";
    items.forEach((it) => { it.node.classList.add(it.side); it.node.style.left = `${it.x}px`; it.node.style.visibility = "hidden"; host.append(it.node); });
    items.forEach((it) => { it.h = it.node.offsetHeight; });

    const up = rowOffsets(items, "up", LEG_UP);
    const down = rowOffsets(items, "down", LEG_DOWN);
    const axisY = up.total + 8;
    host.style.height = `${axisY + down.total + 12}px`;
    items.forEach((it) => {
      const offset = (it.side === "up" ? up : down).offsets[it.lane];
      if (it.side === "up") { it.node.style.top = `${axisY - 3 - offset - it.h}px`; it.node.style.paddingBottom = `${offset}px`; }
      else { it.node.style.top = `${axisY + 3}px`; it.node.style.paddingTop = `${offset}px`; }
      it.node.style.zIndex = String(20 - it.lane); // inner rows cover the lines of outer rows
      it.node.style.visibility = "";
    });

    const axis = Object.assign(document.createElement("div"), { className: "axis" });
    axis.style.top = `${axisY}px`;
    const brk = Object.assign(document.createElement("div"), { className: "break" });
    brk.style.cssText = `left:${TL.originW - 6}px;top:${axisY - 12}px`;
    host.prepend(axis, brk);
    for (let y = 1600; y <= 2000; y += 50) {
      const tick = Object.assign(document.createElement("span"), { className: "tick", textContent: y });
      tick.style.cssText = `left:${xOf(y)}px;top:${axisY + 7}px`;
      host.append(tick);
    }
  }

  /* Phones and tablets: vertical timeline, gaps proportional to the time elapsed. */
  const V_PX_PER_YEAR = 0.55;
  const V_GAP = [10, 64];

  function layoutVertical(host) {
    host.style.height = "";
    const axis = Object.assign(document.createElement("div"), { className: "axis" });
    host.append(axis, eventNode(ORIGIN));
    const brk = document.createElement("p");
    brk.className = "v-break";
    brk.textContent = "… 13,8 milliards d'années plus tard …";
    host.append(brk);
    EVENTS.forEach((ev, i) => {
      const node = eventNode(ev);
      if (i > 0) node.style.marginTop = `${clamp((ev.year - EVENTS[i - 1].year) * V_PX_PER_YEAR, ...V_GAP)}px`;
      host.append(node);
    });
  }

  function initTimeline() {
    const host = document.getElementById("timeline");
    if (!host) return;
    let lastKey = "";
    function render() {
      const vertical = VERTICAL_QUERY.matches;
      const width = host.parentElement.clientWidth;
      const key = vertical ? "v" : `h${width}`;
      if (key === lastKey) return;
      lastKey = key;
      host.textContent = "";
      host.classList.toggle("vertical", vertical);
      if (vertical) layoutVertical(host);
      else layoutHorizontal(host, width);
    }
    let pending = 0;
    new ResizeObserver(() => { cancelAnimationFrame(pending); pending = requestAnimationFrame(render); }).observe(host.parentElement);
    render();
  }

  /* ---------- Scale explorer ---------- */
  const SCALE_OBJECTS = [
    { name: "Fourmi", size: 5e-3, mode: "bright", draw: objects.ant, native: 0.63, note: "Visible à l'œil nu. Une simple loupe montre déjà ses pattes et ses antennes." },
    { name: "Cellule d'oignon", size: 2.5e-4, mode: "bright", draw: objects.onion, native: 0.34, note: "À la limite de l'œil nu. Au microscope, on voit la paroi et le noyau : ce sont des cases comme celles que Hooke a vues dans le liège." },
    { name: "Épaisseur d'un cheveu", size: 7e-5, mode: "bright", draw: objects.hair, native: 0.4, note: "L'œil voit le cheveu, mais pas sa surface couverte de petites écailles." },
    { name: "Globule rouge", size: 7e-6, mode: "bright", draw: objects.redCells, native: 0.22, note: "Invisible à l'œil nu. Leeuwenhoek a été l'un des premiers à les décrire, vers 1675." },
    { name: "Bactérie", size: 2e-6, mode: "bright", draw: objects.bacteria, native: 0.15, note: "Les « animalcules » de Leeuwenhoek. Il faut un très bon microscope optique." },
    { name: "Virus de la grippe", size: 1e-7, mode: "dark", draw: objects.virus, native: 0.4, note: "Plus petit que la limite de la lumière (0,2 µm) : seul le microscope électronique peut le montrer." },
    { name: "Molécule d'ADN (largeur)", size: 2e-9, mode: "dark", draw: objects.dna, native: 0.29, note: "On devine sa double hélice au microscope électronique ou à effet tunnel." },
    { name: "Atome", size: 1e-10, mode: "dark", draw: objects.atoms, native: 0.1, note: "Le bout du voyage : le microscope à effet tunnel « touche » les atomes un par un. Le noyau, 100 000 fois plus petit encore, reste invisible : Rutherford l'a découvert sans jamais le voir." },
  ];
  const INSTRUMENTS = [
    { name: "Œil nu", limit: 1e-4, label: "0,1 mm" },
    { name: "Microscope de Leeuwenhoek", limit: 1e-6, label: "≈ 1 µm" },
    { name: "Microscope optique moderne", limit: 2e-7, label: "0,2 µm" },
    { name: "Microscope électronique", limit: 1e-10, label: "≈ 0,1 nm" },
    { name: "Microscope à effet tunnel", limit: 1e-10, max: 1e-8, label: "surfaces, ≈ 0,1 nm" },
  ];
  const FIELD_PER_SLIDER = 3; // the lens shows a field 3 times the slider size
  const centerLog = (obj) => Math.log10(obj.size / (obj.native * FIELD_PER_SLIDER));
  const SLIDER_TOP_LOG = centerLog(SCALE_OBJECTS[0]) + 0.15;
  const SLIDER_BOTTOM_LOG = centerLog(SCALE_OBJECTS[SCALE_OBJECTS.length - 1]) - 0.15;

  function niceLength(maxMeters) {
    const p = Math.pow(10, Math.floor(Math.log10(maxMeters)));
    return [5, 2, 1].map((m) => m * p).find((v) => v <= maxMeters) || p;
  }

  function formatSize(m) {
    const units = [[1e-3, "mm"], [1e-6, "µm"], [1e-9, "nm"]];
    const [factor, unit] = units.find(([f]) => m >= f) || units[units.length - 1];
    const value = m / factor;
    const text = value >= 10 ? Math.round(value).toString() : value.toLocaleString("fr-FR", { maximumFractionDigits: 1 });
    return `${text} ${unit}`;
  }

  function initScale() {
    const canvas = document.getElementById("scale-lens");
    const range = document.getElementById("scale-range");
    if (!canvas || !range) return;
    range.max = (SLIDER_TOP_LOG - SLIDER_BOTTOM_LOG).toFixed(2);
    const ctx = canvas.getContext("2d");
    const S = window.VM.logicalSize(canvas).W;
    const nameEl = document.getElementById("scale-obj");
    const sizeEl = document.getElementById("scale-size");
    const noteEl = document.getElementById("scale-note");
    const list = document.getElementById("instruments");
    const rows = INSTRUMENTS.map((ins) => {
      const li = document.createElement("li");
      li.innerHTML = `<span class="state" aria-hidden="true"></span><span></span><span class="lim mono"></span>`;
      li.children[1].textContent = ins.name;
      li.children[2].textContent = ins.label;
      list.append(li);
      return li;
    });
    let shown = null;

    const currentLog = () => SLIDER_TOP_LOG - Number(range.value);

    function updatePanel(obj) {
      if (obj === shown) return;
      shown = obj;
      nameEl.textContent = obj.name;
      sizeEl.textContent = formatSize(obj.size);
      noteEl.textContent = obj.note;
      INSTRUMENTS.forEach((ins, i) => {
        const canSee = obj.size >= ins.limit && (!ins.max || obj.size <= ins.max);
        rows[i].className = canSee ? "yes" : "no";
        rows[i].firstChild.textContent = canSee ? "✓" : "✕";
        rows[i].setAttribute("aria-label", `${ins.name} : ${canSee ? "peut le voir" : "ne peut pas le voir"}`);
      });
    }

    const loop = animate(canvas, (now) => {
      const log = currentLog();
      const field = Math.pow(10, log) * FIELD_PER_SLIDER; // metres across the lens
      const weighted = SCALE_OBJECTS.map((obj) => {
        const d = log - centerLog(obj);
        return { obj, w: Math.exp(-((d / 0.42) ** 2)), k: obj.size / field / obj.native };
      });
      const total = weighted.reduce((s, x) => s + x.w, 0) || 1;
      const nearest = weighted.reduce((a, b) => (b.w > a.w ? b : a));
      updatePanel(nearest.obj);
      const layers = weighted
        .filter((x) => x.w / total > 0.01)
        .sort((a, b) => a.w - b.w)
        .map(({ obj, w, k }, i, arr) => ({
          mode: obj.mode,
          alpha: i === 0 && arr.length > 1 ? 1 : Math.min(1, (w / total) * 1.6),
          draw(c, size) {
            c.translate(size / 2, size / 2);
            c.scale(k, k);
            c.translate(-size / 2, -size / 2);
            obj.draw(c, size, now);
          },
        }));
      lens(ctx, S, layers);
      const barMeters = niceLength(field * 0.32);
      scaleBar(ctx, S, formatSize(barMeters), nearest.obj.mode, barMeters / field);
    });
    range.addEventListener("input", loop.redraw);
  }

  /* ---------- Quiz ---------- */
  const QUESTIONS = [
    { q: "Qui a utilisé le mot « cellule » pour la première fois ?", choices: ["Antoni van Leeuwenhoek", "Robert Hooke", "Theodor Schwann", "Rudolf Virchow"], answer: 1, why: "En 1665, Hooke compare les cases du liège à de petites chambres (cella en latin)." },
    { q: "Que signifie « Omnis cellula e cellula » ?", choices: ["Toute cellule possède un noyau", "Toute la matière est faite de cellules", "Toute cellule provient d'une autre cellule", "Une cellule est invisible à l'œil nu"], answer: 2, why: "Virchow (1855) : les cellules naissent toujours de la division d'une cellule existante." },
    { q: "Quels éléments Marie et Pierre Curie ont-ils découverts en 1898 ?", choices: ["Le polonium et le radium", "L'uranium et le thorium", "L'hydrogène et l'hélium", "Le carbone et l'oxygène"], answer: 0, why: "Ils les ont trouvés dans la pechblende, un minerai plus radioactif que l'uranium qu'il contient." },
    { q: "Pourquoi presque toutes les particules α traversent-elles la feuille d'or ?", choices: ["L'or est un métal transparent", "Elles vont trop vite pour être arrêtées", "L'atome est presque entièrement vide", "La feuille est trouée"], answer: 2, why: "Toute la charge positive est concentrée dans un noyau minuscule : le reste de l'atome est surtout du vide." },
    { q: "Qu'a montré Georges Lemaître en 1927 ?", choices: ["Que l'Univers est en expansion", "Que la Terre tourne autour du Soleil", "Que l'Univers est immobile et éternel", "Que les étoiles sont faites de fer"], answer: 0, why: "Les galaxies s'éloignent les unes des autres ; Hubble l'a confirmé par l'observation en 1929." },
    { q: "Environ combien de temps après le Big Bang les premiers atomes se sont-ils formés ?", choices: ["3 minutes", "380 000 ans", "4,6 milliards d'années", "13,8 milliards d'années"], answer: 1, why: "Avant, il faisait trop chaud : les électrons ne pouvaient pas rester accrochés aux noyaux." },
    { q: "Pourquoi le microscope électronique voit-il plus petit que le microscope optique ?", choices: ["Ses lentilles en verre sont plus grandes", "Il éclaire beaucoup plus fort", "Les électrons ont une longueur d'onde bien plus petite que la lumière", "L'échantillon est vivant"], answer: 2, why: "La plus petite taille visible dépend de la longueur d'onde utilisée : celle des électrons est minuscule." },
    { q: "Pourquoi faire cristalliser un médicament dans l'ISS ?", choices: ["Il y fait plus froid", "Sans sédimentation ni convection, les cristaux sont plus réguliers", "La pression y est plus forte", "La lumière du Soleil y est plus intense"], answer: 1, why: "En microgravité, les cristaux ne tombent pas au fond et le liquide ne se mélange pas tout seul." },
  ];

  function initQuiz() {
    const host = document.getElementById("quiz-list");
    if (!host) return;
    let answered = 0, correct = 0;
    const scoreBox = document.createElement("div");
    scoreBox.className = "score";
    scoreBox.innerHTML = `<p><span class="mono" id="quiz-score">0 / ${QUESTIONS.length}</span><br><span id="quiz-msg">Répondez aux questions pour voir votre score.</span></p>`;
    const reset = document.createElement("button");
    reset.className = "btn";
    reset.type = "button";
    reset.textContent = "Recommencer le quiz";
    scoreBox.append(reset);

    function render() {
      host.textContent = "";
      answered = 0;
      correct = 0;
      QUESTIONS.forEach((item, qi) => {
        const card = document.createElement("div");
        card.className = "q";
        const fs = document.createElement("fieldset");
        const legend = document.createElement("legend");
        legend.innerHTML = `<span class="qn">Question ${qi + 1}</span>`;
        legend.append(item.q);
        fs.append(legend);
        const why = document.createElement("p");
        why.className = "why";
        why.hidden = true;
        item.choices.forEach((choice, ci) => {
          const b = document.createElement("button");
          b.type = "button";
          b.className = "choice";
          b.id = `q${qi}-c${ci}`;
          b.textContent = choice;
          b.addEventListener("click", () => {
            const buttons = fs.querySelectorAll(".choice");
            buttons.forEach((x) => (x.disabled = true));
            buttons[item.answer].classList.add("right");
            const isRight = ci === item.answer;
            if (!isRight) b.classList.add("wrong");
            why.hidden = false;
            why.textContent = (isRight ? "Bonne réponse. " : "Pas tout à fait. ") + item.why;
            answered += 1;
            correct += isRight ? 1 : 0;
            updateScore();
          });
          fs.append(b);
        });
        card.append(fs, why);
        host.append(card);
      });
      host.append(scoreBox);
      updateScore();
    }

    function updateScore() {
      scoreBox.querySelector("#quiz-score").textContent = `${correct} / ${QUESTIONS.length}`;
      const msg = scoreBox.querySelector("#quiz-msg");
      if (answered < QUESTIONS.length) msg.textContent = `${QUESTIONS.length - answered} question(s) restante(s).`;
      else if (correct === QUESTIONS.length) msg.textContent = "Parfait : vous avez fait tout le voyage !";
      else if (correct >= 5) msg.textContent = "Très bien. Relisez les chapitres des questions manquées.";
      else msg.textContent = "Le voyage continue : retournez voir les chapitres et réessayez.";
    }

    reset.addEventListener("click", render);
    render();
  }

  /* On wide screens the sources sit beside the videos, so show them open. */
  function initSources() {
    const wide = matchMedia("(min-width: 1200px)");
    const apply = () => document.querySelectorAll(".chapter-foot details.sources").forEach((d) => { d.open = wide.matches; });
    wide.addEventListener("change", apply);
    apply();
  }

  initHero();
  initSources();
  initTimeline();
  initScale();
  initQuiz();
})();
