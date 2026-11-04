/* =====================================================================
   МГИАГ 1.11 — ОЗЕРО: плавание, ныряние, тонущие машины
   Чаша озера создаётся в рельефе (lakeDip в index.html), здесь — поведение.
   Все хуки обёрнуты в try/catch: ошибка здесь не должна ломать игру.
   ===================================================================== */
(function () {
  'use strict';
  var W = { surf: null, mesh: null, o2: 1, under: false, swim: null };
  window.MG_WATER = W;
  function ready() { return typeof worldReady !== 'undefined' && worldReady && typeof cityG !== 'undefined' && typeof H === 'function' && typeof updPlayer === 'function'; }
  function inLakeE(x, z) { var dx = (x - LAKE_G.x) / LAKE_G.rx, dz = (z - LAKE_G.z) / LAKE_G.rz; return dx * dx + dz * dz; }
  function depthAt(x, z) { if (W.surf === null) return 0; if (inLakeE(x, z) >= 1) return 0; return Math.max(0, W.surf - H(x, z)); }
  W.depthAt = depthAt;
  function clamp01(v) { return Math.max(0, Math.min(1, v)); }

  /* ---------- HUD: воздух ---------- */
  var hud = document.createElement('div');
  hud.style.cssText = 'position:fixed;left:50%;top:calc(env(safe-area-inset-top,0px) + 64px);transform:translateX(-50%);z-index:6;display:none;pointer-events:none;background:rgba(10,30,50,.7);border:1px solid rgba(160,220,255,.5);border-radius:12px;padding:5px 12px;font:700 13px var(--ui,sans-serif);color:#cfeeff';
  hud.innerHTML = '🫧 Воздух <span style="display:inline-block;vertical-align:middle;width:90px;height:8px;background:rgba(255,255,255,.2);border-radius:4px;overflow:hidden;margin-left:6px"><i style="display:block;height:100%;width:100%;background:#5fd0ff"></i></span>';
  var bar = hud.querySelector('i');
  var tint = document.createElement('div');
  tint.style.cssText = 'position:fixed;inset:0;z-index:3;pointer-events:none;display:none;background:radial-gradient(ellipse at center,rgba(40,120,170,.32),rgba(8,50,90,.58))';
  document.body.appendChild(hud); document.body.appendChild(tint);

  function splash(x, y, z) { try { puffAt(x, y, z, 0xcfeaff, 4); if (typeof sfx === 'function') sfx('land'); } catch (e) { } }

  /* ---------- игрок ---------- */
  var diveWant = false, drownT = 0, hurtT = 0, prevPos = null;
  var _doJump = null;
  function hookJump() {
    if (typeof doJump !== 'function' || doJump.__mgW) return;
    _doJump = doJump;
    var w = function () {
      try { if (W.swim && player && !player.drive) { diveWant = !diveWant; if (typeof sfx === 'function') sfx('click'); return; } } catch (e) { }
      return _doJump.apply(this, arguments);
    };
    w.__mgW = true; window.doJump = doJump = w;
  }

  function playerPost(dt, px, pz) {
    var c = player;
    if (!c || area !== 'city') { W.swim = null; return; }
    if (c.drive) { W.swim = null; return; }
    var d = depthAt(c.pos.x, c.pos.z);
    var wasSwim = !!W.swim;
    if (!W.swim && d > 1.05 && !c.lock && !c.sitting && c.pose !== 'ride') { W.swim = { dep: 0 }; diveWant = false; splash(c.pos.x, W.surf, c.pos.z); if (typeof toast === 'function') toast('🏊 Ты в воде. Кнопка прыжка — нырнуть/вынырнуть.', 2400); }
    if (W.swim && (d < .55 || c.pose === 'ride')) { W.swim = null; c.g.rotation.x = 0; if (wasSwim) splash(c.pos.x, W.surf, c.pos.z); }
    if (!W.swim) { W.o2 = Math.min(1, W.o2 + dt * .5); return; }
    var s = W.swim;
    // скорость плавания: откатываем часть сдвига, сделанного обычным движением
    var k = s.dep > .4 ? .5 : .62;
    if (px !== undefined) { c.pos.x = px + (c.pos.x - px) * k; c.pos.z = pz + (c.pos.z - pz) * k; }
    // глубина тела под поверхностью
    var maxDep = Math.max(0, d - 1.0);
    var target = diveWant ? Math.min(3.6, maxDep) : 0;
    s.dep += Math.sign(target - s.dep) * Math.min(Math.abs(target - s.dep), 2.6 * dt);
    if (maxDep < s.dep) s.dep = maxDep;
    var feet = W.surf - 1.0 - s.dep;
    c.air = false; c.vy = 0; c.feet = feet; c.pos.y = feet;
    c.g.position.y = feet; c.g.rotation.x = Math.min(1.1, .35 + s.dep * .6);
    // воздух
    if (s.dep > .6) { W.o2 -= dt / 25; } else { W.o2 = Math.min(1, W.o2 + dt * .6); }
    if (W.o2 <= 0) { hurtT -= dt; if (hurtT <= 0) { hurtT = 1.2; if (typeof hurtPlayer === 'function') hurtPlayer(9); if (typeof toast === 'function') toast('😵 Нечем дышать! Вынырни — кнопка прыжка.', 1200); } }
    if (Math.random() < dt * 4 * (s.dep > .6 ? 1 : .3)) puffAt(c.pos.x, W.surf - (s.dep > .6 ? 0 : .1), c.pos.z, 0xdff3ff, 1);
    // всплытие при смерти/нокауте
    if (c.hp !== undefined && c.hp <= 0) { W.swim = null; c.g.rotation.x = 0; }
  }

  /* ---------- машины ---------- */
  var DRAG = 2.2;
  function vehList() { var L = []; if (typeof VEHS !== 'undefined') VEHS.forEach(function (v) { L.push(v); }); return L; }
  function vehWater(v, dt) {
    if (!v || !v.pos || v.fly || v.dead) return;
    var d = depthAt(v.pos.x, v.pos.z), bed = H(v.pos.x, v.pos.z);
    var driver = (typeof player !== 'undefined' && player.drive === v);
    if (d < .45) {
      if (v.wy !== undefined && !v.flooded) { v.wy = undefined; v.wet = Math.max(0, (v.wet || 0) - dt * 2); }
      if (!v.flooded) return;
    }
    if (d >= .45) {
      v.wet = (v.wet || 0) + dt;
      if (!v.flooded) v.v = (v.v || 0) * Math.max(0, 1 - DRAG * dt);        // вода тормозит
      if (typeof carDamage === 'function' && (v.dmg || 0) < 85) carDamage(v, Math.min(85 - (v.dmg || 0), 1.15 * dt), 'self');
      if (!v.flooded && v.wet >= 30) {
        v.flooded = true; v.sinkT = 0;
        if ((v.dmg || 0) < 62) carDamage(v, 62 - (v.dmg || 0), 'self');
        if (driver && typeof toast === 'function') toast('💨 Мотор захлебнулся и дымит. Выходи из машины!', 3200);
      }
    }
    if (v.flooded) { v.v = 0; v.air = false; v.vy = 0; v.sinkT = (v.sinkT || 0) + dt; }
    // плавучесть: пока не затоплена, машина держится у поверхности; затопленная — медленно тонет до дна
    if (d >= .8) {
      v.air = false; v.vy = 0;
      var floatY = W.surf - .5, goal = v.flooded ? Math.max(bed, floatY - Math.min(d, (v.sinkT || 0) * .3)) : floatY;
      if (v.wy === undefined) v.wy = Math.max(v.pos.y, floatY);
      v.wy += Math.sign(goal - v.wy) * Math.min(Math.abs(goal - v.wy), (v.flooded ? .3 : 2.5) * dt);
      v.pos.y = v.wy; if (v.g) v.g.position.y = v.wy;
      v.sub = (W.surf - v.wy);
    }
    // игрок внутри тонущей машины
    if (driver) {
      if (v.flooded && (v.sub || 0) > 1.0) {
        drownT += dt;
        if (drownT > 6) { W.o2 = Math.max(0, W.o2 - dt / 10); if (W.o2 <= 0) { hurtT -= dt; if (hurtT <= 0) { hurtT = 1; hurtPlayer(10); toast('🫧 Вода заливает салон! Выходи!', 900); } } }
      } else drownT = Math.max(0, drownT - dt);
    }
  }
  function installRepair() {
    if (typeof repairCar !== 'function' || repairCar.__mgW) return;
    var prev = repairCar;
    var w = function (v) {
      prev(v);
      try {
        if (v && v.pos) {
          v.flooded = false; v.wet = 0; v.sinkT = 0; v.wy = undefined; v.sub = 0; v.air = false; v.vy = 0;
          var e = inLakeE(v.pos.x, v.pos.z);
          if (e < 1.35) { // машину вытащили из озера: ставим на берег
            var dx = v.pos.x - LAKE_G.x, dz = v.pos.z - LAKE_G.z; if (Math.abs(dx) + Math.abs(dz) < .01) dx = 1; var L = Math.hypot(dx / LAKE_G.rx, dz / LAKE_G.rz) || 1;
            v.pos.x = LAKE_G.x + dx / L * 1.45; v.pos.z = LAKE_G.z + dz / L * 1.45; v.pos.y = H(v.pos.x, v.pos.z); v.v = 0;
            if (v.g) v.g.position.copy(v.pos);
          }
        }
      } catch (e) { console.error('[MG_WATER repair]', e); }
    };
    w.__mgW = true; window.repairCar = repairCar = w;
  }

  /* ---------- NPC/спутник не заходят на глубину ---------- */
  var npcT = 0;
  function pushOut(a) {
    if (!a || !a.pos || a.hidden) return;
    var d = depthAt(a.pos.x, a.pos.z); if (d < 1.0) return;
    var dx = a.pos.x - LAKE_G.x, dz = a.pos.z - LAKE_G.z; if (Math.abs(dx) + Math.abs(dz) < .01) dx = 1; var L = Math.hypot(dx / LAKE_G.rx, dz / LAKE_G.rz) || 1;
    a.pos.x = LAKE_G.x + dx / L * 1.3; a.pos.z = LAKE_G.z + dz / L * 1.3; a.target = null;
    if (a.g) a.g.position.set(a.pos.x, H(a.pos.x, a.pos.z), a.pos.z);
  }
  function npcPass() {
    var px = player.pos.x, pz = player.pos.z; if (Math.hypot(px - LAKE_G.x, pz - LAKE_G.z) > 140) return;
    if (typeof peds !== 'undefined') peds.forEach(function (a) { if (!a.inactive) pushOut(a); });
    if (typeof comp !== 'undefined' && comp !== player && !(W.swim)) pushOut(comp);
    if (typeof narmina !== 'undefined') pushOut(narmina);
  }

  /* ---------- подводный вид ---------- */
  function camPost() {
    var cy = camera.position.y, under = W.surf !== null && cy < W.surf - .05 && inLakeE(camera.position.x, camera.position.z) < 1;
    if (under !== W.under) { W.under = under; tint.style.display = under ? 'block' : 'none'; }
    if (under && typeof fog !== 'undefined') { fog.near = 1; fog.far = 28; fog.color.setHex(0x1d5b7a); if (scene.background) scene.background.setHex(0x1d5b7a); }
  }

  /* ---------- установка хуков ---------- */
  var installed = false;
  function install() {
    if (installed || !ready()) return;
    var lm = null; cityG.children.forEach(function (o) { if (o.userData && o.userData.isLake) lm = o; });
    if (!lm) { console.warn('[MG_WATER] озеро не найдено'); installed = true; return; }
    W.mesh = lm; W.surf = lm.position.y;
    if (window.MG_GFX && MG_GFX.registerWater) MG_GFX.registerWater(lm, lm.material);
    hookJump(); installRepair();
    var prevUp = updPlayer;
    var up = function (dt) {
      var c = player, px, pz; try { if (c && c.pos) { px = c.pos.x; pz = c.pos.z; } } catch (e) { }
      prevUp(dt);
      try { playerPost(dt, px, pz); } catch (e) { console.error('[MG_WATER player]', e); }
    };
    window.updPlayer = updPlayer = up;
    var prevEnv = updEnv;
    var ue = function (dt, t) {
      prevEnv(dt, t);
      try {
        if (started && area === 'city') {
          vehList().forEach(function (v) { vehWater(v, dt); });
          npcT -= dt; if (npcT <= 0) { npcT = .6; npcPass(); }
          var show = !!W.swim || (player.drive && player.drive.flooded && (player.drive.sub || 0) > .6) || W.o2 < .98;
          hud.style.display = show ? 'block' : 'none'; bar.style.width = (clamp01(W.o2) * 100) + '%';
          camPost();
        } else { hud.style.display = 'none'; tint.style.display = 'none'; }
      } catch (e) { console.error('[MG_WATER env]', e); }
    };
    window.updEnv = updEnv = ue;
    installed = true;
  }
  var iv = setInterval(function () { try { install(); } catch (e) { console.error('[MG_WATER]', e); } if (installed) clearInterval(iv); }, 200);
})();
