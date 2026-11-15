var matCache={};
function mat(c,o){const k=String(c)+(o?JSON.stringify(o):'');if(!matCache[k])matCache[k]=new THREE.MeshLambertMaterial(Object.assign({color:c},o||{}));return matCache[k];}
var G={box:new THREE.BoxGeometry(1,1,1),cyl:new THREE.CylinderGeometry(.5,.5,1,10),cone:new THREE.ConeGeometry(.5,1,8),
  sph:new THREE.SphereGeometry(.5,12,8),hemi:new THREE.SphereGeometry(1,14,7,0,TAU,0,Math.PI/2),
  circ:new THREE.PlaneGeometry(1,1)};
var lampMat=new THREE.MeshLambertMaterial({color:0xfff4d0,emissive:0x000000});
var shadowMat=new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:.22,depthWrite:false});
function M_(parent,geo,m,s,p,r,st){
  const o=new THREE.Mesh(geo,(typeof m==='number'||typeof m==='string')?mat(m):m);
  o.scale.set(s[0],s[1],s[2]);o.position.set(p[0],p[1],p[2]);
  if(r)o.rotation.set(r[0]||0,r[1]||0,r[2]||0);
  o.userData.st=st!==false;parent.add(o);return o;
}
function box(parent,w,h,d,c,x,y,z,o){
  o=o||{};
  const m=new THREE.Mesh(G.box,(typeof c==='object')?c:mat(c));
  m.scale.set(w,h,d);m.position.set(x,y+h/2,z);
  if(o.ry)m.rotation.y=o.ry;
  m.userData.st=!o.dyn;parent.add(m);
  if(o.col){m.userData.col=addCol(x-w/2,x+w/2,z-d/2,z+d/2);m.userData.col.h=y+h;}
  if(o.cam)camBlock[BA].push(m);
  return m;
}
function canvasTex(w,h,draw){const cv=document.createElement('canvas');cv.width=w;cv.height=h;const g=cv.getContext('2d');draw(g,w,h);
  const t=new THREE.CanvasTexture(cv);t.anisotropy=4;t.userData={cv,g};return t;}
var groundMat=new THREE.MeshLambertMaterial({color:0x8e9a80});
var roadMat=new THREE.MeshPhongMaterial({color:0x3b3f47,specular:0x000000,shininess:60});
var walkMat=new THREE.MeshLambertMaterial({color:0xb4b3ab});
var roofMat=new THREE.MeshLambertMaterial({color:0x6b6e75});
var pineMat=new THREE.MeshLambertMaterial({color:0x2f6a48});
var C_GROUND=new THREE.Color(0x8e9a80),C_ROAD=new THREE.Color(0x3b3f47),C_WALK=new THREE.Color(0xb4b3ab),C_ROOF=new THREE.Color(0x6b6e75),C_PINE=new THREE.Color(0x2f6a48);
var C_SNOW=new THREE.Color(0xf1f5fa),C_SNOWROAD=new THREE.Color(0xc9cfd8);
var bldMats=[];
var BENCHES=[];const LIFTB=[];const LIFTL=[];const PARKQ=[];
var leafMats=[new THREE.MeshLambertMaterial({color:0x3d7a45}),new THREE.MeshLambertMaterial({color:0x4f8a3d}),new THREE.MeshLambertMaterial({color:0x6b8f3a})];
var treePos=[];

/* window texture: 4x4 cells = 12m */
var winTex=canvasTex(256,256,g=>{g.fillStyle='#fff';g.fillRect(0,0,256,256);
  for(let i=0;i<4;i++)for(let j=0;j<4;j++){const x=i*64+14,y=j*64+12;g.fillStyle='#55667e';g.fillRect(x,y,36,40);
    g.fillStyle='#8ea2bb';g.fillRect(x+3,y+3,13,34);g.fillStyle='rgba(0,0,0,.12)';g.fillRect(x-3,y+40,42,4);}
  g.fillStyle='rgba(0,0,0,.05)';for(let j=0;j<4;j++)g.fillRect(0,j*64+62,256,2);});
winTex.wrapS=winTex.wrapT=THREE.RepeatWrapping;
var winEm=canvasTex(256,256,g=>{g.fillStyle='#000';g.fillRect(0,0,256,256);
  for(let i=0;i<4;i++)for(let j=0;j<4;j++){if(Math.random()<.5){g.fillStyle=pick(['#ffcf6a','#ffe3a0','#ffb35a','#cfe2ff']);g.fillRect(i*64+14,j*64+12,36,40);}}});
