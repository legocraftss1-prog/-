/* =====================================================================
   СЮЖЕТКА №14 — «ДЫРА В ЦЕНТРЕ ГОРОДА»  (после «Тайны Дикси и Светофора»)
   1) Дыра на главном перекрёстке. Марью и Гуся сталкивает в неё человек в чёрном плаще и уходит в зелёный портал.
   2) Тёмный мир внутри дыры: учёный снимает капюшон и уходит за Сияющим батоном. Выход — собрать 3 осколка портала.
   3) Хлебозавод «Батон»: два этажа, шесть Антонов-Батонов из разных миров, к каждому — свой подход, нужны оба героя.
   4) У выхода учёный отбирает батон; батон отбирают друг у друга, потом вчетвером с нашим Антоном.
   5) Антон выбрасывает батон в дыру. Дыра забирает часть города и героев.
   Часть основного сюжета: дело «baton14» в «Списке дел», прогресс — в обычном сохранении (S.p13.baton14).
   Этажи завода — отдельные секции одной области, между ними лестницы (как этажи мясокомбината).
   ===================================================================== */
(function () {
  'use strict';
  var T = window.MG_STORY, D = window.MG_DIST, PI = Math.PI;
  if (!T || !D) { console.error('[LEVEL14] нет каркаса'); return; }
  var ID = 'baton14', DARK = 'p14_dark', FAB = 'p14_fab', Z2 = 200;      // Z2 — сдвиг второго этажа по оси z
  var K = { dark: null, fab: null }, built = false, L = null;
  var W = { mode: 'follow', grace: 0, cold: 0, ghost: { at: 'A', move: 0, esc: 0, corner: false }, eyes: { ph: 'closed', t: 3.6 }, alarm: false, objT: 0, tug: null, busy: false, hemi: false, cityHole: null, cityK: null, endHole: null, robot: { i: 0 } };
  var N = {};                                                             // модели и объекты уровня
  function Q() { var q = T.P(ID); if (!q.sh) q.sh = [false, false, false]; if (!q.f) q.f = {}; return q; }
  function F() { return Q().f; }
  function avail() { return !!(S.q.svet && !S.q[ID]); }
  function coop() { return typeof COOP !== 'undefined' && COOP.on; }
  function isHero(h) { return coop() || player === h; }
  function need(h) { toast(h === gus ? '🪿 Тут справится только Гусь. Переключись на него (🔄).' : '👩 Тут справится только Марья. Переключись на неё (🔄).', 2800); sfx('bonk'); }
  function myArea() { return area === DARK || area === FAB; }
  function dist(a, x, z) { return Math.hypot(a.x - x, a.z - z); }
  function inR(p, x0, x1, z0, z1) { return p.x > x0 && p.x < x1 && p.z > z0 && p.z < z1; }
  function fx(lx) { return K.fab.ox + lx; } function fz(lz) { return K.fab.oz + lz; }
  function loc(p) { return { x: p.x - K.fab.ox, z: p.z - K.fab.oz }; }
  function anim(ms, fn) { return new Promise(function (res) { var t0 = performance.now(); (function f() { var u = Math.min(1, (performance.now() - t0) / ms); try { fn(u); } catch (e) { console.error('[LEVEL14 anim]', e); u = 1; } if (u < 1) requestAnimationFrame(f); else res(); })(); }); }
  function mixHex(a, b, k) { var ar = a >> 16 & 255, ag = a >> 8 & 255, ab = a & 255, br = b >> 16 & 255, bg = b >> 8 & 255, bb = b & 255; return (Math.round(ar + (br - ar) * k) << 16) | (Math.round(ag + (bg - ag) * k) << 8) | Math.round(ab + (bb - ab) * k); }

  /* ---------- Антон-Батон из другого мира: та же модель, другие материалы и размер ---------- */
  function antonVar(o) {
    o = o || {}; var g = makeAnton(), cache = {}, op = o.op === undefined ? 1 : o.op;
    g.traverse(function (m) {
      if (!m.isMesh || !m.material || (typeof shadowMat !== 'undefined' && m.material === shadowMat)) return;
      var hex = m.material.color && m.material.color.getHex ? m.material.color.getHex() : 0x8a5a32;
      var c = (hex === 0x111111 || hex === 0x000111) ? (o.eye === undefined ? hex : o.eye) : (o.tint === undefined ? hex : mixHex(hex, o.tint, o.k === undefined ? .7 : o.k));
      if (!cache[c]) cache[c] = new THREE.MeshLambertMaterial({ color: c, transparent: op < 1, opacity: op });
      m.material = cache[c];
    });
    g.scale.setScalar(o.s || 1.25); g.userData.s = o.s || 1.25; return g;
  }
  function putAnton(k, g, lx, lz, yaw, name, col) {
    g.position.set(k.ox + lx, 0, k.oz + lz); g.rotation.y = yaw || 0; k.g.add(g);
    if (name) { var lb = textSprite(name, .34, col || '#ffd9a8'); lb.position.set(k.ox + lx, (g.userData.s || 1.25) * .75 + .5, k.oz + lz); k.g.add(lb); g.userData.label = lb; }
    return g;
  }
  function moveAnton(g, wx, wz) { g.position.x = wx; g.position.z = wz; if (g.userData.label) { g.userData.label.position.x = wx; g.userData.label.position.z = wz; } }
  function mkPortal() {
    var p = new THREE.Mesh(new THREE.TorusGeometry(1.1, .18, 10, 32), new THREE.MeshBasicMaterial({ color: 0x9be82e }));
    var inn = new THREE.Mesh(new THREE.CircleGeometry(1, 24), new THREE.MeshBasicMaterial({ color: 0x0a2a10, side: THREE.DoubleSide })); p.add(inn); p.visible = false; return p;
  }
  function sciLook(hood) { return hood ? { top: 0x0c0c10, coatLong: true, pants: 0x0c0c10, faceless: true, hair: 0x0c0c10, skin: 0x15151a } : { top: 0x0c0c10, coatLong: true, pants: 0x1a1a1a, hairStyle: 'afro', hair: 0xd8d8d8, skin: 0xefc4a4 }; }
  function dress(a, hood) {
    try {
      if (hood) M_(a.P.head, G.sph, 0x0c0c10, [.4, .42, .42], [0, .06, -.03], null, false);
      else { M_(a.P.head, G.box, 0x111111, [.34, .12, .02], [0, .23, .16], null, false); for (var s = -1; s <= 1; s += 2) M_(a.P.head, G.sph, 0x9be82e, [.12, .12, .04], [s * .08, .23, .17], null, false); }
    } catch (e) { }
  }
  function cityActor(idn, name, hood) {
    var a = makeActor(idn, name, makePerson(sciLook(hood)), 'city'); dress(a, hood); cityG.add(a.g); a.area = 'city'; a.pose = 'walk'; a.hidden = true; a.g.visible = false; T.regNpc(a); return a;
  }

  /* ====================== ПОСТРОЙКА: ТЁМНЫЙ МИР ====================== */
  function wall(k, x0, z0, x1, z1, gaps, h, c) {
    h = h || 4.8; c = c || 0xe4d8bc; var horiz = Math.abs(z1 - z0) < .01, a = horiz ? Math.min(x0, x1) : Math.min(z0, z1), b = horiz ? Math.max(x0, x1) : Math.max(z0, z1), t = .6;
    var cuts = (gaps || []).slice().sort(function (p, q) { return p[0] - q[0]; }), cur = a;
    function seg(s, e) { if (e - s < .05) return; if (horiz) k.b(e - s, h, t, c, (s + e) / 2, 0, z0); else k.b(t, h, e - s, c, x0, 0, (s + e) / 2); }
    cuts.forEach(function (g) { var g0 = g[0] - g[1] / 2, g1 = g[0] + g[1] / 2; if (g0 > cur) seg(cur, g0); cur = g1; }); if (cur < b) seg(cur, b);
  }
  function floor(k, x0, x1, z0, z1, c, ceil) { k.plane(x1 - x0, z1 - z0, c, (x0 + x1) / 2, (z0 + z1) / 2, .01); if (ceil !== false) k.bp(x1 - x0, .3, z1 - z0, ceil || 0x2a2622, (x0 + x1) / 2, 4.8, (z0 + z1) / 2); }
  function buildDark(k) {
    k.plane(130, 130, 0x0b0a14, 0, 0, 0); k.perimeter(62, 7, 0x07060d);
    var R = D.rngf(1414), junk = ['🧾', '💳', '🧱', '🥩', '🚦', '🧦', '🔑', '📦', '🧾', '☂️', '🧤', '📱'];
    for (var i = 0; i < 46; i++) { var x = (R() - .5) * 112, z = (R() - .5) * 112; if (Math.hypot(x, z - 36) < 9 || Math.hypot(x, z + 40) < 7) continue; var sp = k.emoji(junk[i % junk.length], .6 + R() * .9, x, .6 + R() * 3.4, z); (N.junk = N.junk || []).push({ s: sp, y: sp.position.y, ph: R() * 6 }); }
    for (i = 0; i < 14; i++) { var px = (R() - .5) * 104, pz = (R() - .5) * 104; if (Math.hypot(px, pz - 36) < 10 || Math.abs(px) < 6 && Math.abs(pz + 10) < 8 || inR({ x: px, z: pz }, 22, 38, -3, 13) || Math.hypot(px, pz + 40) < 8 || Math.hypot(px + 30, pz - 10) < 5) continue; k.b(1.2 + R() * 2, 1 + R() * 4, 1.2 + R() * 2, 0x1a1826, px, 0, pz); }
    // рамка выхода
    k.b(.5, 4.2, .5, 0x2a2a3a, -1.9, 0, -40); k.b(.5, 4.2, .5, 0x2a2a3a, 1.9, 0, -40); k.bp(4.3, .5, .5, 0x2a2a3a, 0, 4.2, -40);
    N.exitP = mkPortal(); N.exitP.position.set(k.ox, 2.1, k.oz - 40); N.exitP.scale.setScalar(1.5); k.g.add(N.exitP);
    k.sign('ВЫХОДА НЕТ (пока)', 3.4, .5, 0, 4.9, -39.7, 0, '#14141c', '#9be82e', { fs: .34 });
    // осколок 1 — на виду; осколок 2 — в обломке стены Дикси (щель для Гуся); осколок 3 — на вершине кучи (достанет Марья)
    N.shards = [k.emoji('🟢', 1, -30, 1.3, 10), k.emoji('🟢', 1, 31.5, 1.3, 5), k.emoji('🟢', 1, 0, 4.1, -10)];
    k.b(8, 4, .6, 0xb8bcc0, 30, 0, 1); k.b(8, 4, .6, 0xb8bcc0, 30, 0, 9); k.b(.6, 4, 8.6, 0xb8bcc0, 34, 0, 5); k.b(.6, 4, 3.4, 0xb8bcc0, 26, 0, 2.4); k.b(.6, 4, 3.4, 0xb8bcc0, 26, 0, 7.6); k.b(.6, 2.6, 1.8, 0xb8bcc0, 26, 1.4, 5, { cam: false });
    k.sign('ДИКСИ', 3, .6, 30, 3.2, .65, PI, '#ff7a1a', '#ffffff', { fs: .4 }); k.m(G.box, 0x000000, [.1, 1.2, .5], [25.7, .6, 5]);
    k.b(4.4, 1.2, 4.4, 0x24202e, 0, 0, -10); k.b(3, 1.2, 3, 0x2c2838, 0, 1.2, -10, { cam: false }); k.b(1.6, 1.3, 1.6, 0x34304a, 0, 2.4, -10, { cam: false });
    k.emoji('📺', 1, -1.6, 1.7, -8.6); k.emoji('🛋️', 1.2, 1.4, 1.8, -11.4);
    // входной портал учёного и актёры сцены
    N.darkP = mkPortal(); N.darkP.position.set(k.ox, 1.5, k.oz + 31); k.g.add(N.darkP);
    N.cloakD = k.npc('p14_cloakD', 'Неизвестный', sciLook(true), 0, 31, 0); dress(N.cloakD, true); N.cloakD.hidden = true; N.cloakD.g.visible = false;
    N.sciD = k.npc('p14_sciD', 'Учёный', sciLook(false), 0, 31, 0); dress(N.sciD, false); N.sciD.hidden = true; N.sciD.g.visible = false;
    k.anims.push(function (t) { (N.junk || []).forEach(function (j) { j.s.position.y = j.y + Math.sin(t * .7 + j.ph) * .35; }); N.shards.forEach(function (s, i) { if (s.visible) s.material && (s.material.rotation = t * 1.5 + i); }); if (N.exitP.visible) N.exitP.rotation.z = t * .8; if (N.darkP.visible) N.darkP.rotation.z = -t * 1.4; });
  }

  /* ====================== ПОСТРОЙКА: ХЛЕБОЗАВОД (1 и 2 этаж) ====================== */
  var CREAM = 0xe9dcc0, TILE = 0xb9a88a, OFF = 0xcfd6dc, LINO = 0x8f9aa3, STEEL = 0x9aa0a8;
  function buildFab(k) {
    var i;
    /* ---- 1 этаж ---- */
    floor(k, -10, 10, 20, 36, TILE); wall(k, -10, 36, 10, 36); wall(k, -10, 20, -10, 36); wall(k, 10, 20, 10, 36); wall(k, -10, 20, 10, 20, [[0, 6]]);
    floor(k, -3, 3, 9, 20, TILE); wall(k, -3, 9, -3, 20); wall(k, 3, 9, 3, 20);
    floor(k, -30, 30, 4, 9, TILE); wall(k, -30, 9, 30, 9, [[0, 6]]); wall(k, -30, 4, 30, 4, [[0, 3.4]]);
    floor(k, -14, 14, -26, 4, 0x8a6a4a); wall(k, -14, -26, 14, -26); wall(k, -14, -26, -14, 4); wall(k, 14, -26, 14, 4);
    floor(k, -46, -30, -4, 17, 0x9a8f7a); wall(k, -46, -4, -30, -4); wall(k, -46, 17, -30, 17); wall(k, -46, -4, -46, 17); wall(k, -30, -4, -30, 17, [[6.5, 5]]);
    floor(k, 30, 62, -12, 20, TILE); wall(k, 30, -12, 62, -12); wall(k, 30, 20, 62, 20); wall(k, 62, -12, 62, 20); wall(k, 30, -12, 30, 20, [[6.5, 5]]);
    wall(k, 46, -3, 62, -3, [[52, 2.6]], 4.8, 0xc8dcea); wall(k, 46, -12, 46, -3, null, 4.8, 0xc8dcea); k.plane(16, 9, 0xd8ecf8, 54, -7.5, .02);
    // проходная
    k.sign('ХЛЕБОЗАВОД «БАТОН» · ПРОХОДНАЯ', 9, .7, 0, 3.6, 35.6, PI, '#d9a35a', '#ffffff', { fs: .4 }); k.b(3.4, 1.1, 1.2, 0x8a5a34, 6, 0, 30); k.emoji('🥖', .8, 6, 1.6, 30);
    k.m(G.box, 0x5a3b2a, [2.4, 3.2, .2], [0, 1.6, 35.65]);
    for (i = 0; i < 4; i++) k.bp(2.2, .3 + i * .3, .9, 0x8a8478, -8, 0, 21.2 + i * .9);
    k.sign('ЛЕСТНИЦА А ↑ 2 ЭТАЖ', 3, .45, -8.4, 3.2, 20.4, 0, '#2a3a4a', '#ffffff', { fs: .3 });
    // печной зал: постамент, батон, кольцо Антонов из разных миров
    k.b(1.3, 1, 1.3, 0x5a4a3a, 0, 0, -18, { cam: false }); N.batonM = k.m(G.box, new THREE.MeshBasicMaterial({ color: 0xffe28a }), [.8, .24, .24], [0, 1.25, -18]); N.batonGlow = k.emoji('✨', 1.3, 0, 1.9, -18);
    N.crowd = []; var tints = [0xffffff, 0x4a7aff, 0xff7ab0, 0x3ac86a, 0xffd23f, 0x9a5ae8, 0x2a2a2a, 0xff8a3a], hats = ['🎩', '👑', '🧢', '🎓', '⛑️', '🪖', '👒', '🎀'];
    for (i = 0; i < 8; i++) { var a = i / 8 * PI * 2, cx = Math.cos(a) * 4.2, cz = -18 + Math.sin(a) * 4.2; var g = putAnton(k, antonVar({ tint: tints[i], k: .65, s: 1.1 + (i % 3) * .2 }), cx, cz, Math.atan2(-cx, -18 - cz)); var hat = k.emoji(hats[i], .45, cx, 1.2 + (i % 3) * .14, cz); var st = k.emoji('💤', .5, cx, 1.9 + (i % 3) * .14, cz); N.crowd.push({ g: g, hat: hat, st: st, hx: cx, hz: cz }); }
    N.eyeSign = k.emoji('💤', 2.2, 0, 3.6, -18);
    k.sign('ПЕЧЬ №0 · НЕ БУДИТЬ', 5, .6, 0, 3.7, -25.6, 0, '#3a2a1a', '#ffe28a', { fs: .36 });
    for (i = 0; i < 4; i++) { k.b(2.6, 3, 2.2, 0x6a4a3a, i < 2 ? -11.5 : 11.5, 0, i % 2 ? -8 : -21); }
    // Антон-Великан спит на перекрёстке коридоров
    N.giant = putAnton(k, antonVar({ s: 8.6 }), 0, 6.5, PI / 2, 'Антон-Великан', '#ffcf9a'); N.giant.userData.label.position.y = 4.4; N.giantZ = k.emoji('💤', 1.6, 2.2, 3.6, 6.5);
    N.giantCol = k.col(-3.3, 3.3, 3.7, 9.3, 5);
    // подвесной конвейер вдоль коридора (не мешает ходить)
    k.bp(66, .12, .7, 0x4a4e56, 0, 3.4, 4.7); for (i = -32; i <= 32; i += 8) k.bp(.12, 1.3, .12, 0x4a4e56, i, 3.5, 4.7);
    N.loaf = k.emoji('🥖', .9, 34, 3.8, 4.7); N.loaf.visible = false;
    // склад (сюда уйдёт Великан)
    for (i = 0; i < 5; i++) k.b(2.2, 1.6 + (i % 2), 2.2, 0xc49a5a, -44 + (i % 2) * 2.4, 0, -2 + i * 3.6);
    k.sign('СКЛАД ГОТОВОЙ ПРОДУКЦИИ', 5, .5, -30.4, 3.4, 12.6, PI / 2, '#3a2a1a', '#ffffff', { fs: .3 });
    // пекарный цех: тестомес, Обжора, морозилка, лестница Б
    k.b(3, 2.4, 3, STEEL, 40, 0, -5.5); k.m(G.cyl, 0x6a7078, [2, 1.2, 2], [40, 3, -5.5]); k.sign('ТЕСТОМЕС', 2.6, .45, 40, 1.9, -3.95, 0, '#2a3a4a', '#ffffff', { fs: .32 });
    N.mixLamp = k.m(G.sph, new THREE.MeshBasicMaterial({ color: 0x551111 }), [.4, .4, .4], [41.9, 2.7, -4]);
    N.glut = putAnton(k, antonVar({ tint: 0xf0b070, k: .5, s: 2.3 }), 35, 1.5, PI / 2, 'Антон-Обжора', '#ffb36a'); N.glut.scale.set(3.1, 2.3, 2.6); N.glutE = k.emoji('🍞', .6, 35, 2.5, 1.5); k.colC(35, 1.5, 1.1, 2);
    for (i = 0; i < 4; i++) k.bp(2.2, .3 + i * .3, .9, 0x8a8478, 59.4, 0, 18.6 - i * .9);
    k.sign('ЛЕСТНИЦА Б ↑ 2 ЭТАЖ', 3, .45, 58, 3.2, 19.6, PI, '#2a3a4a', '#ffffff', { fs: .3 });
    k.sign('МОРОЗИЛЬНАЯ КАМЕРА −30°', 4.4, .5, 55, 3.6, -2.6, 0, '#1f4f8a', '#ffffff', { fs: .32 });
    k.m(G.box, 0x6a7078, [.2, .9, 1.2], [45.6, 1, -8]); k.m(G.box, 0x111111, [.1, .6, .8], [45.5, 1, -8]);                 // воздуховод (для Гуся)
    N.thermo = k.m(G.box, new THREE.MeshBasicMaterial({ color: 0x3aa0ff }), [.6, .6, .12], [48.5, 2.5, -2.62]);                  // термостат (высоко — Марья)
    N.ice = k.m(G.box, new THREE.MeshLambertMaterial({ color: 0xbfe6ff, transparent: true, opacity: .55 }), [2.2, 2.2, 2.2], [58.5, 1.1, -9.5]);
    N.iceA = putAnton(k, antonVar({ tint: 0x9ad4ff, k: .75, s: 1.5 }), 58.5, -9.5, -PI / 2, 'Антон-Ледяной', '#bfe6ff'); N.iceCol = k.colC(58.5, -9.5, 1.3, 3);
    N.starter = k.emoji('🧈', .8, 56.6, .7, -8.6); N.starter.visible = false;
    for (i = 0; i < 3; i++) k.b(1.6, 2.2, 1.2, 0xe8f2f8, 48 + i * 2.2, 0, -11);
    /* ---- 2 этаж ---- */
    var z = Z2;
    floor(k, -12, 62, z + 16, z + 24, LINO); wall(k, -12, z + 24, 62, z + 24, null, 4.8, OFF); wall(k, -12, z + 16, -12, z + 24, null, 4.8, OFF); wall(k, 62, z + 16, 62, z + 24, null, 4.8, OFF);
    wall(k, -12, z + 16, 62, z + 16, [[-5, 2.6], [9, 2.6], [28, 2.6], [45, 3]], 4.8, OFF);
    floor(k, -12, 16, z + 2, z + 16, LINO); wall(k, -12, z + 2, 16, z + 2, null, 4.8, OFF); wall(k, -12, z + 2, -12, z + 16, null, 4.8, OFF); wall(k, 16, z + 2, 16, z + 16, null, 4.8, OFF); wall(k, 2, z + 2, 2, z + 16, null, 4.8, 0xdfe6ec);
    floor(k, 20, 36, z + 2, z + 16, 0x6a7480); wall(k, 20, z + 2, 36, z + 2, null, 4.8, OFF); wall(k, 20, z + 2, 20, z + 16, null, 4.8, OFF); wall(k, 36, z + 2, 36, z + 16, null, 4.8, OFF);
    floor(k, 40, 60, z - 8, z + 16, 0xa8b4c0); wall(k, 40, z - 8, 60, z - 8, null, 4.8, OFF); wall(k, 40, z - 8, 40, z + 16, null, 4.8, OFF); wall(k, 60, z - 8, 60, z + 16, null, 4.8, OFF);
    for (i = 0; i < 4; i++) k.bp(2.2, .3 + i * .3, .9, 0x8a8478, -10.6, 0, z + 17 + i * .9);
    k.sign('ЛЕСТНИЦА А ↓', 2.2, .45, -11.6, 3.2, z + 20, PI / 2, '#2a3a4a', '#ffffff', { fs: .3 }); k.sign('ЛЕСТНИЦА Б ↓', 2.2, .45, 61.6, 3.2, z + 20, -PI / 2, '#2a3a4a', '#ffffff', { fs: .3 });
    for (i = 0; i < 4; i++) k.bp(2.2, .3 + i * .3, .9, 0x8a8478, 60.6, 0, z + 17 + i * .9);
    k.sign('ЛАБОРАТОРИЯ А', 3, .45, -5, 3.3, z + 16.35, 0, '#2a3a4a', '#ffffff', { fs: .3 }); k.sign('ЛАБОРАТОРИЯ Б', 3, .45, 9, 3.3, z + 16.35, 0, '#2a3a4a', '#ffffff', { fs: .3 });
    k.sign('ПУЛЬТОВАЯ · ПО ПРОПУСКАМ', 4, .45, 28, 3.3, z + 16.35, 0, '#8a1f1f', '#ffffff', { fs: .3 }); k.sign('УПАКОВКА · ЗЕРКАЛЬНЫЙ ЗАЛ', 4, .45, 45, 3.3, z + 16.35, 0, '#2a3a4a', '#ffffff', { fs: .3 });
    // лаборатории: столы, вентиляция между ними, полка с резиновым батоном
    k.b(4, 1, 1.4, 0xf2f2f2, -8, 0, z + 5); k.b(4, 1, 1.4, 0xf2f2f2, 6, 0, z + 11.5); k.emoji('🧪', .7, -8, 1.5, z + 5); k.emoji('🔬', .7, 6, 1.5, z + 11.5);
    k.m(G.box, 0x111111, [.1, .6, .9], [1.65, .4, z + 13.5]); k.m(G.box, 0x111111, [.1, .6, .9], [2.35, .4, z + 13.5]);
    k.b(.9, 2.8, 3, 0x8a8f96, 15.2, 0, z + 5); N.rubber = k.emoji('🥖', .8, 15, 3.1, z + 5); k.sign('ОБРАЗЦЫ: БАТОН РЕЗИНОВЫЙ, НЕСЪЕДОБНЫЙ', 3, .3, 15.65, 2.2, z + 5, -PI / 2, '#ffffff', '#1d2129', { fs: .2 });
    N.ghost = putAnton(k, antonVar({ tint: 0xcfe8ff, k: .85, op: .45, s: 1.4 }), -5, z + 8, 0, 'Антон-Призрак', '#cfe8ff'); N.ghostSpot = { A: [-5, z + 8], B: [9, z + 8] }; N.ghostKey = k.emoji('🪪', .5, -5, 1.6, z + 8);
    // пультовая: дверь по пропуску, Робо-Антон, вилка у пола (Гусь), рубильник высоко (Марья)
    N.ctlDoor = k.m(G.box, 0x7a1f1f, [2.6, 3.4, .25], [28, 1.7, z + 16]); N.ctlCol = k.col(26.7, 29.3, z + 15.6, z + 16.4, 5);
    k.b(6, 1.3, 1.2, 0x3a4048, 28, 0, z + 2.9); for (i = 0; i < 5; i++) k.m(G.box, new THREE.MeshBasicMaterial({ color: [0x2fae5b, 0xf2c230, 0xe8473b, 0x3aa0ff, 0x2fae5b][i] }), [.3, .12, .3], [25.8 + i * 1.1, 1.4, z + 2.9]);
    N.robot = putAnton(k, antonVar({ tint: 0x8f98a4, k: .9, eye: 0xff2a2a, s: 2.2 }), 23, z + 5, PI / 2, 'Робо-Антон', '#c8d0d8'); N.robotEye = k.emoji('🔴', .5, 23, 2.6, z + 5);
    N.robotWP = [[23, z + 5.6], [33, z + 5.6], [33, z + 13], [23, z + 13]];
    N.plug = k.m(G.box, 0xf2c230, [.3, .3, .3], [35.4, .3, z + 3.4]); k.m(G.box, 0x111111, [.12, .4, .5], [35.65, .35, z + 3.4]);
    N.lever = k.m(G.box, 0xe8473b, [.2, .9, .2], [20.5, 2.7, z + 9]); k.m(G.box, 0x3a4048, [.25, 1.6, 1], [20.45, 2.5, z + 9]); k.sign('ЛИНИЯ 1', 1.4, .35, 20.36, 3.6, z + 9, PI / 2, '#f2c230', '#1d2129', { fs: .26 });
    // зеркальный зал: стекло по линии x=50, ящик на «нужном месте», плита на стороне Антона, клетка с мукой
    k.m(G.box, new THREE.MeshLambertMaterial({ color: 0xbfe0f0, transparent: true, opacity: .35 }), [.2, 3.2, 24], [50, 1.6, z + 4]); k.col(49.8, 50.2, z - 8, z + 16, 5);
    N.plate = k.m(G.box, new THREE.MeshBasicMaterial({ color: 0x8a1f1f }), [1.8, .08, 1.8], [54, .05, z + 6]); N.spot = k.m(G.box, new THREE.MeshBasicMaterial({ color: 0x555a62 }), [1.8, .06, 1.8], [46, .04, z + 6]);
    N.crate = k.m(G.box, 0xc49a5a, [2, 1.7, 2], [46, .85, z + 6]); N.crateCol = k.col(45, 47, z + 5, z + 7, 3); N.crateCol2 = k.col(41, 43, z + 12, z + 14, 3); N.crateCol2.on = false;
    wall(k, 40, z - 3, 44, z - 3, null, 3.2, 0x6a7078); N.gate = k.m(G.box, 0x6a7078, [.25, 3.2, 5], [44, 1.6, z - 5.5]); N.gateCol = k.col(43.8, 44.2, z - 8, z - 3, 5);
    N.flour = k.emoji('🌾', 1, 41.6, 1, z - 6); k.m(G.box, 0xf4f0e4, [1.2, .7, .9], [41.6, .35, z - 6]);
    N.mirror = putAnton(k, antonVar({ tint: 0xdfe6ee, k: .9, s: 1.6 }), 56, z + 10, -PI / 2, 'Антон-Зеркальный', '#e6eef6'); N.mirrorP = { x: 56, z: z + 10 };
    k.anims.push(fabAnim);
  }
  function fabAnim(t) {
    var f = F();
    if (N.batonGlow.visible) { N.batonGlow.position.y = 1.9 + Math.sin(t * 3) * .12; }
    if (N.giantZ.visible) N.giantZ.position.y = 3.6 + Math.sin(t * 1.4) * .25;
    N.giant.scale.y = 8.6 * (1 + Math.sin(t * 1.2) * .03);
    if (!f.thaw) N.iceA.rotation.z = Math.sin(t * 22) * .02;
    if (!f.pass) { N.ghost.position.y = .25 + Math.sin(t * 2.2) * .15; if (W.ghost.corner) N.ghost.rotation.z = Math.sin(t * 40) * .08; else N.ghost.rotation.z = 0; }
    N.crowd.forEach(function (c, i) { c.g.scale.y = c.g.userData.s * (1 + Math.sin(t * 1.5 + i) * .03); });
    N.glut.rotation.z = Math.sin(t * 3) * .03;
  }

  /* ====================== СОСТОЯНИЕ ПО ФЛАГАМ (после входа или загрузки) ====================== */
  function applyState() {
    var f = F(), k = K.fab, z = Z2;
    N.ghost.visible = !f.pass; N.ghostKey.visible = !f.pass; if (N.ghost.userData.label) N.ghost.userData.label.visible = !f.pass;
    W.ghost = { at: 'A', move: 0, esc: 0, corner: false }; moveAnton(N.ghost, k.ox - 5, k.oz + z + 8); N.ghostKey.position.set(k.ox - 5, 1.6, k.oz + z + 8);
    N.rubber.visible = !f.rubber;
    N.ctlDoor.visible = !f.door; N.ctlCol.on = !f.door;
    N.robotEye.visible = !f.robot; N.plug.visible = !f.robot; W.robot = { i: 0 }; moveAnton(N.robot, k.ox + 23, k.oz + z + 5.6);
    N.lever.rotation.x = f.power ? PI : 0; N.mixLamp.material.color.setHex(f.power ? 0x2fae5b : 0x551111);
    N.crate.position.set(k.ox + (f.crate ? 42 : 46), .85, k.oz + z + (f.crate ? 13 : 6)); N.crateCol.on = !f.crate; N.crateCol2.on = !!f.crate;
    N.flour.visible = !f.flour; gate(!!f.flour);
    moveAnton(N.mirror, k.ox + 56, k.oz + z + 10); N.mirrorP = { x: 56, z: z + 10 };
    N.ice.visible = !f.thaw; N.iceCol.on = !f.thaw; moveAnton(N.iceA, k.ox + (f.thaw ? 50 : 58.5), k.oz + (f.thaw ? -11 : -9.5)); N.thermo.material.color.setHex(f.thaw ? 0xff8a3a : 0x3aa0ff);
    N.starter.visible = !!f.thaw && !f.starter;
    N.glutE.visible = !f.fed;
    giantPlace(!!f.giant);
    N.batonM.visible = !f.got; N.batonGlow.visible = !f.got;
    N.crowd.forEach(function (c) { c.g.position.set(k.ox + c.hx, 0, k.oz + c.hz); c.hat.position.x = k.ox + c.hx; c.hat.position.z = k.oz + c.hz; c.st.position.x = k.ox + c.hx; c.st.position.z = k.oz + c.hz; });
    W.eyes = { ph: 'closed', t: 3.6 }; W.alarm = false; W.cold = 0; W.grace = 0; N.loaf.visible = false; carry(!!f.got);
  }
  function gate(open) { N.gateCol.on = !open; N.gate.position.y = open ? -1.4 : 1.6; }
  function giantPlace(moved) {
    var k = K.fab; N.giantCol.on = !moved; N.giantZ.visible = true;
    if (moved) { moveAnton(N.giant, k.ox - 38, k.oz + 6.5); N.giantZ.position.set(k.ox - 36, 3.6, k.oz + 6.5); N.giant.rotation.y = -PI / 2; }
    else { moveAnton(N.giant, k.ox, k.oz + 6.5); N.giantZ.position.set(k.ox + 2.2, 3.6, k.oz + 6.5); N.giant.rotation.y = PI / 2; }
  }
  /* батон «в руках»: светящийся брусок над тем, кто его держит */
  function carry(on) {
    if (!N.carryM) { N.carryM = new THREE.Mesh(G.box, new THREE.MeshBasicMaterial({ color: 0xffe28a })); N.carryM.scale.set(.7, .22, .22); N.carryM.visible = false; scene.add(N.carryM); }
    W.carry = !!on; if (!on) N.carryM.visible = false;
  }

  /* ====================== ОБЩЕЕ: напарник, режим «вместе / жди», переключение героя ====================== */
  var chip = null;
  function chipUI() {
    if (chip) return; chip = document.createElement('button'); chip.id = 'p14mode';
    chip.style.cssText = 'position:fixed;left:50%;top:calc(env(safe-area-inset-top,0px) + 104px);transform:translateX(-50%);z-index:6;display:none;padding:7px 14px;border-radius:14px;border:2px solid #fff;background:rgba(20,26,38,.86);color:#fff;font:800 13px Rubik,Arial,sans-serif;box-shadow:0 3px 0 rgba(0,0,0,.35)';
    chip.onclick = function (e) { e.preventDefault(); toggleMode(); }; document.body.appendChild(chip);
    addEventListener('keydown', function (e) { if (e.code === 'KeyV' && chipOn() && !(e.target && /INPUT|TEXTAREA/.test(e.target.tagName))) toggleMode(); });
  }
  function chipOn() { return !!L && myArea() && !blocked() && !coop(); }
  function toggleMode() { W.mode = W.mode === 'follow' ? 'wait' : 'follow'; sfx('click'); toast(W.mode === 'follow' ? '🤝 ' + comp.name + ' идёт за тобой.' : '✋ ' + comp.name + ' ждёт здесь.', 1600); chipPaint(); }
  function chipPaint() { if (!chip) return; var on = chipOn(); chip.style.display = on ? 'block' : 'none'; if (on) chip.textContent = W.mode === 'follow' ? '🤝 Вместе · нажми, чтобы напарник ждал (V)' : '✋ Напарник ждёт · нажми, чтобы позвать (V)'; }
  function inHall(p) { var l = loc(p); return inR(l, -14, 14, -26, 3.7); }
  function compTick(dt) {
    var c = comp; if (coop()) return; c.hidden = false; c.g.visible = true;
    if (c.target) { updActor(c, dt); return; }
    var moved = false;
    if (W.mode === 'follow' && !blocked()) {
      var bx = player.pos.x - Math.sin(player.yaw) * 1.7 + Math.cos(player.yaw) * .8, bz = player.pos.z - Math.cos(player.yaw) * 1.7 - Math.sin(player.yaw) * .8;
      var d = Math.hypot(bx - c.pos.x, bz - c.pos.z), hall = area === FAB && inHall({ x: bx, z: bz }) && !F().got;
      if (d > 1.15 && d < 11 && !hall) { var s = Math.min(d, dt * (d > 4 ? 6.6 : 4.4)); c.pos.x += (bx - c.pos.x) / d * s; c.pos.z += (bz - c.pos.z) / d * s; collide(c.pos, .35); c.yaw = angLerp(c.yaw, Math.atan2(bx - c.pos.x, bz - c.pos.z), Math.min(1, dt * 8)); moved = true; }
    }
    c.moving = moved; c.pos.y = H(c.pos.x, c.pos.z); c.g.position.copy(c.pos); c.g.rotation.y = c.yaw; poseActor(c, dt);
  }
  /* перенос активного героя; напарник идёт следом, только если он рядом и в режиме «вместе» */
  async function hop(wx, wz, yaw, text, solo) {
    await cutscene(async function () {
      var near = !solo && W.mode === 'follow' && Math.hypot(comp.pos.x - player.pos.x, comp.pos.z - player.pos.z) < 9;
      await fade(1, 260, text || ''); placeA(player, wx, wz, yaw || 0); if (near) placeA(comp, wx + 1.2, wz + .7, yaw || 0); cam.yaw = yaw || 0; await wait(160); await fade(0, 320);
    });
  }

  /* ====================== 1) ГОРОД: ДЫРА НА ПЕРЕКРЁСТКЕ И ТОЛЧОК ====================== */
  function cityInstall() {
    W.cityK = { g: cityG, ox: 0, oz: 0, anims: [] };
    W.cityHole = T.hole(W.cityK, 0, 0, 2.6, .1); W.cityHole.g.visible = false;
    N.cityP = mkPortal(); N.cityP.position.set(9, 1.5, 3); N.cityP.rotation.y = PI / 2; cityG.add(N.cityP);
    N.cloak = cityActor('p14_cloak', 'Неизвестный', true); N.sci = cityActor('p14_sci', 'Учёный', false); N.sci.collide = true;
    T.actW('city', 4.3, 4.3, '🕳️ Подойти к дыре', function () { pushScene(); }, 3.2, function () { return avail() && Q().stage === 0; });
    T.actW('city', 4.3, 4.3, '🕳️ Прыгнуть обратно в дыру', function () { enterDark(false); }, 3.2, function () { return avail() && Q().stage === 1; });
    // хлебозавод: дверь проходной
    var bx = BREADF.x + 16, bz = BREADF.z + 6.3, by = H(bx, bz);
    try { box(cityG, 2.4, 3.2, .3, 0x5a3b2a, bx, by, bz - .25); sign(cityG, 'ПРОХОДНАЯ', 3, .5, bx, by + 3.7, bz - .2, 0, '#3a2a1a', '#ffffff', { fs: .34 }); } catch (e) { console.error('[LEVEL14 door]', e); }
    W.door = { x: bx, z: bz + 1.3 };
    T.actW('city', W.door.x, W.door.z, '🚪 Войти на хлебозавод', function () { enterFab(true); }, 2.6, function () { var s = Q().stage; return avail() && (s === 2 || s === 3); });
    T.actW('city', W.door.x, W.door.z, '🥖 Вернуться к батону', function () { startTug(); }, 2.6, function () { return avail() && Q().stage === 4 && !W.tug; });
    N.antonC = makeAnton(); N.antonC.visible = false; cityG.add(N.antonC);
    W.arena = { x: BREADF.x + 10, z: BREADF.z + 32 };
    W.endK = { g: cityG, ox: 0, oz: 0, anims: [] }; W.endHole = T.hole(W.endK, W.arena.x, W.arena.z + 9, .2, H(W.arena.x, W.arena.z + 9) + .12); W.endHole.g.visible = false;
    // табличка «Антон охраняет батон» у завода не должна спорить с новым делом
    try { var old = inters.filter(function (o) { return o.label === '🐇 Антон-Батон'; })[0]; if (old) { var op = old.p; old.p = function () { return (S.q.svet) ? null : (typeof op === 'function' ? op() : op); }; } } catch (e) { }
  }
  async function pushScene() {
    var q = Q(); if (q.stage !== 0 || W.busy) return; W.busy = true;
    try {
      await cutscene(async function () {
        try { dismount(player); } catch (e) { }
        cam.fixed = { pos: new THREE.Vector3(10.5, 6, 10.5), look: new THREE.Vector3(.5, .8, .5) };
        T.walk(comp, 2.7, 1.5, 3); await T.walk(player, 1.7, 2.6, 3);
        player.yaw = Math.atan2(-1.7, -2.6); comp.yaw = Math.atan2(-2.7, -1.5);
        await say([['gus', 'Она вернулась. И выбрала самый центр города.'], ['marya', 'Гусь. Не наклоняйся.'], ['gus', 'Я только посмотрю. Одним глазом. Второй останется снаружи.'], ['marya', 'Там внизу… что-то светится. Зелёным.'], ['gus', 'Где? Дай я тоже…']]);
        N.cloak.hidden = false; N.cloak.g.visible = true; placeA(N.cloak, 9, 8, Math.atan2(-7, -5.5));
        await T.walk(N.cloak, 3.3, 3.1, 6.5); sfx('bonk');
        await say([['sys', 'Толчок в спину. Обоим сразу.']]);
        var p0 = { x: player.pos.x, z: player.pos.z }, c0 = { x: comp.pos.x, z: comp.pos.z }; sfx('whoosh');
        await anim(1100, function (u) {
          var e = u * u, s = Math.max(.04, 1 - e);
          player.ovr = { x: p0.x * (1 - e), y: Math.sin(u * PI) * .8 - e * .6, z: p0.z * (1 - e) }; player.g.scale.setScalar(s); player.yaw += .25;
          comp.pos.x = c0.x * (1 - e); comp.pos.z = c0.z * (1 - e); comp.g.scale.setScalar(s); comp.yaw += .3;
        });
        player.g.visible = false; comp.g.visible = false; comp.hidden = true;
        await wait(700);
        // камера остаётся на месте: виден тот, кто толкнул
        N.cloak.yaw = Math.atan2(5.7, -.1); await wait(500);
        N.cityP.visible = true; N.cityP.scale.setScalar(.05); sfx('whoosh'); await anim(500, function (u) { N.cityP.scale.setScalar(.05 + u * .95); });
        await say([['sys', 'Человек в чёрном плаще даже не заглянул вниз. Рядом с ним открывается зелёный портал.']]);
        await T.walk(N.cloak, 8.6, 3, 3.2); N.cloak.hidden = true; N.cloak.g.visible = false;
        await anim(400, function (u) { N.cityP.scale.setScalar(Math.max(.02, 1 - u)); }); N.cityP.visible = false; await wait(500);
        await fade(1, 700, '🕳️ …');
        player.ovr = null; player.g.scale.setScalar(1); comp.g.scale.setScalar(1); player.g.visible = true; comp.g.visible = true; comp.hidden = false; cam.fixed = null;
        q.stage = 1; T.save();
      });
      await enterDark(true);
    } finally { W.busy = false; cam.fixed = null; if (player.ovr) player.ovr = null; }
  }

  /* ====================== 2) ТЁМНЫЙ МИР ====================== */
  function buildAll() {
    if (built) return; built = true;
    K.dark = T.makeArea(DARK, 160); T.build(DARK, buildDark);
    K.fab = T.makeArea(FAB, 200); T.build(FAB, buildFab);
    wireDark(); wireFab(); chipUI();
  }
  function darkState() {
    var q = Q(); N.shards.forEach(function (s, i) { s.visible = !q.sh[i]; });
    var n = q.sh.filter(Boolean).length; N.exitP.visible = !!q.portal;
    if (n < 3) { var i = q.sh.indexOf(false), P = [[-30, 10], [25, 5], [0, -7.4]][i]; T.setObj('🟢 Собрать осколки портала: ' + n + '/3. ' + ['Один лежит на виду.', 'Один — в обломке стены Дикси: в щель пролезет только Гусь.', 'Один — на вершине кучи: дотянется только Марья.'][i], DARK, P[0], P[1]); }
    else T.setObj('🌀 Вставить осколки в рамку и выйти.', DARK, 0, -37.6);
  }
  async function enterDark(first) {
    var q = Q(); if (q.stage !== 1) return; var own = !W.busy; W.busy = true;
    try {
      T.begin(14); L = T.lvl; buildAll(); W.mode = 'follow';
      if (!first) await cutscene(async function () { await say([['gus', 'Прыгать туда самому. Второй раз. Запиши это в мои достижения.']]); });
      await T.go(DARK, 0, 40, PI, first ? '🕳️ Вы падаете. Долго. Потом не падаете.' : '🕳️ Снова вниз.');
      if (!q.met) await sciScene();
      darkState();
    } finally { if (own) W.busy = false; }
  }
  async function sciScene() {
    var q = Q(), k = K.dark;
    await cutscene(async function () {
      placeA(player, k.ox - .7, k.oz + 40, PI); placeA(comp, k.ox + .9, k.oz + 40.3, PI);
      await T.shotTo(DARK, 4.2, 2.4, 43.5, 0, 1.4, 33.5, 900);
      await say([['marya', 'Гусь… ты цел?'], ['gus', 'Настолько, насколько цел гусь, упавший в дыру. Нас толкнули.'], ['marya', 'Я знаю. Я тоже летела.']]);
      N.darkP.visible = true; N.darkP.scale.setScalar(.05); sfx('whoosh'); await anim(600, function (u) { N.darkP.scale.setScalar(.05 + u * .95); });
      N.cloakD.hidden = false; N.cloakD.g.visible = true; placeA(N.cloakD, k.ox, k.oz + 31.4, 0);
      await T.walk(N.cloakD, k.ox, k.oz + 35, 2.2);
      await say([['sys', 'Из зелёного портала выходит человек в чёрном плаще. Он медленно снимает капюшон.']]);
      sfx('poof'); N.cloakD.hidden = true; N.cloakD.g.visible = false; N.sciD.hidden = false; N.sciD.g.visible = true; placeA(N.sciD, k.ox, k.oz + 35, 0);
      await wait(500);
      await say([['gus', 'ТЫ!'], ['marya', 'Учёный. Тот самый, которому был нужен Сияющий батон.'],
        ['sci', 'Нужен. До сих пор. Я узнал, что батон не у вас.'], ['sci', 'Но я знаю, что вы знаете, где он.'], ['gus', 'Мы ничего не скажем!'],
        ['sci', 'И не надо. У меня есть догадки, где он может быть…'], ['sci', 'Ну а теперь, пока вы здесь, мне ничто не помешает его украсть.'],
        ['marya', '«Здесь» — это где?'], ['sci', 'Внутри дыры. Сюда падает всё, что город потерял. Чеки. Карты. Теперь — вы. Всего доброго.']]);
      N.sciD.yaw = PI; await T.walk(N.sciD, k.ox, k.oz + 31.4, 2.6); N.sciD.hidden = true; N.sciD.g.visible = false;
      // портал схлопывается, осколки разлетаются
      var fly = [0, 1, 2].map(function (i) { var s = N.shards[i]; return { s: s, tx: s.position.x, ty: s.position.y, tz: s.position.z }; });
      fly.forEach(function (f) { f.s.visible = true; });
      sfx('bonk'); await anim(1300, function (u) { N.darkP.scale.setScalar(Math.max(.02, 1 - u * 1.6)); var e = 1 - (1 - u) * (1 - u); fly.forEach(function (f) { f.s.position.set(k.ox + (f.tx - k.ox) * e, 1.5 + (f.ty - 1.5) * e + Math.sin(u * PI) * 3, k.oz + 31 + (f.tz - k.oz - 31) * e); }); });
      N.darkP.visible = false;
      await say([['sys', 'Портал схлопывается. Три зелёных осколка разлетаются в темноту.'], ['gus', 'Он идёт к Антону. На хлебозавод.'], ['marya', 'Значит, нам туда же. Сначала — выбраться. Осколки — наш выход.'], ['gus', 'Я видел, один улетел в щель. Туда пролезу только я.'], ['marya', 'А другой — на кучу хлама. Туда дотянусь только я.']]);
      await T.shotOff(800);
      q.met = true; T.save();
    });
    toast('🔄 Здесь можно меняться героями в любом месте. Гусь пролезает в узкие лазы, Марья дотягивается до высокого и двигает тяжёлое.', 6500);
  }
  function wireDark() {
    var A = function (x, z, label, fn, r, ok) { return T.act(DARK, x, z, label, fn, r, ok); }, q = Q;
    function take(i) { var s = q(); if (s.sh[i]) return; s.sh[i] = true; sfx('coin'); T.save(); toast('🟢 Осколок портала: ' + s.sh.filter(Boolean).length + '/3', 2200); darkState(); }
    A(-30, 10, '🟢 Взять осколок портала', function () { take(0); }, 2.2, function () { return !q().sh[0]; });
    A(24.6, 5, '🪿 Пролезть в щель', function () { if (!isHero(gus)) return need(gus); hop(K.dark.ox + 28.4, K.dark.oz + 5, PI / 2, '🪿 Гусь протискивается в щель…', true); }, 2, function () { return !inR({ x: player.pos.x - K.dark.ox, z: player.pos.z - K.dark.oz }, 26, 34, 1, 9); });
    A(27.6, 5, '🪿 Вылезти обратно', function () { hop(K.dark.ox + 24, K.dark.oz + 5, -PI / 2, '🪿 Обратно…', true); }, 1.7, function () { return inR({ x: player.pos.x - K.dark.ox, z: player.pos.z - K.dark.oz }, 26, 34, 1, 9); });
    A(31.5, 5, '🟢 Взять осколок портала', function () { take(1); }, 2, function () { return !q().sh[1]; });
    A(0, -7.2, '👩 Дотянуться до осколка на вершине', function () { if (!isHero(marya)) return need(marya); take(2); }, 2.4, function () { return !q().sh[2]; });
    A(0, -37.6, '🌀 Рамка выхода', function () { exitDark(); }, 2.8);
  }
  async function exitDark() {
    var q = Q(), n = q.sh.filter(Boolean).length; if (n < 3) { toast('🌀 Рамка пустая. Нужны три осколка портала: ' + n + '/3.', 2600); return; } if (W.busy) return; W.busy = true;
    try {
      await cutscene(async function () {
        q.portal = true; N.exitP.visible = true; N.exitP.scale.setScalar(.05); sfx('quest'); await anim(700, function (u) { N.exitP.scale.setScalar(.05 + u * 1.45); });
        await say([['gus', 'Работает. Зелёное. Как у него.'], ['marya', 'Идём, пока не передумало.']]);
      });
      q.stage = 2; T.save(); T.endLvl(); L = null; chipPaint();
      await T.moveTo('city', 3.6, 7.5, PI, '🌀 …');
      await cutscene(async function () { await say([['gus', 'Перекрёсток. Дыра нас выплюнула туда же, где проглотила.'], ['marya', 'Хлебозавод «Батон» — на востоке, за кольцом. Бегом. Или на чём-нибудь с колёсами.']]); });
      toast('🏭 Доберись до хлебозавода «Батон» на востоке города.', 4200);
    } finally { W.busy = false; }
  }

  /* ====================== 3) ХЛЕБОЗАВОД ====================== */
  async function enterFab(fromCity) {
    var q = Q(); if (q.stage < 2 || S.q[ID] || W.busy) return; W.busy = true;
    try { await enterFab2(q); } finally { W.busy = false; }
  }
  async function enterFab2(q) {
    T.begin(14); L = T.lvl; buildAll(); applyState(); W.mode = 'follow';
    var first = q.stage === 2; q.stage = 3; T.save();
    await T.go(FAB, 0, 32.5, PI, '🏭 ХЛЕБОЗАВОД «БАТОН»');
    if (first) await cutscene(async function () {
      await say([['marya', 'Антона у входа нет. Дверь открыта.'], ['gus', 'Пахнет хлебом. Но каким-то… не нашим. Разным.'], ['sys', 'В коридоре впереди что-то огромное дышит во сне.'], ['marya', 'Это… Антон?'], ['gus', 'Это Антон размером с грузовик. У нашего Антона нет размера «грузовик».'], ['marya', 'Они из других миров. Дыра натащила. И все пришли к батону.']]);
      toast('🔄 Меняйся героями в любом месте. Кнопка сверху: напарник идёт рядом или ждёт.', 5200);
    });
    objTick(true);
  }
  async function leaveFab() {
    var q = Q(), got = !!q.f.got; if (W.busy) return; W.busy = true;
    try {
      T.endLvl(); L = null; hemiOff(); carry(false); chipPaint();
      if (got) { q.stage = 4; T.save(); await T.moveTo('city', W.door.x, W.door.z + 1.2, 0, ''); W.busy = false; await startTug(); }
      else await T.moveTo('city', W.door.x, W.door.z + 1.2, 0, '');
    } finally { W.busy = false; }
  }
  function hemiOff() { if (W.hemi) { W.hemi = false; try { hemiOverride = null; } catch (e) { } } }
  function wireFab() {
    var z = Z2, f = F, A = function (x, zz, label, fn, r, ok) { return T.act(FAB, x, zz, label, fn, r, ok); };
    function sv() { T.save(); objTick(true); }
    // лестницы и выход
    A(-7.6, 23.6, '🪜 Лестница А — на 2 этаж', function () { hop(fx(-8.4), fz(z + 20.6), -PI / 2, '🪜 2 этаж'); }, 2.2);
    A(-9.4, z + 20.6, '🪜 Лестница А — на 1 этаж', function () { hop(fx(-6.4), fz(24.6), PI, '🪜 1 этаж · проходная'); }, 2.2);
    A(59.4, z + 20.6, '🪜 Лестница Б — на 1 этаж', function () { hop(fx(57.6), fz(15.4), PI, '🪜 1 этаж · пекарный цех'); }, 2.2);
    A(58.6, 17.4, '🪜 Лестница Б — на 2 этаж', function () { hop(fx(58), fz(z + 20.6), PI / 2, '🪜 2 этаж'); }, 2.2);
    A(0, 34.4, '🚪 Выйти с завода', function () { leaveFab(); }, 2.4);
    // Великан
    A(0, 10.9, '😴 Антон-Великан', function () { cutscene(async function () { await say([['sys', 'Антон-Великан спит поперёк коридора. За ним — дверь в печной зал и проход в цех.'], ['gus', 'Толкать бесполезно. Он из мира, где всё большое. Даже сон.'], ['marya', f().power ? 'Его разбудит только запах свежего хлеба. Нужен батон с конвейера.' : 'Здесь не пройти. Слева лестница на второй этаж — обойдём сверху.']]); }); }, 2.6, function () { return !f().giant && loc(player.pos).z > 9; });
    A(4.6, 6.5, '😴 Антон-Великан', function () { cutscene(async function () { await say([['marya', 'С этой стороны он ещё больше.'], ['gus', 'Он шевелит носом. Он чует хлеб даже во сне. Свежий — с конвейера над нами.']]); }); }, 2.4, function () { return !f().giant && loc(player.pos).x > 3; });
    // лаборатории
    A(1.1, z + 13.5, '🪿 Вентиляция в лабораторию Б', function () { if (!isHero(gus)) return need(gus); hop(fx(4), fz(z + 13.5), PI / 2, '🪿 …', true); }, 1.6);
    A(2.9, z + 13.5, '🪿 Вентиляция в лабораторию А', function () { if (!isHero(gus)) return need(gus); hop(fx(0), fz(z + 13.5), -PI / 2, '🪿 …', true); }, 1.6);
    A(14.2, z + 5, '🥖 Верхняя полка: резиновый батон', function () { if (!isHero(marya)) return need(marya); f().rubber = true; N.rubber.visible = false; sfx('coin'); toast('🥖 Резиновый батон. Образец №7. «Жевать можно вечно».', 3200); sv(); }, 2, function () { return !f().rubber; });
    addI({ area: FAB, p: function () { return (!f().pass && W.ghost.corner) ? { x: N.ghost.position.x, z: N.ghost.position.z } : null; }, r: 3, label: '👻 Поймать Антона-Призрака', act: function () { catchGhost(); } });
    // пультовая
    A(28, z + 17.5, '🪪 Приложить пропуск', function () { if (!f().pass) { toast('🚪 Пультовая — по пропускам. Пропуск технолога болтается на Антоне-Призраке (лаборатории).', 3600); sfx('bonk'); return; } f().door = true; N.ctlDoor.visible = false; N.ctlCol.on = false; sfx('ding'); toast('🚪 Пультовая открыта. Внутри кто-то ездит по кругу и жужжит.', 3200); sv(); }, 2, function () { return !f().door; });
    A(34.6, z + 3.6, '🔌 Выдернуть вилку Робо-Антона', function () { if (!isHero(gus)) return need(gus); unplug(); }, 1.9, function () { return !!f().door && !f().robot; });
    A(21.4, z + 9, '🎚️ Рубильник «ЛИНИЯ 1»', function () { if (!isHero(marya)) return need(marya); if (!f().robot) { toast('⚡ Робо-Антон не подпустит человека к рубильнику.', 2400); return; } f().power = true; N.lever.rotation.x = PI; N.mixLamp.material.color.setHex(0x2fae5b); sfx('quest'); toast('🎚️ «ЛИНИЯ 1» включена. Внизу загудел тестомес и поехал конвейер.', 3600); sv(); }, 2, function () { return !f().power; });
    // зеркальный зал
    A(46, z + 6, '📦 Сдвинуть ящик', function () { if (!isHero(marya)) return need(marya); pushCrate(); }, 2.3, function () { return !f().crate; });
    A(41.6, z - 6, '🌾 Взять мешок муки', function () { f().flour = true; N.flour.visible = false; gate(true); sfx('coin'); toast('🌾 Мука есть. Антон-Зеркальный смотрит на тебя с той стороны. И не моргает.', 3400); sv(); }, 2, function () { return !f().flour; });
    A(47.6, z + 12, '🪞 Антон-Зеркальный', function () { cutscene(async function () { await say([['sys', 'За стеклом сидит серебристый Антон. Он смотрит только на Гуся.'], ['gus', 'Я шаг влево — он шаг вправо. Он из зеркального мира.'], ['marya', 'Там, на его стороне, красная плита. Наверное, от решётки с мукой. Ему надо встать на неё.'], ['gus', 'Значит, мне надо встать на такое же место здесь. Где стоит ящик.']]); }); }, 2.2, function () { return !f().flour; });
    // пекарный цех
    A(44.7, -8, '🪿 Воздуховод морозилки', function () { if (!isHero(gus)) return need(gus); duct(); }, 1.9, function () { return !f().duct; });
    A(48.5, -1.7, '🌡️ Термостат морозилки', function () { if (!isHero(marya)) return need(marya); thermo(); }, 1.9, function () { return !f().thaw; });
    A(56.6, -8.6, '🧈 Взять закваску', function () { f().starter = true; N.starter.visible = false; sfx('coin'); toast('🧈 Закваска из ледяного мира. Холодная, но живая.', 3000); sv(); }, 2, function () { return !!f().thaw && !f().starter; });
    A(40, -2.9, '🥣 Тестомес', function () { mixer(); }, 2.3);
    A(35, 3.4, '🍞 Антон-Обжора', function () { glutton(); }, 2.3);
    // печной зал
    A(0, -18, '🥖✨ Взять Сияющий батон', function () { takeBaton(); }, 2.5, function () { return !f().got; });
  }
  /* --- Призрак: уходит сквозь стену туда, где никого нет. Нужны оба героя — по одному в каждой лаборатории. --- */
  function ghostTick(dt) {
    var f = F(); if (f.pass) return; var G_ = W.ghost, k = K.fab, cur = N.ghostSpot[G_.at], oth = N.ghostSpot[G_.at === 'A' ? 'B' : 'A'];
    if (G_.move > 0) {
      G_.move -= dt; var u = 1 - Math.max(0, G_.move) / .9, from = N.ghostSpot[G_.at === 'A' ? 'B' : 'A'];
      moveAnton(N.ghost, k.ox + from[0] + (cur[0] - from[0]) * u, k.oz + from[1] + (cur[1] - from[1]) * u); N.ghostKey.position.x = N.ghost.position.x; N.ghostKey.position.z = N.ghost.position.z; return;
    }
    var dp = Math.hypot(player.pos.x - k.ox - cur[0], player.pos.z - k.oz - cur[1]);
    if (dp < 4.4) {
      var guard = !comp.hidden && Math.hypot(comp.pos.x - k.ox - oth[0], comp.pos.z - k.oz - oth[1]) < 6;
      if (guard) { if (!G_.corner) { G_.corner = true; sfx('ding'); toast('👻 Антону-Призраку некуда уйти: в соседней лаборатории ждёт ' + comp.name + '. Лови!', 3000); } }
      else if (!blocked()) {
        G_.corner = false; G_.at = G_.at === 'A' ? 'B' : 'A'; G_.move = .9; G_.esc++; sfx('whoosh');
        toast(G_.esc === 1 ? '👻 Антон-Призрак ушёл сквозь стену в соседнюю лабораторию.' : G_.esc < 4 ? '👻 Опять сквозь стену…' : '👻 Он уходит туда, где никого нет. Оставь напарника в одной лаборатории (кнопка «✋ ждёт»), а сам зайди в другую.', G_.esc < 4 ? 2200 : 6000);
      }
    } else if (dp > 7) G_.corner = false;
  }
  function catchGhost() {
    var f = F(); if (f.pass || !W.ghost.corner) return;
    cutscene(async function () {
      await say([['sys', 'Антон-Призрак мечется между стенами. С обеих сторон — вы.'], ['a_ghost', '*шмыг… сквозь стену… не шмыг*'], ['marya', 'Мы тебя не обидим. Нам нужен только пропуск.'], ['sys', 'Призрак вздыхает, роняет пропуск технолога и уплывает в потолок.']]);
      f.pass = true; N.ghost.visible = false; N.ghostKey.visible = false; if (N.ghost.userData.label) N.ghost.userData.label.visible = false; sfx('quest'); T.save(); objTick(true);
      toast('🪪 Пропуск технолога: открывает пультовую на 2 этаже.', 3600);
    });
  }
  /* --- Робот: датчики настроены на рост человека. Гуся он не видит. --- */
  function robotTick(dt) {
    var f = F(), k = K.fab; if (!f.door || f.robot) return;
    var R = W.robot, wp = N.robotWP[R.i % 4], rx = N.robot.position.x - k.ox, rz = N.robot.position.z - k.oz, dx = wp[0] - rx, dz = wp[1] - rz, d = Math.hypot(dx, dz);
    if (d < .25) R.i++; else { var s = Math.min(d, 2.3 * dt); moveAnton(N.robot, k.ox + rx + dx / d * s, k.oz + rz + dz / d * s); N.robot.rotation.y = Math.atan2(dx, dz); N.robotEye.position.set(N.robot.position.x, 2.6, N.robot.position.z); }
    if (blocked() || W.grace > 0 || coop()) return;
    var l = loc(player.pos); if (player !== marya || !inR(l, 20, 36, Z2 + 2, Z2 + 16)) return;
    var px = l.x - rx, pz = l.z - rz, pd = Math.hypot(px, pz), hx = Math.sin(N.robot.rotation.y), hz = Math.cos(N.robot.rotation.y), dot = pd > .01 ? (px * hx + pz * hz) / pd : 1;
    if (pd < 2.3 || (pd < 7 && dot > .34)) { W.grace = 1.6; sfx('bonk'); placeA(player, fx(28), fz(Z2 + 18.6), 0); toast('⚡ Робо-Антон: «ЧЕЛОВЕК ОБНАРУЖЕН. ВЫДВОРЕНИЕ». Его датчики настроены на рост человека — Гуся он не заметит.', 4600); }
  }
  function unplug() {
    var f = F(); cutscene(async function () {
      await say([['sys', 'Гусь проходит прямо под красным лучом. Луч его не замечает.'], ['gus', 'Привет. Я ниже твоего мнения обо мне.'], ['sys', 'Гусь выдёргивает вилку.'], ['a_robot', 'ШМЫГ-ШМЫГ… шмы-ы-ы…']]);
      f.robot = true; N.robotEye.visible = false; N.plug.visible = false; sfx('clunk'); T.save(); objTick(true); toast('🔌 Робо-Антон выключен. Рубильник «ЛИНИЯ 1» — на стене слева, высоко.', 3600);
    });
  }
  /* --- Зеркальный: повторяет шаги Гуся наоборот. Марья убирает ящик, Гусь встаёт на место, Марья берёт муку. --- */
  function pushCrate() {
    var f = F(), k = K.fab, z = Z2; cutscene(async function () {
      sfx('clunk'); await anim(900, function (u) { N.crate.position.set(k.ox + 46 - 4 * u, .85, k.oz + z + 6 + 7 * u); });
      f.crate = true; N.crateCol.on = false; N.crateCol2.on = true; T.save(); objTick(true);
      await say([['marya', 'Готово. Место свободно.'], ['gus', 'Теперь моя очередь стоять красиво.']]);
    });
  }
  function mirrorTick(dt) {
    var f = F(), k = K.fab, z = Z2; if (f.flour) return;
    var gl = loc(gus.pos), inW = area === FAB && !gus.hidden && inR(gl, 40, 50, z - 8, z + 16), tx = inW ? Math.min(59.3, Math.max(50.8, 100 - gl.x)) : 56, tz = inW ? Math.min(z + 15.3, Math.max(z - 7.3, gl.z)) : z + 10;
    var P = N.mirrorP, dx = tx - P.x, dz = tz - P.z, d = Math.hypot(dx, dz);
    if (d > .02) { var s = Math.min(d, 9 * dt); P.x += dx / d * s; P.z += dz / d * s; moveAnton(N.mirror, k.ox + P.x, k.oz + P.z); N.mirror.rotation.y = Math.atan2(-dx, dz); }
    var on = Math.hypot(P.x - 54, P.z - (z + 6)) < 1.05, inCage = [player, comp].some(function (a) { return inR(loc(a.pos), 40, 44, z - 8, z - 3); });
    N.plate.material.color.setHex(on ? 0x2fae5b : 0x8a1f1f);
    var open = on || inCage; if (open !== W.gateOpen) { W.gateOpen = open; gate(open); if (open && on) { sfx('ding'); toast('🪞 Антон-Зеркальный встал на плиту: решётка с мукой открыта. Пока Гусь стоит на месте — она не закроется.', 4200); } }
  }
  /* --- Ледяной: Гусь открывает заслонку в воздуховоде, Марья поворачивает термостат. --- */
  function duct() { var f = F(); cutscene(async function () { await fade(1, 300, '🪿 Гусь ползёт по воздуховоду…'); await wait(1100); sfx('clunk'); await fade(0, 300); f.duct = true; T.save(); objTick(true); await say([['gus', 'Там заслонка. Была. Я её открыл лапой. Теперь тёплый воздух пойдёт внутрь.'], ['marya', 'Остался термостат. Он высоко — это ко мне.']]); }); }
  function thermo() {
    var f = F(), k = K.fab; if (!f.duct) { toast('🌡️ Марья крутит термостат — тёплый воздух не идёт: заслонка в воздуховоде закрыта. Туда пролезет только Гусь.', 4200); sfx('bonk'); return; }
    cutscene(async function () {
      N.thermo.material.color.setHex(0xff8a3a); sfx('ding');
      await T.shotTo(FAB, 52, 2.6, -4.4, 58, 1.2, -9.4, 900);
      await say([['sys', 'Термостат: −30… −10… +5. По стенам течёт вода.']]);
      await anim(1600, function (u) { N.ice.scale.setScalar(Math.max(.02, 2.2 * (1 - u))); N.ice.position.y = 1.1 * (1 - u); });
      N.ice.visible = false; N.iceCol.on = false;
      await say([['a_ice', '*шмыг-шмыг-шмыг* *дрожит*'], ['gus', 'Он из мира, где всегда минус тридцать. Ему у нас жарко.'], ['sys', 'Антон-Ледяной роняет баночку закваски и упрыгивает к холодильникам.']]);
      await anim(1100, function (u) { moveAnton(N.iceA, k.ox + 58.5 - 8.5 * u, k.oz - 9.5 - 1.5 * u); N.iceA.position.y = Math.abs(Math.sin(u * PI * 4)) * .5; }); N.iceA.position.y = 0;
      f.thaw = true; N.starter.visible = true; T.save(); await T.shotOff(700); objTick(true);
    });
  }
  function coldTick(dt) {
    var f = F(); if (f.thaw || blocked()) { W.cold = 0; return; }
    if (inR(loc(player.pos), 46, 62, -12, -3)) { var b = W.cold; W.cold += dt; if (b < 3 && W.cold >= 3) toast('🥶 Минус тридцать. Ещё несколько секунд — и надо выходить.', 2200); if (W.cold > 7) { W.cold = 0; sfx('bonk'); placeA(player, fx(52), fz(-1.2), 0); toast('🥶 Слишком холодно! Сначала надо отогреть камеру: заслонка в воздуховоде и термостат.', 4200); } }
    else W.cold = 0;
  }
  /* --- Тестомес, Обжора и Великан --- */
  function mixer() {
    var f = F(), k = K.fab;
    if (f.giant) { toast('🥣 Тестомес гудит вхолостую. Великан уже ушёл на склад.', 2400); return; }
    if (!f.power) { toast('🥣 Тестомес обесточен. Рубильник «ЛИНИЯ 1» — в пультовой на 2 этаже.', 3400); sfx('bonk'); return; }
    if (!f.flour || !f.starter) { toast('🥣 Не хватает: ' + [!f.flour ? '🌾 мука (зеркальный зал, 2 этаж)' : '', !f.starter ? '🧈 закваска (морозилка)' : ''].filter(Boolean).join(' и ') + '.', 4200); sfx('bonk'); return; }
    if (f.baked && !f.fed) { toast('🥣 Обжора съест и этот батон. Сначала его надо чем-то занять — тем, что нельзя доесть.', 4200); return; }
    cutscene(async function () {
      sfx('clunk'); await T.shotTo(FAB, 44, 3.4, 4, 37, 1.6, -1.5, 800);
      await say([['sys', 'Тестомес глотает муку и закваску. Гудит. Пахнет так, что у Гуся кружится голова.']]);
      N.loaf.visible = true; N.loaf.position.set(k.ox + 40, 2.2, k.oz - 4);
      if (!f.fed) {
        await anim(900, function (u) { N.loaf.position.set(k.ox + 40 - 5 * u, 2.2 + Math.sin(u * PI) * 1.2 - u * .6, k.oz - 4 + 5.5 * u); });
        N.loaf.visible = false; sfx('bonk');
        await say([['sys', 'Свежий батон вылетает из печи — и исчезает в Антоне-Обжоре. Целиком. За секунду.'], ['a_glut', '*ШМЫГ.* *облизывается*'], ['gus', 'Он из мира, где хлеб едят быстрее, чем пекут.'], ['marya', 'Пока он тут сидит, до конвейера не доедет ничего. Ему нужно что-то, что нельзя доесть.']]);
        f.baked = true; T.save(); await T.shotOff(700); objTick(true); return;
      }
      await anim(800, function (u) { N.loaf.position.set(k.ox + 40 - 6 * u, 2.2 + 1.6 * u, k.oz - 4 + 8.7 * u); });
      await say([['sys', 'Обжора занят резиной. Батон спокойно въезжает на подвесной конвейер и едет в коридор.']]);
      await T.shotTo(FAB, 9, 3.2, 7.6, 0, 2, 6.5, 900);
      await anim(2600, function (u) { N.loaf.position.set(k.ox + 34 - 34 * u, 3.8, k.oz + 4.7); });
      N.giantZ.visible = false; sfx('ding');
      await say([['sys', 'Нос Антона-Великана дёргается. Один глаз открывается. Он размером с люк.'], ['a_giant', '*ШМЫГ*'], ['sys', 'От этого «шмыг» с потолка сыплется побелка.']]);
      await T.shotTo(FAB, 6, 3.4, 12, -14, 2, 6.5, 700);
      await anim(3200, function (u) { N.loaf.position.set(k.ox - 34 * u, 3.8, k.oz + 4.7); moveAnton(N.giant, k.ox - 38 * u, k.oz + 6.5); N.giant.rotation.y = -PI / 2; N.giant.position.y = Math.abs(Math.sin(u * PI * 5)) * .5; });
      N.giant.position.y = 0; N.loaf.visible = false; f.giant = true; giantPlace(true); sfx('quest'); T.save();
      await say([['sys', 'Великан уходит за батоном на склад, ложится и засыпает, обняв его.'], ['marya', 'Коридор свободен. Дверь в печной зал — тоже.'], ['gus', 'Батон там. И… их там много.']]);
      await T.shotOff(800); objTick(true);
    });
  }
  function glutton() {
    var f = F();
    if (f.fed) { toast('🍞 Антон-Обжора жуёт резиновый батон. Уже сорок раз. Он счастлив.', 2600); return; }
    if (!f.rubber) { toast(f.baked ? '🍞 Обжора ждёт следующий батон. Ему бы что-то, что нельзя доесть… (лаборатория Б, верхняя полка)' : '🍞 Антон-Обжора сидит у выхода печи и смотрит на неё. Не моргая.', 3800); return; }
    cutscene(async function () {
      await say([['marya', 'Держи. Образец номер семь.'], ['sys', 'Обжора хватает резиновый батон. Жуёт. Жуёт. Жуёт. Батон не кончается.'], ['a_glut', '*шмыг…?* *жуёт* *шмыг!!*'], ['gus', 'Он нашёл смысл жизни.']]);
      f.fed = true; N.glutE.visible = false; sfx('quest'); T.save(); objTick(true);
    });
  }
  /* --- Печной зал: Антоны просыпаются по очереди. Двигаться можно, только пока они спят. --- */
  function eyesTick(dt) {
    var f = F(), E = W.eyes; if (!f.giant || W.alarm) return;
    E.t -= dt; if (E.t <= 0) { if (E.ph === 'closed') { E.ph = 'warn'; E.t = .9; } else if (E.ph === 'warn') { E.ph = 'open'; E.t = 2.3; } else { E.ph = 'closed'; E.t = 3.6; } eyesPaint(); }
    if (E.ph !== 'open' || blocked() || W.grace > 0) return;
    if (inHall(player.pos) && player.moving) {
      W.grace = 1.2; sfx('bonk'); placeA(player, fx(0), fz(6.4), PI); toast('👀 Антоны заметили движение и… вежливо вынесли тебя за дверь. Иди, только пока они спят (💤), и замирай на ⚠️.', 4800);
    }
  }
  function eyesPaint() {
    var e = W.eyes.ph === 'open' ? '👀' : W.eyes.ph === 'warn' ? '⚠️' : '💤';
    if (N.eyeSign.__e !== e) { N.eyeSign.__e = e; try { N.eyeSign.material.map = emojiTex(e); N.eyeSign.material.needsUpdate = true; N.crowd.forEach(function (c) { c.st.material.map = emojiTex(e); c.st.material.needsUpdate = true; }); } catch (er) { } }
  }
  function takeBaton() {
    var f = F(); if (f.got) return;
    if (W.eyes.ph === 'open') { toast('👀 Не сейчас — они смотрят!', 1600); return; }
    f.got = true; N.batonM.visible = false; N.batonGlow.visible = false; carry(true); sfx('quest'); T.save(); objTick(true);
    toast('🥖✨ Сияющий батон у тебя! Теперь так же тихо — к двери.', 3600);
  }
  function alarmTick(dt) {
    var f = F(); if (!f.got) return;
    if (!W.alarm && !inHall(player.pos) && !blocked()) {
      W.alarm = true; W.eyes.ph = 'open'; eyesPaint();
      cutscene(async function () { await say([['sys', 'За спиной — восемь «шмыг» одновременно. Потом тишина. Потом топот маленьких лап.'], ['gus', 'ОНИ ЗАМЕТИЛИ!'], ['marya', 'К выходу! Через проходную!']]); objTick(true); });
    }
    if (W.alarm) N.crowd.forEach(function (c, i) { var tx = player.pos.x - 1.5 - (i % 4) * .9, tz = player.pos.z + 2 + Math.floor(i / 4) * 1.1, dx = tx - c.g.position.x, dz = tz - c.g.position.z, d = Math.hypot(dx, dz); if (d > 2.2) { var s = Math.min(d, 2.6 * dt); c.g.position.x += dx / d * s; c.g.position.z += dz / d * s; c.g.rotation.y = Math.atan2(dx, dz); } c.g.position.y = Math.abs(Math.sin(performance.now() / 110 + i)) * .3; c.hat.position.set(c.g.position.x, 1.2 + c.g.position.y, c.g.position.z); c.st.position.set(c.g.position.x, 1.9 + c.g.position.y, c.g.position.z); });
  }
  /* --- цель на экране: что делать дальше и куда идти (с учётом этажей) --- */
  function zone(l) { return l.z > 100 ? 'f2' : ((l.x > -10.5 && l.x < 10.5 && l.z > 9.3) ? 'west' : 'east'); }
  function objTick(force) {
    if (!L || area !== FAB) return; var now = performance.now(); if (!force && now - W.objT < 400) return; W.objT = now;
    var f = F(), z = Z2, t, p;
    if (f.got) { t = '🏃 Сияющий батон у вас! К выходу — через коридор в проходную.'; p = [0, 34.4]; }
    else if (f.giant) { t = '🥖 Печной зал: забрать Сияющий батон. Двигайся, только пока Антоны спят (💤).'; p = [0, -18]; }
    else if (!f.pass) { t = '👻 2 этаж, лаборатории: у Антона-Призрака пропуск. Он уходит туда, где никого нет.'; p = [2, z + 12]; }
    else if (!f.door) { t = '🪪 2 этаж: открыть пультовую пропуском.'; p = [28, z + 17.5]; }
    else if (!f.robot) { t = '🤖 Пультовая: обесточить Робо-Антона. Человека он видит, Гуся — нет.'; p = [34.6, z + 3.6]; }
    else if (!f.power) { t = '🎚️ Пультовая: включить рубильник «ЛИНИЯ 1» (высоко — Марья).'; p = [21.4, z + 9]; }
    else if (!f.flour) { t = f.crate ? '🪞 Зеркальный зал: Гусь встаёт на серую плиту и остаётся там (кнопка «✋ ждёт»), Марья берёт муку за решёткой.' : '🪞 Зеркальный зал: добыть муку. Антон-Зеркальный повторяет шаги Гуся наоборот.'; p = f.crate ? [46, z + 6] : [46, z + 6]; }
    else if (!f.starter) { t = f.thaw ? '🧈 Морозилка: забрать закваску.' : !f.duct ? '🥶 Пекарный цех (1 этаж, лестница Б): отогреть морозилку. Заслонка в воздуховоде — для Гуся.' : '🌡️ Повернуть термостат морозилки (высоко — Марья).'; p = f.thaw ? [56.6, -8.6] : !f.duct ? [44.7, -8] : [48.5, -1.7]; }
    else if (!f.baked) { t = '🥣 Тестомес: испечь свежий батон для Великана.'; p = [40, -2.9]; }
    else if (!f.rubber) { t = '🥖 Обжоре нужно то, что нельзя доесть: резиновый батон, лаборатория Б (2 этаж), верхняя полка.'; p = [14.2, z + 5]; }
    else if (!f.fed) { t = '🍞 Отдать резиновый батон Антону-Обжоре.'; p = [35, 3.4]; }
    else { t = '🥣 Тестомес: испечь батон ещё раз — теперь он доедет до Великана.'; p = [40, -2.9]; }
    var pz = zone(loc(player.pos)), tz = zone({ x: p[0], z: p[1] });
    if (!f.giant && pz !== tz) { if (pz === 'west') p = [-7.6, 23.6]; else if (pz === 'east') p = [58.6, 17.4]; else p = tz === 'west' ? [-9.4, z + 20.6] : [59.4, z + 20.6]; }
    else if (f.giant && (pz === 'f2') !== (tz === 'f2')) { p = pz === 'f2' ? [59.4, z + 20.6] : [58.6, 17.4]; }
    T.setObj(t, FAB, p[0], p[1]);
  }

  /* ====================== 4) У ВЫХОДА: БАТОН ОТБИРАЮТ ДРУГ У ДРУГА ====================== */
  function holderPos(h) { return h === 'anton' ? { x: N.antonC.position.x, z: N.antonC.position.z } : h === 'sci' ? N.sci.pos : h === 'comp' ? comp.pos : player.pos; }
  function team(h) { return h === 'player' || h === 'comp' ? 'H' : h; }
  async function startTug() {
    var q = Q(); if (q.stage !== 4 || W.tug || S.q[ID]) return;
    var A = W.arena, ay = H(A.x, A.z);
    T.begin(14); L = T.lvl; carry(true);
    W.tug = { on: false, holder: 'player', held: 0, t: 0, imm: 0, phase: 1, swaps: 0, pt: 0, dash: 0, stun: {} };
    await cutscene(async function () {
      try { dismount(player); } catch (e) { }
      T.walk(comp, A.x + 1.6, A.z - 4.6, 5); await T.walk(player, A.x, A.z - 5, 5);
      await say([['gus', 'Мы снаружи! Батон у нас!'], ['marya', 'Не кричи. Он светится — этого достаточно.']]);
      N.cityP.position.set(A.x, ay + 1.5, A.z + 3); N.cityP.rotation.y = 0; N.cityP.visible = true; N.cityP.scale.setScalar(.05); sfx('whoosh'); await anim(500, function (u) { N.cityP.scale.setScalar(.05 + u * .95); });
      N.sci.hidden = false; N.sci.g.visible = true; placeA(N.sci, A.x, A.z + 2.6, PI);
      await T.walk(N.sci, A.x + .4, A.z - 3.4, 4);
      await say([['sci', 'Благодарю. Я обошёл завод трижды. Там слишком много Антонов для одного учёного.'], ['sci', 'Поэтому я ждал, пока батон вынесут за меня.'], ['marya', 'Ты столкнул нас в дыру!'], ['sci', 'А вы вынесли мне батон. Мы квиты. Давайте его сюда.']]);
      sfx('bonk'); W.tug.holder = 'sci'; W.tug.imm = 1.6;
      await say([['sys', 'Учёный выхватывает Сияющий батон.'], ['gus', 'ОТДАЙ!']]);
      await anim(300, function (u) { N.cityP.scale.setScalar(Math.max(.02, 1 - u)); }); N.cityP.visible = false;
    });
    comp.ai = 'tug'; W.tug.on = true; tugObj();
    toast('🥖 Отбирай батон: догони того, кто его держит. И не отдавай!', 4200);
  }
  function tugObj() { var g = W.tug; if (!g) return; var who = { player: 'у тебя', comp: 'у ' + (comp === gus ? 'Гуся' : 'Марьи'), sci: 'у учёного', anton: 'у Антона' }[g.holder]; T.lvl && (T.lvl.obj = { t: '🥖 Батон ' + who + '. ' + (team(g.holder) === 'H' ? 'Убегай и не отдавай!' : 'Догони и отбери!') + ' Ваше время с батоном: ' + Math.floor(g.held) + '/' + (g.phase === 1 ? 10 : 22) + ' с', p: team(g.holder) === 'H' ? null : holderPos(g.holder) }); }
  function steer(pos, tgt, away) {            // точка, куда бежать: к цели или от неё (от нескольких — от «центра» догоняющих), не уходя с площадки
    var A = W.arena, dx = 0, dz = 0;
    if (away) { (Array.isArray(tgt) ? tgt : [tgt]).forEach(function (q) { var ex = pos.x - q.x, ez = pos.z - q.z, e = Math.hypot(ex, ez) || .01, w = 1 / (e * e + .5); dx += ex / e * w; dz += ez / e * w; }); }
    else { dx = tgt.x - pos.x; dz = tgt.z - pos.z; }
    var d = Math.hypot(dx, dz) || 1, nx = pos.x + dx / d * 4, nz = pos.z + dz / d * 4, r = Math.hypot(nx - A.x, nz - A.z);
    if (r > 14) { var k = 14 / r, tx = -(pos.z - A.z), tzz = (pos.x - A.x), tl = Math.hypot(tx, tzz) || 1, sg = (tx * dx + tzz * dz) >= 0 ? 1 : -1; nx = A.x + (nx - A.x) * k + sg * tx / tl * 4; nz = A.z + (nz - A.z) * k + sg * tzz / tl * 4; }
    return { x: nx, z: nz };
  }
  function players() { return ['player', 'comp', 'sci'].concat(W.tug.phase === 2 ? ['anton'] : []); }
  function foesOf(h) { return players().filter(function (o) { return team(o) !== team(h); }); }
  function nearestFoe(h) { var hp = holderPos(h), best = null, bd = 1e9; foesOf(h).forEach(function (o) { var p = holderPos(o), d = Math.hypot(p.x - hp.x, p.z - hp.z); if (d < bd) { bd = d; best = o; } }); return { who: best, d: bd }; }
  /* скорость участника: держащий батон получает рывок сразу после перехвата, у кого отобрали — на миг замирает */
  function spd(who, base) { var g = W.tug; if (g.stun[who] > 0) return 0; if (who === g.holder && g.dash > 0) return base * 1.55; return base; }
  function tugTick(dt) {
    var g = W.tug; if (!g || !g.on || area !== 'city') return; if (blocked()) return;
    g.t += dt; g.pt += dt; g.imm -= dt; g.dash -= dt; for (var k in g.stun) g.stun[k] -= dt; if (team(g.holder) === 'H') g.held += dt;
    var hp = holderPos(g.holder), chasers = foesOf(g.holder).map(holderPos), t, v;
    // учёный
    v = spd('sci', g.holder === 'sci' ? 5 : 5.4); t = g.holder === 'sci' ? steer(N.sci.pos, chasers, true) : steer(N.sci.pos, hp, false);
    if (v > 0) { N.sci.target = t; N.sci.tspeed = v; } else N.sci.target = null; N.sci.onArrive = null;
    // напарник
    if (!coop()) {
      v = spd('comp', g.holder === 'comp' ? 5.2 : 5.6);
      if (g.holder === 'comp') t = steer(comp.pos, chasers, true); else if (g.holder === 'player') t = { x: player.pos.x - 2, z: player.pos.z - 1.5 }; else t = steer(comp.pos, hp, false);
      if (v > 0) { comp.target = t; comp.tspeed = v; } else comp.target = null; comp.onArrive = null;
    }
    // Антон (вторая часть)
    if (g.phase === 2) {
      var ap = { x: N.antonC.position.x, z: N.antonC.position.z }; v = spd('anton', g.holder === 'anton' ? 5.1 : 6.4); t = g.holder === 'anton' ? steer(ap, chasers, true) : steer(ap, hp, false);
      var dx = t.x - ap.x, dz = t.z - ap.z, d = Math.hypot(dx, dz) || 1, s = Math.min(d, v * dt); ap.x += dx / d * s; ap.z += dz / d * s; try { collide(ap, .3); } catch (e) { }
      N.antonC.position.set(ap.x, H(ap.x, ap.z) + (v > 0 ? Math.abs(Math.sin(g.t * 14)) * .28 : 0), ap.z); if (v > 0) N.antonC.rotation.y = Math.atan2(dx, dz);
    }
    // перехват: кто дотронулся до держащего — забирает батон
    if (g.imm <= 0) {
      var best = null, bd = 1.35;
      foesOf(g.holder).forEach(function (o) { if (g.stun[o] > 0) return; var p = holderPos(o), d2_ = Math.hypot(p.x - hp.x, p.z - hp.z); if (d2_ < bd) { bd = d2_; best = o; } });
      if (best) {
        var was = g.holder; g.holder = best; g.imm = 1.2; g.dash = 1.3; g.stun[was] = .9; g.swaps++; sfx(team(best) === 'H' ? 'coin' : 'bonk');
        if (was === 'player') toast('😵 У тебя выхватили батон!', 900);
        toast({ player: '🥖 Батон у тебя! Беги!', comp: '🥖 Батон у ' + (comp === gus ? 'Гуся' : 'Марьи') + '!', sci: '🧪 Учёный перехватил батон!', anton: '🐇 Антон перехватил батон!' }[best], 1300);
      }
    }
    tugObj();
    if (g.phase === 1 && (g.held >= 10 || g.pt > 40)) antonArrives();
    else if (g.phase === 2 && (g.held >= 22 || g.pt > 45)) finale();
  }
  async function antonArrives() {
    var g = W.tug, A = W.arena; if (g.busy) return; g.busy = true; g.on = false; N.sci.target = null; comp.target = null;
    await cutscene(async function () {
      N.antonC.visible = true; N.antonC.position.set(W.door.x, H(W.door.x, W.door.z), W.door.z + 1); var sx = N.antonC.position.x, sz = N.antonC.position.z, tx = A.x - 3, tz = A.z - 2;
      await say([['sys', 'Из-за угла хлебозавода выскакивает Антон-Батон. Наш. Настоящий. С морковкой в зубах.']]);
      await anim(1500, function (u) { N.antonC.position.set(sx + (tx - sx) * u, H(tx, tz) + Math.abs(Math.sin(u * PI * 6)) * .35, sz + (tz - sz) * u); N.antonC.rotation.y = Math.atan2(tx - sx, tz - sz); });
      await say([['gus', 'Антон! Мы спасали твой батон! От учёного! И от других тебя!'], ['anton', '*ШМЫГ.*'], ['sys', 'Антон роняет морковку. Антон никого не слушает. Антон смотрит на батон.'], ['marya', 'Кажется, он тоже в игре.']]);
    });
    g.phase = 2; g.pt = 0; g.imm = 1.2; g.on = true; g.busy = false; toast('🐇 Теперь вчетвером! Антон быстрый — держи батон подальше от него.', 3800);
  }
  /* ====================== 5) ФИНАЛ ====================== */
  async function finale() {
    var g = W.tug, A = W.arena, q = Q(); if (!g || g.fin) return; g.fin = true; g.on = false; N.sci.target = null; comp.target = null;
    var hx = A.x, hz = A.z + 9, hy = H(hx, hz);
    await cutscene(async function () {
      g.holder = 'anton'; N.antonC.visible = true;
      var ax = A.x, az = A.z + 4; N.antonC.position.set(ax, H(ax, az), az); N.antonC.rotation.y = PI;
      placeA(player, A.x - 2.2, A.z - 1, 0); placeA(comp, A.x + 2.2, A.z - 1, 0); placeA(N.sci, A.x, A.z - 2.4, 0);
      cam.fixed = { pos: new THREE.Vector3(A.x + 9, hy + 6, A.z - 9), look: new THREE.Vector3(A.x, hy + 1, A.z + 5) };
      await say([['sys', 'Антон-Батон выхватывает батон и отпрыгивает. Все трое останавливаются.']]);
      W.endHole.g.visible = true; W.endHole.set(.2); W.endHole.grow(2.4); sfx('whoosh'); await wait(900);
      await say([['sys', 'Асфальт за спиной Антона темнеет. Дыра. Она пришла за батоном сама.'], ['sci', 'Отдай, грызун. Это наука!'], ['gus', 'Антон, это же мы!'], ['marya', 'Антон. Положи батон. Пожалуйста.'],
        ['sys', 'Антон смотрит на учёного. На Гуся. На Марью. На батон.'], ['anton', 'Лучше пусть он никому не достанется.'], ['gus', 'ОН РАЗГОВАРИВАЕТ?!']]);
      // батон летит в дыру
      g.holder = 'none'; N.carryM.visible = true; var bx = ax, by = hy + 1, bz = az; sfx('whoosh');
      await anim(1100, function (u) { N.carryM.position.set(bx + (hx - bx) * u, by + Math.sin(u * PI) * 3 - u * 1, bz + (hz - bz) * u); N.carryM.rotation.z = u * 9; });
      N.carryM.visible = false; W.carry = false;
      await say([['sys', 'Сияющий батон падает в дыру. Дыра перестаёт вращаться.'], ['sys', 'Потом начинает снова. Быстрее.']]);
      W.endHole.spin = 4; W.endHole.grow(26); sfx('whoosh');
      var pulls = [{ a: N.sci, k: 'actor' }, { a: comp, k: 'actor' }], p0 = { x: player.pos.x, z: player.pos.z }, an0 = { x: N.antonC.position.x, z: N.antonC.position.z };
      pulls.forEach(function (p) { p.x = p.a.pos.x; p.z = p.a.pos.z; });
      await say([['sci', 'Это не входило в расчё—'], ['marya', 'ГУСЬ, ДЕРЖИСЬ!'], ['gus', 'ЗА ЧТО?!']]);
      await anim(3400, function (u) {
        var e = u * u, s = Math.max(.04, 1 - e);
        player.ovr = { x: p0.x + (hx - p0.x) * e, y: hy + Math.sin(u * PI) * 1.2, z: p0.z + (hz - p0.z) * e }; player.g.scale.setScalar(s); player.yaw += .2;
        pulls.forEach(function (p) { p.a.pos.x = p.x + (hx - p.x) * e; p.a.pos.z = p.z + (hz - p.z) * e; p.a.g.scale.setScalar(s); p.a.yaw += .25; });
        N.antonC.position.set(an0.x + (hx - an0.x) * e, hy + Math.sin(u * PI) * 1.5, an0.z + (hz - an0.z) * e); N.antonC.scale.setScalar(1.25 * s); N.antonC.rotation.y += .3;
      });
      await fade(1, 1200, '🕳️ Дыра забрала хлебозавод, парковку, учёного, Антона-Батона, Марью и Гуся.'); await wait(2600);
      await fade(1, 600, '…Продолжение следует.'); await wait(2200);
      player.ovr = null; player.g.scale.setScalar(1); comp.g.scale.setScalar(1); N.sci.g.scale.setScalar(1); N.sci.hidden = true; N.sci.g.visible = false; N.antonC.visible = false; N.antonC.scale.setScalar(1.25); cam.fixed = null;
      comp.ai = 'follow'; W.endHole.spin = 1; W.endHole.set(8);
    });
    W.tug = null; T.endLvl(); L = null; carry(false);
    q.stage = 5; complete(ID); T.save();
    await T.moveTo('city', FLAT_DOOR.x + 1, FLAT_DOOR.z + 3, 0, '');
    toast('✔ Дело закрыто: «Дыра в центре города». Что стало с героями в дыре — в следующем деле. До его выхода город доступен как раньше.', 8000);
  }

  /* ====================== ПОКАДРОВО ====================== */
  function tick(dt, t) {
    // город: дыра на перекрёстке, дыра у завода после финала, штатный Антон у завода
    try {
      if (W.cityHole) {
        var q = S.p13 && S.p13[ID] ? S.p13[ID] : null, show = avail() && (!q || q.stage < 2) && area === 'city';
        W.cityHole.g.visible = show; if (show) W.cityK.anims.forEach(function (f) { f(t); });
        var fin = !!(W.tug && W.tug.fin);
        if (!fin) W.endHole.g.visible = !!S.q[ID] && area === 'city';
        if (S.q[ID] && !W.tug && W.endHole.tr !== 8) W.endHole.set(8);
        if (W.endHole.g.visible) W.endK.anims.forEach(function (f) { f(t); });
        if (S.q.svet && typeof BREADF !== 'undefined' && BREADF.anton) BREADF.anton.visible = false;
      }
    } catch (e) { console.error('[LEVEL14 city]', e); }
    if (W.grace > 0) W.grace -= dt;
    try { if (W.carry && N.carryM) { var g = W.tug, hp = g && g.holder !== 'none' ? holderPos(g.holder) : player.pos, hy = (g && g.holder === 'anton') ? 1 : 1.9; if (!g || g.holder !== 'none') { N.carryM.visible = true; N.carryM.position.set(hp.x, (area === 'city' ? H(hp.x, hp.z) : 0) + hy + Math.sin(t * 5) * .08, hp.z); N.carryM.rotation.y = t * 2; } } } catch (e) { }
    try { tugTick(dt); } catch (e) { console.error('[LEVEL14 tug]', e); }
    if (!L) { chipPaint(); return; }
    if (myArea()) { try { compTick(dt); } catch (e) { console.error('[LEVEL14 comp]', e); } }
    if (area === FAB) {
      if (!W.hemi) { W.hemi = true; } try { hemiOverride = .8; } catch (e) { }
      [ghostTick, robotTick, mirrorTick, coldTick, eyesTick, alarmTick].forEach(function (f) { try { f(dt); } catch (e) { console.error('[LEVEL14 tick]', e); } });
      try { objTick(false); } catch (e) { }
    } else hemiOff();
    chipPaint();
  }

  /* ====================== ПОДСКАЗКИ ЦЕЛИ В ГОРОДЕ ====================== */
  T.hints.push(function () {
    if (!avail() || T.lvl) return null; var q = Q();
    if (area === 'flat') return q.stage < 5 ? { t: q.stage === 0 ? '🔴 Новое дело: «Дыра в центре города». Выйти на улицу.' : '🕳️ «Дыра в центре города»: выйти на улицу.', p: FLAT_DOOR } : null;
    if (area !== 'city') return null;
    if (q.stage === 0) return { t: '🔴 Новое дело: «Дыра в центре города». Дыра открылась на главном перекрёстке.', p: { x: 4.3, z: 4.3 } };
    if (q.stage === 1) return { t: '🕳️ Вернуться в дыру на главном перекрёстке: выход из неё ещё не найден.', p: { x: 4.3, z: 4.3 } };
    if (q.stage === 2) return { t: '🏭 Добраться до хлебозавода «Батон» на востоке города. Учёный идёт за батоном.', p: W.door };
    if (q.stage === 3) return { t: '🏭 Вернуться на хлебозавод: Сияющий батон ещё внутри.', p: W.door };
    if (q.stage === 4) return { t: '🥖 У проходной хлебозавода вас ждут.', p: W.door };
    return null;
  });

  /* ====================== УСТАНОВКА ====================== */
  var done = false;
  function install() {
    if (done) return;
    if (typeof worldReady === 'undefined' || !worldReady || typeof MAIN === 'undefined' || !MAIN.some(function (m) { return m.id === 'svet'; }) || typeof BREADF === 'undefined' || typeof makeAnton !== 'function' || typeof canSwitch !== 'function' || !T.actW || typeof gus === 'undefined') return;
    done = true;
    if (!MAIN.some(function (m) { return m.id === ID; })) MAIN.push({ id: ID, icon: '🕳️', title: 'Дыра в центре города', who: 'Марья и Гусь · главный перекрёсток → хлебозавод «Батон»' });
    if (typeof WHO !== 'undefined') Object.assign(WHO, { a_ghost: ['Антон-Призрак', '#cfe8ff'], a_robot: ['Робо-Антон', '#c8d0d8'], a_ice: ['Антон-Ледяной', '#bfe6ff'], a_glut: ['Антон-Обжора', '#ffb36a'], a_giant: ['Антон-Великан', '#ffcf9a'] });
    if (typeof WHO !== 'undefined' && !WHO.sci) WHO.sci = ['Учёный', '#b8ff6a'];
    try { cityInstall(); } catch (e) { console.error('[LEVEL14 city install]', e); }
    // переключение героя в любом месте уровня (в городе — как раньше, только в кругах)
    var cs = canSwitch; window.canSwitch = canSwitch = function () { if (L && myArea()) return !blocked() && !player.lock && player.pose !== 'fall'; return cs(); };
    var pe = updEnv; window.updEnv = updEnv = function (dt, t) { pe(dt, t); try { tick(dt, t); } catch (e) { console.error('[LEVEL14]', e); } };
    console.log('[LEVEL14] «Дыра в центре города» подключена');
  }
  var iv = setInterval(function () { try { install(); if (done) clearInterval(iv); } catch (e) { console.error('[LEVEL14 install]', e); clearInterval(iv); } }, 350);

  /* ---------- инструменты для DEV-панели ---------- */
  var DEV = {
    restart: function () { MAIN.forEach(function (m) { if (m.id !== ID) S.q[m.id] = true; }); S.q[ID] = false; if (S.p13) delete S.p13[ID]; T.endLvl(); L = null; W.tug = null; W.busy = false; hemiOff(); carry(false); comp.ai = 'follow'; comp.hidden = false; if (area !== 'city') setArea('city'); placeA(player, 7, 9, PI); showComp(8.4, 9.6); T.save(); },
    dark: function () { var q = Q(); q.stage = 1; q.met = true; return enterDark(false); },
    shards: function () { Q().sh = [true, true, true]; T.save(); if (area === DARK) darkState(); },
    fab: function () { var q = Q(); if (q.stage < 2) q.stage = 2; return enterFab(true); },
    flags: function (list) { var f = F(); list.forEach(function (k) { f[k] = true; }); T.save(); if (built && K.fab) { applyState(); objTick(true); } },
    tug: function () { var q = Q(); q.f.got = true; q.stage = 4; T.save(); T.endLvl(); L = null; hemiOff(); if (area !== 'city') setArea('city'); placeA(player, W.door.x, W.door.z + 1.2, 0); showComp(W.door.x + 1.4, W.door.z + 1.6); return startTug(); },
    skipTug: function () { if (W.tug) { W.tug.held = 99; W.tug.pt = 99; } }
  };
  window.MG_L14 = { ID: ID, Q: Q, F: F, W: W, N: N, K: K, Z2: Z2, DARK: DARK, FAB: FAB, avail: avail, pushScene: pushScene, enterDark: enterDark, exitDark: exitDark, enterFab: enterFab, leaveFab: leaveFab, startTug: startTug, finale: finale, antonArrives: antonArrives, mixer: mixer, glutton: glutton, takeBaton: takeBaton, catchGhost: catchGhost, unplug: unplug, pushCrate: pushCrate, duct: duct, thermo: thermo, applyState: applyState, buildAll: buildAll, objTick: objTick, toggleMode: toggleMode, zone: zone, tick: tick, dev: DEV, ghostTick: ghostTick, robotTick: robotTick, mirrorTick: mirrorTick, eyesTick: eyesTick, tugTick: tugTick, darkState: darkState };
})();
