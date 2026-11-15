/* =====================================================================
   МГИАГ 1.14 — ULTRA: обработка изображения.
   Сцена рисуется в текстуру (цвет + глубина), затем:
   Ambient Occlusion → дымка → свечение → цветокоррекция → FXAA.
   Если режим выключен или случилась ошибка, кадр рисуется как раньше.
   ===================================================================== */
(function () {
  'use strict';
  var U = window.MG_ULTRA; if (!U || typeof THREE === 'undefined') return;
  var MOBILE = U.mobile;

  var VS = 'varying vec2 vUv;\nvoid main(){ vUv=uv; gl_Position=vec4(position.xy,0.0,1.0); }';
  var DEPTH = [
    'uniform sampler2D tDepth; uniform float uNear; uniform float uFar; uniform float uTan; uniform float uAspect;',
    'float vz(float d){ return (uNear*uFar)/((uFar-uNear)*d-uFar); }',
    'vec3 vp(vec2 uv){ float z=vz(texture2D(tDepth,uv).x); return vec3((uv*2.0-1.0)*vec2(uAspect,1.0)*uTan*(-z),z); }'
  ].join('\n');
  var AO_FS = [
    DEPTH,
    'uniform vec2 uPx; uniform float uRadius; uniform float uInt;',
    'varying vec2 vUv;',
    'float rnd2(vec2 p){ return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453); }',
    'void main(){',
    ' float d=texture2D(tDepth,vUv).x;',
    ' if(d>=0.99995){ gl_FragColor=vec4(1.0); return; }',
    ' vec3 P=vp(vUv);',
    ' if(-P.z>100.0){ gl_FragColor=vec4(1.0); return; }',
    ' vec3 Px1=vp(vUv+vec2(uPx.x,0.0)); vec3 Px0=vp(vUv-vec2(uPx.x,0.0));',
    ' vec3 Py1=vp(vUv+vec2(0.0,uPx.y)); vec3 Py0=vp(vUv-vec2(0.0,uPx.y));',
    ' vec3 dx=(abs(Px1.z-P.z)<abs(P.z-Px0.z))?(Px1-P):(P-Px0);',
    ' vec3 dy=(abs(Py1.z-P.z)<abs(P.z-Py0.z))?(Py1-P):(P-Py0);',
    ' vec3 N=normalize(cross(dx,dy));',
    ' float rnd=rnd2(gl_FragCoord.xy)*6.2831853;',
    ' float rUv=clamp(uRadius/(-P.z)/uTan*0.5,0.002,0.11);',
    ' float occ=0.0;',
    ' for(int i=0;i<NS;i++){',
    '  float fi=(float(i)+0.5)/float(NS);',
    '  float a=rnd+fi*15.0796;',
    '  vec2 o=vec2(cos(a),sin(a))*sqrt(fi)*rUv; o.x/=uAspect;',
    '  vec3 v=vp(vUv+o)-P;',
    '  float d2=dot(v,v);',
    '  float nv=dot(N,v)/sqrt(d2+0.0001);',
    '  occ+=max(nv-0.12,0.0)/(1.0+d2/(uRadius*uRadius));',
    ' }',
    ' float ao=1.0-uInt*occ/float(NS)*2.4;',
    ' ao=mix(ao,1.0,smoothstep(55.0,100.0,-P.z));',
    ' gl_FragColor=vec4(vec3(clamp(ao,0.0,1.0)),1.0);',
    '}'
  ].join('\n');
  var BRIGHT_FS = [
    'uniform sampler2D tColor; uniform vec2 uPx; uniform float uThr; varying vec2 vUv;',
    'void main(){',
    ' vec3 c=texture2D(tColor,vUv+uPx*vec2(-1.0,-1.0)).rgb+texture2D(tColor,vUv+uPx*vec2(1.0,-1.0)).rgb+texture2D(tColor,vUv+uPx*vec2(-1.0,1.0)).rgb+texture2D(tColor,vUv+uPx*vec2(1.0,1.0)).rgb;',
    ' c*=0.25; float l=dot(c,vec3(0.2126,0.7152,0.0722));',
    ' gl_FragColor=vec4(c*smoothstep(uThr,uThr+0.2,l),1.0);',
    '}'
  ].join('\n');
  var BLUR_FS = [
    'uniform sampler2D tColor; uniform vec2 uDir; varying vec2 vUv;',
    'void main(){',
    ' vec3 c=texture2D(tColor,vUv).rgb*0.2270270;',
    ' c+=(texture2D(tColor,vUv+uDir*1.3846154).rgb+texture2D(tColor,vUv-uDir*1.3846154).rgb)*0.3162162;',
    ' c+=(texture2D(tColor,vUv+uDir*3.2307692).rgb+texture2D(tColor,vUv-uDir*3.2307692).rgb)*0.0702703;',
    ' gl_FragColor=vec4(c,1.0);',
    '}'
  ].join('\n');
  var COMP_FS = [
    'uniform sampler2D tColor; uniform sampler2D tAO; uniform sampler2D tBloom;',
    DEPTH,
    'uniform vec2 uPx; uniform float uAO; uniform float uBloom; uniform float uHaze; uniform vec3 uHazeCol; uniform vec3 uSunCol; uniform vec3 uSunV;',
    'uniform float uGrade; uniform float uSat; uniform vec3 uTint; uniform float uVig;',
    'varying vec2 vUv;',
    'void tap(vec2 o,float z,inout float a,inout float w){',
    ' vec2 u=vUv+o*uPx*2.0; float zz=vz(texture2D(tDepth,u).x);',
    ' float k=max(0.0,1.0-abs(zz-z)/(0.4+(-z)*0.03))+0.001;',
    ' a+=texture2D(tAO,u).r*k; w+=k; }',
    'void main(){',
    ' vec3 col=texture2D(tColor,vUv).rgb;',
    '#ifdef USE_DEPTH',
    ' float d=texture2D(tDepth,vUv).x;',
    ' if(d<0.99995){',
    '  float z=vz(d);',
    '#ifdef USE_AO',
    '  float a=0.0; float w=0.0;',
    '  tap(vec2(0.0,0.0),z,a,w); tap(vec2(1.0,1.0),z,a,w); tap(vec2(-1.0,1.0),z,a,w); tap(vec2(1.0,-1.0),z,a,w); tap(vec2(-1.0,-1.0),z,a,w);',
    '#ifdef AO_WIDE',
    '  tap(vec2(2.0,0.0),z,a,w); tap(vec2(-2.0,0.0),z,a,w); tap(vec2(0.0,2.0),z,a,w); tap(vec2(0.0,-2.0),z,a,w);',
    '#endif',
    '  col*=mix(1.0,a/w,uAO);',
    '#endif',
    '#ifdef USE_HAZE',
    '  vec3 rd=normalize(vec3((vUv*2.0-1.0)*vec2(uAspect,1.0)*uTan,-1.0));',
    '  float f=(1.0-exp(z*uHaze))*0.62;',
    '  float s=pow(max(dot(rd,uSunV),0.0),8.0);',
    '  col=mix(col,uHazeCol+uSunCol*s*0.3,f);',
    '#endif',
    ' }',
    '#endif',
    '#ifdef USE_BLOOM',
    ' col+=texture2D(tBloom,vUv).rgb*uBloom;',
    '#endif',
    '#ifdef USE_GRADE',
    ' col=clamp(col,0.0,1.0);',
    ' col=mix(col,col*col*(3.0-2.0*col),uGrade);',
    ' float l=dot(col,vec3(0.2126,0.7152,0.0722));',
    ' col=mix(vec3(l),col,uSat)*uTint;',
    ' vec2 q=vUv-0.5; col*=1.0-dot(q,q)*uVig;',
    '#endif',
    ' gl_FragColor=vec4(col,1.0);',
    '}'
  ].join('\n');
  var FXAA_FS = [
    'uniform sampler2D tColor; uniform vec2 uPx; varying vec2 vUv;',
    'void main(){',
    ' vec3 luma=vec3(0.299,0.587,0.114);',
    ' vec3 rgbNW=texture2D(tColor,vUv+vec2(-1.0,-1.0)*uPx).rgb; vec3 rgbNE=texture2D(tColor,vUv+vec2(1.0,-1.0)*uPx).rgb;',
    ' vec3 rgbSW=texture2D(tColor,vUv+vec2(-1.0,1.0)*uPx).rgb; vec3 rgbSE=texture2D(tColor,vUv+vec2(1.0,1.0)*uPx).rgb;',
    ' vec3 rgbM=texture2D(tColor,vUv).rgb;',
    ' float lNW=dot(rgbNW,luma); float lNE=dot(rgbNE,luma); float lSW=dot(rgbSW,luma); float lSE=dot(rgbSE,luma); float lM=dot(rgbM,luma);',
    ' float lMin=min(lM,min(min(lNW,lNE),min(lSW,lSE))); float lMax=max(lM,max(max(lNW,lNE),max(lSW,lSE)));',
    ' vec2 dir=vec2(-((lNW+lNE)-(lSW+lSE)),((lNW+lSW)-(lNE+lSE)));',
    ' float red=max((lNW+lNE+lSW+lSE)*0.03125,0.0078125);',
    ' float rcp=1.0/(min(abs(dir.x),abs(dir.y))+red);',
    ' dir=min(vec2(8.0),max(vec2(-8.0),dir*rcp))*uPx;',
    ' vec3 A=0.5*(texture2D(tColor,vUv+dir*(1.0/3.0-0.5)).rgb+texture2D(tColor,vUv+dir*(2.0/3.0-0.5)).rgb);',
    ' vec3 B=A*0.5+0.25*(texture2D(tColor,vUv-dir*0.5).rgb+texture2D(tColor,vUv+dir*0.5).rgb);',
    ' float lB=dot(B,luma);',
    ' gl_FragColor=vec4((lB<lMin||lB>lMax)?A:B,1.0);',
    '}'
  ].join('\n');
  U.POST_SRC = { vs: VS, ao: AO_FS, bright: BRIGHT_FS, blur: BLUR_FS, comp: COMP_FS, fxaa: FXAA_FS };

  var P = { on: false, busy: false, depthOK: null, rt: null, w: 0, h: 0, sig: '', E: null };
  var fsScene = null, fsCam = null, quad = null, mAO = null, mBright = null, mBlur = null, mComp = null, mFx = null;
  var v2 = new THREE.Vector2(), v3 = new THREE.Vector3();
  var NSAMP = MOBILE ? [5, 8, 12] : [8, 12, 18];

  function shader(fs, uniforms, defines) {
    var m = new THREE.ShaderMaterial({ uniforms: uniforms, vertexShader: VS, fragmentShader: fs, defines: defines || {}, depthTest: false, depthWrite: false, fog: false });
    m.toneMapped = false; return m;
  }
  function depthU() { return { tDepth: { value: null }, uNear: { value: .1 }, uFar: { value: 620 }, uTan: { value: .6 }, uAspect: { value: 1 } }; }
  function build() {
    fsScene = new THREE.Scene(); fsCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    var a = depthU(); a.uPx = { value: new THREE.Vector2() }; a.uRadius = { value: .9 }; a.uInt = { value: 1 };
    mAO = shader(AO_FS, a, { NS: 8 });
    mBright = shader(BRIGHT_FS, { tColor: { value: null }, uPx: { value: new THREE.Vector2() }, uThr: { value: .85 } });
    mBlur = shader(BLUR_FS, { tColor: { value: null }, uDir: { value: new THREE.Vector2() } });
    var c = depthU(); c.tColor = { value: null }; c.tAO = { value: null }; c.tBloom = { value: null }; c.uPx = { value: new THREE.Vector2() };
    c.uAO = { value: 1 }; c.uBloom = { value: .5 }; c.uHaze = { value: .002 }; c.uHazeCol = { value: new THREE.Color(0xb7d2ea) }; c.uSunCol = { value: new THREE.Color(0xfff0d8) }; c.uSunV = { value: new THREE.Vector3(0, 1, 0) };
    c.uGrade = { value: .2 }; c.uSat = { value: 1.1 }; c.uTint = { value: new THREE.Vector3(1, 1, 1) }; c.uVig = { value: .3 };
    mComp = shader(COMP_FS, c, {});
    mFx = shader(FXAA_FS, { tColor: { value: null }, uPx: { value: new THREE.Vector2() } });
    quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mComp); quad.frustumCulled = false; fsScene.add(quad);
  }
  function mkRT(w, h, depth) {
    var rt = new THREE.WebGLRenderTarget(w, h, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat, depthBuffer: !!depth, stencilBuffer: false });
    rt.texture.generateMipmaps = false;
    if (depth && P.depthOK) { var dt = new THREE.DepthTexture(w, h); dt.type = THREE.UnsignedIntType; dt.minFilter = THREE.NearestFilter; dt.magFilter = THREE.NearestFilter; rt.depthTexture = dt; }
    return rt;
  }
  function freeRT() { if (!P.rt) return; for (var k in P.rt) { var r = P.rt[k]; try { if (r.depthTexture) r.depthTexture.dispose(); r.dispose(); } catch (e) { } } P.rt = null; }
  function ensure(E) {
    if (P.depthOK === null) { try { P.depthOK = !!(renderer.capabilities.isWebGL2 || renderer.extensions.get('WEBGL_depth_texture')); } catch (e) { P.depthOK = false; } }
    if (!fsScene) build();
    renderer.getDrawingBufferSize(v2);
    var w = Math.max(64, Math.round(v2.x * E.res)), h = Math.max(64, Math.round(v2.y * E.res));
    if (!P.rt || w !== P.w || h !== P.h) {
      freeRT(); P.w = w; P.h = h;
      var hw = Math.max(32, w >> 1), hh = Math.max(32, h >> 1), qw = Math.max(16, w >> 2), qh = Math.max(16, h >> 2);
      P.rt = { scene: mkRT(w, h, true), ao: mkRT(hw, hh, false), b1: mkRT(qw, qh, false), b2: mkRT(qw, qh, false), comp: mkRT(w, h, false) };
    }
    var useD = P.depthOK, ao = E.ao && useD, haze = E.haze && useD;
    var sig = (useD ? 'D' : '') + (ao ? 'A' : '') + (haze ? 'H' : '') + (E.bloom ? 'B' : '') + (E.grade ? 'G' : '');
    if (sig !== P.sig) {
      P.sig = sig; var d = {};
      if (useD && (ao || haze)) d.USE_DEPTH = ''; if (ao) { d.USE_AO = ''; if (!MOBILE) d.AO_WIDE = ''; } if (haze) d.USE_HAZE = ''; if (E.bloom) d.USE_BLOOM = ''; if (E.grade) d.USE_GRADE = '';
      mComp.defines = d; mComp.needsUpdate = true;
    }
    var ns = NSAMP[Math.min(2, E.aoQ)]; if (mAO.defines.NS !== ns) { mAO.defines.NS = ns; mAO.needsUpdate = true; }
    P.ao = ao; P.haze = haze;
  }
  function setDepthU(u, tex) {
    u.tDepth.value = tex; u.uNear.value = camera.near; u.uFar.value = camera.far; u.uTan.value = Math.tan(camera.fov * Math.PI / 360); u.uAspect.value = camera.aspect;
  }
  function pass(raw, m, target) { quad.material = m; renderer.setRenderTarget(target); raw.call(renderer, fsScene, fsCam); }
  function run(raw) {
    var E = P.E || U.eff(); ensure(E);
    var R = P.rt, sk = U.skyState || { nightK: 0, day: 1 };
    renderer.setRenderTarget(R.scene); raw.call(renderer, scene, camera);
    var dtex = R.scene.depthTexture || null;
    if (P.ao) {
      var a = mAO.uniforms; setDepthU(a, dtex); a.uPx.value.set(1 / P.w, 1 / P.h); a.uRadius.value = .9; a.uInt.value = 1;
      pass(raw, mAO, R.ao);
    }
    if (E.bloom) {
      var b = mBright.uniforms; b.tColor.value = R.scene.texture; b.uPx.value.set(1 / P.w, 1 / P.h); b.uThr.value = .86 - .26 * sk.nightK;
      pass(raw, mBright, R.b1);
      var bl = mBlur.uniforms; bl.tColor.value = R.b1.texture; bl.uDir.value.set(1 / R.b1.width, 0); pass(raw, mBlur, R.b2);
      bl.tColor.value = R.b2.texture; bl.uDir.value.set(0, 1 / R.b1.height); pass(raw, mBlur, R.b1);
    }
    var c = mComp.uniforms; setDepthU(c, dtex);
    c.tColor.value = R.scene.texture; c.tAO.value = R.ao.texture; c.tBloom.value = R.b1.texture; c.uPx.value.set(1 / P.w, 1 / P.h);
    var city = typeof area !== 'undefined' && area === 'city', under = !!(window.MG_WATER && MG_WATER.under);
    c.uAO.value = .85; c.uBloom.value = .5;
    c.uHaze.value = (city && !under) ? .0021 : 0;
    if (typeof fog !== 'undefined') c.uHazeCol.value.copy(fog.color);
    if (U.sunColor) c.uSunCol.value.copy(U.sunColor).multiplyScalar(U.skyState ? U.skyState.sunVis : 0);
    if (U.sunDir) { v3.copy(U.sunDir).transformDirection(camera.matrixWorldInverse); c.uSunV.value.copy(v3); }
    c.uGrade.value = .22; c.uSat.value = 1.1; c.uVig.value = .22;
    c.uTint.value.set(1 + .015 * sk.day - .04 * sk.nightK, 1 - .02 * sk.nightK, 1 - .015 * sk.day + .04 * sk.nightK);
    if (E.fxaa) {
      pass(raw, mComp, R.comp);
      mFx.uniforms.tColor.value = R.comp.texture; mFx.uniforms.uPx.value.set(1 / P.w, 1 / P.h);
      pass(raw, mFx, null);
    } else pass(raw, mComp, null);
  }

  function pre() {
    if (typeof renderer === 'undefined' || renderer.__ultraWrap) return;
    var raw = renderer.render; U.rawRender = raw;
    renderer.render = function (a, b) {
      if (P.on && !P.busy && U.active && a === scene && b === camera && renderer.getRenderTarget() === null) {
        P.busy = true;
        try { run(raw); U.bootOk(); return; }
        catch (e) { U.note('post.render', e); P.on = false; try { renderer.setRenderTarget(null); } catch (e2) { } U.failMod('post', 'render'); }
        finally { P.busy = false; }
      }
      if (U.active) U.bootOk();
      return raw.call(renderer, a, b);
    };
    renderer.__ultraWrap = true;
  }
  function sync() {
    var E = U.eff(); P.E = E;
    P.on = !!(renderer.__ultraWrap && (E.ao || E.bloom || E.haze || E.grade || E.fxaa));
    if (!P.on) freeRT();
  }
  function off() { P.on = false; freeRT(); try { if (typeof renderer !== 'undefined' && renderer.getRenderTarget() !== null) renderer.setRenderTarget(null); } catch (e) { } }
  U.reg('post', { title: 'Обработка изображения', pre: pre, sync: sync, off: off, _P: P });
})();
