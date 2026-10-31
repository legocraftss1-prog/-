/* МГИАГ 1.11 — ИНСТРУМЕНТ ПОИСКА НЕВИДИМЫХ СТЕН И ДЫР НА КАРТЕ
   Включить: клавиша F9 (ПК), либо в игре написать в адресе ?debug=1, либо кнопка «🧱» (появляется при ?debug=1).
   Показывает рамки коллайдеров рядом с тобой и твои координаты. Кнопка «Проверить» ищет коллайдеры без видимой
   поверхности (вероятные невидимые стены) и копирует список координат — пришли его разработчику. Игру не меняет. */
(function () {
  'use strict';
  var on = false, grp = null, hud = null, info = null, suspects = [];
  function ready() { return typeof worldReady !== 'undefined' && worldReady && typeof cols !== 'undefined' && typeof scene !== 'undefined' && typeof player !== 'undefined'; }
  function mkHud() {
    hud = document.createElement('div');
    hud.style.cssText = 'position:fixed;left:8px;top:calc(env(safe-area-inset-top,0px) + 8px);z-index:70;background:rgba(0,0,0,.72);color:#9dff9d;font:12px monospace;padding:6px 8px;border-radius:8px;display:none;max-width:70vw';
    info = document.createElement('div'); hud.appendChild(info);
    var b = document.createElement('button'); b.textContent = '🔎 Проверить рядом'; b.style.cssText = 'margin:4px 4px 0 0;padding:6px 8px;border-radius:6px;border:0;font:700 12px sans-serif';
    b.onclick = scan; hud.appendChild(b);
    var c = document.createElement('button'); c.textContent = '📋 Координаты'; c.style.cssText = b.style.cssText; c.onclick = function () { var p = player.pos, t = 'x=' + p.x.toFixed(1) + ' y=' + p.y.toFixed(1) + ' z=' + p.z.toFixed(1); copy(t); if (typeof toast === 'function') toast('Скопировано: ' + t, 2500); }; hud.appendChild(c);
    var x = document.createElement('button'); x.textContent = '✕'; x.style.cssText = b.style.cssText; x.onclick = function () { toggle(false); }; hud.appendChild(x);
    document.body.appendChild(hud);
  }
  function copy(t) { try { navigator.clipboard.writeText(t); } catch (e) { } window.MG_DEBUG_LAST = t; }
  function toggle(v) {
    if (!ready()) return; on = v === undefined ? !on : v; if (!hud) mkHud(); hud.style.display = on ? 'block' : 'none';
    if (!on && grp) { scene.remove(grp); grp = null; }
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
    scene.add(grp); lastP = { x: p.x, z: p.z };
  }
  function scan() {
    var p = player.pos, rc = new THREE.Raycaster(), targets = []; suspects = [];
    cityG.traverse(function (o) { if (o.isMesh && o.visible && !(o.userData && (o.userData.isLake || o.userData.noShadow))) targets.push(o); });
    var list = cols.filter(function (c) { return c.on !== false && c.x1 > p.x - 40 && c.x0 < p.x + 40 && c.z1 > p.z - 40 && c.z0 < p.z + 40 && (c.x1 - c.x0) < 200 && (c.z1 - c.z0) < 200; });
    list.forEach(function (c) {
      var cx = (c.x0 + c.x1) / 2, cz = (c.z0 + c.z1) / 2, y = H(cx, cz) + 1.0, seen = false, M = 1.2;
      var dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
      for (var i = 0; i < 4 && !seen; i++) {
        var dx = dirs[i][0], dz = dirs[i][1], ox = cx - dx * ((dx ? (c.x1 - c.x0) : (c.z1 - c.z0)) / 2 + M * 2), oz = cz - dz * ((dx ? (c.x1 - c.x0) : (c.z1 - c.z0)) / 2 + M * 2);
        if (dz) { ox = cx; oz = cz - dz * ((c.z1 - c.z0) / 2 + M * 2); } if (dx) { oz = cz; ox = cx - dx * ((c.x1 - c.x0) / 2 + M * 2); }
        for (var hy = 0; hy < 2 && !seen; hy++) { rc.set(new THREE.Vector3(ox, y + hy * 1.2, oz), new THREE.Vector3(dx, 0, dz)); rc.far = (dx ? (c.x1 - c.x0) : (c.z1 - c.z0)) + M * 4 + 1; var hit = rc.intersectObjects(targets, false); if (hit.length) seen = true; }
      }
      if (!seen) suspects.push(c);
    });
    var txt = suspects.length ? suspects.map(function (c) { return 'x[' + c.x0.toFixed(1) + '..' + c.x1.toFixed(1) + '] z[' + c.z0.toFixed(1) + '..' + c.z1.toFixed(1) + '] h=' + (c.h !== undefined ? c.h.toFixed(1) : 'авто'); }).join('\n') : 'подозрительных коллайдеров рядом нет';
    copy(txt); if (typeof toast === 'function') toast('Найдено подозрительных: ' + suspects.length + ' (красные). Список скопирован.', 4000); rebuild();
  }
  function frame() {
    if (!on) return; var p = player.pos, now = performance.now();
    info.textContent = 'x ' + p.x.toFixed(1) + '  y ' + p.y.toFixed(1) + '  z ' + p.z.toFixed(1) + '   коллайдеров: ' + cols.length + '  подозр.: ' + suspects.length;
    if (!lastP || Math.hypot(p.x - lastP.x, p.z - lastP.z) > 12 || now - lastBuild > 4000) { lastBuild = now; rebuild(); }
  }
  addEventListener('keydown', function (e) { if (e.code === 'F9') { e.preventDefault(); toggle(); } });
  var iv = setInterval(function () {
    if (!ready()) return; clearInterval(iv);
    var prev = updEnv; window.updEnv = updEnv = function (dt, t) { prev(dt, t); try { frame(); } catch (e) { console.error('[MG_DEBUG]', e); toggle(false); } };
    if (/[?&]debug=1/.test(location.search)) toggle(true);
  }, 300);
  window.MG_DEBUG = { toggle: toggle, scan: scan };
})();
