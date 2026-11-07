/* =====================================================================
   СЮЖЕТКА №1 — «5 000 000 БАЛЛОВ МАКСИМА»
   Вещи Марьи (квартира) → маршрутка → Стеклянный квартал (дыра) → «Перекрёсток» (5 заданий) →
   приход Максима, миллионный покупатель, плевок → финал: дыра стала больше. Часть основного сюжета.
   ===================================================================== */
(function () {
  'use strict';
  var T = window.MG_STORY, D = window.MG_DIST, PI = Math.PI;
  if (!T || !D) { console.error('[LEVEL1] нет каркаса'); return; }
  var built = false, L = null, K = {}, STORE = null, HX = -47, HZ = 40, DOOR = { x: -40.4, z: 6 };
  var ST = { points: 5000000, spent: 0, race: false, raceDone: false, tasting: 0, jeton: false, key: false, gusFree: false, gusGone: false, tags: 0, tagsDone: false, finale: false, talked: false, silence: 0, vip: false, sincere: false };
  var OFFERS = [
    { id: 'sausage', t: '🌭 Годовой запас сосисок (1 000 шт.)', p: 600000, d: 'Доставят к двери. К какой — не уточняют.' },
    { id: 'sale', t: '🏷️ Акция «−5% на всё, что ты уронишь»', p: 150000, d: 'Действует только на пол.' },
    { id: 'cheese', t: '🧀 Памятник Максиму из сыра', p: 1200000, d: 'Установят прямо здесь. Сыр свежий, портрет — похож.' },
    { id: 'cart', t: '🛒 Личная тележка с подогревом сидений', p: 900000, d: 'Сидений нет. Подогрев есть.' },
    { id: 'rename', t: '✏️ Право переименовать один товар', p: 400000, d: 'Навсегда. Пока не заметит санинспекция.' },
    { id: 'plush', t: '🧸 Плюшевый Гусь-талисман', p: 250000, d: 'Смотрит осуждающе. Как настоящий.' },
    { id: 'moon', t: '🌙 Билет на Луну (в одну сторону)', p: 1500000, d: 'Отправление «когда-нибудь». Багаж — только жвачка.' },
    { id: 'bread', t: '🍞 Хлеб (1 шт.)', p: 40, d: 'Обычный хлеб. Самое дешёвое в каталоге. Самое подозрительное.' },
    { id: 'sincere', t: '😊 Охранник скажет «Приятного дня» искренне', p: 300000, d: 'Редкая услуга. Он готовился.' },
    { id: 'silence', t: '🤫 Минута тишины в магазине', p: 500000, d: 'Все замрут. Даже холодильники — почти.' }
  ];
  function fmtP(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }

    function rng(s) { return D.rngf(s); }
  /* ---------- магазин ---------- */
  var DEPT = { veg: ['🍅', '🥕', '🍎', '🥦', '🍌', '🥔'], dairy: ['🥛', '🧀', '🍦', '🥚'], bake: ['🍞', '🥐', '🥖'], meat: ['🥩', '🍗', '🐟'], groc: ['🥫', '🍝', '🍚', '🧂', '☕'], drink: ['🥤', '🧃', '🍾', '🧉'], freeze: ['🍦', '🥟', '🍕', '🧊'], chem: ['🧴', '🧼', '🧻', '🪥'], promo: ['🎁', '🏷️', '🍫'] };
  function shelf(k, x, z, len, vertical, dept, seed, color) {
    var R = rng(seed), cl = [0xd8342a, 0x2e86c1, 0xf1c40f, 0x27ae60, 0x8e44ad, 0xe67e22], w = vertical ? .9 : len, d = vertical ? len : .9;
    k.b(w, 2.3, d, color || 0xc9ccd2, x, 0, z);
    for (var t = 0; t < 4; t++) { var y = .35 + t * .5; var c = cl[Math.floor(R() * cl.length)]; k.m(G.box, c, vertical ? [.1, .34, len - .3] : [len - .3, .34, .1], vertical ? [x + .46, y + .2, z] : [x, y + .2, z + .46]); k.m(G.box, cl[Math.floor(R() * cl.length)], vertical ? [.1, .34, len - .3] : [len - .3, .34, .1], vertical ? [x - .46, y + .2, z] : [x, y + .2, z - .46]); }
    var n = Math.max(2, Math.floor(len / 2.4)); for (var i = 0; i < n; i++) { var e = DEPT[dept][Math.floor(R() * DEPT[dept].length)]; var p = -len / 2 + (i + .5) * len / n; k.emoji(e, .55, vertical ? x + .55 : x + p, 1.0 + (i % 3) * .45, vertical ? z + p : z + .55); }
  }
  function buildStore(k) {
    var R = rng(77), W = 60, Dp = 46;
    k.plane(W + 6, Dp + 6, 0xdad8cf, 0, 0, 0);
    for (var i = -26; i <= 26; i += 4) k.plane(.08, Dp, 0xc9c6bb, i, 0, .02);
    k.b(W, 5.4, .8, 0xf2efe6, 0, 0, -Dp / 2); k.b(.8, 5.4, Dp, 0xf2efe6, -W / 2, 0, 0); k.b(.8, 5.4, Dp, 0xf2efe6, W / 2, 0, 0);
    k.b(W / 2 - 3, 5.4, .8, 0xf2efe6, -W / 4 - 1.5, 0, Dp / 2); k.b(W / 2 - 3, 5.4, .8, 0xf2efe6, W / 4 + 1.5, 0, Dp / 2);
    k.bp(W, .4, Dp, 0xeeeae0, 0, 5.4, 0);
    for (var lx = -24; lx <= 24; lx += 12) for (var lz = -18; lz <= 18; lz += 12) k.m(G.box, 0xfffbe8, [4, .1, .9], [lx, 5.3, lz]);
    k.m(G.box, 0xa8d4f0, [6, 3.6, .2], [0, 1.8, Dp / 2 - .05]); k.col(-3, 3, Dp / 2 - .4, Dp / 2 + .4, 3.6); k.sign('ВЫХОД', 3, .6, 0, 4.4, Dp / 2 - .5, PI, '#1d7a3a', '#ffffff', { ds: true });
    k.sign('ПЕРЕКРЁСТОК', 10, 1.4, 0, 4.4, -Dp / 2 + .5, 0, '#2e8a4a', '#ffffff');
    // — отделы вдоль стен
    k.sign('ОВОЩИ · ФРУКТЫ', 7, .8, -22, 4.2, -17, 0, '#2f8a3a', '#fff'); for (var v = 0; v < 4; v++) { k.b(3.4, .9, 1.8, 0x8a6a42, -27 + v * 3.9 + (v > 1 ? 1 : 0), 0, -19.5); for (var q = 0; q < 5; q++) k.emoji(DEPT.veg[(v + q) % 6], .6, -28.4 + v * 3.9 + q * .7 + (v > 1 ? 1 : 0), 1.2, -19.5); }
    k.sign('МОЛОЧНЫЙ ОТДЕЛ', 8, .8, -29.2, 4.0, -4, PI / 2, '#2e86c1', '#fff', { ds: true }); shelf(k, -28.4, -4, 14, true, 'dairy', 5, 0xdde6f0); K.milkSign = k.sign('Молоко · 89 ₽', 3, .5, -27.9, 2.7, -4, PI / 2, '#fff', '#2e86c1', { ds: true });
    k.sign('ЗАМОРОЗКА', 6, .8, 29.2, 4.0, 2, -PI / 2, '#3a6aaa', '#fff', { ds: true }); shelf(k, 28.4, 2, 12, true, 'freeze', 9, 0xdbe8f4);
    k.b(10, 3.4, .5, 0xe4eaf0, 24, 0, -22.2); k.m(G.box, 0xa8d4f0, [9, 2.6, .12], [24, 1.7, -21.9]); k.sign('МЯСО · РЫБА', 6, .8, 24, 4.4, -22.4, 0, '#b0123a', '#fff');
    // хлеб/пекарня
    k.b(8, 1.1, 2, 0xe0c898, 22, 0, -9); k.m(G.box, 0xf2f2f2, [8, .1, 2], [22, 1.15, -9]); for (var br = 0; br < 6; br++) k.emoji(DEPT.bake[br % 3], .7, 19 + br * 1.2, 1.7, -9); k.sign('ПЕКАРНЯ', 5, .7, 22, 3.4, -9, 0, '#c8782a', '#fff', { ds: true });
    k.baker = k.npc('s1_baker', 'Пекарь', { top: 0xffffff, pants: 0xdddddd, hair: 0xe8e8e8, hairStyle: 'short', skin: 0xe0b08a, scale: 1 }, 22, -10.8, 0);
    // — три двойных ряда стеллажей по центру
    var rows = [[-16, 'groc'], [-9, 'drink'], [-2, 'chem']];
    rows.forEach(function (r, i) { shelf(k, -7, r[0], 13, false, r[1], 20 + i, 0xc9ccd2); shelf(k, 9, r[0], 13, false, i === 1 ? 'promo' : r[1], 30 + i, 0xc9ccd2); });
    k.sign('БАКАЛЕЯ', 4, .6, 1, 3.6, -16, 0, '#e67e22', '#fff', { ds: true }); k.sign('НАПИТКИ', 4, .6, 1, 3.6, -9, 0, '#27ae60', '#fff', { ds: true }); k.sign('ХИМИЯ · ДОМ', 4, .6, 1, 3.6, -2, 0, '#8e44ad', '#fff', { ds: true });
    // — кассы
    for (var c = 0; c < 5; c++) { var cx = -16 + c * 7; k.b(2.6, 1.0, 1.2, 0x3a3d44, cx, 0, 11); k.m(G.box, 0x1d1d1d, [2.4, .1, 3.2], [cx, 1.0, 12.6]); k.m(G.box, 0x9fc4dc, [.9, .7, .5], [cx - .6, 1.4, 11]); k.sign('' + (c + 1), .7, .7, cx, 3.1, 10.6, 0, '#1d2129', '#ffd23f', { ds: true }); K['till' + c] = { x: cx, z: 11 }; }
    k.m(G.box, 0x2a3a5a, [.3, 2.5, 1.6], [-19.8, 1.25, 12]); k.m(G.box, 0x2a3a5a, [.3, 2.5, 1.6], [19.8, 1.25, 12]);
    for (var s = 0; s < 2; s++) { var sx = 22 + s * 4; k.b(1.4, 1.5, 1.0, 0x2e86c1, sx, 0, 16); k.m(G.box, K.glow ? 0 : 0x6aa8ff, [1.1, .7, .1], [sx, 1.3, 15.45]); k.sign('САМО-КАССА', 1.5, .3, sx, 2.6, 16, 0, '#1f4f8a', '#fff', { ds: true }); }
    // тележки (стойка)
    for (var cr = 0; cr < 5; cr++) { k.b(.9, .8, 1.3, 0xb8bec6, -25 + cr * 1.1, .4, 17.5, { cam: false }); k.m(G.box, 0xd8342a, [.95, .08, 1.35], [-25 + cr * 1.1, 1.2, 17.5]); }
    k.sign('ТЕЛЕЖКИ', 4, .5, -23, 2.6, 19.8, PI, '#d8342a', '#fff', { ds: true });
    // информационная стойка и бонусный киоск
    k.b(5, 1.1, 1.4, 0xf2c230, -21, 0, 6); k.sign('СПРАВКА · БОНУСНЫЙ КИОСК', 6, .7, -21, 3.1, 6, 0, '#1d2129', '#ffd23f', { fs: .45, ds: true }); k.emoji('💳', 1, -21, 1.8, 6);
    k.raisa = k.npc('s1_raisa', 'Раиса Павловна', { top: 0xd8342a, pants: 0x1d1d28, hair: 0xe8b8d0, hairStyle: 'bun', skin: 0xf0c8a0, scale: .96 }, -21, 4.7, 0);
    // дегустация
    k.b(4, 1.0, 1.4, 0xff7a3a, 22, 0, -2); k.sign('ДЕГУСТАЦИЯ!', 4, .6, 22, 2.6, -2, 0, '#ff7a3a', '#fff', { ds: true }); k.emoji('🍢', .8, 21, 1.5, -2); k.emoji('🧀', .8, 23, 1.5, -2);
    k.promo = k.npc('s1_promo', 'Промоутер', { top: 0x6aff9a, pants: 0x2a2a3a, hair: 0xff3a8a, hairStyle: 'short', skin: 0xdba784, scale: 1 }, 22, -3.6, 0);
    // охрана и морозильная камера (Гусь)
    k.b(8, 3.4, .5, 0xdfe8f0, 24, 0, -13.2); k.b(.5, 3.4, 8.2, 0xdfe8f0, 20.2, 0, -17.2, { cam: true });
    k.m(G.box, 0xa8d4f0, [3.4, 2.6, .12], [24, 1.7, -12.9]); k.sign('МОРОЗИЛЬНАЯ КАМЕРА', 6, .6, 24, 3.1, -13.1, 0, '#3a6aaa', '#fff', { ds: true }); K.freezer = { x: 24, z: -12.4 };
    k.guard = k.npc('s1_guard', 'Охранник', { top: 0x1d2a3a, pants: 0x1d2a3a, hair: 0x222222, hairStyle: 'short', skin: 0xe0b08a, scale: 1.1 }, 26, 18.6, PI);
    k.cashiers = []; for (var q = 0; q < 3; q++) k.cashiers.push(k.npc('s1_cash' + q, 'Кассир', { top: 0xd8342a, pants: 0x1d1d28, hair: [0x5a2a1a, 0x1d1d1d, 0xc8a050][q], hairStyle: q === 1 ? 'bun' : 'short', skin: 0xe0b08a, scale: .98 }, -16 + q * 7, 9.8, 0));
    // ценники (5 штук) — в разных отделах
    K.tagSpots = [[-26.8, -4, 'dairy'], [-24, -19, 'veg'], [-7, -9.8, 'drink'], [22, -7.8, 'bake'], [28.2, 6.2, 'freeze']];
    // служебная дверь
    k.m(G.box, 0x5a6a7a, [3, 3.2, .15], [0, 1.6, -Dp / 2 + .45]); k.sign('ТОЛЬКО ДЛЯ СОТРУДНИКОВ', 3.4, .4, 0, 3.4, -Dp / 2 + .5, 0, '#d8342a', '#fff', { ds: true });
    // покупатели (патруль между проходами)
    var looks = [{ top: 0x4a7ac8, pants: 0x3a3a3a }, { top: 0xc86a4a, pants: 0x2a3a4a }, { top: 0x6ac86a, pants: 0x4a3a2a }, { top: 0xc8c84a, pants: 0x3a2a4a }, { top: 0x9a4ac8, pants: 0x2a2a2a }, { top: 0xdddddd, pants: 0x5a4a3a }];
    var lanes = [[-14, -19.5], [14, -12.5], [-14, -5.5], [14, 0], [0, 6], [-14, 6]];
    K.custs = looks.map(function (lk, i) { var a = k.npc('s1_cu' + i, 'Покупатель', Object.assign({ hair: [0x2a1a0a, 0x7a3a1a, 0x1d1d1d, 0xc8a050][i % 4], hairStyle: i % 2 ? 'bun' : 'short', skin: [0xe0b08a, 0xf0c8a0, 0xd8a888][i % 3], scale: .9 + (i % 3) * .06 }, lk), lanes[i][0], lanes[i][1], 0); a.lane = lanes[i]; a.wp = i; return a; });
  }
  var PATROL = [[-9, -19.5], [14, -19.5], [14, -12.5], [-14, -12.5], [-14, -5.5], [14, -5.5], [14, 1], [-14, 1], [-3, 6], [-14, 6]];
  function custTick(dt) {
    if (!K.custs || area !== 'p1_store') return;
    K.custs.forEach(function (a) { if (ST.silence > 0) { a.target = null; a.moving = false; return; } if (!a.target && !a.waiting) { a.waiting = 1 + Math.random() * 2.5; } if (a.waiting) { a.waiting -= dt; if (a.waiting <= 0) { a.waiting = 0; a.wp = (a.wp + 1 + (Math.random() < .3 ? 1 : 0)) % PATROL.length; var p = PATROL[a.wp]; a.target = { x: K.store.ox + p[0], z: K.store.oz + p[1] }; a.tspeed = 1.6; a.collide = true; } } });
    if (ST.silence > 0) ST.silence -= dt;
  }

  /* ====================== ПРОЦЕСС ====================== */
  async function say_(l) { return say(l); }
  function pts() { return fmtP(ST.points) + ' б.'; }
  function hud() {
    var e = document.getElementById('s1hud');
    if (!e) { e = document.createElement('div'); e.id = 's1hud'; e.style.cssText = 'position:fixed;right:calc(env(safe-area-inset-right,0px) + 10px);top:calc(env(safe-area-inset-top,0px) + 70px);z-index:6;background:rgba(14,20,18,.82);color:#9dff9d;border:1px solid rgba(157,255,157,.4);border-radius:12px;padding:6px 12px;font:800 14px system-ui,sans-serif;pointer-events:none'; document.body.appendChild(e); }
    e.style.display = (area === 'p1_store') ? 'block' : 'none'; e.innerHTML = '💳 Карта Максима: ' + pts() + '<br><small style="opacity:.8">Потрачено: ' + fmtP(ST.spent) + '</small>';
  }
  function tasksLine() { return (ST.spent >= 3000000 ? '✔' : '▫') + ' Баллы  ' + (ST.raceDone ? '✔' : '▫') + ' Гонка  ' + (ST.tasting >= 4 ? '✔' : '▫') + ' Дегустация  ' + (ST.gusFree ? '✔' : '▫') + ' Гусь  ' + (ST.tagsDone ? '✔' : '▫') + ' Ценники'; }
  function allDone() { return ST.spent >= 3000000 && ST.raceDone && ST.tasting >= 4 && ST.gusFree && ST.tagsDone; }
  function updObj() {
    if (!L || area !== 'p1_store') return;
    if (ST.finale) { T.setObj(null); return; }
    var s = 'p1_store';
    if (allDone()) { T.setObj('🔴 Всё сделано. Идём к выходу.', s, 0, 20); return; }
    if (!ST.talked) { T.setObj('🛒 Подойти к справке и бонусному киоску.', s, -21, 7.2); return; }
    var m = tasksLine() + '\n';
    if (ST.gusGone && !ST.gusFree) { T.setObj(m + '🔴 Найти Гуся. Он «на секундочку» отошёл.', ST.jeton || ST.sincere ? s : s, ST.key ? 24 : 0, ST.key ? -11 : 0); if (ST.key) return; T.setObj(m + '🔴 Найти Гуся: спроси у людей, у охраны.', s, 26, 17); return; }
    if (ST.spent < 3000000) { T.setObj(m + '💳 Потратить баллы в бонусном киоске (3 000 000+).', s, -21, 7.2); return; }
    if (!ST.raceDone) { T.setObj(m + '🛒 Гонка на тележке по акции — стойка тележек.', s, -23, 16); return; }
    if (ST.tasting < 4) { T.setObj(m + '🍢 Дегустация у промоутера.', s, 22, -1); return; }
    if (!ST.tagsDone) { T.setObj(m + '🏷️ Исправить ценники (' + ST.tags + '/5).', s, -21, 7.2); return; }
  }


  /* ====================== ИНТЕГРАЦИЯ В ОСНОВНОЙ МИР ====================== */
  function Q() { return T.P('points'); }
  function persist() {
    var q = Q(); q.st = JSON.parse(JSON.stringify(ST)); q.offers = OFFERS.filter(function (o) { return o.done; }).map(function (o) { return o.id; });
    q.tagDone = (K.tagDone || []).slice(); T.save();
  }
  function restoreST() {
    var q = Q(); if (q.st) Object.assign(ST, q.st);
    OFFERS.forEach(function (o) { o.done = (q.offers || []).indexOf(o.id) >= 0; });
    if (K.tagDone && q.tagDone) q.tagDone.forEach(function (v, i) { K.tagDone[i] = !!v; if (v && K.tagItems && K.tagItems[i]) K.tagItems[i].off = true; });
  }
  function resetST() { Object.assign(ST, { points: 5000000, spent: 0, race: false, raceDone: false, tasting: 0, jeton: false, key: false, gusFree: false, gusGone: false, tags: 0, tagsDone: false, finale: false, talked: false, silence: 0, vip: false, sincere: false, milestone: false, entered: false }); OFFERS.forEach(function (o) { o.done = false; }); }
  function bizK() { return D.built.biz && D.built.biz.K; }
  function doorW() { var kb = bizK(); return { x: kb.ox + DOOR.x, z: kb.oz + DOOR.z }; }
  function holeW() { var kb = bizK(); return { x: kb.ox + HX, z: kb.oz + HZ }; }

  /* 1) Квартира Марьи: «Вещи Марьи» — здесь всё начинается */
  function flatAvail() { return !!(S.q.ufo && !S.q.points && Q().stage === 0); }
  function installFlat() {
    // используем уже существующую точку «Коробки с вещами» в квартире Марьи: тот же предмет, новая история
    var it = inters.find(function (i) { return i.area === 'flat' && /Коробки с вещами/.test(i.label); });
    if (!it) { it = { area: 'flat', p: { x: FLX - 1.4, z: FLZ + 2 }, r: 1.4, label: '📦 Коробки с вещами', act: function () { } }; addI(it); }
    var base = it.label, act0 = it.act;
    Object.defineProperty(it, 'label', { get: function () { return flatAvail() ? '📦 Вещи Марьи — в кошельке что-то блестит…' : base; }, set: function (v) { base = v; }, configurable: true });
    it.act = function () { if (flatAvail()) flatStart(); else act0(); };
  }
  async function flatStart() {
    await cutscene(async function () {
      await say([['marya', 'Гусь, смотри что я нашла в своих вещах. Карта лояльности. «Перекрёсток». Чья это…'], ['gus', 'Там написано «Максим». Это что, твоего бывшего?'], ['marya', 'Максим, бывший. Видимо, забыл. Или оставил как напоминание. Или как приманку.'], ['gus', 'Давай проверим баланс. Просто из любопытства. Мы же не воры. Мы — исследователи.']]);
      sfx('click'); banner('💳 Карта лояльности', 'Баланс загружается…'); await wait(1600);
      banner('💳 БАЛАНС: 5 000 000 баллов', 'Максим Н.'); sfx('coin'); await wait(2400);
      await say([['gus', 'ПЯТЬ. МИЛЛИОНОВ. БАЛЛОВ.'], ['marya', 'Это… это же как, сколько в рублях?'], ['gus', 'Один балл — один рубль. Но кассиры никогда не считают честно.'], ['marya', 'Мы идём в «Перекрёсток». Всё потратим. Всё до последнего балла.'], ['gus', 'А это точно законно?'], ['marya', 'Это точно «Перекрёсток».'], ['gus', 'Ближайший — в Стеклянном квартале. Маршрутка с остановки «Новый квартал».']]);
      resetST(); var q = Q(); q.stage = 1; persist(); sfx('ding'); toast('📋 Новое дело: 💳 5 000 000 баллов Максима', 4200);
    });
  }

  /* 2) Подсказка цели */
  T.hints.push(function () {
    if (!S.q.ufo || S.q.points) return null; var q = Q();
    if (q.stage === 0) return { t: '🔴 Новое дело: «5 000 000 баллов Максима». Загляни в вещи Марьи (квартира).', p: area === 'city' ? FLAT_DOOR : (area === 'flat' ? { x: FLX - 1.15, z: FLZ + 1.7 } : null) };
    if (T.lvl) return null;
    if (area === 'city' || area === 'flat') return { t: '🚌 «Перекрёсток» — в Стеклянном квартале. Маршрутка на остановке «Новый квартал».', p: area === 'flat' ? FLAT_DOOR : { x: 214, z: 30 } };
    if (area === 'biz' && bizK()) return { t: '🛒 «Перекрёсток» — западный блок, у дороги.', p: doorW() };
    return null;
  });

  /* 3) Стеклянный квартал: здание «Перекрёсток», дыра, ограждение */
  function attachBiz(kb) {
    var k = kb; K.biz = kb;
    k.b(30, 12, 22, 0x2e8a4a, -58, 0, 6); k.m(G.box, 0xf2f2f2, [30.4, 2.4, 22.4], [-58, 12.6, 6]); k.m(G.box, 0xd8342a, [30.6, .6, 22.6], [-58, 11.6, 6]);
    k.m(G.box, 0xa8d4f0, [.2, 5, 20], [-42.9, 3.6, 6]); k.m(G.box, 0x1d2129, [.3, 4, 7], [-42.85, 2, 6]); k.m(G.box, 0xa8d4f0, [.2, 3.8, 6.4], [-42.7, 2, 6]);
    k.sign('ПЕРЕКРЁСТОК', 22, 3, -42.6, 9.6, 6, PI / 2, '#ffffff', '#2e8a4a', { fs: .58 }); k.emoji('🛒', 3, -42.5, 10.4, -3.5);
    k.sign('Каждый день — бонусные баллы!', 12, 1, -42.6, 6.6, 6, PI / 2, '#d8342a', '#ffffff', { fs: .5 });
    k.bench(-41.2, -2, PI / 2); k.bench(-41.2, 14, PI / 2);
    k.addBiz('perek', DOOR.x, DOOR.z, '🛒 «Перекрёсток»', function () { enterStore(); }, 3.4);
    // дыра в асфальте на пути от остановки к «Перекрёстку»
    K.hole = T.hole(k, HX, HZ, 1.5);
    K.fence = new THREE.Group(); k.g.add(K.fence);
    for (var a = 0; a < 10; a++) { var an = a / 10 * PI * 2, c = new THREE.Mesh(new THREE.ConeGeometry(.2, .7, 8), new THREE.MeshLambertMaterial({ color: 0xff7a1a })); c.position.set(k.ox + HX + Math.cos(an) * 2.7, .35, k.oz + HZ + Math.sin(an) * 2.7); K.fence.add(c); }
    K.holeCol = k.colC(HX, HZ, 3.0, 1.2); K.holeColBig = k.colC(HX, HZ, 6.5, 1.2); K.holeColBig.on = false;
    holeState();
  }
  function holeState() {
    if (!K.hole) return; var q = Q(), done = !!S.q.points, show = done || q.stage >= 1;
    K.hole.g.visible = show; K.fence.visible = show && !done; K.holeCol.on = show && !done; K.holeColBig.on = show && done;
    if (done) K.hole.set(6.2); else if (!K.hole.shown) K.hole.set(1.5); K.hole.shown = show;
  }
  D.hooks.push(function (id, kb) { if (id === 'biz') attachBiz(kb); });

  var holeSeen = false;
  async function holeScene() {
    if (holeSeen) return; holeSeen = true; var hw = holeW();
    await cutscene(async function () {
      await T.shotW(hw.x + 7, 3.6, hw.z - 5, hw.x, .2, hw.z, 1100);
      await say([['gus', 'Эй, там дыра в асфальте. Круглая. Чёрная. Светится изнутри.'], ['marya', 'Наверное, коммунальщики. Ограждение же поставили.'], ['gus', 'Она… как будто чуть дышит.'], ['marya', 'Гусь. Мы идём за пятью миллионами баллов. Не отвлекайся.'], ['gus', 'Да. Баллы. Конечно. Не смотрю.']]);
      await T.shotOff(900); Q().stage = 2; T.save(); toast('🛒 Дверь «Перекрёстка» — на западе квартала.', 3200);
    });
  }
  T.ticks.push(function () {
    if (area !== 'biz' || !bizK()) return; var hw = holeW();
    if (Q().stage === 1 && !S.q.points && Math.hypot(player.pos.x - hw.x, player.pos.z - hw.z) < 16) holeScene();
    holeState();
  });
  T.alwaysTick = true;

  /* 4) вход в магазин / выход */
  async function enterStore() {
    var q = Q();
    if (!S.q.ufo || q.stage === 0) { toast('«Перекрёсток» закрыт на учёт. Загляни позже.', 2800); return; }
    if (S.q.points) { toast('«Перекрёсток» закрыт после сегодняшнего. Приходите завтра.', 3000); return; }
    if (q.stage === 1) { q.stage = 2; holeSeen = true; }
    T.begin(1); L = T.lvl; buildStoreOnce(); restoreST();
    await T.go('p1_store', 0, 19.5, PI, '🛒 «ПЕРЕКРЁСТОК»');
    if (ST.gusGone && !ST.gusFree) { comp.hidden = true; comp.g.visible = false; }
    if (!ST.entered) {
      ST.entered = true; persist();
      await cutscene(async function () {
        await T.shotTo('p1_store', 0, 4.4, 14, 0, 3, -6, 900);
        await say([['gus', 'Свет. Музыка. Запах горячего хлеба. Я в раю.'], ['marya', 'Не забудь: у нас задача. Потратить баллы красиво. С умом. С размахом.'], ['voice', '«Дорогие покупатели! В магазине действует акция: купите три товара, четвёртый не подорожает!»'], ['gus', 'Какая щедрость.']]);
        await T.shotOff(800);
      });
      toast('🧭 Цели — слева вверху. Начни со справки.', 4200);
    }
  }
  async function leaveStore() {
    var d = doorW(); T.endLvl(); L = null;
    await T.moveTo('biz', d.x + 2.6, d.z, PI / 2, '');
    if (ST.gusGone && !ST.gusFree) { comp.hidden = true; comp.g.visible = false; }
    persist();
  }
  function buildStoreOnce() {
    if (built) return; built = true;
    K.store = T.makeArea('p1_store', 120); T.build('p1_store', buildStore); STORE = K.store;
    T.ticks.push(function (dt) { try { custTick(dt); hud(); } catch (e) { console.error(e); } });
    T.ticks.push(function () { try { if (L) updObj(); } catch (e) { console.error(e); } });
    var pu = updPlayer; window.updPlayer = updPlayer = function (dt) { var c = player, px = c.pos.x, pz = c.pos.z, on = !c.drive; pu(dt); try { if (T.lvl && T.lvl.n === 1 && ST.race && on && !c.drive) { c.pos.x = px + (c.pos.x - px) * 1.6; c.pos.z = pz + (c.pos.z - pz) * 1.6; collide(c.pos, .35, c.feet); } } catch (e) { } };
    wireStore();
  }
  function installAll() { if (installAll.done) return; installAll.done = true; installFlat(); }
  var iv = setInterval(function () { if (typeof worldReady !== 'undefined' && worldReady && typeof FLX !== 'undefined' && typeof addI === 'function') { installAll(); clearInterval(iv); } }, 300);

  function wireStore() {
    var k = K.store, A = function (x, z, label, fn, r, ok) { return T.act('p1_store', x, z, label, fn, r, ok); };
    // справка и киоск
    A(-21, 7.4, '💳 Справка и бонусный киоск', kiosk, 3.0);
    // тележки
    A(-23, 16.4, '🛒 Взять тележку — гонка по акции', cartRace, 2.6, function () { return !ST.race && !ST.raceDone; });
    // дегустация
    A(22, -1.2, '🍢 Дегустация', tasting, 2.6, function () { return ST.tasting < 4; });
    // охранник
    A(26, 17.2, '🛡️ Поговорить с охранником', guardTalk, 2.8);
    // морозильная камера
    A(K.freezer.x, K.freezer.z + 1.2, '❄️ Морозильная камера', freezer, 2.8, function () { return ST.gusGone && !ST.gusFree; });
    // кассирши (подсказки)
    k.cashiers.forEach(function (c, i) { T.act('p1_store', -16 + i * 7, 8.4, '💬 Кассир', function () { clue('cash', i); }, 2.2, function () { return ST.gusGone && !ST.gusFree; }); });
    T.act('p1_store', 22, -7.5, '🥖 Пекарь', function () { clue('baker'); }, 2.2, function () { return ST.gusGone && !ST.gusFree; });
    // ценники
    K.tagSpots.forEach(function (t, i) { var it = A(t[0], t[1], '🏷️ Подозрительный ценник', function (o) { tag(i, o); }, 2.2, function () { return ST.talked && !K.tagDone[i]; }); K.tagItems = K.tagItems || []; K.tagItems[i] = it; });
    K.tagDone = [false, false, false, false, false];
    // выход (финал)
    A(0, 21.2, '🚪 Выйти из магазина', finale, 3.4, function () { return allDone() && !ST.finale; });
    A(0, 21.2, '🚪 Выйти на улицу (позже можно вернуться)', function () { toast('Задания ещё не закончены. Прогресс сохранён — вернёшься и продолжишь.', 2800); leaveStore(); }, 3.0, function () { return !allDone(); });
  }

  /* — киоск баллов */
  async function kiosk() {
    if (!ST.talked) { await cutscene(async function () { await say([['raisa', 'Добрый день! Я — Раиса Павловна. Справка, бонусы, претензии, иногда — исповедь.'], ['marya', 'У нас карта на 5 000 000 баллов.'], ['raisa', '…Это шутка?'], ['marya', 'Нет.'], ['raisa', '*тихо* Девочка, у нас в базе такого числа нет. Оно разрывает таблицу. Ладно. Вот каталог, в нём всё, на что можно потратить баллы. Нужно потратить минимум три миллиона — иначе «Перекрёсток» запишет вас в еретики.'], ['gus', 'Я пока посмотрю сосиски. Я на секундочку.']]); ST.talked = true; persist(); }); await vanishGus(); toast('📋 Задания: баллы, гонка, дегустация, Гусь, ценники.', 4200); }
    menu();
  }
  async function vanishGus() { ST.gusGone = true; persist(); comp.hidden = true; comp.g.visible = false; await wait(200); toast('🔎 Гусь куда-то отошёл…', 3000); }
  function menu() {
    MG_BIZ && MG_BIZ.menu ? MG_BIZ.menu('💳 Бонусный каталог · ' + pts(), function (b, re) {
      var note = document.createElement('div'); note.style.cssText = 'font-size:15px;opacity:.8;margin:6px 0'; note.textContent = 'Потрачено: ' + fmtP(ST.spent) + ' · нужно: 3 000 000'; b.appendChild(note);
      OFFERS.forEach(function (o) { if (o.done) return; rowBtn(b, o.t + ' — ' + fmtP(o.p) + ' б.', o.d, 'Купить', function () { buyOffer(o, re); }, ST.points < o.p); });
      if (ST.spent >= 3000000) { var d = document.createElement('div'); d.style.cssText = 'margin-top:8px;font-weight:800'; d.textContent = '✔ Минимум потрачен. Остальное можно оставить на финал.'; b.appendChild(d); }
    }) : 0;
  }
  async function buyOffer(o, re) {
    if (ST.points < o.p) return;
    closeModal();
    await cutscene(async function () {
      if (o.id === 'rename') { var c = await ask('lbl', 'Что переименуем? (Молоко · 89 ₽)', ['«Молоко (бывшее)»', '«Корова приветствует вас»', '«Не пей меня»']); K.milkSign.material.map = null; K.store.rename = c; try { var nm = ['Молоко (бывшее)', 'Корова приветствует вас', 'Не пей меня'][c] || 'Молоко'; var t2 = canvasTex(512, 85, function (g, W, H) { g.fillStyle = '#fff'; g.fillRect(0, 0, W, H); g.fillStyle = '#2e86c1'; g.font = '900 ' + Math.round(H * .5) + 'px Rubik, Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(nm, W / 2, H / 2, W * .92); }); K.milkSign.material.map = t2; K.milkSign.material.needsUpdate = true; } catch (e) { } await say([['marya', 'Отлично. Теперь это «' + ['Молоко (бывшее)', 'Корова приветствует вас', 'Не пей меня'][c] + '». Законно ли это?'], ['raisa', 'Нет. Но каталог разрешает.']]); }
      else if (o.id === 'cheese') { var kk = K.store; kk.m(G.cyl, 0xf2c230, [2.6, .5, 2.6], [-19, .25, 8.8]); kk.m(G.cyl, 0xf2c230, [1.8, 2.2, 1.8], [-19, 1.6, 8.8]); kk.m(G.sph, 0xf5cf40, [1.4, 1.4, 1.4], [-19, 3.2, 8.8]); kk.m(G.sph, 0x222222, [.2, .2, .2], [-19.3, 3.3, 9.4]); kk.m(G.sph, 0x222222, [.2, .2, .2], [-18.7, 3.3, 9.4]); kk.m(G.box, 0xb8860b, [.6, .08, .1], [-19, 3.0, 9.5]); kk.sign('МАКСИМ · 1 ШТ. · СЫР', 3.4, .5, -19, .9, 9.9, 0, '#2a1d00', '#ffd23f', { ds: true }); await T.shotTo('p1_store', -14, 3.4, 13, -19, 2.4, 8.8, 900); await say([['gus', 'Это Максим. Из сыра. Один в один. Даже обиженное лицо!'], ['marya', 'Гусь, ты откуда здесь?'], ['gus', '*издали* Я не здесь. Я хорошо слышу.']]); await T.shotOff(700); }
      else if (o.id === 'silence') { ST.silence = 10; toast('🤫 Минута тишины. (Сокращённая: 10 секунд.)', 3000); await say([['voice', '«Уважаемые покупатели! Объявляется минута тишины. Просим не шуршать пакетами».'], ['marya', 'Мы только что заставили магазин замолчать.']]); }
      else if (o.id === 'moon') await say([['raisa', 'Билет оформлен. Отправление «когда-нибудь». Багаж — жвачка.'], ['gus', 'А вернуться можно?'], ['raisa', 'В каталоге нет такой кнопки.']]);
      else if (o.id === 'sausage') await say([['raisa', 'Тысяча сосисок. Холодовая цепь соблюдена. Доставка — по обстоятельствам.'], ['gus', '*из пустоты* ТЫСЯЧА?!']]);
      else if (o.id === 'cart') { ST.vip = true; await say([['raisa', 'Тележка с подогревом. Сиденья мы вам не обещали.']]); }
      else if (o.id === 'plush') { try { ITEMS.plush13 = ['🧸', 'Плюшевый Гусь-талисман', 'Смотрит осуждающе.']; addItem('plush13'); } catch (e) { } await say([['raisa', 'Талисман. В инвентаре — ждёт хозяина.']]); }
      else if (o.id === 'bread') { try { addItem('bread'); } catch (e) { } await say([['marya', 'Хлеб. За 40 баллов. Самая честная покупка за день.']]); }
      else if (o.id === 'sincere') { ST.sincere = true; await say([['raisa', 'Охранник предупреждён. Он репетировал перед зеркалом.']]); }
      else if (o.id === 'sale') await say([['raisa', 'Акция оформлена. Всё, что вы уроните, подешевеет на 5%.'], ['marya', 'А если уроним мясо?'], ['raisa', 'Тогда вас обслужит санитарная служба.']]);
      ST.points -= o.p; ST.spent += o.p; o.done = true; persist(); sfx('coin'); toast('💳 −' + fmtP(o.p) + ' б. · осталось ' + pts(), 2600);
      if (ST.spent >= 3000000 && !ST.milestone) { ST.milestone = true; await say([['raisa', 'Три миллиона потрачено. Вы официально самые щедрые люди в истории этой кассы.']]); sfx('ding'); banner('✔ Задание: Баллы', 'Потрачено 3 000 000+'); }
    });
    menu();
  }

  /* — гонка */
  var raceRings = [], raceT = 0, raceIdx = 0;
  async function cartRace() {
    ST.race = true; var K0 = K.store, pts_ = [[-25, 10], [-25, -6], [-6, -7.2], [16, -7.2], [16, -14], [0, -11], [0, 4]];
    await cutscene(async function () { await say([['marya', 'Тележка на акции! Нужно проехать по всем отметкам за ограниченное время.'], ['raisa', '*по громкой связи* Соблюдайте правила дорожного движения тележек. Их нет.']]); });
    raceRings.forEach(function (r) { K0.g.remove(r.s); }); raceRings = []; raceIdx = 0; raceT = ST.vip ? 60 : 48;
    pts_.forEach(function (p, i) { var s = emojiSprite(i === pts_.length - 1 ? '🏁' : '🟡', 1.4); s.position.set(K0.ox + p[0], 1.2, K0.oz + p[1]); K0.g.add(s); raceRings.push({ s: s, x: K0.ox + p[0], z: K0.oz + p[1] }); });
    toast('🛒 ГОНКА! ' + raceT + ' секунд. Беги через все отметки!', 3600);
    T.ticks.push(raceTick); T.lvl.obj = { t: '🛒 Гонка: отметка 1/' + pts_.length + ' (осталось ' + Math.ceil(raceT) + ' с)', p: { x: raceRings[0].x, z: raceRings[0].z } };
  }
  function raceTick(dt) {
    if (!ST.race || area !== 'p1_store' || !raceRings.length) return; raceT -= dt;
    var r = raceRings[raceIdx]; if (!r) return;
    if (Math.hypot(player.pos.x - r.x, player.pos.z - r.z) < 2.4) { K.store.g.remove(r.s); raceIdx++; sfx('coin'); if (raceIdx >= raceRings.length) { ST.race = false; ST.raceDone = true; persist(); raceRings = []; T.ticks.splice(T.ticks.indexOf(raceTick), 1); (async function () { await cutscene(async function () { await say([['raisa', 'Рекорд магазина! Тележка вернулась без вмятин, а вы — с гордостью.'], ['marya', 'Оно того стоило.']]); }); banner('✔ Задание: Гонка', 'Победа на тележке'); })(); return; } r = raceRings[raceIdx]; }
    if (raceT <= 0) { ST.race = false; raceRings.forEach(function (x) { K.store.g.remove(x.s); }); raceRings = []; T.ticks.splice(T.ticks.indexOf(raceTick), 1); toast('⏱️ Не успели. Тележка остыла. Попробуй ещё раз.', 3200); return; }
    T.lvl.obj = { t: '🛒 Гонка: отметка ' + (raceIdx + 1) + '/' + (raceRings.length + raceIdx) + ' · ' + Math.ceil(raceT) + ' с', p: { x: r.x, z: r.z } };
  }

  /* — дегустация */
  var SAMPLES = [['🥛', 'Йогурт со вкусом понедельника', 'Он густой, холодный и почему-то грустный. Ты съел до дна.', 'Он стоял в горле, как сессия. Пришлось запить.'], ['🌭', 'Колбаса «Тайна»', 'Колбаса сама себя расхваливала. Ты вежливо согласился.', 'Что-то хрустнуло. Это был не хлеб.'], ['🧀', 'Сыр, который смотрит', 'Смотрит. Ты не моргал. Он сдался первым.', 'Он смотрел. Ты проиграл в гляделки.'], ['🥤', 'Квас-эспрессо', 'Бодрит и пахнет булочной. Дикое сочетание. Вкусно.', 'Ты услышал музыку сфер. Они пели «хватит».']];
  async function tasting() {
    var s = SAMPLES[ST.tasting]; if (!s) return;
    await cutscene(async function () {
      if (ST.tasting === 0) await say([['promo', 'Дегустация! Бесплатно! В обмен на отзыв. Или просто молчаливое согласие.']]);
      await say([['promo', 'Образец №' + (ST.tasting + 1) + ': ' + s[1] + ' ' + s[0] + '. Готовы?']]);
      var g = await timing('trick', { label: 'Проглоти вовремя!', speed: 1.0, scale: 1.1 });
      await say([['sys', g >= 2 ? s[2] : s[3]]]);
      ST.tasting++; sfx('ding'); persist();
      if (ST.tasting >= 4) { ST.jeton = true; await say([['promo', 'Ты прошёл все четыре! Держи Жетон №7. Для чего? Не знаю. Но жетон красивый.']]); banner('✔ Задание: Дегустация', 'Получен Жетон №7'); }
    });
  }

  /* — охранник, Гусь, подсказки */
  async function guardTalk() {
    await cutscene(async function () {
      if (ST.key) { await say([['guard', 'Ключ уже у тебя. Не потеряй. Он не копируется.']]); return; }
      if (ST.sincere && ST.gusGone) { await say([['guard', 'Приятного дня. *пауза* Искренне. *слеза* Вот ключ от морозильной камеры. Там кто-то воет. Похоже на гуся.']]); ST.key = true; persist(); banner('🔑 Ключ от морозильной', 'Получен от охранника'); return; }
      if (!ST.gusGone) { await say([['guard', 'Проходите. Не трогайте тележки с табличкой «Не трогайте».']]); return; }
      var c = await ask('guard', 'Что-что? Гусь? Не видел. Ну… может, слышал.', ['Он в морозильной камере?', 'У меня есть жетон №7', 'Просто так спросила']);
      if (c === 0) { await say([['guard', 'Не имею права. Есть ключ — но только за жетон. Служебная инструкция №7.']]); }
      else if (c === 1) { if (ST.jeton) { await say([['guard', 'Жетон №7! Давно такого не видел. Лови ключ. Камера — на востоке.']]); ST.key = true; persist(); banner('🔑 Ключ от морозильной', 'Обменян на жетон'); } else await say([['guard', 'Покажи. …У тебя его нет. Дегустация у промоутера — иди, заработай.']]); }
      else await say([['guard', 'Приятного дня. *почти искренне*']]);
    });
  }
  var clueSeen = {};
  async function clue(who, i) {
    var key = who + i; await cutscene(async function () {
      if (who === 'cash') { var L_ = [['Гусь? Мимо кассы проходил белый. Сказал «я на секундочку». Минут десять назад.'], ['Он спросил, где мороженое. Я показала на заморозку. А там камера.'], ['Из морозильной слышится «га-га». Охрана не реагирует — у них инструкция.']]; await say([['cash', L_[i % 3][0]]]); }
      else await say([['baker', 'Гусь? Видел. Взял три круассана и ушёл на восток. Там камера, охрана, лёд — всё как он любит.']]);
      if (!clueSeen[key]) { clueSeen[key] = 1; var n = Object.keys(clueSeen).length; if (n === 2 && !ST.key) toast('💡 Гусь где-то на востоке. Охранник знает, как открыть камеру.', 4200); }
    });
  }
  async function freezer() {
    if (!ST.key) { toast('❄️ Закрыто. Изнутри — «га-га». Нужен ключ от охранника.', 3200); return; }
    await cutscene(async function () {
      await say([['marya', 'Гусь! Ты там?'], ['gus', '*глухо* Я в мороженом! Оно не заканчивается!'], ['marya', 'Держись, я открываю.']]);
      sfx('click'); var g = await timing('trick', { label: 'Поверни ключ точно!', speed: 1.0, scale: 1.2 });
      await say([['sys', g >= 2 ? 'Замок щёлкнул. Дверь распахнулась.' : 'Замок заело. Пришлось дёргать трижды.']]);
      ST.gusFree = true; persist(); comp.hidden = false; showComp(K.store.ox + 24, K.store.oz - 9.2);
      await say([['gus', 'Двадцать семь сортов! Я не хочу уходить. Я хочу остаться. Я хочу домой. Одновременно.'], ['marya', 'Пошли. У нас ещё ценники.']]);
      banner('✔ Задание: Гусь найден', 'Он доволен. Пока.');
    });
  }

  /* — ценники */
  var TAGS = [['dairy', 'Молоко', ['89 ₽ за литр', '8 900 ₽ за литр', 'Бесплатно (но с условиями)'], 0, 'Ценник: «Молоко — 8 900 ₽». Какой нужен?'], ['veg', 'Помидоры', ['120 ₽/кг', 'Один помидор — 1 000 000 ₽', 'Цена по настроению'], 0, 'Ценник: «Помидоры — один миллион». Какой верный?'], ['drink', 'Кола', ['Цена: 99 ₽', 'Цена: ???', 'Цена: душа'], 0, 'Ценник: «Кола — ???». Что написать?'], ['bake', 'Батон', ['45 ₽', '45 ₽ + налог на аромат', '45 лет'], 0, 'Ценник: «Батон — 45 лет». Какая верная цена?'], ['freeze', 'Пельмени', ['299 ₽ за пачку', '299 пачек за ₽', 'Пельмени бесплатные, тесто платное'], 0, 'Ценник: «Пельмени: 299 пачек за ₽». Верный вариант?']];
  async function tag(i, o) {
    if (K.tagDone[i]) return; var t = TAGS[i];
    await cutscene(async function () {
      var c = await ask('lbl', t[4], t[2]);
      if (c === t[3]) { K.tagDone[i] = true; o.off = true; ST.tags++; persist(); sfx('coin'); await say([['raisa', '*по рации* Принято. Ценник исправлен.']]); if (ST.tags >= 5) { ST.tagsDone = true; banner('✔ Задание: Ценники', 'Все 5 исправлены'); await say([['raisa', 'Вы настоящие работники месяца. Получите грамоту. Её нет. Но уважение есть.']]); } else toast('🏷️ Исправлено: ' + ST.tags + '/5', 2000); }
      else await say([['sys', 'Нет. Это бы вызвало пожар на кассе. Попробуй ещё раз.']]);
    });
  }

  /* ====================== ФИНАЛ ====================== */
  async function finale() {
    if (!allDone() || ST.finale) return; ST.finale = true; T.setObj(null); var K0 = K.store, sx = function (x) { return K0.ox + x; }, sz = function (z) { return K0.oz + z; };
    await cutscene(async function () {
      if (ST.points > 0) { await say([['marya', 'Остаток ' + pts() + '. Гусь, на самокассу.'], ['gus', 'Всё в одну кнопку. Прощай, баланс.']]); ST.spent += ST.points; ST.points = 0; sfx('coin'); toast('💳 Остаток списан: баланс 0 б.', 2600); }
      await say([['marya', 'Ну всё. Баллы потрачены. Можно уходить.'], ['gus', 'Пойдём пока никто не…']]);
      // Максим входит
      var mx = K0.npc('s1_maxim', 'Максим, бывший', { top: 0x3a6a3a, pants: 0x3a3a3a, hair: 0x4a2a1a, hairStyle: 'short', skin: 0xe0b08a, scale: 1.02 }, 0, 25.5, PI);
      var dsp = K0.npc('s1_stranger', 'Незнакомый мужчина', { top: 0x6a6a7a, pants: 0x2a2a2a, hair: 0x2a2a2a, hairStyle: 'short', skin: 0xd8a888, scale: 1.05 }, 8, 25.5, PI);
      K.maxim = mx; K.stranger = dsp; mx.hidden = false;
      await T.shotTo('p1_store', 0, 3.2, 14, 0, 1.6, 22, 900);
      await walkToSafe(mx, sx(0), sz(19.5), 4.2);
      await say([['ex', 'НАКОНЕЦ ТО Я ПРИШЕЛ ТРАТИТЬ СВОИ БАЛЛЫ!']]);
      await say([['gus', '*шёпотом* Максим. Вот сейчас будет весело.'], ['marya', '*шёпотом* Молчи и не дыши.']]);
      // Максим собирает тележку
      await T.shotOff(600); await T.shotTo('p1_store', 10, 6, 6, -4, 1.2, -4, 800);
      var cart = new THREE.Group(); cart.position.set(sx(-14), 0, sz(-1)); K0.g.add(cart); var cb = new THREE.Mesh(new THREE.BoxGeometry(1.6, .9, 2.6), new THREE.MeshLambertMaterial({ color: 0xb8bec6 })); cb.position.y = .9; cart.add(cb);
      var pile = []; ['🍞', '🥩', '🧀', '🍾', '🍌', '🧻', '🥫', '🍕', '🍫', '🥛', '🧴', '🍉'].forEach(function (e, i) { var sp = emojiSprite(e, .9); sp.position.set(-.5 + (i % 3) * .5, 1.6 + Math.floor(i / 3) * .3, -.9 + (i % 4) * .6); cart.add(sp); pile.push(sp); });
      var route = [[-14, -3], [-14, -16], [-2, -14.5], [12, -14.5], [12, -2], [0, 5], [-8, 8]];
      for (var r = 0; r < route.length; r++) { await walkToSafe(mx, sx(route[r][0]), sz(route[r][1]), 4); cart.position.set(mx.pos.x - Math.sin(mx.yaw) * 1.8, 0, mx.pos.z - Math.cos(mx.yaw) * 1.8); cart.rotation.y = mx.yaw; for (var e = 0; e < 3; e++) { var sp2 = emojiSprite(['🥩', '🍫', '🧃', '🍖', '🧀'][(r + e) % 5], .8); sp2.position.set(Math.random() - .5, 1.9 + r * .12, Math.random() * 2 - 1); cart.add(sp2); } }
      await T.shotOff(600);
      cart.position.set(sx(0), 0, sz(8.8)); await walkToSafe(mx, sx(0), sz(8.2), 3);
      await say([['sys', 'Тележка Максима: 412 позиций. Некоторые — спорные.']]);
      // к кассе подходит незнакомец с жвачкой
      await T.shotTo('p1_store', 7, 4.2, 4, 0, 1.4, 11, 800);
      await walkToSafe(dsp, sx(2.2), sz(9.4), 3.2); K0.emoji && 0;
      var gum = emojiSprite('🍬', .8); gum.position.set(0, 2.2, 0); dsp.g.add(gum);
      await say([['cash', 'Здравствуйте! Начнём с тележки. Карта лояльности?'], ['ex', 'Конечно! Максим Н. Все пять миллионов — на эту тележку!']]);
      sfx('click'); await wait(800); sfx('ding');
      await say([['cash', 'Сканирую… Баланс: ноль баллов.'], ['ex', '…'], ['ex', 'Как — НОЛЬ?!'], ['cash', 'Ноль баллов. Потрачены на сыр в форме вас.'], ['ex', 'НА ЧТО?!'], ['man', 'Эм… я только жвачку. Можно пробить?'], ['ex', '*дрожащим голосом* Да-да. Проходите. Я… пропущу вас. Мне теперь некуда торопиться.']]);
      await walkToSafe(dsp, sx(0), sz(10.6), 2.5);
      sfx('click'); await wait(700);
      await T.shotOff(300); await T.shotTo('p1_store', 3, 3.4, 15.5, 0, 1.7, 9.6, 700);
      T.confetti(K0, 0, 3.2, 9.6, 40); sfx('win');
      await say([['voice', '📢 «ПОЗДРАВЛЯЕМ! ВЫ — МИЛЛИОННЫЙ ПОКУПАТЕЛЬ «ПЕРЕКРЁСТКА»! ВАШ ПРИЗ — КУПОН НА ПОКУПКИ СТОИМОСТЬЮ 1 000 000 000 РУБЛЕЙ!»'], ['man', '…Чего?'], ['cash', 'Миллиардный купон. Только в нашем магазине. Только на продукты. Только до 2031 года.'], ['ex', '*еле слышно* …что.']]);
      await say([['man', 'Ладно, всё же ты меня пропустил вперед… я думаю я должен поблагодарить тебя…….']]);
      await wait(1500);
      await say([['man', 'Э, спасибо брат… Хотя за что спасибо? Сама судьба выбрала меня, а не ты! Эу, ты кем себя возомнил тут..']]);
      // плевок
      await T.shotOff(300); await T.shotTo('p1_store', -3, 2.6, 13.2, 0, 1.8, 9.2, 600);
      await spit(dsp, mx, K0);
      await wait(900);
      await say([['ex', '…']]);
      await walkToSafe(dsp, sx(6), sz(20), 3); await T.shotOff(700);
      // финал сцены
      await say([['cash', 'Следующий. Ой. Максим. Ваши баллы закончились. Ваша тележка — осталась. Ваш чек — на три метра.'], ['ex', 'Я… я пришёл потратить баллы. Я месяц копил. Это были мои — баллы. Мои.'], ['gus', '*шёпотом* Может, признаться?'], ['marya', '*шёпотом* Гусь. Он плюнут на голову. Ему и так плохо. Не добивай.']]);
      await say([['cash', 'Тележку, пожалуйста, сдайте на склад. Или оставьте себе. Мы не хотим это забирать.'], ['ex', '…Это же сыр на голове? Или плевок?'], ['guard', 'Приятного дня.'], ['ex', '*сидя на полу* Спасибо.']]);
    });
      // выход на улицу: дыра стала значительно больше
    var d = doorW(), hw = holeW(); T.endLvl(); L = null;
    await T.moveTo('biz', hw.x + 6.5, hw.z - 6.5, -2.4, '');
    await cutscene(async function () {
      K.hole.grow(6.2); K.fence.visible = false; await T.shotW(hw.x + 12, 5.2, hw.z - 12, hw.x, .2, hw.z, 1400);
      await wait(1800);
      await say([['gus', 'Марья. Смотри.'], ['marya', 'Она… выросла. Раньше была как люк.'], ['gus', 'Теперь как… гараж.'], ['marya', 'Это точно не коммунальщики.'], ['gus', 'Я предлагаю не подходить. И никому не говорить.'], ['marya', 'Согласна. Сегодня — только баллы.']]);
      await T.shotOff(900);
    });
    Q().stage = 3; complete('points'); holeState(); persist(); toast('✔ Дело закрыто: 5 000 000 баллов Максима', 4200);
  }
  // Защита финальной сцены от зависания, если NPC не обновляется игровым циклом.
  // В таком случае персонаж аккуратно доводится до точки назначения, а кат-сцена продолжается.
  async function walkToSafe(actor, x, z, speed, maxMs) {
    var distance = Math.hypot(x - actor.pos.x, z - actor.pos.z);
    var limit = maxMs || Math.min(12000, Math.max(4500, distance / (speed || 3) * 1000 + 3500));
    var completed = false;
    await Promise.race([
      walkTo(actor, x, z, speed).then(function () { completed = true; }),
      new Promise(function (resolve) { setTimeout(resolve, limit); })
    ]);
    if (!completed) {
      placeA(actor, x, z, actor.yaw);
      actor.moving = false;
      actor.run = false;
    }
  }

  async function spit(from, to, K0) {
    var s = emojiSprite('💦', .7); s.position.set(from.pos.x, 1.7, from.pos.z); K0.g.add(s);
    var t0 = performance.now(), T_ = 550, a = { x: from.pos.x, y: 1.7, z: from.pos.z }, b = { x: to.pos.x, y: 1.95, z: to.pos.z };
    await new Promise(function (res) { (function f() { var u = Math.min(1, (performance.now() - t0) / T_); s.position.set(a.x + (b.x - a.x) * u, a.y + (b.y - a.y) * u + Math.sin(u * PI) * .35, a.z + (b.z - a.z) * u); if (u < 1) requestAnimationFrame(f); else res(); })(); });
    sfx('bonk'); s.material.rotation = 0; to.g.add(s); s.position.set(0, 2.15, 0); s.scale.set(.9, .9, .9);   // плевок остаётся на голове
    K0.splat = s;
  }


  window.MG_L1 = { ST: ST, OFFERS: OFFERS, K: K, allDone: allDone, finale: finale, fmtP: fmtP, SAMPLES: SAMPLES, TAGS: TAGS, enterStore: enterStore, leaveStore: leaveStore, flatStart: flatStart, Q: Q, holeW: holeW, doorW: doorW, holeState: holeState };
  T.shelf = shelf; T.DEPT = DEPT;
})();
