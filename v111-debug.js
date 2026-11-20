/* МГИАГ 1.11 → 1.19 — ИНСТРУМЕНТ ПОИСКА НЕВИДИМЫХ СТЕН И ДЫР НА КАРТЕ
   Включить: клавиша F9 (ПК), либо в адресе ?debug=1, либо DEV-панель.
   Показывает рамки коллайдеров рядом с тобой и твои координаты.
   «Проверить» — радиус на выбор: рядом (40 м, точная проверка лучами), 150 м, 400 м или вся карта.
   Большие радиусы проверяются по частям, понемногу каждый кадр — игра не зависает, видна полоска прогресса.
   Ищет: невидимые стены (коллайдер, у которого нет видимых предметов рядом) и дыры в земле
   (место, где под ногами нет видимой земли или она сильно ниже, чем должна быть).
   Найденное — списком: у каждого места кнопка «Телепорт», кнопка «Скопировать всё». Игру не меняет. */
(function () {
  'use strict';
  var on = false, grp = null, hud = null, info = null, listEl = null, prog = null, suspects = [], holes = [], radius = 40, job = null;
  function ready() { return typeof worldReady !== 'undefined' && worldReady && typeof cols !== 'undefined' && typeof scene !== 'undefined' && typeof player !== 'undefined'; }
  var BTN = 'margin:4px 4px 0 0;padding:6px 8px;border-radius:6px;border:0;font:700 12px sans-serif;cursor:pointer';
  function mkBtn(t, fn, par) { var b = document.createElement('button'); b.textContent = t; b.style.cssText = BTN; b.onclick = fn; (par || hud).appendChild(b); return b; }
  var radBtns = [];
  function mkHud() {
    hud = document.createElement('div');
    hud.style.cssText = 'position:fixed;left:8px;top:calc(env(safe-area-inset-top,0px) + 8px);z-index:70;background:rgba(0,0,0,.78);color:#9dff9d;font:12px monospace;padding:6px 8px;border-radius:8px;display:none;max-width:min(560px,92vw)';
    info = document.createElement('div'); hud.appendChild(info);
    var rr = document.createElement('div'); rr.style.marginTop = '4px'; rr.appendChild(document.createTextNode('Радиус: ')); hud.appendChild(rr);
    [[40, 'рядом 40 м'], [150, '150 м'], [400, '400 м'], [0, 'вся карта']].forEach(function (o) { var b = mkBtn(o[1], function () { radius = o[0]; paintRad(); }, rr); b.dataset.r = o[0]; radBtns.push(b); });
    var row = document.createElement('div'); hud.appendChild(row);
    mkBtn('🔎 Проверить', function () { startScan(); }, row);
    mkBtn('⏹ Стоп', function () { if (job) { job = null; prog.textContent = 'Остановлено.'; } }, row);
    mkBtn('📋 Координаты', function () { var p = player.pos, t = 'x=' + p.x.toFixed(1) + ' y=' + p.y.toFixed(1) + ' z=' + p.z.toFixed(1); copy(t); if (typeof toast === 'function') toast('Скопировано: ' + t, 2500); }, row);
    mkBtn('📋 Скопировать всё', function () { copy(report()); if (typeof toast === 'function') toast('Список скопирован', 2000); }, row);
    mkBtn('✕', function () { toggle(false); }, row);
    prog = document.createElement('div'); prog.style.cssText = 'margin-top:4px;color:#ffe08a'; hud.appendChild(prog);
    listEl = document.createElement('div'); listEl.style.cssText = 'margin-top:4px;max-height:38vh;overflow:auto'; hud.appendChild(listEl);
    document.body.appendChild(hud); paintRad();
  }
  function paintRad() { radBtns.forEach(function (b) { var a = +b.dataset.r === radius; b.style.background = a ? '#9dff9d' : '#ddd'; b.style.color = '#111'; }); }
  function copy(t) { try { var pr = navigator.clipboard && navigator.clipboard.writeText(t); if (pr && pr.catch) pr.catch(function () { }); } catch (e) { } window.MG_DEBUG_LAST = t; }
  function toggle(v) {
    if (!ready()) return; on = v === undefined ? !on : v; if (!hud) mkHud(); hud.style.display = on ? 'block' : 'none';
    if (!on && grp) { scene.remove(grp); grp = null; } if (!on) job = null;
  }
  var lastP = null, lastBuild = 0;
  function rebuild() {
    if (grp) scene.remove(grp); grp = new THREE.Group(); var p = player.pos, n = 0;
    cols.forEach(function (c) {
      if (c.on === false || c.x1 < p.x - 45 || c.x0 > p.x + 45 || c.z1 < p.z - 45 || c.z0 > p.z + 45 || n > 400) return; n++;
      var h = c.h !== undefined ? c.h : 4, w = c.x1 - c.x0, d = c.z1 - c.z0, bad = suspects.indexOf(c) >= 0;
      var m = new THREE.Mesh(new THREE.BoxGeometry(Math.max(.05, w), Math.max(.05, h), Math.max(.05, d)), new THREE.MeshBasicMaterial({ color: bad ? 0xff2020 : 0x20ff60, wireframe: true, depthTest: false, transparent: true, opacity: bad ? 1 : .6 }));
      m.position.set((c.x0 + c.x1) / 2, (c.b !== undefined ? c.b : H((c.x0 + c.x1) / 2, (c.z0 + c.z1) / 2)) + h / 2, (c.z0 + c.z1) / 2); m.renderOrder = 999; m.userData.noShadow = true; grp.add(m);
    });
    holes.forEach(function (q) { if (Math.abs(q.x - p.x) > 60 || Math.abs(q.z - p.z) > 60) return; var m = new THREE.Mesh(new THREE.CylinderGeometry(.6, .6, 6, 8), new THREE.MeshBasicMaterial({ color: 0xff40ff, wireframe: true, depthTest: false })); m.position.set(q.x, q.y + 3, q.z); m.renderOrder = 999; grp.add(m); });
    scene.add(grp); lastP = { x: p.x, z: p.z };
  }

  /* ---------- точная проверка рядом (лучами) ---------- */
  function targetsList() { var t = []; cityG.traverse(function (o) { if (o.isMesh && !(o.userData && (o.userData.isLake || o.userData.noShadow))) t.push(o); }); return t; }
  function rayCheck(c, rc, targets) {
    var cx = (c.x0 + c.x1) / 2, cz = (c.z0 + c.z1) / 2, y = H(cx, cz) + 1.0, M = 1.2, dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    for (var i = 0; i < 4; i++) {
      var dx = dirs[i][0], dz = dirs[i][1], ox = cx, oz = cz;
      if (dz) oz = cz - dz * ((c.z1 - c.z0) / 2 + M * 2); if (dx) ox = cx - dx * ((c.x1 - c.x0) / 2 + M * 2);
      for (var hy = 0; hy < 2; hy++) { rc.set(new THREE.Vector3(ox, y + hy * 1.2, oz), new THREE.Vector3(dx, 0, dz)); rc.far = (dx ? (c.x1 - c.x0) : (c.z1 - c.z0)) + M * 4 + 1; if (rc.intersectObjects(targets, false).length) return true; }
    }
    return false;
  }

  /* ---------- быстрая проверка по карте (по частям) ----------
     1) собираем «где есть видимые предметы выше земли»: центры треугольников всех видимых мешей → клетки 2×2 м;
     2) коллайдер подозрителен, если вокруг его рамки нет ни одной такой клетки;
     3) дыры: в точках сетки ищем видимую землю под ногами лучом сверху (только по мешам земли). */
  var GROUND_MATS = null;
  function isGroundMesh(o) { var m = o.material; return m && (m === groundMat || (typeof roadMat !== 'undefined' && m === roadMat) || (typeof walkMat !== 'undefined' && m === walkMat)); }
  function startScan() {
    if (!ready()) return; suspects = []; holes = []; listEl.innerHTML = '';
    var p = player.drive ? player.drive.pos : player.pos, R = radius;
    if (R === 40) { // как раньше: точно, сразу
      var rc = new THREE.Raycaster(), tg = targetsList();
      cols.filter(function (c) { return c.on !== false && c.x1 > p.x - 40 && c.x0 < p.x + 40 && c.z1 > p.z - 40 && c.z0 < p.z + 40 && (c.x1 - c.x0) < 200 && (c.z1 - c.z0) < 200; }).forEach(function (c) { if (!rayCheck(c, rc, tg)) suspects.push(c); });
      job = { stage: 'holes', p: p, R: 40, step: 3, i: 0, n: 0 }; prepHoles(job); return;
    }
    // все меши города, в том числе скрытые сейчас по дальности (раньше дальние куски не учитывались — отсюда ложные «стены»)
    var meshes = []; cityG.traverse(function (o) { if (o.isMesh && o.geometry && o.geometry.attributes && o.geometry.attributes.position && !(o.userData && (o.userData.isLake || o.userData.noShadow)) && !isGroundMesh(o)) meshes.push(o); });
    job = { stage: 'index', p: p, R: R, meshes: meshes, mi: 0, ti: 0, cells: new Set(), list: null, ci: 0, step: R ? 5 : 12 };
    cityG.updateMatrixWorld(true);
  }
  function inR(x, z) { return !job.R || (Math.abs(x - job.p.x) < job.R && Math.abs(z - job.p.z) < job.R); }
  var tv = null;
  function stepIndex(budget) {
    tv = tv || new THREE.Vector3(); var J = job;
    while (budget > 0 && J.mi < J.meshes.length) {
      var o = J.meshes[J.mi], pa = o.geometry.attributes.position, ix = o.geometry.index, cnt = ix ? ix.count : pa.count, mw = o.matrixWorld;
      var end = Math.min(cnt, J.ti + 3 * 4000);
      for (var t = J.ti; t < end; t += 3) {
        var a = ix ? ix.getX(t) : t, b = ix ? ix.getX(t + 1) : t + 1, c = ix ? ix.getX(t + 2) : t + 2;
        tv.set((pa.getX(a) + pa.getX(b) + pa.getX(c)) / 3, (pa.getY(a) + pa.getY(b) + pa.getY(c)) / 3, (pa.getZ(a) + pa.getZ(b) + pa.getZ(c)) / 3).applyMatrix4(mw);
        if (!inR(tv.x, tv.z)) continue; if (tv.y < H(tv.x, tv.z) + .4) continue;
        J.cells.add(Math.floor(tv.x / 2) * 100003 + Math.floor(tv.z / 2));
      }
      budget -= (end - J.ti) / 3; J.ti = end; if (J.ti >= cnt) { J.mi++; J.ti = 0; }
    }
    if (J.mi >= J.meshes.length) { J.stage = 'cols'; J.list = cols.filter(function (c) { return c.on !== false && (c.x1 - c.x0) < 200 && (c.z1 - c.z0) < 200 && inR((c.x0 + c.x1) / 2, (c.z0 + c.z1) / 2); }); J.ci = 0; }
  }
  function seen(c) { var C = job.cells, x0 = Math.floor((c.x0 - 1.2) / 2), x1 = Math.floor((c.x1 + 1.2) / 2), z0 = Math.floor((c.z0 - 1.2) / 2), z1 = Math.floor((c.z1 + 1.2) / 2);
    for (var i = x0; i <= x1; i++) for (var j = z0; j <= z1; j++) if (C.has(i * 100003 + j)) return true; return false; }
  function stepCols(budget) { var J = job; while (budget-- > 0 && J.ci < J.list.length) { var c = J.list[J.ci++]; if (c.h !== undefined && c.h - H((c.x0 + c.x1) / 2, (c.z0 + c.z1) / 2) < .25) continue; if (!seen(c)) suspects.push(c); } if (J.ci >= J.list.length) { J.cells = null; prepHoles(J); } }
  function prepHoles(J) {
    J.stage = 'holes'; J.gm = []; cityG.traverse(function (o) { if (o.isMesh && isGroundMesh(o)) J.gm.push(o); });   // и скрытая по дальности земля тоже if (window.MG_UNDERLAY) J.gm.push(MG_UNDERLAY);
    var E = window.MG_EXPAND, lim = E && E.active ? 1700 : 742, R = J.R || lim;
    J.hx0 = Math.max(-lim, J.p.x - R); J.hx1 = Math.min(lim, J.p.x + R); J.hz0 = Math.max(-lim, J.p.z - R); J.hz1 = Math.min(lim, J.p.z + R); J.hx = J.hx0; J.hz = J.hz0;
    J.rc = new THREE.Raycaster(); J.rc.far = 400; try { J.rc.layers.enableAll(); } catch (e) { } J.dn = new THREE.Vector3(0, -1, 0); J.o = new THREE.Vector3(); J.total = Math.ceil((J.hx1 - J.hx0) / J.step) * Math.ceil((J.hz1 - J.hz0) / J.step); J.done = 0;
    // для скорости — сетка мешей земли по клеткам 100 м
    J.gg = {}; J.gm.forEach(function (o) { if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere(); var bs = o.geometry.boundingSphere, c = bs.center.clone().applyMatrix4(o.matrixWorld), r = bs.radius;
      if (r > 900) { (J.gg.all = J.gg.all || []).push(o); return; } for (var i = Math.floor((c.x - r) / 100); i <= Math.floor((c.x + r) / 100); i++) for (var j = Math.floor((c.z - r) / 100); j <= Math.floor((c.z + r) / 100); j++) (J.gg[i + ',' + j] = J.gg[i + ',' + j] || []).push(o); });
  }
  function landHere(x, z) { var E = window.MG_EXPAND; if (Math.max(Math.abs(x), Math.abs(z)) <= 742) return true; return !!(E && E.active && E.outside(x, z) && !E.isWater(x, z) && E.gridH(x, z) > -.3); }
  function stepHoles(budget) {
    var J = job, t0 = performance.now();
    while (performance.now() - t0 < budget && J.hz < J.hz1) {
      var x = J.hx, z = J.hz; J.done++;
      if (landHere(x, z) && (typeof area === 'undefined' || area === 'city')) {
        var h = H(x, z), L = (J.gg[Math.floor(x / 100) + ',' + Math.floor(z / 100)] || []).concat(J.gg.all || []);
        J.o.set(x, h + 60, z); J.rc.set(J.o, J.dn); var hit = L.length ? J.rc.intersectObjects(L, false) : [];
        if (!hit.length) holes.push({ x: x, z: z, y: h, why: 'нет земли' }); else if (hit[0].point.y < h - 1.6) holes.push({ x: x, z: z, y: h, why: 'земля ниже на ' + (h - hit[0].point.y).toFixed(1) + ' м' });
      }
      J.hx += J.step; if (J.hx >= J.hx1) { J.hx = J.hx0; J.hz += J.step; }
    }
    if (J.hz >= J.hz1) finish();
  }
  function finish() {
    job = null;
    // соседние точки-дыры склеиваются в одно место
    var merged = []; holes.forEach(function (q) { var m = merged.find(function (k) { return Math.hypot(k.x - q.x, k.z - q.z) < 14; }); if (m) m.n++; else merged.push({ x: q.x, z: q.z, y: q.y, why: q.why, n: 1 }); }); holes = merged;
    prog.textContent = 'Готово: невидимых стен ' + suspects.length + ', мест с дырами ' + holes.length + '.';
    renderList(); copy(report()); if (typeof toast === 'function') toast('Найдено: стен ' + suspects.length + ', дыр ' + holes.length + '. Список скопирован.', 4000); rebuild();
  }
  function placeName(x, z) { var E = window.MG_EXPAND, best = null, bd = 1e9; try { LANDMARKS.forEach(function (l) { var d = Math.hypot(l.x - x, l.z - z); if (d < bd) { bd = d; best = l; } }); } catch (e) { } return best && bd < 260 ? 'у «' + best.n + '»' : ''; }
  function tp(x, z) { try { if (player.drive && typeof exitVehicle === 'function') exitVehicle(); if (player.drive) return; var q = { x: x, z: z }; for (var r = 0; r < 12; r += 1) { var a = r * 2.4, px = x + Math.cos(a) * (r + 1.5), pz = z + Math.sin(a) * (r + 1.5); if (freeAt(px, pz, .5)) { q = { x: px, z: pz }; break; } } placeA(player, q.x, q.z, player.yaw); if (typeof showComp === 'function') showComp(q.x + 1.2, q.z + .6); lastBuild = 0; rebuild(); } catch (e) { console.error('[MG_DEBUG tp]', e); } }
  function renderList() {
    listEl.innerHTML = ''; var items = suspects.map(function (c) { return { k: 'стена', x: (c.x0 + c.x1) / 2, z: (c.z0 + c.z1) / 2, t: 'x[' + c.x0.toFixed(1) + '..' + c.x1.toFixed(1) + '] z[' + c.z0.toFixed(1) + '..' + c.z1.toFixed(1) + '] h=' + (c.h !== undefined ? c.h.toFixed(1) : 'авто') }; })
      .concat(holes.map(function (q) { return { k: 'дыра', x: q.x, z: q.z, t: 'x=' + q.x.toFixed(0) + ' z=' + q.z.toFixed(0) + ' — ' + q.why + (q.n > 1 ? ' (' + q.n + ' точек)' : '') }; }));
    items.slice(0, 300).forEach(function (it) { var d = document.createElement('div'); d.style.cssText = 'margin:2px 0;display:flex;gap:6px;align-items:center'; var s = document.createElement('span'); s.textContent = (it.k === 'стена' ? '🧱 ' : '🕳️ ') + it.t + ' ' + placeName(it.x, it.z); s.style.flex = '1';
      d.appendChild(s); mkBtn('Телепорт', function () { tp(it.x, it.z); }, d); listEl.appendChild(d); });
    if (items.length > 300) { var m = document.createElement('div'); m.textContent = '…и ещё ' + (items.length - 300) + ' (все — в «Скопировать всё»)'; listEl.appendChild(m); }
  }
  function report() {
    var a = suspects.map(function (c) { return 'стена x[' + c.x0.toFixed(1) + '..' + c.x1.toFixed(1) + '] z[' + c.z0.toFixed(1) + '..' + c.z1.toFixed(1) + '] h=' + (c.h !== undefined ? c.h.toFixed(1) : 'авто'); })
      .concat(holes.map(function (q) { return 'дыра x=' + q.x.toFixed(0) + ' z=' + q.z.toFixed(0) + ' — ' + q.why; }));
    return a.length ? a.join('\n') : 'ничего не найдено';
  }
  function frame() {
    if (!on) return; var p = player.pos, now = performance.now();
    info.textContent = 'x ' + p.x.toFixed(1) + '  y ' + p.y.toFixed(1) + '  z ' + p.z.toFixed(1) + '   коллайдеров: ' + cols.length + '  стен: ' + suspects.length + '  дыр: ' + holes.length;
    if (job) {
      try {
        if (job.stage === 'index') { stepIndex(60000); prog.textContent = '⏳ Собираю видимые предметы: ' + Math.round(100 * job.mi / Math.max(1, job.meshes.length)) + '%'; }
        else if (job.stage === 'cols') { stepCols(4000); prog.textContent = '⏳ Проверяю стены: ' + Math.round(100 * job.ci / Math.max(1, job.list.length)) + '%'; }
        else if (job.stage === 'holes') { stepHoles(7); if (job) prog.textContent = '⏳ Ищу дыры в земле: ' + Math.round(100 * job.done / Math.max(1, job.total)) + '%'; }
      } catch (e) { console.error('[MG_DEBUG scan]', e); job = null; prog.textContent = 'Ошибка проверки: ' + e.message; }
    }
    if (!lastP || Math.hypot(p.x - lastP.x, p.z - lastP.z) > 12 || now - lastBuild > 4000) { lastBuild = now; rebuild(); }
  }
  addEventListener('keydown', function (e) { if (e.code === 'F9') { e.preventDefault(); toggle(); } });
  var iv = setInterval(function () {
    if (!ready()) return; clearInterval(iv);
    var prev = updEnv; window.updEnv = updEnv = function (dt, t) { prev(dt, t); try { frame(); } catch (e) { console.error('[MG_DEBUG]', e); toggle(false); } };
    if (/[?&]debug=1/.test(location.search)) toggle(true);
  }, 300);
  window.MG_DEBUG = { toggle: toggle, scan: function (r) { if (r !== undefined) radius = r; if (!hud) mkHud(); startScan(); }, state: function () { return { job: job ? job.stage : null, suspects: suspects.length, holes: holes.slice(), radius: radius }; }, report: report };
})();
