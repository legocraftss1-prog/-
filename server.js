'use strict';
/* =====================================================================
   МГИАГ 1.11 — игровой сервер (Node.js + WebSocket)
   Аккаунты (scrypt), друзья, приглашения, комнаты «ХАОС» (до 25 игроков),
   приватные комнаты друзей (2 игрока), события хаоса, PvP, предметы.
   Запуск:  npm install  &&  npm start
   ===================================================================== */
const http = require('http');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

let WebSocketServer;
try { ({ WebSocketServer } = require('ws')); }
catch (e) { console.error('Не найден модуль "ws". Выполните в папке server:  npm install'); process.exit(1); }

/* ------------------------------ настройки ------------------------------ */
const CFG = {
  port: +process.env.PORT || 8080,
  dataDir: process.env.DATA_DIR || path.join(__dirname, 'data'),
  origins: (process.env.ALLOWED_ORIGINS || '*').split(',').map(s => s.trim()).filter(Boolean),
  trustProxy: process.env.TRUST_PROXY === '1',
  roomMax: +process.env.ROOM_MAX || 25,
  privateMax: 2,
  version: '1.11',
  sessionDays: 60,
  smallEvery: [14, 30],      // секунд между малыми событиями
  bigEvery: 210,             // секунд между крупными событиями
  bigWarn: 15,               // предупреждение перед крупным событием
  tickMs: 100,
};
module.exports.CFG = CFG;

/* ------------------------------ хранилище ------------------------------ */
const DB_FILE = path.join(CFG.dataDir, 'db.json');
const DB_BAK = path.join(CFG.dataDir, 'db.json.bak');
let db = { v: 1, users: {}, sessions: {} };
let dbDirty = false, dbTimer = null;

function loadDB() {
  fs.mkdirSync(CFG.dataDir, { recursive: true });
  const tryRead = f => { try { const o = JSON.parse(fs.readFileSync(f, 'utf8')); if (o && o.users && o.sessions) return o; } catch (e) { } return null; };
  const exists = fs.existsSync(DB_FILE) || fs.existsSync(DB_BAK);
  const o = tryRead(DB_FILE) || tryRead(DB_BAK);
  if (o) { db = o; return; }
  if (exists) {
    // Файлы есть, но не читаются: НИКОГДА не затираем молча.
    const stash = DB_FILE + '.corrupt-' + Date.now();
    try { fs.copyFileSync(fs.existsSync(DB_FILE) ? DB_FILE : DB_BAK, stash); } catch (e) { }
    console.error('ВНИМАНИЕ: база данных повреждена. Копия сохранена в', stash, '— сервер остановлен, чтобы не потерять аккаунты.');
    process.exit(2);
  }
}
function saveDBNow() {
  if (!dbDirty) return;
  dbDirty = false;
  const tmp = DB_FILE + '.tmp';
  try {
    fs.writeFileSync(tmp, JSON.stringify(db));
    if (fs.existsSync(DB_FILE)) fs.copyFileSync(DB_FILE, DB_BAK);
    fs.renameSync(tmp, DB_FILE);
  } catch (e) { console.error('Ошибка записи базы:', e.message); dbDirty = true; }
}
function touchDB() { dbDirty = true; if (!dbTimer) dbTimer = setTimeout(() => { dbTimer = null; saveDBNow(); }, 1500); }

/* ------------------------------ пароли/ники ------------------------------ */
const SC = { N: 16384, r: 8, p: 1, len: 64 };
function scryptAsync(pass, salt, N, r, p, len) {
  return new Promise((res, rej) => crypto.scrypt(pass, salt, len, { N, r, p, maxmem: 64 * 1024 * 1024 }, (e, k) => e ? rej(e) : res(k)));
}
async function hashPass(pass) {
  const salt = crypto.randomBytes(16);
  const k = await scryptAsync(pass.normalize('NFKC'), salt, SC.N, SC.r, SC.p, SC.len);
  return ['scrypt', SC.N, SC.r, SC.p, salt.toString('hex'), k.toString('hex')].join('$');
}
async function checkPass(pass, stored) {
  try {
    const [alg, N, r, p, salt, hash] = stored.split('$');
    if (alg !== 'scrypt') return false;
    const want = Buffer.from(hash, 'hex');
    const got = await scryptAsync(pass.normalize('NFKC'), Buffer.from(salt, 'hex'), +N, +r, +p, want.length);
    return crypto.timingSafeEqual(want, got);
  } catch (e) { return false; }
}
const NICK_RE = /^[\p{L}\p{N}_\-]{3,16}$/u;
const RESERVED = ['admin', 'administrator', 'moderator', 'server', 'system', 'система', 'админ', 'модератор', 'сервер', 'mgiag', 'мгиаг'];
function nickKey(n) { return String(n).normalize('NFKC').toLowerCase(); }
function checkNick(n) {
  if (typeof n !== 'string') return 'Введите никнейм.';
  n = n.normalize('NFKC').trim();
  if (!NICK_RE.test(n)) return 'Никнейм: 3–16 символов, буквы, цифры, _ и -.';
  if (/[A-Za-z]/.test(n) && /[\u0400-\u04FF]/.test(n)) return 'Не смешивайте русские и латинские буквы в одном нике.';
  if (RESERVED.includes(nickKey(n))) return 'Этот никнейм зарезервирован.';
  return null;
}
function checkPassFormat(p) {
  if (typeof p !== 'string' || p.length < 6) return 'Пароль: минимум 6 символов.';
  if (p.length > 100) return 'Пароль слишком длинный.';
  return null;
}
const sha = s => crypto.createHash('sha256').update(s).digest('hex');
function newSession(ukey) {
  const token = crypto.randomBytes(32).toString('hex');
  db.sessions[sha(token)] = { u: ukey, exp: Date.now() + CFG.sessionDays * 864e5 };
  touchDB();
  return token;
}
function sessionUser(token) {
  if (typeof token !== 'string' || token.length !== 64) return null;
  const s = db.sessions[sha(token)];
  if (!s) return null;
  if (s.exp < Date.now()) { delete db.sessions[sha(token)]; touchDB(); return null; }
  return db.users[s.u] ? s.u : null;
}

