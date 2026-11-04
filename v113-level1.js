/* СЮЖЕТКА №1 — «5 000 000 БАЛЛОВ МАКСИМА» */
(function () {
  'use strict';
  var T = window.MG_STORY, D = window.MG_DIST, PI = Math.PI;
  if (!T || !D || !D.Kit) { console.error('[LEVEL1] Не найден каркас сюжеток или Kit районов.'); return; }

  var L = { title: '5 000 000 баллов Максима', phase: 'home', picked: 0, holeSeen: false, holeBig: false, cart: null, areas: {} };
  var HOME = null, STREET = null, STORE = null, MAXIM = null;
  var offset = -900;

  function areaKit(id) {
    var K = D.Kit(id, offset, 0); offset -= 180;
    L.areas[id] = K; return K;
  }
  function move(id, x, z) {
    setArea(id); BA = id;
    Object.keys(L.areas).forEach(function (key) { L.areas[key].g.visible = key === id; });
    var K = L.areas[id];
    placeA(player, K.ox + x, K.oz + z, Math.PI);
    if (player.g) player.g.visible = true;
    if (typeof comp !== 'undefined' && comp && comp.g) comp.g.visible = false;
    cam.yaw = 0; cam.pitch = .32; cam.fixed = null;
  }
  function line(lines) { return say(lines); }
  function interact(K, x, z, label, fn, radius) {
    K.addBiz('story_' + label, x, z, label, fn, radius || 2.5);
  }
  function buildHome() {
    HOME = areaKit('p1_home'); BA = 'p1_home';
    HOME.plane(54, 54, 0x777d83, 0, 0, 0);
    HOME.plane(18, 14, 0x9b9b94, 0, 1, .03);
    HOME.b(12, 4.8, .7, 0xd8c6a7, 0, 2.4, -6);
    HOME.b(11, 3.2, .5, 0xb77b52, 0, 1.6, 6);
    HOME.b(2.4, 2.4, .25, 0x5c4030, 0, 1.2, 6.35);
    HOME.sign('ДОМ', 4, .8, 0, 4.8, -6.5, 0, '#46536a', '#ffffff');
    interact(HOME, 0, 9, '🚪 Выйти из дома', async function () {
      await line([['marya','Ну что, идём в магазин?'],['gus','А зачем?'],['marya','За покупками. И не задавай лишних вопросов.']]);
      L.phase = 'street'; move('p1_street', 0, 24);
    });
  }
  function buildStreet() {
    STREET = areaKit('p1_street'); BA = 'p1_street';
    STREET.plane(58, 100, 0x777b78, 0, 0, 0);
    STREET.plane(13, 100, 0x3d4248, 0, 0, .025);
    STREET.plane(5, 100, 0xb4b0a4, -9, 0, .04);
    STREET.plane(5, 100, 0xb4b0a4, 9, 0, .04);
    for (var z = -42; z <= 42; z += 8) STREET.plane(.22, 3.2, 0xe8dfb9, 0, z, .05);
    STREET.b(10, 7, 10, 0xc8b9a2, -19, 3.5, -28);
    STREET.b(10, 7, 10, 0xd2c8b7, 19, 3.5, 26);
    STREET.tree(-15, 12, 'round', .8); STREET.tree(15, -14, 'round', .8);
    STREET.disc(2.4, 0x171923, -5.5, -7, .07, 36);
    STREET.disc(1.8, 0x080a10, -5.5, -7, .08, 36);
    STREET.sign('ПЕРЕКРЁСТОК', 7, .8, 0, 4.5, -47, 0, '#24764b', '#ffffff');
    // Входная группа магазина: две стойки и козырёк оставляют проход посередине.
    STREET.b(1.1, 4.2, 1.0, 0x3d654b, -2.9, 0, -43.5);
    STREET.b(1.1, 4.2, 1.0, 0x3d654b, 2.9, 0, -43.5);
    STREET.b(6.9, .65, 1.2, 0x24764b, 0, 4.0, -43.5);
    STREET.sign('ВХОД', 2.2, .65, 0, 2.6, -43.95, 0, '#17452d', '#ffffff');
    interact(STREET, -5.5, -7, '🕳️ Осмотреть дыру', async function () {
      if (L.phase === 'street_end') { await growHole(); return; }
      if (L.holeSeen) { toast('Дыра всё ещё здесь.'); return; }
      L.holeSeen = true;
      await line([['gus','Э-э… А это что?'],['marya','Яма. Наверное, дорожники опять что-то раскопали.'],['gus','Но там темно. Очень темно.'],['marya','Не трогай. Нам в магазин надо.']]);
      toast('Ты заметил странную дыру.');
    });
    interact(STREET, 0, -43, '🚪 Войти в Перекрёсток', async function () {
      if (L.phase !== 'street') return;
      if (!L.holeSeen) { await line([['sys','По пути стоит осмотреть странное место у дороги.']]); return; }
      await line([['marya','Ладно, пошли за покупками.']]);
      L.phase = 'shop'; move('p1_store', 0, 19);
    });
  }
  function buildStore() {
    STORE = areaKit('p1_store'); BA = 'p1_store';
    STORE.plane(52, 48, 0xb9b6aa, 0, 0, 0);
    STORE.plane(48, 43, 0xe0ddd3, 0, 0, .03);
    STORE.b(32, 5, .8, 0x3f7a58, 0, 2.5, -20);
    STORE.sign('ПЕРЕКРЁСТОК', 12, 1.5, 0, 5.5, -20.6, 0, '#24764b', '#ffffff');
    for (var i = 0; i < 3; i++) {
      var x = -13 + i * 13;
      STORE.b(8, 2.4, 2.2, 0x8a6548, x, 1.2, -5);
      STORE.b(7.4, .22, 1.8, 0xd9d2bd, x, 2.5, -5);
      for (var j = 0; j < 4; j++) STORE.b(1.1, .9, .9, [0xc65b4b,0xd4b64d,0x7aa65d,0x9b7db2][j], x - 2.6 + j * 1.7, 3.05, -5);
    }
    STORE.b(7, 1.1, 2.8, 0x555a61, 0, .55, 12);
    STORE.sign('КАССА', 4, .7, 0, 2.2, 10.5, 0, '#3e4652', '#ffffff');
    L.cart = STORE.b(1.6, .5, 2.2, 0xb5b9bd, 5, .25, 16);
    interact(STORE, -13, -2.5, '🥫 Взять продукты', function () { pickItem('🥫 Консервы'); });
    interact(STORE, 0, -2.5, '🍞 Взять хлеб', function () { pickItem('🍞 Хлеб'); });
    interact(STORE, 13, -2.5, '🥛 Взять молоко', function () { pickItem('🥛 Молоко'); });
    // Максим — полноценная модель персонажа, а не только имя в диалоге.
    if (typeof makePerson === 'function' && typeof makeActor === 'function') {
      MAXIM = makeActor('p1_maxim', 'Максим', makePerson({
        skin: 0xe6b994, top: 0x3569a8, pants: 0x292d36,
        shoes: 0x17191d, hair: 0x3a2a20, hairStyle: 'short', wide: .52
      }), 'story');
      STORE.g.add(MAXIM.g);
      placeA(MAXIM, STORE.ox + 4.2, STORE.oz + 7.2, Math.PI);
      MAXIM.g.visible = false;
    }
    interact(STORE, 0, 16, '🛒 Подойти к кассе', checkout);
  }
  function pickItem(name) {
    if (L.phase !== 'shop') return;
    L.picked++;
    toast(name + ' добавлено в корзину (' + L.picked + '/3)', 1800);
    if (L.picked >= 3) { L.phase = 'checkout'; banner('Корзина почти полная','Теперь можно идти к кассе'); }
  }
  async function checkout() {
    if (L.picked < 3) { await line([['marya','Мы же не можем уйти с пустой корзиной. Возьмём хотя бы три вещи.']]); return; }
    L.phase = 'maxim';
    await line([
      ['shop','Следующий!'],['marya','Мы уже почти закончили.'],
      ['ex','НАКОНЕЦ-ТО Я ПРИШЁЛ ТРАТИТЬ СВОИ БАЛЛЫ! ПЯТЬ МИЛЛИОНОВ!'],
      ['gus','Пять миллионов чего?'],['ex','БАЛЛОВ! Я КОПИЛ ИХ ЦЕЛУЮ ВЕЧНОСТЬ!'],
      ['shop','Молодой человек, подождите секунду. У вас на карте… ноль баллов.'],
      ['ex','ЧЕГО?! КАК НОЛЬ?!'],['shop','Похоже, баллы уже списаны.'],
      ['ex','ДА ВЫ ИЗДЕВАЕТЕСЬ?!']
    ]);
    await line([['sys','К кассе подходит покупатель с одной жвачкой. Максим нехотя пропускает его вперёд.'],['ex','Ладно. Проходите. Мне уже всё равно.']]);
    await line([['shop','Поздравляем! Вы — миллионный покупатель! Ваш приз — купон на 1 000 000 рублей!'],['gus','Ого. Вот это поворот.'],['ex','ЧТО?! ЕМУ МИЛЛИОН, А МНЕ НИЧЕГО?!'],['shop','Таковы правила акции.']]);
    await line([['sys','Покупатель забирает купон, благодарит кассира… а затем поворачивается к Максиму.'],['note','Спасибо, что пропустили. А теперь отойдите, неудачник.'],['ex','ТЫ СЕЙЧАС СЕРЬЁЗНО?!'],['sys','Покупатель демонстративно плюёт Максиму на голову и уходит.']]);
    await line([['sys','Покупатель уходит, оставив Максима в полном недоумении. Максим выходит из магазина следом.']]);
    L.phase = 'street_end'; move('p1_street', 0, 18);
    await line([['ex','Я ПРОСТО ХОТЕЛ ПОТРАТИТЬ СВОИ БАЛЛЫ…'],['gus','Кажется, день у него не задался.'],['marya','Пойдём домой.']]);
    banner('Сюжетка продолжается','Осмотри дыру на перекрёстке');
  }
  async function growHole() {
    if (L.holeBig) return;
    L.holeBig = true;
    var K = STREET;
    K.disc(5.4, 0x080a10, -5.5, -7, .09, 48);
    K.disc(4.6, 0x030409, -5.5, -7, .1, 48);
    await line([['gus','Подожди… Она стала больше.'],['marya','Это уже точно не обычная яма.'],['sys','Земля вокруг проваливается, а тёмное отверстие расширяется. На этом первая часть истории заканчивается.']]);
    L.phase = 'done';
    T.end('✓ Сюжетка №1 завершена!');
    var done = document.createElement('button'); done.textContent = '← В главное меню'; done.style.cssText = 'position:fixed;z-index:9999;left:50%;bottom:24px;transform:translateX(-50%);padding:14px 20px;border:0;border-radius:14px;background:#f0c45b;color:#1d2942;font-weight:900;font-size:16px;';
    done.onclick = function () { location.reload(); }; document.body.appendChild(done);
  }

  function begin() {
    L.phase = 'home'; L.picked = 0; L.holeSeen = false; L.holeBig = false;
    buildHome(); buildStreet(); buildStore();
    if (MAXIM) MAXIM.g.visible = false;
    move('p1_home', 0, 16);
    line([['marya','Так, нам нужно сходить в магазин.'],['gus','А что покупаем?'],['marya','Пока не знаю. Разберёмся на месте.']]);
  }
  T.reg(1, { title: L.title, start: begin });
  window.MG_L1 = L;
  console.log('[LEVEL1] Сюжетка №1 зарегистрирована.');
})();
