/* Page scrolling that the pinned frise (GSAP ScrollTrigger) can survive.
   1. Restoration. GSAP 3.12 throws inside ScrollTrigger.refresh() when triggers are created while
      the page is already scrolled past `once: true` reveals (they kill themselves mid-refresh),
      which left the frise unpinned on top of later chapters after a reload. So the browser's own
      restoration is off, the page sits at the top while every script builds its triggers, and
      once fonts and images are in, layout is measured once and the reader is put back where they
      were (reload, back/forward) or on the #anchor they asked for.
   2. Smooth in-page links. CSS `scroll-behavior: smooth` makes ScrollTrigger mis-measure the pin on
      any refresh done while scrolled down (resize, late load), so links glide from here instead.
   Must load after ScrollTrigger and before any script that creates triggers. */
(function () {
  "use strict";
  const KEY = `vm-scroll:${location.pathname}`;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)");

  /* ---------- 1. restoration ---------- */
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  // ScrollTrigger re-applies its remembered restoration mode after each refresh: make it "manual" too.
  if (window.ScrollTrigger) ScrollTrigger.clearScrollMemory("manual");

  const read = () => { try { return sessionStorage.getItem(KEY); } catch (e) { return null; } };
  const write = (v) => { try { sessionStorage.setItem(KEY, v); } catch (e) { /* storage off: no memory */ } };
  window.addEventListener("pagehide", () => write(String(Math.round(window.scrollY))));

  const byHash = (hash) => {
    if (!hash || hash === "#") return null;
    try { return document.getElementById(decodeURIComponent(hash.slice(1))); } catch (e) { return null; }
  };

  const nav = performance.getEntriesByType ? performance.getEntriesByType("navigation")[0] : null;
  const returning = Boolean(nav) && (nav.type === "reload" || nav.type === "back_forward");
  const saved = returning ? parseInt(read(), 10) : NaN;

  // where to go once layout is final: remembered position, else the #anchor, else wherever we already are
  let target = null;
  if (Number.isFinite(saved) && saved > 0) target = { y: saved };
  else if (byHash(location.hash)) target = { el: byHash(location.hash) };
  else if (window.scrollY > 0) target = { y: window.scrollY };

  if (target) window.scrollTo(0, 0); // triggers must be created with the page at the top

  const loaded = document.readyState === "complete" ? Promise.resolve() : new Promise((r) => window.addEventListener("load", r, { once: true }));
  const fonts = document.fonts && document.fonts.ready ? document.fonts.ready.catch(() => {}) : Promise.resolve();

  Promise.all([loaded, fonts]).then(() => requestAnimationFrame(() => {
    if (!window.ScrollTrigger) return;
    if (target) window.scrollTo(0, 0); // the browser may have jumped to the #anchor at load
    ScrollTrigger.refresh(); // images and fonts have their size now: measure from the top
    if (!target) return;
    if (target.el) target.el.scrollIntoView({ block: "start" }); // honours scroll-padding-top
    else window.scrollTo(0, target.y);
    ScrollTrigger.update();
  }));

  /* ---------- 2. smooth in-page links ---------- */
  document.addEventListener("click", (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const link = e.target.closest && e.target.closest('a[href^="#"]');
    const dest = link && byHash(link.getAttribute("href"));
    if (!dest) return;
    e.preventDefault();
    dest.scrollIntoView({ block: "start", behavior: reduce.matches ? "auto" : "smooth" });
    if (location.hash !== link.getAttribute("href")) history.pushState(null, "", link.getAttribute("href"));
    // move keyboard focus too, as a native anchor jump would (skip link, menu)
    if (!dest.hasAttribute("tabindex") && !dest.matches("a[href], button, input, select, textarea")) dest.setAttribute("tabindex", "-1");
    dest.focus({ preventScroll: true });
  });
})();
