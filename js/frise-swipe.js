/* Laptops: while the cinematic frise is pinned, a sideways two-finger swipe on the trackpad (or a
   horizontal mouse wheel) travels through time too, just like scrolling up and down.
   At either end of the frise the gesture is left to the browser. */
(function () {
  "use strict";
  if (!window.ScrollTrigger) return;
  const LINE_PX = 16; // wheel events counted in lines (deltaMode 1)
  const HORIZONTAL_BIAS = 1.2; // mostly-vertical gestures keep their normal behaviour

  function friseTrigger() {
    return ScrollTrigger.getAll().find((t) => t.pin && t.trigger && t.trigger.classList.contains("cine"));
  }

  window.addEventListener("wheel", (e) => {
    if (e.ctrlKey || Math.abs(e.deltaX) <= Math.abs(e.deltaY) * HORIZONTAL_BIAS) return;
    const st = friseTrigger();
    if (!st) return; // phones and reduced motion: vertical story mode, nothing to do
    const y = window.scrollY;
    if (y < st.start - 2 || y > st.end + 2) return; // the frise is not on screen
    const dx = e.deltaMode === 1 ? e.deltaX * LINE_PX : e.deltaX;
    if ((dx < 0 && y <= st.start + 1) || (dx > 0 && y >= st.end - 1)) return;
    e.preventDefault(); // also stops the browser's swipe-to-go-back while inside the frise
    window.scrollTo({ top: Math.min(st.end, Math.max(st.start, y + dx)), behavior: "instant" }); // follow the fingers, no smooth-scroll lag
  }, { passive: false });
})();
