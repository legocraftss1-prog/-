/* ======================================
   МГИАГ — СЮЖЕТКА 1
   5 000 000 БАЛЛОВ МАКСИМА
   ====================================== */

// Добавляем приложение в телефон
if (!APPS.some(app => app[0] === 'story')) {
    APPS.push(['story', '🔴', 'Сюжет']);
}

// Сохраняем оригинальный рендер телефона
const originalRenderPhoneStory1 = renderPhone;

// Добавляем отображение нашего приложения
renderPhone = function () {

    if (phoneApp !== 'story') {
        originalRenderPhoneStory1();
        return;
    }

    $('tabs').innerHTML = '';

    const b = $('sheetBody');
    b.innerHTML = '';

    const h = document.createElement('h2');
    h.textContent = '🔴 Сюжет';
    b.appendChild(h);

    const info = document.createElement('div');
    info.className = 'ti';
    info.textContent = 'Доступные сюжетные истории:';
    b.appendChild(info);

    const card = document.createElement('div');
    card.className = 'ti';

    const name = document.createElement('h3');
    name.textContent = '🛒 5 000 000 баллов Максима';
    card.appendChild(name);

    const description = document.createElement('p');
    description.textContent =
        'Марья вспомнила про карту Максима из Перекрёстка. На ней целых пять миллионов баллов!';
    card.appendChild(description);

    const start = document.createElement('button');
    start.className = 'pbtn main';
    start.style.width = '100%';
    start.textContent = 'Начать сюжетку';

    start.onclick = async () => {
        closeModal();

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
        });

        toast('Отправляйтесь в Перекрёсток!');
    };

    card.appendChild(start);
    b.appendChild(card);

    phoneFoot();
    b.scrollTop = 0;
};

console.log('МГИАГ: сюжетка 1 подключена!');