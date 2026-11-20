const { chromium } = require('playwright');
let pass=0,fail=0;const ok=(c,n,x)=>{c?pass++:fail++;console.log(c?'  ✔':'  ✘ ПРОВАЛ:',n,c?'':JSON.stringify(x).slice(0,1500));};
(async()=>{
 const br=await chromium.launch({args:['--no-sandbox']});
 const pg=await br.newPage({viewport:{width:900,height:700}});const errs=[];pg.on('pageerror',e=>errs.push(String(e)));pg.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
 await pg.goto('file:///home/claude/h15/index.html');await pg.waitForFunction(()=>window.MG_L15&&window.MG_L14&&MAIN.some(m=>m.id==='baton14')&&MG_L15.HOME.made,null,{timeout:9000});
 await pg.evaluate(()=>{
  window.M=MG_L15;window.idle=()=>new Promise(r=>{const t0=Date.now();let ok0=0;(function f(){if(cut===0&&!M.W.busy){if(!ok0)ok0=Date.now();if(Date.now()-ok0>300)return r(true);}else ok0=0;if(Date.now()-t0>40000)return r(false);setTimeout(f,20);})();});
  window.find=(label,ar)=>inters.filter(o=>o.label===label&&(o.area||'city')===(ar||area));window.pOf=o=>typeof o.p==='function'?o.p():o.p;
  window.act=async(label,opt)=>{opt=opt||{};const L=find(label).filter(o=>pOf(o)&&(!o.ok||o.ok()));if(!L.length)return 'нет точки: '+label;const o=L[0],p=pOf(o);if(!opt.stay)player.pos.set(p.x,0,p.z);const n=toasts.length;o.act();await new Promise(r=>setTimeout(r,40));await idle();return toasts.slice(n).join(' | ')||'ok';};
  window.be=h=>{if(player!==h){if(!canSwitch())throw new Error('нельзя переключиться');doSwitch();}};
  window.ticks=n=>new Promise(r=>setTimeout(r,n*20));
  window.flood=(sx,sz,lim,bx)=>{const st=.5,seen=new Set(),Q=[[Math.round(sx/st),Math.round(sz/st)]];const key=(i,j)=>i+','+j;if(!freeAt(Q[0][0]*st,Q[0][1]*st,.35))return {n:0,has:()=>false};seen.add(key(Q[0][0],Q[0][1]));
    while(Q.length&&seen.size<(lim||600000)){const [i,j]=Q.pop();for(const [a,b] of [[1,0],[-1,0],[0,1],[0,-1]]){const ni=i+a,nj=j+b,k=key(ni,nj);if(seen.has(k))continue;if(bx&&(ni*st<bx[0]||ni*st>bx[1]||nj*st<bx[2]||nj*st>bx[3]))continue;if(!freeAt(ni*st,nj*st,.35)||!freeAt((i+a/2)*st,(j+b/2)*st,.35))continue;seen.add(k);Q.push([ni,nj]);}}
    return {n:seen.size,has:(x,z,r)=>{r=r||1;for(let dx=-r;dx<=r;dx+=st)for(let dz=-r;dz<=r;dz+=st){if(dx*dx+dz*dz>r*r)continue;if(seen.has(key(Math.round((x+dx)/st),Math.round((z+dz)/st))))return true;}return false;}};};
  // «водитель»: уходит от ближайшего препятствия впереди
  window.driver=on=>{clearInterval(window.__drv);if(!on){joy.x=0;joy.y=0;return;}window.__drv=setInterval(()=>{const R=M.ride();if(!R){joy.x=0;return;}let best=null,bd=1e9;for(const h of R.hz){if(h.hit||h.boost)continue;const dz=R.z-h.z;if(dz<-.5||dz>11)continue;if(Math.abs(h.x-R.x)<h.r+1.6&&(!R.fly||h.y===undefined||Math.abs(h.y-R.y)<h.r+1.8)&&dz<bd){bd=dz;best=h;}}
    let want=0;if(best){want=best.x>R.x?-1:1;if(Math.abs(R.x)>R.w-1&&Math.sign(R.x)===want)want=-want;}else want=Math.abs(R.x)>1?-Math.sign(R.x)*.5:0;joy.x=want*(R.inv?-1:1);if(R.fly){let v=0;if(best&&best.y!==undefined){v=best.y>R.y?-1:1;if((R.y<R.ymin+1.5&&v<0)||(R.y>R.ymax-1.5&&v>0))v=-v;}else v=R.y>10?-.4:(R.y<8?.4:0);joy.y=-v*(R.inv?-1:1);}else joy.y=0;runHeld=true;},15);};
  setInterval(()=>{const b=document.getElementById('mgCardBtn');if(b&&b.style.display==='block'){window.__cards=(window.__cards||0)+1;b.click();}},150);
  window.rideUntil=async(ms)=>{const t0=Date.now();while(M.ride()&&Date.now()-t0<ms)await ticks(5);return !M.ride();};
 });
 const st=()=>pg.evaluate(()=>({area,part:M.Q().part,f:Object.assign({},M.F()),lvl:MG_STORY.lvl&&MG_STORY.lvl.n,obj:objective().t}));

 console.log('[A] Основной сюжет: после №14, вход у дыры возле хлебозавода');
 let A=await pg.evaluate(()=>({main:MAIN.some(m=>m.id==='w15'),after:MAIN.findIndex(m=>m.id==='w15')===MAIN.findIndex(m=>m.id==='baton14')+1,entry:(()=>{const o=inters.find(o=>typeof o.label==='function'&&/дыру/.test(o.label()));if(!o)return 'нет';const was=S.q.baton14;S.q.baton14=false;const lock=o.ok();S.q.baton14=true;const open=o.ok();S.q.baton14=was;return {lock,open,label:o.label()};})(),q:S.p13&&S.p13.w15,homePts:inters.filter(o=>o.label&&/Нармина|Позвонить себе|Спросить голубя|Собраться во дворе/.test(o.label)&&!o.area).map(o=>pOf(o)).filter(Boolean).length,chai:M.chaiActive(),hidden:Object.values(M.HOME.npcs).every(a=>a.hidden&&!a.g.visible),say:(say([['gus','Чай будешь?']]),spoke.slice(-1)[0][1])}));
 ok(A.main&&A.after&&A.entry&&A.entry.lock===false&&A.entry.open===true&&(!A.q||!A.q.part)&&A.homePts===0&&!A.chai&&A.hidden&&A.say==='Чай будешь?','сюжетка в «Списке дел» сразу после №14; вход у дыры закрыт до финала №14 и открыт после; «чай» остаётся «чаем» до части 4',A);

 console.log('[B] Часть 1 — хлебный мир');
 let B=await pg.evaluate(async()=>{const n=spoke.length;M.dev.start(1);await ticks(3);await idle();const k=M.K.br,X=x=>k.ox+x,Z=z=>k.oz+z;const r={area,lines:spoke.slice(n).map(l=>l[0]+': '+l[1]),obj:objective().t,cars:CARS};
   const Fl=flood(X(-1.5),Z(52),0,[X(-110),X(110),Z(-60),Z(90)]);r.reach={king:Fl.has(X(0),Z(-18),2),table:Fl.has(X(-16),Z(-2.6),1.6),guard:Fl.has(X(-16),Z(-1.8),2),oven:Fl.has(X(-16),Z(-8),1.8),nar:Fl.has(X(10),Z(7.4),2),max:Fl.has(X(17),Z(13.4),2),ducks:Fl.has(X(23.4),Z(15.6),2),hill:Fl.has(X(0),Z(-36.4),2.5),farSide:Fl.has(X(-16),Z(-6.4),1.2)};r.track={a:!Fl.has(X(0),Z(-60),3),b:!Fl.has(X(0),Z(-200),3),c:!Fl.has(X(0),Z(-270),3)};r.gate=await act('🚧 Ворота на Хлебную гору');
   r.sw=canSwitch();return r;});
 ok(B.area==='p15_bread'&&B.lines.some(l=>/переносит то, что в неё упало, между вселенными/.test(l))&&B.lines.some(l=>/Антон дома/.test(l))&&/Хлебным королём/.test(B.obj),'хлебный мир: герои понимают, что дыра переносит между вселенными; цель — король',B);
 ok(Object.entries(B.reach).every(([k,v])=>v),'до короля, конкурса, Нармины, Максима-сухаря, уток и горы можно дойти пешком',B.reach);
 ok(B.sw,'героев можно менять в любом месте',B.sw);
 ok(B.track.a&&B.track.b&&B.track.c&&/Ворота заперты/.test(B.gate),'на трассу лавины пешком не попасть: ворота и сплошные склоны; без батона ворота не открываются',[B.track,B.gate]);
 let B2=await pg.evaluate(async()=>{const r={},f=M.F(),k=M.K.br;
   const n=spoke.length;await act('👑 Хлебный король');r.king=f.bKing;r.kl=spoke.slice(n).some(l=>/Великой выпечки/.test(l[1]));
   be(gus);r.kGus=await act('🫓 Замесить тесто');be(marya);__tm=[1,1,1];r.kBad=await act('🫓 Замесить тесто');r.k0=!!f.bKnead;__tm=[3,2,3];await act('🫓 Замесить тесто');r.knead=f.bKnead;
   r.gMarya=await act('🪿 Охранять тесто от уток');be(gus);
   // бездействие: утки съедают тесто
   await act('🪿 Охранять тесто от уток');player.pos.set(k.ox-16,0,k.oz+20);for(let i=0;i<900&&M.W.guard;i++)await ticks(1);r.idleFail=!f.bGuard&&/съели/.test(toasts.join('|'));
   // активная защита: подбегать к каждой утке
   await act('🪿 Охранять тесто от уток');for(let i=0;i<1500&&M.W.guard;i++){const d=(M.W.guard.ducks||[]).find(o=>o.m.visible&&o.flee<=0);if(d)player.pos.set(d.m.position.x,0,d.m.position.z);await ticks(1);}r.guard=f.bGuard;
   __tm=[1];r.bBad=await act('🔥 Отправить в печь');r.b0=!!f.bBake;__tm=[3];await act('🔥 Отправить в печь');r.bake=f.bBake;
   const n2=spoke.length;await act('👑 Хлебный король');r.baton=f.bBaton;r.carry=M.W.carry;r.aval=spoke.slice(n2).some(l=>/ЛАВИНА/.test(l[1]));r.obj=objective().t;
   const n3=spoke.length;await act('💬 Максим (сухарь)');r.maxL=spoke.slice(n3).some(l=>/Даже утки не стали/.test(l[1]));const n4=spoke.length;await act('🦆 Хлебо-утки');r.duckL=spoke.slice(n4).some(l=>/возил их домой/.test(l[1]));
   return r;});
 ok(B2.king&&B2.kl,'король: Сияющий батон получит победитель «Великой выпечки»',B2);
 ok(/только Марья/.test(B2.kGus)&&/Комки/.test(B2.kBad)&&!B2.k0&&B2.knead,'замес: только Марья, и нужно попасть в тайминг',B2);
 ok(/только Гусь/.test(B2.gMarya)&&B2.idleFail&&B2.guard,'охрана теста: только Гусь; если стоять — утки съедают тесто; если отгонять — получается',B2);
 ok(/Подгорел|Бледноват/.test(B2.bBad)&&!B2.b0&&B2.bake,'печь: нужно вынуть вовремя',B2);
 ok(B2.baton&&B2.carry&&B2.aval&&/воротам Хлебной горы/.test(B2.obj),'король отдаёт Сияющий батон — начинается багетная лавина',B2);
 ok(B2.maxL&&B2.duckL,'Максим-сухарь (даже утки не стали) и хлебо-утки (тарелка возила их домой)',B2);

 let B3=await pg.evaluate(async()=>{const r={};await act('🛹 Вниз с Хлебной горы!');await ticks(5);const R=M.ride();r.on=!!R;r.force=!!cam.force;r.ovr=!!player.ovr;r.obj=objective().t;
   // без руля и с медленной ездой лавина догоняет → чекпоинт
   R.speed=3;const z0=R.z;for(let i=0;i<300&&R.fails===0;i++)await ticks(1);r.fail1=R.fails;await idle();await ticks(5);r.back=Math.abs(R.z-R.cp)<4;R.speed=10;
   driver(true);r.done=await rideUntil(60000);driver(false);runHeld=false;r.cam=cam.force;r.ovr2=player.ovr||null;return r;});
 ok(B3.on&&B3.force&&B3.ovr&&/Лавина · до финиша/.test(B3.obj),'заезд на скейте: управление, камера сзади, на экране — расстояние до финиша и до лавины',B3);
 ok(B3.fail1>=1&&B3.back,'если лавина догнала — возврат к чекпоинту без штрафа',B3);
 ok(B3.done&&B3.cam===null&&B3.ovr2===null,'заезд проходится до конца, управление возвращается',B3);
 await pg.evaluate(async()=>{for(let i=0;i<400&&area!=='p15_svet';i++)await ticks(5);await idle();});
 let B4=await pg.evaluate(()=>({area,part:M.Q().part,ant:M.N.ant.position.z-M.K.br.oz,lines:spoke.filter(l=>/разворачивается и скачет к своим|Он дома, Гусь/.test(l[1])).length}));
 ok(B4.lines===2&&B4.ant>-250,'прощание: Антон остаётся в хлебном мире',B4);
 ok(B4.area==='p15_svet'&&B4.part===2,'батон брошен в дыру — герои в мире Светофора',B4);

 console.log('[C] Часть 2 — мир Светофора');
 let C=await pg.evaluate(async()=>{await idle();const k=M.K.sv,X=x=>k.ox+x,Z=z=>k.oz+z,r={};r.obj=objective().t;
   const Fl=flood(X(0),Z(46));r.reach={promo:Fl.has(X(9),Z(37.6),2),raisa:Fl.has(X(-12),Z(38.4),2),high:Fl.has(X(-22.8),Z(22),1.8),low:Fl.has(X(13.4),Z(8),1.8),door:Fl.has(X(0),Z(-.4),2)};r.closed={ware:!Fl.has(X(100),Z(-10),3),kassa:!Fl.has(X(100),Z(-222),3),behind:!Fl.has(X(0),Z(-6),2)};
   // сотрудник видит игрока перед собой
   const s=M.N.staff[0];s.a.target=null;placeA(s.a,X(-18),Z(10),0);s.a.yaw=0;M.W.grace=0;player.pos.set(X(-18),0,Z(14));await ticks(4);r.caught=player.pos.z-k.oz>30;
   M.W.grace=0;placeA(s.a,X(-18),Z(10),0);s.a.yaw=0;s.a.target={x:X(-18),z:Z(10.01)};player.pos.set(X(-18),0,Z(6));await ticks(4);r.behindOk=player.pos.z-k.oz<10;
   return r;});
 ok(/Купоны на кассу №13: 0\/3/.test(C.obj),'цель: три купона на кассу №13',C.obj);
 ok(Object.values(C.reach).every(Boolean)&&Object.values(C.closed).every(Boolean),'торговый зал проходим; склад и касса пешком недоступны (только через дверь)',C);
 ok(C.caught&&C.behindOk,'сотрудник выгоняет того, кого видит перед собой; со спины — не замечает',C);
 let C2=await pg.evaluate(async()=>{const r={},f=M.F();M.W.grace=99;
   r.doorEarly=await act('🚪 Склад');
   const n=spoke.length;__ask=[0];await act('💬 Промоутер-котлета');r.promo=spoke.slice(n).map(l=>l[1]).join(' / ');r.cMax=f.cMax;
   be(gus);r.hiGus=await act('👩 Дотянуться до купона на верхней полке');be(marya);await act('👩 Дотянуться до купона на верхней полке');r.lowMarya=await act('🪿 Залезть под полку за купоном');be(gus);await act('🪿 Залезть под полку за купоном');r.n=M.cps();
   const n2=spoke.length;await act('💬 Раиса Павловна');r.raisa=spoke.slice(n2).some(l=>/Вот откуда дыра/.test(l[1]));
   M.W.grace=0;await act('🚪 Склад');await ticks(10);r.ride=!!M.ride();r.area=area;driver(true);r.done=await rideUntil(60000);driver(false);runHeld=false;
   for(let i=0;i<200&&!M.W.boss;i++)await ticks(5);await idle();r.boss=!!M.W.boss;r.obj=objective().t;return r;});
 ok(/Купонов: 0\/3/.test(C2.doorEarly),'дверь склада без трёх купонов не открывается',C2.doorEarly);
 ok(/Купите себя за 5 000 000 баллов/.test(C2.promo)&&/Даже голубь не взял/.test(C2.promo)&&C2.cMax,'промоутер-котлета — это Максим; никто не берёт его листовки',C2.promo);
 ok(/только Марья/.test(C2.hiGus)&&/только Гусь/.test(C2.lowMarya)&&C2.n===3,'верхний купон — Марья, нижний — Гусь',C2);
 ok(C2.raisa,'Раиса Павловна: касса №13 списывает неоплаченное — вот откуда дыра',C2.raisa);
 ok(C2.ride&&C2.done&&C2.boss&&/перегрузка 0\/4/.test(C2.obj),'погоня на тележке от Живого мяса — и бой у кассы №13',C2);
 let C3=await pg.evaluate(async()=>{const r={},k=M.K.sv;const b=M.W.boss;
   __tm=[0];await act('🧾 Пробить чек');r.bad=b.over;
   b.d=1.7;await ticks(10);r.pushed=b.fails===1&&b.d>10;
   for(let i=0;i<4;i++){__tm=[3];await act('🧾 Пробить чек');await ticks(2);}for(let i=0;i<300&&!M.F().sBoss;i++)await ticks(5);await idle();
   r.win=M.F().sBoss;r.lines=spoke.filter(l=>/Оплачено: 5 000 000 баллов. Карта: Максим|Мы были неоплаченным товаром|чек из дыры/i.test(l[1])).length;r.carry=M.W.carry;
   await act('🕳️ Прыгнуть в дыру');for(let i=0;i<300&&area!=='p15_chaos';i++)await ticks(5);await idle();r.area=area;r.part=M.Q().part;return r;});
 ok(C3.bad===0&&C3.pushed,'плохой чек не засчитан; мясо дошло — отбрасывает от кассы, можно снова',C3);
 ok(C3.win&&C3.lines>=3&&C3.carry,'касса взрывается чеками: батон куплен на 5 000 000 баллов Максима; объяснено, откуда чек из дыры',C3);
 ok(C3.area==='p15_chaos'&&C3.part===3,'прыжок — мир Хаоса',C3);

 console.log('[D] Часть 3 — мир Хаоса');
 let Dd=await pg.evaluate(async()=>{const r={},k=M.K.ch,f=M.F(),W=M.W,X=x=>k.ox+x,Z=z=>k.oz+z;r.intro=spoke.some(l=>/сквозняк отсюда/.test(l[1]));
   const Fl=flood(X(0),Z(30));r.reach=[Fl.has(X(20.6),Z(-6),2),Fl.has(X(-3.4),Z(14.6),2),Fl.has(X(-18.6),Z(9.6),2),Fl.has(X(10),Z(27.4),2),Fl.has(X(0),Z(-10.4),2),Fl.has(X(13),Z(24.2),2)];
   const evs=new Set();for(let i=0;i<4;i++){evs.add(W.ev);W.evT=.01;await ticks(3);}r.evs=[...evs].sort();
   const setEv=id=>{W.evI=['low','disco','goose','rain'].indexOf(id);W.evT=99;W.ev=id;};
   const sides=[[24,-1.6],[24,-14.4],[17.4,-8],[30.6,-8]];r.sides=sides.map(p=>Fl.has(X(p[0]),Z(p[1]),.8)&&Math.hypot(p[0]-24,p[1]+8)<7.6);setEv('disco');be(marya);r.roofM=await act('🪿 Взлететь на крышу соседа');be(gus);r.roofWrong=await act('🪿 Взлететь на крышу соседа');setEv('low');player.pos.set(X(30.6),0,Z(-8));await act('🪿 Взлететь на крышу соседа',{stay:true});r.roof=f.pRoof;r.landed=freeAt(player.pos.x,player.pos.z,.3);
   be(marya);setEv('low');r.fWrong=await act('👩 Достать деталь из фонтана');setEv('rain');await act('👩 Достать деталь из фонтана');r.fount=f.pFount;
   setEv('rain');const n=spoke.length;await act('🥤 «Добрый кола»');r.dkNo=!f.pDk&&spoke.slice(n).some(l=>/только на дискотеке/.test(l[1]));setEv('disco');await act('🥤 «Добрый кола»');r.dk=f.pDk;
   // гигантский гусь пинает
   setEv('goose');M.W.grace=0;player.pos.set(X(0),0,Z(0));await ticks(4);const gg=M.N.giantGoose;player.pos.set(gg.position.x+1,0,gg.position.z);M.W.grace=0;const p0={x:player.pos.x,z:player.pos.z};await ticks(3);r.kick=Math.hypot(player.pos.x-p0.x,player.pos.z-p0.z)>2&&gg.visible;
   const n2=spoke.length;await act('🔫 Учёный: починить пушку');r.fix=f.cFix;r.stay=spoke.slice(n2).some(l=>/наконец-то место, где я свой/i.test(l[1]));
   const n3=spoke.length;await act('💬 Пилот тарелки');r.pilot=spoke.slice(n3).some(l=>/возил хлебо-уток домой/.test(l[1]));
   r.saucer=cols.some(c=>c.rad===3.4&&Math.abs(c.cx-(M.K.ch.ox+16))<.01&&Math.abs(c.cz-(M.K.ch.oz+27))<.01);const o=find('🛸 Сесть в тарелку').filter(o=>o.ok())[0];player.pos.set(pOf(o).x,0,pOf(o).z);o.act();for(let i=0;i<600&&!M.ride();i++)await ticks(5);
   const R=M.ride();r.ride=!!R;r.space=area;r.fly=R&&R.fly;r.ship=M.N.ship.visible;const y0=R.y;joy.y=-1;await ticks(20);r.up=R.y>y0+1;await ticks(80);r.ymax=Math.abs(R.y-R.ymax)<.01;joy.y=1;await ticks(30);r.down=R.y<R.ymax-1;joy.y=0;
   const invs=new Set();driver(true);const t0=Date.now();while(M.ride()&&Date.now()-t0<90000){invs.add(M.ride().inv);await ticks(5);}driver(false);runHeld=false;r.done=!M.ride();r.invs=[...invs];r.lines=spoke.filter(l=>/Тарелка свечой уходит вверх|голубая дыра/.test(l[1])).length;
   for(let i=0;i<400&&area!=='city';i++)await ticks(5);await idle();r.area=area;r.part=M.Q().part;r.chai=M.chaiActive();return r;});
 ok(Dd.intro&&Dd.reach.every(Boolean),'мир Хаоса: «режим Хаоса — сквозняк отсюда»; все точки достижимы',Dd);
 ok(Dd.evs.join()==='disco,goose,low,rain','события меняются: низкая гравитация, дискотека, гигантский гусь, дождь из котлет',Dd.evs);
 ok(/только Гусь/.test(Dd.roofM)&&/низкая гравитация/.test(Dd.roofWrong)&&Dd.roof,'крыша: только Гусь и только при низкой гравитации',Dd);
 ok(/дождь из котлет/.test(Dd.fWrong)&&Dd.fount,'фонтан: Марья, только во время дождя из котлет',Dd);
 ok(Dd.dkNo&&Dd.dk,'«Добрый кола» отдаёт деталь только на дискотеке',Dd);
 ok(Dd.kick,'гигантский гусь отпинывает тех, кто подошёл',Dd.kick);
 ok(Dd.fix&&Dd.stay&&Dd.pilot,'учёный чинит пушку и остаётся; пилот возил уток домой',Dd);
 ok(Dd.sides.every(Boolean)&&Dd.landed,'на крышу соседа можно взлететь с любой стороны дома',Dd.sides);
 ok(Dd.saucer===true,'тарелка в натуральную величину (6 м)',Dd.saucer);
 ok(Dd.ride&&Dd.space==='p15_space'&&Dd.fly&&Dd.ship&&Dd.lines===2,'взлёт: тарелка уходит вверх, герои в открытом космосе',Dd);
 ok(Dd.up&&Dd.ymax&&Dd.down,'в полёте можно рулить вверх-вниз (с ограничением высоты)',Dd);
 ok(Dd.done&&Dd.invs.includes(true)&&Dd.invs.includes(false),'полёт через астероиды до дыры; события меняют управление',Dd);
 ok(Dd.area==='city'&&Dd.part===4&&Dd.chai,'дыра выводит в «почти дом», включается «чэай~»',Dd);

 console.log('[E] Часть 4 — почти дом');
 let E=await pg.evaluate(async()=>{const r={},f=M.F(),H_=M.HOME;r.dawn=[WORLD.t,WORLD.season,WORLD.weather];r.vis=Object.values(H_.npcs).every(a=>!a.hidden&&a.g.visible);r.narHid=narmina.hidden;r.obj=objective().t;
   const n=spoke.length;await act('💬 Нармина');r.lines=spoke.slice(n).map(l=>l[1]);r.reveal=f.hReveal;
   r.t=(toast('Чай и чайник'),toasts.slice(-1)[0]);
   const n2=spoke.length;await act('📞 Позвонить себе');await act('🐦 Спросить голубя');await act('🚦 Подождать у светофора');r.checks=M.homeChecksDone();r.cl=spoke.slice(n2).map(l=>l[1]).join(' / ');r.lamp=H_.lamp[2].material.color.h;
   const n3=spoke.length;await act('🎤 Собраться во дворе');r.speech=f.hSpeech;r.sl=spoke.slice(n3).map(l=>l[1]).join(' / ');r.fixed=cam.fixed;r.max=H_.npcs.max.g.rotation.x;
   const n4=spoke.length;await act('🏠 Домой. На кухню.');for(let i=0;i<400&&!f.hEnd;i++)await ticks(5);await idle();r.kl=spoke.slice(n4).map(l=>l[1]);
   r.cards=window.__cards;r.end={done:M.Q().done,q:S.q.w15,area,lvl:MG_STORY.lvl,hidden:Object.values(H_.npcs).every(a=>a.hidden),narHid:narmina.hidden,banner:toasts.some(t=>/B:✓ ЧЭАЙ/.test(t)),chai:M.chaiActive()};
   say([['gus','Ещё чаю?']]);r.after=spoke.slice(-1)[0][1];return r;});
 ok(E.dawn[0]===6&&E.dawn[1]==='summer'&&E.dawn[2]==='clear','в «почти доме» встречает летний рассвет: 6:00, ясно',E.dawn);
 ok(E.vis&&E.narHid&&/Нармина ждёт/.test(E.obj),'во дворе все вернулись (Нармина, Максим, мама, Валера, бабушка, курьер, уборщик); Нармина из основной игры временно скрыта',E);
 ok(E.reveal&&E.lines.some(l=>/заварила чэай~/.test(l))&&!E.lines.some(l=>/(^|[^э])чай/i.test(l)),'все реплики говорят «чэай~» вместо «чай»',E.lines);
 ok(E.t==='Чэай~ и чэай~ник','уведомления тоже',E.t);
 ok(E.checks&&/Тут только… одно слово по-другому/.test(E.cl)&&/вернётесь не туда/.test(E.cl)&&/«ДА»/.test(E.cl)&&E.lamp===0x2fae5b,'проверки: себе дозвонились, голубь сказал, что знал, светофор сказал «ДА»',E.cl);
 ok(E.speech&&/поскальзывается на луже чэай~/.test(E.sl)&&/Начислено: 0 баллов/.test(E.sl)&&E.fixed===null&&E.max===0,'речь Максима: падает в лужу чэая~, карта — 0 баллов',E.sl);
 ok(E.cards>=11,'титры идут по кнопке «Дальше» (по одной надписи)',E.cards);
 ok(E.kl.some(l=>/Чэай~ так чэай~/.test(l))&&E.kl.some(l=>/Гусь долго смотрит в кружку/.test(l)),'финал на кухне: «Чэай~ так чэай~»',E.kl);
 ok(E.end.done&&E.end.q&&E.end.area==='city'&&!E.end.lvl&&E.end.hidden&&E.end.narHid===false&&E.end.banner&&E.end.chai&&E.after==='Ещё чэай~?','после финала игра в рабочем состоянии; мир так и говорит «чэай~»',[E.end,E.after]);

 console.log('[F] DEV: продолжить, сброс');
 let Fr=await pg.evaluate(async()=>{const r={};M.dev.reset();r.reset={q:S.p13.w15,chai:M.chaiActive(),w:S.q.w15};say([['gus','Чай']]);r.say=spoke.slice(-1)[0][1];
   M.Q().part=2;M.F().sIntro=true;M.dev.resume();for(let i=0;i<200&&area!=='p15_svet';i++)await ticks(5);await idle();r.area=area;M.dev.start(3);for(let i=0;i<200&&area!=='p15_chaos';i++)await ticks(5);await idle();r.area3=area;r.f3=Object.keys(M.F()).join();M.dev.reset();r.final=area;return r;});
 ok(!Fr.reset.q&&!Fr.reset.chai&&!Fr.reset.w&&Fr.say==='Чай','DEV-сброс: прогресс удалён, «чай» снова «чай»',Fr);
 ok(Fr.area==='p15_svet'&&Fr.area3==='p15_chaos'&&Fr.f3==='cIntro'&&Fr.final==='city','DEV: продолжить и запустить любую часть',Fr);
 ok(errs.length===0,'ошибок JavaScript нет',errs.slice(0,6));
 console.log('\n══ сюжетка №15: '+pass+' ок, '+fail+' провалов ══');await br.close();process.exit(fail?1:0);
})().catch(e=>{console.error('УПАЛ',String(e).slice(0,2500));process.exit(2);});