winEm.wrapS=winEm.wrapT=THREE.RepeatWrapping;

var bldMatCache={};
function bldMat(color,tex,em){const k=String(color)+'|'+tex.uuid;if(!bldMatCache[k]){const m=new THREE.MeshLambertMaterial({color,map:tex,emissive:0xffffff,emissiveMap:em,emissiveIntensity:0});bldMats.push(m);bldMatCache[k]=m;}return bldMatCache[k];}
function building(x,z,w,d,h,color,o){o=o||{};
  let lo=1e9,hi=-1e9;for(const [px,pz] of [[x-w/2,z-d/2],[x+w/2,z-d/2],[x-w/2,z+d/2],[x+w/2,z+d/2],[x,z]]){const y=H(px,pz);if(y<lo)lo=y;if(y>hi)hi=y;}
  const base=hi-lo>.05?lo-1.5:lo,top=hi+h,th=top-base,cell=o.cell||12;
  const geo=new THREE.BoxGeometry(w,th,d),uv=geo.attributes.uv;
  for(let f=0;f<6;f++){const su=f<2?d:w,sv=f<2?th:(f<4?d:th);for(let k=0;k<4;k++){const i=f*4+k;uv.setXY(i,uv.getX(i)*su/cell,uv.getY(i)*sv/cell);}}
  const m=new THREE.Mesh(geo,bldMat(color,o.tex||winTex,o.em||winEm));m.position.set(x,base+th/2,z);m.userData.st=true;cityG.add(m);
  const c=addCol(x-w/2,x+w/2,z-d/2,z+d/2);c.h=top;camBlock.city.push(m);
  if(!o.noRoof)box(cityG,w+.4,.6,d+.4,roofMat,x,top,z);
  if(h>=12&&!o.noAC){for(const sd of[-1,1]){const n=Math.max(2,Math.floor(w/9));for(let i=0;i<n;i++){if(Math.random()<.35)continue;ac(x+rnd(-w/2+1.2,w/2-1.2),hi+3+3*Math.floor(rnd(0,h/3-1)),z+sd*(d/2+.01),sd>0?0:Math.PI);}}}
  m.userData.top=top;m.userData.lo=lo;return m;
}
function doorOn(x,z,ry,col){const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=ry;cityG.add(g);
  M_(g,G.box,col||0x5a3b2a,[1.5,2.3,.25],[0,1.15,0]);M_(g,G.box,0x7d8088,[2.6,.18,1.4],[0,2.75,.6]);
  M_(g,G.box,lampMat,[.3,.15,.15],[0,2.55,.2]);M_(g,G.box,0x9aa0a8,[2.4,.25,1.8],[0,.12,.9]);return g;}

function tree(x,z,s){s=s||1;const y=H(x,z);const r=Math.abs(Math.sin(x*12.9898+z*78.233)*43758.5453)%1;const lm=leafMats[Math.floor(r*997)%3];
  if(r<.28){M_(cityG,G.cyl,0x5b3d29,[.32*s,2.2*s,.32*s],[x,y+1.1*s,z]);M_(cityG,G.cone,pineMat,[2.6*s,2.8*s,2.6*s],[x,y+2.6*s,z]);M_(cityG,G.cone,pineMat,[1.9*s,2.3*s,1.9*s],[x,y+3.9*s,z]);}
  else if(r<.45){M_(cityG,G.cyl,0xeceae0,[.22*s,4.6*s,.22*s],[x,y+2.3*s,z]);for(let k=0;k<3;k++)M_(cityG,G.box,0x2a2a2a,[.23*s,.06*s,.1*s],[x,y+(1+k*1.2)*s,z+.06*s]);
    M_(cityG,G.sph,lm,[1.9*s,2.6*s,1.9*s],[x,y+4.6*s,z]);M_(cityG,G.sph,lm,[1.3*s,1.8*s,1.3*s],[x+.5*s,y+3.6*s,z+.3*s]);}
  else if(r<.58){M_(cityG,G.cyl,0x5b3d29,[.3*s,2.4*s,.3*s],[x,y+1.2*s,z]);M_(cityG,G.sph,lm,[1.7*s,6.4*s,1.7*s],[x,y+5*s,z]);}
  else if(r<.76){M_(cityG,G.cyl,0x5b3d29,[.32*s,2.2*s,.32*s],[x,y+1.1*s,z]);M_(cityG,G.sph,lm,[3*s,2.6*s,3*s],[x,y+3.2*s,z]);M_(cityG,G.sph,lm,[2*s,1.8*s,2*s],[x+.6*s,y+4.3*s,z-.3*s]);}
  else if(r<.9){M_(cityG,G.cyl,0x4a3020,[.4*s,1.8*s,.4*s],[x,y+.9*s,z]);M_(cityG,G.sph,lm,[4.4*s,2.4*s,4.4*s],[x,y+3*s,z]);M_(cityG,G.sph,lm,[2.6*s,1.6*s,2.6*s],[x-.8*s,y+3.9*s,z+.5*s]);}
  else{M_(cityG,G.cyl,0x6a4a30,[.16*s,1.8*s,.16*s],[x,y+.9*s,z]);M_(cityG,G.sph,lm,[1.4*s,1.6*s,1.4*s],[x,y+2.2*s,z]);}
  addCol(x-.3,x+.3,z-.3,z+.3);treePos.push([x,z]);}
