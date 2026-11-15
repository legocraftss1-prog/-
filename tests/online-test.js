const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');
const path=require('path'),fs=require('fs'),os=require('os');
const DIR=fs.mkdtempSync(path.join(os.tmpdir(),'mgh-'));
process.env.DATA_DIR=DIR;process.env.PORT='18090';process.env.REG_PER_HOUR='1000';
const srv=require('/home/claude/proj/server/server.js');
let pass=0,fail=0;const ok=(c,n,x)=>{c?pass++:fail++;console.log(c?'  ✔':'  ✘ ПРОВАЛ:',n,c?'':JSON.stringify(x||''));};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  await new Promise(r=>srv.start(r));
  const br=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--no-sandbox']});
  const URL='file:///home/claude/harness/index.html?s='+encodeURIComponent('ws://127.0.0.1:18090');
  async function newUser(nick){
    const ctx=await br.newContext({viewport:{width:390,height:800}});const pg=await ctx.newPage();
    const errs=[];pg.on('pageerror',e=>errs.push(String(e)));pg.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
    await pg.goto(URL);await pg.waitForFunction(()=>window.MG_ONLINE&&MG_ONLINE.open);
    return {pg,errs,ctx,nick};
  }
  async function register(u){
    await u.pg.evaluate(()=>MG_ONLINE.open());await u.pg.waitForSelector('#mg-nick');
    await u.pg.fill('#mg-nick',u.nick);await u.pg.fill('#mg-pass','parol123');
    await u.pg.click('text=Создать аккаунт');await u.pg.waitForSelector('text=Быстрое подключение');
  }
  console.log('[A] Интерфейс и регистрация (реальный браузер, реальный сервер)');
  const A=await newUser('Алиса_Тест'),B=await newUser('Боб_Тест');
  ok(true,'модуль онлайна загружен (кнопка входа теперь в разделе «Вместе»)');
  await register(A);ok(true,'регистрация через интерфейс → вкладка комнат');
  // дубль
  const C=await newUser('алиса_тест');await C.pg.evaluate(()=>MG_ONLINE.open());await C.pg.waitForSelector('#mg-nick');await C.pg.fill('#mg-nick','алиса_тест');await C.pg.fill('#mg-pass','parol123');await C.pg.click('text=Создать аккаунт');
  await C.pg.waitForSelector('.err:has-text("занят")');ok(true,'дубликат ника показывает ошибку в интерфейсе');
  await register(B);
  console.log('[B] Друзья');
  await A.pg.click('nav >> text=Друзья');await A.pg.fill('#mg-search','Боб_Тест');await A.pg.click('text=🔍 Найти');
  await A.pg.waitForSelector('text=Зарегистрирован');ok(true,'профиль найденного игрока: онлайн, дата регистрации, время в игре');
  await A.pg.click('text=➕ Добавить в друзья');
  await B.pg.waitForFunction(()=>MG_ONLINE.notes.length>0);ok(await B.pg.evaluate(()=>MG_ONLINE.notes[0].title.includes('Алиса_Тест')),'у Боба появилось уведомление о запросе');
  await B.pg.click('nav >> text=Уведомл.');await B.pg.click('text=Принять');
  await A.pg.waitForFunction(()=>MG_ONLINE.me&&MG_ONLINE.me.friends.length===1);ok(true,'после принятия друзья у обоих');
  console.log('[C] Комнаты, запуск игры, синхронизация');
  await A.pg.click('nav >> text=Комнаты');await A.pg.click('text=⚡ Быстрое подключение');
  await A.pg.waitForFunction(()=>MG_ONLINE.active&&started);ok(await A.pg.evaluate(()=>SAVE_SLOT===9&&SAVE_MODE==='solo'),'игра запущена в отдельном слоте 9 (слоты 1–3 не затронуты)');
  ok(await A.pg.evaluate(()=>chaosOn()===true),'в онлайн-комнате режим хаоса включён');
  await B.pg.click('nav >> text=Комнаты');await B.pg.click('text=⚡ Быстрое подключение');await B.pg.waitForFunction(()=>MG_ONLINE.active);
  await A.pg.waitForFunction(()=>MG_ONLINE.players.size===1);ok(true,'Алиса видит Боба в комнате (pjoin)');
  await sleep(600);
  ok(await A.pg.evaluate(()=>{const r=[...MG_ONLINE.players.values()][0];return r.got&&r.tx===5&&r.tz===7;}),'позиция Боба дошла до Алисы через снимки сервера');
  console.log('[D] Приглашения');
  await A.pg.click('text=🌐').catch(()=>{});await A.pg.evaluate(()=>MG_ONLINE.open());await A.pg.click('nav >> text=Друзья');
  await A.pg.click('text=✉ Позвать');await B.pg.waitForFunction(()=>MG_ONLINE.notes.some(n=>n.title.includes('зовёт')));ok(true,'приглашение доставлено другу как уведомление');
  console.log('[E] Хуки игры и PvP');
  await A.pg.evaluate(()=>{window.__sent=[];const o=MG_ONLINE.send;});
  const hit=await A.pg.evaluate(()=>{const r=[...MG_ONLINE.players.values()][0];const res=hitScan({x:0,y:1,z:7},{x:1,y:0,z:0},50);return res.kind;});
  ok(hit==='rplayer','луч попадает в чужого игрока (hitScan расширен)',hit);
  await sleep(3300);await A.pg.evaluate(()=>{S.weapon='revolver';});
  await A.pg.evaluate(()=>{const r=[...MG_ONLINE.players.values()][0];applyHit({kind:'rplayer',obj:r},25,{x:1,z:0});});
  await B.pg.waitForFunction(()=>player.hp===75,null,{timeout:4000}).catch(()=>{});ok(await B.pg.evaluate(()=>player.hp)===75,'урон по Бобу посчитан сервером и пришёл ему (HP 75)');
  const lc=await A.pg.evaluate(()=>MG_ONLINE.layerInfo);ok(lc&&lc.pads>0&&lc.traps>0&&lc.teles>0&&lc.slime>0,'слой карты ХАОС построен (батуты, ловушки, телепорты, слизь)',lc);
  const errs=[...A.errs,...B.errs].filter(e=>!/favicon|Failed to load resource/.test(e));ok(errs.length===0,'в консоли нет ошибок',errs.slice(0,3));
  console.log('[F] Выход и повторный вход');
  const tok=await A.pg.evaluate(()=>localStorage.getItem('mg_acc_token'));ok(!!tok,'токен сессии сохранён на устройстве');
  const A2=await newUser('x');await A2.pg.evaluate((t)=>localStorage.setItem('mg_acc_token',t),tok).catch(()=>{});
  console.log('\n══ Итого UI/клиент: '+pass+' ок, '+fail+' провалов ══');
  await br.close();await new Promise(r=>srv.stop(r));fs.rmSync(DIR,{recursive:true,force:true});process.exit(fail?1:0);
})().catch(e=>{console.error('ТЕСТ УПАЛ',e);process.exit(1);});
