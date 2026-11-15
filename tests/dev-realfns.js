function rowBtn(b,label,sub,btnText,onClick,disabled){const d=document.createElement('div');d.className='inv';const s=document.createElement('span');s.textContent=label;s.style.flex='1';
  const w=document.createElement('span');w.style.cssText='font-size:15px;opacity:.65;white-space:nowrap';w.textContent=sub||'';const u=document.createElement('button');u.textContent=btnText;
  if(disabled){u.disabled=true;u.style.opacity='.45';}else u.onclick=onClick;d.append(s,w,u);b.appendChild(d);return d;}
function devAmount(b){const s=document.createElement('div');s.className='sec';s.textContent='💰 Начислить сумму (персонажу, за которого играешь)';b.appendChild(s);
  const inp=document.createElement('input');inp.id='devSum';inp.type='number';inp.inputMode='numeric';inp.placeholder='Например: 250000';inp.style.cssText='width:100%;font-size:18px;padding:10px;border-radius:12px;border:3px solid #22325a;box-sizing:border-box';b.appendChild(inp);
  const go=document.createElement('button');go.className='pbtn main';go.style.marginTop='6px';go.textContent='Начислить';go.onclick=()=>{const n=Math.round(+String(inp.value).replace(/[^\d-]/g,''));
    if(!n||!isFinite(n)){toast('Введи число.');return;}if(Math.abs(n)>1e12){toast('Слишком много даже для Гуся.');return;}addMoney(n,'DEV');saveGame();toast('🧪 '+(n>0?'+':'')+fmt(n)+' → '+player.name,1800);inp.value='';};b.appendChild(go);}