function bench(parent,x,z,ry,color,st){const lb=parent===cityG;if(lb){BENCHES.push([x,z,ry]);st=false;}const g=new THREE.Group();g.position.set(x,H(x,z),z);g.rotation.y=ry;parent.add(g);if(lb)LIFTB.push({g,x,z,ry});
  const c=color||0x8a5a34;st=st!==false;
  M_(g,G.box,c,[1.9,.08,.5],[0,.45,0],null,st);M_(g,G.box,c,[1.9,.45,.08],[0,.75,-.24],[-.15,0,0],st);
  for(const sx of[-.8,.8]){M_(g,G.box,0x2c2f35,[.08,.45,.45],[sx,.22,0],null,st);}
  return g;}
function lamp(x,z,ry){const L=new THREE.Group();L.position.set(x,0,z);cityG.add(L);M_(L,G.cyl,0x50545c,[.16,5.2,.16],[0,2.6,0],null,false);const g=new THREE.Group();g.position.set(0,5.1,0);g.rotation.y=ry||0;L.add(g);
  M_(g,G.box,0x50545c,[.12,.12,1.3],[0,0,.6],null,false);M_(g,G.box,lampMat,[.45,.18,.7],[0,-.1,1.15],null,false);const c=addCol(x-.15,x+.15,z-.15,z+.15);LIFTL.push({g:L,x,z,c,ry:ry||0});}
function trashBin(x,z){M_(cityG,G.box,0x2f6d3c,[1.6,1.25,1.1],[x,.63,z]);M_(cityG,G.box,0x24572f,[1.7,.12,1.2],[x,1.3,z]);addCol(x-.8,x+.8,z-.55,z+.55);}
var CAR_COLS=[0xc0392b,0x2e86c1,0xe5e7e9,0x27ae60,0x7d3c98,0xf1c40f,0x34495e,0xd35400];
function car(parent,x,z,ry,color,dyn){const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=ry||0;parent.add(g);const park=!dyn&&parent===cityG;const st=!dyn&&!park;
  color=color||pick(CAR_COLS);
  M_(g,G.box,color,[1.9,.75,4.2],[0,.6,0],null,st);M_(g,G.box,color,[1.7,.62,2.2],[0,1.27,-.25],null,st);
  M_(g,G.box,0x2a3646,[1.74,.48,1.6],[0,1.3,.1],null,st);M_(g,G.box,0x2a3646,[1.74,.44,1.9],[0,1.29,-.3],null,st);
  for(const sx of[-.85,.85])for(const sz of[-1.35,1.35])M_(g,G.cyl,0x16181c,[.66,.3,.66],[sx,.33,sz],[0,0,Math.PI/2],st);
  M_(g,G.box,snowCapMat,[1.6,.1,2.1],[0,1.63,-.25],null,st);M_(g,G.box,snowCapMat,[1.8,.08,1],[0,1.02,1.6],null,st);
  for(const sx of[-.6,.6]){M_(g,G.box,lampMat,[.4,.18,.06],[sx,.75,2.11],null,st);M_(g,G.box,0x9b1b1b,[.4,.16,.06],[sx,.75,-2.11],null,st);}
  if(!dyn){const sw=Math.abs(Math.sin(ry||0))>.5;const hw=sw?2.1:.95,hd=sw?.95:2.1;const c=addCol(x-hw,x+hw,z-hd,z+hd);if(park)PARKQ.push({g,c,x,z,ry:ry||0});}
  return g;}

function wheels(g,pts,r,w){pts.forEach(([x,z])=>M_(g,G.cyl,0x16181c,[r*2,w,r*2],[x,r,z],[0,0,Math.PI/2],false));}
