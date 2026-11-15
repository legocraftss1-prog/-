/* =====================================================================
   МГИАГ 1.14 — ULTRA: небо, свет по времени суток, мягкие тени, отражения.
   Работает только в городе. В помещениях, под водой и при выключенном
   режиме всё остаётся как в обычной игре.
   ===================================================================== */
(function () {
  'use strict';
  var U = window.MG_ULTRA; if (!U || typeof THREE === 'undefined') return;
  var MOBILE = U.mobile;
  function sm(a, b, x) { var t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); }
  function mix(a, b, t) { return a + (b - a) * t; }
  function c01(x) { return Math.min(1, Math.max(0, x)); }

  var SKY_VS = [
    'varying vec3 vDir;',
    'void main(){ vDir=position; vec4 p=modelViewMatrix*vec4(position,1.0); gl_Position=projectionMatrix*p; }'
  ].join('\n');
  var SKY_FS = [
    'uniform vec3 uSun; uniform vec3 uMoon; uniform vec3 uZen; uniform vec3 uHor; uniform vec3 uHorB; uniform vec3 uSunCol; uniform vec3 uCloudCol; uniform vec3 uCloudShade;',
    'uniform float uT; uniform float uCover; uniform float uStars; uniform float uSunVis; uniform float uMoonVis;',
    'varying vec3 vDir;',
    'float h21(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }',
    'float h31(vec3 p){ p=fract(p*0.3183099+0.1); p*=17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }',
    'float n2(vec2 p){ vec2 i=floor(p); vec2 f=fract(p); f=f*f*(3.0-2.0*f);',
    ' return mix(mix(h21(i),h21(i+vec2(1.0,0.0)),f.x),mix(h21(i+vec2(0.0,1.0)),h21(i+vec2(1.0,1.0)),f.x),f.y); }',
    'float fbm(vec2 p){ float a=0.5; float s=0.0;',
    ' for(int i=0;i<OCT;i++){ s+=a*n2(p); p=p*2.03+vec2(17.3,9.1); a*=0.5; }',
    ' return s; }',
    'void main(){',
    ' vec3 d=normalize(vDir);',
    ' float y=max(d.y,0.0);',
    ' float k=pow(1.0-y,3.2);',
    ' float az=dot(normalize(d.xz+vec2(0.0001)),normalize(uSun.xz+vec2(0.0001)));',
    ' vec3 hor=mix(uHorB,uHor,smoothstep(-0.7,0.9,az));',
    ' vec3 col=mix(uZen,hor,k);',
    ' col=mix(col,hor*0.94,smoothstep(0.0,-0.3,d.y));',
    ' float sd=max(dot(d,uSun),0.0);',
    ' col+=uSunCol*(pow(sd,6.0)*0.14+pow(sd,48.0)*0.30)*uSunVis;',
    ' col+=uSunCol*smoothstep(0.99935,0.99965,sd)*2.5*uSunVis;',
    ' if(uStars>0.01){',
    '  vec3 q=d*170.0; vec3 g=floor(q); vec3 f=fract(q)-0.5; float hh=h31(g);',
    '  float st=step(0.9930,hh)*smoothstep(0.30,0.02,length(f));',
    '  st*=0.6+0.4*sin(uT*2.0+hh*90.0);',
    '  col+=vec3(0.90,0.95,1.0)*st*uStars*smoothstep(0.0,0.25,d.y);',
    ' }',
    ' float md=max(dot(d,uMoon),0.0);',
    ' float disc=smoothstep(0.99900,0.99925,md);',
    ' vec3 moonC=vec3(0.93,0.95,1.0)*(0.82+0.18*n2(d.xy*70.0+d.zx*40.0));',
    ' col=mix(col,moonC,disc*uMoonVis);',
    ' col+=vec3(0.45,0.55,0.85)*pow(md,160.0)*0.22*uMoonVis;',
    ' if(d.y>-0.03){',
    '  vec2 uv=d.xz/(d.y+0.16);',
    '  vec2 w=uv*0.85+vec2(uT*0.006,uT*0.0035);',
    '  float n=fbm(w);',
    '  float c=smoothstep(1.0-uCover,1.0-uCover+0.30,n);',
    '  float nl=fbm(w+uSun.xz*0.11);',
    '  float lit=clamp((n-nl)*2.4+0.62,0.0,1.0);',
    '  vec3 cc=mix(uCloudShade,uCloudCol,lit);',
    '  cc+=uSunCol*pow(sd,5.0)*0.22*uSunVis;',
    '  float fade=smoothstep(-0.03,0.16,d.y);',
    '  col=mix(col,cc,c*fade*0.93);',
    ' }',
    ' gl_FragColor=vec4(col,1.0);',
    '}'
  ].join('\n');
  U.SKY_SRC = { vs: SKY_VS, fs: SKY_FS };

  var S = { dome: null, mat: null, skyOn: false, lightOn: false, shOn: false, reflOn: false, cube: null, cubeCam: null, cubeScene: null, cubeT: 0, specs: null, reflMats: [], orig: null };
  var sd = new THREE.Vector3(), md = new THREE.Vector3(), ld = new THREE.Vector3(0, 1, 0), right = new THREE.Vector3(), up2 = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0), cen = new THREE.Vector3();
  var cZen = new THREE.Color(), cHor = new THREE.Color(), cHorB = new THREE.Color(), cFog = new THREE.Color(), cSun = new THREE.Color(), cCl = new THREE.Color(), cSh = new THREE.Color(), cA = new THREE.Color(), cB = new THREE.Color(), cHemi = new THREE.Color(), cGnd = new THREE.Color();
  var P = { day: 1, nightK: 0, e: 1, cover: .4, sunVis: 1, moonVis: 0, stars: 0, sunI: 1, moonI: 0 };
  U.skyState = P; U.sunDir = ld; U.horizon = cFog; U.sunColor = cSun;

  /* 1 — город (настоящее время суток); 2 — районы 1.12 (в игре там всегда ночь, поэтому небо ночное); 0 — помещения и прочее. */
  var DISTRICTS = { dock: 1, neon: 1, green: 1, biz: 1 };
  function where() { if (typeof area === 'undefined') return 0; if (area === 'city') return 1; return DISTRICTS[area] ? 2 : 0; }
  function special() {
    try { if (window.MG_WATER && MG_WATER.under) return true; if (typeof RC !== 'undefined' && RC.cur && RC.cur.id === 'disco') return true; if (typeof hemiOverride !== 'undefined' && hemiOverride !== null) return true; } catch (e) { }
    return false;
  }
  function num(v) { return typeof v === 'number' && isFinite(v) ? v : 0; }
  function wx() { return { cl: num(typeof cloudI !== 'undefined' ? cloudI : 0), fg: num(typeof fogI !== 'undefined' ? fogI : 0), rn: num(typeof rainI !== 'undefined' ? rainI : 0), sn: num(typeof snowI !== 'undefined' ? snowI : 0), wet: num(typeof wet !== 'undefined' ? wet : 0) }; }

  /* Палитра неба и света для текущего времени и погоды. */
  function compute(fixedT) {
    var t = typeof fixedT === 'number' ? fixedT : (typeof WORLD !== 'undefined' && typeof WORLD.t === 'number') ? WORLD.t : 12;
    var ang = (t - 6) / 12 * Math.PI;
    sd.set(Math.cos(ang) * 80, Math.sin(ang) * 90, 30).normalize();
    md.set(-Math.cos(ang) * 80, -Math.sin(ang) * 90, -24).normalize();
    var e = sd.y, day = sm(-.08, .22, e), twi = 1 - sm(0, .34, Math.abs(e)), nightK = 1 - sm(-.22, .02, e);
    var X = typeof fixedT === 'number' ? { cl: 0, fg: 0, rn: 0, sn: 0 } : wx(), cl = c01(X.cl), fg = c01(X.fg), rn = c01(X.rn), sn = c01(X.sn);
    cZen.setHex(0x060a1c).lerp(cA.setHex(0x3a8ae0), day).lerp(cA.setHex(0x34447a), twi * .55);
    cHor.setHex(0x101830).lerp(cA.setHex(0xbfe0f7), day).lerp(cA.setHex(0xf7a25e), twi * .8);
    cA.setHex(0x9aa3ad).multiplyScalar(mix(1, .2, nightK));
    cZen.lerp(cA, c01(cl * .72 + fg * .3)); cB.copy(cA).multiplyScalar(1.07); cHor.lerp(cB, c01(cl * .6 + fg * .55));
    if (sn > 0) { cA.setHex(0xcfd5dd).multiplyScalar(mix(1, .25, nightK)); cHor.lerp(cA, sn * .35); cZen.lerp(cA, sn * .25); }
    var hi = sm(0, .42, e);
    cSun.setRGB(1, mix(.5, .96, hi), mix(.22, .86, hi));
    var lum = mix(.16, 1, day);
    var tw2 = twi * sm(-.2, -.02, e);
    cCl.setRGB(1, 1, 1).lerp(cSun, twi * .6).multiplyScalar(Math.max(lum, tw2 * .95) * (1 - rn * .2));
    cSh.setRGB(.60, .67, .78).lerp(cA.setRGB(.42, .44, .5), c01(cl * .7 + rn * .3)).lerp(cA.setRGB(.62, .5, .62), tw2 * .5).multiplyScalar(Math.max(lum, tw2 * .6) * (1 - rn * .3));
    cHorB.copy(cHor).lerp(cZen, twi * .62); cFog.copy(cHor).lerp(cHorB, .5).lerp(cZen, .1);
    P.day = day; P.nightK = nightK; P.e = e;
    P.cover = c01(.40 + cl * .44 + rn * .1 + fg * .1);
    P.sunVis = sm(-.06, .03, e) * c01(1 - cl * .78 - fg * .6);
    P.moonVis = sm(-.05, .06, md.y) * c01(1 - cl * .7 - fg * .6) * (1 - day);
    P.stars = nightK * c01(1 - cl * .85 - fg);
    var SL = 1; try { SL = SEASONS[WORLD.season].light || 1; } catch (er) { }
    P.sunI = sm(-.02, .28, e) * 1.0 * SL * (1 - cl * .62);
    P.moonI = sm(0, .3, md.y) * .2 * (1 - cl * .5) * (1 - day);
    cHemi.setHex(0x2c3a66).lerp(cA.setHex(0xdfeeff), day).lerp(cA.setHex(0xffc79a), twi * .35);
    cGnd.setHex(0x0e1119).lerp(cA.setHex(0x6c6856), day);
  }

  /* ---------- купол неба ---------- */
  function makeDome() {
    var u = {
      uSun: { value: new THREE.Vector3(0, 1, 0) }, uMoon: { value: new THREE.Vector3(0, -1, 0) }, uZen: { value: new THREE.Color() }, uHor: { value: new THREE.Color() }, uHorB: { value: new THREE.Color() },
      uSunCol: { value: new THREE.Color() }, uCloudCol: { value: new THREE.Color() }, uCloudShade: { value: new THREE.Color() },
      uT: { value: 0 }, uCover: { value: .4 }, uStars: { value: 0 }, uSunVis: { value: 1 }, uMoonVis: { value: 0 }
    };
    S.mat = new THREE.ShaderMaterial({ uniforms: u, vertexShader: SKY_VS, fragmentShader: SKY_FS, defines: { OCT: MOBILE ? 3 : 5 }, side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false });
    S.mat.toneMapped = false;
    var m = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 18), S.mat);
    m.scale.setScalar(60); m.frustumCulled = false; m.renderOrder = -1000; m.userData.noShadow = true; m.userData.keep = true; m.userData.ultra = true; m.matrixAutoUpdate = true;
    S.dome = m; m.visible = false; scene.add(m);
  }
  function pushUniforms() {
    var u = S.mat.uniforms;
    u.uSun.value.copy(sd); u.uMoon.value.copy(md); u.uZen.value.copy(cZen); u.uHor.value.copy(cHor); u.uHorB.value.copy(cHorB); u.uSunCol.value.copy(cSun); u.uCloudCol.value.copy(cCl); u.uCloudShade.value.copy(cSh);
    u.uCover.value = P.cover; u.uStars.value = P.stars; u.uSunVis.value = P.sunVis; u.uMoonVis.value = P.moonVis;
  }

  /* ---------- тени ---------- */
  var SM = MOBILE ? [512, 1024, 2048] : [1024, 2048, 4096];
  var queue = [], qi = 0, scanT = 0;
  function touchMats() { scene.traverse(function (o) { if (o.isMesh) { var a = Array.isArray(o.material) ? o.material : [o.material]; a.forEach(function (m) { if (m) m.needsUpdate = true; }); } }); }
  function flag(o) {
    var m = o.material; if (!m) return; var arr = Array.isArray(m) ? m : [m];
    var lit = arr.some(function (x) { return x && (x.isMeshLambertMaterial || x.isMeshPhongMaterial); }), big = false;
    if (o.geometry) { if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere(); big = o.geometry.boundingSphere && o.geometry.boundingSphere.radius > 78 && !o.userData.merged; }
    o.receiveShadow = lit; o.castShadow = lit && !arr.some(function (x) { return x && x.transparent; }) && !big && !o.userData.noShadow;
  }
  function gfxFlags() { return !!(window.MG_GFX && MG_GFX.mode === 'hd' && MG_GFX.applied); } // в «Улучшенной» графике флаги теней расставляет модуль 1.11
  function shadowsFrame(dt, E) {
    var want = SM[Math.min(2, E.shadowQ)], half = (MOBILE ? 46 : 72) * E.shadowDist, s = sun.shadow, c = s.camera;
    if (!renderer.shadowMap.enabled || renderer.shadowMap.type !== THREE.PCFSoftShadowMap || !sun.castShadow) {
      renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; sun.castShadow = true; touchMats();
    }
    if (s.mapSize.x !== want) { s.mapSize.set(want, want); if (s.map) { s.map.dispose(); s.map = null; } }
    if (c.right !== half || c.far !== 420) { c.left = -half; c.right = half; c.top = half; c.bottom = -half; c.near = 1; c.far = 420; c.updateProjectionMatrix(); }
    s.bias = -0.0007; s.normalBias = 0.05;
    S.half = half; S.texel = 2 * half / want;
    if (!gfxFlags()) {
      scanT -= dt; if (scanT <= 0) { scanT = 4; queue.length = 0; qi = 0; scene.traverse(function (o) { if (o.isMesh) queue.push(o); }); }
      var n = 0, lim = MOBILE ? 500 : 1400; while (qi < queue.length && n < lim) { var o = queue[qi++]; if (o.parent) flag(o); n++; }
    }
  }
  function shadowsOff() {
    if (!S.shOn) return; S.shOn = false; U.shadowsOn = false;
    // состояние рендера возвращает модуль графики 1.11 (см. U.restoreGfx), здесь только свой флаг
    U.restoreGfx();
  }

  /* ---------- отражения неба ---------- */
  function specCanvas(kind) {
    var cv = document.createElement('canvas'); cv.width = cv.height = 128; var g = cv.getContext('2d');
    g.fillStyle = '#000'; g.fillRect(0, 0, 128, 128); g.fillStyle = '#fff';
    if (kind === 'modern') { for (var j = 0; j < 4; j++) g.fillRect(0, j * 32 + 4, 128, 23); }
    else { var ox = kind === 'wood' ? 8 : 7, oy = kind === 'wood' ? 7 : 6, w = kind === 'wood' ? 16 : 18, h = kind === 'wood' ? 18 : 20; for (var i = 0; i < 4; i++) for (var k = 0; k < 4; k++) g.fillRect(i * 32 + ox, k * 32 + oy, w, h); }
    var t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
  }
  function specFor(map) {
    if (!S.specs) S.specs = {};
    var kind = null;
    try { if (map === winTex) kind = 'win'; else if (map === brickTex) kind = 'win'; else if (map === modernTex) kind = 'modern'; else if (typeof WOODTEX !== 'undefined' && map === WOODTEX) kind = 'wood'; } catch (e) { }
    if (!kind) return null;
    return S.specs[kind] || (S.specs[kind] = specCanvas(kind));
  }
  function reflAssign() {
    var env = S.cube.texture, list = [];
    try { bldMats.forEach(function (m) { var sp = specFor(m.map); if (sp) list.push({ m: m, spec: sp, k: .5 }); }); } catch (e) { }
    try { list.push({ m: mat(0x2a3646), spec: null, k: .34 }); } catch (e) { }
    try { list.push({ m: roadMat, spec: null, k: 0, road: true }); } catch (e) { }
    list.forEach(function (r) {
      var m = r.m; if (m.userData.ultraRefl) return;
      m.userData.ultraRefl = { envMap: m.envMap, specularMap: m.specularMap, combine: m.combine, reflectivity: m.reflectivity };
      m.envMap = env; if (r.spec) m.specularMap = r.spec; m.combine = THREE.MixOperation; m.reflectivity = r.k; m.needsUpdate = true;
      S.reflMats.push(r);
    });
  }
  function reflOn() {
    if (!S.cube) {
      S.cube = new THREE.WebGLCubeRenderTarget(MOBILE ? 32 : 64, { format: THREE.RGBAFormat, generateMipmaps: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });
      S.cubeCam = new THREE.CubeCamera(.1, 200, S.cube);
      S.cubeScene = new THREE.Scene();
      var m = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 12), S.mat); m.scale.setScalar(60); m.frustumCulled = false; S.cubeScene.add(m);
    }
    S.reflOn = true; S.cubeT = 0; S.reflN = -1;
  }
  function reflOff() {
    if (!S.reflOn) return; S.reflOn = false;
    S.reflMats.forEach(function (r) { var m = r.m, o = m.userData.ultraRefl; if (!o) return; m.envMap = o.envMap || null; m.specularMap = o.specularMap || null; m.combine = o.combine; m.reflectivity = o.reflectivity; m.userData.ultraRefl = null; m.needsUpdate = true; });
    S.reflMats.length = 0;
  }
  function reflFrame(dt) {
    S.cubeT -= dt;
    if (S.cubeT <= 0) {
      S.cubeT = 1.6;
      var keep = renderer.render, rt = renderer.getRenderTarget();
      try { if (U.rawRender) renderer.render = U.rawRender; S.cubeCam.update(renderer, S.cubeScene); }
      finally { renderer.render = keep; renderer.setRenderTarget(rt); }
      var n = 0; try { n = bldMats.length; } catch (e) { }
      if (n !== S.reflN) { S.reflN = n; reflAssign(); }
    }
    var nk = P.nightK, wetv = c01(wx().wet);
    for (var i = 0; i < S.reflMats.length; i++) { var r = S.reflMats[i]; r.m.reflectivity = r.road ? wetv * .3 : r.k * mix(1, .3, nk); }
  }

  /* ---------- включение / выключение ---------- */
  function saveOrig() { if (!S.orig) S.orig = { hemi: hemi.color.getHex(), gnd: hemi.groundColor.getHex() }; }
  function lightOff() {
    if (!S.lightOn) return; S.lightOn = false;
    if (S.orig) { hemi.color.setHex(S.orig.hemi); hemi.groundColor.setHex(S.orig.gnd); }
    try { sun.target.position.set(0, 0, 0); sun.target.updateMatrixWorld(); } catch (e) { }
  }
  function sync() {
    var E = U.eff(); saveOrig();
    if (E.sky || E.refl) { if (!S.dome) makeDome(); }
    S.skyOn = !!E.sky; if (S.dome && !S.skyOn) S.dome.visible = false;
    if (E.light) S.lightOn = true; else lightOff();
    if (E.shadows) { S.shOn = true; U.shadowsOn = true; scanT = 0; if (!sun.target.parent) scene.add(sun.target); } else shadowsOff();
    if (E.refl) reflOn(); else reflOff();
  }
  function off() {
    if (S.dome) S.dome.visible = false; S.skyOn = false;
    lightOff(); reflOff();
    if (S.shOn) { S.shOn = false; U.shadowsOn = false; }
  }
  var tAcc = 0;
  function frame(dt) {
    var E = U.eff(), loc = where(), city = loc > 0, sp = special();
    compute(loc === 2 ? .5 : undefined); tAcc += dt;
    if (S.dome) {
      var vis = S.skyOn && city && !sp;
      S.dome.visible = vis;
      if (vis || S.reflOn) { S.mat.uniforms.uT.value = tAcc; pushUniforms(); }
      if (vis) {
        S.dome.position.copy(camera.position);
        fog.color.copy(cFog); if (scene.background && scene.background.isColor) scene.background.copy(cFog);
      }
    }
    if (S.lightOn && city && !sp) {
      if (P.sunI >= P.moonI) { ld.copy(sd); sun.intensity = P.sunI; sun.color.copy(cSun); }
      else { ld.copy(md); sun.intensity = P.moonI; sun.color.setRGB(.6, .72, 1); }
      if (ld.y < .2) { ld.y = .2; ld.normalize(); }
      hemi.color.copy(cHemi); hemi.groundColor.copy(cGnd); hemi.intensity *= mix(1, .88, P.day);
      S.lit = true;
    } else {
      if (S.lit && S.orig) { hemi.color.setHex(S.orig.hemi); hemi.groundColor.setHex(S.orig.gnd); S.lit = false; }
      ld.copy(sun.position); if (sun.target) ld.sub(sun.target.position); if (ld.lengthSq() < 1e-6) ld.set(.4, .8, .3); ld.normalize();
    }
    if (S.shOn) {
      shadowsFrame(dt, E);
      var p = (typeof player !== 'undefined' && player) ? (player.drive ? player.drive.pos : player.pos) : null;
      if (p) {
        var tx = S.texel || .05;
        right.crossVectors(UP, ld); if (right.lengthSq() < 1e-6) right.set(1, 0, 0); right.normalize(); up2.crossVectors(ld, right);
        cen.set(p.x, p.y || 0, p.z);
        var a = Math.round(cen.dot(right) / tx) * tx, b = Math.round(cen.dot(up2) / tx) * tx, c = cen.dot(ld);
        cen.set(0, 0, 0).addScaledVector(right, a).addScaledVector(up2, b).addScaledVector(ld, c);
        sun.target.position.copy(cen); sun.position.copy(cen).addScaledVector(ld, 160); sun.target.updateMatrixWorld();
      }
    } else if (S.lightOn && city && !sp) {
      var q = (typeof player !== 'undefined' && player) ? (player.drive ? player.drive.pos : player.pos) : null;
      if (q) { sun.target.position.set(q.x, q.y || 0, q.z); sun.position.set(q.x + ld.x * 160, (q.y || 0) + ld.y * 160, q.z + ld.z * 160); if (!sun.target.parent) scene.add(sun.target); sun.target.updateMatrixWorld(); }
    }
    if (S.reflOn) reflFrame(dt);
  }
  U.reg('sky', { title: 'Небо и свет', sync: sync, off: off, frame: frame, _S: S, _compute: compute });
})();
