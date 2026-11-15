/* Turns the source lists of js/sources-data.js into links: one line per frise sheet and per stage
   of the 3D model (VM.sourceLine), and the full list in the footer (#all-sources). */
(function () {
  "use strict";
  const data = window.VM && window.VM.sources;
  if (!data) return;

  function link([label, url]) {
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener";
    a.textContent = label;
    return a;
  }

  /* "Sources : link · link · link" */
  function sourceLine(list, cls = "src-line") {
    const p = document.createElement("p");
    p.className = cls;
    if (!list || !list.length) return p;
    const head = document.createElement("span");
    head.className = "src-head";
    head.textContent = "Sources : ";
    p.append(head);
    list.forEach((s, i) => p.append(...(i ? [" · ", link(s)] : [link(s)])));
    return p;
  }
  window.VM.sourceLine = sourceLine;

  function group(title, rows) {
    const d = document.createElement("details");
    d.className = "sources all-sources-group";
    const sum = document.createElement("summary");
    sum.textContent = title;
    const ul = document.createElement("ul");
    rows.forEach(([name, list]) => {
      const li = document.createElement("li");
      const b = document.createElement("b");
      b.textContent = `${name} : `;
      li.append(b, ...list.flatMap((s, i) => (i ? [" · ", link(s)] : [link(s)])));
      ul.append(li);
    });
    d.append(sum, ul);
    return d;
  }

  const box = document.getElementById("all-sources");
  if (!box) return;
  const frise = window.VM.frise;
  const stages = window.VM.universe;
  if (frise) {
    box.append(group(`La frise · ${frise.EVENTS.length} étapes`, frise.EVENTS.map((ev) => [`${ev.label || ev.year} · ${ev.title}`, data.frise[String(ev.year)] || []])));
  }
  if (stages) {
    box.append(group("Le modèle 3D de l'Univers · 10 étapes", stages.map((s, i) => [`${i + 1}. ${s.name}`, data.universe[i] || []])));
  }
  box.append(group("Zoom et échelles", data.general));
})();
