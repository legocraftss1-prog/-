/* Строгая мини-заглушка three.js r128: только те члены, что есть в настоящей библиотеке. Обращение к несуществующему методу даёт TypeError. */
(function(){
function soft(o){return new Proxy(o,{get(t,k,r){if(k in t)return Reflect.get(t,k,r);if(typeof k==='symbol'||k==='then'||k==='toJSON'||k==='constructor')return undefined;if(/^is[A-Z]/.test(k))return false;return function(){return r;};}});}
class Vector2{constructor(x=0,y=0){this.x=x;this.y=y;return soft(this);}set(x,y){this.x=x;this.y=y;return this;}copy(v){this.x=v.x;this.y=v.y;return this;}}
class Vector3{constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z;return soft(this);}set(x,y,z){this.x=x;this.y=y;this.z=z;return this;}copy(v){this.x=v.x;this.y=v.y;this.z=v.z;return this;}clone(){return new Vector3(this.x,this.y,this.z);}
 add(v){this.x+=v.x;this.y+=v.y;this.z+=v.z;return this;}sub(v){this.x-=v.x;this.y-=v.y;this.z-=v.z;return this;}addScaledVector(v,s){this.x+=v.x*s;this.y+=v.y*s;this.z+=v.z*s;return this;}
 multiplyScalar(s){this.x*=s;this.y*=s;this.z*=s;return this;}length(){return Math.hypot(this.x,this.y,this.z);}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z;}
 normalize(){const l=this.length()||1;return this.multiplyScalar(1/l);}dot(v){return this.x*v.x+this.y*v.y+this.z*v.z;}
 crossVectors(a,b){const x=a.y*b.z-a.z*b.y,y=a.z*b.x-a.x*b.z,z=a.x*b.y-a.y*b.x;this.x=x;this.y=y;this.z=z;return this;}
 setScalar(v){this.x=this.y=this.z=v;return this;}distanceTo(v){return Math.hypot(this.x-v.x,this.y-v.y,this.z-v.z);}distanceToSquared(v){return (this.x-v.x)**2+(this.y-v.y)**2+(this.z-v.z)**2;}subVectors(a,b){this.x=a.x-b.x;this.y=a.y-b.y;this.z=a.z-b.z;return this;}addVectors(a,b){this.x=a.x+b.x;this.y=a.y+b.y;this.z=a.z+b.z;return this;}cross(v){return this.crossVectors(this.clone(),v);}transformDirection(m){if(!m||!m.isMatrix4)throw new Error('transformDirection: нужна Matrix4');return this.normalize();}}
class Matrix4{constructor(){this.isMatrix4=true;this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];return soft(this);}
 compose(p,q,sc){const e=this.elements;e.fill(0);e[0]=sc.x;e[5]=sc.y;e[10]=sc.z;e[12]=p.x;e[13]=p.y;e[14]=p.z;e[15]=1;return this;}
 makeScale(x,y,z){const e=this.elements;e.fill(0);e[0]=x;e[5]=y;e[10]=z;e[15]=1;return this;}}
