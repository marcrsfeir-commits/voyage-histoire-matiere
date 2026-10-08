/* Shared helpers: theme tokens for canvas, seeded random, visibility-aware animation loops. */
(function () {
  "use strict";

  const root = document.documentElement;
  const TOKEN_NAMES = ["bg", "paper", "ink", "muted", "rule", "blue", "pink", "brass", "lens", "lens-ink"];
  let tokenCache = null;
  const themeListeners = [];

  function tokens() {
    if (tokenCache) return tokenCache;
    const style = getComputedStyle(root);
    tokenCache = Object.fromEntries(
      TOKEN_NAMES.map((name) => [name.replace("-i", "I"), style.getPropertyValue("--" + name).trim() || "#888"])
    );
    return tokenCache;
  }

  function onThemeChange() {
    tokenCache = null;
    themeListeners.forEach((fn) => fn());
  }
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", onThemeChange);
  new MutationObserver(onThemeChange).observe(root, { attributes: true, attributeFilter: ["data-theme"] });

  const reducedQuery = matchMedia("(prefers-reduced-motion: reduce)");
  const prefersReducedMotion = () => reducedQuery.matches;

  function seeded(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* Runs frame(now, dt) on every animation frame while the canvas is on screen.
     With reduced motion, frame only runs when redraw() is called (one still image). */
  /* Each canvas keeps a fixed logical size (its width/height attributes) for drawing,
     while its backing store follows the on-screen size × pixel density, so it stays sharp. */
  const MAX_DPR = 2;
  const logicalSizes = new WeakMap();

  function logicalSize(canvas) {
    if (!logicalSizes.has(canvas)) logicalSizes.set(canvas, { W: canvas.width, H: canvas.height });
    return logicalSizes.get(canvas);
  }

  function fitBackingStore(canvas) {
    const { W, H } = logicalSize(canvas);
    const cssW = canvas.clientWidth;
    if (!cssW) return false;
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    const bw = Math.round(cssW * dpr);
    const bh = Math.round((cssW * dpr * H) / W);
    if (canvas.width === bw && canvas.height === bh) return false;
    canvas.width = bw;
    canvas.height = bh;
    return true;
  }

  function applyLogicalTransform(canvas) {
    const { W } = logicalSize(canvas);
    const k = canvas.width / W;
    canvas.getContext("2d").setTransform(k, 0, 0, k, 0, 0);
  }

  /* Lets a simulation swap to another logical size (e.g. a taller layout on phones). */
  function setLogicalSize(canvas, W, H) {
    logicalSizes.set(canvas, { W, H });
    fitBackingStore(canvas);
    applyLogicalTransform(canvas);
  }

  /* How much to enlarge text and strokes so they stay readable when the canvas is shown small. */
  const MIN_READABLE = 0.62; // logical → CSS ratio below which labels get enlarged
  function uiScale(canvas) {
    const { W } = logicalSize(canvas);
    const cssW = canvas.clientWidth || W;
    return clamp((MIN_READABLE * W) / cssW, 1, 2.6);
  }

  function animate(canvas, frame) {
    let isVisible = false;
    let rafId = 0;
    let last = 0;
    logicalSize(canvas);

    function render(now, dt) {
      applyLogicalTransform(canvas);
      frame(now, dt);
    }

    function tick(now) {
      const dt = last ? Math.min(50, now - last) : 16;
      last = now;
      render(now, dt);
      if (isVisible && !prefersReducedMotion()) rafId = requestAnimationFrame(tick);
      else last = 0;
    }

    new ResizeObserver(() => {
      if (fitBackingStore(canvas)) render(performance.now(), 0);
    }).observe(canvas);
    fitBackingStore(canvas);

    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
        cancelAnimationFrame(rafId);
        last = 0;
        if (isVisible) rafId = requestAnimationFrame(tick);
      },
      { rootMargin: "120px" }
    );
    observer.observe(canvas);
    themeListeners.push(() => render(performance.now(), 0));

    render(performance.now(), 0); // complete first frame at rest
    return {
      redraw() {
        if (!isVisible || prefersReducedMotion()) render(performance.now(), 0);
      },
    };
  }

  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (t) => t * t * (3 - 2 * t);

  function withAlpha(color, alpha) {
    return `color-mix(in srgb, ${color} ${Math.round(clamp(alpha, 0, 1) * 100)}%, transparent)`;
  }

  /* Canvas does not understand color-mix(), so resolve any CSS colour to rgba once. */
  const probe = document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  const rgbaCache = new Map();
  function rgba(color, alpha = 1) {
    const key = color + "|" + alpha;
    if (rgbaCache.has(key)) return rgbaCache.get(key);
    probe.clearRect(0, 0, 1, 1);
    probe.fillStyle = "#000";
    probe.fillStyle = color;
    probe.fillRect(0, 0, 1, 1);
    const [r, g, b] = probe.getImageData(0, 0, 1, 1).data;
    const out = `rgba(${r},${g},${b},${clamp(alpha, 0, 1)})`;
    rgbaCache.set(key, out);
    return out;
  }
  themeListeners.push(() => rgbaCache.clear());

  window.VM = { tokens, prefersReducedMotion, seeded, animate, logicalSize, setLogicalSize, uiScale, clamp, lerp, smooth, withAlpha, rgba };
})();
