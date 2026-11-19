const { chromium } = require('playwright');
let pass=0,fail=0;const ok=(c,n,x)=>{c?pass++:fail++;console.log(c?'  ✔':'  ✘ ПРОВАЛ:',n,c?'':JSON.stringify(x));};
(async()=>{
 const br=await chromium.launch({args:['--no-sandbox']});
 async function page(init){const pg=await br.newPage({viewport:{width:900,height:700}});const errs=[];pg.on('pageerror',e=>errs.push(String(e)));pg.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
  if(init)await pg.addInitScript(init);
  await pg.goto('file:///home/claude/h14/index.html');await pg.waitForFunction(()=>window.MG_L14&&MAIN.some(m=>m.id==='baton14'),null,{timeout:9000});
  await pg.evaluate(()=>{
   window.M=MG_L14;window.idle=()=>new Promise(r=>{const t0=Date.now();(function f(){if(cut===0&&!M.W.busy)return r(true);if(Date.now()-t0>20000)return r(false);setTimeout(f,25);})();});
   window.find=(label,ar)=>inters.filter(o=>o.label===label&&(o.area||'city')===(ar||area));
   window.pOf=o=>typeof o.p==='function'?o.p():o.p;
   // выполнить действие: подходящая точка в текущей области, условие ok() истинно; игрок переносится к точке
   window.act=async(label,opt)=>{opt=opt||{};const L=find(label).filter(o=>pOf(o)&&(!o.ok||o.ok()));if(!L.length)return 'нет точки: '+label;const o=L[0],p=pOf(o);if(!opt.stay)player.pos.set(p.x,0,p.z);const n=toasts.length;o.act();await new Promise(r=>setTimeout(r,30));await idle();return toasts.slice(n).join(' | ')||'ok';};
   window.sw=()=>{if(!canSwitch())return false;doSwitch();return true;};
   window.be=h=>{if(player!==h){if(!canSwitch())throw new Error('нельзя переключиться');doSwitch();}};
   window.ticks=n=>new Promise(r=>setTimeout(r,n*20));
   setInterval(()=>{const b=document.getElementById('mgCardBtn');if(b&&b.style.display==='block')b.click();},150);
   {const oc=MG_STORY.card;MG_STORY.card=function(){window.__cards=(window.__cards||0)+1;return oc.apply(this,arguments);};}
   window.freeAt=(x,z)=>{const q={x,z};collide(q,.35);return Math.hypot(q.x-x,q.z-z)<.02;};
   window.flood=(sx,sz,lim)=>{const st=.5,seen=new Set(),Q=[[Math.round(sx/st),Math.round(sz/st)]];const key=(i,j)=>i+','+j;if(!freeAt(Q[0][0]*st,Q[0][1]*st))return {n:0,has:()=>false};seen.add(key(Q[0][0],Q[0][1]));
     while(Q.length&&seen.size<(lim||60000)){const [i,j]=Q.pop();for(const [a,b] of [[1,0],[-1,0],[0,1],[0,-1]]){const ni=i+a,nj=j+b,k=key(ni,nj);if(seen.has(k))continue;if(!freeAt(ni*st,nj*st)||!freeAt((i+a/2)*st,(j+b/2)*st))continue;seen.add(k);Q.push([ni,nj]);}}
     return {n:seen.size,has:(x,z,r)=>{r=r||1;for(let dx=-r;dx<=r;dx+=st)for(let dz=-r;dz<=r;dz+=st){if(dx*dx+dz*dz>r*r)continue;if(seen.has(key(Math.round((x+dx)/st),Math.round((z+dz)/st))))return true;}return false;}};};
  });
  return {pg,errs};}

 let {pg,errs}=await page();
 console.log('[A] Подключение к основному сюжету');
 let A=await pg.evaluate(()=>({order:MAIN.map(m=>m.id),title:MAIN.find(m=>m.id==='baton14').title,avail:M.avail(),hint:objective(),hole:find('🕳️ Подойти к дыре','city').length,ok:find('🕳️ Подойти к дыре','city')[0].ok(),door:find('🚪 Войти на хлебозавод','city')[0].ok(),holeVis:M.W.cityHole.g.visible,anton:BREADF.anton.visible,oldAnton:inters.find(o=>o.label==='🐇 Антон-Батон').p()}));
 ok(A.order.join()==='ufo,points,chek,svet,baton14'&&/Дыра в центре города/.test(A.title),'дело стоит в «Списке дел» сразу после «Тайны Дикси и Светофора»',A.order);
 ok(A.avail&&/Новое дело/.test(A.hint.t)&&Math.abs(A.hint.p.x-4.3)<.1,'после «Светофора» цель ведёт к дыре на главном перекрёстке',A.hint);
 ok(A.hole===1&&A.ok&&!A.door&&A.holeVis,'дыра видна, к ней можно подойти; на хлебозавод пока не пускают',A);
 ok(A.anton===false&&A.oldAnton===null,'Антона у завода нет (он появится в конце)',A);
 let A2=await pg.evaluate(()=>{S.q.svet=false;const r={avail:M.avail(),ok:find('🕳️ Подойти к дыре','city')[0].ok(),hint:objective().t};S.q.svet=true;return r;});
 ok(!A2.avail&&!A2.ok&&A2.hint==='main','пока «Светофор» не пройден, дело недоступно и ничего не подсказывает',A2);

 console.log('[B] Толчок в дыру и сцена с учёным');
 let B=await pg.evaluate(async()=>{player.pos.set(4.3,0,4.3);const n=spoke.length;find('🕳️ Подойти к дыре','city')[0].act();await new Promise(r=>setTimeout(r,100));const fixedDuring=!!cam.fixed;await idle();await ticks(5);await idle();
   const lines=spoke.slice(n).map(l=>l[0]+': '+l[1]);return {area,stage:M.Q().stage,met:M.Q().met,lines,fixedDuring,fixed:cam.fixed,ovr:player.ovr||null,sc:[player.g.scale.x,comp.g.scale.x],vis:[player.g.visible,comp.g.visible,comp.hidden],lvl:!!MG_STORY.lvl,obj:objective().t,pl:[player.pos.x-M.K.dark.ox,player.pos.z-M.K.dark.oz],cloak:M.N.cloak.hidden,sciD:M.N.sciD.hidden,shards:M.N.shards.map(s=>s.visible),toast:toasts.slice(-1)[0]};});
 ok(B.area==='p14_dark'&&B.stage===1&&B.met===true,'после сцены герои в тёмном мире, этап сохранён',B);
 ok(B.fixedDuring&&B.fixed===null,'во время толчка камера зафиксирована, потом отпущена',B);
 ok(B.lines.some(l=>/Толчок в спину/.test(l))&&B.lines.some(l=>/чёрном плаще.*зелёный портал/.test(l)),'видно: толкнул человек в чёрном плаще и ушёл в зелёный портал',B.lines.slice(0,8));
 ok(B.lines.some(l=>/снимает капюшон/.test(l))&&B.lines.some(l=>/^sci: .*батон не у вас/.test(l))&&B.lines.some(l=>/^sci: Но я знаю, что вы знаете, где он/.test(l))&&B.lines.some(l=>/^sci: .*догадки, где он может быть/.test(l))&&B.lines.some(l=>/^sci: .*пока вы здесь, мне ничто не помешает его украсть/.test(l)),'учёный снимает капюшон и говорит свои реплики',B.lines);
 ok(B.ovr===null&&B.sc[0]===1&&B.sc[1]===1&&B.vis[0]&&B.vis[1]&&!B.vis[2]&&B.cloak&&B.sciD,'после сцены герои целы и видимы, актёры сцены убраны',B);
 ok(B.lvl&&/осколки портала: 0\/3/.test(B.obj)&&B.shards.every(Boolean)&&/меняться героями/.test(B.toast),'цель: собрать 3 осколка; объяснено переключение героев',B);

 console.log('[C] Тёмный мир: проходимость и роли героев');
 let C=await pg.evaluate(async()=>{const k=M.K.dark,r={};const F=flood(k.ox,k.oz+40);r.cells=F.n;
   r.reach={shard0:F.has(k.ox-30,k.oz+10,2),crack:F.has(k.ox+24.6,k.oz+5,1.8),pile:F.has(k.ox,k.oz-7.2,2.2),frame:F.has(k.ox,k.oz-37.6,2.5),inside:F.has(k.ox+30,k.oz+5,2.5)};
   r.sw0=canSwitch();be(marya);const p0={x:player.pos.x,z:player.pos.z};
   r.crackMarya=await act('🪿 Пролезть в щель');r.maryaIn=player.pos.x-k.ox>26;
   be(gus);comp.pos.set(k.ox+22,0,k.oz+5);r.crackGus=await act('🪿 Пролезть в щель');r.gusIn=[player.pos.x-k.ox,player.pos.z-k.oz];r.maryaStayed=comp.pos.x-k.ox<26;
   r.insideFree=freeAt(player.pos.x,player.pos.z);const Fi=flood(player.pos.x,player.pos.z,4000);r.insideReach=Fi.has(k.ox+31.5,k.oz+5,1.9)&&Fi.has(k.ox+27.6,k.oz+5,1.6)&&!Fi.has(k.ox+22,k.oz+5,1);
   r.t1=await act('🟢 Взять осколок портала');r.out=await act('🪿 Вылезти обратно');r.gusOut=player.pos.x-k.ox<26;
   r.frameEarly=await act('🌀 Рамка выхода');r.areaEarly=area;
   r.t0=await act('🟢 Взять осколок портала');
   r.pileGus=await act('👩 Дотянуться до осколка на вершине');r.sh2=M.Q().sh[2];be(marya);r.pileMarya=await act('👩 Дотянуться до осколка на вершине');r.sh=M.Q().sh.slice();r.obj=objective().t;
   return r;});
 ok(C.reach.shard0&&C.reach.crack&&C.reach.pile&&C.reach.frame,'до всех точек тёмного мира можно дойти пешком',C.reach);
 ok(!C.reach.inside,'внутрь обломка стены пешком не попасть (только через щель)',C.reach);
 ok(C.sw0,'в тёмном мире героев можно менять в любом месте',C.sw0);
 ok(/только Гусь/.test(C.crackMarya)&&!C.maryaIn,'Марья в щель не пролезает и получает подсказку',C.crackMarya);
 ok(C.gusIn[0]>26.3&&C.gusIn[0]<33.7&&C.maryaStayed&&C.insideFree&&C.insideReach,'Гусь пролезает один, Марья остаётся снаружи; внутри есть осколок и выход',C);
 ok(/1\/3/.test(C.t1)&&C.gusOut,'Гусь берёт осколок и вылезает обратно',C);
 ok(/Нужны три осколка/.test(C.frameEarly)&&C.areaEarly==='p14_dark','рамка без трёх осколков не открывается',C.frameEarly);
 ok(/только Марья/.test(C.pileGus)&&C.sh2===false&&C.sh.every(Boolean)&&/Вставить осколки/.test(C.obj),'осколок с вершины достаёт только Марья; собраны все три',C);
 let C2=await pg.evaluate(async()=>{const n=spoke.length;const t=await act('🌀 Рамка выхода');await idle();return {area,stage:M.Q().stage,lvl:!!MG_STORY.lvl,pos:[player.pos.x,player.pos.z],hint:objective(),hole:(M.tick(.04,1),M.W.cityHole.g.visible),door:find('🚪 Войти на хлебозавод','city')[0].ok(),lines:spoke.slice(n).length,chip:document.getElementById('p14mode').style.display};});
 ok(C2.area==='city'&&C2.stage===2&&!C2.lvl&&Math.hypot(C2.pos[0],C2.pos[1])<12,'портал выводит обратно на главный перекрёсток',C2);
 ok(/хлебозавода/.test(C2.hint.t)&&Math.abs(C2.hint.p.x-521)<.5&&C2.door&&!C2.hole&&C2.chip==='none','цель ведёт к проходной хлебозавода; дыра с перекрёстка исчезла',C2);

 console.log('[D] Хлебозавод: планировка и проходимость');
 let Dd=await pg.evaluate(async()=>{const r={};const t=await act('🚪 Войти на хлебозавод');for(let i=0;i<100&&area!=='p14_fab';i++)await ticks(2);await idle();const k=M.K.fab,z=M.Z2,X=x=>k.ox+x,Z=v=>k.oz+v;r.area=area;r.stage=M.Q().stage;r.hemi=(await ticks(3),hemiOverride);r.obj=objective();r.pl=[player.pos.x-k.ox,player.pos.z-k.oz];r.sw=canSwitch();r.chip=document.getElementById('p14mode').style.display;
   const W1=flood(X(0),Z(32.5)),F2=flood(X(-8.4),Z(z+20.6)),E1=flood(X(57.6),Z(15.4));
   r.w={stairs:W1.has(X(-7.6),Z(23.6),2),giant:W1.has(X(0),Z(10.9),2.4),exit:W1.has(X(0),Z(34.4),2.2),hall:W1.has(X(0),Z(-10),2),east:W1.has(X(12),Z(6.5),1.5),f2:W1.has(X(0),Z(z+20),3)};
   r.f2={labA:F2.has(X(-5),Z(z+8),2),labB:F2.has(X(9),Z(z+8),2),shelf:F2.has(X(14.2),Z(z+5),1.8),ventA:F2.has(X(1.1),Z(z+13.5),1.4),ventB:F2.has(X(2.9),Z(z+13.5),1.4),ctlDoor:F2.has(X(28),Z(z+17.5),1.8),ctlIn:F2.has(X(28),Z(z+9),3),stB:F2.has(X(59.4),Z(z+20.6),2),stA:F2.has(X(-9.4),Z(z+20.6),2),crate:F2.has(X(46),Z(z+6),2.2),spot:F2.has(X(46),Z(z+6),.4),mirTalk:F2.has(X(47.6),Z(z+12),2),east:F2.has(X(55),Z(z+6),3),cage:F2.has(X(41.6),Z(z-6),1.6),f1:F2.has(X(0),Z(30),4)};
   r.e={mixer:E1.has(X(40),Z(-2.9),2.1),glut:E1.has(X(35),Z(3.4),2.1),duct:E1.has(X(44.7),Z(-8),1.7),thermo:E1.has(X(48.5),Z(-1.7),1.7),freezer:E1.has(X(54),Z(-7),2),starter:E1.has(X(56.6),Z(-8.6),1.8),stairs:E1.has(X(58.6),Z(17.4),2),giantE:E1.has(X(4.6),Z(6.5),2.2),hall:E1.has(X(0),Z(-10),2),lobby:E1.has(X(0),Z(30),3),store:E1.has(X(-38),Z(6),3)};
   // после открытия пультовой, сдвига ящика, открытия решётки и ухода Великана
   const f=M.F();Object.assign(f,{door:true,crate:true,flour:true,giant:true});M.applyState();
   const F2b=flood(X(-8.4),Z(z+20.6)),E1b=flood(X(57.6),Z(15.4));
   r.after={ctlIn:F2b.has(X(28),Z(z+9),2),plug:F2b.has(X(34.6),Z(z+3.6),1.7),lever:F2b.has(X(21.4),Z(z+9),1.8),spot:F2b.has(X(46),Z(z+6),.4),cage:F2b.has(X(41.6),Z(z-6),1.8),mirEast:!F2b.has(X(55),Z(z+6),3),hall:E1b.has(X(0),Z(-18),2.4),lobby:E1b.has(X(0),Z(34.4),2.2),store:E1b.has(X(-36),Z(10),3),doorJ:E1b.has(X(0),Z(6.4),.6)};
   Object.assign(f,{door:false,crate:false,flour:false,giant:false});M.applyState();return r;});
 ok(Dd.area==='p14_fab'&&Dd.stage===3&&Dd.hemi===.8&&Dd.sw&&Dd.chip==='block','вход в проходную: этап сохранён, свет включён, герои переключаются, кнопка «вместе/жди» видна',Dd);
 ok(Dd.w.stairs&&Dd.w.giant&&Dd.w.exit&&!Dd.w.hall&&!Dd.w.east&&!Dd.w.f2,'1 этаж: из проходной доступны лестница А и выход; дальше проход закрыт Великаном',Dd.w);
 ok(/2 этаж, лаборатории/.test(Dd.obj.t)&&Math.abs(Dd.obj.p.x-(MGX=0)-(Dd.obj.p.x))<1,'цель сразу объясняет, что идти надо через 2 этаж',Dd.obj);
 ok(Dd.f2.labA&&Dd.f2.labB&&Dd.f2.shelf&&Dd.f2.ventA&&Dd.f2.ventB&&Dd.f2.ctlDoor&&Dd.f2.stB&&Dd.f2.stA&&Dd.f2.crate&&Dd.f2.mirTalk,'2 этаж: лаборатории, вентиляция, полка, дверь пультовой, зеркальный зал и обе лестницы доступны',Dd.f2);
 ok(!Dd.f2.ctlIn&&!Dd.f2.spot&&!Dd.f2.east&&!Dd.f2.cage&&!Dd.f2.f1,'2 этаж: закрыты пультовая, место под ящиком, сторона Антона-Зеркального и клетка с мукой',Dd.f2);
 ok(Dd.e.mixer&&Dd.e.glut&&Dd.e.duct&&Dd.e.thermo&&Dd.e.freezer&&Dd.e.starter&&Dd.e.stairs&&Dd.e.giantE,'пекарный цех (с лестницы Б): тестомес, Обжора, воздуховод, термостат, морозилка доступны',Dd.e);
 ok(!Dd.e.hall&&!Dd.e.lobby&&!Dd.e.store,'из цеха мимо Великана не пройти: печной зал, проходная и склад закрыты',Dd.e);
 ok(Object.values(Dd.after).every(Boolean),'после решения загадок открываются пультовая, место, клетка, печной зал и прямой путь к выходу',Dd.after);

 console.log('[E] Антоны: к каждому свой подход');
 let E=await pg.evaluate(async()=>{const r={},k=M.K.fab,z=M.Z2,X=x=>k.ox+x,Z=v=>k.oz+v,f=M.F(),put=(a,x,zz)=>a.pos.set(X(x),0,Z(zz));
   // --- Великан
   be(marya);r.giantTalk=await act('😴 Антон-Великан');
   // --- лестница: напарник рядом идёт следом, далеко или «ждёт» — остаётся
   M.W.mode='follow';put(comp,-6,24);await act('🪜 Лестница А — на 2 этаж');r.st={me:player.pos.z-k.oz>100,he:comp.pos.z-k.oz>100};
   // --- Призрак
   put(player,-5,z+10);put(comp,-4,z+11);await ticks(8);r.g1={at:M.W.ghost.at,esc:M.W.ghost.esc,corner:M.W.ghost.corner,catch:find('👻 Поймать Антона-Призрака').some(o=>pOf(o))};await ticks(60);
   put(player,9,z+10);put(comp,8,z+11);await ticks(8);r.g2={at:M.W.ghost.at,esc:M.W.ghost.esc};await ticks(60);
   // напарник ждёт в лаборатории Б, игрок заходит в А
   put(comp,9,z+9);M.W.mode='wait';put(player,-5,z+10);await ticks(10);r.g3={at:M.W.ghost.at,corner:M.W.ghost.corner,compStayed:Math.abs(comp.pos.x-X(9))<.5};
   r.doorEarly=await (async()=>{const o=find('🪪 Приложить пропуск')[0];const p=pOf(o);const keep=[player.pos.x,player.pos.z];const n=toasts.length;o.act();await ticks(2);const t=toasts.slice(n).join('|');return t;})();r.doorEarlyFlag=!!f.door;
   const c=find('👻 Поймать Антона-Призрака').filter(o=>pOf(o))[0];r.catchP=!!c;c.act();await ticks(3);await idle();r.pass=f.pass;r.ghostVis=M.N.ghost.visible;M.W.mode='follow';
   // --- пультовая
   r.door=await act('🪪 Приложить пропуск');r.doorCol=M.N.ctlCol.on;
   be(marya);put(player,28,z+12);M.N.robot.position.set(X(23),0,Z(z+12));M.N.robot.rotation.y=Math.PI/2;M.W.grace=0;await ticks(6);r.zap={out:player.pos.z-k.oz>z+16.5,toast:/ЧЕЛОВЕК ОБНАРУЖЕН/.test(toasts.slice(-1)[0])};
   be(gus);M.W.grace=0;put(player,28,z+12);await ticks(40);r.gusUnseen=player.pos.z-k.oz<z+16;
   be(marya);r.leverEarly=await act('🎚️ Рубильник «ЛИНИЯ 1»',{stay:true});r.powerEarly=!!f.power;put(player,28,z+19);
   r.plugMarya=await (async()=>{const o=find('🔌 Выдернуть вилку Робо-Антона')[0];const n=toasts.length;o.act();await ticks(2);return toasts.slice(n).join('|');})();
   be(gus);await act('🔌 Выдернуть вилку Робо-Антона');r.robot=f.robot;
   r.leverGus=await act('🎚️ Рубильник «ЛИНИЯ 1»');r.p1=!!f.power;be(marya);M.W.grace=0;await act('🎚️ Рубильник «ЛИНИЯ 1»');await ticks(20);r.power=f.power;r.maryaSafe=Math.abs(player.pos.x-X(21.4))<.5;
   // --- зеркальный зал
   be(gus);r.crateGus=await act('📦 Сдвинуть ящик');r.c1=!!f.crate;be(marya);await act('📦 Сдвинуть ящик');r.crate=f.crate;r.crateCol=[M.N.crateCol.on,M.N.crateCol2.on];
   M.W.mode='wait';put(gus,46,z+6);put(marya,45,z+12);await ticks(40);r.mir={p:[M.N.mirrorP.x,M.N.mirrorP.z-z],gate:M.N.gateCol.on};
   put(gus,43,z+2);await ticks(40);r.mir2={p:[M.N.mirrorP.x,M.N.mirrorP.z-z],gate:M.N.gateCol.on};
   put(gus,46,z+6);await ticks(40);be(marya);put(marya,42,z-6);await ticks(4);put(gus,45,z+10);await ticks(30);r.cageSafe=M.N.gateCol.on===false;
   put(gus,46,z+6);await ticks(40);be(marya);r.flourT=await act('🌾 Взять мешок муки');r.flour=f.flour;put(gus,45,z+12);put(marya,45,z+12);await ticks(30);r.gateAfter=M.N.gateCol.on;
   // --- вниз по лестнице Б, морозилка
   M.W.mode='follow';put(comp,58,z+21);be(marya);await act('🪜 Лестница Б — на 1 этаж');r.down={me:player.pos.z-k.oz<100,he:comp.pos.z-k.oz<100};
   put(player,54,-7);M.W.cold=0;await ticks(190);r.cold={out:player.pos.z-k.oz>-3,toast:/Слишком холодно/.test(toasts.slice(-1)[0])};
   r.thermoEarly=await act('🌡️ Термостат морозилки');r.thawEarly=!!f.thaw;r.ductMarya=await act('🪿 Воздуховод морозилки');r.d1=!!f.duct;
   be(gus);await act('🪿 Воздуховод морозилки');r.duct=f.duct;r.thermoGus=await act('🌡️ Термостат морозилки');r.t1=!!f.thaw;be(marya);await act('🌡️ Термостат морозилки');r.thaw=f.thaw;r.iceCol=M.N.iceCol.on;
   put(player,54,-7);await ticks(190);r.warm=player.pos.z-k.oz<-3;await act('🧈 Взять закваску');r.starter=f.starter;
   // --- тестомес, Обжора, Великан
   const n0=spoke.length;await act('🥣 Тестомес');r.baked=f.baked;r.eaten=spoke.slice(n0).some(l=>/исчезает в Антоне-Обжоре/.test(l[1]));r.giant1=!!f.giant;
   r.mix2=await act('🥣 Тестомес');r.glutNo=await act('🍞 Антон-Обжора');r.fed0=!!f.fed;
   await act('🪜 Лестница Б — на 2 этаж');be(gus);r.rubGus=await act('🥖 Верхняя полка: резиновый батон');r.rb0=!!f.rubber;be(marya);await act('🥖 Верхняя полка: резиновый батон');r.rubber=f.rubber;
   M.W.mode='follow';put(comp,13,z+6);await ticks(2);put(player,58,z+20.6);put(comp,57,z+21);await act('🪜 Лестница Б — на 1 этаж');await act('🍞 Антон-Обжора');r.fed=f.fed;
   const n1=spoke.length;await act('🥣 Тестомес');r.giant=f.giant;r.giantCol=M.N.giantCol.on;r.giantLines=spoke.slice(n1).some(l=>/Великан уходит за батоном на склад/.test(l[1]));r.giantPos=M.N.giant.position.x-k.ox;
   r.obj=objective().t;return r;});
 ok(/спит поперёк коридора|лестница на второй этаж/.test(JSON.stringify(E.giantTalk))||E.giantTalk==='ok','Великан: с ним можно «поговорить» и получить подсказку про 2 этаж',E.giantTalk);
 ok(E.st.me&&E.st.he,'лестница А поднимает обоих, если напарник рядом',E.st);
 ok(E.g1.at==='B'&&E.g1.esc===1&&!E.g1.catch&&E.g2.at==='A'&&E.g2.esc===2,'Призрак: когда оба героя в одной лаборатории, он уходит сквозь стену в другую',[E.g1,E.g2]);
 ok(E.g3.at==='A'&&E.g3.corner&&E.g3.compStayed&&E.catchP,'Призрак: напарник ждёт в соседней лаборатории — Призраку некуда уйти',E.g3);
 ok(/по пропускам/.test(E.doorEarly)&&!E.doorEarlyFlag&&E.pass&&!E.ghostVis&&/открыта/.test(E.door)&&E.doorCol===false,'пультовая без пропуска закрыта; пойманный Призрак отдаёт пропуск, дверь открывается',E);
 ok(E.zap.out&&E.zap.toast&&E.gusUnseen,'Робот: Марью замечает и выдворяет, Гуся не видит',[E.zap,E.gusUnseen]);
 ok(/не подпустит/.test(E.leverEarly)&&!E.powerEarly&&/только Гусь/.test(E.plugMarya)&&E.robot,'Робот: вилку выдёргивает только Гусь; до этого рубильник недоступен',E);
 ok(/только Марья/.test(E.leverGus)&&!E.p1&&E.power&&E.maryaSafe,'рубильник включает только Марья, и после отключения робот её не трогает',E);
 ok(/только Марья/.test(E.crateGus)&&!E.c1&&E.crate&&E.crateCol[0]===false&&E.crateCol[1]===true,'Зеркальный: ящик сдвигает только Марья',E);
 ok(Math.abs(E.mir.p[0]-54)<.2&&Math.abs(E.mir.p[1]-6)<.2&&E.mir.gate===false,'Зеркальный: Гусь встаёт на место — Антон встаёт на плиту, решётка открывается',E.mir);
 ok(Math.abs(E.mir2.p[0]-57)<.2&&E.mir2.gate===true,'Зеркальный: Гусь шаг влево — Антон шаг вправо, решётка закрывается',E.mir2);
 ok(E.cageSafe&&E.flour&&E.gateAfter===false,'Зеркальный: героя в клетке не запирает; мука взята, решётка остаётся открытой',E);
 ok(E.down.me&&E.down.he,'лестница Б спускает обоих в пекарный цех',E.down);
 ok(E.cold.out&&E.cold.toast,'Ледяной: в морозилке −30, долго находиться нельзя (возврат к двери)',E.cold);
 ok(/заслонка/.test(E.thermoEarly)&&!E.thawEarly&&/только Гусь/.test(E.ductMarya)&&!E.d1&&E.duct,'Ледяной: термостат не греет, пока Гусь не откроет заслонку в воздуховоде',E);
 ok(/только Марья/.test(E.thermoGus)&&!E.t1&&E.thaw&&E.iceCol===false&&E.warm&&E.starter,'Ледяной: термостат поворачивает только Марья; Антон оттаивает и отдаёт закваску',E);
 ok(E.baked&&E.eaten&&!E.giant1,'Обжора: первый батон он съедает, Великан не просыпается',E);
 ok(/Обжора съест/.test(E.mix2)&&/нельзя доесть/.test(E.glutNo)&&!E.fed0,'Обжора: без приманки печь бесполезно, подсказка ведёт к резиновому батону',[E.mix2,E.glutNo]);
 ok(/только Марья/.test(E.rubGus)&&!E.rb0&&E.rubber&&E.fed,'Обжора: резиновый батон с верхней полки берёт Марья; Обжора занят',E);
 ok(E.giant&&E.giantCol===false&&E.giantLines&&E.giantPos<-30,'Великан: свежий батон доезжает по конвейеру, Великан уходит за ним на склад',E);
 ok(/Печной зал/.test(E.obj),'цель переключилась на печной зал',E.obj);

 console.log('[F] Печной зал и выход');
 let Fv=await pg.evaluate(async()=>{const r={},k=M.K.fab,X=x=>k.ox+x,Z=v=>k.oz+v,f=M.F(),E=M.W.eyes;
   const seen=new Set();const t0=Date.now();while(Date.now()-t0<9000&&seen.size<3){seen.add(E.ph);await ticks(2);}r.phases=[...seen].sort();
   const set=(ph)=>{E.ph=ph;E.t=5;};
   be(marya);M.W.mode='follow';comp.pos.set(X(1),0,Z(6));player.pos.set(X(0),0,Z(-8));player.moving=true;M.W.grace=0;set('closed');await ticks(6);r.closedOk=player.pos.z-k.oz<0;
   player.pos.set(X(0),0,Z(-8));player.moving=false;set('open');await ticks(6);r.stillOk=player.pos.z-k.oz<0;
   player.moving=true;await ticks(6);r.caught=player.pos.z-k.oz>4&&/заметили движение/.test(toasts.slice(-1)[0]);player.moving=false;
   r.compOut=!(comp.pos.z-k.oz<3.7&&Math.abs(comp.pos.x-k.ox)<14);
   set('open');const n=toasts.length;player.pos.set(X(0),0,Z(-16));find('🥖✨ Взять Сияющий батон')[0].act();await ticks(2);r.takeOpen=toasts.slice(n).join('|');r.g0=!!f.got;
   set('closed');M.W.grace=0;await act('🥖✨ Взять Сияющий батон',{stay:true});r.got=f.got;r.carry=M.W.carry;r.batonVis=M.N.batonM.visible;
   set('closed');player.pos.set(X(0),0,Z(8));const n2=spoke.length;await ticks(6);await idle();r.alarm=M.W.alarm;r.alarmLines=spoke.slice(n2).some(l=>/ОНИ ЗАМЕТИЛИ/.test(l[1]));r.obj=objective();
   const before=M.N.crowd[0].g.position.z;await ticks(40);r.chase=M.N.crowd[0].g.position.z!==before;
   return r;});
 ok(Fv.phases.join()==='closed,open,warn','Антоны в зале по очереди спят (💤), предупреждают (⚠️) и смотрят (👀)',Fv.phases);
 ok(Fv.closedOk&&Fv.stillOk&&Fv.caught,'двигаться можно, пока спят; замер под взглядом — не замечают; пошёл под взглядом — вынесли за дверь',Fv);
 ok(Fv.compOut,'напарник в зал не заходит и ждёт у двери',Fv.compOut);
 ok(/Не сейчас/.test(Fv.takeOpen)&&!Fv.g0&&Fv.got&&Fv.carry&&Fv.batonVis===false,'батон нельзя взять под взглядом; пока спят — можно',Fv);
 ok(Fv.alarm&&Fv.alarmLines&&/К выходу/.test(Fv.obj.t)&&Fv.chase,'с батоном за дверью: Антоны просыпаются и бегут следом, цель — выход',Fv);

 console.log('[G] У выхода: батон отбирают друг у друга');
 let Gt=await pg.evaluate(async()=>{const r={},n=spoke.length;r.pre={stage:M.Q().stage,got:M.F().got,area,busy:M.W.busy,tug:M.W.tug};r.exit=await act('🚪 Выйти с завода');for(let i=0;i<200&&!(M.W.tug&&M.W.tug.on);i++)await ticks(2);await idle();r.post={stage:M.Q().stage,area,tug:M.W.tug,lines:spoke.slice(n).length,errs:0};if(!M.W.tug)return r;const g=M.W.tug;r.area=area;r.stage=M.Q().stage;r.hemi=hemiOverride;r.tug=!!g&&g.on;r.holder=g&&g.holder;r.lines=spoke.slice(n).map(l=>l[0]+': '+l[1]);r.sciVis=!M.N.sci.hidden;r.obj=objective().t;r.chip=document.getElementById('p14mode').style.display;r.ai=comp.ai;
   // игрок догоняет учёного
   const A=M.W.arena;const grab=async(who)=>{for(let i=0;i<200&&M.W.tug&&M.W.tug.on&&M.W.tug.holder!=='player';i++){const p=who==='anton'?{x:M.N.antonC.position.x,z:M.N.antonC.position.z}:M.N.sci.pos;if(M.W.tug.imm<=0&&M.W.tug.holder===who)player.pos.set(p.x+.3,0,p.z);await ticks(1);}};
   await grab('sci');r.took=M.W.tug.holder;const h0=M.W.tug.held;await ticks(10);r.heldGrows=M.W.tug.held>h0;r.objMine=objective().t;
   // стоим на месте: учёный должен догнать и отобрать
   for(let i=0;i<400&&M.W.tug.on&&M.W.tug.swaps<2;i++)await ticks(1);r.sciBack=M.W.tug.holder;r.swaps=M.W.tug.swaps;
   // напарник сам пытается отобрать
   player.pos.set(A.x+14,0,A.z+14);const n2=spoke.length;let compGot=false;for(let i=0;i<700&&M.W.tug.on&&M.W.tug.phase===1;i++){if(M.W.tug.holder==='comp')compGot=true;await ticks(1);}r.compGot=compGot;
   // первая часть заканчивается: приходит Антон
   for(let i=0;i<60&&!(M.W.tug&&M.W.tug.phase===2&&M.W.tug.on);i++){if(M.W.tug.phase===1&&M.W.tug.on)M.W.tug.held=Math.max(M.W.tug.held,9.9);await ticks(5);await idle();}
   r.phase=M.W.tug.phase;r.antonVis=M.N.antonC.visible;r.antonLines=spoke.slice(n2).some(l=>/Антон-Батон. Наш/.test(l[1]));
   let antonGot=false,heroGot=false;for(let i=0;i<500&&M.W.tug.on;i++){if(M.W.tug.holder==='anton')antonGot=true;if(M.W.tug.holder==='player'||M.W.tug.holder==='comp')heroGot=true;if(i%40===20&&M.W.tug.imm<=0&&M.W.tug.holder==='anton')player.pos.set(M.N.antonC.position.x+.3,0,M.N.antonC.position.z);await ticks(1);}
   r.antonGot=antonGot;r.heroGot=heroGot;r.inArena=[M.N.sci.pos,comp.pos,{x:M.N.antonC.position.x,z:M.N.antonC.position.z}].map(p=>Math.round(Math.hypot(p.x-A.x,p.z-A.z)));return r;});
 ok(Gt.area==='city'&&Gt.stage===4&&Gt.hemi===null&&Gt.tug&&Gt.holder==='sci'&&Gt.sciVis,'выход с батоном: учёный выходит из зелёного портала и отбирает батон',Gt);
 ok(Gt.lines.some(l=>/слишком много Антонов/.test(l))&&Gt.lines.some(l=>/выхватывает Сияющий батон/.test(l))&&/Догони и отбери/.test(Gt.obj)&&Gt.chip==='none'&&Gt.ai==='tug','учёный объясняет, почему ждал снаружи; начинается игра «отбери батон»',Gt.lines);
 ok((Gt.took==='player'||Gt.took==='comp')&&Gt.heldGrows&&/Убегай и не отдавай/.test(Gt.objMine),'догнал учёного — батон у тебя, время владения растёт',Gt);
 ok(Gt.swaps>=2,'батон переходит из рук в руки',[Gt.sciBack,Gt.swaps]);
 ok(Gt.compGot,'напарник сам догоняет учёного и перехватывает батон',Gt.compGot);
 ok(Gt.phase===2&&Gt.antonVis&&Gt.antonLines,'приходит наш Антон-Батон, батон отбирают уже вчетвером',Gt);
 ok(Gt.antonGot&&Gt.heroGot,'во второй части батон побывал и у Антона, и у героев',Gt);
 ok(Gt.inArena.every(d=>d<26),'никто не убегает с площадки у завода',Gt.inArena);

 console.log('[H] Финал');
 let Hf=await pg.evaluate(async()=>{const r={},n=spoke.length;M.dev.skipTug();for(let i=0;i<400&&!S.q.baton14;i++){await ticks(5);}await idle();await ticks(5);
   r.lines=spoke.slice(n).map(l=>l[0]+': '+l[1]);r.done=!!S.q.baton14;r.stage=M.Q().stage;r.dones=window.__done;r.area=area;r.pos=[player.pos.x,player.pos.z];r.lvl=!!MG_STORY.lvl;r.tug=M.W.tug;r.sc=[player.g.scale.x,comp.g.scale.x,M.N.sci.g.scale.x];r.ovr=player.ovr||null;r.fixed=cam.fixed;r.ai=comp.ai;r.sci=M.N.sci.hidden;r.antonVis=M.N.antonC.visible;r.carry=M.W.carry;
   M.tick(.04,1);r.endHole=[M.W.endHole.g.visible,M.W.endHole.tr];r.cityHole=M.W.cityHole.g.visible;r.avail=M.avail();r.hint=objective().t;for(let i=0;i<150&&!toasts.slice(-4).some(t=>/следующем деле/.test(t));i++)await ticks(2);r.cards=window.__cards;r.toast=toasts.slice(-4).join(' | ');r.acts=[find('🕳️ Подойти к дыре','city')[0].ok(),find('🚪 Войти на хлебозавод','city')[0].ok(),find('🥖 Вернуться к батону','city')[0].ok()];return r;});
 ok(Hf.done&&Hf.stage===5&&Hf.dones.includes('baton14'),'дело закрыто и сохранено',Hf);
 ok(Hf.lines.some(l=>/Дыра. Она пришла за батоном сама/.test(l))&&Hf.lines.some(l=>l==='anton: Лучше пусть он никому не достанется.')&&Hf.lines.some(l=>/Сияющий батон падает в дыру/.test(l)),'Антон забирает батон и выбрасывает его в дыру: «лучше пусть он никому не достанется»',Hf.lines);
 ok(Hf.area==='city'&&!Hf.lvl&&Hf.tug===null&&Hf.sc.every(s=>s===1)&&Hf.ovr===null&&Hf.fixed===null&&Hf.ai==='follow'&&Hf.sci&&!Hf.antonVis&&!Hf.carry,'после финала игра в рабочем состоянии: герои целы, камера свободна, напарник снова идёт следом',Hf);
 ok(Hf.endHole[0]&&Hf.endHole[1]===8&&!Hf.cityHole&&!Hf.avail&&Hf.hint==='main'&&Hf.acts.every(a=>!a)&&/Продолжение|следующем деле/.test(Hf.toast),'у завода остаётся большая дыра; дело больше не предлагается',Hf);
 ok(Hf.cards===2,'финальные надписи ждут кнопку «Дальше»',Hf.cards);
 ok(errs.length===0,'за всё прохождение ошибок JavaScript нет',errs.slice(0,5));

 console.log('[I] Продолжение после перезапуска игры и защита от зависаний');
 await pg.close();
 ({pg,errs}=await page(()=>{window.__seed=true;}));
 let I=await pg.evaluate(async()=>{const r={};S.p13={baton14:{stage:1,met:true,sh:[true,false,true],f:{}}};r.h1=objective().t;r.back=find('🕳️ Прыгнуть обратно в дыру','city')[0].ok();await act('🕳️ Прыгнуть обратно в дыру');for(let i=0;i<100&&area!=='p14_dark';i++)await ticks(2);await idle();r.area1=area;r.sh=M.N.shards.map(s=>s.visible);r.obj1=objective().t;
   S.p13.baton14={stage:3,met:true,sh:[true,true,true],f:{pass:true,door:true,robot:true,power:true,crate:true,flour:true,duct:true,thaw:true,starter:true,rubber:true,baked:true,fed:true,giant:true}};MG_STORY.lvl=null;setArea('city');r.h3=objective().t;
   await act('🚪 Войти на хлебозавод');for(let i=0;i<100&&area!=='p14_fab';i++)await ticks(2);await idle();const N=M.N;r.state={ghost:N.ghost.visible,door:N.ctlCol.on,crate:N.crateCol.on,gate:N.gateCol.on,ice:N.iceCol.on,giant:N.giantCol.on,baton:N.batonM.visible};r.obj3=objective().t;
   // выход без батона и возврат
   await act('🚪 Выйти с завода');for(let i=0;i<100&&area!=='city';i++)await ticks(2);await idle();r.out={area,stage:M.Q().stage,tug:M.W.tug,hemi:hemiOverride,hint:objective().t};
   // этап 4 после перезапуска: борьба начинается заново от двери
   S.p13.baton14.stage=4;S.p13.baton14.f.got=true;r.h4=objective().t;await act('🥖 Вернуться к батону');await idle();r.tug=!!(M.W.tug&&M.W.tug.on);
   // если игрок вообще ничего не делает — обе части всё равно заканчиваются по времени
   player.pos.set(M.W.arena.x+40,0,M.W.arena.z+40);M.W.tug.pt=39.5;for(let i=0;i<80&&!(M.W.tug.phase===2&&M.W.tug.on);i++){await ticks(5);await idle();}r.p2=M.W.tug.phase;M.W.tug.pt=44.5;for(let i=0;i<400&&!S.q.baton14;i++)await ticks(5);await idle();r.done=!!S.q.baton14;
   // DEV: начать заново
   M.dev.restart();r.re={q:!!S.q.baton14,stage:M.Q().stage,avail:M.avail(),area};return r;});
 ok(/Вернуться в дыру/.test(I.h1)&&I.back&&I.area1==='p14_dark'&&I.sh.join()==='false,true,false'&&/2\/3/.test(I.obj1),'этап 1 после перезапуска: в дыру можно вернуться, собранные осколки сохранены',I);
 ok(/Вернуться на хлебозавод/.test(I.h3)&&!I.state.ghost&&!I.state.door&&!I.state.crate&&!I.state.gate&&!I.state.ice&&!I.state.giant&&I.state.baton&&/Печной зал/.test(I.obj3),'этап 3 после перезапуска: завод восстанавливается по сохранённым флагам',I.state);
 ok(I.out.area==='city'&&I.out.stage===3&&I.out.tug===null&&I.out.hemi===null,'с завода можно выйти без батона и вернуться позже',I.out);
 ok(/вас ждут/.test(I.h4)&&I.tug,'этап 4 после перезапуска: борьба за батон начинается от проходной',I);
 ok(I.p2===2&&I.done,'даже если игрок ничего не делает, обе части борьбы завершаются по времени и идёт финал',I);
 ok(!I.re.q&&I.re.stage===0&&I.re.avail&&I.re.area==='city','DEV: дело можно начать с начала',I.re);
 ok(errs.length===0,'ошибок JavaScript нет',errs.slice(0,5));
 console.log('\n══ сюжетка №14: '+pass+' ок, '+fail+' провалов ══');await br.close();process.exit(fail?1:0);
})().catch(e=>{console.error('УПАЛ',String(e).slice(0,2500));process.exit(2);});