class Color{constructor(r,g,b){this.isColor=true;this.r=1;this.g=1;this.b=1;if(g===undefined&&b===undefined){if(r!==undefined)this.set(r);}else this.setRGB(r,g,b);return soft(this);}
 set(v){if(v&&v.isColor)return this.copy(v);if(typeof v==='number')return this.setHex(v);if(typeof v==='string'){if(/^#[0-9a-f]{6}$/i.test(v))return this.setHex(parseInt(v.slice(1),16));throw new Error('Color: строка '+v);}return this;}
 setHex(h){h=Math.floor(h);this.r=(h>>16&255)/255;this.g=(h>>8&255)/255;this.b=(h&255)/255;return this;}getHex(){return (Math.round(this.r*255)<<16)^(Math.round(this.g*255)<<8)^Math.round(this.b*255);}
 setRGB(r,g,b){this.r=r;this.g=g;this.b=b;return this;}copy(c){this.r=c.r;this.g=c.g;this.b=c.b;return this;}clone(){return new Color().copy(this);}
 getHexString(){return ('000000'+this.getHex().toString(16)).slice(-6);}getStyle(){return '#'+this.getHexString();}setHSL(h,s_,l){return this;}offsetHSL(){return this;}lerp(c,t){this.r+=(c.r-this.r)*t;this.g+=(c.g-this.g)*t;this.b+=(c.b-this.b)*t;return this;}multiplyScalar(s){this.r*=s;this.g*=s;this.b*=s;return this;}}
class Euler{constructor(){this.x=0;this.y=0;this.z=0;this.order='XYZ';return soft(this);}set(x,y,z){this.x=x;this.y=y;this.z=z;return this;}}
class Layers{constructor(){this.mask=1;}set(c){this.mask=1<<c;}test(l){return (this.mask&l.mask)!==0;}}
class Box3{constructor(){this.min=new Vector3(Infinity,Infinity,Infinity);this.max=new Vector3(-Infinity,-Infinity,-Infinity);}isEmpty(){return this.max.x<this.min.x;}
 setFromObject(o){this.min.set(Infinity,Infinity,Infinity);this.max.set(-Infinity,-Infinity,-Infinity);const self=this;(function walk(n,ox,oy,oz){const x=ox+n.position.x,y=oy+n.position.y,z=oz+n.position.z;if(n.isMesh||n.isSprite){const h=Math.max(n.scale.x,n.scale.y,n.scale.z)/2;self.min.set(Math.min(self.min.x,x-h),Math.min(self.min.y,y-h),Math.min(self.min.z,z-h));self.max.set(Math.max(self.max.x,x+h),Math.max(self.max.y,y+h),Math.max(self.max.z,z+h));}n.children.forEach(c=>walk(c,x,y,z));})(o,o.parent?0:0,0,0);return this;}
 getCenter(v){return v.set((this.min.x+this.max.x)/2,(this.min.y+this.max.y)/2,(this.min.z+this.max.z)/2);}getSize(v){return v.set(this.max.x-this.min.x,this.max.y-this.min.y,this.max.z-this.min.z);}}
class Object3D{constructor(){this.position=new Vector3();this.rotation=new Euler();this.scale=new Vector3(1,1,1);this.children=[];this.parent=null;this.visible=true;this.userData={};this.frustumCulled=true;this.renderOrder=0;this.matrixAutoUpdate=true;this.castShadow=false;this.receiveShadow=false;this.matrixWorld=new Matrix4();this.layers=new Layers();this.quaternion=soft({x:0,y:0,z:0,w:1});return soft(this);}
 add(...o){o.forEach(c=>{if(c.parent)c.parent.remove(c);c.parent=this;this.children.push(c);});return this;}remove(...o){o.forEach(c=>{const i=this.children.indexOf(c);if(i>=0){this.children.splice(i,1);c.parent=null;}});return this;}
 traverse(f){f(this);this.children.slice().forEach(c=>c.traverse(f));}updateMatrixWorld(){}}
class Group extends Object3D{constructor(){super();this.isGroup=true;}}
class Scene extends Object3D{constructor(){super();this.isScene=true;this.background=null;this.fog=null;}}
class Mesh extends Object3D{constructor(g,m){super();this.isMesh=true;this.geometry=g;this.material=m;}}
class BufferAttribute{constructor(array,itemSize){this.array=array;this.itemSize=itemSize;this.count=array.length/itemSize;this.needsUpdate=false;}
 getX(i){return this.array[i*this.itemSize];}getY(i){return this.array[i*this.itemSize+1];}getZ(i){return this.array[i*this.itemSize+2];}
 setX(i,v){this.array[i*this.itemSize]=v;return this;}setY(i,v){this.array[i*this.itemSize+1]=v;return this;}setZ(i,v){this.array[i*this.itemSize+2]=v;return this;}setXY(i,x,y){const a=this.array,k=i*this.itemSize;a[k]=x;a[k+1]=y;return this;}setXYZ(i,x,y,z){const a=this.array,k=i*this.itemSize;a[k]=x;a[k+1]=y;a[k+2]=z;return this;}}
if(!Color.prototype.setHex)Color.prototype.setHex=function(h){return this.set(h);};
class Float32BufferAttribute extends BufferAttribute{constructor(a,n){super(a instanceof Float32Array?a:new Float32Array(a),n);}}
class BufferGeometry{constructor(){this.attributes={};this.index=null;this.boundingSphere=null;this.boundingBox=null;this.isBufferGeometry=true;this.groups=[];return soft(this);}
 setAttribute(n,a){this.attributes[n]=a;return this;}
 setIndex(ix){this.index=Array.isArray(ix)?new BufferAttribute(new Uint32Array(ix),1):ix;return this;}
 toNonIndexed(){const g=new BufferGeometry(),p=this.attributes.position,idx=this.index?this.index.array:null;if(!idx)return this.clone();const a=new Float32Array(idx.length*3);for(let i=0;i<idx.length;i++){a[i*3]=p.getX(idx[i]);a[i*3+1]=p.getY(idx[i]);a[i*3+2]=p.getZ(idx[i]);}g.setAttribute('position',new BufferAttribute(a,3));g.setAttribute('normal',new BufferAttribute(new Float32Array(a.length),3));g.setAttribute('uv',new BufferAttribute(new Float32Array(idx.length*2),2));return g;}
 clone(){const g=new BufferGeometry();for(const k in this.attributes)g.setAttribute(k,new BufferAttribute(this.attributes[k].array.slice(),this.attributes[k].itemSize));if(this.index)g.index=new BufferAttribute(this.index.array.slice(),1);return g;}
 scale(x,y,z){const p=this.attributes.position;for(let i=0;i<p.count;i++)p.setXYZ(i,p.getX(i)*x,p.getY(i)*y,p.getZ(i)*z);return this;}translate(x,y,z){const p=this.attributes.position;for(let i=0;i<p.count;i++)p.setXYZ(i,p.getX(i)+x,p.getY(i)+y,p.getZ(i)+z);return this;}
 rotateZ(a){const p=this.attributes.position,c=Math.cos(a),s=Math.sin(a);for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i);p.setXYZ(i,x*c-y*s,x*s+y*c,p.getZ(i));}return this;}rotateX(a){const p=this.attributes.position,c=Math.cos(a),s=Math.sin(a);for(let i=0;i<p.count;i++){const y=p.getY(i),z=p.getZ(i);p.setXYZ(i,p.getX(i),y*c-z*s,y*s+z*c);}return this;}
 computeBoundingBox(){const p=this.attributes.position;const mn={x:Infinity,y:Infinity,z:Infinity},mx={x:-Infinity,y:-Infinity,z:-Infinity};if(p)for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);if(x<mn.x)mn.x=x;if(y<mn.y)mn.y=y;if(z<mn.z)mn.z=z;if(x>mx.x)mx.x=x;if(y>mx.y)mx.y=y;if(z>mx.z)mx.z=z;}this.boundingBox={min:mn,max:mx};} computeVertexNormals(){this.__normals=(this.__normals||0)+1;}computeBoundingSphere(){this.boundingSphere={radius:1,center:new Vector3()};}dispose(){this.disposed=true;}}