/* ------------------------------ защита от перебора ------------------------------ */
const ipHits = new Map(); // 'reg:ip' / 'bad:ip' -> [timestamps]
// Успешные входы НЕ считаются (за одним мобильным NAT могут сидеть сотни игроков).
// Считаются только регистрации и неудачные попытки входа.
function ipCount(kind, ip, windowMs) { const now = Date.now(), k = kind + ':' + ip; const a = (ipHits.get(k) || []).filter(t => now - t < windowMs); ipHits.set(k, a); return a.length; }
function ipNote(kind, ip) { const k = kind + ':' + ip; const a = ipHits.get(k) || []; a.push(Date.now()); ipHits.set(k, a); }
const REG_PER_HOUR = +process.env.REG_PER_HOUR || 20, BAD_PER_10MIN = +process.env.BAD_PER_10MIN || 40;
const fails = new Map(); // ukey -> {n, until}
function lockLeft(ukey) { const f = fails.get(ukey); return f && f.until > Date.now() ? Math.ceil((f.until - Date.now()) / 1000) : 0; }
function noteFail(ukey) { const f = fails.get(ukey) || { n: 0, until: 0 }; f.n++; if (f.n >= 5) { f.until = Date.now() + 60000 * Math.min(10, f.n - 4); } fails.set(ukey, f); }
function clearFail(ukey) { fails.delete(ukey); }
setInterval(() => { const now = Date.now(); for (const [k, a] of ipHits) { if (!a.some(t => now - t < 3600000)) ipHits.delete(k); } for (const [k, f] of fails) if (f.until < now - 600000) fails.delete(k); }, 60000).unref();

/* ------------------------------ соединения ------------------------------ */
let connSeq = 0;
const conns = new Set();
const online = new Map(); // ukey -> conn
const send = (c, o) => { if (c.ws.readyState === 1) { try { c.ws.send(JSON.stringify(o)); } catch (e) { } } };
const sendUser = (ukey, o) => { const c = online.get(ukey); if (c) send(c, o); };

/* ------------------------------ комнаты ------------------------------ */
const rooms = new Map();
let roomSeq = 0, officialSeq = 0;
const roomOf = c => c.room ? rooms.get(c.room) : null;
const WORLD_LIM = 800;

function newRoom(kind, name, owner, open) {
  const id = 'r' + (++roomSeq);
  const r = {
    id, kind, name, owner: owner || null, open: kind === 'friends' ? false : open !== false,
    cap: kind === 'friends' ? CFG.privateMax : CFG.roomMax,
    members: new Map(), pending: new Map(), created: Date.now(), emptySince: Date.now(),
    seed: crypto.randomInt(1, 2 ** 31 - 1), t: 0, ev: { smallT: rr(8, 16), bigT: CFG.bigEvery, warned: false, active: [] },
    pickups: new Map(), pickSeq: 0, pickT: 3, bounty: null, circle: null, strikes: [], zones: [], num: 0,
  };
  rooms.set(id, r);
  return r;
}
function newOfficial() { const r = newRoom('chaos', 'ХАОС-' + (++officialSeq), null, true); r.official = true; r.num = officialSeq; return r; }
function ensureOfficial() {
  const offs = [...rooms.values()].filter(r => r.official);
  if (!offs.some(r => r.members.size < r.cap)) newOfficial();
}
function roomInfo(r) { return { id: r.id, name: r.name, kind: r.kind, open: r.open, count: r.members.size, max: r.cap, owner: r.owner ? (db.users[r.owner] || {}).nick : null, official: !!r.official }; }
function listRooms() { return [...rooms.values()].filter(r => r.kind !== 'friends').sort((a, b) => (b.official - a.official) || (a.num - b.num) || (a.created - b.created)).map(roomInfo); }
function broadcastRoomList() { const l = listRooms(); for (const c of conns) if (c.user && c.watching) send(c, { t: 'rooms', rooms: l }); }
function bcast(r, o, except) { for (const m of r.members.values()) if (m !== except) send(m, o); }

function fillRoomCap(r) { return r.members.size >= r.cap; }
function joinRoom(c, r) {
  if (c.room === r.id) return true;
  if (fillRoomCap(r)) return false;
  leaveRoom(c, true);
  c.room = r.id; r.members.set(c.id, c); r.emptySince = 0;
  c.g = { x: 0, y: 0, z: 0, yaw: 0, an: 0, hp: 100, alive: true, kills: 0, deaths: 0, score: 0, spawnProt: Date.now() + 3000, fx: {}, wpn: {}, last: {}, joinT: Date.now(), stuck: 0, got: false };
  c.joinStat = Date.now();
  if (r.kind === 'friends' && !r.owner) r.owner = c.user;
  send(c, { t: 'joined', room: roomInfo(r), you: c.id, seed: r.seed, rt: r.t, players: [...r.members.values()].filter(m => m !== c).map(pubPlayer), pickups: [...r.pickups.values()], events: r.ev.active.map(evPub), bounty: r.bounty, circle: r.circle });
  bcast(r, { t: 'pjoin', p: pubPlayer(c) }, c);
  if (r.official) ensureOfficial();
  broadcastRoomList();
  return true;
}
function pubPlayer(c) { return { id: c.id, nick: c.nick, hp: c.g.hp, k: c.g.kills, d: c.g.deaths }; }
function leaveRoom(c, silent) {
  const r = roomOf(c); if (!r) return;
  addPlaytime(c);
  r.members.delete(c.id); c.room = null; c.g = null;
  bcast(r, { t: 'pleft', id: c.id });
  for (const [rid, rq] of r.pending) if (rq.conn === c) r.pending.delete(rid);
  if (r.owner === c.user && r.members.size) { // передать владение
    const nx = [...r.members.values()][0]; r.owner = nx.user; send(nx, { t: 'owner', room: r.id });
  }
  if (!r.members.size) { r.emptySince = Date.now(); r.owner = r.kind === 'friends' ? r.owner : r.owner; }
  if (r.kind !== 'chaos' && !r.members.size) rooms.delete(r.id);
  if (!silent) send(c, { t: 'left' });
  broadcastRoomList();
}
function addPlaytime(c) {
  if (c.joinStat && c.user && db.users[c.user]) { const s = Math.floor((Date.now() - c.joinStat) / 1000); if (s > 0) { db.users[c.user].playSec = (db.users[c.user].playSec || 0) + s; touchDB(); } }
  c.joinStat = 0;
}
// комнаты ХАОС: убрать пустые лишние
setInterval(() => {
  const offs = [...rooms.values()].filter(r => r.official).sort((a, b) => a.num - b.num);
  for (const r of offs) { if (!r.members.size && r.emptySince && Date.now() - r.emptySince > 120000 && offs.length > 1 && r !== offs[0]) rooms.delete(r.id); }
  ensureOfficial(); broadcastRoomList();
}, 30000).unref();

