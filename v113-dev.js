/* =====================================================================
   МГИАГ 1.13.3 — РАСШИРЕННАЯ DEV-ПАНЕЛЬ
   Все прежние вкладки DEV-панели сохранены (Игрок, Мир, Транспорт, Оружие, Хаос, Телепорты).
   Добавлены: ⚡ Способности, 📖 Сюжет, 🧭 Навигация, 🌊 Вода и машины, 🎒 Предметы, 🏪 Бизнесы,
   🏆 Ачивки, 💾 Сохранение, 🐞 Отладка.
   Флаги DEV хранятся в сохранении (S.devx); пока хоть один включён — на экране значок «🧪 DEV».
   ===================================================================== */
(function () {
  'use strict';
  var NEW_TABS = [['⚡ Способности', 'pow'], ['📖 Сюжет', 'story'], ['🧭 Навигация', 'nav'], ['🌊 Вода/машины', 'water'], ['🎒 Предметы', 'items'], ['🏪 Бизнесы', 'biz'], ['🏆 Ачивки', 'ach'], ['💾 Сохранение', 'save'], ['🐞 Отладка', 'dbg']];
  var OLD_TABS = [['Игрок', 'main'], ['Мир', 'world'], ['Транспорт', 'veh'], ['Оружие', 'guns'], ['Хаос', 'chaos'], ['📍 Телепорты', 'tp']];
  var ALL_TABS = [OLD_TABS[0]].concat(NEW_TABS.slice(0, 3), OLD_TABS.slice(1, 2), [NEW_TABS[3]], OLD_TABS.slice(2), NEW_TABS.slice(4));
  var DEF = { speed: 1, noclip: false, god: false, air: false, time: 1, grav: 1, jump: 1, nohud: false, safe3: false, clock: true };
  var DEVX = window.MG_DEVX = { log: [], fps: 0, armed: {} };
  function X() { if (typeof S === 'undefined' || !S) return Object.assign({}, DEF); if (!S.devx) S.devx = Object.assign({}, DEF); for (var k in DEF) if (S.devx[k] === undefined) S.devx[k] = DEF[k]; return S.devx; }
  DEVX.X = X;
  function anyOn() { var x = X(); return x.speed !== 1 || x.noclip || x.god || x.air || x.time !== 1 || x.grav !== 1 || x.jump !== 1 || x.nohud || x.safe3 || !x.clock; }
  function sv() { try { saveGame(); } catch (e) { } }
  function re() { try { renderPhone(); } catch (e) { console.error(e); } }
  function say_(t, ms) { try { toast(t, ms || 1600); } catch (e) { } }
  function el(tag, css, txt) { var e = document.createElement(tag); if (css) e.style.cssText = css; if (txt !== undefined) e.textContent = txt; return e; }
  function f1(n) { return (Math.round(n * 10) / 10).toFixed(1); }

  /* ---------------- журнал ошибок ---------------- */
  function logPush(kind, msg) { DEVX.log.push({ t: new Date().toLocaleTimeString('ru-RU'), k: kind, m: String(msg).slice(0, 400) }); if (DEVX.log.length > 60) DEVX.log.shift(); }
  addEventListener('error', function (e) { logPush('error', (e.message || e) + (e.filename ? ' @' + String(e.filename).split('/').pop() + ':' + e.lineno : '')); });
  addEventListener('unhandledrejection', function (e) { logPush('promise', e.reason && (e.reason.stack || e.reason.message) || e.reason); });
  var ce = console.error; console.error = function () { try { logPush('console', [].slice.call(arguments).map(function (a) { return a && a.stack ? a.stack : (typeof a === 'object' ? JSON.stringify(a) : a); }).join(' ')); } catch (e) { } return ce.apply(console, arguments); };
  // FPS
  (function () { var n = 0, t0 = performance.now(); (function f(now) { n++; if (now - t0 >= 1000) { DEVX.fps = Math.round(n * 1000 / (now - t0)); n = 0; t0 = now; } requestAnimationFrame(f); })(t0); })();

  /* ---------------- UI-помощники ---------------- */
  function chips(b, label, opts, cur, fn) {
    var w = el('div', 'margin:8px 0 4px'); w.appendChild(el('div', 'font-weight:800;font-size:15px', label));
    var r = el('div'); r.className = 'row'; r.style.marginTop = '4px';
    opts.forEach(function (o) { var c = el('button', '', o[1]); c.className = 'chip' + (o[0] === cur ? ' act' : ''); c.onclick = function () { fn(o[0]); sv(); re(); }; r.appendChild(c); });
    w.appendChild(r); b.appendChild(w);
  }
  function D(b, t, f, sub) { rowBtn(b, t, sub || '', 'OK', function () { try { f(); } catch (e) { console.error('[DEV]', e); say_('Ошибка: ' + e.message, 3000); return; } sv(); say_('🧪 ' + t, 1200); re(); }); }
  // кнопка с подтверждением (второе нажатие)
  function DC(b, t, f, sub) { var k = t; rowBtn(b, t, DEVX.armed[k] ? '⚠️ Нажми ещё раз для подтверждения' : (sub || ''), DEVX.armed[k] ? 'Точно?' : 'OK', function () { if (!DEVX.armed[k]) { DEVX.armed[k] = true; setTimeout(function () { DEVX.armed[k] = false; }, 6000); re(); return; } DEVX.armed[k] = false; try { f(); } catch (e) { console.error('[DEV]', e); say_('Ошибка: ' + e.message, 3000); return; } sv(); say_('🧪 ' + t, 1400); re(); }); }
  function T_(b, label, on, fn) { tog(b, label, on, fn); }
  function inputRow(b, ph, btn, fn, type) { var w = el('div', 'display:flex;gap:6px;margin:6px 0'); var i = el('input'); i.type = type || 'text'; i.placeholder = ph; i.style.cssText = 'flex:1;min-width:0;font-size:16px;padding:8px;border-radius:10px;border:2px solid #22325a;box-sizing:border-box'; var g = el('button', '', btn); g.className = 'pbtn'; g.onclick = function () { fn(i.value, i); }; w.appendChild(i); w.appendChild(g); b.appendChild(w); return i; }
  function copy(t) { try { navigator.clipboard.writeText(t); say_('📋 Скопировано', 1200); } catch (e) { say_(t, 4000); } }
  function areaName(a) { var m = { city: 'Город', flat: 'Квартира Марьи', dock: 'Старая верфь', neon: 'Неоновый квартал', green: 'Ботанический бульвар', biz: 'Стеклянный квартал', p1_store: '«Перекрёсток»', p3_dixie: 'Дикси', p3_horror: 'Дикси × Светофор' }; return m[a] || a; }

  /* =====================================================================
     ВКЛАДКИ
     ===================================================================== */
  function tabPow(b) {
    var x = X();
    phLine(b, 'Изменения работают сразу и сохраняются. Пока хоть одно включено — на экране значок «🧪 DEV».', 13);
    phSec(b, 'Персонаж');
    chips(b, '🏃 Скорость ходьбы и бега', [[.5, '×0.5'], [1, '×1'], [1.5, '×1.5'], [2, '×2'], [3, '×3'], [5, '×5']], x.speed, function (v) { x.speed = v; });
    chips(b, '🦘 Высота прыжка', [[1, '×1'], [1.5, '×1.5'], [2, '×2'], [3, '×3']], x.jump, function (v) { x.jump = v; });
    T_(b, '👻 Проход сквозь стены (noclip)', x.noclip, function (v) { x.noclip = v; });
    T_(b, '🛡️ Бессмертие (работает и без хаоса)', x.god, function (v) { x.god = v; });
    T_(b, '🫧 Бесконечный воздух под водой', x.air, function (v) { x.air = v; });
    D(b, '❤️ Вылечить полностью', function () { player.hp = 100; });
    D(b, '🔄 Сменить персонажа (Марья ↔ Гусь)', function () { closeModal(); setTimeout(function () { try { doSwitch(true); } catch (e) { say_('Сейчас нельзя: ' + e.message); } }, 60); });
    D(b, '🧲 Позвать спутника ко мне', function () { var p = player.pos; placeA(comp, p.x + 1.4, p.z + .8, player.yaw); comp.hidden = false; comp.g.visible = true; });
    phSec(b, 'Мир и физика');
    chips(b, '⏱ Скорость времени (вся игра)', [[.25, '×0.25'], [.5, '×0.5'], [1, '×1'], [2, '×2'], [3, '×3']], x.time, function (v) { x.time = v; });
    chips(b, '🪐 Гравитация', [[.3, 'Луна'], [.6, '×0.6'], [1, '×1'], [1.6, '×1.6'], [2.5, '×2.5']], x.grav, function (v) { x.grav = v; });
    T_(b, '🕰️ Часы мира идут', x.clock, function (v) { x.clock = v; try { WORLD.timeFlow = v; } catch (e) { } });
    phSec(b, 'Экран');
    T_(b, '🙈 Скрыть интерфейс (для скриншотов)', x.nohud, function (v) { x.nohud = v; });
    D(b, '↺ Сбросить все способности', function () { S.devx = Object.assign({}, DEF); try { WORLD.timeFlow = true; } catch (e) { } });
  }

  /* ---------- сюжет ---------- */
  function newQ() { return [['points', '💳 5 000 000 баллов Максима'], ['chek', '🧾 Чек из дыры'], ['svet', '🥩 Тайна Дикси и Светофора']]; }
  function tabStory(b) {
    var T = window.MG_STORY;
    phLine(b, 'Порядок основного сюжета: ' + MAIN.map(function (m) { return S.q[m.id] ? '✔' : '▫'; }).join(' ') + ' (' + MAIN.filter(function (m) { return S.q[m.id]; }).length + '/' + MAIN.length + ')', 14);
    D(b, '⏭️ Пропустить текущее основное задание', function () { skipStory(); });
    phSec(b, 'Все задания основного сюжета');
    MAIN.forEach(function (m) { var done = !!S.q[m.id]; rowBtn(b, (done ? '✔ ' : '▫ ') + m.icon + ' ' + m.title, m.id, done ? 'Снять' : 'Готово', function () { S.q[m.id] = !done; sv(); say_((done ? '↺ ' : '✔ ') + m.title, 1400); re(); }); });
    phLine(b, 'Отметка вручную меняет только флаг задания. Если сцена задания уже идёт — лучше пропустить её кнопкой выше.', 12);
    if (!T) return;
    phSec(b, 'Новые дела 1.13 — начать с начала');
    phLine(b, 'Выставляет нужные предыдущие задания, сбрасывает прогресс выбранного дела и переносит к его старту.', 12);
    DC(b, '💳 «5 000 000 баллов» — с начала', function () { prep('points'); closeModal(); enterFlat(false); }, 'старт: коробки с вещами в квартире');
    DC(b, '🧾 «Чек из дыры» — с начала', function () { prep('chek'); closeModal(); var d = MG_DIST && MG_DIST.dist.biz; if (d) setTimeout(function () { MG_DIST.travel(d); }, 80); }, 'старт: дыра в Стеклянном квартале');
    DC(b, '🥩 «Тайна Дикси и Светофора» — с начала', function () { prep('svet'); closeModal(); enterFlat(false); }, 'старт: кухня в квартире');
    DC(b, '♻️ Сбросить все новые дела 1.13', function () { newQ().forEach(function (q) { S.q[q[0]] = false; }); S.p13 = {}; setTimeout(function () { location.reload(); }, 600); }, 'перезапуск игры');
    if (window.MG_L14) storyL14(b);
    if (window.MG_L15) storyL15(b);
    if (window.MG_EXPAND) storyExp(b);
    var L = T.lvl;
    if (L && L.n === 1 && window.MG_L1) storyL1(b);
    if (window.MG_L2 && S.q.points && !S.q.chek) storyL2(b);
    if (L && L.n === 3 && window.MG_L3) storyL3(b);
  }
  function prep(id) {
    var order = ['ufo', 'points', 'chek', 'svet'], i = order.indexOf(id);
    STORY_ORDER.forEach(function (k) { S.q[k] = true; });
    order.forEach(function (k, j) { if (j < i) S.q[k] = true; else S.q[k] = false; });
    S.p13 = S.p13 || {}; for (var j = i; j < order.length; j++) delete S.p13[order[j]];
    if (id === 'points' && window.MG_L1) { var st = MG_L1.ST; Object.assign(st, { points: 5000000, spent: 0, race: false, raceDone: false, tasting: 0, jeton: false, key: false, gusFree: false, gusGone: false, tags: 0, tagsDone: false, finale: false, talked: false, silence: 0, vip: false, sincere: false, milestone: false, entered: false }); MG_L1.OFFERS.forEach(function (o) { o.done = false; }); }
    if (id === 'chek' && window.MG_L2) { var K2 = MG_L2.K2; if (K2.receipt && K2.kb) { K2.kb.g.remove(K2.receipt); K2.receipt = null; } }
    if (window.MG_STORY) MG_STORY.lvl = null;
    comp.hidden = false;
  }
  function storyExp(b) {
    var E = MG_EXPAND, st = E.force === null ? 'по сюжету' : (E.force ? 'включено вручную' : 'выключено вручную');
    phSec(b, '🏝️ Расширение «почти дом» — ' + (E.active ? 'активно' : 'нет') + ' (' + st + ')');
    phLine(b, 'В игре появляется само после финала сюжетки №15. Здесь можно включить заранее. Первое включение строит мир ~1–3 с.' + (E.built ? ' Построено за ' + E.stats.ms + ' мс, домов ' + (E.stats.houses || 0) + '.' : ''), 12);
    D(b, '✅ Включить сейчас', function () { E.set(true); say_('🏝️ Расширение включено', 1400); closeModal(); });
    D(b, '⛔ Выключить', function () { E.set(false); say_('Расширение выключено, забор на месте', 1400); closeModal(); });
    D(b, '🔁 Как по сюжету', function () { E.force = null; E.sync(); say_(E.active ? 'По сюжету: включено' : 'По сюжету: выключено', 1400); closeModal(); });
    if (!E.active) return;
    (E.lm || []).filter(function (l) { return !/🛣️/.test(l.e) || /Набережная|Дачная/.test(l.n); }).forEach(function (l) {
      D(b, l.e + ' → ' + l.n, function () { var p = E.spotNear(l.x, l.z); if (!p) { say_('Нет места рядом', 1200); return; } closeModal(); if (player.drive) try { exitVehicle(); } catch (e) { } if (player.drive) { say_("Сначала выйди из машины", 1400); return; } placeA(player, p.x, p.z, 0); showComp(p.x + 1.4, p.z + .6); });
    });
  }
  function storyL15(b) {
    var M = MG_L15, q = M.Q(), f = q.f, d = M.dev, R = M.ride();
    phSec(b, '🫖 Сюжетка №15 «Чэай~» (тест, только здесь) — часть ' + (q.part || 0) + '/4' + (q.done ? ' · пройдена' : ''));
    phLine(b, 'В обычной игре этой сюжетки нет: ни в «Списке дел», ни в мире. Части: 1 — хлебный мир, 2 — мир Светофора, 3 — мир Хаоса, 4 — почти дом.', 12);
    DC(b, '🍞 Часть 1 — хлебный мир (с начала)', function () { closeModal(); setTimeout(function () { d.start(1); }, 60); }, 'прогресс сюжетки №15 сбрасывается');
    DC(b, '🚦 Часть 2 — мир Светофора', function () { closeModal(); setTimeout(function () { d.start(2); }, 60); });
    DC(b, '🌪️ Часть 3 — мир Хаоса', function () { closeModal(); setTimeout(function () { d.start(3); }, 60); });
    DC(b, '🏠 Часть 4 — почти дом', function () { closeModal(); setTimeout(function () { d.start(4); }, 60); });
    if (q.part) D(b, '▶️ Продолжить с текущей части', function () { closeModal(); setTimeout(function () { d.resume(); }, 60); });
    D(b, '⏩ Пропустить заезд / бой у кассы / охрану теста', function () { var r = d.skip(); say_(r ? '⏩ Пропущено' : 'Сейчас нечего пропускать', 1400); });
    if (q.part === 1) D(b, '🍞 Выпечка готова (сразу к королю)', function () { d.flags(['bIntro', 'bKing', 'bKnead', 'bGuard', 'bBake']); });
    if (q.part === 2) D(b, '🎫 Все три купона', function () { d.flags(['sIntro', 'cHigh', 'cLow', 'cMax']); });
    if (q.part === 3) D(b, '⚙️ Все три детали', function () { d.flags(['cIntro', 'pRoof', 'pFount', 'pDk']); });
    if (q.part === 4) D(b, '🔎 Все проверки «это дом?»', function () { d.flags(['hIntro', 'hReveal', 'hPhone', 'hPig', 'hLight']); });
    T_(b, '🫖 «Чэай~» вместо «чай» в репликах', !!q.chai, function (v) { d.chai(v); });
    DC(b, '♻️ Сбросить сюжетку №15', function () { d.reset(); closeModal(); }, 'перенос к подъезду, «чэай~» выключается');
  }
  function storyL14(b) {
    var M = MG_L14, q = M.Q(), f = q.f, d = M.dev;
    phSec(b, '🕳️ «Дыра в центре города» — этап ' + q.stage + '/5');
    phLine(b, 'Этапы: 0 — дыра на перекрёстке, 1 — тёмный мир, 2 — путь к хлебозаводу, 3 — хлебозавод, 4 — борьба за батон, 5 — финал.', 12);
    DC(b, '🕳️ Начать дело с начала', function () { d.restart(); closeModal(); }, 'все прежние дела отмечаются выполненными, перенос на главный перекрёсток');
    D(b, '🌑 В тёмный мир (без вступления)', function () { closeModal(); setTimeout(function () { d.dark(); }, 60); });
    D(b, '🟢 Выдать 3 осколка портала', function () { d.shards(); });
    D(b, '🏭 На хлебозавод (проходная)', function () { closeModal(); setTimeout(function () { d.fab(); }, 60); });
    phLine(b, 'Завод: ' + [['pass', 'пропуск'], ['door', 'пультовая'], ['robot', 'робот'], ['power', 'линия'], ['crate', 'ящик'], ['flour', 'мука'], ['duct', 'заслонка'], ['thaw', 'оттаял'], ['starter', 'закваска'], ['rubber', 'резина'], ['baked', 'батон 1'], ['fed', 'обжора'], ['giant', 'великан'], ['got', 'батон']].map(function (x) { return (f[x[0]] ? '✔' : '▫') + x[1]; }).join(' '), 12);
    D(b, '👻 Призрак и пультовая решены', function () { d.flags(['pass', 'door']); });
    D(b, '🤖 Робот выключен, линия включена', function () { d.flags(['pass', 'door', 'robot', 'power']); });
    D(b, '🪞 Мука добыта', function () { d.flags(['crate', 'flour']); });
    D(b, '🥶 Закваска добыта', function () { d.flags(['duct', 'thaw', 'starter']); });
    D(b, '🍞 Обжора занят, Великан ушёл', function () { d.flags(['pass', 'door', 'robot', 'power', 'crate', 'flour', 'duct', 'thaw', 'starter', 'rubber', 'baked', 'fed', 'giant']); });
    D(b, '🥖 Сразу к борьбе за батон', function () { closeModal(); setTimeout(function () { d.tug(); }, 60); });
    D(b, '⏩ Завершить текущую часть борьбы', function () { d.skipTug(); });
  }
  function storyL1(b) {
    var st = MG_L1.ST, q = MG_L1.Q();
    phSec(b, '🛒 Сейчас: «Перекрёсток» — задания');
    function push() { q.st = JSON.parse(JSON.stringify(st)); }
    D(b, '💳 Баллы потрачены (3 000 000+)', function () { if (st.spent < 3e6) { st.points -= 3e6 - st.spent; st.spent = 3e6; } st.talked = true; push(); });
    D(b, '🛒 Гонка пройдена', function () { st.race = false; st.raceDone = true; push(); });
    D(b, '🍢 Дегустация пройдена (+жетон)', function () { st.tasting = 4; st.jeton = true; push(); });
    D(b, '🪿 Гусь освобождён', function () { st.gusGone = true; st.key = true; st.gusFree = true; comp.hidden = false; comp.g.visible = true; var p = player.pos; placeA(comp, p.x + 1.4, p.z + .8); push(); });
    D(b, '🏷️ Ценники исправлены', function () { st.tags = 5; st.tagsDone = true; push(); });
    phLine(b, MG_L1.allDone() ? '✔ Все задания выполнены — иди к выходу из магазина для финала.' : 'Финал запускается у выхода, когда выполнены все пять заданий.', 13);
  }
  function storyL2(b) {
    var q = MG_L2.Q();
    phSec(b, '🧾 «Чек из дыры» — этап ' + q.stage + '/3');
    if (q.stage === 1) D(b, '🧾 Поймать чек сразу', function () { closeModal(); setTimeout(function () { MG_L2.caught(); }, 60); });
    if (q.stage === 2) D(b, '🧩 Все три улики → финал', function () { q.clues = [true, true, true]; closeModal(); setTimeout(function () { cutscene(function () { return MG_L2.finale(); }); }, 60); });
  }
  function storyL3(b) {
    var s = MG_L3.S3, K = MG_L3.K;
    phSec(b, '🥩 Сейчас: Дикси × Светофор');
    T_(b, '🛡️ Монстры не ловят (сотрудники и мясо)', X().safe3, function (v) { X().safe3 = v; });
    if (K.hor) {
      D(b, '🪪 Выдать бейдж', function () { s.badge = true; });
      D(b, '🚪 Открыть турникет', function () { s.badge = true; s.passed = true; if (K.turnCol) { K.turnCol.on = false; K.turnV.visible = false; } s.checkpoint = { x: 34, z: -13 }; });
      D(b, '🔧 Выдать 3 предохранителя', function () { s.badge = true; s.passed = true; if (K.turnCol) { K.turnCol.on = false; K.turnV.visible = false; } s.fuseGot = [true, true, true]; s.fuses = 3; if (!s.meatT) s.meatT = .01; });
      D(b, '📍 К главному щитку (запуск погони там)', function () { closeModal(); placeA(player, K.hor.ox + 22.6, K.hor.oz - 33.4, -Math.PI / 2); });
    }
  }

  /* ---------- навигация ---------- */
  function tabNav(b) {
    var p = player.drive ? player.drive.pos : player.pos, x = X();
    phLine(b, '📍 ' + areaName(area) + ' · x ' + f1(p.x) + ' · z ' + f1(p.z) + (player.drive ? ' · в машине' : ''), 15);
    D(b, '📋 Скопировать координаты', function () { copy(area + ' ' + f1(p.x) + ' ' + f1(p.z)); });
    D(b, '🎯 Телепорт к текущей цели', function () { var o = objective(); if (!o || !o.p) throw new Error('у цели нет точки'); closeModal(); placeA(player, o.p.x, o.p.z + 1.2, player.yaw); if (!player.drive) placeA(comp, o.p.x + 1.4, o.p.z + 2); });
    phSec(b, 'Телепорт по координатам (в этой области)');
    var i = inputRow(b, 'x z  (например: 40 -16)', 'Туда', function (v) { var m = String(v).trim().split(/[\s,;]+/).map(Number); if (m.length < 2 || !isFinite(m[0]) || !isFinite(m[1])) { say_('Нужно два числа: x и z'); return; } closeModal(); placeA(player, m[0], m[1], player.yaw); placeA(comp, m[0] + 1.4, m[1] + .8); });
    phSec(b, 'Места');
    var spots = [['🏙️ В город (центр)', function () { if (area === 'city') { teleportTo(14, 14); return; } MG_STORY.moveTo('city', 14, 14, 0, ''); }],
      ['🏠 Квартира Марьи', function () { enterFlat(false); }],
      ['🛒 Дикси (дверь в город)', function () { goCity(40, -14); }],
      ['🌊 Озеро «Гусиное» (берег)', function () { if (typeof LAKE_G === 'undefined') throw new Error('нет озера'); goCity(LAKE_G.x + LAKE_G.rx + 4, LAKE_G.z); }]];
    spots.forEach(function (s) { rowBtn(b, s[0], '', 'Туда', function () { closeModal(); setTimeout(function () { try { s[1](); } catch (e) { say_('Ошибка: ' + e.message, 2600); } }, 60); }); });
    if (window.MG_DIST) MG_DIST.defs.forEach(function (d) { rowBtn(b, (d.emoji || '📍') + ' ' + d.name, 'район', 'Туда', function () { closeModal(); setTimeout(function () { MG_DIST.travel(d); }, 60); }); });
    phSec(b, 'Мои точки');
    var pts = S.devPts = S.devPts || [];
    inputRow(b, 'Название точки', 'Сохранить', function (v) { pts.push({ n: (v || 'Точка ' + (pts.length + 1)).slice(0, 30), a: area, x: +f1(p.x), z: +f1(p.z) }); sv(); re(); });
    if (!pts.length) phLine(b, 'Пока нет сохранённых точек.', 13);
    pts.forEach(function (t, k) { rowBtn(b, '📌 ' + t.n, areaName(t.a) + ' · ' + t.x + ', ' + t.z, 'Туда', function () { closeModal(); if (t.a === area) { placeA(player, t.x, t.z, player.yaw); placeA(comp, t.x + 1.4, t.z + .8); } else MG_STORY.moveTo(t.a, t.x, t.z, 0, ''); }); });
    if (pts.length) DC(b, '🗑️ Удалить все мои точки', function () { S.devPts = []; });
  }
  function goCity(x, z) { if (area === 'city') teleportTo(x, z); else MG_STORY.moveTo('city', x, z, 0, ''); }

  /* ---------- вода и машины ---------- */
  function tabWater(b) {
    var W = window.MG_WATER, v = player.drive;
    if (W) phLine(b, '🌊 Воздух: ' + Math.round((W.o2 || 0) * 100) + '% · ' + (W.swim ? 'плывёшь (глубина ' + f1(W.swim.dep) + ' м)' : 'не в воде'), 14);
    T_(b, '🫧 Бесконечный воздух', X().air, function (on) { X().air = on; });
    D(b, '🌊 К озеру (берег)', function () { closeModal(); goCity(LAKE_G.x + LAKE_G.rx + 4, LAKE_G.z); });
    D(b, '🏊 Прямо в центр озера', function () { closeModal(); goCity(LAKE_G.x, LAKE_G.z); });
    phSec(b, 'Машины');
    phLine(b, v ? '🚗 Сейчас в машине: износ ' + Math.round(v.dmg || 0) + '%' + (v.flooded ? ' · затоплена' : '') + (v.wet ? ' · в воде ' + Math.round(v.wet) + ' с' : '') : 'Сейчас не в машине.', 14);
    D(b, '🔧 Починить все машины', function () { var n = 0; VEHS.forEach(function (c) { if ((c.dmg || 0) > 0 || c.dead || c.flooded) { repairCar(c); n++; } }); say_('🔧 Починено: ' + n, 1600); });
    if (v) {
      D(b, '💥 Повредить мою машину на 30%', function () { carDamage(v, 30, 'self'); });
      D(b, '🌊 Почти затопить (29 с в воде)', function () { v.wet = 29.5; say_('Заедь в воду — через секунду машина заглохнет'); });
      D(b, '🔧 Починить мою машину', function () { repairCar(v); });
    }
    D(b, '🚗 Вызвать «Копейку» рядом', function () { closeModal(); summonVehicle('kopeyka'); });
  }

  /* ---------- предметы ---------- */
  function tabItems(b) {
    var inv = invOf(), cnt = {}; inv.forEach(function (k) { cnt[k] = (cnt[k] || 0) + 1; });
    phLine(b, '🎒 ' + player.name + ': ' + inv.length + ' шт. · 💰 ' + fmt(money()), 14);
    devAmount(b);
    phSec(b, 'Выдать предмет');
    Object.keys(ITEMS).sort(function (a, c) { return (cnt[c] || 0) - (cnt[a] || 0) || ITEMS[a][1].localeCompare(ITEMS[c][1]); }).forEach(function (k) {
      var it = ITEMS[k]; rowBtn(b, it[0] + ' ' + it[1] + (cnt[k] ? ' ×' + cnt[k] : ''), k, '+1', function () { addItem(k); say_(it[0] + ' +1', 900); re(); });
    });
    phSec(b, 'Очистка');
    DC(b, '🧹 Убрать всё, кроме скейта, телефона и баллончиков', function () { var keep = ['skate', 'phone', 'spray']; var a = invOf(); for (var i = a.length - 1; i >= 0; i--) if (keep.indexOf(a[i]) < 0) a.splice(i, 1); });
  }

  /* ---------- бизнесы ---------- */
  function tabBiz(b) {
    var B = window.MG_BIZ; if (!B) { phLine(b, 'Модуль бизнесов не загружен.'); return; }
    var d = B.S12(), cds = Object.keys(d.cd || {}).filter(function (k) { return d.cd[k] > Date.now(); });
    phLine(b, '⏳ Активных перерывов: ' + cds.length + ' · ⚡ скорость: ' + (B.buffOn('speed') ? Math.ceil(B.buffLeft('speed') / 1000) + ' с' : 'нет') + ' · 📈 заработок: ' + (B.buffOn('earn') ? Math.ceil(B.buffLeft('earn') / 1000) + ' с' : 'нет'), 13);
    D(b, '⏳ Сбросить перерывы всех подработок', function () { d.cd = {}; });
    D(b, '⚡ Бафф скорости на 10 минут', function () { B.setBuff('speed', 600000); });
    D(b, '📈 Бафф заработка +15% на 10 минут', function () { B.setBuff('earn', 600000); });
    D(b, '🧺 Обновить товар на рынке «Блошка»', function () { d.mk = { t: 0, stock: [] }; });
    var acc = d.bank[player.id] || (d.bank[player.id] = { amt: 0, t: Date.now() });
    D(b, '🏦 +100 000 ₽ на вклад в «Гусбанке»', function () { acc.amt += 100000; if (!acc.t) acc.t = Date.now(); }, 'сейчас: ' + fmt(acc.amt));
    D(b, '🏦 Начислить проценты за 1 час', function () { acc.t -= 3600000; });
    phSec(b, 'Статистика заработка');
    var s = d.stats || {}; var keys = Object.keys(s); if (!keys.length) phLine(b, 'Пока пусто.', 13);
    keys.forEach(function (k) { phLine(b, k + ': ' + s[k], 13); });
  }

  /* ---------- ачивки ---------- */
  function tabAch(b) {
    S.ach = S.ach || {}; var got = ACH.filter(function (a) { return S.ach[a[0]]; }).length;
    phLine(b, '🏆 Открыто: ' + got + ' / ' + ACH.length, 15);
    D(b, '🏆 Открыть все (без всплывающих окон)', function () { ACH.forEach(function (a) { S.ach[a[0]] = true; }); });
    DC(b, '↺ Закрыть все', function () { S.ach = {}; });
    ACH.forEach(function (a) { var on = !!S.ach[a[0]]; rowBtn(b, (on ? '🏆 ' : '▫ ') + a[1], a[2], on ? 'Закрыть' : 'Открыть', function () { if (on) delete S.ach[a[0]]; else S.ach[a[0]] = true; sv(); re(); }); });
  }

  /* ---------- сохранение ---------- */
  function tabSave(b) {
    var key = slotKey(SAVE_SLOT), raw = ''; try { raw = localStorage.getItem(key) || ''; } catch (e) { }
    var bak = null; try { bak = JSON.parse(localStorage.getItem(key + '_devbak') || 'null'); } catch (e) { }
    phLine(b, '💾 Слот ' + SAVE_SLOT + ' · ' + Math.round(raw.length / 1024) + ' КБ · ключ ' + key, 13);
    D(b, '💾 Сохранить сейчас', function () { fullSave(true); });
    D(b, '🗂️ Сделать резервную копию DEV', function () { fullSave(false); localStorage.setItem(key + '_devbak', JSON.stringify({ at: Date.now(), data: localStorage.getItem(key) })); }, bak ? 'есть копия от ' + new Date(bak.at).toLocaleString('ru-RU') : 'копии нет');
    if (bak) DC(b, '⏪ Восстановить из резервной копии DEV', function () { localStorage.setItem(key, bak.data); setTimeout(function () { location.reload(); }, 400); }, 'игра перезапустится');
    D(b, '📋 Скопировать код сохранения', function () { fullSave(false); copy(btoa(unescape(encodeURIComponent(JSON.stringify(S))))); });
    phSec(b, 'Что внутри сохранения');
    var parts = Object.keys(S).map(function (k) { var n = 0; try { n = JSON.stringify(S[k]).length; } catch (e) { } return [k, n]; }).sort(function (a, c) { return c[1] - a[1]; }).slice(0, 12);
    parts.forEach(function (p) { phLine(b, p[0] + ' — ' + (p[1] > 1024 ? Math.round(p[1] / 1024) + ' КБ' : p[1] + ' Б'), 13); });
    phSec(b, 'Флаги DEV');
    DC(b, '🧪 Выключить DEV-панель (убрать значок из телефона)', function () { S.dev = false; S.devx = Object.assign({}, DEF); closeModal(); setTimeout(function () { location.reload(); }, 300); }, 'вернуть — ⚙️ Настройки → код');
  }

  /* ---------- отладка ---------- */
  function tabDbg(b) {
    var info = renderer && renderer.info ? renderer.info : null, R = info && info.render || {}, M = info && info.memory || {};
    phLine(b, '⚡ ' + DEVX.fps + ' FPS · вызовов отрисовки ' + (R.calls || 0) + ' · треугольников ' + (R.triangles || 0).toLocaleString('ru-RU'), 14);
    if (window.MG_PERF) phLine(b, '🚀 Оптимизация: ' + (MG_PERF.on ? 'вкл' : 'выкл') + ' · далёких объектов скрыто ' + MG_PERF.hidden + ' из ' + MG_PERF.total + ' · дальность ' + Math.round(MG_PERF.limit()) + ' м', 13);
    phLine(b, '🧠 Геометрий ' + (M.geometries || 0) + ' · текстур ' + (M.textures || 0) + ' · область «' + areaName(area) + '»', 14);
    var cnt = function (v) { try { return v.length; } catch (e) { return '—'; } };
    phLine(b, '👥 Персонажей ' + cnt(actors) + ' · прохожих ' + cnt(peds) + ' · машин ' + cnt(VEHS) + ' · коллайдеров ' + cnt(cols) + ' · точек действия ' + cnt(inters), 13);
    D(b, '🔄 Обновить цифры', function () { });
    if (window.MG_GFX) T_(b, '📈 Счётчик FPS на экране', !!MG_GFX.opt.fps, function (v) { MG_GFX.setOpt('fps', v); });
    if (window.MG_DEBUG) D(b, '🧱 Показать коллайдеры рядом (F9)', function () { closeModal(); MG_DEBUG.toggle(true); });
    T_(b, '🙈 Скрыть интерфейс', X().nohud, function (v) { X().nohud = v; });
    phSec(b, 'Журнал ошибок (' + DEVX.log.length + ')');
    if (!DEVX.log.length) phLine(b, '✔ Ошибок не было с момента запуска.', 13);
    DEVX.log.slice(-15).reverse().forEach(function (l) { var d = phLine(b, l.t + ' · ' + l.k + ' · ' + l.m, 12); d.style.wordBreak = 'break-word'; });
    if (DEVX.log.length) { D(b, '📋 Скопировать журнал', function () { copy(DEVX.log.map(function (l) { return l.t + ' [' + l.k + '] ' + l.m; }).join('\n')); }); D(b, '🧹 Очистить журнал', function () { DEVX.log.length = 0; }); }
  }

  var RENDER = { pow: tabPow, story: tabStory, nav: tabNav, water: tabWater, items: tabItems, biz: tabBiz, ach: tabAch, save: tabSave, dbg: tabDbg };

  /* =====================================================================
     ВСТРОЙКА
     ===================================================================== */
  var css = el('style'); css.textContent = '#tabs.mg-dt{flex-wrap:wrap;right:0;gap:3px;padding:0 8px}#tabs.mg-dt .tab{font-size:13px;padding:4px 7px}' +
    'body.mg-nohud #hud,body.mg-nohud #controls,body.mg-nohud #topBtns,body.mg-nohud #mini,body.mg-nohud #toast,body.mg-nohud #mg-wbtn,body.mg-nohud #mg-fab,body.mg-nohud #mg-hud,body.mg-nohud #s1hud,body.mg-nohud #mg-dot,body.mg-nohud #mg-devbadge{display:none!important}' +
    '#mg-devbadge{position:fixed;left:calc(env(safe-area-inset-left,0px) + 8px);bottom:calc(env(safe-area-inset-bottom,0px) + 6px);z-index:9;background:rgba(122,74,216,.9);color:#fff;font:800 11px system-ui,sans-serif;padding:3px 8px;border-radius:9px;pointer-events:none;display:none}';
  document.head.appendChild(css);
  var badge = el('div', '', '🧪 DEV'); badge.id = 'mg-devbadge'; document.body.appendChild(badge);

  var installed = false;
  function install() {
    if (installed || typeof renderDev !== 'function' || typeof renderPhone !== 'function' || typeof worldReady === 'undefined' || !worldReady) return;
    installed = true;
    var orig = renderDev;
    window.renderDev = renderDev = function (b) {
      var own = RENDER[devTab];
      try { orig(b); } catch (e) { console.error('[DEV orig]', e); }
      phTabs(ALL_TABS, devTab, function (k) { devTab = k; });
      $('tabs').classList.add('mg-dt');
      if (own) { try { own(b); } catch (e) { console.error('[DEV ' + devTab + ']', e); phLine(b, '⚠️ Ошибка вкладки: ' + e.message, 13); } }
    };
    function step(f) { try { f(); } catch (e) { console.error('[DEV install step]', e); } }   // каждый перехват независим: отсутствие одной функции не ломает остальные
    var rp = renderPhone;
    window.renderPhone = renderPhone = function () { var t = $('tabs'); if (t) t.classList.remove('mg-dt'); return rp.apply(this, arguments); };
    // скорость ходьбы
    step(function () {
    if (typeof updPlayer !== 'function') return;
    var up = updPlayer;
    window.updPlayer = updPlayer = function (dt) {
      var c = player, px = c.pos.x, pz = c.pos.z, foot = !c.drive && !c.target && !c.ovr;
      up(dt);
      try { var sp = X().speed; if (foot && !c.drive && sp !== 1 && !c.lock) { c.pos.x = px + (c.pos.x - px) * sp; c.pos.z = pz + (c.pos.z - pz) * sp; if (!X().noclip) collide(c.pos, .35, c.feet); } } catch (e) { }
    };
    });
    // проход сквозь стены
    step(function () {
    if (typeof collide !== 'function') return;
    var co = collide;
    window.collide = collide = function (p, r, feet) { try { if (X().noclip && (p === player.pos || (player.drive && p === player.drive.pos))) return false; } catch (e) { } return co(p, r, feet); };
    });
    // бессмертие
    step(function () {
    if (typeof hurtPlayer !== 'function') return;
    var hp = hurtPlayer;
    window.hurtPlayer = hurtPlayer = function (n) { if (X().god) return; return hp.apply(this, arguments); };
    });
    // время, гравитация, прыжок — через RCV (события хаоса тоже меняют RCV: множители складываются, а не перезаписываются)
    step(function () {
    if (typeof RCV === 'undefined') return;
    try {
      var base = { slow: RCV.slow || 1, g: RCV.g || 1, jump: RCV.jump || 1 }, mul = { slow: 'time', g: 'grav', jump: 'jump' };
      ['slow', 'g', 'jump'].forEach(function (k) { delete RCV[k]; Object.defineProperty(RCV, k, { configurable: true, enumerable: true, get: function () { return (base[k] || 1) * (X()[mul[k]] || 1); }, set: function (v) { base[k] = (v === undefined || v === null) ? 1 : v; } }); });
    } catch (e) { console.error('[DEV RCV]', e); }
    });
    // покадрово: воздух, монстры, значок, интерфейс, часы
    step(function () {
    if (typeof updEnv !== 'function') return;
    var pe = updEnv;
    window.updEnv = updEnv = function (dt, t) {
      pe(dt, t);
      try {
        var x = X();
        if (x.air && window.MG_WATER) MG_WATER.o2 = 1;
        if (x.safe3 && window.MG_L3 && MG_L3.S3 && area === 'p3_horror') MG_L3.S3.grace = Math.max(MG_L3.S3.grace || 0, .5);
        if (!x.clock && typeof WORLD !== 'undefined') WORLD.timeFlow = false;
        document.body.classList.toggle('mg-nohud', !!x.nohud);
        badge.style.display = (typeof S !== 'undefined' && S && S.dev && anyOn()) ? 'block' : 'none';
      } catch (e) { }
    };
    });
    console.log('[DEV] расширенная DEV-панель подключена');
  }
  var iv = setInterval(function () { try { install(); } catch (e) { console.error('[DEV install]', e); } if (installed) clearInterval(iv); }, 300);
  DEVX.tabs = ALL_TABS; DEVX.render = RENDER; DEVX.prep = prep; DEVX.anyOn = anyOn;
})();
