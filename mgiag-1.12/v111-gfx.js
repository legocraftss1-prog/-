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
  var DEF = { texMap: true, texUI: true, water: true, fx: true, shadows: true, shadowQ: 1, tone: true, dist: 1.3, distC: 1, cam: 1, res: 1, gamma: 1, bright: 1, contrast: 1, sat: 1, fps: false, texQ: 1, fpsCap: 0 };
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
      GFX.opt.res = clampN(so.res, .5, 1.5, 1); GFX.opt.distC = clampN(so.distC, .5, 1.8, 1); GFX.opt.contrast = clampN(so.contrast, .7, 1.5, 1); GFX.opt.texQ = Math.round(clampN(so.texQ, 0, 2, 1)); GFX.opt.fpsCap = [0, 30, 45, 60].indexOf(+so.fpsCap) >= 0 ? +so.fpsCap : 0; GFX.opt.gamma = clampN(so.gamma, .7, 1.5, 1); GFX.opt.bright = clampN(so.bright, .7, 1.4, 1); GFX.opt.sat = clampN(so.sat, .5, 1.6, 1);
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
    var t = GFX.tier, O = GFX.opt, d = GFX.mode === 'hd' ? O.dist : O.distC;
    if (t >= 2 && GFX.mode === 'hd') d = Math.min(d, 1);
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
    var cv = renderer.domElement, O = GFX.opt;
    var g = O.gamma, b = O.bright, s = O.sat, c = O.contrast;
    if (Math.abs(g - 1) < .01 && Math.abs(b - 1) < .01 && Math.abs(s - 1) < .01 && Math.abs(c - 1) < .01) { cv.style.filter = ''; return; }
    var parts = [];
    if (Math.abs(g - 1) >= .01) {
      if (gammaSupported()) {
        if (!gammaSvg) { var d = document.createElement('div'); d.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden'; d.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0"><filter id="mg-gamma" color-interpolation-filters="sRGB"><feComponentTransfer><feFuncR type="gamma" amplitude="1" exponent="1" offset="0"/><feFuncG type="gamma" amplitude="1" exponent="1" offset="0"/><feFuncB type="gamma" amplitude="1" exponent="1" offset="0"/></feComponentTransfer></filter></svg>'; document.body.appendChild(d); gammaSvg = d; }
        gammaSvg.querySelectorAll('feFuncR,feFuncG,feFuncB').forEach(function (f) { f.setAttribute('exponent', String(1 / g)); });
        parts.push('url(#mg-gamma)');
      } else { parts.push('brightness(' + Math.pow(g, -.55).toFixed(3) + ')'); parts.push('contrast(' + (1 + (1 - g) * .25).toFixed(3) + ')'); }
    }
    if (Math.abs(b - 1) >= .01) parts.push('brightness(' + b + ')');
    if (Math.abs(c - 1) >= .01) parts.push('contrast(' + c + ')');
    if (Math.abs(s - 1) >= .01) parts.push('saturate(' + s + ')');
    cv.style.filter = parts.join(' ');
  }

  /* ---------- качество текстур (работает в обоих режимах) ---------- */
  function texMesh(o, seen) {
    var m = o.material; if (!m) return; var arr = Array.isArray(m) ? m : [m], q = GFX.opt.texQ;
    var maxA = (renderer.capabilities && renderer.capabilities.getMaxAnisotropy) ? renderer.capabilities.getMaxAnisotropy() : 1;
    arr.forEach(function (mm) {
      ['map', 'emissiveMap', 'alphaMap'].forEach(function (k) {
        var t = mm && mm[k]; if (!t || seen.has(t)) return; seen.add(t);
        if (!t.userData) t.userData = {};
        if (!t.userData.mgT) { if (q === 1) return; t.userData.mgT = { a: t.anisotropy, f: t.minFilter }; }
        var o0 = t.userData.mgT, na, nf;
        if (q === 1) { na = o0.a; nf = o0.f; }
        else if (q === 2) { na = Math.min(16, maxA); nf = o0.f; }
        else { na = 1; nf = THREE.LinearFilter; }
        if (t.anisotropy !== na || t.minFilter !== nf) { t.anisotropy = na; t.minFilter = nf; t.needsUpdate = true; }
      });
    });
  }
  function applyTexQ() { var seen = new Set(); scene.traverse(function (o) { if (o.isMesh) texMesh(o, seen); }); }

  /* ---------- общие настройки, действующие и в классике (нейтральные значения ничего не меняют) ---------- */
  function applyCommon() {
    saveOrig(); var O = GFX.opt;
    if (GFX.mode !== 'hd') {
      var d = O.distC, neutral = Math.abs(d - 1) < .001, rs = O.res;
      renderer.setPixelRatio(rs === 1 ? ORIG.pr : Math.max(.5, Math.min(ORIG.pr * rs, Math.max(ORIG.pr, (window.devicePixelRatio || 1) * 1.5)))); renderer.setSize(innerWidth, innerHeight, false);
      camera.far = neutral ? ORIG.far : Math.round(ORIG.far * d); camera.updateProjectionMatrix();
      window.MG_CULL = neutral ? ORIG.cullV : Math.round(420 * d); GFX.fogMul = neutral ? 1 : d;
    }
    applyScreen(); applyTexQ(); installCap();
  }

  /* ---------- лимит FPS: пропускаем отрисовку кадров сверх лимита ---------- */
  var capInstalled = false, lastRender = 0;
  function installCap() {
    if (capInstalled) return; capInstalled = true;
    var orig = renderer.render;
    renderer.render = function (a, b) {
      var cap = GFX.opt.fpsCap;
      if (cap) { var now = performance.now(); if (now - lastRender < 1000 / cap - 2.5) return; lastRender = now; }
      return orig.call(renderer, a, b);
    };
  }

  /* ---------- счётчик FPS ---------- */
  var fpsEl = null, fpsAcc = 0, fpsN = 0, fpsT = 0;
  function fpsTick(dt) {
    if (!GFX.opt.fps) { if (fpsEl) fpsEl.style.display = 'none'; return; }
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
    touchMats(); applyScreen(); applyTexQ(); installCap();
    GFX.applied = true;
  }
  function applyClassic() {
    if (!ORIG) { document.body.classList.remove('mg-hd'); GFX.applied = false; return; }
    renderer.toneMapping = ORIG.tone; renderer.toneMappingExposure = ORIG.exp;
    renderer.shadowMap.enabled = ORIG.shadow; sun.castShadow = false;
    renderer.setPixelRatio(ORIG.pr); renderer.setSize(innerWidth, innerHeight, false);
    camera.far = ORIG.far; camera.updateProjectionMatrix(); window.MG_CULL = ORIG.cullV;
    sun.target.position.set(0, 0, 0); sun.target.updateMatrixWorld();
    revertAll(); swapWater(false);
    if (dust) dust.visible = false;
    if (origPuff) { window.puffAt = puffAt = origPuff; origPuff = null; }
    GFX.fogMul = 1; document.body.classList.remove('mg-hd');
    touchMats(); GFX.applied = false; applyCommon();
  }
  GFX.set = function (mode) {
    GFX.mode = mode === 'hd' ? 'hd' : 'classic';
    try { localStorage.setItem(KEY, GFX.mode); } catch (e) { }
    if (!ready()) return;
    try { sync(); } catch (e) { console.error('[MG_GFX]', e); }
  };
  var LIVE = { dist: 1, cam: 1, res: 1, gamma: 1, bright: 1, sat: 1 };
  GFX.setOpt = function (key, val, live) {
    var lim = { dist: [.7, 1.8], distC: [.5, 1.8], cam: [.7, 2], res: [.5, 1.5], gamma: [.7, 1.5], bright: [.7, 1.4], contrast: [.7, 1.5], sat: [.5, 1.6] };
    if (lim[key]) val = clampN(val, lim[key][0], lim[key][1], DEF[key]);
    else if (key === 'shadowQ' || key === 'texQ') val = Math.round(clampN(val, 0, 2, 1));
    else if (key === 'fpsCap') val = [0, 30, 45, 60].indexOf(+val) >= 0 ? +val : 0;
    else val = !!val;
    GFX.opt[key] = val; saveOpt();
    if (!ready()) return;
    try {
      if (key === 'cam' || key === 'fps') return;
      saveOrig();
      if (key === 'gamma' || key === 'bright' || key === 'sat' || key === 'contrast') return applyScreen();
      if (key === 'texQ') return applyTexQ();
      if (key === 'fpsCap') return;
      if (GFX.mode !== 'hd') { if (key === 'dist' || key === 'distC' || key === 'res') applyCommon(); return; }
      if (key === 'dist') { var P = tierParams(); window.MG_CULL = P.cull; camera.far = P.far; camera.updateProjectionMatrix(); GFX.fogMul = P.fogMul; }
      else if (key === 'res') applyTier();
      else if (key !== 'distC') sync();
    } catch (e) { console.error('[MG_GFX]', e); }
  };
  GFX.reset = function () { GFX.opt = JSON.parse(JSON.stringify(DEF)); saveOpt(); if (ready()) { try { sync(); } catch (e) { console.error(e); } } };
  GFX.setAuto = function (on) { GFX.auto = !!on; try { localStorage.setItem('mg_gfx_auto', on ? '1' : '0'); } catch (e) { } };

  /* ---------- покадровая часть ---------- */
  var fpsEma = 16.7, lastT = performance.now(), slowFor = 0, ang = 0;
  function frame(dt) {
    var now = performance.now(), ft = now - lastT; lastT = now;
    fpsTick(dt);
    if (GFX.mode !== 'hd' && GFX.opt.texQ !== 1) { scanT -= dt; if (scanT <= 0) { scanT = 6; applyTexQ(); } }
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
    scanT -= dt; if (scanT <= 0) { scanT = 4; rescan(); if (GFX.opt.texQ !== 1) applyTexQ(); }
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
        var m = GFX.opt.cam;
        if (m === 1) return oc(dt);
        var base = window.CAMMUL; window.CAMMUL = (base || 1) * m;
        try { return oc(dt); } finally { window.CAMMUL = base; }
      };
      wc.__mgGfx = true; window.updCamera = updCamera = wc;
    }
    if (GFX.mode === 'hd' && !GFX.applied) { try { sync(); } catch (e) { console.error('[MG_GFX]', e); } }
    else if (GFX.mode !== 'hd') { try { applyCommon(); } catch (e) { console.error('[MG_GFX]', e); } }
    return true;
  }
  var tries = setInterval(function () { if (hook()) clearInterval(tries); }, 150);
  addEventListener('resize', function () { if (GFX.applied && ready()) { renderer.setPixelRatio(Math.max(.5, tierParams().pr)); } });

  /* ---------- интерфейс «улучшенной» графики (текстуры кнопок/панелей) ---------- */
  var css = document.createElement('style');
  css.textContent = [
    /* Улучшенный интерфейс: ТЁМНЫЕ панели и БЕЛЫЙ текст. Белый цвет задаём контейнерам, а у вложенных элементов
       с собственными цветами (кнопки, вкладки, отметки) — свои правила; остальное добивает автоконтраст (v112-settings.js). */
    'body.mg-hd{--glass:rgba(16,22,34,.72)}',
    'body.mg-hd #obj,body.mg-hd .tst,body.mg-hd #hpbar,body.mg-hd #coopPill,body.mg-hd #mini{backdrop-filter:blur(10px) saturate(1.3);-webkit-backdrop-filter:blur(10px) saturate(1.3);box-shadow:0 8px 28px rgba(0,0,0,.35),inset 0 1px 0 rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.18);color:#fff}',
    'body.mg-hd #sheet{background:linear-gradient(160deg,#242c40,#12161f);color:#fff;box-shadow:0 10px 0 rgba(0,0,0,.45),0 18px 40px rgba(0,0,0,.5);border:1px solid rgba(255,255,255,.18)}',
    'body.mg-hd #sheetBody{color:#fff;background-image:linear-gradient(90deg,transparent 32px,rgba(231,120,120,.55) 32px 34px,transparent 34px),repeating-linear-gradient(transparent 0 31px,rgba(255,255,255,.09) 31px 32px)}',
    'body.mg-hd #sheetBody h2,body.mg-hd .ti,body.mg-hd .ti .tx,body.mg-hd .ti .nm,body.mg-hd .sec,body.mg-hd .inv,body.mg-hd .inv span,body.mg-hd .row{color:#fff}',
    'body.mg-hd .ti .wh{opacity:.8}',
    'body.mg-hd .ti .st{color:#7be39b}',
    'body.mg-hd .sec{border-top-color:rgba(255,255,255,.28)}',
    'body.mg-hd #sheetFoot{border-top-color:rgba(255,255,255,.2)}',
    'body.mg-hd .tab{background:#2a3347;color:#fff;border-color:rgba(255,255,255,.45)}',
    'body.mg-hd .tab.act{background:#12161f;color:#ffcf4a}',
    'body.mg-hd .pbtn,body.mg-hd .inv button,body.mg-hd .chip{background:rgba(255,255,255,.13);color:#fff;border-color:rgba(255,255,255,.5)}',
    'body.mg-hd .pbtn.main,body.mg-hd .chip.act{background:linear-gradient(180deg,#ffb15a,#ff8a2a);color:#241100;border-color:#ffd9a8;box-shadow:0 4px 14px rgba(255,138,42,.4)}',
    'body.mg-hd #gText,body.mg-hd #sheet input,body.mg-hd #sheet select,body.mg-hd #sheet textarea{background:#0d1017;color:#fff;border-color:rgba(255,255,255,.5)}',
    'body.mg-hd #gErr{color:#ff9a90}',
    'body.mg-hd #dBox{background:rgba(16,20,30,.94);color:#fff;border-color:rgba(255,255,255,.45);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}',
    'body.mg-hd #dBox *{color:inherit}',
    'body.mg-hd #rightBtns button,body.mg-hd .sq{background:linear-gradient(180deg,rgba(255,255,255,.24),rgba(255,255,255,.08));color:#fff;box-shadow:0 4px 14px rgba(0,0,0,.35),inset 0 1px 0 rgba(255,255,255,.35);border:1px solid rgba(255,255,255,.3);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px)}',
    'body.mg-hd #title button{background:linear-gradient(180deg,#ffb15a,#ff6a13);color:#241100;box-shadow:0 6px 18px rgba(255,106,19,.45),inset 0 1px 0 rgba(255,255,255,.5)}',
    'body.mg-hd #title button.alt{background:linear-gradient(180deg,rgba(255,255,255,.2),rgba(255,255,255,.07));color:#fff;box-shadow:inset 0 1px 0 rgba(255,255,255,.3)}',
    'body.mg-hd #hpbar>*,body.mg-hd #hpbar{border-radius:12px}',
    'body.mg-hd #joyBase{box-shadow:0 0 0 2px rgba(255,255,255,.25),0 6px 20px rgba(0,0,0,.35);backdrop-filter:blur(4px)}'
  ].join('\n');
  document.head.appendChild(css);

  // Меню настроек графики теперь общее для всей игры: см. v112-settings.js (использует MG_GFX.setOpt / MG_GFX.set).
  GFX.defaults = DEF;
})();
