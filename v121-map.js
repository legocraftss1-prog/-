/* =====================================================================
   МГИАГ 1.20 — КАРТА В ТЕЛЕФОНЕ: полная, с приближением
   • Видна вся карта: старый город и (после «Чэай~») все новые земли «почти дома».
   • Приближение: щипок двумя пальцами, колёсико мыши, кнопки «＋/－». Перемещение — перетащить пальцем/мышью.
   • Короткое касание ставит 📍 мою метку — в старом городе и на новых землях (не в воде).
   • Кнопки: «🎯 Я» — к себе, «🗺️ Вся карта». Положение и масштаб запоминаются, пока игра открыта.
   • Чем ближе, тем больше видно: дороги и дома рисуются чётко поверх подложки, при сильном приближении
     появляются названия мест.
   ===================================================================== */
(function () {
  'use strict';
  var M = window.MG_MAP = { V: null };
  var S0 = 600 / 1500, CW = 600;   // масштаб старой подложки (единиц карты на метр) и размер холста
  function exp() { return window.MG_EXPAND && MG_EXPAND.active && MG_EXPAND.built; }
  function bounds() { return exp() ? { x0: -1750, x1: 1750, z0: -1862, z1: 1810 } : { x0: -750, x1: 750, z0: -750, z1: 750 }; }
  function fit() { var b = bounds(), span = Math.max(b.x1 - b.x0, b.z1 - b.z0); return { cx: (b.x0 + b.x1) / 2, cz: (b.z0 + b.z1) / 2, k: CW / span }; }
  function clampV(V) { var b = bounds(), f = fit(); V.k = Math.max(f.k * .9, Math.min(14, V.k)); var hw = CW / 2 / V.k; V.cx = Math.max(b.x0 - hw * .5, Math.min(b.x1 + hw * .5, V.cx)); V.cz = Math.max(b.z0 - hw * .5, Math.min(b.z1 + hw * .5, V.cz)); }
  function W2C(V, x, z) { return [(x - V.cx) * V.k + CW / 2, (z - V.cz) * V.k + CW / 2]; }
  function C2W(V, px, pz) { return [(px - CW / 2) / V.k + V.cx, (pz - CW / 2) / V.k + V.cz]; }

  var catCol = function (l) { try { return CATCOL[catOf(l)] || '#8a8a8a'; } catch (e) { return '#8a8a8a'; } };
  function draw(cv) {
    var V = M.V, g = cv.getContext('2d'); if (!g) return;
    g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = exp() ? '#7fb0d0' : '#cfd6c4'; g.fillRect(0, 0, CW, CW);
    try { if (!mapBase) buildMapBase(); } catch (e) { }
    // подложки (в единицах старой карты): x_ед = (x + 750) * 0.4
    var sc = V.k / S0, tx = (-750 - V.cx) * V.k + CW / 2, tz = (-750 - V.cz) * V.k + CW / 2;
    g.imageSmoothingEnabled = true; g.setTransform(sc, 0, 0, sc, tx, tz);
    try { if (exp() && MG_EXPAND.radar) g.drawImage(MG_EXPAND.radar.cv, MG_EXPAND.radar.ox, MG_EXPAND.radar.oz); } catch (e) { }
    try { if (mapBase) g.drawImage(mapBase, 0, 0); } catch (e) { }
    g.setTransform(1, 0, 0, 1, 0, 0);
    var b0 = C2W(V, -40, -40), b1 = C2W(V, CW + 40, CW + 40), inV = function (x, z, r) { r = r || 0; return x + r > b0[0] && x - r < b1[0] && z + r > b0[1] && z - r < b1[1]; };
    // чёткие дороги и дома при приближении
    if (V.k > .75) {
      g.strokeStyle = '#ffffff'; g.lineCap = 'round'; g.lineJoin = 'round';
      try { ROADS.forEach(function (r) { if (!r.w) return; var P = r.pts, on = false; for (var i = 0; i < P.length; i += 6) if (inV(P[i][0], P[i][1], 80)) { on = true; break; } if (!on) return; g.lineWidth = Math.max(1.5, r.w * V.k * .9); g.beginPath(); P.forEach(function (p, i) { var c = W2C(V, p[0], p[1]); i ? g.lineTo(c[0], c[1]) : g.moveTo(c[0], c[1]); }); g.stroke(); }); } catch (e) { }
      g.fillStyle = '#9a948a';
      try { cols.forEach(function (c) { if (c.on === false || c.rad !== undefined) return; var w = c.x1 - c.x0, d = c.z1 - c.z0; if (w * d < 30 || w > 300 || d > 300) return; var cx = (c.x0 + c.x1) / 2, cz = (c.z0 + c.z1) / 2; if (!inV(cx, cz, Math.max(w, d))) return;
        var p = W2C(V, cx, cz); g.save(); g.translate(p[0], p[1]); if (c.cs !== undefined) { g.rotate(-c.ry); g.fillRect(-c.hw * V.k, -c.hd * V.k, c.hw * 2 * V.k, c.hd * 2 * V.k); } else g.fillRect(-w / 2 * V.k, -d / 2 * V.k, w * V.k, d * V.k); g.restore(); }); } catch (e) { }
    }
    // надземка
    try { if (exp() && window.MG_CITY && MG_CITY.L) { g.strokeStyle = '#c0392b'; g.lineWidth = Math.max(1.5, 2.2 * V.k); g.setLineDash([6, 4]); g.beginPath(); MG_CITY.L.P.forEach(function (p, i) { var c = W2C(V, p[0], p[1]); i ? g.lineTo(c[0], c[1]) : g.moveTo(c[0], c[1]); }); g.stroke(); g.setLineDash([]); } } catch (e) { }
    // места
    var big = V.k > 1.1, sz = Math.round(Math.max(10, Math.min(18, 10 + V.k * 3)));
    try { LANDMARKS.forEach(function (l) { if (!inV(l.x, l.z, 20)) return; if (!big && l.ex && /🛣️/.test(l.e)) return; var c = W2C(V, l.x, l.z);
      g.fillStyle = catCol(l); g.globalAlpha = .85; g.beginPath(); g.arc(c[0], c[1], sz * .62, 0, Math.PI * 2); g.fill(); g.globalAlpha = 1;
      g.font = sz + 'px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; g.textAlign = 'center'; g.fillText(l.e, c[0], c[1] + sz * .35);
      if (V.k > 2.2) { g.font = 'bold 11px Rubik, Arial'; g.lineWidth = 3; g.strokeStyle = 'rgba(255,255,255,.9)'; g.strokeText(l.n, c[0], c[1] + sz + 6); g.fillStyle = '#22325a'; g.fillText(l.n, c[0], c[1] + sz + 6); } }); } catch (e) { }
    if (typeof area !== 'undefined' && area === 'city') {
      try { if (NAV.route) { g.strokeStyle = '#ff4fa0'; g.lineWidth = 4; g.lineJoin = 'round'; g.beginPath(); NAV.route.forEach(function (p, i) { var c = W2C(V, p[0], p[1]); i ? g.lineTo(c[0], c[1]) : g.moveTo(c[0], c[1]); }); g.stroke(); } } catch (e) { }
      var dot = function (x, z, col, e) { var c = W2C(V, x, z); g.fillStyle = col; g.strokeStyle = '#fff'; g.lineWidth = 3; g.beginPath(); g.arc(c[0], c[1], 11, 0, Math.PI * 2); g.fill(); g.stroke(); if (e) { g.font = '14px sans-serif'; g.textAlign = 'center'; g.fillText(e, c[0], c[1] + 5); } };
      try { var tg = taxiTarget(); if (tg) dot(tg.x, tg.z, CATCOL.taxi, TAXI.phase === 'pickup' ? '🙋' : '🏁'); } catch (e) { }
      try { if (SKEV.state === 'accepted' || SKEV.state === 'running') dot(SKP.cx, SKP.cz - 14, CATCOL.event, '⭐'); } catch (e) { }
      try { var o = objective(); if (o.p) { var c = W2C(V, o.p.x, o.p.z); g.font = '22px sans-serif'; g.textAlign = 'center'; g.fillText('⭐', c[0], c[1] + 8); } } catch (e) { }
      try { VEHS.forEach(function (v) { var c = W2C(V, v.pos.x, v.pos.z); g.font = '16px sans-serif'; g.textAlign = 'center'; g.fillText(VEH_TYPES[v.type].e, c[0], c[1] + 6); }); } catch (e) { }
      try { if (comp.g.visible) { var cc = W2C(V, comp.pos.x, comp.pos.z); g.fillStyle = '#ffb84d'; g.beginPath(); g.arc(cc[0], cc[1], 5, 0, Math.PI * 2); g.fill(); } } catch (e) { }
      try { if (S.mark) { var m = W2C(V, S.mark.x, S.mark.z); g.font = '24px sans-serif'; g.textAlign = 'center'; g.fillText('📍', m[0], m[1]); } } catch (e) { }
      try { var P = player.drive ? player.drive.pos : player.pos, pc = W2C(V, P.x, P.z), yw = player.drive ? player.drive.yaw : player.yaw; g.save(); g.translate(pc[0], pc[1]); g.rotate(-yw + Math.PI); g.fillStyle = '#e8473b'; g.strokeStyle = '#fff'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(0, -12); g.lineTo(8, 9); g.lineTo(0, 4); g.lineTo(-8, 9); g.closePath(); g.fill(); g.stroke(); g.restore(); } catch (e) { }
    }
    // масштабная линейка
    var m = [20, 50, 100, 200, 500, 1000].find(function (q) { return q * V.k > 60; }) || 1000; g.fillStyle = 'rgba(255,255,255,.85)'; g.fillRect(10, CW - 30, m * V.k + 16, 22); g.fillStyle = '#22325a'; g.fillRect(18, CW - 16, m * V.k, 4); g.font = 'bold 12px Rubik, Arial'; g.textAlign = 'left'; g.fillText(m + ' м', 18, CW - 20);
  }

  /* ---------- метка: где можно ставить ---------- */
  function markOK(x, z) {
    if (Math.abs(x) <= 432 && Math.abs(z) <= 432) return true;
    if (exp() && MG_EXPAND.outside(x, z)) { if (MG_EXPAND.isWater(x, z) || MG_EXPAND.gridH(x, z) < -.3) return 'вода'; return true; }
    if (Math.abs(x) <= 742 && Math.abs(z) <= 742) return true;
    return false;
  }
  M.markOK = markOK;

  function install() {
    if (typeof drawMap !== 'function' || typeof buildMapBase !== 'function') return false;
    window.drawMap = drawMap = function (b) {
      if (!M.V) M.V = fit(); clampV(M.V);
      var cv = document.createElement('canvas'); cv.width = cv.height = CW; cv.className = 'mgMap';
      cv.style.cssText = 'width:100%;max-width:440px;aspect-ratio:1;display:block;margin:4px auto;border:2px solid #22325a;border-radius:8px;touch-action:none;cursor:grab';
      b.appendChild(cv); draw(cv);
      var row = document.createElement('div'); row.style.cssText = 'display:flex;gap:6px;justify-content:center;margin:4px 0';
      var zoomAt = function (f, px, pz) { var V = M.V, w0 = C2W(V, px, pz); V.k *= f; clampV(V); var w1 = C2W(V, px, pz); V.cx += w0[0] - w1[0]; V.cz += w0[1] - w1[1]; clampV(V); draw(cv); };
      [['＋', function () { zoomAt(1.6, CW / 2, CW / 2); }], ['－', function () { zoomAt(1 / 1.6, CW / 2, CW / 2); }], ['🎯 Я', function () { var P = player.drive ? player.drive.pos : player.pos; M.V.cx = P.x; M.V.cz = P.z; M.V.k = Math.max(M.V.k, 1.6); clampV(M.V); draw(cv); }], ['🗺️ Вся карта', function () { M.V = fit(); draw(cv); }]]
        .forEach(function (q) { var bt = document.createElement('button'); bt.className = 'bt2'; bt.textContent = q[0]; bt.style.cssText = 'flex:1;max-width:110px;padding:8px 4px;font-size:15px'; bt.onclick = function (e) { e.stopPropagation(); try { sfx('click'); } catch (er) { } q[1](); }; row.appendChild(bt); });
      b.appendChild(row);
      var hint = document.createElement('div'); hint.className = 'ti'; hint.style.fontSize = '14px';
      hint.textContent = area === 'city' ? 'Двигай карту пальцем, приближай щипком или колёсиком. Короткое касание — поставить 📍 метку (маршрут построится розовой линией).' : 'Метку можно ставить, когда ты на улице.'; b.appendChild(hint);
      try { if (S.mark) rowBtn(b, '📍 Моя метка', '', 'Убрать метку', function () { clearMark(); renderPhone(); }); } catch (e) { }
      // жесты
      var ptr = new Map(), start = null, pinch = null;
      var rel = function (e) { var r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * CW, (e.clientY - r.top) / r.height * CW]; };
      cv.addEventListener('pointerdown', function (e) { e.preventDefault(); e.stopPropagation(); try { cv.setPointerCapture(e.pointerId); } catch (er) { } ptr.set(e.pointerId, rel(e));
        if (ptr.size === 1) start = { p: rel(e), t: performance.now(), cx: M.V.cx, cz: M.V.cz, moved: false };
        if (ptr.size === 2) { var a = Array.from(ptr.values()); pinch = { d: Math.hypot(a[0][0] - a[1][0], a[0][1] - a[1][1]), k: M.V.k, mid: [(a[0][0] + a[1][0]) / 2, (a[0][1] + a[1][1]) / 2] }; if (start) start.moved = true; } });
      cv.addEventListener('pointermove', function (e) { if (!ptr.has(e.pointerId)) return; e.preventDefault(); ptr.set(e.pointerId, rel(e));
        if (ptr.size >= 2 && pinch) { var a = Array.from(ptr.values()), d = Math.hypot(a[0][0] - a[1][0], a[0][1] - a[1][1]), mid = [(a[0][0] + a[1][0]) / 2, (a[0][1] + a[1][1]) / 2]; var w0 = C2W(M.V, pinch.mid[0], pinch.mid[1]); M.V.k = pinch.k * d / Math.max(10, pinch.d); clampV(M.V); var w1 = C2W(M.V, mid[0], mid[1]); M.V.cx += w0[0] - w1[0]; M.V.cz += w0[1] - w1[1]; clampV(M.V); draw(cv); return; }
        if (start) { var p = rel(e), dx = p[0] - start.p[0], dz = p[1] - start.p[1]; if (Math.hypot(dx, dz) > 6) start.moved = true; if (start.moved) { M.V.cx = start.cx - dx / M.V.k; M.V.cz = start.cz - dz / M.V.k; clampV(M.V); draw(cv); } } });
      var up = function (e) { if (!ptr.has(e.pointerId)) return; ptr.delete(e.pointerId); if (ptr.size < 2) pinch = null;
        if (ptr.size === 0 && start) { var s = start; start = null; if (!s.moved && performance.now() - s.t < 500 && e.type === 'pointerup') { if (area !== 'city') return; var w = C2W(M.V, s.p[0], s.p[1]), okm = markOK(w[0], w[1]);
            if (okm !== true) { toast(okm === 'вода' ? 'Там вода.' : 'Там край карты.'); return; } try { setMark(w[0], w[1]); updNav(0); } catch (er) { } renderPhone(); } }
        if (ptr.size === 1) { var only = Array.from(ptr.values())[0]; start = { p: only, t: 0, cx: M.V.cx, cz: M.V.cz, moved: true }; } };
      cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
      cv.addEventListener('wheel', function (e) { e.preventDefault(); var p = rel(e); zoomAt(e.deltaY < 0 ? 1.25 : 1 / 1.25, p[0], p[1]); }, { passive: false });
      // живое обновление (где я, машины) пока карта открыта
      var tick = setInterval(function () { if (!document.body.contains(cv)) { clearInterval(tick); return; } if (!ptr.size) draw(cv); }, 700);
    };
    M.draw = draw; M.fit = fit; M.W2C = W2C; M.C2W = C2W;
    return true;
  }
  var iv = setInterval(function () { try { if (typeof worldReady !== 'undefined' && worldReady && install()) clearInterval(iv); } catch (e) { console.error('[MG_MAP]', e); clearInterval(iv); } }, 400);
})();