function fill(g,n,indexed){const a=new Float32Array(n*3);for(let i=0;i<n;i++){a[i*3]=((i*7)%11)/11-.5;a[i*3+1]=((i*5)%7)/7-.5;a[i*3+2]=((i*3)%5)/5-.5;}g.setAttribute('position',new BufferAttribute(a,3));g.setAttribute('normal',new BufferAttribute(new Float32Array(n*3),3));g.setAttribute('uv',new BufferAttribute(new Float32Array(n*2),2));if(indexed){const ix=new Uint16Array(Math.floor(n*1.5));for(let i=0;i<ix.length;i++)ix[i]=i%n;g.index=new BufferAttribute(ix,1);}}
class BoxGeometry extends BufferGeometry{constructor(w=1,h=1,d=1){super();const a=[];for(let f=0;f<6;f++)for(let k=0;k<4;k++){const u=(k&1?.5:-.5),v=(k&2?.5:-.5),s=f%2?.5:-.5;const ax=f>>1;a.push(ax===0?s*w:u*w,ax===1?s*h:(ax===0?u*h:v*h),ax===2?s*d:v*d);}
 this.setAttribute('position',new BufferAttribute(new Float32Array(a),3));this.setAttribute('normal',new BufferAttribute(new Float32Array(72),3));this.setAttribute('uv',new BufferAttribute(new Float32Array(48),2));const ix=[];for(let f=0;f<6;f++){const o=f*4;ix.push(o,o+2,o+1,o+2,o+3,o+1);}this.index=new BufferAttribute(new Uint16Array(ix),1);}}
