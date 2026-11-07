/* =====================================================================
   МГИАГ 1.13 — УПРАВЛЕНИЕ КАМЕРОЙ МЫШЬЮ (Pointer Lock)
   Кнопка 🖱️ (или клавиша M): курсор фиксируется в центре и скрывается, камера
   поворачивается при движении мыши без нажатия кнопок. Повторное нажатие — выключает.
   При диалогах, меню, телефоне, мини-играх и настройках режим приостанавливается
   (курсор возвращается), а после закрытия возобновляется одним кликом по экрану.
   Esc (системный выход из захвата) выключает режим.
   ===================================================================== */
(function () {
  'use strict';
  var M = window.MG_MOUSE = { on: false, locked: false, paused: false, skip: 0, enabled: false };
  var pausing = false, btn = null, dot = null, hint = null;
  function cv() { return document.getElementById('c'); }
  function fine() { try { return !!(window.matchMedia && matchMedia('(pointer:fine)').matches); } catch (e) { return true; } }
  function sens() { return window.MG_SENS || 1; }
  function toast_(t, ms) { if (typeof toast === 'function') toast(t, ms || 2200); }
  function overlayOpen() {
    try {
      if (typeof dlg !== 'undefined' && dlg.open) return true;
      if (typeof modalOpen !== 'undefined' && modalOpen) return true;
      if (typeof phoneOpen !== 'undefined' && phoneOpen) return true;
      if (typeof passOpen !== 'undefined' && passOpen) return true;
      if (typeof TM !== 'undefined' && TM.on) return true;
    } catch (e) { }
    var ids = ['mgset', 'mgsrv'];
    for (var i = 0; i < ids.length; i++) { var e = document.getElementById(ids[i]); if (e && e.classList.contains('on')) return true; }
    if (document.body.classList.contains('mg-edit')) return true;
    var t = document.getElementById('title'); if (t && getComputedStyle(t).display !== 'none' && t.offsetParent !== null && !(typeof started !== 'undefined' && started)) return true;
    return false;
  }
  M.overlayOpen = overlayOpen;
  function ui() {
    if (btn) return;
    var top = document.getElementById('topBtns');
    if (top) {
      btn = document.createElement('button'); btn.className = 'sq'; btn.id = 'bMouse'; btn.setAttribute('aria-label', 'Управление камерой мышью'); btn.title = 'Камера мышью (M)';
      btn.innerHTML = '🖱️<small style="position:absolute;bottom:2px;right:3px;font:800 9px sans-serif;letter-spacing:.3px">OFF</small>'; btn.style.position = 'relative';
      btn.onclick = function (e) { e.preventDefault(); M.toggle(); };
      top.appendChild(btn);
    }
    dot = document.createElement('div'); dot.id = 'mg-dot'; dot.style.cssText = 'position:fixed;left:50%;top:50%;width:6px;height:6px;margin:-3px 0 0 -3px;border-radius:50%;background:rgba(255,255,255,.85);box-shadow:0 0 0 1.5px rgba(0,0,0,.55);z-index:5;pointer-events:none;display:none';
    document.body.appendChild(dot);
    hint = document.createElement('div'); hint.style.cssText = 'position:fixed;left:50%;bottom:calc(env(safe-area-inset-bottom,0px) + 90px);transform:translateX(-50%);z-index:9;background:rgba(15,20,30,.9);color:#fff;border:1px solid rgba(255,255,255,.3);border-radius:12px;padding:8px 14px;font:700 14px system-ui,sans-serif;display:none;pointer-events:none';
    hint.textContent = '🖱️ Кликни по экрану — мышь вернётся в игру'; document.body.appendChild(hint);
    var css = document.createElement('style');
    css.textContent = '#bMouse.on{background:linear-gradient(180deg,#46d27a,#1f9a52)!important;outline:3px solid #b6ffd0;box-shadow:0 0 14px rgba(70,210,122,.8)!important}#bMouse.pz{background:linear-gradient(180deg,#e8c04a,#b8901a)!important;outline:3px dashed #fff0b0}body.mg-mouse-on #c{cursor:none}';
    document.head.appendChild(css);
  }
  function paint() {
    ui(); if (!btn) return;
    btn.classList.toggle('on', M.on && M.locked); btn.classList.toggle('pz', M.on && !M.locked);
    var sm = btn.querySelector('small'); if (sm) sm.textContent = M.on ? (M.locked ? 'ON' : '⏸') : 'OFF';
    if (dot) dot.style.display = (M.on && M.locked) ? 'block' : 'none';
    if (hint) hint.style.display = (M.on && M.paused && !overlayOpen()) ? 'block' : 'none';
    document.body.classList.toggle('mg-mouse-on', M.on && M.locked);
  }
  function lock() { var c = cv(); if (!c || !c.requestPointerLock) { toast_('Захват мыши не поддерживается этим браузером.'); M.on = false; paint(); return false; } try { var r = c.requestPointerLock(); if (r && r.catch) r.catch(function () { M.on = false; M.paused = false; paint(); toast_('Не удалось включить мышь. Нажми кнопку ещё раз.'); }); } catch (e) { M.on = false; paint(); return false; } return true; }
  function unlock() { pausing = true; try { if (document.pointerLockElement) document.exitPointerLock(); } catch (e) { } setTimeout(function () { pausing = false; }, 60); }
  M.toggle = function () {
    ui();
    if (!fine()) { toast_('Режим мыши работает на устройствах с мышью.'); return; }
    if (M.on) { M.on = false; M.paused = false; unlock(); paint(); toast_('🖱️ Камера мышью выключена', 1500); return; }
    if (overlayOpen()) { toast_('Закрой меню или диалог, затем включи мышь.', 1800); return; }
    M.on = true; M.paused = false; M.skip = 3; lock(); paint(); toast_('🖱️ Камера мышью включена. Esc или кнопка 🖱️ — выключить.', 2600);
  };
  document.addEventListener('pointerlockchange', function () {
    var c = cv(), now = document.pointerLockElement === c;
    if (now) { M.locked = true; M.skip = 3; M.paused = false; }
    else { var was = M.locked; M.locked = false; if (M.on && !pausing && was) { M.on = false; M.paused = false; toast_('🖱️ Камера мышью выключена', 1400); } }
    paint();
  });
  document.addEventListener('pointerlockerror', function () { if (M.on) { M.on = false; M.paused = false; paint(); toast_('Не удалось включить мышь. Нажми кнопку ещё раз.'); } });
  document.addEventListener('mousemove', function (e) {
    if (!M.on || !M.locked || typeof cam === 'undefined') return;
    if (M.skip > 0) { M.skip--; return; }
    var dx = e.movementX || 0, dy = e.movementY || 0;
    if (Math.abs(dx) > 220 || Math.abs(dy) > 220) return; // защита от скачка после захвата
    if (overlayOpen()) return;
    var s = sens();
    if (cam.force) { cam.fOff = (cam.fOff || 0) - dx * .0065 * s; cam.fpOff = Math.max(-.5, Math.min(.9, (cam.fpOff || 0) + dy * .0045 * s)); }
    else { cam.yaw -= dx * .0065 * s; cam.pitch = Math.max(.04, Math.min(1.2, cam.pitch + dy * .0045 * s)); }
    cam.drag = 1.8;
  }, true);
  // пауза/возобновление при меню и диалогах
  setInterval(function () {
    if (!M.on) return;
    var need = overlayOpen();
    if (M.locked && need) { M.paused = true; unlock(); paint(); }
    else if (!M.locked && !M.paused && !need && !pausing) { paint(); }
    else if (M.paused) paint();
  }, 120);
  addEventListener('pointerdown', function (e) {
    if (M.on && M.paused && !M.locked && !overlayOpen()) { var t = e.target; if (t && t.closest && t.closest('button,input,select,textarea,#mgset,#mgsrv')) return; M.paused = false; M.skip = 3; lock(); paint(); }
  }, true);
  document.addEventListener('visibilitychange', function () { if (document.hidden && M.on && M.locked) { M.paused = true; unlock(); paint(); } });
  function init() { ui(); if (!fine() && btn) btn.style.display = 'none'; paint(); }
  var iv = setInterval(function () { if (document.getElementById('topBtns')) { init(); clearInterval(iv); } }, 250);
})();