function phLine(b,t,fs){const d=document.createElement('div');d.className='ti';d.style.fontSize=(fs||16)+'px';d.textContent=t;b.appendChild(d);return d;}
function phSec(b,t){const d=document.createElement('div');d.className='sec';d.textContent=t;b.appendChild(d);}
function phTabs(list,cur,set){const tabs=$('tabs');tabs.innerHTML='';list.forEach(([t,k])=>{const bt=document.createElement('button');bt.className='tab'+(cur===k?' act':'');bt.textContent=t;bt.onclick=()=>{set(k);sfx('click');renderPhone();};tabs.appendChild(bt);});}
function tog(b,label,on,fn){rowBtn(b,label,on?'ON':'OFF',on?'Выключить':'Включить',()=>{fn(!on);saveGame();renderPhone();});const r=b.lastChild;if(r&&r.style)r.style.borderLeft='6px solid '+(on?'#2fae5b':'#9a9a9a');}
function renderDev(b){ensure9();phTabs([['Игрок','main'],['Мир','world'],['Транспорт','veh'],['Оружие','guns'],['Хаос','chaos'],['📍 Телепорты','tp']],devTab,k=>devTab=k);
  phLine(b,'🧪 DEV-панель — инструмент разработчика. Не восстанавливает сохранения автоматически.',13);const D=(t,f)=>rowBtn(b,t,'','OK',()=>{f();saveGame();toast('🧪 '+t,1200);renderPhone();});
  if(devTab==='main'){devAmount(b);D('⏭️ ПРОПУСТИТЬ ТЕКУЩЕЕ ЗАДАНИЕ',()=>skipStory());D('💰 +100 000 ₽',()=>addMoney(1e5,'DEV'));D('💰 +1 000 000 ₽',()=>addMoney(1e6,'DEV'));D('❤️ Вылечить',()=>{player.hp=100;});
    tog(b,'🛡️ Бессмертие',!!S.chaos.fx.god,v=>{S.chaos.fx.god=v;if(v&&!chaosOn())toast('Эффекты действуют при включённом CHAOS MODE.');});tog(b,'🦘 Суперпрыжок',!!S.chaos.fx.superjump,v=>S.chaos.fx.superjump=v);tog(b,'🪐 Гравитация 0',!!S.chaos.fx.grav0,v=>S.chaos.fx.grav0=v);
    D('🛹 Все трюки',()=>TRICKS.forEach(t=>S.tricks[player.id][t.id]=LEARN_N));D('🪪 Документы Гуся',()=>{S.docs=true;});D('🛹 Приглашение на мероприятие',()=>{SKEV.state='invited';SKEV.deadlineDay=WORLD.day;});D('🚕 Следующий заказ — Максим',()=>{TAXI.forceMaksim=true;});}
  if(devTab==='world'){phSec(b,'Время');[['🌅 Утро',8],['☀️ День',13],['🌇 Закат',19],['🌙 Ночь',23]].forEach(([n,t])=>D(n,()=>{WORLD.t=t;}));
    phSec(b,'Погода и сезон');D('☀️ Ясно',()=>{WORLD.wMode='fixed';WORLD.weather='clear';});D('🌧️ Дождь',()=>{WORLD.wMode='fixed';WORLD.weather='rain';});D('❄️ Зима + снег',()=>{applySeason('winter');WORLD.wMode='fixed';WORLD.weather='snow';});D('🌸 Весна',()=>applySeason('spring'));D('🔁 Погода авто',()=>{WORLD.wMode='auto';});
    phSec(b,'Розыск');for(let i=0;i<=5;i++)D('🪿 Уровень '+i,()=>{if(i===0)clearWanted();else setWanted(i);});
    phSec(b,'NPC');D('👥 Спавн 3 прохожих рядом',()=>{for(let i=0;i<3;i++){const a=gagActor();const p=rndNear(2,6);placeA(a,p.x,p.z,0);a.path=[[p.x,p.z],[p.x+8,p.z]];a.leg=0;a.mood='walk';a.collide=true;peds.push(a);}});
    D('🧹 Убрать прохожих рядом (на минуту)',()=>{nearPeds(60).forEach(a=>{a.inactive=true;a.g.visible=false;setTimeout(()=>{a.inactive=false;},60000);});});}
  if(devTab==='veh'){D('🗑️ Убрать все мои машины',()=>{VEHS.slice().forEach(v=>{if(v!==player.drive&&(v.owner===player.id||v.chaos)){cityG.remove(v.g);VEHS.splice(VEHS.indexOf(v),1);}});});
    phSec(b,'Спавн (временно, рядом) / выдать в гараж');Object.keys(VEH_TYPES).filter(k=>!VEH_TYPES[k].rental).forEach(k=>{const T=VEH_TYPES[k];rowBtn(b,T.e+' '+T.n,T.shop==='chaos'?'хаос':'','Спавн',()=>{closeModal();const P=player.pos;const v=spawnVehicle(k,'dev',P.x+Math.cos(player.yaw)*5,P.z-Math.sin(player.yaw)*5,player.yaw);v.owner='dev';v.chaos=true;});
      if(T.shop!=='chaos')rowBtn(b,'↳ выдать '+T.n+' в гараж','','Выдать',()=>{if(!S.vehicles[player.id].includes(k))S.vehicles[player.id].push(k);saveGame();toast('🚗 В гараже.');});});}
  if(devTab==='guns'){D('🔫 Выдать всё оружие',()=>WK.forEach(k=>{if(!S.weapons.includes(k))S.weapons.push(k);}));WK.forEach(k=>D(WEAP[k].e+' '+WEAP[k].n,()=>{if(!S.weapons.includes(k))S.weapons.push(k);if(chaosOn())equipWeapon(k);}));}
  if(devTab==='chaos'){phLine(b,'DEV может включить хаос до конца сюжета — только для тестов.',13);tog(b,'☠️ CHAOS MODE',chaosOn(),v=>chaosToggle(v,true));tog(b,'🎲 Случайный хаос',RC.on,v=>{RC.on=v;if(!v)rcEnd();});D('⏹ Остановить текущее событие',()=>rcEnd());
    phSec(b,'CHAOS TEST — запустить событие');RCE.forEach(e=>rowBtn(b,e.e+' '+e.n,e.w&&e.w<1?'редкое':'','Пуск',()=>{if(!chaosOn())chaosToggle(true,true);closeModal();rcStart(e);}));}
  if(devTab==='tp'){phLine(b,'Список легко расширять: addTeleport(имя, x, z).',13);TELEPORTS.forEach(([n,x,z])=>rowBtn(b,n,'','Туда',()=>{closeModal();teleportTo(x,z);}));}}

function teleportTo(x,z){if(area!=='city'){toast('Телепорт работает на улице.');return;}if(player.drive){const v=player.drive;v.pos.set(x,H(x,z),z);v.g.position.copy(v.pos);v.v=0;}else{placeA(player,x,z,player.yaw);const q={x:x+1.5,z:z+1.5};collide(q,.4);placeA(comp,q.x,q.z);}cam.yaw=player.yaw+Math.PI;}
