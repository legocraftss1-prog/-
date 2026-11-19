/* =====================================================================
   МГИАГ 1.19 — ТРАВА, ТЕНИ, СВЕТ
   • Трава: низкая (25–45 см), колышется на ветру. Рисуется только вокруг игрока (одним пакетом —
     одна отрисовка на всю траву), не растёт на дорогах, тротуарах, в домах, в воде; зимой прячется под снег,
     осенью желтеет вместе с землёй. Настройка: выкл / обычная / густая.
   • Тени от солнца в обычной графике (в «Улучшенной» и ULTRA тенями управляют они сами).
   • Мягкий свет: меньше рассеянного света, солнце чуть сильнее — картинка не такая плоская и пересвеченная.
   Настройки → 🎨 Графика → «Трава, тени и свет». Сохраняются на устройстве.
   ===================================================================== */
(function () {
  'use strict';
  var KEY = 'mg_look', MOBILE = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || (window.matchMedia && matchMedia('(pointer:coarse)').matches);
  var L = window.MG_LOOK = { grass: 'normal', shadows: true, light: true, ready: false, stats: {} };
  try { var sv = JSON.parse(localStorage.getItem(KEY) || 'null'); if (sv) { if (['off', 'normal', 'dense'].indexOf(sv.grass) >= 0) L.grass = sv.grass; if (sv.shadows !== undefined) L.shadows = !!sv.shadows; if (sv.light !== undefined) L.light = !!sv.light; } } catch (e) { }
  function save() { try { localStorage.setItem(KEY, JSON.stringify({ grass: L.grass, shadows: L.shadows, light: L.light })); } catch (e) { } }
  function ready() { return typeof worldReady !== 'undefined' && worldReady && typeof THREE !== 'undefined' && typeof scene !== 'undefined' && typeof renderer !== 'undefined' && typeof updEnv === 'function'; }

  /* ====================== ТРАВА ====================== */
  var CELL = 4, GR = null;
  function conf() { var d = L.grass === 'dense'; return { R: d ? (MOBILE ? 28 : 36) : (MOBILE ? 18 : 26), K: d ? (MOBILE ? 34 : 48) : (MOBILE ? 18 : 28) }; }
  function hash(a, b, c) { var h = Math.imul(a * 73856093 ^ b * 19349663 ^ c * 83492791, 2654435761) >>> 0; h ^= h >>> 15; h = Math.imul(h, 2246822519) >>> 0; h ^= h >>> 13; return (h >>> 0) / 4294967296; }
  function clumpGeo() {
    // пучок из 5 травинок: узкие треугольники разной высоты и наклона; низ темнее верха
    var pos = [], colA = [];
    for (var i = 0; i < 5; i++) { var a = i / 5 * Math.PI * 2 + i, r = .06 + (i % 2) * .05, x = Math.cos(a) * r, z = Math.sin(a) * r, h = .7 + (i % 3) * .15, w = .045, lean = .12, bx = Math.cos(a + 1.3) * w, bz = Math.sin(a + 1.3) * w;
      pos.push(x - bx, 0, z - bz, x + bx, 0, z + bz, x + Math.cos(a) * lean, h, z + Math.sin(a) * lean); colA.push(.55, .62, .5, .55, .62, .5, 1.05, 1.12, .95); }
    var nor = []; for (i = 0; i < pos.length / 3; i++) nor.push(0, 1, 0);   // свет как у земли, без чёрных изнанок
    var g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(colA, 3));
    return g;
  }
  var uT = { value: 0 };
  function grassMat() {
    var m = new THREE.MeshLambertMaterial({ color: 0x7d9d58, vertexColors: true, side: THREE.DoubleSide });
    m.onBeforeCompile = function (sh) {
      sh.uniforms.uGT = uT;
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uGT;')
        .replace('#include <begin_vertex>', ['#include <begin_vertex>',
          '#ifdef USE_INSTANCING', 'vec3 gp = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);', '#else', 'vec3 gp = vec3(0.0);', '#endif',
          'float gw = sin(uGT * 1.9 + gp.x * .31 + gp.z * .23) * .6 + sin(uGT * 3.1 + gp.x * .7 - gp.z * .5) * .25 + sin(uGT * .6 + gp.z * .05) * .5;',
          'transformed.x += gw * position.y * .32; transformed.z += cos(uGT * 1.4 + gp.x * .2) * position.y * .14;'].join('\n'));
    };
    m.customProgramCacheKey = function () { return 'mgGrass'; };
    return m;
  }
  function buildGrass() {
    var c = conf(), n = Math.ceil(c.R * 2 / CELL) + 1, N = n * n * c.K;
    var mesh = new THREE.InstancedMesh(clumpGeo(), grassMat(), N); mesh.frustumCulled = false; mesh.userData.noShadow = true; mesh.userData.noPerf = true; mesh.castShadow = false; mesh.receiveShadow = true;
    var zero = new THREE.Matrix4().makeScale(0, 0, 0); for (var i = 0; i < N; i++) mesh.setMatrixAt(i, zero);
    scene.add(mesh);
    GR = { mesh: mesh, n: n, K: c.K, R: c.R, slots: new Array(n * n), queue: [], zero: zero, m4: new THREE.Matrix4(), q: new THREE.Quaternion(), e: new THREE.Euler(), v: new THREE.Vector3(), s: new THREE.Vector3(), mode: L.grass, shown: 0 };
  }
  function dropGrass() { if (!GR) return; scene.remove(GR.mesh); GR.mesh.geometry.dispose(); GR.mesh.material.dispose(); GR = null; }
  // можно ли расти траве в точке
  var colBuf = [];
  function grassOK(x, z) {
    try {
      if (window.MG_EXPAND && MG_EXPAND.active && MG_EXPAND.outside(x, z)) { if (MG_EXPAND.isWater(x, z) || MG_EXPAND.gridH(x, z) < .25) return false; }
      else if (Math.max(Math.abs(x), Math.abs(z)) > 742) return false;
      if (typeof roadDist === 'function' && roadDist(x, z) < 3.3) return false;
      var L_ = colsNear(x, z, .3); for (var i = 0; i < L_.length; i++) { var c = L_[i]; if (!c.on || x < c.x0 || x > c.x1 || z < c.z0 || z > c.z1) continue; if (c.h !== undefined && c.h < .3) continue; if (typeof inShape === 'function' && !inShape(c, x, z, 0)) continue; return false; }
      if (typeof SKP !== 'undefined' && SKP.ready && x > SKP.x0 && x < SKP.x1 && z > SKP.z0 && z < SKP.z1) return false;
      return true;
    } catch (e) { return true; }
  }
  function fillSlot(si, ci, cj) {
    var G_ = GR, base = si * G_.K, m = G_.mesh, shown = 0;
    for (var k = 0; k < G_.K; k++) {
      var x = ci * CELL + hash(ci, cj, k * 3) * CELL, z = cj * CELL + hash(ci, cj, k * 3 + 1) * CELL, r = hash(ci, cj, k * 3 + 2);
      if (!grassOK(x, z)) { m.setMatrixAt(base + k, G_.zero); continue; }
      var y = H(x, z) - .02, sc = .28 + r * .2;
      G_.e.set(0, r * 6.283, 0); G_.q.setFromEuler(G_.e); G_.v.set(x, y, z); G_.s.set(.9 + r * .5, sc, .9 + r * .5); G_.m4.compose(G_.v, G_.q, G_.s); m.setMatrixAt(base + k, G_.m4); shown++;
    }
    m.instanceMatrix.needsUpdate = true; return shown;
  }
  function grassTick(dt) {
    var want = L.grass !== 'off' && area === 'city' && started;
    var snow = 0; try { snow = typeof groundSnow !== 'undefined' ? groundSnow : (WORLD.season === 'winter' ? 1 : 0); } catch (e) { }
    if (L.grass === 'off') { if (GR) dropGrass(); return; }
    if (!GR || GR.mode !== L.grass) { dropGrass(); buildGrass(); }
    GR.mesh.visible = want && snow < .35;
    if (!GR.mesh.visible) return;
    uT.value += dt;
    try { var gc = groundMat.color; GR.mesh.material.color.setRGB(gc.r * 1.02, gc.g * 1.08, gc.b * .92); } catch (e) { }
    var P = player.drive ? player.drive.pos : player.pos, n = GR.n, c0 = Math.floor((P.x - GR.R) / CELL), r0 = Math.floor((P.z - GR.R) / CELL), budget = MOBILE ? 3 : 6;
    for (var j = 0; j < n && budget > 0; j++) for (var i = 0; i < n && budget > 0; i++) {
      var ci = c0 + i, cj = r0 + j, si = ((cj % n) + n) % n * n + ((ci % n) + n) % n, key = ci + ',' + cj;
      if (GR.slots[si] === key) continue; GR.slots[si] = key; fillSlot(si, ci, cj); budget--;
    }
  }
  L.refreshGrass = function () { if (GR) GR.slots = new Array(GR.n * GR.n); };   // после смены мира (расширение и т. п.)

  /* ====================== ТЕНИ (в обычной графике) ====================== */
  var shOn = false, queue = [], qi = 0, scanT = 0;
  function shadowsWanted() {
    if (!L.shadows) return false;
    try { if (window.MG_GFX && MG_GFX.mode === 'hd') return false; if (window.MG_ULTRA && MG_ULTRA.shadowsOn) return false; } catch (e) { }
    return true;
  }
  function touchMats() { scene.traverse(function (o) { if (o.isMesh) { var a = Array.isArray(o.material) ? o.material : [o.material]; a.forEach(function (m) { if (m) m.needsUpdate = true; }); } }); }
  function flag(o) {
    var m = o.material; if (!m) return; var arr = Array.isArray(m) ? m : [m];
    var lit = arr.some(function (x) { return x && (x.isMeshLambertMaterial || x.isMeshPhongMaterial || x.isMeshStandardMaterial); });
    if (!lit) { o.castShadow = o.receiveShadow = false; return; }
    if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere();
    var bs = o.geometry.boundingSphere, big = bs && bs.radius > 78 && !o.userData.merged;
    o.receiveShadow = true;
    o.castShadow = !big && !o.userData.noShadow && !o.userData.exTerrain && !o.userData.underlay && !arr.some(function (x) { return x.transparent; }) && o.material !== groundMat;
  }
  function setShadows(on) {
    if (on === shOn) return; shOn = on;
    if (on) {
      renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap; sun.castShadow = true;
      var s = sun.shadow, sz = MOBILE ? 1024 : 2048, half = MOBILE ? 38 : 55; s.mapSize.set(sz, sz); if (s.map) { s.map.dispose(); s.map = null; }
      var c = s.camera; c.left = -half; c.right = half; c.top = half; c.bottom = -half; c.near = 1; c.far = 360; c.updateProjectionMatrix(); s.bias = -0.0008; s.normalBias = .05;
      if (!sun.target.parent) scene.add(sun.target);
      queue.length = 0; qi = 0; scene.traverse(function (o) { if (o.isMesh) queue.push(o); }); scanT = 12; touchMats();
    } else {
      sun.castShadow = false; renderer.shadowMap.enabled = false;
      scene.traverse(function (o) { if (o.isMesh) { o.castShadow = false; o.receiveShadow = false; } }); touchMats();
    }
  }
  function shadowTick(dt) {
    var w = shadowsWanted(); if (w !== shOn) { try { if (w || !(window.MG_GFX && MG_GFX.mode === 'hd') && !(window.MG_ULTRA && MG_ULTRA.shadowsOn)) setShadows(w); else shOn = false; } catch (e) { shOn = false; } }
    if (!shOn) return;
    scanT -= dt; if (scanT <= 0) { scanT = 12; queue.length = 0; qi = 0; scene.traverse(function (o) { if (o.isMesh) queue.push(o); }); }
    var b = MOBILE ? 500 : 1200; while (qi < queue.length && b-- > 0) { var o = queue[qi++]; if (o.parent) flag(o); }
    var p = player.drive ? player.drive.pos : player.pos;
    if (p && area === 'city') { sun.position.add(p); sun.target.position.set(p.x, p.y || 0, p.z); sun.target.updateMatrixWorld(); }
  }

  /* ====================== СВЕТ ====================== */
  function lightTick() {
    if (!L.light || area !== 'city') return;
    try { if (typeof hemiOverride !== 'undefined' && hemiOverride !== null) return; if (window.MG_ULTRA && MG_ULTRA.active) return; } catch (e) { }
    hemi.intensity *= .76; sun.intensity *= 1.2;
  }

  /* ====================== API и установка ====================== */
  L.setGrass = function (v) { if (['off', 'normal', 'dense'].indexOf(v) < 0) return; L.grass = v; save(); };
  L.setShadows = function (v) { L.shadows = !!v; save(); };
  L.setLight = function (v) { L.light = !!v; save(); };
  L.stat = function () { var s = 0; if (GR) { var a = GR.mesh.instanceMatrix.array; for (var i = 0; i < a.length; i += 16) if (a[i] !== 0) s++; } return { grass: GR ? GR.mesh.count : 0, shown: s, visible: !!(GR && GR.mesh.visible), shadows: shOn }; };
  function frame(dt) { try { lightTick(); } catch (e) { } try { shadowTick(dt); } catch (e) { console.error('[MG_LOOK shadows]', e); } try { grassTick(dt); } catch (e) { console.error('[MG_LOOK grass]', e); } }
  var iv = setInterval(function () {
    if (!ready()) return; clearInterval(iv);
    var pe = updEnv, w = function (dt, t) { pe(dt, t); frame(dt); }; w.__mgGfx = pe.__mgGfx; w.__mgUltra = pe.__mgUltra; window.updEnv = updEnv = w; L.ready = true;
  }, 500);
})();
