/* =====================================================================
   СЮЖЕТКА №2 — «ЧЕК ИЗ ДЫРЫ»  (между №1 «5 000 000 баллов Максима» и №3 «Тайна Дикси и Светофора»)
   Стеклянный квартал, дыра, которая выросла в №1. Гусь бросает в неё пустую карту Максима — дыра
   выбрасывает странный чек «ДИКСИ × СВЕТОФОР». Герои ловят его, расспрашивают трёх свидетелей и
   понимают, что дело — в Дикси. Происхождение дыры НЕ раскрывается.
   Часть основного сюжета: дело «chek» в «Списке дел», прогресс — в обычном сохранении (S.p13.chek).
   ===================================================================== */
(function () {
  'use strict';
  var T = window.MG_STORY, D = window.MG_DIST, PI = Math.PI;
  if (!T || !D) { console.error('[LEVEL2] нет каркаса'); return; }
  var HX = -47, HZ = 40;                                   // дыра (как в сюжетке №1), локальные координаты района
  var K2 = { kb: null, receipt: null, npcs: {} };
  function Q() { var q = T.P('chek'); if (!q.clues) q.clues = [false, false, false]; return q; }
  function holeW() { return { x: K2.kb.ox + HX, z: K2.kb.oz + HZ }; }
  // маршрут чека — вне круга дыры, по свободной земле и дороге (проверено сеткой проходимости)
  var WP = [[-41, 30], [-30, 33], [-30, 44], [-38, 46.5], [-41, 34.5]];
  var NPC = [
    { id: 'cleaner', name: 'Уборщик', x: -34, z: 43, px: -34, pz: 41.2, look: { top: 0x3a7a5a, pants: 0x2a3a3a, hair: 0x6a6a6a, hairStyle: 'short', skin: 0xdba784, scale: 1 }, who: ['cleaner', 'Уборщик', '#9ad8b0'],
      ask: 'Что вы знаете про дыру?', opts: ['Она давно здесь?', 'Почему вы стоите так далеко?', 'Просто хотела поздороваться'],
      yes: ['Давно ли… По ночам она вздыхает. Раньше пахло асфальтом. Последние дни — мясом.', 'А ещё в ней что-то шуршит. Как бумага. Как чеки в кассе.'], no: ['Далеко? Я подметаю. Вокруг неё метла как-то сама разворачивается.', 'А вот про «давно» я бы спросил у неё самой. Спросите.'] },
    { id: 'courier', name: 'Курьер', x: -62, z: 34, px: -62, pz: 32.2, look: { top: 0xe8742a, pants: 0x2a3a5a, hair: 0x333333, hairStyle: 'short', skin: 0xdba784, scale: 1 }, who: ['courier', 'Курьер', '#ffb36a'],
      ask: 'Вы развозите заказы по этому району?', opts: ['Вы возили что-то в Дикси?', 'Дыра вам мешает?', 'Нет, просто стою'],
      yes: ['Возил. Но не к двери, а к шторке в мясном отделе. Там кто-то забирает коробки. Рук не видно, только шорох.', 'Расписываться не нужно. Чек — тоже. «Касса тринадцать», сказали. Я и не заходил дальше.'], no: ['Мешает — как же. Объезжаю. А вот про Дикси… спросите правильно.', 'Меня интересует только «куда» и «до какого часа».'] },
    { id: 'granny', name: 'Бабушка', x: -27.5, z: 48, px: -27.5, pz: 46.2, look: { top: 0x6a4a6a, pants: 0x3a3a3a, hair: 0xc8c8c8, hairStyle: 'bun', skin: 0xefc4a4, scale: .9, coatLong: true }, who: ['granny', 'Бабушка', '#e0b0e0'],
      ask: 'Вы живёте неподалёку?', opts: ['Вы бываете в Дикси?', 'Вам не страшно рядом с дырой?', 'Помочь донести сумку?'],
      yes: ['Бываю, милая. Сидр там брала. Вывески переклеили: под оранжевым — второй слой, красно-жёлто-зелёный.', 'А свет мигает по очереди. Как светофор. Я развернулась и ушла без сидра. Первый раз за сорок лет.'], no: ['Страшно только за сумку — она у меня тяжёлая. А дыра — что дыра? Вот Дикси, милая, — другое дело.', 'Спроси про него. Только осторожно.'] }
  ];

  /* ---------- построение в районе: свидетели и точка у дыры ---------- */
  function attach(kb) {
    K2.kb = kb;
    try { ITEMS.chek13 = ['🧾', 'Странный чек', 'ДИКСИ × СВЕТОФОР. Касса №13. Состав: лучше не знать.']; } catch (e) { }
    if (typeof WHO !== 'undefined') NPC.forEach(function (n) { WHO[n.who[0]] = [n.who[1], n.who[2]]; });
    NPC.forEach(function (n) {
      var a = kb.npc('s2_' + n.id, n.name, n.look, n.x, n.z, PI); K2.npcs[n.id] = a;
      T.actW('biz', kb.ox + n.px, kb.oz + n.pz, '💬 Поговорить: ' + n.name, function () { talk(n); }, 2.2, function () { return Q().stage === 2 && !Q().clues[NPC.indexOf(n)]; });
    });
    var h = { x: kb.ox + HX + 7.9, z: kb.oz + HZ };
    T.actW('biz', h.x, h.z, '🕳️ Заглянуть в дыру', function () { start(); }, 2.7, function () { return !!(S.q.points && !S.q.chek && Q().stage === 0); });
  }
  D.hooks.push(function (id, kb) { if (id === 'biz') attach(kb); });

  /* ---------- подсказка цели ---------- */
  T.hints.push(function () {
    if (!S.q.points || S.q.chek) return null; var q = Q();
    if (q.stage === 0) { if (area === 'biz' && K2.kb) return { t: '🔴 Новое дело: «Чек из дыры». Подойти к дыре у дороги.', p: { x: K2.kb.ox + HX + 7.9, z: K2.kb.oz + HZ } }; if (area === 'city' || area === 'flat') return { t: '🔴 Новое дело: «Чек из дыры». Дыра в Стеклянном квартале не даёт Гусю покоя. Маршрутка «Новый квартал».', p: area === 'flat' ? FLAT_DOOR : { x: 214, z: 30 } }; return null; }
    if (area !== 'biz' || !K2.kb) return null;
    if (q.stage === 1 && K2.receipt) return { t: '🧾 Поймать улетающий чек! Он кружит у дороги.', p: { x: K2.receipt.position.x, z: K2.receipt.position.z } };
    if (q.stage === 2) { var left = NPC.filter(function (n, i) { return !q.clues[i]; })[0]; if (left) return { t: '💬 Расспросить свидетелей (' + q.clues.filter(Boolean).length + '/3): уборщик, курьер, бабушка.', p: { x: K2.kb.ox + left.px, z: K2.kb.oz + left.pz } }; }
    return null;
  });

  /* ---------- сцена у дыры ---------- */
  async function start() {
    var q = Q(); if (q.stage !== 0) return; var hw = holeW();
    await cutscene(async function () {
      await T.shotW(hw.x + 12, 4.4, hw.z - 9, hw.x, .3, hw.z, 1100);
      await say([['gus', 'Марья, она всё ещё тут. И стала шире. И тише.'], ['marya', 'Гусь, не подходи к краю.'], ['gus', 'У меня идея. Карта Максима. Баллов на ней всё равно нет.'], ['marya', 'Это его карта. Была.'], ['gus', 'Именно. Была. Я бросаю.']]);
      var card = emojiSprite('💳', 1.1); card.position.set(hw.x + 6.6, 1.7, hw.z); K2.kb.g.add(card);
      var t0 = performance.now(), T_ = 900;
      await new Promise(function (res) { (function f() { var u = Math.min(1, (performance.now() - t0) / T_); card.position.set(hw.x + 6.6 * (1 - u), 1.7 + Math.sin(u * PI) * 1.4 - u * 1.5, hw.z); if (u < 1) requestAnimationFrame(f); else res(); })(); });
      K2.kb.g.remove(card); sfx('whoosh');
      await wait(1300);
      await say([['sys', 'Дыра сглотнула карту. Секунду ничего не происходило. Потом из неё вылетело что-то белое и закружилось над асфальтом.'], ['marya', 'Это… бумажка?'], ['gus', 'ЛОВИ ЕЁ!']]);
      await T.shotOff(900);
      spawnReceipt(); q.stage = 1; T.save(); toast('🧾 Поймай чек: он кружит у дороги рядом с дырой.', 4200);
    });
  }
  function spawnReceipt() {
    var hw = holeW(); if (K2.receipt) K2.kb.g.remove(K2.receipt);
    var r = emojiSprite('🧾', 1.5); r.position.set(hw.x, 3, hw.z); K2.kb.g.add(r); K2.receipt = r; K2.wp = 0; K2.sp = { x: hw.x, z: hw.z };
  }
  /* чек летит по маршруту (медленнее игрока), покачивается; игрок ловит, подойдя вплотную */
  T.ticks.push(function (dt, t) {
    var q = Q(); if (area !== 'biz' || !K2.kb || S.q.chek) return;
    if (q.stage === 1 && !K2.receipt) spawnReceipt();                // продолжение после перезапуска
    if (q.stage !== 1 || !K2.receipt) return;
    var w = WP[K2.wp % WP.length], tx = K2.kb.ox + w[0], tz = K2.kb.oz + w[1], dx = tx - K2.sp.x, dz = tz - K2.sp.z, d = Math.hypot(dx, dz), sp = 2.3;
    if (d < .6) K2.wp++; else { K2.sp.x += dx / d * Math.min(d, sp * dt); K2.sp.z += dz / d * Math.min(d, sp * dt); }
    K2.receipt.position.set(K2.sp.x, 1.4 + Math.sin(t * 5) * .35, K2.sp.z);
    if (Math.hypot(player.pos.x - K2.sp.x, player.pos.z - K2.sp.z) < 1.8) caught();
  });
  async function caught() {
    var q = Q(); if (q.stage !== 1 || K2.busy) return; K2.busy = true; q.stage = 2;
    K2.kb.g.remove(K2.receipt); K2.receipt = null; sfx('coin'); try { addItem('chek13'); } catch (e) { }
    await cutscene(async function () {
      await say([['marya', 'Поймала! Держу. Бумага тёплая.'], ['sys', '🧾 ЧЕК № 000001 · ДИКСИ × СВЕТОФОР'], ['sys', 'Котлеты Мираторг ×1. Состав: лучше не знать.'], ['sys', 'Касса: 13. Кассир: —. Время: между вчера и завтра. Спасибо, что вернётесь.'],
        ['gus', 'Дикси… и Светофор. На одном чеке.'], ['marya', 'Светофор закрылся ещё зимой. Сеть выкупили, вывески сняли.'], ['gus', 'А здесь они вместе. И касса тринадцать.'], ['marya', 'Надо узнать, что слышали люди. Спросим тех, кто стоит здесь день и ночь.']]);
      T.save(); toast('💬 Расспроси троих: уборщик, курьер, бабушка.', 4200);
    });
    K2.busy = false;
  }

  /* ---------- свидетели ---------- */
  async function talk(n) {
    var i = NPC.indexOf(n), q = Q(); if (q.clues[i]) return;
    await cutscene(async function () {
      await say([[n.who[0], '…Да? Вы что-то хотели?']]);
      var c = await ask(n.who[0], n.ask, n.opts);
      if (c === 0) {
        await say(n.yes.map(function (l) { return [n.who[0], l]; }));
        q.clues[i] = true; sfx('ding'); T.save(); var k = q.clues.filter(Boolean).length; toast('🧩 Улика ' + k + '/3', 2200);
        if (k >= 3) await finale();
      } else {
        await say([[n.who[0], n.no[0]], [n.who[0], n.no[1]]]);
      }
    });
  }
  async function finale() {
    var q = Q(), hw = holeW();
    await T.shotW(hw.x + 13, 4.8, hw.z - 10, hw.x, .3, hw.z, 1100);
    await say([['marya', 'Мясной отдел. Шторки. Вывески в два слоя. Касса тринадцать.'], ['gus', 'Светофор внутри Дикси.'], ['marya', 'Или Дикси внутри Светофора. Не сегодня. Сегодня — домой.'], ['gus', 'Домой. Чай. Кто-то должен сходить за сидром.'], ['marya', 'Не начинай.'], ['gus', 'Я просто сказал.']]);
    await T.shotOff(900);
    q.stage = 3; complete('chek'); T.save(); toast('✔ Дело закрыто: Чек из дыры. Открыто: Тайна Дикси и Светофора', 5200);
  }

  window.MG_L2 = { Q: Q, WP: WP, NPC: NPC, start: start, caught: caught, talk: talk, finale: finale, K2: K2, holeW: holeW };
})();
