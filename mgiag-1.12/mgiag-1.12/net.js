/* =====================================================================
   МГИАГ — игра по сети через Firebase Realtime Database.
   Даёт игре тот же «канал комнаты», что был на claude.ai:
   join(name) → { emit, on, presence, peers, onPeers, connected, leave }
   ===================================================================== */
(function(){
  const cfg=window.NET_CONFIG;
  const ready=!!(cfg&&cfg.apiKey&&cfg.databaseURL&&!/ВСТАВЬ|PASTE/i.test(cfg.apiKey)&&window.firebase);
  window.NET_READY=ready;
  if(!ready){window.NET=null;return;}
  let app,db;
  try{app=firebase.initializeApp(cfg);db=firebase.database();}catch(e){console.error('Firebase init',e);window.NET=null;window.NET_READY=false;return;}
  let offset=0;db.ref('.info/serverTimeOffset').on('value',s=>{offset=s.val()||0;});
  let isConn=false;db.ref('.info/connected').on('value',s=>{isConn=!!s.val();});
  const now=()=>Date.now()+offset;
  const clean=o=>JSON.parse(JSON.stringify(o===undefined?null:o));
  const id=()=>Math.random().toString(36).slice(2,10)+Date.now().toString(36).slice(-4);

  async function join(name){
    const key=String(name).replace(/[.#$\[\]\/]/g,'_');
    const R=db.ref('rooms/'+key),me=id();
    const peersRef=R.child('peers'),evRef=R.child('ev'),stRef=R.child('st');
    const myPeer=peersRef.child(me),mySt=stRef.child(me);
    const H={},peerCbs=[],peers={},offs=[];
    peers[me]={peer:me,sameTab:true,isMe:true,presence:{}};
    const list=()=>Object.values(peers);
    const fire=()=>{const ch={peers:list(),joined:[],left:[],updated:[]};peerCbs.forEach(cb=>{try{cb(ch);}catch(e){console.error(e);}});};
    const dispatch=(topic,data,from)=>{(H[topic]||[]).forEach(h=>{try{h({topic,data,peer:from,sameTab:from===me});}catch(e){console.error(e);}});};

    await myPeer.set({presence:{},t:firebase.database.ServerValue.TIMESTAMP});
    myPeer.onDisconnect().remove();mySt.onDisconnect().remove();

    const onPeer=s=>{const v=s.val()||{};if(s.key===me)return;peers[s.key]={peer:s.key,sameTab:false,presence:v.presence||{}};fire();};
    const onPeerGone=s=>{if(s.key===me)return;delete peers[s.key];fire();};
    peersRef.on('child_added',onPeer);peersRef.on('child_changed',onPeer);peersRef.on('child_removed',onPeerGone);
    offs.push(()=>{peersRef.off('child_added',onPeer);peersRef.off('child_changed',onPeer);peersRef.off('child_removed',onPeerGone);});

    /* frequent position updates: one slot per player, overwritten (cheap) */
    const onSt=s=>{if(s.key===me)return;const v=s.val();if(v&&v.d)dispatch('st',v.d,s.key);};
    stRef.on('child_added',onSt);stRef.on('child_changed',onSt);offs.push(()=>{stRef.off('child_added',onSt);stRef.off('child_changed',onSt);});

    /* one-off events (saves, transfers, boss, races…) */
    const since=now()-1500;const q=evRef.orderByChild('t').startAt(since);
    const onEv=s=>{const v=s.val();if(!v||v.f===me)return;dispatch(v.k,v.d,v.f);};
    q.on('child_added',onEv);offs.push(()=>q.off('child_added',onEv));

    let stBusy=false,stNext=null;
    const sendSt=d=>{if(stBusy){stNext=d;return;}stBusy=true;mySt.set({d:clean(d),t:firebase.database.ServerValue.TIMESTAMP}).catch(()=>{}).then(()=>{stBusy=false;if(stNext){const n=stNext;stNext=null;sendSt(n);}});};

    return {
      emit:async(topic,data)=>{if(topic==='st'){sendSt(data);return;}
        const r=evRef.push();await r.set({k:topic,d:clean(data),f:me,t:firebase.database.ServerValue.TIMESTAMP});setTimeout(()=>r.remove().catch(()=>{}),15000);},
      on:(topic,h)=>{(H[topic]=H[topic]||[]).push(h);return()=>{H[topic]=(H[topic]||[]).filter(x=>x!==h);};},
      presence:async p=>{peers[me].presence=Object.assign({},peers[me].presence,clean(p));await myPeer.update({presence:peers[me].presence,t:firebase.database.ServerValue.TIMESTAMP});},
      peers:()=>list(),
      onPeers:cb=>{peerCbs.push(cb);setTimeout(()=>cb({peers:list(),joined:[],left:[],updated:[]}),0);return()=>{const i=peerCbs.indexOf(cb);if(i>=0)peerCbs.splice(i,1);};},
      connected:()=>isConn,
      leave:async()=>{offs.forEach(f=>f());try{await mySt.remove();await myPeer.remove();}catch(e){}
        peersRef.once('value').then(s=>{if(!s.exists())R.remove().catch(()=>{});}).catch(()=>{});}
    };
  }
  window.NET={join};
})();
