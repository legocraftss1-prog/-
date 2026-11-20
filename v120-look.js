/* =====================================================================
   МГИАГ 1.19 — ТЕНИ, СВЕТ  (трава из 1.19 убрана в 1.20 по просьбе)
   • Тени от солнца в обычной графике (в «Улучшенной» и ULTRA тенями управляют они сами).
   • Мягкий свет: меньше рассеянного света, солнце чуть сильнее — картинка не такая плоская и пересвеченная.
   Настройки → 🎨 Графика → «Тени и свет». Сохраняются на устройстве.
   ===================================================================== */
(function () {
  'use strict';
  var KEY = 'mg_look', MOBILE = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || (window.matchMedia && matchMedia('(pointer:coarse)').matches);
  var L = window.MG_LOOK = { shadows: true, light: true, ready: false, stats: {} };
  try { var sv = JSON.parse(localStorage.getItem(KEY) || 'null'); if (sv) { if (sv.shadows !== undefined) L.shadows = !!sv.shadows; if (sv.light !== undefined) L.light = !!sv.light; } } catch (e) { }
  function save() { try { localStorage.setItem(KEY, JSON.stringify({ shadows: L.shadows, light: L.light })); } catch (e) { } }
  function ready() { return typeof worldReady !== 'undefined' && worldReady && typeof THREE !== 'undefined' && typeof scene !== 'undefined' && typeof renderer !== 'undefined' && typeof updEnv === 'function'; }

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
  L.setShadows = function (v) { L.shadows = !!v; save(); };
  L.setLight = function (v) { L.light = !!v; save(); };
  L.stat = function () { return { shadows: shOn }; };
  function frame(dt) { try { lightTick(); } catch (e) { } try { shadowTick(dt); } catch (e) { console.error('[MG_LOOK shadows]', e); } }
  var iv = setInterval(function () {
    if (!ready()) return; clearInterval(iv);
    var pe = updEnv, w = function (dt, t) { pe(dt, t); frame(dt); }; w.__mgGfx = pe.__mgGfx; w.__mgUltra = pe.__mgUltra; window.updEnv = updEnv = w; L.ready = true;
  }, 500);
})();