let reqSeq = 0;
function requestJoin(c, r) {
  const oc = r.owner && online.get(r.owner);
  if (!oc || oc.room !== r.id) return err(c, 'noowner', 'Создателя сейчас нет в комнате, одобрить вход некому.');
  if (r.members.size >= r.cap) return err(c, 'full', 'Комната заполнена (' + r.cap + '/' + r.cap + ').');
  for (const rq of r.pending.values()) if (rq.conn === c) return send(c, { t: 'join_pending', room: r.id, name: r.name });
  const id = 'q' + (++reqSeq);
  r.pending.set(id, { conn: c, t: Date.now() });
  send(oc, { t: 'join_request', req: id, nick: c.nick, room: r.id });
  send(c, { t: 'join_pending', room: r.id, name: r.name });
}
function quickRoom() {
  ensureOfficial();
  const offs = [...rooms.values()].filter(r => r.official && r.members.size < r.cap).sort((a, b) => (b.members.size - a.members.size) || (a.num - b.num));
  return offs[0] || null;
}

/* ------------------------------ друзья/профили ------------------------------ */
const U = k => db.users[k];
function friendState(me, other) {
  if (me === other) return 'self';
  const u = U(me);
  if (u.friends.includes(other)) return 'friend';
  if (u.outReq.includes(other)) return 'out';
  if (u.inReq.includes(other)) return 'in';
  return 'none';
}
function profileOf(viewer, key) {
  const u = U(key); if (!u) return null;
  const c = online.get(key);
  let playSec = u.playSec || 0; if (c && c.joinStat) playSec += Math.floor((Date.now() - c.joinStat) / 1000);
  const r = c && roomOf(c);
  return { nick: u.nick, online: !!c, reg: u.reg, playSec, rel: friendState(viewer, key), stats: u.stats, room: r && r.kind !== 'friends' ? { id: r.id, name: r.name } : null };
}
function friendsFor(key) {
  const u = U(key);
  return u.friends.map(k => profileOf(key, k)).filter(Boolean).sort((a, b) => (b.online - a.online) || a.nick.localeCompare(b.nick));
}
function meFor(key) {
  const u = U(key);
  return {
    nick: u.nick, reg: u.reg, playSec: u.playSec || 0, auto: !!u.auto, stats: u.stats, friends: friendsFor(key),
    inReq: u.inReq.map(k => (U(k) || {}).nick).filter(Boolean), outReq: u.outReq.map(k => (U(k) || {}).nick).filter(Boolean),
  };
}
function pushMe(key) { sendUser(key, { t: 'me', me: meFor(key) }); }
function addFriends(a, b) {
  const A = U(a), B = U(b);
  for (const [x, y, X] of [[a, b, A], [b, a, B]]) { X.friends = X.friends.filter(k => k !== y); X.friends.push(y); X.inReq = X.inReq.filter(k => k !== y); X.outReq = X.outReq.filter(k => k !== y); }
  touchDB();
}
function notifyPresence(key) { // друзьям — «вышел/зашёл»
  const u = U(key); if (!u) return;
  for (const f of u.friends) sendUser(f, { t: 'fstate', nick: u.nick, online: online.has(key) });
}

/* ------------------------------ приглашения ------------------------------ */
const invites = new Map(); // id -> {id, from, to, room, exp}
let invSeq = 0;
setInterval(() => { const n = Date.now(); for (const [id, i] of invites) if (i.exp < n) invites.delete(id); }, 15000).unref();

/* ------------------------------ геймплей ------------------------------ */
function rr(a, b) { return a + Math.random() * (b - a); }
function ri(a, b) { return Math.floor(rr(a, b + 1)); }
const pick = a => a[Math.floor(Math.random() * a.length)];
const num = (v, lo, hi, d) => (typeof v === 'number' && isFinite(v)) ? Math.min(hi, Math.max(lo, v)) : d;

// Оружие: сервер сам знает урон, дальность и перезарядку — клиент урон не присылает.
const WEAPONS = {
  fists: { dmg: 6, range: 3.2, cd: 0.45 },
  revolver: { dmg: 25, range: 70, cd: 0.5 },
  goosegun: { dmg: 8, range: 34, cd: 0.8, pellets: 6 },
  mp5: { dmg: 8, range: 75, cd: 0.08 },
  ak: { dmg: 12, range: 85, cd: 0.1 },
  m4: { dmg: 11, range: 90, cd: 0.09 },
  awp: { dmg: 70, range: 220, cd: 1.3 },
  rpg: { dmg: 55, range: 160, cd: 2.2, splash: 7 },
  // новые необычные виды оружия (выдаются предметами на карте, ограниченные заряды)
  slipper: { dmg: 18, range: 32, cd: 1.0, ammo: 8, nameRu: 'Тапок-бумеранг' },
  bubble: { dmg: 4, range: 26, cd: 2.2, ammo: 6, stick: 2.6, nameRu: 'Мыльный пузырь' },
  quack: { dmg: 14, range: 9, cd: 3.0, ammo: 5, area: 9, nameRu: 'Кряк-волна' },
};
const PICKUPS = [
  { k: 'medkit', w: 5 }, { k: 'shield', w: 3 }, { k: 'rage', w: 3 }, { k: 'jump', w: 3 }, { k: 'speed', w: 3 },
  { k: 'wslipper', w: 3 }, { k: 'wbubble', w: 2 }, { k: 'wquack', w: 2 },
];
function pickKind() { const t = PICKUPS.reduce((s, p) => s + p.w, 0); let x = Math.random() * t; for (const p of PICKUPS) { if ((x -= p.w) <= 0) return p.k; } return 'medkit'; }

