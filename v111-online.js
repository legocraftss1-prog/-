/* =====================================================================
   МГИАГ 1.11 — СЕРВЕР «ХАОС»: клиент
   Аккаунты, друзья, приглашения, комнаты (до 25), приватные комнаты (2),
   PvP, события хаоса, предметы, новое оружие, карта хаоса.
   Нужен отдельный сервер (папка server/). Адрес — в server-config.js.
   ===================================================================== */
(function () {
  'use strict';
  var URL_ = (window.MGIAG_SERVER || '').trim();
  var O = window.MG_ONLINE = { active: false, me: null, rooms: [], room: null, you: null, players: new Map(), notes: [], seed: 0, dead: false, fx: {}, wpn: {}, bounty: null };
  var TOKEN_KEY = 'mg_acc_token', NICK_KEY = 'mg_acc_nick', SLOT = 9;
  var $q = function (s, r) { return (r || document).querySelector(s); };
  function el(tag, css, html) { var e = document.createElement(tag); if (css) e.style.cssText = css; if (html !== undefined) e.innerHTML = html; return e; }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function fmtDur(s) { s = Math.floor(s); var h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60); return h ? h + ' ч ' + m + ' мин' : m + ' мин'; }
  function fmtDate(t) { try { return new Date(t).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }); } catch (e) { return ''; } }
  function say_(t, ms) { if (typeof toast === 'function') toast(t, ms || 2600); }
  function gameReady() { return typeof worldReady !== 'undefined' && worldReady && typeof player !== 'undefined'; }

  /* ================= сеть ================= */
  var ws = null, wantOpen = false, retry = 0, pingT = null, listeners = [], authed = false, connecting = false;
  function connect() {
    if (!URL_) return;
    if (ws && (ws.readyState === 0 || ws.readyState === 1)) return;
    connecting = true; setStatus('connecting');
    try { ws = new WebSocket(URL_); } catch (e) { setStatus('off'); return; }
    ws.onopen = function () { retry = 0; connecting = false; setStatus('on'); var tk = lsGet(TOKEN_KEY); if (tk && !authed) send({ t: 'resume', token: tk }); clearInterval(pingT); pingT = setInterval(function () { send({ t: 'ping', ts: Date.now() }); }, 20000); };
    ws.onmessage = function (e) { var m; try { m = JSON.parse(e.data); } catch (x) { return; } try { onMsg(m); } catch (x) { console.error('[MG_ONLINE]', x); } };
    ws.onclose = function () { connecting = false; authed = false; setStatus('off'); clearInterval(pingT); if (wantOpen) { retry++; setTimeout(connect, Math.min(8000, 800 * retry)); } };
    ws.onerror = function () { };
  }
  function send(o) { if (ws && ws.readyState === 1) ws.send(JSON.stringify(o)); }
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { } }
  O.send = send;
  var status = 'off';
  function setStatus(s) { status = s; if (ui.dot) { ui.dot.style.background = s === 'on' ? '#2fae5b' : s === 'connecting' ? '#ffcf4a' : '#e8473b'; ui.dot.title = s === 'on' ? 'Сервер на связи' : s === 'connecting' ? 'Подключение…' : 'Нет связи с сервером'; } }

  /* ================= интерфейс ================= */
  var ui = { root: null, body: null, tab: 'rooms', dot: null, err: '' };
  var css = el('style');
  css.textContent = [
    '#mgsrv{position:fixed;inset:0;z-index:60;display:none;background:rgba(8,10,16,.82);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);color:#fff;font-family:var(--ui,system-ui,sans-serif);padding:env(safe-area-inset-top,0) 0 env(safe-area-inset-bottom,0);touch-action:auto;user-select:text;-webkit-user-select:text}',
    '#mgsrv.on{display:flex;align-items:center;justify-content:center}',
    '#mgsrv .box{width:min(560px,100vw);height:min(760px,100dvh);max-height:100dvh;display:flex;flex-direction:column;background:linear-gradient(170deg,#262c3d,#161a26);border:1px solid rgba(255,255,255,.16);border-radius:18px;box-shadow:0 20px 60px rgba(0,0,0,.6);overflow:hidden}',
    '@media(max-width:600px){#mgsrv .box{border-radius:0;height:100dvh;border:0}}',
    '#mgsrv header{display:flex;align-items:center;gap:10px;padding:12px 14px;border-bottom:1px solid rgba(255,255,255,.1);background:rgba(255,106,19,.12)}',
    '#mgsrv header h1{margin:0;font:900 20px var(--mono,Impact,sans-serif);letter-spacing:.5px;flex:1}',
    '#mgsrv .dot{width:11px;height:11px;border-radius:50%;background:#e8473b}',
    '#mgsrv .x{background:rgba(255,255,255,.12);border:0;color:#fff;border-radius:10px;font-size:18px;width:38px;height:38px}',
    '#mgsrv nav{display:flex;gap:4px;padding:8px 10px 0;overflow-x:auto}',
    '#mgsrv nav button{flex:1;min-width:84px;padding:10px 8px;border:0;border-radius:10px 10px 0 0;background:rgba(255,255,255,.07);color:#cfd6e6;font:700 14px var(--ui,sans-serif);position:relative}',
    '#mgsrv nav button.act{background:rgba(255,255,255,.17);color:#fff}',
    '#mgsrv nav b{position:absolute;top:2px;right:6px;background:#e8473b;border-radius:9px;min-width:18px;padding:0 5px;font-size:11px;line-height:18px}',
    '#mgsrv .body{flex:1;overflow-y:auto;padding:12px 14px 18px;background:rgba(255,255,255,.04);-webkit-overflow-scrolling:touch}',
    '#mgsrv .card{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.1);border-radius:14px;padding:11px 12px;margin:8px 0;display:flex;align-items:center;gap:10px}',
    '#mgsrv .card .tx{flex:1;min-width:0}',
    '#mgsrv .card .tx b{display:block;font-size:16px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    '#mgsrv .card .tx small{opacity:.75;font-size:12.5px}',
    '#mgsrv button.b{background:linear-gradient(180deg,#ffb15a,#ff6a13);color:#2a1300;border:0;border-radius:11px;padding:10px 14px;font:800 14px var(--ui,sans-serif);white-space:nowrap}',
    '#mgsrv button.b.alt{background:rgba(255,255,255,.14);color:#fff}',
    '#mgsrv button.b.bad{background:#e8473b;color:#fff}',
    '#mgsrv button.b.big{width:100%;padding:15px;font-size:18px;margin:6px 0}',
    '#mgsrv button.b:disabled{opacity:.45}',
    '#mgsrv input[type=text],#mgsrv input[type=password]{width:100%;padding:13px;border-radius:11px;border:1px solid rgba(255,255,255,.2);background:rgba(0,0,0,.35);color:#fff;font:600 16px var(--ui,sans-serif);margin:5px 0;outline:none}',
    '#mgsrv input:focus{border-color:#ffcf4a}',
    '#mgsrv .err{color:#ff8a80;font-weight:700;min-height:20px;margin:4px 0;font-size:14px}',
    '#mgsrv h3{margin:14px 0 4px;font-size:14px;color:#ffcf4a;text-transform:uppercase;letter-spacing:.6px}',
    '#mgsrv .pill{display:inline-block;padding:2px 8px;border-radius:9px;background:rgba(255,255,255,.14);font-size:12px;font-weight:800}',
    '#mgsrv .on-dot{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:6px;background:#777}',
    '#mgsrv .on-dot.y{background:#2fae5b}',
    '#mgsrv .row{display:flex;gap:8px;align-items:center}',
    '#mgsrv .row>*{flex:1}',
    '#mgsrv .hint{opacity:.7;font-size:13px;line-height:1.4;margin:6px 0}',
    '#mgsrv .full{background:#e8473b}',
    '#mg-fab{position:fixed;right:calc(env(safe-area-inset-right,0px) + 10px);top:calc(env(safe-area-inset-top,0px) + 118px);z-index:7;width:46px;height:46px;border-radius:50%;border:1px solid rgba(255,255,255,.25);background:rgba(26,29,37,.8);color:#fff;font-size:22px;display:none}',
    '#mg-fab b{position:absolute;top:-4px;right:-4px;background:#e8473b;border-radius:9px;min-width:18px;font-size:11px;line-height:18px}',
    '#mg-hud{position:fixed;left:50%;top:calc(env(safe-area-inset-top,0px) + 100px);transform:translateX(-50%);z-index:6;pointer-events:none;display:none;text-align:center;font:800 14px var(--ui,sans-serif);color:#fff;text-shadow:0 2px 4px #000}',
    '#mg-hud .ev{background:rgba(232,71,59,.85);border-radius:12px;padding:6px 14px;margin:4px auto;display:inline-block}',
    '#mg-hud .ev.small{background:rgba(255,106,19,.85)}',
    '#mg-wbtn{position:fixed;right:calc(env(safe-area-inset-right,0px) + 10px);top:calc(env(safe-area-inset-top,0px) + 172px);z-index:7;min-width:46px;height:46px;border-radius:23px;border:1px solid rgba(255,255,255,.25);background:rgba(26,29,37,.8);color:#fff;font:800 14px var(--ui,sans-serif);padding:0 10px;display:none}',
    '#mg-dead{position:fixed;inset:0;z-index:8;background:rgba(120,0,0,.45);display:none;align-items:center;justify-content:center;font:900 26px var(--ui,sans-serif);color:#fff;text-shadow:0 2px 8px #000;pointer-events:none;text-align:center;padding:20px}',
    '#mg-dark{position:fixed;inset:0;z-index:4;pointer-events:none;display:none;background:radial-gradient(circle at 50% 55%,rgba(0,0,0,0) 0,rgba(0,0,0,.35) 14%,rgba(0,0,0,.92) 40%)}',
    '#mg-feed{position:fixed;left:calc(env(safe-area-inset-left,0px) + 10px);bottom:150px;z-index:6;pointer-events:none;font:700 13px var(--ui,sans-serif);color:#fff;text-shadow:0 1px 3px #000;max-width:55vw}'
  ].join('\n');
  document.head.appendChild(css);

  function build() {
    if (ui.root) return;
    ui.root = el('div'); ui.root.id = 'mgsrv';
    var box = el('div'); box.className = 'box';
    var head = el('header'); var h1 = el('h1', '', '🌪️ Сервер «ХАОС»'); ui.dot = el('span'); ui.dot.className = 'dot';
    var x = el('button'); x.className = 'x'; x.textContent = '✕'; x.onclick = closePanel;
    head.appendChild(h1); head.appendChild(ui.dot); head.appendChild(x);
    ui.nav = el('nav'); ui.body = el('div'); ui.body.className = 'body';
    box.appendChild(head); box.appendChild(ui.nav); box.appendChild(ui.body); ui.root.appendChild(box); document.body.appendChild(ui.root);
    ui.root.addEventListener('pointerdown', function (e) { e.stopPropagation(); }, true);
    ui.root.addEventListener('touchstart', function (e) { e.stopPropagation(); }, { passive: true, capture: true });
    ui.root.addEventListener('keydown', function (e) { e.stopPropagation(); }, true);
    ui.fab = el('button'); ui.fab.id = 'mg-fab'; ui.fab.innerHTML = '🌐'; ui.fab.onclick = openPanel; document.body.appendChild(ui.fab);
    ui.hud = el('div'); ui.hud.id = 'mg-hud'; document.body.appendChild(ui.hud);
    ui.wbtn = el('button'); ui.wbtn.id = 'mg-wbtn'; ui.wbtn.onclick = cycleWeapon; document.body.appendChild(ui.wbtn);
    ui.dead = el('div'); ui.dead.id = 'mg-dead'; document.body.appendChild(ui.dead);
    ui.dark = el('div'); ui.dark.id = 'mg-dark'; document.body.appendChild(ui.dark);
    ui.feed = el('div'); ui.feed.id = 'mg-feed'; document.body.appendChild(ui.feed);
    setStatus(status);
  }
  function openPanel() { build(); ui.root.classList.add('on'); wantOpen = true; connect(); if (authed) send({ t: 'rooms' }); render(); }
  function closePanel() { if (ui.root) ui.root.classList.remove('on'); if (!O.active) { send({ t: 'unwatch' }); } }
  O.open = openPanel;

  function render() {
    if (!ui.root || !ui.root.classList.contains('on')) return;
    var scrollTop = ui.body.scrollTop; var focus = document.activeElement && document.activeElement.id;
    var val = focus ? document.activeElement.value : null;
    ui.nav.innerHTML = ''; ui.body.innerHTML = '';
    if (!URL_) { ui.body.innerHTML = '<div class="card"><div class="tx"><b>Сервер не настроен</b><small>Для режима «ХАОС» нужен игровой сервер. Адрес указывается в файле server-config.js. Инструкция — в папке docs (РАЗВЁРТЫВАНИЕ_СЕРВЕРА.md).</small></div></div>'; return; }
    if (!authed) return renderAuth();
    var tabs = [['rooms', '🏠 Комнаты'], ['friends', '👥 Друзья'], ['notes', '🔔'], ['me', '👤 Профиль']];
    tabs.forEach(function (t) {
      var b = el('button'); b.className = ui.tab === t[0] ? 'act' : ''; b.textContent = t[1];
      if (t[0] === 'notes') { var n = O.notes.length; b.textContent = '🔔 Уведомл.'; if (n) { var bb = el('b'); bb.textContent = n; b.appendChild(bb); } }
      b.onclick = function () { ui.tab = t[0]; render(); }; ui.nav.appendChild(b);
    });
    if (ui.tab === 'rooms') renderRooms(); else if (ui.tab === 'friends') renderFriends(); else if (ui.tab === 'notes') renderNotes(); else renderMe();
    ui.body.scrollTop = scrollTop;
    if (focus) { var f = document.getElementById(focus); if (f) { f.value = val; try { f.focus(); } catch (e) { } } }
  }
  function btn(txt, cls, fn) { var b = el('button'); b.className = 'b ' + (cls || ''); b.textContent = txt; b.onclick = fn; return b; }
  function card(inner) { var c = el('div'); c.className = 'card'; var tx = el('div'); tx.className = 'tx'; tx.innerHTML = inner; c.appendChild(tx); return c; }
  function errBox() { var e = el('div'); e.className = 'err'; e.textContent = ui.err || ''; return e; }

  function renderAuth() {
    var b = ui.body;
    b.appendChild(el('div', 'font-size:15px;line-height:1.45;margin-bottom:8px', 'Войди в аккаунт или зарегистрируйся — один раз. Прогресс, друзья и статистика привязаны к нику.'));
    var n = el('input'); n.type = 'text'; n.id = 'mg-nick'; n.placeholder = 'Никнейм (3–16 символов)'; n.maxLength = 16; n.autocomplete = 'username'; n.value = lsGet(NICK_KEY) || '';
    var p = el('input'); p.type = 'password'; p.id = 'mg-pass'; p.placeholder = 'Пароль (от 6 символов)'; p.autocomplete = 'current-password';
    b.appendChild(n); b.appendChild(p); b.appendChild(errBox());
    var go = function (t) { return function () { ui.err = ''; send({ t: t, nick: n.value, pass: p.value }); if (status !== 'on') { ui.err = 'Нет связи с сервером. Подожди секунду и повтори.'; connect(); render(); } }; };
    b.appendChild(btn('Войти', 'big', go('login'))); b.appendChild(btn('Создать аккаунт', 'big alt', go('register')));
    p.onkeydown = function (e) { if (e.key === 'Enter') go('login')(); };
    b.appendChild(el('div', '', '<div class="hint">Пароль хранится на сервере только в виде хеша (scrypt). Никнейм должен быть уникальным.</div>'));
    if (status !== 'on') b.appendChild(el('div', 'color:#ffcf4a;font-weight:700;margin-top:8px', status === 'connecting' ? '⏳ Подключаемся к серверу…' : '⚠️ Сервер недоступен. Повторяем попытку…'));
  }

  function renderRooms() {
    var b = ui.body;
    if (O.room) {
      b.appendChild(card('<b>Сейчас: ' + esc(O.room.name) + '</b><small>' + (O.players.size + 1) + ' / ' + O.room.max + ' игроков</small>'));
      var r = el('div'); r.className = 'row'; r.appendChild(btn('▶ Вернуться в игру', '', closePanel)); r.appendChild(btn('Выйти из комнаты', 'bad', leaveRoom)); b.appendChild(r);
    }
    b.appendChild(errBox());
    b.appendChild(btn('⚡ Быстрое подключение', 'big', function () { ui.err = ''; send({ t: 'quick' }); }));
    b.appendChild(el('h3', '', 'Официальные комнаты'));
    var off = O.rooms.filter(function (r) { return r.official; }), cus = O.rooms.filter(function (r) { return !r.official; });
    if (!off.length) b.appendChild(el('div', 'hint', 'Загрузка списка…'));
    off.forEach(function (r) { b.appendChild(roomCard(r)); });
    if (cus.length) { b.appendChild(el('h3', '', 'Комнаты игроков')); cus.forEach(function (r) { b.appendChild(roomCard(r)); }); }
    b.appendChild(el('h3', '', 'Создать'));
    var nm = el('input'); nm.type = 'text'; nm.id = 'mg-rname'; nm.placeholder = 'Название комнаты'; nm.maxLength = 24; b.appendChild(nm);
    var row = el('div'); row.className = 'row';
    row.appendChild(btn('🔓 Открытая', 'alt', function () { send({ t: 'create_room', name: nm.value, open: true }); }));
    row.appendChild(btn('🔒 Закрытая', 'alt', function () { send({ t: 'create_room', name: nm.value, open: false }); }));
    b.appendChild(row);
    b.appendChild(el('div', 'hint', 'Открытая — заходят все. Закрытая — каждого входящего подтверждаешь ты.'));
    b.appendChild(btn('👥 Приватная комната для друзей (2 игрока)', 'big alt', function () { send({ t: 'create_private' }); }));
  }
  function roomCard(r) {
    var c = el('div'); c.className = 'card';
    var full = r.count >= r.max;
    c.innerHTML = '<div class="tx"><b>' + (r.open ? '' : '🔒 ') + esc(r.name) + '</b><small>' + (r.owner ? 'Создатель: ' + esc(r.owner) + ' · ' : '') + (r.open ? 'открытая' : 'нужно одобрение') + '</small></div><span class="pill' + (full ? ' full' : '') + '">' + r.count + '/' + r.max + '</span>';
    var jb = btn(full ? 'Полная' : (r.open ? 'Войти' : 'Попроситься'), '', function () { ui.err = ''; send({ t: 'join', room: r.id }); }); jb.disabled = full || (O.room && O.room.id === r.id);
    c.appendChild(jb); return c;
  }

  var searchRes = null, searchQ = '';
  function renderFriends() {
    var b = ui.body, me = O.me; if (!me) return;
    var q = el('input'); q.type = 'text'; q.id = 'mg-search'; q.placeholder = 'Найти игрока по точному никнейму'; q.value = searchQ; q.maxLength = 16; b.appendChild(q);
    var row = el('div'); row.className = 'row'; row.appendChild(btn('🔍 Найти', '', function () { searchQ = q.value; send({ t: 'search', nick: q.value }); })); b.appendChild(row);
    q.onkeydown = function (e) { if (e.key === 'Enter') { searchQ = q.value; send({ t: 'search', nick: q.value }); } };
    b.appendChild(errBox());
    if (searchRes !== undefined && searchRes !== null && searchRes !== 'none') { b.appendChild(profileCard(searchRes)); }
    else if (searchRes === 'none') b.appendChild(el('div', 'hint', 'Игрок с таким ником не найден. Поиск работает только по точному нику.'));
    if (me.inReq.length) { b.appendChild(el('h3', '', 'Входящие запросы')); me.inReq.forEach(function (n) { var c = card('<b>' + esc(n) + '</b><small>хочет дружить</small>'); c.appendChild(btn('✔', '', function () { send({ t: 'friend_resp', nick: n, accept: true }); })); c.appendChild(btn('✖', 'alt', function () { send({ t: 'friend_resp', nick: n, accept: false }); })); b.appendChild(c); }); }
    b.appendChild(el('h3', '', 'Друзья (' + me.friends.length + ')'));
    if (!me.friends.length) b.appendChild(el('div', 'hint', 'Пока никого. Найди друга по нику выше.'));
    me.friends.forEach(function (f) {
      var c = el('div'); c.className = 'card';
      c.innerHTML = '<div class="tx"><b><span class="on-dot' + (f.online ? ' y' : '') + '"></span>' + esc(f.nick) + '</b><small>' + (f.online ? (f.room ? 'в комнате ' + esc(f.room.name) : 'онлайн') : 'не в сети') + '</small></div>';
      c.appendChild(btn('Профиль', 'alt', function () { searchRes = f; searchQ = f.nick; renderFriendsProfile(f); }));
      if (f.online && O.room) c.appendChild(btn('✉ Позвать', '', function () { send({ t: 'invite', nick: f.nick }); }));
      else if (f.online && f.room) c.appendChild(btn('Войти', '', function () { send({ t: 'join_friend', nick: f.nick }); }));
      b.appendChild(c);
    });
    if (me.outReq.length) { b.appendChild(el('h3', '', 'Отправленные запросы')); me.outReq.forEach(function (n) { var c = card('<b>' + esc(n) + '</b><small>ждёт ответа</small>'); c.appendChild(btn('Отмена', 'alt', function () { send({ t: 'friend_cancel', nick: n }); })); b.appendChild(c); }); }
    var au = el('div', 'margin-top:14px'); var ab = btn((me.auto ? '✅' : '⬜') + ' Принимать запросы в друзья автоматически', 'alt big', function () { send({ t: 'set_auto', on: !me.auto }); }); au.appendChild(ab); b.appendChild(au);
  }
  function renderFriendsProfile() { render(); }
  function profileCard(p) {
    var c = el('div'); c.className = 'card'; c.style.flexWrap = 'wrap';
    c.innerHTML = '<div class="tx" style="flex-basis:100%"><b style="font-size:19px"><span class="on-dot' + (p.online ? ' y' : '') + '"></span>' + esc(p.nick) + '</b><small>' + (p.online ? 'В сети' : 'Не в сети') + '<br>Зарегистрирован: ' + fmtDate(p.reg) + '<br>Время в игре: ' + fmtDur(p.playSec) + (p.stats ? '<br>Победы/поражения: ' + p.stats.kills + ' / ' + p.stats.deaths : '') + '</small></div>';
    var row = el('div', 'display:flex;gap:8px;flex-basis:100%;flex-wrap:wrap');
    if (p.rel === 'none') row.appendChild(btn('➕ Добавить в друзья', '', function () { send({ t: 'friend_req', nick: p.nick }); }));
    if (p.rel === 'out') row.appendChild(btn('⏳ Запрос отправлен', 'alt', function () { }));
    if (p.rel === 'in') row.appendChild(btn('✔ Принять запрос', '', function () { send({ t: 'friend_resp', nick: p.nick, accept: true }); }));
    if (p.rel === 'friend') { var inv = btn('✉ Пригласить в комнату', '', function () { if (!O.room) { ui.err = 'Сначала зайди в комнату или создай свою.'; render(); return; } send({ t: 'invite', nick: p.nick }); }); inv.disabled = !p.online; row.appendChild(inv); row.appendChild(btn('Удалить из друзей', 'bad', function () { send({ t: 'friend_remove', nick: p.nick }); searchRes = null; })); }
    if (p.rel === 'self') row.appendChild(el('span', 'opacity:.7', 'Это вы'));
    c.appendChild(row); return c;
  }
  function renderNotes() {
    var b = ui.body;
    if (!O.notes.length) { b.appendChild(el('div', 'hint', 'Уведомлений нет.')); return; }
    O.notes.slice().forEach(function (n) {
      var c = card('<b>' + esc(n.title) + '</b><small>' + esc(n.text || '') + '</small>');
      (n.actions || []).forEach(function (a) { c.appendChild(btn(a[0], a[2] || '', function () { a[1](); removeNote(n.id); }));});
      if (!(n.actions || []).length) c.appendChild(btn('OK', 'alt', function () { removeNote(n.id); }));
      b.appendChild(c);
    });
  }
  function renderMe() {
    var b = ui.body, me = O.me; if (!me) return;
    b.appendChild(profileCard({ nick: me.nick, online: true, reg: me.reg, playSec: me.playSec, stats: me.stats, rel: 'self' }));
    b.appendChild(btn('Выйти из аккаунта', 'bad big', function () { var tk = lsGet(TOKEN_KEY); send({ t: 'logout', token: tk }); lsSet(TOKEN_KEY, null); authed = false; O.me = null; }));
    b.appendChild(el('div', 'hint', 'Выход не удаляет аккаунт: войди снова с тем же ником и паролем.'));
  }

  var noteSeq = 0;
  function addNote(n) { n.id = ++noteSeq; O.notes.push(n); updBadges(); if (n.toast) say_(n.toast, 4000); if (typeof sfx === 'function') try { sfx('ding'); } catch (e) { } render(); return n.id; }
  function removeNote(id) { O.notes = O.notes.filter(function (n) { return n.id !== id; }); updBadges(); render(); }
  function updBadges() { if (!ui.fab) return; var n = O.notes.length; ui.fab.innerHTML = '🌐' + (n ? '<b>' + n + '</b>' : ''); }

  /* ================= сообщения сервера ================= */
  function onMsg(m) {
    switch (m.t) {
      case 'hello': break;
      case 'auth': authed = true; ui.err = ''; lsSet(TOKEN_KEY, m.token); O.me = m.me; lsSet(NICK_KEY, m.me.nick); O.rooms = m.rooms || []; send({ t: 'rooms' }); (m.me.inReq || []).forEach(function (n) { friendReqNote(n, true); }); render(); break;
      case 'err':
        if (m.code === 'session') { lsSet(TOKEN_KEY, null); authed = false; ui.err = ''; } else ui.err = m.msg || 'Ошибка';
        if (['full', 'noroom', 'perm', 'limit', 'offline', 'noowner', 'notfriend'].indexOf(m.code) >= 0) say_('⚠️ ' + m.msg, 3000);
        render(); break;
      case 'me': O.me = m.me; render(); break;
      case 'rooms': O.rooms = m.rooms; if (O.room) { var rr = m.rooms.filter(function (r) { return r.id === O.room.id; })[0]; if (rr) O.room = rr; } render(); break;
      case 'profile': searchRes = m.p || 'none'; render(); break;
      case 'fstate': if (O.me) { O.me.friends.forEach(function (f) { if (f.nick === m.nick) f.online = m.online; }); } say_((m.online ? '🟢 ' : '⚪ ') + m.nick + (m.online ? ' в сети' : ' вышел'), 2000); render(); break;
      case 'note': noteMsg(m); break;
      case 'invite': addNote({ title: '✉ ' + m.from + ' зовёт в комнату', text: m.room.name + ' · ' + m.room.count + '/' + m.room.max, toast: '✉ Приглашение от ' + m.from, actions: [['Принять', function () { send({ t: 'invite_resp', id: m.id, accept: true }); }], ['Отклонить', function () { send({ t: 'invite_resp', id: m.id, accept: false }); }, 'alt']] }); break;
      case 'join_request': addNote({ title: '🚪 ' + m.nick + ' просится в комнату', text: 'Пустить?', toast: '🚪 ' + m.nick + ' хочет войти', actions: [['Пустить', function () { send({ t: 'join_resp', req: m.req, accept: true }); }], ['Нет', function () { send({ t: 'join_resp', req: m.req, accept: false }); }, 'alt']] }); break;
      case 'join_pending': say_('⏳ Ждём одобрения создателя комнаты «' + m.name + '»…', 3500); ui.err = '⏳ Запрос отправлен создателю комнаты. Ждём ответа.'; render(); break;
      case 'join_denied': say_(m.timeout ? '⌛ Создатель не ответил' : '🚫 Создатель не пустил в комнату', 3000); ui.err = m.timeout ? 'Создатель не ответил.' : 'Создатель отклонил запрос.'; render(); break;
      case 'kicked': say_('Вы вошли с другого устройства', 4000); authed = false; wantOpen = false; break;
      case 'loggedout': render(); break;
      case 'joined': onJoined(m); break;
      case 'left': break;
      case 'owner': say_('👑 Теперь ты создатель комнаты', 3000); break;
      default: if (O.active) gameMsg(m);
    }
  }
  function noteMsg(m) {
    if (m.kind === 'friend_req') friendReqNote(m.nick, false);
    else if (m.kind === 'friend_ok') say_('🤝 ' + m.nick + ' теперь твой друг', 3000);
    else if (m.kind === 'invite_sent') say_('✉ Приглашение отправлено: ' + m.nick, 2500);
    else if (m.kind === 'invite_yes') say_('✅ ' + m.nick + ' принял приглашение', 2500);
    else if (m.kind === 'invite_no') say_('❌ ' + m.nick + ' отклонил приглашение', 2500);
  }
  function friendReqNote(nick, quiet) {
    if (O.notes.some(function (n) { return n.key === 'fr:' + nick; })) return;
    var id = addNote({ key: 'fr:' + nick, title: '👤 ' + nick + ' хочет дружить', text: 'Запрос в друзья', toast: quiet ? null : '👤 Запрос в друзья от ' + nick, actions: [['Принять', function () { send({ t: 'friend_resp', nick: nick, accept: true }); }], ['Отклонить', function () { send({ t: 'friend_resp', nick: nick, accept: false }); }, 'alt']] });
  }

  /* ================= вход в комнату и запуск игры ================= */
  function onJoined(m) {
    O.room = m.room; O.you = m.you; O.seed = m.seed; O.dead = false; O.fx = {}; O.wpn = {}; ui.err = '';
    clearRemote(); m.players.forEach(function (p) { addRemote(p); });
    (m.pickups || []).forEach(addPickup); clearEvents(); (m.events || []).forEach(function (e) { startEv(e); }); O.bounty = m.bounty ? { id: m.bounty.id } : null;
    if (!O.active) { startOnlineGame(); }
    else { afterJoin(); }
    closePanel(); say_('🌪️ Ты в комнате «' + m.room.name + '» — ' + (m.players.length + 1) + '/' + m.room.max, 3500);
  }
  function startOnlineGame() {
    O.active = true; installGameHooks();
    try {
      if (typeof started !== 'undefined' && started) { afterJoin(); return; }
      SAVE_MODE = 'solo'; SAVE_SLOT = SLOT;
      var sv = null; try { sv = loadSave(); } catch (e) { }
      if (!sv) { sv = freshSave(); sv.q = { ex: true, door: true, snow: true, dixie: true }; sv.met = true; sv.chaos = { on: true, police: true, ammo: true }; }
      start(sv);
    } catch (e) { console.error('[MG_ONLINE start]', e); say_('Не удалось запустить игру: ' + e.message, 5000); }
    var t = setInterval(function () { if (typeof started !== 'undefined' && started) { clearInterval(t); afterJoin(); } }, 150);
  }
  function afterJoin() {
    build(); ui.fab.style.display = 'block'; ui.hud.style.display = 'block'; ui.wbtn.style.display = 'block';
    try { ensure5(); if (!S.weapon) equipWeapon('revolver'); } catch (e) { }
    registerNewWeapons(); updWeaponBtn(); buildChaosLayer(O.seed);
    try { if (O.me && player && player.hp !== undefined) player.hp = 100; } catch (e) { }
  }
  function leaveRoom() { try { fullSave(false); } catch (e) { } send({ t: 'leave' }); O.active = false; setTimeout(function () { location.reload(); }, 250); }
  O.leave = leaveRoom;

  /* ================= чужие игроки ================= */
  var nickTex = {};
  function nameSprite(txt) {
    var cv = document.createElement('canvas'); cv.width = 256; cv.height = 64; var g = cv.getContext('2d');
    g.font = '800 30px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = 6; g.strokeStyle = 'rgba(0,0,0,.8)'; g.strokeText(txt, 128, 34); g.fillStyle = '#fff'; g.fillText(txt, 128, 34);
    var t = new THREE.CanvasTexture(cv); var sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false })); sp.scale.set(2.4, .6, 1); sp.position.y = 2.35; sp.userData.noShadow = true; return sp;
  }
  function hashCol(s, k) { var h = 0; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i) + k * 7) >>> 0; return new THREE.Color().setHSL((h % 360) / 360, .6, .5).getHex(); }
  function addRemote(p) {
    if (O.players.has(p.id) || typeof makePerson !== 'function') return;
    try {
      var model = makePerson({ top: hashCol(p.nick, 1), pants: hashCol(p.nick, 2), hair: hashCol(p.nick, 3), hairStyle: 'short', skin: 0xf0c8a0, shoes: 0xeeeeee, scale: .95 });
      var a = makeActor('rp_' + p.id, p.nick, model); a.g.add(nameSprite(p.nick)); scene.add(a.g);
      var rp = { id: p.id, nick: p.nick, a: a, tx: 0, ty: 0, tz: 0, got: false, hp: p.hp || 100, alive: true, an: 0, veh: null };
      a.g.visible = false; O.players.set(p.id, rp);
    } catch (e) { console.error('[MG_ONLINE addRemote]', e); }
  }
  function clearRemote() { O.players.forEach(function (r) { try { scene.remove(r.a.g); if (r.car) scene.remove(r.car); } catch (e) { } }); O.players.clear(); }
  function stepRemote(dt) {
    O.players.forEach(function (r) {
      if (!r.got) return; var a = r.a, k = 1 - Math.exp(-dt * 12);
      var ox = a.pos.x, oz = a.pos.z;
      a.pos.x += (r.tx - a.pos.x) * k; a.pos.z += (r.tz - a.pos.z) * k; a.pos.y += (r.ty - a.pos.y) * k;
      var sp = Math.hypot(a.pos.x - ox, a.pos.z - oz) / Math.max(dt, .001);
      a.moving = sp > .8; a.run = sp > 6; a.yaw += wrapAng(r.yaw - a.yaw) * k;
      a.g.visible = r.alive && !r.veh; a.g.position.set(a.pos.x, a.pos.y, a.pos.z); a.g.rotation.y = a.yaw;
      if (r.alive && !r.veh) { try { poseActor(a, dt); } catch (e) { } }
      if (r.veh) { if (!r.car) { r.car = new THREE.Mesh(new THREE.BoxGeometry(1.9, 1.1, 4), new THREE.MeshLambertMaterial({ color: hashCol(r.nick, 9) })); r.car.userData.noShadow = false; scene.add(r.car); } r.car.visible = r.alive; r.car.position.set(a.pos.x, a.pos.y + .7, a.pos.z); r.car.rotation.y = a.yaw; } else if (r.car) r.car.visible = false;
    });
  }
  function wrapAng(a) { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; }

  /* ================= игровые сообщения ================= */
  function pname(id) { if (id === O.you) return 'Ты'; var r = O.players.get(id); return r ? r.nick : '?'; }
  function feed(t) { if (!ui.feed) return; var d = el('div', '', esc(t)); ui.feed.appendChild(d); setTimeout(function () { d.remove(); }, 6000); while (ui.feed.children.length > 5) ui.feed.firstChild.remove(); }
  function gameMsg(m) {
    switch (m.t) {
      case 'pjoin': addRemote(m.p); feed('➡ ' + m.p.nick + ' в комнате'); break;
      case 'pleft': var r = O.players.get(m.id); if (r) { feed('⬅ ' + r.nick + ' ушёл'); try { scene.remove(r.a.g); if (r.car) scene.remove(r.car); } catch (e) { } O.players.delete(m.id); } break;
      case 'snap': m.p.forEach(function (s) { if (s[0] === O.you) return; var r = O.players.get(s[0]); if (!r) return; if (!r.got) { r.a.pos.set(s[1], s[2], s[3]); r.got = true; } r.tx = s[1]; r.ty = s[2]; r.tz = s[3]; r.yaw = s[4]; r.an = s[5]; r.hp = s[6]; r.alive = !!s[7]; r.veh = s[8] || null; }); break;
      case 'hp': if (typeof player !== 'undefined') { var lost = player.hp !== undefined ? player.hp - m.hp : 0; player.hp = m.hp; if (lost > 0 && typeof flashHurt === 'function') flashHurt(); } break;
      case 'kill':
        feed('💀 ' + pname(m.killer || '') + (m.killer ? ' → ' : 'Хаос → ') + pname(m.victim) + (m.w ? ' [' + m.w + ']' : ''));
        if (m.victim === O.you) onDeath(); if (m.victim !== O.you) { var rv = O.players.get(m.victim); if (rv) rv.alive = false; }
        if (m.killer === O.you) say_('🏆 Победа над ' + pname(m.victim) + (m.bonus > 1 ? ' (+награда)' : ''), 2500); break;
      case 'prs': var rp = O.players.get(m.id); if (rp) rp.alive = true; break;
      case 'respawn': onRespawn(m); break;
      case 'ev': startEv(m.e); break;
      case 'evend': endEv(m.id); break;
      case 'warn': say_('⚠️ Через ' + m.in + ' с: ' + m.n, 4500); bannerHud('⚠️ ' + m.n + ' — через ' + m.in + ' с', true); break;
      case 'strike': strikeFx(m); break;
      case 'bounty': O.bounty = m.id ? { id: m.id, nick: m.nick } : null; if (m.id) say_(m.id === O.you ? '🎯 ЗА ТОБОЙ ОХОТЯТСЯ! Продержись.' : '🎯 Цель: ' + m.nick + ' — награда за победу', 4500); break;
      case 'pickup': addPickup(m.p); break;
      case 'pickgone': removePickup(m.id); break;
      case 'got': gotPickup(m); break;
      case 'wpn': O.wpn = m.wpn || {}; updWeaponBtn(); break;
      case 'stuck': stuckFor(m.ms); break;
      case 'push': pushMe(m.dx, m.dz, m.f); break;
      case 'fx': var rr = O.players.get(m.id); if (rr && rr.got) { quackFx(rr.a.pos.x, rr.a.pos.y, rr.a.pos.z, m.w); } break;
    }
  }
  function onDeath() {
    O.dead = true; ui.dead.style.display = 'flex'; ui.dead.textContent = '💀 Тебя вывели из строя. Возрождение через 4 секунды…';
    try { if (player.drive) exitVehicle(); player.lock = true; } catch (e) { }
  }
  function spotXZ(spot) {
    var P = (typeof TAXI_POINTS !== 'undefined' ? TAXI_POINTS : []).filter(function (p) { return Math.abs(p[0]) < 425 && Math.abs(p[1]) < 425; });
    if (!P.length) return { x: 14, z: 15 }; var p = P[spot % P.length]; return { x: p[0], z: p[1] };
  }
  O.spotXZ = spotXZ;
  function onRespawn(m) {
    O.dead = false; ui.dead.style.display = 'none'; var p = spotXZ(m.spot);
    try { player.lock = false; player.hp = 100; placeA(player, p.x, p.z, player.yaw); player.g.rotation.x = 0; } catch (e) { }
    O.fx = {}; say_('✨ Возрождение! Защита на 3 секунды', 2500);
  }

  /* ---------- события ---------- */
  var EVS = new Map(), evMeshes = [], hudLines = [];
  function clearEvents() { EVS.forEach(function (e) { endEv(e.id); }); EVS.clear(); }
  function startEv(e) {
    if (EVS.has(e.id)) return; var o = { id: e.id, k: e.k, n: e.n, big: e.big, until: performance.now() + e.left * 1000, data: e.data || {}, seed: e.seed, meshes: [] }; EVS.set(e.id, o);
    say_((e.big ? '🌋 ' : '🎲 ') + e.n, e.big ? 4500 : 2800);
    var w = window.RCV;
    if (e.k === 'lowgrav' && w) o.prevG = w.g, w.g = .35;
    if (e.k === 'zero_g' && w) o.prevG = w.g, w.g = .12;
    if (e.k === 'blackout') ui.dark.style.display = 'block';
    if (e.k === 'toxic' && o.data.zones) o.data.zones.forEach(function (z) { o.meshes.push(zoneMesh(z.x, z.z, z.r, 0x6aff4a, .32)); });
    if (e.k === 'circle' && o.data.c) { o.circle = o.data.c; o.cm = ringWall(o.data.c.x, o.data.c.z, o.data.c.r0, 0xff3a3a); o.meshes.push(o.cm); o.t0 = performance.now(); }
  }
  function endEv(id) {
    var o = EVS.get(id); if (!o) return; EVS.delete(id); var w = window.RCV;
    if (o.k === 'lowgrav' || o.k === 'zero_g') { if (w) w.g = o.prevG; }
    if (o.k === 'blackout') ui.dark.style.display = 'none';
    o.meshes.forEach(function (m) { scene.remove(m); });
  }
  function zoneMesh(x, z, r, col, op) {
    var m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 9, 28, 1, true), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: op, side: THREE.DoubleSide, depthWrite: false }));
    m.position.set(x, H(x, z) + 4.5, z); m.userData.noShadow = true; scene.add(m); return m;
  }
  function ringWall(x, z, r, col) {
    var m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 60, 64, 1, true), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: .22, side: THREE.DoubleSide, depthWrite: false }));
    m.position.set(x, 20, z); m.userData.noShadow = true; scene.add(m); return m;
  }
  function strikeFx(m) {
    var y = H(m.x, m.z) + .12, ring = new THREE.Mesh(new THREE.RingGeometry(m.rad * .92, m.rad, 40), new THREE.MeshBasicMaterial({ color: 0xff3a1a, transparent: true, opacity: .85, side: THREE.DoubleSide, depthWrite: false }));
    ring.rotation.x = -Math.PI / 2; ring.position.set(m.x, y, m.z); ring.userData.noShadow = true; scene.add(ring);
    var disc = new THREE.Mesh(new THREE.CircleGeometry(m.rad, 32), new THREE.MeshBasicMaterial({ color: 0xff6a13, transparent: true, opacity: .25, depthWrite: false })); disc.rotation.x = -Math.PI / 2; disc.position.set(m.x, y, m.z); scene.add(disc);
    var rock = new THREE.Mesh(new THREE.SphereGeometry(1.1, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff8a2a })); rock.position.set(m.x + 14, y + 60, m.z + 8); scene.add(rock);
    var t0 = performance.now(), T = (m.in || 1.5) * 1000;
    (function anim() { var u = (performance.now() - t0) / T; if (u >= 1) { scene.remove(ring); scene.remove(disc); scene.remove(rock); try { for (var i = 0; i < 8; i++) puffAt(m.x + (Math.random() - .5) * m.rad, y + 1, m.z + (Math.random() - .5) * m.rad, i % 2 ? 0xff8a1a : 0x444444, 3); if (typeof sfx === 'function') sfx('bonk'); if (typeof shake !== 'undefined') shake = Math.max(shake, .35); } catch (e) { } return; }
      rock.position.set(m.x + 14 * (1 - u), y + 60 * (1 - u) + 1, m.z + 8 * (1 - u)); ring.material.opacity = .4 + .5 * Math.abs(Math.sin(u * 14)); requestAnimationFrame(anim); })();
  }
  function bannerHud(t, big) { hudLines.push({ t: t, big: big, until: performance.now() + 5000 }); }
  function updHudText() {
    if (!ui.hud) return; var now = performance.now(), html = '';
    hudLines = hudLines.filter(function (l) { return l.until > now; }); hudLines.forEach(function (l) { html += '<div class="ev">' + esc(l.t) + '</div><br>'; });
    EVS.forEach(function (e) { html += '<div class="ev ' + (e.big ? '' : 'small') + '">' + (e.big ? '🌋' : '🎲') + ' ' + esc(e.n) + ' · ' + Math.max(0, Math.ceil((e.until - now) / 1000)) + 'с</div><br>'; });
    var fxs = []; var nowf = performance.now(); for (var k in O.fx) if (O.fx[k] > nowf) fxs.push({ shield: '🛡️', rage: '😡', jump: '🦘', speed: '💨' }[k] + Math.ceil((O.fx[k] - nowf) / 1000)); if (fxs.length) html += '<div class="ev small" style="background:rgba(40,120,200,.8)">' + fxs.join('  ') + '</div>';
    if (O.bounty && O.bounty.id === O.you) html += '<br><div class="ev">🎯 Ты — цель охоты!</div>';
    if (ui.hud._h !== html) { ui.hud.innerHTML = html; ui.hud._h = html; }
  }

  /* ---------- предметы ---------- */
  var PICKS = new Map(), PICK_EMOJI = { medkit: '💊', shield: '🛡️', rage: '😡', jump: '🦘', speed: '💨', wslipper: '🩴', wbubble: '🫧', wquack: '🦆' };
  function addPickup(p) {
    if (PICKS.has(p.id) || typeof emojiSprite !== 'function') return; var xz = spotXZ(p.spot), sp = emojiSprite(PICK_EMOJI[p.k] || '❔', 1.6);
    var y0 = H(xz.x, xz.z) + 1.3, g = new THREE.Group(); g.position.set(xz.x, y0, xz.z); g.add(sp);
    var ring = new THREE.Mesh(new THREE.RingGeometry(1.0, 1.2, 24), new THREE.MeshBasicMaterial({ color: p.air ? 0x7fd0ff : 0xffcf4a, side: THREE.DoubleSide, transparent: true, opacity: .8 })); ring.rotation.x = -Math.PI / 2; ring.position.y = -1.2; g.add(ring);
    g.userData.noShadow = true; scene.add(g); PICKS.set(p.id, { p: p, g: g, x: xz.x, z: xz.z, y0: y0 });
  }
  function removePickup(id) { var o = PICKS.get(id); if (o) { scene.remove(o.g); PICKS.delete(id); } }
  function stepPickups(dt, t) {
    PICKS.forEach(function (o) { o.g.position.y = o.y0 + Math.sin(t * 2 + o.p.id) * .25; });
    if (O.dead || !player) return; var pp = player.drive ? player.drive.pos : player.pos;
    PICKS.forEach(function (o, id) { if (Math.hypot(o.x - pp.x, o.z - pp.z) < 2.4 && !o.sent) { o.sent = true; send({ t: 'pick', id: id }); setTimeout(function () { o.sent = false; }, 900); } });
  }
  function gotPickup(m) {
    var now = performance.now(); O.fx = {}; for (var k in m.fx) O.fx[k] = now + m.fx[k] * 1000; O.wpn = m.wpn || {};
    if (typeof player !== 'undefined') player.hp = m.hp;
    say_({ medkit: '💊 +здоровье', shield: '🛡️ Щит: урон ×0.3', rage: '😡 Ярость: урон ×1.7', jump: '🦘 Суперпрыжок', speed: '💨 Ускорение', wslipper: '🩴 Тапок-бумеранг ×8', wbubble: '🫧 Мыльный пузырь ×6', wquack: '🦆 Кряк-волна ×5' }[m.k] || 'Предмет', 2200);
    if (typeof RCV !== 'undefined') RCV.jump = (O.fx.jump && O.fx.jump > now) ? 1.7 : 1;
    updWeaponBtn(); if (m.k.indexOf('w') === 0 && m.k !== 'weapon') { try { equipWeapon(m.k.slice(1)); updWeaponBtn(); } catch (e) { } }
  }

  /* ---------- оружие ---------- */
  var NEW_W = { slipper: { n: 'Тапок-бумеранг', e: '🩴', rate: .9, dmg: 18, spread: .005, col: 0xc9852a }, bubble: { n: 'Мыльный пузырь', e: '🫧', rate: 2, dmg: 4, spread: .005, col: 0x9fe0ff }, quack: { n: 'Кряк-волна', e: '🦆', rate: 3, dmg: 0, spread: 0, col: 0xffd23f, quack: true } };
  function registerNewWeapons() { try { for (var k in NEW_W) if (!WEAP[k]) WEAP[k] = NEW_W[k]; } catch (e) { } }
  function weaponList() { var L = []; try { Object.keys(WEAP).forEach(function (k) { if (NEW_W[k]) { if ((O.wpn[k] || 0) > 0) L.push(k); } else if (k !== 'gravity' || true) L.push(k); }); } catch (e) { } return L; }
  function cycleWeapon() { var L = weaponList(); if (!L.length) return; var i = L.indexOf(S.weapon); equipWeapon(L[(i + 1) % L.length]); updWeaponBtn(); }
  function updWeaponBtn() { if (!ui.wbtn) return; try { var k = S.weapon, W = WEAP[k]; ui.wbtn.textContent = W ? (W.e + ' ' + W.n.split(' ')[0] + (NEW_W[k] ? ' ×' + (O.wpn[k] || 0) : '')) : '✊'; } catch (e) { } }
  function quackFx(x, y, z, w) { try { for (var i = 0; i < 10; i++) puffAt(x + (Math.random() - .5) * 6, y + 1 + Math.random(), z + (Math.random() - .5) * 6, i % 2 ? 0xffd23f : 0xffffff, 2); if (typeof sfx === 'function') sfx('whoosh'); } catch (e) { } }
  function stuckFor(ms) { try { player.lock = true; say_('🫧 Тебя поймал мыльный пузырь!', 1800); setTimeout(function () { if (!O.dead) player.lock = false; }, ms); } catch (e) { } }
  var pushV = null;
  function pushMe(dx, dz, f) { var l = Math.hypot(dx, dz) || 1; pushV = { vx: dx / l * f, vz: dz / l * f, t: .45 }; try { if (!player.drive && !player.air) { player.air = true; player.vy = 5; } } catch (e) { } }

  /* ================= хуки в игру ================= */
  var hooked = false, vPush = 0, accT = 0, sendT = 0;
  function installGameHooks() {
    if (hooked) return; hooked = true;
    // хаос-режим всегда включён в онлайн-комнате
    var _chaos = chaosOn; window.chaosOn = chaosOn = function () { return O.active ? true : _chaos(); };
    // HP — только сервер; игровые источники урона пересылаем серверу с лимитом
    var _hurt = hurtPlayer; window.hurtPlayer = hurtPlayer = function (n) { if (!O.active) return _hurt(n); if (n > 0 && !O.dead) send({ t: 'self', n: Math.min(40, Math.round(n)), src: 'game' }); };
    var _down = playerDown; window.playerDown = playerDown = function (msg) { if (!O.active) return _down(msg); };
    // PvP: попадание лучом/пулей по игроку
    var _scan = hitScan; window.hitScan = hitScan = function (o, d, max) {
      var best = _scan(o, d, max); if (!O.active) return best;
      O.players.forEach(function (r) { if (!r.got || !r.alive || r.veh && false) return; var cx = r.a.pos.x - o.x, cy = r.a.pos.y + 1 - o.y, cz = r.a.pos.z - o.z; var t = cx * d.x + cy * d.y + cz * d.z; if (t < 0 || t > best.t) return; var ex = cx - d.x * t, ey = cy - d.y * t, ez = cz - d.z * t; if (Math.sqrt(ex * ex + ey * ey + ez * ez) < .7) { best = { t: t, kind: 'rplayer', obj: r, point: new THREE.Vector3(o.x + d.x * t, o.y + d.y * t, o.z + d.z * t) }; } });
      if (best.kind === 'rplayer') return best; return best;
    };
    var _apply = applyHit; window.applyHit = applyHit = function (h, dmg, d) {
      if (h && h.kind === 'rplayer') { send({ t: 'hit', w: S.weapon || 'fists', target: h.obj.id }); return; } return _apply(h, dmg, d);
    };
    if (typeof bigBlast === 'function') { var _bb = bigBlast; window.bigBlast = bigBlast = function (x, y, z, r, dmg) { if (O.active) O.players.forEach(function (p) { if (p.got && p.alive && Math.hypot(p.a.pos.x - x, p.a.pos.z - z) < r + 1) send({ t: 'hit', w: 'rpg', target: p.id }); }); return _bb.apply(this, arguments); }; }
    var _shoot = shoot; window.shoot = shoot = function () {
      if (!O.active) return _shoot(); var k = S.weapon;
      if (NEW_W[k]) {
        if (!((O.wpn[k] || 0) > 0)) { say_('Нет зарядов. Ищи предметы на карте.', 1500); return; }
        send({ t: 'use', w: k, yaw: player.yaw });
        if (k === 'quack') { quackFx(player.pos.x, player.pos.y, player.pos.z, k); return; }
      }
      return _shoot();
    };
    // движение: ускорение, зеркальное управление, отталкивание, ловушки
    var _up = updPlayer; window.updPlayer = updPlayer = function (dt) {
      if (!O.active) return _up(dt);
      var now = performance.now(), mirror = false, spd = 1;
      EVS.forEach(function (e) { if (e.k === 'mirror') mirror = true; if (e.k === 'speedrush') spd = Math.max(spd, 1.55); });
      if (O.fx.speed && O.fx.speed > now) spd = Math.max(spd, 1.6);
      if (O.bounty && O.bounty.id === O.you) spd = Math.max(spd, 1.15);
      var jx, jy, kA, kD, kW, kS;
      if (mirror) { jx = joy.x; jy = joy.y; joy.x = -jx; joy.y = -jy; kA = keys.KeyA; kD = keys.KeyD; kW = keys.KeyW; kS = keys.KeyS; keys.KeyA = kD; keys.KeyD = kA; keys.KeyW = kS; keys.KeyS = kW; }
      var c = player, px = c.pos.x, pz = c.pos.z, onFoot = !c.drive;
      _up(dt);
      if (mirror) { joy.x = jx; joy.y = jy; keys.KeyA = kA; keys.KeyD = kD; keys.KeyW = kW; keys.KeyS = kS; }
      if (onFoot && !c.drive && !O.dead) {
        if (spd > 1) { c.pos.x = px + (c.pos.x - px) * spd; c.pos.z = pz + (c.pos.z - pz) * spd; try { collide(c.pos, .35, c.feet); } catch (e) { } }
        if (pushV) { pushV.t -= dt; c.pos.x += pushV.vx * dt; c.pos.z += pushV.vz * dt; try { collide(c.pos, .35, c.feet); } catch (e) { } if (pushV.t <= 0) pushV = null; }
      }
    };
    // слизкие участки
    var _slip = slipHere; window.slipHere = slipHere = function () { if (O.active && slimeAt(player.pos.x, player.pos.z)) return true; return _slip(); };
    // главный цикл
    var _env = updEnv; window.updEnv = updEnv = function (dt, t) {
      _env(dt, t);
      if (!O.active || !started) return;
      try { frame(dt, t); } catch (e) { console.error('[MG_ONLINE frame]', e); }
    };
  }
  function frame(dt, t) {
    stepRemote(dt); stepPickups(dt, t); stepWorld(dt, t); updHudText();
    var c = player, D = c.drive, P = D ? D.pos : c.pos, now = performance.now();
    sendT -= dt; if (sendT <= 0 && !O.dead) { sendT = .1; var an = D ? 2 : (window.MG_WATER && MG_WATER.swim) ? 3 : c.moving ? (c.run ? 1 : 0) : 0; send({ t: 'st', x: +P.x.toFixed(2), y: +((c.pos.y) || 0).toFixed(2), z: +P.z.toFixed(2), yaw: +(D ? D.yaw : c.yaw).toFixed(2), an: an, veh: D ? (D.type || 'car') : '' }); }
    // эффекты: прыжок
    if (O.fx.jump && O.fx.jump < now) { RCV.jump = 1; delete O.fx.jump; }
    // зона/кольцо: предупреждение
    EVS.forEach(function (e) { if (e.k === 'circle' && e.circle && e.cm) { var u = Math.min(1, (now - e.t0) / (e.circle.dur)), r = e.circle.r0 + (e.circle.r1 - e.circle.r0) * u; e.cm.geometry.dispose(); e.cm.geometry = new THREE.CylinderGeometry(r, r, 60, 64, 1, true); if (Math.hypot(P.x - e.circle.x, P.z - e.circle.z) > r) bannerHud('☠ Ты за пределами кольца!', true); } });
    // маркер цели охоты
    if (O.bounty && O.bounty.id && O.bounty.id !== O.you) { var rp = O.players.get(O.bounty.id); if (rp && rp.got) { if (!rp.mark) { rp.mark = emojiSprite('🎯', 1.4); rp.mark.position.y = 3.1; rp.a.g.add(rp.mark); } rp.mark.visible = true; } }
    O.players.forEach(function (r) { if (r.mark && (!O.bounty || O.bounty.id !== r.id)) r.mark.visible = false; });
  }

  /* ================= карта «ХАОС»: добавленные объекты ================= */
  var layer = null, PADS = [], TELES = [], TRAPS = [], SLIME = [], telCd = 0, trapCd = 0, layerSeed = -1;
  function rng(seed) { var s = seed >>> 0; return function () { s = (s + 0x6D2B79F5) >>> 0; var t = s; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function slimeAt(x, z) { for (var i = 0; i < SLIME.length; i++) { var s = SLIME[i]; if (Math.hypot(x - s.x, z - s.z) < s.r) return true; } return false; }
  function buildChaosLayer(seed) {
    if (layer && layerSeed === seed) return; if (layer) { scene.remove(layer); }
    layerSeed = seed; layer = new THREE.Group(); PADS = []; TELES = []; TRAPS = []; SLIME = []; var R = rng(seed || 1);
    var spotsTried = 0;
    function freePt(r, lim) { for (var k = 0; k < 60; k++) { var x = (R() - .5) * 2 * (lim || 400), z = (R() - .5) * 2 * (lim || 400); spotsTried++; try { if (freeAt(x, z, r) && Math.abs(H(x, z) - H(x + r, z)) < 1.2 && !(window.MG_WATER && MG_WATER.depthAt(x, z) > 0)) return { x: x, z: z }; } catch (e) { return null; } } return null; }
    function disc(x, z, r, col, op, dy) { var m = new THREE.Mesh(new THREE.CircleGeometry(r, 28), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: op || .9, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 })); m.rotation.x = -Math.PI / 2; m.position.set(x, H(x, z) + (dy || .09), z); m.userData.noShadow = true; layer.add(m); return m; }
    // батуты
    for (var i = 0; i < 26; i++) { var p = freePt(2.2); if (!p) continue; disc(p.x, p.z, 1.9, 0x1d2129, 1); disc(p.x, p.z, 1.5, 0x3fe08a, 1, .11); var ar = new THREE.Mesh(new THREE.ConeGeometry(.5, .9, 4), new THREE.MeshBasicMaterial({ color: 0xffffff })); ar.position.set(p.x, H(p.x, p.z) + .6, p.z); layer.add(ar); PADS.push({ x: p.x, z: p.z, ar: ar }); }
    // ловушки
    for (i = 0; i < 16; i++) { p = freePt(1.8); if (!p) continue; disc(p.x, p.z, 1.4, 0x7a0f0f, 1); disc(p.x, p.z, 1.0, 0xe8473b, 1, .11); for (var s = 0; s < 6; s++) { var sp = new THREE.Mesh(new THREE.ConeGeometry(.12, .5, 5), new THREE.MeshBasicMaterial({ color: 0xdddddd })); var an = s / 6 * 6.283; sp.position.set(p.x + Math.cos(an) * .6, H(p.x, p.z) + .25, p.z + Math.sin(an) * .6); layer.add(sp); } TRAPS.push({ x: p.x, z: p.z, cd: 0 }); }
    // слизь (скользкие лужи)
    for (i = 0; i < 12; i++) { p = freePt(5); if (!p) continue; disc(p.x, p.z, 5, 0x7bd8ff, .55, .08); SLIME.push({ x: p.x, z: p.z, r: 5 }); }
    // телепорты-пары (секретные места)
    for (i = 0; i < 6; i++) { var a = freePt(2.5, 420), b = freePt(2.5, 420); if (!a || !b) continue; [a, b].forEach(function (q, ix) { disc(q.x, q.z, 1.8, ix ? 0xb06cff : 0xff6ad5, .9); var ring = new THREE.Mesh(new THREE.TorusGeometry(1.3, .12, 8, 24), new THREE.MeshBasicMaterial({ color: ix ? 0xb06cff : 0xff6ad5 })); ring.rotation.x = Math.PI / 2; ring.position.set(q.x, H(q.x, q.z) + 1.2, q.z); layer.add(ring); q.ring = ring; }); TELES.push({ a: a, b: b }); }
    // биомы: грибной лес, кристальное поле, конфетная поляна
    var biomes = [['mush', 0xb83a5a], ['crystal', 0x7ad9ff], ['candy', 0xffa6d5]];
    biomes.forEach(function (bm) {
      var c = freePt(20, 380); if (!c) return; disc(c.x, c.z, 24, bm[1], .22, .07);
      for (var j = 0; j < 22; j++) { var an2 = R() * 6.283, rd = 4 + R() * 19, x = c.x + Math.cos(an2) * rd, z = c.z + Math.sin(an2) * rd; try { if (!freeAt(x, z, 1.2) || (window.MG_WATER && MG_WATER.depthAt(x, z) > 0)) continue; } catch (e) { continue; } var y = H(x, z), g = new THREE.Group(); g.position.set(x, y, z);
        if (bm[0] === 'mush') { var st = new THREE.Mesh(G.cyl, mat(0xefe6d2)); st.scale.set(.5, 2.2, .5); st.position.y = 1.1; var cap = new THREE.Mesh(G.hemi, mat(0xd8342a)); cap.scale.set(1.8, 1.3, 1.8); cap.position.y = 2.2; g.add(st, cap); }
        else if (bm[0] === 'crystal') { var cr = new THREE.Mesh(G.cone, new THREE.MeshLambertMaterial({ color: 0x7ad9ff, emissive: 0x1a5a7a })); var hh = 1.5 + R() * 3; cr.scale.set(.9, hh, .9); cr.position.y = hh / 2; cr.rotation.z = (R() - .5) * .3; g.add(cr); }
        else { var ball = new THREE.Mesh(G.sph, mat([0xff6ad5, 0xffd23f, 0x6ad5ff][j % 3])); ball.scale.set(1.6, 1.6, 1.6); ball.position.y = .8; var stick = new THREE.Mesh(G.cyl, mat(0xffffff)); stick.scale.set(.15, 1.6, .15); stick.position.y = .8; g.add(stick, ball); ball.position.y = 1.8; }
        layer.add(g); }
    });
    scene.add(layer);
    O.layerInfo = { pads: PADS.length, traps: TRAPS.length, slime: SLIME.length, teles: TELES.length };
    console.log('[MG_ONLINE] слой «ХАОС»:', JSON.stringify(O.layerInfo));
  }
  function stepWorld(dt, t) {
    if (!layer || O.dead) return; var c = player, D = c.drive, P = D ? D.pos : c.pos;
    telCd -= dt; trapCd -= dt;
    PADS.forEach(function (p) { p.ar.position.y = H(p.x, p.z) + .6 + Math.abs(Math.sin(t * 4)) * .25; if (Math.hypot(P.x - p.x, P.z - p.z) < 1.8 && !D && !c.air) { c.air = true; c.vy = 13.5; c.feet = c.feet + .1; try { sfx('jump'); } catch (e) { } } });
    if (!D && telCd <= 0) TELES.forEach(function (te) { [[te.a, te.b], [te.b, te.a]].forEach(function (pr) { if (telCd <= 0 && Math.hypot(P.x - pr[0].x, P.z - pr[0].z) < 1.4) { telCd = 3; placeA(c, pr[1].x + 2, pr[1].z, c.yaw); say_('🌀 Телепорт!', 1500); } }); });
    TELES.forEach(function (te) { te.a.ring.rotation.z += dt * 2; te.b.ring.rotation.z -= dt * 2; });
    if (!D && !c.air) TRAPS.forEach(function (tr) { tr.cd -= dt; if (tr.cd <= 0 && Math.hypot(P.x - tr.x, P.z - tr.z) < 1.1) { tr.cd = 4; send({ t: 'self', n: 12, src: 'trap' }); c.air = true; c.vy = 7; say_('🪤 Ловушка!', 1200); } });
  }
  O.buildLayer = buildChaosLayer;

  /* ================= вход с экрана заголовка ================= */
  function addTitleButton() {
    var menu = document.getElementById('menu'); if (!menu || menu.querySelector('[data-mg-srv]')) return;
    var first = menu.querySelector('button'); if (!first || first.textContent.indexOf('Играть') < 0) return;
    var b = document.createElement('button'); b.setAttribute('data-mg-srv', '1'); b.style.cssText = 'width:100%;font-size:18px;padding:14px 16px;text-align:left;background:linear-gradient(180deg,#e8473b,#a82a20);color:#fff';
    b.textContent = '🌪️ Сервер «ХАОС» (онлайн)'; b.onclick = openPanel; first.insertAdjacentElement('afterend', b);
  }
  var mo = new MutationObserver(function () { try { addTitleButton(); } catch (e) { } });
  function boot() { var menu = document.getElementById('menu'); if (menu) { mo.observe(menu, { childList: true }); addTitleButton(); } else setTimeout(boot, 200); }
  boot();
  // клавиша Tab открывает панель в игре (ПК)
  addEventListener('keydown', function (e) { if (O.active && e.code === 'Tab') { e.preventDefault(); if (ui.root && ui.root.classList.contains('on')) closePanel(); else openPanel(); } });
  addEventListener('beforeunload', function () { try { if (O.active) send({ t: 'leave' }); } catch (e) { } });
})();
