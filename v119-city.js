/* =====================================================================
   МГИАГ 1.19 — ГОРОД В «ПОЧТИ ДОМЕ»: американский город + Сити
   Вызывается модулем расширения (v118-expand.js) во время постройки новых земель.
   Север остаётся пригородом (дачи, озеро, бор). Запад — Сити (стеклянные башни у лагуны) и Мидтаун,
   восток — портовая авеню (склады, заправки, мотели, торговые центры), юг — даунтаун и пляжный город.
   Надземка на эстакаде, зелёные знаки над дорогами, светофоры на консолях, «СТОП», переходы, гидранты,
   остановки, рекламные щиты, водонапорные башни. Одинаковые здания рядом не ставятся.
   ===================================================================== */
(function () {
  'use strict';
  var C = window.MG_CITY = { stats: {}, L: null };
  var PI = Math.PI, A = null, R, rr, pk;
  // быстрая проверка «рядом дорога» по индексу дорог игры (до 11 м от края), дальше — полный перебор
  function nearRoad(x, z, m) { if (m <= 11 && typeof roadDist === 'function') return roadDist(x, z) < m; return window.nearRoad(x, z, m); }

  /* ---------- текстуры фасадов (горят ночью, как остальные дома игры) ---------- */
  var TX = null;
  function rep(t) { t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; }
  function rnd() { return Math.random(); }
  function tex() {
    if (TX) return TX; TX = {};
    // стеклянная навесная стена: тёмное стекло, тонкие импосты
    TX.glass = rep(canvasTex(256, 256, function (g) { g.fillStyle = '#2a3e52'; g.fillRect(0, 0, 256, 256); var gr = g.createLinearGradient(0, 0, 256, 256); gr.addColorStop(0, 'rgba(255,255,255,.18)'); gr.addColorStop(.5, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(255,255,255,.12)'); g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
      g.fillStyle = '#8fa4b6'; for (var i = 0; i <= 8; i++) g.fillRect(i * 32 - 1, 0, 2, 256); for (var j = 0; j <= 8; j++) g.fillRect(0, j * 32 - 1, 256, 2); }));
    TX.glassEm = rep(canvasTex(256, 256, function (g) { g.fillStyle = '#000'; g.fillRect(0, 0, 256, 256); for (var j = 0; j < 8; j++) for (var i = 0; i < 8; i++) if (rnd() < .45) { g.fillStyle = ['#fff1c8', '#dfeeff', '#ffe2a8'][Math.floor(rnd() * 3)]; g.fillRect(i * 32 + 2, j * 32 + 2, 28, 28); } }));
    // ленточные окна (офисы 60–80-х)
    TX.band = rep(canvasTex(256, 256, function (g) { g.fillStyle = '#d8d4cc'; g.fillRect(0, 0, 256, 256); for (var j = 0; j < 4; j++) { g.fillStyle = '#34495e'; g.fillRect(0, j * 64 + 22, 256, 30); g.fillStyle = 'rgba(255,255,255,.2)'; g.fillRect(0, j * 64 + 24, 256, 6); } }));
    TX.bandEm = rep(canvasTex(256, 256, function (g) { g.fillStyle = '#000'; g.fillRect(0, 0, 256, 256); for (var j = 0; j < 4; j++) for (var i = 0; i < 8; i++) if (rnd() < .5) { g.fillStyle = '#ffeec0'; g.fillRect(i * 32 + 1, j * 64 + 23, 30, 28); } }));
    // кирпич Нью-Йорка: высокие окна в белых рамах
    TX.row = rep(canvasTex(256, 256, function (g) { g.fillStyle = '#ffffff'; g.fillRect(0, 0, 256, 256); g.fillStyle = 'rgba(0,0,0,.08)'; for (var y = 0; y < 256; y += 8) g.fillRect(0, y, 256, 1);
      for (var j = 0; j < 4; j++) for (var i = 0; i < 4; i++) { g.fillStyle = '#f4f0e8'; g.fillRect(i * 64 + 14, j * 64 + 10, 36, 46); g.fillStyle = '#2e3a46'; g.fillRect(i * 64 + 17, j * 64 + 13, 30, 40); g.fillStyle = '#f4f0e8'; g.fillRect(i * 64 + 17, j * 64 + 31, 30, 3); } }));
    TX.rowEm = rep(canvasTex(256, 256, function (g) { g.fillStyle = '#000'; g.fillRect(0, 0, 256, 256); for (var j = 0; j < 4; j++) for (var i = 0; i < 4; i++) if (rnd() < .5) { g.fillStyle = '#ffd890'; g.fillRect(i * 64 + 17, j * 64 + 13, 30, 40); } }));
    // отель у моря: балконы-полосы
    TX.hotel = rep(canvasTex(256, 256, function (g) { g.fillStyle = '#ffffff'; g.fillRect(0, 0, 256, 256); for (var j = 0; j < 4; j++) { g.fillStyle = '#5a7f9a'; g.fillRect(0, j * 64 + 6, 256, 40); g.fillStyle = '#f2f2ee'; g.fillRect(0, j * 64 + 46, 256, 12); g.fillStyle = 'rgba(0,0,0,.25)'; for (var i = 0; i < 8; i++) g.fillRect(i * 32, j * 64 + 6, 2, 52); } }));
    TX.hotelEm = rep(canvasTex(256, 256, function (g) { g.fillStyle = '#000'; g.fillRect(0, 0, 256, 256); for (var j = 0; j < 4; j++) for (var i = 0; i < 8; i++) if (rnd() < .5) { g.fillStyle = '#fff1c8'; g.fillRect(i * 32 + 3, j * 64 + 8, 27, 36); } }));
    // витрины первого этажа + окна выше
    TX.shop = rep(canvasTex(256, 256, function (g) { g.fillStyle = '#ffffff'; g.fillRect(0, 0, 256, 256); g.fillStyle = '#26323e'; g.fillRect(8, 120, 240, 120); g.fillStyle = 'rgba(255,255,255,.22)'; g.fillRect(8, 124, 240, 10); g.fillStyle = '#ddd'; for (var i = 0; i < 4; i++) g.fillRect(8 + i * 60, 120, 3, 120); }));
    TX.shopEm = rep(canvasTex(256, 256, function (g) { g.fillStyle = '#000'; g.fillRect(0, 0, 256, 256); g.fillStyle = '#ffe8b0'; g.fillRect(8, 120, 240, 120); }));
    // профнастил складов
    TX.metal = rep(canvasTex(256, 256, function (g) { g.fillStyle = '#ffffff'; g.fillRect(0, 0, 256, 256); for (var i = 0; i < 256; i += 8) { g.fillStyle = 'rgba(0,0,0,.14)'; g.fillRect(i, 0, 3, 256); } }));
    TX.none = rep(canvasTex(16, 16, function (g) { g.fillStyle = '#000'; g.fillRect(0, 0, 16, 16); }));
    return TX;
  }
  function fmat(color, t, em) { return bldMat(color, t, em || TX.none); }

  /* ---------- геометрия ---------- */
  function lohi(x, z, w, d, ry) { var cs = Math.cos(ry), sn = Math.sin(ry), lo = 1e9, hi = -1e9; [[-w / 2, -d / 2], [w / 2, -d / 2], [-w / 2, d / 2], [w / 2, d / 2], [0, 0]].forEach(function (q) { var y = H(x + cs * q[0] + sn * q[1], z - sn * q[0] + cs * q[1]); lo = Math.min(lo, y); hi = Math.max(hi, y); }); return { lo: lo, hi: hi, base: hi - lo > .05 ? lo - 1.5 : lo }; }
  // коробка с фасадной развёрткой (окна не растягиваются): cell — размер одного «квадрата» текстуры
  function fbox(par, w, h, d, x, y, z, ry, m, cell) {
    cell = cell || 12; var geo = new THREE.BoxGeometry(w, h, d), uv = geo.attributes.uv;
    for (var f = 0; f < 6; f++) { var su = f < 2 ? d : w, sv = f < 2 ? h : (f < 4 ? d : h); for (var k = 0; k < 4; k++) { var i = f * 4 + k; uv.setXY(i, uv.getX(i) * su / cell, uv.getY(i) * sv / cell); } }
    var o = new THREE.Mesh(geo, m); o.position.set(x, y + h / 2, z); o.rotation.y = ry || 0; o.userData.st = true; par.add(o); return o;
  }
  function fcyl(par, r, h, seg, x, y, z, ry, m, cell) {
    cell = cell || 12; var geo = new THREE.CylinderGeometry(r, r, h, seg, 1), uv = geo.attributes.uv, circ = 2 * PI * r;
    for (var i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * circ / cell, uv.getY(i) * h / cell);
    var o = new THREE.Mesh(geo, m); o.position.set(x, y + h / 2, z); o.rotation.y = ry || 0; o.userData.st = true; par.add(o); return o;
  }
  function loc(x, z, ry, lx, lz) { var cs = Math.cos(ry), sn = Math.sin(ry); return [x + cs * lx + sn * lz, z - sn * lx + cs * lz]; }
  function grp(x, y, z, ry) { var g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry || 0; cityG.add(g); return g; }
  function box(par, w, h, d, c, lx, ly, lz, rot) { return M_(par, G.box, c, [w, h, d], [lx, ly, lz], rot || null); }
  function col(x, z, w, d, ry, h) { (C.rects = C.rects || []).push([x, z, w, d, ry, h]); return addColR(x, z, w, d, ry, h); }
  function sg(text, w, h, x, y, z, ry, bg, fg, o) { try { return sign(cityG, text, w, h, x, y, z, ry, bg, fg, o || { fs: .5 }); } catch (e) { return null; } }

  /* ---------- разнообразие: один и тот же тип рядом не ставится ---------- */
  var RECENT = [];
  function far(type, x, z, r) { for (var i = 0; i < RECENT.length; i++) { var q = RECENT[i]; if (q.t === type && Math.hypot(q.x - x, q.z - z) < r) return false; } return true; }
  function mark(type, x, z) { RECENT.push({ t: type, x: x, z: z }); C.stats[type] = (C.stats[type] || 0) + 1; }
  var usedText = {};
  function uniq(list) { var free = list.filter(function (t) { return !usedText[t]; }); var t = free.length ? pk(free) : pk(list); usedText[t] = true; return t; }

  /* ---------- зоны ---------- */
  function region(x, z) { if (z < -742) return x < 250 ? 'N' : 'NE'; if (x < -742) return 'W'; if (x > 742) return 'E'; return 'S'; }
  var RES = [];   // занятые полосы (эстакада)
  function reserved(x, z, r) { for (var i = 0; i < RES.length; i++) { var s = RES[i], dx = s.bx - s.ax, dz = s.bz - s.az, L2 = dx * dx + dz * dz || 1, u = Math.max(0, Math.min(1, ((x - s.ax) * dx + (z - s.az) * dz) / L2)); if (Math.hypot(x - s.ax - dx * u, z - s.az - dz * u) < s.r + r) return true; } return false; }
  // проверка прямоугольного участка: суша, ровно, не на дороге, не на чужих стенах и не под эстакадой
  function rectOK(x, z, w, d, ry, road) {
    var nx = Math.max(2, Math.ceil(w / 6)), nz = Math.max(2, Math.ceil(d / 6)), lo = 1e9, hi = -1e9;
    for (var i = 0; i <= nx; i++) for (var j = 0; j <= nz; j++) { var p = loc(x, z, ry, -w / 2 + w * i / nx, -d / 2 + d * j / nz), px = p[0], pz = p[1];
      if (!A.outside(px, pz) || A.isWater(px, pz)) return false; var h = A.gridH(px, pz); if (h < -.2) return false; lo = Math.min(lo, h); hi = Math.max(hi, h);
      if (nearRoad(px, pz, road) || reserved(px, pz, 1) || !freeAt(px, pz, 2.2)) return false; }
    return hi - lo < Math.max(3, Math.max(w, d) * .22);
  }
  function ok(x, z, r, road) { return A.okSpot(x, z, r, road) && !reserved(x, z, r); }

  /* =====================================================================
     ЗДАНИЯ. Каждый тип: dims() → {w,d}, make(x,z,ry,w,d) → строит (фасад смотрит на дорогу по +z).
     ===================================================================== */
  var BRICK = ['#b5553c', '#9c4a36', '#c46a4a', '#8a3f2e', '#b8806a', '#a86448', '#d2a07e', '#7d5a4a'];
  var GLASS = ['#9fc4e0', '#7fb2c9', '#c9b27f', '#a8c8b8', '#8ea0c8', '#d0d8e0', '#b0a0c0', '#e0c090'];
  var PAST = ['#f6d8c8', '#c8eae0', '#f4e6a8', '#e6d0f0', '#cfe0f6', '#ffd6e0', '#d8f0c8', '#fff0d0'];
  var SHOPS = ['ПИЦЦА', 'ХИМЧИСТКА', 'АПТЕКА', 'КОФЕ', 'ТАТУ', 'ЦВЕТЫ', 'НОГТИ', 'ТАКО', 'ЛОМБАРД', 'КНИГИ', 'ВИДЕОПРОКАТ', 'ЗООМАГАЗИН', 'ОПТИКА', 'ПЕКАРНЯ', 'ПРАЧЕЧНАЯ', 'ЖЕЛЕЗНЫЙ ДВОРИК', 'СУШИ', 'ДОНАТЫ', 'БАРБЕРШОП', 'ТЕЛЕФОНЫ', 'ВИНИЛ', 'СПОРТ', 'ИГРУШКИ', 'ЧАСЫ'];
  var SIGNC = [['#c0392b', '#fff'], ['#1f4f8a', '#fff'], ['#f2c230', '#222'], ['#1f7a3a', '#fff'], ['#7a3a8a', '#fff'], ['#ffffff', '#c0392b'], ['#222', '#ffd23f'], ['#ff7aa8', '#fff']];

  function storefrontSigns(x, z, ry, w, d, y) { var n = Math.max(1, Math.floor(w / 9)); for (var i = 0; i < n; i++) { var lx = -w / 2 + w * (i + .5) / n, p = loc(x, z, ry, lx, d / 2 + .08), t = uniq(SHOPS), c = pk(SIGNC); sg(t, Math.min(w / n - .8, Math.max(3, t.length * .36)), .8, p[0], y, p[1], ry, c[0], c[1], { fs: .5 }); } }
  function awning(par, w, lz, y, c) { box(par, w, .15, 1.8, c, 0, y, lz + .9, [.18, 0, 0]); }
  function fireEscape(par, w, d, h, lo) { var lx = (R() - .5) * (w - 4); for (var f = 1; f < Math.floor(h / 3.2); f++) { var y = lo + f * 3.2; box(par, 2.6, .12, 1.1, 0x2a2a2a, lx, y, d / 2 + .6); box(par, 2.6, .9, .06, 0x2a2a2a, lx, y + .5, d / 2 + 1.12); box(par, .1, 3.2, .1, 0x2a2a2a, lx + (f % 2 ? .9 : -.9), y + 1.6, d / 2 + .9, [0, 0, f % 2 ? .5 : -.5]); } }
  function roofTank(par, lx, lz, y, s) { s = s || 1; for (var a = 0; a < 4; a++) box(par, .2, 2.2 * s, .2, 0x4a3a2a, lx + (a % 2 ? 1 : -1) * s, y + 1.1 * s, lz + (a < 2 ? 1 : -1) * s); M_(par, G.cyl, 0x8a6a48, [2.6 * s, 2.4 * s, 2.6 * s], [lx, y + 3.4 * s, lz]); M_(par, G.cone, 0x5a4a3a, [2.8 * s, 1.1 * s, 2.8 * s], [lx, y + 5.1 * s, lz]); }
  function rooftopJunk(par, w, d, top) { var n = Math.floor(R() * 4); for (var i = 0; i < n; i++) box(par, rr(1, 2.5), rr(.6, 1.6), rr(1, 2.5), pk([0x9aa0a8, 0xb8bcc4, 0x7a8088]), rr(-w / 2 + 2, w / 2 - 2), top + .5, rr(-d / 2 + 2, d / 2 - 2)); }
  function parking(x, z, ry, w, d, cars) {
    var y = H(x, z); var g = grp(x, y, z, ry); box(g, w, .14, d, 0x3a3d44, 0, .08, 0);
    for (var lx = -w / 2 + 2.8; lx < w / 2 - 1; lx += 2.8) { box(g, .12, .02, 4.6, 0xe8e8e0, lx, .17, -d / 2 + 2.6); if (d > 12) box(g, .12, .02, 4.6, 0xe8e8e0, lx, .17, d / 2 - 2.6); }
    var n = 0; for (lx = -w / 2 + 4.2; lx < w / 2 - 2 && n < (cars || 6); lx += 2.8) { if (R() < .45) continue; var p = loc(x, z, ry, lx, -d / 2 + 2.6); try { carH(p[0], p[1], ry + PI, pk(CAR_COLS)); n++; } catch (e) { } }
  }
  function polesign(x, z, ry, text, bg, fg, h, emoji) { var y = H(x, z); box(cityG, .35, h, .35, 0x6a6e76, x, y + h / 2, z); addColC(x, z, .25, y + h); sg(text, Math.max(3, text.length * .42), 1.3, x, y + h + .5, z, ry, bg, fg, { fs: .55 }); sg(text, Math.max(3, text.length * .42), 1.3, x, y + h + .5, z, ry + PI, bg, fg, { fs: .55 }); if (emoji) { var e = emojiSprite(emoji, 2.2); e.position.set(x, y + h + 2.6, z); cityG.add(e); } }

  var TYPES = {
    office: { r: 45, dims: function (reg) { return { w: rr(14, 24), d: rr(12, 18), h: reg === 'W' ? rr(28, 60) : rr(16, 40) }; },
      make: function (x, z, ry, D) { var L = lohi(x, z, D.w, D.d, ry), top = L.hi + D.h, t = R() < .5, m = fmat(pk(t ? GLASS : ['#e4e0d8', '#d8dcd4', '#efe6d4', '#c8ccd0', '#e8d8c8']), t ? TX.glass : TX.band, t ? TX.glassEm : TX.bandEm), g = grp(x, 0, z, ry);
        var o = fbox(g, D.w, top - L.base, D.d, 0, L.base, 0, 0, m, t ? 8 : 12); camBlock.city.push(o);
        if (R() < .5) { var h2 = rr(4, 10); fbox(g, D.w * .62, h2, D.d * .62, 0, top, 0, 0, m, t ? 8 : 12); top += h2; }
        box(g, D.w + .3, .5, D.d + .3, 0x6b6e75, 0, top + .25, 0); rooftopJunk(g, D.w * .6, D.d * .6, top); fbox(g, D.w * .8, 4, .4, 0, L.lo, D.d / 2 + .2, 0, fmat('#ffffff', TX.shop, TX.shopEm));
        col(x, z, D.w, D.d, ry, top); return top; } },
    rowhouse: { r: 40, dims: function () { var n = 2 + Math.floor(R() * 3), u = rr(6, 8); return { w: n * u, d: rr(11, 14), n: n, u: u }; },
      make: function (x, z, ry, D) { var g = grp(x, 0, z, ry), L = lohi(x, z, D.w, D.d, ry), top0 = 0;
        for (var i = 0; i < D.n; i++) { var lx = -D.w / 2 + D.u * (i + .5), h = rr(8, 16), m = fmat(pk(BRICK), TX.row, TX.rowEm), o = fbox(g, D.u - .05, L.hi + h - L.base, D.d, lx, L.base, 0, 0, m, 9); camBlock.city.push(o);
          var top = L.hi + h; top0 = Math.max(top0, top); box(g, D.u, .6, D.d + .3, pk([0xd8d0c0, 0x5a4a3a, 0xc8b8a0]), lx, top + .2, 0); box(g, D.u - .4, .25, .5, 0xe0d8c8, lx, top - .3, D.d / 2 + .2);
          if (R() < .55) { var gg = grp(0, 0, 0, 0); g.add(gg); gg.position.x = lx; fireEscape(gg, D.u, D.d, h, L.hi); }
          if (R() < .5) storefrontSigns(x + Math.cos(ry) * lx, z - Math.sin(ry) * lx, ry, D.u, D.d, L.lo + 3.3);
          if (R() < .22) roofTank(g, lx + rr(-1, 1), rr(-2, 2), top + .5, rr(.8, 1)); }
        col(x, z, D.w, D.d, ry, top0); return top0; } },
    garage: { max: 6, r: 220, dims: function () { return { w: rr(26, 34), d: rr(26, 32) }; },
      make: function (x, z, ry, D) { var g = grp(x, 0, z, ry), L = lohi(x, z, D.w, D.d, ry), n = 3 + Math.floor(R() * 3), fh = 3;
        for (var f = 0; f <= n; f++) { var y = L.hi + f * fh; box(g, D.w, .4, D.d, 0x9a9a96, 0, y, 0); if (f < n) for (var px = -D.w / 2 + 1; px <= D.w / 2 - 1; px += (D.w - 2) / 4) for (var pz = -D.d / 2 + 1; pz <= D.d / 2 - 1; pz += (D.d - 2) / 3) box(g, .5, fh, .5, 0x8a8a86, px, y + fh / 2, pz);
          if (f > 0) { box(g, D.w, 1, .2, 0xb8b8b0, 0, y + .7, D.d / 2); box(g, D.w, 1, .2, 0xb8b8b0, 0, y + .7, -D.d / 2); for (var c = 0; c < 6; c++) if (R() < .5) box(g, 1.9, 1.3, 4.3, pk(CAR_COLS), -D.w / 2 + 3 + c * (D.w - 6) / 5, y + .85, rr(-D.d / 4, D.d / 4)); } }
        box(g, D.w, Math.max(.4, L.hi - L.base), D.d, 0x9a9a96, 0, (L.hi + L.base) / 2, 0);
        var p = loc(x, z, ry, 0, D.d / 2 + .3); sg('ПАРКОВКА · P', 6, 1.2, p[0], L.hi + 3.6, p[1], ry, '#1f4f8a', '#fff', { fs: .6 });
        col(x, z, D.w, D.d, ry, L.hi + n * fh + 1.2); return L.hi + n * fh; } },
    corner: { r: 70, dims: function () { return { w: rr(9, 13), d: rr(9, 12) }; },
      make: function (x, z, ry, D) { var L = lohi(x, z, D.w, D.d, ry), h = rr(4, 7.5), g = grp(x, 0, z, ry), o = fbox(g, D.w, L.hi + h - L.base, D.d, 0, L.base, 0, 0, fmat(pk(PAST.concat(BRICK)), TX.shop, TX.shopEm), 8);
        awning(g, D.w - 1, D.d / 2, L.lo + 2.9, pk([0xc0392b, 0x1f7a3a, 0x1f4f8a, 0xf2c230, 0xe8742a])); box(g, D.w + .3, .4, D.d + .3, 0x6b6e75, 0, L.hi + h + .2, 0);
        storefrontSigns(x, z, ry, D.w, D.d, L.lo + 3.9); col(x, z, D.w, D.d, ry, L.hi + h); return L.hi + h; } },
    gas: { front: 0, back: 0, max: 5, r: 320, dims: function () { return { w: 26, d: 22 }; },
      make: function (x, z, ry, D) { var L = lohi(x, z, D.w, D.d, ry), g = grp(x, L.hi, z, ry), brand = uniq(['ГУСЬОЙЛ', 'ЧЭАЙ-ПЕТРОЛ', 'МАРЬЯ-ГАЗ', 'БАТОН ФЬЮЭЛ', 'ДИКСИ-АЗС']), bc = pk([[0xd8342a, '#d8342a'], [0x1f7a3a, '#1f7a3a'], [0x1f4f8a, '#1f4f8a'], [0xf2a020, '#e8742a']]);
        box(g, D.w, .25, D.d, 0x50545c, 0, .12, 0); box(g, 15, .9, 9, 0xf4f4f0, 0, 5.4, 4); box(g, 15.2, .35, 9.2, bc[0], 0, 4.95, 4);
        [[-6.5, 0], [6.5, 0], [-6.5, 8], [6.5, 8]].forEach(function (p) { box(g, .4, 5, .4, 0xdcdcd4, p[0], 2.5, p[1]); });
        [-3, 3].forEach(function (lx) { box(g, 1.2, .3, 6, 0xc8c8c0, lx, .3, 4); box(g, .8, 1.6, .6, bc[0], lx, 1.2, 2.3); box(g, .8, 1.6, .6, bc[0], lx, 1.2, 5.7); });
        fbox(g, 11, 4, 7, 0, 0, -6.5, 0, fmat('#f0ece4', TX.shop, TX.shopEm), 6); box(g, 11.4, .5, 7.4, bc[0], 0, 4.2, -6.5);
        var p = loc(x, z, ry, 0, -2.9); sg(brand, 6, 1, p[0], L.hi + 3.2, p[1], ry, '#ffffff', bc[1], { fs: .6 });
        var s = loc(x, z, ry, D.w / 2 - 1.2, D.d / 2 - 1.2); polesign(s[0], s[1], ry, brand + ' · 92 — ' + (50 + Math.floor(R() * 9)) + '.' + (10 + Math.floor(R() * 89)), bc[1], '#fff', 7.5, '⛽');
        var c1 = loc(x, z, ry, -6.5, 0), c2 = loc(x, z, ry, 6.5, 0), c3 = loc(x, z, ry, -6.5, 8), c4 = loc(x, z, ry, 6.5, 8);
        // коллайдер магазина смещён: пересчитать
        var sp = loc(x, z, ry, 0, -6.5); col(sp[0], sp[1], 11, 7, ry, L.hi + 4.4);
        [c1, c2, c3, c4].forEach(function (c) { addColC(c[0], c[1], .3, L.hi + 5); }); [-3, 3].forEach(function (lx) { var q = loc(x, z, ry, lx, 4); col(q[0], q[1], 1.2, 6, ry, L.hi + 1.6); });
        if (R() < .7) { var cp = loc(x, z, ry, 3, 4); try { carH(cp[0] + 1.6, cp[1], ry, pk(CAR_COLS)); } catch (e) { } }
        A.lm.push({ x: x, z: z, e: '⛽', n: 'Заправка ' + brand }); return L.hi + 6; } },
    diner: { front: 0, back: 15, max: 5, r: 380, dims: function () { return { w: 18, d: 9 }; },
      make: function (x, z, ry, D) { var L = lohi(x, z, D.w, D.d, ry), g = grp(x, L.hi, z, ry), name = uniq(['ЗАКУСОЧНАЯ «У ГУСЯ»', 'ДАЙНЕР «66»', 'ЗАКУСОЧНАЯ 24/7', 'БЛИННАЯ «ШОССЕ»', 'ДАЙНЕР «ЛУНА»']);
        var steel = new THREE.MeshPhongMaterial({ color: 0xd8dce0, specular: 0xffffff, shininess: 80 });
        fbox(g, 12, 4, 7, 0, 0, 0, 0, fmat('#e8eef2', TX.shop, TX.shopEm), 5); [-6, 6].forEach(function (lx) { var c = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 3.5, 4, 16, 1, false, lx < 0 ? PI : 0, PI), steel); c.position.set(lx, 2, 0); c.userData.st = true; g.add(c); });
        box(g, 19, .5, 7.4, 0xc0392b, 0, 1.2, 0); box(g, 19, .5, 7.4, 0xe8e8e8, 0, 4.1, 0); box(g, 2.2, .3, 3, 0xc0392b, 0, 3, 4.3, [.2, 0, 0]);
        var p = loc(x, z, ry, 0, 3.8); sg(name, Math.max(6, name.length * .4), 1.1, p[0], L.hi + 5.1, p[1], ry, '#1d2129', '#ff5aa0', { fs: .6 });
        var e = emojiSprite(pk(['🍔', '🥞', '🍟', '☕']), 2); var ep = loc(x, z, ry, 7, 0); e.position.set(ep[0], L.hi + 6.2, ep[1]); cityG.add(e);
        col(x, z, 19, 7, ry, L.hi + 4.4); parking(loc(x, z, ry, 0, -10)[0], loc(x, z, ry, 0, -10)[1], ry, 18, 8, 3); A.lm.push({ x: x, z: z, e: '🍔', n: name }); return L.hi + 4.4; } },
    motel: { front: 12, back: 0, max: 5, r: 420, dims: function () { return { w: rr(30, 38), d: 10 }; },
      make: function (x, z, ry, D) { var L = lohi(x, z, D.w, D.d, ry), g = grp(x, 0, z, ry), name = uniq(['МОТЕЛЬ «ГУСЬ»', 'МОТЕЛЬ «ПОБЕРЕЖЬЕ»', 'МОТЕЛЬ «ЗАКАТ»', 'МОТЕЛЬ «66»', 'МОТЕЛЬ «ЧЭАЙ»']), c = pk(PAST), dc = pk([0x2e86c1, 0xd35400, 0x1f7a3a, 0xc0392b]);
        fbox(g, D.w, L.hi + 6.4 - L.base, 7, 0, L.base, -1.5, 0, fmat(c, TX.shop, TX.none), 6); box(g, D.w + .6, .3, 3.4, 0xd8d4cc, 0, L.hi + 3.2, 3.2); box(g, D.w + .6, .4, 10, 0x8a6a5a, 0, L.hi + 6.6, .2, [-.06, 0, 0]);
        box(g, D.w, .9, .08, 0xe8e8e8, 0, L.hi + 3.8, 4.9); for (var lx = -D.w / 2 + 2; lx < D.w / 2 - 1; lx += 3.4) { box(g, 1, 2.1, .1, dc, lx, L.hi + 1.05, 2.05); box(g, 1, 2.1, .1, dc, lx, L.hi + 4.4, 2.05); box(g, .2, 3.2, .2, 0xd8d4cc, lx + 1.7, L.hi + 1.6, 4.8); }
        var s = loc(x, z, ry, D.w / 2 + 3, 6); polesign(s[0], s[1], ry, name, '#2a1a3a', '#ff7a3a', 8, '🛏️'); var s2 = loc(x, z, ry, D.w / 2 + 3, 6.2); sg('ЕСТЬ МЕСТА', 3.4, .7, s2[0], H(s[0], s[1]) + 7.3, s2[1], ry, '#111', '#5aff8a', { fs: .55 });
        col(x, z, D.w, 7, ry, L.hi + 6.6); var pp = loc(x, z, ry, 0, 11); parking(pp[0], pp[1], ry, D.w, 8, 5); A.lm.push({ x: x, z: z, e: '🛏️', n: name }); return L.hi + 6.6; } },
    strip: { front: 26, back: 0, max: 4, r: 360, dims: function () { return { w: rr(40, 56), d: 14 }; },
      make: function (x, z, ry, D) { var L = lohi(x, z, D.w, D.d, ry), g = grp(x, 0, z, ry), n = Math.floor(D.w / 10), h = rr(5, 6.5);
        fbox(g, D.w, L.hi + h - L.base, D.d, 0, L.base, 0, 0, fmat(pk(['#e8dcc4', '#d8d0c0', '#f0e4d0', '#e0d8e8']), TX.shop, TX.shopEm), 6); box(g, D.w + .4, 1.2, 1.2, pk([0x8a3a2a, 0x2a5a8a, 0x3a6a3a]), 0, L.hi + h - .2, D.d / 2 + .5);
        box(g, D.w, .3, 3, 0xd8d4cc, 0, L.hi + 3.4, D.d / 2 + 1.5); for (var i = 0; i <= n; i++) box(g, .3, 3.4, .3, 0xd8d4cc, -D.w / 2 + i * D.w / n, L.hi + 1.7, D.d / 2 + 2.8);
        storefrontSigns(x, z, ry, D.w, D.d + 2.4, L.hi + 4.4);
        var pp = loc(x, z, ry, 0, D.d / 2 + 14); parking(pp[0], pp[1], ry, D.w, 20, 10); var ps = loc(x, z, ry, D.w / 2 + 2, D.d / 2 + 22); polesign(ps[0], ps[1], ry, uniq(['ТЦ «БУЛЬВАР»', 'ПЛАЗА «ЧЭАЙ»', 'МОЛЛ «ГУСИНЫЙ»', 'ТЦ «ПРИБОЙ»']), '#1f4f8a', '#fff', 7);
        col(x, z, D.w, D.d, ry, L.hi + h); return L.hi + h; } },
    bigbox: { front: 30, back: 0, max: 4, r: 600, dims: function () { return { w: rr(52, 64), d: rr(36, 42) }; },
      make: function (x, z, ry, D) { var L = lohi(x, z, D.w, D.d, ry), g = grp(x, 0, z, ry), name = uniq(['МЕГАМАРТ', 'ГУСЬ-ДЕПО', 'БАТОН-КЛАБ', 'ДИКСИ-СУПЕР']), c = pk([['#1f4f8a', '#ffd23f'], ['#e8742a', '#fff'], ['#c0392b', '#fff'], ['#1f7a3a', '#fff']]);
        fbox(g, D.w, L.hi + 10 - L.base, D.d, 0, L.base, 0, 0, fmat('#d8d4cc', TX.metal, TX.none), 4); box(g, 18, 3.4, 1, 0x30343c, 0, L.hi + 1.7, D.d / 2 + .5);
        var p = loc(x, z, ry, 0, D.d / 2 + .1); sg(name, Math.max(10, name.length * .9), 2.6, p[0], L.hi + 7.4, p[1], ry, c[0], c[1], { fs: .7 });
        var pp = loc(x, z, ry, 0, D.d / 2 + 16); parking(pp[0], pp[1], ry, D.w, 26, 14); col(x, z, D.w, D.d, ry, L.hi + 10); A.lm.push({ x: x, z: z, e: '🛒', n: name }); return L.hi + 10; } },
    warehouse: { r: 70, dims: function () { return { w: rr(28, 46), d: rr(18, 28) }; },
      make: function (x, z, ry, D) { var L = lohi(x, z, D.w, D.d, ry), g = grp(x, 0, z, ry), h = rr(7, 12);
        fbox(g, D.w, L.hi + h - L.base, D.d, 0, L.base, 0, 0, fmat(pk(['#c8ccd0', '#b8a888', '#8fa0b0', '#c8b8a0', '#a0b098']), TX.metal, TX.none), 4); box(g, D.w + .4, .5, D.d + .4, 0x6b6e75, 0, L.hi + h + .25, 0);
        for (var lx = -D.w / 2 + 5; lx < D.w / 2 - 3; lx += 7) box(g, 4, 4.4, .2, pk([0x5a6a7a, 0x7a6a5a, 0x4a5a4a]), lx, L.lo + 2.2, D.d / 2 + .1);
        var p = loc(x, z, ry, -D.w / 2 + 6, D.d / 2 + .12); sg('СКЛАД ' + (1 + Math.floor(R() * 40)), 5, 1, p[0], L.lo + 6, p[1], ry, '#1d2129', '#ffd23f', { fs: .6 });
        col(x, z, D.w, D.d, ry, L.hi + h); return L.hi + h; } },
    fastfood: { front: 0, back: 13, max: 5, r: 300, dims: function () { return { w: 15, d: 12 }; },
      make: function (x, z, ry, D) { var L = lohi(x, z, D.w, D.d, ry), g = grp(x, 0, z, ry), K_ = [['БУРГЕРЫ «БАТОН»', '🍔', '#e8473b', '#ffd23f'], ['ТАКО «ГУСЬ»', '🌮', '#7a3a8a', '#ffd23f'], ['ПИЦЦА «МАРЬЯ»', '🍕', '#1f7a3a', '#fff'], ['КУРОЧКА «КЛЮВ»', '🍗', '#c0392b', '#fff'], ['ПОНЧИКИ «ДЫРКА»', '🍩', '#ff7aa8', '#fff']], k = K_.filter(function (q) { return !usedText[q[0]]; })[0] || K_[0]; usedText[k[0]] = true;
        fbox(g, D.w, L.hi + 4.6 - L.base, D.d, 0, L.base, 0, 0, fmat('#f4efe6', TX.shop, TX.shopEm), 6); box(g, D.w + .6, 1.2, D.d + .6, new THREE.Color(k[2]).getHex(), 0, L.hi + 5.1, 0);
        box(g, 3, 3, .3, 0x30343c, D.w / 2 - 2, L.hi + 1.5, -D.d / 2 - .2); var p = loc(x, z, ry, 0, D.d / 2 + .35); sg(k[0], Math.max(6, k[0].length * .38), .9, p[0], L.hi + 5.1, p[1], ry, k[2], k[3], { fs: .55 });
        var s = loc(x, z, ry, -D.w / 2 - 3, D.d / 2 + 3); polesign(s[0], s[1], ry, k[0], k[2], k[3], 9, k[1]); col(x, z, D.w, D.d, ry, L.hi + 5.7);
        var pp = loc(x, z, ry, 0, -D.d / 2 - 8); parking(pp[0], pp[1], ry, D.w + 6, 10, 4); return L.hi + 5.7; } },
    dealer: { front: 16, back: 0, max: 3, r: 600, dims: function () { return { w: 24, d: 14 }; },
      make: function (x, z, ry, D) { var L = lohi(x, z, D.w, D.d, ry), g = grp(x, 0, z, ry), name = uniq(['АВТОСАЛОН «ГУСЬ-МОТОРС»', 'АВТО «ПОБЕРЕЖЬЕ»', 'ПИКАПЫ «БИЗОН»']);
        fbox(g, D.w, L.hi + 6.5 - L.base, D.d, 0, L.base, 0, 0, fmat('#c8e0f0', TX.glass, TX.glassEm), 4); box(g, D.w + .6, .6, D.d + .6, 0xeeeeee, 0, L.hi + 6.8, 0);
        var p = loc(x, z, ry, 0, D.d / 2 + .1); sg(name, Math.max(8, name.length * .4), 1.1, p[0], L.hi + 5.6, p[1], ry, '#ffffff', '#c0392b', { fs: .55 });
        for (var i = 0; i < 8; i++) { var q = loc(x, z, ry, -D.w / 2 + 2 + (i % 4) * 6.4, D.d / 2 + 5 + Math.floor(i / 4) * 6); try { carH(q[0], q[1], ry + PI / 2, CAR_COLS[(i * 3) % CAR_COLS.length]); } catch (e) { } }
        for (i = 0; i < 4; i++) { var f = loc(x, z, ry, -D.w / 2 + i * D.w / 3, D.d / 2 + 15), fy = H(f[0], f[1]); box(cityG, .12, 7, .12, 0xdddddd, f[0], fy + 3.5, f[1]); box(cityG, 1.6, 1, .05, [0xc0392b, 0x1f4f8a, 0xf2c230, 0x1f7a3a][i], f[0] + .8, fy + 6.3, f[1]); }
        col(x, z, D.w, D.d, ry, L.hi + 6.8); A.lm.push({ x: x, z: z, e: '🚗', n: name }); return L.hi + 6.8; } },
    fire: { front: 10, back: 0, max: 2, r: 700, dims: function () { return { w: 20, d: 15 }; },
      make: function (x, z, ry, D) { var L = lohi(x, z, D.w, D.d, ry), g = grp(x, 0, z, ry), n = 1 + Math.floor(R() * 20);
        fbox(g, D.w, L.hi + 8.5 - L.base, D.d, 0, L.base, 0, 0, fmat('#a8432e', TX.row, TX.rowEm), 8); fbox(g, 4.4, 15, 4.4, D.w / 2 - 2.2, L.hi, -D.d / 2 + 2.2, 0, fmat('#a8432e', TX.row, TX.rowEm), 8);
        [-6, 0, 6].forEach(function (lx) { box(g, 4.4, 4.6, .2, 0xc0392b, lx, L.lo + 2.3, D.d / 2 + .1); box(g, 4, .2, .1, 0xffffff, lx, L.lo + 3.4, D.d / 2 + .22); });
        var p = loc(x, z, ry, 0, D.d / 2 + .12); sg('ПОЖАРНАЯ ЧАСТЬ № ' + n, 8, 1, p[0], L.lo + 6, p[1], ry, '#f4f0e8', '#a8241e', { fs: .55 });
        var tp = loc(x, z, ry, 0, D.d / 2 + 6); try { var tr = grp(tp[0], H(tp[0], tp[1]), tp[1], ry + PI / 2); box(tr, 2.5, 2.4, 9, 0xc0392b, 0, 1.5, 0); box(tr, 2.4, 1.2, 2.6, 0xc0392b, 0, 3.1, 3); box(tr, .4, .3, 7, 0xd8d8d0, .7, 2.9, -1); addColR(tp[0], tp[1], 9, 2.5, ry + PI / 2, H(tp[0], tp[1]) + 2.8); } catch (e) { }
        col(x, z, D.w, D.d, ry, L.hi + 8.5); A.lm.push({ x: x, z: z, e: '🚒', n: 'Пожарная часть № ' + n }); return L.hi + 15; } },
    school: { front: 10, back: 14, max: 2, r: 900, dims: function () { return { w: 40, d: 16 }; },
      make: function (x, z, ry, D) { var L = lohi(x, z, D.w, D.d, ry), g = grp(x, 0, z, ry), n = 15 + Math.floor(R() * 80);
        fbox(g, D.w, L.hi + 8 - L.base, D.d, 0, L.base, 0, 0, fmat('#b8684e', TX.row, TX.rowEm), 8); fbox(g, 12, 6.5, 14, -D.w / 2 + 6, L.hi, -D.d / 2 - 6, 0, fmat('#b8684e', TX.row, TX.rowEm), 8);
        box(g, 8, 1, 3, 0xf0ece4, 0, L.hi + 3.6, D.d / 2 + 1.5); [-3, 3].forEach(function (lx) { M_(g, G.cyl, 0xf0ece4, [.6, 3.6, .6], [lx, L.hi + 1.8, D.d / 2 + 2.8]); });
        var p = loc(x, z, ry, 0, D.d / 2 + 3.1); sg('ШКОЛА № ' + n, 6, 1, p[0], L.hi + 4.8, p[1], ry, '#f0ece4', '#1f4f8a', { fs: .6 });
        var fp = loc(x, z, ry, D.w / 2 - 2, D.d / 2 + 6), fy = H(fp[0], fp[1]); box(cityG, .14, 10, .14, 0xdddddd, fp[0], fy + 5, fp[1]); box(cityG, 2, 1.2, .05, 0x1f4f8a, fp[0] + 1, fy + 9.3, fp[1]);
        var bp = loc(x, z, ry, -8, D.d / 2 + 7); var bus = grp(bp[0], H(bp[0], bp[1]), bp[1], ry + PI / 2); box(bus, 2.5, 2.4, 10, 0xf2b800, 0, 1.6, 0); box(bus, 2.55, .3, 10.1, 0x1d1d1d, 0, 1.6, 0); box(bus, 2.3, 1.2, 1.8, 0xf2b800, 0, 1.1, 5.6); for (var w = -3; w <= 3; w += 1.5) box(bus, 2.6, .8, 1, 0x30404a, 0, 2.3, w); addColR(bp[0], bp[1], 10, 2.5, ry + PI / 2, H(bp[0], bp[1]) + 2.8);
        col(x, z, D.w, D.d, ry, L.hi + 8); var c2 = loc(x, z, ry, -D.w / 2 + 6, -D.d / 2 - 6); col(c2[0], c2[1], 12, 14, ry, L.hi + 6.5); A.lm.push({ x: x, z: z, e: '🏫', n: 'Школа № ' + n }); return L.hi + 8; } },
    church: { max: 1, r: 900, dims: function () { return { w: 11, d: 20 }; },
      make: function (x, z, ry, D) { var L = lohi(x, z, D.w, D.d, ry), g = grp(x, 0, z, ry);
        fbox(g, D.w, L.hi + 7 - L.base, D.d, 0, L.base, 0, 0, fmat('#f6f4ee', TX.row, TX.rowEm), 10); M_(g, G.box, 0x4a4a52, [D.w + 1, 1, D.d + .6], [0, L.hi + 9.2, 0], [0, 0, 0]); var roof = M_(g, pyrG, 0x4a4a52, [D.w + 1.2, 4, D.d + .8], [0, L.hi + 9, 0]); roof.scale.set(D.w + 1.2, 4, D.d + .8);
        fbox(g, 4, 9, 4, 0, L.hi, D.d / 2 - 1, 0, fmat('#f6f4ee', TX.row, TX.rowEm), 10); M_(g, pyrG, 0xf6f4ee, [3.6, 8, 3.6], [0, L.hi + 13, D.d / 2 - 1]); box(g, .15, 1.6, .15, 0xd4a840, 0, L.hi + 17.8, D.d / 2 - 1); box(g, .9, .15, .15, 0xd4a840, 0, L.hi + 18.1, D.d / 2 - 1);
        box(g, 1.8, 3, .2, 0x5a3a2a, 0, L.lo + 1.5, D.d / 2 + 1.1); col(x, z, D.w, D.d, ry, L.hi + 9); A.lm.push({ x: x, z: z, e: '⛪', n: 'Белая церковь' }); return L.hi + 17; } },
    bank: { max: 3, r: 500, dims: function () { return { w: 22, d: 16 }; },
      make: function (x, z, ry, D) { var L = lohi(x, z, D.w, D.d, ry), g = grp(x, 0, z, ry), stone = '#e8e0cc', name = uniq(['БАНК «ГУСИНЫЙ»', 'НАЦИОНАЛЬНЫЙ БАНК', 'СБЕРКАССА «ЧЭАЙ»']);
        fbox(g, D.w, L.hi + 11 - L.base, D.d, 0, L.base, 0, 0, fmat(stone, TX.row, TX.rowEm), 12); box(g, D.w, 1.2, 3, 0xf0e8d8, 0, L.lo + .6, D.d / 2 + 1.5);
        for (var lx = -D.w / 2 + 2; lx <= D.w / 2 - 2; lx += (D.w - 4) / 5) M_(g, G.cyl, 0xf4ecdc, [1, 8, 1], [lx, L.lo + 5.2, D.d / 2 + 2.3]);
        var tri = M_(g, G.cyl, 0xf0e8d8, [1, 1, 1], [0, L.lo + 10.2, D.d / 2 + 2.3]); tri.geometry = new THREE.CylinderGeometry(1, 1, 1, 3); tri.scale.set(D.w / 1.6, 2.6, 1.6); tri.rotation.set(PI / 2, 0, PI / 2); tri.position.y = L.lo + 10.6;
        var p = loc(x, z, ry, 0, D.d / 2 + 3.2); sg(name, Math.max(8, name.length * .42), .9, p[0], L.lo + 9.3, p[1], ry, '#f0e8d8', '#3a3020', { fs: .6 });
        col(x, z, D.w, D.d + 3, ry, L.hi + 11); A.lm.push({ x: x, z: z, e: '🏦', n: name }); return L.hi + 11; } },
    apartment: { r: 30, dims: function () { return { w: rr(16, 30), d: rr(12, 18), h: rr(14, 34) }; },
      make: function (x, z, ry, D) { var L = lohi(x, z, D.w, D.d, ry), g = grp(x, 0, z, ry), top = L.hi + D.h, st = R() < .5, c = st ? pk(['#efe2cc', '#e2d6c4', '#f2e8dc', '#d8cfc0', '#e8dccc', '#c8d0c8']) : pk(BRICK);
        var o = fbox(g, D.w, top - L.base, D.d, 0, L.base, 0, 0, fmat(c, st ? TX.hotel : TX.row, st ? TX.hotelEm : TX.rowEm), st ? 7 : 9); camBlock.city.push(o);
        if (st) for (var f = 1; f < D.h / 3.2 - 1; f += 1) for (var lx = -D.w / 2 + 3; lx < D.w / 2 - 2; lx += 6) if (R() < .5) box(g, 2.6, .15, 1.2, 0xd8d4cc, lx, L.hi + f * 3.2, D.d / 2 + .6);
        box(g, D.w + .4, .6, D.d + .4, pk([0x6b6e75, 0x5a4a3a, 0x8a8478]), 0, top + .3, 0); rooftopJunk(g, D.w * .6, D.d * .6, top); if (R() < .3) roofTank(g, rr(-D.w / 4, D.w / 4), 0, top + .5, rr(.8, 1.1));
        box(g, 2.4, 3, .4, 0x3a2a1a, 0, L.lo + 1.5, D.d / 2 + .2); box(g, 3.4, .2, 1.6, 0x6b6e75, 0, L.lo + 3.2, D.d / 2 + .8);
        col(x, z, D.w, D.d, ry, top); return top; } },
    hotel: { front: 3, back: 0, max: 8, r: 90, dims: function () { return { w: rr(24, 36), d: rr(12, 16), h: rr(28, 68) }; },
      make: function (x, z, ry, D) { var L = lohi(x, z, D.w, D.d, ry), g = grp(x, 0, z, ry), top = L.hi + D.h, name = uniq(['ОТЕЛЬ «ЧЭАЙ»', 'ГУСЬ ПЛАЗА', 'ОТЕЛЬ «ПРИБОЙ»', 'ОТЕЛЬ «КОРАЛЛ»', 'ОТЕЛЬ «ЛАГУНА»', 'ОТЕЛЬ «РИВЬЕРА»', 'ОТЕЛЬ «ФЛАМИНГО»', 'ОТЕЛЬ «ДЕЛЬФИН»']), c = pk(['#ffffff', '#f8efe0', '#e8f4f8', '#fff0e8', '#f0f0e4']);
        var o = fbox(g, D.w, top - L.base, D.d, 0, L.base, 0, 0, fmat(c, TX.hotel, TX.hotelEm), 9); camBlock.city.push(o);
        if (R() < .5) { fbox(g, D.w * .4, top - L.base - rr(4, 10), D.d + 6, D.w * (R() < .5 ? -.3 : .3), L.base, 0, 0, fmat(c, TX.hotel, TX.hotelEm), 9); }
        box(g, D.w + .6, 1.4, D.d + .6, pk([0x3a8ac0, 0xe8742a, 0x2fae8a, 0xd84a6a]), 0, top + .7, 0); var p = loc(x, z, ry, 0, D.d / 2 + .5); sg(name, Math.max(8, name.length * .5), 1.6, p[0], top + 2.6, p[1], ry, '#ffffff', '#1f4f8a', { fs: .7 });
        fbox(g, D.w * .7, 4, 2.5, 0, L.lo, D.d / 2 + 1.25, 0, fmat('#ffffff', TX.shop, TX.shopEm), 6);
        col(x, z, D.w, D.d, ry, top); A.lm.push({ x: x, z: z, e: '🏨', n: name }); return top; } },
    deco: { r: 60, dims: function () { return { w: rr(14, 20), d: rr(10, 14), h: rr(8, 14) }; },
      make: function (x, z, ry, D) { var L = lohi(x, z, D.w, D.d, ry), g = grp(x, 0, z, ry), c = pk(PAST), m = fmat(c, TX.shop, TX.shopEm), top = L.hi + D.h;
        fbox(g, D.w, top - L.base, D.d, 0, L.base, 0, 0, fmat(c, TX.row, TX.rowEm), 9); var cr = fcyl(g, D.d / 2.4, top - L.base, 16, D.w / 2 - .5, L.base, D.d / 2 - D.d / 2.4, 0, m, 8);
        box(g, D.w * .5, 2.2, .4, 0xffffff, 0, top + 1.1, D.d / 2 - .2); box(g, D.w * .3, 1.2, .4, 0xffffff, 0, top + 2.8, D.d / 2 - .2);
        var neon = new THREE.Mesh(G.box, lampMat); neon.scale.set(D.w, .15, .15); neon.position.set(0, top - 1.2, D.d / 2 + .1); neon.userData.st = true; g.add(neon);
        var p = loc(x, z, ry, -D.w / 4, D.d / 2 + .25); sg(uniq(['КАФЕ «ОКЕАН»', 'ЛЕДЕНЦЫ', 'СУВЕНИРЫ', 'ДЖЕЛАТО', 'КОКТЕЙЛИ', 'СЁРФ-ШОП', 'ПЛЯЖНЫЙ БАР', 'КИНО «ПАЛЬМА»']), 6, .9, p[0], L.lo + 3.6, p[1], ry, '#ffffff', pk(['#e8473b', '#2a8ac0', '#d84a9a']), { fs: .55 });
        col(x, z, D.w + 1, D.d, ry, top); return top; } },
    campus: { front: 20, back: 0, max: 6, r: 120, dims: function () { return { w: rr(28, 40), d: rr(16, 22), h: rr(9, 15) }; },
      make: function (x, z, ry, D) { var L = lohi(x, z, D.w, D.d, ry), g = grp(x, 0, z, ry), top = L.hi + D.h, m = fmat(pk(['#b8d8e8', '#c8e0d8', '#d8d0e8']), TX.glass, TX.glassEm);
        fbox(g, D.w, top - L.base, D.d, 0, L.base, 0, 0, m, 6); fbox(g, D.w * .4, D.h * .6, D.d * 1.2, -D.w * .3, L.hi, 0, 0, fmat('#f0f0ec', TX.band, TX.bandEm), 8);
        box(g, D.w + .3, .4, D.d + .3, 0xd8d8d0, 0, top + .2, 0); var pp = loc(x, z, ry, 0, D.d / 2 + 12); parking(pp[0], pp[1], ry, D.w, 16, 7);
        col(x, z, D.w, D.d * 1.2, ry, top); return top; } }
  };
  var PLAN = {
    W: [['rowhouse', 5], ['office', 5], ['apartment', 3], ['corner', 3], ['garage', 1], ['bank', 1], ['fire', 1], ['church', 1], ['school', 1], ['deco', 1], ['fastfood', 1]],
    S: [['rowhouse', 4], ['office', 3], ['apartment', 3], ['corner', 3], ['deco', 2], ['diner', 1], ['gas', 1], ['motel', 1], ['strip', 1], ['fastfood', 1], ['bank', 1], ['fire', 1], ['school', 1], ['church', 1], ['garage', 1], ['dealer', 1]],
    SC: [['hotel', 6], ['deco', 4], ['corner', 1], ['fastfood', 1]],
    E: [['warehouse', 4], ['gas', 1], ['motel', 1], ['diner', 1], ['strip', 2], ['bigbox', 1], ['fastfood', 2], ['dealer', 1], ['office', 2], ['corner', 2], ['fire', 1], ['rowhouse', 1]],
    NE: [['campus', 4], ['office', 1], ['garage', 1]]
  };
  var PLAN2 = { W: [['apartment', 4], ['office', 3], ['garage', 1], ['rowhouse', 2]], S: [['apartment', 5], ['rowhouse', 2], ['office', 2], ['garage', 1]], SC: [['apartment', 3], ['hotel', 2], ['deco', 2]], E: [['warehouse', 4], ['apartment', 2], ['office', 1]], NE: [['campus', 1]] };
  function choose(list, x, z) { var tot = 0, i; for (i = 0; i < list.length; i++) tot += list[i][1]; for (var tries = 0; tries < 6; tries++) { var r = R() * tot; for (i = 0; i < list.length; i++) { r -= list[i][1]; if (r <= 0) break; } var t = list[Math.min(i, list.length - 1)][0]; if (far(t, x, z, TYPES[t].r) && !(TYPES[t].max && (C.stats[t] || 0) >= TYPES[t].max)) return t; } return null; }

  /* ---------- участки вдоль улиц ---------- */
  function lots() {
    var made = 0;
    A.RD.forEach(function (r, ri) {
      if (!r.P || r.loop) return;
      var L = A.resample(r.P, 14);
      for (var i = 1; i < L.length - 1; i++) {
        var p = L[i], q = L[i + 1], a = Math.atan2(q[0] - p[0], q[1] - p[1]);
        for (var s = -1; s <= 1; s += 2) {
          if (R() < .08) continue;
          var reg = region(p[0], p[1]); if (reg === 'N') continue;
          var plan = PLAN[reg]; if (reg === 'S' && p[1] > 1120) plan = PLAN.SC;
          var t = choose(plan, p[0], p[1]); if (!t) continue;
          var T = TYPES[t], D = T.dims(reg), fr = T.front || 0, bk = T.back || 0, o = r.w / 2 + 3.6 + fr + D.d / 2 + rr(.5, 2.5), px = p[0] + Math.cos(a) * o * s, pz = p[1] - Math.sin(a) * o * s, ry = a + (s > 0 ? -PI / 2 : PI / 2);
          var mid = (bk - fr) / 2, mx = px + Math.cos(a) * mid * s, mz = pz - Math.sin(a) * mid * s;
          if (!rectOK(mx, mz, D.w + 2, D.d + fr + bk + 2, ry, 2.5)) continue;
          try { T.make(px, pz, ry, D); mark(t, px, pz); made++; } catch (e) { console.error('[CITY ' + t + ']', e); }
          // второй ряд в глубине квартала
          var plan2 = (reg === 'S' && p[1] > 1120) ? PLAN2.SC : PLAN2[reg], t2 = plan2 && choose(plan2, p[0], p[1]);
          if (t2) { var T2 = TYPES[t2], D2 = T2.dims(reg), o2 = o + D.d / 2 + (T.back || 0) + 5 + D2.d / 2 + rr(0, 4), qx = p[0] + Math.cos(a) * o2 * s, qz = p[1] - Math.sin(a) * o2 * s;
            if (A.outside(qx, qz) && rectOK(qx, qz, D2.w + 2, D2.d + 2, ry, 2.5)) { try { T2.make(qx, qz, ry, D2); mark(t2, qx, qz); made++; } catch (e) { console.error('[CITY ' + t2 + ']', e); } } }
        }
      }
    });
    C.stats.lots = made;
  }

  /* =====================================================================
     СИТИ: кластер башен у лагуны (на запад от старого города)
     ===================================================================== */
  function tower(x, z, kind, h, color, name) {
    var y0 = H(x, z), L = lohi(x, z, 30, 30, 0), base = L.lo - 1.5, g = grp(x, 0, z, 0), m = fmat(color, TX.glass, TX.glassEm), top = L.hi + h, crown = [];
    var w = 22, d = 22, ry = 0;
    if (kind === 'twist') { var n = Math.round(h / 4); w = 22; d = 16; for (var i = 0; i < n; i++) { var s = fbox(g, w, 4.05, d, 0, L.hi + i * 4, 0, i * .055, m, 8); if (i === 0) { fbox(g, w, L.hi - base + .05, d, 0, base, 0, 0, m, 8); } camBlock.city.push(s); } crown.push([w * .9, d * .9, i * .055]); }
    else if (kind === 'setback') { var hs = [h * .55, h * .28, h * .17], ww = [26, 20, 14], yy = L.hi; for (i = 0; i < 3; i++) { var s2 = fbox(g, ww[i], (i ? 0 : L.hi - base) + hs[i], ww[i] * .8, 0, i ? yy : base, 0, 0, m, 8); camBlock.city.push(s2); yy += hs[i]; } crown.push([14, 11, 0]); w = 26; d = 21; }
    else if (kind === 'cyl') { var c1 = fcyl(g, 12, top - base, 24, 0, base, 0, 0, m, 8); camBlock.city.push(c1); w = d = 24; crown.push(['c', 12]); }
    else if (kind === 'prism') { var geo = new THREE.CylinderGeometry(16, 16, top - base, 3, 1), uv = geo.attributes.uv; for (i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 8, uv.getY(i) * (top - base) / 8); var pr = new THREE.Mesh(geo, m); pr.position.set(0, base + (top - base) / 2, 0); pr.userData.st = true; g.add(pr); camBlock.city.push(pr); w = d = 28; crown.push(['c', 9]); M_(g, G.cyl, 0xd8d8d8, [.5, 24, .5], [0, top + 12, 0]); }
    else if (kind === 'twin') { var t1 = fbox(g, 16, top - base, 16, -10, base, 0, .3, m, 8), h2 = h * .72, t2 = fbox(g, 16, L.hi + h2 - base, 16, 10, base, 0, -.3, fmat(pk(GLASS), TX.glass, TX.glassEm), 8); camBlock.city.push(t1, t2); M_(g, G.cone, 0xd8d8e0, [5, 26, 5], [-10, top + 13, 0]); box(g, 6, 3.4, 4, 0xc8d8e8, 0, L.hi + h2 * .7, 0); w = 38; d = 20; crown.push([14, 14, .3, -10]); }
    else { var s3 = fbox(g, 24, top - base, 18, 0, base, 0, 0, m, 8); camBlock.city.push(s3); M_(g, pyrG, color, [26, 14, 20], [0, top + 7, 0]); M_(g, G.cyl, 0xd8d8d8, [.4, 20, .4], [0, top + 22, 0]); w = 24; d = 18; crown.push([24, 18, 0]); top += 14; }
    // светящийся венец (ночью горит как фонари)
    crown.forEach(function (c) { var cm; if (c[0] === 'c') { cm = new THREE.Mesh(new THREE.CylinderGeometry(c[1] + .3, c[1] + .3, .8, 24, 1, true), lampMat); cm.position.set(0, top - 2, 0); } else { cm = new THREE.Mesh(G.box, lampMat); cm.scale.set(c[0] + .4, .7, c[1] + .4); cm.position.set(c[3] || 0, top - 1.5, 0); cm.rotation.y = c[2]; } cm.userData.st = true; g.add(cm); });
    fbox(g, w + 8, 6, d + 8, 0, base, 0, 0, fmat('#e8eef2', TX.shop, TX.shopEm), 6);   // стилобат
    if (name) sg(name, Math.max(6, name.length * .6), 1.6, x, L.lo + 7.5, z + d / 2 + 4.2, 0, '#10161e', '#9fd4ff', { fs: .6 });
    col(x, z, w + 8, d + 8, 0, top); return { top: top, w: w, d: d };
  }
  function siti() {
    var T = [
      [-885, -228, 'setback', 150, '#c9a86a', 'МЕРКУРИЙ-ГУСЬ'], [-828, -230, 'office2', 96, '#9fc4e0'], [-885, -95, 'twist', 190, '#8fb8d8', 'ЭВОЛЮЦИЯ ЧЭАЙ'],
      [-828, -20, 'cyl', 128, '#a8c8b8', 'БАШНЯ «БАТОН»'], [-885, 10, 'twin', 230, '#7f98c0', 'ФЕДЕРАЦИЯ ГУСЕЙ'], [-830, 135, 'prism', 140, '#b8b0d0', 'ТРЕУГОЛЬНИК'],
      [-885, 150, 'spire', 110, '#d0d8e0', 'ИМПЕРИЯ МАРЬИ'], [-830, 300, 'setback', 84, '#a0b8c8'], [-880, 300, 'cyl', 72, '#c0a080']
    ], made = [];
    var kinds = ['setback', 'twist', 'cyl', 'twin', 'prism', 'spire', 'setback', 'cyl', 'spire', 'twist', 'setback', 'spire', 'cyl', 'prism'], used = 0;
    // сначала именные башни на своих местах, потом добор по сетке кандидатов (выше всего — в центре кластера)
    T.forEach(function (t) { if (!ok(t[0], t[1], 12, -2)) { C.stats.sitiSkip = (C.stats.sitiSkip || 0) + 1; return; } try { var r = tower(t[0], t[1], t[2] === 'office2' ? 'spire' : t[2], t[3], t[4], t[5]); made.push({ x: t[0], z: t[1], top: r.top }); mark('tower', t[0], t[1]); } catch (e) { console.error('[CITY tower]', e); } });
    for (var cz = -440; cz <= 360 && made.length < 15; cz += 22) [-768, -828, -885].forEach(function (cx) { if (made.length >= 15) return; var x = cx + rr(-3, 3), z = cz + rr(-4, 4);
      if (!far('tower', x, z, 36) || !ok(x, z, 13, -2)) return; var h = 55 + 90 * Math.exp(-Math.pow(z / 260, 2)) * rr(.6, 1.1);
      try { var r = tower(x, z, kinds[used++ % kinds.length], h, pk(GLASS)); made.push({ x: x, z: z, top: r.top }); mark('tower', x, z); } catch (e) { console.error('[CITY tower]', e); } });
    // стеклянный мост-галерея между двумя башнями
    if (made.length > 3) { var a = made[2], b = made[3]; if (a && b && Math.hypot(a.x - b.x, a.z - b.z) < 120) { var y = Math.min(a.top, b.top) * .45 + H(a.x, a.z) * .55, mx = (a.x + b.x) / 2, mz = (a.z + b.z) / 2, L = Math.hypot(a.x - b.x, a.z - b.z); var br = new THREE.Mesh(G.box, fmat('#c8e0f0', TX.glass, TX.glassEm)); br.scale.set(4, 3.4, L); br.position.set(mx, y, mz); br.rotation.y = Math.atan2(b.x - a.x, b.z - a.z); br.userData.st = true; cityG.add(br); } }
    // площадь у воды с фонтаном
    var px = -902, pz = 225; if (ok(px, pz, 6, 1)) { var y0 = H(px, pz); M_(cityG, G.cyl, 0xdcd8d0, [11, .5, 11], [px, y0 + .25, pz]); M_(cityG, G.cyl, 0x5ab0e0, [9.4, .1, 9.4], [px, y0 + .52, pz]); for (var i = 0; i < 6; i++) M_(cityG, G.cyl, 0xbfe6ff, [.25, 2.5 + (i % 3), .25], [px + Math.cos(i) * 2.4, y0 + 1.6, pz + Math.sin(i) * 2.4]); addColC(px, pz, 5.6, y0 + .6); }
    A.lm.push({ x: -860, z: 20, e: '🏙️', n: 'Сити' });
    C.siti = made;
  }

  /* =====================================================================
     НАДЗЕМКА: эстакада над Сити-авеню и Дачной, поезд ездит туда-обратно
     ===================================================================== */
  function elevated() {
    var av = A.RD.filter(function (r) { return r.n === 'Сити-авеню'; })[0], da = A.RD.filter(function (r) { return r.n === 'Дачная'; })[0]; if (!av || !da) return;
    var path = av.P.slice(); var dp = da.P.filter(function (p) { return p[0] < -160; }); path = path.concat(dp);
    var P = A.resample(path, 12), Y = P.map(function (p) { return H(p[0], p[1]) + 9; });
    for (var k = 0; k < 3; k++) Y = Y.map(function (y, i) { return Math.max(y, (Y[Math.max(0, i - 1)] + y + Y[Math.min(Y.length - 1, i + 1)]) / 3); });
    var dmat = mat(0x6a6e76), rmat = mat(0x3a3a3a), pmat = mat(0x5a5e66), bents = 0;
    for (var i = 0; i < P.length - 1; i++) {
      var a = P[i], b = P[i + 1], ya = Y[i], yb = Y[i + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]), ang = Math.atan2(b[0] - a[0], b[1] - a[1]), mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2, my = (ya + yb) / 2, pitch = -Math.atan2(yb - ya, L);
      var dk = new THREE.Mesh(G.box, dmat); dk.scale.set(6.4, .7, L + .3); dk.position.set(mx, my, mz); dk.rotation.order = 'YXZ'; dk.rotation.y = ang; dk.rotation.x = pitch; dk.userData.st = true; cityG.add(dk);
      [-1.2, 1.2].forEach(function (o) { var rl = new THREE.Mesh(G.box, rmat); rl.scale.set(.18, .2, L + .3); rl.position.set(mx + Math.cos(ang) * o, my + .45, mz - Math.sin(ang) * o); rl.rotation.order = 'YXZ'; rl.rotation.y = ang; rl.rotation.x = pitch; rl.userData.st = true; cityG.add(rl); });
      [-3.2, 3.2].forEach(function (o) { var gw = new THREE.Mesh(G.box, rmat); gw.scale.set(.12, .9, L + .3); gw.position.set(mx + Math.cos(ang) * o, my + .8, mz - Math.sin(ang) * o); gw.rotation.order = 'YXZ'; gw.rotation.y = ang; gw.rotation.x = pitch; gw.userData.st = true; cityG.add(gw); });
      RES.push({ ax: a[0], az: a[1], bx: b[0], bz: b[1], r: 9 });
      if (i % 2 === 0) {   // опоры-«ворота» по обе стороны улицы
        var off = 9.5, p1 = [a[0] + Math.cos(ang) * off, a[1] - Math.sin(ang) * off], p2 = [a[0] - Math.cos(ang) * off, a[1] + Math.sin(ang) * off];
        var bad = [p1, p2].some(function (p) { return nearRoad(p[0], p[1], 1) || !freeAt(p[0], p[1], .7) || A.isWater(p[0], p[1]); });
        if (!bad) { [p1, p2].forEach(function (p) { var y = H(p[0], p[1]); M_(cityG, G.box, pmat, [.8, ya - y, .8], [p[0], (ya + y) / 2 - .3, p[1]], [0, ang, 0]); addColC(p[0], p[1], .55, ya); });
          var cb = new THREE.Mesh(G.box, pmat); cb.scale.set(off * 2 + .8, .9, 1); cb.position.set(a[0], ya - .6, a[1]); cb.rotation.y = ang; cb.userData.st = true; cityG.add(cb); bents++; }
      }
    }
    // станции
    var st = [], names = ['СИТИ', 'МИДТАУН', 'ДАЧНАЯ'];
    [Math.floor(P.length * .32), Math.floor(P.length * .6), Math.floor(P.length * .88)].forEach(function (k, n) { if (!P[k + 1]) return; var a = P[k], b = P[k + 1], ang = Math.atan2(b[0] - a[0], b[1] - a[1]), y = Y[k];
      [-1, 1].forEach(function (s) { var px = a[0] + Math.cos(ang) * 4.6 * s, pz = a[1] - Math.sin(ang) * 4.6 * s, pl = new THREE.Mesh(G.box, mat(0xb8b4ac)); pl.scale.set(2.8, .5, 26); pl.position.set(px, y + .1, pz); pl.rotation.y = ang; pl.userData.st = true; cityG.add(pl);
        var rf = new THREE.Mesh(G.box, mat(0x2e6a4a)); rf.scale.set(3.2, .25, 22); rf.position.set(px, y + 4, pz); rf.rotation.y = ang; rf.userData.st = true; cityG.add(rf); });
      sg('🚇 ' + names[n], 5, 1, a[0], y + 4.9, a[1], ang + PI / 2, '#2e6a4a', '#fff', { fs: .6 }); sg('🚇 ' + names[n], 5, 1, a[0], y + 4.9, a[1], ang - PI / 2, '#2e6a4a', '#fff', { fs: .6 });
      st.push(k); });
    A.lm.push({ x: P[Math.floor(P.length * .32)][0], z: P[Math.floor(P.length * .32)][1], e: '🚇', n: 'Надземка' });
    // поезд
    var tr = new THREE.Group(); tr.userData.noCull = true; cityG.add(tr); var cars = [];
    for (var c = 0; c < 3; c++) { var cg = new THREE.Group(); M_(cg, G.box, 0xc8ccd0, [3, 3, 14], [0, 1.9, 0], null, false); M_(cg, G.box, 0xc0392b, [3.05, .5, 14.05], [0, 1.2, 0], null, false); M_(cg, G.box, 0x2a3a4a, [3.1, .9, 12], [0, 2.4, 0], null, false); tr.add(cg); cars.push(cg); }
    var acc = [0]; for (i = 1; i < P.length; i++) acc.push(acc[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
    C.L = { P: P, Y: Y, acc: acc, len: acc[acc.length - 1], cars: cars, g: tr, s: 0, dir: 1, wait: 0, stops: st.map(function (k) { return acc[k]; }) };
    C.stats.bents = bents; C.stats.lLen = Math.round(acc[acc.length - 1]);
  }
  function posAt(s) { var L = C.L, a = L.acc, i = 1; while (i < a.length - 1 && a[i] < s) i++; var u = (s - a[i - 1]) / Math.max(.01, a[i] - a[i - 1]), p = L.P[i - 1], q = L.P[i]; return { x: p[0] + (q[0] - p[0]) * u, z: p[1] + (q[1] - p[1]) * u, y: L.Y[i - 1] + (L.Y[i] - L.Y[i - 1]) * u, a: Math.atan2(q[0] - p[0], q[1] - p[1]) }; }
  C.tick = function (dt) {
    var L = C.L; if (!L) return;
    if (L.wait > 0) { L.wait -= dt; } else {
      var ns = L.s + L.dir * dt * 16; L.stops.forEach(function (st) { if ((L.s - st) * (ns - st) < 0) { L.wait = 6; ns = st; } }); L.s = ns;
      if (L.s > L.len - 30) { L.s = L.len - 30; L.dir = -1; L.wait = 5; } if (L.s < 30) { L.s = 30; L.dir = 1; L.wait = 5; }
    }
    L.cars.forEach(function (c, i) { var p = posAt(L.s - i * 14.6 * L.dir); c.position.set(p.x, p.y + .4, p.z); c.rotation.y = p.a; });
  };

  /* =====================================================================
     УЛИЧНАЯ ОБСТАНОВКА
     ===================================================================== */
  function segX(a, b, c, d) { var r = (b[0] - a[0]) * (d[1] - c[1]) - (b[1] - a[1]) * (d[0] - c[0]); if (Math.abs(r) < 1e-6) return null; var t = ((c[0] - a[0]) * (d[1] - c[1]) - (c[1] - a[1]) * (d[0] - c[0])) / r, u = ((c[0] - a[0]) * (b[1] - a[1]) - (c[1] - a[1]) * (b[0] - a[0])) / r; return t >= 0 && t <= 1 && u >= 0 && u <= 1 ? [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, Math.atan2(b[0] - a[0], b[1] - a[1]), Math.atan2(d[0] - c[0], d[1] - c[1])] : null; }
  function junctions() {
    var S = [], J = [];
    A.RD.forEach(function (r, ri) { if (!r.P || r.w < 5) return; var P = A.resample(r.P, 8); for (var i = 0; i < P.length - 1; i++) S.push({ a: P[i], b: P[i + 1], r: ri, w: r.w }); });
    var grid = {}; S.forEach(function (s, k) { var key = Math.floor(s.a[0] / 40) + ',' + Math.floor(s.a[1] / 40); (grid[key] = grid[key] || []).push(k); });
    S.forEach(function (s, k) { var gx = Math.floor(s.a[0] / 40), gz = Math.floor(s.a[1] / 40); for (var dx = -1; dx <= 1; dx++) for (var dz = -1; dz <= 1; dz++) { var L = grid[(gx + dx) + ',' + (gz + dz)]; if (!L) continue; L.forEach(function (m) { if (m <= k) return; var o = S[m]; if (o.r === s.r) return; var x = segX(s.a, s.b, o.a, o.b); if (!x) return;
      if (J.some(function (j) { return Math.hypot(j.x - x[0], j.z - x[1]) < 25; })) return; J.push({ x: x[0], z: x[1], a1: x[2], a2: x[3], w1: s.w, w2: o.w }); }); } });
    // плюс Т-образные: концы дорог, пристыкованные к другим
    A.RD.forEach(function (r) { if (!r.P || r.loop || r.ring) return; [r.P[0], r.P[r.P.length - 1]].forEach(function (p, e) { if (J.some(function (j) { return Math.hypot(j.x - p[0], j.z - p[1]) < 25; })) return; var q = e ? r.P[r.P.length - 2] : r.P[1]; J.push({ x: p[0], z: p[1], a1: Math.atan2(p[0] - q[0], p[1] - q[1]), a2: Math.atan2(p[0] - q[0], p[1] - q[1]) + PI / 2, w1: r.w, w2: 8, t: true }); }); });
    return J.filter(function (j) { return A.outside(j.x, j.z) && region(j.x, j.z) !== 'N'; });
  }
  function signalHead(par, lx, ly, lz, ry) { var g = new THREE.Group(); g.position.set(lx, ly, lz); g.rotation.y = ry; par.add(g); M_(g, G.box, 0xf2c230, [.5, 1.4, .4], [0, 0, 0]); M_(g, G.box, 0xd8342a, [.3, .3, .1], [0, .42, .22]); M_(g, G.box, 0xf2a020, [.3, .3, .1], [0, 0, .22]); M_(g, G.box, 0x30c050, [.3, .3, .1], [0, -.42, .22]); return g; }
  function mastArm(x, z, ry, len) { var y = H(x, z), g = grp(x, y, z, ry); M_(g, G.cyl, 0x8a8e96, [.32, 7, .32], [0, 3.5, 0]); M_(g, G.box, 0x8a8e96, [.2, .2, len], [0, 6.6, len / 2]); signalHead(g, 0, 5.9, len * .55, PI / 2); signalHead(g, 0, 5.9, len * .9, -PI / 2); addColC(x, z, .3, y + 7); }
  var STOPTEX = null;
  function stopSign(x, z, ry) { if (!STOPTEX) STOPTEX = canvasTex(128, 128, function (g) { g.clearRect(0, 0, 128, 128); g.fillStyle = '#fff'; g.beginPath(); for (var i = 0; i < 8; i++) { var a = PI / 8 + i * PI / 4; g.lineTo(64 + Math.cos(a) * 62, 64 + Math.sin(a) * 62); } g.fill(); g.fillStyle = '#c8241e'; g.beginPath(); for (i = 0; i < 8; i++) { a = PI / 8 + i * PI / 4; g.lineTo(64 + Math.cos(a) * 56, 64 + Math.sin(a) * 56); } g.fill(); g.fillStyle = '#fff'; g.font = '900 34px Arial'; g.textAlign = 'center'; g.fillText('СТОП', 64, 76); });
    var y = H(x, z); box(cityG, .1, 2.4, .1, 0x9aa0a8, x, y + 1.2, z); var m = new THREE.Mesh(new THREE.PlaneGeometry(.9, .9), new THREE.MeshLambertMaterial({ map: STOPTEX, transparent: true, side: THREE.DoubleSide })); m.position.set(x, y + 2.5, z); m.rotation.y = ry; cityG.add(m); addColC(x, z, .12, y + 2.8); }
  function zebra(x, z, ang, w, d) { var y = H(x, z) + .27, n = Math.floor(w / 1.2); for (var i = 0; i < n; i++) { var o = -w / 2 + .6 + i * 1.2; M_(cityG, G.box, 0xf0f0e8, [.6, .03, 3], [x + Math.cos(ang) * o + Math.sin(ang) * d, y, z - Math.sin(ang) * o + Math.cos(ang) * d], [0, ang, 0]); } }
  function streetFurniture() {
    var J = junctions(), sig = 0, stp = 0;
    J.forEach(function (j) {
      var big = Math.max(j.w1, j.w2) >= 8 && Math.min(j.w1, j.w2) >= 6 && !j.t;
      if (big) {   // светофоры на консолях на двух углах, «зебры»
        [[1, 1], [-1, -1]].forEach(function (s) { var o1 = j.w2 / 2 + 3, o2 = j.w1 / 2 + 3, x = j.x + Math.sin(j.a1) * o1 * s[0] + Math.cos(j.a1) * o2 * s[1], z = j.z + Math.cos(j.a1) * o1 * s[0] - Math.sin(j.a1) * o2 * s[1]; if (freeAt(x, z, .5) && !nearRoad(x, z, .3)) { mastArm(x, z, j.a1 + (s[0] > 0 ? -PI / 2 : PI / 2), j.w1 / 2 + 3); sig++; } });
        zebra(j.x, j.z, j.a1, j.w1, j.w2 / 2 + 2.2); zebra(j.x, j.z, j.a1, j.w1, -j.w2 / 2 - 2.2);
      } else {
        var o = j.w1 / 2 + 2.2, x = j.x - Math.sin(j.a1) * (j.w2 / 2 + 3) + Math.cos(j.a1) * o, z = j.z - Math.cos(j.a1) * (j.w2 / 2 + 3) - Math.sin(j.a1) * o; if (freeAt(x, z, .4) && !nearRoad(x, z, .2)) { stopSign(x, z, j.a1 + PI); stp++; }
      }
    });
    C.stats.signals = sig; C.stats.stops = stp; C.stats.junctions = J.length;
    // вдоль улиц: гидранты, деревья, остановки, почтовые ящики, урны — редко и вразнобой
    var bus = 0, hyd = 0, trees = 0;
    A.RD.forEach(function (r) {
      if (!r.P || r.w < 6) return; var L = A.resample(r.P, 9);
      for (var i = 2; i < L.length - 2; i++) {
        var p = L[i], q = L[i + 1], a = Math.atan2(q[0] - p[0], q[1] - p[1]), s = R() < .5 ? 1 : -1, reg = region(p[0], p[1]); if (reg === 'N' || !A.outside(p[0], p[1])) continue;
        var o = r.w / 2 + 2.5, x = p[0] + Math.cos(a) * o * s, z = p[1] - Math.sin(a) * o * s, roll = R();
        if (!freeAt(x, z, .6) || nearRoad(x, z, .2) || A.isWater(x, z)) continue;
        var y = H(x, z);
        if (roll < .07) { M_(cityG, G.cyl, 0xc8241e, [.35, .8, .35], [x, y + .4, z]); M_(cityG, G.sph, 0xc8241e, [.4, .3, .4], [x, y + .85, z]); addColC(x, z, .22, y + .9); hyd++; }
        else if (roll < .17 && reg !== 'E') { var tx = p[0] + Math.cos(a) * (r.w / 2 + 4.2) * s, tz = p[1] - Math.sin(a) * (r.w / 2 + 4.2) * s; if (freeAt(tx, tz, 1.2)) { if (reg === 'S' && p[1] > 1000) A.palm(tx, tz, rr(.7, 1)); else treeH(tx, tz, rr(.6, .9)); trees++; } }
        else if (roll < .185 && r.w >= 8 && far('bus', x, z, 300)) { var g = grp(x, y, z, a + (s > 0 ? -PI / 2 : PI / 2)); box(g, 4, .1, 1.6, 0x2a5a8a, 0, 2.5, 0); box(g, .1, 2.5, 1.6, 0x9ab8d0, -2, 1.25, 0); box(g, 4, 2.2, .06, 0x9ab8d0, 0, 1.3, -.8); box(g, 3, .12, .5, 0x7a5a3a, 0, .55, -.4); var sp = loc(x, z, g.rotation.y, 2.5, .9); sg('🚌 АВТОБУС ' + (1 + Math.floor(R() * 60)), 2.6, .6, sp[0], y + 2.8, sp[1], g.rotation.y, '#1f4f8a', '#fff', { fs: .5 }); addColR(x, z, 4, 1.6, g.rotation.y, y + 2.6); mark('bus', x, z); bus++; }
        else if (roll < .2) { M_(cityG, G.box, 0x2a4a9a, [.6, 1.1, .5], [x, y + .55, z], [0, a, 0]); M_(cityG, G.cyl, 0x2a4a9a, [.6, .5, .5], [x, y + 1.1, z], [0, a, PI / 2]); addColC(x, z, .3, y + 1.2); }
        else if (roll < .23) { M_(cityG, G.cyl, 0x3a4a3a, [.5, .9, .5], [x, y + .45, z]); addColC(x, z, .25, y + .9); }
      }
    });
    C.stats.hydrants = hyd; C.stats.busStops = bus; C.stats.streetTrees = trees;
  }
  // зелёные знаки над дорогой (порталы) — направления по месту
  function gantries() {
    var dest = { W: ['СИТИ ↑', 'МИДТАУН →', 'НАБЕРЕЖНАЯ СИТИ ←', 'ВЫЕЗД 3 · СИТИ'], E: ['ПОРТ →', 'ПАРК «СОЛНЕЧНЫЙ» ↑', 'ТЦ · МОТЕЛИ →', 'ВЫЕЗД 9 · ПОРТ'], S: ['ПЛЯЖ ↓', 'ДАУНТАУН ↑', 'МАЯК 2 КМ →', 'МАРИНА ←', 'ВЫЕЗД 6 · ЧЭАЙНОЕ'], N: ['ОЗЕРО «ТИХОЕ» ↑', 'ГОРА «ГУСИНАЯ» →', 'ТЕРМЫ ←'], NE: ['ГОРА «ГУСИНАЯ» ↑', 'ТЕХНОПАРК →'] }, n = 0, last = '';
    A.RD.forEach(function (r) { if (!r.P || r.w < 8) return; var L = A.resample(r.P, 420); for (var i = 1; i < L.length - 1; i++) { var p = L[i], q = A.resample([L[i], L[i + 1]], 3)[1] || L[i + 1], a = Math.atan2(q[0] - p[0], q[1] - p[1]), reg = region(p[0], p[1]); if (!A.outside(p[0], p[1])) continue;
      var o = r.w / 2 + 3, p1 = [p[0] + Math.cos(a) * o, p[1] - Math.sin(a) * o], p2 = [p[0] - Math.cos(a) * o, p[1] + Math.sin(a) * o]; if (!freeAt(p1[0], p1[1], .6) || !freeAt(p2[0], p2[1], .6) || A.isWater(p1[0], p1[1]) || A.isWater(p2[0], p2[1])) continue;
      var y = Math.max(H(p1[0], p1[1]), H(p2[0], p2[1])); [p1, p2].forEach(function (pp) { var yy = H(pp[0], pp[1]); M_(cityG, G.box, 0x8a8e96, [.4, y + 7 - yy, .4], [pp[0], (y + 7 + yy) / 2, pp[1]]); addColC(pp[0], pp[1], .3, y + 7); });
      M_(cityG, G.box, 0x8a8e96, [o * 2 + .4, .5, .5], [p[0], y + 6.9, p[1]], [0, a + PI / 2, 0]);
      var list = (dest[reg] || dest.S).filter(function (t) { return t !== last; }), t1 = pk(list); last = t1; var t2 = pk(list.filter(function (t) { return t !== t1; })) || t1;
      [[t1, -o * .45], [t2, o * .45]].forEach(function (tt) { var sx = p[0] + Math.cos(a) * tt[1] - Math.sin(a) * .3, sz = p[1] - Math.sin(a) * tt[1] - Math.cos(a) * .3; sg(tt[0], Math.max(4.2, tt[0].length * .38), 1.5, sx, y + 7.9, sz, a + PI, '#1f6a3a', '#ffffff', { fs: .5, border: true }); });
      n++; } });
    C.stats.gantries = n;
  }
  function billboards() {
    var ads = ['ЧЭАЙ~ ЛУЧШИЙ НА ПОБЕРЕЖЬЕ', 'ДИКСИ — ТЕПЕРЬ И ЗДЕСЬ', 'ГУСЬ-ТАКСИ 24/7 ☎', 'АДВОКАТ ПО ДТП · ЗВОНИ', 'БУРГЕРЫ «БАТОН» — 2 КМ', 'АКВАПАРК «СОЛНЕЧНЫЙ»', 'КОЛА «МАРЬЯ» ОСВЕЖАЕТ', 'НОВОСТРОЙКИ В СИТИ', 'РАДИО «ГУСЬ FM» 101.5', 'СТРАХОВКА ОТ ДЫР В ЗЕМЛЕ', 'БАТОНЫ ИЗ ХЛЕБНОГО МИРА', 'ПЛЯЖ ОТКРЫТ · ВХОД СВОБОДНЫЙ', 'НЕ ВЕРЬ СВЕТОФОРУ НА СЛОВО', 'МОТЕЛЬ «ГУСЬ» · 3 КМ', 'СТОМАТОЛОГ «УЛЫБКА ГУСЯ»', 'КИНО: «ДЫРА 3»', 'ПОНЧИКИ «ДЫРКА» · 24 ЧАСА', 'ПРОКАТ ЯХТ · МАРИНА', 'ВЫСТАВКА «ХЛЕБНЫЙ МИР»', 'ГОЛОСУЙ ЗА ГУСЯ!'];
    var cols_ = [['#ffd23f', '#1d2129'], ['#1d2129', '#ffd23f'], ['#c0392b', '#fff'], ['#2a8ac0', '#fff'], ['#fff', '#c0392b'], ['#5a2a8a', '#fff'], ['#2fae5b', '#fff']], n = 0;
    var ring = A.RD[0], L = A.resample(ring.P, 400);
    L.forEach(function (p, i) { if (i === 0 || !L[i + 1] || region(p[0], p[1]) === 'N') return; var q = L[i + 1], a = Math.atan2(q[0] - p[0], q[1] - p[1]), s = i % 2 ? 1 : -1, o = ring.w / 2 + 12, x = p[0] + Math.cos(a) * o * s, z = p[1] - Math.sin(a) * o * s;
      if (!A.outside(x, z) || !freeAt(x, z, 4) || nearRoad(x, z, 3) || A.isWater(x, z)) return; var y = H(x, z), ry = a + (s > 0 ? -PI / 2 : PI / 2) + rr(-.5, .5), c = pk(cols_);
      [-2.4, 2.4].forEach(function (lx) { var pp = loc(x, z, ry, lx, 0); M_(cityG, G.box, 0x6a6e76, [.4, 8, .4], [pp[0], y + 4, pp[1]]); addColC(pp[0], pp[1], .3, y + 8); });
      M_(cityG, G.box, 0x30343c, [9.4, 4.2, .3], [x, y + 9.6, z], [0, ry, 0]); var t = uniq(ads); sg(t, 9, 4, x + Math.sin(ry) * .2, y + 7.6, z + Math.cos(ry) * .2, ry, c[0], c[1], { fs: .32 }); n++; });
    C.stats.billboards = n;
  }
  function waterTowers() {
    [['ЧЭАЙНОЕ', 220, 930], ['ПОРТ-ГУСЬ', 830, -260], ['МИДТАУН', -850, 640]].forEach(function (t) { for (var k = 0; k < 40; k++) { var x = t[1] + rr(-60, 60), z = t[2] + rr(-60, 60); if (!ok(x, z, 6, 4)) continue; var y = H(x, z);
      for (var a = 0; a < 4; a++) { var ax = x + (a % 2 ? 3.2 : -3.2), az = z + (a < 2 ? 3.2 : -3.2); M_(cityG, G.box, 0x8a8e96, [.4, 18, .4], [ax, y + 9, az]); addColC(ax, az, .3, y + 18); }
      M_(cityG, G.cyl, 0xd8dce0, [9, 6, 9], [x, y + 21, z]); M_(cityG, G.cone, 0xb8bcc4, [9.4, 2.4, 9.4], [x, y + 25.2, z]); [0, PI].forEach(function (r) { sg(t[0], 6.4, 1.3, x + Math.sin(r) * 4.6, y + 20.4, z + Math.cos(r) * 4.6, r, null, '#1f4f8a', { fs: .8 }); });
      A.lm.push({ x: x, z: z, e: '🗼', n: 'Водонапорная башня «' + t[0] + '»' }); mark('wtower', x, z); break; } });
  }
  function courts() {
    // баскетбольная площадка и бейсбольное поле — по одной, там где есть место
    [[-90, 1000], [640, 900], [-560, 900]].forEach(function (c, n) { for (var k = 0; k < 30; k++) { var x = c[0] + rr(-60, 60), z = c[1] + rr(-60, 60); if (!ok(x, z, n === 2 ? 20 : 12, 3)) continue; var y = H(x, z);
      if (n === 2) { M_(cityG, G.box, 0x4a9a4a, [36, .12, 22], [x, y + .08, z]); M_(cityG, G.box, 0xf0f0e8, [.15, .03, 22], [x, y + .16, z]); [-1, 1].forEach(function (s) { M_(cityG, G.box, 0xffffff, [.15, 2.4, 6], [x + s * 17.5, y + 1.2, z]); addColR(x + s * 17.5, z, .3, 6, 0, y + 2.4); }); A.lm.push({ x: x, z: z, e: '⚽', n: 'Футбольное поле' }); }
      else if (n !== 1) { M_(cityG, G.box, 0x3a6a8a, [15, .12, 26], [x, y + .08, z]); M_(cityG, G.box, 0xe8e8e0, [14, .02, .12], [x, y + .16, z]); [-1, 1].forEach(function (s) { M_(cityG, G.box, 0x8a8e96, [.2, 3.6, .2], [x, y + 1.8, z + s * 12]); M_(cityG, G.box, 0xffffff, [1.8, 1.1, .1], [x, y + 3.6, z + s * 11.8]); M_(cityG, G.cyl, 0xe8742a, [.5, .05, .5], [x, y + 3.1, z + s * 11.5]); addColC(x, z + s * 12, .2, y + 4); }); A.lm.push({ x: x, z: z, e: '🏀', n: 'Баскетбольная площадка' }); }
      else { M_(cityG, G.cyl, 0xb88a5a, [30, .1, 30], [x, y + .06, z]); M_(cityG, G.box, 0x6aa04a, [16, .12, 16], [x, y + .1, z], [0, PI / 4, 0]); for (var a = 0; a < 4; a++) M_(cityG, G.box, 0xffffff, [.6, .1, .6], [x + Math.sin(a * PI / 2) * 11, y + .14, z + Math.cos(a * PI / 2) * 11]); A.lm.push({ x: x, z: z, e: '⚾', n: 'Бейсбольное поле' }); }
      break; } });
  }

  /* =====================================================================
     ЗАПУСК
     ===================================================================== */
  C.build = function (api) {
    A = api; R = api.R; rr = api.rr; pk = api.pk; RECENT.length = 0; RES.length = 0; usedText = {}; C.stats = {}; C.rects = [];
    tex();
    var steps = [['siti', siti], ['elevated', elevated], ['gantries', gantries], ['furniture', streetFurniture], ['billboards', billboards], ['waterTowers', waterTowers], ['courts', courts], ['lots', lots]];
    steps.forEach(function (s) { try { s[1](); } catch (e) { console.error('[CITY ' + s[0] + ']', e); (C.stats.err = C.stats.err || []).push(s[0] + ': ' + e.message); } });
    A.stats.city = C.stats;
  };
})();