function dist(a, b) { return Math.hypot(a.x - b.x, a.z - b.z); }
function alivePlayers(r) { return [...r.members.values()].filter(m => m.g && m.g.alive); }

function damage(r, victim, amt, by, wname) {
  const g = victim.g; if (!g || !g.alive) return;
  const now = Date.now();
  if (g.spawnProt > now) return;
  if (g.fx.shield > now) amt *= 0.3;
  if (r.bounty && r.bounty.id === victim.id) amt *= 0.6;
  if (by && by.g && by.g.fx.rage > now) amt *= 1.7;
  g.hp = Math.max(0, g.hp - amt);
  if (g.hp <= 0) {
    g.alive = false; g.deaths++; g.respawnAt = now + 4000;
    victim.stat.deaths++; U(victim.user).stats.deaths++;
    let bonus = 1;
    if (by && by !== victim && by.g) {
      by.g.kills++; by.g.score += 1;
      if (r.bounty && r.bounty.id === victim.id) { by.g.score += 3; bonus = 4; r.bounty = null; bcast(r, { t: 'bounty', id: null }); }
      by.stat.kills++; U(by.user).stats.kills++;
    }
    touchDB();
    bcast(r, { t: 'kill', victim: victim.id, killer: by ? by.id : null, w: wname || null, bonus });
  } else {
    send(victim, { t: 'hp', hp: Math.round(g.hp), by: by ? by.id : null });
  }
}

/* --- события хаоса --- */
const SMALL_EVENTS = [
  { k: 'lowgrav', n: 'Низкая гравитация', dur: 20 },
  { k: 'speedrush', n: 'Все бегут быстрее', dur: 16 },
  { k: 'mirror', n: 'Зеркальное управление', dur: 10 },
  { k: 'meteor', n: 'Метеоритный дождик', dur: 12 },
  { k: 'toxic', n: 'Ядовитый туман', dur: 18 },
  { k: 'airdrop', n: 'Сброс припасов', dur: 2 },
  { k: 'blackout', n: 'Свет вырубили', dur: 14 },
];
const BIG_EVENTS = [
  { k: 'meteor_storm', n: 'МЕТЕОРИТНЫЙ ШТОРМ', dur: 40 },
  { k: 'zero_g', n: 'НЕВЕСОМОСТЬ', dur: 30 },
  { k: 'circle', n: 'СЖИМАЮЩЕЕСЯ КОЛЬЦО', dur: 70 },
  { k: 'bounty', n: 'ОХОТА НА ГУСЯ', dur: 60 },
];
function evPub(e) { return { id: e.id, k: e.k, n: e.n, big: e.big, left: Math.max(0, Math.round((e.until - Date.now()) / 1000)), seed: e.seed, data: e.data }; }
let evSeq = 0;
function startEvent(r, def, big) {
  const e = { id: ++evSeq, k: def.k, n: def.n, big, until: Date.now() + def.dur * 1000, seed: ri(1, 1e9), data: {}, nextT: 0 };
  const alive = alivePlayers(r);
  if (def.k === 'toxic') {
    const base = alive.length ? alive : [...r.members.values()];
    e.data.zones = [];
    for (let i = 0; i < Math.min(3, Math.max(1, base.length)); i++) { const p = pick(base); if (!p.g) continue; e.data.zones.push({ x: +(p.g.x + rr(-14, 14)).toFixed(1), z: +(p.g.z + rr(-14, 14)).toFixed(1), r: 13 }); }
  }
  if (def.k === 'airdrop') { for (let i = 0; i < 3; i++) spawnPickup(r, true); }
  if (def.k === 'circle') {
    const t = alive.length ? pick(alive) : null;
    const cx = t ? t.g.x : 0, cz = t ? t.g.z : 0;
    e.data.c = { x: +cx.toFixed(1), z: +cz.toFixed(1), r0: 160, r1: 22, t0: Date.now(), dur: def.dur * 1000 };
    r.circle = e.data.c;
  }
  if (def.k === 'bounty' && alive.length >= 2) {
    const t = pick(alive); r.bounty = { id: t.id, nick: t.nick }; e.data.target = t.id; bcast(r, { t: 'bounty', id: t.id, nick: t.nick });
  }
  r.ev.active.push(e);
  bcast(r, { t: 'ev', e: evPub(e) });
  return e;
}
function endEvent(r, e) {
  if (e.k === 'circle') r.circle = null;
  if (e.k === 'bounty' && r.bounty) { r.bounty = null; bcast(r, { t: 'bounty', id: null }); }
  bcast(r, { t: 'evend', id: e.id });
}
function strike(r, target, rad, dmg) {
  const g = target.g; const x = +(g.x + rr(-9, 9)).toFixed(1), z = +(g.z + rr(-9, 9)).toFixed(1);
  const st = { x, z, rad, dmg, at: Date.now() + 1500 };
  r.strikes.push(st);
  bcast(r, { t: 'strike', x, z, rad, in: 1.5 });
}
function spawnPickup(r, air) {
  if (r.pickups.size >= 14) return;
  const p = { id: ++r.pickSeq, k: pickKind(), spot: ri(0, 99999), air: !!air };
  r.pickups.set(p.id, p);
  bcast(r, { t: 'pickup', p });
}
function applyPickup(r, c, p) {
  const g = c.g, now = Date.now();
  switch (p.k) {
    case 'medkit': g.hp = Math.min(100, g.hp + 45); send(c, { t: 'hp', hp: Math.round(g.hp), by: null }); break;
    case 'shield': g.fx.shield = now + 10000; break;
    case 'rage': g.fx.rage = now + 12000; break;
    case 'jump': g.fx.jump = now + 15000; break;
    case 'speed': g.fx.speed = now + 15000; break;
    case 'wslipper': g.wpn.slipper = (g.wpn.slipper || 0) + WEAPONS.slipper.ammo; break;
    case 'wbubble': g.wpn.bubble = (g.wpn.bubble || 0) + WEAPONS.bubble.ammo; break;
    case 'wquack': g.wpn.quack = (g.wpn.quack || 0) + WEAPONS.quack.ammo; break;
  }
  send(c, { t: 'got', k: p.k, hp: Math.round(g.hp), fx: fxPub(g), wpn: g.wpn });
}
function fxPub(g) { const now = Date.now(), o = {}; for (const k in g.fx) if (g.fx[k] > now) o[k] = Math.round((g.fx[k] - now) / 1000); return o; }

