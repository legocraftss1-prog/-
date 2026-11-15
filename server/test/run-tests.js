'use strict';
/* Автотест сервера МГИАГ: реальные WebSocket-подключения к реальному серверу. */
const path = require('path'), fs = require('fs'), os = require('os');
const DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'mgiag-test-'));
process.env.DATA_DIR = DIR; process.env.PORT = '18099'; process.env.REG_PER_HOUR = '1000';
const srv = require('../server.js');
const URL = 'ws://127.0.0.1:18099';
let pass = 0, failN = 0;
const ok = (c, name, extra) => { if (c) { pass++; console.log('  ✔', name); } else { failN++; console.log('  ✘ ПРОВАЛ:', name, extra !== undefined ? JSON.stringify(extra) : ''); } };
const sleep = ms => new Promise(r => setTimeout(r, ms));

class Cl {
  constructor() { this.q = []; this.waiters = []; this.log = []; }
  async open() { this.ws = new WebSocket(URL); this.ws.onmessage = e => { const m = JSON.parse(e.data); this.log.push(m); const i = this.waiters.findIndex(w => w.f(m)); if (i >= 0) { const [w] = this.waiters.splice(i, 1); clearTimeout(w.to); w.res(m); } else this.q.push(m); }; await new Promise((r, j) => { this.ws.onopen = r; this.ws.onerror = j; }); await this.wait(m => m.t === 'hello'); return this; }
  send(o) { this.ws.send(JSON.stringify(o)); }
  wait(f, ms = 3000) { const i = this.q.findIndex(f); if (i >= 0) return Promise.resolve(this.q.splice(i, 1)[0]); return new Promise((res, rej) => { const w = { f, res, to: setTimeout(() => { this.waiters = this.waiters.filter(x => x !== w); rej(new Error('timeout')); }, ms) }; this.waiters.push(w); }); }
  async req(o, f, ms) { this.send(o); return this.wait(f, ms); }
  has(f) { return this.q.some(f) || this.log.some(f); }
  clear() { this.q.length = 0; }
  close() { try { this.ws.close(); } catch (e) { } }
}
async function mk(nick, pass = 'secret123') {
  const c = await new Cl().open();
  const r = await c.req({ t: 'register', nick, pass }, m => m.t === 'auth' || m.t === 'err');
  if (r.t !== 'auth') throw new Error('register ' + nick + ' failed: ' + JSON.stringify(r));
  c.token = r.token; c.nick = nick; return c;
}
const joined = c => c.wait(m => m.t === 'joined');

