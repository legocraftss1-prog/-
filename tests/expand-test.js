const { chromium } = require('playwright');
let ok=0,bad=0;const T=(c,m,d)=>{if(c){ok++;console.log('  ✔',m);}else{bad++;console.log('  ✘ ПРОВАЛ:',m,d!==undefined?JSON.stringify(d).slice(0,400):'');}};
(async()=>{const br=await chromium.launch({args:['--no-sandbox']});const pg=await br.newPage();const errs=[];
pg.on('pageerror',e=>errs.push(String(e)));pg.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
await pg.goto('file:///home/claude/proj/tests/expand-stand/index.html');await pg.waitForFunction(()=>typeof worldReady!=='undefined'&&worldReady,null,{timeout:90000});await pg.waitForTimeout(1500);
// поддельный склеенный кусок: треугольники забора и дерева в воротах + дерево вне ворот
const pre=await pg.evaluate(()=>{const E=MG_EXPAND;
  const tri=(x,y,z)=>[x,y,z,x+.2,y+1,z,x,y+1,z+.2];
  const g=new THREE.BufferGeometry();const arr=[].concat(tri(-736,0,100),tri(120,2,700),tri(300,2,700));g.setAttribute('position',new THREE.Float32BufferAttribute(arr,3));
  const fm=new THREE.Mesh(g,mat(0x9a948a));fm.userData.merged=true;cityG.add(fm);
  const g2=new THREE.BufferGeometry();g2.setAttribute('position',new THREE.Float32BufferAttribute([].concat(tri(118,2,705),tri(300,2,705)),3));const tm=new THREE.Mesh(g2,mat(0x3a7a3a));tm.userData.merged=true;cityG.add(tm);
  window.__fm=fm;window.__tm=tm;
  return {active:E.active,built:E.built,want:E.want(),WR:WORLD_R,fenceOn:cols.filter(c=>c.x1-c.x0<.6&&c.z1-c.z0>40&&Math.abs(Math.abs((c.x0+c.x1)/2)-736)<.4).every(c=>c.on)}});
T(!pre.active&&!pre.built&&!pre.want,'до финала сюжетки №15 расширение не строится',pre);
T(pre.WR===732&&pre.fenceOn,'забор и граница мира прежние',pre);
// игрок у забора: дальше не пройти
const blocked=await pg.evaluate(()=>{const q={x:0,z:735.6};collide(q,.45);return q.z;});
T(blocked<735.4,'без расширения за забор не выйти',blocked);
// включаем как после финала
const t0=Date.now();
const st=await pg.evaluate(()=>{S.q.w15=true;MG_EXPAND.sync();const E=MG_EXPAND;return {active:E.active,built:E.built,stats:E.stats,WR:WORLD_R,roads:ROADS.filter(r=>r.ex).length,lm:LANDMARKS.filter(l=>l.ex).map(l=>l.n),
  fm:Array.from(__fm.geometry.attributes.position.array).map(v=>+v.toFixed(2)),tm:Array.from(__tm.geometry.attributes.position.array).map(v=>+v.toFixed(2))}});
console.log('  постройка:',Date.now()-t0,'мс',JSON.stringify(st.stats));
T(st.active&&st.built,'после финала расширение включается',st);
T(!st.stats.zoneErr&&!st.stats.err,'все четыре края построились без ошибок',st.stats);
T(st.WR>=1800,'граница мира раздвинута',st.WR);
T(st.roads>=33,'новые дороги в ROADS: '+st.roads,st.roads);
T(['Маяк','Парк «Солнечный»','Порт','Озеро «Тихое»','Термы','Рыбацкая деревня','Виноградники','Марина','Набережная','Пирс'].every(n=>st.lm.some(l=>l.indexOf(n)>=0)),'достопримечательности на всех сторонах',st.lm);
const f=st.fm;T(f[0]===f[3]&&f[0]===f[6]&&f[1]===f[4]&&f[2]===f[5],'склеенный забор схлопнут',f.slice(0,9));
T(f[9]===f[12]&&f[10]===f[13],'дерево склеенное в воротах (тот же кусок) схлопнуто',f.slice(9,18));
T(f[18]!==f[21],'дерево вне ворот не тронуто',f.slice(18,27));
const tm=st.tm;T(tm[0]===tm[3]&&tm[9]!==tm[12],'в другом материале: в воротах схлопнуто, вне — нет',tm);
T(st.stats.cut&&st.stats.cut.cols>=128,'коллайдеры забора выключены: '+(st.stats.cut&&st.stats.cut.cols),st.stats.cut);
// стыки высот на ±742
const seam=await pg.evaluate(()=>{let mx=0,at=null;for(let t=-742;t<=742;t+=7){for(const [x,z] of [[742,t],[-742,t],[t,742],[t,-742]]){const dx=x>0?1:x<0?-1:0,dz=z>0?1:z<0?-1:0;const a=H(x-dx*(Math.abs(x)===742?.6:0)-0,z-dz*(Math.abs(z)===742?.6:0)),b=H(x+dx*(Math.abs(x)===742?.6:0),z+dz*(Math.abs(z)===742?.6:0));if(Math.abs(a-b)>mx){mx=Math.abs(a-b);at=[x,z,a,b];}}}return {mx,at};});
T(seam.mx<.35,'рельеф на стыке старой и новой земли без ступенек (макс. '+seam.mx.toFixed(3)+')',seam);
// ворота: прогулка пешком из старого города к кольцу через каждые ворота
const walks=await pg.evaluate(async()=>{const res=[];for(const G_ of MG_EXPAND._t.GATES){const [gx,gz,dx,dz]=G_;const sx=gx,sz=gz;
   const ok=freeAt(sx,sz,.5);placeA(player,sx,sz,Math.atan2(dx,dz));player.yaw=Math.atan2(dx,dz);let blockedSteps=0;
   const hitAt=[];for(let s=0;s<160;s++){const q={x:player.pos.x+dx*.6,z:player.pos.z+dz*.6};const o={...q};collide(q,.45);if(Math.hypot(q.x-o.x,q.z-o.z)>.05){blockedSteps++;const c=colsNear(o.x,o.z,1).find(c=>c.on&&o.x>c.x0-.5&&o.x<c.x1+.5&&o.z>c.z0-.5&&o.z<c.z1+.5);hitAt.push([+o.x.toFixed(1),+o.z.toFixed(1),c&&{x0:c.x0,x1:c.x1,z0:c.z0,z1:c.z1,h:c.h,rad:c.rad,ex:MG_EXPAND._t&&0}]);}placeA(player,q.x,q.z,player.yaw);}
   res.push({hitAt,g:[gx,gz],end:[+player.pos.x.toFixed(1),+player.pos.z.toFixed(1)],blockedSteps,start:ok});}return res;});
T(walks.every(w=>w.blockedSteps===0),'через все 12 ворот проход свободен (пешком, 96 м наружу)',walks.filter(w=>w.blockedSteps));
// проходимость: заливка по сетке 3 м от ворот по всей новой суше
const reach=await pg.evaluate(()=>{const E=MG_EXPAND,st=3,x0=-1750,z0=-1862,nx=Math.ceil(3500/st),nz=Math.ceil(3672/st);const V=new Uint8Array(nx*nz);
  const ok=(x,z)=>E.outside(x,z)&&E.gridH(x,z)>=-.85&&freeAt(x,z,.45);const q=[];
  const add=(i,j,h)=>{if(i<0||j<0||i>=nx||j>=nz)return;const k=j*nx+i;if(V[k])return;const x=x0+i*st,z=z0+j*st;if(!ok(x,z)){V[k]=2;return;}const hh=H(x,z);if(h!==null&&Math.abs(hh-h)>2.4)return;V[k]=1;q.push(k);};
  const g=E._t.GATES[1];add(Math.round((g[0]-x0)/st),Math.round((g[1]+80-z0)/st),null);
  while(q.length){const k=q.pop(),i=k%nx,j=(k-i)/nx,h=H(x0+i*st,z0+j*st);add(i+1,j,h);add(i-1,j,h);add(i,j+1,h);add(i,j-1,h);}
  let land=0,got=0;for(let j=0;j<nz;j+=2)for(let i=0;i<nx;i+=2){const x=x0+i*st,z=z0+j*st;if(!E.outside(x,z)||E.isWater(x,z)||E.gridH(x,z)<.3)continue;land++;if(V[j*nx+i]===1)got++;}
  const miss=[];E.lm.forEach(l=>{const p=E.spotNear(l.x,l.z);if(!p){miss.push(l.n+' (нет места)');return;}let f=false;for(let dj=-3;dj<=3&&!f;dj++)for(let di=-3;di<=3&&!f;di++){const i=Math.round((p.x-x0)/st)+di,j=Math.round((p.z-z0)/st)+dj;if(V[j*nx+i]===1)f=true;}if(!f)miss.push(l.n);});
  const gates=E._t.GATES.filter(g=>{const gx=g[2]?g[2]*764:g[0],gz=g[3]?g[3]*764:g[1];const i=Math.round((gx-x0)/st),j=Math.round((gz-z0)/st);for(let d=-2;d<=2;d++)for(let e=-2;e<=2;e++)if(V[(j+e)*nx+i+d]===1)return false;return true;}).map(g=>g.slice(0,2));
  return {land,got,pct:Math.round(100*got/land),miss,gates};});
console.log('  проходимость:',JSON.stringify(reach));
T(reach.miss.length===0,'до всех мест расширения можно дойти пешком от ворот',reach.miss);
T(reach.gates.length===0,'все 12 ворот связаны между собой по суше',reach.gates);
T(reach.pct>=85,'доступно '+reach.pct+'% новой суши',reach);
// глубокая вода не пускает
const deep=await pg.evaluate(async()=>{placeA(player,1290,-85+0,0);await new Promise(r=>setTimeout(r,300));return {x:player.pos.x,z:player.pos.z,h:MG_EXPAND.gridH(1290,-85)};});
console.log('  вода:',JSON.stringify(deep));
const deep2=await pg.evaluate(async()=>{const W=r=>new Promise(f=>setTimeout(f,r));placeA(player,930,-380,Math.PI/2);await W(250);const tr=[];
  for(let i=0;i<120;i++){player.pos.x+=1;await W(25);tr.push(+player.pos.x.toFixed(1));}
  return {x:+player.pos.x.toFixed(1),z:+player.pos.z.toFixed(1),h:+MG_EXPAND.gridH(player.pos.x,player.pos.z).toFixed(2),tail:tr.slice(-5)};});
T(deep2.h>-.86&&deep2.x<1040,'в глубокую воду не зайти: стоп у берега',deep2);
// интерактивы
const it=await pg.evaluate(()=>{const L=inters.filter(o=>typeof o.label==='string'&&/маяк|колесе|гору|термах|Смотровая|канатке/.test(o.label));return L.map(o=>({l:o.label,p:iPos(o)}));});
T(it.length>=6,'действия на маяке, колесе, канатке, смотровой и в термах: '+it.length,it);
// выключение (DEV)
const off=await pg.evaluate(()=>{placeA(player,0,900,0);MG_EXPAND.set(false);return {active:MG_EXPAND.active,g:!!MG_EXPAND.g.parent,WR:WORLD_R,roads:ROADS.filter(r=>r.ex).length,lm:LANDMARKS.filter(l=>l.ex).length,pos:[player.pos.x,player.pos.z],fence:cols.filter(c=>c.x1-c.x0<.6&&c.z1-c.z0>40&&Math.abs(Math.abs((c.x0+c.x1)/2)-736)<.4).every(c=>c.on),fm:Array.from(__fm.geometry.attributes.position.array).slice(0,9),H:H(0,900),inters:inters.filter(o=>o.label==='🗼 Подняться на маяк').map(o=>o.ok())}});
T(!off.active&&!off.g&&off.WR===732&&off.roads===0&&off.lm===0,'выключение через DEV убирает всё',off);
T(off.fence&&off.fm[0]!==off.fm[3],'забор возвращается (коллайдеры и вид)',off);
T(Math.abs(off.pos[0])<742&&Math.abs(off.pos[1])<742,'игрока снаружи переносит в город',off.pos);
T(off.inters.every(v=>!v),'действия расширения выключены',off.inters);
const on2=await pg.evaluate(()=>{MG_EXPAND.set(true);return {active:MG_EXPAND.active,roads:ROADS.filter(r=>r.ex).length,fm:Array.from(__fm.geometry.attributes.position.array).slice(0,9)}});
T(on2.active&&on2.roads>=33&&on2.fm[0]===on2.fm[3],'повторное включение без перестройки',on2);
await pg.evaluate(()=>{MG_EXPAND.force=null;});
const rad=await pg.evaluate(()=>{const R=MG_EXPAND.radar;if(!R)return null;const g=document.getElementById('mini').getContext('2d');return {w:R.cv.width,h:R.cv.height,ox:R.ox,oz:R.oz,hook:!!g.__mgExp,url:R.cv.toDataURL('image/png')};});
T(rad&&rad.w>1000&&rad.hook,'слой мини-карты для новых земель построен и подключён',rad&&{w:rad.w,h:rad.h,hook:rad.hook});
if(rad)require('fs').writeFileSync('/tmp/claude-0/-home-claude/8fd66da0-ec33-5819-b7ea-645c721bb6c9/scratchpad/radar.png',Buffer.from(rad.url.split(',')[1],'base64'));
const mini=await pg.evaluate(async()=>{started=true;placeA(player,150,1060,0);miniT=0;drawMini(.2);const cv=document.getElementById('mini');const g=cv.getContext('2d');const d=g.getImageData(cv.width/2+20,cv.height/2+20,1,1).data;return {hidden:cv.classList.contains('hidden'),px:Array.from(d),url:cv.toDataURL()};});
require('fs').writeFileSync('/tmp/claude-0/-home-claude/8fd66da0-ec33-5819-b7ea-645c721bb6c9/scratchpad/mini.png',Buffer.from(mini.url.split(',')[1],'base64'));
T(!mini.hidden,'радар показывается за старой границей',mini.px);
// кадры идут без ошибок
await pg.waitForTimeout(1500);
const fr=await pg.evaluate(()=>({beam:MG_EXPAND.beam?MG_EXPAND.beam.rotation.y:null,wheel:MG_EXPAND.wheel?MG_EXPAND.wheel.rotation.z:null,cull:MG_EXPAND.CULL.length}));
T(fr.cull>50,'куски расширения в списке отсечения по дальности: '+fr.cull,fr);
const E2=errs.filter(e=>!/ERR_TUNNEL|setRGB|setHex/.test(e));T(E2.length===0,'ошибок в консоли нет (кроме известных от заглушки three)',E2.slice(0,8));
console.log(`══ расширение «почти дом»: ${ok} ок, ${bad} провалов ══`);await br.close();})().catch(e=>{console.error(e);process.exit(1);});
