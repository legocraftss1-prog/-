/* =====================================================================
   МГИАГ 1.12 «Карта и удобство» — БИЗНЕСЫ И ЭКОНОМИКА НОВЫХ РАЙОНОВ
   Использует уже существующие системы игры: addMoney / spend / addItem / removeItem /
   timing (мини-игра) / openModal + rowBtn (тетрадные меню) / say / saveGame.
   Все данные хранятся в S.d12 внутри обычного сохранения.
   ===================================================================== */
(function () {
  'use strict';
  var B = window.MG_BIZ = { cfg: {} };
  function rdy() { return typeof S !== 'undefined' && S && typeof addMoney === 'function' && typeof openModal === 'function'; }
  function now() { return Date.now(); }
  function S12() {
    if (!S.d12) S.d12 = { v: 1 };
    var d = S.d12; d.bank = d.bank || {}; d.cd = d.cd || {}; d.buffs = d.buffs || {}; d.seen = d.seen || {}; d.mk = d.mk || { t: 0, stock: [] }; d.stats = d.stats || {};
    return d;
  }
  B.S12 = S12;
  function fmtM(n) { return typeof fmt === 'function' ? fmt(n) : String(n); }
  function stat(k, n) { var s = S12().stats; s[k] = (s[k] || 0) + (n || 1); }
  function cdLeft(k) { return Math.max(0, (S12().cd[k] || 0) - now()); }
  function setCd(k, ms) { S12().cd[k] = now() + ms; }
  function buffOn(k) { return (S12().buffs[k] || 0) > now(); }
  function buffLeft(k) { return Math.max(0, (S12().buffs[k] || 0) - now()); }
  function setBuff(k, ms) { var d = S12(); d.buffs[k] = Math.max(now(), d.buffs[k] || 0) + ms; saveGame(); }
  B.buffOn = buffOn; B.setBuff = setBuff; B.buffLeft = buffLeft;
  function earn(n, why) { var m = buffOn('earn') ? 1.15 : 1; var v = Math.round(n * m); addMoney(v, why); stat('earned', v); return v; }
  function count(k) { return invOf().filter(function (x) { return x === k; }).length; }
  function mm(ms) { var s = Math.ceil(ms / 1000); return s >= 60 ? Math.floor(s / 60) + ' мин ' + (s % 60) + ' с' : s + ' с'; }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function pk(a) { return a[Math.floor(Math.random() * a.length)]; }

  /* ---------------- новые предметы ---------------- */
  var NEW = {
    coffee: ['☕', 'Капучино с гусём', 'Узор на пенке — гусь. Бодрит на 2 минуты.'],
    pie: ['🥧', 'Пирог «Утиный»', 'Начинка секретная. Лечит.'],
    medkit: ['💊', 'Аптечка', 'Восстанавливает здоровье.'],
    fish: ['🐟', 'Окунь', 'Свежий. Продаётся на причале или в ломбарде.'],
    bigfish: ['🐠', 'Золотой карась', 'Редкий улов. Ломбард даст хорошую цену.'],
    boot: ['👢', 'Сапог', 'Один. Левый. Улов дня.'],
    flowers: ['💐', 'Букет', 'Пахнет лугом. Можно продать.'],
    book: ['📖', 'Книга «Гуси и смысл»', 'Прочитай — заработок вырастет на 15% на 5 минут.'],
    prize: ['🧸', 'Плюшевый гусь', 'Приз из аркады. Ломбард ценит.'],
    pizza_slice: ['🍕', 'Пицца «Вулкан»', 'Горячая. Подарок для желудка.']
  };
  var EAT = {
    coffee: 'Узор на пенке расплылся в гуся. Ты чувствуешь скорость.',
    pie: 'Начинка… утиная. Нет, не спрашивай. Но тепло.',
    medkit: 'Пластырь с гусём. Лучше стало сразу.',
    book: 'Ты прочёл первые три страницы. Остальное — «внутренний гусь».',
    pizza_slice: 'Сыр тянется до соседнего района.'
  };
  var FX = {
    coffee: function () { setBuff('speed', 120000); toast('☕ Скорость +20% на 2 минуты', 2600); },
    pie: function () { heal(40); },
    medkit: function () { heal(100); },
    book: function () { setBuff('earn', 300000); toast('📖 Заработок +15% на 5 минут', 2800); },
    pizza_slice: function () { heal(25); }
  };
  function heal(n) { try { if (typeof player.hp === 'number') { player.hp = Math.min(100, player.hp + n); if (typeof toast === 'function') toast('❤️ Здоровье: ' + Math.round(player.hp), 1600); } else toast('❤️ Полегчало', 1600); } catch (e) { } }
  function registerItems() {
    for (var k in NEW) { if (!ITEMS[k]) ITEMS[k] = NEW[k]; }
    for (var e in EAT) { if (!EATL[e]) EATL[e] = EAT[e]; }
    if (typeof useItem === 'function' && !useItem.__mgD) {
      var orig = useItem;
      var w = function (k) { if (FX[k] && invOf().indexOf(k) >= 0) { orig(k); try { FX[k](); } catch (e) { console.error(e); } return; } return orig(k); };
      w.__mgD = true; window.useItem = useItem = w;
    }
  }
  // ускорение пешком от баффа
  function hookSpeed() {
    if (typeof updPlayer !== 'function' || updPlayer.__mgBuff) return;
    var prev = updPlayer;
    var w = function (dt) {
      var c = player, onFoot = !c.drive, px = c.pos.x, pz = c.pos.z;
      prev(dt);
      try { if (onFoot && !c.drive && buffOn('speed') && !c.target && !c.ovr) { c.pos.x = px + (c.pos.x - px) * 1.2; c.pos.z = pz + (c.pos.z - pz) * 1.2; if (typeof collide === 'function') collide(c.pos, .35, c.feet); } } catch (e) { }
    };
    w.__mgBuff = true; window.updPlayer = updPlayer = w;
  }

  /* ---------------- меню в стиле тетради ---------------- */
  function menu(title, fill) {
    openModal('biz', function () {
      var b = $('sheetBody'); b.innerHTML = ''; var h = document.createElement('h2'); h.textContent = title; b.appendChild(h);
      var m = document.createElement('div'); m.style.cssText = 'font-size:15px;opacity:.8;margin-bottom:6px'; m.textContent = '💰 ' + fmtM(money()) + ' · ' + player.name; b.appendChild(m);
      fill(b, function () { menu(title, fill); });
      var f = $('sheetFoot'); if (f) { f.innerHTML = ''; var c = document.createElement('button'); c.className = 'pbtn'; c.textContent = 'Закрыть'; c.onclick = closeModal; f.appendChild(c); }
    });
  }
  B.menu = menu;
  function row(b, label, sub, btn, fn, disabled) { rowBtn(b, label + (sub ? ' — ' + sub : ''), '', btn, fn, disabled); }
  function note(b, t) { var d = document.createElement('div'); d.style.cssText = 'font-size:15px;opacity:.75;margin:8px 0'; d.textContent = t; b.appendChild(d); }
  function buy(price, item, re, msg) { if (!spend(price)) return; if (item) addItem(item); stat('spent', price); if (msg) toast(msg, 2000); re(); }

  /* ---------------- мини-игра: серия попыток ---------------- */
  function series(n, label, speed, mode) {
    return new Promise(function (res) {
      var total = 0, i = 0;
      (function next() {
        if (i >= n) { res(total); return; }
        i++;
        timing(mode || 'trick', { label: label + ' (' + i + '/' + n + ')', speed: speed || 1, scale: 1.1 }).then(function (g) { total += g; setTimeout(next, 650); });
      })();
    });
  }
  B.series = series;
  function job(id, cdMs, label, n, speed, payFn, why, after) {
    closeModal();
    var left = cdLeft('job_' + id); if (left > 0) { toast('Смена закончилась. Приходи через ' + mm(left) + '.', 2400); return; }
    cutscene(async function () {
      await say([['sys', label[0]]]);
      var s = await series(n, label[1], speed);
      var max = n * 3, pay = Math.round(payFn(s, max));
      setCd('job_' + id, cdMs);
      await wait(300);
      await say([['sys', label[2](s, max, pay)]]);
      earn(pay, why); stat('jobs');
      if (after) after(s, max);
    });
  }

  /* ---------------- ломбард ---------------- */
  var PAWN = { potato: 40, newspaper: 15, card: 300, ticket: 30, fish: 150, bigfish: 1800, boot: 25, flowers: 140, prize: 700, book: 200 };
  B.PAWN = PAWN;
  B.pawn = function () {
    menu('💎 Ломбард «Золотой зуб»', function (b, re) {
      note(b, 'Принимаем всё, что блестит, пахнет или выглядит подозрительно.');
      var any = false;
      Object.keys(PAWN).forEach(function (k) {
        var n = count(k); if (!n || !ITEMS[k]) return; any = true;
        row(b, ITEMS[k][0] + ' ' + ITEMS[k][1] + (n > 1 ? ' ×' + n : ''), fmtM(PAWN[k]) + ' за штуку', 'Продать', function () { removeItem(k); addMoney(PAWN[k], 'ломбард'); stat('sold'); re(); });
        if (n > 1) row(b, '   всё сразу', fmtM(PAWN[k] * n), 'Продать ×' + n, function () { for (var i = 0; i < n; i++) removeItem(k); addMoney(PAWN[k] * n, 'ломбард'); stat('sold', n); re(); });
      });
      if (!any) note(b, 'У тебя нет ничего, что мы взяли бы. Поймай рыбу, найди цветы, выиграй приз.');
    });
  };

  /* ---------------- рыбный причал ---------------- */
  B.fishMarket = function () {
    menu('🐟 Рыбный причал «Улов дня»', function (b, re) {
      note(b, 'Покупаем улов по честным ценам. Рыбачить можно на пирсе — удочку дают бесплатно.');
      ['fish', 'bigfish', 'boot'].forEach(function (k) { var n = count(k); if (!n) return; var p = { fish: 170, bigfish: 2200, boot: 30 }[k]; row(b, ITEMS[k][0] + ' ' + ITEMS[k][1] + (n > 1 ? ' ×' + n : ''), fmtM(p) + ' за штуку', n > 1 ? 'Продать всё' : 'Продать', function () { for (var i = 0; i < n; i++) removeItem(k); addMoney(p * n, 'рыбный причал'); stat('sold', n); re(); }); });
      row(b, '🥧 Пирог «Утиный»', '450', 'Купить', function () { buy(450, 'pie', re, '🥧 Пирог в сумке'); });
    });
  };
  B.fish = function (spot) {
    if (typeof blocked === 'function' && blocked()) return; closeModal();
    return cutscene(async function () {
      toast('🎣 Закидываешь удочку…', 1800); await wait(rnd(1200, 3200)); sfx('bonk');
      toast('❗ КЛЮЁТ!', 1200);
      var g = await timing('trick', { label: 'Подсекай, пока не сорвалось!', speed: 1.15, scale: 1.0 });
      await wait(300);
      var r = Math.random(), got = null;
      if (g === 0) got = r < .45 ? 'boot' : null;
      else if (g === 1) got = r < .75 ? 'fish' : 'boot';
      else if (g === 2) got = r < .08 ? 'bigfish' : 'fish';
      else got = r < .25 ? 'bigfish' : 'fish';
      stat('fishing');
      if (!got) { toast('🐟 Сорвалась. Рыба смеётся. Это слышно.', 2400); return; }
      addItem(got); toast(ITEMS[got][0] + ' Поймано: ' + ITEMS[got][1], 2600);
      if (got === 'bigfish' && typeof unlockAch === 'function') { try { unlockAch('goldfish'); } catch (e) { } }
    });
  };

  /* ---------------- таверна, кафе, пицца, аптека, цветы, книги ---------------- */
  B.tavern = function () {
    menu('⚓ Таверна «Ржавый якорь»', function (b, re) {
      note(b, 'Стойка шатается, пирог держится. Официант нужен всегда.');
      row(b, '🥧 Пирог «Утиный»', '450', 'Купить', function () { buy(450, 'pie', re, '🥧 Держи'); });
      row(b, '☕ Кофе «Штормовой»', '300', 'Купить', function () { buy(300, 'coffee', re, '☕ Горячо'); });
      var l = cdLeft('job_waiter'); row(b, '🍽️ Смена официанта', l > 0 ? 'ещё ' + mm(l) : '1500–2600 · 4 подноса', 'Работать', function () {
        job('waiter', 90000, ['Поднос шатается, кружки скачут. Нужно успеть вовремя.', 'Неси поднос ровно', function (s, m, p) { return s >= m * .7 ? 'Ни одной разбитой кружки! Чаевые отдельно.' : s >= m * .35 ? 'Пара пятен на скатерти. Бывало хуже.' : 'Три кружки — вдребезги. Хозяин вычел, но не всё.'; }], 4, 1.05, function (s, m) { return 1500 + 1100 * s / m; }, 'смена в таверне');
      }, l > 0);
    });
  };
  B.cafe = function () {
    menu('🦆 Кафе «Утиный клюв»', function (b, re) {
      note(b, 'Здесь всё с утиным акцентом.');
      row(b, '☕ Капучино с гусём', '350', 'Купить', function () { buy(350, 'coffee', re, '☕ Держи'); });
      row(b, '🥧 Пирог «Утиный»', '450', 'Купить', function () { buy(450, 'pie', re, '🥧 Держи'); });
      row(b, '🍕 Кусочек пиццы', '300', 'Купить', function () { buy(300, 'pizza_slice', re, '🍕 Горячо'); });
    });
  };
  B.pizzeria = function () {
    menu('🌋 Пиццерия «Вулкан»', function (b, re) {
      note(b, 'Тесто — лава. Сыр — магма. Курьеры нужны всегда.');
      row(b, '🍕 Пицца «Вулкан» (кусок)', '300', 'Купить', function () { buy(300, 'pizza_slice', re, '🍕 Горячо'); });
      var l = cdLeft('job_pizza');
      row(b, '🛵 Доставка пиццы', l > 0 ? 'ещё ' + mm(l) : '3 адреса · до 4500 + чаевые', 'Взять заказ', function () { closeModal(); if (window.MG_DIST && MG_DIST.startDelivery) MG_DIST.startDelivery(); }, l > 0);
    });
  };
  B.pharmacy = function () {
    menu('➕ Аптека «Зелёный крест»', function (b, re) {
      note(b, 'Без рецепта — только то, что и так можно.');
      row(b, '💊 Аптечка', '600', 'Купить', function () { buy(600, 'medkit', re, '💊 Аптечка в сумке'); });
      row(b, '☕ Энергетик-капучино', '350', 'Купить', function () { buy(350, 'coffee', re, '☕ Держи'); });
    });
  };
  B.flowerShop = function () {
    menu('💐 Цветочный «Лютик»', function (b, re) {
      note(b, 'Букеты на любой повод. Особенно на «просто так».');
      row(b, '💐 Букет', '220', 'Купить', function () { buy(220, 'flowers', re, '💐 Красота'); });
      var n = count('flowers'); if (n) row(b, '💐 Твои букеты ×' + n, '140 за штуку', 'Продать', function () { removeItem('flowers'); addMoney(140, 'цветочный'); re(); });
    });
  };
  B.bookshop = function () {
    menu('📖 Книжный «Страница 404»', function (b, re) {
      note(b, 'Нужная книга всегда на следующей полке. Которой нет.');
      row(b, '📖 «Гуси и смысл»', '400', 'Купить', function () { buy(400, 'book', re, '📖 Прочитаешь — станешь богаче'); });
      var n = count('book'); if (n) row(b, '📖 Книги ×' + n, '200 за штуку', 'Продать', function () { removeItem('book'); addMoney(200, 'книжный'); re(); });
    });
  };

  /* ---------------- рынок «Блошка»: ротация товара ---------------- */
  var MK = [{ k: 'prize', base: 420 }, { k: 'book', base: 130 }, { k: 'flowers', base: 70 }, { k: 'fish', base: 95 }, { k: 'card', base: 160 }, { k: 'potato', base: 25 }];
  function mkRoll() {
    var d = S12(); if (d.mk.stock.length && now() - d.mk.t < 8 * 60000) return d.mk;
    var pool = MK.slice().sort(function () { return Math.random() - .5; }).slice(0, 4);
    d.mk = { t: now(), stock: pool.map(function (p) { return { k: p.k, price: Math.round(p.base * rnd(.7, 1.1) / 5) * 5, left: 2 }; }) };
    saveGame(); return d.mk;
  }
  B.market = function () {
    var m = mkRoll();
    menu('🧺 Рынок «Блошка»', function (b, re) {
      note(b, 'Ассортимент обновляется раз в 8 минут. Цены — по настроению продавца.');
      m.stock.forEach(function (s) { if (!ITEMS[s.k]) return; row(b, ITEMS[s.k][0] + ' ' + ITEMS[s.k][1], fmtM(s.price) + ' · осталось ' + s.left, 'Купить', function () { if (s.left <= 0) return; if (!spend(s.price)) return; s.left--; addItem(s.k); stat('spent', s.price); saveGame(); re(); }, s.left <= 0); });
      note(b, 'Совет: ломбард на западе платит больше. Но туда ещё нужно дойти.');
    });
  };

  /* ---------------- банк ---------------- */
  function accrue() {
    var d = S12(), id = player.id, acc = d.bank[id] || (d.bank[id] = { amt: 0, t: now() });
    var per = 5 * 60000, n = Math.min(48, Math.floor((now() - acc.t) / per));
    if (n > 0) { for (var i = 0; i < n; i++) acc.amt += Math.floor(Math.min(acc.amt, 100000) * .015); acc.t += n * per; saveGame(); }
    if (acc.amt === 0) acc.t = now();
    return acc;
  }
  B.bank = function () {
    var acc = accrue();
    menu('🏦 «Гусбанк»', function (b, re) {
      acc = accrue();
      note(b, 'Счёт ' + player.name + ': ' + fmtM(acc.amt) + '. Вклад растёт на 1,5% каждые 5 минут (проценты начисляются на сумму до 100 000).');
      [1000, 5000, 20000].forEach(function (n) { row(b, '➕ Положить ' + fmtM(n), '', 'Внести', function () { if (!spend(n)) return; acc.amt += n; if (acc.amt === n) acc.t = now(); saveGame(); re(); }, money() < n); });
      if (money() > 0) row(b, '➕ Положить всё', fmtM(money()), 'Внести', function () { var n = money(); if (n <= 0 || !spend(n)) return; acc.amt += n; saveGame(); re(); });
      [1000, 5000, 20000].forEach(function (n) { row(b, '➖ Снять ' + fmtM(n), '', 'Снять', function () { if (acc.amt < n) return; acc.amt -= n; addMoney(n, 'снятие со счёта'); re(); }, acc.amt < n); });
      if (acc.amt > 0) row(b, '➖ Снять всё', fmtM(acc.amt), 'Снять', function () { var n = acc.amt; acc.amt = 0; addMoney(n, 'снятие со счёта'); re(); });
    });
  };

  /* ---------------- офис, диджей, караоке, аркада, кино, спортзал ---------------- */
  B.office = function () {
    var l = cdLeft('job_office');
    menu('🏢 «Гусь и Ко» — офис', function (b, re) {
      note(b, 'Работа сидячая, платят стоя. Ответственность — на тебе.');
      row(b, '🗂️ Разбор документов', l > 0 ? 'ещё ' + mm(l) : '2500–4200 · 5 папок', 'Работать', function () {
        job('office', 4 * 60000, ['Папок — гора. Подписать нужно ровно в момент, когда печать падает.', 'Ставь печать точно', function (s, m) { return s >= m * .7 ? 'Директор молча кивнул. Это высшая похвала.' : s >= m * .35 ? 'Пара бумаг перепутана. Никто не заметит. Наверное.' : 'Печать — на лбу у охранника. Но платят.'; }], 5, 1.0, function (s, m) { return 2500 + 1700 * s / m; }, 'работа в офисе');
      }, l > 0);
    });
  };
  B.dj = function () {
    var l = cdLeft('job_dj');
    menu('🎧 Клуб «НЕОН»', function (b, re) {
      note(b, 'Пульт свободен. Зал ждёт. Пятница каждый день.');
      row(b, '🎚️ Сет диджея', l > 0 ? 'ещё ' + mm(l) : '1800–3500 · 5 треков', 'Играть', function () {
        job('dj', 100000, ['Зал качается. Нужно ловить бит.', 'Лови бит', function (s, m) { return s >= m * .7 ? 'Зал визжит, бармен плачет. Чаевые летят.' : s >= m * .35 ? 'Нормально. Танцующих меньше, чем хотелось.' : 'Ты сбил бит дважды. Зал думал, это стиль.'; }], 5, 1.2, function (s, m) { return 1800 + 1700 * s / m; }, 'сет в клубе «НЕОН»');
      }, l > 0);
    });
  };
  B.karaoke = function () {
    menu('🎤 Караоке «Хрип»', function (b, re) {
      note(b, 'Вход 300. Чем точнее вступаешь — тем больше аплодисментов (и выигрыш).');
      row(b, '🎶 Спеть', '300', 'Петь', function () {
        if (!spend(300)) return; closeModal();
        cutscene(async function () { await say([['sys', 'Играет «Три гуся на одной ветке». Текст — на экране. Слова — сам знаешь.']]); var s = await series(4, 'Вступай в такт', 1.15); var pay = [0, 200, 500, 900, 1300, 1700, 2300, 3000, 3600][Math.min(8, s)];
          await say([['sys', pay >= 1700 ? 'Аплодисменты. Кто-то снял на телефон. Ты звезда на полчаса.' : pay > 300 ? 'Хлопают вежливо. Гусь в углу — искренне.' : 'Слов ты не вспомнил. Но душой — пел.']]); if (pay) earn(pay, 'приз караоке'); stat('karaoke'); });
      });
    });
  };
  var ARC = { runner: ['🏃', 'Гусь-раннер', 1.3], tower: ['🧱', 'Башня', 1.0], frog: ['🐸', 'Лягушка-перебежчик', 1.5], space: ['🚀', 'Гусиный космос', 1.25] };
  B.arcade = function (key) {
    var A = ARC[key] || ARC.runner;
    menu('🕹️ ' + A[1], function (b, re) {
      note(b, 'Жетон — 200. Три попытки. Результат превращается в билетики, билетики — в награды.');
      row(b, A[0] + ' Играть', '200', 'Играть', function () {
        if (!spend(200)) return; closeModal(); stat('spent', 200);
        cutscene(async function () { var s = await series(3, A[1] + ': жми вовремя', A[2]);
          var prize = s >= 8 ? 'prize' : null, cash = [0, 100, 200, 300, 450, 600, 800, 1000, 1400, 2000][Math.min(9, s)];
          await say([['sys', s >= 8 ? 'ДЖЕКПОТ! Автомат выплюнул плюшевого гуся.' : s >= 5 ? 'Билетики текут рекой.' : s >= 2 ? 'Пара билетиков. Копейка в копилку.' : 'Автомат подмигнул. Это он зря.']]);
          if (cash) addMoney(cash, 'выигрыш в аркаде'); if (prize) addItem(prize); stat('arcade'); });
      });
    });
  };
  B.cinema = function () {
    menu('🎬 Кинотеатр «Гуси и розы»', function (b, re) {
      note(b, 'Билет 700. После сеанса настроение отличное: заработок +15% на 10 минут.');
      var FILMS = [['«Гусь, которого не было»', 'Триллер. Гусь исчезает дважды. Режиссёр — тоже.'], ['«Автобус №0: начало»', 'Фильм про маршрут, которого нет. Билеты были. Зал — тоже.'], ['«Гриб и философия»', 'Два часа тишины. Зал аплодирует стоя.'], ['«Пятёрочка 2: Бесконечный ряд»', 'Ужасы. Касса снова закрыта.'], ['«Любовь и утки»', 'Мелодрама. Утки делают всё за главных героев.']];
      row(b, '🎟️ Купить билет и смотреть', '700', 'Билет', function () {
        if (!spend(700)) return; closeModal(); stat('spent', 700);
        cutscene(async function () { var f = pk(FILMS); await fade(1, 600, '🎬 ' + f[0]); await wait(1800); await fade(0, 600); await say([['sys', f[1]]]); setBuff('earn', 600000); toast('😊 Настроение отличное: заработок +15% на 10 минут', 3000); stat('cinema'); });
      });
    });
  };
  B.gym = function () {
    menu('🏋️ «Железный гусь»', function (b, re) {
      note(b, 'Дневной абонемент — 600: скорость бега +20% на 15 минут. Можно ещё и потренироваться за денежный приз.');
      row(b, '💳 Дневной абонемент', buffOn('speed') ? 'бафф активен ещё ' + mm(buffLeft('speed')) : '600', 'Купить', function () { if (!spend(600)) return; setBuff('speed', 15 * 60000); stat('spent', 600); toast('🏃 Скорость +20% на 15 минут', 2600); re(); });
    });
  };
  B.gymMachine = function (key) {
    var N = { bench: ['🏋️', 'Жим лёжа'], run: ['🏃', 'Беговая дорожка'], bag: ['🥊', 'Груша'] }[key] || ['🏋️', 'Тренажёр'];
    var l = cdLeft('gym_' + key);
    menu(N[0] + ' ' + N[1], function (b, re) {
      note(b, 'Три подхода. Чем точнее — тем больше довольных зрителей и призов: 300–1200.');
      row(b, N[0] + ' Тренироваться', l > 0 ? 'ещё ' + mm(l) : 'бесплатно', 'Начать', function () {
        closeModal(); setCd('gym_' + key, 120000);
        cutscene(async function () { var s = await series(3, N[1], 1.2); var pay = 300 + Math.round(900 * s / 9); await say([['sys', s >= 7 ? 'Тренер аплодирует. Ты почти не потел. Подозрительно.' : 'Дышится тяжело, но приятно.']]); earn(pay, 'приз за тренировку'); stat('gym'); });
      }, l > 0);
    });
  };
  B.garage = function () {
    var l = cdLeft('job_mech');
    menu('🔧 «Гайка и Гусь»', function (b, re) {
      note(b, 'Чиним всё, что стучит, гремит и воняет. Дешевле телефона.');
      var dmg = VEHS.filter(function (v) { return v.dmg > 0 && !v.dead; }).sort(function (a, c) { return c.dmg - a.dmg; })[0];
      row(b, '🔧 Ремонт машины', dmg ? 'самая побитая: ' + Math.round(dmg.dmg) + '% износа · 3000' : 'все машины целы', 'Починить', function () { if (!dmg) return; if (!spend(3000)) return; repairCar(dmg); stat('spent', 3000); toast('🔧 Готово. Машина как новая.', 2400); re(); }, !dmg);
      row(b, '🛠️ Помочь с ремонтом', l > 0 ? 'ещё ' + mm(l) : '1200–3900 · 4 гайки', 'Работать', function () {
        job('mech', 75000, ['Гайка ржавая, ключ скользкий. Затягивай вовремя.', 'Затяни гайку точно', function (s, m) { return s >= m * .7 ? 'Всё на месте. Даже лишних деталей нет.' : s >= m * .35 ? 'Одну гайку нашли потом в бардачке.' : 'Колесо поехало отдельно. Но платят — за старание.'; }], 4, 1.1, function (s, m) { return 1200 + 2700 * s / m; }, 'смена в мастерской');
      }, l > 0);
    });
  };
  B.greenhouse = function () {
    var l = cdLeft('job_flowers');
    menu('🌺 Оранжерея «Эдем»', function (b, re) {
      note(b, 'Вход свободный. Садовнику нужны руки — срезай цветы вовремя и забирай букеты себе.');
      row(b, '✂️ Срезать цветы', l > 0 ? 'ещё ' + mm(l) : '3–6 букетов', 'Резать', function () {
        if (l > 0) return; closeModal(); setCd('job_flowers', 90000);
        cutscene(async function () { var s = await series(3, 'Срежь цветок вовремя', 1.1); var n = Math.max(0, Math.round(s / 9 * 6)); n = Math.max(s > 0 ? 3 : 0, n); for (var i = 0; i < n; i++) addItem('flowers'); await say([['sys', n ? 'Букетов в сумке: ' + n + '. Продай их в «Лютике» или в ломбарде.' : 'Ни одного не срезал. Растения вздохнули.']]); stat('flowers', n); });
      }, l > 0);
    });
  };
  B.fountain = function () {
    menu('⛲ Фонтан желаний', function (b, re) {
      note(b, 'Брось монету — загадай желание. Фонтан иногда отвечает.');
      row(b, '🪙 Бросить монету', '100', 'Бросить', function () {
        if (!spend(100)) return; stat('spent', 100); closeModal();
        var r = Math.random();
        cutscene(async function () { sfx('coin'); await wait(500);
          if (r < .5) await say([['sys', 'Монета булькнула. Тишина. Желание принято в обработку.']]);
          else if (r < .8) { await say([['sys', 'Из воды всплыла чья-то чужая монета. Бери.']]); addMoney(180, 'фонтан'); }
          else if (r < .95) { await say([['sys', 'Фонтан выплюнул букет. Откуда он там?']]); addItem('flowers'); }
          else { await say([['sys', 'Монета вернулась с надписью «НЕ ТО». Вместе с ней — 1500. Бери, пока не передумал.']]); addMoney(1500, 'фонтан отвечает'); } stat('wish'); });
      });
    });
  };
  B.lighthouse = function () {
    var d = S12();
    cutscene(async function () {
      if (!d.seen.lighthouse) { await say([['sys', 'Смотритель маяка оставил дневник. Последняя запись: «Свет — это просто лампочка, которая верит в себя».'], ['sys', 'Под дневником — конверт. В нём 2000.']]); d.seen.lighthouse = 1; addMoney(2000, 'нашёл под дневником'); }
      else await say([['sys', 'Лампа вращается. Корабли проходят. Гуси — иногда.']]);
    });
  };
  B.clock = function () {
    var t = new Date(); toast('🕰️ Часы на башне: ' + String(t.getHours()).padStart(2, '0') + ':' + String(t.getMinutes()).padStart(2, '0') + '. Они всегда правы. Кроме четвергов.', 3600);
  };
  B.goose = function () {
    var d = S12();
    cutscene(async function () { if (!d.seen.goose) { await say([['sys', 'Золотой Гусь на постаменте. Табличка: «Основателю города за то, что не улетел».']]); d.seen.goose = 1; toast('🏆 Ты увидел главный памятник города', 2600); try { unlockAch('landmarks'); } catch (e) { } } else await say([['sys', 'Гусь смотрит вдаль. Куда — уточнять не стал.']]); });
  };

  /* ---------------- старт ---------------- */
  var inst = false;
  function tick() { if (inst || !rdy() || typeof ITEMS === 'undefined' || typeof EATL === 'undefined') return; inst = true; registerItems(); hookSpeed(); }
  setInterval(tick, 300);
  B.install = tick;
})();
