/* 3D сцени с Three.js / 3D scenes with Three.js */
const Scene3D = (() => {
  const noop = { dispose() {} };

  function coinTexture() {
    const c = document.createElement('canvas'); c.width = c.height = 512;
    const g = c.getContext('2d');
    const bg = g.createRadialGradient(190, 170, 20, 256, 256, 280);
    bg.addColorStop(0, '#ffd978'); bg.addColorStop(.5, '#f0a91e'); bg.addColorStop(1, '#b5760a');
    g.fillStyle = bg; g.fillRect(0, 0, 512, 512);
    g.lineWidth = 14; g.strokeStyle = 'rgba(122,75,0,.55)'; g.beginPath(); g.arc(256, 256, 226, 0, Math.PI * 2); g.stroke();
    g.lineWidth = 4; g.setLineDash([6, 10]); g.strokeStyle = 'rgba(122,75,0,.5)'; g.beginPath(); g.arc(256, 256, 198, 0, Math.PI * 2); g.stroke(); g.setLineDash([]);
    g.font = '800 330px Manrope, Manrope, Arial'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = 'rgba(255,240,180,.5)'; g.fillText('€', 252, 262);
    g.fillStyle = '#7a4b00'; g.fillText('€', 256, 268);
    const t = new THREE.CanvasTexture(c); t.anisotropy = 8;
    t.center.set(.5, .5); t.rotation = Math.PI / 2; return t;
  }

  function setup(canvas, fov, z) {
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(fov, 1, .1, 100);
    camera.position.set(0, .4, z);
    const resize = () => {
      const w = canvas.clientWidth || 300, h = canvas.clientHeight || 300;
      renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize); ro.observe(canvas); resize();
    return { renderer, scene, camera, ro };
  }

  /* Дашборд: въртяща се златна монета с орбитиращи монети и частици */
  function hero(canvas) {
    if (!window.THREE || !canvas) return noop;
    let S; try { S = setup(canvas, 35, 10); } catch (e) { return noop; }
    const { renderer, scene, camera, ro } = S;
    scene.add(new THREE.AmbientLight(0xffffff, .3));
    const l1 = new THREE.PointLight(0xffe0a0, .9, 60); l1.position.set(6, 6, 8); scene.add(l1);
    const l2 = new THREE.PointLight(0x7c5cff, 1.1, 60); l2.position.set(-7, -2, 6); scene.add(l2);
    const l3 = new THREE.PointLight(0x00e0b8, .7, 60); l3.position.set(0, -6, 4); scene.add(l3);
    const tex = coinTexture();
    const side = new THREE.MeshPhongMaterial({ color: 0xc98f1c, specular: 0x998855, shininess: 60 });
    const face = new THREE.MeshPhongMaterial({ map: tex, color: 0xffffff, specular: 0x665533, shininess: 40 });
    const mats = [side, face, face];
    const geoms = [];
    const mkCoin = (r, h) => {
      const grp = new THREE.Group();
      const g = new THREE.CylinderGeometry(r, r, h, 64); geoms.push(g);
      const m = new THREE.Mesh(g, mats); m.rotation.x = Math.PI / 2; grp.add(m);
      const tg = new THREE.TorusGeometry(r * .985, r * .045, 12, 64); geoms.push(tg);
      [h / 2, -h / 2].forEach(z => { const t = new THREE.Mesh(tg, side); t.position.z = z; grp.add(t); });
      return grp;
    };
    const main = mkCoin(1.7, .34); scene.add(main);
    const orbit = new THREE.Group(); scene.add(orbit);
    const minis = [];
    for (let i = 0; i < 9; i++) {
      const c = mkCoin(.34, .08), a = i / 9 * Math.PI * 2;
      c.userData = { a, r: 3.6 + (i % 3) * .35, y: (i % 2 ? 1 : -1) * (.3 + (i % 4) * .22), sp: .25 + (i % 3) * .08 };
      orbit.add(c); minis.push(c);
    }
    const N = 260, pos = new Float32Array(N * 3);
    for (let i = 0; i < N; i++) { const r = 4 + Math.random() * 6, a = Math.random() * 6.283, b = (Math.random() - .5) * 8; pos[i * 3] = Math.cos(a) * r; pos[i * 3 + 1] = b; pos[i * 3 + 2] = Math.sin(a) * r - 2; }
    const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const pm = new THREE.PointsMaterial({ color: 0x9fb4ff, size: .06, transparent: true, opacity: .8, blending: THREE.AdditiveBlending, depthWrite: false });
    const pts = new THREE.Points(pg, pm); scene.add(pts);
    let mx = 0, my = 0, tx = 0, ty = 0, raf = 0, t0 = performance.now(), dead = false;
    const mv = e => { const r = canvas.getBoundingClientRect(); tx = ((e.clientX - r.left) / r.width - .5) * 2; ty = ((e.clientY - r.top) / r.height - .5) * 2; };
    window.addEventListener('pointermove', mv);
    const loop = now => {
      if (dead) return;
      if (!canvas.isConnected) return api.dispose();
      const t = (now - t0) / 1000;
      mx += (tx - mx) * .06; my += (ty - my) * .06;
      main.rotation.y = t * .9 + mx * .6; main.rotation.x = my * .35 + Math.sin(t * .8) * .08;
      main.position.y = Math.sin(t * 1.3) * .18;
      orbit.rotation.x = .35; orbit.rotation.z = -.15; orbit.rotation.y = t * .12;
      minis.forEach(c => { const u = c.userData, a = u.a + t * u.sp; c.position.set(Math.cos(a) * u.r, u.y + Math.sin(t * 1.5 + u.a) * .25, Math.sin(a) * u.r); c.rotation.y = t * 2 + u.a; c.rotation.x = t * 1.3; });
      pts.rotation.y = t * .03;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const api = {
      dispose() { if (dead) return; dead = true; cancelAnimationFrame(raf); window.removeEventListener('pointermove', mv); ro.disconnect(); geoms.forEach(g => g.dispose()); pg.dispose(); tex.dispose(); renderer.dispose(); }
    };
    return api;
  }

  function label(text, color = '#aeb6e6') {
    const c = document.createElement('canvas'); c.width = 256; c.height = 96;
    const g = c.getContext('2d'); g.font = '700 46px Manrope, Arial'; g.fillStyle = color; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 128, 48);
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), transparent: true }));
    s.scale.set(1.7, .64, 1); return s;
  }

  /* Аналитика: 3D стълбовидна диаграма месец × категория (влачене за въртене) */
  function bars(canvas, tipEl, { months, cats, values, fmt }) {
    if (!window.THREE || !canvas) return noop;
    let S; try { S = setup(canvas, 38, 15); } catch (e) { return noop; }
    const { renderer, scene, camera, ro } = S;
    camera.position.set(0, 7, 14); camera.lookAt(0, 1.2, 0);
    scene.add(new THREE.AmbientLight(0xffffff, .65));
    const dl = new THREE.DirectionalLight(0xffffff, 1.1); dl.position.set(6, 12, 8); scene.add(dl);
    const pl = new THREE.PointLight(0x7c5cff, 1.2, 50); pl.position.set(-8, 4, 6); scene.add(pl);
    const root = new THREE.Group(); scene.add(root);
    const grid = new THREE.GridHelper(16, 16, 0x7c5cff, 0x39406f); grid.material.transparent = true; grid.material.opacity = .45; root.add(grid);
    const max = Math.max(1, ...values.flat()), H = 5, sx = 1.45, sz = 1.45;
    const meshes = [], geoms = [];
    months.forEach((m, i) => {
      const lb = label(m); lb.position.set((i - (months.length - 1) / 2) * sx, .05, (cats.length) * sz / 2 + .8); root.add(lb);
      cats.forEach((c, j) => {
        const h = Math.max(.05, values[i][j] / max * H);
        const g = new THREE.BoxGeometry(.95, 1, .95); geoms.push(g);
        const mat = new THREE.MeshPhongMaterial({ color: c.color, shininess: 80, specular: 0x888888 });
        const mesh = new THREE.Mesh(g, mat);
        mesh.position.set((i - (months.length - 1) / 2) * sx, 0, (j - (cats.length - 1) / 2) * sz);
        mesh.userData = { h, val: values[i][j], cat: c.name, month: m, delay: (i + j) * .07, base: c.color };
        mesh.scale.y = .001; root.add(mesh); meshes.push(mesh);
      });
    });
    root.rotation.y = -.5;
    let dragging = false, lx = 0, ly = 0, auto = true, raf = 0, dead = false, hover = null;
    const t0 = performance.now(), ray = new THREE.Raycaster(), mouse = new THREE.Vector2();
    const down = e => { dragging = true; auto = false; lx = e.clientX; ly = e.clientY; canvas.setPointerCapture(e.pointerId); };
    const up = () => { dragging = false; };
    const move = e => {
      if (dragging) { root.rotation.y += (e.clientX - lx) * .008; root.rotation.x = Math.max(-.3, Math.min(.5, root.rotation.x + (e.clientY - ly) * .004)); lx = e.clientX; ly = e.clientY; }
      const r = canvas.getBoundingClientRect(); mouse.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(mouse, camera); const hit = ray.intersectObjects(meshes)[0];
      hover = hit ? hit.object : null;
      if (hover) { tipEl.style.opacity = 1; tipEl.style.left = (e.clientX - r.left + 14) + 'px'; tipEl.style.top = (e.clientY - r.top - 10) + 'px'; tipEl.innerHTML = `<span style="color:${hover.userData.base}">●</span> ${hover.userData.cat} · ${hover.userData.month}<br>${fmt(hover.userData.val)}`; canvas.style.cursor = 'pointer'; }
      else { tipEl.style.opacity = 0; canvas.style.cursor = 'grab'; }
    };
    canvas.addEventListener('pointerdown', down); canvas.addEventListener('pointerup', up); canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerleave', () => { hover = null; tipEl.style.opacity = 0; });
    const loop = now => {
      if (dead) return;
      if (!canvas.isConnected) return api.dispose();
      const t = (now - t0) / 1000;
      if (auto) root.rotation.y = -.5 + Math.sin(t * .3) * .5;
      meshes.forEach(m => {
        const k = Math.min(1, Math.max(0, (t - m.userData.delay) / .9)), e = 1 - Math.pow(1 - k, 3);
        const target = hover === m ? 1.06 : 1, hh = Math.max(.001, m.userData.h * e);
        m.scale.y += (hh - m.scale.y) * .3; m.scale.x = m.scale.z += (target - m.scale.x) * .2;
        m.position.y = m.scale.y / 2;
        m.material.emissive.setHex(hover === m ? 0x333333 : 0x000000);
      });
      renderer.render(scene, camera);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    const api = {
      dispose() { if (dead) return; dead = true; cancelAnimationFrame(raf); ro.disconnect(); geoms.forEach(g => g.dispose()); renderer.dispose(); }
    };
    return api;
  }
  return { hero, bars };
})();
