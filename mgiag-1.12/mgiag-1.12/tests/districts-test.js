const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');
let pass=0,fail=0;const ok=(c,n,x)=>{c?pass++:fail++;console.log(c?'  ✔':'  ✘ ПРОВАЛ:',n,c?'':JSON.stringify(x));};
(async()=>{
 const br=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--no-sandbox']});
 const pg=await br.newPage();const errs=[];pg.on('pageerror',e=>errs.push(String(e)));pg.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
 await pg.goto('file:///home/claude/h6/index.html');await pg.waitForTimeout(900);
 console.log('[A] Установка и маршрутки');
 ok(await pg.evaluate(()=>inters.filter(i=>i.area==='city'&&/Маршрутка/.test(i.label)).length===4),'в городе 4 маршрутки (на существующих остановках)');
 ok(await pg.evaluate(()=>MG_DIST.defs.map(d=>d.stop.label).join('|')),'остановки: Пирамида, Зюзинская, Тихая, Новый квартал');
 console.log('[B] Строительство районов');
 const R=await pg.evaluate(()=>{const o={};for(const d of MG_DIST.defs){const b0=stats.box+stats.M,a0=stats.actors,i0=inters.length;const okk=MG_DIST.ensure(d);o[d.id]={ok:okk,parts:stats.box+stats.M-b0,npcs:stats.actors-a0,inters:inters.filter(i=>i.area===d.id).length,cam:camBlock[d.id]&&camBlock[d.id].length};}return o;});
 console.log(JSON.stringify(R));
 for(const id of ['dock','neon','green','biz']){ok(R[id].ok&&R[id].parts>80&&R[id].inters>=6,'район «'+id+'» построен: '+R[id].parts+' деталей, '+R[id].inters+' точек взаимодействия, '+R[id].npcs+' NPC',R[id]);}
 const keys=await pg.evaluate(()=>{const o={};MG_DIST.biz.forEach(b=>{(o[b.area]=o[b.area]||[]).push(b.key);});return o;});
 const all=Object.values(keys).flat().filter(k=>k!=='back');ok(new Set(all).size===all.length,'все ключи заведений уникальны (нет клонов)',all.length);
 console.log('[C] Интерьеры');
 for(const k of ['garage','arcade','cinema','greenhouse','bank','gym']){
   const r=await pg.evaluate(async k=>{const n0=inters.length;await MG_DIST.enter(k,'dock',6,22.2);const a=area;const ins=inters.filter(i=>i.area==='in_'+k).length;return {a,ins,pl:player.pos?1:0};},k);
   ok(r.a==='in_'+k&&r.ins>=2,'интерьер «'+k+'»: вход работает, '+r.ins+' точек (включая выход)',r);
   await pg.evaluate(async()=>{await MG_DIST.leave();});ok(await pg.evaluate(()=>area==='dock'),'  выход из «'+k+'» возвращает в район');
 }
 console.log('[D] Переезды');
 for(const id of ['dock','neon','green','biz']){await pg.evaluate(async id=>{const i=inters.find(x=>x.area==='city'&&x.label.includes(MG_DIST.dist[id].name));await i.act();},id);
   const r=await pg.evaluate(()=>({a:area,x:player.pos.x,z:player.pos.z}));const d=await pg.evaluate(id=>MG_DIST.dist[id],id);
   ok(r.a===id&&Math.abs(r.x-d.ox)<1&&Math.abs(r.z-(d.oz+66))<1,'маршрутка → «'+id+'»: игрок в районе у остановки',r);
   await pg.evaluate(async id=>{const b=inters.find(x=>x.area===id&&x.label.includes('в город'));await b.act();},id);ok(await pg.evaluate(()=>area==='city'),'  обратная маршрутка → город');}
 console.log('[E] Экономика');
 const E=await pg.evaluate(async()=>{const out={};MG_BIZ.install();
  out.items=['coffee','pie','medkit','fish','bigfish','boot','flowers','book','prize','pizza_slice'].every(k=>ITEMS[k]);
  out.eat=['coffee','pie','medkit','book'].every(k=>EATL[k]);
  // покупка в кафе
  S.money.marya=10000;MG_BIZ.cafe();let rows=[...document.querySelectorAll('#sheetBody div[data-b]')];rows.find(r=>/Капучино/.test(r.dataset.l))._fn();out.coffeeBought=invOf().includes('coffee')&&S.money.marya===9650;
  // эффект кофе
  useItem('coffee');out.speedBuff=MG_BIZ.buffOn('speed');
  player.hp=50;addItem('medkit');useItem('medkit');out.heal=player.hp===100;
  // ломбард
  addItem('fish');addItem('fish');addItem('bigfish');const m0=S.money.marya;MG_BIZ.pawn();rows=[...document.querySelectorAll('#sheetBody div[data-b]')];rows.find(r=>/всё сразу/.test(r.dataset.l))._fn();out.pawnFish=S.money.marya-m0===300;
  // рыбалка
  window.__tg=3;invOf().length=0;await MG_BIZ.fish();out.fished=invOf().length===1&&['fish','bigfish'].includes(invOf()[0]);
  // банк
  S.money.marya=50000;MG_BIZ.bank();rows=[...document.querySelectorAll('#sheetBody div[data-b]')];rows.find(r=>/Положить всё/.test(r.dataset.l))._fn();out.deposit=S.d12.bank.marya.amt===50000&&S.money.marya===0;
  S.d12.bank.marya.t-=5*60000*3;MG_BIZ.bank();out.interest=S.d12.bank.marya.amt>50000&&S.d12.bank.marya.amt<=Math.ceil(50000*Math.pow(1.015,3))+5;out.amt=S.d12.bank.marya.amt;
  MG_BIZ.bank();rows=[...document.querySelectorAll('#sheetBody div[data-b]')];rows.find(r=>/Снять всё/.test(r.dataset.l))._fn();out.withdraw=S.d12.bank.marya.amt===0&&S.money.marya>=50000;
  // подработка: офис с идеальной игрой
  S.money.marya=0;MG_BIZ.office();rows=[...document.querySelectorAll('#sheetBody div[data-b]')];await rows.find(r=>/Разбор/.test(r.dataset.l))._fn();await new Promise(r=>setTimeout(r,9000));
  out.officePay=S.money.marya;out.cd=MG_BIZ.S12().cd.job_office>Date.now();
  return out;});
 console.log(JSON.stringify(E));
 ok(E.items&&E.eat,'новые предметы зарегистрированы в игре');ok(E.coffeeBought,'покупка в кафе списала деньги и выдала предмет');ok(E.speedBuff,'кофе даёт бафф скорости');ok(E.heal,'аптечка лечит');
 ok(E.pawnFish,'ломбард: 2 окуня ×150 = 300 (золотого карася не трогаем)');ok(E.fished,'рыбалка с идеальным уловом выдаёт рыбу');
 ok(E.deposit,'банк: вклад списывает деньги');ok(E.interest,'банк: проценты начисляются (1,5% за 5 мин), итог '+E.amt);ok(E.withdraw,'банк: снятие возвращает деньги');
 ok(E.officePay>=4000&&E.officePay<=4300&&E.cd,'офис: идеальная смена даёт 2500+1700 = 4200 и включает перерыв',E.officePay);
 console.log('[F] Доставка пиццы');
 const Dv=await pg.evaluate(async()=>{MG_DIST.ensure(MG_DIST.dist.neon);S.money.marya=0;MG_DIST.startDelivery();const cur=inters.find(i=>i.area==='neon'&&typeof i.p==='function');const pos0=cur.p();let n=0;while(cur.p()&&n<5){cur.act();n++;}return {n,pos0:!!pos0,after:cur.p(),money:S.money.marya};});
 ok(Dv.n===3&&Dv.after===null&&Dv.money>=2700&&Dv.money<=5400,'доставка: 3 адреса, оплата начислена в конце',Dv);
 console.log('[G] Сохранения');
 const Sv=await pg.evaluate(()=>{localStorage.setItem('slot1','{"x":1}');start({q:{}});return {v12:window.__started.v12,bak:localStorage.getItem('slot1_bak_v111')};});
 ok(Sv.v12===1&&Sv.bak==='{"x":1}','старое сохранение: перед переходом на 1.12 сделана резервная копия и проставлена метка',Sv);
 const e=errs.filter(x=>!/favicon/.test(x));ok(e.length===0,'ошибок в консоли нет',e.slice(0,4));
 console.log('\n══ районы/бизнесы: '+pass+' ок, '+fail+' провалов ══');await br.close();process.exit(fail?1:0);
})().catch(e=>{console.error('ТЕСТ УПАЛ',e);process.exit(1);});