class IcosahedronGeometry extends BufferGeometry{constructor(r=1,detail=0){super();fill(this,20*Math.pow(4,detail)*3,false);}}
class CylinderGeometry extends BufferGeometry{constructor(rt=1,rb=1,h=1,seg=8){super();this.parameters={radiusTop:rt,radiusBottom:rb,height:h,radialSegments:seg};fill(this,seg*8,true);}}
class ConeGeometry extends CylinderGeometry{constructor(r=1,h=1,seg=8){super(0,r,h,seg);}}
class SphereGeometry extends BufferGeometry{constructor(r=1,w=8,h=6){super();fill(this,(w+1)*(h+1),true);}}
class PlaneGeometry extends BufferGeometry{constructor(){super();fill(this,4,true);}}
class Material{constructor(p){const self=soft(this);this.userData={};this.needsUpdate=false;this.transparent=false;this.visible=true;this.side=0;this.fog=true;this.depthTest=true;this.depthWrite=true;this.toneMapped=true;this.defines=undefined;this.version=0;
 this.onBeforeCompile=function(){};this.customProgramCacheKey=function(){return this.onBeforeCompile.toString();};
 for(const k in (p||{}))this[k]=p[k];['emissive','specular','color'].forEach(k=>{const v=this[k];if(v!==undefined&&v!==null&&!(v&&v.isColor))this[k]=new Color(v);});if(this.emissive===undefined)this.emissive=new Color(0);return self;}}
const BASE=['color','map','transparent','opacity','side','fog','depthTest','depthWrite','visible','vertexColors'];
class MeshLambertMaterial extends Material{constructor(p){super(p);this.isMeshLambertMaterial=true;if(!(this.color&&this.color.isColor))this.color=new Color(this.color===undefined?0xffffff:this.color);
 ['map','envMap','specularMap','emissiveMap'].forEach(k=>{if(this[k]===undefined)this[k]=null;});if(this.combine===undefined)this.combine=0;if(this.reflectivity===undefined)this.reflectivity=1;}}
MeshLambertMaterial.PROPS=BASE.concat(['emissive','emissiveMap','emissiveIntensity','envMap','specularMap','combine','reflectivity']);
class MeshPhongMaterial extends MeshLambertMaterial{constructor(p){super(p);this.isMeshLambertMaterial=false;this.isMeshPhongMaterial=true;}}
MeshPhongMaterial.PROPS=MeshLambertMaterial.PROPS.concat(['specular','shininess']);
class MeshBasicMaterial extends Material{constructor(p){super(p);this.isMeshBasicMaterial=true;}}MeshBasicMaterial.PROPS=BASE;
class ShaderMaterial extends Material{constructor(p){super(p);this.isShaderMaterial=true;if(!this.uniforms)this.uniforms={};if(!this.defines)this.defines={};}}
ShaderMaterial.PROPS=['uniforms','vertexShader','fragmentShader','defines','side','depthWrite','depthTest','fog','transparent','extensions'];
class Texture{constructor(img){this.offset=new Vector2();this.repeat=new Vector2(1,1);this.center=new Vector2();this.isTexture=true;this.image=img||null;this.anisotropy=1;this.wrapS=1001;this.wrapT=1001;this.minFilter=1008;this.magFilter=1006;this.needsUpdate=false;this.generateMipmaps=true;this.userData={};this.uuid='t'+(Texture.n=(Texture.n||0)+1);return soft(this);}dispose(){this.disposed=true;}}
class CanvasTexture extends Texture{constructor(c){super(c);this.needsUpdate=true;}}
class DepthTexture extends Texture{constructor(w,h){super({width:w,height:h});this.isDepthTexture=true;this.type=1012;}}
class WebGLRenderTarget{constructor(w,h,o){o=o||{};this.width=w;this.height=h;this.texture=new Texture({width:w,height:h});this.depthBuffer=o.depthBuffer!==false;this.depthTexture=null;this.isWebGLRenderTarget=true;WebGLRenderTarget.live=(WebGLRenderTarget.live||0)+1;}
 setSize(w,h){this.width=w;this.height=h;}dispose(){if(!this.disposed){this.disposed=true;WebGLRenderTarget.live--;}}}
