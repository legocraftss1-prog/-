/* МГИАГ 1.13 — простой каркас сюжетных режимов. */
(function () {
  'use strict';
  var T = window.MG_STORY = {
    levels: Object.create(null), current: null, running: false,
    register: function (id, def) { this.levels[id] = def; },
    reg: function (id, def) { this.register(id, def); },
    start: function (id) {
      var self = this, level = this.levels[id];
      if (!level || this.running) return;
      this.running = true; this.current = id;
      try {
        if (typeof start === 'function' && typeof freshSave === 'function') start(freshSave());
        Promise.resolve().then(function () { return level.start(); }).catch(function (e) {
          console.error('[MG_STORY] Ошибка сюжетки ' + id, e);
          self.running = false; toast('Не удалось запустить сюжетку. Подробности — в консоли.', 4000);
        });
      } catch (e) { this.running = false; console.error(e); }
    },
    end: function (message) {
      this.running = false;
      if (message) toast(message, 3500);
    }
  };

  function addMenuEntry() {
    var title = document.getElementById('title');
    if (!title || document.getElementById('mg-story-entry')) return;
    var hint = title.querySelector('.hint');
    var b = document.createElement('button');
    b.id = 'mg-story-entry';
    b.type = 'button';
    b.textContent = '📖 СЮЖЕТКИ';
    b.style.cssText = 'display:block;width:min(440px,90vw);margin:12px auto 0;padding:14px 18px;border:2px solid #f0c45b;border-radius:14px;background:#26385d;color:#fff;font:900 18px Rubik,Arial,sans-serif;cursor:pointer;';
    b.addEventListener('click', function () {
      if (T.running) return;
      var panel = document.createElement('div');
      panel.style.cssText = 'position:fixed;inset:0;z-index:10000;background:rgba(8,13,25,.88);display:flex;align-items:center;justify-content:center;padding:18px;';
      var card = document.createElement('div');
      card.style.cssText = 'width:min(460px,100%);max-height:85vh;overflow:auto;background:#202d49;color:#fff;border:2px solid #e9bd58;border-radius:20px;padding:22px;box-sizing:border-box;font:600 16px Rubik,Arial,sans-serif;';
      var h = document.createElement('h2'); h.textContent = '📖 Сюжетки'; h.style.marginTop = '0'; card.appendChild(h);
      var p = document.createElement('p'); p.textContent = 'Отдельные истории МГИАГ. Прогресс сюжеток хранится отдельно от обычного сохранения.'; card.appendChild(p);
      Object.keys(T.levels).sort(function (a,b) { return Number(a)-Number(b); }).forEach(function (id) {
        var def = T.levels[id], row = document.createElement('button');
        row.type = 'button'; row.textContent = '▶ Сюжетка №' + id + ' — ' + (def.title || 'Без названия');
        row.style.cssText = 'display:block;width:100%;text-align:left;margin:8px 0;padding:14px;border:0;border-radius:12px;background:#f0c45b;color:#1d2942;font:900 15px Rubik,Arial,sans-serif;';
        row.onclick = function () { panel.remove(); T.start(id); };
        card.appendChild(row);
      });
      var close = document.createElement('button'); close.textContent = 'Закрыть'; close.style.cssText = 'width:100%;padding:12px;border:1px solid #8793ac;border-radius:12px;background:transparent;color:white;font-weight:800;margin-top:8px;'; close.onclick = function () { panel.remove(); };
      card.appendChild(close); panel.appendChild(card); document.body.appendChild(panel);
    });
    if (hint && hint.parentNode) hint.parentNode.insertBefore(b, hint.nextSibling); else title.appendChild(b);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addMenuEntry);
  else addMenuEntry();
  var tries = 0, timer = setInterval(function () { addMenuEntry(); if (++tries > 30 || document.getElementById('mg-story-entry')) clearInterval(timer); }, 300);
  console.log('[MG_STORY] Каркас сюжеток загружен.');
})();
