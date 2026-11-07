const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');
let pass=0,fail=0;const ok=(c,n,x)=>{c?pass++:fail++;console.log(c?'  ✔':'  ✘ ПРОВАЛ:',n,c?'':JSON.stringify(x));};
(async()=>{
 const br=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--no-sandbox']});
 const pg=await (await br.newContext()).newPage();const errs=[];pg.on('pageerror',e=>errs.push(String(e)));pg.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
 await pg.goto('file:///home/claude/h9/index.html');await pg.waitForFunction(()=>window.MG_STORY&&MG_DIST&&typeof MG_L1!=='undefined'&&MG_L3,null,{timeout:8000});await pg.waitForTimeout(900);
 await pg.evaluate(()=>{
  const R=.35,CELL=.25;
  window.analyze=function(areaId,sx,sz,half,opts){opts=opts||{};
    const cx=opts.cx!==undefined?opts.cx:sx, cz=opts.cz!==undefined?opts.cz:sz;
    const N=Math.ceil(half*2/CELL),x0=cx-half,z0=cz-half;const blocked=new Uint8Array(N*N);
    const cols=COLS.filter(c=>c.on!==false&&(c.area===areaId)&&c.h>.36);
    for(const c of cols){
      if(c.t==='r'){const a=Math.max(0,Math.floor((c.x0-R-x0)/CELL)),b=Math.min(N-1,Math.floor((c.x1+R-x0)/CELL)),d=Math.max(0,Math.floor((c.z0-R-z0)/CELL)),e=Math.min(N-1,Math.floor((c.z1+R-z0)/CELL));for(let j=d;j<=e;j++)for(let i=a;i<=b;i++)blocked[j*N+i]=1;}
      else{const rr=c.r+R,a=Math.max(0,Math.floor((c.cx-rr-x0)/CELL)),b=Math.min(N-1,Math.floor((c.cx+rr-x0)/CELL)),d=Math.max(0,Math.floor((c.cz-rr-z0)/CELL)),e=Math.min(N-1,Math.floor((c.cz+rr-z0)/CELL));for(let j=d;j<=e;j++)for(let i=a;i<=b;i++){const px=x0+(i+.5)*CELL,pz=z0+(j+.5)*CELL;if(Math.hypot(px-c.cx,pz-c.cz)<=rr)blocked[j*N+i]=1;}}
    }
    const si=Math.floor((sx-x0)/CELL),sj=Math.floor((sz-z0)/CELL);const seen=new Uint8Array(N*N);const q=[];
    const startBlocked=!!blocked[sj*N+si];
    if(!startBlocked){q.push(sj*N+si);seen[sj*N+si]=1;}
    let head=0;while(head<q.length){const v=q[head++],i=v%N,j=(v-i)/N;for(const [di,dj] of [[1,0],[-1,0],[0,1],[0,-1]]){const ni=i+di,nj=j+dj;if(ni<0||nj<0||ni>=N||nj>=N)continue;const w=nj*N+ni;if(seen[w]||blocked[w])continue;seen[w]=1;q.push(w);}}
    let minx=1e9,maxx=-1e9,minz=1e9,maxz=-1e9;for(const v of q){const i=v%N,j=(v-i)/N,x=x0+(i+.5)*CELL,z=z0+(j+.5)*CELL;if(x<minx)minx=x;if(x>maxx)maxx=x;if(z<minz)minz=z;if(z>maxz)maxz=z;}
    const reach=(x,z,r)=>{const rc=Math.ceil(r/CELL);const ci=Math.floor((x-x0)/CELL),cj=Math.floor((z-z0)/CELL);for(let dj=-rc;dj<=rc;dj++)for(let di=-rc;di<=rc;di++){const i=ci+di,j=cj+dj;if(i<0||j<0||i>=N||j>=N)continue;if(!seen[j*N+i])continue;const px=x0+(i+.5)*CELL,pz=z0+(j+.5)*CELL;if(Math.hypot(px-x,pz-z)<=r)return true;}return false;};
    return {reach,startBlocked,count:q.length,bbox:[minx,maxx,minz,maxz],cols:cols.length};
  };
  window.checkArea=function(areaId,sx,sz,half,opts){const A=analyze(areaId,sx,sz,half,opts);const bad=[];
    inters.filter(i=>i.area===areaId&&typeof i.p==='object'&&i.p&&i.r>.5).forEach(i=>{const r=Math.min(i.r,i.r);if(!A.reach(i.p.x,i.p.z,r))bad.push(i.label+' @'+i.p.x.toFixed(1)+','+i.p.z.toFixed(1));});
    return {A:{startBlocked:A.startBlocked,count:A.count,bbox:A.bbox.map(v=>+v.toFixed(1)),cols:A.cols},bad,total:inters.filter(i=>i.area===areaId&&typeof i.p==='object'&&i.p).length};};
 });
 // ===== районы =====
 console.log('[A] Районы: проходимость');
 for(const id of ['dock','neon','green','biz']){
   const r=await pg.evaluate((id)=>{const d=MG_DIST.dist[id];MG_DIST.ensure(d);const out=checkArea(id,d.ox,d.oz+66,160);const K=MG_DIST.built[id].K;out.hops=0;return {...out,ox:d.ox,oz:d.oz};},id);
   const inBox=r.A.bbox[0]>=r.ox-84&&r.A.bbox[1]<=r.ox+84&&r.A.bbox[2]>=r.oz-84&&r.A.bbox[3]<=r.oz+84;
   ok(!r.A.startBlocked,'«'+id+'»: точка прибытия не внутри препятствия');
   ok(r.A.cols>25,'«'+id+'»: коллайдеры существуют ('+r.A.cols+') — игрок не проходит сквозь здания',r.A.cols);
   ok(inBox,'«'+id+'»: периметр замкнут — из района нельзя выйти (достижимая область '+r.A.bbox.join(' / ')+')',r.A.bbox);
   ok(r.bad.length===0,'«'+id+'»: до всех '+r.total+' точек взаимодействия можно дойти',r.bad);
 }
 // ===== интерьеры =====
 console.log('\n[B] Интерьеры районов');
 for(const k of ['garage','arcade','cinema','greenhouse','bank','gym']){
   const r=await pg.evaluate((k)=>{MG_DIST.enter(k,'dock',6,22.2);return new Promise(res=>setTimeout(()=>{const I=MG_DIST.inter[k];const out=checkArea('in_'+k,I.ox,I.oz+I.def.d/2-2.4,40);res(out);},60));},k);
   ok(!r.A.startBlocked&&r.bad.length===0,'интерьер «'+k+'»: вход свободен, все '+r.total+' точек достижимы',r);
 }
 // ===== Перекрёсток в районе =====
 console.log('\n[C] «Перекрёсток» в Стеклянном квартале и дыра');
 const pr=await pg.evaluate(()=>{const kb=MG_DIST.built.biz.K;const d=MG_L1.doorW();const A=analyze('biz',kb.ox,kb.oz+66,160);return {door:A.reach(d.x,d.z,3.4),hole:A.reach(MG_L1.holeW().x,MG_L1.holeW().z+8,1),stopToDoor:A.reach(d.x,d.z,.5)};});
 ok(pr.door,'дверь «Перекрёстка» достижима от остановки (по дорогам и тротуарам)',pr);
 const hc=await pg.evaluate(()=>{const kb=MG_DIST.built.biz.K;S.q.points=false;MG_L1.Q().stage=1;MG_L1.holeState();const A1=analyze('biz',kb.ox,kb.oz+66,160);const hw=MG_L1.holeW();const near1=A1.reach(hw.x,hw.z-4.2,.6);const insideSmall=A1.reach(hw.x,hw.z,.4);S.q.points=true;MG_L1.holeState();const A2=analyze('biz',kb.ox,kb.oz+66,160);const door=A2.reach(MG_L1.doorW().x,MG_L1.doorW().z,3.4);const stop2=A2.reach(kb.ox,kb.oz+66,1);const insideBig=A2.reach(hw.x,hw.z,.4);
   // обход: можно ли дойти от остановки до двери при большой дыре
   S.q.points=false;MG_L1.Q().stage=0;MG_L1.holeState();return {near1,insideSmall,door,stop2,insideBig};});
 ok(hc.near1&&!hc.insideSmall,'маленькая дыра: к ограждению подойти можно, внутрь — нельзя (не провалиться)',hc);
 ok(hc.door&&hc.stop2&&!hc.insideBig,'большая дыра: проход к «Перекрёстку» остаётся, внутрь дыры войти нельзя',hc);
 // ===== магазин =====
 console.log('\n[D] Магазин «Перекрёсток» (внутри)');
 await pg.evaluate(()=>{S.q.ufo=true;MG_L1.Q().stage=1;MG_L1.enterStore();});await pg.waitForTimeout(300);
 const st=await pg.evaluate(()=>{const K=MG_STORY.areas.p1_store;return checkArea('p1_store',K.ox,K.oz+19.5,45);});
 ok(!st.A.startBlocked,'вход в магазин свободен');
 ok(st.bad.length===0,'магазин: до всех '+st.total+' точек (киоск, тележки, дегустация, охрана, морозильная, ценники, выход) можно дойти',st.bad);
 const stb=await pg.evaluate(()=>{const K=MG_STORY.areas.p1_store;const A=analyze('p1_store',K.ox,K.oz+19.5,45);const ev=[[-26,-18],[26,-18],[0,-20],[-12,4],[12,-10]].map(p=>A.reach(K.ox+p[0],K.oz+p[1],1.2));const pat=[[-9,-19.5],[14,-19.5],[14,-12.5],[-14,-12.5],[-14,-5.5],[14,-5.5],[14,1],[-14,1],[-3,6],[-14,6]].map(p=>A.reach(K.ox+p[0],K.oz+p[1],.6));return {ev,pat,box:A.bbox};});
 ok(stb.pat.every(Boolean),'маршруты покупателей проходимы (все 10 точек патруля достижимы)',stb.pat);
 ok(stb.box[0]>=await pg.evaluate(()=>MG_STORY.areas.p1_store.ox)-31&&stb.box[1]<=await pg.evaluate(()=>MG_STORY.areas.p1_store.ox)+31,'магазин замкнут стенами (нельзя выйти за стены)',stb.box);
 // ===== Дикси =====
 console.log('\n[E] Дикси и страшный супермаркет');
 await pg.evaluate(()=>{S.q.points=true;MG_L3.Q().stage=1;MG_L3.enterDixie();});await pg.waitForTimeout(300);
 const dx=await pg.evaluate(()=>{const K=MG_STORY.areas.p3_dixie;return checkArea('p3_dixie',K.ox,K.oz+12,40);});
 ok(!dx.A.startBlocked&&dx.bad.length===0,'Дикси: вход свободен, все '+dx.total+' точек достижимы (кола, сидр, мясной отдел, выход)',dx);
 const hz=await pg.evaluate(()=>{const K=MG_L3.K.hor;const out={};
   // дверь эвакуации закрыта: A,B,C,D достижимы, коридор и тупик — нет
   MG_L3.S3.doorOpen=false;MG_L3.K.turnCol.on=true;let A=analyze('p3_horror',K.ox,K.oz,110);out.closed={reachBadge:A.reach(K.ox-46,K.oz+8,1),reachC:A.reach(K.ox+34,K.oz,1),reachTurn:A.reach(K.ox+34,K.oz-8,1),reachD:A.reach(K.ox+34,K.oz-30,1),reachEv:A.reach(K.ox-14,K.oz-30,1),reachDead:A.reach(K.ox-30,K.oz-60,1),panel:A.reach(K.ox+22.8,K.oz-33.4,1),fuses:K.fuseSpots?0:0};
   const bad=[];inters.filter(i=>i.area==='p3_horror'&&typeof i.p==='object'&&i.p&&i.r>.5).forEach(i=>{if(!A.reach(i.p.x,i.p.z,i.r))bad.push(i.label);});out.badClosed=bad;
   // пройден турникет, затем открыта эвакуационная дверь
   MG_L3.K.turnCol.on=false;
   K.doorCol&&0;const dc=MG_L3.K.doorCol;dc.on=false;A=analyze('p3_horror',K.ox,K.oz,110);
   const EV=[[20,-30],[-14,-30],[-14,-44],[-30,-44],[-30,-56],[-30,-60]];out.path=EV.map(p=>A.reach(K.ox+p[0],K.oz+p[1],.6));
   out.deadRoom=A.reach(K.ox-30,K.oz-62,1);out.lot=A.reach(K.ox-30,K.oz-72,1);dc.on=true;
   // после «дыры»: стена исчезла и её коллайдер выключен → можно выйти на парковку
   MG_L3.K.deadCol.on=false;dc.on=false;A=analyze('p3_horror',K.ox,K.oz,110);out.lotAfter=A.reach(K.ox-30,K.oz-75,1);MG_L3.K.deadCol.on=true;dc.on=true;return out;});
 console.log(JSON.stringify(hz));
 ok(hz.closed.reachBadge&&hz.closed.reachC&&hz.closed.reachTurn&&!hz.closed.reachD,'до турникета достижимы приёмка, «Мистика» и Светофор-зал; мясокомбинат закрыт турникетом',hz.closed);
 ok(!hz.closed.reachEv&&!hz.closed.reachDead,'пока эвакуационная дверь закрыта — коридор и тупик недоступны (нет обходов)',hz.closed);
 ok(hz.path.every(Boolean)&&hz.deadRoom,'после открытия двери коридор до тупика проходим (6 точек маршрута)',hz.path);
 ok(!hz.lot,'пока стена цела, выйти на парковку нельзя');
 ok(hz.lotAfter,'после того как дыра забрала стену, на парковку можно выйти');
 ok(hz.badClosed.every(l=>/щиток|Щиток|График|Спрятаться/i.test(l)),'до турникета недоступны только точки мясокомбината',hz.badClosed);
 const D2=await pg.evaluate(()=>{const K=MG_L3.K.hor;MG_L3.K.turnCol.on=false;MG_L3.K.doorCol.on=true;const A=analyze('p3_horror',K.ox,K.oz,110);const bad=[];inters.filter(i=>i.area==='p3_horror'&&typeof i.p==='object'&&i.p&&i.r>.5).forEach(i=>{if(!A.reach(i.p.x,i.p.z,i.r))bad.push(i.label);});MG_L3.K.turnCol.on=true;return {bad,bbox:A.bbox.map(v=>+v.toFixed(0)),ox:K.ox,oz:K.oz};});
 ok(D2.bad.length===0,'после турникета достижимы все 3 щитка, главный щиток, укрытия и записки',D2.bad);
 const e=errs.filter(x=>!/favicon/.test(x));ok(e.length===0,'ошибок JavaScript нет',e.slice(0,3));
 console.log('\n══ проходимость: '+pass+' ок, '+fail+' провалов ══');await br.close();process.exit(fail?1:0);
})().catch(e=>{console.error('ТЕСТ УПАЛ',e);process.exit(1);});
