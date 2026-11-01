/* =====================================================================
   МГИАГ 1.12 «Карта и удобство» — НАСТРОЙКИ, УПРАВЛЕНИЕ, КАМЕРА
   • Единое меню настроек: из главного меню и прямо во время игры.
   • Графика: яркость, гамма, контраст, насыщенность, дальность, текстуры,
     сглаживание, лимит FPS, разрешение + все настройки 1.11 (через MG_GFX).
   • Управление: переназначение клавиш, расположение и размер экранных кнопок.
   • Камера: чувствительность, вид от 1-го/3-го лица.
   • Читаемость интерфейса в улучшенной графике (автоконтраст).
   Каждая настройка реально влияет на игру и сохраняется между запусками.
   ===================================================================== */
(function () {
  'use strict';
  var SKEY = 'mg_set2';
  var DEF = { sens: 1, fp: false, keys: {}, ui: {}, uiScale: 1 };
  var ST = JSON.parse(JSON.stringify(DEF));
  try { var raw = JSON.parse(localStorage.getItem(SKEY) || 'null'); if (raw) { ST.sens = clamp(raw.sens, .3, 2.5, 1); ST.fp = !!raw.fp; ST.keys = raw.keys && typeof raw.keys === 'object' ? raw.keys : {}; ST.ui = raw.ui && typeof raw.ui === 'object' ? raw.ui : {}; ST.uiScale = clamp(raw.uiScale, .7, 1.6, 1); } } catch (e) { }
  function clamp(v, a, b, d) { v = +v; return isFinite(v) ? Math.min(b, Math.max(a, v)) : d; }
  function save() { try { localStorage.setItem(SKEY, JSON.stringify(ST)); } catch (e) { } }
  window.MG_SENS = ST.sens;
  var SET = window.MG_SET = { st: ST };
  var $q = function (s, r) { return (r || document).querySelector(s); };
  function el(tag, css, html) { var e = document.createElement(tag); if (css) e.style.cssText = css; if (html !== undefined) e.innerHTML = html; return e; }
  function gameReady() { return typeof worldReady !== 'undefined' && worldReady && typeof player !== 'undefined'; }
  function say_(t, ms) { if (typeof toast === 'function') toast(t, ms || 2200); }
  var GFX = function () { return window.MG_GFX; };

  /* ============================================================
     1. ПЕРЕНАЗНАЧЕНИЕ КЛАВИШ
     Игра читает e.code в десятке мест. Чтобы не переписывать их все, подменяем
     событие на входе: нажатие новой клавиши превращается в «родное» событие игры,
     а прежняя клавиша действия отключается.
     ============================================================ */
  var ACTIONS = [
    ['fwd', 'Вперёд', 'KeyW'], ['back', 'Назад', 'KeyS'], ['left', 'Влево', 'KeyA'], ['right', 'Вправо', 'KeyD'],
    ['run', 'Бег', 'ShiftLeft'], ['jump', 'Прыжок', 'Space'], ['act', 'Действие / диалог', 'KeyE'],
    ['phone', 'Телефон', 'KeyP'], ['todo', 'Список дел', 'Tab'], ['inv', 'Инвентарь', 'KeyI'],
    ['skate', 'Скейт', 'KeyF'], ['fire', 'Огонь', 'KeyQ'], ['weapon', 'Сменить оружие', 'KeyZ'],
    ['trick', 'Трюки', 'KeyT'], ['horn', 'Сигнал', 'KeyH'], ['boost', 'Ускоритель', 'KeyR'],
    ['view', 'Вид 1-го / 3-го лица', 'KeyV'], ['settings', 'Открыть настройки', 'F10']
  ];
  SET.ACTIONS = ACTIONS;
  function codeOf(id) { var a = ACTIONS.filter(function (x) { return x[0] === id; })[0]; return ST.keys[id] || (a && a[2]); }
  function defOf(id) { return ACTIONS.filter(function (x) { return x[0] === id; })[0][2]; }
  var NEWACT = { view: 1, settings: 1 };
  var capturing = null; // id действия, которому сейчас назначается клавиша
  function tables() {
    var to = {}, off = {}; // to[пользовательская] = родная; off[родная] = true (отключена)
    ACTIONS.forEach(function (a) { if (NEWACT[a[0]]) return; var u = ST.keys[a[0]]; if (u && u !== a[2]) { to[u] = a[2]; off[a[2]] = true; } });
    // если родная клавиша одного действия назначена другому действию — она снова «живая»
    for (var k in to) delete off[k];
    return { to: to, off: off };
  }
  var TB = tables(); SET.remapTable = function () { return TB; };
  function isTyping(t) { return t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable); }
  function onKey(e) {
    if (e.__mg) return;
    if (capturing) { // режим «нажми клавишу»
      if (e.type === 'keydown') {
        e.preventDefault(); e.stopImmediatePropagation();
        if (e.code === 'Escape') { capturing = null; renderPanel(); return; }
        assignKey(capturing, e.code); capturing = null; renderPanel();
      } else { e.stopImmediatePropagation(); }
      return;
    }
    if (isTyping(e.target)) return;
    // действия самого модуля
    if (e.type === 'keydown' && !e.repeat) {
      if (e.code === codeOf('view')) { e.preventDefault(); e.stopImmediatePropagation(); toggleFP(); return; }
      if (e.code === codeOf('settings')) { e.preventDefault(); e.stopImmediatePropagation(); togglePanel(); return; }
    }
    if (e.code === codeOf('view') || e.code === codeOf('settings')) { e.stopImmediatePropagation(); return; }
    var to = TB.to[e.code];
    if (to) { // новая клавиша → родное событие игры
      e.stopImmediatePropagation(); e.preventDefault();
      var ev = new KeyboardEvent(e.type, { code: to, key: keyName(to), bubbles: true, cancelable: true, repeat: e.repeat, shiftKey: e.shiftKey });
      ev.__mg = true; window.dispatchEvent(ev); return;
    }
    if (TB.off[e.code]) { e.stopImmediatePropagation(); }
  }
  function keyName(code) { if (/^Key/.test(code)) return code.slice(3).toLowerCase(); if (code === 'Space') return ' '; if (/^Shift/.test(code)) return 'Shift'; return code; }
  addEventListener('keydown', onKey, true); addEventListener('keyup', onKey, true);
  function setCode(id, code) { if (code === defOf(id)) delete ST.keys[id]; else ST.keys[id] = code; }
  function assignKey(id, code) {
    var old = codeOf(id);
    // если клавишу уже занимает другое действие — меняемся местами (ничего не остаётся без клавиши)
    ACTIONS.forEach(function (a) { if (a[0] !== id && codeOf(a[0]) === code) setCode(a[0], old); });
    setCode(id, code); save(); TB = tables(); SET.remapTable = function () { return TB; };
  }
  SET.assignKey = assignKey;
  SET.resetKeys = function () { ST.keys = {}; save(); TB = tables(); };

  /* ============================================================
     2. ЭКРАННЫЕ КНОПКИ: размер и расположение
     Используются CSS-свойства translate и scale (не transform), чтобы не ломать
     анимации нажатия, которые игра делает через transform.
     ============================================================ */
  var BTN_IDS = ['bAct', 'bRun', 'bSkate', 'bPush', 'bJump', 'bTrick', 'bFire', 'bWeap', 'bExit', 'bHorn', 'bFly', 'bBoost', 'bLand', 'bRocket', 'bTodo', 'bInv', 'bPhone', 'bSwitch', 'bView', 'bSet'];
  var BTN_NAMES = { bAct: '✋ Действие', bRun: '🏃 Бег', bSkate: '🛹 Скейт', bPush: '👟 Толчок', bJump: '⤴️ Прыжок', bTrick: '🎯 Трюк', bFire: '💥 Огонь', bWeap: '🔫 Оружие', bExit: '🚪 Выход', bHorn: '📯 Сигнал', bFly: '🪽 Полёт', bBoost: '🔥 Ускорение', bLand: '🛬 Посадка', bRocket: '🚀 Ракета', bTodo: '📋 Дела', bInv: '🎒 Инвентарь', bPhone: '📱 Телефон', bSwitch: '🔄 Смена', bView: '👁 Вид', bSet: '⚙️ Настройки' };
  function applyUI() {
    BTN_IDS.forEach(function (id) {
      var b = document.getElementById(id); if (!b) return;
      var o = ST.ui[id], s = ST.uiScale * ((o && o.s) || 1), dx = o ? (o.dx || 0) * innerWidth : 0, dy = o ? (o.dy || 0) * innerHeight : 0;
      b.style.translate = (dx || dy) ? dx.toFixed(1) + 'px ' + dy.toFixed(1) + 'px' : '';
      b.style.scale = Math.abs(s - 1) > .005 ? String(s) : '';
    });
    var jb = document.getElementById('joyBase'); if (jb) jb.style.scale = Math.abs(ST.uiScale - 1) > .005 ? String(ST.uiScale) : '';
  }
  SET.applyUI = applyUI;
  addEventListener('resize', applyUI);

  var edit = { on: false, sel: null, bar: null };
  function startEdit() {
    if (!gameReady() || typeof started === 'undefined' || !started) { say_('Расположение кнопок можно менять во время игры.', 2600); return; }
    closePanel(); edit.on = true; document.body.classList.add('mg-edit');
    if (!edit.bar) {
      var bar = el('div', 'position:fixed;left:50%;top:calc(env(safe-area-inset-top,0px) + 8px);transform:translateX(-50%);z-index:90;background:rgba(10,14,24,.92);color:#fff;border:1px solid rgba(255,255,255,.25);border-radius:14px;padding:8px 12px;font:700 13px system-ui,sans-serif;text-align:center;max-width:94vw');
      bar.innerHTML = '<div id="mge-t" style="margin-bottom:6px">Перетаскивай кнопки. Нажми на кнопку, чтобы выбрать и изменить размер.</div><div style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap;align-items:center"><button id="mge-m" style="padding:7px 12px;border-radius:9px;border:0;font-weight:800">➖</button><span id="mge-s" style="min-width:90px"></span><button id="mge-p" style="padding:7px 12px;border-radius:9px;border:0;font-weight:800">➕</button><button id="mge-r" style="padding:7px 12px;border-radius:9px;border:0;font-weight:800;background:#e8473b;color:#fff">Сбросить раскладку</button><button id="mge-d" style="padding:7px 14px;border-radius:9px;border:0;font-weight:900;background:#ff8a2a">Готово</button></div>';
      document.body.appendChild(bar); edit.bar = bar;
      $q('#mge-d', bar).onclick = stopEdit;
      $q('#mge-r', bar).onclick = function () { ST.ui = {}; save(); applyUI(); selUpd(); say_('Раскладка сброшена'); };
      $q('#mge-m', bar).onclick = function () { bump(-.1); }; $q('#mge-p', bar).onclick = function () { bump(.1); };
    }
    edit.bar.style.display = 'block'; edit.sel = null; selUpd();
  }
  function bump(d) { if (!edit.sel) { say_('Сначала нажми на кнопку', 1500); return; } var o = ST.ui[edit.sel] || (ST.ui[edit.sel] = {}); o.s = Math.min(2, Math.max(.5, +(((o.s || 1) + d).toFixed(2)))); save(); applyUI(); selUpd(); }
  function selUpd() {
    BTN_IDS.forEach(function (id) { var b = document.getElementById(id); if (b) b.style.outline = (edit.on && id === edit.sel) ? '3px solid #ffcf4a' : (edit.on ? '2px dashed rgba(255,255,255,.6)' : ''); });
    var s = $q('#mge-s'); if (s) s.textContent = edit.sel ? (BTN_NAMES[edit.sel] + ' · ' + Math.round((ST.ui[edit.sel] && ST.ui[edit.sel].s || 1) * 100) + '%') : 'кнопка не выбрана';
  }
  function stopEdit() { edit.on = false; edit.sel = null; document.body.classList.remove('mg-edit'); if (edit.bar) edit.bar.style.display = 'none'; selUpd(); applyUI(); save(); }
  var drag = null;
  addEventListener('pointerdown', function (e) {
    if (!edit.on) return;
    var b = e.target.closest && e.target.closest('button'); if (!b || BTN_IDS.indexOf(b.id) < 0) { return; }
    e.preventDefault(); e.stopImmediatePropagation();
    edit.sel = b.id; selUpd(); var o = ST.ui[b.id] || { dx: 0, dy: 0 };
    drag = { id: b.id, x: e.clientX, y: e.clientY, dx: (o.dx || 0) * innerWidth, dy: (o.dy || 0) * innerHeight, pid: e.pointerId };
  }, true);
  addEventListener('pointermove', function (e) {
    if (!edit.on || !drag || e.pointerId !== drag.pid) return; e.preventDefault(); e.stopImmediatePropagation();
    var o = ST.ui[drag.id] || (ST.ui[drag.id] = {}); o.dx = (drag.dx + e.clientX - drag.x) / innerWidth; o.dy = (drag.dy + e.clientY - drag.y) / innerHeight; applyUI();
  }, true);
  addEventListener('pointerup', function (e) { if (drag && e.pointerId === drag.pid) { drag = null; save(); } }, true);
  ['click'].forEach(function (t) { addEventListener(t, function (e) { if (edit.on && e.target.closest && e.target.closest('button') && BTN_IDS.indexOf(e.target.closest('button').id) >= 0) { e.preventDefault(); e.stopImmediatePropagation(); } }, true); });
  SET.startEdit = startEdit; SET.stopEdit = stopEdit; SET.state = function () { return edit; };
  SET.setUIScale = function (v) { ST.uiScale = clamp(v, .7, 1.6, 1); save(); applyUI(); };
  SET.resetLayout = function () { ST.ui = {}; ST.uiScale = 1; save(); applyUI(); };

  /* ============================================================
     3. КАМЕРА: чувствительность и вид от первого лица
     ============================================================ */
  SET.setSens = function (v) { ST.sens = clamp(v, .3, 2.5, 1); window.MG_SENS = ST.sens; save(); };
  var fpT = 0, hid = false, prevPitch = null, prevNear = null;
  function toggleFP(v) {
    if (!gameReady()) return; ST.fp = v === undefined ? !ST.fp : !!v; save();
    if (ST.fp) { prevPitch = cam.pitch; cam.pitch = .62; } else if (prevPitch !== null) { cam.pitch = prevPitch; }
    say_(ST.fp ? '👁 Вид от первого лица' : '🎥 Вид от третьего лица', 1500); updViewBtn();
  }
  SET.toggleFP = toggleFP;
  function updViewBtn() { var b = document.getElementById('bView'); if (b) b.textContent = ST.fp ? '🎥' : '👁'; }
  var V3 = null;
  function fpCamera(dt) {
    if (!V3) V3 = { head: new THREE.Vector3(), dir: new THREE.Vector3(), tmp: new THREE.Vector3() };
    var want = ST.fp ? 1 : 0;
    if (cam.fixed || (typeof area !== 'undefined' && false)) { want = 0; }
    fpT += Math.sign(want - fpT) * Math.min(Math.abs(want - fpT), dt * 4.5);
    var showModel = fpT < .85;
    if (!showModel && player.g.visible && !hid) { player.g.visible = false; hid = true; }
    if (showModel && hid) { player.g.visible = true; hid = false; }
    if (fpT <= .001) { if (prevNear !== null) { camera.near = prevNear; camera.updateProjectionMatrix(); prevNear = null; } return; }
    var P = player.drive ? player.drive.pos : player.pos, yawD = player.drive ? player.drive.yaw : player.yaw;
    var h = V3.head;
    if (player.drive) h.set(P.x + Math.sin(yawD) * .15, P.y + 1.38, P.z + Math.cos(yawD) * .15);
    else h.set(P.x, player.g.position.y + 1.62, P.z);
    var yaw = cam.yaw, ang = (cam.pitch - .62) * 2;
    var view = V3.dir.set(-Math.sin(yaw) * Math.cos(ang), -Math.sin(ang), -Math.cos(yaw) * Math.cos(ang)).normalize();
    // не даём камере оказаться внутри стены: короткий луч вперёд от головы
    var back = 0;
    try { rc.set(h, view); rc.far = .5; var hit = rc.intersectObjects(camBlock[area] || [], false); if (hit.length && hit[0].distance < .32) back = .32 - hit[0].distance; } catch (e) { }
    var e = fpT * fpT * (3 - 2 * fpT);
    var od = V3.tmp; camera.getWorldDirection(od);
    camera.position.lerp(h.addScaledVector(view, -back), e);
    var nd = od.lerp(view, e).normalize();
    camera.lookAt(camera.position.x + nd.x, camera.position.y + nd.y, camera.position.z + nd.z);
    if (prevNear === null) prevNear = camera.near; if (camera.near > .07) { camera.near = .06; camera.updateProjectionMatrix(); }
  }
  SET.fpState = function () { return { fpT: fpT, hid: hid }; };

  /* ============================================================
     4. ЧИТАЕМОСТЬ ИНТЕРФЕЙСА (улучшенная графика): тёмные панели — белый текст
     Автоконтраст: для каждого текстового элемента считаем реальный фон и,
     если контраст ниже 4.5:1, ставим белый или тёмный текст.
     ============================================================ */
  function parseRGBA(s) { var m = /rgba?\(([^)]+)\)/.exec(s); if (!m) return null; var p = m[1].split(/[ ,\/]+/).filter(Boolean).map(parseFloat); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; }
  function lum(c) { function f(v) { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); } return .2126 * f(c.r) + .7152 * f(c.g) + .0722 * f(c.b); }
  function contrastR(a, b) { var l1 = lum(a), l2 = lum(b), hi = Math.max(l1, l2), lo = Math.min(l1, l2); return (hi + .05) / (lo + .05); }
  function effBg(node) {
    var layers = [], n = node;
    while (n && n.nodeType === 1) {
      var cs = getComputedStyle(n), c = parseRGBA(cs.backgroundColor);
      if (c && c.a > 0) { layers.push(c); if (c.a >= .98) break; }
      if (cs.backgroundImage && cs.backgroundImage !== 'none' && /gradient/.test(cs.backgroundImage)) { var m = cs.backgroundImage.match(/rgba?\([^)]+\)/g); if (m && m.length) { var gc = parseRGBA(m[0]); if (gc) { layers.push(gc); if (gc.a >= .9) break; } } }
      n = n.parentElement;
    }
    var base = { r: 20, g: 24, b: 34, a: 1 }; // подложка — тёмная сцена
    for (var i = layers.length - 1; i >= 0; i--) { var L = layers[i]; base = { r: L.r * L.a + base.r * (1 - L.a), g: L.g * L.a + base.g * (1 - L.a), b: L.b * L.a + base.b * (1 - L.a), a: 1 }; }
    return base;
  }
  var UI_ROOTS = ['#sheet', '#modal', '#dialog', '#dBox', '#toast', '#obj', '#hpbar', '#title', '#phCard', '#mgsrv', '#mgset', '#wanted', '#coopPill', '#actLabel', '#who'];
  var fixed = new WeakSet(), fixTimer = null;
  function fixContrast() {
    fixTimer = null; if (!document.body.classList.contains('mg-hd')) { resetContrast(); return; }
    var n = 0;
    UI_ROOTS.forEach(function (sel) {
      var root = $q(sel); if (!root) return;
      var all = [root].concat([].slice.call(root.querySelectorAll('*')));
      for (var i = 0; i < all.length && n < 1500; i++) {
        var e = all[i]; if (e.closest && e.closest('svg')) continue;
        var has = false; for (var c = e.firstChild; c; c = c.nextSibling) if (c.nodeType === 3 && c.textContent.trim()) { has = true; break; }
        if (!has && !(e.tagName === 'INPUT' || e.tagName === 'BUTTON' || e.tagName === 'SELECT')) continue;
        var cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) continue;
        n++;
        var fg = parseRGBA(cs.color), bg = effBg(e); if (!fg) continue;
        if (e.dataset.mgFix) { e.style.removeProperty('color'); delete e.dataset.mgFix; fg = parseRGBA(getComputedStyle(e).color); }
        if (contrastR(fg, bg) < 4.5) {
          var white = contrastR({ r: 255, g: 255, b: 255 }, bg), dark = contrastR({ r: 17, g: 20, b: 28 }, bg);
          e.style.setProperty('color', white >= dark ? '#ffffff' : '#11141c', 'important'); e.dataset.mgFix = '1';
        }
      }
    });
  }
  function resetContrast() { [].slice.call(document.querySelectorAll('[data-mg-fix]')).forEach(function (e) { e.style.removeProperty('color'); delete e.dataset.mgFix; }); }
  var lastFix = 0;
  function scheduleFix() { if (fixTimer || !document.body.classList.contains('mg-hd')) return; var wait = Math.max(150, 600 - (performance.now() - lastFix)); fixTimer = setTimeout(function () { lastFix = performance.now(); try { fixContrast(); } catch (e) { console.error('[MG_SET contrast]', e); } }, wait); }
  SET.fixContrast = fixContrast; SET.contrastReport = function () {
    var bad = [];
    UI_ROOTS.forEach(function (sel) { var root = $q(sel); if (!root) return; [root].concat([].slice.call(root.querySelectorAll('*'))).forEach(function (e) { var has = false; for (var c = e.firstChild; c; c = c.nextSibling) if (c.nodeType === 3 && c.textContent.trim()) has = true; if (!has) return; var cs = getComputedStyle(e); if (cs.display === 'none') return; var r = contrastR(parseRGBA(cs.color), effBg(e)); if (r < 4.5) bad.push({ sel: sel, tag: e.tagName, text: e.textContent.trim().slice(0, 30), ratio: +r.toFixed(2) }); }); });
    return bad;
  };
  new MutationObserver(scheduleFix).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  var css = el('style');
  css.textContent = [
    // базовые правила: тёмные панели улучшенного режима → белый текст
    'body.mg-hd #sheet,body.mg-hd #sheet *,body.mg-hd #dBox,body.mg-hd #dBox *,body.mg-hd #obj,body.mg-hd #obj *,body.mg-hd .tst,body.mg-hd #hpbar,body.mg-hd #hpbar *,body.mg-hd #coopPill{color:#fff}',
    'body.mg-hd #sheet button.pbtn,body.mg-hd #sheet .pbtn{background-color:rgba(255,255,255,.12);color:#fff}',
    'body.mg-hd #sheet .pbtn.main{color:#2a1300}',
    'body.mg-edit #rightBtns button.hidden,body.mg-edit #topBtns button.hidden,body.mg-edit .sq.hidden{display:flex!important;opacity:.55}',
    'body.mg-edit #controls,body.mg-edit #rightBtns,body.mg-edit #topBtns{pointer-events:auto}',
    '#mgset{position:fixed;inset:0;z-index:80;display:none;background:rgba(8,10,16,.84);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);color:#fff;font-family:var(--ui,system-ui,sans-serif);touch-action:auto;user-select:text;-webkit-user-select:text}',
    '#mgset.on{display:flex;align-items:center;justify-content:center}',
    '#mgset .box{width:min(620px,100vw);height:min(820px,100dvh);display:flex;flex-direction:column;background:linear-gradient(170deg,#262c3d,#161a26);border:1px solid rgba(255,255,255,.16);border-radius:18px;box-shadow:0 20px 60px rgba(0,0,0,.6);overflow:hidden}',
    '@media(max-width:640px){#mgset .box{border-radius:0;height:100dvh;border:0}}',
    '#mgset header{display:flex;align-items:center;gap:10px;padding:12px 14px;background:rgba(255,106,19,.14);border-bottom:1px solid rgba(255,255,255,.1)}',
    '#mgset header h1{margin:0;flex:1;font:900 19px var(--mono,Impact,sans-serif)}',
    '#mgset .x{background:rgba(255,255,255,.12);border:0;color:#fff;border-radius:10px;font-size:18px;width:38px;height:38px}',
    '#mgset nav{display:flex;gap:4px;padding:8px 10px 0;overflow-x:auto}',
    '#mgset nav button{flex:1;min-width:92px;padding:10px 8px;border:0;border-radius:10px 10px 0 0;background:rgba(255,255,255,.07);color:#cfd6e6;font:700 14px var(--ui,sans-serif)}',
    '#mgset nav button.act{background:rgba(255,255,255,.17);color:#fff}',
    '#mgset .body{flex:1;overflow-y:auto;padding:10px 14px 22px;background:rgba(255,255,255,.04);-webkit-overflow-scrolling:touch}',
    '#mgset h3{margin:16px 0 4px;font-size:13px;color:#ffcf4a;text-transform:uppercase;letter-spacing:.6px}',
    '#mgset .tg,#mgset .bt2{width:100%;text-align:left;margin-top:6px;padding:10px 12px;border-radius:11px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.08);color:#fff;font:700 14px var(--ui,sans-serif)}',
    '#mgset .tg.on2{background:rgba(255,138,42,.28);border-color:#ff8a2a}',
    '#mgset .tg small,#mgset .bt2 small{display:block;font-weight:500;opacity:.78;margin-top:2px}',
    '#mgset .sl{margin-top:11px}',
    '#mgset .sl .lb{display:flex;justify-content:space-between;font-weight:800;font-size:14px}',
    '#mgset .sl input{width:100%;margin-top:4px}',
    '#mgset .row{display:flex;gap:8px;flex-wrap:wrap}',
    '#mgset .row>*{flex:1;min-width:130px}',
    '#mgset .kb{display:flex;align-items:center;gap:8px;margin-top:6px;padding:8px 10px;background:rgba(255,255,255,.07);border-radius:10px}',
    '#mgset .kb span{flex:1;font-weight:700;font-size:14px}',
    '#mgset .kb button{min-width:96px;padding:8px 10px;border-radius:9px;border:1px solid rgba(255,255,255,.2);background:rgba(0,0,0,.35);color:#fff;font:800 13px monospace}',
    '#mgset .kb button.cap{border-color:#ffcf4a;color:#ffcf4a}',
    '#mgset .hint{opacity:.72;font-size:12.5px;line-height:1.4;margin:6px 0}',
    '#mgset .danger{background:rgba(232,71,59,.3);border-color:#e8473b}'
  ].join('\n');
  document.head.appendChild(css);

  /* ============================================================
     5. ПАНЕЛЬ НАСТРОЕК
     ============================================================ */
  var panel = null, body = null, nav = null, tab = 'gfx', confirmReset = false;
  function buildPanel() {
    if (panel) return;
    panel = el('div'); panel.id = 'mgset';
    var box = el('div'); box.className = 'box';
    var head = el('header'); head.appendChild(el('h1', '', '⚙️ Настройки · v1.12'));
    var x = el('button'); x.className = 'x'; x.textContent = '✕'; x.onclick = closePanel; head.appendChild(x);
    nav = el('nav'); body = el('div'); body.className = 'body';
    box.appendChild(head); box.appendChild(nav); box.appendChild(body); panel.appendChild(box); document.body.appendChild(panel);
    ['pointerdown', 'touchstart', 'keydown'].forEach(function (t) { panel.addEventListener(t, function (e) { if (t === 'keydown' && capturing) return; e.stopPropagation(); }, { capture: true, passive: true }); });
  }
  function openPanel(t) { buildPanel(); if (t) tab = t; panel.classList.add('on'); renderPanel(); }
  function closePanel() { if (panel) panel.classList.remove('on'); capturing = null; confirmReset = false; }
  function togglePanel() { if (panel && panel.classList.contains('on')) closePanel(); else openPanel(); }
  SET.open = openPanel; SET.close = closePanel;

  function tog(label, sub, on, fn) { var b = el('button'); b.className = 'tg' + (on ? ' on2' : ''); b.innerHTML = (on ? '✅ ' : '⬜ ') + label + (sub ? '<small>' + sub + '</small>' : ''); b.onclick = fn; return b; }
  function slider(label, val, min, max, step, fmt, onInput) {
    var w = el('div'); w.className = 'sl'; var l = el('div'); l.className = 'lb'; var nm = el('span', '', label), v = el('span', '', fmt(val)); l.appendChild(nm); l.appendChild(v);
    var r = el('input'); r.type = 'range'; r.min = min; r.max = max; r.step = step; r.value = val;
    r.oninput = function () { v.textContent = fmt(+r.value); onInput(+r.value, true); }; r.onchange = function () { onInput(+r.value, false); };
    w.appendChild(l); w.appendChild(r); return w;
  }
  function choice(label, sub, opts, cur, fn) {
    var w = el('div'); w.style.marginTop = '8px'; w.appendChild(el('div', 'font-weight:800;font-size:14px', label + (sub ? '' : ''))); if (sub) w.appendChild(el('div', 'opacity:.75;font-size:12px', sub));
    var r = el('div'); r.className = 'row'; r.style.marginTop = '4px';
    opts.forEach(function (o) { var b = el('button'); b.className = 'tg' + (o[0] === cur ? ' on2' : ''); b.style.marginTop = '0'; b.style.minWidth = '70px'; b.textContent = o[1]; b.onclick = function () { fn(o[0]); renderPanel(); }; r.appendChild(b); });
    w.appendChild(r); return w;
  }
  var pc = function (v) { return Math.round(v * 100) + '%'; };
  function renderPanel() {
    if (!panel || !panel.classList.contains('on')) return;
    var sc = body.scrollTop; nav.innerHTML = ''; body.innerHTML = '';
    [['gfx', '🎨 Графика'], ['ctl', '🎮 Управление'], ['cam', '🎥 Камера'], ['gen', '🧰 Общее']].forEach(function (t) { var b = el('button'); b.textContent = t[1]; b.className = tab === t[0] ? 'act' : ''; b.onclick = function () { tab = t[0]; confirmReset = false; renderPanel(); }; nav.appendChild(b); });
    ({ gfx: tabGfx, ctl: tabCtl, cam: tabCam, gen: tabGen })[tab]();
    body.scrollTop = sc;
  }
  function H(t) { return el('h3', '', t); }
  function tabGfx() {
    var G = GFX(), b = body; if (!G) { b.appendChild(el('div', 'hint', 'Графический модуль не загружен.')); return; }
    var hd = G.mode === 'hd', O = G.opt;
    b.appendChild(H('Режим графики'));
    var r = el('div'); r.className = 'row';
    [['classic', '🎞️ Классическая', 'Как раньше. Быстро на любых устройствах.'], ['hd', '✨ Улучшенная', 'Тени, вода, детали, тёмный интерфейс.']].forEach(function (m) { var x = el('button'); x.className = 'tg' + (G.mode === m[0] ? ' on2' : ''); x.style.marginTop = '0'; x.innerHTML = '<b>' + m[1] + '</b><small>' + m[2] + '</small>'; x.onclick = function () { G.set(m[0]); renderPanel(); say_(m[0] === 'hd' ? '✨ Улучшенная графика' : '🎞️ Классическая графика', 1500); scheduleFix(); }; r.appendChild(x); });
    b.appendChild(r);
    b.appendChild(H('Изображение (работает в любом режиме)'));
    b.appendChild(slider('☀️ Яркость', O.bright, .7, 1.4, .02, pc, function (v) { G.setOpt('bright', v); }));
    b.appendChild(slider('🌗 Гамма', O.gamma, .7, 1.5, .02, function (v) { return v.toFixed(2); }, function (v) { G.setOpt('gamma', v); }));
    b.appendChild(slider('◐ Контраст', O.contrast, .7, 1.5, .02, pc, function (v) { G.setOpt('contrast', v); }));
    b.appendChild(slider('🎨 Насыщенность', O.sat, .5, 1.6, .02, pc, function (v) { G.setOpt('sat', v); }));
    if (G.gammaSupported && !G.gammaSupported()) b.appendChild(el('div', 'hint', 'На этом устройстве гамма эмулируется яркостью и контрастом.'));
    b.appendChild(H('Производительность и качество'));
    b.appendChild(slider('🔭 Дальность прорисовки', hd ? O.dist : O.distC, hd ? .7 : .5, 1.8, .05, pc, function (v) { G.setOpt(hd ? 'dist' : 'distC', v); }));
    b.appendChild(slider('🖼️ Разрешение картинки', O.res, .5, 1.5, .05, pc, function (v, live) { G.setOpt('res', v); }));
    b.appendChild(choice('🧱 Качество текстур', 'Низкое — без сглаживания вдали; Высокое — чёткие текстуры под углом.', [[0, 'Низкое'], [1, 'Стандарт'], [2, 'Высокое']], O.texQ, function (v) { G.setOpt('texQ', v); }));
    b.appendChild(choice('⏱ Лимит кадров', 'Экономит батарею и нагрев.', [[0, 'Без'], [30, '30'], [45, '45'], [60, '60']], O.fpsCap, function (v) { G.setOpt('fpsCap', v); }));
    // сглаживание: применяется при создании графического контекста → нужен перезапуск
    var aaNow = true; try { aaNow = renderer.getContext().getContextAttributes().antialias !== false; } catch (e) { }
    var aaWant = true; try { aaWant = localStorage.getItem('mg_aa') !== '0'; } catch (e) { }
    b.appendChild(tog('Сглаживание краёв (MSAA)', aaWant === aaNow ? 'Применяется при запуске игры.' : '⚠️ Изменение вступит в силу после перезапуска игры.', aaWant, function () { try { localStorage.setItem('mg_aa', aaWant ? '0' : '1'); } catch (e) { } renderPanel(); }));
    if (aaWant !== aaNow) { var rb = el('button'); rb.className = 'bt2'; rb.textContent = '🔄 Перезапустить сейчас'; rb.onclick = function () { try { if (typeof fullSave === 'function') fullSave(false); } catch (e) { } location.reload(); }; b.appendChild(rb); }
    b.appendChild(tog('Показывать FPS', '', O.fps, function () { G.setOpt('fps', !O.fps); renderPanel(); }));
    if (hd) {
      b.appendChild(H('Улучшенная графика'));
      b.appendChild(tog('Текстуры карты', 'Зернистость и детали на земле, стенах, дорогах.', O.texMap, function () { G.setOpt('texMap', !O.texMap); renderPanel(); }));
      b.appendChild(tog('Вода и отражения', 'Волны, отражение неба, блики.', O.water, function () { G.setOpt('water', !O.water); renderPanel(); }));
      b.appendChild(tog('Текстуры кнопок и панелей', 'Тёмные стеклянные панели, белый текст.', O.texUI, function () { G.setOpt('texUI', !O.texUI); renderPanel(); scheduleFix(); }));
      b.appendChild(tog('Тени от солнца', 'Заметно нагружает телефон.', O.shadows, function () { G.setOpt('shadows', !O.shadows); renderPanel(); }));
      if (O.shadows) b.appendChild(choice('🔲 Качество теней', '', [[0, 'Низкое'], [1, 'Среднее'], [2, 'Высокое']], O.shadowQ, function (v) { G.setOpt('shadowQ', v); }));
      b.appendChild(tog('Кинематографичная тонировка', 'Мягкие света и глубокие тени.', O.tone, function () { G.setOpt('tone', !O.tone); renderPanel(); }));
      b.appendChild(tog('Частицы и эффекты', 'Больше дыма и пыли, лёгкая пыльца.', O.fx, function () { G.setOpt('fx', !O.fx); renderPanel(); }));
      b.appendChild(tog('Авто-снижение качества, если лагает', G.tier ? 'Сейчас уровень ' + G.tier : '', G.auto, function () { G.setAuto(!G.auto); if (G.auto) G.tier = 0; renderPanel(); }));
    } else b.appendChild(el('div', 'hint', 'Тени, вода, текстуры карты и интерфейса, тонировка и эффекты настраиваются в режиме «Улучшенная».'));
  }
  function keyLabel(c) { if (!c) return '—'; return c.replace(/^Key/, '').replace(/^Digit/, '').replace('ShiftLeft', 'Shift').replace('ShiftRight', 'Shift→').replace('Space', 'Пробел').replace('Arrow', '→'.length ? 'Стр. ' : ''); }
  function tabCtl() {
    var b = body;
    b.appendChild(H('Клавиатура'));
    b.appendChild(el('div', 'hint', 'Нажми на клавишу справа и затем новую клавишу. Esc — отмена. Стрелки всегда дублируют движение.'));
    ACTIONS.forEach(function (a) {
      var row = el('div'); row.className = 'kb'; row.appendChild(el('span', '', a[1]));
      var kbtn = el('button'); var cur = codeOf(a[0]); kbtn.textContent = capturing === a[0] ? 'нажми…' : keyLabel(cur); if (capturing === a[0]) kbtn.className = 'cap';
      if (ST.keys[a[0]]) kbtn.style.borderColor = '#ff8a2a';
      kbtn.onclick = function () { capturing = a[0]; renderPanel(); };
      row.appendChild(kbtn); b.appendChild(row);
    });
    var rk = el('button'); rk.className = 'bt2'; rk.textContent = '↺ Сбросить клавиши'; rk.onclick = function () { SET.resetKeys(); renderPanel(); say_('Клавиши сброшены', 1500); }; b.appendChild(rk);
    b.appendChild(H('Экранные кнопки (телефон)'));
    b.appendChild(slider('📐 Размер всех кнопок', ST.uiScale, .7, 1.6, .05, pc, function (v) { SET.setUIScale(v); }));
    var eb = el('button'); eb.className = 'bt2'; eb.innerHTML = '✋ Расположение и размер каждой кнопки<small>Откроется режим перетаскивания. Доступно во время игры.</small>'; eb.onclick = startEdit; b.appendChild(eb);
    var rl = el('button'); rl.className = 'bt2'; rl.textContent = '↺ Сбросить расположение и размер кнопок'; rl.onclick = function () { SET.resetLayout(); renderPanel(); say_('Раскладка сброшена', 1500); }; b.appendChild(rl);
    b.appendChild(el('div', 'hint', 'Джойстик появляется там, где ты касаешься левой половины экрана, поэтому у него настраивается только размер.'));
  }
  function tabCam() {
    var b = body, G = GFX();
    b.appendChild(H('Чувствительность'));
    b.appendChild(slider('🔄 Поворот камеры', ST.sens, .3, 2.5, .05, pc, function (v) { SET.setSens(v); }));
    b.appendChild(el('div', 'hint', 'Работает в обоих видах и при управлении мышью или пальцем.'));
    b.appendChild(H('Вид'));
    var r = el('div'); r.className = 'row';
    [[false, '🎥 От третьего лица', 'Как раньше.'], [true, '👁 От первого лица', 'Глазами героя. Клавиша V.']].forEach(function (m) { var x = el('button'); x.className = 'tg' + (ST.fp === m[0] ? ' on2' : ''); x.style.marginTop = '0'; x.innerHTML = '<b>' + m[1] + '</b><small>' + m[2] + '</small>'; x.onclick = function () { if (ST.fp !== m[0]) toggleFP(m[0]); renderPanel(); }; r.appendChild(x); });
    b.appendChild(r);
    if (G) { b.appendChild(H('Расстояние')); b.appendChild(slider('📷 Отдаление камеры (3-е лицо)', G.opt.cam, .7, 2, .05, pc, function (v) { G.setOpt('cam', v); })); }
  }
  function tabGen() {
    var b = body;
    b.appendChild(H('Сброс'));
    if (!confirmReset) { var rs = el('button'); rs.className = 'bt2 danger'; rs.innerHTML = '↺ Сбросить все настройки<small>Графика, управление, камера. Сохранения игры не затрагиваются.</small>'; rs.onclick = function () { confirmReset = true; renderPanel(); }; b.appendChild(rs); }
    else {
      b.appendChild(el('div', 'hint', '⚠️ Точно сбросить ВСЕ настройки к стандартным значениям? Прогресс игры останется.'));
      var r = el('div'); r.className = 'row';
      var y = el('button'); y.className = 'bt2 danger'; y.textContent = 'Да, сбросить'; y.onclick = function () { resetAll(); confirmReset = false; renderPanel(); say_('Настройки сброшены', 1800); };
      var n = el('button'); n.className = 'bt2'; n.textContent = 'Отмена'; n.onclick = function () { confirmReset = false; renderPanel(); };
      r.appendChild(y); r.appendChild(n); b.appendChild(r);
    }
    b.appendChild(H('О версии'));
    b.appendChild(el('div', 'hint', 'МГИАГ 1.12 «Карта и удобство». Настройки хранятся на этом устройстве и сохраняются между запусками.'));
  }
  function resetAll() {
    var G = GFX(); if (G) { G.reset(); G.set('classic'); G.setOpt('distC', 1); G.setOpt('res', 1); }
    SET.resetKeys(); SET.resetLayout(); SET.setSens(1); if (ST.fp) toggleFP(false); G && G.setOpt('cam', 1);
    try { localStorage.removeItem('mg_aa'); } catch (e) { }
    ST.sens = 1; save();
  }
  SET.resetAll = resetAll;

  /* ============================================================
     6. ВСТРОЙКА В ИГРУ: кнопки, меню, цикл камеры
     ============================================================ */
  function addGameButtons() {
    var top = document.getElementById('topBtns'); if (!top) return false;
    if (!document.getElementById('bSet')) { var s = el('button'); s.className = 'sq'; s.id = 'bSet'; s.setAttribute('aria-label', 'Настройки'); s.textContent = '⚙️'; s.onclick = function () { if (typeof blocked === 'function' && blocked()) return; openPanel(); }; top.appendChild(s); }
    if (!document.getElementById('bView')) { var v = el('button'); v.className = 'sq'; v.id = 'bView'; v.setAttribute('aria-label', 'Вид от первого лица'); v.textContent = ST.fp ? '🎥' : '👁'; v.onclick = function () { toggleFP(); }; top.appendChild(v); }
    applyUI(); return true;
  }
  var hooked = false;
  function hook() {
    if (hooked || !gameReady() || typeof updCamera !== 'function') return;
    hooked = true;
    var oc = updCamera;
    var wc = function (dt) { oc(dt); try { fpCamera(dt); } catch (e) { console.error('[MG_SET fp]', e); ST.fp = false; fpT = 0; } };
    wc.__mgFp = true; window.updCamera = updCamera = wc;
    if (ST.fp) { prevPitch = cam.pitch; cam.pitch = .62; }
    addGameButtons();
    hookPhoneSettings();
  }
  function hookPhoneSettings() {
    if (typeof renderPhone !== 'function' || renderPhone.__mgSet) return;
    var prev = renderPhone;
    var w = function () {
      prev.apply(this, arguments);
      try {
        if (typeof phoneApp === 'undefined' || phoneApp !== 'settings') return;
        var bd = document.getElementById('sheetBody'); if (!bd || bd.querySelector('[data-mg-set]')) return;
        var b = el('button'); b.setAttribute('data-mg-set', '1'); b.className = 'pbtn main'; b.style.cssText = 'width:100%;text-align:left;padding:12px 14px;margin:8px 0';
        b.innerHTML = '<b>⚙️ Графика, управление, камера</b><br><small>Яркость, гамма, тени, текстуры, клавиши, кнопки, чувствительность, вид от 1-го лица</small>';
        b.onclick = function () { if (typeof closeModal === 'function') closeModal(); openPanel(); };
        var first = bd.querySelector('h2'); if (first && first.nextSibling) bd.insertBefore(b, first.nextSibling); else bd.insertBefore(b, bd.firstChild);
      } catch (e) { console.error('[MG_SET phone]', e); }
    };
    w.__mgSet = true; window.renderPhone = renderPhone = w;
  }
  var iv = setInterval(function () { try { hook(); if (hooked) { addGameButtons(); clearInterval(iv); } } catch (e) { console.error('[MG_SET]', e); } }, 250);

  /* ---------- главное меню: кнопка «Настройки»; сервер «ХАОС» живёт в разделе «Вместе» ---------- */
  function titleMenu() {
    var menu = document.getElementById('menu'); if (!menu) return;
    var btns = [].slice.call(menu.querySelectorAll('button')), txt = menu.textContent || '';
    var first = btns[0];
    // главный экран: единственная кнопка «Играть»
    if (first && btns.length === 1 && /Играть/.test(first.textContent) && !menu.querySelector('[data-mg-set-btn]')) {
      var b = el('button'); b.setAttribute('data-mg-set-btn', '1'); b.style.cssText = 'width:100%;font-size:18px;padding:14px 16px;text-align:left'; b.className = 'alt'; b.textContent = '⚙️ Настройки'; b.onclick = function () { openPanel(); };
      first.insertAdjacentElement('afterend', b);
    }
    // раздел «Вместе»: добавляем сервер «ХАОС» (онлайн)
    if (/Один создаёт комнату/.test(txt) && !menu.querySelector('[data-mg-srv]') && window.MG_ONLINE && MG_ONLINE.open) {
      var back = btns.filter(function (x) { return /Назад/.test(x.textContent); })[0];
      var s = el('button'); s.setAttribute('data-mg-srv', '1'); s.style.cssText = 'width:100%;font-size:18px;padding:14px 16px;text-align:left;background:linear-gradient(180deg,#e8473b,#a82a20);color:#fff';
      s.textContent = '🌪️ Сервер «ХАОС» (онлайн, до 25 игроков)'; s.onclick = function () { MG_ONLINE.open(); };
      if (back) menu.insertBefore(s, back); else menu.appendChild(s);
    }
  }
  var mo = new MutationObserver(function () { try { titleMenu(); } catch (e) { console.error('[MG_SET menu]', e); } });
  function bootMenu() { var m = document.getElementById('menu'); if (m) { mo.observe(m, { childList: true }); titleMenu(); } else setTimeout(bootMenu, 200); }
  bootMenu();

  window.addEventListener('load', function () { applyUI(); });
})();