function roomTick(r, dt) {
  const now = Date.now();
  r.t += dt;
  for (const [id, rq] of r.pending) if (now - rq.t > 120000) { r.pending.delete(id); send(rq.conn, { t: 'join_denied', room: r.id, timeout: true }); }
  if (!r.members.size) return;
  const ev = r.ev;
  // таймеры событий
  ev.smallT -= dt; ev.bigT -= dt;
  if (ev.smallT <= 0) { ev.smallT = rr(...CFG.smallEvery); startEvent(r, pick(SMALL_EVENTS), false); }
  if (!ev.warned && ev.bigT <= CFG.bigWarn) { ev.warned = true; ev.nextBig = pick(BIG_EVENTS); bcast(r, { t: 'warn', k: ev.nextBig.k, n: ev.nextBig.n, in: Math.round(Math.max(0, ev.bigT)) }); }
  if (ev.bigT <= 0) { ev.bigT = CFG.bigEvery; ev.warned = false; startEvent(r, ev.nextBig || pick(BIG_EVENTS), true); }
  // активные события
  for (let i = ev.active.length - 1; i >= 0; i--) {
    const e = ev.active[i];
    if (now >= e.until) { endEvent(r, e); ev.active.splice(i, 1); continue; }
    e.nextT -= dt;
    if (e.k === 'meteor' && e.nextT <= 0) { e.nextT = 1.6; const t = pick(alivePlayers(r)); if (t) strike(r, t, 5, 30); }
    if (e.k === 'meteor_storm' && e.nextT <= 0) { e.nextT = 0.7; const t = pick(alivePlayers(r)); if (t) strike(r, t, 6.5, 38); }
    if (e.k === 'toxic') for (const m of alivePlayers(r)) for (const z of e.data.zones) if (dist(m.g, z) < z.r) { m.g.tox = (m.g.tox || 0) + dt; if (m.g.tox >= 1) { m.g.tox = 0; damage(r, m, 5, null, 'toxic'); } }
    if (e.k === 'circle') {
      const c = e.data.c, u = Math.min(1, (now - c.t0) / c.dur), rad = c.r0 + (c.r1 - c.r0) * u;
      e.nextT -= 0; // урон раз в секунду
      for (const m of alivePlayers(r)) if (Math.hypot(m.g.x - c.x, m.g.z - c.z) > rad) { m.g.out = (m.g.out || 0) + dt; if (m.g.out >= 1) { m.g.out = 0; damage(r, m, 6, null, 'circle'); } }
    }
  }
  // удары метеоритов
  for (let i = r.strikes.length - 1; i >= 0; i--) {
    const s = r.strikes[i]; if (now < s.at) continue;
    r.strikes.splice(i, 1);
    for (const m of alivePlayers(r)) { const d = dist(m.g, s); if (d < s.rad) damage(r, m, s.dmg * (1 - d / s.rad * 0.5), null, 'meteor'); }
  }
  // предметы
  r.pickT -= dt;
  if (r.pickT <= 0) { r.pickT = rr(5, 9); spawnPickup(r, false); }
  // респавн
  for (const m of r.members.values()) {
    const g = m.g; if (!g) continue;
    if (!g.alive && now >= g.respawnAt) { g.alive = true; g.hp = 100; g.spawnProt = now + 3500; g.fx = {}; send(m, { t: 'respawn', spot: ri(0, 99999), hp: 100 }); bcast(r, { t: 'prs', id: m.id }, m); }
    if (g.stuck && g.stuck < now) g.stuck = 0;
  }
}
let snapAcc = 0;
function snapshots() {
  for (const r of rooms.values()) {
    if (r.members.size < 2) continue;
    const now = Date.now();
    const arr = [];
    for (const m of r.members.values()) {
      const g = m.g; if (!g || !g.got) continue;
      arr.push([m.id, +g.x.toFixed(2), +g.y.toFixed(2), +g.z.toFixed(2), +g.yaw.toFixed(2), g.an | 0, Math.round(g.hp), g.alive ? 1 : 0, g.veh || '']);
    }
    if (arr.length) bcast(r, { t: 'snap', p: arr });
  }
}
let lastTick = Date.now();
setInterval(() => {
  const now = Date.now(), dt = Math.min(0.5, (now - lastTick) / 1000); lastTick = now;
  for (const r of rooms.values()) { try { roomTick(r, dt); } catch (e) { console.error('roomTick', e); } }
  snapshots();
}, CFG.tickMs).unref();
// счётчики лобби раз в 5 сек (количество игроков должно отображаться верно)
setInterval(() => broadcastRoomList(), 5000).unref();

/* ------------------------------ обработка сообщений ------------------------------ */
function reply(c, t, extra) { send(c, Object.assign({ t }, extra)); }
function err(c, code, msg) { send(c, { t: 'err', code, msg }); }

