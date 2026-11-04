/* =====================================================================
   МГИАГ 1.12 «Карта и удобство» — ЧЕТЫРЕ НОВЫХ РАЙОНА
   «Старая верфь» · «Неоновый квартал» · «Ботанический бульвар» · «Стеклянный квартал»
   Районы собраны по тому же принципу, что и остальные отдельные места игры (мастерская, ТЦ, лаборатория):
   отдельная область со своей геометрией, коллизиями и интерактивными точками. Это не затрагивает
   коллизии и дороги основного города. Район строится при первом визите (если вдруг что-то пойдёт не так,
   город продолжит работать как обычно).
   Связь с городом — маршрутки на четырёх существующих остановках.
   ===================================================================== */
(function () {
  'use strict';
  var D = window.MG_DIST = { dist: {}, inter: {}, biz: [], built: {} };
  var PI = Math.PI;
  function rdy() { return typeof worldReady !== 'undefined' && worldReady && typeof setArea === 'function' && typeof addI === 'function' && typeof box === 'function' && typeof makeActor === 'function' && typeof cityG !== 'undefined'; }
  function rngf(seed) { var s = seed >>> 0; return function () { s = (s + 0x6D2B79F5) >>> 0; var t = s; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function bizCall(k, a) { if (window.MG_BIZ && MG_BIZ[k]) return MG_BIZ[k](a); toast('Заведение закрыто на ремонт.', 2000); }

  /* ---------------- инструментарий строительства (локальные координаты района) ---------------- */
  function Kit(id, ox, oz) {
    var g = new THREE.Group(); scene.add(g); g.visible = false; g.userData.area = id; camBlock[id] = camBlock[id] || [];
    var K = { g: g, ox: ox, oz: oz, id: id, anims: [] };
    K.b = function (w, h, d, c, x, y, z, o) { return box(g, w, h, d, c, ox + x, y, oz + z, Object.assign({ cam: true }, o || {})); };
    K.bp = function (w, h, d, c, x, y, z) { return box(g, w, h, d, c, ox + x, y, oz + z, {}); };           // без коллизии и без блокировки камеры
    K.m = function (geo, c, s, p, r) { return M_(g, geo, c, s, [ox + p[0], p[1], oz + p[2]], r, false); };
    K.col = function (x0, x1, z0, z1, h) { var c = addCol(ox + x0, ox + x1, oz + z0, oz + z1); c.h = h || 3; return c; };
    K.colC = function (x, z, r, h) { return addColC(ox + x, oz + z, r, h || 3); };
    K.plane = function (w, d, c, x, z, y, ry, o) { var mt = (typeof c === 'object') ? c : mat(c); var m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mt); m.rotation.x = -PI / 2; if (ry) m.rotation.z = ry; m.position.set(ox + x, y || 0, oz + z); g.add(m); return m; };
    K.disc = function (r, c, x, z, y, seg) { var m = new THREE.Mesh(new THREE.CircleGeometry(r, seg || 32), (typeof c === 'object') ? c : mat(c)); m.rotation.x = -PI / 2; m.position.set(ox + x, y || .02, oz + z); g.add(m); return m; };
    K.sign = function (t, w, h, x, y, z, ry, bg, fg, o) { return sign(g, t, w, h, ox + x, y, oz + z, ry || 0, bg, fg, Object.assign({ ds: true }, o || {})); };
    K.glow = function (c) { return new THREE.MeshBasicMaterial({ color: c }); };
    K.glassMat = function () { return Kit.glass(); };
    K.emoji = function (e, s, x, y, z) { var sp = emojiSprite(e, s); sp.position.set(ox + x, y, oz + z); g.add(sp); return sp; };
    K.lamp = function (x, z, c) { K.m(G.cyl, 0x3c4048, [.14, 4.6, .14], [x, 2.3, z]); K.m(G.sph, K.glow(c || 0xfff0c0), [.55, .55, .55], [x, 4.75, z]); K.colC(x, z, .2, 4.5); };
    K.tree = function (x, z, kind, s) { s = s || 1; K.m(G.cyl, kind === 'birch' ? 0xeeeeee : 0x5b3d29, [.3 * s, 2.2 * s, .3 * s], [x, 1.1 * s, z]);
      if (kind === 'cone') { K.m(G.cone, 0x2f6a48, [2.4 * s, 3.4 * s, 2.4 * s], [x, 3.2 * s, z]); K.m(G.cone, 0x3a7a55, [1.7 * s, 2.4 * s, 1.7 * s], [x, 4.6 * s, z]); }
      else if (kind === 'birch') { K.m(G.sph, 0xa6c96a, [1.9 * s, 2.5 * s, 1.9 * s], [x, 3.4 * s, z]); }
      else { K.m(G.sph, 0x4f9a52, [2.6 * s, 2.2 * s, 2.6 * s], [x, 3.2 * s, z]); K.m(G.sph, 0x66b25c, [1.7 * s, 1.5 * s, 1.7 * s], [x + .5 * s, 4.2 * s, z + .2 * s]); }
      K.colC(x, z, .35 * s, 4); };
    K.bench = function (x, z, ry) { var q = new THREE.Group(); q.position.set(ox + x, 0, oz + z); q.rotation.y = ry || 0; g.add(q); M_(q, G.box, 0x8a5a34, [1.8, .1, .5], [0, .5, 0], null, false); M_(q, G.box, 0x8a5a34, [1.8, .45, .08], [0, .78, -.22], null, false); M_(q, G.box, 0x3a3d44, [.1, .5, .4], [-.8, .25, 0], null, false); M_(q, G.box, 0x3a3d44, [.1, .5, .4], [.8, .25, 0], null, false); var sw = Math.abs(Math.sin(ry || 0)) > .5; K.col(x - (sw ? .3 : 1), x + (sw ? .3 : 1), z - (sw ? 1 : .3), z + (sw ? 1 : .3), .6); };
    K.npc = function (idn, name, look, x, z, yaw) { var a = makeActor(idn, name, makePerson(look), id); g.add(a.g); placeA(a, ox + x, oz + z, yaw || 0); a.area = id; a.pose = 'walk'; return a; };
    K.addBiz = function (key, x, z, label, fn, r, ok) { var o = addI({ area: id, p: { x: ox + x, z: oz + z }, r: r || 2.4, label: label, ok: ok, act: fn }); D.biz.push({ area: id, key: key, x: ox + x, z: oz + z, label: typeof label === 'string' ? label : key }); return o; };
    K.perimeter = function (half, h, c, o) { var t = 1.2; K.b(half * 2 + 6, h, t, c, 0, 0, -half - 1, o); K.b(half * 2 + 6, h, t, c, 0, 0, half + 1, o); K.b(t, h, half * 2 + 6, c, -half - 1, 0, 0, o); K.b(t, h, half * 2 + 6, c, half + 1, 0, 0, o); };
    K.road = function (w, d, x, z, horiz, c, line) { K.plane(w, d, c || 0x3b3f47, x, z, .02); K.plane(w + 0, d, 0x000000, x, z, -1); var n = Math.floor((horiz ? w : d) / 8); for (var i = 0; i < n; i++) { var p = -((horiz ? w : d) / 2) + 4 + i * 8; K.plane(horiz ? 3 : .35, horiz ? .35 : 3, line || 0xe9e4c8, horiz ? x + p : x, horiz ? z : z + p, .035); } };
    K.cross = function (x, z, horiz, len, c) { for (var i = 0; i < 6; i++) K.plane(horiz ? .7 : len / 6 - .4, horiz ? len / 6 - .4 : .7, c || 0xf2f2f2, horiz ? x : x - len / 2 + len / 12 + i * len / 6, horiz ? z - len / 2 + len / 12 + i * len / 6 : z, .04); };
    K.busStop = function (x, z, ry, name, back) {
      var q = new THREE.Group(); q.position.set(ox + x, 0, oz + z); q.rotation.y = ry; g.add(q);
      M_(q, G.box, 0x3a3d44, [5, .15, 2.2], [0, 2.6, 0], null, false); M_(q, G.box, 0x9fc4dc, [5, 2.4, .08], [0, 1.3, -1], null, false); M_(q, G.box, 0x8a5a34, [3, .1, .5], [0, .5, -.6], null, false);
      for (var s = -2.4; s <= 2.4; s += 4.8) M_(q, G.box, 0x3a3d44, [.12, 2.6, .12], [s, 1.3, -.9], null, false);
      sign(q, '🚏 ' + name, 3.4, .45, 0, 3.05, .02, 0, '#1f4f8a', '#ffffff', { fs: .38 });
      var c = Math.abs(Math.sin(ry)) > .5; K.col(x - (c ? 1.1 : 2.5), x + (c ? 1.1 : 2.5), z - (c ? 2.5 : 1.1), z + (c ? 2.5 : 1.1), 3);
      K.addBiz('back', x + Math.sin(ry) * 2.2, z + Math.cos(ry) * 2.2, '🚌 Маршрутка в город', back, 3.4, function () { return !player.drive; }); };
    return K;
  }

  /* ============================================================
     РАЙОН 1 — «СТАРАЯ ВЕРФЬ»: порт, маяк, рыбалка, ломбард, мастерская
     ============================================================ */
  function buildDock(K) {
    var R = rngf(11);
    K.plane(320, 320, 0x8a8f86, 0, 20, 0);                                // бетонное основание
    K.plane(320, 80, 0x2f7fa8, 0, -90, -.35);                              // вода (ниже набережной)
    K.plane(160, 7, 0x7a5a3a, 0, -27, .03);                               // деревянная набережная
    K.plane(160, 16, 0xb4b3ab, 0, -16, .02);                              // променад
    K.road(168, 10, 0, 8, true, 0x3b3f47);                                // дорога вдоль порта
    K.plane(168, 4, 0xb4b3ab, 0, 2, .025); K.plane(168, 4, 0xb4b3ab, 0, 14, .025);
    K.cross(6, 8, false, 10, 0xf2f2f2);
    // набережная: парапет с перилами (виден и ограничивает), пирс — проход
    [[-80, -7.5], [7.5, 80]].forEach(function (s) { K.b(s[1] - s[0], 1.1, .5, 0x6a6a68, (s[0] + s[1]) / 2, 0, -30.8); for (var x = s[0] + 2; x <= s[1] - 2; x += 8) K.m(G.cyl, 0x3a3d44, [.12, 1.5, .12], [x, 1.5, -30.8]); K.m(G.box, 0x9aa0a8, [s[1] - s[0], .08, .1], [(s[0] + s[1]) / 2, 1.9, -30.8]); });
    K.bp(12, .3, 40, 0x8b6b43, 0, -.2, -50);                               // пирс
    K.b(.35, 1, 38, 0x6b4b2b, -6.2, 0, -50); K.b(.35, 1, 38, 0x6b4b2b, 6.2, 0, -50); K.b(12.7, 1, .4, 0x6b4b2b, 0, 0, -69.4);
    for (var pz = -32; pz > -69; pz -= 6) { K.m(G.cyl, 0x5a3f22, [.5, 1.6, .5], [-6.2, .8, pz]); K.m(G.cyl, 0x5a3f22, [.5, 1.6, .5], [6.2, .8, pz]); }
    K.m(G.cyl, 0xd8342a, [.6, 1.1, .6], [0, 1.0, -68.6]); K.m(G.sph, K.glow(0xffe08a), [.5, .5, .5], [0, 1.7, -68.6]);   // фонарь на конце пирса
    K.addBiz('fish1', -3, -48, '🎣 Рыбачить', function () { bizCall('fish'); }, 2.6);
    K.addBiz('fish2', 3.5, -58, '🎣 Рыбачить', function () { bizCall('fish'); }, 2.6);
    K.addBiz('fish3', -3, -66, '🎣 Рыбачить', function () { bizCall('fish'); }, 2.6);
    // лодки у причала: траулер и вельбот — разные
    var tr = new THREE.Group(); tr.position.set(K.ox + 32, 0, K.oz - 44); K.g.add(tr);
    M_(tr, G.box, 0x2d5f8a, [4.4, 1.5, 13], [0, -.2, 0], null, false); M_(tr, G.box, 0xd8d2c4, [3.4, 2, 4], [0, 1.5, 2.2], null, false); M_(tr, G.box, 0x3b2a1f, [2.6, .6, .1], [0, 1.9, 4.25], null, false);
    M_(tr, G.cyl, 0x3a3d44, [.2, 6, .2], [0, 4, -1.5], null, false); M_(tr, G.box, 0xd8342a, [4.46, .3, 13.06], [0, .45, 0], null, false); M_(tr, G.box, 0xf2c230, [.12, .12, 4], [0, 5.4, -1.5], null, false);
    tr.userData.bob = true; K.anims.push(function (t) { tr.position.y = Math.sin(t * 1.3) * .06; tr.rotation.z = Math.sin(t * 1.1) * .015; });
    var rb = new THREE.Group(); rb.position.set(K.ox - 28, 0, K.oz - 40); rb.rotation.y = .5; K.g.add(rb);
    M_(rb, G.box, 0x9a6a3a, [1.8, .55, 4.4], [0, -.05, 0], null, false); M_(rb, G.box, 0xe8e0c8, [1.5, .08, 4.0], [0, .25, 0], null, false); M_(rb, G.box, 0x6b4b2b, [.1, .1, 2.4], [-1.2, .5, .5], [0, 0, .5], false); M_(rb, G.box, 0x6b4b2b, [.1, .1, 2.4], [1.2, .5, .5], [0, 0, -.5], false);
    K.anims.push(function (t) { rb.position.y = Math.sin(t * 1.7 + 1) * .05; });
    // ——— маяк (ориентир)
    K.b(7, 1.2, 7, 0x77797f, 62, 0, -10);
    var cols = [0xd8342a, 0xf2f2f2, 0xd8342a, 0xf2f2f2, 0xd8342a]; for (var i = 0; i < 5; i++) K.m(G.cyl, cols[i], [3.8 - i * .35, 3.6, 3.8 - i * .35], [62, 1.2 + 1.8 + i * 3.6, -10]);
    K.m(G.cyl, 0x2a2a2e, [4.6, .4, 4.6], [62, 20.4, -10]); var lampM = K.glow(0xfff0a0); var lamp = K.m(G.cyl, lampM, [2, 2, 2], [62, 21.6, -10]); K.m(G.cone, 0x2a2a2e, [3, 2.2, 3], [62, 23.7, -10]);
    var beam = K.m(G.box, K.glow(0xfff6c0), [14, .25, .8], [62, 21.6, -10]); beam.material.transparent = true; beam.material.opacity = .45;
    K.anims.push(function (t) { beam.rotation.y = t * 1.2; });
    K.colC(62, -10, 3.2, 22);
    K.sign('МАЯК «ГУСИНЫЙ ПАЛЕЦ»', 4.4, .5, 62, 2.6, -6.3, 0, '#1d2129', '#ffd23f', { fs: .4 });
    K.addBiz('lighthouse', 62, -6.2, '🔦 Осмотреть маяк', function () { bizCall('lighthouse'); }, 3.2);
    // ——— рыбный причал «Улов дня»
    K.m(G.box, 0x6b4b2b, [.3, 3.2, .3], [-60, 1.6, -9], null); K.m(G.box, 0x6b4b2b, [.3, 3.2, .3], [-38, 1.6, -9]); K.m(G.box, 0x6b4b2b, [.3, 3.2, .3], [-60, 1.6, -2]); K.m(G.box, 0x6b4b2b, [.3, 3.2, .3], [-38, 1.6, -2]);
    for (var s = 0; s < 8; s++) K.m(G.box, s % 2 ? 0x2e86c1 : 0xf2f2f2, [22, .15, .9], [-49, 3.3 + s * .0, -9 + s * .9]);
    K.b(20, 1, 1.2, 0xc9b08a, -49, 0, -5.5); K.b(1.2, 1, 5, 0xc9b08a, -58, 0, -6.5);
    for (var c = 0; c < 4; c++) { K.m(G.box, 0xb08850, [1, .6, .8], [-56 + c * 5, 1.3, -5.5]); K.emoji(c % 2 ? '🐟' : '🦀', .9, -56 + c * 5, 2.0, -5.5); }
    K.sign('УЛОВ ДНЯ · РЫБА', 6, .7, -49, 4.1, -2, 0, '#1f4f8a', '#fff', { fs: .5 });
    K.npc('dock_fish', 'Рыбак', { top: 0xe8c04a, pants: 0x3a4a5a, hair: 0x6a6a6a, hairStyle: 'short', skin: 0xdba784, scale: 1 }, -49, -8, 0);
    K.addBiz('fishmarket', -49, -3.4, '🐟 Рыбный причал', function () { bizCall('fishMarket'); }, 2.8);
    // ——— ломбард «Золотой зуб»
    K.b(18, 8, 14, 0x8b4a3a, -62, 0, 32); K.b(18.4, .8, 14.4, 0x4a3a30, -62, 8, 32);
    for (var y = 0; y < 2; y++) for (var x = 0; x < 3; x++) K.m(G.box, 0xf0d890, [2, 1.6, .12], [-69 + x * 7, 2.6 + y * 3.2, 24.9]);
    K.m(G.box, 0x1d2129, [2.4, 3.2, .2], [-62, 1.6, 24.9]); K.m(G.box, 0x3a3d44, [.1, 1.6, .1], [-60, 1.6, 24.8]);
    K.sign('ЛОМБАРД «ЗОЛОТОЙ ЗУБ»', 9, .9, -62, 7.2, 24.9, 0, '#2a1d00', '#ffd23f', { fs: .4 }); K.emoji('🦷', 2.4, -62, 10.4, 25.1);
    K.addBiz('pawn', -62, 22.4, '💎 Ломбард', function () { bizCall('pawn'); }, 2.6);
    K.npc('dock_pawn', 'Ростовщик', { top: 0x3a2a2a, pants: 0x1d2129, hair: 0x222222, hairStyle: 'short', skin: 0xe7be9a, scale: 1 }, -62, 25.8, PI);
    // ——— таверна «Ржавый якорь» (двухэтажная, фахверк)
    K.b(24, 5, 15, 0x7a5a3a, -28, 0, 32); K.b(24.6, 5, 15.6, 0x8a6a46, -28, 5, 32); K.b(25.6, .7, 16.6, 0x3a2a20, -28, 10, 32);
    for (var q = 0; q < 6; q++) K.m(G.box, 0x3a2a20, [.35, 10, .3], [-39.5 + q * 4.4, 5, 24.5]);
    for (var yy = 0; yy < 2; yy++) for (var xx = 0; xx < 4; xx++) K.m(G.box, 0xffe9a8, [1.8, 1.6, .12], [-36 + xx * 5.6, 2.7 + yy * 5, 24.4]);
    K.m(G.box, 0x1d2129, [2.2, 3.3, .2], [-28, 1.65, 24.4]);
    K.sign('«РЖАВЫЙ ЯКОРЬ»', 8, .9, -28, 7.4, 24.3, 0, '#2a1d00', '#e8c070', { fs: .45 }); K.emoji('⚓', 2.2, -20, 5.4, 24.2);
    K.b(10, 1, 1.2, 0x6b4b2b, -28, 0, 21.2); for (var st = 0; st < 3; st++) K.m(G.cyl, 0x4a2a1a, [.7, .8, .7], [-31 + st * 3, .4, 19.8]);
    K.addBiz('tavern', -28, 19, '⚓ Таверна', function () { bizCall('tavern'); }, 2.8);
    // ——— мастерская «Гайка и Гусь» (вход в интерьер)
    K.b(26, 9, 15, 0x9aa0a8, 6, 0, 32); for (var k = 0; k < 13; k++) K.m(G.box, 0x8a9098, [.12, 9, .16], [-6.5 + k * 2, 4.5, 24.4]);
    K.m(G.box, 0xd8d2c4, [8, 6, .2], [6, 3, 24.45]); for (var l = 0; l < 6; l++) K.m(G.box, 0xc2bcae, [8, .1, .22], [6, .8 + l, 24.5]);
    K.m(G.cyl, 0xf2c230, [3.2, .3, 3.2], [-4, 9.8, 24.2], [PI / 2, 0, 0]); K.sign('ГАЙКА И ГУСЬ · СТО', 9, .9, 6, 7.8, 24.3, 0, '#2a2e36', '#f2c230', { fs: .4 });
    K.addBiz('garage', 6, 22.6, '🔧 Войти в мастерскую', function () { D.enter('garage', 'dock', 6, 22.2); }, 3.4);
    // ——— склад с пилообразной крышей и контейнерами
    K.b(36, 7, 20, 0x6a7078, 52, 0, 38); for (var sw = 0; sw < 4; sw++) { K.m(G.box, 0x4a4f56, [9, 3, 20.4], [37 + sw * 9, 8.5, 38], [0, 0, 0], false); K.m(G.box, 0x9fc4dc, [.1, 2.4, 20], [41.4 + sw * 9, 8.7, 38]); }
    K.sign('ПАКГАУЗ №3', 7, .8, 52, 5.6, 27.9, 0, '#d8342a', '#fff', { fs: .5 });
    K.b(12, 2.6, 2.8, 0xc0392b, 28, 0, 62); K.b(12, 2.6, 2.8, 0x2e86c1, 41, 0, 63.4); K.b(12, 2.6, 2.8, 0xf1c40f, 36, 2.6, 62.6);
    // ——— портальный кран над площадкой
    K.b(1.2, 17, 1.2, 0xd88a2a, 36, 0, -10); K.b(1.2, 17, 1.2, 0xd88a2a, 52, 0, -10); K.bp(18, 1.6, 2.2, 0xd88a2a, 44, 17, -10); K.bp(30, 1, 1, 0xb8731f, 44, 18.6, -10);
    K.m(G.cyl, 0x2a2a2e, [.12, 8, .12], [44, 12.5, -10]); K.m(G.box, 0x2a2a2e, [1.4, 1, 1.4], [44, 8, -10]); K.b(4.5, 2.2, 2, 0x2e86c1, 44, 0, -10, { cam: false });
    // ——— нефтяные цистерны
    K.b(7, 7, 7, 0xd8d8d0, 68, 0, 10); K.m(G.cyl, 0xd8342a, [7.1, .8, 7.1], [68, 2, 10]); K.colC(68, 10, 3.6, 7);
    // фонари набережной
    for (var lx = -70; lx <= 70; lx += 28) K.lamp(lx, -22, 0xfff0c0);
    for (var bx = -20; bx <= 20; bx += 40) K.bench(bx, -20, 0);
    // периметр порта: бетонная стена с предупреждающей полосой
    K.perimeter(82, 2.2, 0x7a7f86); K.b(166, .5, .3, 0xf2c230, 0, 1.6, 82.4, { cam: false });
    K.sign('СТАРАЯ ВЕРФЬ', 9, 1.1, 0, 4.2, 82.4, PI, '#1f4f8a', '#fff', { fs: .5 });
    K.busStop(0, 70, 0, 'Старая верфь', function () { D.toCity('dock'); });
    K.npc('dock_dog', 'Докер', { top: 0xe8742a, pants: 0x2a3a5a, hair: 0x333333, hairStyle: 'short', skin: 0xdba784, scale: 1 }, 20, 16, -PI / 2);
  }

  /* ============================================================
     РАЙОН 2 — «НЕОНОВЫЙ КВАРТАЛ»: ночные развлечения
     ============================================================ */
  function buildNeon(K) {
    K.plane(320, 320, 0x23262f, 0, 20, 0);
    K.road(170, 16, 0, 0, true, 0x1c1e25, 0xff6ad5); K.road(10, 170, -48, 0, false, 0x1c1e25, 0x6ad5ff);
    K.plane(170, 4, 0x4a4d5a, 0, -10, .025); K.plane(170, 4, 0x4a4d5a, 0, 10, .025); K.plane(4, 170, 0x4a4d5a, -55, 0, .025); K.plane(4, 170, 0x4a4d5a, -41, 0, .025);
    K.cross(8, 0, true, 16, 0xf2f2f2); K.cross(-48, 12, false, 10, 0xf2f2f2);
    // лужи, отражающие неон
    [[-20, 3], [30, -4], [-62, -8], [62, 5]].forEach(function (p) { var q = K.disc(2.2, 0x2a3350, p[0], p[1], .045); q.material = new THREE.MeshBasicMaterial({ color: 0x3a4a8a, transparent: true, opacity: .55 }); });
    function neonSign(t, w, h, x, y, z, c, bg) { return K.sign(t, w, h, x, y, z, 0, bg || '#101018', c, { fs: .5 }); }
    // ——— аркада «ПИКСЕЛЬ»: пиксельный фасад
    K.b(30, 12, 18, 0x2a2540, -64, 0, -26);
    var inv = [[0,1,0,0,0,1,0],[0,0,1,0,1,0,0],[0,1,1,1,1,1,0],[1,1,0,1,0,1,1],[1,1,1,1,1,1,1],[1,0,1,1,1,0,1],[1,0,1,0,1,0,1],[0,0,1,0,1,0,0]];
    inv.forEach(function (row, ry) { row.forEach(function (v, rx) { if (v) K.m(G.box, K.glow(ry < 4 ? 0x6ad5ff : 0xff6ad5), [1.2, 1.2, .3], [-64 + (rx - 3) * 1.3, 11.5 - ry * 1.3 - 1, -16.9]); }); });
    neonSign('ПИКСЕЛЬ · АРКАДА', 9, 1, -64, 3.8, -16.8, '#6ad5ff'); K.m(G.box, 0x1d2129, [3, 3, .2], [-64, 1.5, -16.9]);
    K.addBiz('arcade_in', -64, -14.4, '🕹️ Войти в аркаду', function () { D.enter('arcade', 'neon', -64, -14.2); }, 3.2);
    // ——— кинотеатр «Гуси и розы»: шатёр из лампочек
    K.b(38, 14, 22, 0x4a1d2e, -12, 0, -30); K.m(G.box, 0x1d1018, [38.4, 1.4, 22.4], [-12, 14.7, -30]);
    K.b(26, 1.2, 4.5, 0x1d1018, -12, 5.6, -17.2, { cam: false });
    for (var i = 0; i < 22; i++) K.m(G.box, K.glow(i % 2 ? 0xffe08a : 0xff4a6a), [.45, .45, .45], [-23 + i * 1.05, 6.45, -14.8]);
    K.sign('ГУСИ И РОЗЫ', 22, 1.6, -12, 8.4, -18.9, 0, '#2a0d18', '#ffe08a', { fs: .6 });
    [[-22, 'ФИЛЬМ ДНЯ'], [2, 'ПРЕМЬЕРА']].forEach(function (p) { K.m(G.box, 0x1d1018, [4.4, 5.6, .2], [p[0], 3.6, -18.95]); K.m(G.box, 0x2a3a6a, [3.8, 4.4, .12], [p[0], 3.9, -18.85]); K.sign(p[1], 3.6, .5, p[0], 1.6, -18.8, 0, '#101018', '#ffffff', { fs: .5 }); });
    K.m(G.box, 0x1d2129, [3, 3.4, .2], [-12, 1.7, -18.95]);
    K.addBiz('cinema_in', -12, -15.6, '🎬 Кинотеатр', function () { D.enter('cinema', 'neon', -12, -15.4); }, 3.4);
    // ——— клуб «НЕОН»: чёрный куб + огромное кольцо, бархатная очередь
    K.b(22, 16, 20, 0x15151c, 24, 0, -28); var ring = K.m(new THREE.TorusGeometry(5, .45, 8, 36), K.glow(0xff3aa8), [1, 1, 1], [24, 11, -17.5], [0, 0, 0]);
    K.m(new THREE.TorusGeometry(3.4, .25, 8, 30), K.glow(0x3ae0ff), [1, 1, 1], [24, 11, -17.4], [0, 0, 0]);
    K.anims.push(function (t) { ring.material.color.setHSL((t * .15) % 1, 1, .6); });
    K.sign('НЕОН', 8, 1.2, 24, 4.4, -17.9, 0, '#101018', '#ff3aa8', { fs: .75 }); K.m(G.box, 0x2a2a30, [3.2, 3.2, .2], [24, 1.6, -17.9]);
    for (var p2 = 0; p2 < 5; p2++) { K.m(G.cyl, 0xd4af37, [.14, 1.1, .14], [17 + p2 * 1.8, .55, -14.5]); }
    K.m(G.box, 0xb0123a, [8.6, .12, .12], [20.6, 1.0, -14.5]); K.colC(17, -14.5, .2, 1.1); K.colC(25, -14.5, .2, 1.1);
    K.npc('neon_bounce', 'Охранник', { top: 0x111111, pants: 0x111111, hair: 0x111111, hairStyle: 'short', skin: 0xe0a982, scale: 1.1 }, 28, -13.4, PI);
    K.addBiz('dj', 21, -13.2, '🎧 Клуб «НЕОН»', function () { bizCall('dj'); }, 2.8);
    // ——— караоке «Хрип»: башня с микрофоном на крыше
    K.b(14, 20, 14, 0x3a1d5a, 62, 0, -28); K.m(G.cyl, 0x2a2a30, [.5, 4.2, .5], [62, 22, -28]); K.m(G.sph, K.glow(0xffd23f), [2.6, 2.6, 2.6], [62, 24.8, -28]);
    for (var gz = 0; gz < 12; gz++) K.m(G.box, 0x1d1018, [10, .1, .1], [62, 24.6 + 0, -28], [0, gz * .26, 0]);
    K.sign('КАРАОКЕ «ХРИП»', 7.6, 1, 62, 5, -20.9, 0, '#14081f', '#ffd23f', { fs: .46 }); K.m(G.box, 0x2a2a30, [2.6, 3, .2], [62, 1.5, -20.9]);
    K.addBiz('karaoke', 62, -18.6, '🎤 Караоке', function () { bizCall('karaoke'); }, 2.8);
    // ——— пиццерия «Вулкан»: крыша-вулкан
    K.b(22, 7, 16, 0xb04a2a, -68, 0, 30); K.m(G.cone, 0x5a2a1a, [10, 6, 10], [-68, 10, 30]); K.m(G.cone, K.glow(0xff5a1a), [3.4, 1.6, 3.4], [-68, 12.4, 30]);
    var smoke = K.m(G.sph, 0x888888, [2, 1.4, 2], [-68, 14, 30]); smoke.material = smoke.material.clone(); smoke.material.transparent = true; smoke.material.opacity = .5;
    K.anims.push(function (t) { smoke.position.y = K.g.position.y + 14 + ((t * .8) % 1) * 3; smoke.material.opacity = .5 - ((t * .8) % 1) * .5; });
    K.sign('ПИЦЦЕРИЯ «ВУЛКАН»', 9.6, 1, -68, 5.6, 21.9, 0, '#2a0a02', '#ff9a3a', { fs: .42 }); K.m(G.box, 0x1d2129, [2.4, 3, .2], [-68, 1.5, 21.9]);
    K.addBiz('pizzeria', -68, 19.5, '🌋 Пиццерия', function () { bizCall('pizzeria'); }, 3.0);
    // ——— рекламная башня (ориентир)
    K.b(10, 30, 6, 0x1d1d28, -26, 0, 30); neonSign('GOOSE COLA', 9, 4, -26, 22, 26.9, '#ff4a4a', '#0a0a10'); neonSign('ЖИВИ ГУСЁМ', 9, 2.6, -26, 16, 26.9, '#6aff9a', '#0a0a10'); K.emoji('🥤', 6, -26, 8, 26.5);
    // ——— капсульный отель «Сон»: сетка дверей-капсул
    K.b(30, 12, 12, 0x30343f, 18, 0, 34); for (var cy = 0; cy < 3; cy++) for (var cx = 0; cx < 8; cx++) K.m(G.box, K.glow([0x4aa8ff, 0xffa84a, 0x6aff9a][(cx + cy) % 3]), [2.4, 1.8, .15], [7.5 + cx * 3.2, 2.2 + cy * 3.2, 27.9]);
    K.sign('КАПСУЛЬНЫЙ ОТЕЛЬ «СОН»', 12, 1, 18, 11.4, 27.9, 0, '#101018', '#9ad8ff', { fs: .4 });
    // ——— фудтрак-ларёк (разворот: открыт к улице)
    K.b(7, 3.4, 3.4, 0xe8c04a, -6, .6, 22); K.m(G.box, 0x1d2129, [7, .12, 3.4], [-6, 4.1, 22]); K.m(G.box, 0xf2f2f2, [4, 1.1, .1], [-6, 2.7, 20.3]); K.emoji('🍜', 1.3, -6, 2.9, 20.2);
    K.m(G.cyl, 0x111111, [1, .5, 1], [-8.8, .5, 22], [PI / 2, 0, 0]); K.m(G.cyl, 0x111111, [1, .5, 1], [-3.2, .5, 22], [PI / 2, 0, 0]);
    K.addBiz('truck', -6, 19, '🍜 Фудтрак «Рамэн-Гусь»', function () { bizCall('cafe'); }, 2.6);
    // ——— арка над бульваром
    K.b(2, 10, 2, 0x2a2a38, 36, 0, -10, { cam: false }); K.b(2, 10, 2, 0x2a2a38, 36, 0, 10, { cam: false }); K.bp(2.4, 2.4, 24, 0x15151c, 36, 10, 0); K.sign('NEON DISTRICT', 10, 1.4, 36, 11.1, 0, PI / 2, '#10101a', '#ff3aa8', { fs: .6 });
    K.sign('NEON DISTRICT', 10, 1.4, 36, 11.1, 0, -PI / 2, '#10101a', '#3ae0ff', { fs: .6 });
    // фонари
    for (var lx = -70; lx <= 70; lx += 35) { K.lamp(lx, -9, 0xff9ad8); K.lamp(lx + 12, 9, 0x9ad8ff); }
    K.perimeter(82, 7, 0x1a1a22);
    K.sign('НЕОНОВЫЙ КВАРТАЛ', 14, 1.4, 0, 5.4, 82.4, PI, '#0a0a10', '#ff3aa8', { fs: .55 });
    K.busStop(0, 70, 0, 'Неоновый квартал', function () { D.toCity('neon'); });
    K.npc('neon_p1', 'Прохожий', { top: 0x9a3aff, pants: 0x222222, hair: 0x3aff9a, hairStyle: 'short', skin: 0xd8a888, scale: 1 }, 14, 11, PI / 2);
    K.npc('neon_p2', 'Прохожая', { top: 0xff3a8a, pants: 0x1d1d28, hair: 0x2a1d3a, hairStyle: 'bun', skin: 0xf0c8a0, scale: .96 }, -30, -11, -PI / 2);
  }

  /* ============================================================
     РАЙОН 3 — «БОТАНИЧЕСКИЙ БУЛЬВАР»: парк, оранжерея, рынок
     ============================================================ */
  function buildGreen(K) {
    var R = rngf(33);
    K.plane(320, 320, 0x7fae6a, 0, 20, 0);
    K.disc(19, 0xd8cfae, 0, 0, .02, 48); K.disc(16, 0xe8dfc0, 0, 0, .03, 48);
    [[0, -46, 7, 60], [0, 46, 7, 60]].forEach(function (p) { K.plane(p[2], p[3], 0xd8cfae, p[0], p[1], .02); });
    K.plane(70, 7, 0xd8cfae, 46, 0, .02); K.plane(70, 7, 0xd8cfae, -46, 0, .02);
    // фонтан в центре
    K.b(11, 1, 11, 0x9aa0a8, 0, 0, 0); K.m(G.cyl, 0x4a9fd0, [10, .2, 10], [0, 1.0, 0]); K.m(G.cyl, 0xb8bec6, [2.2, 2.4, 2.2], [0, 1.3, 0]); K.m(G.sph, 0xa8dcff, [1.6, 1.6, 1.6], [0, 3.1, 0]);
    var jets = []; for (var j = 0; j < 8; j++) { var a = j / 8 * PI * 2; var jm = K.m(G.cyl, 0xcfeaff, [.14, 2, .14], [Math.cos(a) * 3.2, 1.9, Math.sin(a) * 3.2]); jm.material = jm.material.clone(); jm.material.transparent = true; jm.material.opacity = .6; jets.push(jm); }
    K.anims.push(function (t) { jets.forEach(function (m, i) { m.scale.y = 1.4 + Math.sin(t * 3 + i) * .6; }); });
    K.addBiz('fountain', 0, 6.4, '⛲ Фонтан желаний', function () { bizCall('fountain'); }, 3.4);
    // ——— оранжерея «Эдем»: стеклянный свод
    K.b(40, .6, 22, 0xbfc8c0, 0, 0, -50); K.m(G.box, K.glassMat(), [40, 7, 22], [0, 4.1, -50]); K.m(G.cyl, K.glassMat(), [22, 40, 22], [0, 7.6, -50], [0, 0, PI / 2]);
    for (var r2 = -19; r2 <= 19; r2 += 4.75) K.m(G.box, 0x3a4a3a, [.18, 7.2, .18], [r2, 3.8, -61]), K.m(G.box, 0x3a4a3a, [.18, 7.2, .18], [r2, 3.8, -39]);
    K.col(-20, 20, -61.2, -60.6, 6); K.col(-20, -4, -39.4, -38.8, 6); K.col(4, 20, -39.4, -38.8, 6); K.col(-20.3, -19.7, -61, -39, 6); K.col(19.7, 20.3, -61, -39, 6);
    K.sign('ОРАНЖЕРЕЯ «ЭДЕМ»', 9, 1, 0, 9.2, -38.7, 0, '#1d4a2f', '#e8ffd8', { fs: .45 });
    K.addBiz('greenhouse_in', 0, -35.6, '🌺 Войти в оранжерею', function () { D.enter('greenhouse', 'green', 0, -35.4); }, 3.4);
    // ——— цветочный «Лютик»: домик с ящиками цветов
    K.b(14, 5, 10, 0xf4d4e0, 46, 0, -32); K.m(G.cone, 0xc2455a, [17, 3.4, 12], [46, 6.7, -32], [0, PI / 4, 0]);
    K.m(G.box, 0xf2f2f2, [8, .15, 2.2], [46, 3.6, -26.4]); for (var st = 0; st < 8; st++) K.m(G.box, st % 2 ? 0xe8527a : 0xffffff, [1, .1, 2.2], [42.4 + st, 3.65, -26.4]);
    for (var fb = 0; fb < 4; fb++) { K.m(G.box, 0x8a5a34, [1.6, .6, .6], [41 + fb * 3.3, .9, -26.6]); K.m(G.sph, [0xff5a8a, 0xffd23f, 0xb06cff, 0xff8a3a][fb], [1.4, 1.0, .5], [41 + fb * 3.3, 1.5, -26.6]); }
    K.sign('«ЛЮТИК»', 5, .8, 46, 4.6, -26.9, 0, '#ffffff', '#c2455a', { fs: .6 }); K.m(G.box, 0xb8a090, [1.8, 3, .2], [46, 1.5, -26.95]);
    K.addBiz('flowers', 46, -24.2, '💐 Цветочный «Лютик»', function () { bizCall('flowerShop'); }, 2.8);
    // ——— кафе «Утиный клюв»: круглый павильон с клювом над входом
    K.b(14, 1.2, 14, 0xe8dcc0, 56, 0, 6); K.m(G.cyl, 0xfff4cc, [12, 4, 12], [56, 3.2, 6]); K.m(G.hemi, 0xf2c230, [7, 3.6, 7], [56, 5.2, 6]);
    K.m(G.box, 0xff8a1a, [3.4, .5, 4], [56, 5.0, -.5]); K.m(G.box, 0xff9a2a, [2.6, .4, 3], [56, 4.4, -.7]); K.m(G.sph, 0x1d2129, [.6, .6, .6], [54.6, 6.4, -.5]); K.m(G.sph, 0x1d2129, [.6, .6, .6], [57.4, 6.4, -.5]);
    for (var t2 = 0; t2 < 4; t2++) { var ta = t2 / 4 * PI * 2 + .6; var tx = 56 + Math.cos(ta) * 9.5, tz = 6 + Math.sin(ta) * 9.5; K.m(G.cyl, 0xfdfdfd, [1.2, .9, 1.2], [tx, .5, tz]); K.m(G.cyl, [0xff6a6a, 0x6aa8ff, 0xffd23f, 0x6aff9a][t2], [3, .12, 3], [tx, 2.4, tz]); K.m(G.cyl, 0x8a8f96, [.08, 2.4, .08], [tx, 1.2, tz]); K.colC(tx, tz, .7, 1); }
    K.sign('«УТИНЫЙ КЛЮВ»', 6, .8, 56, 3.4, 12.8, PI, '#2a1d00', '#ffd23f', { fs: .5 });
    K.colC(56, 6, 6.2, 5);
    K.addBiz('duckcafe', 56, 14, '🦆 Кафе «Утиный клюв»', function () { bizCall('cafe'); }, 3.0);
    // ——— книжный «Страница 404»: здание из стопки книг
    K.b(18, 3.4, 12, 0xb8453a, 38, 0, 40); K.b(15, 3.0, 11, 0x2e6a9a, 39.4, 3.4, 40); K.b(12, 3.2, 9, 0xd8b04a, 37.5, 6.4, 40); K.m(G.box, 0xf2eedc, [18.1, .5, 12.1], [38, 1.7, 40]); K.m(G.box, 0xf2eedc, [15.1, .5, 11.1], [39.4, 5.1, 40]);
    K.sign('СТРАНИЦА 404', 7, .8, 38, 4.6, 33.9, 0, '#1d2129', '#ffd23f', { fs: .5 }); K.m(G.box, 0x3a2a1f, [2, 2.8, .2], [38, 1.4, 33.95]);
    K.addBiz('books', 38, 31.6, '📖 Книжный', function () { bizCall('bookshop'); }, 2.8);
    // ——— рынок «Блошка»: пять разных лотков в ряд
    var stalls = [[0xd8342a, '🧸'], [0x2e86c1, '📻'], [0xf1c40f, '🥔'], [0x27ae60, '🪴'], [0x8e44ad, '🕰️']];
    stalls.forEach(function (s, i) { var sx = -26 + i * 8.6; K.b(6.4, 1.1, 2, 0x8a6a46, sx, 0, 38); K.m(G.box, s[0], [7, .25, 3.2], [sx, 3.6, 37.4], [.18, 0, 0]); K.m(G.cyl, 0x5a3f22, [.14, 3.4, .14], [sx - 3.2, 1.7, 36]); K.m(G.cyl, 0x5a3f22, [.14, 3.4, .14], [sx + 3.2, 1.7, 36]); K.emoji(s[1], 1.2, sx, 1.9, 38); });
    K.sign('РЫНОК «БЛОШКА»', 8, .8, -5, 5.2, 36, 0, '#3a2a1f', '#ffd23f', { fs: .5 });
    K.npc('green_seller', 'Продавец', { top: 0x5a8a3a, pants: 0x3a3a4a, hair: 0x8a5a2a, hairStyle: 'short', skin: 0xe0b08a, scale: 1 }, -5, 40.4, PI);
    K.addBiz('market', -5, 34.6, '🧺 Рынок «Блошка»', function () { bizCall('market'); }, 3.2);
    // ——— мельница (ориентир с вращающимися лопастями)
    K.b(7, 11, 7, 0xe8dcc0, -58, 0, -8); K.m(G.cone, 0x8a4a2a, [8.6, 4, 8.6], [-58, 13, -8]); K.col(-61.5, -54.5, -11.5, -4.5, 12);
    var blades = new THREE.Group(); blades.position.set(K.ox - 58, 9, K.oz - 4); K.g.add(blades); for (var bl = 0; bl < 4; bl++) { var bm = M_(blades, G.box, 0xd8cfae, [.7, 8, .15], [0, 0, 0], [0, 0, bl * PI / 2], false); bm.position.set(Math.cos(bl * PI / 2 + PI / 2) * 4, Math.sin(bl * PI / 2 + PI / 2) * 4, 0); }
    K.anims.push(function (t) { blades.rotation.z = t * .6; });
    K.sign('МЕЛЬНИЦА', 4, .6, -58, 4, -4.2, 0, '#5a3a1f', '#f2e8c8', { fs: .5 });
    // ——— пруд с лилиями и утками
    K.disc(8, 0x3a8ab8, -48, -34, .04, 36); K.disc(6.4, 0x4a9ac8, -48, -34, .05, 36);
    for (var ls = 0; ls < 6; ls++) K.disc(.7, 0x3a8a3a, -48 + (R() - .5) * 9, -34 + (R() - .5) * 9, .06, 10);
    K.emoji('🦆', 1.2, -46, .5, -35); K.emoji('🦆', 1.1, -50, .45, -32);
    for (var ra = 0; ra < 14; ra++) { var rad = ra / 14 * PI * 2; K.m(G.sph, 0x9aa0a8, [1.3, .9, 1.3], [-48 + Math.cos(rad) * 8.4, .4, -34 + Math.sin(rad) * 8.4]); }
    K.colC(-48, -34, 8.6, 1);
    // ——— амфитеатр-ротонда: полукруг ступеней и беседка
    for (var step = 0; step < 4; step++) K.b(14 - step * 2, .5, 1.6, 0xc9c2a8, -46, step * .5, 32 + step * 1.6);
    K.b(7, .4, 7, 0xe8dcc0, -46, 0, 22); for (var pl = 0; pl < 4; pl++) K.m(G.cyl, 0xffffff, [.4, 4, .4], [-46 + (pl % 2 ? 3 : -3), 2.2, 22 + (pl < 2 ? -3 : 3)]); K.m(G.cone, 0x4a7a5a, [9, 2.6, 9], [-46, 5.5, 22]);
    K.sign('ЛЕТНЯЯ СЦЕНА', 4.6, .6, -46, 4.4, 18.4, 0, '#2a3a2a', '#e8ffd8', { fs: .5 });
    // деревья трёх пород — расставлены случайно, но не на дорожках и не на зданиях
    var keep = function (x, z) { if (Math.hypot(x, z) < 22) return false; if (Math.abs(x) < 6 && Math.abs(z) > 14) return false; if (Math.abs(z) < 6 && Math.abs(x) > 14) return false; if (z < -34 && z > -66 && Math.abs(x) < 26) return false; if (Math.hypot(x + 48, z + 34) < 11) return false; if (x > 36 && x < 56 && z > -38 && z < -20) return false; if (Math.hypot(x - 56, z - 6) < 14) return false; if (x > 26 && x < 50 && z > 32 && z < 48) return false; if (z > 32 && z < 44 && x > -32 && x < 16) return false; if (x < -38 && x > -54 && z > 14 && z < 38) return false; if (x < -52 && x > -64 && z > -14 && z < -2) return false; return Math.abs(x) < 76 && Math.abs(z) < 76 && z < 62; };
    var tn = 0, tries = 0; while (tn < 28 && tries < 400) { tries++; var tx2 = (R() - .5) * 150, tz2 = (R() - .5) * 150; if (!keep(tx2, tz2)) continue; K.tree(tx2, tz2, ['round', 'cone', 'birch'][tn % 3], .9 + R() * .5); tn++; }
    for (var bn = 0; bn < 6; bn++) K.bench([-12, 12, -12, 12, 30, -30][bn], [-12, -12, 12, 12, -8, 8][bn], [0, 0, PI, PI, -PI / 2, PI / 2][bn]);
    for (var lp = 0; lp < 4; lp++) K.lamp([-9, 9, -9, 9][lp], [-9, -9, 9, 9][lp], 0xfff0c0);
    // живая изгородь по периметру
    K.perimeter(82, 2.4, 0x3f7a3f); K.sign('БОТАНИЧЕСКИЙ БУЛЬВАР', 12, 1.2, 0, 4.6, 82.4, PI, '#1d4a2f', '#e8ffd8', { fs: .5 });
    K.busStop(0, 70, 0, 'Бульвар', function () { D.toCity('green'); });
    K.npc('green_p1', 'Садовник', { top: 0x6a9a3a, pants: 0x5a4a2a, hair: 0x888888, hairStyle: 'short', skin: 0xdba784, scale: 1 }, -12, -30, 0);
    K.npc('green_p2', 'Бабушка', { top: 0x6a4a6a, pants: 0x3a3a3a, hair: 0xc8c8c8, hairStyle: 'bun', skin: 0xefc4a4, scale: .9, coatLong: true }, 12.6, -12, 0);
  }

  /* ============================================================
     РАЙОН 4 — «СТЕКЛЯННЫЙ КВАРТАЛ»: деловой центр
     ============================================================ */
  function buildBiz(K) {
    K.plane(320, 320, 0xc9ccd2, 0, 20, 0);
    K.road(170, 12, 0, -22, true, 0x3a3e46); K.road(170, 12, 0, 32, true, 0x3a3e46); K.road(12, 170, -32, 5, false, 0x3a3e46); K.road(12, 170, 32, 5, false, 0x3a3e46);
    [[-22], [32]].forEach(function (z) { K.plane(170, 3, 0xe6e8ec, 0, z[0] - 7.5, .025); K.plane(170, 3, 0xe6e8ec, 0, z[0] + 7.5, .025); });
    K.cross(-32, -22, false, 12, 0xffffff); K.cross(32, 32, false, 12, 0xffffff); K.cross(0, -22, true, 12, 0xffffff);
    // ——— площадь: башня с часами и золотой гусь
    K.b(9, .5, 9, 0xe6e8ec, 0, 0, 5); K.b(3.4, 18, 3.4, 0x8a8f96, -2, .5, 5); K.m(G.box, 0x6a6f76, [4.4, 1.2, 4.4], [-2, 19, 5]); K.m(G.cone, 0x3a4a5a, [4.8, 3.4, 4.8], [-2, 21.3, 5]);
    [[0, 1.8], [0, -1.8]].forEach(function (p, i) { K.m(G.cyl, 0xfdfdfd, [2.6, .14, 2.6], [-2, 15, 5 + p[1]], [PI / 2, 0, 0]); K.m(G.box, 0x1d2129, [.12, .12, 1], [-2, 15.1, 5 + p[1]], [0, 0, 0]); });
    var hand = K.m(G.box, 0x1d2129, [.1, 1, .12], [-2, 15, 6.8]); K.anims.push(function (t) { hand.rotation.z = -t * .5; });
    K.col(-3.8, -.2, 3.2, 6.8, 20);
    K.addBiz('clock', -2, 8.2, '🕰️ Часы', function () { bizCall('clock'); }, 3.0);
    K.b(4, 1.6, 4, 0x9a8a5a, 12, .5, 5); K.m(G.sph, 0xe8b830, [2.2, 2.2, 2.2], [12, 3.2, 5]); K.m(G.sph, 0xe8b830, [1.2, 1.2, 1.2], [12, 4.7, 5.5]); K.m(G.cone, 0xd8742a, [.5, .9, .5], [12, 4.5, 6.3], [PI / 2, 0, 0]); K.m(G.box, 0xe8b830, [.5, 2, .5], [11.1, 1.6, 5.2], [0, 0, .5]);
    K.colC(12, 5, 2.4, 3); K.addBiz('goose', 12, 8, '🪿 Золотой Гусь', function () { bizCall('goose'); }, 3.0);
    // ——— небоскрёб «ГУСЬ-ТАУЭР» (три яруса) + офис «Гусь и Ко»
    K.b(24, 20, 20, 0x4a6a8a, -58, 0, -56); K.b(18, 22, 15, 0x5a7a9a, -58, 20, -56); K.b(11, 22, 10, 0x6a8aaa, -58, 42, -56); K.b(1, 8, 1, 0x333333, -58, 64, -56, { cam: false });
    for (var fl = 0; fl < 7; fl++) { K.m(G.box, 0xa8d4f0, [23.2, 1.6, .12], [-58, 3 + fl * 2.8, -45.9]); }
    for (var fl2 = 0; fl2 < 6; fl2++) { K.m(G.box, 0xa8d4f0, [17.2, 1.6, .12], [-58, 22 + fl2 * 3.4, -48.4]); }
    var blink = K.m(G.sph, K.glow(0xff2a2a), [.8, .8, .8], [-58, 72.5, -56]); K.anims.push(function (t) { blink.visible = Math.sin(t * 4) > 0; });
    K.m(G.box, 0x1d2129, [4, 3.4, .2], [-58, 1.7, -45.85]); K.sign('ГУСЬ-ТАУЭР · «ГУСЬ И КО»', 14, 1.2, -58, 5.6, -45.7, 0, '#0f1a2a', '#a8d4f0', { fs: .45 });
    K.npc('biz_recep', 'Ресепшн', { top: 0x2a3a5a, pants: 0x1d2129, hair: 0x5a2a1a, hairStyle: 'bun', skin: 0xf0c8a0, scale: .98 }, -58, -43.2, 0);
    K.addBiz('office', -58, -42.6, '🏢 Офис «Гусь и Ко»', function () { bizCall('office'); }, 2.8);
    // ——— «ГУСБАНК»: колоннада и фронтон
    K.b(30, 10, 18, 0xe8e2d2, 56, 0, -56); K.b(32, 1.4, 20, 0xc9c2a8, 56, 10, -56); K.m(G.box, 0xd8d2c0, [34, 2.4, 20.4], [56, 12.2, -56], [0, 0, 0]);
    for (var cc = 0; cc < 6; cc++) K.m(G.cyl, 0xf6f2e6, [1.5, 9.6, 1.5], [44 + cc * 4.8, 4.8, -45.4]);
    K.m(G.cone, 0xc9c2a8, [20, 3.4, 4], [56, 14.9, -47], [PI / 2, PI / 4, 0]);
    K.sign('ГУСБАНК', 8, 1.2, 56, 9.2, -45.7, 0, '#1d2f1d', '#e8d890', { fs: .62 }); K.m(G.box, 0x3a2a1f, [3.2, 3.6, .2], [56, 1.8, -45.85]);
    K.addBiz('bank_in', 56, -42.6, '🏦 Войти в банк', function () { D.enter('bank', 'biz', 56, -42.2); }, 3.4);
    // ——— спортзал «Железный гусь»: индустриальный + гантель на крыше
    K.b(26, 9, 16, 0x5a4a3a, -58, 0, 54); K.b(26.4, .8, 16.4, 0x2a2420, -58, 9, 54); K.m(G.cyl, 0x2a2a30, [.6, 7, .6], [-58, 10.8, 54], [0, 0, PI / 2]); K.m(G.cyl, 0x2a2a30, [2.4, .9, 2.4], [-61.5, 10.8, 54], [0, 0, PI / 2]); K.m(G.cyl, 0x2a2a30, [2.4, .9, 2.4], [-54.5, 10.8, 54], [0, 0, PI / 2]);
    for (var gy = 0; gy < 3; gy++) K.m(G.box, 0xb0b6c0, [2.4, 4.4, .12], [-66 + gy * 8, 4, 45.9]);
    K.sign('«ЖЕЛЕЗНЫЙ ГУСЬ»', 9, 1, -58, 8, 45.9, 0, '#14100c', '#ff7a2a', { fs: .48 }); K.m(G.box, 0x1d2129, [3, 3.2, .2], [-58, 1.6, 45.9]);
    K.addBiz('gym_in', -58, 43.6, '🏋️ Спортзал', function () { D.enter('gym', 'biz', -58, 43.4); }, 3.4);
    // ——— аптека «Зелёный крест»: белая + огромный крест
    K.b(18, 7, 12, 0xf2f4f6, 58, 0, 52); K.m(G.box, K.glow(0x2fce5a), [1.4, 5, .3], [58, 10.4, 45.8]); K.m(G.box, K.glow(0x2fce5a), [5, 1.4, .3], [58, 10.4, 45.8]);
    K.m(G.box, 0xa8d4f0, [6, 3.2, .12], [58, 2.6, 45.9]); K.m(G.box, 0xcfd4da, [3, 3.2, .12], [53, 2.6, 45.9]);
    K.sign('АПТЕКА «ЗЕЛЁНЫЙ КРЕСТ»', 9, .8, 58, 5.8, 45.8, 0, '#ffffff', '#1d7a3a', { fs: .42 });
    K.addBiz('pharm', 58, 43.4, '➕ Аптека', function () { bizCall('pharmacy'); }, 3.0);
    // ——— круглый бизнес-центр «Кольцо» (декор + смузи-бар на первом этаже)
    K.b(.1, .1, .1, 0xffffff, 0, 0, -60, { cam: false });
    K.m(G.cyl, 0x8ab4d4, [22, 16, 22], [0, 8, -60]); K.m(G.cyl, 0x6a94b4, [22.4, 1.2, 22.4], [0, 16.6, -60]); K.m(G.cyl, 0x6a94b4, [22.4, .6, 22.4], [0, 8, -60]); K.colC(0, -60, 11, 17);
    K.sign('БЦ «КОЛЬЦО»', 8, .9, 0, 5.4, -48.8, 0, '#0f1a2a', '#a8d4f0', { fs: .5 });
    K.b(6, 2.6, 3, 0xe0f0ff, 14, 0, -42); K.m(G.box, 0x2fae5b, [6.6, .4, 3.6], [14, 3.1, -42]); K.sign('СМУЗИ', 3, .5, 14, 2.1, -40.4, 0, '#ffffff', '#2fae5b', { fs: .6 });
    K.addBiz('smoothie', 14, -38.8, '🥤 Смузи-бар', function () { bizCall('cafe'); }, 2.4);
    // оформление улиц
    for (var lz = -76; lz <= 76; lz += 38) { K.lamp(-38.5, lz, 0xdff0ff); K.lamp(38.5, lz, 0xdff0ff); }
    for (var tp = 0; tp < 6; tp++) { var tx = [-12, 12, -12, 12, -20, 20][tp], tz = [-34, -34, 44, 44, 18, 18][tp]; K.m(G.cyl, 0x8a8f96, [1.4, .8, 1.4], [tx, .4, tz]); K.m(G.sph, 0x4f9a52, [1.6, 1.4, 1.6], [tx, 1.2, tz]); K.colC(tx, tz, .8, 1); }
    K.bench(-8, 14, PI); K.bench(8, -2, 0);
    K.perimeter(82, 2.4, 0xaad0e8); K.sign('СТЕКЛЯННЫЙ КВАРТАЛ', 12, 1.2, 0, 4.6, 82.4, PI, '#0f1a2a', '#a8d4f0', { fs: .5 });
    K.busStop(0, 70, 0, 'Стеклянный квартал', function () { D.toCity('biz'); });
    K.npc('biz_p1', 'Клерк', { top: 0x2a2a3a, pants: 0x1d2129, hair: 0x1d1d1d, hairStyle: 'short', skin: 0xe0b08a, scale: 1 }, 24, -18, PI / 2);
    K.npc('biz_p2', 'Менеджер', { top: 0xf2f2f2, pants: 0x3a4a6a, hair: 0x6a3a1a, hairStyle: 'bun', skin: 0xf0c8a0, scale: .98 }, -24, 28, -PI / 2);
  }

  /* ============================================================
     ИНТЕРЬЕРЫ: мастерская, аркада, кинотеатр, оранжерея, банк, спортзал
     ============================================================ */
  var IN = {
    garage: { name: 'Мастерская «Гайка и Гусь»', w: 22, d: 16, floor: 0x6a6e76, wall: 0xaab0b8 },
    arcade: { name: 'Аркада «Пиксель»', w: 22, d: 16, floor: 0x1a1a28, wall: 0x2a2540 },
    cinema: { name: 'Кинотеатр «Гуси и розы»', w: 22, d: 18, floor: 0x3a1020, wall: 0x2a0a14 },
    greenhouse: { name: 'Оранжерея «Эдем»', w: 24, d: 16, floor: 0xb8a888, wall: 0x9ac4a8 },
    bank: { name: '«Гусбанк»', w: 20, d: 14, floor: 0xe0dccc, wall: 0xc9c2a8 },
    gym: { name: 'Спортзал «Железный гусь»', w: 22, d: 16, floor: 0x2a2a30, wall: 0x6a5a4a }
  };
  var INKEYS = Object.keys(IN);
  function buildInterior(key, idx) {
    var P = IN[key], id = 'in_' + key, ox = 3400 + idx * 60, oz = 0;
    var K = Kit(id, ox, oz); K.def = P; var w = P.w, d = P.d;
    K.plane(w + 4, d + 4, P.floor, 0, 0, .0);
    K.b(w, 4.6, .6, P.wall, 0, 0, -d / 2); K.b(.6, 4.6, d, P.wall, -w / 2, 0, 0); K.b(.6, 4.6, d, P.wall, w / 2, 0, 0); K.b(w / 2 - 1.6, 4.6, .6, P.wall, -w / 4 - .8, 0, d / 2); K.b(w / 2 - 1.6, 4.6, .6, P.wall, w / 4 + .8, 0, d / 2);
    K.bp(w, .3, d, 0x20242c, 0, 4.6, 0); K.m(G.box, 0xfff6dc, [w - 2, .1, .5], [0, 4.5, -3]); K.m(G.box, 0xfff6dc, [w - 2, .1, .5], [0, 4.5, 3]);
    K.sign(P.name, 8, .8, 0, 3.7, -d / 2 + .35, 0, '#1d2129', '#ffd23f', { fs: .45, ds: false });
    K.m(G.box, 0x5a6a7a, [2.4, 3.2, .15], [0, 1.6, d / 2 - .1]); K.sign('ВЫХОД', 1.8, .4, 0, 3.4, d / 2 - .2, PI, '#1d7a3a', '#fff');
    K.addBiz('exit_' + key, 0, d / 2 - 1.4, '🚪 Выйти на улицу', function () { D.leave(); }, 2.2);
    var f = {
      garage: function () { K.bp(5, .35, 3.2, 0xd8342a, 0, 0, 1); K.b(.4, 3.8, .4, 0x3a3d44, -2.2, 0, -.4, { cam: false }); K.b(.4, 3.8, .4, 0x3a3d44, 2.2, 0, -.4, { cam: false });
        K.b(2.2, 1.2, 4.4, 0x2e86c1, 0, .4, 1, { cam: false }); K.m(G.box, 0x2a3a4a, [1.9, .7, 2.3], [0, 1.9, 1.2]);
        for (var t = 0; t < 4; t++) K.m(G.cyl, 0x1d1d1d, [1, .5, 1], [-9 + (t % 2) * 1.1, .3 + Math.floor(t / 2) * .55, -6.4], [PI / 2, 0, 0]);
        K.b(6, 1.2, 1.4, 0x8a8f96, 7, 0, -6.6); K.m(G.box, 0x3a3d44, [6, 1.6, .2], [7, 2.8, -7.4]); for (var h2 = 0; h2 < 5; h2++) K.m(G.box, 0xc9c9c0, [.2, 1.1, .12], [4.8 + h2 * 1.1, 2.7, -7.3]);
        K.b(2.8, 1.2, 1.3, 0x8a4a2a, -8, 0, 4); K.npc('in_mech', 'Механик', { top: 0x2e86c1, pants: 0x2a3a4a, hair: 0x4a2a1a, hairStyle: 'short', skin: 0xdba784, scale: 1 }, -8, 5.5, PI);
        K.addBiz('garage_desk', -8, 2.6, '🔧 Механик', function () { bizCall('garage'); }, 2.8); },
      arcade: function () { var cols = [0xff3aa8, 0x3ae0ff, 0xffd23f, 0x6aff9a, 0xb06cff, 0xff8a3a], keys = ['runner', 'tower', 'frog', 'space', 'runner', 'tower'], names = ['🏃 Гусь-раннер', '🧱 Башня', '🐸 Лягушка', '🚀 Космос', '🏃 Гусь-раннер', '🧱 Башня'];
        for (var i = 0; i < 6; i++) { var x = -8 + (i % 3) * 5.4 + (i > 2 ? 2.7 : 0), z = i > 2 ? -3.2 : -6.2; K.b(2, 3.2, 1.4, 0x15151c, x, 0, z); K.m(G.box, K.glow(cols[i]), [1.7, 1.1, .12], [x, 2.4, z + .74]); K.m(G.box, 0x2a2a38, [1.8, .3, .8], [x, 1.2, z + .9]); K.m(G.sph, 0xd8342a, [.3, .3, .3], [x - .4, 1.45, z + 1.0]);
          (function (k, nm, xx, zz) { K.addBiz('cab_' + i, xx, zz + 1.9, '🕹️ ' + nm, function () { bizCall('arcade', k); }, 1.9); })(keys[i], names[i], x, z); }
        K.m(G.box, K.glow(0xff3aa8), [w - 3, .08, .12], [0, .06, -d / 2 + 1]); K.m(G.box, K.glow(0x3ae0ff), [.12, .08, d - 4], [-w / 2 + 1, .06, 0]); K.m(G.box, K.glow(0x3ae0ff), [.12, .08, d - 4], [w / 2 - 1, .06, 0]);
        K.b(5, 1.2, 1.4, 0x3a2a5a, 6.5, 0, 4.5); K.emoji('🧸', 1.2, 6.5, 2.3, 4.5); K.npc('in_arc', 'Кассир', { top: 0x9a3aff, pants: 0x1d1d28, hair: 0x3aff9a, hairStyle: 'short', skin: 0xd8a888, scale: 1 }, 6.5, 5.8, PI); },
      cinema: function () { K.m(G.box, K.glow(0xf2f4ff), [14, 5.2, .15], [0, 2.6, -d / 2 + .5]); K.m(G.box, 0x1d1018, [14.8, 5.8, .1], [0, 2.6, -d / 2 + .4]);
        for (var r = 0; r < 4; r++) for (var c = 0; c < 7; c++) { if (c === 3) continue; K.b(1.2, .9, 1.1, 0xb0123a, -7.2 + c * 2.4, r * .25, -4.6 + r * 2.2, { cam: false }); K.m(G.box, 0xb0123a, [1.2, 1.1, .3], [-7.2 + c * 2.4, r * .25 + 1.2, -5.1 + r * 2.2]); }
        K.b(5.4, 1.1, 1.4, 0x5a1a2a, 7.4, 0, 6); K.m(G.box, K.glow(0xffd23f), [5, .5, .1], [7.4, 1.6, 5.2]); K.emoji('🍿', 1.2, 7.4, 2.3, 6); K.npc('in_cin', 'Билетёр', { top: 0xb0123a, pants: 0x1d1018, hair: 0x1d1d1d, hairStyle: 'short', skin: 0xe0b08a, scale: 1 }, 7.4, 7.2, PI);
        K.addBiz('cin_ticket', 7.4, 4.0, '🎟️ Билеты', function () { bizCall('cinema'); }, 2.6); K.addBiz('cin_screen', 0, -d / 2 + 2, '📽️ Экран (сеанс — у кассы)', function () { toast('Сеанс начинается после покупки билета у кассы.', 2400); }, 2.6); },
      greenhouse: function () { for (var b = 0; b < 3; b++) { K.b(14, .6, 2, 0x5a3a22, -2, 0, -6 + b * 3.4, { cam: false }); for (var p = 0; p < 7; p++) { K.m(G.sph, [0xff5a8a, 0xffd23f, 0xb06cff, 0xff8a3a, 0x6aff9a][(p + b) % 5], [.9, .9, .9], [-8 + p * 2, 1.0 + (p % 2) * .2, -6 + b * 3.4]); K.m(G.cyl, 0x2f8a3a, [.12, .8, .12], [-8 + p * 2, .6, -6 + b * 3.4]); } }
        K.m(G.cone, 0x2f8a3a, [3, 6, 3], [-w / 2 + 2, 3, -d / 2 + 2]); K.m(G.sph, 0x3fae4a, [3.4, 3, 3.4], [w / 2 - 2, 2.4, -d / 2 + 2]); K.m(G.cyl, 0x6b4b2b, [.6, 2, .6], [w / 2 - 2, 1, -d / 2 + 2]);
        K.disc(2.6, 0x4a9fd0, 8, 3, .03, 24); K.colC(8, 3, 2.7, .8); K.npc('in_gard', 'Садовник', { top: 0x6a9a3a, pants: 0x5a4a2a, hair: 0x888888, hairStyle: 'short', skin: 0xdba784, scale: 1 }, -9, 4, PI / 2);
        K.addBiz('gh_job', -9, 2.4, '✂️ Срезать цветы', function () { bizCall('greenhouse'); }, 2.8); },
      bank: function () { K.b(10, 1.2, 1.4, 0x5a4a2a, 0, 0, -3); K.m(G.box, 0xa8d4f0, [10, 1.4, .1], [0, 1.9, -2.3]); K.npc('in_bank', 'Кассир', { top: 0x1d2f1d, pants: 0x1d1d1d, hair: 0x5a2a1a, hairStyle: 'bun', skin: 0xf0c8a0, scale: .98 }, 0, -4.4, 0);
        K.m(G.cyl, 0x9aa0a8, [5.4, .8, 5.4], [-6.5, 2.6, -d / 2 + 1.2], [PI / 2, 0, 0]); K.m(G.cyl, 0xd4af37, [1.6, .2, 1.6], [-6.5, 2.6, -d / 2 + 1.5], [PI / 2, 0, 0]); K.colC(-6.5, -d / 2 + 1.4, 2.4, 4);
        K.b(1.2, 2.4, .9, 0x2a3a5a, 7, 0, -4.2); K.m(G.box, K.glow(0x6aff9a), [.9, .5, .1], [7, 1.8, -3.72]);
        K.b(1.4, .7, 1.4, 0x5a4a2a, 4, 0, 3, { cam: false }); K.b(1.4, .7, 1.4, 0x5a4a2a, -4, 0, 3, { cam: false });
        K.addBiz('bank_teller', 0, -1.8, '🏦 Кассир «Гусбанка»', function () { bizCall('bank'); }, 2.8); K.addBiz('bank_atm', 7, -2.4, '💳 Банкомат', function () { bizCall('bank'); }, 2.2); },
      gym: function () { for (var t = 0; t < 3; t++) { K.b(1.2, 1.1, 2.6, 0x3a3d44, -8 + t * 2.6, 0, -5, { cam: false }); K.m(G.box, 0x1d1d1d, [1.0, .12, 2], [-8 + t * 2.6, 1.2, -5]); K.m(G.box, 0x3a3d44, [.16, 2, .16], [-8 + t * 2.6, 1.9, -6.2]); }
        K.b(2.8, .6, 1.2, 0x1d1d1d, 5, 0, -4, { cam: false }); K.m(G.cyl, 0x2a2a30, [.2, 3, .2], [5, 1.6, -4.7], [0, 0, PI / 2]); K.m(G.cyl, 0x2a2a30, [1.1, .3, 1.1], [3.6, 1.6, -4.7], [0, 0, PI / 2]); K.m(G.cyl, 0x2a2a30, [1.1, .3, 1.1], [6.4, 1.6, -4.7], [0, 0, PI / 2]);
        K.m(G.cyl, 0xd8342a, [1, 2.6, 1], [-6, 2.2, 3]); K.m(G.cyl, 0x2a2a30, [.06, 1.6, .06], [-6, 3.8, 3]); K.colC(-6, 3, .6, 3);
        K.b(5, 1.2, 1.4, 0x5a4a3a, 6, 0, 5); K.npc('in_gym', 'Тренер', { top: 0xff7a2a, pants: 0x1d1d1d, hair: 0x2a1a0a, hairStyle: 'short', skin: 0xdba784, scale: 1.08 }, 6, 6.2, PI);
        K.addBiz('gym_desk', 6, 3.6, '💳 Абонемент', function () { bizCall('gym'); }, 2.6); K.addBiz('gm_run', -6.7, -3.2, '🏃 Беговая дорожка', function () { bizCall('gymMachine', 'run'); }, 2.0); K.addBiz('gm_bag', -6, 1.4, '🥊 Груша', function () { bizCall('gymMachine', 'bag'); }, 2.0); K.addBiz('gm_bench', 5, -2.4, '🏋️ Жим лёжа', function () { bizCall('gymMachine', 'bench'); }, 2.0); }
    }[key];
    f();
    return K;
  }
  function ensureInterior(key) {
    if (D.inter[key]) return D.inter[key]; var idx = INKEYS.indexOf(key), prev = BA;
    try { BA = 'in_' + key; camBlock['in_' + key] = []; D.inter[key] = buildInterior(key, idx); }
    catch (e) { console.error('[MG_DIST interior]', key, e); D.inter[key] = null; }
    finally { BA = prev || 'city'; }
    return D.inter[key];
  }

  /* ---------------- регистрация районов, связь с городом ---------------- */
  var DEFS = [
    { id: 'dock', name: 'Старая верфь', ox: 2400, oz: 0, build: buildDock, stop: { x: -190, z: -8.6, ry: PI, label: 'ТЦ «Пирамида»' }, emoji: '⚓' },
    { id: 'neon', name: 'Неоновый квартал', ox: 2400, oz: 400, build: buildNeon, stop: { x: 60, z: -163.5, ry: PI, label: 'Зюзинская улица' }, emoji: '🌃' },
    { id: 'green', name: 'Ботанический бульвар', ox: 2400, oz: 800, build: buildGreen, stop: { x: -40, z: 163.5, ry: PI, label: 'Тихая улица' }, emoji: '🌿' },
    { id: 'biz', name: 'Стеклянный квартал', ox: 2400, oz: 1200, build: buildBiz, stop: { x: 214, z: 30, ry: -PI / 2, label: 'Новый квартал' }, emoji: '🏙️' }
  ];
  DEFS.forEach(function (d) { D.dist[d.id] = d; });
  var ret = { where: null, x: 0, z: 0 };        // куда вернуться из интерьера

  function ensureDistrict(d) {
    if (D.built[d.id]) return D.built[d.id].ok; var prev = BA;
    try { BA = d.id; camBlock[d.id] = []; var K = Kit(d.id, d.ox, d.oz); d.build(K); D.built[d.id] = { K: K, ok: true }; }
    catch (e) { console.error('[MG_DIST]', d.id, e); D.built[d.id] = { ok: false }; }
    finally { BA = prev || 'city'; }
    return D.built[d.id].ok;
  }
  D.ensure = ensureDistrict;
  D.toCity = function (id) {
    var d = D.dist[id], s = d.stop, rx = s.x + Math.sin(s.ry) * 3.4, rz = s.z + Math.cos(s.ry) * 3.4;
    cutscene(async function () { await fade(1, 500, '🚌 Едем обратно в город…'); try { sfx('bus'); } catch (e) { } await wait(1200); setArea('city'); placeA(player, rx, rz, s.ry + PI); try { collide(player.pos, .4, player.feet); } catch (e) { } showComp(rx + Math.cos(s.ry) * 1.2, rz - Math.sin(s.ry) * 1.2); cam.yaw = s.ry; await fade(0, 600); try { fullSave(false); } catch (e) { } });
  };
  function travel(d) {
    if (typeof blocked === 'function' && blocked()) return;
    cutscene(async function () {
      await fade(1, 500, '🚌 Маршрутка едет в «' + d.name + '»…'); try { sfx('bus'); } catch (e) { } await wait(1300);
      if (!ensureDistrict(d)) { await fade(0, 400); toast('Район пока недоступен. Игра продолжается без него.', 3200); return; }
      try { dismount(player); } catch (e) { }
      setArea(d.id); placeA(player, d.ox, d.oz + 66, PI); showComp(d.ox + 1.8, d.oz + 66.6); cam.yaw = 0;
      var s = MG_BIZ && MG_BIZ.S12 ? MG_BIZ.S12() : null; var first = s && !s.seen[d.id]; if (s) s.seen[d.id] = 1;
      await fade(0, 600); toast((d.emoji || '📍') + ' ' + d.name + (first ? ' — новый район!' : ''), 3000); try { fullSave(false); } catch (e) { }
    });
  }
  D.travel = travel;
  D.enter = function (key, fromArea, fx, fz) {
    cutscene(async function () {
      await fade(1, 400); var K = ensureInterior(key);
      if (!K) { await fade(0, 300); toast('Заведение закрыто на ремонт.', 2400); return; }
      ret.where = fromArea; ret.x = fx; ret.z = fz; ret.key = key;
      try { dismount(player); } catch (e) { }
      setArea('in_' + key); placeA(player, K.ox, K.oz + K.def.d / 2 - 2.4, PI); showComp(K.ox + 1.4, K.oz + K.def.d / 2 - 2.6); cam.yaw = 0; await fade(0, 500);
    });
  };
  D.leave = function () {
    cutscene(async function () {
      await fade(1, 400); var d = D.dist[ret.where] || DEFS[0];
      setArea(d.id); placeA(player, d.ox + ret.x, d.oz + ret.z + 1.4, 0); showComp(d.ox + ret.x + 1.4, d.oz + ret.z + 2); cam.yaw = 0; await fade(0, 500); try { fullSave(false); } catch (e) { }
    });
  };

  /* ---------------- доставка пиццы (подработка в «Неоновом квартале») ---------------- */
  var DEL = { on: false, list: [], idx: 0, t0: 0, limit: 150, mark: null, pay: 0 };
  var DOORS = [[-55, -11.5], [-20, -11.5], [35, -11.5], [66, -11.5], [-62, 11.5], [-25, 11.5], [25, 11.5], [60, 11.5]];
  D.startDelivery = function () {
    var d = D.dist.neon, B = MG_BIZ; if (DEL.on) { toast('Заказ уже у тебя в руках!', 2000); return; }
    var pool = DOORS.slice().sort(function () { return Math.random() - .5; }).slice(0, 3);
    DEL = { on: true, list: pool, idx: 0, t0: performance.now(), limit: 150, mark: null, pay: 0 }; showMark(); B.S12(); toast('🛵 Заказ взят: 3 адреса, 2,5 минуты. Бегом!', 3600);
  };
  function showMark() {
    var K = D.built.neon && D.built.neon.K; if (!K) return; if (DEL.mark) { K.g.remove(DEL.mark); DEL.mark = null; }
    if (!DEL.on) return; var p = DEL.list[DEL.idx]; DEL.mark = emojiSprite('🍕', 2.2); DEL.mark.position.set(K.ox + p[0], 3.2, K.oz + p[1]); K.g.add(DEL.mark);
  }
  function delCur() { if (!DEL.on) return null; var K = D.built.neon.K, p = DEL.list[DEL.idx]; return { x: K.ox + p[0], z: K.oz + p[1] }; }
  function deliver() {
    var left = Math.max(0, DEL.limit - (performance.now() - DEL.t0) / 1000), pay = 900 + Math.round(600 * left / DEL.limit), tip = Math.random() < .5 ? Math.round(Math.random() * 300) : 0;
    DEL.pay += pay + tip; DEL.idx++; MG_BIZ.S12().stats.deliveries = (MG_BIZ.S12().stats.deliveries || 0) + 1;
    toast('🍕 Доставлено! +' + fmt(pay) + (tip ? ' и чаевые ' + fmt(tip) : ''), 2400);
    if (DEL.idx >= DEL.list.length) { var tot = DEL.pay; DEL.on = false; showMark(); MG_BIZ.S12().cd.job_pizza = Date.now() + 120000; addMoney(tot, 'доставка пиццы'); }
    else { DEL.t0 = DEL.t0; showMark(); }
  }
  function delTick() {
    if (!DEL.on) return; var el = (performance.now() - DEL.t0) / 1000;
    if (el > DEL.limit) { DEL.on = false; showMark(); toast('⏱️ Не успел. Пицца остыла, клиенты обиделись. Заработано: ' + fmt(DEL.pay), 3600); if (DEL.pay) addMoney(DEL.pay, 'за успевшие заказы'); MG_BIZ.S12().cd.job_pizza = Date.now() + 120000; }
    else if (area === 'neon' && Math.floor(el) % 15 === 0 && Math.floor(el) !== DEL._l) { DEL._l = Math.floor(el); toast('🍕 Адрес ' + (DEL.idx + 1) + '/' + DEL.list.length + ' · осталось ' + Math.round(DEL.limit - el) + ' с', 1800); }
  }

  /* ---------------- установка в игру ---------------- */
  var installed = false, tAnim = 0;
  function install() {
    if (installed || !rdy()) return; installed = true;
    // остановки в городе
    DEFS.forEach(function (d) {
      var s = d.stop, q = new THREE.Group(); q.position.set(s.x, H(s.x, s.z), s.z); q.rotation.y = s.ry; cityG.add(q);
      sign(q, '🚌 → ' + d.name, 3.6, .42, 0, 3.55, .06, 0, '#e8473b', '#ffffff', { fs: .36 });
      addI({ area: 'city', p: { x: s.x, z: s.z }, r: 4.4, label: '🚌 Маршрутка → ' + d.emoji + ' ' + d.name, ok: function () { return !player.drive; }, act: function () { travel(d); } });
    });
    // видимость групп при смене области
    var prev = setArea;
    var w = function (a) { prev(a); DEFS.forEach(function (d) { var b = D.built[d.id]; if (b && b.K) b.K.g.visible = (a === d.id); }); INKEYS.forEach(function (k) { var I = D.inter[k]; if (I) I.g.visible = (a === 'in_' + k); }); };
    window.setArea = setArea = w;
    // анимации и таймер доставки в игровом цикле
    var pe = updEnv; window.updEnv = updEnv = function (dt, t) { pe(dt, t); try { tAnim += dt; DEFS.forEach(function (d) { var b = D.built[d.id]; if (b && b.K && b.K.g.visible) b.K.anims.forEach(function (f) { f(tAnim); }); }); delTick(); } catch (e) { console.error('[MG_DIST anim]', e); } };
    // доставка: точка сдачи заказа
    addI({ area: 'neon', p: function () { return delCur(); }, r: 2.6, label: '🍕 Отдать пиццу', act: deliver });
    // миграция сохранения: резервная копия перед первым запуском на 1.12
    var ps = start;
    window.start = start = function (sv) { try { if (sv && !sv.v12) { var key = (typeof slotKey === 'function') ? slotKey(SAVE_SLOT) : null; if (key) { var raw = localStorage.getItem(key); if (raw && !localStorage.getItem(key + '_bak_v111')) localStorage.setItem(key + '_bak_v111', raw); } sv.v12 = 1; } } catch (e) { console.error('[MG_DIST backup]', e); } return ps(sv); };
    console.log('[MG_DIST] районы установлены: ' + DEFS.length);
  }
  var iv = setInterval(function () { try { install(); } catch (e) { console.error('[MG_DIST]', e); } if (installed) clearInterval(iv); }, 300);
  // стеклянный материал (общий)
  var _glass = null; Kit.glass = function () { return _glass = _glass || new THREE.MeshLambertMaterial({ color: 0xbfe4ee, transparent: true, opacity: .32 }); };
  D.defs = DEFS; D.interiors = IN; D.Kit = Kit; D.rngf = rngf;
})();
