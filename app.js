'use strict';
const $=id=>document.getElementById(id), fields=['club','worker','date','magnet','a6','digital','a5','small','discountProduct','discountQty','discountPrice','cash','owner','workerCard','comment'];
let signedWorker=null;
let discountLines=[];let nextDiscountId=0;let coreDiscountCatalog=[];let extraCatalog=[];let catalogReady=false;const activeCore={magnet:false,a6:false,a5:false,small:false};const prices={magnet:400,a6:200,a5:350,small:250};let editingId=null;
const num=id=>Number($(id).value)||0;const money=n=>new Intl.NumberFormat('ru-RU',{maximumFractionDigits:2}).format(n)+' ₽';
function calculate(){const total=num('magnet')*prices.magnet+num('a6')*prices.a6+num('a5')*prices.a5+num('small')*prices.small+num('digital')+num('discountPrice')+discountLines.reduce((sum,line)=>sum+Number(document.getElementById('discountTotal_'+line.id)?.value||0),0)+extraCatalog.reduce((sum,p)=>sum+(Number(document.getElementById('extra_'+p.id)?.value)||0)*Number(p.price),0);const received=num('cash')+num('owner')+num('workerCard');$('total').textContent=money(total);$('balance').textContent=Math.abs(total-received)<.005?'✓ Суммы совпадают':'Разница между продажами и деньгами: '+money(total-received);$('balance').className=Math.abs(total-received)<.005?'good':'error';return {total,received};}
function valid(){if(!catalogReady)throw Error('Не удалось получить актуальные цены. Проверь интернет и обнови страницу.');for(const id of Object.keys(activeCore))if(!activeCore[id]&&num(id)>0)throw Error('Отключённый товар нельзя продавать');if(num('discountQty')>0&&!activeCore[$('discountProduct').value])throw Error('Товар со скидкой отключён');for(const line of discountLines){const qty=Number($('discountQty_'+line.id).value),total=Number($('discountTotal_'+line.id).value);if(!Number.isInteger(qty)||qty<1||qty>10000||!Number.isFinite(total)||total<0||Math.abs(Math.round(total*100)-total*100)>0.000001)throw Error('Проверь количество и сумму каждой продажи со скидкой');if(!extraCatalog.concat(coreDiscountCatalog).some(p=>String(p.id)===String($('discountProduct_'+line.id).value)))throw Error('Товар со скидкой недоступен');}for(const item of extraCatalog){const v=Number(document.getElementById('extra_'+item.id)?.value||0);if(!Number.isInteger(v)||v<0||v>10000)throw Error('Некорректное количество: '+item.name)}for(const id of ['magnet','a6','a5','small','discountQty'])if(!Number.isInteger(num(id))||num(id)<0)throw Error('Количество должно быть целым неотрицательным числом');for(const id of ['digital','discountPrice','cash','owner','workerCard'])if(num(id)<0)throw Error('Суммы не могут быть отрицательными');if(!$('worker').value.trim()||!$('date').value)throw Error('Укажи фотографа и дату');if($('date').value>localToday())throw Error('Нельзя отправлять отчёт за будущую дату. Выбери сегодняшний день или более раннюю дату.');const c=calculate();if(c.total<=0)throw Error('Нельзя отправить пустой отчёт. Общая выручка должна быть больше 0 ₽.');if(Math.abs(c.total-c.received)>.005)throw Error('Сумма продаж и распределение денег не совпадают');}
function openDB(){return new Promise((resolve,reject)=>{const r=indexedDB.open('photo-reports-offline',1);r.onupgradeneeded=()=>{const db=r.result;db.createObjectStore('reports',{keyPath:'id'})};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
async function transact(mode,cb){const db=await openDB();return new Promise((resolve,reject)=>{let result;const tx=db.transaction('reports',mode);const req=cb(tx.objectStore('reports'));req.onsuccess=()=>{result=req.result};tx.oncomplete=()=>{db.close();resolve(result)};tx.onabort=()=>{db.close();reject(tx.error||new Error('Не удалось сохранить данные'))};tx.onerror=()=>{};})}
const all=async()=>signedWorker?(await transact('readonly',s=>s.getAll())).filter(x=>x.accountId===signedWorker.id):[];const put=x=>{if(!signedWorker)throw Error('Войдите по PIN-коду');x.accountId=signedWorker.id;return transact('readwrite',s=>s.put(x));};const remove=id=>transact('readwrite',s=>s.delete(id));
// Local draft IDs do not grant access; support browsers without crypto.randomUUID (including older iOS WebViews).
function newDraftId(){
 if(globalThis.crypto&&typeof globalThis.crypto.randomUUID==='function')return globalThis.crypto.randomUUID();
 const bytes=new Uint8Array(16);
 if(globalThis.crypto&&typeof globalThis.crypto.getRandomValues==='function')globalThis.crypto.getRandomValues(bytes);
 else for(let i=0;i<bytes.length;i++)bytes[i]=Math.floor(Math.random()*256);
 bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;
 const hex=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
 return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
}
function snapshot(){const data=Object.fromEntries(fields.map(id=>[id,$(id).value]));data.discountLines=discountLines.map(line=>({product:$('discountProduct_'+line.id).value,qty:$('discountQty_'+line.id).value,total:$('discountTotal_'+line.id).value}));for(const item of extraCatalog)data['extra_'+item.id]=document.getElementById('extra_'+item.id)?.value||'0';return {id:editingId||newDraftId(),createdAt:new Date().toISOString(),status:'Локальный черновик — не отправлен',data,totals:calculate()}}
function show(msg,error=false){$('message').textContent=msg;$('message').style.color=error?'#a33429':'#167342'}
async function save(){try{valid();const x=snapshot();const existing=(await all()).find(y=>y.id===x.id);if(existing)x.createdAt=existing.createdAt;await put(x);editingId=x.id;localStorage.setItem('photo-last-worker',x.data.worker);localStorage.setItem('photo-last-club',x.data.club);show('Сохранено на этом телефоне. Владелец ещё НЕ получил отчёт.');await render()}catch(e){show(e.message||'Не удалось сохранить черновик',true)}}
async function render(){
  try{
    const records=(await all()).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
    const target=$('drafts');target.replaceChildren();
    if(!records.length){const empty=document.createElement('p');empty.className='empty-drafts';empty.textContent='Пока нет черновиков. Сохрани первый отчёт, чтобы он появился здесь.';target.append(empty);return}
    for(const r of records){
      const d=document.createElement('article');d.className='draft';
      const top=document.createElement('div');top.className='draft-top';
      const info=document.createElement('div');info.className='draft-details';
      const title=document.createElement('strong');title.className='draft-title';title.textContent=r.data.club||'Клуб';
      const meta=document.createElement('span');meta.className='draft-meta';meta.textContent=`${r.data.date||'Без даты'} · ${r.data.worker||'Без имени'}`;
      const total=document.createElement('strong');total.className='draft-total';total.textContent=money(r.totals.total);
      const status=document.createElement('span');status.className='draft-status';status.textContent='● Локальный черновик';
      info.append(title,meta,total,status);top.append(info);
      const actions=document.createElement('div');actions.className='draft-actions';
      const edit=document.createElement('button');edit.type='button';edit.textContent='Открыть ↗';edit.onclick=()=>load(r);
      const del=document.createElement('button');del.type='button';del.className='delete-draft';del.textContent='Удалить';del.onclick=async()=>{if(confirm('Удалить этот локальный черновик?')){await remove(r.id);if(editingId===r.id)editingId=null;await render()}};
      actions.append(edit,del);d.append(top,actions);target.append(d);
    }
  }catch(e){$('drafts').textContent='Хранилище недоступно: '+e.message}
}
function load(r){if(!signedWorker||r.accountId!==signedWorker.id)throw Error('Чужой черновик');editingId=r.id;discountLines=[];renderDiscountLines();for(const line of r.data.discountLines||[])addDiscountLine(line);for(const id of fields)$(id).value=id==='worker'?signedWorker.name:(r.data[id]??'');for(const item of extraCatalog){const input=document.getElementById('extra_'+item.id);if(input)input.value=r.data['extra_'+item.id]||'0';}calculate();window.scrollTo({top:0,behavior:'smooth'});show('Открыт сохранённый черновик. Изменения нужно снова сохранить.')}
function download(data,name){const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json;charset=utf-8'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2000)}
$('report').addEventListener('input',calculate);$('save').onclick=save;
$('send').onclick=async()=>{const button=$('send');try{if(!signedWorker)throw Error('Войдите по PIN-коду.');if(!navigator.onLine)throw Error('Нет интернета. Сохрани черновик и отправь позже.');await refreshProductCatalog();valid();const form=new FormData();for(const id of fields)form.append(id,$(id).value);for(let i=0;i<discountLines.length;i++){const line=discountLines[i];form.append('discountLine_'+i+'_product',$('discountProduct_'+line.id).value);form.append('discountLine_'+i+'_qty',$('discountQty_'+line.id).value);form.append('discountLine_'+i+'_total',$('discountTotal_'+line.id).value);}for(const item of extraCatalog)form.append('extra_'+item.id,document.getElementById('extra_'+item.id)?.value||'0');button.disabled=true;button.textContent='↗ Отправляем…';localStorage.setItem('photo-last-worker',$('worker').value);localStorage.setItem('photo-last-club',$('club').value);const response=await fetch('./api/reports',{method:'POST',body:form});if(!response.ok){let message='Сервер отклонил отчёт ('+response.status+').';if(response.status===401){throw Error('Сессия не подтверждена сервером. Откройте вход по PIN и войдите снова. Данные отчёта пока остаются на странице.');}if(response.status===403){throw Error('Сервер запретил отправку (403). Проверьте адрес сайта и сообщите администратору. Данные отчёта сохранены на странице.');}if(response.status===409)message='Отчёт этого клуба за дату уже отправлен. Свяжись с владельцем.';else if(response.status===400){try{const error=await response.json();if(error.message)message=error.message;else if(error.detail)message=error.detail;}catch(_){}}throw Error(message)}const result=await response.json();show('✓ Отчёт №'+result.id+' получен сервером. Владелец увидит его в кабинете.');if(editingId){await remove(editingId);editingId=null;await render()}$('date').value=localToday();}catch(e){show(e.message||'Ошибка отправки',true)}finally{button.disabled=false;button.textContent='↗ Отправить отчёт'}};
function localToday(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`} $('date').value=localToday();$('date').max=localToday();$('date').title='Можно выбрать только сегодняшний день или более раннюю дату';$('club').value=localStorage.getItem('photo-last-club')||'Аладдин';$('worker').value='';
function network(){const on=navigator.onLine;$('network').textContent=on?'●':'○';$('network').title=on?'В сети':'Нет интернета';$('network').setAttribute('aria-label',on?'В сети':'Нет интернета');$('network').className='pill '+(on?'ok':'warn')}addEventListener('online',network);addEventListener('offline',network);network();calculate();render();
if('serviceWorker' in navigator&&location.protocol.startsWith('http'))Promise.resolve().catch(()=>{});

// Theme choice persists on this device.
const themeButton=$('themeToggle');
function setTheme(theme){document.documentElement.dataset.theme=theme;localStorage.setItem('photo-theme',theme);themeButton.textContent=theme==='dark'?'☀️ Светлая':'🌙 Тёмная';themeButton.setAttribute('aria-pressed',String(theme==='dark'));const themeMeta=document.querySelector('meta[name="theme-color"]');if(themeMeta)themeMeta.content=theme==='dark'?'#050505':'#f6f8fc'}
setTheme(localStorage.getItem('photo-theme')||((window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches)?'dark':'light'));
themeButton.addEventListener('click',()=>setTheme(document.documentElement.dataset.theme==='dark'?'light':'dark'));
// Quantity buttons keep manual editing available and update totals.
document.querySelectorAll('.step-btn').forEach(button=>button.addEventListener('click',()=>{
 const input=$(button.dataset.target);const current=Number(input.value)||0;
 input.value=String(Math.max(0,Math.trunc(current)+Number(button.dataset.step)));
 input.dispatchEvent(new Event('input',{bubbles:true}));
}));

// Remember photographer and club independently of draft data.
['club'].forEach(id=>$(id).addEventListener('change',()=>localStorage.setItem('photo-last-'+id,$(id).value)));

// Replace the default zero when entering a money amount.
['digital','discountPrice','cash','owner','workerCard'].forEach(id=>{const el=$(id);el.addEventListener('focus',()=>{if(Number(el.value)===0)el.select()});el.addEventListener('pointerup',()=>{if(Number(el.value)===0)el.select()})});
$('draftsToggle').addEventListener('click',()=>{const content=$('draftsContent'),open=content.hidden;content.hidden=!open;$('draftsToggle').setAttribute('aria-expanded',String(open));$('draftsToggle').setAttribute('aria-label',open?'Свернуть локальные черновики':'Развернуть локальные черновики')});
// Fetch managed club and photographer options; retain offline defaults.
// Never use stale offline prices for submitting a report.
async function refreshProductCatalog(){
 const response=await fetch('./api/catalog',{cache:'no-store'});
 if(!response.ok)throw Error('Каталог недоступен');
 const c=await response.json();
 const mapping={'Большой магнит':'magnet','Фото A6':'a6','Фото A5':'a5','Маленький магнит':'small'};
 for(const id of Object.keys(activeCore))activeCore[id]=false;
 for(const item of c.products||[]){
  const key=mapping[item.name];
  if(key&&Number.isFinite(Number(item.price))&&Number(item.price)>=0){prices[key]=Number(item.price);activeCore[key]=true}
 }
 for(const id of Object.keys(activeCore)){
  const input=$(id),row=input.closest('.product-row');
  const enabled=activeCore[id];input.disabled=!enabled;
  row.querySelectorAll('.step-btn').forEach(btn=>btn.disabled=!enabled);
  const label=row.querySelector('.price');if(label)label.textContent=enabled?money(prices[id])+' / шт.':'Недоступен для продажи';
  row.classList.toggle('product-unavailable',!enabled);
  row.hidden=!enabled; // Disabled products disappear entirely from the photographer's form.
 }
 const previous=Object.fromEntries(extraCatalog.map(x=>[x.id,document.getElementById('extra_'+x.id)?.value||'0']));
 extraCatalog=(c.products||[]).filter(x=>x.id&&!mapping[x.name]);
 const target=$('extraProducts');if(target){
  target.replaceChildren();
  for(const item of extraCatalog){
   const row=document.createElement('div');row.className='product-row';
   const info=document.createElement('div');info.className='product-info';
   const symbol=document.createElement('span');symbol.className='product-icon';symbol.textContent='✦';symbol.setAttribute('aria-hidden','true');
   const details=document.createElement('div');
   const title=document.createElement('strong');title.textContent=item.name;
   const price=document.createElement('span');price.className='price';price.textContent=money(Number(item.price))+' / шт.';
   details.append(title,price);info.append(symbol,details);
   const stepper=document.createElement('div');stepper.className='stepper';
   const input=document.createElement('input');input.type='number';input.min='0';input.max='10000';input.step='1';input.value=previous[item.id]||'0';input.inputMode='numeric';input.id='extra_'+item.id;input.setAttribute('aria-label','Количество: '+item.name);
   const makeButton=(delta,label)=>{
    const btn=document.createElement('button');btn.type='button';btn.className='step-btn'+(delta>0?' plus':'');btn.textContent=delta>0?'+':'−';btn.setAttribute('aria-label',label+' '+item.name);
    btn.addEventListener('click',()=>{
     const current=Number(input.value)||0;
     input.value=String(Math.min(10000,Math.max(0,current+delta)));
     input.dispatchEvent(new Event('input',{bubbles:true}));
    });return btn;
   };
   stepper.append(makeButton(-1,'Уменьшить количество'),input,makeButton(1,'Увеличить количество'));
   input.addEventListener('input',calculate);
   row.append(info,stepper);target.append(row);
  }
 }
 // Hide disabled items from the discount selector too; keep the current choice if possible.
 const discount=$('discountProduct'),oldDiscount=discount.value;
 for(const option of discount.options){option.disabled=!activeCore[option.value];option.hidden=!activeCore[option.value]}
 if(!activeCore[oldDiscount]){const first=[...discount.options].find(o=>!o.disabled);if(first)discount.value=first.value}
 const selected=$('club').value;
 if(c.clubs?.length){$('club').replaceChildren(...c.clubs.map(v=>{const o=document.createElement('option');o.value=v;o.textContent=v;return o}));$('club').value=c.clubs.includes(selected)?selected:c.clubs[0]}
 coreDiscountCatalog=(c.products||[]).filter(p=>Object.values({'Большой магнит':1,'Фото A6':1,'Фото A5':1,'Маленький магнит':1}).length&&['Большой магнит','Фото A6','Фото A5','Маленький магнит'].includes(p.name));renderDiscountLines();catalogReady=true;calculate();return c;
}
refreshProductCatalog().catch(()=>{catalogReady=false;show('Не удалось загрузить актуальные цены. Отправка отчёта недоступна до подключения к серверу.',true)});

// Clear zero on focus in money inputs. Empty values calculate as zero.
['digital','discountPrice','cash','owner','workerCard'].forEach(id=>{
 const input=$(id);if(!input)return;
 input.addEventListener('focus',()=>{
  if(input.value.trim()!=='' && Number(input.value)===0){
   input.value='';input.dispatchEvent(new Event('input',{bubbles:true}));
  }
 });
 input.addEventListener('blur',()=>{
  if(input.value.trim()==='')input.value='0';
  calculate();
 });
});
function updateDateDisplay(){
 const raw=$('date').value, display=$('dateDisplay');
 if(!display)return;
 if(!raw){display.textContent='Выбрать';return}
 const parts=raw.split('-').map(Number);
 display.textContent=new Date(parts[0],parts[1]-1,parts[2]).toLocaleDateString('ru-RU',{day:'numeric',month:'short',year:'numeric'});
}
$('date').addEventListener('change',updateDateDisplay);
$('date').addEventListener('input',updateDateDisplay);
updateDateDisplay();

// Server is the sole source of the photographer identity.
async function refreshPhotographers(){
 try{const response=await fetch('/api/me',{cache:'no-store',credentials:'same-origin'});if(!response.ok){location.href='/worker/login';return;}
 signedWorker=await response.json();$('worker').value=signedWorker.name;await render();
 }catch(e){show('Не удалось проверить авторизацию. Подключитесь к интернету.',true)}
}
refreshPhotographers();

// Itemized discounted sales. Each row stores its own product, quantity and total price.
function addDiscountLine(data={}){
 if(discountLines.length>=30){show('Не больше 30 позиций со скидкой',true);return;}
 const line={id:nextDiscountId++};discountLines.push(line);renderDiscountLines();
 if(data.product)$('discountProduct_'+line.id).value=data.product;
 if(data.qty)$('discountQty_'+line.id).value=data.qty;
 if(data.total)$('discountTotal_'+line.id).value=data.total;
 calculate();
}
function renderDiscountLines(){
 const target=$('discountLines');if(!target)return;
 const saved=new Map(discountLines.map(line=>[line.id,{product:document.getElementById('discountProduct_'+line.id)?.value,qty:document.getElementById('discountQty_'+line.id)?.value,total:document.getElementById('discountTotal_'+line.id)?.value}]));
 target.replaceChildren();
 const products=coreDiscountCatalog.concat(extraCatalog);
 for(const line of discountLines){
  const row=document.createElement('div');row.className='discount-line';
  const sel=document.createElement('select');sel.id='discountProduct_'+line.id;sel.setAttribute('aria-label','Товар со скидкой');
  for(const item of products){const option=document.createElement('option');option.value=item.id;option.textContent=item.name;sel.append(option)}
  const q=document.createElement('input');q.type='number';q.id='discountQty_'+line.id;q.min='1';q.max='10000';q.step='1';q.inputMode='numeric';q.value=saved.get(line.id)?.qty??'1';q.setAttribute('aria-label','Количество со скидкой');
  const counter=document.createElement('div');counter.className='discount-qty-counter';
  const minus=document.createElement('button');minus.type='button';minus.className='discount-step';minus.textContent='−';minus.setAttribute('aria-label','Уменьшить количество');
  const plus=document.createElement('button');plus.type='button';plus.className='discount-step';plus.textContent='+';plus.setAttribute('aria-label','Увеличить количество');
  const changeQty=delta=>{const current=Number(q.value)||0;q.value=String(Math.max(1,Math.min(10000,current+delta)));calculate()};
  minus.onclick=()=>changeQty(-1);plus.onclick=()=>changeQty(1);counter.append(minus,q,plus);
  const total=document.createElement('input');total.type='number';total.id='discountTotal_'+line.id;total.min='0';total.step='0.01';total.inputMode='decimal';total.placeholder='Сумма, ₽';total.value=saved.get(line.id)?.total??'0';total.setAttribute('aria-label','Общая сумма продажи со скидкой, ₽');
  const remove=document.createElement('button');remove.type='button';remove.className='discount-remove';remove.textContent='×';remove.title='Удалить позицию';remove.setAttribute('aria-label','Удалить позицию');remove.onclick=()=>{discountLines=discountLines.filter(x=>x.id!==line.id);renderDiscountLines();calculate()};
  sel.className='discount-product-select';
  const sumWrap=document.createElement('div');sumWrap.className='discount-sum-wrap';sumWrap.append(total);
  if(saved.get(line.id)?.product)sel.value=saved.get(line.id).product;
  // Numeric fields follow the same zero-on-focus behavior as the main form.
  for(const el of [q,total]){
   el.addEventListener('focus',()=>{if(el.value.trim()!==''&&Number(el.value)===0){el.value='';calculate();}});
   el.addEventListener('blur',()=>{if(el.value.trim()===''&&Number(el.min)===0)el.value='0';calculate();});
  }
  for(const el of [sel,q,total])el.addEventListener('input',calculate);
  row.append(sel,counter,sumWrap,remove);target.append(row);
 }
}
$('addDiscountLine').addEventListener('click',()=>addDiscountLine());