async function onAuth(c, m) {
  const ip = c.ip;
  if (ipCount('bad', ip, 600000) >= BAD_PER_10MIN) return err(c, 'rate', 'Слишком много неудачных попыток. Подождите несколько минут.');
  if (m.t === 'register') {
    if (ipCount('reg', ip, 3600000) >= REG_PER_HOUR) return err(c, 'rate', 'С вашего адреса слишком много регистраций. Попробуйте позже.');
    ipNote('reg', ip);
    const e1 = checkNick(m.nick); if (e1) return err(c, 'nick', e1);
    const e2 = checkPassFormat(m.pass); if (e2) return err(c, 'pass', e2);
    const nick = m.nick.normalize('NFKC').trim(), key = nickKey(nick);
    if (db.users[key]) return err(c, 'taken', 'Этот никнейм уже занят.');
    const h = await hashPass(m.pass);
    if (db.users[key]) return err(c, 'taken', 'Этот никнейм уже занят.'); // повторная проверка после await
    db.users[key] = { nick, h, reg: Date.now(), playSec: 0, auto: false, friends: [], inReq: [], outReq: [], stats: { kills: 0, deaths: 0 } };
    touchDB();
    return loginOk(c, key, true);
  }
  if (m.t === 'login') {
    if (typeof m.nick !== 'string' || typeof m.pass !== 'string') return err(c, 'bad', 'Введите ник и пароль.');
    const key = nickKey(m.nick.trim()), u = db.users[key];
    const lk = lockLeft(key);
    if (lk) return err(c, 'locked', 'Слишком много неверных паролей. Подождите ' + lk + ' с.');
    // одинаковое время ответа для несуществующих ников
    const ok = u ? await checkPass(m.pass, u.h) : (await checkPass(m.pass, 'scrypt$16384$8$1$00$00'), false);
    if (!ok) { ipNote('bad', ip); if (u) noteFail(key); return err(c, 'creds', 'Неверный ник или пароль.'); }
    clearFail(key);
    return loginOk(c, key, false);
  }
  if (m.t === 'resume') {
    const key = sessionUser(m.token);
    if (!key) { ipNote('bad', ip); return err(c, 'session', 'Сессия истекла. Войдите снова.'); }
    return loginOk(c, key, false, m.token);
  }
}
function loginOk(c, key, isNew, token) {
  const old = online.get(key);
  if (old && old !== c) { send(old, { t: 'kicked', msg: 'Вы вошли с другого устройства.' }); try { old.ws.close(); } catch (e) { } dropConn(old); }
  c.user = key; c.nick = db.users[key].nick; online.set(key, c);
  c.stat = db.users[key].stats;
  const tk = token || newSession(key);
  send(c, { t: 'auth', token: tk, isNew: !!isNew, me: meFor(key), rooms: listRooms() });
  notifyPresence(key);
  // отложенные запросы дружбы показываем в me.inReq
}
function dropConn(c) {
  if (!conns.has(c)) return;
  leaveRoom(c, true);
  for (const r of rooms.values()) for (const [id, rq] of r.pending) if (rq.conn === c) r.pending.delete(id);
  conns.delete(c);
  if (c.user && online.get(c.user) === c) { online.delete(c.user); notifyPresence(c.user); }
  c.user = null;
}

