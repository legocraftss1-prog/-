/* =====================================================================
   МГИАГ 1.14 — ULTRA: большая кнопка огня для телефона и зум колёсиком.
   Кнопка огня не заводит новую стрельбу: она нажимает штатную кнопку 💥,
   поэтому работает всё прежнее оружие, техника и бой с боссом.
   ===================================================================== */
(function () {
  'use strict';
  var U = window.MG_ULTRA; if (!U) return;
  var C = { zoom: U.opt.zoom, cur: U.opt.zoom, wheelOn: false, fireOn: false, btn: null, pid: null, lx: 0, ly: 0, moved: 0, saveT: 0, hooked: false, wheelBound: false };
  function clamp_(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function overlay() { try { if (window.MG_MOUSE && MG_MOUSE.overlayOpen) return MG_MOUSE.overlayOpen(); } catch (e) { } return false; }
  function touch() { try { return typeof IS_TOUCH !== 'undefined' ? !!IS_TOUCH : (('ontouchstart' in window) || !!(window.matchMedia && matchMedia('(pointer:coarse)').matches)); } catch (e) { return false; } }

  /* ---------- зум колёсиком ---------- */
  function onWheel(e) {
    if (!C.wheelOn || !U.active) return;
    if (typeof started === 'undefined' || !started || overlay()) return;
    e.preventDefault();
    var dy = e.deltaY * (e.deltaMode === 1 ? 33 : e.deltaMode === 2 ? 400 : 1);
    C.zoom = clamp_(C.zoom * Math.exp(clamp_(dy, -240, 240) * .0011), .55, 2.2); C.saveT = .8;
  }
  function hookCam() {
    if (C.hooked || typeof updCamera !== 'function') return;
    var oc = updCamera;
    var w = function (dt) {
      if (!C.wheelOn || !U.active) return oc(dt);
      C.cur += (C.zoom - C.cur) * Math.min(1, (dt || .016) * 9);
      var m = C.cur; if (Math.abs(m - 1) < .002) return oc(dt);
      var base = window.CAMMUL; window.CAMMUL = (base || 1) * m;
      try { return oc(dt); } finally { window.CAMMUL = base; }
    };
    w.__mgGfx = oc.__mgGfx; w.__mgUltra = true; window.updCamera = updCamera = w; C.hooked = true;
  }
  C.setZoom = function (v) { C.zoom = clamp_(+v || 1, .55, 2.2); };

  /* ---------- большая кнопка огня ---------- */
  function fwd(type, e) {
    var f = document.getElementById('bFire'); if (!f || document.body.classList.contains('mg-edit')) return;
    var ev;
    try { ev = new PointerEvent(type, { bubbles: false, cancelable: true, pointerId: e ? e.pointerId : 1, pointerType: 'touch', clientX: e ? e.clientX : 0, clientY: e ? e.clientY : 0, isPrimary: true }); }
    catch (er) { ev = document.createEvent('Event'); ev.initEvent(type, false, true); }
    f.dispatchEvent(ev);
  }
  function mkBtn() {
    if (C.btn) return;
    var css = document.createElement('style');
    css.textContent = [
      '#mgFireBig{position:fixed;z-index:6;--s:1;width:calc(84px*var(--s));height:calc(84px*var(--s));border-radius:50%;border:3px solid #fff;padding:0;',
      ' background:radial-gradient(circle at 35% 30%,#ff9a78,#d8261c);color:#fff;font-size:calc(38px*var(--s));display:none;place-items:center;',
      ' box-shadow:0 6px 0 rgba(0,0,0,.4),0 0 0 6px rgba(232,71,59,.22);touch-action:none;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent;',
      ' right:calc(env(safe-area-inset-right,0px) + 22px);bottom:calc(env(safe-area-inset-bottom,0px) + 262px)}',
      '#mgFireBig.on{display:grid}',
      '#mgFireBig.dn{transform:translateY(4px) scale(.96);box-shadow:0 2px 0 rgba(0,0,0,.4),0 0 0 10px rgba(232,71,59,.32)}',
      '@media (orientation:landscape){#mgFireBig{right:calc(env(safe-area-inset-right,0px) + 268px);bottom:calc(env(safe-area-inset-bottom,0px) + 20px)}}',
      'body.mg-ufire #bFire{visibility:hidden!important;pointer-events:none!important}',
      'body.mg-nohud #mgFireBig{display:none!important}'
    ].join('\n');
    document.head.appendChild(css);
    var b = document.createElement('button'); b.id = 'mgFireBig'; b.type = 'button'; b.setAttribute('aria-label', 'Огонь'); b.textContent = '💥';
    function up(e) { if (C.pid === null || (e && e.pointerId !== C.pid)) return; C.pid = null; b.classList.remove('dn'); fwd('pointerup', e); }
    b.addEventListener('pointerdown', function (e) {
      e.preventDefault(); e.stopPropagation();
      C.pid = e.pointerId; C.lx = e.clientX; C.ly = e.clientY; C.moved = 0;
      try { b.setPointerCapture(e.pointerId); } catch (er) { }
      b.classList.add('dn'); fwd('pointerdown', e);
    });
    b.addEventListener('pointermove', function (e) {
      if (e.pointerId !== C.pid) return; e.preventDefault();
      var dx = e.clientX - C.lx, dy = e.clientY - C.ly; C.lx = e.clientX; C.ly = e.clientY; C.moved += Math.abs(dx) + Math.abs(dy);
      if (C.moved < 10) return; // короткое нажатие не двигает камеру
      try { if (typeof cam !== 'undefined' && !cam.force) { var s = window.MG_SENS || 1; cam.yaw -= dx * .0065 * s; cam.pitch = clamp_(cam.pitch + dy * .0045 * s, .04, 1.2); cam.drag = 1.2; } } catch (er) { }
    });
    b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up); b.addEventListener('lostpointercapture', up);
    b.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    document.body.appendChild(b); C.btn = b;
  }
  function fireVis() {
    var f = document.getElementById('bFire'), b = C.btn; if (!b) return;
    var show = C.fireOn && !!f && !f.classList.contains('hidden') && f.offsetParent !== null && !document.body.classList.contains('mg-edit');
    if (show !== C.shown) {
      C.shown = show; b.classList.toggle('on', show); document.body.classList.toggle('mg-ufire', show);
      if (!show && C.pid !== null) { C.pid = null; b.classList.remove('dn'); fwd('pointerup', null); }
    }
  }

  function sync() {
    var O = U.opt;
    hookCam();
    C.wheelOn = !!O.wheel; if (!C.wheelOn) C.cur = 1;
    if (C.wheelOn && !C.wheelBound) { var cv = document.getElementById('c'); if (cv) { cv.addEventListener('wheel', onWheel, { passive: false }); C.wheelBound = true; } }
    C.fireOn = !!O.fire && touch();
    if (C.fireOn) { mkBtn(); C.btn.style.setProperty('--s', String(O.fireSize)); }
    fireVis();
  }
  function off() { C.wheelOn = false; C.fireOn = false; fireVis(); }
  function frame(dt) {
    fireVis();
    if (C.saveT > 0) { C.saveT -= dt; if (C.saveT <= 0) { U.opt.zoom = +C.zoom.toFixed(3); U.save(); } }
  }
  U.reg('controls', { title: 'Управление', sync: sync, off: off, frame: frame, setZoom: C.setZoom, _C: C });
})();
