/* ==========================================
   МГИАГ — СЮЖЕТКА 1
   5 000 000 БАЛЛОВ МАКСИМА
   ========================================== */

(function () {
    // Добавляем приложение «Сюжет» в телефон
if (!APPS.some(app => app[0] === 'story')) {
    APPS.push(['story', '🔴', 'Сюжет']);
}

  // Сохраняем оригинальное открытие телефона
  const originalOpenPhone = openPhone;

  // Состояние сюжетки
  if (!S.story1) {
    S.story1 = {
      started: false,
      storeEntered: false,
      finished: false
    };
  }

  // Главное меню сюжетки
  function renderStory1Menu() {
    const b = $('sheetBody');
    $('tabs').innerHTML = '';
    b.innerHTML = '';

    const h = document.createElement('h2');
    h.textContent = '🔴 Сюжет';
    b.appendChild(h);

    const info = document.createElement('div');
    info.className = 'ti';
    info.textContent = '5 000 000 баллов Максима';
    b.appendChild(info);

    const description = document.createElement('div');
    description.className = 'ti';
    description.textContent =
      'Марья вспомнила про старую карту лояльности Максима.';
    b.appendChild(description);

    const start = document.createElement('button');
    start.className = 'pbtn main';
    start.style.width = '100%';
    start.style.marginTop = '12px';

    start.textContent = S.story1.finished
      ? 'Сюжетка пройдена'
      : S.story1.started
        ? 'Продолжить'
        : 'Начать сюжетку';

    start.disabled = S.story1.finished;

    start.onclick = () => {
      closeModal();

      if (!S.story1.started) {
        startStory1();
      } else {
        openStoreScene();
      }
    };

    b.appendChild(start);
    phoneFoot();
  }

  // Подключаемся к существующему приложению телефона
  openPhone = function (app) {
    if (app === 'story') {
      phoneApp = 'story';
      openModal('phone', renderStory1Menu);
      return;
    }

    originalOpenPhone(app);
  };

  // Начало истории
  async function startStory1() {
    S.story1.started = true;
    saveGame();

    await cutscene(async () => {
      banner('НОВАЯ СЮЖЕТКА!', '5 000 000 баллов Максима');

      await say([
        ['marya', 'Слушай, я тут кое-что вспомнила...'],
        ['gus', 'Что такое?'],
        ['marya', 'У меня же до сих пор есть карта Максима из Перекрёстка!'],
        ['gus', 'И что?'],
        ['marya', 'А на ней ПЯТЬ МИЛЛИОНОВ БАЛЛОВ!'],
        ['gus', 'ЧЕГО?!'],
        ['marya', 'Предлагаю сходить в Перекрёсток и потратить их.'],
        ['gus', 'А Максим вообще знает?'],
        ['marya', 'А это уже не наши проблемы.']
      ]);

      await say([
        ['gus', 'Ладно, пошли.'],
        ['marya', 'Только карту не потеряй.'],
        ['gus', 'Это вообще-то твоя карта.']
      ]);
    });

    toast('Отправляйтесь в Перекрёсток!');
    openStoreScene();
  }

  // Отдельная сцена магазина
  function openStoreScene() {
    S.story1.storeEntered = true;
    saveGame();

    openModal('story1_store', renderStoreScene);
  }

  // Интерфейс магазина
  function renderStoreScene() {
    const b = $('sheetBody');
    $('tabs').innerHTML = '';
    b.innerHTML = '';

    const h = document.createElement('h2');
    h.textContent = '🛒 Перекрёсток';
    b.appendChild(h);

    const description = document.createElement('div');
    description.className = 'ti';
    description.textContent =
      'Марья и Гусь вошли в магазин. На карте Максима 5 000 000 баллов.';
    b.appendChild(description);

    const balance = document.createElement('div');
    balance.className = 'ti';
    balance.style.fontWeight = 'bold';
    balance.textContent = '💳 Баланс карты: 5 000 000 баллов';
    b.appendChild(balance);

    const taskTitle = document.createElement('div');
    taskTitle.className = 'sec';
    taskTitle.textContent = 'Покупки';
    b.appendChild(taskTitle);

    const taskInfo = document.createElement('div');
    taskInfo.className = 'ti';
    taskInfo.textContent =
      'Здесь будут игровые задания магазина. Их механику мы добавим следующим этапом.';
    b.appendChild(taskInfo);

    const exit = document.createElement('button');
    exit.className = 'pbtn';
    exit.style.width = '100%';
    exit.style.marginTop = '12px';
    exit.textContent = 'Выйти из магазина';

    exit.onclick = () => {
      closeModal();
      toast('Марья и Гусь пока ещё в магазине.');
    };

    b.appendChild(exit);

    footClose();
  }

})();