const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');
let pass=0,fail=0;const ok=(c,n,x)=>{c?pass++:fail++;console.log(c?'  ✔':'  ✘ ПРОВАЛ:',n,c?'':JSON.stringify(x));};
(async()=>{
 const br=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--no-sandbox']});
 const pg=await br.newPage();const errs=[];pg.on('pageerror',e=>errs.push(String(e)));pg.on('console',m=>{if(m.type()==='error'||m.type()==='warning')errs.push(m.text());});
 await pg.goto('file:///home/claude/h2/index.html');await pg.waitForFunction(()=>MG_WATER.surf!==null,null,{timeout:4000});
 ok(true,'модуль воды нашёл озеро и поверхность, y='+await pg.evaluate(()=>MG_WATER.surf));
 const r=await pg.evaluate(()=>{
  const out={};
  // игрок на мелководье и в глубине
  player.pos.x=-392;player.pos.z=-20;for(let i=0;i<5;i++){updPlayer(.05);updEnv(.05,0);}
  out.swimDeep=!!MG_WATER.swim;
  player.pos.x=-392+26*.97;for(let i=0;i<5;i++){updPlayer(.05);updEnv(.05,0);}out.swimShore=!!MG_WATER.swim;
  player.pos.x=-392;for(let i=0;i<5;i++){updPlayer(.05);updEnv(.05,0);}
  doJump();for(let i=0;i<80;i++){updPlayer(.05);updEnv(.05,0);}out.diveDep=MG_WATER.swim.dep;out.feetDive=player.feet;
  const o2a=MG_WATER.o2;for(let i=0;i<200;i++){updPlayer(.05);updEnv(.05,0);}out.o2drop=o2a-MG_WATER.o2;
  for(let i=0;i<400;i++){updPlayer(.05);updEnv(.05,0);}out.hurts=hurts;
  doJump();for(let i=0;i<100;i++){updPlayer(.05);updEnv(.05,0);}out.surfaced=MG_WATER.swim.dep;out.o2back=MG_WATER.o2;
  player.pos.x=-300;for(let i=0;i<5;i++){updPlayer(.05);updEnv(.05,0);}out.leftWater=!MG_WATER.swim;
  // машина
  const v={pos:{x:-392,y:16,z:-20,copy(){}},yaw:0,v:15,g:{position:{y:0,copy(){}}},dmg:0};VEHS.push(v);
  let t=0;const log={};
  for(let i=0;i<2400;i++){t+=.05;updPlayer(.05);updEnv(.05,t);v.pos.y=v.pos.y;
    if(!log.slow&&Math.abs(v.v)<1)log.slow=t;if(!log.flood&&v.flooded)log.flood=t;if(!log.dmg60&&v.dmg>=60)log.dmg60=t;
    if(t>=20&&!log.at20)log.at20={dmg:v.dmg,flooded:!!v.flooded,y:v.pos.y};
    if(t>=60&&!log.at60)log.at60={y:v.pos.y,sub:v.sub};if(t>=119&&!log.end)log.end={y:v.pos.y,dmg:v.dmg,dead:v.dead,flooded:v.flooded};}
  out.car=log;
  repairCar(v);out.repaired={flooded:v.flooded,x:v.pos.x,z:v.pos.z,y:v.pos.y,e:Math.pow((v.pos.x+392)/26,2)+Math.pow((v.pos.z+20)/48,2),dmg:v.dmg};
  return out;});
 console.log(JSON.stringify(r,null,1));
 ok(r.swimDeep,'игрок в глубокой воде переходит в режим плавания');
 ok(!r.swimShore,'на мелководье (<1 м) он ещё идёт пешком');
 ok(r.diveDep>2,'нырок: глубина тела растёт',r.diveDep);
 ok(r.o2drop>.35,'под водой тратится воздух',r.o2drop);
 ok(r.hurts>0,'при нуле воздуха игрок получает урон',r.hurts);
 ok(r.surfaced<.05&&r.o2back>.2,'вынырнул — воздух восстанавливается',[r.surfaced,r.o2back]);
 ok(r.leftWater,'вышел на берег — режим плавания выключен');
 ok(r.car.slow&&r.car.slow<4,'машина тормозится водой',r.car.slow);
 ok(r.car.flood>29&&r.car.flood<33,'через ~30 с машина глохнет (flooded)',r.car.flood);
 ok(r.car.end&&!r.car.end.dead&&r.car.end.dmg<100,'машина не уничтожена навсегда (dead=false, урон<100)',r.car.end);
 ok(r.car.at60&&r.car.at60.y<r.car.at20.y-.5,'после глушения машина тонет (y уменьшается)',[r.car.at20,r.car.at60]);
 ok(r.repaired.flooded===false&&r.repaired.e>1.0&&r.repaired.dmg===0,'ремонт снимает затопление и ставит машину на берег',r.repaired);
 const e=errs.filter(x=>!/favicon/.test(x));ok(e.length===0,'ошибок в консоли нет',e.slice(0,3));
 console.log('\n══ вода/машины: '+pass+' ок, '+fail+' провалов ══');await br.close();process.exit(fail?1:0);
})();
