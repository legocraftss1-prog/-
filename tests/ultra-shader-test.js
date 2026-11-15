const { chromium } = require('playwright');const fs=require('fs');
let pass=0,fail=0;const ok=(c,n,x)=>{c?pass++:fail++;console.log(c?'  ✔':'  ✘ ПРОВАЛ:',n,c?'':String(x).slice(0,900));};
const OUT='/tmp/claude-0/-home-claude/8fd66da0-ec33-5819-b7ea-645c721bb6c9/scratchpad/';
(async()=>{
 const br=await chromium.launch({args:['--no-sandbox','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
 const pg=await br.newPage({viewport:{width:900,height:700}});pg.on('pageerror',e=>console.log('PE',String(e).slice(0,300)));
 await pg.goto('file:///home/claude/h13/index.html');await pg.waitForFunction(()=>window.MG_ULTRA&&MG_ULTRA.ready,null,{timeout:8000});
 const res=await pg.evaluate(()=>{
  const U=MG_ULTRA,out={compile:[],imgs:{}};U.set(true);tick();
  // префиксы, которые three.js r128 дописывает к ShaderMaterial и встроенным материалам
  const V1='precision highp float;\nprecision highp int;\nuniform mat4 modelMatrix;uniform mat4 modelViewMatrix;uniform mat4 projectionMatrix;uniform mat4 viewMatrix;uniform mat3 normalMatrix;uniform vec3 cameraPosition;\nattribute vec3 position;attribute vec3 normal;attribute vec2 uv;\n';
  const F1='precision highp float;\nprecision highp int;\nuniform mat4 viewMatrix;uniform vec3 cameraPosition;\n';
  const V2='#version 300 es\n#define attribute in\n#define varying out\n#define texture2D texture\n'+V1.replace(/attribute vec/g,'in vec');
  const F2='#version 300 es\n#define varying in\nlayout(location = 0) out highp vec4 pc_fragColor;\n#define gl_FragColor pc_fragColor\n#define gl_FragDepthEXT gl_FragDepth\n#define texture2D texture\n#define textureCube texture\n'+F1;
  function defs(d){let s='';for(const k in d)s+='#define '+k+' '+d[k]+'\n';return s;}
  function prog(gl,vs,fsrc){const mk=(t,src)=>{const s=gl.createShader(t);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s)+'\n---\n'+src.split('\n').map((l,i)=>(i+1)+': '+l).join('\n').slice(0,2500));return s;};
   const p=gl.createProgram();gl.attachShader(p,mk(gl.VERTEX_SHADER,vs));gl.attachShader(p,mk(gl.FRAGMENT_SHADER,fsrc));gl.bindAttribLocation(p,0,'position');gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error('link: '+gl.getProgramInfoLog(p));return p;}
  const SKY=U.SKY_SRC,PS=U.POST_SRC,WS=U.WORLD_SRC;
  const list=[];
  list.push(['небо (5 октав)',SKY.vs,SKY.fs,{OCT:5}]);list.push(['небо (3 октавы, телефон)',SKY.vs,SKY.fs,{OCT:3}]);
  list.push(['AO 8',PS.vs,PS.ao,{NS:8}]);list.push(['AO 18',PS.vs,PS.ao,{NS:18}]);list.push(['яркие области',PS.vs,PS.bright,{}]);list.push(['размытие',PS.vs,PS.blur,{}]);list.push(['FXAA',PS.vs,PS.fxaa,{}]);
  [[],['USE_GRADE'],['USE_BLOOM'],['USE_DEPTH','USE_AO'],['USE_DEPTH','USE_HAZE'],['USE_DEPTH','USE_AO','USE_HAZE','USE_BLOOM','USE_GRADE'],['USE_DEPTH','USE_AO','AO_WIDE','USE_HAZE','USE_BLOOM','USE_GRADE']].forEach(c=>{const d={};c.forEach(k=>d[k]='');list.push(['сборка ['+c.join(',')+']',PS.vs,PS.comp,d]);});
  // вставка в материалы: настоящий перехват onBeforeCompile на «скелете» шейдеров Lambert
  const kinds={0:roofMat,1:groundMat,2:walkMat,3:roadMat,5:pineMat};
  for(const k in kinds){const sh={vertexShader:'#include <common>\nvoid main(){\nvec3 objectNormal=vec3(normal);\n#include <begin_vertex>\ngl_Position=projectionMatrix*modelViewMatrix*vec4(transformed,1.0);\n}',fragmentShader:'uniform vec3 diffuse;\n#include <common>\nvoid main(){\nvec4 diffuseColor=vec4(diffuse,1.0);\n#include <color_fragment>\ngl_FragColor=diffuseColor;\n}'};
   kinds[k].onBeforeCompile(sh);const rep=s=>s.replace('#include <common>','#define PI 3.14159').replace('#include <begin_vertex>','vec3 transformed=vec3(position);').replace('#include <color_fragment>','');
   list.push(['материал, вид '+k,rep(sh.vertexShader),rep(sh.fragmentShader),{},/ultDetail/.test(sh.fragmentShader)]);}
  for(const ver of[1,2]){const cv=document.createElement('canvas');const gl=cv.getContext(ver===1?'webgl':'webgl2');if(!gl){out.compile.push([ver,'контекст','нет WebGL'+ver]);continue;}
   for(const L of list){try{prog(gl,(ver===1?V1:V2)+defs(L[3])+L[1],(ver===1?F1:F2)+defs(L[3])+L[2]);out.compile.push([ver,L[0],L[4]===false?'нет вставки':null]);}catch(e){out.compile.push([ver,L[0],e.message]);}}}
  // ---- картинки неба: тот же фрагментный шейдер, направление луча считается из экранных координат ----
  const cv=document.createElement('canvas');cv.width=640;cv.height=360;const gl=cv.getContext('webgl2',{preserveDrawingBuffer:true});
  const quad=()=>{const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,0,3,-1,0,-1,3,0]),gl.STATIC_DRAW);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,3,gl.FLOAT,false,0,0);};quad();
  const skyVS='#version 300 es\nprecision highp float;in vec3 position;out vec3 vDir;uniform float uYaw;uniform float uPitch;void main(){vec2 p=position.xy;vec3 d=vec3(p.x*1.78*0.6,p.y*0.6,-1.0);float cp=cos(uPitch),sp=sin(uPitch);d=vec3(d.x,d.y*cp-d.z*sp,d.y*sp+d.z*cp);float cy=cos(uYaw),sy=sin(uYaw);vDir=vec3(d.x*cy+d.z*sy,d.y,-d.x*sy+d.z*cy);gl_Position=vec4(p,0.0,1.0);}';
  const sp=prog(gl,skyVS,F2+'#define OCT 5\n'+SKY.fs);
  function setU(p,u){gl.useProgram(p);for(const k in u){const v=u[k].value,loc=gl.getUniformLocation(p,k);if(loc===null)continue;if(typeof v==='number')gl.uniform1f(loc,v);else if(v&&v.isColor)gl.uniform3f(loc,v.r,v.g,v.b);else if(v&&'z' in v)gl.uniform3f(loc,v.x,v.y,v.z);else if(v&&'x' in v)gl.uniform2f(loc,v.x,v.y);}}
  const S=U.mods.sky._S;const shots=[['noon',12,0,-1.57,.35],['evening',17.4,0,1.92,.2],['sunset',18.05,0,1.92,.18],['sunsetBack',18.05,0,-1.2,.18],['night',0.5,0,-1.2,.3],['cloudy',13,1,-1.57,.35],['morning',7,0,-1.92,.2]];out.stats={};
  for(const s of shots){WORLD.t=s[1];cloudI=s[2];for(let i=0;i<3;i++)tick(.5);setU(sp,S.mat.uniforms);gl.uniform1f(gl.getUniformLocation(sp,'uYaw'),s[3]);gl.uniform1f(gl.getUniformLocation(sp,'uPitch'),s[4]);gl.viewport(0,0,640,360);gl.drawArrays(gl.TRIANGLES,0,3);
   const px=new Uint8Array(640*360*4);gl.readPixels(0,0,640,360,gl.RGBA,gl.UNSIGNED_BYTE,px);let sum=[0,0,0],mx=0,mn=255;for(let i=0;i<px.length;i+=4){sum[0]+=px[i];sum[1]+=px[i+1];sum[2]+=px[i+2];const l=(px[i]+px[i+1]+px[i+2])/3;if(l>mx)mx=l;if(l<mn)mn=l;}
   const top=[px[(340*640+320)*4],px[(340*640+320)*4+1],px[(340*640+320)*4+2]];out.stats[s[0]]={avg:sum.map(v=>Math.round(v/(640*360))),mx:Math.round(mx),mn:Math.round(mn),top,sun:[S.mat.uniforms.uSun.value.x.toFixed(2),S.mat.uniforms.uSun.value.y.toFixed(2),S.mat.uniforms.uSun.value.z.toFixed(2)]};out.imgs['sky_'+s[0]]=cv.toDataURL('image/png');}
  cloudI=0;WORLD.t=12;tick();
  // ---- AO и сборка на синтетической сцене: земля и коробки, глубина как в буфере three.js ----
  const W=640,Hh=360;gl.getExtension('EXT_color_buffer_float');
  const tex=(ifmt,fmt,type,w,h,filt)=>{const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.texImage2D(gl.TEXTURE_2D,0,ifmt,w,h,0,fmt,type,null);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,filt);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,filt);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);return t;};
  const fbo=(t)=>{const f=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,f);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,t,0);return f;};
  const tCol=tex(gl.RGBA8,gl.RGBA,gl.UNSIGNED_BYTE,W,Hh,gl.LINEAR),tDep=tex(gl.R32F,gl.RED,gl.FLOAT,W,Hh,gl.NEAREST),tAO=tex(gl.RGBA8,gl.RGBA,gl.UNSIGNED_BYTE,W/2,Hh/2,gl.LINEAR),tB1=tex(gl.RGBA8,gl.RGBA,gl.UNSIGNED_BYTE,W/4,Hh/4,gl.LINEAR),tB2=tex(gl.RGBA8,gl.RGBA,gl.UNSIGNED_BYTE,W/4,Hh/4,gl.LINEAR),tComp=tex(gl.RGBA8,gl.RGBA,gl.UNSIGNED_BYTE,W,Hh,gl.LINEAR);
  const fCol=fbo(tCol),fDep=fbo(tDep),fAO=fbo(tAO),fB1=fbo(tB1),fB2=fbo(tB2),fComp=fbo(tComp);out.fboOK=gl.checkFramebufferStatus(gl.FRAMEBUFFER)===gl.FRAMEBUFFER_COMPLETE;
  const PVS='#version 300 es\nprecision highp float;in vec3 position;out vec2 vUv;void main(){vUv=position.xy*0.5+0.5;gl_Position=vec4(position.xy,0.0,1.0);}';
  const NEAR=.1,FAR=620,TAN=Math.tan(62*Math.PI/360),ASP=W/Hh;
  const SCENE='#version 300 es\nprecision highp float;in vec2 vUv;out vec4 o;uniform float uMode;\nconst float N='+NEAR+';const float F='+FAR.toFixed(1)+';\n'+
   'float box(vec3 ro,vec3 rd,vec3 c,vec3 h,out vec3 n){vec3 m=1.0/rd;vec3 k=abs(m)*h;vec3 t1=-m*(ro-c)-k;vec3 t2=-m*(ro-c)+k;float tn=max(max(t1.x,t1.y),t1.z);float tf=min(min(t2.x,t2.y),t2.z);if(tn>tf||tf<0.0)return -1.0;n=-sign(rd)*step(t1.yzx,t1.xyz)*step(t1.zxy,t1.xyz);return tn;}\n'+
   'void main(){vec3 rd=normalize(vec3((vUv*2.0-1.0)*vec2('+ASP.toFixed(4)+',1.0)*'+TAN.toFixed(5)+',-1.0));vec3 ro=vec3(0.0);float t=1e9;vec3 n=vec3(0.0,1.0,0.0);vec3 col=vec3(0.72,0.86,0.96);\n'+
   ' if(rd.y<0.0){float tg=-1.6/rd.y;if(tg<t){t=tg;n=vec3(0.0,1.0,0.0);vec3 p=rd*tg;col=mix(vec3(0.62,0.63,0.60),vec3(0.56,0.62,0.50),step(4.0,abs(p.x)));}}\n'+
   ' vec3 nn;float tb;tb=box(ro,rd,vec3(-3.0,0.4,-9.0),vec3(1.5,2.0,1.5),nn);if(tb>0.0&&tb<t){t=tb;n=nn;col=vec3(0.85,0.83,0.80);}tb=box(ro,rd,vec3(0.2,-0.6,-7.0),vec3(1.0,1.0,2.1),nn);if(tb>0.0&&tb<t){t=tb;n=nn;col=vec3(0.75,0.22,0.17);}tb=box(ro,rd,vec3(1.9,0.9,-10.0),vec3(0.9,2.5,0.9),nn);if(tb>0.0&&tb<t){t=tb;n=nn;col=vec3(0.80,0.80,0.84);}tb=box(ro,rd,vec3(14.0,6.0,-120.0),vec3(14.0,8.0,10.0),nn);if(tb>0.0&&tb<t){t=tb;n=nn;col=vec3(0.78,0.74,0.70);}\n'+
   ' float d=1.0;if(t<1e8){float z=t*rd.z;d=((-(F+N)/(F-N)*z-2.0*F*N/(F-N))/(-z))*0.5+0.5;float lam=0.55+0.45*max(dot(n,normalize(vec3(0.4,0.8,0.5))),0.0);col*=lam;}\n'+
   ' o=uMode<0.5?vec4(col,1.0):vec4(d,0.0,0.0,1.0);}';
  const pScene=prog(gl,PVS,SCENE),pAO=prog(gl,PVS,F2+'#define NS 18\n'+PS.ao),pBr=prog(gl,PVS,F2+PS.bright),pBl=prog(gl,PVS,F2+PS.blur),pFx=prog(gl,PVS,F2+PS.fxaa);
  const pComp=d=>prog(gl,PVS,F2+d.map(k=>'#define '+k+'\n').join('')+PS.comp);
  const draw=(p,f,w,h,u,texs)=>{gl.useProgram(p);gl.bindFramebuffer(gl.FRAMEBUFFER,f);gl.viewport(0,0,w,h);let unit=0;for(const k in texs){gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(gl.TEXTURE_2D,texs[k]);gl.uniform1i(gl.getUniformLocation(p,k),unit++);}for(const k in u){const v=u[k],l=gl.getUniformLocation(p,k);if(l===null)continue;if(typeof v==='number')gl.uniform1f(l,v);else if(v.length===2)gl.uniform2f(l,v[0],v[1]);else gl.uniform3f(l,v[0],v[1],v[2]);}gl.drawArrays(gl.TRIANGLES,0,3);};
  draw(pScene,fCol,W,Hh,{uMode:0},{});draw(pScene,fDep,W,Hh,{uMode:1},{});
  const DU={uNear:NEAR,uFar:FAR,uTan:TAN,uAspect:ASP};
  draw(pAO,fAO,W/2,Hh/2,Object.assign({uPx:[1/W,1/Hh],uRadius:.9,uInt:1},DU),{tDepth:tDep});
  draw(pBr,fB1,W/4,Hh/4,{uPx:[1/W,1/Hh],uThr:.86},{tColor:tCol});draw(pBl,fB2,W/4,Hh/4,{uDir:[4/W,0]},{tColor:tB1});draw(pBl,fB1,W/4,Hh/4,{uDir:[0,4/Hh]},{tColor:tB2});
  const CU=Object.assign({uPx:[1/W,1/Hh],uAO:.85,uBloom:.5,uHaze:.0021,uHazeCol:[.72,.86,.96],uSunCol:[1,.95,.85],uSunV:[.3,.5,-.8],uGrade:.22,uSat:1.1,uTint:[1.015,1,.985],uVig:.22},DU);
  const grab=(name)=>{const px=new Uint8Array(W*Hh*4);gl.readPixels(0,0,W,Hh,gl.RGBA,gl.UNSIGNED_BYTE,px);out.imgs[name]=cv.toDataURL('image/png');return px;};
  const at=(px,x,y)=>[px[(y*W+x)*4],px[(y*W+x)*4+1],px[(y*W+x)*4+2]];
  // исходная картинка
  const pCopy=prog(gl,PVS,'#version 300 es\nprecision highp float;in vec2 vUv;out vec4 o;uniform sampler2D tAO;void main(){o=vec4(texture(tAO,vUv).rgb,1.0);}');draw(pCopy,null,W,Hh,{},{tAO:tCol});const raw=grab('post_0_raw');
  // только AO (для наглядности: белая сцена × AO)
  const pAOview=prog(gl,PVS,'#version 300 es\nprecision highp float;in vec2 vUv;out vec4 o;uniform sampler2D tAO;void main(){o=vec4(texture(tAO,vUv).rgb,1.0);}');draw(pAOview,null,W,Hh,{},{tAO:tAO});const aoImg=grab('post_1_ao');
  draw(pComp(['USE_DEPTH','USE_AO','AO_WIDE']),null,W,Hh,CU,{tColor:tCol,tAO:tAO,tBloom:tB1,tDepth:tDep});grab('post_1b_aoBlur');draw(pComp(['USE_DEPTH','USE_AO','AO_WIDE','USE_HAZE','USE_BLOOM','USE_GRADE']),fComp,W,Hh,CU,{tColor:tCol,tAO:tAO,tBloom:tB1,tDepth:tDep});draw(pFx,null,W,Hh,{uPx:[1/W,1/Hh]},{tColor:tComp});const fin=grab('post_2_final');
  draw(pComp([]),null,W,Hh,CU,{tColor:tCol,tAO:tAO,tBloom:tB1,tDepth:tDep});const pass0=grab('post_3_passthrough');
  let diff=0;for(let i=0;i<raw.length;i++)diff=Math.max(diff,Math.abs(raw[i]-pass0[i]));
  // точки: открытая земля, земля в углу у стены, небо, дальний дом
  out.ao={open:at(aoImg,320,40),corner:at(aoImg,250,96),sky:at(aoImg,80,330),wallBase:at(aoImg,262,110)};
  out.fin={sky:at(fin,80,330),skyRaw:at(raw,80,330),far:at(fin,400,200),farRaw:at(raw,400,200),near:at(fin,320,40),nearRaw:at(raw,320,40)};out.passDiff=diff;
  let aoMin=255,aoMax=0,aoSum=0;for(let i=0;i<aoImg.length;i+=4){aoMin=Math.min(aoMin,aoImg[i]);aoMax=Math.max(aoMax,aoImg[i]);aoSum+=aoImg[i];}out.aoStat={min:aoMin,max:aoMax,avg:Math.round(aoSum/(W*Hh))};
  out.glErr=gl.getError();return out;});
 console.log('[1] Компиляция шейдеров (с префиксами three.js r128, WebGL 1 и WebGL 2)');
 for(const c of res.compile)ok(c[2]===null,'WebGL'+c[0]+': '+c[1],c[2]);
 console.log('[2] Небо');
 const st=res.stats;console.log('   ',JSON.stringify(st));
 ok(st.noon.top[2]>st.noon.top[0]+60&&st.noon.avg[2]>150,'полдень: небо голубое',st.noon);
 ok(st.night.avg[0]<40&&st.night.mx>90,'ночь: тёмное небо с яркими точками (звёзды или луна)',st.night);
 ok(st.sunset.avg[0]>st.sunset.avg[2]+15&&st.evening.mx>235,'закат: тёплые тона и яркое солнце',st.sunset);
 ok(Math.abs(st.cloudy.avg[0]-st.cloudy.avg[2])<Math.abs(st.noon.avg[0]-st.noon.avg[2]),'пасмурно: небо серее, чем в ясный полдень',[st.cloudy,st.noon]);
 console.log('[3] Ambient Occlusion и сборка кадра на синтетической сцене');
 console.log('   ',JSON.stringify({ao:res.ao,fin:res.fin,aoStat:res.aoStat,passDiff:res.passDiff,fbo:res.fboOK,glErr:res.glErr}));
 ok(res.fboOK&&res.glErr===0,'буферы созданы, ошибок WebGL нет',res.glErr);
 ok(res.ao.open[0]>235,'открытая земля не затемняется',res.ao.open);
 ok(res.ao.sky[0]===255,'небо не затемняется',res.ao.sky);
 ok(res.aoStat.min<200&&res.aoStat.avg>215,'затенение есть только местами (в углах), а не по всему кадру',res.aoStat);
 ok(res.passDiff<=1,'сборка без эффектов не меняет картинку',res.passDiff);
 ok(Math.abs(res.fin.sky[2]-res.fin.skyRaw[2])<40,'небо после обработки близко к исходному',res.fin);
 for(const k in res.imgs)fs.writeFileSync(OUT+k+'.png',Buffer.from(res.imgs[k].split(',')[1],'base64'));
 console.log('\n══ ULTRA (шейдеры в настоящем WebGL): '+pass+' ок, '+fail+' провалов ══');await br.close();process.exit(fail?1:0);
})().catch(e=>{console.error('УПАЛ',String(e).slice(0,3000));process.exit(2);});
