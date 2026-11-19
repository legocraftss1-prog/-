/* =====================================================================
   МГИАГ 1.17 — ОПТИМИЗАЦИЯ: рисуется только то, что рядом с игроком.
   • Мелкие объекты (машины, фонари, скамейки, вывески, персонажи, детали) дальше заданного
     расстояния не отрисовываются. Видимость самой игры (.visible) не трогается: объект просто
     переводится на «выключенный» слой отрисовки, поэтому игровые скрытия и показы не ломаются.
   • То, что за спиной, и так не рисует three.js (отсечение по полю зрения).
   • Склеенные куски города дальше границы тумана тоже не рисуются (туман их всё равно скрыл бы).
   Настройки: Настройки → Графика → «Оптимизация».
   ===================================================================== */
(function () {
  'use strict';
  var MOBILE = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || !!(window.matchMedia && matchMedia('(pointer:coarse)').matches);
  var KEY = 'mg_perf', P = window.MG_PERF = { on: true, dist: MOBILE ? 110 : 160, fog: true, list: [], hidden: 0, total: 0, ready: false };
  try { var sv = JSON.parse(localStorage.getItem(KEY) || 'null'); if (sv) { if (sv.on !== undefined) P.on = !!sv.on; if (isFinite(+sv.dist)) P.dist = Math.max(60, Math.min(320, +sv.dist)); if (sv.fog !== undefined) P.fog = !!sv.fog; } } catch (e) { }
  function save() { try { localStorage.setItem(KEY, JSON.stringify({ on: P.on, dist: P.dist, fog: P.fog })); } catch (e) { } }

  var tmpBox = null, tmpV = null;
  function measure(o) {
    var u = o.userData; if (u.__pr !== undefined) return;
    try {
      if (!tmpBox) { tmpBox = new THREE.Box3(); tmpV = new THREE.Vector3(); }
      o.updateMatrixWorld(true); tmpBox.setFromObject(o);
      if (tmpBox.isEmpty()) { u.__pr = 0; u.__po = { x: 0, y: 0, z: 0 }; return; }
      tmpBox.getCenter(tmpV); var sz = tmpBox.getSize(new THREE.Vector3());
      u.__pr = Math.max(sz.x, sz.y, sz.z) / 2; u.__po = { x: tmpV.x - o.position.x, y: tmpV.y - o.position.y, z: tmpV.z - o.position.z };
    } catch (e) { u.__pr = -1; }
  }
  function roots() {
    var r = []; if (typeof cityG !== 'undefined') r.push(cityG);
    scene.children.forEach(function (c) { if (c.isGroup && c !== cityG && c.userData && c.userData.area) r.push(c); });
    return r;
  }
  function skip(o) {
    var u = o.userData || {};
    if (u.merged || u.cull || u.keep || u.underlay || u.noPerf || u.ultra) return true;
    if (o.isLine || o.isLineSegments || o.isPoints) return true;
    try { if (typeof player !== 'undefined' && (o === player.g || o === comp.g)) return true; } catch (e) { }
    return false;
  }
  /* список объектов: прямые потомки групп областей. Пересобирается редко (раз в 6 с). */
  function scan() {
    var old = new Map(); P.list.forEach(function (e) { old.set(e.o, e); });
    var list = [];
    roots().forEach(function (root) {
      root.children.forEach(function (o) {
        if (skip(o)) return;
        var e = old.get(o);
        if (!e) { measure(o); var r = o.userData.__pr; if (!(r >= 0) || r > 28) return; var ms = []; o.traverse(function (m) { if (m.isMesh || m.isSprite) ms.push(m); }); if (!ms.length) return; e = { o: o, ms: ms, r: r, po: o.userData.__po, off: false }; }
        list.push(e); old.delete(o);
      });
    });
    old.forEach(function (e) { if (e.off) show(e); });                                        // ушедшие из сцены — вернуть слой
    P.list = list; P.total = list.length;
  }
  function hide(e) { for (var i = 0; i < e.ms.length; i++) { var m = e.ms[i]; if (m.userData.__lm === undefined) m.userData.__lm = m.layers.mask; m.layers.mask = 0; } e.off = true; }
  function show(e) { for (var i = 0; i < e.ms.length; i++) { var m = e.ms[i]; if (m.userData.__lm !== undefined) { m.layers.mask = m.userData.__lm; delete m.userData.__lm; } } e.off = false; }
  function showAll() { P.list.forEach(function (e) { if (e.off) show(e); }); P.hidden = 0; }
  P.showAll = showAll;

  /* граница тумана для склеенных кусков города: дальше неё всё равно ничего не видно */
  var baseCull = null, lastSet = null;
  function fogCull() {
    if (typeof fog === 'undefined' || typeof area === 'undefined') return;
    if (window.MG_CULL !== lastSet) baseCull = window.MG_CULL;                                  // настройку поменяли в «Графике» — запоминаем её
    if (!P.on || !P.fog || area !== 'city') { if (lastSet !== null && window.MG_CULL === lastSet) { window.MG_CULL = baseCull; lastSet = null; } return; }
    var v = Math.round(Math.min(baseCull || 420, Math.max(90, fog.far + 50)));
    window.MG_CULL = lastSet = v;
  }
  P.limit = function () { var d = P.dist; try { if (P.fog && typeof fog !== 'undefined') d = Math.min(d, Math.max(50, fog.far + 20)); } catch (e) { } return d; };

  var t = 0, scanT = 0;
  function frame(dt) {
    t -= dt; scanT -= dt;
    if (t > 0) return; t = .25;
    try { fogCull(); } catch (e) { }
    if (!P.on) { if (P.hidden) showAll(); return; }
    if (scanT <= 0) { scanT = 6; scan(); }
    var c = camera.position, lim = P.limit(), n = 0;
    for (var i = 0; i < P.list.length; i++) {
      var e = P.list[i], o = e.o, p = o.position, po = e.po || { x: 0, y: 0, z: 0 };
      var dx = p.x + po.x - c.x, dz = p.z + po.z - c.z, d = Math.sqrt(dx * dx + dz * dz) - e.r;
      var far = d > lim + e.r * 4;
      if (far && !e.off) hide(e); else if (!far && e.off) show(e);
      if (e.off) n++;
    }
    P.hidden = n;
  }
  P.set = function (on) { P.on = !!on; save(); if (!P.on) showAll(); t = 0; };
  P.setDist = function (v) { P.dist = Math.max(60, Math.min(320, +v || P.dist)); save(); t = 0; };
  P.setFog = function (on) { P.fog = !!on; save(); t = 0; };
  P.frame = frame; P.scan = scan;

  function hook() {
    if (typeof worldReady === 'undefined' || !worldReady || typeof updEnv !== 'function' || typeof camera === 'undefined') return false;
    var pe = updEnv; var w = function (dt, tt) { pe(dt, tt); try { frame(dt); } catch (e) { console.error('[MG_PERF]', e); } };
    w.__mgGfx = pe.__mgGfx; w.__mgUltra = pe.__mgUltra; window.updEnv = updEnv = w; P.ready = true; return true;
  }
  var iv = setInterval(function () { try { if (hook()) clearInterval(iv); } catch (e) { console.error('[MG_PERF hook]', e); clearInterval(iv); } }, 500);
})();