function handle(c, m) {
  if (!c.user) return err(c, 'auth', 'Сначала войдите в аккаунт.');
  const key = c.user, me = U(key);
  switch (m.t) {
    case 'logout': { // выход из аккаунта: сессия удаляется
      if (typeof m.token === 'string') { delete db.sessions[sha(m.token)]; touchDB(); }
      leaveRoom(c, true); online.delete(key); notifyPresence(key); c.user = null; return send(c, { t: 'loggedout' });
    }
    case 'search': case 'profile': {
      if (typeof m.nick !== 'string') return;
      const k = nickKey(m.nick.trim()); // только точное совпадение ника
      const p = db.users[k] ? profileOf(key, k) : null;
      return send(c, { t: 'profile', q: m.nick, p });
    }
    case 'friend_req': {
      const k = nickKey(String(m.nick || '').trim()), o = U(k);
      if (!o) return err(c, 'nouser', 'Игрок не найден.');
      if (k === key) return err(c, 'self', 'Нельзя добавить самого себя.');
      if (me.friends.includes(k)) return err(c, 'already', 'Вы уже друзья.');
      if (me.inReq.includes(k)) { addFriends(key, k); pushMe(key); pushMe(k); sendUser(k, { t: 'note', kind: 'friend_ok', nick: me.nick }); return; }
      if (me.outReq.includes(k)) return err(c, 'pending', 'Запрос уже отправлен.');
      if (o.auto) { addFriends(key, k); pushMe(key); pushMe(k); sendUser(k, { t: 'note', kind: 'friend_ok', nick: me.nick }); return send(c, { t: 'note', kind: 'friend_ok', nick: o.nick }); }
      if (o.inReq.length >= 50) return err(c, 'full', 'У игрока слишком много запросов.');
      me.outReq.push(k); o.inReq.push(key); touchDB();
      pushMe(key); sendUser(k, { t: 'note', kind: 'friend_req', nick: me.nick }); pushMe(k); return;
    }
    case 'friend_resp': {
      const k = nickKey(String(m.nick || '').trim()), o = U(k);
      if (!o || !me.inReq.includes(k)) return err(c, 'noreq', 'Такого запроса нет.');
      if (m.accept) { addFriends(key, k); sendUser(k, { t: 'note', kind: 'friend_ok', nick: me.nick }); }
      else { me.inReq = me.inReq.filter(x => x !== k); o.outReq = o.outReq.filter(x => x !== key); touchDB(); }
      pushMe(key); pushMe(k); return;
    }
    case 'friend_cancel': {
      const k = nickKey(String(m.nick || '').trim()), o = U(k); if (!o) return;
      me.outReq = me.outReq.filter(x => x !== k); o.inReq = o.inReq.filter(x => x !== key); touchDB(); pushMe(key); pushMe(k); return;
    }
    case 'friend_remove': {
      const k = nickKey(String(m.nick || '').trim()), o = U(k); if (!o) return;
      me.friends = me.friends.filter(x => x !== k); o.friends = o.friends.filter(x => x !== key); touchDB(); pushMe(key); pushMe(k); return;
    }
    case 'set_auto': me.auto = !!m.on; touchDB(); return pushMe(key);
    case 'me': return pushMe(key);

    case 'rooms': c.watching = true; return send(c, { t: 'rooms', rooms: listRooms() });
    case 'unwatch': c.watching = false; return;
    case 'quick': {
      const r = quickRoom(); if (!r) return err(c, 'noroom', 'Нет доступных комнат.');
      if (!joinRoom(c, r)) return err(c, 'full', 'Комната заполнена.'); return;
    }
    case 'join': {
      const r = rooms.get(m.room);
      if (!r || r.kind === 'friends') return err(c, 'noroom', 'Комната не найдена.');
      if (c.room === r.id) return;
      if (r.members.size >= r.cap) return err(c, 'full', 'Комната заполнена (' + r.cap + '/' + r.cap + ').');
      if (r.open) { if (!joinRoom(c, r)) err(c, 'full', 'Комната заполнена.'); return; }
      return requestJoin(c, r);
    }
    case 'create_room': {
      if (c.room) leaveRoom(c, true);
      const nm = String(m.name || '').replace(/[<>]/g, '').trim().slice(0, 24) || ('Комната ' + me.nick);
      const own = [...rooms.values()].filter(r => r.owner === key && r.kind === 'custom').length;
      if (own >= 2) return err(c, 'limit', 'Можно иметь не больше двух своих комнат.');
      const r = newRoom('custom', nm, key, !!m.open); joinRoom(c, r); return;
    }
    case 'create_private': { // комната друзей: 2 игрока, вход только с одобрения создателя
      if (c.room) leaveRoom(c, true);
      const r = newRoom('friends', 'Комната ' + me.nick, key, false); joinRoom(c, r); return;
    }
    case 'join_friend': { // войти в приватную комнату друга (нужно одобрение создателя)
      const k = nickKey(String(m.nick || '').trim());
      if (!me.friends.includes(k)) return err(c, 'notfriend', 'Это не ваш друг.');
      const fc = online.get(k), r = fc && roomOf(fc);
      if (!r) return err(c, 'noroom', 'Друг сейчас не в комнате.');
      if (c.room === r.id) return;
      if (r.kind !== 'friends' && r.open) { if (!joinRoom(c, r)) err(c, 'full', 'Комната заполнена.'); return; }
      return requestJoin(c, r);
    }
    case 'join_resp': {
      const r = roomOf(c); if (!r || r.owner !== key) return err(c, 'perm', 'Только создатель комнаты может решать.');
      const rq = r.pending.get(m.req); if (!rq) return;
      r.pending.delete(m.req);
      if (!m.accept) return send(rq.conn, { t: 'join_denied', room: r.id });
      if (rq.conn.user && !joinRoom(rq.conn, r)) send(rq.conn, { t: 'err', code: 'full', msg: 'Комната заполнена.' });
      return;
    }
    case 'join_cancel': { for (const r of rooms.values()) for (const [id, rq] of r.pending) if (rq.conn === c) r.pending.delete(id); return; }
    case 'leave': leaveRoom(c); return;

    case 'invite': {
      const r = roomOf(c); if (!r) return err(c, 'noroom', 'Сначала войдите в комнату.');
      const k = nickKey(String(m.nick || '').trim()), o = U(k);
      if (!o) return err(c, 'nouser', 'Игрок не найден.');
      if (!me.friends.includes(k)) return err(c, 'notfriend', 'Приглашать можно только друзей.');
      const tc = online.get(k);
      if (!tc) return err(c, 'offline', 'Друг сейчас не в сети.');
      if (r.members.size >= r.cap) return err(c, 'full', 'В комнате нет мест.');
      const id = ++invSeq; invites.set(id, { id, from: key, to: k, room: r.id, exp: Date.now() + 5 * 60000 });
      send(tc, { t: 'invite', id, from: me.nick, room: { id: r.id, name: r.name, kind: r.kind, count: r.members.size, max: r.cap } });
      return send(c, { t: 'note', kind: 'invite_sent', nick: o.nick });
    }
    case 'invite_resp': {
      const inv = invites.get(m.id); if (!inv || inv.to !== key) return err(c, 'noinv', 'Приглашение устарело.');
      invites.delete(inv.id);
      const from = online.get(inv.from);
      if (!m.accept) { if (from) send(from, { t: 'note', kind: 'invite_no', nick: me.nick }); return; }
      const r = rooms.get(inv.room);
      if (!r) return err(c, 'noroom', 'Комната уже закрыта.');
      // приглашение отправил член комнаты — одобрение создателя не нужно
      const inviterIn = from && from.room === r.id;
      if (!inviterIn) return err(c, 'noroom', 'Пригласивший уже вышел из комнаты.');
      if (!joinRoom(c, r)) return err(c, 'full', 'Комната заполнена.');
      if (from) send(from, { t: 'note', kind: 'invite_yes', nick: me.nick });
      return;
    }

    /* ---- игра ---- */
    case 'st': {
      const r = roomOf(c); if (!r || !c.g) return; const g = c.g;
      if (!g.alive) return;
      g.x = num(m.x, -WORLD_LIM, WORLD_LIM, g.x); g.y = num(m.y, -50, 600, g.y); g.z = num(m.z, -WORLD_LIM, WORLD_LIM, g.z);
      g.yaw = num(m.yaw, -7, 7, 0); g.an = num(m.an, 0, 31, 0) | 0; g.veh = typeof m.veh === 'string' ? m.veh.slice(0, 12) : ''; g.got = true; return;
    }
    case 'hit': { // выстрел/удар по игроку
      const r = roomOf(c); if (!r || !c.g || !c.g.alive) return;
      const W = WEAPONS[m.w]; if (!W) return;
      const v = r.members.get(m.target); if (!v || v === c || !v.g || !v.g.alive) return;
      const now = Date.now(), g = c.g;
      if (W.ammo && !(g.wpn[m.w] > 0)) return;
      const key2 = m.w + ':' + (W.pellets || W.area ? 'x' : v.id);
      const last = g.last[key2] || 0;
      if (now - last < W.cd * 1000 * 0.8) return; // перезарядка (с запасом на лаги)
      if (dist(g, v.g) > W.range * 1.35 + 6) return; // дальность по позициям, известным серверу
      g.last[key2] = now;
      if (W.ammo && !W.area) { /* заряд списывается за бросок в 'use' */ }
      damage(r, v, W.dmg, c, m.w);
      if (W.stick) { v.g.stuck = now + W.stick * 1000; send(v, { t: 'stuck', ms: W.stick * 1000 }); }
      if (W.splash) for (const o of alivePlayers(r)) if (o !== v && dist(o.g, v.g) < W.splash) damage(r, o, W.dmg * 0.6, c, m.w);
      return;
    }
    case 'use': { // оружие с зарядами (тапок, пузырь, кряк): списывает заряд, кряк бьёт по области сам
      const r = roomOf(c); if (!r || !c.g || !c.g.alive) return;
      const W = WEAPONS[m.w]; if (!W || !W.ammo) return;
      const g = c.g, now = Date.now();
      if (!(g.wpn[m.w] > 0)) return;
      if (now - (g.last['use:' + m.w] || 0) < W.cd * 1000 * 0.8) return;
      g.last['use:' + m.w] = now; g.wpn[m.w]--;
      send(c, { t: 'wpn', wpn: g.wpn });
      bcast(r, { t: 'fx', id: c.id, w: m.w, yaw: num(m.yaw, -7, 7, 0) }, c);
      if (W.area) for (const o of alivePlayers(r)) if (o !== c && dist(o.g, g) < W.area) { damage(r, o, W.dmg, c, m.w); send(o, { t: 'push', dx: o.g.x - g.x, dz: o.g.z - g.z, f: 14 }); }
      return;
    }
    case 'self': { // урон, полученный от игровых событий на клиенте (падение, взрыв, вода, ловушка): с лимитом
      const r = roomOf(c); if (!r || !c.g || !c.g.alive) return;
      const now = Date.now(), g = c.g;
      g.budget = Math.min(40, (g.budget === undefined ? 40 : g.budget) + (now - (g.budgetAt || now)) / 1000 * 25); g.budgetAt = now;
      const n = Math.min(num(m.n, 0, 40, 0), g.budget); if (n <= 0) return;
      g.budget -= n; damage(r, c, n, null, String(m.src || 'game').slice(0, 10)); return;
    }
    case 'pick': {
      const r = roomOf(c); if (!r || !c.g || !c.g.alive) return;
      const p = r.pickups.get(m.id); if (!p) return;
      r.pickups.delete(p.id); bcast(r, { t: 'pickgone', id: p.id }); applyPickup(r, c, p); return;
    }
    case 'ping': return send(c, { t: 'pong', ts: m.ts });
  }
}