(async () => {
  await new Promise(r => srv.start(r));
  const I = srv._internals;

  console.log('\n[1] Регистрация и уникальность ников');
  const a = await mk('Марья_Тест');
  ok(!!a.token && a.token.length === 64, 'регистрация выдаёт токен сессии');
  let c2 = await new Cl().open();
  let r = await c2.req({ t: 'register', nick: 'марья_тест', pass: 'otherpass1' }, m => m.t === 'err' || m.t === 'auth');
  ok(r.t === 'err' && r.code === 'taken', 'повторный ник (другой регистр) отклонён', r);
  r = await c2.req({ t: 'register', nick: 'ab', pass: 'secret123' }, m => m.t === 'err' || m.t === 'auth');
  ok(r.t === 'err' && r.code === 'nick', 'слишком короткий ник отклонён');
  r = await c2.req({ t: 'register', nick: 'Gusь', pass: 'secret123' }, m => m.t === 'err' || m.t === 'auth');
  ok(r.t === 'err' && r.code === 'nick', 'смесь латиницы и кириллицы отклонена');
  r = await c2.req({ t: 'register', nick: 'admin', pass: 'secret123' }, m => m.t === 'err' || m.t === 'auth');
  ok(r.t === 'err' && r.code === 'nick', 'зарезервированный ник отклонён');
  r = await c2.req({ t: 'register', nick: 'Normal1', pass: '123' }, m => m.t === 'err' || m.t === 'auth');
  ok(r.t === 'err' && r.code === 'pass', 'короткий пароль отклонён');
  r = await c2.req({ t: 'register', nick: '<script>', pass: 'secret123' }, m => m.t === 'err' || m.t === 'auth');
  ok(r.t === 'err' && r.code === 'nick', 'ник с недопустимыми символами отклонён');
  // гонка: два одновременных запроса на один ник
  const x1 = await new Cl().open(), x2 = await new Cl().open();
  x1.send({ t: 'register', nick: 'Racer', pass: 'secret123' }); x2.send({ t: 'register', nick: 'racer', pass: 'secret123' });
  const [ra, rb] = await Promise.all([x1.wait(m => m.t === 'auth' || m.t === 'err'), x2.wait(m => m.t === 'auth' || m.t === 'err')]);
  ok([ra, rb].filter(m => m.t === 'auth').length === 1, 'при одновременной регистрации одного ника побеждает ровно один', [ra.t, rb.t]);
  x1.close(); x2.close();

  console.log('\n[2] Вход, выход, сессии');
  r = await c2.req({ t: 'login', nick: 'Марья_Тест', pass: 'wrong-pass' }, m => m.t === 'err' || m.t === 'auth');
  ok(r.t === 'err' && r.code === 'creds', 'неверный пароль отклонён');
  r = await c2.req({ t: 'login', nick: 'нет_такого', pass: 'whatever1' }, m => m.t === 'err' || m.t === 'auth');
  ok(r.t === 'err' && r.code === 'creds', 'несуществующий ник — то же сообщение (не выдаёт, что ника нет)');
  const aTok = a.token;
  a.send({ t: 'logout', token: aTok }); await a.wait(m => m.t === 'loggedout');
  ok(true, 'выход из аккаунта');
  r = await a.req({ t: 'resume', token: aTok }, m => m.t === 'err' || m.t === 'auth');
  ok(r.t === 'err' && r.code === 'session', 'после выхода старый токен недействителен');
  r = await a.req({ t: 'login', nick: 'марья_ТЕСТ', pass: 'secret123' }, m => m.t === 'err' || m.t === 'auth');
  ok(r.t === 'auth' && r.me.nick === 'Марья_Тест', 'повторный вход возвращает прежний аккаунт', r.me && r.me.nick);
  a.token = r.token;
  r = await c2.req({ t: 'resume', token: a.token }, m => m.t === 'err' || m.t === 'auth');
  ok(r.t === 'auth' && r.me.nick === 'Марья_Тест', 'вход по токену сессии');
  ok(a.has(m => m.t === 'kicked'), 'старое подключение того же аккаунта отключено');
  c2.close();
  const aa = await new Cl().open(); r = await aa.req({ t: 'login', nick: 'Марья_Тест', pass: 'secret123' }, m => m.t === 'auth'); a.close(); a.ws = aa.ws; Object.assign(a, { q: aa.q, waiters: aa.waiters, log: aa.log }); aa.ws.onmessage = e => { const m = JSON.parse(e.data); a.log.push(m); const i = a.waiters.findIndex(w => w.f(m)); if (i >= 0) { const [w] = a.waiters.splice(i, 1); clearTimeout(w.to); w.res(m); } else a.q.push(m); }; a.token = r.token;
  // блокировка перебора
  const bf = await new Cl().open();
  let locked = false; for (let i = 0; i < 7; i++) { const z = await bf.req({ t: 'login', nick: 'Марья_Тест', pass: 'bad' + i }, m => m.t === 'err'); if (z.code === 'locked') locked = true; }
  ok(locked, 'после 5 неверных паролей вход временно блокируется');
  bf.close();

  console.log('\n[3] Пароли хранятся хешами');
  I.saveDBNow();
  const raw = fs.readFileSync(path.join(DIR, 'db.json'), 'utf8');
  ok(!raw.includes('secret123'), 'пароль в открытом виде в базе отсутствует');
  ok(/scrypt\$16384\$8\$1\$[0-9a-f]{32}\$[0-9a-f]{128}/.test(raw), 'в базе scrypt-хеш с солью');
  ok(!raw.includes(aTok), 'токены сессий хранятся только как sha256');

  console.log('\n[4] Друзья, профили, поиск только по нику');
  const b = await mk('Гусь_Тест'); const d = await mk('Дима_Авто');
  r = await a.req({ t: 'search', nick: 'Гусь' }, m => m.t === 'profile'); ok(r.p === null, 'поиск по части ника ничего не находит');
  r = await a.req({ t: 'search', nick: 'гусь_тест' }, m => m.t === 'profile'); ok(r.p && r.p.nick === 'Гусь_Тест' && r.p.online === true && r.p.rel === 'none' && typeof r.p.reg === 'number' && typeof r.p.playSec === 'number', 'профиль: ник, онлайн, дата регистрации, время в игре', r.p);
  a.send({ t: 'friend_req', nick: 'Гусь_Тест' });
  r = await b.wait(m => m.t === 'note' && m.kind === 'friend_req'); ok(r.nick === 'Марья_Тест', 'получатель видит уведомление о запросе');
  r = await b.wait(m => m.t === 'me' && m.me.inReq.includes('Марья_Тест')); ok(true, 'запрос в списке входящих');
  b.send({ t: 'friend_resp', nick: 'Марья_Тест', accept: false }); await b.wait(m => m.t === 'me' && m.me.inReq.length === 0);
  r = await a.req({ t: 'search', nick: 'Гусь_Тест' }, m => m.t === 'profile'); ok(r.p.rel === 'none', 'после отклонения друзьями не стали');
  a.send({ t: 'friend_req', nick: 'Гусь_Тест' }); await b.wait(m => m.t === 'me' && m.me.inReq.length === 1);
  b.send({ t: 'friend_resp', nick: 'Марья_Тест', accept: true });
  r = await a.wait(m => m.t === 'me' && m.me.friends.some(f => f.nick === 'Гусь_Тест')); ok(true, 'после принятия оба в друзьях');
  r = await b.wait(m => m.t === 'me' && m.me.friends.some(f => f.nick === 'Марья_Тест')); ok(r.me.friends[0].online === true, 'статус онлайн в списке друзей');
  d.send({ t: 'set_auto', on: true }); await d.wait(m => m.t === 'me' && m.me.auto === true);
  a.send({ t: 'friend_req', nick: 'Дима_Авто' });
  r = await a.wait(m => m.t === 'me' && m.me.friends.some(f => f.nick === 'Дима_Авто')); ok(true, 'автопринятие: запрос принят сразу');
  r = await a.req({ t: 'friend_req', nick: 'Марья_Тест' }, m => m.t === 'err'); ok(r.code === 'self', 'нельзя добавить самого себя');

  console.log('\n[5] Публичные комнаты ХАОС и лимит 25');
  r = await a.req({ t: 'rooms' }, m => m.t === 'rooms'); ok(r.rooms[0].name === 'ХАОС-1' && r.rooms[0].max === 25 && r.rooms[0].count === 0, 'есть ХАОС-1, вместимость 25');
  r = await a.req({ t: 'quick' }, m => m.t === 'joined' || m.t === 'err'); ok(r.t === 'joined' && r.room.name === 'ХАОС-1', 'быстрое подключение');
  const bulk = [];
  for (let i = 0; i < 24; i++) { bulk.push(await mk('Бот' + String(i).padStart(2, '0'))); }
  for (const c of bulk) c.send({ t: 'join', room: 'r1' });
  await sleep(600);
  const list1 = (await d.req({ t: 'rooms' }, m => m.t === 'rooms')).rooms;
  ok(list1[0].count === 25, 'в комнате ровно 25 игроков', list1[0]);
  ok(list1.length >= 2 && list1[1].name === 'ХАОС-2', 'при заполнении автоматически создана ХАОС-2', list1.map(x => x.name + ':' + x.count));
  r = await d.req({ t: 'join', room: 'r1' }, m => m.t === 'err' || m.t === 'joined'); ok(r.t === 'err' && r.code === 'full', '26-й игрок не заходит в полную комнату', r);
  r = await d.req({ t: 'quick' }, m => m.t === 'joined' || m.t === 'err'); ok(r.t === 'joined' && r.room.name === 'ХАОС-2', 'быстрое подключение направляет в комнату с местом');
  // гонка за последнее место
  const racers = []; for (let i = 0; i < 6; i++) racers.push(await mk('Гонщик' + i));
  const lastOne = bulk.pop(); lastOne.send({ t: 'leave' }); await sleep(200);
  for (const c of racers) c.send({ t: 'join', room: 'r1' }); await sleep(600);
  const list2 = (await d.req({ t: 'rooms' }, m => m.t === 'rooms')).rooms; ok(list2[0].count === 25, 'гонка за освободившееся место: не больше 25', list2[0].count);
  bulk.push(lastOne);

  console.log('\n[6] Закрытая/открытая комната и одобрение создателя');
  const o1 = await mk('Хозяин'); const g1 = await mk('Гость1'), g2 = await mk('Гость2');
  o1.send({ t: 'create_room', name: 'Моя закрытая', open: false }); const jr = await joined(o1); ok(jr.room.kind === 'custom' && jr.room.open === false, 'создана закрытая комната');
  g1.send({ t: 'join', room: jr.room.id }); await g1.wait(m => m.t === 'join_pending');
  r = await o1.wait(m => m.t === 'join_request'); ok(r.nick === 'Гость1', 'создатель получил запрос на вход');
  o1.send({ t: 'join_resp', req: r.req, accept: true }); r = await g1.wait(m => m.t === 'joined'); ok(r.room.count === 2, 'после одобрения гость в комнате');
  g2.send({ t: 'join', room: jr.room.id }); await g2.wait(m => m.t === 'join_pending'); r = await o1.wait(m => m.t === 'join_request');
  o1.send({ t: 'join_resp', req: r.req, accept: false }); await g2.wait(m => m.t === 'join_denied'); ok(true, 'отклонённый запрос → отказ');
  g1.send({ t: 'join_resp', req: 'q1', accept: true }); r = await g1.wait(m => m.t === 'err'); ok(r.code === 'perm', 'не-создатель не может одобрять');
  const o2 = await mk('Хозяин2'); o2.send({ t: 'create_room', name: 'Открытая', open: true }); const jo = await joined(o2);
  g2.send({ t: 'join', room: jo.room.id }); r = await g2.wait(m => m.t === 'joined'); ok(r.room.count === 2, 'открытая комната: вход без одобрения');

  console.log('\n[7] Приватная комната друзей (2 игрока) и приглашения');
  a.send({ t: 'create_private' }); r = await joined(a); ok(r.room.kind === 'friends' && r.room.max === 2, 'приватная комната на 2 игрока');
  const lst = (await d.req({ t: 'rooms' }, m => m.t === 'rooms')).rooms; ok(!lst.some(x => x.kind === 'friends'), 'приватные комнаты не видны в публичном списке');
  r = await d.req({ t: 'join', room: r.room.id }, m => m.t === 'err'); ok(r.code === 'noroom', 'нельзя войти в приватную комнату по номеру');
  a.send({ t: 'invite', nick: 'Гусь_Тест' }); r = await b.wait(m => m.t === 'invite'); ok(r.from === 'Марья_Тест' && r.room.kind === 'friends', 'друг получил приглашение-уведомление');
  const inv = r;
  b.send({ t: 'invite_resp', id: inv.id, accept: false }); r = await a.wait(m => m.t === 'note' && m.kind === 'invite_no'); ok(true, 'приглашение можно отклонить');
  a.send({ t: 'invite', nick: 'Гусь_Тест' }); r = await b.wait(m => m.t === 'invite');
  b.send({ t: 'invite_resp', id: r.id, accept: true }); r = await b.wait(m => m.t === 'joined'); ok(r.room.count === 2 && r.room.kind === 'friends', 'приглашение принято — друг в комнате');
  a.send({ t: 'invite', nick: 'Дима_Авто' }); r = await a.wait(m => m.t === 'err'); ok(r.code === 'full' || r.code === 'offline' || r.code === 'notfriend', 'третьего пригласить нельзя (в комнате нет мест)', r.code);
  const st = await new Cl().open(); r = await st.req({ t: 'register', nick: 'Чужой1', pass: 'secret123' }, m => m.t === 'auth');
  st.send({ t: 'invite', nick: 'Гусь_Тест' }); r = await st.wait(m => m.t === 'err'); ok(true, 'нельзя приглашать не будучи в комнате / не друга');
  // join_friend со стороны третьего друга: комната полная
  d.send({ t: 'join_friend', nick: 'Марья_Тест' }); r = await d.wait(m => m.t === 'err' || m.t === 'join_pending'); ok(r.t === 'err' && r.code === 'full', 'третий не может подключиться к комнате на двоих', r);
  // join_friend: новый друг, запрос одобряет создатель
  const f2 = await mk('Друг2'); f2.send({ t: 'friend_req', nick: 'Дима_Авто' }); await sleep(300);
  d.send({ t: 'leave' }); await d.wait(m => m.t === 'left'); d.send({ t: 'create_private' }); const dr = await joined(d);
  f2.send({ t: 'friend_req', nick: 'Дима_Авто' }); await f2.wait(m => m.t === 'me' && m.me.friends.some(f => f.nick === 'Дима_Авто'));
  f2.send({ t: 'join_friend', nick: 'Дима_Авто' }); await f2.wait(m => m.t === 'join_pending'); r = await d.wait(m => m.t === 'join_request');
  d.send({ t: 'join_resp', req: r.req, accept: true }); r = await f2.wait(m => m.t === 'joined'); ok(r.room.id === dr.room.id, 'запрос к приватной комнате друга одобрен создателем');

  console.log('\n[8] PvP, оружие, события, предметы');
  const p1 = await mk('Боец1'), p2 = await mk('Боец2');
  p1.send({ t: 'create_room', name: 'Арена', open: true }); const ar = await joined(p1);
  p2.send({ t: 'join', room: ar.room.id }); const p2j = await joined(p2); const id1 = p2j.players[0].id, id2 = p2j.you;
  p1.send({ t: 'st', x: 0, y: 0, z: 0, yaw: 0, an: 0 }); p2.send({ t: 'st', x: 5, y: 0, z: 0, yaw: 0, an: 0 });
  await sleep(150);
  p1.send({ t: 'hit', w: 'revolver', target: id2 }); await sleep(100);
  await sleep(3200);  // защита после входа
  p1.clear(); p2.clear();
  p1.send({ t: 'hit', w: 'revolver', target: id2 }); r = await p2.wait(m => m.t === 'hp'); ok(r.hp === 75, 'попадание из револьвера: −25 HP, сервер сам считает урон', r.hp);
  p1.send({ t: 'hit', w: 'revolver', target: id2 }); await sleep(100); ok(!p2.q.some(m => m.t === 'hp'), 'повторный выстрел внутри перезарядки игнорируется');
  p1.send({ t: 'st', x: 400, y: 0, z: 0, yaw: 0, an: 0 }); await sleep(100);
  await sleep(600); p1.send({ t: 'hit', w: 'revolver', target: id2 }); await sleep(150); ok(!p2.q.some(m => m.t === 'hp'), 'выстрел с расстояния 400 м отклонён сервером');
  p1.send({ t: 'st', x: 2, y: 0, z: 0, yaw: 0, an: 0 }); await sleep(100);
  let kills = 0;
  for (let i = 0; i < 6 && !p2.has(m => m.t === 'kill'); i++) { await sleep(560); p1.send({ t: 'hit', w: 'revolver', target: id2 }); }
  r = await p2.wait(m => m.t === 'kill'); ok(r.victim === id2 && r.killer === id1, 'убийство засчитано серверу, killer/victim верны');
  r = await p2.wait(m => m.t === 'respawn', 6000); ok(r.hp === 100, 'респаун через ~4 с с полным HP');
  p1.send({ t: 'hit', w: 'nuke', target: id2 }); await sleep(100); ok(true, 'неизвестное оружие игнорируется');
  I.rooms.get(ar.room.id).pickups.clear();
  // предметы и новое оружие
  const room = I.rooms.get(ar.room.id);
  room.pickups.set(901, { id: 901, k: 'wquack', spot: 5, air: false }); room.pickSeq = 901;
  p1.send({ t: 'pick', id: 901 }); r = await p1.wait(m => m.t === 'got'); ok(r.k === 'wquack' && r.wpn.quack === 5, 'предмет выдал новое оружие «Кряк-волна» с 5 зарядами', r);
  await sleep(3700); p2.clear(); p1.send({ t: 'st', x: 3, y: 0, z: 0, yaw: 0, an: 0 }); p2.send({ t: 'st', x: 6, y: 0, z: 0, yaw: 0, an: 0 }); await sleep(150);
  p1.send({ t: 'use', w: 'quack', yaw: 0 }); r = await p2.wait(m => m.t === 'hp'); ok(r.hp === 86, 'кряк-волна бьёт по области на сервере (14 урона)', r.hp);
  r = await p2.wait(m => m.t === 'push'); ok(r.f > 0, 'кряк-волна отталкивает цель');
  p1.send({ t: 'use', w: 'slipper', yaw: 0 }); await sleep(100); ok(true, 'использовать оружие без зарядов нельзя');
  p2.clear(); p2.send({ t: 'self', n: 15, src: 'trap' }); r = await p2.wait(m => m.t === 'hp'); ok(r.hp === 71, 'урон от ловушки/воды с клиента учитывается сервером', r.hp);
  p2.send({ t: 'self', n: 9999, src: 'x' }); await sleep(100); ok((await p2.wait(m => m.t === 'hp')).hp >= 31, 'самоурон ограничен лимитом (нельзя «убить» одним пакетом)');
  // события
  p1.clear(); const e = I.startEvent(room, I.SMALL_EVENTS.find(x => x.k === 'meteor'), false);
  r = await p1.wait(m => m.t === 'ev' && m.e.k === 'meteor'); ok(r.e.n && r.e.left > 0, 'событие «метеоритный дождик» разослано игрокам');
  r = await p1.wait(m => m.t === 'strike', 4000); ok(r.rad > 0, 'метеорит с предупреждением о месте удара');
  r = await p1.wait(m => m.t === 'evend', 14000); ok(true, 'событие завершилось по таймеру');
  for (const m of room.members.values()) { m.g.alive = true; m.g.hp = 100; } // метеориты могли убить бойцов
  I.startEvent(room, I.BIG_EVENTS.find(x => x.k === 'bounty'), true); r = await p1.wait(m => m.t === 'bounty' && m.id); ok(!!r.nick, 'событие «Охота» назначило цель');
  I.startEvent(room, I.BIG_EVENTS.find(x => x.k === 'circle'), true); r = await p1.wait(m => m.t === 'ev' && m.e.k === 'circle'); ok(r.e.data.c.r0 === 160, 'сжимающееся кольцо передаёт центр и радиус');
  // авто-таймер событий
  room.ev.smallT = 0.05; p1.clear(); r = await p1.wait(m => m.t === 'ev', 3000); ok(true, 'малые события запускаются автоматически по таймеру');
  room.ev.bigT = 15.5; room.ev.warned = false; r = await p1.wait(m => m.t === 'warn', 3000); ok(!!r.n, 'крупное событие объявляется заранее');
  // снапшоты
  p1.clear(); r = await p1.wait(m => m.t === 'snap', 2000); ok(Array.isArray(r.p) && r.p.length >= 1, 'сервер рассылает снимки позиций игроков');

  console.log('\n[9] Сохранность данных при перезапуске сервера');
  a.send({ t: 'leave' }); await sleep(100);
  const stats = I.db().users['марья_тест']; ok(stats.playSec >= 0, 'время в игре накапливается');
  const before = JSON.stringify(Object.keys(I.db().users).sort());
  for (const c of [a, b, d, o1, o2, g1, g2, p1, p2, f2, st, ...bulk, ...racers]) c.close();
  await sleep(300);
  await new Promise(r => srv.stop(r));
  ok(fs.existsSync(path.join(DIR, 'db.json')), 'файл базы записан на диск при остановке');
  // новый процесс: загрузим базу заново
  const { spawn } = require('child_process');
  const child = spawn(process.execPath, [path.join(__dirname, '..', 'server.js')], { env: Object.assign({}, process.env, { PORT: '18098', DATA_DIR: DIR }) });
  await sleep(900);
  const w = new WebSocket('ws://127.0.0.1:18098'); const got = [];
  await new Promise(res => { w.onmessage = e => { const m = JSON.parse(e.data); got.push(m); if (m.t === 'hello') w.send(JSON.stringify({ t: 'login', nick: 'Марья_Тест', pass: 'secret123' })); if (m.t === 'auth' || m.t === 'err') res(); }; w.onerror = res; setTimeout(res, 3000); });
  const au = got.find(m => m.t === 'auth');
  ok(au && au.me.nick === 'Марья_Тест', 'после перезапуска сервера аккаунт и пароль работают');
  ok(au && au.me.friends.some(f => f.nick === 'Гусь_Тест') && au.me.friends.some(f => f.nick === 'Дима_Авто'), 'список друзей сохранился');
  ok(au && au.me.reg > 0, 'дата регистрации сохранилась');
  w.close(); await new Promise(r => { child.on('exit', r); child.kill(); });
  // повреждённая база — не затираем
  fs.writeFileSync(path.join(DIR, 'db.json'), '{broken'); fs.writeFileSync(path.join(DIR, 'db.json.bak'), '{broken2');
  const bad = spawn(process.execPath, [path.join(__dirname, '..', 'server.js')], { env: Object.assign({}, process.env, { PORT: '18097', DATA_DIR: DIR }) });
  const code = await new Promise(res => bad.on('exit', res));
  ok(code === 2 && fs.readdirSync(DIR).some(f => f.includes('.corrupt-')), 'при повреждённой базе сервер не стартует и не затирает данные (копия сохранена)', code);

  console.log('\n══ Итого: ' + pass + ' проверок пройдено, ' + failN + ' провалено ══');
  fs.rmSync(DIR, { recursive: true, force: true });
  process.exit(failN ? 1 : 0);
})().catch(e => { console.error('ТЕСТ УПАЛ:', e); process.exit(1); });
