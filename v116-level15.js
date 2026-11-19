/* =====================================================================
   СЮЖЕТКА №15 — «ЧЭАЙ~»  (после «Дыры в центре города»)
   ПОКА ДОСТУПНА ТОЛЬКО ЧЕРЕЗ DEV-ПАНЕЛЬ: в «Списке дел» и в мире её нет.
   Дыра переносит между вселенными всё, что в неё упало; чтобы прыгнуть дальше, нужен Сияющий батон.
   1) Хлебный мир: «Великая выпечка» у Хлебного короля, лавина багетов (заезд на скейте), Антон остаётся дома.
   2) Мир Светофора: город-супермаркет, промоутер-Максим, три пропуска, погоня на тележке от Живого мяса,
      касса №13 — откуда дыра и куда ушли 5 000 000 баллов.
   3) Мир Хаоса: события меняются каждые 10 секунд, детали для портальной пушки, гонка к трамплину;
      учёный остаётся там.
   4) Почти дом: тот же город, но все говорят «чэай~». Голубь, светофор и телефон, речь Максима, кухня.
   Прогресс — в обычном сохранении (S.p13.w15). В основной сюжет (MAIN) не добавляется.
   ===================================================================== */
(function () {
  'use strict';
  var T = window.MG_STORY, D = window.MG_DIST, PI = Math.PI;
  if (!T || !D) { console.error('[LEVEL15] нет каркаса'); return; }
  var BR = 'p15_bread', SV = 'p15_svet', CH = 'p15_chaos';
  var K = {}, built = false, L = null, N = {}, R = null;
  var W = { mode: 'follow', busy: false, ev: 'low', evT: 10, evI: 0, grace: 0, boss: null, guard: null, envT: 0, hidden: [], staffT: 0 };
  function Q() { S.p13 = S.p13 || {}; var q = S.p13.w15 = S.p13.w15 || { part: 0 }; if (!q.f) q.f = {}; return q; }
  function F() { return Q().f; }
  function coop() { return typeof COOP !== 'undefined' && COOP.on; }
  function isHero(h) { return coop() || player === h; }
  function need(h) { toast(h === gus ? '🪿 Тут справится только Гусь. Переключись на него (🔄).' : '👩 Тут справится только Марья. Переключись на неё (🔄).', 2800); sfx('bonk'); }
  function myArea() { return area === BR || area === SV || area === CH; }
  function clampN(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function anim(ms, fn) { return new Promise(function (res) { var t0 = performance.now(); (function f() { var u = Math.min(1, (performance.now() - t0) / ms); try { fn(u); } catch (e) { console.error('[LEVEL15 anim]', e); u = 1; } if (u < 1) requestAnimationFrame(f); else res(); })(); }); }
  function mixHex(a, b, k) { var ar = a >> 16 & 255, ag = a >> 8 & 255, ab = a & 255, br = b >> 16 & 255, bg = b >> 8 & 255, bb = b & 255; return (Math.round(ar + (br - ar) * k) << 16) | (Math.round(ag + (bg - ag) * k) << 8) | Math.round(ab + (bb - ab) * k); }
  function obj(t, a, x, z) { T.setObj(t, a, x, z); }
  function save() { T.save(); }

  /* ---------- модели ---------- */
  function antonVar(o) {
    o = o || {}; var g = makeAnton(), cache = {}, op = o.op === undefined ? 1 : o.op;
    g.traverse(function (m) {
      if (!m.isMesh || !m.material || (typeof shadowMat !== 'undefined' && m.material === shadowMat)) return;
      var hex = m.material.color && m.material.color.getHex ? m.material.color.getHex() : 0x8a5a32;
      var c = (hex === 0x111111) ? hex : (o.tint === undefined ? hex : mixHex(hex, o.tint, o.k === undefined ? .6 : o.k));
      if (!cache[c]) cache[c] = new THREE.MeshLambertMaterial({ color: c, transparent: op < 1, opacity: op }); m.material = cache[c];
    });
    g.scale.setScalar(o.s || 1.25); g.userData.s = o.s || 1.25; return g;
  }
  function place(k, g, lx, lz, yaw, y) { g.position.set(k.ox + lx, y || 0, k.oz + lz); g.rotation.y = yaw || 0; k.g.add(g); return g; }
  function label(k, txt, lx, y, lz, col) { var s = textSprite(txt, .34, col || '#ffe8c0'); s.position.set(k.ox + lx, y, k.oz + lz); k.g.add(s); return s; }
  function sciLook() { return { top: 0x0c0c10, coatLong: true, pants: 0x1a1a1a, hairStyle: 'afro', hair: 0xd8d8d8, skin: 0xefc4a4 }; }
  function dressSci(a) { try { M_(a.P.head, G.box, 0x111111, [.34, .12, .02], [0, .23, .16], null, false); for (var s = -1; s <= 1; s += 2) M_(a.P.head, G.sph, 0x9be82e, [.12, .12, .04], [s * .08, .23, .17], null, false); } catch (e) { } }
  function npc(k, id, name, look, lx, lz, yaw) { var a = k.npc(id, name, look, lx, lz, yaw || 0); return a; }
  /* светящийся батон «в руках» */
  function carry(on) { if (!N.carry) { N.carry = new THREE.Mesh(G.box, new THREE.MeshBasicMaterial({ color: 0xffe28a })); N.carry.scale.set(.7, .22, .22); N.carry.visible = false; scene.add(N.carry); } W.carry = !!on; if (!on) N.carry.visible = false; }

  /* ---------- напарник в областях сюжетки ---------- */
  function compTick(dt) {
    var c = comp; if (coop() || R) return; c.hidden = false; c.g.visible = true;
    if (c.target) { updActor(c, dt); return; }
    var moved = false;
    if (W.mode === 'follow' && !blocked()) {
      var bx = player.pos.x - Math.sin(player.yaw) * 1.7 + Math.cos(player.yaw) * .8, bz = player.pos.z - Math.cos(player.yaw) * 1.7 - Math.sin(player.yaw) * .8, d = Math.hypot(bx - c.pos.x, bz - c.pos.z);
      if (d > 18) { c.pos.x = bx; c.pos.z = bz; }
      else if (d > 1.15) { var s = Math.min(d, dt * (d > 4 ? 6.6 : 4.4)); c.pos.x += (bx - c.pos.x) / d * s; c.pos.z += (bz - c.pos.z) / d * s; collide(c.pos, .35); c.yaw = angLerp(c.yaw, Math.atan2(bx - c.pos.x, bz - c.pos.z), Math.min(1, dt * 8)); moved = true; }
    }
    c.moving = moved; c.pos.y = H(c.pos.x, c.pos.z); c.g.position.copy(c.pos); c.g.rotation.y = c.yaw; poseActor(c, dt);
  }
  var chip = null;
  function chipUI() {
    if (chip) return; chip = document.createElement('button'); chip.id = 'p15mode';
    chip.style.cssText = 'position:fixed;left:50%;top:calc(env(safe-area-inset-top,0px) + 104px);transform:translateX(-50%);z-index:6;display:none;padding:7px 14px;border-radius:14px;border:2px solid #fff;background:rgba(20,26,38,.86);color:#fff;font:800 13px Rubik,Arial,sans-serif;box-shadow:0 3px 0 rgba(0,0,0,.35)';
    chip.onclick = function (e) { e.preventDefault(); W.mode = W.mode === 'follow' ? 'wait' : 'follow'; sfx('click'); chipPaint(); }; document.body.appendChild(chip);
  }
  function chipPaint() { if (!chip) return; var on = !!L && myArea() && !blocked() && !coop() && !R; chip.style.display = on ? 'block' : 'none'; if (on) chip.textContent = W.mode === 'follow' ? '🤝 Вместе · нажми, чтобы напарник ждал' : '✋ Напарник ждёт · нажми, чтобы позвать'; }

  /* ====================== ЗАЕЗД (скейт, тележка, машина) ======================
     Едет сам вперёд (к −z), игрок рулит влево-вправо (джойстик / A-D), бег — ускорение.
     Препятствия замедляют, ⚡ ускоряет. Сзади догоняет «преследователь»: догнал — возврат к чекпоинту без штрафа. */
  function ride(cfg) {
    return new Promise(function (res) {
      R = Object.assign({ x: 0, t: 0, slow: 0, fast: 0, hits: 0, fails: 0, inv: false, spMul: 1, steerMul: 1, res: res, paused: false }, cfg);
      R.z = R.z0; R.cp = R.z0; R.cz = R.z0 + R.gap; R.mid = (R.z0 + R.z1) / 2; R.cpDone = false;
      R.hz.forEach(function (h) { h.hit = false; if (h.s) h.s.visible = true; });
      try { dismount(player); } catch (e) { }
      if (R.mesh) R.mesh.visible = true; if (R.chaser) R.chaser.visible = true;
      cam.force = { yaw: 0, pitch: R.pitch || .3, dist: R.dist || 8.5 };
      toast(R.intro || '⬅️ ➡️ Рули. Бег — ускорение. Не дай себя догнать!', 3800);
    });
  }
  function rideTick(dt) {
    if (!R || R.paused || blocked()) return;
    var k = R.K; R.t += dt; if (R.onTick) R.onTick(dt);
    var st = (joy.x || 0) + ((keys.KeyD || keys.ArrowRight) ? 1 : 0) - ((keys.KeyA || keys.ArrowLeft) ? 1 : 0); st = clampN(st, -1, 1) * (R.inv ? -1 : 1);
    var run = (typeof runHeld !== 'undefined' && runHeld) || keys.ShiftLeft || keys.ShiftRight;
    R.slow -= dt; R.fast -= dt;
    var sp = R.speed * (run ? 1.28 : 1) * (R.slow > 0 ? .45 : 1) * (R.fast > 0 ? 1.45 : 1) * R.spMul;
    R.x = clampN(R.x + st * 7.5 * R.steerMul * dt, -R.w, R.w); R.z -= sp * dt;
    for (var i = 0; i < R.hz.length; i++) {
      var h = R.hz[i]; if (h.hit) continue; if (h.mx) { h.x = h.bx + Math.sin(R.t * h.mf + h.ph) * h.mx; if (h.s) h.s.position.x = k.ox + h.x; }
      if (Math.abs(h.z - R.z) < h.r + .55 && Math.abs(h.x - R.x) < h.r + .55) {
        h.hit = true; if (h.boost) { R.fast = 1.6; sfx('coin'); if (h.s) h.s.visible = false; toast('⚡ Ускорение!', 900); }
        else { R.slow = .9; R.hits++; sfx('bonk'); toast(R.hitTxt || '💥 Бдыщ!', 800); }
      }
    }
    R.cz -= R.cs * dt * (R.fails >= 2 ? .88 : 1);
    if (!R.cpDone && R.z < R.mid) { R.cpDone = true; R.cp = R.mid; sfx('ding'); toast('🏁 Половина пути! Здесь чекпоинт.', 1600); }
    if (R.chaser) R.chaser.position.set(k.ox, 0, k.oz + R.cz);
    var gap = R.cz - R.z;
    if (gap < 1.1) { rideFail(); return; }
    var bob = Math.sin(R.t * 14) * .05;
    player.ovr = { x: k.ox + R.x, y: (R.y || .15) + bob, z: k.oz + R.z }; player.yaw = PI - st * .3; player.moving = false;
    if (R.mesh) { R.mesh.position.set(k.ox + R.x, (R.y || .15) - .15 + bob, k.oz + R.z); R.mesh.rotation.y = PI - st * .3; }
    if (!coop()) { comp.hidden = false; comp.g.visible = true; comp.pos.set(k.ox + R.x + (R.cx || .85), 0, k.oz + R.z + (R.cz2 || .7)); comp.g.position.set(comp.pos.x, (R.y || .15) + bob, comp.pos.z); comp.yaw = player.yaw; comp.g.rotation.y = comp.yaw; comp.moving = false; poseActor(comp, dt); }
    T.lvl && (T.lvl.obj = { t: (R.title || '🏁 Заезд') + ' · до финиша ' + Math.max(0, Math.round(R.z - R.z1)) + ' м · ' + (R.chaseName || 'догоняют') + ': ' + Math.max(0, Math.round(gap)) + ' м', p: null });
    if (R.z <= R.z1) rideWin();
  }
  function rideFail() {
    var r = R; r.paused = true; r.fails++;
    cutscene(async function () {
      sfx('bonk'); await fade(1, 350, r.failTxt || '💥 Догнали!'); await wait(450);
      r.z = r.cp; r.cz = r.cp + r.gap; r.x = 0; r.slow = 0; r.fast = 0; r.hz.forEach(function (h) { if (h.z < r.cp) { h.hit = false; if (h.s) h.s.visible = true; } });
      await fade(0, 350); toast(r.fails >= 2 ? '🙂 Ещё раз с чекпоинта. Преследователь чуть устал.' : '↩️ Ещё раз с чекпоинта.', 2000);
    }).then(function () { r.paused = false; });
  }
  function rideWin() {
    var r = R; R = null; player.ovr = null; cam.force = null; if (r.mesh) r.mesh.visible = false; if (r.chaser) r.chaser.visible = false;
    placeA(player, r.K.ox + r.x, r.K.oz + r.z1 - .5, PI); placeA(comp, r.K.ox + r.x + 1.2, r.K.oz + r.z1 + .2, PI);
    r.res({ hits: r.hits, fails: r.fails });
  }
  function track(k, cfg) {           // препятствия по дорожке; детерминированно
    var Rn = D.rngf(cfg.seed), list = [], z = cfg.z0 - 14;
    while (z > cfg.z1 + 8) {
      var n = 1 + (Rn() < cfg.dens ? 1 : 0);
      for (var i = 0; i < n; i++) {
        var x = (Rn() * 2 - 1) * (cfg.w - .8), boost = Rn() < (cfg.boostP || .12), e = boost ? '⚡' : cfg.icons[Math.floor(Rn() * cfg.icons.length)], r = boost ? .7 : (cfg.r || .9);
        var s = emojiSprite(e, boost ? 1.1 : (cfg.size || 1.7)); s.position.set(k.ox + (cfg.ox || 0) + x, boost ? 1 : (cfg.size || 1.7) * .5, k.oz + z); k.g.add(s);
        var h = { x: x, bx: x, z: z, r: r, s: s, boost: boost, hit: false };
        if (!boost && cfg.move && Rn() < cfg.move) { h.mx = 2 + Rn() * 2; h.mf = 1 + Rn() * 1.5; h.ph = Rn() * 6; }
        list.push(h);
      }
      z -= cfg.step * (.75 + Rn() * .5);
    }
    return list;
  }
  function chaserRow(k, e, w, n) { var g = new THREE.Group(); for (var i = 0; i < n; i++) { var s = emojiSprite(e, 2.6 + (i % 2) * .8); s.position.set(-w + (2 * w) * i / (n - 1), 1.4 + (i % 3) * .5, 0); g.add(s); } g.visible = false; k.g.add(g); return g; }

  /* ====================== ПОСТРОЙКА МИРОВ ====================== */
  var CRUST = [0xd9a35a, 0xc98a42, 0xe8c07a, 0xb8763a], CRUMB = 0xf0d7a0;
  function buildBread(k) {
    var R_ = D.rngf(1501), i;
    k.plane(220, 420, 0xe2b866, 0, -90, 0); k.perimeter(310, 6, 0xc98a42);
    k.plane(16, 220, 0x6a3a1a, 60, 20, .02); label(k, 'Река «Квас»', 60, 1.6, 0, '#ffd9a8');
    // кусок нашего города: хлебозавод и парковка
    k.b(30, 10, 16, 0xefe3c8, 0, 0, 72); k.bp(30.4, .7, 16.4, 0xd9a35a, 0, 10, 72); k.sign('ХЛЕБОЗАВОД «БАТОН»', 12, 1.4, 0, 7, 63.9, PI, '#d9a35a', '#ffffff');
    k.plane(24, 12, 0x3b3f47, 0, 56, .03); try { car(k.g, k.ox - 6, k.oz + 56, PI / 2, 0xf4f4f4); car(k.g, k.ox + 5, k.oz + 57, PI / 2, 0xd9a35a); } catch (e) { }
    // город из хлеба вокруг площади
    var spots = [[-30, 30], [-30, 8], [-34, -18], [30, 30], [32, 4], [34, -20], [-12, 34], [14, 36], [-46, 40], [44, 40], [-50, 0], [48, -2]];
    spots.forEach(function (p, j) { var w = 9 + R_() * 5, d = 8 + R_() * 4, h = 5 + R_() * 6, c = CRUST[j % 4]; k.b(w, h, d, c, p[0], 0, p[1]); k.m(G.hemi, CRUMB, [w * .55, 2.4, d * .55], [p[0], h, p[1]]); k.emoji(['🍞', '🥐', '🥨', '🥯'][j % 4], 1.6, p[0], h + 3, p[1]); });
    for (i = 0; i < 18; i++) { var tx = (R_() - .5) * 200, tz = -40 + (R_() - .5) * 150; if (Math.abs(tx) < 14 || Math.abs(tx - 60) < 10) continue; k.m(G.cyl, 0xd9a35a, [.8, 7, .8], [tx, 3.5, tz], [.1, 0, .08]); k.emoji('🥖', 2.4, tx, 7.6, tz); k.colC(tx, tz, .5, 6); }
    for (i = 0; i < 12; i++) { var cl = k.emoji('🥯', 4 + R_() * 3, (R_() - .5) * 200, 22 + R_() * 10, -60 + (R_() - .5) * 220); (N.clouds = N.clouds || []).push({ s: cl, x: cl.position.x }); }
    // король на троне
    k.b(6, 1.4, 4, 0xb8763a, 0, 0, -22); k.b(6, 5, 1, 0xc98a42, 0, 0, -24); N.king = place(k, antonVar({ tint: 0xffd23f, k: .55, s: 3.4 }), 0, -21.5, 0, 1.4); k.emoji('👑', 1.6, 0, 4.4, -21.4); label(k, 'Хлебный король', 0, 5.6, -21.4, '#ffe28a');
    // конкурс «Великая выпечка»
    k.b(6, 1, 2.6, 0xe8d6b0, -16, 0, -4); N.dough = k.emoji('🫓', 1.2, -16, 1.5, -4); k.b(3.2, 2.6, 3, 0x8a4a2a, -16, 0, -10); k.emoji('🔥', 1, -16, 2.2, -8.4); k.sign('ВЕЛИКАЯ ВЫПЕЧКА', 6, .8, -16, 4.2, -2.6, 0, '#b8763a', '#ffffff', { fs: .5 });
    N.ducks = []; for (i = 0; i < 8; i++) { var dk = makeDuck(); dk.visible = false; k.g.add(dk); N.ducks.push(dk); }
    for (i = 0; i < 3; i++) { var d2 = makeDuck(); place(k, d2, 22 + i * 1.6, 14 + (i % 2), PI / 2); }
    // хлебный Максим — сухарь
    k.b(1.3, .4, .9, 0xc9984a, 17, 0, 12, { cam: false }); k.emoji('😐', .5, 17, .75, 12); label(k, 'Максим (сухарь)', 17, 1.6, 12, '#ffd0a0');
    N.nar = npc(k, 'w15_nar', 'Нармина (хлебная)', { top: 0xd9a35a, pants: 0x8a5a2a, hair: 0xb07a3c, hairStyle: 'pony', skin: 0xf0d7a0, scale: .94 }, 10, 6, PI);
    N.sciB = npc(k, 'w15_sciB', 'Учёный', sciLook(), 6, 62, PI); dressSci(N.sciB);
    N.ant = place(k, makeAnton(), -3, 60, PI);
    N.crowd = []; for (i = 0; i < 12; i++) { var cx = -40 + R_() * 80, cz = -14 + R_() * 50; if (Math.hypot(cx + 16, cz + 4) < 6 || Math.abs(cx) < 4 && cz < -16) continue; var a = place(k, antonVar({ tint: CRUST[i % 4], k: .35, s: 1 + R_() * .5 }), cx, cz, R_() * 6); N.crowd.push({ g: a, x: cx, z: cz, ph: R_() * 6 }); }
    // холм и дорожка лавины: от z=-40 до z=-260, ширина ±7
    for (i = 0; i < 12; i++) { var zz = -46 - i * 18; k.b(3, 3 + (i % 3), 16, CRUST[i % 4], -9.5, 0, zz); k.b(3, 3 + ((i + 1) % 3), 16, CRUST[(i + 2) % 4], 9.5, 0, zz); }
    k.plane(16, 230, 0xd9b070, 0, -152, .02); k.sign('ХЛЕБНАЯ ГОРА · НЕ ШУМЕТЬ', 6, .8, 0, 4, -40, 0, '#8a4a2a', '#ffffff', { fs: .45 });
    N.brHole = T.hole(k, 0, -276, 3.2, .05);
    N.track = track(k, { seed: 15, z0: -42, z1: -262, w: 7, step: 9, dens: .35, icons: ['🍞', '🥐', '🥨', '🧈', '🥯'], move: .25 });
    N.skate = new THREE.Group(); M_(N.skate, G.box, 0xd84a2a, [.75, .08, 2.4], [0, 0, 0], null, false); for (var s = -1; s <= 1; s += 2) for (var t = -1; t <= 1; t += 2) M_(N.skate, G.cyl, 0x222222, [.18, .14, .18], [s * .3, -.08, t * .85], [0, 0, PI / 2], false); N.skate.visible = false; k.g.add(N.skate);
    N.aval = chaserRow(k, '🥖', 8, 8);
    k.anims.push(function (t) { (N.clouds || []).forEach(function (c, j) { c.s.position.x = c.x + Math.sin(t * .05 + j) * 10; }); N.crowd.forEach(function (c) { c.g.position.y = Math.abs(Math.sin(t * 3 + c.ph)) * .25; }); N.king.scale.y = 3.4 * (1 + Math.sin(t * 1.3) * .03); });
  }
  function buildSvet(k) {
    var i, j;
    k.plane(240, 340, 0xd8dde2, 40, -110, 0); k.perimeter(270, 6, 0xc8ced6);
    k.b(48, 6, .6, 0xc8ced6, -26, 0, -2); k.b(48, 6, .6, 0xc8ced6, 26, 0, -2); k.b(.6, 6, 58, 0xc8ced6, -50, 0, 27); k.b(.6, 6, 58, 0xc8ced6, 50, 0, 27); k.b(100, 6, .6, 0xc8ced6, 0, 0, 56);
    k.bp(240, .3, 340, 0xeef2f6, 40, 6.2, -110);
    // вход и холл
    k.sign('СВЕТОФОР · НАВСЕГДА', 10, 1.4, 0, 4.6, 52, PI, '#e8473b', '#ffffff', { fs: .7 });
    for (i = 0; i < 3; i++) k.m(G.sph, K_.glow([0xe8473b, 0xf2c230, 0x2fae5b][i]), [1, 1, 1], [-6 + i * 6, 5.5, 51]);
    k.b(5, 1.1, 1.6, 0x3a4048, -12, 0, 38); label(k, 'Справочная', -12, 2.6, 38);
    N.raisa = npc(k, 'w15_raisa', 'Раиса Павловна', { top: 0xe8473b, pants: 0x2a2a2a, hair: 0x9a5a3a, hairStyle: 'bun', skin: 0xefc4a4, apron: 0xf2c230, scale: .95 }, -12, 36.6, PI);
    N.maxP = npc(k, 'w15_maxP', 'Промоутер', { top: 0x8a4a2a, pants: 0x8a4a2a, hair: 0xc9a165, hairStyle: 'short', skin: 0xf2c9a8, shoes: 0xffffff }, 9, 36, PI); N.maxPatty = k.emoji('🍔', 1.3, 9, 2.4, 36); label(k, 'Промоутер-котлета', 9, 3.4, 36);
    // торговый зал: ряды полок x=-24..24, z=0..28
    for (i = 0; i < 5; i++) { var x = -24 + i * 12; k.b(2.2, 3.2, 24, 0x6a7078, x, 0, 14); for (j = 0; j < 6; j++) k.emoji(['🥫', '🧃', '🍪', '🧴', '🥩', '🧻'][(i + j) % 6], .7, x + (j % 2 ? 1.2 : -1.2), 1.1 + (j % 3) * .9, 4 + j * 4); }
    k.sign('ПРОПУСК НА КАССУ №13 — ТРИ КУПОНА', 8, .7, 0, 4.6, 30, PI, '#2a3a4a', '#ffffff', { fs: .42 });
    N.cpHigh = k.emoji('🎫', .8, -24, 3.6, 22); N.cpLow = k.emoji('🎫', .6, 12, .3, 8);
    N.staff = [[-18, 4, -18, 26], [18, 26, 18, 4]].map(function (p, n) { var a = npc(k, 'w15_st' + n, 'Сотрудник', { top: 0xe8473b, pants: 0x2a2a2a, hairStyle: 'short', hair: 0x2a2a2a, skin: 0xdba784, vest: 0xf2c230 }, p[0], p[1], 0); a.tspeed = 2; return { a: a, A: [p[0], p[1]], B: [p[2], p[3]], leg: 0 }; });
    k.b(4, 3.4, .5, 0x8a1f1f, 0, 0, -2, { cam: false }); N.wDoor = k.col(-2, 2, -2.3, -1.7, 5); k.sign('СКЛАД', 2.6, .5, 0, 3.9, -1.6, PI, '#8a1f1f', '#ffffff', { fs: .4 });
    // склад-конвейер (дорожка): x=100, z=0..-210
    k.plane(18, 230, 0x7a8088, 100, -100, .02); for (i = 0; i < 12; i++) { k.b(2, 4, 18, 0x4a5058, 90, 0, -10 - i * 18); k.b(2, 4, 18, 0x4a5058, 110, 0, -10 - i * 18); }
    k.sign('КОНВЕЙЕР → КАССА №13', 6, .7, 100, 4, 4, 0, '#2a3a4a', '#ffffff', { fs: .42 });
    N.trackS = track(k, { seed: 152, ox: 100, z0: 0, z1: -205, w: 7, step: 8, dens: .45, icons: ['📦', '🛒', '⚠️', '🧃', '📦'], move: .3, boostP: .1 });
    N.cart = new THREE.Group(); M_(N.cart, G.box, 0x9aa0a8, [1.1, .8, 1.6], [0, .55, 0], null, false); M_(N.cart, G.box, 0x6a7078, [.08, .9, .08], [0, 1, -.85], null, false); for (var s = -1; s <= 1; s += 2) for (var t = -1; t <= 1; t += 2) M_(N.cart, G.cyl, 0x222222, [.2, .12, .2], [s * .45, .1, t * .65], [0, 0, PI / 2], false); N.cart.visible = false; k.g.add(N.cart);
    N.meatRow = chaserRow(k, '🥩', 8, 7);
    // зал кассы №13
    k.b(3.2, 1.3, 1.6, 0x3a3d44, 100, 0, -224); N.kLamp = k.m(G.box, new THREE.MeshBasicMaterial({ color: 0xff2a2a }), [.5, .5, .3], [100, 2, -224]); k.sign('КАССА №13', 3, .6, 100, 3, -224.9, 0, '#14181c', '#ff6a6a', { fs: .5 });
    N.meat = new THREE.Group(); for (i = 0; i < 7; i++) M_(N.meat, G.sph, [0xc0505a, 0xa83a46, 0xd06070][i % 3], [2.2, 1.8, 2.2], [Math.cos(i) * 1.2, .9 + (i % 2) * .7, Math.sin(i) * 1.2], null, false); [-.5, .5].forEach(function (x) { M_(N.meat, G.sph, new THREE.MeshBasicMaterial({ color: 0xffffff }), [.4, .4, .4], [x, 2.2, 1.4], null, false); }); N.meat.visible = false; k.g.add(N.meat);
    N.overBar = k.emoji('🟥', 1, 102.6, 2.6, -224); N.svHole = T.hole(k, 100, -234, .2, .05); N.svHole.g.visible = false;
  }
  var K_ = { glow: function (c) { return new THREE.MeshBasicMaterial({ color: c }); } };
  function buildChaos(k) {
    var R_ = D.rngf(1503), i;
    k.plane(320, 360, 0x2e2a40, 60, -100, 0); k.perimeter(300, 8, 0x1a1828);
    var neon = [0xff3aa0, 0x3ae0ff, 0xb06cff, 0xffd23f, 0x2fae5b];
    [[-30, -30], [-34, 6], [-30, 34], [30, -34], [38, 34], [-6, 40], [14, -42]].forEach(function (p, j) { var h = 8 + R_() * 14; k.b(12, h, 10, 0x2a2838, p[0], 0, p[1]); k.m(G.box, K_.glow(neon[j % 5]), [12.2, .5, 10.2], [p[0], h - 1, p[1]]); });
    // дом соседа (на крыше — деталь)
    k.b(10, 6, 8, 0x5a5048, 24, 0, -8); N.partRoof = k.emoji('⚙️', 1.2, 24, 6.8, -8);
    N.neigh = npc(k, 'w15_neigh', 'Сосед', { top: 0x7a6a5a, pants: 0x3a3a3a, hairStyle: 'none', hair: 0x5a5a5a, skin: 0xe8c0a0, apron: 0x9a9a9a }, 18.4, -8, -PI / 2); k.emoji('🔨', .7, 18.2, 2.2, -7.4);
    // фонтан с карасём (в фонтане — деталь)
    k.disc(5, 0x2a6a9a, 0, 18, .05, 32); k.b(1, .6, 1, 0x8a8f96, 0, 0, 18, { cam: false }); N.carp = makeCarp(); place(k, N.carp, 1.6, 18.4, 0, .3); N.partFount = k.emoji('⚙️', 1, -1.6, .4, 17.4); k.colC(0, 18, 5, .6);
    // «Добрый кола» (деталь — только во время диско)
    k.b(1.6, 2.6, 1.2, 0xd8263a, -20, 0, 8); k.emoji('🥤', 1.1, -20, 3.1, 8); label(k, '«Добрый кола»', -20, 3.9, 8, '#ff9a9a'); N.partDk = k.emoji('⚙️', .9, -18.4, 1.4, 8.8);
    // пилот и машина-тарелка
    N.pilot = npc(k, 'w15_pilot', 'Пилот тарелки', { top: 0x3a6a9a, pants: 0x2a3a5a, helmet: true, skin: 0xdba784, hairStyle: 'none' }, 10, 26, PI);
    N.ufoCar = makeSaucer(); N.ufoCar.scale.setScalar(.18); place(k, N.ufoCar, 14, 26, 0, 1);
    // верстак учёного
    k.b(4, 1, 1.6, 0x6a7078, 0, 0, -12); k.emoji('🔫', .8, 0, 1.4, -12); N.sciC = npc(k, 'w15_sciC', 'Учёный', sciLook(), 0, -13.6, 0); dressSci(N.sciC);
    // гигантский гусь (во время события «Гусь»)
    N.giantGoose = makeGoose(); N.giantGoose.scale.setScalar(2.4); N.giantGoose.visible = false; place(k, N.giantGoose, -40, 0, 0);
    N.evSign = k.emoji('🪶', 3, 0, 9, 0); N.rain = []; for (i = 0; i < 14; i++) { var r = emojiSprite('🍖', .8); r.visible = false; k.g.add(r); N.rain.push({ s: r, y: 0 }); }
    // трасса к трамплину: x=120, z=0..-250
    k.plane(18, 270, 0x1e1c2a, 120, -125, .02); for (i = 0; i < 14; i++) { k.m(G.box, K_.glow(neon[i % 5]), [.3, .3, 14], [111, .5, -8 - i * 17]); k.m(G.box, K_.glow(neon[(i + 2) % 5]), [.3, .3, 14], [129, .5, -8 - i * 17]); }
    N.trackC = track(k, { seed: 153, ox: 120, z0: 0, z1: -240, w: 7.5, step: 8, dens: .4, icons: ['🚧', '🛢️', '🌪️', '🚧', '💿'], move: .35, boostP: .14 });
    k.m(G.box, 0xffd23f, [8, .4, 6], [120, .8, -246], [.35, 0, 0]); N.chHole = T.hole(k, 120, -270, 4, .05);
    N.wave = chaserRow(k, '🌪️', 8, 6);
    k.anims.push(function (t) { N.evSign.position.y = 9 + Math.sin(t * 2) * .4; N.carp.rotation.y = t * .8; });
  }

  /* ---------- освещение областей (поверх общего updEnv) ---------- */
  function envTick(dt) {
    var e = null;
    if (area === BR) e = { bg: 0xffe2b0, fn: 70, ff: 330, h: 1, s: .85 };
    else if (area === SV) e = { bg: 0xe6ecf2, fn: 50, ff: 240, h: 1.05, s: .35 };
    else if (area === CH) { var hue = W.ev === 'disco' ? (performance.now() / 1600) % 1 : .72; var c = new THREE.Color().setHSL(hue, .55, W.ev === 'disco' ? .32 : .22); e = { bgC: c, fn: 40, ff: 260, h: W.ev === 'disco' ? .7 + Math.sin(performance.now() / 120) * .2 : .85, s: .5 }; }
    if (!e) return;
    if (e.bgC) { scene.background.copy(e.bgC); fog.color.copy(e.bgC); } else { scene.background.setHex(e.bg); fog.color.setHex(e.bg); }
    fog.near = e.fn; fog.far = e.ff; hemi.intensity = e.h; sun.intensity = e.s;
  }

  /* ====================== ЗАПУСК И ПЕРЕХОДЫ ====================== */
  function buildAll() {
    if (built) return; built = true;
    K.br = T.makeArea(BR, 240); T.build(BR, buildBread);
    K.sv = T.makeArea(SV, 300); T.build(SV, buildSvet);
    K.ch = T.makeArea(CH, 340); T.build(CH, buildChaos);
    wireBread(); wireSvet(); wireChaos(); chipUI();
  }
  async function startPart(n, fresh) {
    if (W.busy) return; W.busy = true;
    try {
      var q = Q(); if (fresh) { q.f = {}; } q.part = n; save(); buildAll(); T.begin(15); L = T.lvl; W.mode = 'follow'; R = null; player.ovr = null; cam.force = null; carry(false);
      if (n === 4) chaiOn(true);
      if (n === 1) await partBread(); else if (n === 2) await partSvet(); else if (n === 3) await partChaos(); else await partHome();
    } finally { W.busy = false; }
  }
  async function jumpHole(k, lx, lz, text) {
    await cutscene(async function () {
      var p0 = { x: player.pos.x, z: player.pos.z }, c0 = { x: comp.pos.x, z: comp.pos.z }, hx = k.ox + lx, hz = k.oz + lz; sfx('whoosh');
      await anim(1100, function (u) { var e = u * u, s = Math.max(.05, 1 - e); player.ovr = { x: p0.x + (hx - p0.x) * e, y: Math.sin(u * PI) * 1.2, z: p0.z + (hz - p0.z) * e }; player.g.scale.setScalar(s); comp.pos.x = c0.x + (hx - c0.x) * e; comp.pos.z = c0.z + (hz - c0.z) * e; comp.g.position.set(comp.pos.x, 0, comp.pos.z); comp.g.scale.setScalar(s); player.yaw += .25; });
      await fade(1, 700, text || '🕳️ …'); player.ovr = null; player.g.scale.setScalar(1); comp.g.scale.setScalar(1); await wait(500);
    });
  }

  /* ====================== ЧАСТЬ 1. ХЛЕБНЫЙ МИР ====================== */
  async function partBread() {
    var k = K.br, f = F();
    await T.go(BR, -1.5, 52, PI, '🍞 …');
    if (!f.bIntro) await cutscene(async function () {
      placeA(N.sciB, k.ox + 4, k.oz + 50, -PI / 2); N.ant.position.set(k.ox - 3, 0, k.oz + 49);
      await T.shotTo(BR, 9, 6, 44, 0, 3, 20, 1100);
      await say([['sys', 'Хлебозавод «Батон» и парковка стоят посреди золотого поля. Вместо неба — запах свежей выпечки.'], ['gus', 'Марья. Дом из батона. Дерево из багета. Облако — бублик.'], ['marya', 'Это не наш город.'],
        ['sci', 'Это не наш МИР. Батон упал первым — и дыра пошла за ним. Она переносит то, что в неё упало, между вселенными.'], ['marya', 'Значит, нас можно перенести обратно?'], ['sci', 'В теории. Каждый прыжок требует Сияющего батона. Бросаешь — дыра открывается в следующий мир. Куда — не знает никто.'],
        ['gus', 'А где мы возьмём Сияющий батон?'], ['sys', 'Антон-Батон смотрит на холм. Там, на троне из горбушек, сидит Антон размером с маршрутку и в короне.'], ['anton', '*ШМЫГ.*'], ['marya', 'Кажется, Антон дома.']]);
      await T.shotOff(800); f.bIntro = true; save();
      N.ant.position.set(k.ox + 6, 0, k.oz - 18);
    });
    breadObj();
  }
  function breadObj() {
    var f = F();
    if (!f.bKing) obj('👑 Поговорить с Хлебным королём (на холме за площадью).', BR, 0, -18);
    else if (!f.bKnead) obj('🫓 «Великая выпечка», шаг 1: замесить тесто (Марья).', BR, -16, -2.6);
    else if (!f.bGuard) obj('🦆 Шаг 2: Гусь охраняет тесто от хлебо-уток.', BR, -16, -1.8);
    else if (!f.bBake) obj('🔥 Шаг 3: в печь! Не пережарь.', BR, -16, -8);
    else if (!f.bBaton) obj('👑 Отнести выпечку королю.', BR, 0, -18);
    else obj('🏔️ Бежать к дыре — через Хлебную гору!', BR, 0, -40);
  }
  function wireBread() {
    var A = function (x, z, l, fn, r, ok) { return T.act(BR, x, z, l, fn, r, ok); }, f = F;
    A(0, -18, '👑 Хлебный король', function () { king(); }, 3, function () { return !f().bBaton || !f().bRide; });
    A(-16, -2.6, '🫓 Замесить тесто', function () { if (!isHero(marya)) return need(marya); knead(); }, 2.2, function () { return f().bKing && !f().bKnead; });
    A(-16, -1.8, '🪿 Охранять тесто от уток', function () { if (!isHero(gus)) return need(gus); guardStart(); }, 2.4, function () { return f().bKnead && !f().bGuard && !W.guard; });
    A(-16, -8, '🔥 Отправить в печь', function () { bake(); }, 2.2, function () { return f().bGuard && !f().bBake; });
    A(0, -40, '🛹 Вниз с Хлебной горы!', function () { avalanche(); }, 3, function () { return f().bBaton && !f().bRide; });
    A(10, 7.4, '💬 Нармина (хлебная)', function () { cutscene(async function () { await say([['narmina', 'Привет. Меня тут зовут Нармина-плетёнка. Ты похожа на ту, что мне снилась.'], ['marya', 'А я похожа на ту, что ест тебе подобных.'], ['narmina', 'Здесь все так говорят. Не переживай. Мы невкусные, когда разговариваем.']]); }); }, 2.2);
    A(17, 13.4, '💬 Максим (сухарь)', function () { cutscene(async function () { await say([['sys', 'Местный Максим — сухарь. Буквально. Рядом три хлебо-утки.'], ['gus', 'Максим. Это же ты.'], ['ex', '…хрусь.'], ['sys', 'Хлебо-утка подходит, нюхает Максима — и отворачивается.'], ['marya', 'Даже утки не стали.'], ['gus', 'Это лучший мир, в котором я был.']]); }); }, 2.2);
    A(23.4, 15.6, '🦆 Хлебо-утки', function () { cutscene(async function () { await say([['duckc', 'Кря.'], ['sci', 'Это они ехали в той тарелке. Пилот возил их домой — сюда. Вот почему хлебо-утки были в вашем городе.'], ['gus', 'Значит, тарелка — это просто маршрутка между мирами.'], ['duckc', 'Кря-кря.']]); }); }, 2.4);
  }
  async function king() {
    var f = F();
    await cutscene(async function () {
      if (!f.bKing) {
        await say([['sys', 'Хлебный король медленно поворачивает голову. От короны падают крошки.'], ['anton', '*шмыг-шмыг*'], ['sys', 'Король отвечает таким же «шмыг». Весь холм замирает.'],
          ['sci', 'Он спрашивает, зачем вам Сияющий батон.'], ['marya', 'Чтобы вернуться домой.'], ['sci', 'Он говорит: батон получает только победитель «Великой выпечки». Испеките хлеб, достойный короны.'], ['gus', 'Мы умеем печь?'], ['marya', 'Я — умею. Ты — охраняешь.']]);
        f.bKing = true; save(); breadObj();
      } else if (f.bBake && !f.bBaton) {
        await say([['sys', 'Король пробует хлеб. Долго жуёт. Хлебная площадь не дышит.'], ['sys', 'Король кивает. Из короны выкатывается Сияющий батон.']]);
        f.bBaton = true; carry(true); sfx('quest'); save();
        await say([['sci', 'Есть! Билет в следующий мир.'], ['sys', 'Земля вздрагивает. Хлебная гора за троном начинает шуршать.'], ['sci', 'Ой. Батон держал гору. Без него…'], ['gus', 'ЛАВИНА! БАГЕТНАЯ ЛАВИНА!'], ['marya', 'Дыра — внизу, за горой. Скейт! Быстро!']]);
        breadObj();
      } else await say([['sys', 'Король смотрит на тебя. Медленно жуёт. Ждёт.']]);
    });
  }
  async function knead() {
    var tot = 0; await cutscene(async function () { await say([['marya', 'Мука, вода, закваска. Три замеса — и тесто должно быть как облако.']]); });
    for (var i = 0; i < 3; i++) { var g = await timing('trick', { speed: 1.05, label: 'Замес ' + (i + 1) + '/3' }); tot += g; }
    var f = F(); if (tot >= 5) { f.bKnead = true; save(); sfx('ding'); toast('🫓 Тесто идеальное. Утки уже косятся…', 2600); } else toast('🫓 Комки. Ещё раз: нужно хотя бы 5 из 9.', 2600);
    breadObj();
  }
  /* --- Гусь охраняет тесто: утки идут со всех сторон, дотронься — улетит --- */
  function guardStart() { var k = K.br; W.guard = { t: 0, next: .5, sent: 0, bites: 0, ducks: [] }; toast('🦆 Утки идут к тесту! Отгоняй их — подойди вплотную. Три укуса — тесто испорчено.', 3600); }
  function guardTick(dt) {
    var G_ = W.guard; if (!G_ || blocked()) return; var k = K.br, cx = k.ox - 16, cz = k.oz - 4;
    G_.t += dt; G_.next -= dt;
    if (G_.next <= 0 && G_.sent < 10) { var d = N.ducks.filter(function (x) { return !x.visible; })[0]; if (d) { var a = Math.random() * PI * 2; d.position.set(cx + Math.cos(a) * 13, 0, cz + Math.sin(a) * 13); d.visible = true; G_.ducks.push({ m: d, flee: 0 }); G_.sent++; } G_.next = 2.4 - Math.min(1.2, G_.sent * .12); }
    G_.ducks.forEach(function (o) {
      var m = o.m; if (!m.visible) return; var dx = cx - m.position.x, dz = cz - m.position.z, dd = Math.hypot(dx, dz) || 1;
      if (o.flee > 0) { o.flee -= dt; m.position.x -= dx / dd * 9 * dt; m.position.z -= dz / dd * 9 * dt; m.position.y = 1 + (1.3 - o.flee) * 2; if (o.flee <= 0) m.visible = false; return; }
      m.position.x += dx / dd * 2.3 * dt; m.position.z += dz / dd * 2.3 * dt; m.rotation.y = Math.atan2(dx, dz); m.position.y = Math.abs(Math.sin(G_.t * 9)) * .1;
      if (Math.hypot(player.pos.x - m.position.x, player.pos.z - m.position.z) < 1.6) { o.flee = 1.3; sfx('poof'); }
      else if (dd < 1.2) { m.visible = false; G_.bites++; sfx('bonk'); toast('🦆 Кусь! Укусов: ' + G_.bites + '/3', 1400); }
    });
    if (G_.bites >= 3) { W.guard = null; N.ducks.forEach(function (m) { m.visible = false; }); toast('🫓 Утки съели половину теста. Замес остался — попробуй охранять снова.', 3200); return; }
    if (G_.sent >= 10 && G_.ducks.every(function (o) { return !o.m.visible; })) { W.guard = null; F().bGuard = true; save(); sfx('quest'); toast('🪿 Ни одна утка не прорвалась! Гусь гордо гогочет.', 3000); breadObj(); }
  }
  async function bake() {
    var g = await timing('trick', { speed: 1.15, scale: .85, label: 'Вынуть из печи вовремя!' });
    if (g >= 2) { F().bBake = true; save(); sfx('quest'); await cutscene(async function () { await say([['sys', 'Из печи выходит батон с хрустящей корочкой. Площадь аплодирует. Тихо, потому что хлеб.'], ['marya', 'Королю.']]); }); }
    else toast(g === 1 ? '🔥 Бледноват. Ещё раз.' : '🔥 Подгорел! Ещё раз.', 2200);
    breadObj();
  }
  async function avalanche() {
    var k = K.br, f = F(); if (R) return;
    await cutscene(async function () { await T.shotTo(BR, 0, 12, -26, 0, 4, -52, 900); await say([['sys', 'Хлебная гора сползает. На вас катятся багеты, буханки и одна очень злая плюшка.'], ['gus', 'Я впереди, ты рулишь!']]); await T.shotOff(500); });
    var r = await ride({ K: k, z0: -42, z1: -262, w: 6.5, speed: 10, cs: 9.4, gap: 14, hz: N.track, mesh: N.skate, chaser: N.aval, title: '🛹 Лавина', chaseName: 'лавина', hitTxt: '🍞 Буханка в лицо!', failTxt: '🥖 Лавина накрыла!', intro: '🛹 Рули ⬅️ ➡️, бег — ускорение, ⚡ — рывок. Лавина сзади!' });
    f.bRide = true; save();
    await breadFarewell();
  }
  async function breadFarewell() {
    var k = K.br;
    await cutscene(async function () {
      N.ant.position.set(k.ox - 2, 0, k.oz - 266); N.ant.rotation.y = PI; placeA(N.sciB, k.ox + 3, k.oz - 266, PI);
      await T.shotTo(BR, 6, 4, -258, 0, 1, -272, 900);
      await say([['sys', 'Внизу, у подножия горы, дыра. Лавина остановилась в шаге от вас и превратилась в обычную гору хлеба.'], ['gus', 'Антон. Прыгаем вместе.'],
        ['sys', 'Антон не двигается. За его спиной на холм выходят сотни Антонов. Хлебный король поднимает лапу.'], ['marya', 'Он… остаётся.'], ['gus', 'Антон, ты же наш. Ты охранял батон. Ты меня ненавидел. Это было взаимно и прекрасно.'],
        ['anton', '*шмыг.*'], ['sys', 'Антон подходит к Гусю, утыкается ему в крыло. Потом — к Марье. Потом разворачивается и скачет к своим.'], ['marya', 'Он дома, Гусь.'], ['gus', '…Я знаю. Я просто проверяю, не надо ли его догнать. Не надо.']]);
      await anim(1500, function (u) { N.ant.position.z = k.oz - 266 + u * 30; N.ant.position.y = Math.abs(Math.sin(u * PI * 6)) * .4; N.ant.rotation.y = 0; });
      await say([['sci', 'Батон. Бросайте. И держитесь за меня — я не планирую остаться в мире, где меня съедят при первой же ошибке.']]);
      carry(false); var b = emojiSprite('🥖', 1); b.position.set(player.pos.x, 1.6, player.pos.z); k.g.add(b); sfx('whoosh');
      await anim(800, function (u) { b.position.set(player.pos.x + (k.ox - player.pos.x) * u, 1.6 + Math.sin(u * PI) * 2 - u * 1.6, player.pos.z + (k.oz - 276 - player.pos.z) * u); }); k.g.remove(b);
      N.brHole.spin = 4; N.brHole.grow(5); await wait(600); N.sciB.hidden = true; N.sciB.g.visible = false;
    });
    await jumpHole(k, 0, -276, '🕳️ Дыра меняет цвет: красный, жёлтый, зелёный…');
    var q = Q(); q.part = 2; save(); await partSvet();
  }

  /* ====================== ЧАСТЬ 2. МИР СВЕТОФОРА ====================== */
  async function partSvet() {
    var k = K.sv, f = F();
    T.begin(15); L = T.lvl;
    await T.go(SV, 0, 46, PI, '🚦 …');
    if (!f.sIntro) await cutscene(async function () {
      await T.shotTo(SV, 8, 4, 50, 0, 3, 26, 1000);
      await say([['sys', 'Белый свет. Музыка без мелодии. Полки уходят за горизонт. Это город — но весь город один магазин.'], ['voice', '«Уважаемые жители! Ваша квартира находится в отделе бытовой химии. Не забудьте пробить себя на кассе.»'],
        ['marya', 'Светофор. Здесь он победил.'], ['gus', 'Я узнаю этот запах. Котлеты Мираторг. Состав: лучше не знать.'], ['sci', 'Учёный тоже здесь… то есть я. Где-то. Я потерялся при прыжке. Ищите меня по запаху озона.'],
        ['sys', 'Голос учёного раздаётся из колонок и пропадает. Над торговым залом горит табличка: «КАССА №13 — ТОЛЬКО ПО ТРЁМ КУПОНАМ».']]);
      await T.shotOff(700); f.sIntro = true; save();
    });
    svetObj();
  }
  function cps() { var f = F(); return (f.cHigh ? 1 : 0) + (f.cLow ? 1 : 0) + (f.cMax ? 1 : 0); }
  function svetObj() {
    var f = F(), n = cps();
    if (n < 3) obj('🎫 Купоны на кассу №13: ' + n + '/3. ' + (!f.cMax ? 'Один — у промоутера-котлеты у входа.' : !f.cHigh ? 'Один — на верхней полке в левом ряду (Марья).' : 'Один — под полкой в правом ряду (Гусь).') + ' Сотрудники в торговом зале выгоняют тех, кого видят.', SV, !f.cMax ? 9 : !f.cHigh ? -22.8 : 13.4, !f.cMax ? 37.6 : !f.cHigh ? 22 : 8);
    else if (!f.sRide) obj('🚪 Склад: к кассе №13 ведёт конвейер.', SV, 0, -.4);
    else if (!f.sBoss) obj('🧾 Касса №13: пробивай чеки, пока Живое мясо не дошло!', SV, 100, -222);
    else obj('🕳️ Прыгнуть в дыру за кассой.', SV, 100, -231);
  }
  function wireSvet() {
    var A = function (x, z, l, fn, r, ok) { return T.act(SV, x, z, l, fn, r, ok); }, f = F;
    A(9, 37.6, '💬 Промоутер-котлета', function () { promo(); }, 2.4);
    A(-12, 38.4, '💬 Раиса Павловна', function () { cutscene(async function () { await say([['raisa', 'Справочная. Чем могу помочь? Касса номер тринадцать? Её никто не видел. Туда уходит всё, за что не заплатили.'], ['marya', 'Всё — это что?'], ['raisa', 'Карты. Чеки. Отделы. Однажды ушёл целый Светофор — в соседнем мире, говорят. Закрылся зимой. Касса забрала остатки.'], ['gus', 'Вот откуда дыра. Это… списание.'], ['raisa', 'Не списание, а «уценка до нуля». У нас культура.']]); f().sRaisa = true; save(); }); }, 2.4);
    A(-22.8, 22, '👩 Дотянуться до купона на верхней полке', function () { if (!isHero(marya)) return need(marya); f().cHigh = true; N.cpHigh.visible = false; sfx('coin'); save(); toast('🎫 Купон ' + cps() + '/3', 1800); svetObj(); }, 2, function () { return !f().cHigh; });
    A(13.4, 8, '🪿 Залезть под полку за купоном', function () { if (!isHero(gus)) return need(gus); f().cLow = true; N.cpLow.visible = false; sfx('coin'); save(); toast('🎫 Купон ' + cps() + '/3', 1800); svetObj(); }, 2, function () { return !f().cLow; });
    A(0, -.4, '🚪 Склад', function () { if (cps() < 3) { toast('🚪 «Только по трём купонам». Купонов: ' + cps() + '/3.', 2400); sfx('bonk'); return; } svetRide(); }, 2.4, function () { return !f().sRide; });
    A(100, -222, '🧾 Пробить чек', function () { bossHit(); }, 2.6, function () { return !!W.boss && !W.boss.busy; });
    A(100, -231, '🕳️ Прыгнуть в дыру', function () { svetJump(); }, 3, function () { return !!f().sBoss; });
  }
  async function promo() {
    var f = F();
    await cutscene(async function () {
      if (f.cMax) { await say([['ex', '*из костюма* Возьмите листовку. Пожалуйста. Хоть кто-нибудь.']]); return; }
      await say([['sys', 'У входа человек в костюме огромной котлеты раздаёт листовки. Из прорези на вас смотрят знакомые глаза.'], ['gus', '…Максим?'], ['ex', 'Добрый день! Купите себя за 5 000 000 баллов! Акция! Только сегодня!'],
        ['marya', 'Максим, это ты в котлете?'], ['ex', 'Я не Максим. Я — «Котлета Мираторг, состав: лучше не знать». Возьмите листовку.'], ['sys', 'Мимо проходит покупатель. Листовку не берёт. Следующий — тоже. Голубь — тоже.'],
        ['gus', 'Даже голубь не взял.'], ['ex', 'Голубь — это мой начальник. Он берёт только чеки.']]);
      var c = await ask('ex', 'У меня есть купон на кассу №13. Отдам, если возьмёте листовку.', ['Взять листовку', 'Попросить купон просто так', 'Сказать, что костюм ему идёт']);
      if (c === 0) { await say([['ex', 'Вы… взяли? Первая за смену. Держите купон. И… спасибо.'], ['marya', 'Не за что, котлета.']]); }
      else if (c === 2) { await say([['ex', '…Правда?'], ['gus', 'Нет.'], ['ex', '*тихо* Держите купон. Только уйдите.']]); }
      else { await say([['ex', 'Просто так нельзя. Ладно, можно. Здесь всё равно ничего не стоит больше, чем стою я. То есть ноль.']]); }
      f.cMax = true; sfx('coin'); save(); toast('🎫 Купон ' + cps() + '/3', 1800);
    });
    svetObj();
  }
  function staffTick(dt) {
    var k = K.sv; if (W.grace > 0) W.grace -= dt;
    N.staff.forEach(function (s) {
      var tgt = s.leg ? s.B : s.A; if (!s.a.target) { s.leg ^= 1; tgt = s.leg ? s.B : s.A; s.a.target = { x: k.ox + tgt[0], z: k.oz + tgt[1] }; s.a.tspeed = 2; s.a.onArrive = null; }
      if (blocked() || W.grace > 0 || coop()) return;
      var dx = player.pos.x - s.a.pos.x, dz = player.pos.z - s.a.pos.z, d = Math.hypot(dx, dz); if (d > 6.5) return;
      var hx = Math.sin(s.a.yaw), hz = Math.cos(s.a.yaw), dot = (dx * hx + dz * hz) / (d || 1);
      if (d < 1.8 || dot > .55) { W.grace = 1.5; sfx('bonk'); placeA(player, k.ox, k.oz + 34, PI); toast('🦺 «Покупатель без чека — на выход!» Сотрудники смотрят только вперёд: обходи их со спины.', 3800); }
    });
  }
  async function svetRide() {
    var k = K.sv, f = F();
    await cutscene(async function () {
      N.wDoor.on = false; await T.go(SV, 100, 4, PI, '📦 Склад');
      await say([['sys', 'За дверью — конвейер в бесконечность и ряд тележек.'], ['sys', 'Сзади что-то хлюпает. Пол дрожит.'], ['gus', 'Только не это. Я узнаю это хлюпанье.'], ['marya', 'Живое мясо. Оно здесь тоже есть.'], ['gus', 'Тележка! В тележку!']]);
    });
    var r = await ride({ K: { ox: k.ox + 100, oz: k.oz, g: k.g }, z0: 0, z1: -205, w: 6.5, speed: 10.5, cs: 9.8, gap: 13, hz: N.trackS, mesh: N.cart, chaser: N.meatRow, title: '🛒 Погоня', chaseName: 'мясо', hitTxt: '📦 Коробка!', failTxt: '🥩 Мясо догнало!', y: .55, dist: 8 });
    f.sRide = true; save(); await bossStart();
  }
  async function bossStart() {
    var k = K.sv;
    await cutscene(async function () {
      placeA(player, k.ox + 100, k.oz - 220, PI); placeA(comp, k.ox + 101.4, k.oz - 219.4, PI);
      await T.shotTo(SV, 106, 4, -214, 100, 1.6, -226, 900);
      await say([['sys', 'Касса №13. Красная лампа. На ленте — карта «Перекрёсток». Карта Максима.'], ['voice', '«Касса тринадцать к обслуживанию готова. Списываем неоплаченное.»'], ['marya', 'Её надо перегрузить. Пробить столько чеков, чтобы она подавилась.'],
        ['sys', 'Хлюп. Из конвейера выползает Живое мясо. Большое. Злое. Знакомое.'], ['gus', 'Пробивай! Я… буду морально рядом!']]);
      await T.shotOff(600);
    });
    N.meat.visible = true; W.boss = { d: 16, over: 0, busy: false, fails: 0 }; bossPaint(); toast('🧾 Жми «Пробить чек» у кассы и попадай в зелёное. 4 хороших чека — касса перегрузится.', 4200); svetObj();
  }
  function bossPaint() { var b = W.boss, k = K.sv; if (!b) return; N.meat.position.set(k.ox + 100, 0, k.oz - 220 + b.d); N.meat.scale.setScalar(1 + Math.sin(performance.now() / 200) * .05); N.kLamp.material.color.setHex([0xff2a2a, 0xff8a2a, 0xffd23f, 0x9be82e, 0xffffff][Math.min(4, b.over)]); }
  function bossTick(dt) {
    var b = W.boss; if (!b || blocked()) return; b.d -= dt * (b.fails >= 2 ? .75 : .95); bossPaint();
    T.lvl && (T.lvl.obj = { t: '🧾 Касса №13: перегрузка ' + b.over + '/4 · мясо в ' + Math.max(0, Math.round(b.d)) + ' м', p: { x: K.sv.ox + 100, z: K.sv.oz - 222 } });
    if (b.d < 1.6) { b.d = 16; b.fails++; b.over = Math.max(0, b.over - 1); sfx('bonk'); placeA(player, K.sv.ox + 100, K.sv.oz - 214, PI); toast('🥩 Мясо отбросило вас от кассы! Перегрузка −1. Ещё раз.', 3000); }
  }
  async function bossHit() {
    var b = W.boss; if (!b || b.busy) return; b.busy = true;
    try {
      var g = await timing('trick', { speed: 1.2, label: 'Пробить чек!' });
      if (!W.boss) return;
      if (g >= 2) { b.over++; b.d = Math.min(18, b.d + 4); sfx('coin'); toast('🧾 Чек пробит! Перегрузка ' + b.over + '/4', 1400); }
      else { sfx('bonk'); toast('🧾 Касса: «Ошибка сканирования». Мясо ближе!', 1400); }
      if (b.over >= 4) await bossWin();
    } finally { if (W.boss) W.boss.busy = false; }
  }
  async function bossWin() {
    var k = K.sv; W.boss = null; var f = F();
    await cutscene(async function () {
      await T.shotTo(SV, 108, 5, -212, 100, 1.6, -226, 700); sfx('quest');
      T.confetti(k, 100, 2, -224, 50);
      await say([['sys', 'Касса №13 визжит, мигает всеми цветами — и взрывается чеками. Тысячи чеков. Метель из чеков.'], ['sys', 'Живое мясо, засыпанное чеками, медленно оседает и превращается в аккуратную упаковку. «Котлеты. Состав: теперь известен».']]);
      N.meat.visible = false;
      await say([['sys', 'Из ящика кассы выкатывается Сияющий батон. Под ним — последний чек.'], ['sys', '🧾 «Сияющий батон ×1. Оплачено: 5 000 000 баллов. Карта: Максим.»'],
        ['marya', 'Вот куда ушли его баллы. Касса списала их — и купила на них батон.'], ['gus', 'Получается, Максим всё-таки сделал хоть что-то полезное. Случайно. В другом мире.'],
        ['marya', 'А чек из дыры… тот самый, «касса №13»… это была она. Она отправляла в наш мир всё, что списывала. И нас — тоже.'], ['gus', 'Мы были неоплаченным товаром.'], ['marya', 'Больше нет.']]);
      f.sBoss = true; carry(true); save(); N.svHole.g.visible = true; N.svHole.set(.2); N.svHole.grow(2.6); sfx('whoosh');
      await say([['sys', 'За развалинами кассы открывается дыра. Она пахнет озоном и чуть-чуть безумием.'], ['gus', 'Учёный. Он там.']]);
      await T.shotOff(700);
    });
    svetObj();
  }
  async function svetJump() { var k = K.sv; carry(false); await jumpHole(k, 100, -234, '🕳️ Дыра мигает всеми цветами сразу…'); var q = Q(); q.part = 3; save(); await partChaos(); }

  /* ====================== ЧАСТЬ 3. МИР ХАОСА ====================== */
  var EV = [['low', '🪶', 'НИЗКАЯ ГРАВИТАЦИЯ'], ['disco', '🪩', 'ДИСКОТЕКА'], ['goose', '🦢', 'ГИГАНТСКИЙ ГУСЬ'], ['rain', '🍖', 'ДОЖДЬ ИЗ КОТЛЕТ']];
  function evName(id) { return EV.filter(function (e) { return e[0] === id; })[0][2]; }
  async function partChaos() {
    var k = K.ch, f = F();
    T.begin(15); L = T.lvl; W.evI = 0; W.ev = 'low'; W.evT = 10; evPaint();
    await T.go(CH, 0, 30, PI, '🌪️ …');
    if (!f.cIntro) await cutscene(async function () {
      await T.shotTo(CH, 10, 8, 40, 0, 3, 0, 1000);
      await say([['sys', 'Неон. Музыка с трёх сторон. Над площадью висит табличка «СОБЫТИЕ», и она меняется каждые десять секунд.'], ['sci', 'ВЫ! Наконец-то! Я тут с утра. Или со вчера. Время тут тоже событие.'],
        ['sci', 'Добро пожаловать в мир Хаоса. Ваш «режим Хаоса» — просто сквозняк отсюда. Через щёлку в дыре.'], ['marya', 'То есть весь тот бардак в городе…'], ['sci', 'Утечка. Да. Извините. Не я. Почти не я.'],
        ['sci', 'Моя портальная пушка развалилась при прыжке. Без неё дыра бросает куда попало. С ней — я смогу прицелиться в ваш мир. Три детали разлетелись по площади.'],
        ['sci', 'И каждую можно взять только во время своего события. Смотрите на табличку.']]);
      await T.shotOff(700); f.cIntro = true; save();
    });
    chaosObj();
  }
  function parts() { var f = F(); return (f.pRoof ? 1 : 0) + (f.pFount ? 1 : 0) + (f.pDk ? 1 : 0); }
  function chaosObj() {
    var f = F(), n = parts();
    if (n < 3) obj('⚙️ Детали пушки: ' + n + '/3 · сейчас: ' + evName(W.ev) + '. ' + (!f.pRoof ? 'Крыша соседа — Гусь взлетит при низкой гравитации.' : !f.pFount ? 'Фонтан с карасём — Марья достанет, когда пойдёт дождь из котлет.' : '«Добрый кола» отдаст деталь только на дискотеке.'), CH, !f.pRoof ? 20.6 : !f.pFount ? -3.4 : -18.6, !f.pRoof ? -6 : !f.pFount ? 14.6 : 9.6);
    else if (!f.cFix) obj('🔫 Отнести детали учёному.', CH, 0, -10.4);
    else if (!f.cRide) obj('🛸 Сесть в машину-тарелку у пилота.', CH, 13, 24.2);
    else obj('🕳️ …', CH, 120, -262);
  }
  function evPaint() { var e = EV[W.evI % 4]; W.ev = e[0]; try { N.evSign.material.map = emojiTex(e[1]); N.evSign.material.needsUpdate = true; } catch (er) { } }
  function chaosTick(dt) {
    var k = K.ch; W.evT -= dt;
    if (W.evT <= 0) { W.evI++; W.evT = 10; evPaint(); sfx('ding'); if (!R) toast('🌪️ СОБЫТИЕ: ' + evName(W.ev), 1800); if (!R && !blocked()) chaosObj(); }
    // гигантский гусь бродит по площади и пинает тех, кто рядом
    var gg = N.giantGoose; gg.visible = W.ev === 'goose' && !R;
    if (gg.visible) { var t = performance.now() / 1000, gx = k.ox + Math.sin(t * .35) * 22, gz = k.oz + Math.cos(t * .27) * 18; gg.rotation.y = Math.atan2(gx - gg.position.x, gz - gg.position.z); gg.position.set(gx, 0, gz);
      if (!blocked() && W.grace <= 0 && Math.hypot(player.pos.x - gx, player.pos.z - gz) < 3.2) { W.grace = 1.5; var dx = player.pos.x - gx, dz = player.pos.z - gz, d = Math.hypot(dx, dz) || 1; player.pos.x += dx / d * 4; player.pos.z += dz / d * 4; collide(player.pos, .35); sfx('bonk'); toast('🦢 ГИГАНТСКИЙ ГУСЬ ПНУЛ ТЕБЯ. Гусь (обычный) в восторге.', 2200); } }
    if (W.grace > 0) W.grace -= dt;
    // дождь из котлет
    N.rain.forEach(function (r, i) { r.s.visible = W.ev === 'rain' && !R; if (!r.s.visible) return; r.y -= dt * (6 + i % 4); if (r.y < 0) { r.y = 10 + Math.random() * 6; r.s.position.x = player.pos.x + (Math.random() - .5) * 20; r.s.position.z = player.pos.z + (Math.random() - .5) * 20; } r.s.position.y = r.y; });
  }
  function wireChaos() {
    var A = function (x, z, l, fn, r, ok) { return T.act(CH, x, z, l, fn, r, ok); }, f = F;
    A(20.6, -6, '🪿 Взлететь на крышу соседа', function () { if (!isHero(gus)) return need(gus); if (W.ev !== 'low') { toast('🪿 Слишком тяжело. Нужна низкая гравитация (🪶).', 2400); return; } roofPart(); }, 2.4, function () { return !f().pRoof; });
    A(18.4, -6.6, '💬 Сосед', function () { cutscene(async function () { await say([['neigh', '*сверлит* Здравствуйте! *сверлит* Тут перфоратор — это событие. Постоянное. Я счастлив.'], ['gus', 'В нашем мире ты сверлил в шесть утра.'], ['neigh', 'Здесь нет шести утра. Здесь всегда «ДРРРРР».'], ['marya', 'Ну хоть кто-то нашёл свой мир.']]); }); }, 2);
    A(-3.4, 14.6, '👩 Достать деталь из фонтана', function () { if (!isHero(marya)) return need(marya); if (W.ev !== 'rain') { toast('⛲ Деталь на дне, не достать. Когда пойдёт дождь из котлет, фонтан переполнится (🍖).', 2800); return; } fountPart(); }, 2.4, function () { return !f().pFount; });
    A(3.2, 20.6, '🐟 Чеченский карась', function () { cutscene(async function () { await say([['carp', 'Брат. Я плавал в вашей тарелке. Я видел уток. Я видел батон.'], ['carp', 'Теперь я плаваю здесь. Фонтан. Котлеты сверху. Это жизнь, брат.'], ['gus', 'Карась, ты философ.'], ['carp', 'Я карась.']]); }); }, 2.2);
    A(-18.6, 9.6, '🥤 «Добрый кола»', function () { dkPart(); }, 2.4, function () { return !f().pDk; });
    A(10, 27.4, '💬 Пилот тарелки', function () { cutscene(async function () { await say([['pilot', 'О! Пассажиры! Я вас помню. Тарелка, утки, Антон.'], ['pilot', 'Я возил хлебо-уток домой, в хлебный мир. Потом свернул не туда — и оказался тут. Тут красиво. Тут всё время что-то происходит.'], ['marya', 'Ты нас довезёшь до дыры?'], ['pilot', 'Машина — ваша. Я тут останусь. Мне нравится, когда гравитация меняется.']]); f().pilot = true; save(); }); }, 2.4);
    A(0, -10.4, '🔫 Учёный: починить пушку', function () { fixGun(); }, 2.4, function () { return parts() >= 3 && !f().cFix; });
    A(13, 24.2, '🛸 Сесть в машину-тарелку', function () { chaosRace(); }, 2.6, function () { return !!f().cFix && !f().cRide; });
  }
  async function roofPart() { var k = K.ch; await cutscene(async function () { var y0 = 0; await anim(900, function (u) { player.ovr = { x: k.ox + 21.5, y: u * 6.4, z: k.oz - 7 }; }); F().pRoof = true; N.partRoof.visible = false; sfx('coin'); await say([['gus', 'Я лечу! Без крыльев! То есть с крыльями, но я и раньше с ними был.']]); await anim(900, function (u) { player.ovr = { x: k.ox + 21.5, y: 6.4 * (1 - u), z: k.oz - 5.6 }; }); player.ovr = null; placeA(player, k.ox + 21, k.oz - 5); save(); }); toast('⚙️ Деталь ' + parts() + '/3', 1800); chaosObj(); }
  async function fountPart() { await cutscene(async function () { await say([['sys', 'Котлеты сыплются в фонтан. Вода поднимается. Деталь всплывает прямо к Марье.'], ['marya', 'Поймала. Мокрая и пахнет котлетой. Как всё в этой жизни.']]); }); F().pFount = true; N.partFount.visible = false; sfx('coin'); save(); toast('⚙️ Деталь ' + parts() + '/3', 1800); chaosObj(); }
  async function dkPart() {
    await cutscene(async function () {
      if (W.ev !== 'disco') { await say([['dk', '*стоит неподвижно* Я не в настроении. Я автомат с газировкой. У меня есть чувства, но только на дискотеке.']]); return; }
      await say([['sys', 'Диско-шар крутится. «Добрый кола» пританцовывает, позвякивая банками.'], ['dk', 'О-О-О! Дискотека! Вот это я понимаю! Что вам? Деталь? Держите! И колу! Холодную! Подозрительно холодную!'], ['gus', 'Я её узнаю. Это та самая кола.']]);
      F().pDk = true; N.partDk.visible = false; sfx('coin'); save();
    });
    if (F().pDk) { toast('⚙️ Деталь ' + parts() + '/3', 1800); chaosObj(); }
  }
  async function fixGun() {
    var k = K.ch;
    await cutscene(async function () {
      await T.shotTo(CH, 4, 3, -6, 0, 1.4, -12, 800);
      await say([['sys', 'Учёный собирает пушку. Пружина, деталь, деталь, изолента, ещё изолента.'], ['sci', 'Готово. Дыра будет открыта в конце шоссе. Прицел — ваш мир.'], ['marya', 'Ты идёшь с нами?'],
        ['sci', '…Нет. Знаете, что я понял? Я всю жизнь пытался всё починить. Батон, порталы, вселенные.'], ['sci', 'А здесь всё сломано так же, как я. И никто не требует, чтобы работало. Наконец-то место, где я свой.'],
        ['gus', 'Ты столкнул нас в дыру.'], ['sci', 'И вы прошли три мира. Не благодарите.'], ['marya', 'Прощай, учёный.'], ['sci', 'Бегите. Дыра держится, пока «событие» не сменится сто раз. Это примерно… сейчас.']]);
      sfx('quest'); await T.shotOff(600); F().cFix = true; save();
    });
    chaosObj();
  }
  async function chaosRace() {
    var k = K.ch, f = F(); if (R) return;
    await cutscene(async function () { await T.go(CH, 120, 4, PI, '🛸 Тарелка завелась'); await say([['gus', 'Шоссе! И сзади… смерч?'], ['marya', 'Сзади всегда что-то. Жми!']]); });
    var evT = 0; W.evI = -1;
    var r = await ride({ K: { ox: k.ox + 120, oz: k.oz, g: k.g }, z0: 0, z1: -240, w: 7, speed: 12, cs: 11.2, gap: 15, hz: N.trackC, mesh: N.ufoCar, chaser: N.wave, y: 1, dist: 10, pitch: .28,
      title: '🛸 Гонка Хаоса', chaseName: 'смерч', hitTxt: '🚧 Бах!', failTxt: '🌪️ Смерч догнал!', intro: '🛸 Рули ⬅️ ➡️. События меняют управление каждые 6 секунд — следи за табличкой!',
      onTick: function (dt) { evT -= dt; if (evT <= 0) { evT = 6; W.evI++; evPaint(); R.inv = W.ev === 'goose'; R.steerMul = W.ev === 'low' ? .55 : 1; R.spMul = W.ev === 'disco' ? 1.15 : 1; toast('🌪️ ' + ({ low: '🪶 НИЗКАЯ ГРАВИТАЦИЯ — тарелка плывёт, руль вялый', disco: '🪩 ДИСКОТЕКА — всё быстрее!', goose: '🦢 ГУСЬ ЗА РУЛЁМ — управление наоборот!', rain: '🍖 ДОЖДЬ ИЗ КОТЛЕТ — держись!' })[W.ev], 1800); } } });
    R = null; f.cRide = true; save();
    await cutscene(async function () {
      var p0 = { x: player.pos.x, z: player.pos.z }; sfx('whoosh');
      await anim(1300, function (u) { player.ovr = { x: p0.x, y: Math.sin(u * PI) * 7, z: p0.z - u * 22 }; });
      await say([['sys', 'Трамплин. Тарелка взлетает. Внизу — дыра, и впервые она голубая. Как небо дома.'], ['marya', 'Держись, Гусь.'], ['gus', 'Я держусь за тебя уже три вселенные.']]);
      player.ovr = null;
    });
    await jumpHole(k, 120, -270, '🕳️ Тишина. Пахнет… чаем?');
    var q = Q(); q.part = 4; save(); chaiOn(true); await partHome();
  }

  /* ====================== ЧАСТЬ 4. ПОЧТИ ДОМ ====================== */
  /* «чэай~»: в этом мире все говорят так. После финала город остаётся таким (герои его приняли). */
  function chaiOn(v) { var q = Q(); q.chai = !!v; save(); }
  function chaiActive() { try { return !!(S.p13 && S.p13.w15 && S.p13.w15.chai); } catch (e) { return false; } }
  var CYR = 'А-Яа-яЁё';
  var RX_WORD = new RegExp('(^|[^' + CYR + '])([Чч])а(?:й|я|ю|ем|е)(?![' + CYR + '])', 'g'), RX_PREF = new RegExp('(^|[^' + CYR + '])([Чч])ай(?=[' + CYR + '])', 'g');
  function chai(t) {
    if (typeof t !== 'string' || !chaiActive()) return t;
    var f = function (m, pre, c) { return pre + (c === 'Ч' ? 'Чэай~' : 'чэай~'); };
    return t.replace(RX_WORD, f).replace(RX_PREF, function (m, pre, c) { return pre + (c === 'Ч' ? 'Чэай~' : 'чэай~'); });
  }
  var HOME = { spots: null, npcs: {}, made: false };
  function homeSpot(x, z) { for (var r = 0; r < 12; r += .7) for (var a = 0; a < 6.28; a += .6) { var px = x + Math.cos(a) * r, pz = z + Math.sin(a) * r; if (freeAt(px, pz, .6)) return { x: px, z: pz }; } return { x: x, z: z }; }
  function homeBuild() {
    if (HOME.made) return; HOME.made = true; var D0 = FLAT_DOOR, cx = D0.x + 2, cz = D0.z + 9;
    HOME.c = { x: cx, z: cz };
    var list = [['nar', 'Нармина', { top: 0x8c2f4f, pants: 0x232530, hair: 0x161212, hairStyle: 'pony', skin: 0xe2b38f, shoes: 0x111, scale: .94 }, -4, 2], ['max', 'Максим', { top: 0x2f8a4a, pants: 0x2f8a4a, hair: 0xc9a165, hairStyle: 'short', skin: 0xf2c9a8, shoes: 0xffffff }, 4, 4],
      ['mom', 'Мама Максима', { top: 0xd98fb8, coatLong: true, pants: 0xd98fb8, hairStyle: 'bun', hair: 0x9a9a9a, skin: 0xefc4a4, slippers: true, shoes: 0xf2c2d8, scale: .93 }, 6, 6], ['val', 'Валера', { top: 0x2a2b30, hood: true, hoodDark: 0x1a1a1e, pants: 0x3a3a3a, hairStyle: 'none', skin: 0xe2b896 }, -7, 7],
      ['babka', 'Бабушка у подъезда', { top: 0x6a4a6a, pants: 0x3a3a3a, hair: 0xc8c8c8, hairStyle: 'bun', skin: 0xefc4a4, scale: .9, coatLong: true }, -2, -1], ['cour', 'Курьер', { top: 0xe8742a, pants: 0x2a3a5a, hair: 0x333333, hairStyle: 'short', skin: 0xdba784 }, 9, 1], ['clean', 'Уборщик', { top: 0x3a7a5a, pants: 0x2a3a3a, hair: 0x6a6a6a, hairStyle: 'short', skin: 0xdba784 }, -9, 0]];
    list.forEach(function (n) { var p = homeSpot(cx + n[3], cz + n[4]); var a = makeActor('w15h_' + n[0], n[1], makePerson(n[2]), 'city'); cityG.add(a.g); a.area = 'city'; a.pose = 'walk'; placeA(a, p.x, p.z, Math.atan2(cx - p.x, cz - p.z)); a.hidden = true; a.g.visible = false; T.regNpc(a); HOME.npcs[n[0]] = a; });
    var ap = homeSpot(cx + 1, cz - 2); HOME.anton = makeAnton(); HOME.anton.position.set(ap.x, H(ap.x, ap.z), ap.z); HOME.anton.visible = false; cityG.add(HOME.anton);
    var pp = homeSpot(cx - 12, cz + 3); HOME.pig = makePigeon(); HOME.pig.position.set(pp.x, H(pp.x, pp.z), pp.z); HOME.pig.visible = false; cityG.add(HOME.pig); HOME.pigP = pp;
    var bp = homeSpot(cx + 14, cz - 4); HOME.booth = new THREE.Group(); M_(HOME.booth, G.box, 0x2a6aa8, [1.2, 2.4, 1.2], [0, 1.2, 0], null, false); M_(HOME.booth, G.box, 0x111111, [.4, .5, .1], [0, 1.5, .62], null, false); HOME.booth.position.set(bp.x, H(bp.x, bp.z), bp.z); HOME.booth.visible = false; cityG.add(HOME.booth); HOME.boothP = bp;
    var lp = homeSpot(cx + 4, cz + 14); HOME.light = new THREE.Group(); M_(HOME.light, G.cyl, 0x3a3d44, [.2, 3.4, .2], [0, 1.7, 0], null, false); M_(HOME.light, G.box, 0x1d2129, [.6, 1.6, .5], [0, 3.6, 0], null, false); HOME.lamp = [0, 1, 2].map(function (i) { return M_(HOME.light, G.sph, new THREE.MeshBasicMaterial({ color: [0x550000, 0x554400, 0x004400][i] }), [.38, .38, .2], [0, 4.1 - i * .5, .28], null, false); }); HOME.light.position.set(lp.x, H(lp.x, lp.z), lp.z); HOME.light.visible = false; cityG.add(HOME.light); HOME.lightP = lp;
    HOME.puddle = new THREE.Mesh(new THREE.CircleGeometry(1.6, 24), new THREE.MeshBasicMaterial({ color: 0xb87a3a, transparent: true, opacity: .8 })); HOME.puddle.rotation.x = -PI / 2; HOME.puddle.position.set(cx, H(cx, cz) + .06, cz + 1.2); HOME.puddle.visible = false; cityG.add(HOME.puddle);
    var A = function (getP, l, fn, r, ok) { addI({ p: function () { return homeOn() && (!ok || ok()) ? getP() : null; }, r: r || 2.3, label: l, act: fn }); };
    A(function () { return HOME.npcs.nar.pos; }, '💬 Нармина', function () { homeNar(); }, 2.3);
    A(function () { return HOME.boothP; }, '📞 Позвонить себе', function () { homePhone(); }, 2.2, function () { return F().hReveal && !F().hPhone; });
    A(function () { return HOME.pigP; }, '🐦 Спросить голубя', function () { homePigeon(); }, 2.2, function () { return F().hReveal && !F().hPig; });
    A(function () { return HOME.lightP; }, '🚦 Подождать у светофора', function () { homeLight(); }, 2.4, function () { return F().hReveal && !F().hLight; });
    A(function () { return HOME.npcs.val.pos; }, '💬 Валера', function () { cutscene(async function () { await say([['valera', 'Документы? Справки? Чай? Всё есть. Всё по-честному. Почти.'], ['gus', 'Валера, ты тоже?']]); }); }, 2.1, function () { return F().hReveal; });
    A(function () { return HOME.npcs.babka.pos; }, '💬 Бабушка у подъезда', function () { cutscene(async function () { await say([['babka', 'Ой, вернулись! Я вас видела, как вы в дыру упали. Я тогда подумала: молодёжь. Чай будете? С сушками.'], ['marya', '…спасибо, бабушка.']]); }); }, 2.1, function () { return F().hReveal; });
    A(function () { return HOME.npcs.max.pos; }, '💬 Максим', function () { cutscene(async function () { await say([['ex', 'Марья. Я… хотел сказать. Я изменился. Я готовлю речь. Для всех. Сегодня.'], ['marya', 'Речь.'], ['ex', 'Да. Как в кино.']]); }); }, 2.1, function () { return F().hReveal && !homeChecksDone(); });
    A(function () { return HOME.c; }, '🎤 Собраться во дворе', function () { homeGathering(); }, 3, function () { return homeChecksDone() && !F().hSpeech; });
    A(function () { return FLAT_DOOR; }, '🏠 Домой. На кухню.', function () { homeKitchen(); }, 2.6, function () { return !!F().hSpeech && !F().hEnd; });
  }
  function homeOn() { var q = Q(); return q.part === 4 && !!T.lvl && area === 'city'; }
  function homeChecksDone() { var f = F(); return !!(f.hPhone && f.hPig && f.hLight); }
  function homeShow(v) {
    if (!HOME.made) return; Object.keys(HOME.npcs).forEach(function (k) { var a = HOME.npcs[k]; a.hidden = !v; a.g.visible = v; });
    HOME.anton.visible = v; HOME.pig.visible = v; HOME.booth.visible = v; HOME.light.visible = v;
    // настоящая Нармина (основная игра) прячется, пока её двойник «из почти дома» во дворе
    try { if (v) { if (!W.narHid) { W.narHid = { h: narmina.hidden, v: narmina.g.visible }; narmina.hidden = true; narmina.g.visible = false; } } else if (W.narHid) { narmina.hidden = W.narHid.h; narmina.g.visible = W.narHid.v; W.narHid = null; } } catch (e) { }
  }
  async function partHome() {
    T.begin(15); L = T.lvl; homeBuild(); homeShow(true);
    await T.moveTo('city', 3.6, 7.5, PI, '');
    var f = F();
    if (!f.hIntro) await cutscene(async function () {
      await say([['sys', 'Перекрёсток. Дома. Машины. Обычное небо. Дыры нет.'], ['gus', 'Мы… дома?'], ['marya', 'Похоже. Пойдём во двор. Проверим.']]);
      f.hIntro = true; save();
    });
    homeObj();
  }
  function homeObj() {
    var f = F(), D0 = FLAT_DOOR;
    if (!f.hReveal) T.lvl && (T.lvl.obj = { t: '🏠 Вернуться во двор. Нармина ждёт у подъезда.', p: HOME.npcs.nar.pos });
    else if (!homeChecksDone()) { var left = [!f.hPhone && 'позвонить себе', !f.hPig && 'спросить голубя', !f.hLight && 'дождаться светофора'].filter(Boolean); T.lvl && (T.lvl.obj = { t: '🔎 Это точно дом? Проверить: ' + left.join(', ') + '.', p: !f.hPhone ? HOME.boothP : !f.hPig ? HOME.pigP : HOME.lightP }); }
    else if (!f.hSpeech) T.lvl && (T.lvl.obj = { t: '🎤 Все собираются во дворе. Максим готовит речь.', p: HOME.c });
    else T.lvl && (T.lvl.obj = { t: '🏠 Домой. На кухню.', p: FLAT_DOOR });
  }
  async function homeNar() {
    var f = F();
    await cutscene(async function () {
      if (!f.hReveal) {
        await say([['narmina', 'Марья! Гусь! Вы где были? Мы уже думали, вас дыра съела.'], ['marya', 'Почти.'], ['narmina', 'Ладно, не важно. Заходите ко мне. Я как раз заварила чай.'], ['sys', 'Пауза.'], ['gus', '…Повтори.'], ['narmina', 'Чай. Свежий. С бергамотом.'],
          ['gus', 'Марья. Она сказала «чэай~».'], ['marya', 'Может, послышалось.'], ['babka', 'Девочки, чай стынет!'], ['cour', 'Доставка чая! Кто заказывал чай?'], ['gus', 'МАРЬЯ.'], ['marya', 'Я слышу, Гусь. Я слышу.'],
          ['marya', 'Так. Без паники. Проверим. Если это наш мир — голубь знает. Светофор знает. И я сама себе отвечу, если позвоню.']]);
        f.hReveal = true; save(); HOME.anton.visible = true;
      } else await say([['narmina', 'Чай будешь? Ну хоть глоточек чая?']]);
    });
    homeObj();
  }
  async function homePhone() {
    await cutscene(async function () {
      await say([['sys', 'Старый автомат. Марья набирает свой номер. Гудок. Ещё гудок. Раньше никто не отвечал.'], ['sys', 'Щелчок.'], ['phone', 'Алло? …Это я. То есть ты. Не волнуйся.'], ['marya', 'Это наш мир?'], ['phone', 'Это хороший мир. Тут тепло. Тут все свои. Тут только… одно слово по-другому.'], ['phone', 'Ты привыкнешь. Я привыкла. Чай будешь?'], ['sys', 'Гудки.']]);
    });
    F().hPhone = true; save(); sfx('ding'); homeObj();
  }
  async function homePigeon() {
    await cutscene(async function () {
      await say([['pigeon', 'Курлык.'], ['gus', 'Голубь. Ты всю игру говорил, что знаешь слишком много. Говори.'], ['pigeon', 'Я знал, что вы упадёте в дыру. Знал про батон. Знал, что Антон останется. Знал про кассу.'],
        ['pigeon', 'И знал, что вы вернётесь не туда.'], ['gus', 'Почему не сказал?!'], ['pigeon', 'Вы не спрашивали. Вы спрашивали «что ты знаешь». А надо было — «что будет».'], ['pigeon', '…Курлык. И да. Это почти ваш мир. Почти считается.']]);
    });
    F().hPig = true; save(); sfx('ding'); homeObj();
  }
  async function homeLight() {
    await cutscene(async function () {
      var c = HOME.lamp; c[0].material.color.setHex(0xff2a2a); await say([['sys', 'Светофор. Тот самый, что всегда говорил «НЕТ». Красный.']]); await wait(1200);
      c[0].material.color.setHex(0x550000); c[1].material.color.setHex(0xffd23f); await wait(900); c[1].material.color.setHex(0x554400); c[2].material.color.setHex(0x2fae5b);
      await say([['sys', 'Зелёный. Над светофором загорается табличка: «ДА».'], ['gus', 'Он сказал «да». Впервые.'], ['marya', 'На что?'], ['gus', 'Не знаю. На всё. На нас.']]);
    });
    F().hLight = true; save(); sfx('ding'); homeObj();
  }
  async function homeGathering() {
    var f = F(), c = HOME.c, keys_ = Object.keys(HOME.npcs);
    await cutscene(async function () {
      cam.fixed = { pos: new THREE.Vector3(c.x + 9, H(c.x, c.z) + 6, c.z + 10), look: new THREE.Vector3(c.x, H(c.x, c.z) + 1.2, c.z) };
      var spots = keys_.filter(function (k) { return k !== 'max'; }).map(function (k, i) { var a = i / 6 * PI * 1.4 + PI * .8; return { a: HOME.npcs[k], x: c.x + Math.cos(a) * 5, z: c.z + Math.sin(a) * 5 }; });
      spots.forEach(function (s) { T.walk(s.a, s.x, s.z, 3.5); }); T.walk(player, c.x - 2.4, c.z + 4, 3.5); T.walk(comp, c.x - 1, c.z + 4.6, 3.5); await T.walk(HOME.npcs.max, c.x, c.z, 2.5);
      Object.keys(HOME.npcs).forEach(function (k) { var a = HOME.npcs[k]; a.yaw = Math.atan2(c.x - a.pos.x, c.z - a.pos.z); }); HOME.npcs.max.yaw = 0; player.yaw = Math.atan2(c.x - player.pos.x, c.z - player.pos.z);
      HOME.puddle.visible = true;
      await say([['sys', 'Весь двор собрался. Нармина. Мама Максима. Валера. Бабушка. Курьер. Уборщик. Здешний Антон-Батон. Голубь на заборе.'], ['ex', 'Кхм. Друзья. Соседи. Марья.'], ['ex', 'Я долго думал. Я понял, что был неправ. Я изменился. Я стал лучше. Я стал…'],
        ['mom', 'Максимка, не стой в луже!'], ['ex', 'Мама, не сейчас! Я стал… СИЛЬНЕЕ!']]);
      var m = HOME.npcs.max; sfx('bonk'); await anim(700, function (u) { m.g.rotation.x = -u * PI / 2; m.g.position.y = H(m.pos.x, m.pos.z) + .3 * (1 - u); });
      await say([['sys', 'Максим поскальзывается на луже чая и плашмя падает в неё. Медленно. Очень торжественно.'], ['sys', 'Из кармана вылетает карта «Перекрёсток» и падает ему на лоб. Пищит.'], ['sys', '💳 «Начислено: 0 баллов. Спасибо, что вы с нами.»'],
        ['valera', 'Ахахаха!'], ['babka', 'Чай пролил, ирод!'], ['cour', 'Можно я это сниму?'], ['narmina', 'Максим. Вставай. Чай остынет.'], ['gus', 'Это был лучший момент трёх вселенных.'], ['marya', '…Да. Да, это он.'], ['ex', '*из лужи* Я изменился…'], ['mom', 'Изменился, изменился. Пошли сушиться.']]);
      m.g.rotation.x = 0; cam.fixed = null; f.hSpeech = true; save();
    });
    homeObj();
  }
  async function homeKitchen() {
    var f = F(); if (W.busy) return; W.busy = true;
    try {
      await T.moveTo('flat', FLX + 3.6, FLZ + 2.4, 0, '');
      await cutscene(async function () {
        await say([['sys', 'Кухня. Та же кухня. Те же кружки. Чайник шумит.'], ['marya', 'Гусь. Это не наш мир.'], ['gus', 'Я знаю.'], ['marya', 'Но тут Нармина. Тут бабушка. Тут голубь. Тут Максим лежал в луже. Тут светофор сказал «да».'],
          ['gus', 'И Антон тут есть. Не наш. Но шмыгает так же.'], ['marya', 'Мы можем искать дальше. Ещё батоны, ещё дыры, ещё миры.'], ['sys', 'Гусь долго смотрит в кружку.'], ['gus', '…Ну.'], ['gus', 'Чай так чай.'], ['marya', 'Чай так чай.']]);
        await fade(1, 1400, '🫖 Чэай~ так чэай~'); await wait(2400);
        var titles = ['🥖 Антон-Батон — дома, в хлебном мире. Охраняет короля.', '🧾 Касса №13 — взорвалась чеками. Больше ничего не списывает.', '💳 5 000 000 баллов Максима — ушли на Сияющий батон.', '🧪 Учёный — в мире Хаоса. Наконец свой.', '🛸 Пилот, карась и «Добрый кола» — там же. Им хорошо.', '🐦 Голубь — сказал всё, что знал.', '🚦 Светофор — сказал «ДА».', '👨 Максим — в луже. Изменился.', '🪿👩 Марья и Гусь — дома. Почти. Почти считается.'];
        for (var i = 0; i < titles.length; i++) { await fade(1, 300, titles[i]); await wait(1900); }
        await fade(1, 600, 'МГИАГ · Конец истории про дыру'); await wait(2600);
      });
      f.hEnd = true; Q().done = true; S.q.w15 = true; save(); homeShow(false); T.endLvl(); L = null;
      placeA(player, FLAT_DOOR.x + 1, FLAT_DOOR.z + 3, 0); setArea('city'); showComp(FLAT_DOOR.x + 2.4, FLAT_DOOR.z + 3.4); await fade(0, 800);
      try { banner('✓ ЧЭАЙ~', 'Сюжетка №15 пройдена'); } catch (e) { }
      toast('🫖 Мир остался таким: все говорят «чэай~». Это не ошибка — герои его приняли.', 6000);
    } finally { W.busy = false; }
  }

  /* ====================== ПОКАДРОВО ====================== */
  function tick(dt, t) {
    try { if (W.carry && N.carry) { N.carry.visible = true; N.carry.position.set(player.pos.x, (player.ovr ? player.ovr.y : H(player.pos.x, player.pos.z)) + 1.9 + Math.sin(t * 5) * .08, player.pos.z); N.carry.rotation.y = t * 2; } } catch (e) { }
    if (!T.lvl || T.lvl.n !== 15) { chipPaint(); return; }
    try { envTick(dt); } catch (e) { console.error('[LEVEL15 env]', e); }
    try { rideTick(dt); } catch (e) { console.error('[LEVEL15 ride]', e); }
    if (myArea()) { try { compTick(dt); } catch (e) { console.error('[LEVEL15 comp]', e); } }
    if (area === BR) { try { guardTick(dt); } catch (e) { console.error('[LEVEL15 guard]', e); } }
    if (area === SV && !R) { try { if (!F().sRide) staffTick(dt); bossTick(dt); } catch (e) { console.error('[LEVEL15 svet]', e); } }
    if (area === CH) { try { chaosTick(dt); } catch (e) { console.error('[LEVEL15 chaos]', e); } }
    chipPaint();
  }

  /* ====================== DEV ====================== */
  var DEV = {
    start: function (n) { return startPart(n, true); },
    resume: function () { var q = Q(); return startPart(Math.max(1, q.part || 1), false); },
    skip: function () { if (R) { R.z = R.z1 + .1; R.cz = R.z + 50; return 'ride'; } if (W.boss) { W.boss.over = 3; W.boss.d = 18; return 'boss'; } if (W.guard) { W.guard.sent = 10; W.guard.ducks.forEach(function (o) { o.m.visible = false; }); return 'guard'; } return null; },
    flags: function (list) { var f = F(); list.forEach(function (k) { f[k] = true; }); save(); },
    reset: function () { if (S.p13) delete S.p13.w15; S.q.w15 = false; R = null; W.boss = null; W.guard = null; player.ovr = null; cam.force = null; cam.fixed = null; carry(false); homeShow(false); T.endLvl(); L = null; W.busy = false; if (area !== 'city') setArea('city'); placeA(player, FLAT_DOOR.x + 1, FLAT_DOOR.z + 3, 0); showComp(FLAT_DOOR.x + 2.4, FLAT_DOOR.z + 3.4); save(); },
    chai: function (v) { chaiOn(v); }
  };

  /* ====================== УСТАНОВКА ====================== */
  var done = false;
  function install() {
    if (done) return;
    if (typeof worldReady === 'undefined' || !worldReady || typeof makeAnton !== 'function' || typeof canSwitch !== 'function' || !T.actW || typeof gus === 'undefined' || typeof say !== 'function') return;
    done = true;
    if (typeof WHO !== 'undefined') { if (!WHO.sci) WHO.sci = ['Учёный', '#b8ff6a']; if (!WHO.raisa) WHO.raisa = ['Раиса Павловна', '#ffb0d0']; if (!WHO.cour) WHO.cour = ['Курьер', '#ffb36a']; if (!WHO.phone) WHO.phone = ['Голос в трубке', '#a9bad2']; }
    // «чэай~»: реплики, вопросы и уведомления
    var os = say; window.say = say = function (lines) { if (chaiActive() && Array.isArray(lines)) lines = lines.map(function (l) { return Array.isArray(l) ? [l[0], chai(l[1])].concat(l.slice(2)) : l; }); return os.apply(this, [lines].concat([].slice.call(arguments, 1))); };
    if (typeof ask === 'function') { var oa = ask; window.ask = ask = function (w, t, o) { if (chaiActive()) { t = chai(t); o = (o || []).map(chai); } return oa.call(this, w, t, o); }; }
    if (typeof toast === 'function') { var ot = toast; window.toast = toast = function (t, ms) { return ot.call(this, chai(t), ms); }; }
    // переключение героя в любом месте уровня
    var cs = canSwitch; window.canSwitch = canSwitch = function () { if (L && myArea() && !R) return !blocked() && !player.lock && player.pose !== 'fall'; return cs(); };
    var pe = updEnv; window.updEnv = updEnv = function (dt, t) { pe(dt, t); try { tick(dt, t); } catch (e) { console.error('[LEVEL15]', e); } };
    try { homeBuild(); } catch (e) { console.error('[LEVEL15 home]', e); }
    console.log('[LEVEL15] сюжетка №15 подключена (только через DEV-панель)');
  }
  var iv = setInterval(function () { try { install(); if (done) clearInterval(iv); } catch (e) { console.error('[LEVEL15 install]', e); clearInterval(iv); } }, 400);

  window.MG_L15 = { Q: Q, F: F, W: W, N: N, K: K, HOME: HOME, dev: DEV, startPart: startPart, ride: function () { return R; }, chai: chai, chaiActive: chaiActive, homeChecksDone: homeChecksDone, parts: parts, cps: cps, EV: EV, guardTick: guardTick, bossHit: bossHit, tick: tick };
})();
