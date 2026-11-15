/* Big Bang intro for the 3D model of the Universe: a tiny burning point, a flash, a burst of hot
   particles cooling from white to red, a shockwave, then the model of the Universe appears.
   Artistic depiction: the caption reminds that the Big Bang was not an explosion in space.
   Used by js/universe3d.js (play / cancel). */
(function () {
  "use strict";
  window.VM = window.VM || {};

  const VERTEX = `
    attribute vec3 dir; attribute float speed; attribute float seed;
    uniform float uP; uniform float uA; uniform float uPR; uniform float uScale;
    varying vec3 vC; varying float vA;
    void main() {
      float e = 1.0 - exp(-uP * 5.0);
      vec3 p = dir * speed * 11.0 * e;
      p += 0.3 * e * vec3(sin(seed * 40.0 + uP * 6.0), cos(seed * 31.0 + uP * 5.0), sin(seed * 23.0 + uP * 7.0));
      float heat = clamp(uP * 1.6 + seed * 0.25 - speed * 0.1, 0.0, 1.0);
      vec3 c = mix(vec3(1.0), vec3(1.0, 0.9, 0.55), smoothstep(0.0, 0.3, heat));
      c = mix(c, vec3(1.0, 0.55, 0.2), smoothstep(0.3, 0.65, heat));
      c = mix(c, vec3(0.78, 0.22, 0.36), smoothstep(0.65, 1.0, heat));
      if (seed > 0.93) c = mix(c, vec3(0.55, 0.72, 1.0), 0.7);
      vC = c;
      vA = uA * (1.0 - 0.5 * smoothstep(0.6, 1.0, uP));
      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      float s = (0.24 - 0.13 * e) * (0.6 + seed);
      gl_PointSize = clamp(s * uScale * uPR * (420.0 / -mv.z), 0.0, 14.0 * uPR);
      gl_Position = projectionMatrix * mv;
    }`;
  const FRAGMENT = `
    varying vec3 vC; varying float vA;
    void main() {
      float d = length(gl_PointCoord - 0.5);
      float a = smoothstep(0.5, 0.0, d);
      gl_FragColor = vec4(vC, a * a * vA);
    }`;

  function ringTexture() {
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const ctx = c.getContext("2d");
    const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0.0, "rgba(255,220,170,0)");
    g.addColorStop(0.72, "rgba(255,220,170,0)");
    g.addColorStop(0.86, "rgba(255,236,200,0.9)");
    g.addColorStop(0.92, "rgba(255,170,110,0.35)");
    g.addColorStop(1.0, "rgba(255,140,90,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
    return new THREE.CanvasTexture(c);
  }

  function burst(count) {
    const dir = [], speed = [], seed = [];
    for (let i = 0; i < count; i++) {
      const z = Math.random() * 2 - 1;
      const a = Math.random() * Math.PI * 2;
      const r = Math.sqrt(1 - z * z);
      dir.push(r * Math.cos(a), r * Math.sin(a), z);
      speed.push(0.15 + 0.85 * Math.pow(Math.random(), 0.6));
      seed.push(Math.random());
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(new Array(count * 3).fill(0), 3));
    g.setAttribute("dir", new THREE.Float32BufferAttribute(dir, 3));
    g.setAttribute("speed", new THREE.Float32BufferAttribute(speed, 1));
    g.setAttribute("seed", new THREE.Float32BufferAttribute(seed, 1));
    return g;
  }

  function create({ scene, world, view, small }) {
    const origin = new THREE.Vector3(-world.HALF, 0, 0);
    const uniforms = { uP: { value: 0 }, uA: { value: 0 }, uPR: { value: 1 }, uScale: { value: small ? 2 : 1.6 } };
    const points = new THREE.Points(burst(small ? 3500 : 7000),
      new THREE.ShaderMaterial({ uniforms, vertexShader: VERTEX, fragmentShader: FRAGMENT, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    points.position.copy(origin);
    points.frustumCulled = false; // vertices are moved in the shader
    const core = new THREE.Sprite(new THREE.SpriteMaterial({ map: world.glow, color: 0xffffff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
    core.position.copy(origin);
    const ring = new THREE.Sprite(new THREE.SpriteMaterial({ map: ringTexture(), transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
    ring.position.copy(origin);
    const group = new THREE.Group();
    group.add(points, core, ring);
    group.visible = false;
    scene.add(group);

    const flash = document.createElement("div");
    flash.className = "u3d-flash";
    const caption = document.createElement("p");
    caption.className = "u3d-intro";
    view.append(flash, caption);

    const fx = { core: 0.05, coreA: 0, ring: 0.3, ringA: 0, fade: 1 };
    let tl = null;

    function apply() {
      core.scale.setScalar(fx.core);
      core.material.opacity = fx.coreA;
      ring.scale.setScalar(fx.ring);
      ring.material.opacity = fx.ringA;
      world.setFade(fx.fade);
    }

    function say(text) {
      caption.textContent = text;
      gsap.fromTo(caption, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" });
    }

    function finish() {
      group.visible = false;
      Object.assign(fx, { coreA: 0, ringA: 0, fade: 1 });
      apply();
      uniforms.uA.value = 0;
      gsap.set(flash, { opacity: 0 });
      gsap.to(caption, { opacity: 0, duration: 0.5 });
      tl = null;
    }

    return {
      setPR(pr) { uniforms.uPR.value = pr; },
      get playing() { return Boolean(tl); },
      /* rig: the camera rig of universe3d.js; done: called when the model of the Universe is back */
      play(rig, done) {
        if (tl) tl.kill();
        group.visible = true;
        Object.assign(fx, { core: 0.05, coreA: 1, ring: 0.3, ringA: 0, fade: 0 });
        uniforms.uP.value = 0;
        uniforms.uA.value = 0;
        apply();
        gsap.killTweensOf(rig);
        Object.assign(rig, { tx: origin.x, ty: 0, tz: 0, r: 7, az: -0.3, el: 0.12, lo: -99, hi: 99, focus: 0, solar: 0 });
        say("Il y a 13,8 milliards d'années…");
        tl = gsap.timeline({ onUpdate: apply, onComplete: () => { finish(); done(); } })
          .to(fx, { core: 0.7, duration: 1, ease: "power2.in" })
          .addLabel("bang")
          .to(flash, { opacity: 1, duration: 0.07, ease: "none" }, "bang")
          .to(flash, { opacity: 0, duration: 1, ease: "power2.out" }, "bang+=0.07")
          .set(uniforms.uA, { value: 1 }, "bang")
          .to(uniforms.uP, { value: 1, duration: 3.4, ease: "none" }, "bang")
          .to(fx, { core: 7, duration: 0.25, ease: "power2.out" }, "bang")
          .to(fx, { core: 1.2, coreA: 0.8, duration: 1.4, ease: "power2.inOut" }, "bang+=0.25")
          .fromTo(fx, { ring: 0.3, ringA: 1 }, { ring: 24, ringA: 0, duration: 2, ease: "power2.out", immediateRender: false }, "bang")
          .to(rig, { r: 15, az: -0.5, el: 0.2, duration: 3.2, ease: "power2.out" }, "bang")
          .call(() => say("Représentation artistique : ce n'est pas une explosion dans l'espace, c'est l'espace lui-même qui se met à grandir."), null, "bang+=1.5")
          .to(fx, { fade: 1, duration: 1.4, ease: "power1.inOut" }, "bang+=1.9")
          .to(uniforms.uA, { value: 0, duration: 1.2, ease: "power1.in" }, "bang+=2.4")
          .to({}, { duration: 0.8 }, "bang+=3.4");
      },
      cancel() {
        if (!tl) return;
        tl.kill();
        finish();
      },
    };
  }

  window.VM.universeBang = { create };
})();
