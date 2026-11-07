/* МГИАГ — офлайн-кэш. Свои файлы берутся из сети (чтобы обновления приходили сами), без сети — из кэша. */
const VERSION='mgiag-1.13.0';
const CORE=['./','./index.html','./net.js','./net-config.js','./server-config.js','./v111-gfx.js','./v111-water.js','./v111-online.js','./v111-debug.js','./v112-settings.js','./v112-map.js','./v112-business.js','./v112-districts.js','./v113-mouse.js','./v113-story.js','./v113-level1.js','./v113-level3.js','./manifest.webmanifest','./icon-192.png','./icon-512.png','./icon-180.png','./icon-maskable-512.png'];
const CDN=['https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js','https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js','https://www.gstatic.com/firebasejs/10.12.2/firebase-database-compat.js'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(VERSION).then(async c=>{await c.addAll(CORE);for(const u of CDN){try{await c.add(new Request(u,{mode:'cors'}));}catch(_){}}}).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET')return;const u=new URL(r.url);
  if(u.origin===location.origin){const key=r.mode==='navigate'?'./index.html':r;
    e.respondWith(fetch(r,{cache:'no-cache'}).then(res=>{if(res.ok){const cp=res.clone();caches.open(VERSION).then(c=>c.put(key,cp));}return res;}).catch(()=>caches.match(key)));return;}
  if(!/cdnjs\.cloudflare\.com|gstatic\.com|fonts\.googleapis\.com/.test(u.host))return;
  e.respondWith(caches.match(r).then(hit=>hit||fetch(r).then(res=>{if(res&&(res.ok||res.type==='opaque')){const cp=res.clone();caches.open(VERSION).then(c=>c.put(r,cp));}return res;})));});
