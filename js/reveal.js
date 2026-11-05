/* Scroll-driven reveals across the page (GSAP ScrollTrigger). Everything is visible without
   JavaScript; with reduced motion nothing moves. Each animation runs once. */
(function () {
  "use strict";
  if (!window.gsap || !window.ScrollTrigger) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  gsap.registerPlugin(ScrollTrigger);

  const once = (trigger, start = "top 86%") => ({ trigger, start, once: true });
  const all = (sel) => [...document.querySelectorAll(sel)];

  /* reading progress bar */
  const bar = document.createElement("div");
  bar.className = "read-progress";
  document.body.append(bar);
  gsap.to(bar, { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: 0.3 } });

  /* hero entrance */
  gsap.from(".hero-copy > *", { y: 40, opacity: 0, duration: 1.1, stagger: 0.12, ease: "power4.out", delay: 0.15 });
  gsap.from(".hero-stage", { x: 30, opacity: 0, duration: 1.2, ease: "power3.out", delay: 0.6 });

  /* section and chapter titles */
  all(".section-head").forEach((h) => gsap.from(h.children, { y: 46, opacity: 0, duration: 0.9, stagger: 0.12, ease: "power3.out", scrollTrigger: once(h) }));
  all(".legend-item").forEach((it, k) => gsap.from(it, { y: 24, opacity: 0, duration: 0.7, delay: k * 0.1, ease: "power3.out", scrollTrigger: once(it, "top 95%") }));

  /* chapter years count up to their date */
  all(".chapter").forEach((ch) => {
    const yearEl = ch.querySelector(".chapter-year");
    const head = ch.querySelector(".chapter-head");
    const target = parseInt(yearEl.textContent, 10);
    const tl = gsap.timeline({ scrollTrigger: once(head, "top 80%") });
    if (!Number.isNaN(target)) {
      const counter = { v: target - 120 };
      tl.from(yearEl, { scale: 0.6, opacity: 0, duration: 0.6, ease: "back.out(1.6)" }, 0)
        .to(counter, { v: target, duration: 1.2, ease: "power3.out", onUpdate: () => { yearEl.textContent = Math.round(counter.v); } }, 0);
    }
    tl.from(head.querySelectorAll(".chapter-num, .chapter-title > *"), { y: 34, opacity: 0, duration: 0.8, stagger: 0.1, ease: "power3.out" }, 0.1);
  });

  /* prose blocks, key facts, experiments */
  all(".prose > *").forEach((b) => gsap.from(b, { y: 34, opacity: 0, duration: 0.8, ease: "power3.out", scrollTrigger: once(b, "top 90%") }));
  all(".keyfact").forEach((k) => gsap.from(k, { x: -40, duration: 0.9, ease: "power3.out", scrollTrigger: once(k, "top 90%") }));

  /* photos uncover like a curtain */
  all(".figures figure").forEach((f, k) => {
    const img = f.querySelector("img");
    gsap.timeline({ scrollTrigger: once(f, "top 90%") })
      .from(f, { clipPath: "inset(100% 0% 0% 0%)", duration: 1, ease: "power4.out", delay: (k % 2) * 0.12 })
      .from(img, { scale: 1.18, duration: 1.4, ease: "power3.out" }, "<");
  });

  /* simulations, diagrams, videos, quiz */
  all(".bench").forEach((b) => gsap.from(b, { y: 70, opacity: 0, scale: 0.96, duration: 1, ease: "power3.out", scrollTrigger: once(b, "top 88%") }));
  all(".diagram").forEach((d) => gsap.from(d, { y: 40, opacity: 0, duration: 0.9, ease: "power3.out", scrollTrigger: once(d, "top 90%") }));
  all(".video-row").forEach((row) => gsap.from(row.children, { y: 40, opacity: 0, duration: 0.8, stagger: 0.12, ease: "power3.out", scrollTrigger: once(row, "top 92%") }));
  all(".scale").forEach((s) => gsap.from(s.children, { y: 50, opacity: 0, duration: 1, stagger: 0.15, ease: "power3.out", scrollTrigger: once(s) }));
  const quiz = document.getElementById("quiz-list");
  if (quiz) {
    const observe = () => gsap.from(quiz.querySelectorAll(".q"), { y: 40, opacity: 0, duration: 0.7, stagger: 0.07, ease: "power3.out", scrollTrigger: once(quiz) });
    if (quiz.children.length) observe(); else setTimeout(observe, 0);
  }
})();
