/* =====================================================================
   СЮЖЕТКА №3 — «ТАЙНА ДИКСИ И СВЕТОФОРА»
   Комната (сидр/кола) → улица, беглец → Дикси (колa, сидр, кино-сцена мясного отдела) →
   страшный супермаркет Дикси×Светофор: приёмка, «Мистика», «Светофор-зал», совместный
   мясокомбинат → погоня Живого мяса → тупик → дыра забирает часть Дикси → побег.
   ===================================================================== */
(function () {
  'use strict';
  var T = window.MG_STORY, D = window.MG_DIST, PI = Math.PI;
  if (!T || !D) { console.error('[LEVEL3] нет каркаса'); return; }
  var built = false, L = null, K = {};
  var S3 = { cola: false, cider: false, saw: false, badge: false, passed: false, fuses: 0, fuseGot: [false, false, false], doorOpen: false, chase: false, chasing: false, hide: false, hidden: false, grace: 0, caught: 0, finale: false, inside: false, mass: null, meatT: 0, ann: 0, checkpoint: null, lockers: [false, false, false, false, false], annT: 12, light: 'G', lightT: 4 };
  function rng(s) { return D.rngf(s); }
  var PA = 'p3_horror', STAFF_SPEED = { patrol: 1.9, search: 2.8, chase: 5.7 }, MASS = { speed: 4.9, max: 6.9, trail: [], catchR: 1.8 };

  /* ====================== СТРОИТЕЛЬСТВО ====================== */
  function buildDixie(k) {
    var R = rng(88), W = 44, Dp = 30;
    k.plane(W + 6, Dp + 6, 0xe8d8b8, 0, 0, 0); for (var i = -20; i <= 20; i += 4) k.plane(.08, Dp, 0xd8c8a8, i, 0, .02);
    k.b(W, 5, .8, 0xf2d8a0, 0, 0, -Dp / 2); k.b(.8, 5, Dp, 0xf2d8a0, -W / 2, 0, 0); k.b(.8, 5, Dp, 0xf2d8a0, W / 2, 0, 0); k.b(W / 2 - 3, 5, .8, 0xf2d8a0, -W / 4 - 1.5, 0, Dp / 2); k.b(W / 2 - 3, 5, .8, 0xf2d8a0, W / 4 + 1.5, 0, Dp / 2);
    k.bp(W, .4, Dp, 0xeee2c4, 0, 5, 0); for (var lx = -18; lx <= 18; lx += 9) for (var lz = -10; lz <= 10; lz += 10) k.m(G.box, 0xfff0c8, [3, .1, .8], [lx, 4.9, lz]);
    k.sign('ВЫХОД', 3, .6, 0, 4.2, Dp / 2 - .5, PI, '#1d7a3a', '#fff', { ds: true }); k.sign('ДИКСИ', 8, 1.2, 0, 4.2, -Dp / 2 + .5, 0, '#e8200f', '#fff');
    k.m(G.box, 0xa8d4f0, [6, 3.4, .2], [0, 1.7, Dp / 2 - .05]); k.col(-3, 3, Dp / 2 - .4, Dp / 2 + .4, 3.6);
    // стеллажи
    T.shelf(k, -8, -3, 12, false, 'groc', 11, 0xe8d8b8); T.shelf(k, -8, 4, 12, false, 'chem', 12, 0xe8d8b8); T.shelf(k, 9, -3, 12, false, 'groc', 13, 0xe8d8b8); T.shelf(k, 9, 4, 12, false, 'promo', 14, 0xe8d8b8);
    // напитки (кола) и алкоголь (сидр)
    k.sign('НАПИТКИ', 5, .7, -19, 3.6, -9, 0, '#2e86c1', '#fff', { ds: true }); k.b(5, 2.2, 1, 0xdde6f0, -19, 0, -10.6); for (var c = 0; c < 6; c++) k.emoji('🥤', .6, -21 + c * .8, 1.4, -10); K.cola = { x: -19, z: -9 };
    k.sign('АЛКОГОЛЬ 18+', 5, .7, 18, 3.6, -9, 0, '#8a2a2a', '#fff', { ds: true }); k.b(5, 2.2, 1, 0xdde6f0, 18, 0, -10.6); for (var c2 = 0; c2 < 6; c2++) k.emoji('🍺', .6, 16 + c2 * .8, 1.4, -10); K.cider = { x: 18, z: -9 };
    // кассы
    for (var q = 0; q < 2; q++) { k.b(2.6, 1.0, 1.2, 0x3a3d44, -6 + q * 8, 0, 11); k.m(G.box, 0xff3a2a, [.5, .5, .5], [-6 + q * 8, 1.4, 11]); }
    K.clerk = k.npc('s3_clerk', 'Продавец', { top: 0xe8742a, pants: 0x1d1d28, hair: 0x4a3a2a, hairStyle: 'short', skin: 0xdba784, scale: 1 }, -2, 9.4, 0);
    // мясной отдел: прилавок + пластиковые шторы-двери
    k.b(14, 1.2, 1.6, 0xe4eaf0, -8, 0, -13.2); for (var m = 0; m < 6; m++) k.emoji(['🥩', '🍗', '🐟'][m % 3], .8, -13 + m * 1.9, 1.7, -13.2);
    K.meatSign = k.sign('МЯСНОЙ ОТДЕЛ', 6, 1.1, 8, 3.6, -14.3, 0, '#8a1010', '#fff', { fs: .5, ds: true });
    for (var s = 0; s < 8; s++) k.m(G.box, 0xe8f0f0, [.35, 2.7, .05], [5.4 + s * .5, 1.5, -14.2]);   // пластиковые шторы
    k.b(.3, 3.2, .3, 0x6a6e76, 5, 0, -14.2, { cam: false }); k.b(.3, 3.2, .3, 0x6a6e76, 11, 0, -14.2, { cam: false });
    k.sign('ТОЛЬКО ДЛЯ СОТРУДНИКОВ', 5, .5, 8, 3.0, -14.1, 0, '#d8342a', '#fff', { ds: true });
    k.cashSign = k.sign('ЦЕНЫ СНИЖЕНЫ!', 4, .6, 0, 3.2, 1, 0, '#e8200f', '#fff', { ds: true });
  }

  /* ---------- СТРАШНЫЙ СУПЕРМАРКЕТ ---------- */
  function wall(k, x0, z0, x1, z1, gaps, h, c, tex) {
    h = h || 4.8; c = c || 0xb8bcc0; var horiz = Math.abs(z1 - z0) < .01, a = horiz ? Math.min(x0, x1) : Math.min(z0, z1), b = horiz ? Math.max(x0, x1) : Math.max(z0, z1), t = .6;
    var cuts = (gaps || []).slice().sort(function (p, q) { return p[0] - q[0]; }), cur = a;
    cuts.forEach(function (g) { var g0 = g[0] - g[1] / 2, g1 = g[0] + g[1] / 2; if (g0 > cur) seg(cur, g0); cur = g1; }); if (cur < b) seg(cur, b);
    function seg(s, e) { if (horiz) k.b(e - s, h, t, c, (s + e) / 2, 0, z0); else k.b(t, h, e - s, c, x0, 0, (s + e) / 2); }
  }
  function room(k, x0, z0, x1, z1, floor, ceilC, gapsN, gapsS, gapsW, gapsE) {
    var w = x1 - x0, d = z1 - z0; k.plane(w, d, floor, (x0 + x1) / 2, (z0 + z1) / 2, .01); k.bp(w, .3, d, ceilC || 0x22262c, (x0 + x1) / 2, 4.8, (z0 + z1) / 2);
    wall(k, x0, z0, x1, z0, gapsN); wall(k, x0, z1, x1, z1, gapsS); wall(k, x0, z0, x0, z1, gapsW); wall(k, x1, z0, x1, z1, gapsE);
  }
  /* Коридор: клетки 1×1 м; стены строятся по границе области (углы замкнуты), а торцы, примыкающие к комнатам, остаются открытыми. */
  function corridor(k, pts, w, floor, rooms) {
    var cells = {}, ext = w / 2, n = pts.length;
    function inRoom(x, z) { return (rooms || []).some(function (r) { return x > r[0] && x < r[2] && z > r[1] && z < r[3]; }); }
    for (var s = 0; s < n - 1; s++) {
      var a = pts[s], b = pts[s + 1], horiz = Math.abs(a[1] - b[1]) < .01, ea = s > 0 ? ext : 0, eb = s < n - 2 ? ext : 0;
      var x0, x1, z0, z1;
      if (horiz) { var lo = a[0] < b[0] ? a : b, hi = a[0] < b[0] ? b : a, elo = a[0] < b[0] ? ea : eb, ehi = a[0] < b[0] ? eb : ea; x0 = lo[0] - elo; x1 = hi[0] + ehi; z0 = a[1] - w / 2; z1 = a[1] + w / 2; }
      else { var lo2 = a[1] < b[1] ? a : b, hi2 = a[1] < b[1] ? b : a, elo2 = a[1] < b[1] ? ea : eb, ehi2 = a[1] < b[1] ? eb : ea; z0 = lo2[1] - elo2; z1 = hi2[1] + ehi2; x0 = a[0] - w / 2; x1 = a[0] + w / 2; }
      k.plane(x1 - x0, z1 - z0, floor || 0x3a3d44, (x0 + x1) / 2, (z0 + z1) / 2, .01); k.bp(x1 - x0, .3, z1 - z0, 0x1a1d22, (x0 + x1) / 2, 4.2, (z0 + z1) / 2);
      for (var i = Math.round(x0); i < Math.round(x1); i++) for (var j = Math.round(z0); j < Math.round(z1); j++) cells[i + ',' + j] = 1;
    }
    var H = {}, Vv = {};   // горизонтальные рёбра: ключ по линии z, вертикальные: по линии x
    Object.keys(cells).forEach(function (key) {
      var p = key.split(','), i = +p[0], j = +p[1];
      [[0, -1, 'N'], [0, 1, 'S'], [-1, 0, 'W'], [1, 0, 'E']].forEach(function (d) {
        var ni = i + d[0], nj = j + d[1]; if (cells[ni + ',' + nj]) return; if (inRoom(ni + .5, nj + .5)) return;
        if (d[2] === 'N') (H['N' + j] = H['N' + j] || []).push(i); else if (d[2] === 'S') (H['S' + (j + 1)] = H['S' + (j + 1)] || []).push(i);
        else if (d[2] === 'W') (Vv['W' + i] = Vv['W' + i] || []).push(j); else (Vv['E' + (i + 1)] = Vv['E' + (i + 1)] || []).push(j);
      });
    });
    function runs(arr) { arr.sort(function (p, q) { return p - q; }); var out = [], st = arr[0], pv = arr[0]; for (var t = 1; t < arr.length; t++) { if (arr[t] === pv + 1) pv = arr[t]; else { out.push([st, pv + 1]); st = pv = arr[t]; } } out.push([st, pv + 1]); return out; }
    Object.keys(H).forEach(function (key) { var line = +key.slice(1), side = key[0] === 'N' ? -.25 : .25; runs(H[key]).forEach(function (r) { k.b(r[1] - r[0], 4.2, .5, 0x8a8f96, (r[0] + r[1]) / 2, 0, line + side); }); });
    Object.keys(Vv).forEach(function (key) { var line = +key.slice(1), side = key[0] === 'W' ? -.25 : .25; runs(Vv[key]).forEach(function (r) { k.b(.5, 4.2, r[1] - r[0], 0x8a8f96, line + side, 0, (r[0] + r[1]) / 2); }); });
  }
  var ANNS = ['На улице бургерная кончаются люди, там их больше не собираем.', 'Уважаемые покупатели, просьба не смотреть на потолок. Он смотрит в ответ.', 'Скидка 30% на товары, которых нет в наличии. Приходите за ними.', 'Касса №13 открыта для тех, кого нет в списках.', 'Сотрудникам Светофора напоминаем: улыбаться необязательно. Лица — тоже.', 'Мясной отдел закрылся навсегда. Открылся. Закрылся. Просим не уточнять.', 'Потерялся покупатель. Приметы: был. Просим вернуть на полку.', 'Акция «Два по цене одного» продлена. Одного — тоже.'];
  function buildHorror(k) {
    var R = rng(333);
    // — комнаты
    room(k, -14, -11, 14, 11, 0x2a2d33, 0x1a1d22, [], [], [[0, 4]], [[0, 4]]);                      // A: приёмка
    room(k, -52, -11, -20, 11, 0x24202c, 0x16121c, [], [], [], [[0, 4]]);                         // B: «Мистика»
    room(k, 20, -11, 48, 11, 0x22262e, 0x16181e, [[34, 4]], [], [[0, 4]], []);                     // C: Светофор-зал
    room(k, 20, -44, 48, -17, 0x3a2a2a, 0x1c1214, [], [[34, 4]], [[-30, 4]], []);                  // D: мясокомбинат
    var RM = [[-14, -11, 14, 11], [-52, -11, -20, 11], [20, -11, 48, 11], [20, -44, 48, -17], [-35, -66, -25, -56]];
    corridor(k, [[-14, 0], [-20, 0]], 4, 0x2a2d33, RM); corridor(k, [[14, 0], [20, 0]], 4, 0x2a2d33, RM);  // переходы A↔B, A↔C
    corridor(k, [[34, -11], [34, -17]], 4, 0x2a2d33, RM);                                              // C→D
    // — эвакуационный коридор из D в тупик (сразу виден, но закрыт дверью)
    var EV = [[20, -30], [-14, -30], [-14, -44], [-30, -44], [-30, -56]]; K.ev = EV;
    corridor(k, EV, 4, 0x4a2a2a, RM);
    // тупик (комната возврата)
    k.plane(10, 10, 0x3a2a2a, -30, -61, .01); k.bp(10, .3, 10, 0x1a1214, -30, 4.2, -61); k.b(.5, 4.2, 10, 0x8a8f96, -35.25, 0, -61); k.b(.5, 4.2, 10, 0x8a8f96, -24.75, 0, -61);
    k.b(2.75, 4.2, .5, 0x8a8f96, -33.875, 0, -66.25); k.b(2.75, 4.2, .5, 0x8a8f96, -26.125, 0, -66.25);   // постоянные части задней стены; середину (5 м) заберёт дыра
    k.b(3.5, 4.2, .5, 0x8a8f96, -33.75, 0, -55.75); k.b(3.5, 4.2, .5, 0x8a8f96, -26.25, 0, -55.75);   // северная стена тупика по бокам от входа из коридора
    K.deadWall = k.bp(5, 4.2, .5, 0x9aa0a8, -30, 0, -66.25); K.deadWall.position.y = 2.1; K.deadCol = k.col(-32.5, -27.5, -66.5, -66, 4.2);
    k.sign('КОМНАТА ВОЗВРАТА', 5, .6, -30, 3.3, -55.8, PI, '#4a1a1a', '#ffb0b0', { ds: true });
    // — A: приёмка
    for (var i = 0; i < 7; i++) k.plane(2, 22, [0xd8342a, 0xf2c230, 0x27ae60][i % 3], -12 + i * 4, 0, .02);
    k.sign('ДИКСИ × СВЕТОФОР — СОВМЕСТНОЕ ПРЕДПРИЯТИЕ', 14, 1.1, 0, 4.0, -10.6, 0, '#14181c', '#ffd23f', { fs: .4, ds: true });
    k.sign('ПРИЁМКА', 4, .6, 0, 3.4, 10.6, PI, '#2a2d33', '#e8e8e8', { ds: true });
    k.b(4, 1, 1.4, 0x3a3d44, 7, 0, 7); k.m(G.box, K.red = new THREE.MeshBasicMaterial({ color: 0xff2a2a }), [.5, .5, .3], [7, 1.4, 7]); k.sign('КАССА №13', 3, .5, 7, 2.5, 7, 0, '#14181c', '#ff6a6a', { ds: true });
    for (var c = 0; c < 4; c++) { k.b(.9, .8, 1.3, 0x8a8f96, -10 + c * 1.2, .4, 8, { cam: false }); }
    k.m(G.sph, 0xffffff, [.9, .9, .9], [0, 4.5, 0]); K.eye = k.m(G.sph, 0x111111, [.4, .4, .4], [0, 4.5, .35]);
    // — B: «Мистика»
    k.sign('ОТДЕЛ «МИСТИКА»', 8, .9, -36, 4.0, -10.6, 0, '#2a1a3a', '#c8a0ff', { ds: true });
    for (var s = 0; s < 4; s++) T.shelf(k, -46 + s * 6.5, -4, 5, true, 'groc', 400 + s, 0x3a3048);
    for (var e = 0; e < 5; e++) k.emoji('👁️', .8, -45 + e * 6, 1.4 + (e % 2) * .6, -4.9);
    k.m(G.box, 0xa8d4f0, [4, 3, .1], [-36, 1.8, 10.6]); k.sign('Зеркало. В нём отражение не твоё.', 4, .4, -36, 3.5, 10.5, PI, '#1a1020', '#c8a0ff', { ds: true });
    for (var l = 0; l < 5; l++) { k.b(1.4, 2.2, .8, 0x4a5058, -48 + l * 3.4, 0, 9.4); k.sign('№' + (l + 1), .7, .35, -48 + l * 3.4, 2.4, 9, 0, '#14181c', '#ffd23f', { ds: true }); }
    // — C: «Светофор-зал»
    k.sign('СВЕТОФОР · ЗАЛ', 8, .9, 34, 4.0, 10.6, PI, '#14181c', '#ffd23f', { ds: true });
    K.tl = { r: k.m(G.sph, new THREE.MeshBasicMaterial({ color: 0x550000 }), [1.2, 1.2, 1.2], [47.4, 3.7, 0]), y: k.m(G.sph, new THREE.MeshBasicMaterial({ color: 0x554400 }), [1.2, 1.2, 1.2], [47.4, 2.4, 0]), g: k.m(G.sph, new THREE.MeshBasicMaterial({ color: 0x005500 }), [1.2, 1.2, 1.2], [47.4, 1.1, 0]) };
    k.m(G.box, 0x15181c, [.6, 4.4, 1.8], [47.7, 2.4, 0]); k.sign('ЗЕЛЁНЫЙ — ИДИ · КРАСНЫЙ — ЗАМРИ', 10, .6, 34, 3.3, 10.6, PI, '#14181c', '#ffd23f', { ds: true });
    for (var z = -8; z <= 8; z += 4) { k.plane(.3, 3, 0xffffff, 28, z, .03); k.plane(.3, 3, 0xffffff, 40, z, .03); }
    for (var sh = 0; sh < 3; sh++) T.shelf(k, 24.6, -7 + sh * 6.6, 4, true, 'promo', 500 + sh, 0x4a3030);
    K.turnV = k.bp(2.4, 1.0, 1.2, 0x3a3d44, 34, 0, -9.4); K.turnCol = k.col(31.9, 36.1, -10.1, -8.7, 2.4); K.turn = { x: 34, z: -9.4 }; k.sign('ТУРНИКЕТ · ТОЛЬКО С БЕЙДЖЕМ', 5, .5, 34, 2.2, -10.5, 0, '#14181c', '#ff6a6a', { ds: true });
    // — D: мясокомбинат
    k.sign('СОВМЕСТНЫЙ МЯСОКОМБИНАТ ДИКСИ + СВЕТОФОР', 16, .9, 34, 4.1, -43.6, 0, '#3a0c0c', '#ffb0b0', { fs: .38, ds: true });
    for (var cv = 0; cv < 3; cv++) { k.b(18, .9, 1.6, 0x5a5f66, 34, 0, -39 + cv * 4.4, { cam: false }); k.m(G.box, 0x2a2d33, [18, .1, 1.7], [34, .95, -39 + cv * 4.4]); }
    for (var hk = 0; hk < 8; hk++) { k.m(G.cyl, 0x6a6e76, [.05, 2.2, .05], [24 + hk * 3.1, 3.7, -28]); k.m(G.sph, 0xb04a5a, [.6, .9, .5], [24 + hk * 3.1, 2.4, -28]); }
    K.pieces = []; var PS = [[24, -41], [44, -41], [24, -21], [44, -21], [46, -31], [26, -33]];
    PS.forEach(function (p, i) { var m = new THREE.Mesh(new THREE.SphereGeometry(.5, 10, 8), new THREE.MeshLambertMaterial({ color: [0xc23a4a, 0xa02a38, 0xd85a6a][i % 3] })); m.scale.set(1.2, .6, 1); m.position.set(k.ox + p[0], .35, k.oz + p[1]); k.g.add(m); K.pieces.push({ m: m, x: k.ox + p[0], z: k.oz + p[1], sx: k.ox + p[0], sz: k.oz + p[1] }); });
    K.fuseSpots = [[25, -41, 'Щиток №1 (у конвейера)'], [43, -42, 'Щиток №2 (у крюков)'], [46, -20, 'Щиток №3 (у холодильников)']];
    K.fuseSpots.forEach(function (f) { k.b(1.2, 1.8, .5, 0x4a5058, f[0], 0, f[1], { cam: false }); k.m(G.box, new THREE.MeshBasicMaterial({ color: 0xffd23f }), [.5, .35, .1], [f[0], 1.5, f[1] + .3]); });
    k.b(1.6, 2.2, .6, 0x4a5058, 21.2, 0, -33.4, { cam: false }); k.m(G.box, new THREE.MeshBasicMaterial({ color: 0xff3a2a }), [.8, .5, .1], [21.2, 1.6, -33.1]); K.panel = { x: 21.2, z: -33.4 };
    K.door = k.bp(.4, 3.6, 4, 0x4a2a2a, 20, 1.8, -30); K.doorCol = k.col(19.8, 20.2, -32, -28, 3.6); k.sign('ЭВАКУАЦИОННЫЙ ВЫХОД', 4, .5, 20.1, 3.7, -30, PI / 2, '#14181c', '#6aff9a', { ds: true });
    // «живое мясо» — собирается в центре комбината (скрыто до начала погони)
    var mass = new THREE.Group(); mass.visible = false; k.g.add(mass); K.massG = mass;
    var blobs = [[0, 1.0, 0, 1.6, 0xb02a3a], [.9, .8, .4, 1.0, 0xc23a4a], [-1, .7, .3, 1.1, 0xa02a38], [.3, 1.9, -.2, .9, 0xd85a6a], [-.6, 1.4, -.8, .8, 0xb83a4a], [.7, 1.3, .9, .7, 0xc84a5a]];
    K.blobBase = blobs.map(function (b) { return b[1]; });
    K.blobs = blobs.map(function (b) { var m = new THREE.Mesh(new THREE.SphereGeometry(b[3], 12, 10), new THREE.MeshLambertMaterial({ color: b[4] })); m.position.set(b[0], b[1], b[2]); mass.add(m); return m; });
    [[-.4, 1.9, 1.2], [.5, 1.6, 1.4]].forEach(function (p) { var e = new THREE.Mesh(new THREE.SphereGeometry(.25, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffffff })); e.position.set(p[0], p[1], p[2]); mass.add(e); var pu = new THREE.Mesh(new THREE.SphereGeometry(.11, 6, 6), new THREE.MeshBasicMaterial({ color: 0x111111 })); pu.position.set(p[0], p[1], p[2] + .2); mass.add(pu); });
    // — товары и надписи (читаемые)
    K.reads = [
      [-8, 2.5, 'dix_a', '🥫 Котлеты Мираторг', 'Состав: лучше не знать.', 'Срок годности: вчера, завтра, всегда. Масса нетто: растёт.'],
      [-6, -9, 'dix_b', '🍞 Хлеб «Помнящий»', 'Хлеб, который помнит, откуда ты.', 'Нарезан. Заново. Каждый раз.'],
      [-39, -3.4, 'dix_c', '🥛 Молоко 1998 года', 'Свежее, свернувшееся, обратно свежее.', 'Дата розлива: «до начала времён».'],
      [-43, -3.4, 'dix_d', '🥫 Консервы «Ближе, чем кажется»', 'Содержимое: ты, но на пять минут раньше.', 'Открывать только в присутствии свидетелей.'],
      [-33, -3.4, 'dix_e', '🧀 Сыр с дырой (дыра — отдельно)', 'Дыра фасуется в отдельный пакет.', 'Пожалуйста, не показывайте её сыру.'],
      [26, -4.4, 'dix_f', '🏷️ Ценник «СВЕТОФОР»', 'Красный — нельзя. Жёлтый — нельзя, но с улыбкой. Зелёный — можно, но не нужно.', 'Все цвета ведут в одну кассу.'],
      [28, -39, 'dix_g', '📋 График смен', 'Смена №0: круглосуточно. Смена №1: никогда. Смена №2: хором.', 'В графе «выходные» вписано «сами придут».']
    ];
    // — укрытия
    K.hides = [[-10, 6, 'в тележках'], [-26, -9, 'за стеллажом'], [28, 8, 'за стеллажом'], [40, -35, 'в холодильнике'], [-8, 6.5, '']];
    // — тупик за стеной: парковка и задняя стена Дикси
    k.plane(60, 40, 0x2a2d33, -30, -90, 0); k.m(G.box, 0xf08a1a, [30, 12, .6], [-30, 6, -112]); k.m(G.box, 0x1a1d22, [60, 6, .6], [-30, 3, -70]); K.lot = true;
    k.lamp(-18, -82, 0xffd890); k.b(1.9, .9, 4.2, 0xe5e7e9, -42, .3, -86); k.b(1.9, .9, 4.2, 0x2e86c1, -40, .3, -92);
    k.m(G.sph, new THREE.MeshBasicMaterial({ color: 0xffd890 }), [1.2, 1.2, 1.2], [-52, 14, -110]);
    // — NPC-сотрудники Светофора (безликие, высокие)
    K.staff = [];
    var routes = [
      [[-8, -6], [8, -6], [8, 6], [-8, 6]],                                  // в приёмке
      [[-48, -8], [-24, -8], [-24, 7], [-48, 7], [-36, 0]],                  // в «Мистике»
      [[24, -8], [44, -8], [44, 7], [24, 7]]                                 // в «Светофор-зале»
    ];
    routes.forEach(function (rt, i) {
      var a = k.npc('s3_staff' + i, 'Сотрудник Светофора', { top: 0x15171c, pants: 0x15171c, hair: 0x15171c, hairStyle: 'none', skin: 0xdadcdf, scale: 1.95, faceless: true, vest: [0xd8342a, 0xf2c230, 0x27ae60][i] }, rt[0][0], rt[0][1], 0);
      a.collide = true; K.staff.push({ a: a, rt: rt, i: 0, st: 'patrol', t: 0, last: null, home: rt[0], seen: 0, ox: k.ox, oz: k.oz });
    });
  }

  /* ====================== ИНТЕГРАЦИЯ В ОСНОВНОЙ МИР ====================== */
  var DX0 = 40, DZ0 = -16.2;             // место перед фасадом Дикси в городе
  function Q() { return T.P('svet'); }
  function avail() { return !!(S.q.points && !S.q.svet && Q().stage === 0); }
  function reset() { Object.assign(S3, { cola: false, cider: false, saw: false, badge: false, passed: false, fuses: 0, fuseGot: [false, false, false], doorOpen: false, chase: false, chasing: false, hide: false, hidden: false, grace: 0, caught: 0, finale: false, inside: false, meatT: 0, annT: 12, light: 'G', lightT: 4, lockers: [false, false, false, false, false], formed: false, caughtBusy: false }); MASS.trail = []; MASS.speed = 4.9; if (K.turnCol) { K.turnCol.on = true; K.turnV.visible = true; } }

  /* 1) Квартира: разговор с Гусем на кухне (после «5 000 000 баллов Максима») */
  function installFlat() {
    addI({ area: 'flat', p: { x: FLX + 4.6, z: FLZ + 2.4 }, r: 1.5, label: '🪿 Кухня: обсудить, кто идёт в магазин', ok: avail, act: svetIntro });
  }
  async function svetIntro() {
    await cutscene(async function () {
      await say([['marya', 'Иди купи мне Сидр.'], ['gus', 'Только за 150 рублей.'], ['marya', '…сама схожу…'], ['gus', 'Ну ладно, купи мне колу.'], ['marya', 'Сам сходи.'], ['gus', 'Окей, я тогда с тобой пойду..'], ['marya', 'Ближайший — Дикси. Пятёрочка далеко.'], ['gus', 'Дикси так Дикси. Что может пойти не так?']]);
      reset(); var q = Q(); q.stage = 1; q.cola = false; q.cider = false; T.save(); sfx('ding'); toast('📋 Новое дело: 🥩 Тайна Дикси и Светофора', 4200);
    });
  }
  T.hints.push(function () {
    if (!S.q.points || S.q.svet) return null; var q = Q();
    if (q.stage === 0) return { t: '🔴 Новое дело: на кухне у Гуся есть разговор про сидр и колу.', p: area === 'flat' ? { x: FLX + 4.6, z: FLZ + 2.4 } : (area === 'city' ? FLAT_DOOR : null) };
    if (T.lvl) return null;
    if (area === 'city' || area === 'flat') return { t: '🛒 Дикси — за сидром и колой.', p: area === 'flat' ? FLAT_DOOR : { x: DX0, z: DZ0 } };
    return null;
  });

  /* 2) Город: дверь Дикси, беглец */
  var runner = null, warned = false;
  function installCity() {
    T.actW('city', DX0, DZ0, '🛒 Войти в Дикси', function () { enterDixie(); }, 4.0, function () { return S.q.points && !S.q.svet && Q().stage >= 1; });
    T.ticks.push(function () { if (!warned && area === 'city' && S.q.points && !S.q.svet && Q().stage === 1 && Math.hypot(player.pos.x - DX0, player.pos.z - DZ0) < 16) runnerScene(); });
    T.alwaysTick = true;
  }
  async function runnerScene() {
    if (warned) return; warned = true;
    await cutscene(async function () {
      if (!runner) { runner = makeActor('s3_run', 'Мужчина', makePerson({ top: 0x6a7a8a, pants: 0x2a2a3a, hair: 0x5a5a5a, hairStyle: 'short', skin: 0xdba784, scale: 1 }), 'city'); }
      runner.g.visible = true; placeA(runner, DX0, DZ0 - 2.4, 0);
      await T.shotW(DX0 + 4, 3, DZ0 + 9, DX0, 1.6, DZ0 - 2, 1000);
      sfx('bonk'); await walkTo(runner, DX0, DZ0 + 2.5, 3.5);
      await say([['runner', 'НЕ ЗАХОДИТЕ В МЯСНОЙ ОТДЕЕЕЕЛЛЛ…']]);
      walkTo(runner, DX0 + 22, DZ0 + 14, 8.5); await wait(2600); runner.g.visible = false; placeA(runner, DX0, DZ0 - 2.4, 0);
      await T.shotOff(900);
      await say([['gus', 'Это что сейчас было?'], ['marya', 'Мужчина с мясом на душе. Пошли.'], ['gus', 'Мне как-то… не очень.'], ['marya', 'Кола ждёт.']]);
      Q().stage = 2; T.save();
    });
  }

  /* 3) Дикси изнутри */
  function buildAll() {
    if (built) return; built = true;
    K.dixie = T.makeArea('p3_dixie', 120); T.build('p3_dixie', buildDixie);
    K.hor = T.makeArea(PA, 260); T.build(PA, buildHorror);
    ITEMS.cola13 = ['🥤', 'Кола', 'Холодная. Подозрительно холодная.']; ITEMS.cider13 = ['🍺', 'Сидр', 'За 150 рублей. Дорого, но не для Гуся.'];
    EATL.cola13 = 'Холодная. Подозрительно холодная. Но вкусная.'; EATL.cider13 = 'Сидр. Всё равно не за 150.';
    T.ticks.push(tick); wire();
  }
  async function enterDixie() {
    var q = Q(); if (q.stage < 1 || S.q.svet) { toast('Дикси закрыт на переучёт.', 2400); return; }
    T.begin(3); L = T.lvl; buildAll(); reset(); S3.inside = true;
    if (invOf().indexOf('cola13') >= 0) S3.cola = true; if (invOf().indexOf('cider13') >= 0) S3.cider = true;
    for (var i = 0; i < T.items.length; i++) { var o = T.items[i]; if (o.area !== 'p3_dixie') continue; if (/Взять колу/.test(o.label)) o.off = S3.cola; if (/Взять сидр/.test(o.label)) o.off = S3.cider; }
    await T.go('p3_dixie', 0, 12, PI, '🛒 ДИКСИ');
    if (S3.cola && S3.cider) { S3.saw = true; T.setObj('🥩 Зайти в мясной отдел (шторки у задней стены).', 'p3_dixie', 8, -12); }
    else T.setObj('Взять колу (слева) и сидр (справа).', 'p3_dixie', K.cola.x, K.cola.z);
  }
  async function leaveDixie() { T.endLvl(); L = null; S3.inside = false; await T.moveTo('city', DX0, DZ0 + 1.2, 0, ''); }
  var iv = setInterval(function () { if (typeof worldReady !== 'undefined' && worldReady && typeof FLX !== 'undefined' && typeof addI === 'function' && T.actW) { installFlat(); installCity(); clearInterval(iv); } }, 300);

  function wire() {
    var A = function (a, x, z, label, fn, r, ok) { return T.act(a, x, z, label, fn, r, ok); };
    A('p3_dixie', 0, 13.2, '🚪 Выйти из Дикси', function () { leaveDixie(); }, 2.4, function () { return !S3.finale; });
    var oc = A('p3_dixie', K.cola.x, K.cola.z + 1.4, '🥤 Взять колу', function (o) { o.off = true; S3.cola = true; addItem('cola13'); sfx('ding'); toast('🥤 Кола в руке.', 1800); after2(); }, 2.2, function () { return !S3.cola; });
    oc.__cola = true;
    var od = A('p3_dixie', K.cider.x, K.cider.z + 1.4, '🍺 Взять сидр (150 ₽)', function (o) { o.off = true; S3.cider = true; addItem('cider13'); sfx('ding'); toast('🍺 Сидр в руке.', 1800); after2(); }, 2.2, function () { return !S3.cider; });
    A('p3_dixie', 8, -12.4, '🥩 Заглянуть в мясной отдел', toHorror, 3.2, function () { return S3.saw && !S3.finale; });
    A('p3_dixie', 8, -12.4, '🥩 Мясной отдел (сначала возьми колу и сидр)', function () { toast('Сначала колу и сидр.', 2000); }, 3.2, function () { return !S3.saw; });
    K.reads.forEach(function (r) { A(PA, r[0], r[1], r[3], function () { cutscene(function () { return say([['lbl', r[3] + '\n' + r[4]], ['sys', r[5]]]); }); }, 2.0); });
    // шкафчики «Мистики»
    for (var l = 0; l < 5; l++) (function (i) { A(PA, -48 + i * 3.4, 7.6, '🔓 Шкафчик №' + (i + 1), function (o) { lockerOpen(i, o); }, 1.8, function () { return !S3.lockers[i]; }); })(l);
    A(PA, K.turn.x, K.turn.z + 1.6, '🪪 Турникет', turnstile, 2.6, function () { return !S3.passed; });
    K.fuseSpots.forEach(function (f, i) { A(PA, f[0], f[1] + 1.4, '🔧 ' + f[2], function (o) { fuse(i, o); }, 2.2, function () { return !S3.fuseGot[i] && S3.passed; }); });
    A(PA, K.panel.x + 1.6, K.panel.z, '⚡ Главный щиток (вставить предохранители)', panel, 2.6, function () { return S3.passed && !S3.doorOpen; });
    // укрытия
    [[-10, 6.2], [-26, -9.4], [28, 8.4], [40, -34.6]].forEach(function (h, i) { A(PA, h[0], h[1], '🫥 Спрятаться', function () { hideIn(h); }, 1.8, function () { return !S3.hidden && !S3.chasing; }); });
    T.items.push({ area: PA, p: function () { return S3.hidden ? { x: player.pos.x, z: player.pos.z } : null; }, r: 3, label: '🚪 Вылезти', ok: function () { return S3.hidden; }, act: function () { unhide(); } }); addI(T.items[T.items.length - 1]);
    // тупик: триггер финала
    T.ticks.push(function () { if (area === PA && S3.chasing && !S3.finale && T.near(PA, -30, -60, 3.2)) trapped(); });
  }
  async function after2() {
    if (!(S3.cola && S3.cider) || S3.saw) return; S3.saw = true;
    await cutscene(async function () {
      await say([['gus', 'Колу взял. Сидр взял. Квартал бы не разгромил — и ладно.']]);
      var gp = comp.pos, Kd = K.dixie;
      comp.hidden = false; showComp(Kd.ox + 4, Kd.oz - 7); comp.yaw = PI; comp.pose = 'carry';
      var can = emojiSprite('🥤', .7); can.position.set(.1, 1.2, .3); comp.g.add(can);
      await T.shotTo('p3_dixie', 6, 2.2, -2, 4, 1.2, -7, 1100);                          // Гусь с колой
      await T.shotTo('p3_dixie', 4.4, 1.8, -6, 4, 1.7, -7.2, 1100);                        // приближение к лицу
      await T.shotTo('p3_dixie', 6.4, 2.6, -9, 8, 3.6, -14.3, 1300);                        // перевод на вывеску
      await wait(900); comp.yaw = Math.atan2(8 - 4, -14.3 + 7);                              // Гусь смотрит на вывеску
      await T.shotTo('p3_dixie', 6.8, 3.0, -9.4, 8, 3.6, -14.3, 700);
      await wait(1000);
      await say([['gus', '«Мясной отдел»…'], ['marya', 'Тот мужик кричал не заходить.'], ['gus', 'Но ведь он про кого-то другого.'], ['marya', 'Логично. Проверим.']]);
      comp.pose = 'walk'; comp.g.remove(can); await T.shotOff(900);
      T.setObj('🥩 Зайти в мясной отдел (шторки у задней стены).', 'p3_dixie', 8, -12);
    });
  }
  async function toHorror() {
    S3.finale = false;
    await cutscene(async function () {
      await say([['marya', 'Шторки. Холод. Запах металла.'], ['gus', 'Я иду за тобой. Шаг в шаг.']]);
      for (var i = 0; i < 6; i++) { var f = document.getElementById('fade'); f.style.transition = 'none'; f.style.opacity = i % 2 ? 0 : .9; sfx('bonk'); await wait(110); }
    });
    await T.go(PA, 0, 0, PI / 2, ''); S3.checkpoint = { x: 0, z: 0 }; S3.grace = 4;
    comp.hidden = false;
    await cutscene(async function () {
      await say([['gus', 'Это… не Дикси.'], ['marya', 'Это Дикси. Но и Светофор. Одновременно.'], ['gus', 'Они объединились?!'], ['voice', '«Добро пожаловать в совместное предприятие. Дикси × Светофор. Пожалуйста, не пугайтесь. Ну, если получится.»'], ['marya', 'Нам нужен выход. Ищем отделы, не попадаемся сотрудникам.']]);
    });
    T.setObj('🔴 Найти выход. Начни с отдела «Мистика» (запад).', PA, -30, 0);
    toast('👁 Сотрудники Светофора заметят тебя на свету и на бегу. Прячься (🫥).', 5200);
  }

  /* — «Мистика»: бейдж */
  async function lockerOpen(i, o) {
    S3.lockers[i] = true; o.off = true; var badgeIn = (i === 3);
    await cutscene(async function () {
      sfx('click');
      if (badgeIn) { await say([['sys', 'Шкафчик №4. Внутри — бейдж «СОТРУДНИК СВЕТОФОРА · ПРОБНЫЙ». И сменная улыбка.']]); S3.badge = true; T.setObj('🪪 Бейдж найден. К турникету в Светофор-зале (восток).', PA, 34, -8); banner('🪪 Бейдж сотрудника', 'Подходит к турникету'); }
      else await say([['sys', ['Шкафчик №' + (i + 1) + '. Пусто. Но кто-то уже вышел отсюда.', 'Шкафчик №' + (i + 1) + '. Внутри — аккуратно сложенное «до свидания».', 'Шкафчик №' + (i + 1) + '. Пахнет детством, которого не было.', '', 'Шкафчик №' + (i + 1) + '. В нём — зеркальце. В зеркале — ты, но улыбаешься.'][i]]]);
    });
  }
  /* — Светофор-зал */
  async function turnstile() {
    if (!S3.badge) { toast('🔒 Нужен бейдж сотрудника. Поищи в шкафчиках «Мистики».', 3200); return; }
    await cutscene(async function () { await say([['sys', 'Бейдж звякнул. Турникет шепнул «проходите». Это было неожиданно вежливо.']]); sfx('ding'); S3.passed = true; K.turnCol.on = false; K.turnV.visible = false; S3.checkpoint = { x: 34, z: -13 }; banner('✔ Турникет пройден', 'Мясокомбинат — на севере'); T.setObj('🔴 Мясокомбинат на севере. Найти 3 предохранителя.', PA, 34, -30); });
  }
  /* — комбинат */
  async function fuse(i, o) {
    o.off = true;
    await cutscene(async function () {
      sfx('click'); var g = await timing('trick', { label: 'Выкрути предохранитель!', speed: 1.0 + i * .1, scale: 1.15 });
      await say([['sys', g >= 2 ? 'Предохранитель выкручен. Тёплый, как пирожок.' : 'Искры. Рука онемела. Но предохранитель — в кармане.']]); S3.fuseGot[i] = true; S3.fuses++; banner('🔧 Предохранитель ' + S3.fuses + '/3', K.fuseSpots[i][2]);
      if (S3.fuses === 1) { S3.meatT = .01; await say([['gus', 'Ты слышишь? Что-то хлюпает.'], ['marya', 'Это куски мяса. Они… ползут друг к другу.'], ['gus', 'Я за то, чтобы не задерживаться.']]); }
      else if (S3.fuses === 3) T.setObj('⚡ Вставить предохранители в главный щиток у эвакуационной двери.', PA, K.panel.x, K.panel.z);
    });
  }
  async function panel() {
    if (S3.fuses < 3) { toast('🔧 Предохранителей: ' + S3.fuses + '/3.', 2400); return; }
    await cutscene(async function () {
      await say([['marya', 'Три из трёх. Вставляю.']]);
      var g = await timing('trick', { label: 'Вставь точно!', speed: 1.1, scale: 1.1 }); sfx('ding');
      S3.doorOpen = true; K.door.visible = false; K.doorCol.on = false; S3.checkpoint = { x: 18, z: -30 };
      await say([['voice', '«ВНИМАНИЕ. ЭВАКУАЦИОННЫЙ ВЫХОД ОТКРЫТ. ПРОСЬБА НЕ БЕЖАТЬ. ЕСЛИ ВЫ НЕ ОДИН — БЕЖАТЬ.»']]);
      await T.shotTo(PA, 34, 3.4, -24, 34, 1.4, -31, 900); await collapseMass(); await T.shotOff(800);
      await say([['gus', 'Оно… собралось.'], ['marya', 'БЕГИ!']]);
      S3.chasing = true; MASS.trail = []; MASS.speed = 4.9; S3.chase = true; T.setObj('🏃 БЕГИ по эвакуационному коридору!', PA, -30, -60);
    });
  }
  async function collapseMass() {
    var k = K.hor; K.massG.visible = true; K.massG.position.set(k.ox + 34, 0, k.oz - 30); K.massG.scale.set(.2, .2, .2); K.pieces.forEach(function (p) { p.m.visible = false; });
    for (var i = 0; i < 20; i++) { K.massG.scale.setScalar(.2 + i * .06); await wait(60); } sfx('bonk');
  }
  function hideIn(h) {
    S3.hidden = true; player.lock = true; player.g.visible = false; S3.hidePos = { x: player.pos.x, z: player.pos.z };
    toast('🫥 Ты спрятался. Сотрудники тебя не видят.', 2400);
  }
  function unhide() { S3.hidden = false; player.lock = false; player.g.visible = true; }

  /* ====================== ВРАГИ ====================== */
  function eye(a, h) { return { x: a.pos.x, y: (h || 1.7), z: a.pos.z }; }
  function nrm(x) { while (x > PI) x -= 2 * PI; while (x < -PI) x += 2 * PI; return x; }
  function seePlayer(s) {
    var a = s.a, dx = player.pos.x - a.pos.x, dz = player.pos.z - a.pos.z, d = Math.hypot(dx, dz);
    if (S3.hidden || d > 17) return false;
    var diff = Math.abs(nrm(Math.atan2(dx, dz) - a.yaw));                      // угол между взглядом и игроком
    if (diff > 1.25 && d > 4.5) return false;                                  // вне конуса зрения (≈143°), вплотную — замечают всегда
    try { var o = new THREE.Vector3(a.pos.x, 1.7, a.pos.z), t = new THREE.Vector3(player.pos.x, 1.2, player.pos.z); var dir = t.clone().sub(o); var len = dir.length(); dir.normalize(); rc.set(o, dir); rc.far = len; var hit = rc.intersectObjects(camBlock[PA] || [], false); if (hit.length) return false; } catch (e) { }
    return true;
  }
  function heard(s) { var d = Math.hypot(player.pos.x - s.a.pos.x, player.pos.z - s.a.pos.z); return !S3.hidden && d < 8.5 && (typeof runHeld !== 'undefined' && runHeld || (typeof keys !== 'undefined' && (keys.ShiftLeft || keys.ShiftRight))) && (Math.abs(player.vx || 0) + Math.abs(player.vz || 0) > .5 || (typeof joy !== 'undefined' && Math.hypot(joy.x, joy.y) > .3)); }
  function staffTick(dt) {
    if (area !== PA || !S3.inside && false) return;
    var k = K.hor, p = player.pos;
    K.staff.forEach(function (s) {
      var a = s.a; s.t += dt;
      var seen = seePlayer(s), hr = heard(s), moving = (typeof joy !== 'undefined' && Math.hypot(joy.x, joy.y) > .25);
      // «красный — замри»: движение в зале на красный
      var redZone = (S3.light === 'R' && T.near(PA, 34, 0, 1) === false && p.x > k.ox + 22 && p.x < k.ox + 46 && p.z > k.oz - 9 && p.z < k.oz + 9);
      if (redZone && moving && s.i >= 0 && s === K.staff[2]) { if (s.st !== 'chase') { s.st = 'chase'; alertFx(a, '🔴 «Красный! Замри!»'); } }
      if (s.st === 'patrol') {
        if (seen || hr) { s.st = 'chase'; s.t = 0; alertFx(a, seen ? '👁 Заметили!' : '👂 Услышали!'); }
        else { var w = s.rt[s.i % s.rt.length]; a.target = { x: k.ox + w[0], z: k.oz + w[1] }; a.tspeed = STAFF_SPEED.patrol; if (Math.hypot(a.pos.x - a.target.x, a.pos.z - a.target.z) < 1.2) s.i++; }
      } else if (s.st === 'chase') {
        if (seen) { s.last = { x: p.x, z: p.z }; s.lost = 0; } else s.lost = (s.lost || 0) + dt;
        a.target = s.last || { x: p.x, z: p.z }; a.tspeed = STAFF_SPEED.chase;
        if (S3.hidden && s.lost > .5) { s.st = 'search'; s.t = 0; }
        if (s.lost > 5) { s.st = 'search'; s.t = 0; }
        var d = Math.hypot(a.pos.x - p.x, a.pos.z - p.z); if (d < 1.6 && !S3.hidden) caught('staff');
      } else if (s.st === 'search') {
        a.target = s.last || a.target; a.tspeed = STAFF_SPEED.search;
        if (seen) { s.st = 'chase'; s.lost = 0; } else if (s.t > 6) { s.st = 'patrol'; s.last = null; }
      }
    });
  }
  var lastAlert = 0;
  function alertFx(a, t) { if (performance.now() - lastAlert > 1800) { lastAlert = performance.now(); toast(t, 1600); sfx('bonk'); } }
  function massTick(dt) {
    var k = K.hor;
    // мясо собирается
    if (S3.meatT > 0 && !S3.chasing && !S3.chase) {
      S3.meatT += dt; var u = Math.min(1, S3.meatT / 70); var cx = k.ox + 34, cz = k.oz - 30;
      K.pieces.forEach(function (p, i) { p.m.position.x = p.sx + (cx - p.sx) * u; p.m.position.z = p.sz + (cz - p.sz) * u; p.m.position.y = .35 + Math.abs(Math.sin(S3.meatT * 5 + i)) * .12; p.m.scale.set(1.2 + Math.sin(S3.meatT * 6 + i) * .15, .6, 1); });
      if (u >= 1 && !S3.chase && !S3.doorOpen) { K.pieces.forEach(function (p) { p.m.visible = false; }); K.massG.visible = true; K.massG.position.set(cx, 0, cz); K.massG.scale.setScalar(1.2); S3.formed = true; }
    }
    if (K.massG && K.massG.visible && S3.formed || S3.chasing) {
      var t = performance.now() / 1000; K.blobs.forEach(function (m, i) { m.position.y = K.blobBase[i] + Math.sin(t * 3 + i) * .12; m.scale.setScalar(1 + Math.sin(t * 4 + i * 1.3) * .06); });
    }
    if (!S3.chasing) return;
    // след игрока: масса идёт по его следу
    var p = player.pos, tr = MASS.trail, last = tr[tr.length - 1];
    if (!last || Math.hypot(p.x - last.x, p.z - last.z) > .5) tr.push({ x: p.x, z: p.z });
    MASS.speed = Math.min(MASS.max, MASS.speed + dt * .07);
    var m = K.massG, mx = m.position.x, mz = m.position.z, step = MASS.speed * dt;
    if (tr.length) { var tgt = tr[0], dx = tgt.x - mx, dz = tgt.z - mz, d = Math.hypot(dx, dz); if (d < .6) tr.shift(); else { var s = Math.min(d, step); m.position.x += dx / d * s; m.position.z += dz / d * s; m.rotation.y = Math.atan2(dx, dz); } }
    var dd = Math.hypot(m.position.x - p.x, m.position.z - p.z); MASS.dist = dd;
    if (dd < MASS.catchR && S3.grace <= 0 && !S3.finale) caught('mass');
    if (dd < 14 && Math.random() < dt * .8) toast(dd < 6 ? '🥩 ОНО ПРЯМО ЗА ТОБОЙ!' : '🥩 Оно близко!', 900);
  }
  function caught(by) {
    if (S3.grace > 0 || S3.finale || S3.caughtBusy) return; S3.caughtBusy = true; S3.caught++;
    (async function () {
      await cutscene(async function () {
        await fade(1, 400, by === 'mass' ? '🥩 Живое мясо поймало вас…' : '👁 Вас задержали «для проверки чека»'); await wait(500);
        var k = K.hor, cp = S3.checkpoint || { x: 0, z: 0 };
        if (S3.hidden) unhide();
        placeA(player, k.ox + cp.x, k.oz + cp.z, 0); showComp(k.ox + cp.x + 1.2, k.oz + cp.z + .6);
        K.staff.forEach(function (s) { s.st = 'patrol'; s.last = null; placeA(s.a, k.ox + s.home[0], k.oz + s.home[1], 0); });
        if (S3.chasing) { MASS.trail = []; MASS.speed = 4.9; K.massG.position.set(k.ox + 34, 0, k.oz - 30); }
        S3.grace = 3.5; await fade(0, 500);
        toast(by === 'mass' ? '🏃 Беги! Оно снова собралось.' : '👣 Осторожнее. Прячься (🫥) и не беги рядом.', 2800);
      }); S3.caughtBusy = false;
    })();
  }
  function lightTick(dt) {
    S3.lightT -= dt; if (S3.lightT <= 0) { var n = { G: 'Y', Y: 'R', R: 'G' }[S3.light]; S3.light = n; S3.lightT = { G: 5, Y: 1.6, R: 5 }[n]; var t = K.tl; if (t) { t.r.material.color.setHex(n === 'R' ? 0xff2a2a : 0x550000); t.y.material.color.setHex(n === 'Y' ? 0xffd23f : 0x554400); t.g.material.color.setHex(n === 'G' ? 0x2aff4a : 0x005500); } }
  }
  function annTick(dt) { S3.annT -= dt; if (S3.annT <= 0 && area === PA && !S3.finale) { S3.annT = 22 + Math.random() * 10; var a = ANNS[S3.ann++ % ANNS.length]; toast('📢 «' + a + '»', 5200); } }
  function tick(dt) {
    if (!L || L.n !== 3) return;
    if (S3.grace > 0) S3.grace -= dt;
    if (area !== PA) return;
    // каждая подсистема отдельно: сбой в оформлении (свет, глаз) не должен останавливать ИИ и погоню
    [function () { lightTick(dt); }, function () { annTick(dt); }, function () { staffTick(dt); }, function () { massTick(dt); }, function () { K.eye.position.x = Math.sin(performance.now() / 700) * .25; }].forEach(function (f) { try { f(); } catch (e) { console.error('[LEVEL3 tick]', e); } });
  }

  /* ====================== ТУПИК И ФИНАЛ ====================== */
  async function trapped() {
    if (S3.finale) return; S3.finale = true; S3.chasing = false; player.lock = false;
    var k = K.hor, bx = k.ox - 30, bz = k.oz - 66.25;
    await cutscene(async function () {
      await T.shotTo(PA, -30, 3.2, -53, -30, 1.4, -62, 700);
      await say([['marya', 'Тупик! Стена!'], ['gus', 'Нет-нет-нет… Дверей нет!']]);
      // позади — Живое мясо; по бокам появляются сотрудники Светофора
      K.massG.visible = true; K.massG.position.set(k.ox - 30, 0, k.oz - 44); K.massG.rotation.y = PI; K.massG.scale.setScalar(1.5);
      var spots = [[-33, -58], [-27, -58], [-30, -50]]; var tall = [];
      for (var i = 0; i < 3; i++) { var s = K.staff[i]; s.st = 'idle'; s.a.target = null; placeA(s.a, k.ox + spots[i][0], k.oz + spots[i][1], PI); s.a.g.visible = true; s.a.moving = false; tall.push(s.a); }
      await wait(700); sfx('bonk');
      await say([['svet', '*хором* Покупатели. Вы не оплатили проход. Вы не оплатили существование.'], ['gus', 'Мы можем оплатить картой!'], ['svet', 'Карта… «Перекрёсток». Не принимается.']]);
      await T.shotTo(PA, -30, 4.4, -46, -30, 1.2, -58, 700);
      // ДЫРА
      var hole = T.hole(k, -30, -57, .2, .02); hole.grow(.8); K.hole = hole; sfx('whoosh'); await wait(500);
      await say([['marya', 'Что это?!'], ['gus', 'Знакомое чёрное… Это та самая…']]);
      hole.grow(9); await wait(900);
      // всё в радиусе втягивается: мясо, сотрудники, кусок стены и потолка
      var pulls = [{ g: K.massG }, { g: tall[0].g }, { g: tall[1].g }, { g: tall[2].g }, { g: K.deadWall }];
      var ceil = []; pulls.forEach(function (p) { p.sx = p.g.position.x; p.sy = p.g.position.y; p.sz = p.g.position.z; });
      var cx = k.ox - 30, cz = k.oz - 57; var t0 = performance.now(), T_ = 3200; sfx('whoosh');
      await new Promise(function (res) { (function f() { var u = Math.min(1, (performance.now() - t0) / T_), e = u * u; pulls.forEach(function (p) { p.g.position.x = p.sx + (cx - p.sx) * e; p.g.position.z = p.sz + (cz - p.sz) * e; p.g.position.y = p.sy * (1 - e) + Math.sin(u * PI) * 1.2; var sc = Math.max(.001, 1 - e); p.g.scale.setScalar(sc * (p.g === K.massG ? 1.5 : (p.g === K.deadWall ? 1 : 1.95))); if (p.g === K.massG) p.g.rotation.y += .2; else p.g.rotation.y += .05 + e * .3; }); if (u < 1) requestAnimationFrame(f); else res(); })(); });
      K.massG.visible = false; K.deadWall.visible = false; K.deadCol.on = false; tall.forEach(function (a) { a.g.visible = false; });
      hole.grow(1.4); await wait(500);
      await say([['gus', 'Она… забрала всё. Мясо. Сотрудников. Кусок стены. Даже запах.'], ['marya', 'Она нас спасла?'], ['gus', 'Не знаю. Но дорога свободна. Идём. Быстро.']]);
      await T.shotOff(800);
    });
    // побег: выход через пролом на парковку
    await cutscene(async function () {
      await walkTo(player, k.ox - 30, k.oz - 70, 5.5); walkTo(comp, k.ox - 29, k.oz - 70, 5.5); await wait(900);
      await T.shotTo(PA, -34, 3.2, -78, -30, 2.4, -66, 900);
      await say([['marya', 'Мы вышли. Парковка. Ночь. Холодно. Нормально.'], ['gus', 'Смотри. Дыра.']]);
      var h = K.hole; h.set(1.4); h.grow(1.2); await wait(1200);
      // дыра возвращается «на своё место»: взлетает и исчезает, улетая в сторону города
      var t0 = performance.now(), T_ = 3200, g = h.g, sy = g.position.y, sx = g.position.x, sz = g.position.z; sfx('whoosh');
      await new Promise(function (res) { (function f() { var u = Math.min(1, (performance.now() - t0) / T_); g.rotation.x = u * 1.4; g.position.x = sx + u * 18; g.position.y = sy + u * 26; g.position.z = sz - u * 20; g.scale.setScalar(Math.max(.05, 1 - u * .9)); if (u < 1) requestAnimationFrame(f); else res(); })(); });
      g.visible = false; await T.shotOff(900);
      await say([['gus', 'Она улетела.'], ['marya', 'На своё прежнее место. В город.'], ['gus', 'Я не буду спрашивать, что это.'], ['marya', 'И правильно. Пока.'], ['gus', 'А кола?'], ['marya', '…холодная. Подозрительно холодная.'], ['gus', 'Беру.']]);
    });
    T.endLvl(); L = null; S3.inside = false;
    await T.moveTo('city', DX0, DZ0 + 1.2, 0, '');
    await cutscene(async function () { await say([['gus', 'Мы снова в городе. Дикси стоит на месте. Целый.'], ['marya', 'Не будем проверять изнутри.'], ['gus', 'Ни за что.']]); });
    Q().stage = 3; complete('svet'); T.save(); toast('✔ Дело закрыто: Тайна Дикси и Светофора', 4200);
  }

  window.MG_L3 = { enterDixie: enterDixie, leaveDixie: leaveDixie, svetIntro: svetIntro, Q: Q, avail: avail, S3: S3, K: K, MASS: MASS, ANNS: ANNS, caught: caught, trapped: trapped, seePlayer: seePlayer, massTick: massTick, staffTick: staffTick, lightTick: lightTick, reset: reset };
})();
