/* =====================================================================
   МГИАГ 1.18 — «ПОЧТИ ДОМ»: РАСШИРЕНИЕ КАРТЫ ВО ВСЕ СТОРОНЫ
   Работает только в новой вселенной: после финала сюжетки №15.
   До этого город прежний: забор на месте, за ним ничего нет.
   Север — озёрный край (озеро «Тихое», бор, гора «Гусиная» с канаткой, термы).
   Запад — речная долина (река из озера, рыбацкая деревня, виноградники, лагуна).
   Восток — морской берег (порт, бухта «Солнечная», скалы, парк аттракционов).
   Юг — курорт (дачный склон, посёлок «Чэайное», набережная, пирс, марина, санаторий, виллы, маяк).
   Напротив помещений игры (x≈±1200) — вода: их стены действуют и снаружи.
   Всё строится один раз, при первом входе в «почти дом», и склеивается в крупные куски.
   ===================================================================== */
(function () {
  'use strict';
  var PI = Math.PI, TAU_ = PI * 2;
  var E = window.MG_EXPAND = { active: false, built: false, force: null, g: null, busy: false, stats: {} };
  var SQ = 742;                                                     // край старой земли (outerTerrain)
  var CELL = 14, GX0 = -1750, GZ0 = -1862, NX = 251, NZ = 263;      // сетка высот (кратна краю старой земли)
  var HG = null, KIND = null;                                       // высоты и тип клетки: 0 суша, 1 вода, 2 старый город
  var SEA_Y = -.55, DEEP = -.85;
  function nearRoad(x, z, m) { if (m <= 11 && typeof roadDist === 'function') return roadDist(x, z) < m; return window.nearRoad(x, z, m); }
  function sm(a, b, x) { var t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
  function rng(seed) { var s = seed >>> 0 || 1; return function () { s = (s + 0x6D2B79F5) >>> 0; var t = s; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  var R = rng(118);
  function rr_(a, b) { return a + R() * (b - a); }
  function pk(a) { return a[Math.floor(R() * a.length)]; }

  /* ====================== ФОРМА СУШИ ====================== */
  function boundary(x, z) {
    var a = Math.atan2(z - 50, x), nx = x / 1380, nz = (z - 50) / (z < 50 ? 1620 : 1480);
    var r = Math.pow(Math.pow(Math.abs(nx), 2.6) + Math.pow(Math.abs(nz), 2.6), 1 / 2.6);
    var wob = .06 * Math.sin(3 * a + 1) + .04 * Math.sin(7 * a + 2) + .025 * Math.sin(13 * a) + .17 * Math.exp(-Math.pow((a - 1.02) / .075, 2)) + .08 * Math.exp(-Math.pow((a - 2.35) / .1, 2));
    return 1 + wob - r;
  }
  function coastS(x) { return 1330 + 95 * Math.sin((x + 200) / 230) + 40 * Math.sin(x / 83) - 230 * Math.exp(-Math.pow((x + 450) / 120, 2)) + 330 * Math.exp(-Math.pow((x - 960) / 110, 2)); }
  function inlet(x, z, cx, cz, rx, rz, seed) { var a = Math.atan2(z - cz, x - cx), k = 1 + .1 * Math.sin(3 * a + seed) + .06 * Math.sin(5 * a + 2 * seed); return Math.pow((x - cx) / (rx * k), 2) + Math.pow((z - cz) / (rz * k), 2) < 1; }
  var RIVER = [[-330, -1150], [-620, -1110], [-880, -960], [-960, -700], [-1000, -500], [-1080, -420]];
  function isWater(x, z) {
    if (Math.abs(x) <= SQ && Math.abs(z) <= SQ) return false;
    if (boundary(x, z) < 0) return true;
    if (z > 700 && z > coastS(x) && x > -1150 && x < 1250) return true;
    if (inlet(x, z, 1290, -85, 340, 540, 1) || inlet(x, z, -1290, -85, 340, 540, 2)) return true;
    if (Math.pow(x / 360, 2) + Math.pow((z + 1170) / 190, 2) < 1) return true;
    for (var i = 0; i < RIVER.length - 1; i++) {
      var ax = RIVER[i][0], az = RIVER[i][1], bx = RIVER[i + 1][0], bz = RIVER[i + 1][1], dx = bx - ax, dz = bz - az, t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz)));
      if (Math.hypot(x - ax - dx * t, z - az - dz * t) < 22 + 10 * t) return true;
    }
    return false;
  }
  E.isWater = isWater;
  function hills(x, z) {
    return 11 * Math.exp(-Math.pow((z - 910) / 85, 2)) * (Math.abs(x) < 700 ? 1 : .45)          // южная гряда
      + 70 * Math.exp(-(Math.pow((x - 520) / 230, 2) + Math.pow((z + 1300) / 200, 2)))              // гора «Гусиная»
      + 14 * Math.exp(-(Math.pow((x + 930) / 190, 2) + Math.pow((z - 560) / 200, 2)))               // виноградные холмы
      + 16 * Math.exp(-(Math.pow((x - 930) / 200, 2) + Math.pow((z + 880) / 180, 2)))               // скалы на северо-востоке
      + 14 * Math.exp(-(Math.pow((x - 800) / 200, 2) + Math.pow((z - 1080) / 200, 2)))              // холм вилл
      + 10 * Math.exp(-(Math.pow((x + 900) / 220, 2) + Math.pow((z - 1010) / 200, 2)))              // бор у санатория
      + 2 * Math.sin(x / 90) * Math.cos(z / 110) + 1.2 * Math.sin((x + z) / 53);
  }

  /* ====================== СЕТКА ВЫСОТ ====================== */
  function idx(i, j) { return j * NX + i; }
  function buildGrid() {
    var N = NX * NZ, i, j; HG = new Float32Array(N); KIND = new Int8Array(N);
    for (j = 0; j < NZ; j++) for (i = 0; i < NX; i++) { var x = GX0 + i * CELL, z = GZ0 + j * CELL; KIND[idx(i, j)] = (Math.abs(x) < SQ && Math.abs(z) < SQ) ? 2 : (isWater(x, z) ? 1 : 0); }
    // расстояния (в клетках): от суши до воды и от воды до суши
    function bfs(src) { var D = new Int16Array(N).fill(999), q = new Int32Array(N), h = 0, t = 0; for (var k = 0; k < N; k++) if (src(KIND[k])) { D[k] = 0; q[t++] = k; }
      while (h < t) { var v = q[h++], vi = v % NX, vj = (v - vi) / NX, nd = D[v] + 1; if (nd > 40) continue; var nb = [vi > 0 ? v - 1 : -1, vi < NX - 1 ? v + 1 : -1, vj > 0 ? v - NX : -1, vj < NZ - 1 ? v + NX : -1];
        for (var n = 0; n < 4; n++) { var w = nb[n]; if (w >= 0 && D[w] > nd) { D[w] = nd; q[t++] = w; } } } return D; }
    var DW = bfs(function (k) { return k === 1; }), DL = bfs(function (k) { return k !== 1; });
    for (j = 0; j < NZ; j++) for (i = 0; i < NX; i++) {
      var k = idx(i, j), x = GX0 + i * CELL, z = GZ0 + j * CELL;
      var dsq = Math.hypot(Math.max(0, Math.abs(x) - SQ), Math.max(0, Math.abs(z) - SQ));
      if (KIND[k] === 2) { HG[k] = (Math.abs(x) === SQ || Math.abs(z) === SQ) ? 0 : -3; continue; }
      if (KIND[k] === 1) { HG[k] = -1 - 3.5 * sm(0, 8, DL[k]); continue; }
      var dw = DW[k], fade = sm(0, 90, dsq);
      HG[k] = (0.35 + 1.4 * sm(0, 5, dw) + Math.max(-1, hills(x, z)) * sm(1, 6, dw)) * fade;
    }
    E.DW = DW;
  }
  /* высота точки: тот же треугольник, что и в меше рельефа (диагональ от (i,j) к (i+1,j+1)) */
  var DECKS = [];                                                    // настилы над водой: пирсы, причалы, мосты
  function gridH(x, z) {
    for (var d = 0; d < DECKS.length; d++) { var D_ = DECKS[d]; if (x > D_.x0 && x < D_.x1 && z > D_.z0 && z < D_.z1) return D_.y; }
    var fx = (x - GX0) / CELL, fz = (z - GZ0) / CELL, i = Math.floor(fx), j = Math.floor(fz);
    if (i < 0 || j < 0 || i >= NX - 1 || j >= NZ - 1) return -4.5;
    var u = fx - i, v = fz - j, h00 = HG[idx(i, j)], h10 = HG[idx(i + 1, j)], h01 = HG[idx(i, j + 1)], h11 = HG[idx(i + 1, j + 1)];
    return u >= v ? h00 + (h10 - h00) * u + (h11 - h10) * v : h00 + (h11 - h01) * u + (h01 - h00) * v;
  }
  E.gridH = gridH;
  function onDeck(x, z) { for (var d = 0; d < DECKS.length; d++) { var D_ = DECKS[d]; if (x > D_.x0 && x < D_.x1 && z > D_.z0 && z < D_.z1) return true; } return false; }
  function outside(x, z) { return x > SQ || x < -SQ || z > SQ || z < -SQ; }

  /* ====================== ДОРОГИ ====================== */
  // плавные кривые: опорные точки редкие, без лишних петель
  // ворота из старого города: просветы в пригороде, где на пути только деревья и фонари (их убираем)
  var GATES = [[-167.9, 669.3, 0, 1], [118.7, 669.8, 0, 1], [465, 627.2, 0, 1], [-422.2, -641.9, 0, -1], [205.5, -668.5, 0, -1], [490.4, -615.6, 0, -1],
    [649.9, -389.9, 1, 0], [670, 0, 1, 0], [649.9, 389.9, 1, 0], [-661.9, -312.9, -1, 0], [-649.9, 389.9, -1, 0], [-627.2, -465, -1, 0]];
  // плавные кривые: опорные точки редкие (200–300 м), повороты мягкие, без серпантинов
  var RD = [
    { n: 'Большое кольцо', w: 10, ring: true, p: [[0, -790], [205, -830], [420, -905], [620, -985], [840, -940], [935, -760], [875, -560], [865, -330], [860, -20], [880, 230], [925, 450], [1010, 700], [990, 960], [840, 1170], [560, 1230], [250, 1240], [-20, 1225], [-260, 1185], [-410, 1060], [-560, 1020], [-740, 1060], [-900, 1100], [-1030, 960], [-1015, 740], [-900, 540], [-860, 390], [-850, 120], [-860, -305], [-885, -470], [-880, -640], [-800, -800], [-640, -890], [-425, -868], [-200, -815], [0, -790]] },
    // от ворот к кольцу — прямые выезды
    { w: 8, p: [[-422.2, -641.9], [-422, -760], [-425, -868]] }, { w: 8, p: [[205.5, -668.5], [205, -760], [205, -830]] }, { w: 8, p: [[490.4, -615.6], [490, -760], [478, -935]] },
    { w: 8, p: [[649.9, -389.9], [760, -390], [866, -392]] }, { w: 10, p: [[670, 0], [760, -5], [860, -20]] }, { w: 8, p: [[649.9, 389.9], [770, 392], [905, 395]] },
    { w: 8, p: [[-661.9, -312.9], [-760, -313], [-860, -305]] }, { w: 8, p: [[-649.9, 389.9], [-760, 390], [-860, 390]] }, { w: 8, p: [[-627.2, -465], [-760, -467], [-885, -470]] },
    { n: 'Южный проспект', w: 10, p: [[118.7, 669.8], [119, 770], [128, 890], [150, 1050], [200, 1150], [250, 1240]] },
    { w: 8, p: [[-167.9, 669.3], [-168, 770], [-190, 900], [-235, 1050], [-260, 1185]] }, { w: 8, p: [[465, 627.2], [465, 770], [478, 905], [500, 1060], [560, 1230]] },
    // юг: дачи и посёлок
    { n: 'Дачная', w: 6, p: [[-797, 805], [-720, 800], [-450, 805], [-168, 785], [119, 790], [465, 790], [730, 805], [797, 808]] },
    { w: 6, p: [[-190, 900], [-30, 892], [128, 890], [300, 897], [478, 905]] },
    { w: 6, p: [[-235, 1050], [-45, 1058], [150, 1050], [320, 1060], [500, 1060], [700, 1005], [860, 960]] },
    { w: 6, p: [[-30, 892], [-45, 1058], [-40, 1150], [-20, 1225]] }, { w: 6, p: [[300, 897], [320, 1060], [330, 1150], [340, 1236]] },
    { w: 5, p: [[-450, 805], [-470, 900], [-470, 1000], [-410, 1060]] }, { w: 5, p: [[730, 805], [800, 860], [860, 960]] },
    { n: 'К маяку', w: 6, p: [[840, 1170], [866, 1320], [912, 1448]] },
    // север: озеро, кемпинг, термы, гора
    { n: 'Озёрная', w: 7, p: [[-425, -868], [-330, -945], [-150, -962], [0, -965], [150, -962], [330, -950], [478, -935]] },
    { w: 6, p: [[-150, -812], [-150, -962]] }, { w: 6, p: [[205, -830], [205, -962]] }, { w: 6, p: [[-640, -890], [-600, -1050], [-560, -1205]] },
    { w: 6, p: [[478, -935], [474, -1000]] }, { w: 5, p: [[875, -560], [960, -740], [940, -900], [840, -942]] },
    // запад: деревня у реки, винодельня, санаторий
    { w: 5, p: [[-880, -640], [-900, -690], [-905, -735], [-880, -770], [-812, -795]] }, { w: 5, p: [[-900, 540], [-830, 620], [-797, 690]] }, { w: 6, p: [[-900, 1100], [-880, 990], [-820, 905], [-797, 830]] },
    // восток: порт и парк
    { w: 6, p: [[866, -392], [930, -390], [955, -330], [950, -240], [915, -180], [866, -170]] }, { w: 6, p: [[905, 395], [960, 520], [980, 580]] },
    // 1.19 — американский город: Сити и Мидтаун (запад), Портовая авеню (восток), улицы даунтауна (юг)
    { n: 'Сити-авеню', w: 8, p: [[-797, -467], [-797, -150], [-797, 150], [-797, 390], [-797, 600], [-797, 805]] },
    { n: 'Набережная Сити', w: 8, p: [[-860, -305], [-905, -250], [-912, -60], [-910, 140], [-890, 300], [-860, 390]] },
    { w: 6, p: [[-797, -150], [-860, -150], [-910, -150]] }, { w: 6, p: [[-797, 60], [-861, 60], [-911, 60]] }, { w: 6, p: [[-797, 230], [-866, 230], [-900, 230]] },
    { w: 6, p: [[-797, 560], [-850, 555], [-905, 548]] },
    { n: 'Портовая авеню', w: 8, p: [[796, -390], [796, -5], [797, 392], [802, 600], [797, 808]] },
    { w: 6, p: [[796, -200], [866, -190]] }, { w: 6, p: [[797, 200], [878, 215]] }, { w: 6, p: [[802, 600], [870, 610], [980, 580]] },
    { w: 6, p: [[-212, 975], [0, 973], [131, 975], [300, 978], [490, 982]] }, { w: 6, p: [[-600, 805], [-625, 920], [-650, 1040]] }
  ];
  // разворотные петли в конце дорог к маяку, термам и канатке: тупиков нет
  function bulb(p, q, r) { var dx = p[0] - q[0], dz = p[1] - q[1], L = Math.hypot(dx, dz) || 1, cx = p[0] + dx / L * r, cz = p[1] + dz / L * r, a0 = Math.atan2(p[1] - cz, p[0] - cx), pts = [];
    for (var k = 0; k <= 12; k++) { var a = a0 + k / 12 * PI * 2; pts.push([cx + Math.cos(a) * r, cz + Math.sin(a) * r]); } return { w: 6, loop: true, p: pts }; }
  [[20, 9], [24, 14], [25, 14]].forEach(function (a) { var p = RD[a[0]].p, n = p.length; RD.push(bulb(p[n - 1], p[n - 2], a[1])); });
  var ROADPTS = [];                                                  // сглаженные линии дорог
  function smooth(p) { try { return catmull(p, 6); } catch (e) { return p; } }
  /* Дорожное полотно: высоты вдоль дороги сглаживаются (окно ±50 м), рельеф рядом подрезается/подсыпается к нему.
     Над водой — насыпь не ниже 1 м; у старой границы всё плавно сходит к уровню старого города. */
  function rasterRoads() {
    var N = NX * NZ, BW = new Float32Array(N), BH = new Float32Array(N);
    function bil(x, z) { var fx = (x - GX0) / CELL, fz = (z - GZ0) / CELL, i = Math.max(0, Math.min(NX - 2, Math.floor(fx))), j = Math.max(0, Math.min(NZ - 2, Math.floor(fz))), u = fx - i, v = fz - j;
      return HG[idx(i, j)] * (1 - u) * (1 - v) + HG[idx(i + 1, j)] * u * (1 - v) + HG[idx(i, j + 1)] * (1 - u) * v + HG[idx(i + 1, j + 1)] * u * v; }
    RD.forEach(function (r) { r.P = smooth(r.p); });
    // концы дорог пристыковываются к ближайшей дороге (до 40 м), чтобы не было тупиков
    RD.forEach(function (r) { snapEnds(r, 40); });
    RD.forEach(function (r) {
      var P = r.P; ROADPTS.push(P);
      var S_ = samplePath(P, 4), raw = S_.map(function (p) { var x = p[0], z = p[1]; if (!outside(x, z)) return 0; var dsq = Math.hypot(Math.max(0, Math.abs(x) - SQ), Math.max(0, Math.abs(z) - SQ));
        if (isWater(x, z)) r.bridge = true; return Math.max(bil(x, z), sm(0, 40, dsq)); });
      var prof = raw.map(function (h, i) { var s = 0, n = 0; for (var k = -12; k <= 12; k++) { var q = raw[Math.max(0, Math.min(raw.length - 1, i + k))]; s += q; n++; } return s / n; });
      prof = prof.map(function (h, i) { var p = S_[i], dsq = Math.hypot(Math.max(0, Math.abs(p[0]) - SQ), Math.max(0, Math.abs(p[1]) - SQ)); return outside(p[0], p[1]) ? Math.max(h, sm(0, 40, dsq)) * sm(0, 30, dsq) + 0 : 0; });
      r.prof = prof;
      var R0 = Math.max(r.w / 2 + 3, 10.5), R1 = R0 + 14;
      S_.forEach(function (p, si) { var x = p[0], z = p[1]; if (!outside(x, z) && Math.abs(x) < SQ - R1 && Math.abs(z) < SQ - R1) return;
        var i0 = Math.floor((x - R1 - GX0) / CELL), i1 = Math.ceil((x + R1 - GX0) / CELL), j0 = Math.floor((z - R1 - GZ0) / CELL), j1 = Math.ceil((z + R1 - GZ0) / CELL);
        for (var j = j0; j <= j1; j++) for (var i = i0; i <= i1; i++) { if (i < 0 || j < 0 || i >= NX || j >= NZ) continue; var q = idx(i, j); if (KIND[q] === 2) continue;
          var d = Math.hypot(GX0 + i * CELL - x, GZ0 + j * CELL - z), w = d <= R0 ? 1 : 1 - sm(R0, R1, d); if (w > BW[q]) { BW[q] = w; BH[q] = prof[si]; } } });
    });
    for (var q = 0; q < N; q++) if (BW[q] > 0) HG[q] = HG[q] + (BH[q] - HG[q]) * BW[q];
  }
  /* точки через равные отрезки по длине линии (для фонарей, домов, разметки) */
  function snapEnds(r, maxD) { if (r.loop || r.ring) return; [0, 1].forEach(function (end) { var P = r.P, p = end ? P[P.length - 1] : P[0], best = null, bd = 2.5;
        RD.forEach(function (o) { if (o === r) return; var Q = o.P; for (var i = 0; i < Q.length - 1; i++) { var ax = Q[i][0], az = Q[i][1], dx = Q[i + 1][0] - ax, dz = Q[i + 1][1] - az, L2 = dx * dx + dz * dz || 1, u = Math.max(0, Math.min(1, ((p[0] - ax) * dx + (p[1] - az) * dz) / L2)), qx = ax + dx * u, qz = az + dz * u, d = Math.hypot(p[0] - qx, p[1] - qz); if (d < maxD && (best === null || d < bd)) { bd = d; best = [qx, qz]; } } });
        if (best && bd > .5) { if (end) P.push(best); else P.unshift(best); r.snapped = (r.snapped || 0) + 1; } }); }
  function resample(P, step) { var out = [P[0]], acc = 0, need = step; for (var i = 1; i < P.length; i++) { var ax = P[i - 1][0], az = P[i - 1][1], bx = P[i][0], bz = P[i][1], L = Math.hypot(bx - ax, bz - az), t0 = 0;
      while (acc + L * (1 - t0) >= need) { var t = t0 + (need - acc) / L; out.push([ax + (bx - ax) * t, az + (bz - az) * t]); acc = need; t0 = t; need += step; } acc += L * (1 - t0); } if (out.length < 2 || Math.hypot(out[out.length - 1][0] - P[P.length - 1][0], out[out.length - 1][1] - P[P.length - 1][1]) > step * .3) out.push(P[P.length - 1]); return out; }
  function samplePath(pts, step) { var P = []; for (var i = 0; i < pts.length - 1; i++) { var ax = pts[i][0], az = pts[i][1], bx = pts[i + 1][0], bz = pts[i + 1][1], n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / step)); for (var k = 0; k < n; k++) P.push([ax + (bx - ax) * k / n, az + (bz - az) * k / n]); } P.push(pts[pts.length - 1]); return P; }

  /* ====================== ПОСТРОЙКА ====================== */
  var TERRAIN_TILE = 32;
  function terrain(root) {
    var gc = new THREE.Color(0x7d9d58), sand = new THREE.Color(0xe2cf98), rock = new THREE.Color(0x8a8478), dark = new THREE.Color(0x5e7a44), vine = new THREE.Color(0x6f8f3a);
    var made = 0;
    for (var tj = 0; tj < NZ - 1; tj += TERRAIN_TILE) for (var ti = 0; ti < NX - 1; ti += TERRAIN_TILE) {
      var pos = [], col = [], ix = [], map = {}, cnt = 0;
      function vtx(i, j) { var k = idx(i, j); if (map[k] !== undefined) return map[k]; var x = GX0 + i * CELL, z = GZ0 + j * CELL, h = HG[k]; pos.push(x, h, z);
        var c, dw = E.DW[k], n = .92 + .08 * Math.sin(x * .21 + z * .13);
        if (KIND[k] === 1 || (h < .2 && dw <= 4) || (dw <= 2 && KIND[k] === 0)) c = sand; else if (h > 32) c = rock; else if (z < -740) c = dark;  else c = gc;
        col.push(c.r / gc.r * n, c.g / gc.g * n, c.b / gc.b * n); map[k] = cnt; return cnt++; }
      for (var j = tj; j < Math.min(NZ - 1, tj + TERRAIN_TILE); j++) for (var i = ti; i < Math.min(NX - 1, ti + TERRAIN_TILE); i++) {
        var a = idx(i, j), b = idx(i + 1, j), c_ = idx(i, j + 1), d = idx(i + 1, j + 1);
        if (KIND[a] === 2 || KIND[b] === 2 || KIND[c_] === 2 || KIND[d] === 2) continue;
        if (HG[a] < -1.5 && HG[b] < -1.5 && HG[c_] < -1.5 && HG[d] < -1.5) continue;                        // глубоко под водой — не нужно
        var A = vtx(i, j), B = vtx(i + 1, j), C = vtx(i, j + 1), Dd = vtx(i + 1, j + 1);
        ix.push(A, Dd, B, A, C, Dd);
      }
      if (!ix.length) continue;
      var g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(ix); g.computeVertexNormals(); g.computeBoundingSphere();
      var m = new THREE.Mesh(g, groundMat); m.userData.exTerrain = true; m.userData.noPerf = true; root.add(m); made++;
    }
    E.stats.tiles = made;
  }
  /* Шов на месте бывшего забора: полоса земли под стыком старой и новой земли (закрывает любые щели),
     а старые плитки земли у края больше не прячутся по дальности — иначе издалека под ними видно море. */
  function seam(root) {
    var pos = [], ix = [], n = 0, ACR = [-724, -734, -740, -744, -750, -760];
    for (var side = 0; side < 4; side++) for (var t = -760; t < 760; t += 4) {
      for (var k = 0; k < ACR.length; k++) for (var e = 0; e < 2; e++) { var tt = t + e * 4, a = ACR[k], x, z;
        if (side === 0) { x = -a; z = tt; } else if (side === 1) { x = a; z = tt; } else if (side === 2) { x = tt; z = -a; } else { x = tt; z = a; }
        var h = outside(x, z) ? gridH(x, z) : oH(x, z); pos.push(x, Math.min(h, oH(x, z)) - .07, z); }
      var b = n; for (k = 0; k < ACR.length - 1; k++) { var i0 = b + k * 2, i1 = i0 + 1, j0 = b + (k + 1) * 2, j1 = j0 + 1; ix.push(i0, j0, i1, i1, j0, j1, i0, i1, j0, i1, j1, j0); } n += ACR.length * 2;
    }
    var gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); var cl = []; for (var q = 0; q < pos.length / 3; q++) cl.push(.92, .97, .9); gg.setAttribute('color', new THREE.Float32BufferAttribute(cl, 3)); gg.setIndex(ix); gg.computeVertexNormals();
    var m = new THREE.Mesh(gg, groundMat); m.userData.noPerf = true; m.userData.noCull = true; m.userData.noShadow = true; m.frustumCulled = false; root.add(m); E.seam = m;
  }
  function oldTilesKeep(on) {
    try { CULL.forEach(function (k) { if (k.o.material !== groundMat || !k.o.userData.cull) return; var c = k.c; if (Math.max(Math.abs(c.x), Math.abs(c.z)) < 560) return; if (on) { if (k.r0 === undefined) { k.r0 = k.r; k.r = 1e5; } } else if (k.r0 !== undefined) { k.r = k.r0; delete k.r0; } }); } catch (e) { }
  }
  function water(root) {
    var m = new THREE.MeshPhongMaterial({ color: 0x2f74a6, specular: 0x88aacc, shininess: 40 });
    var R_ = [[-6000, 6000, -6000, -SQ], [-6000, 6000, SQ, 6000], [-6000, -SQ, -SQ, SQ], [SQ, 6000, -SQ, SQ]];
    E.water = R_.map(function (r) { var w = r[1] - r[0], d = r[3] - r[2], p = new THREE.Mesh(new THREE.PlaneGeometry(w, d, 1, 1), m); p.rotation.x = -PI / 2; p.position.set((r[0] + r[1]) / 2, SEA_Y, (r[2] + r[3]) / 2); p.userData.noPerf = true; p.userData.exWater = true; root.add(p);
      try { if (window.MG_GFX && MG_GFX.registerWater) MG_GFX.registerWater(p, m); } catch (e) { } return p; });
  }
  function roadsBuild() { RD.forEach(buildRoad); }
  function buildRoad(r) {
    var yo = .22;
    (function () {
      var P = r.P; ROADS.push({ pts: P, w: r.w, ex: true });
      ribbon(P, r.w, roadMat, yo);
      if (r.w >= 6) { ribbon(P, 2.6, walkMat, yo + .04, r.w / 2 + 1.4); ribbon(P, 2.6, walkMat, yo + .04, -r.w / 2 - 1.4); }
      if (r.w >= 7) { var S_ = resample(P, 6); for (var i = 0; i < S_.length - 1; i += 2) { var a = S_[i], b = S_[i + 1], ang = Math.atan2(b[0] - a[0], b[1] - a[1]); M_(cityG, G.box, 0xe8e8e0, [.18, .02, 2.6], [(a[0] + b[0]) / 2, H((a[0] + b[0]) / 2, (a[1] + b[1]) / 2) + yo + .03, (a[1] + b[1]) / 2], [0, ang, 0]); } }
      // фонари: редко на загородных участках, чаще в посёлках
      var step = r.w >= 10 ? 42 : 34, L = resample(P, step);
      L.forEach(function (p, i) { if (i === 0 || i === L.length - 1 || !outside(p[0], p[1])) return; var q = L[Math.min(L.length - 1, i + 1)], a = Math.atan2(q[0] - p[0], q[1] - p[1]), sd = i % 2 ? 1 : -1, ox = Math.cos(a) * (r.w / 2 + 3) * sd, oz = -Math.sin(a) * (r.w / 2 + 3) * sd, x = p[0] + ox, z = p[1] + oz;
        if (H(x, z) < .4) return; lampH(x, z, Math.atan2(-ox, -oz)); });
      // мосты: перила и опоры там, где дорога над водой
      if (r.bridge) { var B = samplePath(P, 3); B.forEach(function (p, i) { if (!isWater(p[0], p[1]) || i === B.length - 1) return; var q = B[i + 1], a = Math.atan2(q[0] - p[0], q[1] - p[1]);
        for (var s = -1; s <= 1; s += 2) { var x = p[0] + Math.cos(a) * (r.w / 2 + .4) * s, z = p[1] - Math.sin(a) * (r.w / 2 + .4) * s; M_(cityG, G.box, 0xb8bcc4, [.25, .9, 3.1], [x, 1.7, z], [0, a, 0]); }
        if (i % 4 === 0) M_(cityG, G.cyl, 0x8a8f96, [1.4, 3, 1.4], [p[0], -.5, p[1]]); }); }
      if (r.n) { var m = P[Math.floor(P.length / 2)]; E.lm.push({ x: m[0], z: m[1], e: '🛣️', n: r.n }); }
    })();
  }
  /* --- проверки места --- */
  function onLand(x, z, r) { for (var a = 0; a < 8; a++) { var px = x + Math.cos(a * PI / 4) * r, pz = z + Math.sin(a * PI / 4) * r; if (!outside(px, pz) || isWater(px, pz) || gridH(px, pz) < -.2) return false; } return outside(x, z) && !isWater(x, z); }
  function flatEnough(x, z, r) { var mn = 1e9, mx = -1e9; for (var a = 0; a < 8; a++) { var h = gridH(x + Math.cos(a * PI / 4) * r, z + Math.sin(a * PI / 4) * r); mn = Math.min(mn, h); mx = Math.max(mx, h); } return mx - mn < Math.max(3, r * .6); }
  function okSpot(x, z, r, road) { return onLand(x, z, r) && flatEnough(x, z, r) && !nearRoad(x, z, r + (road === undefined ? 3 : road)) && freeAt(x, z, r); }
  E.okSpot = okSpot;
  /* дом игры (bldR) + цоколь: bldR меряет землю в 5 точках, а под домом она может быть ниже — тогда снизу добавляется бетонный цоколь */
  function bldRx(x, z, w, d, h, ry, style, o) {
    var r = bldR(x, z, w, d, h, ry, style, o);
    try { var cs = Math.cos(ry), sn = Math.sin(ry), lo = 1e9, lo5 = 1e9, hi5 = -1e9;
      [[-w / 2, -d / 2], [w / 2, -d / 2], [-w / 2, d / 2], [w / 2, d / 2], [0, 0]].forEach(function (q) { var y = H(x + cs * q[0] + sn * q[1], z - sn * q[0] + cs * q[1]); lo5 = Math.min(lo5, y); hi5 = Math.max(hi5, y); });
      var base = hi5 - lo5 > .05 ? lo5 - 1.5 : lo5;
      for (var i = 0; i <= 4; i++) for (var j = 0; j <= 4; j++) { var lx = -w / 2 + w * i / 4, lz = -d / 2 + d * j / 4; lo = Math.min(lo, H(x + cs * lx + sn * lz, z - sn * lx + cs * lz)); }
      if (lo < base - .03) { var m = new THREE.Mesh(G.box, mat(0xa8a49a)); m.scale.set(w + .1, base - lo + 1.2, d + .1); m.position.set(x, (base + lo - 1.2) / 2 + .02, z); m.rotation.y = ry; m.userData.st = true; cityG.add(m); E.stats.plinths = (E.stats.plinths || 0) + 1; } } catch (e) { }
    return r;
  }
  function minH(x, z, r) { var m = H(x, z); for (var a = 0; a < 8; a++) m = Math.min(m, H(x + Math.cos(a * PI / 4) * r, z + Math.sin(a * PI / 4) * r)); return m; }
  function house(x, z, w, d, h, ry, style, o) { if (!okSpot(x, z, Math.max(w, d) / 2 + 1)) return false; bldRx(x, z, w, d, h, ry, style, o || {}); E.stats.houses = (E.stats.houses || 0) + 1; return true; }
  /* дома вдоль дороги: по обе стороны, с разными отступами и размерами */
  function alongRoad(P, spacing, fn) { var L = resample(P, spacing); for (var i = 1; i < L.length - 1; i++) { var p = L[i], q = L[i + 1], a = Math.atan2(q[0] - p[0], q[1] - p[1]); for (var s = -1; s <= 1; s += 2) fn(p[0], p[1], a, s, i); } }
  function streetHouses(ri, spacing, off, mk) { var r = RD[ri]; alongRoad(r.P, spacing, function (x, z, a, s, i) { if (R() < .18) return; var o = r.w / 2 + off + R() * 4, px = x + Math.cos(a) * o * s, pz = z - Math.sin(a) * o * s; mk(px, pz, a + (s > 0 ? PI / 2 : -PI / 2), i); }); }
  var PASTEL = ['#f4d6c6', '#f6e6b8', '#cfe6e0', '#e8d4ee', '#d6e4f4', '#f8f0dc', '#f2c9b4', '#d8ecc8'];
  function palm(x, z, s) {
    s = s || 1; var y = H(x, z), lean = (R() - .5) * .3;
    for (var k = 0; k < 5; k++) M_(cityG, G.cyl, 0x8a6a48, [.32 * s - k * .03, 1.2 * s, .32 * s - k * .03], [x + lean * k * .6, y + .6 * s + k * 1.15 * s, z]);
    var top = y + 6 * s, tx = x + lean * 3;
    for (var f = 0; f < 7; f++) { var a = f / 7 * TAU_; M_(cityG, G.box, pk([0x3f8a3c, 0x4f9a42, 0x2f7a34]), [.5 * s, .12 * s, 3.2 * s], [tx + Math.sin(a) * 1.4 * s, top - .3 * s, z + Math.cos(a) * 1.4 * s], [-.35, a, 0]); }
    addColC(x, z, .35, y + 4);
  }
  function pine(x, z, s) { s = s || 1; var y = H(x, z); M_(cityG, G.cyl, 0x5b3d29, [.34 * s, 3 * s, .34 * s], [x, y + 1.5 * s, z]); M_(cityG, G.cone, pineMat, [2.8 * s, 3.4 * s, 2.8 * s], [x, y + 3.6 * s, z]); M_(cityG, G.cone, pineMat, [2.1 * s, 2.8 * s, 2.1 * s], [x, y + 5.2 * s, z]); M_(cityG, G.cone, pineMat, [1.3 * s, 2.2 * s, 1.3 * s], [x, y + 6.6 * s, z]); addColC(x, z, .35, y + 5); }
  function umbrella(x, z) { var y = H(x, z), c = pk([0xe8473b, 0xf2c230, 0x3a8ae0, 0x2fae5b, 0xffffff]); M_(cityG, G.cyl, 0xdddddd, [.08, 2.4, .08], [x, y + 1.2, z]); M_(cityG, G.cone, c, [2.6, .7, 2.6], [x, y + 2.5, z]); M_(cityG, G.box, 0xf4f0e4, [.7, .12, 1.8], [x + 1, y + .25, z + .3]); }
  function kiosk(x, z, ry, emoji, label, color) { bldRx(x, z, 3.2, 2.6, 2.6, ry, 'panel', { color: color || '#f6e6b8', doors: 0 }); var sp = emojiSprite(emoji, 1.2); sp.position.set(x, H(x, z) + 3.6, z); cityG.add(sp); if (label) try { signH(label, 3, .5, x + Math.sin(ry) * 1.45, 2.4, z + Math.cos(ry) * 1.45, ry, '#ffffff', '#1d2129', { fs: .3 }); } catch (e) { } }
  /* первая вода при движении от z0 в сторону dir; высота настила — чуть выше берега */
  function shoreZ(x, z0, dir) { for (var z = z0; Math.abs(z - z0) < 900; z += 2 * dir) { if (isWater(x, z) || gridH(x, z) < -.3) { var y = Math.max(.75, gridH(x, z - 8 * dir) + .25); return { z: z, y: y }; } } return { z: z0, y: 1 }; }
  function deck(x0, x1, z0, z1, y, posts) {
    DECKS.push({ x0: x0, x1: x1, z0: z0, z1: z1, y: y });
    M_(cityG, G.box, 0x9a7048, [x1 - x0, .3, z1 - z0], [(x0 + x1) / 2, y - .15, (z0 + z1) / 2]);
    if (posts) for (var x = x0 + 1; x < x1; x += 6) for (var z = z0 + 1; z < z1; z += 6) M_(cityG, G.cyl, 0x6a4a30, [.35, 3.4, .35], [x, y - 1.8, z]);
  }
  function boat(x, z, ry, big) { var g = new THREE.Group(); g.position.set(x, SEA_Y + .1, z); g.rotation.y = ry; cityG.add(g); var s = big ? 2.4 : 1;
    M_(g, G.box, pk([0xffffff, 0xf2f2ea, 0x3a6a9a]), [2.2 * s, 1 * s, 7 * s], [0, .3 * s, 0], null, false); M_(g, G.box, 0xdcdcd4, [1.6 * s, .9 * s, 2.4 * s], [0, 1.2 * s, -.6 * s], null, false); if (!big) M_(g, G.cyl, 0xdddddd, [.08, 8, .08], [0, 4.6, .8], null, false);
    (E.boats = E.boats || []).push({ g: g, ph: R() * 6 }); return g; }

  /* ====================== ЗОНЫ ====================== */
  function zoneSouth() {
    // город «Чэайное»: площадь с фонтаном (кварталы вокруг строит модуль города)
    var C = [225, 975]; E.lm.push({ x: C[0], z: C[1], e: '🫖', n: 'Город «Чэайное» · площадь' });
    try { var y = H(C[0], C[1]); M_(cityG, G.cyl, 0xd8d0c0, [9, .6, 9], [C[0], y + .3, C[1]]); M_(cityG, G.cyl, 0x4aa0d8, [7.6, .1, 7.6], [C[0], y + .62, C[1]]); M_(cityG, G.cyl, 0xd8d0c0, [1, 3.4, 1], [C[0], y + 1.7, C[1]]); addColC(C[0], C[1], 4.6, y + .7);
      signH('ЧЭАЙНОЕ', 6, 1.2, C[0], 5.2, C[1] - 6, 0, '#ffb15a', '#ffffff', { fs: .8 }); [-2.6, 2.6].forEach(function (dx) { var px = C[0] + dx, pz = C[1] - 6.1, py = H(px, pz); M_(cityG, G.box, 0x8a6a48, [.2, 5.6, .2], [px, py + 2.8, pz]); addColC(px, pz, .15, py + 5); }); } catch (e) { }
    for (var a = 0; a < 8; a++) { var px = C[0] + Math.cos(a / 8 * TAU_) * 12, pz = C[1] + Math.sin(a / 8 * TAU_) * 12; if (okSpot(px, pz, 1, 2)) palm(px, pz, 1.1); }
    // набережная: пальмы, фонари, скамейки, ларьки, зонтики на пляже, пирс
    var prom = []; for (var x = -320; x <= 780; x += 14) { var cz = coastS(x) - 46; if (!isWater(x, cz) && outside(x, cz)) prom.push([x, cz]); else if (prom.length > 4) break; }
    if (prom.length > 4) {
      RD.push({ n: 'Набережная', w: 6, p: prom.filter(function (p, i) { return i % 4 === 0; }), P: null }); var pr = RD[RD.length - 1]; pr.P = smooth(pr.p); snapEnds(pr, 80); ROADPTS.push(pr.P);
      // если конец набережной не дошёл до дороги — короткая улица к ближайшей
      [pr.P[0], pr.P[pr.P.length - 1]].forEach(function (p) { var best = null, bd = 1e9; RD.forEach(function (o) { if (o === pr || !o.P) return; o.P.forEach(function (q) { var d = Math.hypot(q[0] - p[0], q[1] - p[1]); if (d < bd) { bd = d; best = q; } }); });
        if (best && bd > 3 && bd < 320) { var cn = { w: 6, p: [p, best], P: [p, best] }; RD.push(cn); buildRoad(cn); } });
      ROADS.push({ pts: pr.P, w: 6, ex: true }); ribbon(pr.P, 9, walkMat, .26); E.lm.push({ x: 250, z: coastS(250) - 46, e: '🌴', n: 'Набережная' });
      alongRoad(pr.P, 14, function (x, z, a, s, i) { var o = 6.4 * s, px = x + Math.cos(a) * o, pz = z - Math.sin(a) * o; if (s > 0 && i % 2 === 0 && okSpot(px, pz, .6, 1)) palm(px, pz, rr_(.9, 1.25)); else if (s < 0 && i % 3 === 0 && okSpot(px, pz, .6, 1)) lampH(px, pz, a + PI / 2); else if (s < 0 && i % 5 === 1 && okSpot(px, pz, 1, .5)) benchH(px, pz, a + PI / 2); });
      alongRoad(pr.P, 70, function (x, z, a, s, i) { if (s > 0) return; var o = -13, px = x + Math.cos(a) * o, pz = z - Math.sin(a) * o; if (okSpot(px, pz, 2.4, 1)) kiosk(px, pz, a + PI, pk(['🍦', '🌽', '🥤', '🍉', '🫖']), pk(['МОРОЖЕНОЕ', 'КУКУРУЗА', 'ЧЭАЙ', 'АРБУЗЫ'])); });
    }
    for (x = -300; x <= 760; x += 11) { var bz = coastS(x) - 22 + R() * 8; if (!isWater(bz > 0 ? x : x, bz) && gridH(x, bz) > .2 && gridH(x, bz) < 2 && !nearRoad(x, bz, 3) && R() < .55) umbrella(x, bz); }
    var sh = shoreZ(250, 1150, 1); var pz0 = sh.z - 8, py = sh.y; deck(246, 254, pz0, pz0 + 150, py, true); deck(236, 264, pz0 + 140, pz0 + 156, py, true); lampH(250, pz0 + 150, 0); E.lm.push({ x: 250, z: pz0 + 120, e: '🎣', n: 'Пирс' });
    try { signH('ПИРС', 3, .6, 250, 3.2, pz0 + 2, PI, '#3a6a9a', '#ffffff', { fs: .45 }); } catch (e) { }
    // марина в бухте
    for (var k = 0; k < 4; k++) { var mx = -520 + k * 36, ms = shoreZ(mx, 960, 1), mz0 = ms.z - 6; deck(mx - 2, mx + 2, mz0, mz0 + 70, ms.y, true); for (var b = 0; b < 3; b++) boat(mx + (b % 2 ? 6 : -6), mz0 + 20 + b * 18, 0); }
    E.lm.push({ x: -450, z: 1080, e: '⛵', n: 'Марина' });
    // санаторий «Гусиный бор»
    [[-920, 980, 46, 16, 18], [-860, 1040, 30, 14, 12], [-980, 900, 28, 14, 15]].forEach(function (b) { house(b[0], b[1], b[2], b[3], b[4], .3, 'new', { color: '#f4f4f0', doors: 2 }); });
    for (k = 0; k < 120; k++) { var sx = rr_(-1080, -720), sz = rr_(840, 1160); if (okSpot(sx, sz, 1.2, 2)) pine(sx, sz, rr_(.9, 1.4)); }
    E.lm.push({ x: -900, z: 990, e: '🌲', n: 'Санаторий «Гусиный бор»' });
    // виллы на склоне
    for (k = 0; k < 60 && (E.stats.villas || 0) < 16; k++) { var vx = rr_(680, 960), vz = rr_(920, 1250); if (house(vx, vz, rr_(10, 14), rr_(9, 12), rr_(5, 8), rr_(0, PI), 'panel', { color: pk(['#ffffff', '#f8f0dc', '#f4e4d4']), pitched: 2.6, doors: 1 })) { E.stats.villas = (E.stats.villas || 0) + 1; var pxx = vx + 9, pzz = vz + 2; if (okSpot(pxx, pzz, 2.5, 1)) { M_(cityG, G.box, 0x3ac0e8, [6, .1, 4], [pxx, H(pxx, pzz) + .12, pzz]); } if (okSpot(vx - 8, vz, .6, 1)) palm(vx - 8, vz); } }
    E.lm.push({ x: 820, z: 1080, e: '🏡', n: 'Виллы' });
    // маяк
    lighthouse(934, 1480);
    // пальмы и деревья по югу
    for (k = 0; k < 160; k++) { var tx = rr_(-760, 1000), tz = rr_(1150, 1350); if (okSpot(tx, tz, 1, 2)) palm(tx, tz, rr_(.8, 1.2)); }
  }
  function lighthouse(x, z) {
    if (!onLand(x, z, 3)) { for (var r = 0; r < 120 && !onLand(x, z, 3); r += 6) { x -= Math.cos(1.02) * 6; z -= Math.sin(1.02) * 6; } }
    var y = minH(x, z, 2.4) - .3; for (var i = 0; i < 8; i++) M_(cityG, G.cyl, i % 2 ? 0xe8473b : 0xffffff, [4.6 - i * .3, 3, 4.6 - i * .3], [x, y + 1.5 + i * 3, z]);
    M_(cityG, G.cyl, new THREE.MeshBasicMaterial({ color: 0xfff2a8 }), [2.4, 2.4, 2.4], [x, y + 25.5, z], null, false); M_(cityG, G.cone, 0xe8473b, [3, 2, 3], [x, y + 27.7, z]);
    var beam = new THREE.Mesh(new THREE.ConeGeometry(4, 60, 16, 1, true), new THREE.MeshBasicMaterial({ color: 0xfff2a8, transparent: true, opacity: .18, depthWrite: false, side: THREE.DoubleSide }));
    beam.rotation.z = PI / 2; var piv = new THREE.Group(); piv.position.set(x, y + 25.5, z); piv.add(beam); beam.position.x = 30; cityG.add(piv); E.beam = piv;
    addColC(x, z, 2.4, y + 26); E.lh = { x: x, z: z, y: y }; E.lm.push({ x: x, z: z, e: '🗼', n: 'Маяк' });
    addI({ p: function () { return E.active ? { x: x, z: z + 3.4 } : null; }, r: 2.6, label: '🗼 Подняться на маяк', act: function () { view(x, y + 28, z, 0, '🗼 С маяка видно весь полуостров: город, посёлок «Чэайное», виллы и бесконечное море.'); } });
  }
  function zoneNorth() {
    for (var k = 0; k < 420; k++) { var x = rr_(-760, 760), z = rr_(-1060, -760); if (okSpot(x, z, 1.2, 2.5)) pine(x, z, rr_(.9, 1.5)); }
    // кемпинг
    for (k = 0; k < 9; k++) { var tx = -160 + (k % 3) * 9 + rr_(-2, 2), tz = -945 + Math.floor(k / 3) * 9; if (okSpot(tx, tz, 1.6, 1)) { M_(cityG, G.cone, pk([0xe8742a, 0x3a8ae0, 0x2fae5b, 0xf2c230]), [3.2, 2.4, 3.2], [tx, H(tx, tz) + 1.2, tz]); addColC(tx, tz, 1.5, H(tx, tz) + 2); } }
    var cf = emojiSprite('🔥', 1.2); cf.position.set(-150, H(-150, -930) + .8, -930); cityG.add(cf); E.lm.push({ x: -150, z: -930, e: '⛺', n: 'Кемпинг' });
    // пляжи озера и прокат лодок
    for (var x = -300; x <= 300; x += 12) { var bz = -985 - Math.sqrt(Math.max(0, 1 - Math.pow(x / 360, 2))) * 0 + rr_(-6, 2); if (gridH(x, bz) > .2 && gridH(x, bz) < 2 && !nearRoad(x, bz, 3) && !isWater(x, bz) && R() < .5) umbrella(x, bz); }
    deck(-34, -28, -1000, -960, 1.2, true); for (k = 0; k < 4; k++) boat(-45 + k * 6, -1010, PI);
    E.lm.push({ x: 0, z: -1170, e: '🏖️', n: 'Озеро «Тихое»' });
    // гора «Гусиная»: канатная дорога
    cableCar([470, -1010], [520, -1295]);
    // термы
    var T = [-560, -1250];
    for (k = 0; k < 3; k++) { var dx = T[0] - 30 + k * 30, dz = T[1] + (k % 2) * 12; if (!onLand(dx, dz, 8)) continue; var y = minH(dx, dz, 9) - .2; M_(cityG, G.hemi, 0xe8d8c8, [9, 6, 9], [dx, y, dz]); M_(cityG, G.box, 0x3ac0e8, [10, .2, 6], [dx, y + .15, dz + 13]); addColC(dx, dz, 9, y + 6); var st = emojiSprite('♨️', 1.6); st.position.set(dx, y + 2, dz + 13); cityG.add(st); }
    E.lm.push({ x: T[0], z: T[1], e: '♨️', n: 'Термы' });
    addI({ p: function () { return E.active ? { x: T[0], z: T[1] + 22 } : null; }, r: 4, label: '♨️ Погреться в термах', act: function () { cutscene(async function () { await fade(1, 500, '♨️ …'); await wait(1200); await fade(0, 500); await say([['gus', 'Я — суп. Я тёплый суп из гуся.'], ['marya', 'Не говори так. Но да.']]); }); } });
  }
  function cableCar(a, b) {
    var ya = minH(a[0], a[1], 5) - .3, yb = minH(b[0], b[1], 6) - .3;
    if (!onLand(a[0], a[1], 4) || !onLand(b[0], b[1], 4)) { E.stats.cableFail = true; }
    M_(cityG, G.box, 0xd8d0c0, [8, 5, 6], [a[0], ya + 2.5, a[1]]); M_(cityG, G.box, 0xd8d0c0, [10, 4, 8], [b[0], yb + 2, b[1]]); addColR(a[0], a[1], 8, 6, 0, ya + 5); addColR(b[0], b[1], 10, 8, 0, yb + 4);
    var L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(2, Math.round(L / 70)), towers = [];
    for (var i = 0; i <= n; i++) { var t = i / n, x = a[0] + (b[0] - a[0]) * t, z = a[1] + (b[1] - a[1]) * t, y = H(x, z) + (i === 0 || i === n ? 7 : 14); towers.push([x, y, z]); if (i > 0 && i < n) M_(cityG, G.box, 0x6a7078, [.8, y - H(x, z), .8], [x, (y + H(x, z)) / 2, z]); }
    var ang = Math.atan2(b[0] - a[0], b[1] - a[1]);
    for (i = 0; i < towers.length - 1; i++) { var p = towers[i], q = towers[i + 1], dx = q[0] - p[0], dy = q[1] - p[1], dz = q[2] - p[2], l = Math.hypot(dx, dy, dz);
      for (var s = -1; s <= 1; s += 2) { var c = new THREE.Mesh(G.box, mat(0x2a2a2a)); c.scale.set(.06, .06, l); c.position.set((p[0] + q[0]) / 2 + Math.cos(ang) * s * 1.2, (p[1] + q[1]) / 2, (p[2] + q[2]) / 2 - Math.sin(ang) * s * 1.2); c.rotation.order = 'YXZ'; c.rotation.y = ang; c.rotation.x = -Math.atan2(dy, Math.hypot(dx, dz)); c.userData.st = true; cityG.add(c); } }
    E.cabins = []; for (i = 0; i < 4; i++) { var g = new THREE.Group(); M_(g, G.box, pk([0xe8473b, 0xf2c230, 0x3a8ae0, 0x2fae5b]), [1.8, 1.6, 1.6], [0, -1.4, 0], null, false); M_(g, G.cyl, 0x2a2a2a, [.08, 1.2, .08], [0, -.3, 0], null, false); cityG.add(g); E.cabins.push({ g: g, t: i / 4, dir: i % 2 ? 1 : -1 }); }
    E.cable = towers; E.lm.push({ x: b[0], z: b[1], e: '🚡', n: 'Гора «Гусиная» · смотровая' });
    try { signH('ГОРА «ГУСИНАЯ» · 70 М', 5, .7, b[0], 5.4, b[1] + 4.1, 0, '#2a3a4a', '#ffffff', { fs: .42 }); signH('КАНАТНАЯ ДОРОГА', 5, .6, a[0], 5.6, a[1] + 3.1, 0, '#e8473b', '#ffffff', { fs: .42 }); } catch (e) { }
    addI({ p: function () { return E.active ? { x: a[0], z: a[1] + 5 } : null; }, r: 3, label: '🚡 Подняться на гору', act: function () { ride(towers, false); } });
    addI({ p: function () { return E.active ? { x: b[0], z: b[1] + 6 } : null; }, r: 3, label: '🚡 Спуститься на канатке', act: function () { ride(towers, true); } });
    addI({ p: function () { return E.active ? { x: b[0] + 6, z: b[1] + 6 } : null; }, r: 3, label: '🔭 Смотровая площадка', act: function () { view(b[0], yb + 12, b[1], PI, '🔭 Внизу озеро «Тихое», за ним бор и весь город. Где-то там — Дикси.'); } });
  }
  function ride(T_, down) {
    cutscene(async function () {
      var pts = down ? T_.slice().reverse() : T_, t0 = performance.now(), dur = 9000, L = [0], i;
      for (i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][2] - pts[i - 1][2]));
      var tot = L[L.length - 1]; comp.hidden = true; comp.g.visible = false;
      await new Promise(function (res) { (function f() { var u = Math.min(1, (performance.now() - t0) / dur), d = u * tot, k = 1; while (k < L.length - 1 && L[k] < d) k++; var a = pts[k - 1], b = pts[k], w = (d - L[k - 1]) / Math.max(.01, L[k] - L[k - 1]);
        player.ovr = { x: a[0] + (b[0] - a[0]) * w, y: a[1] + (b[1] - a[1]) * w - 2.8, z: a[2] + (b[2] - a[2]) * w }; cam.force = { yaw: down ? 0 : PI, pitch: .25, dist: 9 }; if (u < 1) requestAnimationFrame(f); else res(); })(); });
      var e = pts[pts.length - 1]; player.ovr = null; cam.force = null; placeA(player, e[0], e[2] + 6, 0); showComp(e[0] + 1.4, e[2] + 6.6); toast(down ? '🚡 Внизу.' : '🚡 Вершина горы «Гусиной». 70 метров над морем.', 2600);
    });
  }
  function view(x, y, z, yaw, text) {
    cutscene(async function () {
      cam.fixed = { pos: new THREE.Vector3(x, y, z), look: new THREE.Vector3(x + Math.sin(yaw) * 80, y - 14, z + Math.cos(yaw) * 80) };
      var t0 = performance.now(); await new Promise(function (res) { (function f() { var u = (performance.now() - t0) / 7000; var a = yaw + u * PI * 1.4; cam.fixed.look.set(x + Math.sin(a) * 80, y - 14, z + Math.cos(a) * 80); if (u < 1) requestAnimationFrame(f); else res(); })(); });
      await say([['sys', text]]); cam.fixed = null;
    });
  }
  function zoneWest() {
    // рыбацкая деревня у реки
    var V = [-910, -760], n = 0;
    for (var k = 0; k < 120 && n < 16; k++) { var x = V[0] + rr_(-90, 90), z = V[1] + rr_(-120, 120); if (house(x, z, rr_(6, 9), rr_(6, 8), rr_(3, 5), rr_(0, PI), 'wood', { pitched: 2, doors: 1 })) n++; }
    for (k = 0; k < 6; k++) { var bx = -965 - k * 4, bz = -640 - k * 22; if (isWater(bx, bz)) boat(bx, bz, .4 + k * .2); }
    E.lm.push({ x: V[0], z: V[1], e: '🎣', n: 'Рыбацкая деревня' });
    for (k = 0; k < 120; k++) { var tx = rr_(-1100, -760), tz = rr_(-1000, -560); if (okSpot(tx, tz, 1.2, 2.5)) pine(tx, tz, rr_(.9, 1.3)); }
  }
  function zoneEast() {
    // порт у бухты
    var P0 = [905, -380];
    for (var k = 0; k < 3; k++) { var cx = P0[0] + 10, cz = P0[1] - 40 + k * 40; if (!onLand(cx, cz, 3)) continue; var y = H(cx, cz); M_(cityG, G.box, 0xf2c230, [2, 22, 2], [cx, y + 11, cz]); M_(cityG, G.box, 0xf2c230, [22, 1.6, 1.6], [cx + 8, y + 21, cz]); addColR(cx, cz, 2.4, 2.4, 0, y + 22); }
    for (k = 0; k < 30; k++) { var x = P0[0] - 40 + (k % 6) * 7, z = P0[1] - 60 + Math.floor(k / 6) * 14; if (!okSpot(x, z, 4, 1)) continue; var yy = H(x, z), hh = 2.6 * (1 + (k % 3)); M_(cityG, G.box, pk([0xc0392b, 0x2e86c1, 0x27ae60, 0xd35400, 0x7d3c98]), [6, hh, 2.6], [x, yy + hh / 2, z]); addColR(x, z, 6, 2.6, 0, yy + hh); }
    boat(1050, -300, .3, true); boat(1080, -40, 2.4, true); E.lm.push({ x: P0[0], z: P0[1], e: '⚓', n: 'Порт' });
    // скалистый берег: валуны и смотровые скамейки
    for (k = 0; k < 60; k++) { var rx = rr_(820, 1060), rz = rr_(-1000, -700); if (!onLand(rx, rz, 3) || nearRoad(rx, rz, 4)) continue; var s = rr_(2, 5), ry = H(rx, rz); M_(cityG, G.sph, pk([0x8a8478, 0x7a7468, 0x9a948a]), [s * 2, s * 1.4, s * 1.8], [rx, ry + s * .4, rz]); addColC(rx, rz, s * .9, ry + s); }
    E.lm.push({ x: 930, z: -880, e: '🪨', n: 'Скалистый берег' });
    // парк аттракционов
    amusement(960, 600);
    for (k = 0; k < 40; k++) { var tx = rr_(880, 1100), tz = rr_(480, 760); if (okSpot(tx, tz, 1.2, 2.5)) palm(tx, tz, rr_(.8, 1.1)); }
  }
  /* Посёлки вдоль выездов и кольца (плавный переход от пригорода), дачи у озера, портовый посёлок и лес на пустых местах */
  function zoneFill() {
    var dacha = function (x, z, ry) { house(x, z, rr_(6, 9), rr_(6, 8), rr_(3, 5.5), ry, R() < .55 ? 'wood' : 'panel', { color: R() < .5 ? pk(PASTEL) : undefined, pitched: rr_(1.6, 2.4), doors: 1 }); };
    [1, 2, 3].forEach(function (ri) { streetHouses(ri, 15, 9, function (x, z, ry) { if (!outside(x, z) || R() < .25) return; dacha(x, z, ry); }); });
    streetHouses(0, 18, 9, function (x, z, ry) {
      if (!(z < -742 && x < 250) || R() < .45) return;                            // дачи только в пригороде (север); остальное — город
      dacha(x, z, ry);
    });
    streetHouses(21, 16, 9.5, function (x, z, ry) { if (R() < .35) return; house(x, z, rr_(7, 10), rr_(6, 8), rr_(3, 5), ry, 'wood', { pitched: rr_(2, 2.8), doors: 1 }); });
    // лес: на севере сосны, посередине лиственные, на юге пальмы; гуще в бору и на северо-западе
    var n = 0;
    for (var k = 0; k < 2600 && n < 1300; k++) {
      var x = rr_(-1500, 1500), z = rr_(-1650, 1500); if (!outside(x, z) || isWater(x, z)) continue;
      var dense = (x < -500 && z < -900) || (x > 600 && z < -700) || (Math.hypot(x + 900, z - 1000) < 200) || (z < -760 && z > -1000);
      if (!(z < -742 || Math.hypot(x + 900, z - 1000) < 220 || (z > 1150 && x > -700))) continue;   // лес — только в пригороде, у санатория и у моря
      if (!dense && R() < .55) continue;
      if (!okSpot(x, z, 1.2, 4)) continue;
      if (z < -600) pine(x, z, rr_(.9, 1.5)); else if (z > 1000 && x > -700) palm(x, z, rr_(.8, 1.2)); else treeH(x, z, rr_(.9, 1.4));
      n++;
    }
    E.stats.fillTrees = n;
  }
  function amusement(x, z) {
    if (!onLand(x, z, 30)) { E.stats.parkShift = true; for (var t = 0; t < 30 && !onLand(x, z, 30); t++) x -= 6; }
    var y = H(x, z);
    // колесо обозрения
    var W = new THREE.Group(); W.position.set(x, y + 25, z); cityG.add(W);
    var rim = new THREE.Mesh(new THREE.TorusGeometry(22, .5, 8, 48), mat(0xe8e8f0)); W.add(rim);
    for (var i = 0; i < 12; i++) { var a = i / 12 * TAU_, sp = new THREE.Mesh(G.box, mat(0xc8c8d0)); sp.scale.set(.3, 22, .3); sp.position.set(Math.cos(a) * 11, Math.sin(a) * 11, 0); sp.rotation.z = a + PI / 2; W.add(sp);
      var cab = new THREE.Group(); cab.position.set(Math.cos(a) * 22, Math.sin(a) * 22, 0); W.add(cab); M_(cab, G.box, [0xe8473b, 0xf2c230, 0x3a8ae0, 0x2fae5b][i % 4], [2, 2, 2], [0, -1.6, 0], null, false); (E.wheelCabs = E.wheelCabs || []).push(cab); }
    M_(cityG, G.box, 0x9aa0a8, [1.2, 26, 1.2], [x - 4, y + 12, z], [0, 0, .17]); M_(cityG, G.box, 0x9aa0a8, [1.2, 26, 1.2], [x + 4, y + 12, z], [0, 0, -.17]); addColR(x, z, 12, 3, 0, y + 25); E.wheel = W;
    // карусель, аквапарк, вход
    var c2 = new THREE.Group(); c2.position.set(x - 30, y, z + 24); cityG.add(c2); M_(c2, G.cyl, 0xd8342a, [10, .4, 10], [0, .4, 0], null, false); M_(c2, G.cone, 0xf2c230, [11, 3, 11], [0, 5.4, 0], null, false); M_(c2, G.cyl, 0xf2c230, [.5, 4, .5], [0, 2.6, 0], null, false); E.carousel = c2; addColC(x - 30, z + 24, 5.4, y + 1);
    for (i = 0; i < 3; i++) { var px = x + 28, pz = z + 10 + i * 14; M_(cityG, G.box, 0x3ac0e8, [12, .2, 9], [px, y + .15, pz]); M_(cityG, G.cyl, pk([0xff5a9a, 0x5ae0ff, 0xffd23f]), [1.6, 14, 1.6], [px - 8, y + 6, pz], [.9, 0, 0]); }
    try { signH('ПАРК «СОЛНЕЧНЫЙ»', 8, 1.2, x, 6, z - 32, PI, '#ff8a2a', '#ffffff', { fs: .7 }); } catch (e) { }
    E.lm.push({ x: x, z: z, e: '🎡', n: 'Парк «Солнечный»' });
    addI({ p: function () { return E.active ? { x: x, z: z - 6 } : null; }, r: 3.4, label: '🎡 Прокатиться на колесе обозрения', act: function () { view(x + 6, y + 46, z - 4, PI * .8, '🎡 На самом верху колеса обозрения. Ветер. Море. Гусь держит свою кабинку обеими крыльями.'); } });
  }

  /* ====================== СБОРКА, ВКЛЮЧЕНИЕ И ВЫКЛЮЧЕНИЕ ====================== */
  /* Забор и просеки ворот. Старый город склеен в крупные куски, поэтому лишнее (забор, деревья и фонари в воротах)
     убирается так: нужные треугольники схлопываются в точку, исходные координаты хранятся и возвращаются при выключении. */
  var CUT = null;
  var KEEPMAT = null;
  function inGate(x, z, m) {
    for (var i = 0; i < GATES.length; i++) { var G_ = GATES[i], dx = G_[2], dz = G_[3], al = (x - G_[0]) * dx + (z - G_[1]) * dz, len = dx ? (SQ + 3 - Math.abs(G_[0])) : (SQ + 3 - Math.abs(G_[1]));
      if (al > -1 && al < len && Math.abs((x - G_[0]) * dz - (z - G_[1]) * dx) < 8.5 + (m || 0)) return true; }
    return false;
  }
  function inFence(x, z) { return (Math.abs(Math.abs(x) - 736) < .35 && Math.abs(z) < 762) || (Math.abs(Math.abs(z) - 736) < .35 && Math.abs(x) < 762); }
  E.inGate = inGate;
  function cutFind() {
    if (CUT) return CUT; CUT = { cols: [], tris: [], objs: [], lamps: [], benches: [] };
    var fm = mat(0x9a948a); KEEPMAT = [roadMat, walkMat, groundMat]; try { KEEPMAT.push(curbMat, mat(0xe8e8e0)); } catch (e) { }
    cols.forEach(function (c) {
      if (REC && REC.cols.indexOf(c) >= 0) return;
      var w = c.x1 - c.x0, d = c.z1 - c.z0, cx = (c.x0 + c.x1) / 2, cz = (c.z0 + c.z1) / 2;
      var fence = c.rad === undefined && ((w < .6 && d > 40 && Math.abs(Math.abs(cx) - 736) < .4) || (d < .6 && w > 40 && Math.abs(Math.abs(cz) - 736) < .4));
      var gate = Math.max(w, d) <= 2.2 && Math.abs(cx) < SQ && Math.abs(cz) < SQ && inGate(cx, cz, Math.max(w, d) / 2);
      if (fence || gate) CUT.cols.push(c);
    });
    cityG.children.forEach(function (o) {
      if (o === E.g) return;
      if (o.userData.merged && o.isMesh) {
        var isF = o.material === fm, keep = KEEPMAT.indexOf(o.material) >= 0, p = o.geometry.attributes.position, a = p.array, list = [];
        if (keep) return;
        for (var t = 0; t < p.count; t += 3) {
          var k = t * 3, x0 = a[k], z0 = a[k + 2], x1 = a[k + 3], z1 = a[k + 5], x2 = a[k + 6], z2 = a[k + 8], cx = (x0 + x1 + x2) / 3, cz = (z0 + z1 + z2) / 3, cy = (a[k + 1] + a[k + 4] + a[k + 7]) / 3;
          if (isF && inFence(x0, z0) && inFence(x1, z1) && inFence(x2, z2) && cy < 5) list.push(t);
          else if (Math.abs(cx) < SQ && Math.abs(cz) < SQ && inGate(cx, cz) && cy > .25) list.push(t);
        }
        if (list.length) { var orig = new Float32Array(list.length * 9); list.forEach(function (t, n) { for (var q = 0; q < 9; q++) orig[n * 9 + q] = a[t * 3 + q]; }); CUT.tris.push({ o: o, list: list, orig: orig }); }
        return;
      }
      // не склеенные: фонари, сугробы, отдельные куски забора
      var px = o.position.x, pz = o.position.z;
      if (o.isMesh && o.material === fm && inFence(px, pz)) { CUT.objs.push(o); return; }
      if (TRAFFIC.some(function (t) { return t.g === o; })) return;
      if (!(Math.abs(px) < SQ && Math.abs(pz) < SQ && inGate(px, pz))) return;
      // только неподвижное: фонари, скамейки и статичные детали (люди, животные и машины не трогаются)
      if (LIFTL.some(function (L) { return L.g === o; })) { CUT.objs.push(o); return; }
      var lb = LIFTB.find(function (b) { return b.g === o; }); if (lb) { CUT.benches.push(lb); return; }
      if (o.isMesh && o.userData.st === true && KEEPMAT.indexOf(o.material) < 0 && !o.userData.cull) CUT.objs.push(o);
    });
    for (var i = LAMPS.length - 1; i >= 0; i--) { var L = LAMPS[i]; if (Math.abs(L[0]) < SQ && Math.abs(L[2]) < SQ && inGate(L[0], L[2])) CUT.lamps.push(L); }
    return CUT;
  }
  function cutSet(open) {
    var F = cutFind();
    F.cols.forEach(function (c) { c.on = !open; });
    F.objs.forEach(function (m) { m.visible = !open; });
    F.benches.forEach(function (b) { if (!!b.__cut === open) return; b.__cut = open; b.g.position.y += open ? -100 : 100; });
    F.lamps.forEach(function (L) { var i = LAMPS.indexOf(L); if (open && i >= 0) LAMPS.splice(i, 1); if (!open && i < 0) LAMPS.push(L); });
    F.tris.forEach(function (T_) { var a = T_.o.geometry.attributes.position.array; T_.list.forEach(function (t, n) { for (var q = 0; q < 9; q++) a[t * 3 + q] = open ? T_.orig[n * 9 + (q % 3)] : T_.orig[n * 9 + q]; }); T_.o.geometry.attributes.position.needsUpdate = true; });
    E.stats.cut = { cols: F.cols.length, objs: F.objs.length, tris: F.tris.reduce(function (s, t) { return s + t.list.length; }, 0), lamps: F.lamps.length };
  }
  /* Мини-карта (радар): старая карта покрывает только ±750 м. Для новых земель рисуется свой слой того же масштаба
     и подкладывается под старую карту в момент её отрисовки на радаре. Большая карта в телефоне остаётся прежней. */
  function buildRadar() {
    try {
      var s0 = 600 / 1500, X = function (x) { return (x + 750) * s0; }, Z = function (z) { return (z + 750) * s0; };
      var ox = Math.floor(X(GX0)), oz = Math.floor(Z(GZ0)), W = Math.ceil(X(GX0 + (NX - 1) * CELL)) - ox, Hh = Math.ceil(Z(GZ0 + (NZ - 1) * CELL)) - oz;
      var cv = document.createElement('canvas'); cv.width = W; cv.height = Hh; var g = cv.getContext('2d'); if (!g) return;
      g.fillStyle = '#7fb0d0'; g.fillRect(0, 0, W, Hh);
      var c = CELL * s0 + .6;
      for (var j = 0; j < NZ; j++) for (var i = 0; i < NX; i++) { var k = idx(i, j); if (KIND[k] === 1 || HG[k] < -.3) continue;
        var h = HG[k]; g.fillStyle = h > 32 ? '#b9b2a4' : (E.DW[k] <= 1 ? '#e6d8b0' : '#cfd6c4'); g.fillRect(X(GX0 + i * CELL - CELL / 2) - ox, Z(GZ0 + j * CELL - CELL / 2) - oz, c, c); }
      g.fillStyle = '#9a948a'; (E.rects || []).forEach(function (r) { g.fillRect(X(r[0]) - ox, Z(r[1]) - oz, Math.max(1, r[2] * s0), Math.max(1, r[3] * s0)); });
      ((window.MG_CITY && MG_CITY.rects) || []).forEach(function (r) { g.save(); g.fillStyle = r[5] - H(r[0], r[1]) > 40 ? '#6f7a88' : '#9a948a'; g.translate(X(r[0]) - ox, Z(r[1]) - oz); g.rotate(-r[4]); g.fillRect(-r[2] * s0 / 2, -r[3] * s0 / 2, Math.max(1, r[2] * s0), Math.max(1, r[3] * s0)); g.restore(); });
      g.strokeStyle = '#ffffff'; g.lineCap = 'round'; g.lineJoin = 'round';
      RD.forEach(function (r) { if (!r.P) return; g.lineWidth = Math.max(2, r.w * s0 * .9); g.beginPath(); r.P.forEach(function (p, n) { n ? g.lineTo(X(p[0]) - ox, Z(p[1]) - oz) : g.moveTo(X(p[0]) - ox, Z(p[1]) - oz); }); g.stroke(); });
      g.fillStyle = '#9a7048'; DECKS.forEach(function (d) { g.fillRect(X(d.x0) - ox, Z(d.z0) - oz, Math.max(1, (d.x1 - d.x0) * s0), Math.max(1, (d.z1 - d.z0) * s0)); });
      g.font = '15px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; g.textAlign = 'center';
      E.lm.forEach(function (l) { if (/🛣️/.test(l.e)) return; g.fillText(l.e, X(l.x) - ox, Z(l.z) - oz + 5); });
      E.radar = { cv: cv, ox: ox, oz: oz };
    } catch (e) { console.error('[EXPAND radar]', e); }
  }
  function radarHook() {
    try {
      var el = document.getElementById('mini'); if (!el) return false; var g = el.getContext('2d'); if (!g || g.__mgExp) return !!g;
      var di = g.drawImage; g.__mgExp = true;
      g.drawImage = function (img) { if (E.active && E.radar && typeof mapBase !== 'undefined' && img === mapBase) { try { di.call(this, E.radar.cv, E.radar.ox, E.radar.oz); } catch (e) { } } return di.apply(this, arguments); };
      return true;
    } catch (e) { return false; }
  }
  var REC = null;
  function build() {
    var t0 = performance.now(); E.lm = []; buildGrid(); rasterRoads();
    installH(); E.building = true;
    try {
    cutFind();                                                       // до постройки: искать только среди старого
    var g = new THREE.Group(); g.userData.expand = true; g.userData.noPerf = true; E.g = g;
    var n0 = cityG.children.length, c0 = cols.length, i0 = inters.length, tr0 = TRAFFIC.length, lm0 = LAMPS.length, mr0 = MAPRECTS.length;
    terrain(g); water(g); try { seam(g); } catch (e) { console.error('[EXPAND seam]', e); }
    var BA0 = BA; BA = 'city'; var R0 = R13; R13 = rng(1180);
    try {
      roadsBuild(); try { buildRoadIndex(); } catch (e) { }
      E.api = { R: R, rr: rr_, pk: pk, okSpot: okSpot, onLand: onLand, flatEnough: flatEnough, isWater: isWater, gridH: gridH, outside: outside, RD: RD, resample: resample, alongRoad: alongRoad, palm: palm, pine: pine, umbrella: umbrella, lm: E.lm, stats: E.stats, PASTEL: PASTEL, SQ: SQ, coastS: coastS, boat: boat };
      var zoneCity = function () { try { buildRoadIndex(); } catch (e) { } if (window.MG_CITY) MG_CITY.build(E.api); };
      [zoneSouth, zoneNorth, zoneWest, zoneEast, zoneCity, zoneFill].forEach(function (z) { try { z(); } catch (e) { console.error('[EXPAND zone]', z.name, e); E.stats.zoneErr = (E.stats.zoneErr || []).concat(z.name + ': ' + e.message); } });
      try { registerParked(); } catch (e) { }
      [0, 0, 0, 10, 13, 21].forEach(function (ri, k) { try { addTraffic(k % 2 ? RD[ri].P.slice().reverse() : RD[ri].P, pk(CAR_COLS)); } catch (e) { } });
    } finally { BA = BA0; R13 = R0; }
    var trg = TRAFFIC.slice(tr0).map(function (t) { return t.g; });
    var made = cityG.children.slice(n0).filter(function (o) { return trg.indexOf(o) < 0; }); made.forEach(function (o) { cityG.remove(o); g.add(o); });
    try { mergeStatic(g); } catch (e) { console.error('[EXPAND merge]', e); }
    g.children.slice().forEach(function (o) { if (o.isGroup && !o.children.length && o !== E.beam) g.remove(o); });
    E.rects = MAPRECTS.slice(mr0); MAPRECTS.length = mr0; buildRadar(); radarHook();
    REC = { cols: cols.slice(c0), inters: inters.slice(i0), traffic: TRAFFIC.slice(tr0), lamps: LAMPS.slice(lm0) };
    REC.inters.forEach(function (o) { var ok = o.ok; o.ok = function () { return E.active && (!ok || ok.apply(this, arguments)); }; });
    E.CULL = []; var tmp = new THREE.Vector3();
    g.children.forEach(function (o) {
      if (o.userData.exWater || o.userData.noCull) return;
      if (o.isMesh && o.userData.merged) { if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere(); var bs = o.geometry.boundingSphere; if (bs) E.CULL.push({ o: o, x: bs.center.x, z: bs.center.z, r: bs.radius }); return; }
      if (o.userData.exTerrain) { if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere(); var b2 = o.geometry.boundingSphere; if (b2) E.CULL.push({ o: o, x: b2.center.x, z: b2.center.z, r: b2.radius, far: true }); return; }
      if (LIFTB.some(function (b) { return b.g === o; })) return;      // скамейки прячет сама игра
      E.CULL.push({ o: o, x: o.position.x, z: o.position.z, r: 6, small: true });
    });
    } finally { E.building = false; }
    E.built = true; E.stats.ms = Math.round(performance.now() - t0); E.stats.objects = g.children.length; E.stats.cols = REC.cols.length; E.stats.cull = E.CULL.length;
  }
  var oH = null;
  function installH() { if (oH) return; oH = H;
    // новая высота — только в городе (или во время постройки), только внутри сетки и не в открытой воде:
    // помещения игры стоят далеко за краем карты, и для них всё остаётся как было
    window.H = H = function (x, z) {
      if (E.active && (x > SQ || x < -SQ || z > SQ || z < -SQ) && (E.building || area === 'city') && x > GX0 && x < GX0 + (NX - 1) * CELL && z > GZ0 && z < GZ0 + (NZ - 1) * CELL) { var h = gridH(x, z); if (h > -1.2) return h; }
      return oH(x, z);
    };
  }
  var restored = false, hookT0 = 0;
  function setOn(on) {
    if (on && !E.built) { E.active = true; build(); }
    E.active = on;
    try { WORLD_R = on ? 1900 : 732; } catch (e) { }
    if (E.built) {
      if (on && !E.g.parent) cityG.add(E.g); if (!on && E.g.parent) E.g.parent.remove(E.g);
      REC.cols.forEach(function (c) { c.on = on; });
      REC.traffic.forEach(function (t) { var i = TRAFFIC.indexOf(t); if (on && i < 0) TRAFFIC.push(t); if (!on && i >= 0) TRAFFIC.splice(i, 1); t.g.visible = on; });
      REC.lamps.forEach(function (L) { var i = LAMPS.indexOf(L); if (on && i < 0) LAMPS.push(L); if (!on && i >= 0) LAMPS.splice(i, 1); });
      var keep = ROADS.filter(function (r) { return !r.ex; }); if (on) RD.forEach(function (r) { if (r.P) keep.push({ pts: r.P, w: r.w, ex: true }); }); ROADS.length = 0; keep.forEach(function (r) { ROADS.push(r); });
      var lk = LANDMARKS.filter(function (l) { return !l.ex; }); if (on) E.lm.forEach(function (l) { lk.push({ x: l.x, z: l.z, e: l.e, n: l.n, ex: true }); }); LANDMARKS.length = 0; lk.forEach(function (l) { LANDMARKS.push(l); });
      try { buildRoadGraph(); } catch (e) { } try { if (typeof buildRoadIndex === 'function') buildRoadIndex(); } catch (e) { }
      try { mapBase = null; } catch (e) { } radarHook();
    }
    cutSet(on); oldTilesKeep(on);
    // первый раз: подсказать, что забора больше нет (когда закончатся титры и сцены)
    try { if (on && E.force === null && !(S.p13 && S.p13.exSeen)) { S.p13 = S.p13 || {}; S.p13.exSeen = true; try { saveGame(); } catch (e) { }
      var tip = setInterval(function () { try { if (started && area === 'city' && !blocked()) { clearInterval(tip); setTimeout(function () { toast('🏝️ Забора больше нет. За городом — целый полуостров: озеро и гора на севере, порт и парк на востоке, река и деревня на западе, посёлок «Чэайное» и море на юге.', 7000); }, 2500); } } catch (e) { clearInterval(tip); } }, 1000); } } catch (e) { }
    // игрок сохранился за старой границей: вернуть его туда после постройки (только сразу после загрузки)
    if (on && !restored) { restored = true; try { if (S.pos && outside(S.pos.x, S.pos.z) && performance.now() - hookT0 < 15000 && area === 'city' && !player.drive) { placeA(player, S.pos.x, S.pos.z, S.pos.yaw || 0); if (S.pos.cx !== undefined && outside(S.pos.cx, S.pos.cz)) placeA(comp, S.pos.cx, S.pos.cz); } } catch (e) { } }
    if (!on) { try { var P = player.drive ? player.drive.pos : player.pos; if (outside(P.x, P.z) && area === 'city') { if (player.drive) { player.drive.pos.set(0, H(0, 20), 20); } else placeA(player, 0, 20, 0); showComp(1.5, 21); } } catch (e) { } }
  }
  function want() {
    if (E.force !== null) return E.force;
    try { return !!(S.q && S.q.w15); } catch (e) { return false; }
  }
  E.sync = function () { var w = want(); if (w !== E.active || (w && !E.built)) { try { setOn(w); } catch (e) { console.error('[EXPAND]', e); E.stats.err = e.message; } } };
  E.set = function (v) { E.force = v; E.sync(); };

  /* ====================== ПОКАДРОВО ====================== */
  var cullT = 0, safe = null, warnT = 0;
  function frame(dt, t) {
    E.frames = (E.frames || 0) + 1;
    if (!E.active || !E.built) return;
    // глубокая вода: дальше берега не пускаем (пешком и на машине)
    try {
      if (typeof area !== 'undefined' && area === 'city' && !player.ovr && !blocked()) {
        var v = player.drive, p = v ? v.pos : player.pos;
        if (outside(p.x, p.z) && gridH(p.x, p.z) < DEEP && !(player.fly || (v && v.fly))) {
          if (safe) { p.x = safe.x; p.z = safe.z; if (v) v.v = 0; else { player.vx = 0; player.vz = 0; } }
          warnT -= dt; if (warnT <= 0) { warnT = 2.5; toast('🌊 Дальше — глубоко. Купаться здесь нельзя.', 1600); }
        } else safe = { x: p.x, z: p.z };
      }
    } catch (e) { }
    // крупные куски дальше границы видимости не рисуем
    cullT -= dt; if (cullT <= 0) { cullT = .35; var c = camera.position, V = window.MG_CULL || 420, P_ = window.MG_PERF, VS = Math.min(V, (P_ && P_.on ? (P_.limit ? P_.limit() : P_.dist) : 200) + 20);
      for (var i = 0; i < E.CULL.length; i++) { var k = E.CULL[i]; k.o.visible = Math.hypot(k.x - c.x, k.z - c.z) - k.r < (k.small ? VS : V); } }
    // анимации: колесо, карусель, луч маяка, кабинки канатки, лодки
    if (E.wheel) { E.wheel.rotation.z = t * .05; (E.wheelCabs || []).forEach(function (cb) { cb.rotation.z = -t * .05; }); }
    if (E.carousel) E.carousel.rotation.y = t * .6;
    try { if (window.MG_CITY && MG_CITY.tick) MG_CITY.tick(dt); } catch (e) { }
    if (E.beam) E.beam.rotation.y = t * .8;
    if (E.cabins && E.cable) { var T_ = E.cable, n = T_.length - 1; E.cabins.forEach(function (cb) { var u = ((t * .01 * cb.dir + cb.t) % 1 + 1) % 1, f = u * n, i = Math.min(n - 1, Math.floor(f)), w = f - i, a = T_[i], b = T_[i + 1]; cb.g.position.set(a[0] + (b[0] - a[0]) * w + (cb.dir > 0 ? 1.2 : -1.2), a[1] + (b[1] - a[1]) * w, a[2] + (b[2] - a[2]) * w); }); }
    (E.boats || []).forEach(function (b) { b.g.position.y = SEA_Y + .1 + Math.sin(t * 1.3 + b.ph) * .12; b.g.rotation.z = Math.sin(t * .9 + b.ph) * .03; });
  }

  /* ====================== УСТАНОВКА ====================== */
  var hooked = false;
  function hook() {
    if (hooked || typeof worldReady === 'undefined' || !worldReady || typeof updEnv !== 'function' || typeof cityG === 'undefined') return;
    hooked = true; E.hooked = true; hookT0 = performance.now();
    var pe = updEnv; var w = function (dt, t) { pe(dt, t); try { frame(dt, t); } catch (e) { console.error('[EXPAND frame]', e); } }; w.__mgGfx = pe.__mgGfx; w.__mgUltra = pe.__mgUltra; window.updEnv = updEnv = w;
    setInterval(function () { E.sync(); }, 600);
  }
  var iv = setInterval(function () { try { hook(); if (hooked) clearInterval(iv); } catch (e) { console.error('[EXPAND hook]', e); clearInterval(iv); } }, 400);
  E._t = { buildGrid: buildGrid, rasterRoads: rasterRoads, hills: hills, GATES: GATES, KIND: function () { return KIND; }, HG: function () { return HG; }, CELL: CELL, GX0: GX0, GZ0: GZ0, NX: NX, NZ: NZ };
  E.spotNear = function (x, z) { for (var r = 0; r < 320; r += 3) for (var a = 0; a < 24; a++) { var px = x + Math.cos(a / 24 * PI * 2) * r, pz = z + Math.sin(a / 24 * PI * 2) * r; if (!outside(px, pz) || gridH(px, pz) < .3 || (isWater(px, pz) && !onDeck(px, pz))) continue; if (freeAt(px, pz, .7) && freeAt(px + 1.4, pz + .6, .5)) return { x: px, z: pz }; } return null; };
  E.RD = RD; E.DECKS = DECKS; E.outside = outside; E.want = want; E.setOn = setOn;
})();
