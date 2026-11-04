/* МГИАГ 1.13.2 — продолжение основного сюжета: «5 000 000 баллов Максима».
   Глава встроена в существующий город, систему заданий, диалогов, персонажей и сохранений.
   Никаких отдельных карт, режимов или кнопок запуска. */
(function () {
  'use strict';
  if (window.__MG_MAXIM5M_INSTALLED) return;
  window.__MG_MAXIM5M_INSTALLED = true;

  var QUEST = 'maxim5m';
  var CX = 82, CZ = -24;
  var HOLE = { x: 64, z: -12 };
  var STORE = null, holeG = null, buyer = null, buyerReady = false;
  var built = false, maximPlaced = false;
  var picked = ['bread', 'milk', 'cans'];

  function q() { return S.q; }
  function stage() { return Number(q().maxim5mStage || 0); }
  function setStage(n) { q().maxim5mStage = n; saveGame(); }
  function unlocked() { return !!q().ufo; }
  function done() { return !!q()[QUEST]; }
  function say(lines) { return window.say(lines); }
  function moveActor(a, x, z, speed) {
    if (!a) return Promise.resolve();
    return walkTo(a, x, z, speed || 2.6);
  }

  function buildHole() {
    if (holeG) return;
    holeG = new THREE.Group();
    holeG.position.set(HOLE.x, H(HOLE.x, HOLE.z) + .08, HOLE.z);
    cityG.add(holeG);
    var outer = new THREE.Mesh(new THREE.CircleGeometry(1.45, 40), new THREE.MeshBasicMaterial({ color: 0x24232b }));
    outer.rotation.x = -Math.PI / 2; outer.position.y = 0; holeG.add(outer);
    var inner = new THREE.Mesh(new THREE.CircleGeometry(1.02, 40), new THREE.MeshBasicMaterial({ color: 0x050609 }));
    inner.rotation.x = -Math.PI / 2; inner.position.y = .025; holeG.add(inner);
    var rim = new THREE.Mesh(new THREE.RingGeometry(1.35, 1.55, 40), new THREE.MeshBasicMaterial({ color: 0x45434b, side: THREE.DoubleSide }));
    rim.rotation.x = -Math.PI / 2; rim.position.y = .045; holeG.add(rim);
    holeG.visible = unlocked() && !done();
  }

  function addWall(parent, w, h, d, color, x, y, z) {
    return box(parent, w, h, d, color, x, y, z, { col: true, cam: true });
  }
  function addProduct(parent, x, y, z, color, w, h, d) {
    return box(parent, w || .65, h || .62, d || .55, color, x, y, z, { dyn: false });
  }

  function buildStore() {
    if (built || !unlocked() || !worldReady) return;
    built = true;
    var oldBA = BA;
    BA = 'city';
    try {
      STORE = new THREE.Group();
      STORE.name = 'MG_Perekrestok_MainStory';
      cityG.add(STORE);
      var gy = H(CX, CZ);

      // Пол магазина лежит непосредственно в основном городе — без телепортации и смены карты.
      var floor = new THREE.Mesh(new THREE.PlaneGeometry(18, 16), mat(0xd9d7ce));
      floor.rotation.x = -Math.PI / 2; floor.position.set(CX, gy + .045, CZ); STORE.add(floor);

      // Стены с реальным проёмом входа шириной 8 метров.
      addWall(STORE, 18, 5.2, .55, 0x3e7255, CX, gy, CZ - 8);
      addWall(STORE, .55, 5.2, 16, 0xe6e4dc, CX - 9, gy, CZ);
      addWall(STORE, .55, 5.2, 16, 0xe6e4dc, CX + 9, gy, CZ);
      addWall(STORE, 5, 5.2, .55, 0x3e7255, CX - 6.5, gy, CZ + 8);
      addWall(STORE, 5, 5.2, .55, 0x3e7255, CX + 6.5, gy, CZ + 8);

      // Лёгкая полупрозрачная крыша: интерьер остаётся видимым, но здание выглядит цельным.
      var roof = new THREE.Mesh(new THREE.BoxGeometry(18.2, .22, 16.2), new THREE.MeshBasicMaterial({ color: 0x3e7255, transparent: true, opacity: .22 }));
      roof.position.set(CX, gy + 5.25, CZ); STORE.add(roof);
      sign(STORE, 'ПЕРЕКРЁСТОК', 8.5, 1.15, CX, gy + 4.1, CZ + 8.34, 0, '#24764b', '#ffffff', { ds: true, fs: .52 });
      sign(STORE, 'ВХОД', 2.4, .55, CX, gy + 2.65, CZ + 8.34, 0, '#17452d', '#ffffff', { ds: true, fs: .5 });

      // Три проходных стеллажа и товары. Коллизии не перекрывают подход к товарам.
      var shelves = [CX - 5.7, CX, CX + 5.7];
      shelves.forEach(function (x, i) {
        addWall(STORE, 3.6, 1.05, 1.0, 0x805b3c, x, gy, CZ - 1.0);
        addWall(STORE, 3.7, .12, 1.12, 0xd5cbb8, x, gy + 1.08, CZ - 1.0);
        addProduct(STORE, x - 1.0, gy + 1.2, CZ - 1.0, [0xc65b4b, 0xd4b64d, 0x7aa65d][i]);
        addProduct(STORE, x, gy + 1.2, CZ - 1.0, [0x7aa65d, 0xc65b4b, 0x9b7db2][i]);
        addProduct(STORE, x + 1.0, gy + 1.2, CZ - 1.0, [0x9b7db2, 0x7aa65d, 0xd4b64d][i]);
      });

      // Касса и лента.
      addWall(STORE, 4.6, 1.05, 1.25, 0x555a61, CX + 1.0, gy, CZ - 6.0);
      var belt = new THREE.Mesh(new THREE.BoxGeometry(3.7, .08, .82), mat(0x252a31));
      belt.position.set(CX + 1.0, gy + 1.12, CZ - 6.0); STORE.add(belt);
      sign(STORE, 'КАССА', 2.6, .55, CX + 1.0, gy + 2.0, CZ - 6.7, Math.PI, '#3e4652', '#ffffff', { ds: true });

      // Небольшая корзина у входа.
      addWall(STORE, .9, .55, .8, 0xb5b9bd, CX - 6.6, gy, CZ + 4.8);

      buildHole();
      addI({ p: { x: HOLE.x, z: HOLE.z }, r: 2.8, label: '🕳️ Осмотреть тёмную яму', ok: function () { return unlocked() && !done() && stage() === 0; }, act: seeHole });
      addI({ p: { x: CX, z: CZ + 9.2 }, r: 3.0, label: '🚪 Войти в Перекрёсток', ok: function () { return unlocked() && !done() && stage() === 1; }, act: enterStore });
      addI({ p: { x: CX - 5.7, z: CZ + 1.1 }, r: 2.5, label: '🥫 Взять консервы', ok: function () { return stage() === 2 && !has('cans'); }, act: function () { take('cans', '🥫 Консервы'); } });
      addI({ p: { x: CX, z: CZ + 1.1 }, r: 2.5, label: '🍞 Взять хлеб', ok: function () { return stage() === 2 && !has('bread'); }, act: function () { take('bread', '🍞 Хлеб'); } });
      addI({ p: { x: CX + 5.7, z: CZ + 1.1 }, r: 2.5, label: '🥛 Взять молоко', ok: function () { return stage() === 2 && !has('milk'); }, act: function () { take('milk', '🥛 Молоко'); } });
      addI({ p: { x: CX + 1.0, z: CZ - 4.1 }, r: 2.7, label: '🛒 Подойти к кассе', ok: function () { return stage() === 3; }, act: checkout });
      addI({ p: { x: HOLE.x, z: HOLE.z }, r: 3.2, label: '🕳️ Подойти к увеличившейся яме', ok: function () { return stage() === 4; }, act: finishAtHole });

      // Используем уже существующего Максима из основного мира, а не создаём его дубль.
      if (typeof maksim !== 'undefined' && maksim) {
        maksim.hidden = true;
        maksim.g.visible = false;
      }
      buyer = makeActor('maxim5m_buyer', 'Покупатель', makePerson({ skin: 0xe6b994, top: 0x9b493e, pants: 0x30343b, shoes: 0x17191d, hair: 0x2a201b, hairStyle: 'short', wide: .48 }), 'city');
      scene.remove(buyer.g); cityG.add(buyer.g);
      buyer.hidden = true; buyer.g.visible = false; buyer.area = 'city'; buyerReady = true;

      // Объект магазина появляется только после разблокировки главы, поэтому невидимых коллизий нет.
      if (stage() >= 3) showMaxim();
    } finally {
      BA = oldBA;
    }
  }

  function has(id) {
    var a = q().maxim5mPicked;
    return Array.isArray(a) && a.indexOf(id) >= 0;
  }
  function take(id, label) {
    if (stage() !== 2 || has(id)) return;
    if (!Array.isArray(q().maxim5mPicked)) q().maxim5mPicked = [];
    q().maxim5mPicked.push(id);
    saveGame(); sfx('click');
    var count = q().maxim5mPicked.length;
    toast(label + ' добавлено в корзину (' + count + '/3)', 1900);
    if (count >= 3) { setStage(3); banner('Корзина собрана', 'Теперь подойди к кассе'); }
  }

  async function seeHole() {
    if (stage() !== 0) return;
    await cutscene(async function () {
      await say([['gus', 'Э-э… А это что?'], ['marya', 'Яма. Наверное, дорожники опять что-то раскопали.'], ['gus', 'Но там темно. Очень темно.'], ['marya', 'Не трогай. Нам в магазин надо.']]);
      setStage(1);
      toast('Новое дело: зайти в Перекрёсток.');
    });
  }

  async function enterStore() {
    if (stage() !== 1) return;
    await cutscene(async function () {
      await say([['marya', 'Давай быстро купим продукты.'], ['gus', 'Я надеюсь, тут есть что-нибудь вкусное.']]);
      setStage(2);
      q().maxim5mPicked = [];
      saveGame();
    });
  }

  function showMaxim() {
    if (typeof maksim === 'undefined' || !maksim) return;
    if (!maximPlaced) {
      if (stage() >= 4) placeA(maksim, CX + 7.0, CZ + 9.0, Math.PI);
      else placeA(maksim, CX + 4.0, CZ - 5.9, Math.PI);
      maximPlaced = true;
    }
    maksim.hidden = false;
    maksim.g.visible = true;
    maksim.area = 'city';
    maksim.ai = null;
    maksim.pose = 'think';
  }

  async function checkout() {
    if (stage() !== 3) return;
    await cutscene(async function () {
      showMaxim();
      if (buyer) { buyer.hidden = false; buyer.g.visible = true; placeA(buyer, CX, CZ + 9.5, Math.PI); }
      await moveActor(maksim, CX + 1.2, CZ - 5.8, 2.2);
      await say([
        ['shop', 'Следующий!'], ['marya', 'Мы уже почти закончили.'],
        ['ex', 'НАКОНЕЦ-ТО Я ПРИШЁЛ ТРАТИТЬ СВОИ БАЛЛЫ! ПЯТЬ МИЛЛИОНОВ!'],
        ['gus', 'Пять миллионов чего?'], ['ex', 'БАЛЛОВ! Я КОПИЛ ИХ ЦЕЛУЮ ВЕЧНОСТЬ!'],
        ['shop', 'Молодой человек, подождите секунду. У вас на карте… ноль баллов.'],
        ['ex', 'ЧЕГО?! КАК НОЛЬ?!'], ['shop', 'Похоже, баллы уже списаны.'], ['ex', 'ДА ВЫ ИЗДЕВАЕТЕСЬ?!']
      ]);
      await moveActor(buyer, CX + 1.0, CZ - 4.2, 2.7);
      await say([['sys', 'К кассе подходит покупатель с одной жвачкой. Максим нехотя пропускает его вперёд.'], ['ex', 'Ладно. Проходите. Мне уже всё равно.']]);
      await say([['shop', 'Поздравляем! Вы — миллионный покупатель! Ваш приз — купон на 1 000 000 рублей!'], ['gus', 'Ого. Вот это поворот.'], ['ex', 'ЧТО?! ЕМУ МИЛЛИОН, А МНЕ НИЧЕГО?!'], ['shop', 'Таковы правила акции.']]);
      await say([['buyer', 'Спасибо, что пропустили. А теперь отойдите, неудачник.'], ['ex', 'ТЫ СЕЙЧАС СЕРЬЁЗНО?!'], ['sys', 'Покупатель демонстративно унижает Максима и плюёт ему на голову.']]);
      await say([['sys', 'Покупатель забирает купон и уходит. Максим выходит из магазина следом.']]);
      await moveActor(buyer, CX, CZ + 10.5, 3.0);
      buyer.hidden = true; buyer.g.visible = false;
      await moveActor(maksim, CX + 7.0, CZ + 9.0, 2.6);
      maksim.pose = 'think';
      setStage(4);
      banner('История продолжается', 'Вернись к странной яме возле магазина');
    });
  }

  async function finishAtHole() {
    if (stage() !== 4) return;
    await cutscene(async function () {
      if (holeG) holeG.scale.set(3.1, 1, 3.1);
      await say([['gus', 'Подожди… Она стала намного больше.'], ['marya', 'Это уже точно не обычная яма.'], ['sys', 'Тёмное отверстие расширяется прямо посреди улицы. Похоже, это только начало.']]);
      setStage(5);
      complete(QUEST);
      if (holeG) holeG.visible = true;
      toast('✓ Основной сюжет продолжен: 5 000 000 баллов Максима.');
    });
  }

  function ensureWorld() {
    if (!unlocked() || done() || !worldReady) return;
    buildStore();
    if (holeG) holeG.visible = true;
    if (stage() >= 3 && stage() < 5) showMaxim();
  }

  // Включаем нового покупателя в штатный цикл анимации NPC основного города.
  var oldExtraActors = extraActors;
  extraActors = function () {
    var list = oldExtraActors();
    if (buyer && !buyer.hidden) list.push(buyer);
    return list;
  };

  // Добавляем главу в существующий список основного сюжета и общий счётчик прохождения.
  if (Array.isArray(MAIN) && !MAIN.some(function (m) { return m.id === QUEST; })) {
    MAIN.push({ id: QUEST, icon: '🛒', title: '5 000 000 баллов Максима', who: 'Гусь и Марья · Перекрёсток' });
  }
  if (Array.isArray(STORY_ORDER) && STORY_ORDER.indexOf(QUEST) < 0) STORY_ORDER.push(QUEST);
  Object.assign(WHO, { buyer: ['Покупатель', '#d9e2ec'] });

  // Обычный HUD ведёт игрока по главе; все остальные игровые зоны сохраняют свои задания.
  var oldObjective = objective;
  objective = function () {
    if (unlocked() && !done() && area === 'city') {
      ensureWorld();
      var s = stage();
      if (s === 0) return { t: '🔴 Новое задание: осмотри странную тёмную яму возле Перекрёстка.', p: HOLE };
      if (s === 1) return { t: '🔴 Задание: зайди в Перекрёсток и купи продукты.', p: { x: CX, z: CZ + 9.2 } };
      if (s === 2) {
        var a = q().maxim5mPicked || [];
        var ids = ['cans', 'bread', 'milk'], pts = [{ x: CX - 5.7, z: CZ + 1.1 }, { x: CX, z: CZ + 1.1 }, { x: CX + 5.7, z: CZ + 1.1 }];
        var i = ids.findIndex(function (id) { return a.indexOf(id) < 0; });
        return { t: '🛒 Собери продукты: ' + a.length + '/3.', p: i < 0 ? { x: CX + 1, z: CZ - 4.1 } : pts[i] };
      }
      if (s === 3) return { t: '🔴 Корзина готова. Подойди к кассе.', p: { x: CX + 1, z: CZ - 4.1 } };
      if (s === 4) return { t: '🔴 Вернись к странной яме возле магазина.', p: HOLE };
    }
    return oldObjective();
  };

  // В телефоне глава отображается в уже существующем списке «Основной сюжет», не создавая новое приложение.
  var oldRenderTodo = renderTodo;
  renderTodo = function () {
    oldRenderTodo();
    if (todoTab !== 0) return;
    var body = $('sheetBody');
    if (!body || !unlocked()) return;
    var row = document.createElement('div');
    row.className = 'ti' + (done() ? ' done' : '');
    var icon = document.createElement('span'); icon.className = 'ic'; icon.textContent = '🛒';
    var tx = document.createElement('span'); tx.className = 'tx';
    var nm = document.createElement('span'); nm.className = 'nm'; nm.textContent = '5 000 000 БАЛЛОВ МАКСИМА';
    var wh = document.createElement('span'); wh.className = 'wh'; wh.textContent = done() ? 'Гусь и Марья · Перекрёсток' : 'Гусь и Марья · Перекрёсток';
    tx.appendChild(nm); tx.appendChild(wh);
    var state = document.createElement('span'); state.className = 'st'; state.textContent = done() ? '✓ ВЫПОЛНЕНО' : (stage() ? '▸ сейчас' : '');
    row.appendChild(icon); row.appendChild(tx); row.appendChild(state); body.appendChild(row);
  };

  // Старый пропуск сюжета не должен молча перескакивать через новую главу без её событий.
  var oldSkipStory = skipStory;
  skipStory = function () {
    if (STORY_ORDER.find(function (id) { return !S.q[id]; }) === QUEST) {
      toast('Эту главу нужно пройти в городе — найди тёмную яму возле Перекрёстка.');
      return;
    }
    return oldSkipStory();
  };

  // Восстанавливаем сцену после загрузки сохранения, не создавая отдельный мир.
  var tries = 0;
  var timer = setInterval(function () {
    tries++;
    if (worldReady) {
      clearInterval(timer);
      if (unlocked() && !done()) ensureWorld();
    } else if (tries > 80) clearInterval(timer);
  }, 250);

  window.MG_L1 = { title: '5 000 000 баллов Максима', integrated: true, stage: stage };
  console.log('[MG_1.13.2] Глава встроена в основной городской мир.');
})();
