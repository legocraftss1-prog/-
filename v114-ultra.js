/* =====================================================================
   МГИАГ 1.14 — ULTRA OVERHAUL ALPHA (экспериментальный режим)
   Ядро: общий выключатель, отдельные переключатели, защита запуска,
   авто-снижение качества, страница настроек.
   По умолчанию ВЫКЛЮЧЕНО: пока режим выключен, ни один модуль v114-*
   не меняет карту, свет, материалы и управление.
   Модули: v114-ultra-sky.js (небо, свет, тени, отражения),
           v114-ultra-post.js (AO, дымка, свечение, цвет, сглаживание),
           v114-ultra-world.js (модели и текстуры карты),
           v114-ultra-controls.js (кнопка огня, зум колёсиком).
   ===================================================================== */
(function () {
  'use strict';
  var KEY = 'mg_ultra', BOOT = 'mg_ultra_boot';
  var MOBILE = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || !!(window.matchMedia && matchMedia('(pointer:coarse)').matches);
  var DEF = {
    on: false,
    sky: true, light: true, shadows: true, shadowQ: MOBILE ? 0 : 1, shadowDist: 1, refl: true,
    ao: true, aoQ: MOBILE ? 0 : 1, bloom: true, haze: true, grade: true, fxaa: true, res: MOBILE ? .85 : 1,
    tex: true, models: true,
    fire: true, fireSize: 1, wheel: true, zoom: 1,
    auto: true
  };
  var LIM = { shadowQ: [0, 2], aoQ: [0, 2], shadowDist: [.6, 1.6], res: [.5, 1], fireSize: [.7, 1.5], zoom: [.55, 2.2] };
  function clampN(v, a, b, d) { v = +v; return isFinite(v) ? Math.min(b, Math.max(a, v)) : d; }
  function norm(k, v) {
    if (LIM[k]) { v = clampN(v, LIM[k][0], LIM[k][1], DEF[k]); if (k === 'shadowQ' || k === 'aoQ') v = Math.round(v); return v; }
    return !!v;
  }
  var opt = {}; for (var k0 in DEF) opt[k0] = DEF[k0];
  try { var sv = JSON.parse(localStorage.getItem(KEY) || 'null'); if (sv && typeof sv === 'object') for (var k1 in DEF) if (sv[k1] !== undefined) opt[k1] = norm(k1, sv[k1]); } catch (e) { }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(opt)); } catch (e) { } }
  // аварийное выключение: открыть игру с «?ultra=off» в адресе
  try { if (/[?&]ultra=off\b/.test(location.search) && opt.on) { opt.on = false; save(); localStorage.removeItem(BOOT); } } catch (e) { }

  var U = window.MG_ULTRA = {
    opt: opt, DEF: DEF, mobile: MOBILE, mods: {}, order: [], fail: {}, tier: 0,
    active: false, ready: false, safeOff: false, built: { models: false }, shadowsOn: false, rawRender: null, log: []
  };
  U.save = save;
  U.reg = function (name, mod) { U.mods[name] = mod; U.order.push(name); };
  function say(t, ms) { try { if (typeof toast === 'function') toast(t, ms || 3200); } catch (e) { } }
  U.say = say;
  function note(where, e) { var s = '[ULTRA ' + where + '] ' + (e && e.message ? e.message : e); U.log.push(s); if (U.log.length > 30) U.log.shift(); try { console.warn(s, e); } catch (e2) { } }
  U.note = note;

  /* Настройки с учётом авто-снижения качества (U.tier: 0 — как задано, 3 — минимум). */
  U.eff = function () {
    var o = opt, t = U.tier;
    return {
      sky: o.sky, light: o.light, refl: o.refl && t < 3, shadows: o.shadows,
      shadowQ: Math.max(0, o.shadowQ - (t >= 1 ? 1 : 0) - (t >= 3 ? 1 : 0)), shadowDist: o.shadowDist * (t >= 2 ? .8 : 1),
      ao: o.ao && t < 2, aoQ: t >= 1 ? 0 : o.aoQ, bloom: o.bloom && t < 3, haze: o.haze, grade: o.grade, fxaa: o.fxaa,
      res: Math.max(.5, o.res * (t >= 3 ? .7 : t >= 2 ? .82 : 1)), tex: o.tex, models: o.models
    };
  };
  U.want = function (key) { return U.active && !!U.eff()[key]; };

  /* ---------- защита запуска: два незавершённых запуска подряд — режим отключается сам ---------- */
  function bootBegin() {
    if (!opt.on) return;
    var n = 0; try { n = +(localStorage.getItem(BOOT) || 0) || 0; } catch (e) { }
    if (n >= 2) {
      U.safeOff = true; opt.on = false; save(); try { localStorage.removeItem(BOOT); } catch (e) { }
      U.bootMsg = '🛟 ULTRA OVERHAUL отключён: два прошлых запуска с ним не завершились. Игра работает по-старому.';
      return;
    }
    try { localStorage.setItem(BOOT, String(n + 1)); } catch (e) { }
  }
  var okFrames = 0;
  function bootOk() { if (okFrames < 0) return; if (++okFrames >= 90) { okFrames = -1; try { localStorage.removeItem(BOOT); } catch (e) { } } }
  U.bootOk = bootOk;

  /* ---------- ошибки шейдеров three.js не бросают исключений — ловим их по console.error ---------- */
  var shaderTrip = false;
  (function () {
    var ce = console.error;
    console.error = function () {
      try {
        var a0 = arguments[0];
        if (U.active && !shaderTrip && typeof a0 === 'string' && /THREE\.WebGL(Program|Shader)/.test(a0) && /error/i.test(a0)) {
          shaderTrip = true; setTimeout(function () { shaderFail(); }, 0);
        }
      } catch (e) { }
      return ce.apply(console, arguments);
    };
  })();
  function shaderFail() {
    note('shader', 'ошибка компиляции шейдера — графические части режима отключены');
    ['post', 'sky', 'world'].forEach(function (n) { failMod(n, 'shader', true); });
    say('⚠️ ULTRA: видеокарта не приняла шейдеры. Графическая часть режима отключена, игра работает по-старому.', 5200);
    restoreGfx();
  }
  function failMod(name, why, quiet) {
    if (U.fail[name]) return; U.fail[name] = why || true;
    var m = U.mods[name]; if (m && m.off) { try { m.off(); } catch (e) { note(name + '.off', e); } }
    if (!quiet) { say('⚠️ ULTRA: часть «' + (m && m.title || name) + '» отключена из-за ошибки. Остальная игра работает.', 4200); restoreGfx(); }
  }
  U.failMod = failMod;
  function restoreGfx() { try { if (window.MG_GFX && MG_GFX.set && U.ready) MG_GFX.set(MG_GFX.mode); } catch (e) { note('restoreGfx', e); } }
  U.restoreGfx = restoreGfx;

  /* ---------- вызывается из init() перед постройкой карты ---------- */
  window.MG_ULTRA_PRE = function () {
    bootBegin();
    U.active = !!opt.on && !U.safeOff;
    U.order.forEach(function (n) { var m = U.mods[n]; if (m && m.pre) { try { m.pre(); } catch (e) { note(n + '.pre', e); U.fail[n] = 'pre'; } } });
  };

  /* ---------- применение настроек ---------- */
  U.sync = function () {
    if (!U.ready) return;
    U.order.forEach(function (n) {
      var m = U.mods[n]; if (!m) return;
      try { if (U.fail[n] || !U.active) { if (m.off) m.off(); } else if (m.sync) m.sync(); }
      catch (e) { note(n + '.sync', e); failMod(n, 'sync'); }
    });
  };
  U.set = function (on) {
    on = !!on; opt.on = on; save();
    if (on) { U.safeOff = false; U.fail = {}; shaderTrip = false; U.tier = 0; slowFor = 0; }
    U.active = on;
    U.sync();
    if (!on) { restoreGfx(); try { localStorage.removeItem(BOOT); } catch (e) { } }
  };
  U.setOpt = function (key, val) {
    if (!(key in DEF) || key === 'on') return;
    opt[key] = norm(key, val); save();
    if (U.active) U.sync();
  };
  U.resetOpts = function () { var on = opt.on; for (var k in DEF) opt[k] = DEF[k]; opt.on = on; U.tier = 0; save(); if (U.active) U.sync(); };

  /* ---------- покадровая часть и авто-снижение качества ---------- */
  var ema = 16.7, lastT = 0, slowFor = 0;
  function frame(dt, t) {
    if (!U.active) return;
    var now = performance.now(), ft = now - lastT; lastT = now;
    if (ft > 0 && ft < 250) ema += (ft - ema) * .05;
    U.fps = 1000 / ema;
    if (opt.auto && typeof started !== 'undefined' && started && U.tier < 3) {
      if (ema > 41) slowFor += dt; else slowFor = Math.max(0, slowFor - dt * .5);
      if (slowFor > 4) { slowFor = 0; U.tier++; U.sync(); say('⚙️ ULTRA: качество снижено для плавности (ступень ' + U.tier + ' из 3)', 2600); }
    }
    for (var i = 0; i < U.order.length; i++) {
      var n = U.order[i], m = U.mods[n];
      if (!m || !m.frame || U.fail[n]) continue;
      try { m.frame(dt, t); } catch (e) { note(n + '.frame', e); failMod(n, 'frame'); }
    }
  }
  function hook() {
    if (typeof worldReady === 'undefined' || !worldReady || typeof updEnv !== 'function' || typeof renderer === 'undefined') return false;
    waited += 200;
    if (!updEnv.__mgGfx && window.MG_GFX && waited < 3000) return false; // сначала встраивается модуль графики 1.11
    if (!updEnv.__mgUltra) {
      var orig = updEnv;
      var w = function (dt, t) { orig(dt, t); try { frame(dt, t); } catch (e) { note('frame', e); } };
      w.__mgUltra = true; w.__mgGfx = orig.__mgGfx; window.updEnv = updEnv = w;
    }
    U.ready = true;
    try { renderer.domElement.addEventListener('webglcontextlost', function () { if (U.active) { note('gl', 'контекст WebGL потерян'); opt.on = false; save(); } }); } catch (e) { }
    U.sync();
    if (U.bootMsg) setTimeout(function () { say(U.bootMsg, 6000); }, 1500);
    return true;
  }
  var waited = 0;
  var iv = setInterval(function () { try { if (hook()) clearInterval(iv); } catch (e) { note('hook', e); clearInterval(iv); } }, 200);

  /* ---------- страница настроек (Настройки → Дополнительно → Экспериментальные функции) ---------- */
  U.renderSettings = function (A) {
    var b = A.body, O = opt, re = A.rerender;
    function hint(t) { var e = A.el('div', '', t); e.className = 'hint'; return e; }
    function T(key, label, sub) { b.appendChild(A.tog(label, sub, O[key], function () { U.setOpt(key, !O[key]); re(); })); }
    b.appendChild(A.H('🚀 ULTRA OVERHAUL ALPHA'));
    b.appendChild(hint('Экспериментальное графическое обновление: та же карта и тот же МГИАГ, но с новым небом, светом, тенями, моделями и текстурами. Режим может работать нестабильно. Если что-то пойдёт не так, выключи его здесь — игра вернётся к обычному виду. Сохранения не затрагиваются.'));
    b.appendChild(A.tog('Включить ULTRA OVERHAUL ALPHA', U.safeOff ? '⚠️ Был отключён защитой запуска. Можно включить снова.' : (O.on ? 'Сейчас включён.' : 'Сейчас выключен, игра выглядит как раньше.'), O.on, function () { U.set(!O.on); re(); }));
    if (!O.on) return;
    var failed = Object.keys(U.fail);
    if (failed.length) b.appendChild(hint('⚠️ Отключено из-за ошибок: ' + failed.map(function (n) { return (U.mods[n] && U.mods[n].title) || n; }).join(', ') + '. Выключи и включи режим, чтобы попробовать снова.'));
    if (U.tier) {
      b.appendChild(hint('⚙️ Авто-снижение качества: ступень ' + U.tier + ' из 3.'));
      var rb = A.el('button'); rb.className = 'bt2'; rb.textContent = '↺ Вернуть заданное качество'; rb.onclick = function () { U.tier = 0; U.sync(); re(); }; b.appendChild(rb);
    }

    b.appendChild(A.H('Небо и свет'));
    T('sky', 'Новое небо', 'Голубое небо, солнце, луна, звёзды, облака, горизонт.');
    T('light', 'Свет по времени суток', 'Тёплый рассвет и закат, холодная ночь, лунный свет.');
    T('shadows', 'Динамические мягкие тени', 'От солнца и луны. Заметно нагружает телефон.');
    if (O.shadows) {
      b.appendChild(A.choice('🔲 Качество теней', '', [[0, 'Низкое'], [1, 'Среднее'], [2, 'Высокое']], O.shadowQ, function (v) { U.setOpt('shadowQ', v); }));
      b.appendChild(A.slider('📏 Дальность теней', O.shadowDist, .6, 1.6, .1, A.pc, function (v, live) { if (!live) U.setOpt('shadowDist', v); }));
    }
    T('refl', 'Отражения', 'Небо в окнах домов, стёклах машин и на мокром асфальте.');

    b.appendChild(A.H('Обработка изображения'));
    T('ao', 'Ambient Occlusion', 'Мягкое затенение в углах и под объектами.');
    if (O.ao) b.appendChild(A.choice('Качество затенения', '', [[0, 'Низкое'], [1, 'Среднее'], [2, 'Высокое']], O.aoQ, function (v) { U.setOpt('aoQ', v); }));
    T('haze', 'Атмосферная дымка', 'Дальние дома мягко уходят в воздух.');
    T('bloom', 'Свечение', 'Мягкий ореол у солнца, окон и фонарей.');
    T('grade', 'Цветокоррекция', 'Чуть больше контраста и цвета, лёгкая виньетка.');
    T('fxaa', 'Сглаживание (FXAA)', 'Убирает лесенки на краях.');
    b.appendChild(A.slider('🖼️ Разрешение обработки', O.res, .5, 1, .05, A.pc, function (v, live) { if (!live) U.setOpt('res', v); }));

    b.appendChild(A.H('Карта'));
    T('tex', 'Новые текстуры', 'Фасады и окна в высоком разрешении, асфальт, плитка, трава.');
    var need = !!O.models !== !!U.built.models;
    b.appendChild(A.tog('Улучшенные модели', need ? '⚠️ Изменение вступит в силу после перезапуска игры.' : 'Деревья, машины, фонари, скамейки, детали зданий. Меняется при запуске игры.', O.models, function () { U.setOpt('models', !O.models); re(); }));
    if (need) { var rs = A.el('button'); rs.className = 'bt2'; rs.textContent = '🔄 Перезапустить сейчас'; rs.onclick = function () { try { if (typeof fullSave === 'function') fullSave(); else if (typeof saveGame === 'function') saveGame(); } catch (e) { } location.reload(); }; b.appendChild(rs); }

    b.appendChild(A.H('Управление'));
    T('fire', 'Большая кнопка огня', 'Только на сенсорных экранах. Появляется, когда в руках оружие. Можно вести по ней пальцем, чтобы поворачивать камеру.');
    if (O.fire) b.appendChild(A.slider('Размер кнопки огня', O.fireSize, .7, 1.5, .05, A.pc, function (v) { U.setOpt('fireSize', v); }));
    T('wheel', 'Зум камеры колёсиком мыши', 'Вверх — ближе, вниз — дальше.');
    if (O.wheel) b.appendChild(A.slider('🔍 Расстояние камеры', O.zoom, .55, 2.2, .05, A.pc, function (v) { U.setOpt('zoom', v); if (U.mods.controls && U.mods.controls.setZoom) U.mods.controls.setZoom(v); }));

    b.appendChild(A.H('Производительность'));
    T('auto', 'Авто-снижение качества, если лагает', 'Сначала упрощает затенение и тени, потом свечение и разрешение.');
    if (typeof U.fps === 'number' && U.ready) b.appendChild(hint('Сейчас около ' + Math.round(U.fps) + ' FPS.'));
    var rd = A.el('button'); rd.className = 'bt2'; rd.textContent = '↺ Сбросить настройки ULTRA'; rd.onclick = function () { U.resetOpts(); re(); }; b.appendChild(rd);
  };
})();