class WebGLCubeRenderTarget extends WebGLRenderTarget{constructor(size,o){super(size,size,o);this.texture.isCubeTexture=true;this.isWebGLCubeRenderTarget=true;}}
class Camera extends Object3D{constructor(){super();this.isCamera=true;this.matrixWorldInverse=new Matrix4();this.projectionMatrix=new Matrix4();}updateProjectionMatrix(){this.__upm=(this.__upm||0)+1;}}
class PerspectiveCamera extends Camera{constructor(fov=50,aspect=1,near=.1,far=2000){super();this.fov=fov;this.aspect=aspect;this.near=near;this.far=far;}}
class OrthographicCamera extends Camera{constructor(l,r,t,b,n,f){super();this.left=l;this.right=r;this.top=t;this.bottom=b;this.near=n;this.far=f;}}
class CubeCamera extends Object3D{constructor(near,far,rt){super();if(!rt||!rt.isWebGLCubeRenderTarget)throw new Error('CubeCamera: нужен WebGLCubeRenderTarget');this.renderTarget=rt;this.cams=[1,2,3,4,5,6].map(()=>new PerspectiveCamera(90,1,near,far));}
 update(renderer,scene){const cur=renderer.getRenderTarget();for(const c of this.cams){renderer.setRenderTarget(this.renderTarget);renderer.render(scene,c);}renderer.setRenderTarget(cur);}}
class Light extends Object3D{constructor(c,i){super();this.color=new Color(c);this.intensity=i===undefined?1:i;}}
class DirectionalLight extends Light{constructor(c,i){super(c,i);this.target=new Object3D();this.shadow={mapSize:new Vector2(512,512),camera:new OrthographicCamera(-5,5,5,-5,.5,500),bias:0,normalBias:0,map:null};}}
class HemisphereLight extends Light{constructor(c,g,i){super(c,i);this.groundColor=new Color(g);}}
class Fog{constructor(c,n,f){this.color=new Color(c);this.near=n;this.far=f;}}
function Renderer(canvas){const R={domElement:canvas,calls:[],__rt:null,shadowMap:{enabled:false,type:1},toneMapping:0,toneMappingExposure:1,
 capabilities:{isWebGL2:true,getMaxAnisotropy(){return 16;}},extensions:{get(n){return {};}},info:{render:{calls:0,triangles:0},memory:{geometries:0,textures:0}},
 setRenderTarget(t){if(t!==null&&!(t&&t.isWebGLRenderTarget))throw new Error('setRenderTarget: не цель');if(t&&t.disposed)throw new Error('setRenderTarget: цель освобождена');R.__rt=t;},getRenderTarget(){return R.__rt;},
 getDrawingBufferSize(v){if(!v||v.x===undefined)throw new Error('getDrawingBufferSize: нужен Vector2');return v.set(R.__w||860,R.__h||1720);},getPixelRatio(){return 2;},setPixelRatio(){},setSize(){}};
 R.render=function(scene,cam){if(!scene||!scene.isScene)throw new Error('render: не сцена');if(!cam||!cam.isCamera)throw new Error('render: не камера');
  let q=null;scene.traverse(o=>{if(o.isMesh&&o.material&&o.material.isShaderMaterial&&!q)q=o;});
  if(q){const m=q.material;for(const k in m.uniforms){const u=m.uniforms[k];if(!u||!('value' in u))throw new Error('uniform '+k+' без value');const v=u.value;if(v&&v.isTexture&&v.disposed)throw new Error('uniform '+k+': освобождённая текстура');if(typeof v==='number'&&!isFinite(v))throw new Error('uniform '+k+' = '+v);if(v&&typeof v==='object'&&'x' in v&&(!isFinite(v.x)||!isFinite(v.y)))throw new Error('uniform '+k+' NaN');if(v&&v.isColor&&(!isFinite(v.r)||!isFinite(v.g)||!isFinite(v.b)))throw new Error('uniform '+k+' цвет NaN');}}
  R.calls.push({main:scene===window.scene,target:R.__rt,mat:q?q.material:null});};
 return R;}
