const { chromium } = require('playwright');
let pass=0,fail=0;const ok=(c,n,x)=>{c?pass++:fail++;console.log(c?'  ✔':'  ✘ ПРОВАЛ:',n,c?'':JSON.stringify(x));};
const URL='file:///home/claude/h13/index.html';
(async()=>{
 const br=await chromium.launch({args:['--no-sandbox']});
 async function page(ls,touch){const ctx=await br.newContext({viewport:{width:430,height:860},hasTouch:!!touch});const pg=await ctx.newPage();const errs=[];pg.on('pageerror',e=>errs.push(String(e)));pg.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
  if(ls)await pg.addInitScript(o=>{if(!sessionStorage.getItem('__seeded')){for(const k in o)localStorage.setItem(k,o[k]);sessionStorage.setItem('__seeded','1');}},ls);
  await pg.goto(URL);await pg.waitForFunction(()=>window.MG_ULTRA&&MG_ULTRA.ready,null,{timeout:8000});return {pg,errs,ctx};}
 const ticks=(pg,n)=>pg.evaluate(n=>{for(let i=0;i<n;i++)tick(.016);},n);

 console.log('[A] Режим выключен (по умолчанию): игра не меняется');
 let {pg,errs}=await page();
 let A=await pg.evaluate(()=>{renderer.calls.length=0;tick();tick();return {active:MG_ULTRA.active,on:MG_ULTRA.opt.on,added:BUILT.added,cols:BUILT.cols,calls:renderer.calls.map(c=>[c.main,c.target===null]),wrapped:/oTree/.test(tree.toString())||tree.name==='',carKids:BUILT.car.children.length,
   dome:scene.children.some(o=>o.userData&&o.userData.ultra),hemi:hemi.color.getHex(),shadow:renderer.shadowMap.enabled,winImg:winTex.image.width,env:bldMats.some(m=>m.envMap),patched:groundMat.userData.ultK,big:!!document.getElementById('mgFireBig'),cam:camLog.slice(-1)[0],boot:localStorage.getItem('mg_ultra_boot'),treeSrc:tree.toString().slice(0,30)};});
 ok(A.active===false&&A.on===false,'по умолчанию выключен',A);
 ok(A.calls.length===2&&A.calls.every(c=>c[0]&&c[1]),'кадр рисуется напрямую, без обработки',A.calls);
 ok(!A.dome&&A.hemi===0xeaf4ff&&!A.shadow&&A.winImg===256&&!A.env&&A.patched===undefined,'небо, свет, тени, текстуры, отражения не тронуты',A);
 ok(/^function tree\(x,z,s\)/.test(A.treeSrc),'строители карты не подменены',A.treeSrc);
 ok(!A.big&&A.cam===1&&A.boot===null,'кнопка огня и зум не активны, счётчик запуска не заведён',A);
 const BASE={added:A.added,cols:A.cols,carKids:A.carKids,benchKids:await pg.evaluate(()=>BUILT.bench.children.length)};
 await pg.evaluate(()=>{document.getElementById('c').dispatchEvent(new WheelEvent('wheel',{deltaY:300,bubbles:true,cancelable:true}));for(let i=0;i<30;i++)tick(.016);});
 ok(await pg.evaluate(()=>camLog.slice(-1)[0]===1),'колёсико при выключенном режиме не влияет на камеру');

 console.log('[B] Включение на лету');
 let B=await pg.evaluate(()=>{MG_ULTRA.set(true);renderer.calls.length=0;tick();const first=renderer.calls.map(c=>({main:c.main,t:c.target?(c.target.isWebGLCubeRenderTarget?'cube':c.target.width+'x'+c.target.height):null}));for(let i=0;i<5;i++)tick();
   const S=MG_ULTRA.mods.sky._S,dome=S.dome;return {first,domeVis:dome&&dome.visible,domeAtCam:dome.position.x===camera.position.x,cast:sun.castShadow,sh:renderer.shadowMap.enabled,type:renderer.shadowMap.type,map:sun.shadow.mapSize.x,hemi:hemi.color.getHex(),fog:fog.color.getHex(),
    sunY:sun.position.y,tgt:[sun.target.position.x,sun.target.position.z],tgtIn:!!sun.target.parent,win:winTex.image.width,brick:brickTex.image.width,em:winEm.image.width,an:winTex.anisotropy,kinds:[groundMat.userData.ultK,walkMat.userData.ultK,roadMat.userData.ultK,leafMats[0].userData.ultK,pineMat.userData.ultK,roofMat.userData.ultK],
    env:bldMats.filter(m=>m.envMap&&m.envMap.isCubeTexture).length,nb:bldMats.length,spec:bldMats.filter(m=>m.specularMap).length,glass:!!mat(0x2a3646).envMap,road:!!roadMat.envMap,roadK:roadMat.reflectivity,built:MG_ULTRA.built.models,fail:Object.keys(MG_ULTRA.fail),log:MG_ULTRA.log,hi:hemi.intensity,si:sun.intensity,flags:cityG.children.filter(o=>o.isMesh&&o.castShadow).length};});
 ok(B.fail.length===0,'ни один модуль не отключился с ошибкой',[B.fail,B.log]);
 const seq=B.first.filter(c=>c.t!=='cube');
 ok(seq.length===7&&seq[0].main&&seq[0].t==='860x1720'&&seq[1].t==='430x860'&&seq[2].t==='215x430'&&seq[5].t==='860x1720'&&seq[6].t===null,'кадр: сцена → AO → свечение ×3 → сборка → FXAA на экран',seq);
 ok(B.first.filter(c=>c.t==='cube').length===6,'карта отражений неба обновлена (6 граней)',B.first.length);
 ok(B.domeVis&&B.domeAtCam,'купол неба виден и следует за камерой',B);
 ok(B.cast&&B.sh&&B.type===2&&B.map===2048||B.map===1024||B.map===512,'мягкие тени включены',B);
 ok(B.hemi!==0xeaf4ff&&B.fog!==0xb7d2ea,'свет и цвет дымки берутся из неба',[B.hemi.toString(16),B.fog.toString(16)]);
 ok(B.tgtIn&&Math.abs(B.tgt[0]-5)<1&&Math.abs(B.tgt[1]-7)<1&&B.sunY>20,'источник света следует за игроком',B);
 ok(B.win===512&&B.brick===512&&B.em===512&&B.an>1,'текстуры фасадов заменены на 512',B);
 ok(B.kinds.join()==='1,2,3,5,5,0','материалы получили детали: трава, плитка, асфальт, листва, общий',B.kinds);
 ok(B.env===B.nb&&B.spec===B.nb&&B.glass&&B.road&&B.roadK===0,'отражения: окна (с маской стёкол), стёкла машин, сухой асфальт не отражает',B);
 ok(B.built===false,'модели на лету не меняются (нужен перезапуск)',B.built);
 ok(B.flags>10,'объекты отбрасывают тени',B.flags);
 ok(B.hi>.5&&B.hi<=.95&&B.si>.5&&B.si<1.3,'яркость света в разумных пределах',[B.hi,B.si]);

 console.log('[C] Сутки и погода: все значения конечны');
 let Cc=await pg.evaluate(()=>{const bad=[];let minY=9,nightI=null,noonI=null,dawn=null;let rkMax=0;for(const w of[[0,0,0,0],[1,0,1,0],[1,1,0,1]]){cloudI=w[0];fogI=w[1];rainI=w[2];snowI=w[3];wet=w[2];
   for(let t=0;t<24;t+=.25){WORLD.t=t;try{tick(.016);}catch(e){bad.push(t+':'+e.message);}const d=MG_ULTRA.sunDir;minY=Math.min(minY,d.y);rkMax=Math.max(rkMax,roadMat.reflectivity);if(!isFinite(sun.intensity)||sun.intensity<0||sun.intensity>1.3||!isFinite(hemi.intensity))bad.push('I@'+t);
    if(w[0]===0){if(t===0)nightI={i:sun.intensity,c:sun.color.b>sun.color.r,stars:MG_ULTRA.skyState.stars,moon:MG_ULTRA.skyState.moonVis};if(t===12)noonI={i:sun.intensity,stars:MG_ULTRA.skyState.stars,sv:MG_ULTRA.skyState.sunVis};if(t===6.5)dawn={r:MG_ULTRA.sunColor.r,b:MG_ULTRA.sunColor.b};}}}
   const rk=rkMax;cloudI=fogI=rainI=snowI=wet=0;WORLD.t=12;tick();return {bad,minY,nightI,noonI,dawn,rk,fail:Object.keys(MG_ULTRA.fail)};});
 ok(Cc.bad.length===0&&Cc.fail.length===0,'96 моментов суток × 3 погоды без ошибок и NaN',Cc.bad.slice(0,5));
 ok(Cc.minY>=.19,'свет не опускается ниже горизонта (нет бесконечных теней)',Cc.minY);
 ok(Cc.nightI.i>0&&Cc.nightI.i<.3&&Cc.nightI.c&&Cc.nightI.stars>.9&&Cc.nightI.moon>.5,'ночь: слабый голубой лунный свет, звёзды, луна',Cc.nightI);
 ok(Cc.noonI.i>.9&&Cc.noonI.stars===0&&Cc.noonI.sv>.9,'полдень: яркое солнце, звёзд нет',Cc.noonI);
 ok(Cc.dawn.r>Cc.dawn.b+.3,'рассвет: тёплый свет',Cc.dawn);
 ok(Cc.rk>0,'мокрый асфальт отражает небо',Cc.rk);

 console.log('[D] Помещения, вода, особые сцены');
 let D=await pg.evaluate(()=>{const S=MG_ULTRA.mods.sky._S;const r={};area='shop';tick();r.shop=S.dome.visible;r.hemiShop=hemi.color.getHex();area='city';tick();r.city=S.dome.visible;WORLD.t=12;area='neon';tick();r.dist={vis:S.dome.visible,stars:MG_ULTRA.skyState.stars,moonBlue:sun.color.b>sun.color.r,i:sun.intensity};area='city';tick();r.noonStars=MG_ULTRA.skyState.stars;window.MG_WATER={under:true};tick();r.under=S.dome.visible;MG_WATER.under=false;hemiOverride=.1;tick();r.ovr=S.dome.visible;r.hemiOvr=hemi.color.getHex();hemiOverride=null;tick();r.back=S.dome.visible;return r;});
 ok(!D.shop&&D.hemiShop===0xeaf4ff&&D.city,'в помещении небо скрыто и свет штатный, в городе возвращается',D);
 ok(D.dist.vis&&D.dist.stars>.9&&D.dist.moonBlue&&D.dist.i>0&&D.dist.i<.3&&D.noonStars===0,'в районах 1.12 (там всегда ночь) — ночное небо и лунный свет, в городе снова день',D);
 ok(!D.under&&!D.ovr&&D.hemiOvr===0xeaf4ff&&D.back,'под водой и в сценах с затемнением режим не вмешивается',D);

 console.log('[E] Отдельные переключатели');
 let E=await pg.evaluate(()=>{const U=MG_ULTRA,r={};const n=()=>{renderer.calls.length=0;tick();return renderer.calls.filter(c=>!(c.target&&c.target.isWebGLCubeRenderTarget)).length;};
   U.setOpt('ao',false);r.noAO=n();U.setOpt('bloom',false);r.noBloom=n();U.setOpt('fxaa',false);r.noFx=n();r.defs=Object.keys(U.mods.post._P.rt?{}:{}).length;U.setOpt('haze',false);U.setOpt('grade',false);r.none=n();r.direct=renderer.calls.slice(-1)[0].target===null&&renderer.calls.slice(-1)[0].main;r.live=THREE.WebGLRenderTarget.live;
   U.setOpt('grade',true);r.gradeOnly=n();U.setOpt('ao',true);U.setOpt('bloom',true);U.setOpt('fxaa',true);U.setOpt('haze',true);r.all=n();
   U.setOpt('res',.5);n();r.res=renderer.calls.filter(c=>c.main)[0].target.width;U.setOpt('res',1);
   U.setOpt('sky',false);tick();r.skyOff=!U.mods.sky._S.dome.visible;r.fogOff=fog.color.getHex();U.setOpt('sky',true);tick();
   U.setOpt('tex',false);r.texOff=[winTex.image.width,groundMat.userData.ultK,String(groundMat.onBeforeCompile).length<20,winTex.anisotropy];U.setOpt('tex',true);tick();r.texOn=[winTex.image.width,groundMat.userData.ultK];
   U.setOpt('refl',false);r.reflOff=[bldMats.some(m=>m.envMap),bldMats.some(m=>m.specularMap),!!roadMat.envMap];U.setOpt('refl',true);tick();tick();r.reflOn=bldMats.every(m=>m.envMap);
   MG_GFX.sets.length=0;U.setOpt('shadows',false);r.shOff=[MG_GFX.sets.length,U.shadowsOn];tick();r.shStill=renderer.shadowMap.enabled;U.setOpt('shadows',true);tick();r.shOn=[renderer.shadowMap.enabled,sun.castShadow];
   U.setOpt('shadowQ',2);tick();r.q2=sun.shadow.mapSize.x;U.setOpt('shadowQ',0);tick();r.q0=sun.shadow.mapSize.x;U.setOpt('shadowQ',1);
   U.setOpt('light',false);tick();r.lightOff=hemi.color.getHex();U.setOpt('light',true);tick();r.lightOn=hemi.color.getHex();
   U.tier=2;U.sync();r.t2=n();U.tier=3;U.sync();r.t3=n();r.t3res=renderer.calls.filter(c=>c.main)[0].target.width;U.tier=0;U.sync();r.t0=n();r.fail=Object.keys(U.fail);return r;});
 ok(E.noAO===6&&E.noBloom===3&&E.noFx===2&&E.none===1&&E.direct,'AO, свечение, FXAA отключаются по одному; без обработки кадр идёт напрямую',E);
 ok(E.gradeOnly===2&&E.all===7,'включение обратно возвращает полный конвейер',E);
 ok(E.res===430,'разрешение обработки 50% уменьшает буфер вдвое',E.res);
 ok(E.skyOff&&E.fogOff===0xb7d2ea,'небо выключается, цвет дымки снова игровой',E);
 ok(E.texOff[0]===256&&E.texOff[1]===undefined&&E.texOff[3]===4&&E.texOn[0]===512&&E.texOn[1]===1,'текстуры выключаются и включаются на лету',[E.texOff,E.texOn]);
 ok(!E.reflOff[0]&&!E.reflOff[1]&&!E.reflOff[2]&&E.reflOn,'отражения снимаются и возвращаются',E.reflOff);
 ok(E.shOff[0]>=1&&E.shOff[1]===false&&E.shStill===false&&E.shOn[0]&&E.shOn[1],'тени: выключение возвращает штатное состояние, включение работает',E);
 ok(E.q2===4096&&E.q0===1024,'качество теней меняет размер карты теней',[E.q0,E.q2]);
 ok(E.lightOff===0xeaf4ff&&E.lightOn!==0xeaf4ff,'свет по времени суток выключается и включается',E);
 ok(E.t2===6&&E.t3===3&&E.t3res<860&&E.t0===7&&E.fail.length===0,'авто-снижение: ступень 2 убирает AO, ступень 3 — свечение и часть разрешения',E);

 console.log('[F] Шейдерные вставки в материалы');
 let F=await pg.evaluate(()=>{const sh={vertexShader:'#include <common>\nvoid main(){\n#include <beginnormal_vertex>\n#include <begin_vertex>\n}',fragmentShader:'#include <common>\nvoid main(){\n#include <color_fragment>\n}'};groundMat.onBeforeCompile(sh);const a=sh.fragmentShader;groundMat.onBeforeCompile(sh);
   // имитация модуля графики 1.11: он заменяет перехват, не вызывая предыдущий
   const prev=walkMat.onBeforeCompile;walkMat.onBeforeCompile=function(s){s.fragmentShader+='//GFX';};for(let i=0;i<1100;i++)tick(.016);const sh2={vertexShader:sh.vertexShader.split('varying')[0]+'#include <common>\n#include <begin_vertex>',fragmentShader:'#include <common>\n#include <color_fragment>'};walkMat.onBeforeCompile(sh2);
   return {once:a===sh.fragmentShader,has:/ultDetail\(vUW,vUN,diffuseColor\.rgb\)/.test(a)&&/vUN=normalize/.test(sh.vertexShader),key:groundMat.customProgramCacheKey().indexOf('|ult1')>=0,rewrap:/GFX/.test(sh2.fragmentShader)&&/ultDetail/.test(sh2.fragmentShader)};});
 ok(F.has&&F.once&&F.key,'вставка добавляется один раз и меняет ключ программы',F);
 ok(F.rewrap,'после вмешательства модуля графики 1.11 вставка восстанавливается и не теряет его код',F);

 console.log('[G] Кнопка огня и зум');
 await pg.close();({pg,errs}=await page(null,true));
 let Gt=await pg.evaluate(async()=>{const U=MG_ULTRA,r={};U.set(true);tick();r.hiddenFirst=!document.getElementById('mgFireBig').classList.contains('on');
   bFire.classList.remove('hidden');tick();const b=document.getElementById('mgFireBig');r.shown=b.classList.contains('on')&&document.body.classList.contains('mg-ufire');r.origHidden=getComputedStyle(bFire).visibility==='hidden';r.size=b.getBoundingClientRect().width;
   const pe=(t,x,y)=>b.dispatchEvent(new PointerEvent(t,{pointerId:7,clientX:x,clientY:y,bubbles:true,cancelable:true,pointerType:'touch'}));
   pe('pointerdown',300,500);r.shot=shots;r.firing=firing;const y0=cam.yaw,p0=cam.pitch;pe('pointermove',303,501);r.tapNoTurn=cam.yaw===y0;pe('pointermove',340,520);r.turn=cam.yaw<y0&&cam.pitch>p0;pe('pointerup',340,520);r.stop=firing===false;
   pe('pointerdown',300,500);bFire.classList.add('hidden');tick();r.autoRelease=firing===false&&!b.classList.contains('on')&&!document.body.classList.contains('mg-ufire');
   bFire.classList.remove('hidden');U.setOpt('fireSize',1.5);tick();r.big=b.getBoundingClientRect().width;U.setOpt('fire',false);tick();r.off=!b.classList.contains('on')&&getComputedStyle(bFire).visibility!=='hidden';U.setOpt('fire',true);
   const cv=document.getElementById('c');const wh=d=>{const e=new WheelEvent('wheel',{deltaY:d,bubbles:true,cancelable:true});cv.dispatchEvent(e);return e.defaultPrevented;};
   r.prevented=wh(240);for(let i=0;i<60;i++)tick(.016);r.out=camLog.slice(-1)[0];r.cam1=window.CAMMUL;for(let i=0;i<40;i++)wh(240);for(let i=0;i<90;i++)tick(.016);r.max=camLog.slice(-1)[0];for(let i=0;i<80;i++)wh(-240);for(let i=0;i<90;i++)tick(.016);r.min=camLog.slice(-1)[0];
   r.saved=JSON.parse(localStorage.getItem('mg_ultra')).zoom;window.CAMMUL=2.2;tick();r.withGiant=camLog.slice(-1)[0];window.CAMMUL=1;started=false;const z=U.mods.controls._C.zoom;wh(240);r.menu=U.mods.controls._C.zoom===z;started=true;
   U.setOpt('wheel',false);tick();r.wheelOff=camLog.slice(-1)[0];return r;});
 ok(Gt.hiddenFirst&&Gt.shown&&Gt.origHidden&&Math.abs(Gt.size-84)<1,'большая кнопка появляется вместе со штатной 💥 и заменяет её',Gt);
 ok(Gt.shot===1&&Gt.firing===true&&Gt.stop,'нажатие запускает штатную стрельбу, отпускание — останавливает',Gt);
 ok(Gt.tapNoTurn&&Gt.turn,'короткое нажатие не трогает камеру, ведение пальцем — поворачивает',Gt);
 ok(Gt.autoRelease,'если оружие убрано во время огня, стрельба прекращается',Gt);
 ok(Math.abs(Gt.big-126)<1&&Gt.off,'размер настраивается; выключение возвращает штатную кнопку',Gt);
 ok(Gt.prevented&&Gt.out>1.2&&Gt.out<1.4&&Gt.cam1===1,'колёсико вниз отдаляет камеру плавно, игровой множитель не портится',Gt);
 ok(Math.abs(Gt.max-2.2)<.01&&Math.abs(Gt.min-.55)<.01,'пределы зума 0.55–2.2',[Gt.min,Gt.max]);
 ok(Gt.saved>.5&&Gt.saved<.6&&Math.abs(Gt.withGiant-2.2*.55)<.02,'зум сохраняется и умножается на игровые эффекты',Gt);
 ok(Gt.menu&&Gt.wheelOff===1,'в меню колёсико не действует; выключение зума возвращает камеру',Gt);
 ok(errs.length===0,'ошибок JavaScript нет',errs.slice(0,4));

 console.log('[H] Выключение возвращает всё как было');
 let Hh=await pg.evaluate(()=>{const U=MG_ULTRA;U.setOpt('wheel',true);for(let i=0;i<5;i++)tick();MG_GFX.sets.length=0;U.set(false);renderer.calls.length=0;tick();tick();
   return {calls:renderer.calls.map(c=>[c.main,c.target===null]),dome:U.mods.sky._S.dome.visible,hemi:hemi.color.getHex(),gnd:hemi.groundColor.getHex(),fog:fog.color.getHex(),win:winTex.image.width,env:bldMats.some(m=>m.envMap)||!!roadMat.envMap||!!mat(0x2a3646).envMap,patched:[groundMat,walkMat,roadMat,roofMat].map(m=>m.userData.ultK),gfx:MG_GFX.sets,sh:renderer.shadowMap.enabled,big:document.getElementById('mgFireBig').classList.contains('on'),cls:document.body.classList.contains('mg-ufire'),cam:camLog.slice(-1)[0],rts:THREE.WebGLRenderTarget.live,hi:hemi.intensity,si:sun.intensity,boot:localStorage.getItem('mg_ultra_boot'),stored:JSON.parse(localStorage.getItem('mg_ultra')).on};});
 ok(Hh.calls.length===2&&Hh.calls.every(c=>c[0]&&c[1]),'кадр снова рисуется напрямую',Hh.calls);
 ok(!Hh.dome&&Hh.hemi===0xeaf4ff&&Hh.gnd===0x5e604c&&Hh.fog===0xb7d2ea&&Hh.hi===.95&&Hh.si===.7,'небо скрыто, свет и дымка игровые',Hh);
 ok(Hh.win===256&&!Hh.env&&Hh.patched.every(k=>k===undefined),'текстуры, отражения и материалы возвращены',Hh);
 ok(Hh.gfx.length>=1&&!Hh.sh,'состояние теней возвращено через штатный модуль графики',Hh);
 ok(!Hh.big&&!Hh.cls&&Hh.cam===1&&Hh.stored===false,'кнопка, зум и сохранённый флаг выключены',Hh);
 ok(Hh.rts<=1,'буферы обработки освобождены',Hh.rts);

 console.log('[I] Запуск с включённым режимом: модели');
 await pg.close();({pg,errs}=await page({mg_ultra:JSON.stringify({on:true})}));
 let I=await pg.evaluate(()=>{const U=MG_ULTRA;const r={active:U.active,built:U.built.models,added:BUILT.added,cols:BUILT.cols,carKids:BUILT.car.children.length,dynKids:BUILT.dyn.children.length,boot0:localStorage.getItem('mg_ultra_boot')};
   const kids=cityG.children;r.blobs=kids.filter(o=>o.isMesh&&o.geometry!==G.sph&&leafMats.includes(o.material)).length;r.sph=kids.filter(o=>o.isMesh&&o.geometry===G.sph&&leafMats.includes(o.material)).length;r.cones=kids.filter(o=>o.isMesh&&o.material===pineMat&&o.geometry!==G.cone).length;
   r.taper=BUILT.car.children.slice(1,4).every(m=>m.geometry!==G.box)&&BUILT.car.children[0].geometry===G.box;r.wheelsHi=BUILT.car.children.filter(m=>m.geometry.parameters&&m.geometry.parameters.radialSegments===18).length;r.vgW=BUILT.vg.children.length;
   r.parkSt=BUILT.car.children.every(m=>m.userData.st===false);const bk=BUILT.car.children[BUILT.car.children.length-1].geometry;bk.computeBoundingSphere();r.hubVerts=bk.attributes.position.count;r.hubNaN=[...bk.attributes.position.array].some(v=>!isFinite(v));r.lampKids=BUILT.lamp.children.length;r.benchKids=BUILT.bench.children.length;r.top=BUILT.b.userData.top;r.treePos=treePos.length;r.liftl=LIFTL.length;r.parkq=PARKQ.length;r.benches=BENCHES.length;
   for(let i=0;i<100;i++)tick();r.boot1=localStorage.getItem('mg_ultra_boot');r.fail=Object.keys(U.fail);r.log=U.log;return r;});
 ok(I.active&&I.built&&I.fail.length===0,'режим активен с запуска, модели установлены, ошибок модулей нет',[I.fail,I.log]);
 ok(I.added>BASE.added&&I.cols===BASE.cols,'деталей стало больше, а коллизий ровно столько же ('+BASE.added+' → '+I.added+' объектов, '+I.cols+' коллизий)',I);
 ok(I.blobs>=40&&I.sph===0&&I.cones>0,'кроны деревьев заменены гранёными, у ёлок новый ярус',I);
 ok(I.taper&&I.wheelsHi===4&&I.carKids>BASE.carKids&&I.dynKids===I.carKids&&I.parkSt,'машины: скошенная кабина, круглые колёса с колпаками, бамперы, зеркала',I);
 ok(I.hubVerts>0&&!I.hubNaN,'запечённые детали машин: геометрия без пустот и NaN',I.hubVerts);
 ok(I.vgW===8,'спецтехника: колёса с колпаками',I.vgW);
 ok(I.lampKids===3&&I.benchKids===BASE.benchKids+2&&I.carKids===BASE.carKids+4,'фонари и скамейки дополнены',I);
 ok(I.top===18&&I.treePos===40&&I.liftl===1&&I.parkq===1&&I.benches===1,'игровые списки (деревья, фонари, парковка, скамейки) не изменились',I);
 ok(I.boot0==='1'&&I.boot1===null,'счётчик запуска заведён и снят после 90 кадров',[I.boot0,I.boot1]);
 ok(errs.length===0,'ошибок JavaScript нет',errs.slice(0,4));

 console.log('[J] Защита');
 await pg.close();({pg,errs}=await page({mg_ultra:JSON.stringify({on:true}),mg_ultra_boot:'2'}));
 let J=await pg.evaluate(async()=>{await new Promise(r=>setTimeout(r,1800));const U=MG_ULTRA;return {safe:U.safeOff,active:U.active,stored:JSON.parse(localStorage.getItem('mg_ultra')).on,boot:localStorage.getItem('mg_ultra_boot'),toast:toasts.join('|'),added:BUILT.added,tree:/^function tree\(x,z,s\)/.test(tree.toString())};});
 ok(J.safe&&!J.active&&J.stored===false&&J.boot===null&&/отключён/.test(J.toast),'два незавершённых запуска → режим отключён с сообщением',J);
 ok(J.added===BASE.added&&J.tree,'карта при этом построена по-старому',J);
 let J2=await pg.evaluate(async()=>{const U=MG_ULTRA;U.set(true);tick();const before=Object.keys(U.fail).length;console.error('THREE.WebGLProgram: shader error: ',0,'VALIDATE_STATUS false');await new Promise(r=>setTimeout(r,50));renderer.calls.length=0;tick();
   return {before,fail:Object.keys(U.fail).sort(),direct:renderer.calls.length===1&&renderer.calls[0].target===null,dome:U.mods.sky._S.dome.visible,win:winTex.image.width,toast:toasts.slice(-1)[0],ctl:!U.fail.controls};});
 ok(J2.before===0&&J2.fail.join()==='post,sky,world'&&J2.direct&&!J2.dome&&J2.win===256&&/шейдер/.test(J2.toast)&&J2.ctl,'ошибка компиляции шейдера → графика режима отключается, игра рисуется по-старому',J2);
 let J3=await pg.evaluate(()=>{const U=MG_ULTRA;U.set(false);U.set(true);tick();const o=renderer.setRenderTarget;let n=0;renderer.setRenderTarget=function(t){if(t&&n++===0)throw new Error('boom');return o(t);};renderer.calls.length=0;let thrown=null;try{tick();}catch(e){thrown=e.message;}renderer.setRenderTarget=o;const first=renderer.calls.length;tick();
   return {thrown,first,direct:renderer.calls.slice(-1)[0].target===null&&renderer.calls.slice(-1)[0].main,fail:Object.keys(U.fail),sky:U.mods.sky._S.dome.visible};});
 ok(J3.thrown===null&&J3.first>=1&&J3.direct&&J3.fail.join()==='post'&&J3.sky,'сбой обработки в середине кадра: кадр всё равно нарисован, отключается только обработка',J3);

 console.log('[K] Страница настроек');
 let K=await pg.evaluate(()=>{const U=MG_ULTRA;U.set(false);const body=document.createElement('div');document.body.appendChild(body);
   const el=(t,c,h)=>{const e=document.createElement(t);if(c)e.style.cssText=c;if(h!==undefined)e.innerHTML=h;return e;};
   const A={body,el,H:t=>el('h3','',t),pc:v=>Math.round(v*100)+'%',tog:(l,s,on,fn)=>{const b=el('button');b.className='tg'+(on?' on2':'');b.innerHTML=(on?'✅ ':'⬜ ')+l+(s?'<small>'+s+'</small>':'');b.onclick=fn;return b;},
    slider:(l,v,a,b2,st,f,fn)=>{const w=el('div');w.className='sl';w.textContent=l+' '+f(v);w._fn=fn;return w;},choice:(l,s,o,c,fn)=>{const w=el('div');w.className='ch';w.textContent=l;o.forEach(x=>{const b=el('button');b.textContent=x[1];b.onclick=()=>{fn(x[0]);A.rerender();};w.appendChild(b);});return w;},rerender(){body.innerHTML='';U.renderSettings(A);}};
   A.rerender();const r={offTogs:body.querySelectorAll('.tg').length,offText:body.textContent.slice(0,60)};body.querySelector('.tg').click();r.on=U.opt.on;r.togs=body.querySelectorAll('.tg').length;r.heads=[...body.querySelectorAll('h3')].map(h=>h.textContent);
   r.restart=/после перезапуска/.test(body.textContent);const m=[...body.querySelectorAll('.tg')].find(b=>/Ambient/.test(b.textContent));m.click();r.ao=U.opt.ao;r.aoChoiceGone=![...body.querySelectorAll('.ch')].some(c=>/затенения/.test(c.textContent));
   [...body.querySelectorAll('.bt2')].find(b=>/Сбросить/.test(b.textContent)).click();r.reset=U.opt.ao===true&&U.opt.on===true;return r;});
 ok(K.offTogs===1,'при выключенном режиме виден только главный переключатель',K);
 ok(K.on&&K.togs>=14&&K.heads.length===6,'после включения — все разделы и отдельные переключатели',[K.togs,K.heads]);
 ok(K.restart,'для моделей показано, что нужен перезапуск',K);
 ok(K.ao===false&&K.aoChoiceGone&&K.reset,'переключатели и сброс работают',K);
 ok(errs.filter(e=>!/shader error|boom/.test(e)).length===0,'посторонних ошибок JavaScript нет',errs.slice(0,4));
 console.log('\n══ ULTRA (логика на заглушке): '+pass+' ок, '+fail+' провалов ══');await br.close();process.exit(fail?1:0);
})().catch(e=>{console.error('УПАЛ',e);process.exit(2);});
