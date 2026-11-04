const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');
(async()=>{
 const br=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',args:['--no-sandbox']});
 const pg=await br.newPage({viewport:{width:430,height:860}});
 const errs=[];pg.on('pageerror',e=>errs.push(String(e).slice(0,120)));
 await pg.route('**/*',r=>{const u=r.request().url();
   if(/three\.min\.js/.test(u)) return r.fulfill({contentType:'text/javascript',body:'window.THREE=new Proxy({},{get:()=>function(){return new Proxy(function(){},{get:()=>function(){return 0},set:()=>true})}});'});
   if(/gstatic|googleapis|cloudflare/.test(u)) return r.fulfill({contentType:'text/javascript',body:''});
   return r.continue();});
 await pg.goto('file:///home/claude/proj/index.html');await pg.waitForTimeout(800);
 // Реальные структуры из игры: тетрадный лист (#sheet) со вкладками, делами, кнопками
 await pg.evaluate(()=>{
  document.getElementById('title').style.display='none';
  document.getElementById('modal').classList.add('on');
  document.getElementById('tabs').innerHTML='<button class="tab act">📋 Дела</button><button class="tab">🧾 Заметки</button>';
  document.getElementById('sheetBody').innerHTML='<h2>Список дел</h2><div class="ti"><span class="ic">✅</span><span class="tx"><span class="nm">Закрасить граффити</span><span class="wh">у дома</span></span><span class="st">+500 ₽</span></div><div class="ti lock"><span class="ic">🔒</span><span class="tx"><span class="nm">Мясокомбинат</span></span></div><div class="sec">Инвентарь</div><div class="inv"><span>🛹 Скейт</span><button>Взять</button></div><div class="inv"><span>📱 Телефон</span><button>Открыть</button></div><div class="row"><span class="chip">Чип</span><span class="chip act">Выбран</span></div><input id="gText" value="Текст граффити"><div id="gErr">Ошибка: слишком длинно</div>';
  document.getElementById('sheetFoot').innerHTML='<button class="pbtn">Закрыть</button><button class="pbtn main">Готово</button>';
  const t=document.getElementById('toast'); if(t){t.innerHTML='<div class="tst">💰 +500 — работа</div>';}
  const d=document.getElementById('dialog'); if(d){d.classList.add('on');}
  const dn=document.getElementById('dName');if(dn)dn.textContent='Марья';const dt=document.getElementById('dText');if(dt)dt.textContent='Пойдём уже, пока нас не заметили.';
 });
 await pg.waitForTimeout(300);
 await pg.screenshot({path:'/tmp/ui_classic.png'});
 const before=await pg.evaluate(()=>{document.body.classList.add('mg-hd');return typeof MG_SET!=='undefined'?MG_SET.contrastReport().length:-1;});
 await pg.waitForTimeout(100);
 const rep0=await pg.evaluate(()=>MG_SET.contrastReport());
 console.log('до автоконтраста (только CSS), проблемных элементов:',rep0.length, JSON.stringify(rep0.slice(0,8)));
 await pg.evaluate(()=>MG_SET.fixContrast());await pg.waitForTimeout(200);
 const rep1=await pg.evaluate(()=>MG_SET.contrastReport());
 console.log('после автоконтраста, проблемных элементов:',rep1.length, JSON.stringify(rep1.slice(0,8)));
 await pg.screenshot({path:'/tmp/ui_hd.png'});
 console.log('ошибки страницы (первые):',errs.slice(0,3));
 await br.close();
})();