class Sprite extends Object3D{constructor(m){super();this.isSprite=true;this.material=m;}}
var LIB={Float32BufferAttribute,Sprite,Layers,Box3,Vector2,Vector3,Matrix4,Color,Object3D,Group,Scene,Mesh,BufferAttribute,BufferGeometry,BoxGeometry,IcosahedronGeometry,CylinderGeometry,ConeGeometry,SphereGeometry,PlaneGeometry,
 MeshLambertMaterial,MeshPhongMaterial,MeshBasicMaterial,ShaderMaterial,Texture,CanvasTexture,DepthTexture,WebGLRenderTarget,WebGLCubeRenderTarget,PerspectiveCamera,OrthographicCamera,CubeCamera,DirectionalLight,HemisphereLight,Fog,
 BackSide:1,PCFSoftShadowMap:2,MixOperation:1,RepeatWrapping:1000,LinearFilter:1006,NearestFilter:1003,RGBAFormat:1023,UnsignedIntType:1014,ACESFilmicToneMapping:4,__mkRenderer:Renderer};

function mkAny(){const t={};return new Proxy(function(){},{get:(o,k)=>{if(k==='then'||typeof k==='symbol')return undefined;if(k in t)return t[k];return t[k]=mkAny();},set:(o,k,v)=>{t[k]=v;return true;},apply:()=>mkAny(),construct:()=>mkAny()});}
class GenericGeo extends BufferGeometry{constructor(){super();fill(this,8,true);}}
class GenericMat extends Material{constructor(p){super(p);if(!(this.color&&this.color.isColor))this.color=new Color(this.color===undefined?0xffffff:this.color);this.isMeshLambertMaterial=true;}}
class Points extends Object3D{constructor(g,m){super();this.isPoints=true;this.geometry=g;this.material=m;}}
class LineSegments extends Object3D{constructor(g,m){super();this.isLineSegments=true;this.geometry=g;this.material=m;}}
class Line extends Object3D{constructor(g,m){super();this.isLine=true;this.geometry=g;this.material=m;}}
class InstancedMesh extends Mesh{constructor(g,m,n){super(g,m);this.isInstancedMesh=true;this.count=n;this.instanceMatrix={needsUpdate:false,setUsage(){},array:new Float32Array(16*n)};}setMatrixAt(i,m){if(m&&Array.isArray(m.elements)||m&&m.elements instanceof Float32Array)this.instanceMatrix.array.set(m.elements,i*16);}setColorAt(){}}
class Raycaster{constructor(){this.ray={origin:new Vector3(),direction:new Vector3()};this.far=Infinity;this.layers=new Layers();}set(o,d){this.ray.origin.copy(o);this.ray.direction.copy(d);}setFromCamera(){}intersectObjects(){return [];}intersectObject(){return [];}}
class Quaternion{constructor(){this.x=0;this.y=0;this.z=0;this.w=1;}setFromEuler(){return this;}setFromAxisAngle(){return this;}copy(){return this;}}
class Shape{constructor(){}moveTo(){return this;}lineTo(){return this;}quadraticCurveTo(){return this;}bezierCurveTo(){return this;}absarc(){return this;}}
const extra={Points,LineSegments,Line,InstancedMesh,Raycaster,Quaternion,Shape,Matrix4,Euler,MeshStandardMaterial:GenericMat,MeshToonMaterial:GenericMat,PointsMaterial:GenericMat,LineBasicMaterial:GenericMat,SpriteMaterial:GenericMat,MeshNormalMaterial:GenericMat,
 TorusGeometry:GenericGeo,RingGeometry:GenericGeo,CircleGeometry:GenericGeo,TetrahedronGeometry:GenericGeo,OctahedronGeometry:GenericGeo,DodecahedronGeometry:GenericGeo,ShapeGeometry:GenericGeo,ExtrudeGeometry:GenericGeo,LatheGeometry:GenericGeo,TubeGeometry:GenericGeo,TorusKnotGeometry:GenericGeo,EdgesGeometry:GenericGeo,
 WebGLRenderer:function(o){const R=Renderer(o&&o.canvas||document.createElement('canvas'));R.setClearColor=()=>{};R.getClearColor=()=>new Color();R.compile=()=>{};R.dispose=()=>{};R.outputEncoding=0;return R;},
 Clock:class{getDelta(){return .016;}getElapsedTime(){return 0;}}};
Object.assign(LIB,extra);
window.THREE=new Proxy(LIB,{get:(t,k)=>{if(k in t)return t[k];if(typeof k!=='string')return undefined;if(/Geometry$/.test(k))return GenericGeo;if(/Material$/.test(k))return GenericMat;if(/^[A-Z]/.test(k)&&/(Mapping|Wrapping|Filter|Format|Type|Side|Blending|Encoding|Operation|Usage)$/.test(k))return 1;return mkAny();}});
})();
