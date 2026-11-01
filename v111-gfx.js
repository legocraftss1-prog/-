/* =====================================================================
   МГИАГ 1.11 — ГРАФИКА: «Классическая» и «Улучшенная»
   Классическая = ничего не меняет (игра выглядит как раньше).
   Улучшенная = набор независимых настроек: текстуры карты, текстуры
   интерфейса, вода, эффекты, тени, тонировка, дальность прорисовки,
   отдаление камеры, разрешение, гамма/яркость/насыщенность, счётчик FPS.
   Всё обратимо без перезапуска. На слабых устройствах работает авто-снижение.
   ===================================================================== */
(function () {
  'use strict';
  var KEY = 'mg_gfx', OKEY = 'mg_gfx_opt2';
  var DEF = { texMap: true, texUI: true, water: true, fx: true, shadows: true, shadowQ: 1, tone: true, dist: 1.3, cam: 1, res: 1, gamma: 1, bright: 1, sat: 1, fps: false };
  var GFX = { mode: 'classic', tier: 0, auto: true, applied: false, opt: JSON.parse(JSON.stringify(DEF)), DEF: DEF };
  try { GFX.mode = localStorage.getItem(KEY) === 'hd' ? 'hd' : 'classic'; } catch (e) { }
  try { GFX.auto = localStorage.getItem('mg_gfx_auto') !== '0'; } catch (e) { }
  function clampN(v, a, b, d) { v = +v; return isFinite(v) ? Math.min(b, Math.max(a, v)) : d; }
  try {
    var so = JSON.parse(localStorage.getItem(OKEY) || 'null'), old = JSON.parse(localStorage.getItem('mg_gfx_opt') || 'null');
    if (!so && old) { // перенос настроек из первой версии 1.11
      so = { texMap: old.detail !== false, texUI: old.detail !== false, water: old.detail !== false, fx: old.detail !== false, shadows: old.light !== false, tone: old.light !== false, dist: old.dist, cam: old.cam };
    }
    if (so) {
      ['texMap', 'texUI', 'water', 'fx', 'shadows', 'tone', 'fps'].forEach(function (k) { if (so[k] !== undefined) GFX.opt[k] = !!so[k]; });
      GFX.opt.shadowQ = Math.round(clampN(so.shadowQ, 0, 2, 1)); GFX.opt.dist = clampN(so.dist, .7, 1.8, 1.3); GFX.opt.cam = clampN(so.cam, .7, 2, 1);
      GFX.opt.res = clampN(so.res, .5, 1, 1); GFX.opt.gamma = clampN(so.gamma, .7, 1.5, 1); GFX.opt.bright = clampN(so.bright, .7, 1.4, 1); GFX.opt.sat = clampN(so.sat, .5, 1.6, 1);
    }
  } catch (e) { }
  function saveOpt() { try { localStorage.setItem(OKEY, JSON.stringify(GFX.opt)); } catch (e) { } }
  window.MG_GFX = GFX;

  var MOBILE = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || (window.matchMedia && matchMedia('(pointer:coarse)').matches);
  GFX.mobile = MOBILE;

  function ready() { return typeof worldReady !== 'undefined' && worldReady && typeof THREE !== 'undefined' && typeof renderer !== 'undefined' && typeof scene !== 'undefined'; }

  var ORIG = null;
  function saveOrig() {
    if (ORIG) return;
    ORIG = { pr: renderer.getPixelRatio(), tone: renderer.toneMapping, exp: renderer.toneMappingExposure, shadow: renderer.shadowMap.enabled, far: camera.far, cullV: window.MG_CULL };
  }

  /* ---------- шейдерная «зернистость» материалов ---------- */
  var GRAIN_COMMON = [
    'varying vec3 vMgW;',
    'float mgH(vec3 p){p=fract(p*0.3183099+.1);p*=17.0;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}',
    'float mgN(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.0-2.0*f);',
    ' return mix(mix(mix(mgH(i),mgH(i+vec3(1,0,0)),f.x),mix(mgH(i+vec3(0,1,0)),mgH(i+vec3(1,1,0)),f.x),f.y),',
    '            mix(mix(mgH(i+vec3(0,0,1)),mgH(i+vec3(1,0,1)),f.x),mix(mgH(i+vec3(0,1,1)),mgH(i+vec3(1,1,1)),f.x),f.y),f.z);}',
    'vec3 mgGrain(vec3 w){',
    ' float d=length(cameraPosition-w);',
    ' float n=mgN(w*1.7)*.55+mgN(w*6.5)*.30;',
    MOBILE ? '' : ' n+=mgN(w*26.0)*.15*(1.0-smoothstep(10.0,45.0,d));',
    ' n*=1.0; return vec3(.80+.40*n);}'
  ].join('\n');

  function patchMat(m) {
    if (!m || m.userData.mgHD || !(m.isMeshLambertMaterial || m.isMeshPhongMaterial)) return;
    m.userData.mgHD = true;
    m.userData.mgPrev = { cb: m.onBeforeCompile, key: m.customProgramCacheKey };
    m.onBeforeCompile = function (sh) {
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vMgW;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvMgW=(modelMatrix*vec4(transformed,1.0)).xyz;');
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', '#include <common>\n' + GRAIN_COMMON)
        .replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.rgb*=mgGrain(vMgW);');
    };
    m.customProgramCacheKey = function () { return 'mgHD' + (MOBILE ? 'm' : 'd'); };
    m.needsUpdate = true;
  }
  function unpatchMat(m) {
    if (!m || !m.userData.mgHD) return;
    m.userData.mgHD = false;
    var p = m.userData.mgPrev || {};
    m.onBeforeCompile = p.cb || function () { };
    m.customProgramCacheKey = p.key || function () { return ''; };
    m.needsUpdate = true;
  }

  /* ---------- обход сцены порциями (чтобы не фризить) ---------- */
  var queue = [], qi = 0, scanT = 0;
  function rescan() { queue.length = 0; qi = 0; scene.traverse(function (o) { if (o.isMesh) queue.push(o); }); }
  function flagShadow(o) {
    var m = o.material; if (!m) return;
    var arr = Array.isArray(m) ? m : [m];
    if (GFX.opt.shadows) {
      var lit = arr.some(function (x) { return x.isMeshLambertMaterial || x.isMeshPhongMaterial; });
      var big = false;
      if (o.geometry) { if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere(); big = o.geometry.boundingSphere && o.geometry.boundingSphere.radius > 78 && !o.userData.merged; }
      o.receiveShadow = lit;
      o.castShadow = lit && !arr.some(function (x) { return x.transparent; }) && !big && !o.userData.noShadow;
    } else { o.castShadow = false; o.receiveShadow = false; }
    arr.forEach(GFX.opt.texMap ? patchMat : unpatchMat);
  }
  function processQueue(budget) { var n = 0; while (qi < queue.length && n < budget) { var o = queue[qi++]; if (o.parent) flagShadow(o); n++; } }
  function revertAll() {
    scene.traverse(function (o) {
      if (!o.isMesh) return; o.castShadow = false; o.receiveShadow = false;
      var arr = Array.isArray(o.material) ? o.material : [o.material]; arr.forEach(unpatchMat);
    });
  }

  /* ---------- шейдерная вода ---------- */
  var waterUniforms = { uT: { value: 0 }, uSky: { value: new THREE.Color(0xb7d2ea) }, uSun: { value: new THREE.Vector3(.4, .8, .3) } };
  var WATER_VS = '#include <fog_pars_vertex>\nvarying vec3 vW;varying vec3 vN;void main(){vec4 w=modelMatrix*vec4(position,1.0);vW=w.xyz;vN=normalize(mat3(modelMatrix)*normal);vec4 mvPosition=viewMatrix*w;gl_Position=projectionMatrix*mvPosition;\n#include <fog_vertex>\n}';
  var WATER_FS = [
    '#include <fog_pars_fragment>',
    'uniform float uT;uniform vec3 uSky;uniform vec3 uSun;varying vec3 vW;varying vec3 vN;',
    'float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
    'float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}',
    'void main(){',
    ' vec2 p=vW.xz;',
    ' float a=n(p*.35+vec2(uT*.20,uT*.13)), b=n(p*.9-vec2(uT*.31,uT*.22)), c=n(p*2.3+vec2(uT*.5,-uT*.4));',
    ' vec3 nn=normalize(vec3((a-.5)*.45+(b-.5)*.35+(c-.5)*.18,1.,(b-.5)*.45+(a-.5)*.3+(c-.5)*.2));',
    ' vec3 V=normalize(cameraPosition-vW);',
    ' float fr=pow(1.-clamp(dot(V,nn),0.,1.),3.);',
    ' vec3 deep=vec3(.05,.22,.34), shallow=vec3(.20,.50,.62);',
    ' vec3 col=mix(deep,shallow,.35+.4*a);',
    ' col=mix(col,uSky,fr*.85);',
    ' vec3 R=reflect(-V,nn); float sp=pow(max(dot(R,normalize(uSun)),0.),90.);',
    ' col+=vec3(1.,.95,.8)*sp*1.4;',
    ' col+=vec3(.9)*smoothstep(.78,.9,c)*.18;',
    ' gl_FragColor=vec4(col,.90);',
    ' #include <fog_fragment>',
    '}'
  ].join('\n');
  function makeWaterMat() {
    var m = new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, waterUniforms]),
      vertexShader: WATER_VS, fragmentShader: WATER_FS, transparent: true, fog: true
    });
    m.userData.mgWater = true; return m;
  }
  var hdWaterMat = null;
  // Другие модули (озеро) регистрируют свои меши воды: {mesh, classic: исходный материал}
  GFX.waterMeshes = [];
  GFX.registerWater = function (mesh, classicMat) {
    GFX.waterMeshes.push({ mesh: mesh, classic: classicMat });
    if (GFX.mode === 'hd' && GFX.applied && GFX.opt.water) { hdWaterMat = hdWaterMat || makeWaterMat(); mesh.material = hdWaterMat; }
  };
  function swapWater(hd) {
    if (hd && !hdWaterMat) hdWaterMat = makeWaterMat();
    GFX.waterMeshes.forEach(function (w) { w.mesh.material = hd ? hdWaterMat : w.classic; });
  }

  var dust = null;
  function makeDust() {
    var N = MOBILE ? 70 : 160, g = new THREE.BufferGeometry(), a = new Float32Array(N * 3);
    for (var i = 0; i < N; i++) { a[i * 3] = (Math.random() - .5) * 60; a[i * 3 + 1] = Math.random() * 14; a[i * 3 + 2] = (Math.random() - .5) * 60; }
    g.setAttribute('position', new THREE.BufferAttribute(a, 3));
    var m = new THREE.PointsMaterial({ color: 0xfff1cf, size: .12, transparent: true, opacity: .55, depthWrite: false, sizeAttenuation: true });
    var p = new THREE.Points(g, m); p.frustumCulled = false; p.userData.noShadow = true; p.userData.base = a; return p;
  }
  var origPuff = null;
  var sunTargetAdded = false;
  var SM = MOBILE ? [512, 1024, 1024] : [1024, 2048, 4096];
  function tierParams() {
    var t = GFX.tier, O = GFX.opt, d = O.dist;
    if (t >= 2) d = Math.min(d, 1);
    var q = Math.max(0, Math.round(O.shadowQ) - (t >= 1 ? 1 : 0));
    return {
      shadows: O.shadows && t < 2, sm: SM[Math.min(2, q)], half: MOBILE ? 42 : 70,
      pr: Math.min(window.devicePixelRatio || 1, MOBILE ? (t >= 1 ? 1.2 : 1.6) : (t >= 2 ? 1.25 : 2)) * O.res,
      cull: Math.min(760, Math.round(420 * d)), far: Math.min(1100, Math.round(620 * d)), fogMul: d,
      dust: O.fx && t < 2
    };
  }
  function touchMats() { scene.traverse(function (o) { if (o.isMesh) { var a = Array.isArray(o.material) ? o.material : [o.material]; a.forEach(function (m) { if (m) m.needsUpdate = true; }); } }); }
  function applyTier() {
    var P = tierParams();
    renderer.setPixelRatio(Math.max(.5, P.pr)); renderer.setSize(innerWidth, innerHeight, false);
    var wasShadow = renderer.shadowMap.enabled;
    renderer.shadowMap.enabled = P.shadows; sun.castShadow = P.shadows;
    if (P.shadows) {
      var s = sun.shadow; if (s.mapSize.x !== P.sm) { s.mapSize.set(P.sm, P.sm); if (s.map) { s.map.dispose(); s.map = null; } }
      var c = s.camera; c.left = -P.half; c.right = P.half; c.top = P.half; c.bottom = -P.half; c.near = 1; c.far = 320; c.updateProjectionMatrix();
      s.bias = -0.0009; s.normalBias = 0.06;
    }
    if (wasShadow !== P.shadows) touchMats();
    window.MG_CULL = P.cull; camera.far = P.far; camera.updateProjectionMatrix();
    GFX.fogMul = P.fogMul;
    if (dust) dust.visible = P.dust;
  }
  GFX.fogMul = 1;

  /* ---------- экран: гамма, яркость, насыщенность (CSS-фильтр на холсте) ---------- */
  var gammaSvg = null, gammaOK = null;
  function gammaSupported() { if (gammaOK === null) { try { gammaOK = !!(window.CSS && CSS.supports && CSS.supports('filter', 'url(#a)')) && !/iPhone|iPad|iPod/i.test(navigator.userAgent); } catch (e) { gammaOK = false; } } return gammaOK; }
  GFX.gammaSupported = gammaSupported;
  function applyScreen() {
    var cv = renderer.domElement, O = GFX.opt, on = GFX.mode === 'hd';
    var g = on ? O.gamma : 1, b = on ? O.bright : 1, s = on ? O.sat : 1;
    if (!on || (Math.abs(g - 1) < .01 && Math.abs(b - 1) < .01 && Math.abs(s - 1) < .01)) { cv.style.filter = ''; return; }
    var parts = [];
    if (Math.abs(g - 1) >= .01) {
      if (gammaSupported()) {
        if (!gammaSvg) { var d = document.createElement('div'); d.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden'; d.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0"><filter id="mg-gamma" color-interpolation-filters="sRGB"><feComponentTransfer><feFuncR type="gamma" amplitude="1" exponent="1" offset="0"/><feFuncG type="gamma" amplitude="1" exponent="1" offset="0"/><feFuncB type="gamma" amplitude="1" exponent="1" offset="0"/></feComponentTransfer></filter></svg>'; document.body.appendChild(d); gammaSvg = d; }
        gammaSvg.querySelectorAll('feFuncR,feFuncG,feFuncB').forEach(function (f) { f.setAttribute('exponent', String(1 / g)); });
        parts.push('url(#mg-gamma)');
      } else { // запасной вариант для устройств без SVG-фильтров (iPhone): приближение яркостью и контрастом
        parts.push('brightness(' + Math.pow(g, -.55).toFixed(3) + ')'); parts.push('contrast(' + (1 + (1 - g) * .25).toFixed(3) + ')');
      }
    }
    if (Math.abs(b - 1) >= .01) parts.push('brightness(' + b + ')');
    if (Math.abs(s - 1) >= .01) parts.push('saturate(' + s + ')');
    cv.style.filter = parts.join(' ');
  }

  /* ---------- счётчик FPS ---------- */
  var fpsEl = null, fpsAcc = 0, fpsN = 0, fpsT = 0;
  function fpsTick(dt) {
    if (!GFX.opt.fps || GFX.mode !== 'hd') { if (fpsEl) fpsEl.style.display = 'none'; return; }
    if (!fpsEl) { fpsEl = document.createElement('div'); fpsEl.style.cssText = 'position:fixed;right:6px;bottom:calc(env(safe-area-inset-bottom,0px) + 6px);z-index:70;background:rgba(0,0,0,.6);color:#9dff9d;font:700 12px monospace;padding:3px 7px;border-radius:7px;pointer-events:none'; document.body.appendChild(fpsEl); }
    fpsEl.style.display = 'block'; fpsAcc += dt; fpsN++; fpsT += dt;
    if (fpsT >= .5) { fpsEl.textContent = Math.round(fpsN / fpsT) + ' FPS' + (GFX.tier ? ' · ур.' + GFX.tier : ''); fpsT = 0; fpsN = 0; }
  }

  /* ---------- применение режимов ---------- */
  function sync() {
    if (GFX.mode !== 'hd') return applyClassic();
    saveOrig();
    var O = GFX.opt;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = O.tone ? THREE.ACESFilmicToneMapping : ORIG.tone;
    renderer.toneMappingExposure = O.tone ? 1.12 : ORIG.exp;
    if (!sunTargetAdded) { scene.add(sun.target); sunTargetAdded = true; }
    if (!O.shadows) { sun.target.position.set(0, 0, 0); sun.target.updateMatrixWorld(); }
    applyTier();
    swapWater(O.water);
    if (O.fx && !dust) { dust = makeDust(); scene.add(dust); }
    if (dust) dust.visible = tierParams().dust;
    if (O.fx) {
      if (typeof puffAt === 'function' && !origPuff) { origPuff = puffAt; window.puffAt = puffAt = function (x, y, z, c, n) { return origPuff(x, y, z, c, Math.max(1, Math.round((n || 1) * (MOBILE ? 1.3 : 1.8)))); }; }
    } else if (origPuff) { window.puffAt = puffAt = origPuff; origPuff = null; }
    document.body.classList.toggle('mg-hd', !!O.texUI);
    scene.traverse(function (o) { if (o.isMesh) { o.castShadow = false; o.receiveShadow = false; } });
    rescan(); processQueue(MOBILE ? 800 : 2500);
    touchMats(); applyScreen();
    GFX.applied = true;
  }
  function applyClassic() {
    if (!ORIG) { document.body.classList.remove('mg-hd'); GFX.applied = false; try { applyScreen(); } catch (e) { } return; }
    renderer.toneMapping = ORIG.tone; renderer.toneMappingExposure = ORIG.exp;
    renderer.shadowMap.enabled = ORIG.shadow; sun.castShadow = false;
    renderer.setPixelRatio(ORIG.pr); renderer.setSize(innerWidth, innerHeight, false);
    camera.far = ORIG.far; camera.updateProjectionMatrix(); window.MG_CULL = ORIG.cullV;
    sun.target.position.set(0, 0, 0); sun.target.updateMatrixWorld();
    revertAll(); swapWater(false);
    if (dust) dust.visible = false;
    if (origPuff) { window.puffAt = puffAt = origPuff; origPuff = null; }
    GFX.fogMul = 1; document.body.classList.remove('mg-hd');
    touchMats(); applyScreen(); GFX.applied = false;
  }
  GFX.set = function (mode) {
    GFX.mode = mode === 'hd' ? 'hd' : 'classic';
    try { localStorage.setItem(KEY, GFX.mode); } catch (e) { }
    if (!ready()) return;
    try { sync(); } catch (e) { console.error('[MG_GFX]', e); }
  };
  var LIVE = { dist: 1, cam: 1, res: 1, gamma: 1, bright: 1, sat: 1 };
  GFX.setOpt = function (key, val, live) {
    var lim = { dist: [.7, 1.8], cam: [.7, 2], res: [.5, 1], gamma: [.7, 1.5], bright: [.7, 1.4], sat: [.5, 1.6] };
    if (lim[key]) val = clampN(val, lim[key][0], lim[key][1], DEF[key]); else if (key === 'shadowQ') val = Math.round(clampN(val, 0, 2, 1)); else val = !!val;
    GFX.opt[key] = val; saveOpt();
    if (!ready() || GFX.mode !== 'hd') return;
    try {
      if (key === 'cam') return;
      if (key === 'dist') { var P = tierParams(); window.MG_CULL = P.cull; camera.far = P.far; camera.updateProjectionMatrix(); GFX.fogMul = P.fogMul; }
      else if (key === 'res') applyTier();
      else if (key === 'gamma' || key === 'bright' || key === 'sat') applyScreen();
      else if (key === 'fps') { }
      else sync();
    } catch (e) { console.error('[MG_GFX]', e); }
  };
  GFX.reset = function () { GFX.opt = JSON.parse(JSON.stringify(DEF)); saveOpt(); if (ready() && GFX.mode === 'hd') { try { sync(); } catch (e) { console.error(e); } } };
  GFX.setAuto = function (on) { GFX.auto = !!on; try { localStorage.setItem('mg_gfx_auto', on ? '1' : '0'); } catch (e) { } };

  /* ---------- покадровая часть ---------- */
  var fpsEma = 16.7, lastT = performance.now(), slowFor = 0, ang = 0;
  function frame(dt) {
    var now = performance.now(), ft = now - lastT; lastT = now;
    fpsTick(dt);
    if (GFX.mode !== 'hd' || !GFX.applied) return;
    if (ft < 250) fpsEma += (ft - fpsEma) * .05;
    if (GFX.auto && typeof started !== 'undefined' && started) {
      if (fpsEma > 27) slowFor += dt; else slowFor = 0;
      if (slowFor > 3 && GFX.tier < 3) { GFX.tier++; slowFor = 0; applyTier(); if (typeof toast === 'function') toast('⚙️ Улучшенная графика: качество снижено для плавности'); }
    }
    if (renderer.shadowMap.enabled && typeof player !== 'undefined' && player) {
      var p = player.drive ? player.drive.pos : player.pos;
      if (p) { sun.position.add(p); sun.target.position.set(p.x, p.y || 0, p.z); sun.target.updateMatrixWorld(); }
    }
    if (dust && dust.visible && typeof player !== 'undefined' && player) {
      var q = player.drive ? player.drive.pos : player.pos; ang += dt * .4;
      dust.position.set(q.x, (q.y || 0), q.z);
      var b = dust.userData.base, a = dust.geometry.attributes.position.array;
      for (var i = 0; i < a.length; i += 3) { a[i] = b[i] + Math.sin(ang + i) * .8; a[i + 1] = b[i + 1] % 14 + Math.sin(ang * 1.3 + i) * .3; a[i + 2] = b[i + 2] + Math.cos(ang + i * .7) * .8; }
      dust.geometry.attributes.position.needsUpdate = true;
      var nt = (typeof night !== 'undefined') ? night : 0; dust.material.opacity = (typeof WORLD !== 'undefined' && WORLD.weather === 'rain') ? 0 : .5 - .3 * (nt || 0);
    }
    waterUniforms.uT.value += dt;
    if (typeof sun !== 'undefined') waterUniforms.uSun.value.copy(sun.position).sub(sun.target.position).normalize();
    if (typeof scene !== 'undefined' && scene.background) waterUniforms.uSky.value.copy(scene.background);
    if (typeof fog !== 'undefined' && GFX.fogMul !== 1) { fog.far *= GFX.fogMul; if (GFX.fogMul > 1) fog.near *= (1 + (GFX.fogMul - 1) * .6); }
    scanT -= dt; if (scanT <= 0) { scanT = 4; rescan(); }
    processQueue(MOBILE ? 500 : 1200);
  }

  /* ---------- встраивание в игровой цикл ---------- */
  function hook() {
    if (!ready()) return false;
    if (typeof updEnv === 'function' && !updEnv.__mgGfx) {
      var orig = updEnv;
      var wrapped = function (dt, t) { orig(dt, t); try { frame(dt); } catch (e) { console.error('[MG_GFX frame]', e); GFX.mode = 'classic'; try { applyClassic(); } catch (e2) { } } };
      wrapped.__mgGfx = true; window.updEnv = updEnv = wrapped;
    }
    // отдаление камеры: временно умножаем игровой множитель CAMMUL на пользовательский (не мешает событиям «гигант»/«крошка»)
    if (typeof updCamera === 'function' && !updCamera.__mgGfx) {
      var oc = updCamera;
      var wc = function (dt) {
        var m = (GFX.mode === 'hd') ? GFX.opt.cam : 1;
        if (m === 1) return oc(dt);
        var base = window.CAMMUL; window.CAMMUL = (base || 1) * m;
        try { return oc(dt); } finally { window.CAMMUL = base; }
      };
      wc.__mgGfx = true; window.updCamera = updCamera = wc;
    }
    if (GFX.mode === 'hd' && !GFX.applied) { try { sync(); } catch (e) { console.error('[MG_GFX]', e); } }
    return true;
  }
  var tries = setInterval(function () { if (hook()) clearInterval(tries); }, 150);
  addEventListener('resize', function () { if (GFX.applied && ready()) { renderer.setPixelRatio(Math.max(.5, tierParams().pr)); } });

  /* ---------- интерфейс «улучшенной» графики (текстуры кнопок/панелей) ---------- */
  var css = document.createElement('style');
  css.textContent = [
    'body.mg-hd{--glass:rgba(16,22,34,.58)}',
    'body.mg-hd #obj,body.mg-hd #sheet,body.mg-hd #dBox,body.mg-hd #phCard,body.mg-hd .tst,body.mg-hd #hpbar,body.mg-hd #coopPill,body.mg-hd #mini{backdrop-filter:blur(10px) saturate(1.3);-webkit-backdrop-filter:blur(10px) saturate(1.3);box-shadow:0 8px 28px rgba(0,0,0,.35),inset 0 1px 0 rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.18)}',
    'body.mg-hd #sheet{background:linear-gradient(160deg,rgba(32,42,62,.82),rgba(14,18,28,.88))}',
    'body.mg-hd #rightBtns button,body.mg-hd .sq{background:linear-gradient(180deg,rgba(255,255,255,.22),rgba(255,255,255,.08));box-shadow:0 4px 14px rgba(0,0,0,.35),inset 0 1px 0 rgba(255,255,255,.35);border:1px solid rgba(255,255,255,.25);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px)}',
    'body.mg-hd .pbtn.main,body.mg-hd #title button{background:linear-gradient(180deg,#ffb15a,#ff6a13);box-shadow:0 6px 18px rgba(255,106,19,.45),inset 0 1px 0 rgba(255,255,255,.5)}',
    'body.mg-hd #title button.alt{background:linear-gradient(180deg,rgba(255,255,255,.18),rgba(255,255,255,.06));box-shadow:inset 0 1px 0 rgba(255,255,255,.3)}',
    'body.mg-hd #hpbar>*,body.mg-hd #hpbar{border-radius:12px}',
    'body.mg-hd #joyBase{box-shadow:0 0 0 2px rgba(255,255,255,.25),0 6px 20px rgba(0,0,0,.35);backdrop-filter:blur(4px)}'
  ].join('\n');
  document.head.appendChild(css);

  /* ---------- настройки (телефон → ⚙️) ---------- */
  function hookSettings() {
    if (typeof renderPhone !== 'function' || renderPhone.__mgGfx) return false;
    var prev = renderPhone;
    var w = function () {
      prev.apply(this, arguments);
      try {
        if (typeof phoneApp === 'undefined' || phoneApp !== 'settings') return;
        var b = document.getElementById('sheetBody'); if (!b || b.querySelector('[data-mg-gfx]')) return;
        var box = document.createElement('div'); box.setAttribute('data-mg-gfx', '1'); box.style.cssText = 'margin:8px 0 12px;padding:10px;border-radius:14px;background:rgba(255,255,255,.07)';
        function H(t) { var h = document.createElement('div'); h.style.cssText = 'font-weight:900;font-size:' + (t.big ? 16 : 13) + 'px;margin:' + (t.big ? '0 0 8px' : '14px 0 2px') + ';' + (t.big ? '' : 'color:#ffcf4a;text-transform:uppercase;letter-spacing:.5px'); h.textContent = t.t; return h; }
        box.appendChild(H({ t: '🎨 Графика', big: true }));
        var row = document.createElement('div'); row.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap';
        function modeBtn(label, sub, mode) {
          var x = document.createElement('button'); x.className = 'pbtn' + (GFX.mode === mode ? ' main' : ''); x.style.cssText = 'flex:1;min-width:140px;text-align:left;padding:10px 12px';
          x.innerHTML = '<b>' + label + '</b><br><small style="opacity:.8">' + sub + '</small>';
          x.onclick = function () { GFX.set(mode); renderPhone(); if (typeof toast === 'function') toast(mode === 'hd' ? '✨ Улучшенная графика включена' : '🎞️ Классическая графика включена'); };
          return x;
        }
        row.appendChild(modeBtn('🎞️ Классическая', 'Как раньше. Быстро на любых устройствах.', 'classic'));
        row.appendChild(modeBtn('✨ Улучшенная', 'Настраиваемая: свет, текстуры, вода, экран.', 'hd'));
        box.appendChild(row);
        if (GFX.mode === 'hd') {
          function tog(label, sub, key) {
            var x = document.createElement('button'); x.className = 'pbtn' + (GFX.opt[key] ? ' main' : ''); x.style.cssText = 'margin-top:6px;width:100%;text-align:left;padding:9px 12px';
            x.innerHTML = (GFX.opt[key] ? '✅ ' : '⬜ ') + '<b>' + label + '</b>' + (sub ? '<br><small style="opacity:.8">' + sub + '</small>' : '');
            x.onclick = function () { GFX.setOpt(key, !GFX.opt[key]); renderPhone(); }; return x;
          }
          function slider(label, key, min, max, step, fmt) {
            var wd = document.createElement('div'); wd.style.cssText = 'margin-top:10px';
            var l = document.createElement('div'); l.style.cssText = 'display:flex;justify-content:space-between;font-weight:800;font-size:14px';
            var nm = document.createElement('span'); nm.textContent = label; var val = document.createElement('span'); val.textContent = fmt(GFX.opt[key]); l.appendChild(nm); l.appendChild(val);
            var r = document.createElement('input'); r.type = 'range'; r.min = min; r.max = max; r.step = step; r.value = GFX.opt[key]; r.style.cssText = 'width:100%;margin-top:4px';
            r.oninput = function () { val.textContent = fmt(+r.value); GFX.setOpt(key, +r.value, true); };
            r.onchange = function () { GFX.setOpt(key, +r.value); };
            ['pointerdown', 'touchstart', 'mousedown', 'touchmove'].forEach(function (ev) { r.addEventListener(ev, function (e) { e.stopPropagation(); }, { passive: true }); });
            wd.appendChild(l); wd.appendChild(r); return wd;
          }
          var pc = function (v) { return Math.round(v * 100) + '%'; };
          box.appendChild(H({ t: '🗺️ Карта и объекты' }));
          box.appendChild(tog('Текстуры карты', 'Зернистость и детали на земле, стенах, дорогах.', 'texMap'));
          box.appendChild(tog('Вода и отражения', 'Волны, отражение неба, блики солнца.', 'water'));
          box.appendChild(H({ t: '🔘 Интерфейс' }));
          box.appendChild(tog('Текстуры кнопок и панелей', 'Стеклянные панели, объёмные кнопки, мягкие тени.', 'texUI'));
          box.appendChild(H({ t: '💡 Свет' }));
          box.appendChild(tog('Тени от солнца', 'Заметно нагружает телефон.', 'shadows'));
          if (GFX.opt.shadows) { var qn = ['Низкое', 'Среднее', 'Высокое']; var qb = document.createElement('button'); qb.className = 'pbtn'; qb.style.cssText = 'margin-top:6px;width:100%;text-align:left;padding:9px 12px'; qb.innerHTML = '🔲 Качество теней: <b>' + qn[GFX.opt.shadowQ] + '</b> (нажми, чтобы сменить)'; qb.onclick = function () { GFX.setOpt('shadowQ', (GFX.opt.shadowQ + 1) % 3); renderPhone(); }; box.appendChild(qb); }
          box.appendChild(tog('Кинематографичная тонировка', 'Мягкие света и глубокие тени.', 'tone'));
          box.appendChild(H({ t: '✨ Эффекты' }));
          box.appendChild(tog('Частицы и эффекты', 'Больше дыма и пыли, лёгкая пыльца в воздухе.', 'fx'));
          box.appendChild(H({ t: '🎥 Обзор и камера' }));
          box.appendChild(slider('🔭 Дальность прорисовки', 'dist', .7, 1.8, .05, pc));
          box.appendChild(slider('📷 Отдаление камеры', 'cam', .7, 2, .05, pc));
          box.appendChild(slider('🖼️ Разрешение картинки', 'res', .5, 1, .05, pc));
          box.appendChild(H({ t: '🖥️ Экран' }));
          box.appendChild(slider('🌗 Гамма', 'gamma', .7, 1.5, .02, function (v) { return v.toFixed(2); }));
          box.appendChild(slider('☀️ Яркость', 'bright', .7, 1.4, .02, pc));
          box.appendChild(slider('🎨 Насыщенность', 'sat', .5, 1.6, .02, pc));
          if (!gammaSupported()) { var gn = document.createElement('div'); gn.style.cssText = 'opacity:.7;font-size:12px;margin-top:4px'; gn.textContent = 'На этом устройстве гамма эмулируется яркостью и контрастом.'; box.appendChild(gn); }
          box.appendChild(tog('Показывать FPS', '', 'fps'));
          var au = document.createElement('button'); au.className = 'pbtn'; au.style.cssText = 'margin-top:6px;width:100%;text-align:left;padding:9px 12px';
          au.textContent = (GFX.auto ? '✅' : '⬜') + ' Авто-снижение качества, если лагает' + (GFX.tier ? ' (сейчас уровень ' + GFX.tier + ')' : '');
          au.onclick = function () { GFX.setAuto(!GFX.auto); if (GFX.auto) { GFX.tier = 0; applyTier(); } renderPhone(); };
          box.appendChild(au);
          var rs = document.createElement('button'); rs.className = 'pbtn'; rs.style.cssText = 'margin-top:6px;width:100%;padding:9px 12px'; rs.textContent = '↺ Сбросить улучшенную графику к рекомендуемой'; rs.onclick = function () { GFX.reset(); GFX.tier = 0; renderPhone(); }; box.appendChild(rs);
        }
        var first = b.querySelector('h2'); if (first && first.nextSibling) b.insertBefore(box, first.nextSibling); else b.appendChild(box);
      } catch (e) { console.error('[MG_GFX settings]', e); }
    };
    w.__mgGfx = true; window.renderPhone = renderPhone = w; return true;
  }
  var t2 = setInterval(function () { if (ready() && hookSettings()) clearInterval(t2); }, 200);
})();
