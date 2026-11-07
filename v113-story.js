/* =====================================================================
   МГИАГ 1.13 — КАРКАС ПРОДОЛЖЕНИЯ ОСНОВНОГО СЮЖЕТА
   Новые дела («5 000 000 баллов Максима», «Тайна Дикси и Светофора») идут после финала основного
   сюжета и живут в том же сохранении: отдельных меню, режимов и слотов нет. Запускаются событиями
   в мире (вещи в квартире, разговор с Гусем, остановки, дверь Дикси) и отображаются в «Списке дел».
   Здесь — общие помощники: области, переходы, кинокамера, дыра, цели, прогресс в сохранении.
   ===================================================================== */
(function () {
  'use strict';
  var T = window.MG_STORY = { lvl: null, areas: {}, ticks: [], shot: null, items: [], hints: [], quests: {} };
  var PI = Math.PI;
  function rdy() { return typeof worldReady !== 'undefined' && worldReady && typeof setArea === 'function' && typeof addI === 'function' && window.MG_DIST && MG_DIST.Kit && typeof MAIN !== 'undefined' && typeof S !== 'undefined' && S; }
  var $$ = function (id) { return document.getElementById(id); };

  /* ---------------- прогресс в обычном сохранении ---------------- */
  T.P = function (id) { S.p13 = S.p13 || {}; return S.p13[id] = S.p13[id] || { stage: 0 }; };
  T.save = function () { try { saveGame(); } catch (e) { } };

  /* ---------------- реплики: новые говорящие ---------------- */
  function installWho() {
    if (typeof WHO === 'undefined') return;
    Object.assign(WHO, {
      cash: ['Кассир', '#ffd27a'], guard: ['Охранник', '#9ad0ff'], raisa: ['Раиса Павловна', '#ffb0d0'], man: ['Незнакомый мужчина', '#cfcfcf'],
      voice: ['📢 Объявление', '#ffe08a'], svet: ['Сотрудник Светофора', '#ff7a7a'], runner: ['Мужчина', '#d8d8d8'], promo: ['Промоутер', '#9aff9a'],
      clerk: ['Продавец Дикси', '#ffb347'], meat: ['Мясо', '#ff8a8a'], lbl: ['🏷️', '#ffffff'], baker: ['Пекарь', '#f0d8a8'], butcher: ['Мясник', '#ff9a9a']
    });
  }

  /* ---------------- области (отдельные помещения, как остальные интерьеры игры) ---------------- */
  var nextOx = 5000;
  T.makeArea = function (id, spanX) {
    var ox = nextOx; nextOx += (spanX || 200) + 100; var prev = BA;
    var K = MG_DIST.Kit(id, ox, 0); K.id = id; T.areas[id] = K; BA = prev || 'city'; return K;
  };
  T.build = function (id, fn) { var prev = BA; try { BA = id; camBlock[id] = camBlock[id] || []; fn(T.areas[id]); } catch (e) { console.error('[MG_STORY build]', id, e); throw e; } finally { BA = prev || 'city'; } };
  /* переход в любую область по мировым координатам */
  T.moveTo = async function (areaName, wx, wz, yaw, text) {
    await fade(1, 450, text || ''); try { dismount(player); } catch (e) { }
    setArea(areaName); placeA(player, wx, wz, yaw || 0); showComp(wx + 1.4, wz + .8); cam.yaw = yaw || 0; cam.pitch = .36; cam.force = null;
    await wait(250); await fade(0, 600);
  };
  T.go = function (areaId, lx, lz, yaw, text) { var K = T.areas[areaId]; return T.moveTo(areaId, K.ox + lx, K.oz + lz, yaw, text); };
  T.at = function (areaId, lx, lz) { var K = T.areas[areaId]; return { x: K.ox + lx, z: K.oz + lz }; };
  /* интерактивные точки с возможностью выключения (мировые координаты) */
  T.actW = function (areaName, wx, wz, label, fn, r, ok) {
    var o = { area: areaName, p: { x: wx, z: wz }, r: r || 2.4, label: label, off: false };
    o.ok = function () { return !o.off && (!ok || ok()); }; o.act = function () { if (!o.off) fn(o); }; addI(o); T.items.push(o); return o;
  };
  T.act = function (areaId, lx, lz, label, fn, r, ok) { var K = T.areas[areaId]; return T.actW(areaId, K.ox + lx, K.oz + lz, label, fn, r, ok); };
  T.near = function (areaId, lx, lz, r) { var K = T.areas[areaId]; return area === areaId && Math.hypot(player.pos.x - K.ox - lx, player.pos.z - K.oz - lz) < r; };
  T.nearW = function (areaName, wx, wz, r) { return area === areaName && Math.hypot(player.pos.x - wx, player.pos.z - wz) < r; };

  /* ---------------- цель на экране ---------------- */
  T.setObj = function (text, areaId, lx, lz) { if (!T.lvl) return; T.lvl.obj = text ? { t: text, p: (areaId ? T.at(areaId, lx, lz) : null) } : null; };
  T.begin = function (n) { T.lvl = { n: n, obj: null }; }; T.endLvl = function () { T.lvl = null; };

  /* ---------------- кинокамера ---------------- */
  var V = null;
  T.shotW = function (px, py, pz, lx, ly, lz, ms) {
    if (!V) V = { a: new THREE.Vector3(), b: new THREE.Vector3(), d: new THREE.Vector3(), o: new THREE.Vector3() };
    var s = T.shot || (T.shot = { p: new THREE.Vector3(), l: new THREE.Vector3(), k: 0, on: true, rate: 3 });
    s.p.set(px, py, pz); s.l.set(lx, ly, lz); s.on = true; s.rate = 1 / Math.max(.2, (ms || 800) / 1000); return wait(ms || 800);
  };
  T.shotTo = function (areaId, px, py, pz, lx, ly, lz, ms) { var K = T.areas[areaId] || { ox: 0, oz: 0 }; return T.shotW(K.ox + px, py, K.oz + pz, K.ox + lx, ly, K.oz + lz, ms); };
  T.shotOff = function (ms) { if (T.shot) { T.shot.on = false; T.shot.rate = 1 / Math.max(.2, (ms || 700) / 1000); } return wait(ms || 700); };
  function camHook() {
    if (typeof updCamera !== 'function' || updCamera.__mgS) return;
    var oc = updCamera;
    var w = function (dt) {
      oc(dt); var s = T.shot; if (!s) return;
      s.k += (s.on ? 1 : -1) * dt * s.rate * 1.2; s.k = Math.max(0, Math.min(1, s.k)); if (s.k <= 0 && !s.on) { T.shot = null; return; }
      var e = s.k * s.k * (3 - 2 * s.k);
      camera.getWorldDirection(V.o); V.a.copy(s.p).sub(camera.position); camera.position.addScaledVector(V.a, e);
      V.b.copy(s.l).sub(camera.position).normalize(); V.d.copy(V.o).lerp(V.b, e).normalize();
      camera.lookAt(camera.position.x + V.d.x, camera.position.y + V.d.y, camera.position.z + V.d.z);
    };
    w.__mgS = true; window.updCamera = updCamera = w;
  }

  /* ---------------- дыра ---------------- */
  T.hole = function (K, lx, lz, r, y) {
    var g = new THREE.Group(); g.position.set(K.ox + lx, y || 0, K.oz + lz); K.g.add(g);
    var core = new THREE.Mesh(new THREE.CircleGeometry(1, 40), new THREE.MeshBasicMaterial({ color: 0x000000 })); core.rotation.x = -PI / 2; core.position.y = .06; g.add(core);
    var ring = new THREE.Mesh(new THREE.RingGeometry(1, 1.28, 40), new THREE.MeshBasicMaterial({ color: 0x8a3aff, side: THREE.DoubleSide, transparent: true, opacity: .85 })); ring.rotation.x = -PI / 2; ring.position.y = .07; g.add(ring);
    var arms = []; for (var i = 0; i < 5; i++) { var a = new THREE.Mesh(new THREE.RingGeometry(.45 + i * .1, .5 + i * .1, 24, 1, i, 1.6), new THREE.MeshBasicMaterial({ color: i % 2 ? 0x3ae0ff : 0xb06cff, side: THREE.DoubleSide, transparent: true, opacity: .7 })); a.rotation.x = -PI / 2; a.position.y = .08; g.add(a); arms.push(a); }
    var h = { g: g, r: r, tr: r, K: K, x: lx, z: lz, spin: 1 };
    function apply() { core.scale.set(h.r, h.r, 1); ring.scale.set(h.r, h.r, 1); arms.forEach(function (a) { a.scale.set(h.r, h.r, 1); }); }
    h.set = function (v) { h.r = v; h.tr = v; apply(); }; h.grow = function (v) { h.tr = v; };
    K.anims.push(function (t) { h.r += (h.tr - h.r) * .03; apply(); arms.forEach(function (a, i) { a.rotation.z = t * (1.2 + i * .35) * h.spin * (i % 2 ? -1 : 1); }); ring.material.opacity = .6 + Math.sin(t * 3) * .25; });
    apply(); return h;
  };

  /* ---------------- конфетти ---------------- */
  T.fx = [];
  T.confetti = function (K, lx, ly, lz, n) { for (var i = 0; i < (n || 30); i++) { var sp = emojiSprite(['🎉', '🎊', '✨', '💰', '🎈'][i % 5], .5 + Math.random() * .4); sp.position.set(K.ox + lx, ly, K.oz + lz); K.g.add(sp); T.fx.push({ s: sp, K: K, vx: (Math.random() - .5) * 5, vy: 3 + Math.random() * 4, vz: (Math.random() - .5) * 5, t: 0, life: 2.5 + Math.random() }); } };
  function fxTick(dt) { for (var i = T.fx.length - 1; i >= 0; i--) { var f = T.fx[i]; f.t += dt; f.vy -= 9 * dt; f.s.position.x += f.vx * dt; f.s.position.y += f.vy * dt; f.s.position.z += f.vz * dt; if (f.t > f.life || f.s.position.y < 0) { f.K.g.remove(f.s); T.fx.splice(i, 1); } } }

  /* ---------------- установка в игру ---------------- */
  var hooked = false;
  function install() {
    if (hooked || !rdy()) return; hooked = true; installWho(); camHook();
    // «Список дел»: новые основные дела идут после финала основного сюжета
    if (!MAIN.some(function (m) { return m.id === 'points'; })) MAIN.push({ id: 'points', icon: '💳', title: '5 000 000 баллов Максима', who: 'Марья и Гусь · квартира Марьи → «Перекрёсток»' }, { id: 'svet', icon: '🥩', title: 'Тайна Дикси и Светофора', who: 'Марья и Гусь · Дикси' });
    // цель на экране: сначала активная сцена, затем подсказки новых дел, потом обычная цепочка
    var oo = objective; window.objective = objective = function () {
      if (T.lvl && T.lvl.obj) return T.lvl.obj;
      for (var i = 0; i < T.hints.length; i++) { var h; try { h = T.hints[i](); } catch (e) { h = null; } if (h) return h; }
      return oo();
    };
    var pe = updEnv; window.updEnv = updEnv = function (dt, t) { pe(dt, t); try { fxTick(dt); if (T.lvl || T.alwaysTick) T.ticks.forEach(function (f) { f(dt, t); }); } catch (e) { console.error('[MG_STORY tick]', e); } };
    var ps = setArea; window.setArea = setArea = function (a) { ps(a); for (var id in T.areas) T.areas[id].g.visible = (a === id); };
    console.log('[MG_STORY] продолжение сюжета подключено');
  }
  setInterval(install, 300);
})();
