/* =====================================================================
   МГИАГ 1.21 — СИЛЬНАЯ МОДИФИКАЦИЯ ПЕРСОНАЖА («Новое Я»)
   У Марьи и у Гуся — свой образ:
   • выражение лица (12 видов), цвет глаз (9), брови (6) — бесплатно, меняется в телефоне (Гардероб) и в студии;
   • татуировки на 5 местах (левая и правая рука, кисть, щека, шея) × 14 рисунков — в студии «Новое Я»;
     на руках их видно, когда надета футболка (под рукавами — не видно, как в жизни);
   • макияж (помада, тени, подводка, румянец, веснушки), пирсинг (серьги, нос, губа, бровь),
     растительность на лице (усы, борода, эспаньолка, щетина, бакенбарды), шрамы и отметины,
     рост 90–110%, загар, аксессуары (шарф, рюкзак, плащ, бабочка, цепь, часы).
   Купленное остаётся навсегда и переключается бесплатно. Хранится в S.look2 (обычное сохранение).
   Студия «Новое Я» стоит в новом городе (после «Чэай~»); там всё покупается.
   ===================================================================== */
(function () {
  'use strict';
  var PI = Math.PI;
  var LK = window.MG_LOOK2 = {};
  function L(cid) { S.look2 = S.look2 || {}; var l = S.look2[cid] = S.look2[cid] || {}; if (!l.tat) l.tat = {}; if (!l.own) l.own = []; if (!l.acc) l.acc = {}; return l; }
  function needFace(l) { return !!(l.custom || (l.lips && l.lips !== 'none')); }
  function sv() { try { saveGame(); } catch (e) { } }
  function cidOf(o) { try { if (S.outfit.gus === o) return 'gus'; if (S.outfit.marya === o) return 'marya'; } catch (e) { } return null; }

  /* ---------------- каталог ---------------- */
  var C = LK.C = {
    face: [['default', 'Обычное', '🙂'], ['smile', 'Улыбка', '😊'], ['grin', 'Во весь рот', '😁'], ['surprised', 'Удивление', '😮'], ['angry', 'Злость', '😠'], ['sleepy', 'Сонное', '😪'], ['wink', 'Подмигивание', '😉'], ['cool', 'Невозмутимое', '😏'], ['sad', 'Грусть', '😢'], ['cat', 'Котик :3', '😺'], ['love', 'Влюблённость', '😍'], ['sus', 'Подозрение', '🤨']],
    eyes: [['black', 'Тёмные', 0x1b1b1b], ['brown', 'Карие', 0x5a3418], ['blue', 'Голубые', 0x2f7ad8], ['green', 'Зелёные', 0x2f9a4a], ['grey', 'Серые', 0x7a8a96], ['amber', 'Янтарные', 0xd89a28], ['red', 'Красные', 0xd8242a], ['hetero', 'Разные (голубой и зелёный)', 0x2f7ad8], ['glow', 'Светящиеся', 0x7af0ff]],
    brows: [['none', 'Без бровей'], ['normal', 'Обычные'], ['thick', 'Густые'], ['thin', 'Тонкие'], ['arch', 'Дугой'], ['uni', 'Монобровь']],
    tatSlot: [['armL', 'Левая рука'], ['armR', 'Правая рука'], ['hand', 'Кисть'], ['cheek', 'Щека'], ['neck', 'Шея']],
    tat: [['heart', '❤️', 'Сердце', 600], ['anchor', '⚓', 'Якорь', 700], ['goose', '🪿', 'Гусь', 900], ['bread', '🥖', 'Батон', 800], ['star', '⭐', 'Звезда', 500], ['rose', '🌹', 'Роза', 900], ['bolt', '⚡', 'Молния', 600], ['wave', '🌊', 'Волна', 800], ['teapot', '🫖', 'Чайник', 800], ['skull', '💀', 'Черепок', 900], ['moon', '🌙', 'Луна', 600], ['dragon', '🐉', 'Дракон', 1500], ['mama', 'МАМА', 'Надпись «МАМА»', 700], ['bar', '▮▯▮▮▯▮', 'Штрихкод', 700]],
    lips: [['none', 'Без помады', 0, 0], ['red', 'Красная', 0xc8243a, 300], ['pink', 'Розовая', 0xe86a9a, 300], ['plum', 'Сливовая', 0x6a2a4a, 300], ['black', 'Чёрная', 0x1a1a1a, 400]],
    shadow: [['none', 'Без теней', 0, 0], ['blue', 'Голубые', 0x5aa0e8, 300], ['violet', 'Фиолетовые', 0x8a4ad8, 300], ['gold', 'Золотые', 0xd8b048, 400], ['smoky', 'Дымчатые', 0x3a3a44, 300]],
    extra: [['liner', 'Подводка «стрелки»', 300], ['blush', 'Румянец', 250], ['freckles', 'Веснушки', 350]],
    pierce: [['ears', 'Серьги-кольца', 600], ['nose', 'Гвоздик в носу', 500], ['lip', 'Кольцо в губе', 500], ['brow', 'Штанга в брови', 500]],
    beard: [['none', 'Без бороды', 0], ['mustache', 'Усы', 400], ['beard', 'Борода', 700], ['goatee', 'Эспаньолка', 500], ['stubble', 'Щетина', 300], ['sideburns', 'Бакенбарды', 400]],
    mark: [['scar', 'Шрам через глаз', 500], ['plaster', 'Пластырь', 150], ['mole', 'Родинка', 200], ['bruise', 'Фингал (временно навсегда)', 100]],
    height: [[.9, '90%'], [.95, '95%'], [1, '100%'], [1.05, '105%'], [1.1, '110%']],
    tan: [['none', 'Без загара', 0], ['light', 'Лёгкий загар', 400], ['deep', 'Сильный загар', 600]],
    acc: [['scarf', 'Шарф', 700], ['backpack', 'Рюкзак', 1200], ['cape', 'Плащ-накидка', 1800], ['bow', 'Бабочка', 500], ['chain', 'Золотая цепь', 2500], ['watch', 'Часы на руке', 1500]]
  };
  var EYE = {}; C.eyes.forEach(function (e) { EYE[e[0]] = e[2]; });

  /* ---------------- рисование на модели ---------------- */
  var texCache = {};
  function tatTex(id) { if (texCache[id]) return texCache[id]; var t = C.tat.filter(function (q) { return q[0] === id; })[0]; if (!t) return null;
    var tx = canvasTex(128, 128, function (g) { g.clearRect(0, 0, 128, 128); g.textAlign = 'center'; g.textBaseline = 'middle';
      if (/^[А-ЯA-Z]/.test(t[1])) { g.fillStyle = '#20304a'; g.font = '900 34px Arial'; g.fillText(t[1], 64, 66); g.strokeStyle = '#20304a'; g.lineWidth = 4; g.strokeRect(10, 40, 108, 50); }
      else if (/▮/.test(t[1])) { g.fillStyle = '#1a1a1a'; for (var i = 0; i < 14; i++) if ((i * 7) % 3) g.fillRect(14 + i * 7, 30, 4 + (i % 2) * 2, 60); }
      else { g.font = '86px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; g.globalAlpha = .9; g.fillText(t[1], 64, 70); g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(20,40,70,.45)'; g.fillRect(0, 0, 128, 128); } });
    texCache[id] = new THREE.MeshLambertMaterial({ map: tx, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }); return texCache[id]; }
  function decal(par, matl, w, h, x, y, z, ry) { var m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), matl); m.position.set(x, y, z); m.rotation.y = ry || 0; m.userData.noShadow = true; par.add(m); return m; }
  function B(par, c, s, p, r) { return M_(par, G.box, c, s, p, r || null, false); }
  function drawFace(hd, l, o, cid) {
    var face = l.face || 'default', ec = EYE[l.eyes || 'black'] || 0x1b1b1b, ec2 = l.eyes === 'hetero' ? 0x2f9a4a : ec;
    var eyeMat = function (c) { return l.eyes === 'glow' ? new THREE.MeshBasicMaterial({ color: c }) : mat(c); };
    var z = .151, eyes = function (w, h, dy, c1, c2) { [-1, 1].forEach(function (s) { M_(hd, G.box, eyeMat(s < 0 ? c1 : c2), [w, h, .02], [s * .07, .22 + (dy || 0), z], null, false); }); };
    var white = function (w, h) { [-1, 1].forEach(function (s) { B(hd, 0xffffff, [w, h, .015], [s * .07, .22, z - .003]); }); };
    var lip = (C.lips.filter(function (q) { return q[0] === l.lips; })[0] || [0, 0, 0x9a5555])[2] || 0x9a5555;
    // глаза
    if (face === 'surprised') { white(.075, .085); eyes(.045, .055, 0, ec, ec2); }
    else if (face === 'sleepy') eyes(.055, .014, -.01, ec, ec2);
    else if (face === 'wink') { M_(hd, G.box, eyeMat(ec), [.045, .055, .02], [-.07, .22, z], null, false); B(hd, 0x1b1b1b, [.055, .012, .02], [.07, .21, z]); }
    else if (face === 'cool' || face === 'sus') { eyes(.05, .026, -.006, ec, ec2); }
    else if (face === 'love') { [-1, 1].forEach(function (s) { B(hd, 0xe8243a, [.04, .04, .02], [s * .07, .22, z], [0, 0, PI / 4]); B(hd, 0xe8243a, [.028, .028, .02], [s * .07 - .012, .235, z], [0, 0, PI / 4]); B(hd, 0xe8243a, [.028, .028, .02], [s * .07 + .012, .235, z], [0, 0, PI / 4]); }); }
    else if (face === 'cat') eyes(.05, .04, 0, ec, ec2);
    else eyes(.045, .055, 0, ec, ec2);
    // брови
    var bw = { none: 0, normal: .06, thick: .07, thin: .055, arch: .06, uni: .2 }[l.brows || (face === 'default' ? 'none' : 'normal')], bh = { thick: .025, thin: .008 }[l.brows] || .014, hc = dyeColor(cid, o.dye);
    if (bw) {
      if (l.brows === 'uni') B(hd, hc, [.2, bh + .004, .02], [0, .275, z]);
      else [-1, 1].forEach(function (s) { var tilt = face === 'angry' ? s * -.45 : face === 'sad' ? s * .35 : face === 'surprised' ? 0 : face === 'sus' ? (s > 0 ? .3 : 0) : 0, dy = face === 'surprised' ? .02 : face === 'sus' && s > 0 ? .015 : 0;
        B(hd, hc, [bw, bh, .02], [s * .07, .272 + dy, z], [0, 0, tilt + (l.brows === 'arch' ? s * -.25 : 0)]); });
    }
    // рот
    var m = function (w, h, x, y, rz, c) { B(hd, c || lip, [w, h, .02], [x || 0, y, z], [0, 0, rz || 0]); };
    if (face === 'smile') { m(.06, .016, 0, .1); m(.03, .016, -.04, .108, -.5); m(.03, .016, .04, .108, .5); }
    else if (face === 'grin') { B(hd, 0x5a2a2a, [.13, .045, .02], [0, .105, z]); B(hd, 0xffffff, [.115, .018, .021], [0, .114, z]); }
    else if (face === 'surprised') { B(hd, 0x3a1a1a, [.035, .045, .02], [0, .1, z]); }
    else if (face === 'angry') { m(.08, .016, 0, .1); }
    else if (face === 'sleepy') { m(.035, .014, .01, .1); }
    else if (face === 'wink') { m(.06, .016, 0, .1); m(.03, .016, .04, .108, .5); }
    else if (face === 'cool') { m(.07, .015, .015, .102, .18); }
    else if (face === 'sad') { m(.06, .016, 0, .095); m(.03, .016, -.04, .088, .5); m(.03, .016, .04, .088, -.5); }
    else if (face === 'cat') { m(.04, .014, -.018, .1, .5); m(.04, .014, .018, .1, -.5); }
    else if (face === 'love') { m(.06, .016, 0, .1); m(.03, .016, -.04, .108, -.5); m(.03, .016, .04, .108, .5); B(hd, 0xff8aa8, [.04, .02, .016], [-.1, .15, z]); B(hd, 0xff8aa8, [.04, .02, .016], [.1, .15, z]); }
    else if (face === 'sus') { m(.05, .015, .02, .1, -.15); }
    else m(.08, .018, 0, .11);
  }
  function drawLook(m, o, cid) {
    var l = L(cid), hd = m.P.head, P = m.P, has = function (k) { return l.own.indexOf(k) >= 0; }, hc = dyeColor(cid, o.dye);
    if (needFace(l)) drawFace(hd, l, o, cid);
    var z = .152;
    // макияж
    var sh = (C.shadow.filter(function (q) { return q[0] === l.shadow; })[0] || [])[2]; if (sh) [-1, 1].forEach(function (s) { B(hd, sh, [.058, .018, .016], [s * .07, .252, z - .001]); });
    if (l.liner) [-1, 1].forEach(function (s) { B(hd, 0x111111, [.03, .008, .017], [s * .1, .238, z], [0, 0, s * .5]); });
    if (l.blush) [-1, 1].forEach(function (s) { B(hd, 0xf08a9a, [.045, .025, .014], [s * .1, .15, z - .002]); });
    if (l.freckles) for (var i = 0; i < 10; i++) { var sx = i < 5 ? -1 : 1, k = i % 5; B(hd, 0x8a5a3a, [.008, .008, .014], [sx * (.045 + (k % 3) * .02), .165 + Math.floor(k / 3) * .016, z]); }
    // пирсинг
    var gold = 0xd8b048;
    if (l.pierce && l.pierce.ears) [-1, 1].forEach(function (s) { var r = M_(hd, G.cyl, gold, [.05, .01, .05], [s * .158, .14, .02], [0, 0, PI / 2], false); });
    if (l.pierce && l.pierce.nose) M_(hd, G.sph, 0xe8e8f0, [.016, .016, .016], [.022, .16, z + .004], null, false);
    if (l.pierce && l.pierce.lip) M_(hd, G.cyl, 0xc8c8d0, [.03, .008, .03], [.025, .095, z + .004], [PI / 2, 0, 0], false);
    if (l.pierce && l.pierce.brow) { M_(hd, G.sph, 0xc8c8d0, [.012, .012, .012], [.1, .29, z + .004], null, false); M_(hd, G.sph, 0xc8c8d0, [.012, .012, .012], [.1, .262, z + .004], null, false); }
    // растительность
    var bd = l.beard;
    if (bd === 'mustache') { B(hd, hc, [.1, .025, .025], [0, .135, z + .002]); }
    else if (bd === 'beard') { B(hd, hc, [.31, .12, .04], [0, .06, .14]); B(hd, hc, [.04, .16, .26], [-.16, .12, 0]); B(hd, hc, [.04, .16, .26], [.16, .12, 0]); B(hd, hc, [.1, .025, .025], [0, .135, z + .004]); }
    else if (bd === 'goatee') { B(hd, hc, [.08, .07, .03], [0, .05, .145]); B(hd, hc, [.09, .02, .025], [0, .135, z + .002]); }
    else if (bd === 'stubble') { var st = new THREE.MeshLambertMaterial({ color: hc, transparent: true, opacity: .35 }); M_(hd, G.box, st, [.31, .1, .02], [0, .07, z - .004], null, false); }
    else if (bd === 'sideburns') [-1, 1].forEach(function (s) { B(hd, hc, [.03, .14, .1], [s * .155, .2, .07]); });
    // отметины
    var mk = l.mark || {};
    if (mk.scar) { B(hd, 0xb84a4a, [.012, .11, .016], [.07, .22, z + .002], [0, 0, .25]); }
    if (mk.plaster) { B(hd, 0xf0d8b0, [.06, .022, .016], [-.085, .16, z + .002], [0, 0, .5]); B(hd, 0xf0d8b0, [.06, .022, .016], [-.085, .16, z + .003], [0, 0, -.5]); }
    if (mk.mole) M_(hd, G.sph, 0x3a2418, [.014, .014, .01], [.06, .12, z], null, false);
    if (mk.bruise) { var bm = new THREE.MeshLambertMaterial({ color: 0x5a3a7a, transparent: true, opacity: .55 }); M_(hd, G.box, bm, [.075, .06, .014], [-.07, .215, z - .004], null, false); }
    // татуировки
    var tee = (CLOTHES[o.top] || {}).t === 'tee';
    Object.keys(l.tat).forEach(function (slot) { var id = l.tat[slot], mt = id && tatTex(id); if (!mt) return;
      if ((slot === 'armL' || slot === 'armR') && tee) { var A = slot === 'armL' ? P.armL : P.armR; if (A) decal(A, mt, .1, .13, 0, -.42, .061, 0); }
      if (slot === 'hand' && P.armR) decal(P.armR, mt, .075, .06, 0, -.63, .061, 0);
      if (slot === 'cheek') decal(hd, mt, .06, .06, -.1, .15, z + .001, 0);
      if (slot === 'neck') decal(hd, mt, .07, .06, .151, .1, .02, PI / 2); });
    // аксессуары
    var ac = l.acc || {};
    if (ac.scarf) { B(P.torso, 0xc0392b, [.42, .1, .32], [0, .58, 0]); B(P.torso, 0xc0392b, [.08, .3, .03], [.08, .42, .17]); }
    if (ac.backpack) { B(P.torso, 0x2a5a8a, [.34, .42, .16], [0, .32, -.22]); B(P.torso, 0x1a3a5a, [.3, .12, .04], [0, .2, -.31]); }
    if (ac.cape) { var cm = new THREE.MeshLambertMaterial({ color: 0x8a1a2a, side: THREE.DoubleSide }); M_(P.torso, G.box, cm, [.5, .95, .03], [0, .12, -.17], [.12, 0, 0], false); B(P.torso, 0xd8b048, [.06, .06, .03], [0, .58, .15]); }
    if (ac.bow) { B(P.torso, 0x1a1a1a, [.12, .05, .02], [0, .55, .14]); B(P.torso, 0x1a1a1a, [.03, .03, .025], [0, .55, .145]); }
    if (ac.chain) { for (var c = 0; c < 7; c++) { var a = (c / 6 - .5) * 1.6; M_(P.torso, G.sph, gold, [.025, .025, .025], [Math.sin(a) * .13, .5 - Math.cos(a) * .1 + .1, .135], null, false); } }
    if (ac.watch && P.armL) { B(P.armL, 0x1a1a1a, [.125, .04, .135], [0, -.56, 0]); B(P.armL, 0xd8d8e0, [.05, .045, .05], [0, -.56, .065]); }
  }
  LK.draw = drawLook;

  /* ---------------- подключение к игре ---------------- */
  var hooked = false;
  function install() {
    if (hooked || typeof worldReady === 'undefined' || !worldReady || typeof addAcc !== 'function' || typeof outfitParams !== 'function' || typeof rebuildChar !== 'function') return;
    hooked = true;
    var op = outfitParams; window.outfitParams = outfitParams = function (cid, o) { var p = op(cid, o); try { var l = L(cid); if (needFace(l)) p.faceless = true;
        if (l.tan === 'light') p.skin = new THREE.Color(p.skin).multiplyScalar(.88).getHex(); else if (l.tan === 'deep') p.skin = new THREE.Color(p.skin).multiplyScalar(.72).getHex();
        if (l.height && l.height !== 1) p.scale = (p.scale || 1) * l.height; } catch (e) { } return p; };
    var oa = addAcc; window.addAcc = addAcc = function (m, o) { oa(m, o); try { var cid = cidOf(o); if (cid) drawLook(m, o, cid); } catch (e) { console.error('[LOOK2]', e); } };
    // если игра уже идёт — перерисовать обоих (новые шляпы/очки из 1.20 тоже)
    var tries = 0, iv2 = setInterval(function () { tries++; try { if (typeof started !== 'undefined' && started && S && S.outfit) { clearInterval(iv2); rebuildChar(gus); rebuildChar(marya); } } catch (e) { clearInterval(iv2); } if (tries > 600) clearInterval(iv2); }, 500);
    var as = window.applySave12; if (typeof as === 'function') window.applySave12 = applySave12 = function () { var r = as.apply(this, arguments); try { rebuildChar(gus); rebuildChar(marya); } catch (e) { } return r; };
  }
  setInterval(function () { try { install(); } catch (e) { console.error('[LOOK2 install]', e); } }, 400);

  /* ---------------- изменение образа ---------------- */
  function apply() { sv(); try { rebuildChar(player); } catch (e) { } }
  function own(l, k) { return l.own.indexOf(k) >= 0; }
  function buy(l, k, price) { if (own(l, k) || !price) return true; if (!spend(price)) return false; l.own.push(k); return true; }
  function sec(b, t) { var d = document.createElement('div'); d.className = 'sec'; d.textContent = t; b.appendChild(d); }
  function chips(b, list, cur, fn) { var r = document.createElement('div'); r.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;margin:4px 0 8px';
    list.forEach(function (q) { var bt = document.createElement('button'); bt.className = 'tg' + (q.on ? ' on2' : ''); bt.style.cssText = 'margin:0;min-width:64px;padding:8px 10px;font-size:14px'; bt.textContent = q.t; if (q.sub) bt.title = q.sub; bt.onclick = function () { try { sfx('click'); } catch (e) { } fn(q.v); }; r.appendChild(bt); }); b.appendChild(r); }
  // бесплатное: лицо, глаза, брови (и в телефоне)
  function freePart(b, redraw) {
    var l = L(player.id);
    sec(b, '🙂 Выражение лица'); chips(b, C.face.map(function (f) { return { t: f[2] + ' ' + f[1], v: f[0], on: (l.face || 'default') === f[0] && (l.custom || f[0] === 'default') }; }), 0, function (v) { l.face = v; l.custom = true; apply(); redraw(); });
    sec(b, '👁️ Цвет глаз'); chips(b, C.eyes.map(function (e) { return { t: e[1], v: e[0], on: (l.eyes || 'black') === e[0] }; }), 0, function (v) { l.eyes = v; l.custom = true; apply(); redraw(); });
    sec(b, '〰️ Брови'); chips(b, C.brows.map(function (e) { return { t: e[1], v: e[0], on: l.brows === e[0] }; }), 0, function (v) { l.brows = v; l.custom = true; apply(); redraw(); });
    rowBtn(b, '↩️ Вернуть лицо как было', 'выражение, глаза, брови', 'Вернуть', function () { delete l.face; delete l.eyes; delete l.brows; l.custom = false; apply(); redraw(); });
  }
  LK.phone = function (b) {
    try { sec(b, '🪞 Лицо и образ (бесплатно)'); freePart(b, function () { try { renderPhone(); } catch (e) { } });
      var l = L(player.id), any = Object.keys(l.tat).some(function (k) { return l.tat[k]; }) || l.own.length;
      if (any) { sec(b, '🖋️ Купленное в «Новом Я» — включить/выключить'); ownedToggles(b, function () { try { renderPhone(); } catch (e) { } }); }
      else { var d = document.createElement('div'); d.className = 'ti'; d.style.fontSize = '14px'; d.textContent = 'Тату, макияж, пирсинг, бороду, рост, загар и аксессуары делают в студии «Новое Я» (новый город). Купленное потом включается здесь.'; b.appendChild(d); }
    } catch (e) { console.error('[LOOK2 phone]', e); }
  };
  function ownedToggles(b, redraw) {
    var l = L(player.id);
    C.tatSlot.forEach(function (s) { var cur = l.tat[s[0]], have = l.own.filter(function (k) { return k.indexOf('tat_' + s[0] + '_') === 0; }); if (!have.length) return;
      chips(b, [{ t: '— ' + s[1] + ': нет', v: null, on: !cur }].concat(have.map(function (k) { var id = k.split('_')[2], t = C.tat.filter(function (q) { return q[0] === id; })[0]; return { t: s[1] + ': ' + t[1], v: id, on: cur === id }; })), 0, function (v) { l.tat[s[0]] = v; apply(); redraw(); }); });
    var tg = function (label, on, fn) { rowBtn(b, label, on ? 'включено' : 'выключено', on ? 'Выключить' : 'Включить', function () { fn(!on); apply(); redraw(); }); };
    C.lips.forEach(function (q) { if (q[3] && own(l, 'lips_' + q[0])) tg('💄 Помада: ' + q[1].toLowerCase(), l.lips === q[0], function (v) { l.lips = v ? q[0] : 'none'; }); });
    C.shadow.forEach(function (q) { if (q[3] && own(l, 'shadow_' + q[0])) tg('🎨 Тени: ' + q[1].toLowerCase(), l.shadow === q[0], function (v) { l.shadow = v ? q[0] : 'none'; }); });
    C.extra.forEach(function (q) { if (own(l, q[0])) tg('✨ ' + q[1], !!l[q[0]], function (v) { l[q[0]] = v; }); });
    C.pierce.forEach(function (q) { if (own(l, 'p_' + q[0])) tg('💍 ' + q[1], !!(l.pierce && l.pierce[q[0]]), function (v) { l.pierce = l.pierce || {}; l.pierce[q[0]] = v; }); });
    C.beard.forEach(function (q) { if (q[2] && own(l, 'b_' + q[0])) tg('🧔 ' + q[1], l.beard === q[0], function (v) { l.beard = v ? q[0] : 'none'; }); });
    C.mark.forEach(function (q) { if (own(l, 'm_' + q[0])) tg('🩹 ' + q[1], !!(l.mark && l.mark[q[0]]), function (v) { l.mark = l.mark || {}; l.mark[q[0]] = v; }); });
    C.acc.forEach(function (q) { if (own(l, 'a_' + q[0])) tg('🎒 ' + q[1], !!l.acc[q[0]], function (v) { l.acc[q[0]] = v; }); });
    if (own(l, 'height')) chips(b, C.height.map(function (h) { return { t: '📏 ' + h[1], v: h[0], on: (l.height || 1) === h[0] }; }), 0, function (v) { l.height = v; apply(); redraw(); });
    C.tan.forEach(function (q) { if (q[2] && own(l, 'tan_' + q[0])) tg('☀️ ' + q[1], l.tan === q[0], function (v) { l.tan = v ? q[0] : 'none'; }); });
  }
  /* ---------------- студия «Новое Я»: три мастера ---------------- */
  function modal(title, greet, body) { openModal('shop', function () { var b = shopHead(title, 'sh_studio', greet); body(b); footClose(); }); }
  LK.openTattoo = function () {
    var slot = 'armL'; var dr = function () { modal('🖋️ Тату-мастер', 'Выбирай место и рисунок. Больно не будет. Почти.', function (b) {
      var l = L(player.id); chips(b, C.tatSlot.map(function (s) { return { t: s[1] + (l.tat[s[0]] ? ' ✓' : ''), v: s[0], on: slot === s[0] }; }), 0, function (v) { slot = v; dr(); });
      if ((slot === 'armL' || slot === 'armR') && (CLOTHES[S.outfit[player.id].top] || {}).t !== 'tee') { var d = document.createElement('div'); d.className = 'ti'; d.style.fontSize = '14px'; d.textContent = '👕 На руках татуировку видно, когда надета футболка. Под рукавами — не видно.'; b.appendChild(d); }
      C.tat.forEach(function (t) { var key = 'tat_' + slot + '_' + t[0], has = own(l, key), on = l.tat[slot] === t[0];
        rowBtn(b, t[1] + ' ' + t[2], on ? 'набито здесь' : has ? 'уже есть — бесплатно' : fmt(t[3]), on ? '✓' : has ? 'Включить' : 'Набить', function () { if (!buy(l, key, t[3])) return; l.tat[slot] = t[0]; apply(); try { sfx('poof'); } catch (e) { } toast('🖋️ ' + t[2] + ' — ' + C.tatSlot.filter(function (s) { return s[0] === slot; })[0][1].toLowerCase(), 2200); dr(); }, on); });
      if (l.tat[slot]) rowBtn(b, '🧼 Свести с этого места', 'лазер, бесплатно', 'Свести', function () { l.tat[slot] = null; apply(); dr(); });
    }); }; dr();
  };
  LK.openMakeup = function () {
    var dr = function () { modal('💄 Визажист и пирсинг', 'Сделаем ярко. Или очень ярко.', function (b) { var l = L(player.id);
      sec(b, '💄 Помада'); C.lips.forEach(function (q) { var on = (l.lips || 'none') === q[0], k = 'lips_' + q[0]; rowBtn(b, q[1], on ? 'сейчас' : (!q[3] || own(l, k) ? 'бесплатно' : fmt(q[3])), on ? '✓' : 'Выбрать', function () { if (q[3] && !buy(l, k, q[3])) return; l.lips = q[0]; apply(); dr(); }, on); });
      sec(b, '🎨 Тени'); C.shadow.forEach(function (q) { var on = (l.shadow || 'none') === q[0], k = 'shadow_' + q[0]; rowBtn(b, q[1], on ? 'сейчас' : (!q[3] || own(l, k) ? 'бесплатно' : fmt(q[3])), on ? '✓' : 'Выбрать', function () { if (q[3] && !buy(l, k, q[3])) return; l.shadow = q[0]; apply(); dr(); }, on); });
      sec(b, '✨ Детали'); C.extra.forEach(function (q) { var on = !!l[q[0]]; rowBtn(b, q[1], on ? 'есть' : own(l, q[0]) ? 'бесплатно' : fmt(q[2]), on ? 'Убрать' : 'Сделать', function () { if (!on && !buy(l, q[0], q[2])) return; l[q[0]] = !on; apply(); dr(); }); });
      sec(b, '💍 Пирсинг'); C.pierce.forEach(function (q) { var on = !!(l.pierce && l.pierce[q[0]]), k = 'p_' + q[0]; rowBtn(b, q[1], on ? 'есть' : own(l, k) ? 'бесплатно' : fmt(q[2]), on ? 'Снять' : 'Сделать', function () { if (!on && !buy(l, k, q[2])) return; l.pierce = l.pierce || {}; l.pierce[q[0]] = !on; apply(); dr(); }); });
    }); }; dr();
  };
  LK.openStyle = function () {
    var dr = function () { modal('🪞 Образ', 'Лицо, рост, загар, борода, отметины, аксессуары.', function (b) { var l = L(player.id);
      freePart(b, dr);
      sec(b, '🧔 Растительность на лице'); C.beard.forEach(function (q) { var on = (l.beard || 'none') === q[0], k = 'b_' + q[0]; rowBtn(b, q[1], on ? 'сейчас' : (!q[2] || own(l, k) ? 'бесплатно' : fmt(q[2])), on ? '✓' : 'Выбрать', function () { if (q[2] && !buy(l, k, q[2])) return; l.beard = q[0]; apply(); dr(); }, on); });
      sec(b, '🩹 Шрамы и отметины'); C.mark.forEach(function (q) { var on = !!(l.mark && l.mark[q[0]]), k = 'm_' + q[0]; rowBtn(b, q[1], on ? 'есть' : own(l, k) ? 'бесплатно' : fmt(q[2]), on ? 'Убрать' : 'Сделать', function () { if (!on && !buy(l, k, q[2])) return; l.mark = l.mark || {}; l.mark[q[0]] = !on; apply(); dr(); }); });
      sec(b, '📏 Рост'); if (!own(l, 'height')) rowBtn(b, 'Открыть настройку роста', 'навсегда', fmt(1500), function () { if (buy(l, 'height', 1500)) dr(); });
      else chips(b, C.height.map(function (h) { return { t: h[1], v: h[0], on: (l.height || 1) === h[0] }; }), 0, function (v) { l.height = v; apply(); dr(); });
      sec(b, '☀️ Загар'); C.tan.forEach(function (q) { var on = (l.tan || 'none') === q[0], k = 'tan_' + q[0]; rowBtn(b, q[1], on ? 'сейчас' : (!q[2] || own(l, k) ? 'бесплатно' : fmt(q[2])), on ? '✓' : 'Выбрать', function () { if (q[2] && !buy(l, k, q[2])) return; l.tan = q[0]; apply(); dr(); }, on); });
      sec(b, '🎒 Аксессуары'); C.acc.forEach(function (q) { var on = !!l.acc[q[0]], k = 'a_' + q[0]; rowBtn(b, q[1], on ? 'надето' : own(l, k) ? 'бесплатно' : fmt(q[2]), on ? 'Снять' : 'Надеть', function () { if (!on && !buy(l, k, q[2])) return; l.acc[q[0]] = !on; apply(); dr(); }); });
    }); }; dr();
  };
})();
