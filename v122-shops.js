/* =====================================================================
   МГИАГ 1.20 — НОВЫЕ ТОЧКИ В НОВОМ ГОРОДЕ («почти дом»)
   17 заведений, в каждое можно зайти. У каждого — своя витрина снаружи (своя вывеска и своя «штука» на фасаде),
   свой интерьер, свой продавец и своя фишка, которой нет больше нигде в игре:
   шляпы, барбершоп с редкими красками, пляжная одежда, оптика с проверкой зрения, пластинки с музыкой,
   книжный с чтением, зоомагазин с аквариумом и попугаем, аркада, фотоателье (настоящий снимок экрана),
   кофейня с латте-артом, спортзал, караоке, прачечная, часовщик (переводит время), цветы (свой букет),
   игрушки с автоматом-хваталкой, мороженое из трёх шариков.
   Строятся только в новых землях (после «Чэай~»). Интерьеры собираются при первом входе.
   Прогресс — S.shops20 в обычном сохранении.
   ===================================================================== */
(function () {
  'use strict';
  var PI = Math.PI;
  var SH = window.MG_SHOPS = { list: [], placed: [], built: {}, stats: {} };
  function st() { S.shops20 = S.shops20 || { visits: {}, gym: 0, arcade: 0, tickets: 0, eye: false, bouquet: null }; return S.shops20; }
  function sv() { try { saveGame(); } catch (e) { } }
  var W = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  function play(notes, tempo, type) { notes.forEach(function (n, i) { if (!n) return; setTimeout(function () { try { tone(n, tempo * .9 / 1000, type || 'triangle', .12); } catch (e) { } }, i * tempo); }); return notes.length * tempo; }

  /* ---------- новые вещи, одежда, краски (только здесь) ---------- */
  function registry() {
    if (SH.reg) return; SH.reg = true;
    Object.assign(ITEMS, {
      rec_waltz: ['💿', 'Пластинка «Гусиный вальс»', 'Играет в магазине «Пластинка».'], rec_boogie: ['💿', 'Пластинка «Чэай-буги»', 'Под неё невозможно стоять ровно.'], rec_night: ['💿', 'Пластинка «Ночной Сити»', 'Звучит как огни башен.'],
      book_goose: ['📕', '«Гусь: инструкция по применению»', 'Глава 1: не применять.'], book_hole: ['📗', '«Дыры и как в них не падать»', 'Автор упал в дыру на 3-й странице.'], book_tea: ['📘', '«Чэай: история одного слова»', '400 страниц. Одно слово.'],
      goose_food: ['🌾', 'Корм для гусей «Премиум»', 'Гусь делает вид, что это не для него.'], plush_goose: ['🧸', 'Плюшевый гусь', 'Выигран в автомате. Гордость.'], arcade_pin: ['⭐', 'Значок «Король аркады»', 'За 15 билетов.'],
      duck_toy: ['🐤', 'Резиновая уточка', 'Пищит. Всегда.'], bouquet: ['💐', 'Букет', 'Собран своими руками.'], icecream3: ['🍨', 'Мороженое «Три шарика»', 'Таять начинает сразу.'], latte: ['☕', 'Латте с рисунком', 'Рисунок жалко пить.'],
      photo_card: ['🖼️', 'Фото из «Вспышки»', 'Марья и Гусь. В рамке.']
    });
    try { Object.assign(EATL, { icecream3: 'Три шарика. Мозг замёрз на втором.', latte: 'Рисунок ушёл первым. Вкусно.' }); } catch (e) { }
    Object.assign(CLOTHES, {
      h_cowboy: { n: 'Ковбойская шляпа', i: '🤠', p: 1400, slot: 'hat', t: 'x_cowboy', shop: 'hats' }, h_top: { n: 'Цилиндр', i: '🎩', p: 1800, slot: 'hat', t: 'x_top', shop: 'hats' },
      h_chef: { n: 'Поварской колпак', i: '👨‍🍳', p: 900, slot: 'hat', t: 'x_chef', shop: 'hats' }, h_ushanka: { n: 'Ушанка', i: '🧣', p: 1100, slot: 'hat', t: 'x_ushanka', shop: 'hats' },
      h_viking: { n: 'Шлем викинга', i: '⚔️', p: 2200, slot: 'hat', t: 'x_viking', shop: 'hats' }, h_flowers: { n: 'Венок из ромашек', i: '🌼', p: 700, slot: 'hat', t: 'x_flowers', shop: 'hats' },
      h_phones: { n: 'Большие наушники', i: '🎧', p: 1600, slot: 'hat', t: 'x_phones', shop: 'hats' }, h_beret: { n: 'Берет художника', i: '🎨', p: 800, slot: 'hat', t: 'x_beret', shop: 'hats' },
      g_mono: { n: 'Монокль', i: '🧐', p: 1300, slot: 'glasses', t: 'x_mono', shop: 'optics' }, g_star: { n: 'Очки-звёзды', i: '🤩', p: 900, slot: 'glasses', t: 'x_star', shop: 'optics' },
      g_round: { n: 'Круглые очки «Профессор»', i: '👓', p: 1100, slot: 'glasses', t: 'x_round', shop: 'optics' }, g_3d: { n: '3D-очки из кино', i: '🎬', p: 500, slot: 'glasses', t: 'x_3d', shop: 'optics' },
      t_hawaii: { n: 'Гавайская рубашка', i: '🌺', p: 1900, slot: 'top', t: 'tee', c: 0xf28c28, shop: 'beach' }, t_love: { n: 'Футболка «Я ❤ Чэайное»', i: '👕', p: 900, slot: 'top', t: 'tee', c: 0xfdfdf8, shop: 'beach' },
      t_wind: { n: 'Ветровка «Прибой»', i: '🧥', p: 2600, slot: 'top', t: 'jacket', c: 0x2fb4c8, shop: 'beach' }, l_swim: { n: 'Шорты для плавания', i: '🩳', p: 1100, slot: 'legs', t: 'shorts', c: 0x2fc0a8, shop: 'beach' },
      l_white: { n: 'Белые брюки «Яхта»', i: '👖', p: 2400, slot: 'legs', t: 'jeans', c: 0xf2f0e8, shop: 'beach' }, s_sand: { n: 'Сандалии', i: '🩴', p: 800, slot: 'shoes', t: 'sneakers', c: 0xb8865a, shop: 'beach' }
    });
    Object.assign(DYES, { x_violet: ['Фиолетовый «Сити»', 900, 0x8a3fd8, 'excl'], x_fire: ['Огненно-рыжий', 900, 0xff5a1f, 'excl'], x_mint: ['Мятный', 900, 0x7fe0c0, 'excl'], x_gold: ['Золотой', 1500, 0xe8c048, 'excl'], x_cherry: ['Вишнёвый', 900, 0x8a1f3a, 'excl'] });
    // новые шляпы и очки рисуются здесь; старая функция их не знает
    var oa = addAcc; window.addAcc = addAcc = function (m, o) {
      var hat = o.hat && CLOTHES[o.hat], gl = o.glasses && CLOTHES[o.glasses], mineH = hat && /^x_/.test(hat.t), mineG = gl && /^x_/.test(gl.t);
      oa(m, (mineH || mineG) ? Object.assign({}, o, { hat: mineH ? null : o.hat, glasses: mineG ? null : o.glasses }) : o);
      try { var hd = m.P.head; if (mineH) drawHat(hd, hat.t); if (mineG) drawGlasses(hd, gl.t); } catch (e) { console.error('[SHOPS acc]', e); }
    };
  }
  function drawHat(hd, t) {
    var A = function (geo, c, s, p, r) { return M_(hd, geo, c, s, p, r || null, false); };
    if (t === 'x_cowboy') { A(G.cyl, 0x8a5a2a, [.62, .03, .62], [0, .44, 0]); A(G.cyl, 0x8a5a2a, [.32, .2, .32], [0, .55, 0]); A(G.box, 0x3a2410, [.33, .04, .33], [0, .48, 0]); }
    else if (t === 'x_top') { A(G.cyl, 0x151515, [.5, .03, .5], [0, .44, 0]); A(G.cyl, 0x151515, [.3, .38, .3], [0, .64, 0]); A(G.cyl, 0xc0392b, [.31, .05, .31], [0, .49, 0]); }
    else if (t === 'x_chef') { A(G.cyl, 0xffffff, [.34, .2, .34], [0, .52, 0]); A(G.sph, 0xffffff, [.44, .26, .44], [0, .68, 0]); }
    else if (t === 'x_ushanka') { A(G.sph, 0x6a4a2a, [.4, .26, .4], [0, .46, 0]); [-1, 1].forEach(function (s) { A(G.box, 0x6a4a2a, [.06, .22, .18], [s * .2, .28, 0]); }); A(G.box, 0x7a5a3a, [.34, .1, .06], [0, .5, .18]); }
    else if (t === 'x_viking') { A(G.hemi, 0x9aa0a8, [.21, .19, .21], [0, .38, 0]); [-1, 1].forEach(function (s) { A(G.cone, 0xf0e6c8, [.07, .22, .07], [s * .22, .52, 0], [0, 0, -s * .6]); }); }
    else if (t === 'x_flowers') { for (var i = 0; i < 9; i++) { var a = i / 9 * PI * 2; A(G.sph, 0xffffff, [.07, .04, .07], [Math.cos(a) * .19, .42, Math.sin(a) * .19]); A(G.sph, 0xf2c230, [.03, .03, .03], [Math.cos(a) * .19, .44, Math.sin(a) * .19]); } }
    else if (t === 'x_phones') { A(G.box, 0x222222, [.42, .05, .07], [0, .45, 0]); [-1, 1].forEach(function (s) { A(G.cyl, 0x2a2a2a, [.16, .07, .16], [s * .21, .22, 0], [0, 0, PI / 2]); A(G.cyl, 0xe8473b, [.12, .075, .12], [s * .215, .22, 0], [0, 0, PI / 2]); }); }
    else if (t === 'x_beret') { A(G.cyl, 0xb02a3a, [.4, .07, .4], [.04, .45, 0], [0, 0, -.18]); A(G.box, 0xb02a3a, [.02, .06, .02], [.04, .5, 0]); }
  }
  function drawGlasses(hd, t) {
    var A = function (geo, c, s, p, r) { return M_(hd, geo, c, s, p, r || null, false); };
    if (t === 'x_mono') { A(G.cyl, 0xd4a840, [.1, .015, .1], [.075, .22, .165], [PI / 2, 0, 0]); A(G.cyl, 0xbfe6ff, [.085, .016, .085], [.075, .22, .167], [PI / 2, 0, 0]); A(G.box, 0xd4a840, [.006, .2, .006], [.12, .12, .16]); }
    else if (t === 'x_star') { [-1, 1].forEach(function (s) { var m = A(G.cyl, 0xff3fa0, [.13, .02, .13], [s * .08, .22, .165], [PI / 2, 0, 0]); m.geometry = new THREE.CylinderGeometry(.5, .5, 1, 5); }); A(G.box, 0xff3fa0, [.06, .015, .02], [0, .23, .16]); }
    else if (t === 'x_round') { [-1, 1].forEach(function (s) { A(G.cyl, 0x3a2a1a, [.1, .015, .1], [s * .075, .22, .165], [PI / 2, 0, 0]); A(G.cyl, 0xdff0ff, [.085, .016, .085], [s * .075, .22, .167], [PI / 2, 0, 0]); }); A(G.box, 0x3a2a1a, [.05, .012, .015], [0, .225, .162]); }
    else if (t === 'x_3d') { A(G.box, 0xf4f4f0, [.27, .08, .02], [0, .22, .16]); A(G.box, 0xd8242a, [.09, .055, .01], [-.07, .22, .172]); A(G.box, 0x2a6ad8, [.09, .055, .01], [.07, .22, .172]); }
  }

  /* ---------- общие помощники интерьеров ---------- */
  function who(id, name, col) { try { WHO['sh_' + id] = [name, col || '#ffd27a']; } catch (e) { } return 'sh_' + id; }
  function room(K, w, d, wall, floor, trim) {
    K.plane(w, d, floor, 0, 0, .01); var h = 4.4, t = .3;
    K.b(w + t, h, t, wall, 0, 0, -d / 2); K.b(t, h, d, wall, -w / 2, 0, 0); K.b(t, h, d, wall, w / 2, 0, 0);
    var side = (w - 2.6) / 2; K.b(side, h, t, wall, -w / 2 + side / 2, 0, d / 2); K.b(side, h, t, wall, w / 2 - side / 2, 0, d / 2); K.b(2.6, h - 3, t, wall, 0, 3, d / 2);
    K.bp(2.4, 2.9, .1, 0x2a2018, 0, .02, d / 2 + .05); K.bp(w, .25, .05, trim || 0xffffff, 0, 0, -d / 2 + .17); K.bp(w, .2, .05, trim || 0xffffff, 0, h - .25, -d / 2 + .17);
    for (var x = -w / 2 + 3; x < w / 2 - 2; x += 4) K.bp(1.6, .08, .6, K.glow(0xfff4d8), x, h - .1, 0);
  }
  function shelf(K, x, z, ry, w, cols, rows) {
    var g = new THREE.Group(); g.position.set(K.ox + x, 0, K.oz + z); g.rotation.y = ry || 0; K.g.add(g); rows = rows || 4;
    M_(g, G.box, 0x6a4a30, [w, 2.4, .5], [0, 1.2, -.05], null, false);
    for (var r = 0; r < rows; r++) { var y = .35 + r * .55; M_(g, G.box, 0x8a6a48, [w, .05, .6], [0, y, 0], null, false); for (var i = 0; i < Math.floor(w / .45); i++) if (Math.random() < .8) M_(g, G.box, cols[(i + r) % cols.length], [.3 + Math.random() * .1, .25 + Math.random() * .2, .3], [-w / 2 + .3 + i * .45, y + .17, .05], null, false); }
    var cs = Math.cos(ry || 0), sn = Math.sin(ry || 0); K.col(x - (Math.abs(cs) * w + Math.abs(sn) * .6) / 2, x + (Math.abs(cs) * w + Math.abs(sn) * .6) / 2, z - (Math.abs(sn) * w + Math.abs(cs) * .6) / 2, z + (Math.abs(sn) * w + Math.abs(cs) * .6) / 2, 2.4);
    return g;
  }
  function counter(K, x, z, w, c) { K.b(w, 1.05, .9, c || 0x8a6a48, x, 0, z); K.bp(w + .1, .06, 1, 0xd8d4cc, x, 1.05, z); }
  function plant(K, x, z) { K.m(G.cyl, 0xb86a3a, [.5, .5, .5], [x, .25, z]); K.m(G.sph, 0x3f8a3c, [.9, 1.1, .9], [x, 1, z]); K.colC(x, z, .35, 1.4); }
  function rug(K, x, z, w, d, c) { K.plane(w, d, c, x, z, .02); }
  function modal(title, whoK, greet, body) { openModal('shop', function () { var b = shopHead(title, whoK, greet); body(b); footClose(); }); }
  function line(b, t, cls) { var d = document.createElement('div'); d.className = cls || 'ti'; d.style.fontSize = '16px'; d.textContent = t; b.appendChild(d); return d; }
  function buyRows(b, list, redraw) { list.forEach(function (q) { var it = ITEMS[q[0]]; rowBtn(b, it[0] + ' ' + it[1], fmt(q[1]), 'Купить', function () { if (!spend(q[1])) return; addItem(q[0]); toast(it[0] + ' ' + it[1] + ' — в инвентаре 🎒', 2400); if (redraw) redraw(); }); }); }
  function wearRows(b, shop, redraw, mult) {
    var o = S.outfit[player.id], own = S.wardrobe[player.id];
    Object.keys(CLOTHES).forEach(function (id) { var c = CLOTHES[id]; if (c.shop !== shop) return; var on = o[c.slot] === id, has = own.indexOf(id) >= 0, price = Math.round(c.p * (mult || 1));
      rowBtn(b, c.i + ' ' + c.n, has ? (on ? 'надето' : 'есть в шкафу') : fmt(price), on ? '✓' : has ? 'Надеть' : 'Купить', function () { if (!has) { if (!spend(price)) return; own.push(id); } equip(c.slot, id); toast(c.i + ' ' + player.name + ' теперь в: ' + c.n.toLowerCase(), 2400); redraw(); }, on); });
  }
  function hearts(a) { try { var sp = emojiSprite('💛', .8); sp.position.set(a.pos.x, (a.pos.y || 0) + 2.4, a.pos.z); scene.add(sp); var t0 = performance.now(); (function f() { var u = (performance.now() - t0) / 1400; sp.position.y += .015; sp.material.opacity = 1 - u; if (u < 1) requestAnimationFrame(f); else scene.remove(sp); })(); } catch (e) { } }

  /* =====================================================================
     17 ЗАВЕДЕНИЙ
     ===================================================================== */
  var DEFS = [
    { id: 'hats', name: 'ШЛЯПНИК', full: 'Шляпная мастерская «Шляпник»', e: '🎩', reg: 'S', fc: '#2a3a5a', ac: 0xc8a040, sc: ['#1d2a44', '#f2d27a'], seller: ['Шляпник', '#f2d27a'], look: { top: 0x3a2a5a, pants: 0x1a1a1a, hair: 0xd8d8d8, hairStyle: 'short', skin: 0xf0c6a4 },
      greet: 'Голова — это просто подставка для шляпы.', wall: 0x3a3050, floor: 0x5a3a28,
      prop: function (B, x, y, z, ry) { B.cyl(x, y + 1.6, z, 2.6, .25, 0x151515); B.cyl(x, y + 2.7, z, 1.5, 2, 0x151515); B.cyl(x, y + 1.95, z, 1.55, .35, 0xc0392b); },
      inside: function (K) { room(K, 14, 12, 0x3a3050, 0x5a3a28, 0xd4a840); counter(K, 0, -4.2, 5, 0x2a1a10);
        for (var i = 0; i < 8; i++) { var x = -6 + (i % 4) * 1.4, z = i < 4 ? -2 : 1.5; K.m(G.cyl, 0x8a6a48, [.12, 1.4, .12], [x - 1, .7, z]); K.m(G.sph, 0xd8c8b0, [.36, .44, .36], [x - 1, 1.6, z]); var hc = [0x151515, 0x8a5a2a, 0xffffff, 0x6a4a2a, 0x9aa0a8, 0xb02a3a, 0x2a2a2a, 0xf2c230][i]; K.m(G.cyl, hc, [.5, .3, .5], [x - 1, 1.95, z]); K.colC(x - 1, z, .25, 2); }
        K.b(2.2, 3, .2, 0xd4a840, 5.8, 0, 0); K.bp(1.8, 2.6, .05, 0xcfe6ff, 5.68, .2, 0); },
      acts: function (K, A) { A(0, -3.2, '🎩 Примерить шляпы', function () { var dr = function () { modal('🎩 Шляпник', 'sh_hats', 'Каждая шляпа сделана вручную. Мною. Ночью.', function (b) { wearRows(b, 'hats', dr); var o = S.outfit[player.id]; if (o.hat) rowBtn(b, '🙅 Снять шляпу', 'бесплатно', 'Снять', function () { equip('hat', null); dr(); }); }); }; dr(); });
        A(5.2, 0, '🪞 Посмотреться в зеркало', function () { cutscene(async function () { cam.force = { yaw: player.yaw + PI, pitch: .1, dist: 2.4 }; await W(900); await say([['sys', player.name + ' смотрит в зеркало. Зеркало смотрит в ответ.'], ['gus', pick(['Тебе идёт. Мне — нет. Но тебе — да.', 'Это шляпа или ты? Не понял, но красиво.', 'Ты похож на главного героя. Ой, ты и есть.'])]]); cam.force = null; }); }); } },
    { id: 'barber', name: 'ОСТРЫЙ КЛЮВ', full: 'Барбершоп «Острый клюв»', e: '💈', reg: 'W', fc: '#1a1a1a', ac: 0xd8242a, sc: ['#111111', '#ffffff'], seller: ['Барбер Ростик', '#9ad0ff'], look: { top: 0x1a1a1a, pants: 0x2a2a2a, hair: 0x1a1410, hairStyle: 'mohawk', skin: 0xdba784 },
      greet: 'Краски, которых нет у обычных парикмахеров. Только у нас.', wall: 0x2a2a2a, floor: 0xe8e8e8,
      prop: function (B, x, y, z) { for (var i = 0; i < 6; i++) B.cyl(x, y + .6 + i * .5, z, .35, .5, i % 2 ? 0xffffff : (i % 4 ? 0xd8242a : 0x2a6ad8)); B.sph(x, y + 3.7, z, .4, 0xf0f0f0); },
      inside: function (K) { room(K, 14, 12, 0x2a2a2a, 0xe8e8e8, 0xd8242a); for (var x = -4.5; x <= 4.5; x += 4.5) { K.b(.9, .5, .9, 0x2a1a10, x, 0, -3.4); K.bp(.9, 1.2, .2, 0x2a1a10, x, .5, -3.85); K.bp(.12, .5, .12, 0x9aa0a8, x, 0, -3.4); K.bp(2.2, 1.6, .05, 0xcfe6ff, x, 1.6, -5.8); }
        for (var i = 0; i < 7; i++) K.plane(1, 1, i % 2 ? 0x1a1a1a : 0xe8e8e8, -6.5 + i, 4.5, .03); K.bp(3, .8, .5, 0x6a4a30, -5, 0, 3); },
      acts: function (K, A) { A(0, -2.2, '💈 Покраситься в редкий цвет', function () { var dr = function () { modal('💈 «Острый клюв»', 'sh_barber', 'Фиолетовый «Сити» сегодня в моде. Вчера тоже.', function (b) { var o = S.outfit[player.id];
          Object.keys(DYES).filter(function (k) { return DYES[k][3] === 'excl'; }).forEach(function (k) { var d = DYES[k], on = o.dye === k; rowBtn(b, '🎨 ' + d[0], on ? 'сейчас' : fmt(d[1]), on ? '✓' : 'Красить', function () { if (!spend(d[1])) return; o.dye = k; sv(); rebuildChar(player); sfx('poof'); dr(); }, on); });
          rowBtn(b, '🎲 Стрижка вслепую', 'барбер стрижёт с закрытыми глазами · ' + fmt(250), 'Рискнуть', function () { if (!spend(250)) return; closeModal(); blind(); }); }); }; dr(); });
        function blind() { cutscene(async function () { await fade(1, 400, '💈 Вжжжжж…'); var keys = Object.keys(HAIRS), o = S.outfit[player.id], own = S.hairs[player.id], h = pick(keys); o.hair = h; if (own.indexOf(h) < 0) own.push(h); var dk = pick(Object.keys(DYES)); o.dye = dk; sv(); rebuildChar(player); await W(1200); await fade(0, 500);
          await say([['sh_barber', 'Открываю глаза… О. ' + HAIRS[h].n + '. И ' + DYES[dk][0].toLowerCase() + '.'], ['gus', pick(['Я бы так не рискнул.', 'Смело. Очень смело.', 'Это вообще законно?'])]]); }); } } },
    { id: 'beach', name: 'ГАВАЙИ', full: 'Магазин «Гавайи у моря»', e: '🌺', reg: 'SC', fc: '#2fb4c8', ac: 0xf28c28, sc: ['#f28c28', '#ffffff'], seller: ['Продавщица Лейла', '#ffb0d0'], look: { top: 0xf28c28, pants: 0x2fc0a8, hair: 0xe8c048, hairStyle: 'longF', skin: 0xd8a070 },
      greet: 'У нас всегда лето. Даже зимой. Особенно зимой.', wall: 0x8ad8e0, floor: 0xe8d8a8,
      prop: function (B, x, y, z) { B.cyl(x, y + 2, z, .3, 4, 0x8a6a48); for (var i = 0; i < 6; i++) B.box(x + Math.sin(i) * 1.3, y + 4, z + Math.cos(i) * 1.3, 2.4, .15, .6, 0x3f9a3c, i); },
      inside: function (K) { room(K, 14, 12, 0x8ad8e0, 0xe8d8a8, 0xf28c28); counter(K, 4, -4, 4, 0xd8a868); for (var i = 0; i < 3; i++) { K.b(3, .1, .6, 0x9aa0a8, -4 + i * 3.4, 1.9, -4.8); for (var j = 0; j < 5; j++) K.bp(.5, 1.1, .1, [0xf28c28, 0xfdfdf8, 0x2fb4c8, 0x2fc0a8, 0xf2f0e8][(i + j) % 5], -5.2 + i * 3.4 + j * .6, .8, -4.8); }
        K.bp(2, 2.6, .1, 0xd84a6a, -5.5, 0, 3.2); K.bp(.1, 2.6, 2, 0xd84a6a, -6.5, 0, 2.2); K.emoji('🏄', 2, 6, 3, 4.6); },
      acts: function (K, A) { A(4, -3, '🌺 Пляжная одежда', function () { var dr = function () { modal('🌺 «Гавайи у моря»', 'sh_beach', 'Шорты для плавания можно и не для плавания.', function (b) { wearRows(b, 'beach', dr); }); }; dr(); });
        A(-5.5, 2.2, '🎁 «Образ дня» в примерочной', function () { var ids = Object.keys(CLOTHES).filter(function (k) { return CLOTHES[k].shop === 'beach'; }), top = pick(ids.filter(function (k) { return CLOTHES[k].slot === 'top'; })), legs = pick(ids.filter(function (k) { return CLOTHES[k].slot === 'legs'; }));
          cutscene(async function () { await fade(1, 300, '🎁 Шторка закрывается…'); await W(700); await fade(0, 300); var ok = await ask('sh_beach', 'Образ дня: ' + CLOTHES[top].n + ' + ' + CLOTHES[legs].n + '. Вместе — со скидкой 40%: ' + fmt(Math.round((CLOTHES[top].p + CLOTHES[legs].p) * .6)) + '.', ['Беру!', 'Не сегодня']);
            if (ok !== 0) return; var p = Math.round((CLOTHES[top].p + CLOTHES[legs].p) * .6); if (!spend(p)) return; var own = S.wardrobe[player.id]; [top, legs].forEach(function (k) { if (own.indexOf(k) < 0) own.push(k); }); S.outfit[player.id].top = top; S.outfit[player.id].legs = legs; sv(); rebuildChar(player); sfx('poof'); toast('🌺 ' + player.name + ' готов(а) к пляжу.', 2600); }); }); } },
    { id: 'optics', name: 'ЛИНЗА', full: 'Оптика «Линза»', e: '👓', reg: 'W', fc: '#e8f0f4', ac: 0x2a6ad8, sc: ['#ffffff', '#2a6ad8'], seller: ['Окулист Вера', '#bfe6ff'], look: { top: 0xffffff, pants: 0x3a4a6a, hair: 0x5a3a2a, hairStyle: 'bun', skin: 0xf3cdb0 },
      greet: 'Сначала проверим зрение. Потом — стиль.', wall: 0xf4f8fa, floor: 0xb8c8d8,
      prop: function (B, x, y, z) { [-1, 1].forEach(function (s) { B.cyl(x + s * 1.1, y + 3, z, 1, .2, 0x111111, 0, PI / 2); B.cyl(x + s * 1.1, y + 3, z + .05, .85, .22, 0xbfe6ff, 0, PI / 2); }); B.box(x, y + 3.1, z, .6, .15, .15, 0x111111); },
      inside: function (K) { room(K, 14, 12, 0xf4f8fa, 0xb8c8d8, 0x2a6ad8); counter(K, -3, -4, 4, 0xffffff); K.bp(3, 2.6, .05, 0xffffff, 3.5, 1, -5.8); for (var i = 0; i < 6; i++) K.sign(['Ш Б', 'М Н К', 'Ы М Б Ш', 'Б Ы Н К М', 'И К Ш Б Ы М', 'Н К И М Ш Б Ы'][i], 2.6 - i * .3, .35 - i * .03, 3.5, 3.2 - i * .38, -5.7, 0, null, '#111111', { fs: .8 });
        for (var j = 0; j < 4; j++) K.b(1.2, 1, .5, 0xe8eef2, -6 + j * 1.6, 0, 4.8); },
      acts: function (K, A) { A(3.5, -3, '🔤 Проверить зрение (скидка 50% за 3 из 3)', function () { eyeTest(); });
        A(-3, -3, '👓 Очки', function () { var dr = function () { modal('👓 «Линза»', 'sh_optics', st().eye ? 'Зрение идеальное — скидка 50% ваша.' : 'Пройдите проверку у таблицы — будет скидка.', function (b) { wearRows(b, 'optics', dr, st().eye ? .5 : 1); if (S.outfit[player.id].glasses) rowBtn(b, '🙅 Снять очки', 'бесплатно', 'Снять', function () { equip('glasses', null); dr(); }); }); }; dr(); });
        function eyeTest() { cutscene(async function () { var L = 'БМНКШЫИ', right = 0; for (var r = 0; r < 3; r++) { var ch = L[Math.floor(Math.random() * L.length)], opts = [ch]; while (opts.length < 3) { var c = L[Math.floor(Math.random() * L.length)]; if (opts.indexOf(c) < 0) opts.push(c); } opts.sort(function () { return Math.random() - .5; });
            var a = await ask('sh_optics', 'Строка ' + (r + 4) + ', третья буква. Какая? (подсказка: «' + ch + '» — но вы же не подсматриваете)', opts); if (opts[a] === ch) right++; }
          if (right === 3) { st().eye = true; sv(); await say([['sh_optics', 'Три из трёх. Скидка 50% на очки — навсегда.']]); } else await say([['sh_optics', right + ' из 3. Ничего, очки как раз для этого.'], ['gus', 'Я видел только Марью. И батон.']]); }); } } },
    { id: 'vinyl', name: 'ПЛАСТИНКА', full: 'Магазин «Пластинка»', e: '💿', reg: 'S', fc: '#1d2129', ac: 0xff5aa0, sc: ['#1d2129', '#ff5aa0'], seller: ['Диджей Тоша', '#ff9ad0'], look: { top: 0x1d2129, pants: 0x3a3a3a, hair: 0xff5aa0, hairStyle: 'afro', skin: 0xc89070 },
      greet: 'Поставь любую. Если не понравится — поставь другую.', wall: 0x2a2030, floor: 0x3a2a20,
      prop: function (B, x, y, z) { B.cyl(x, y + 3, z, 1.8, .15, 0x111111, 0, PI / 2); B.cyl(x, y + 3, z + .05, .6, .17, 0xff5aa0, 0, PI / 2); },
      inside: function (K) { room(K, 14, 12, 0x2a2030, 0x3a2a20, 0xff5aa0); counter(K, 0, -4, 5, 0x1d1d1d); K.m(G.cyl, 0x111111, [1.4, .05, 1.4], [0, 1.12, -4]); SH.turn = K.m(G.cyl, 0xff5aa0, [.4, .06, .4], [0, 1.15, -4]);
        for (var i = 0; i < 4; i++) { K.b(2.6, .9, .9, 0x6a4a30, -5 + i * 3.3, 0, 3.6); for (var j = 0; j < 6; j++) K.bp(.04, .7, .6, [0xd84a6a, 0x3a8ac0, 0xf2c230, 0x2fae5b][(i + j) % 4], -6 + i * 3.3 + j * .35, .9, 3.6); }
        for (var k = 0; k < 5; k++) K.bp(.9, .9, .05, [0xff5aa0, 0x5ae0ff, 0xffd23f, 0x9a5aff, 0x5aff8a][k], -5 + k * 2.4, 2.2, -5.8); },
      acts: function (K, A) { var TUNES = { rec_waltz: [392, 0, 494, 523, 0, 494, 440, 0, 392, 0, 330, 349, 392, 0, 0, 392], rec_boogie: [262, 330, 392, 440, 392, 330, 262, 0, 294, 349, 440, 494, 440, 349, 294, 0], rec_night: [220, 0, 262, 0, 330, 0, 294, 262, 220, 0, 196, 0, 220, 262, 0, 0] };
        A(0, -3, '🎵 Поставить пластинку', function () { modal('💿 «Пластинка»', 'sh_vinyl', 'Три пластинки, три настроения.', function (b) { Object.keys(TUNES).forEach(function (k) { var it = ITEMS[k]; rowBtn(b, it[0] + ' ' + it[1].replace('Пластинка ', ''), invOf().indexOf(k) >= 0 ? 'есть у тебя' : fmt(350), 'Слушать', function () { closeModal(); var ms = play(TUNES[k], k === 'rec_boogie' ? 170 : 260, k === 'rec_night' ? 'sine' : 'triangle'); SH.spin = ms; toast('🎵 Играет: ' + it[1].replace('Пластинка ', ''), 2600); }); });
          line(b, 'Купить с собой:', 'sec'); buyRows(b, [['rec_waltz', 350], ['rec_boogie', 350], ['rec_night', 350]]); }); });
        A(-5, 2.6, '🕺 Потанцевать', function () { cutscene(async function () { play([262, 330, 392, 523, 392, 330, 262, 330], 180); for (var i = 0; i < 16; i++) { player.yaw += PI / 4; comp.yaw -= PI / 4; await W(110); } await say([['sh_vinyl', 'Вот это вайб.'], ['gus', 'Я крутился не специально.']]); }); }); } },
    { id: 'books', name: 'АБЗАЦ', full: 'Книжный «Абзац»', e: '📚', reg: 'W', fc: '#5a3a28', ac: 0x2a5a3a, sc: ['#2a5a3a', '#f4e8c8'], seller: ['Библиотекарь Инна', '#f4e8c8'], look: { top: 0x6a5a8a, pants: 0x3a3a3a, hair: 0x8a8a8a, hairStyle: 'bob', skin: 0xf3cdb0 },
      greet: 'Тише. Здесь книги думают.', wall: 0x6a4a30, floor: 0x7a5a3a,
      prop: function (B, x, y, z) { for (var i = 0; i < 4; i++) B.box(x, y + 1 + i * .55, z, 2.4 - i * .25, .5, 1.6, [0xd84a3a, 0x3a8ac0, 0xf2c230, 0x2fae5b][i], i * .2); },
      inside: function (K) { room(K, 14, 12, 0x6a4a30, 0x7a5a3a, 0xd4a840); for (var i = 0; i < 4; i++) shelf(K, -5 + i * 3.4, -5.4, 0, 3, [0xd84a3a, 0x3a8ac0, 0xf2c230, 0x2fae5b, 0x8a3a8a, 0xe8e0d0]); shelf(K, -6.4, 0, PI / 2, 4, [0xd84a3a, 0x2a5a3a, 0xe8e0d0]);
        counter(K, 4.5, 2, 3, 0x5a3a28); K.b(1.4, .5, 1.2, 0x8a2a2a, -3, 0, 2.6); K.bp(1.4, .9, .3, 0x8a2a2a, -3, .5, 3.1); K.m(G.cyl, 0xffe8b0, [.4, .5, .4], [-1.6, 1.6, 2.8]); rug(K, -2, 2, 4, 3, 0x8a3a3a); },
      acts: function (K, A) { var EX = [['«Гусь: инструкция по применению»', 'Глава 7. Если гусь смотрит на вас — он не смотрит на вас. Он смотрит СКВОЗЬ вас. В батон.'], ['«Дыры и как в них не падать»', 'Совет №1: обходите. Совет №2: см. совет №1. Совет №3 потерян, автор упал в дыру.'], ['«Чэай: история одного слова»', '…и тогда кто-то сказал «чай» неправильно. Никто не поправил. Так появилась цивилизация.'], ['«Максим и 5 000 000 баллов»', 'Баллы нельзя потратить. Их можно только иметь. Это и есть счастье, считал Максим. Он ошибался.'], ['«Сто рецептов батона»', 'Рецепт 1: батон. Рецепт 2: батон, но с любовью. Рецепты 3–100: см. рецепт 2.'], ['«Светофор: взгляд изнутри»', 'Красный — это не «стой». Красный — это настроение.']];
        A(-1.5, -3.8, '📖 Почитать что-нибудь', function () { var e = pick(EX); cutscene(async function () { await say([['sys', player.name + ' открывает ' + e[0] + '.'], ['sys', e[1]], ['gus', pick(['Я бы это читал. Если бы читал.', 'Это про меня?', 'Дальше! Что там дальше?'])]]); }); });
        A(-3, 1.9, '🛋️ Зачитаться в кресле (+1 час)', function () { cutscene(async function () { await fade(1, 500, '📖 Страница… ещё страница…'); try { advanceTime(1); } catch (e) { } await W(1200); await fade(0, 500); toast('🕐 Прошёл час. Книга кончилась на самом интересном.', 3000); }); });
        A(4.5, 1, '📚 Купить книгу', function () { modal('📚 «Абзац»', 'sh_books', 'Эти три читают все. Никто не дочитал.', function (b) { buyRows(b, [['book_goose', 450], ['book_hole', 450], ['book_tea', 600]]); }); }); } },
    { id: 'pets', name: 'АКВАРИУМ', full: 'Зоомагазин «Аквариум»', e: '🐠', reg: 'E', fc: '#3aa0c8', ac: 0xf2c230, sc: ['#3aa0c8', '#ffffff'], seller: ['Зоолог Пётр', '#a8ffb0'], look: { top: 0x2fae5b, pants: 0x5a4a3a, hair: 0x3a2a20, hairStyle: 'short', skin: 0xe0b090 },
      greet: 'Рыбы не кусаются. Попугай — да.', wall: 0x2a6a8a, floor: 0xc8d8c0,
      prop: function (B, x, y, z) { B.box(x, y + 2.6, z, 3, 1.6, .4, 0x5ab0e0); B.sph(x + .6, y + 2.6, z + .3, .6, 0xf28c28); B.sph(x - .7, y + 2.8, z + .3, .4, 0xf2c230); },
      inside: function (K) { room(K, 14, 12, 0x2a6a8a, 0xc8d8c0, 0xf2c230); K.b(8, .9, 1.4, 0x3a3a3a, 0, 0, -4.8); var gl = new THREE.Mesh(G.box, new THREE.MeshLambertMaterial({ color: 0x5ab0e0, transparent: true, opacity: .45 })); gl.scale.set(8, 2.2, 1.3); gl.position.set(K.ox, 2, K.oz - 4.8); K.g.add(gl);
        SH.fish = []; for (var i = 0; i < 9; i++) { var f = K.m(G.sph, [0xf28c28, 0xf2c230, 0xd84a6a, 0x5ae0ff, 0xffffff][i % 5], [.35, .22, .12], [-3 + i * .7, 1.5 + (i % 3) * .5, -4.8]); SH.fish.push({ m: f, ph: i * 1.3, y: 1.5 + (i % 3) * .5 }); }
        K.m(G.cyl, 0x8a6a48, [.1, 2.2, .1], [5, 1.1, -1]); K.m(G.box, 0x8a6a48, [1, .06, .06], [5, 2.2, -1]); SH.parrot = K.m(G.sph, 0x2fae5b, [.4, .55, .4], [5, 2.55, -1]); K.m(G.cone, 0xf2c230, [.12, .2, .12], [5, 2.6, -.75], [PI / 2, 0, 0]); K.colC(5, -1, .3, 2.5);
        counter(K, -4, 2.5, 3, 0x6a5a3a); for (var j = 0; j < 4; j++) K.b(1, .5, .7, 0xd8c8a0, 2 + j * 1.2, 0, 4.6); },
      acts: function (K, A) { A(0, -3.6, '🐟 Покормить рыбок', function () { SH.feed = 6; toast('🐟 Рыбки собрались у поверхности. Одна обиделась — ей не досталось.', 3000); });
        A(5, .2, '🦜 Поговорить с попугаем', function () { cutscene(async function () { await say([['sh_pets', 'Это Кеша.'], ['sys', '🦜 ' + pick(['ЧЭАЙ~! ЧЭАЙ~!', 'БАТОН! БАТОН УКРАЛИ!', 'МАРЬЯ ХОРОШАЯ. ГУСЬ — ТОЖЕ НИЧЕГО.', 'ДЫРА! ВСЕ В ДЫРУ!', '5 000 000 БАЛЛОВ! ПОТРАТЬ! НЕЛЬЗЯ!'])], ['gus', 'Он знает слишком много.']]); }); });
        A(-4, 1.6, '🌾 Купить корм для гусей', function () { modal('🐠 «Аквариум»', 'sh_pets', 'Премиум-корм. Для премиум-гусей.', function (b) { buyRows(b, [['goose_food', 300]]); var n = invOf().filter(function (k) { return k === 'goose_food'; }).length; if (n) rowBtn(b, '🪿 Угостить Гуся прямо сейчас', 'есть ' + n + ' шт.', 'Угостить', function () { removeItem('goose_food'); closeModal(); feedGus(); }); }); });
        function feedGus() { cutscene(async function () { await say([['gus', 'Это… не для меня. Наверное.'], ['sys', 'Гусь съедает весь пакет за четыре секунды.'], ['gus', 'Премиум. Чувствуется.']]); hearts(comp); hearts(player); }); } } },
    { id: 'arcade', name: '8 БИТ', full: 'Аркада «8 бит»', e: '🕹️', reg: 'S', fc: '#1a0a2a', ac: 0x5ae0ff, sc: ['#1a0a2a', '#5aff8a'], seller: ['Смотритель Макс-не-тот', '#5aff8a'], look: { top: 0x5a2a8a, pants: 0x1a1a1a, hair: 0x5ae0ff, hairStyle: 'pony', skin: 0xf0c6a4 },
      greet: 'Не тот Максим. Другой. Баллов у меня нет, у меня — билеты.', wall: 0x1a0a2a, floor: 0x2a1a3a,
      prop: function (B, x, y, z) { B.box(x, y + 2.6, z, 1.6, 2.4, .8, 0x5a2a8a); B.box(x, y + 3.1, z + .42, 1.2, .9, .05, 0x5aff8a); },
      inside: function (K) { room(K, 14, 12, 0x1a0a2a, 0x2a1a3a, 0x5ae0ff); for (var i = 0; i < 5; i++) { var x = -5.6 + i * 2.8; K.b(1.4, 2.3, 1, [0x5a2a8a, 0xd8342a, 0x2a6ad8, 0xf2c230, 0x2fae5b][i], x, 0, -5); K.bp(1.1, .8, .05, K.glow([0x5aff8a, 0xff5aa0, 0x5ae0ff, 0xffd23f, 0xff8a3a][i]), x, 1.3, -4.47); }
        for (var j = 0; j < 12; j++) K.plane(1, 1, j % 2 ? 0x5ae0ff : 0xff5aa0, -6 + j, 0, .02); counter(K, 4.5, 3, 3, 0x2a2a3a); },
      acts: function (K, A) { A(-.2, -4, '🕹️ Сыграть: «Реакция» (50 ₽)', function () { if (!spend(50)) return; reaction(); });
        A(4.5, 2, '🎟️ Обменять билеты', function () { modal('🎟️ Призы', 'sh_arcade', 'Билетов: ' + st().tickets, function (b) { [['plush_goose', 10], ['arcade_pin', 15], ['duck_toy', 4]].forEach(function (q) { var it = ITEMS[q[0]]; rowBtn(b, it[0] + ' ' + it[1], q[1] + ' 🎟️', 'Обменять', function () { if (st().tickets < q[1]) { toast('Не хватает билетов.'); return; } st().tickets -= q[1]; addItem(q[0]); sv(); toast(it[0] + ' — твой!', 2200); closeModal(); }, st().tickets < q[1]); }); }); });
        function reaction() { var tries = [], round = 0, t0 = 0, state = 'wait', tm = null;
          modal('🕹️ «Реакция»', 'sh_arcade', 'Жми, когда загорится ЗЕЛЁНЫЙ. 5 раундов.', function (b) { var pad = document.createElement('button'); pad.style.cssText = 'width:100%;height:180px;border-radius:16px;border:0;font:900 26px sans-serif;color:#fff;background:#8a2a2a'; pad.textContent = 'ЖДИ…'; b.appendChild(pad); var info = line(b, 'Лучший результат: ' + (st().arcade ? st().arcade + ' мс' : '—'));
            var next = function () { state = 'wait'; pad.style.background = '#8a2a2a'; pad.textContent = 'ЖДИ… (' + (round + 1) + '/5)'; tm = setTimeout(function () { state = 'go'; t0 = performance.now(); pad.style.background = '#2fae5b'; pad.textContent = 'ЖМИ!'; }, 900 + Math.random() * 2200); };
            pad.onclick = function () { if (state === 'wait') { clearTimeout(tm); pad.textContent = 'Рано! Заново…'; tries.push(999); round++; } else if (state === 'go') { var ms = Math.round(performance.now() - t0); tries.push(ms); round++; pad.textContent = ms + ' мс'; try { sfx('click'); } catch (e) { } } else return;
              state = 'pause'; if (round >= 5) { var avg = Math.round(tries.reduce(function (a, c) { return a + c; }, 0) / tries.length), tk = avg < 260 ? 5 : avg < 330 ? 3 : avg < 450 ? 2 : 1; st().tickets += tk; if (!st().arcade || avg < st().arcade) st().arcade = avg; sv(); info.textContent = 'Среднее: ' + avg + ' мс · билетов +' + tk + ' (всего ' + st().tickets + ')'; pad.textContent = avg < 260 ? '🏆 РЕКОРД ВСЕЛЕННОЙ' : '🎟️ +' + tk; return; } setTimeout(next, 700); };
            next(); }); } } },
    { id: 'photo', name: 'ВСПЫШКА', full: 'Фотоателье «Вспышка»', e: '📸', reg: 'SC', fc: '#f4f0e8', ac: 0x1d2129, sc: ['#1d2129', '#ffd23f'], seller: ['Фотограф Арсений', '#ffd23f'], look: { top: 0x1d2129, pants: 0x1d2129, hair: 0x2a2a2a, hairStyle: 'long', skin: 0xf3cdb0 },
      greet: 'Улыбаемся! Гусь, тебя это тоже касается.', wall: 0xf4f0e8, floor: 0x3a3a3a,
      prop: function (B, x, y, z) { B.box(x, y + 2.8, z, 2.2, 1.4, 1, 0x1d2129); B.cyl(x, y + 2.8, z + .6, .5, .5, 0x3a3a3a, 0, PI / 2); B.box(x + .7, y + 3.6, z, .5, .3, .5, 0xf4f4f4); },
      inside: function (K) { room(K, 14, 12, 0xf4f0e8, 0x3a3a3a, 0xffd23f); K.bp(8, 4.2, .1, 0x5a7ab8, 0, 0, -5.7); K.plane(8, 4, 0x5a7ab8, 0, -3.7, .03); K.m(G.cyl, 0x2a2a2a, [.08, 1.6, .08], [0, .8, 2.2]); K.m(G.box, 0x1d2129, [.6, .45, .4], [0, 1.75, 2.2]); K.colC(0, 2.2, .3, 2);
        [-3.5, 3.5].forEach(function (x) { K.m(G.cyl, 0x2a2a2a, [.06, 2.6, .06], [x, 1.3, 1]); K.m(G.box, 0xffffff, [1, 1, .1], [x, 2.8, 1]); K.colC(x, 1, .2, 2.6); });
        for (var i = 0; i < 5; i++) K.bp(.8, 1, .05, [0xd8c8b0, 0xb8d8e8, 0xe8c8d8, 0xc8e8c0, 0xf4e8a8][i], -6.9, 1.6, -3 + i * 1.4, null); },
      acts: function (K, A) { A(0, 1.2, '📸 Сфотографироваться (200 ₽)', function () { if (!spend(200)) return; shoot(K); }); } },
    { id: 'coffee', name: 'ЧЭАЙ-БРЮ', full: 'Кофейня «Чэай-брю»', e: '☕', reg: 'E', fc: '#5a3a28', ac: 0xe8d8b0, sc: ['#3a2418', '#e8d8b0'], seller: ['Бариста Ника', '#e8d8b0'], look: { top: 0x3a2418, pants: 0x2a2a2a, hair: 0x2a1a10, hairStyle: 'pony', skin: 0xe0b090 },
      greet: 'Чэай? Нет, у нас кофе. Но вывеска досталась от прошлых владельцев.', wall: 0xe8d8b8, floor: 0x6a4a30,
      prop: function (B, x, y, z) { B.cyl(x, y + 2.6, z, 1, 1.4, 0xffffff); B.cyl(x, y + 3.32, z, .9, .06, 0x6a3a1a); B.box(x + 1.2, y + 2.6, z, .25, .7, .12, 0xffffff); },
      inside: function (K) { room(K, 14, 12, 0xe8d8b8, 0x6a4a30, 0x3a2418); counter(K, 0, -4.2, 7, 0x3a2418); K.bp(1.2, 1.2, .8, 0x9aa0a8, -2, 1.1, -4.4); K.bp(.6, .8, .6, 0x2a2a2a, 2, 1.1, -4.4);
        [[-4, 1.5], [0, 2.5], [4, 1.5]].forEach(function (p) { K.m(G.cyl, 0x6a4a30, [1.2, .06, 1.2], [p[0], .8, p[1]]); K.m(G.cyl, 0x3a2418, [.12, .8, .12], [p[0], .4, p[1]]); K.colC(p[0], p[1], .6, .9); }); plant(K, -6, -4.6); plant(K, 6, 4.6); },
      acts: function (K, A) { A(0, -3.2, '☕ Латте с рисунком (180 ₽)', function () { var arts = ['🪿', '🫖', '🥖', '❤️', '🌸', '🐰', '🕳️', '⭐', '🌙']; modal('☕ «Чэай-брю»', 'sh_coffee', 'Что нарисовать на пенке?', function (b) { var r = document.createElement('div'); r.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin:8px 0';
          arts.forEach(function (a) { var bt = document.createElement('button'); bt.className = 'bt2'; bt.style.cssText = 'font-size:34px;width:64px;height:64px'; bt.textContent = a; bt.onclick = function () { if (!spend(180)) return; addItem('latte'); closeModal(); cutscene(async function () { await say([['sh_coffee', 'Рисую ' + a + '…'], ['sys', '☕ На пенке: ' + a + '. ' + pick(['Почти как на картинке.', 'Получилось лучше, чем задумано.', 'Бариста фотографирует это для портфолио.'])], ['gus', a === '🪿' ? 'Это я! Я не буду это пить. Я буду это хранить.' : 'Красиво. Пей быстро, пока не растаяло. Ой, это не мороженое.']]); }); }; r.appendChild(bt); }); b.appendChild(r); }); }); } },
    { id: 'gym', name: 'ЖИМ', full: 'Спортзал «Жим»', e: '🏋️', reg: 'E', fc: '#2a2a2a', ac: 0xf2c230, sc: ['#f2c230', '#1d1d1d'], seller: ['Тренер Глеб', '#ffd23f'], look: { top: 0xd8342a, pants: 0x1d1d1d, hair: 0x1a1a1a, hairStyle: 'none', skin: 0xd8a070, scale: 1.08 },
      greet: 'Пришли качаться или смотреть? Смотреть — тоже кардио.', wall: 0x3a3a3a, floor: 0x1d1d1d,
      prop: function (B, x, y, z) { B.box(x, y + 3, z, 3.8, .25, .25, 0x9aa0a8); [-1.6, 1.6].forEach(function (s) { B.cyl(x + s, y + 3, z, .9, .3, 0x1d1d1d, 0, 0, PI / 2); }); },
      inside: function (K) { room(K, 14, 12, 0x3a3a3a, 0x1d1d1d, 0xf2c230); K.plane(12, 10, 0x2a3a2a, 0, 0, .02); for (var i = 0; i < 3; i++) { var x = -4 + i * 4; K.b(1.4, .5, .5, 0x5a5a5a, x, 0, -3.6); K.m(G.cyl, 0x9aa0a8, [.08, 2, .08], [x, 1.4, -3.6], [0, 0, PI / 2]); [-.9, .9].forEach(function (s) { K.m(G.cyl, 0x1d1d1d, [.5, .14, .5], [x + s, 1.4, -3.6], [0, 0, PI / 2]); }); }
        K.bp(10, 2, .05, 0xcfe6ff, 0, 1, -5.8); for (var j = 0; j < 5; j++) K.b(.8, .9, .8, 0x2a2a2a, -5 + j * 2.5, 0, 4); },
      acts: function (K, A) { A(0, -2.6, '🏋️ Жим на время (8 секунд)', function () { var n = 0, t0 = 0, done = false; modal('🏋️ «Жим»', 'sh_gym', 'Жми кнопку как можно чаще. Рекорд: ' + (st().gym || 0), function (b) { var bt = document.createElement('button'); bt.style.cssText = 'width:100%;height:170px;border-radius:16px;border:0;font:900 30px sans-serif;background:#f2c230;color:#111'; bt.textContent = 'ЖМИ!'; b.appendChild(bt); var info = line(b, '');
          bt.onclick = function () { if (done) return; if (!t0) { t0 = performance.now(); var tm = setInterval(function () { var left = 8 - (performance.now() - t0) / 1000; if (left <= 0) { clearInterval(tm); done = true; var rec = n > (st().gym || 0); if (rec) st().gym = n; sv(); bt.textContent = n + ' раз' + (rec ? ' · РЕКОРД!' : ''); info.textContent = n >= 60 ? '💪 Тренер Глеб уважительно кивает.' : n >= 40 ? '👍 Неплохо!' : 'Гусь пробовал: 3 раза. Ты лучше.'; return; } info.textContent = '⏱ ' + left.toFixed(1) + ' с'; }, 100); } n++; bt.textContent = n; }; }); });
        A(-5, 3.2, '🪿 Гусь пробует штангу', function () { cutscene(async function () { await say([['gus', 'Смотри. Это легко.'], ['sys', 'Гусь берётся за гриф. Гриф не двигается. Гусь тоже.'], ['sh_gym', 'Начнём с палки от швабры.'], ['gus', 'Я разогреваюсь. Это была разминка.']]); }); }); } },
    { id: 'karaoke', name: 'МИКРОФОН', full: 'Караоке «Микрофон»', e: '🎤', reg: 'S', fc: '#3a0a3a', ac: 0xff5aa0, sc: ['#3a0a3a', '#ffd23f'], seller: ['Ведущая Жанна', '#ff9ad0'], look: { top: 0xd84a9a, pants: 0x1d1d1d, hair: 0xf2f0e8, hairStyle: 'longF', skin: 0xf3cdb0 },
      greet: 'Петь умеют все. Некоторые — громко.', wall: 0x3a1a4a, floor: 0x1a0a2a,
      prop: function (B, x, y, z) { B.cyl(x, y + 2.4, z, .35, 1.6, 0x2a2a2a); B.sph(x, y + 3.4, z, .55, 0x9aa0a8); },
      inside: function (K) { room(K, 14, 12, 0x3a1a4a, 0x1a0a2a, 0xff5aa0); K.b(8, .5, 3, 0x5a2a6a, 0, 0, -4.2); K.bp(6, 3, .1, K.glow(0x2a3a8a), 0, 1.2, -5.7); K.m(G.cyl, 0x2a2a2a, [.06, 1.5, .06], [0, 1.25, -3.6]); K.m(G.sph, 0x9aa0a8, [.2, .25, .2], [0, 2.1, -3.6]);
        SH.disco = K.m(G.sph, 0xdddddd, [.9, .9, .9], [0, 4, 0]); [[-4, 2.5], [4, 2.5]].forEach(function (p) { K.b(3, .5, 1.2, 0x8a2a5a, p[0], 0, p[1]); }); },
      acts: function (K, A) { var SONGS = { 'Батон-рок': ['🎵 Я купил батон в субботу,', '🎵 Он сбежал к утру в работу,', '🎵 Батон, батон, вернись домой,', '🎵 Ты хлеб, но ты всегда со мной!'], 'Гусиный блюз': ['🎵 Я гусь, я грущу на мосту,', '🎵 Я видел дыру — и в ней пустоту,', '🎵 Но Марья сказала: «Пошли пить чэай»,', '🎵 И блюз мой закончился. Вот так, прощай.'], 'Сити огни': ['🎵 Башни горят, как зубы дракона,', '🎵 Я еду на надземке без телефона,', '🎵 Город не спит, и я не сплю,', '🎵 Я просто стою и всех вас люблю!'] };
        A(0, -2.4, '🎤 Спеть', function () { modal('🎤 «Микрофон»', 'sh_karaoke', 'Выбирай песню. Слова на экране.', function (b) { Object.keys(SONGS).forEach(function (k) { rowBtn(b, '🎶 ' + k, 'песня местных авторов', 'Петь', function () { closeModal(); sing(k, SONGS[k]); }); }); }); });
        function sing(k, lines) { cutscene(async function () { var mel = { 'Батон-рок': [330, 392, 440, 392], 'Гусиный блюз': [262, 311, 349, 262], 'Сити огни': [440, 494, 523, 587] }[k]; var dl = []; lines.forEach(function (l, i) { play([mel[i % 4], mel[(i + 1) % 4], mel[(i + 2) % 4]], 220, 'square'); dl.push([player.id === 'gus' ? 'gus' : 'marya', l]); });
          await say(dl); var stars = 3 + Math.floor(Math.random() * 3); await say([['sh_karaoke', '⭐'.repeat(stars) + ' — ' + ['', '', '', 'неплохо!', 'отлично!', 'зал аплодирует стоя!'][stars]], ['gus', pick(['Теперь я. Ой, нет, я стесняюсь.', 'Я подпевал. Мысленно. Громко.', 'Это была лучшая песня про ' + (k === 'Батон-рок' ? 'батон' : k === 'Гусиный блюз' ? 'меня' : 'башни') + '.'])]]); }); } } },
    { id: 'laundry', name: 'БАРАБАН', full: 'Прачечная «Барабан»', e: '🧺', reg: 'E', fc: '#e8f4f8', ac: 0x2a8ac0, sc: ['#2a8ac0', '#ffffff'], seller: ['Тётя Галя', '#bfe6ff'], look: { top: 0x8ad8e0, pants: 0x5a5a6a, hair: 0x8a6a4a, hairStyle: 'bun', skin: 0xf0c6a4 },
      greet: 'Стираем всё, кроме прошлого.', wall: 0xe8f4f8, floor: 0xd8d8d8,
      prop: function (B, x, y, z) { B.box(x, y + 2.6, z, 1.8, 1.8, .6, 0xf4f4f4); B.cyl(x, y + 2.6, z + .32, .6, .05, 0x5ab0e0, 0, PI / 2); },
      inside: function (K) { room(K, 14, 12, 0xe8f4f8, 0xd8d8d8, 0x2a8ac0); SH.drums = []; for (var i = 0; i < 6; i++) { var x = -5 + i * 2; K.b(1.6, 1.6, 1, 0xf4f4f4, x, 0, -5.2); var d = K.m(G.cyl, 0x5ab0e0, [1, .06, 1], [x, .85, -4.68], [PI / 2, 0, 0]); SH.drums.push(d); }
        K.b(6, .5, .6, 0x8a6a48, 0, 0, 3.6); K.bp(1.4, .9, .9, 0xc8b898, 4.8, 0, 3.2); counter(K, -5, 2, 2.5, 0x9aa0a8); },
      acts: function (K, A) { A(0, -3.8, '🧺 Постирать одежду (100 ₽)', function () { if (!spend(100)) return; cutscene(async function () { SH.spinFast = 6; await fade(1, 400, '🧺 Барабан крутится…'); await W(1500); await fade(0, 400); toast('🧺 Одежда чистая. Пахнет «альпийской свежестью» и немного батоном.', 3200); }); });
        A(4, 3.8, '🪿 Гусь заглядывает в машинку', function () { cutscene(async function () { await say([['gus', 'Интересно, что там внутри…'], ['sys', 'Гусь наклоняется слишком сильно. Дверца захлопывается.']]); SH.spinFast = 4; comp.g.visible = false; await fade(1, 300, '🌀 вжжжж-вжжжж-вжжжж'); await W(1300); await fade(0, 300); comp.g.visible = true; await say([['gus', 'Я… чистый. Очень чистый. Мир… крутится.'], ['sh_laundry', 'Режим «деликатный». Повезло тебе.']]); }); }); } },
    { id: 'watch', name: 'ТИК-ТАК', full: 'Часовщик «Тик-так»', e: '🕰️', reg: 'W', fc: '#3a2a1a', ac: 0xd4a840, sc: ['#3a2a1a', '#f4e0a0'], seller: ['Мастер Ефим', '#f4e0a0'], look: { top: 0x5a4a3a, pants: 0x3a2a1a, hair: 0xe0e0e0, hairStyle: 'short', skin: 0xf0c6a4 },
      greet: 'Время можно не только чинить. Его можно переводить. За плату.', wall: 0x5a4030, floor: 0x3a2a1a,
      prop: function (B, x, y, z) { B.cyl(x, y + 3, z, 1.5, .2, 0xf4ecd8, 0, PI / 2); B.box(x, y + 3.35, z + .12, .1, .8, .05, 0x111111); B.box(x + .25, y + 3, z + .13, .55, .08, .05, 0x111111, 0, -.5); },
      inside: function (K) { room(K, 14, 12, 0x5a4030, 0x3a2a1a, 0xd4a840); counter(K, 0, -3.6, 5, 0x3a2418); SH.hands = []; for (var i = 0; i < 6; i++) { var x = -6 + i * 2.4, y = 2 + (i % 2) * .7; K.bp(1.2, 1.2, .1, 0xf4ecd8, x, y, -5.75); var hnd = new THREE.Mesh(G.box, mat(0x111111)); hnd.scale.set(.06, .5, .04); hnd.position.set(K.ox + x, y + .6, K.oz - 5.68); K.g.add(hnd); SH.hands.push({ m: hnd, sp: .3 + i * .4 }); }
        K.b(1, 3.4, .8, 0x5a3418, -6, 0, 3); K.m(G.cyl, 0xd4a840, [.5, .05, .5], [-6, 2.4, 3.42], [PI / 2, 0, 0]); },
      acts: function (K, A) { A(0, -2.8, '🕰️ Перевести время в городе', function () { modal('🕰️ «Тик-так»', 'sh_watch', 'Куда переводим? Сейчас ' + Math.floor(WORLD.t) + ':' + String(Math.floor((WORLD.t % 1) * 60)).padStart(2, '0') + '.', function (b) { [['🌅 Рассвет', 6], ['☀️ Полдень', 12], ['🌇 Закат', 19], ['🌙 Полночь', 0]].forEach(function (q) { rowBtn(b, q[0] + ' (' + q[1] + ':00)', fmt(300), 'Перевести', function () { if (!spend(300)) return; WORLD.t = q[1]; try { saveWorld(); } catch (e) { } closeModal(); cutscene(async function () { await fade(1, 400, '🕰️ Тик-так…'); await W(900); await fade(0, 500); toast('🕰️ Когда выйдете на улицу, там будет ' + q[1] + ':00.', 3000); }); }); }); }); }); } },
    { id: 'flowers', name: 'РОМАШКА', full: 'Цветы «Ромашка»', e: '💐', reg: 'SC', fc: '#f4e8f0', ac: 0x2fae5b, sc: ['#ffffff', '#d84a9a'], seller: ['Флористка Оля', '#ffb0d0'], look: { top: 0xffd0e0, pants: 0x5a8a5a, hair: 0xd8783a, hairStyle: 'longF', skin: 0xf3cdb0 },
      greet: 'Соберите букет сами. Я только подскажу, что ромашки — не огурцы.', wall: 0xf4e8f0, floor: 0xc8d8b0,
      prop: function (B, x, y, z) { for (var i = 0; i < 7; i++) { var a = i / 7 * PI * 2; B.sph(x + Math.cos(a) * .9, y + 3 + Math.sin(a) * .9, z, .55, 0xffffff); } B.sph(x, y + 3, z + .1, .6, 0xf2c230); },
      inside: function (K) { room(K, 14, 12, 0xf4e8f0, 0xc8d8b0, 0x2fae5b); counter(K, 2, -4, 5, 0xd8c8a8); for (var i = 0; i < 8; i++) { var x = -6 + (i % 4) * 1.4, z = i < 4 ? -4.8 : 3.8; K.m(G.cyl, 0x8a8a9a, [.8, .7, .8], [x, .35, z]); for (var j = 0; j < 5; j++) K.m(G.sph, [0xffffff, 0xd84a6a, 0xf2c230, 0x9a5ad8, 0xff8a3a, 0x5a9ae8, 0xff5aa0, 0xffffff][i], [.25, .25, .25], [x + Math.cos(j) * .25, .9 + Math.random() * .3, z + Math.sin(j) * .25]); K.colC(x, z, .4, 1); } },
      acts: function (K, A) { var FL = [['🌼', 'ромашки'], ['🌹', 'розы'], ['🌷', 'тюльпаны'], ['🌻', 'подсолнух'], ['💜', 'лаванда'], ['🌸', 'сакура']];
        A(2, -3, '💐 Собрать свой букет', function () { var pick3 = []; var dr = function () { modal('💐 «Ромашка»', 'sh_flowers', pick3.length < 3 ? 'Выберите цветок (' + (pick3.length + 1) + ' из 3).' : 'Готово!', function (b) {
          if (pick3.length < 3) FL.forEach(function (f) { rowBtn(b, f[0] + ' ' + f[1], '100 ₽', 'Добавить', function () { pick3.push(f); dr(); }); });
          else { var name = 'Букет: ' + pick3.map(function (f) { return f[0]; }).join(''); line(b, name + ' (' + pick3.map(function (f) { return f[1]; }).join(', ') + ')'); rowBtn(b, '💐 Завернуть в бумагу', fmt(300), 'Купить', function () { if (!spend(300)) return; st().bouquet = name; addItem('bouquet'); sv(); closeModal(); cutscene(async function () { await say([['sh_flowers', 'Какое необычное сочетание: ' + pick3.map(function (f) { return f[1]; }).join(', ') + '.'], ['gus', player.id === 'gus' ? 'Это для Марьи. Не говори ей.' : 'Это мне? …Это не мне. Понял. Красиво.']]); }); }); rowBtn(b, '↩️ Собрать заново', '', 'Заново', function () { pick3 = []; dr(); }); } }); }; dr(); }); } },
    { id: 'toys', name: 'ПИЩАЛКА', full: 'Игрушки «Пищалка»', e: '🧸', reg: 'E', fc: '#ffd23f', ac: 0xd84a6a, sc: ['#d84a6a', '#ffffff'], seller: ['Продавец Тимур', '#ffd23f'], look: { top: 0xffd23f, pants: 0x3a5a8a, hair: 0x6a3a1a, hairStyle: 'short', skin: 0xd8a070 },
      greet: 'Автомат-хваталка честный. Почти.', wall: 0xfff0b0, floor: 0x9ad0ff,
      prop: function (B, x, y, z) { B.sph(x, y + 2.8, z, 1.2, 0xc89060); [-1, 1].forEach(function (s) { B.sph(x + s * .8, y + 3.9, z, .45, 0xc89060); }); B.sph(x, y + 2.6, z + 1, .4, 0xe8c8a0); },
      inside: function (K) { room(K, 14, 12, 0xfff0b0, 0x9ad0ff, 0xd84a6a); var gl = new THREE.Mesh(G.box, new THREE.MeshLambertMaterial({ color: 0xcfe6ff, transparent: true, opacity: .35 })); gl.scale.set(1.8, 1.6, 1.8); gl.position.set(K.ox + 4, 2.1, K.oz - 4); K.g.add(gl); K.b(1.9, 1.3, 1.9, 0xd84a6a, 4, 0, -4); K.bp(1.9, .2, 1.9, 0xd84a6a, 4, 2.9, -4);
        for (var i = 0; i < 7; i++) K.m(G.sph, [0xc89060, 0xffd23f, 0x5ab0e0, 0xff5aa0, 0x2fae5b][i % 5], [.35, .35, .35], [3.5 + (i % 3) * .4, 1.5, -4.5 + Math.floor(i / 3) * .4]); for (var j = 0; j < 3; j++) shelf(K, -5 + j * 3.4, -5.4, 0, 3, [0xffd23f, 0xff5aa0, 0x5ab0e0, 0x2fae5b, 0xc89060]); counter(K, -3, 3, 3, 0xd84a6a); },
      acts: function (K, A) { A(4, -2.6, '🦾 Автомат-хваталка (100 ₽)', function () { if (!spend(100)) return; claw(); });
        A(-3, 2, '🐤 Купить уточку', function () { modal('🧸 «Пищалка»', 'sh_toys', 'Уточка пищит. Всегда. Даже ночью.', function (b) { buyRows(b, [['duck_toy', 250]]); }); });
        function claw() { var pos = 0, dir = 1, tgt = 20 + Math.random() * 60, run = true; modal('🦾 Хваталка', 'sh_toys', 'Нажми «Опустить», когда клешня над игрушкой.', function (b) { var bar = document.createElement('div'); bar.style.cssText = 'position:relative;height:60px;background:#22325a;border-radius:10px;margin:8px 0;overflow:hidden'; var t = document.createElement('div'); t.style.cssText = 'position:absolute;top:30px;width:14%;height:26px;background:#ffd23f;border-radius:6px;left:' + tgt + '%'; t.textContent = '🧸'; var c = document.createElement('div'); c.style.cssText = 'position:absolute;top:2px;width:6%;height:26px;background:#d84a6a;border-radius:4px'; c.textContent = '🦾'; bar.appendChild(t); bar.appendChild(c); b.appendChild(bar);
          var tm = setInterval(function () { if (!run || !document.body.contains(bar)) { clearInterval(tm); return; } pos += dir * 1.6; if (pos > 94 || pos < 0) dir = -dir; c.style.left = pos + '%'; }, 30); var info = line(b, '');
          rowBtn(b, '⬇️ Опустить клешню', '', 'Опустить', function () { if (!run) return; run = false; var hit = pos + 3 > tgt && pos + 3 < tgt + 14, lucky = hit && Math.random() < .75; if (lucky) { addItem('plush_goose'); info.textContent = '🧸 ВЫИГРЫШ! Плюшевый гусь — в инвентаре.'; try { sfx('coin'); } catch (e) { } } else info.textContent = hit ? '😩 Схватила… и уронила. Классика.' : '🙃 Мимо.'; }); }); } } },
    { id: 'icecream', name: 'ПЛОМБИР', full: 'Мороженое «Пломбир»', e: '🍦', reg: 'SC', fc: '#fff0f4', ac: 0x8ad8e0, sc: ['#ff9ac0', '#ffffff'], seller: ['Мороженщица Даша', '#ffb0d0'], look: { top: 0xffffff, pants: 0x8ad8e0, hair: 0xf2c230, hairStyle: 'pony', skin: 0xf3cdb0 },
      greet: 'Три шарика — классика. Четыре — уже характер.', wall: 0xfff0f4, floor: 0xf4e8d0,
      prop: function (B, x, y, z) { B.cone(x, y + 2.2, z, .9, 2, 0xd8a868, PI); B.sph(x, y + 3.4, z, .9, 0xffd0e0); B.sph(x, y + 4.1, z, .7, 0x8a5a3a); },
      inside: function (K) { room(K, 14, 12, 0xfff0f4, 0xf4e8d0, 0x8ad8e0); K.b(7, 1.1, 1.2, 0xffffff, 0, 0, -4); for (var i = 0; i < 6; i++) K.bp(.9, .1, .8, [0xffd0e0, 0x8a5a3a, 0xfff4c0, 0x8ad8a0, 0xd84a6a, 0xf28c28][i], -2.9 + i * 1.15, 1.12, -4);
        [[-4, 2], [4, 2]].forEach(function (p) { K.m(G.cyl, 0xff9ac0, [1, .06, 1], [p[0], .8, p[1]]); K.m(G.cyl, 0xffffff, [.1, .8, .1], [p[0], .4, p[1]]); K.colC(p[0], p[1], .5, .9); }); },
      acts: function (K, A) { var FLV = [['🍓', 'клубничный'], ['🍫', 'шоколадный'], ['🍦', 'пломбир'], ['🌿', 'фисташковый'], ['🍒', 'вишнёвый'], ['🍊', 'апельсиновый'], ['🫖', 'чэайный (новинка)']];
        A(0, -3, '🍨 Собрать мороженое (3 шарика)', function () { var sc = []; var dr = function () { modal('🍦 «Пломбир»', 'sh_icecream', sc.length < 3 ? 'Шарик ' + (sc.length + 1) + ' из 3:' : 'Готово!', function (b) { if (sc.length < 3) FLV.forEach(function (f) { rowBtn(b, f[0] + ' ' + f[1], '', 'Этот', function () { sc.push(f); dr(); }); });
          else { line(b, '🍨 ' + sc.map(function (f) { return f[1]; }).join(' + ')); rowBtn(b, 'Взять', fmt(220), 'Купить', function () { if (!spend(220)) return; addItem('icecream3'); closeModal(); var tea = sc.some(function (f) { return /чэай/.test(f[1]); }); cutscene(async function () { await say([['sh_icecream', 'Держите. ' + (tea ? 'Чэайный — смелый выбор.' : 'Отличный выбор.')], ['gus', tea ? 'Чэайное мороженое. Мир окончательно сошёл с ума. Дай попробовать.' : 'Мозг замёрз. Это нормально? Это нормально.']]); }); }); } }); }; dr(); }); } }
  ];
  SH.DEFS = DEFS;

  /* ---------- фото: настоящий снимок экрана ---------- */
  function shoot(K) {
    cutscene(async function () {
      var c = { x: K.ox, z: K.oz + 2.2 }; placeA(player, K.ox - .7, K.oz - 2.6, 0); showComp(K.ox + .7, K.oz - 2.6); comp.yaw = 0;
      cam.fixed = { pos: new THREE.Vector3(K.ox, 1.9, K.oz + 2.6), look: new THREE.Vector3(K.ox, 1.3, K.oz - 2.6) };
      await say([['sh_photo', 'Три… два… один… Скажите «БАТОН»!']]); await W(150);
      var url = null; try { renderer.render(scene, camera); url = renderer.domElement.toDataURL('image/jpeg', .9); } catch (e) { }
      try { sfx('click'); } catch (e) { } await fade(1, 80, ''); await fade(0, 250); cam.fixed = null;
      var date = new Date(), cap = 'МГИАГ · Фотоателье «Вспышка» · ' + date.toLocaleDateString('ru-RU');
      var out = url; try { var img = new Image(); img.src = url; await new Promise(function (r) { img.onload = r; img.onerror = r; setTimeout(r, 1500); }); var cv = document.createElement('canvas'), w = 900, h = Math.round(w * (img.height || 9) / (img.width || 16)) + 110; cv.width = w + 60; cv.height = h + 60; var g = cv.getContext('2d'); g.fillStyle = '#f8f4ec'; g.fillRect(0, 0, cv.width, cv.height); if (img.width) g.drawImage(img, 30, 30, w, h - 110); g.fillStyle = '#3a2a1a'; g.font = 'bold 30px Rubik, Arial'; g.textAlign = 'center'; g.fillText(cap, cv.width / 2, h + 10); out = cv.toDataURL('image/jpeg', .9); } catch (e) { }
      addItem('photo_card');
      modal('📸 Ваше фото', 'sh_photo', 'Получилось! Гусь моргнул, но это его стиль.', function (b) { if (out) { var im = document.createElement('img'); im.src = out; im.style.cssText = 'width:100%;border-radius:8px;margin:6px 0'; b.appendChild(im); var a = document.createElement('a'); a.href = out; a.download = 'mgiag-foto.jpg'; a.textContent = '💾 Сохранить фото на устройство'; a.className = 'pbtn'; a.style.cssText = 'display:block;text-align:center;margin:6px 0;padding:10px;border-radius:10px;background:#22325a;color:#fff;text-decoration:none'; b.appendChild(a); } else line(b, 'Камера не смогла сделать снимок на этом устройстве, но рамка уже в инвентаре.'); });
    });
  }

  /* =====================================================================
     РАЗМЕЩЕНИЕ В ГОРОДЕ (вызывается модулем города при постройке)
     ===================================================================== */
  // мини-строитель фасадных «штук» (в мировых координатах, крепится к городу)
  function B_(par) { return {
    cyl: function (x, y, z, r, h, c, ry, rx, rz) { return M_(par, G.cyl, c, [r * 2, h, r * 2], [x, y, z], [rx || 0, ry || 0, rz || 0]); },
    sph: function (x, y, z, r, c) { return M_(par, G.sph, c, [r * 2, r * 2, r * 2], [x, y, z]); },
    box: function (x, y, z, w, h, d, c, ry, rz) { return M_(par, G.box, c, [w, h, d], [x, y, z], [0, ry || 0, rz || 0]); },
    cone: function (x, y, z, r, h, c, rx) { return M_(par, G.cone, c, [r * 2, h, r * 2], [x, y, z], [rx || 0, 0, 0]); } }; }
  SH.place = function (api, h) {
    SH.placed = []; var made = 0;
    var REG = function (x, z) { if (z < -742) return 'N'; if (x < -742) return 'W'; if (x > 742) return 'E'; return z > 1120 ? 'SC' : 'S'; };
    DEFS.forEach(function (d, di) {
      var spot = null;
      for (var pass = 0; pass < 2 && !spot; pass++) for (var ri = 0; ri < api.RD.length && !spot; ri++) {
        var r = api.RD[(ri * 7 + di * 3) % api.RD.length]; if (!r.P || r.loop || r.w < 6) continue;
        var L = api.resample(r.P, 18);
        for (var i = 2; i < L.length - 2 && !spot; i++) {
          var p = L[i], q = L[i + 1], a = Math.atan2(q[0] - p[0], q[1] - p[1]);
          var rg = REG(p[0], p[1]); if (rg === 'N' || (pass === 0 && rg !== d.reg)) continue;
          if (SH.placed.some(function (o) { return Math.hypot(o.x - p[0], o.z - p[1]) < 110; })) continue;
          for (var s = -1; s <= 1 && !spot; s += 2) { var w = 16, dd = 12, o = r.w / 2 + 3.8 + dd / 2 + 1, px = p[0] + Math.cos(a) * o * s, pz = p[1] - Math.sin(a) * o * s, ry = a + (s > 0 ? -PI / 2 : PI / 2);
            if (api.outside(px, pz) && h.rectOK(px, pz, w + 4, dd + 4, ry, 2.5)) spot = { x: px, z: pz, ry: ry, w: w, d: dd }; }
        }
      }
      if (!spot) { SH.stats.miss = (SH.stats.miss || []).concat(d.id); return; }
      try { front(d, spot, h, api); SH.placed.push({ id: d.id, x: spot.x, z: spot.z }); made++; } catch (e) { console.error('[SHOPS front]', d.id, e); }
    });
    SH.stats.placed = made;
  };
  function front(d, sp, h, api) {
    var x = sp.x, z = sp.z, ry = sp.ry, L = h.lohi(x, z, sp.w, sp.d, ry), g = h.grp(x, 0, z, ry), ht = 6 + (d.id.length % 3) * 1.4, top = L.hi + ht;
    h.fbox(g, sp.w, top - L.base, sp.d, 0, L.base, 0, 0, h.fmat(d.fc, h.TX.shop, h.TX.shopEm), 7);
    h.box(g, sp.w + .4, .5, sp.d + .4, 0x5a5e66, 0, top + .25, 0); h.box(g, sp.w - 1, .16, 2, d.ac, 0, L.lo + 3, sp.d / 2 + 1, [.2, 0, 0]);
    h.box(g, 2.2, 2.8, .2, 0x2a2018, 0, L.lo + 1.4, sp.d / 2 + .1);
    var p = h.loc(x, z, ry, 0, sp.d / 2 + .25); h.sg(d.name, Math.max(6, d.name.length * .62), 1.4, p[0], L.lo + 4.6, p[1], ry, d.sc[0], d.sc[1], { fs: .62 });
    var e = emojiSprite(d.e, 1.8), ep = h.loc(x, z, ry, sp.w / 2 - 1.6, sp.d / 2 + .6); e.position.set(ep[0], L.lo + 3.9, ep[1]); cityG.add(e);
    // своя «штука» на фасаде/крыше
    var pg = new THREE.Group(); pg.position.set(x, 0, z); pg.rotation.y = ry; cityG.add(pg); d.prop(B_(pg), 0, top - 1.2, sp.d / 2 - 1.2, 0);
    h.col(x, z, sp.w, sp.d, ry, top);
    var door = h.loc(x, z, ry, 0, sp.d / 2 + 1.6);
    addI({ p: function () { return window.MG_EXPAND && MG_EXPAND.active ? { x: door[0], z: door[1] } : null; }, r: 2.4, label: '🚪 Зайти: «' + d.full.replace(/^[^«]*«|»$/g, '') + '»', act: function () { enter(d, { x: door[0], z: door[1], ry: ry }); } });
    api.lm.push({ x: x, z: z, e: d.e, n: d.full });
  }

  /* ---------- вход, выход, свет, видимость ---------- */
  var RET = null, IDX = 0;
  function areaId(d) { return 'sh_' + d.id; }
  function ensure(d) {
    if (SH.built[d.id]) return SH.built[d.id]; var id = areaId(d), i = DEFS.indexOf(d), prev = BA;
    var K = MG_DIST.Kit(id, -6000 + i * 70, -6200); K.def = d;
    try { BA = id; camBlock[id] = camBlock[id] || []; who(d.id, d.seller[0], d.seller[1]); d.inside(K);
      var npc = K.npc('shp_' + d.id, d.seller[0], d.look, (d.id === 'karaoke' ? 2 : 0), -5, 0); K.seller = npc;
      var A = function (lx, lz, label, fn) { addI({ area: id, p: { x: K.ox + lx, z: K.oz + lz }, r: 2.2, label: label, act: function () { if (blocked()) return; st().visits[d.id] = (st().visits[d.id] || 0) + 1; fn(); } }); };
      d.acts(K, A);
      addI({ area: id, p: { x: K.ox, z: K.oz + 4.9 }, r: 2, label: '🚪 Выйти на улицу', act: leave });
    } finally { BA = prev || 'city'; }
    SH.built[d.id] = K; return K;
  }
  function enter(d, ret) {
    if (typeof blocked === 'function' && blocked()) return;
    cutscene(async function () {
      await fade(1, 380, d.e + ' ' + d.full); var K = ensure(d); RET = ret;
      try { if (player.drive) exitVehicle(); } catch (e) { } try { dismount(player); } catch (e) { }
      setArea(areaId(d)); placeA(player, K.ox, K.oz + 2.6, PI); showComp(K.ox + 1.3, K.oz + 3); cam.yaw = 0; cam.pitch = .45; await W(200); await fade(0, 450);
      var s = st(); if (!s.visits['in_' + d.id]) { s.visits['in_' + d.id] = 1; sv(); await say([['sh_' + d.id, d.greet]]); }
    });
  }
  function leave() {
    cutscene(async function () { await fade(1, 350); setArea('city'); var r = RET || { x: 0, z: 20, ry: 0 }; placeA(player, r.x, r.z, r.ry); showComp(r.x + Math.cos(r.ry) * 1.4, r.z - Math.sin(r.ry) * 1.4); cam.yaw = r.ry + PI; await W(150); await fade(0, 450); try { fullSave(false); } catch (e) { } });
  }
  SH.enter = function (id) { var d = DEFS.filter(function (q) { return q.id === id; })[0], pl = SH.placed.filter(function (q) { return q.id === id; })[0]; if (d) enter(d, pl ? { x: pl.x, z: pl.z + 10, ry: 0 } : null); };
  SH.ensure = function (id) { var d = DEFS.filter(function (q) { return q.id === id; })[0]; return d ? ensure(d) : null; };
  function tick(dt, t) {
    if (typeof area === 'undefined' || area.indexOf('sh_') !== 0) return;
    // свет как в помещении
    try { scene.background.setHex(0x20242c); fog.near = 30; fog.far = 120; hemi.intensity = .98; sun.intensity = .4; } catch (e) { }
    var k = area.slice(3);
    if (k === 'pets' && SH.fish) SH.fish.forEach(function (f, i) { var u = t * (.4 + i * .05) + f.ph; f.m.position.x = SH.built.pets.ox - 3.2 + ((u * 1.3) % 6.6 + 6.6) % 6.6; f.m.position.y = (SH.feed > 0 ? 2.8 : f.y) + Math.sin(u * 2) * .12; });
    if (SH.feed > 0) SH.feed -= dt;
    if (k === 'pets' && SH.parrot) SH.parrot.rotation.y = Math.sin(t * 1.5) * .6;
    if (k === 'vinyl' && SH.turn) SH.turn.rotation.y += dt * (SH.spin > 0 ? 6 : .4); if (SH.spin > 0) SH.spin -= dt * 1000;
    if (k === 'karaoke' && SH.disco) SH.disco.rotation.y += dt;
    if (k === 'laundry' && SH.drums) { SH.drums.forEach(function (d, i) { d.rotation.y += dt * (SH.spinFast > 0 ? 14 : 1 + i * .3); }); if (SH.spinFast > 0) SH.spinFast -= dt; }
    if (k === 'watch' && SH.hands) SH.hands.forEach(function (hh) { hh.m.rotation.z = -t * hh.sp; });
  }
  var hooked = false;
  function install() {
    if (hooked || typeof worldReady === 'undefined' || !worldReady || typeof setArea !== 'function' || !window.MG_DIST || typeof CLOTHES === 'undefined' || typeof addAcc !== 'function') return;
    hooked = true; registry();
    var ps = setArea; window.setArea = setArea = function (a) { ps(a); for (var id in SH.built) SH.built[id].g.visible = (a === 'sh_' + id); };
    var pe = updEnv, w = function (dt, t) { pe(dt, t); try { tick(dt, t); } catch (e) { console.error('[SHOPS tick]', e); } }; w.__mgGfx = pe.__mgGfx; w.__mgUltra = pe.__mgUltra; window.updEnv = updEnv = w;
    // внутри магазина нельзя переключить героя на того, кто на улице: оба всегда заходят вместе — ок
  }
  var iv = setInterval(function () { try { install(); if (hooked) clearInterval(iv); } catch (e) { console.error('[SHOPS install]', e); clearInterval(iv); } }, 400);
})();