/* ------------------------------ HTTP + WS ------------------------------ */
const server = http.createServer((req, res) => {
  const cors = { 'Access-Control-Allow-Origin': CFG.origins.includes('*') ? '*' : (CFG.origins.includes(req.headers.origin) ? req.headers.origin : CFG.origins[0]), 'Content-Type': 'application/json; charset=utf-8' };
  if (req.url === '/health') { res.writeHead(200, cors); return res.end(JSON.stringify({ ok: true, ver: CFG.version, online: online.size, rooms: rooms.size })); }
  if (req.url === '/rooms') { res.writeHead(200, cors); return res.end(JSON.stringify(listRooms())); }
  res.writeHead(404, cors); res.end('{"error":"not found"}');
});
const wss = new WebSocketServer({ server, maxPayload: 8 * 1024, verifyClient: (info, cb) => {
  if (CFG.origins.includes('*')) return cb(true);
  cb(CFG.origins.includes(info.origin), 403, 'Origin not allowed');
} });
wss.on('connection', (ws, req) => {
  const ip = (CFG.trustProxy && req.headers['x-forwarded-for']) ? String(req.headers['x-forwarded-for']).split(',')[0].trim() : req.socket.remoteAddress;
  const c = { id: 'p' + (++connSeq).toString(36), ws, ip, user: null, nick: null, room: null, g: null, bucket: 60, bAt: Date.now(), watching: false, alive: true };
  conns.add(c);
  ws.on('pong', () => { c.alive = true; });
  ws.on('message', async raw => {
    const now = Date.now(); c.bucket = Math.min(80, c.bucket + (now - c.bAt) / 1000 * 40); c.bAt = now;
    if (--c.bucket < 0) { c.flood = (c.flood || 0) + 1; if (c.flood > 200) ws.close(); return; }
    let m; try { m = JSON.parse(raw.toString()); } catch (e) { return; }
    if (!m || typeof m.t !== 'string') return;
    try {
      if (m.t === 'register' || m.t === 'login' || m.t === 'resume') await onAuth(c, m);
      else handle(c, m);
    } catch (e) { console.error('handler', m.t, e); }
  });
  ws.on('close', () => dropConn(c));
  ws.on('error', () => dropConn(c));
  send(c, { t: 'hello', ver: CFG.version, max: CFG.roomMax });
});
setInterval(() => { for (const c of conns) { if (!c.alive) { try { c.ws.terminate(); } catch (e) { } continue; } c.alive = false; try { c.ws.ping(); } catch (e) { } } }, 30000).unref();

function start(cb) {
  loadDB(); ensureOfficial();
  server.listen(CFG.port, () => { console.log('МГИАГ-сервер ' + CFG.version + ' слушает порт ' + CFG.port + ' (данные: ' + CFG.dataDir + ')'); cb && cb(); });
}
function stop(cb) {
  saveDBNow();
  for (const c of conns) { try { c.ws.terminate(); } catch (e) { } }
  wss.close(() => server.close(() => cb && cb()));
}
module.exports.start = start; module.exports.stop = stop; module.exports.WEAPONS = WEAPONS; module.exports._internals = { rooms, db: () => db, saveDBNow, startEvent, BIG_EVENTS, SMALL_EVENTS };
process.on('SIGTERM', () => { saveDBNow(); process.exit(0); });
process.on('SIGINT', () => { saveDBNow(); process.exit(0); });
if (require.main === module) start();
