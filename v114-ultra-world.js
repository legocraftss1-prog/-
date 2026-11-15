/* =====================================================================
   МГИАГ 1.14 — ULTRA: модели и текстуры карты.
   Расположение домов, дорог, деревьев и всех объектов НЕ меняется:
   модели дополняются деталями поверх существующих, коллизии прежние.
   Модели меняются при запуске (если режим включён), текстуры — на лету.
   Собственный генератор случайных чисел: игровой Math.random и «зёрна»
   карты не затрагиваются, поэтому планировка остаётся той же.
   ===================================================================== */
(function () {
  'use strict';
  var U = window.MG_ULTRA; if (!U || typeof THREE === 'undefined') return;
  var MOBILE = U.mobile;
  function hash(x, z, k) { var v = Math.sin(x * 127.1 + z * 311.7 + (k || 0) * 74.7) * 43758.5453; return v - Math.floor(v); }
  function rng(seed) { var s = seed >>> 0 || 1; return function () { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; }; }

  /* ================= ТЕКСТУРЫ ФАСАДОВ (холст 512, та же раскладка окон) ================= */
  function cvs(n) { var c = document.createElement('canvas'); c.width = c.height = n; return c; }
  function speckle(g, n, R, a0, a1, dark) { for (var i = 0; i < n; i++) { g.fillStyle = (dark ? 'rgba(0,0,0,' : 'rgba(255,255,255,') + (a0 + R() * (a1 - a0)).toFixed(3) + ')'; g.fillRect(R() * 512, R() * 512, 1 + R() * 2, 1 + R() * 2); } }
  function glass(g, x, y, w, h, R) {
    var gr = g.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, '#4b5d76'); gr.addColorStop(1, '#6d839f'); g.fillStyle = gr; g.fillRect(x, y, w, h);
    g.fillStyle = 'rgba(160,182,208,.55)'; g.fillRect(x + 5, y + 5, w * .36, h - 10);
    g.fillStyle = 'rgba(255,255,255,.10)'; g.beginPath(); g.moveTo(x + w * .55, y); g.lineTo(x + w * .8, y); g.lineTo(x + w * .45, y + h); g.lineTo(x + w * .2, y + h); g.closePath(); g.fill();
    var r = R();
    if (r < .35) { g.fillStyle = 'rgba(245,240,228,.42)'; g.fillRect(x, y, w, h * (.2 + R() * .25)); }
    else if (r < .55) { g.fillStyle = 'rgba(238,232,220,.36)'; g.fillRect(x, y, w * .3, h); g.fillRect(x + w * .7, y, w * .3, h); }
  }
  function windowCell(g, x, y, w, h, R, frame) {
    g.fillStyle = 'rgba(0,0,0,.16)'; g.fillRect(x - 7, y - 7, w + 14, h + 14);
    g.fillStyle = frame; g.fillRect(x - 5, y - 5, w + 10, h + 10);
    glass(g, x, y, w, h, R);
    g.fillStyle = frame; g.fillRect(x + w * .47, y, 4, h); g.fillRect(x + w * .47, y + h * .32, w * .53, 3);
    g.fillStyle = '#d5d8dc'; g.fillRect(x - 9, y + h + 4, w + 18, 6);
    g.fillStyle = 'rgba(0,0,0,.17)'; g.fillRect(x - 9, y + h + 10, w + 18, 4);
    var gr = g.createLinearGradient(0, y + h + 14, 0, y + h + 40); gr.addColorStop(0, 'rgba(0,0,0,.07)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - 4, y + h + 14, w + 8, 26);
  }
  function drawWin() {
    var c = cvs(512), g = c.getContext('2d'), R = rng(11); g.fillStyle = '#fff'; g.fillRect(0, 0, 512, 512);
    speckle(g, 5200, R, .015, .05, true); speckle(g, 1800, R, .04, .1, false);
    g.fillStyle = 'rgba(0,0,0,.075)'; for (var j = 0; j < 4; j++) g.fillRect(0, j * 128 + 124, 512, 3);
    g.fillStyle = 'rgba(0,0,0,.05)'; for (var i = 0; i < 4; i++) g.fillRect(i * 128, 0, 2, 512);
    for (i = 0; i < 4; i++) for (j = 0; j < 4; j++) windowCell(g, i * 128 + 28, j * 128 + 24, 72, 80, R, '#e9ebee');
    return c;
  }
  function drawBrick() {
    var c = cvs(512), g = c.getContext('2d'), R = rng(23); g.fillStyle = '#a8583c'; g.fillRect(0, 0, 512, 512);
    for (var y = 0; y < 512; y += 16) {
      var off = (y / 16) % 2 ? 0 : 20;
      for (var x = off - 40; x < 512; x += 40) { var v = R(); g.fillStyle = v < .5 ? 'rgba(0,0,0,' + (v * .2).toFixed(3) + ')' : 'rgba(255,190,150,' + ((v - .5) * .2).toFixed(3) + ')'; g.fillRect(x + 1, y, 38, 14); }
      g.fillStyle = 'rgba(60,20,10,.30)'; g.fillRect(0, y + 14, 512, 2); for (x = off; x < 512; x += 40) g.fillRect(x, y, 2, 15);
    }
    speckle(g, 2600, R, .02, .07, true);
    for (var i = 0; i < 4; i++) for (var j = 0; j < 4; j++) windowCell(g, i * 128 + 28, j * 128 + 24, 72, 80, R, '#efe6d8');
    return c;
  }
  function drawModern() {
    var c = cvs(512), g = c.getContext('2d'), R = rng(37); g.fillStyle = '#e9eef2'; g.fillRect(0, 0, 512, 512);
    speckle(g, 2200, R, .012, .04, true);
    for (var j = 0; j < 4; j++) {
      var y = j * 128 + 16, gr = g.createLinearGradient(0, y, 0, y + 92); gr.addColorStop(0, '#39587a'); gr.addColorStop(1, '#55799a'); g.fillStyle = gr; g.fillRect(0, y, 512, 92);
      for (var i = 0; i < 8; i++) {
        g.fillStyle = 'rgba(255,255,255,.17)'; g.fillRect(i * 64 + 4, y + 4, 20, 84);
        g.fillStyle = 'rgba(255,255,255,.07)'; g.beginPath(); g.moveTo(i * 64 + 34, y); g.lineTo(i * 64 + 52, y); g.lineTo(i * 64 + 30, y + 92); g.lineTo(i * 64 + 12, y + 92); g.closePath(); g.fill();
        if (R() < .3) { g.fillStyle = 'rgba(240,236,226,.28)'; g.fillRect(i * 64 + 3, y, 58, 18 + R() * 30); }
      }
      g.fillStyle = '#cfd8e0'; for (i = 0; i <= 8; i++) g.fillRect(i * 64 - 3, y, 6, 92);
      g.fillStyle = 'rgba(0,0,0,.14)'; g.fillRect(0, y + 92, 512, 4); g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(0, y - 3, 512, 3);
    }
    return c;
  }
  function drawWood() {
    var c = cvs(512), g = c.getContext('2d'), R = rng(51); g.fillStyle = '#8a6a48'; g.fillRect(0, 0, 512, 512);
    for (var y = 0; y < 512; y += 20) {
      g.fillStyle = R() < .5 ? 'rgba(0,0,0,.05)' : 'rgba(255,220,170,.05)'; g.fillRect(0, y, 512, 17);
      g.fillStyle = 'rgba(40,20,5,.28)'; g.fillRect(0, y + 17, 512, 3);
      g.strokeStyle = 'rgba(50,28,10,.16)'; g.lineWidth = 1;
      for (var k = 0; k < 3; k++) { g.beginPath(); var yy = y + 3 + R() * 11; g.moveTo(0, yy); for (var x = 0; x <= 512; x += 64) g.lineTo(x, yy + (R() - .5) * 3); g.stroke(); }
    }
    for (var i = 0; i < 4; i++) for (var j = 0; j < 4; j++) windowCell(g, i * 128 + 32, j * 128 + 28, 64, 72, R, '#f2ece0');
    return c;
  }
  function drawEm(kind) {
    var c = cvs(512), g = c.getContext('2d'), R = rng(kind === 'modern' ? 77 : 63); g.fillStyle = '#000'; g.fillRect(0, 0, 512, 512);
    var warm = ['#ffcf6a', '#ffe3a0', '#ffb35a', '#cfe2ff'], cool = ['#fff1c8', '#dfeeff', '#ffd890', '#c8f0ff'];
    function lit(x, y, w, h, pal) {
      var col = pal[Math.floor(R() * pal.length)]; g.fillStyle = col; g.fillRect(x, y, w, h);
      var gr = g.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, 'rgba(0,0,0,.28)'); gr.addColorStop(.5, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.22)'); g.fillStyle = gr; g.fillRect(x, y, w, h);
      if (R() < .5) { g.fillStyle = 'rgba(0,0,0,.30)'; g.fillRect(x, y, w * .26, h); g.fillRect(x + w * .74, y, w * .26, h); }
    }
    if (kind === 'modern') { for (var j = 0; j < 4; j++) for (var i = 0; i < 8; i++) if (R() < .55) lit(i * 64 + 4, j * 128 + 18, 56, 88, cool); }
    else { for (i = 0; i < 4; i++) for (j = 0; j < 4; j++) if (R() < .5) lit(i * 128 + 28, j * 128 + 24, 72, 80, warm); }
    return c;
  }
  var TEXS = null;
  function texList() {
    if (TEXS) return TEXS; TEXS = [];
    function add(get, draw) { var t = null; try { t = get(); } catch (e) { } if (t && t.isTexture) TEXS.push({ t: t, draw: draw, hi: null, orig: null }); }
    add(function () { return winTex; }, drawWin); add(function () { return brickTex; }, drawBrick); add(function () { return modernTex; }, drawModern); add(function () { return WOODTEX; }, drawWood);
    add(function () { return winEm; }, function () { return drawEm('win'); }); add(function () { return modernEm; }, function () { return drawEm('modern'); });
    return TEXS;
  }
  function facadesOn() {
    var maxA = 1; try { maxA = renderer.capabilities.getMaxAnisotropy(); } catch (e) { }
    texList().forEach(function (r) {
      if (r.on) return;
      if (!r.hi) r.hi = r.draw();
      r.orig = { image: r.t.image, an: r.t.anisotropy };
      r.t.image = r.hi; r.t.anisotropy = Math.min(MOBILE ? 4 : 8, maxA); r.t.needsUpdate = true; r.on = true;
    });
  }
  function facadesOff() { if (!TEXS) return; TEXS.forEach(function (r) { if (!r.on) return; r.t.image = r.orig.image; r.t.anisotropy = r.orig.an; r.t.needsUpdate = true; r.on = false; }); }

  /* ================= ДЕТАЛИ МАТЕРИАЛОВ В МИРОВЫХ КООРДИНАТАХ (без растяжения) ================= */
  var COMMON = [
    'varying vec3 vUW; varying vec3 vUN;',
    'float ultH(vec3 p){ p=fract(p*0.3183099+0.1); p*=17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }',
    'float ultH2(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }',
    'float ultN(vec3 x){ vec3 i=floor(x); vec3 f=fract(x); f=f*f*(3.0-2.0*f);',
    ' return mix(mix(mix(ultH(i),ultH(i+vec3(1.0,0.0,0.0)),f.x),mix(ultH(i+vec3(0.0,1.0,0.0)),ultH(i+vec3(1.0,1.0,0.0)),f.x),f.y),',
    '            mix(mix(ultH(i+vec3(0.0,0.0,1.0)),ultH(i+vec3(1.0,0.0,1.0)),f.x),mix(ultH(i+vec3(0.0,1.0,1.0)),ultH(i+vec3(1.0,1.0,1.0)),f.x),f.y),f.z); }'
  ].join('\n');
  var KINDS = {
    0: ' float g=ultN(w*1.9)*0.5+ultN(w*7.0)*0.3+ultN(w*23.0)*0.2*near; c*=0.86+0.28*g;',
    1: ' float a=ultN(w*0.33); float b=ultN(w*2.3); float f=ultN(w*11.0)*near; c*=vec3(0.92+0.14*a,0.88+0.22*a,0.90+0.10*a)*(0.88+0.18*b+0.14*f);',
    2: ' float g=ultN(w*5.0)*0.6+ultN(w*21.0)*0.4*near; c*=0.90+0.20*g;' +
      ' if(n.y>0.6){ vec2 t=fract(w.xz*2.0); float ln=min(1.0,step(t.x,0.045)+step(t.y,0.045)); float fd=1.0-smoothstep(22.0,55.0,d); c*=1.0-ln*0.15*fd; c*=1.0+(ultH2(floor(w.xz*2.0))-0.5)*0.10*fd; }',
    3: ' float g=ultN(w*3.1)*0.5+ultN(w*15.0)*0.5*near; c*=0.86+0.26*g; c*=1.0-smoothstep(0.60,0.70,ultN(w*0.21))*0.11;',
    5: ' float g=ultN(w*3.4)*0.55+ultN(w*13.0)*0.45; c*=0.80+0.40*g;'
  };
  function inject(sh, kind) {
    if (sh.fragmentShader.indexOf('ultDetail(') >= 0) return;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vUW; varying vec3 vUN;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvUW=(modelMatrix*vec4(transformed,1.0)).xyz; vUN=normalize(mat3(modelMatrix)*objectNormal);');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\n' + COMMON + '\nvec3 ultDetail(vec3 w,vec3 n,vec3 c){ float d=length(cameraPosition-w); float near=1.0-smoothstep(9.0,42.0,d);\n' + KINDS[kind] + '\n return c; }')
      .replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.rgb=ultDetail(vUW,vUN,diffuseColor.rgb);');
  }
  U.WORLD_SRC = { common: COMMON, kinds: KINDS };
  var patched = [];
  function wrap(m, kind) {
    var prev = { cb: m.onBeforeCompile, key: m.customProgramCacheKey };
    var cb = function (sh, r) { if (prev.cb) { try { prev.cb.call(m, sh, r); } catch (e) { } } if (!cb.dead) inject(sh, kind); };
    m.userData.ultPrev = prev; m.userData.ultCb = cb; m.onBeforeCompile = cb;
    m.customProgramCacheKey = function () { var pk = ''; try { pk = prev.key ? prev.key.call(m) : ''; } catch (e) { } return pk + '|ult' + kind + (MOBILE ? 'm' : 'd'); };
    m.userData.ultKey = m.customProgramCacheKey; m.needsUpdate = true;
  }
  function patch(m, kind) {
    if (!m || !(m.isMeshLambertMaterial || m.isMeshPhongMaterial)) return;
    if (m.userData.ultK !== undefined) { if (m.onBeforeCompile !== m.userData.ultCb) wrap(m, m.userData.ultK); return; } // другой модуль заменил перехват — встраиваемся снова
    m.userData.ultK = kind; patched.push(m); wrap(m, kind);
  }
  function unpatchAll() {
    patched.forEach(function (m) {
      if (m.userData.ultK === undefined) return;
      var p = m.userData.ultPrev || {};
      if (m.onBeforeCompile === m.userData.ultCb) { m.onBeforeCompile = p.cb || function () { }; m.customProgramCacheKey = p.key || function () { return ''; }; }
      else { var cb = m.userData.ultCb; cb.dead = true; }
      m.userData.ultK = undefined; m.userData.ultCb = null; m.userData.ultPrev = null; m.needsUpdate = true;
    });
    patched.length = 0;
  }
  var mq = [], mqi = 0, mScan = 0;
  function special() {
    try { patch(groundMat, 1); } catch (e) { } try { patch(walkMat, 2); } catch (e) { } try { patch(roadMat, 3); } catch (e) { }
    try { leafMats.forEach(function (m) { patch(m, 5); }); patch(pineMat, 5); } catch (e) { }
  }
  function detailFrame(dt) {
    mScan -= dt;
    if (mScan <= 0) { mScan = 5; special(); mq.length = 0; mqi = 0; scene.traverse(function (o) { if (o.isMesh && !o.userData.ultra) mq.push(o); }); }
    var n = 0, lim = MOBILE ? 300 : 900;
    while (mqi < mq.length && n < lim) {
      var o = mq[mqi++]; n++; if (!o.parent) continue;
      var a = Array.isArray(o.material) ? o.material : [o.material];
      for (var i = 0; i < a.length; i++) { var m = a[i]; if (!m || m.transparent) continue; if (m.userData.ultK === undefined && m.userData.mgHD) continue; patch(m, 0); }
    }
  }

  /* ================= МОДЕЛИ (подменяются при постройке карты) ================= */
  var GEO = null;
  function geos() {
    if (GEO) return GEO;
    function blob(seed) {
      var g = new THREE.IcosahedronGeometry(.5, 1); if (g.index) g = g.toNonIndexed();
      var p = g.attributes.position;
      for (var i = 0; i < p.count; i++) { var x = p.getX(i), y = p.getY(i), z = p.getZ(i), k = 1 + (hash(Math.round(x * 50) + Math.round(y * 50) * 7, Math.round(z * 50), seed) - .5) * .36; p.setXYZ(i, x * k, y * k * .96, z * k); }
      g.computeVertexNormals(); return g;
    }
    function flat(g) { if (g.index) g = g.toNonIndexed(); g.computeVertexNormals(); return g; }
    var taper = new THREE.BoxGeometry(1, 1, 1), tp = taper.attributes.position;
    for (var i = 0; i < tp.count; i++) { if (tp.getY(i) > 0) { var z = tp.getZ(i); tp.setX(i, tp.getX(i) * .86); tp.setZ(i, z > 0 ? z * .70 : z * .84); } }
    taper = flat(taper);
    GEO = {
      blobs: [blob(1), blob(2), blob(3)],
      cone: flat(new THREE.ConeGeometry(.5, 1, 7)),
      trunk: new THREE.CylinderGeometry(.34, .52, 1, 7),
      pole: new THREE.CylinderGeometry(.3, .5, 1, 8),
      wheel: new THREE.CylinderGeometry(.5, .5, 1, 18),
      hub: new THREE.CylinderGeometry(.5, .5, 1, 10),
      taper: taper
    };
    return GEO;
  }
  /* Несколько коробок/цилиндров, запечённых в одну геометрию: одна деталь = один вызов отрисовки. */
  function bake(parts) {
    var P = [], N = [], T = [];
    parts.forEach(function (q) {
      var g = q.cyl ? new THREE.CylinderGeometry(.5, .5, 1, q.cyl) : new THREE.BoxGeometry(1, 1, 1);
      if (g.index) g = g.toNonIndexed();
      if (q.rz) g.rotateZ(q.rz); if (q.rx) g.rotateX(q.rx);
      g.scale(q.s[0], q.s[1], q.s[2]); g.translate(q.p[0], q.p[1], q.p[2]);
      var a = g.attributes; for (var i = 0; i < a.position.array.length; i++) { P.push(a.position.array[i]); N.push(a.normal.array[i]); }
      for (i = 0; i < a.uv.array.length; i++) T.push(a.uv.array[i]);
      g.dispose();
    });
    var out = new THREE.BufferGeometry();
    out.setAttribute('position', new THREE.BufferAttribute(new Float32Array(P), 3)); out.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(N), 3)); out.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(T), 2));
    out.computeBoundingSphere(); return out;
  }
  var UNIT = [1, 1, 1], ZERO = [0, 0, 0], BK = null;
  function baked() {
    if (BK) return BK;
    var hub = [], HP = Math.PI / 2;
    [-.85, .85].forEach(function (sx) { [-1.35, 1.35].forEach(function (sz) { hub.push({ cyl: 10, rz: HP, s: [.318, .383, .383], p: [sx, .33, sz] }); }); });
    BK = {
      carDark: bake([{ s: [1.96, .22, .18], p: [0, .37, 2.13] }, { s: [1.96, .22, .18], p: [0, .37, -2.13] }, { s: [1.93, .12, 3.9], p: [0, .26, 0] }, { s: [1.05, .2, .05], p: [0, .64, 2.115] }]),
      carLight: bake([{ s: [.52, .13, .04], p: [0, .40, 2.225] }, { s: [.52, .13, .04], p: [0, .40, -2.225] }, { s: [.03, .05, .17], p: [.958, .84, .12] }, { s: [.03, .05, .17], p: [-.958, .84, .12] }, { s: [.03, .05, .17], p: [.958, .84, -.82] }, { s: [.03, .05, .17], p: [-.958, .84, -.82] }]),
      carMirror: bake([{ s: [.17, .12, .2], p: [1.0, 1.06, .68] }, { s: [.17, .12, .2], p: [-1.0, 1.06, .68] }]),
      carHubs: bake(hub),
      lampBase: bake([{ cyl: 8, s: [.42, .5, .42], p: [0, .25, 0] }, { cyl: 8, s: [.24, .12, .24], p: [0, 5.2, 0] }]),
      lampHead: bake([{ s: [.52, .07, .78], p: [0, .02, 1.15] }, { s: [.08, .34, .08], p: [0, -.2, .28], rx: .75 }]),
      benchMetal: bake([{ s: [.07, .3, .5], p: [.9, .6, 0] }, { s: [.07, .3, .5], p: [-.9, .6, 0] }, { s: [.09, .05, .58], p: [.9, .77, .02] }, { s: [.09, .05, .58], p: [-.9, .77, .02] }]),
      benchLines: bake([{ s: [1.9, .014, .03], p: [0, .492, .085] }, { s: [1.9, .014, .03], p: [0, .492, -.085] }, { s: [1.9, .03, .012], p: [0, .77, -.205] }])
    };
    return BK;
  }
  function shade(c, k) { var col = new THREE.Color(c); col.multiplyScalar(k); col.r = Math.min(1, col.r); col.g = Math.min(1, col.g); col.b = Math.min(1, col.b); return col.getHex(); }

  function installModels() {
    var Gs = geos();
    /* --- деревья: гранёные кроны, сужающийся ствол, ещё один ярус у ёлок --- */
    if (typeof tree === 'function') {
      var oTree = tree;
      window.tree = tree = function (x, z, s) {
        var n0 = cityG.children.length, r = oTree.apply(this, arguments);
        try {
          var sc = s || 1, first = null, k = 0, cone0 = null;
          for (var i = n0; i < cityG.children.length; i++) {
            var m = cityG.children[i]; if (!m.isMesh) continue;
            if (m.geometry === G.sph) { m.geometry = Gs.blobs[(k++ + Math.floor(hash(x, z, 3) * 3)) % 3]; m.rotation.y = hash(x, z, k) * 6.28; if (!first) first = m; }
            else if (m.geometry === G.cone) { m.geometry = Gs.cone; m.rotation.y = hash(x, z, 5 + i) * 6.28; if (!cone0) cone0 = m; }
            else if (m.geometry === G.cyl) m.geometry = Gs.trunk;
          }
          if (first) {
            var e = M_(cityG, Gs.blobs[Math.floor(hash(x, z, 9) * 3)], first.material, [first.scale.x * .62, first.scale.y * .6, first.scale.z * .62],
              [first.position.x - first.scale.x * .3 * (hash(x, z, 11) - .2), first.position.y - first.scale.y * .12, first.position.z + first.scale.z * .3 * (hash(x, z, 12) - .5) * 2]);
            e.rotation.y = hash(x, z, 13) * 6.28;
          }
          if (cone0) { var c2 = M_(cityG, Gs.cone, cone0.material, [cone0.scale.x * 1.16, cone0.scale.y * .8, cone0.scale.z * 1.16], [cone0.position.x, cone0.position.y - cone0.scale.y * .36, cone0.position.z]); c2.rotation.y = hash(x, z, 17) * 6.28; }
        } catch (er) { U.note('tree', er); }
        return r;
      };
    }
    /* --- колёса: круглые шины и колпаки --- */
    function hubs(g, from, st) {
      var add = [];
      for (var i = from; i < g.children.length; i++) { var m = g.children[i]; if (m.isMesh && m.geometry === G.cyl && Math.abs(m.rotation.z - Math.PI / 2) < .01 && m.scale.x > .4 && m.scale.x < 1.1) { m.geometry = Gs.wheel; add.push(m); } }
      add.forEach(function (m) { M_(g, Gs.hub, 0xb9bdc6, [m.scale.x * .58, m.scale.y * 1.06, m.scale.z * .58], [m.position.x, m.position.y, m.position.z], [0, 0, Math.PI / 2], st); });
    }
    if (typeof car === 'function') {
      var oCar = car;
      window.car = car = function (parent, x, z, ry, color, dyn) {
        var g = oCar.apply(this, arguments);
        try {
          var park = !dyn && parent === cityG, st = !dyn && !park, ch = g.children, body = ch[0] && ch[0].material;
          for (var i = 1; i <= 3; i++) if (ch[i] && ch[i].isMesh && ch[i].geometry === G.box) ch[i].geometry = Gs.taper;
          for (i = 4; i < ch.length; i++) { var wm = ch[i]; if (wm.isMesh && wm.geometry === G.cyl && Math.abs(wm.rotation.z - Math.PI / 2) < .01) wm.geometry = Gs.wheel; }
          var B = baked();
          M_(g, B.carDark, 0x23262c, UNIT, ZERO, null, st); M_(g, B.carLight, 0xe6e8ea, UNIT, ZERO, null, st);
          M_(g, B.carMirror, body || 0x8a8f96, UNIT, ZERO, null, st); M_(g, B.carHubs, 0xb9bdc6, UNIT, ZERO, null, st);
        } catch (er) { U.note('car', er); }
        return g;
      };
    }
    if (typeof wheels === 'function') {
      var oWheels = wheels;
      window.wheels = wheels = function (g, pts, r, w) { var n0 = g.children.length, res = oWheels.apply(this, arguments); try { hubs(g, n0, false); } catch (er) { U.note('wheels', er); } return res; };
    }
    /* --- фонари: сужающийся столб, цоколь, кожух --- */
    function lampUp() {
      var L = cityG.children[cityG.children.length - 1]; if (!L || !L.isGroup || !L.children.length) return;
      var pole = L.children[0], arm = L.children[1];
      if (pole && pole.isMesh && pole.geometry === G.cyl) pole.geometry = Gs.pole;
      var B = baked();
      M_(L, B.lampBase, 0x3c4047, UNIT, ZERO, null, false);
      if (arm && arm.isGroup) M_(arm, B.lampHead, 0x3c4047, UNIT, ZERO, null, false);
    }
    if (typeof lamp === 'function') { var oLamp = lamp; window.lamp = lamp = function () { var r = oLamp.apply(this, arguments); try { lampUp(); } catch (er) { U.note('lamp', er); } return r; }; }
    if (typeof lampH === 'function') { var oLampH = lampH; window.lampH = lampH = function () { var r = oLampH.apply(this, arguments); try { lampUp(); } catch (er) { U.note('lampH', er); } return r; }; }
    /* --- скамейки: подлокотники и рейки --- */
    if (typeof bench === 'function') {
      var oBench = bench;
      window.bench = bench = function (parent, x, z, ry, color, st) {
        var g = oBench.apply(this, arguments);
        try {
          var s2 = parent === cityG ? false : st !== false, c = color || 0x8a5a34, dk = shade(c, .62);
          var B = baked();
          M_(g, B.benchMetal, 0x2c2f35, UNIT, ZERO, null, s2); M_(g, B.benchLines, dk, UNIT, ZERO, null, s2);
        } catch (er) { U.note('bench', er); }
        return g;
      };
    }
    /* --- здания: цоколь, карниз, парапет, мелочи на крыше (без коллизий, планировка прежняя) --- */
    if (typeof building === 'function') {
      var oB = building;
      window.building = building = function (x, z, w, d, h, color, o) {
        var m = oB.apply(this, arguments);
        try {
          o = o || {}; var top = m.userData.top, lo = m.userData.lo, hi = top - h;
          if (typeof top === 'number' && typeof lo === 'number' && w > 3 && d > 3) {
            box(cityG, w + .12, (hi + .45) - (lo - .4), d + .12, shade(color, .6), x, lo - .4, z);
            if (!o.noRoof) {
              box(cityG, w + .56, .28, d + .56, shade(color, 1.12), x, top - .3, z);
              if (w > 6 && d > 6) {
                var ph = .5, t = .22, yy = top + .6, W2 = w + .4, D2 = d + .4;
                box(cityG, W2, ph, t, roofMat, x, yy, z + D2 / 2 - t / 2); box(cityG, W2, ph, t, roofMat, x, yy, z - D2 / 2 + t / 2);
                box(cityG, t, ph, D2 - t * 2, roofMat, x + W2 / 2 - t / 2, yy, z); box(cityG, t, ph, D2 - t * 2, roofMat, x - W2 / 2 + t / 2, yy, z);
              }
              if (h >= 9 && w > 9 && d > 9) {
                var n = 1 + Math.floor(hash(x, z, 1) * 3);
                for (var i = 0; i < n; i++) { var px = x + (hash(x, z, 20 + i) - .5) * (w - 5), pz = z + (hash(x, z, 30 + i) - .5) * (d - 5); box(cityG, .9, .7, .9, 0x8b8f96, px, top + .6, pz); box(cityG, 1.06, .1, 1.06, 0x5c6068, px, top + 1.3, pz); }
                if (hash(x, z, 2) < .55) { var ax = x + (hash(x, z, 41) - .5) * (w - 4), az = z + (hash(x, z, 42) - .5) * (d - 4); M_(cityG, G.cyl, 0x565a61, [.07, 3.4, .07], [ax, top + 2.3, az]); M_(cityG, G.box, 0x565a61, [.9, .05, .05], [ax, top + 3.5, az]); M_(cityG, G.box, 0x565a61, [.6, .05, .05], [ax, top + 3.1, az]); }
              }
            }
          }
        } catch (er) { U.note('building', er); }
        return m;
      };
    }
    U.built.models = true;
  }

  function pre() { if (U.active && U.opt.models) installModels(); }
  var texOn = false;
  function sync() {
    var want = !!U.eff().tex;
    if (want && !texOn) { texOn = true; facadesOn(); mScan = 0; }
    else if (!want && texOn) off();
  }
  function off() { if (!texOn) return; texOn = false; try { facadesOff(); } catch (e) { U.note('facadesOff', e); } unpatchAll(); mq.length = 0; }
  function frame(dt) { if (texOn) detailFrame(dt); }
  U.reg('world', { title: 'Модели и текстуры', pre: pre, sync: sync, off: off, frame: frame, _draw: { win: drawWin, brick: drawBrick, modern: drawModern, wood: drawWood, em: drawEm }, _inject: inject });
})();
