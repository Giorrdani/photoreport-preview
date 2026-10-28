
(() => {
const $=id=>document.getElementById(id);
const ids=['club','worker','discountProduct'];
function enhanceSelect(select){
 if(!select||select.dataset.enhanced)return;
 select.dataset.enhanced='true';
 const host=document.createElement('div');host.className='custom-picker';
 select.parentNode.insertBefore(host,select);host.appendChild(select);
 select.classList.add('native-select-hidden');
 // Prevent native OS/browser popups even if an older stylesheet is cached.
 select.style.setProperty('display','none','important');
 select.style.setProperty('visibility','hidden','important');
 select.style.setProperty('pointer-events','none','important');
 select.tabIndex=-1;
 select.setAttribute('aria-hidden','true');
 const trigger=document.createElement('button');trigger.type='button';trigger.className='picker-trigger';
 trigger.setAttribute('aria-haspopup','listbox');trigger.setAttribute('aria-expanded','false');
 const value=document.createElement('span');value.className='picker-value';
 const arrow=document.createElement('span');arrow.className='picker-chevron';arrow.setAttribute('aria-hidden','true');
 trigger.append(value,arrow);host.append(trigger);
 const menu=document.createElement('div');menu.className='picker-menu';menu.setAttribute('role','listbox');host.append(menu);
 const uid='picker-'+(select.id||Math.random().toString(36).slice(2));
 menu.id=uid;trigger.setAttribute('aria-controls',uid);
 // Ensure an in-app popup; the native select is never opened.
 select.addEventListener('pointerdown',e=>e.preventDefault());
 function sync(){
  value.textContent=select.selectedOptions[0]?.textContent||'Выберите';
  trigger.classList.toggle('picker-empty',!select.value);
  menu.replaceChildren();
  for(const opt of select.options){
   const b=document.createElement('button');b.type='button';b.className='picker-option';b.setAttribute('role','option');
   b.setAttribute('aria-selected',String(opt.value===select.value));b.textContent=opt.textContent;b.disabled=opt.disabled;
   b.addEventListener('click',()=>{select.value=opt.value;select.dispatchEvent(new Event('change',{bubbles:true}));close();sync();trigger.focus()});
   menu.append(b);
  }
 }
 function close(){host.classList.remove('picker-open');trigger.setAttribute('aria-expanded','false')}
 trigger.addEventListener('click',()=>{const opening=!host.classList.contains('picker-open');document.querySelectorAll('.custom-picker.picker-open').forEach(x=>x.classList.remove('picker-open'));host.classList.toggle('picker-open',opening);trigger.setAttribute('aria-expanded',String(opening));if(opening)menu.querySelector('[aria-selected=true]')?.scrollIntoView({block:'nearest'})});
 trigger.addEventListener('keydown',e=>{
  if(e.key==='Escape'){close();trigger.focus()}
  if(['ArrowDown','Enter',' '].includes(e.key)&&!host.classList.contains('picker-open')){e.preventDefault();trigger.click()}
 });
 menu.addEventListener('keydown',e=>{if(e.key==='Escape'){close();trigger.focus()}});
 select.addEventListener('change',sync);
 new MutationObserver(sync).observe(select,{childList:true,subtree:true,attributes:true,attributeFilter:['selected']});
 sync();
 document.addEventListener('pointerdown',e=>{if(!host.contains(e.target))close()});
}
function enhanceDate(input){
 if(!input||input.dataset.enhanced)return;
 input.dataset.enhanced='true';
 const host=document.createElement('div');host.className='custom-date';
 input.parentNode.insertBefore(host,input);host.appendChild(input);
 input.classList.add('native-date-hidden');
 const trigger=document.createElement('button');trigger.type='button';trigger.className='picker-trigger date-trigger';trigger.setAttribute('aria-label','Выбрать дату');
 host.append(trigger);
 // Calendar is portaled to <body> so sibling cards cannot cover it.
 const popup=document.createElement('div');popup.className='date-popup date-popup-portal';document.body.append(popup);
 const positionPopup=()=>{
  const rect=trigger.getBoundingClientRect();
  const width=Math.min(290,window.innerWidth-24);
  const left=Math.max(12,Math.min(rect.right-width,window.innerWidth-width-12));
  const height=popup.offsetHeight||340;
  const below=window.innerHeight-rect.bottom;
  const top=below>=height+10||rect.top<height+10?rect.bottom+7:rect.top-height-7;
  popup.style.left=left+'px';popup.style.right='auto';popup.style.top=Math.max(8,top)+'px';popup.style.width=width+'px';
 };
 const closePopup=()=>{host.classList.remove('picker-open');popup.classList.remove('is-portal-open')};
 let view=new Date();
 const iso=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
 function render(){
  const parts=input.value.split('-').map(Number), chosen=parts.length===3&&parts.every(Boolean)?new Date(parts[0],parts[1]-1,parts[2]):new Date();
  trigger.textContent=(input.value?chosen.toLocaleDateString('ru-RU',{day:'numeric',month:'long',year:'numeric'}):'Выберите дату')+'  ▾';
  popup.replaceChildren();
  const bar=document.createElement('div');bar.className='date-popup-bar';
  const prev=document.createElement('button'),next=document.createElement('button'),label=document.createElement('strong');
  prev.type=next.type='button';prev.textContent='‹';next.textContent='›';prev.setAttribute('aria-label','Предыдущий месяц');next.setAttribute('aria-label','Следующий месяц');
  label.textContent=view.toLocaleDateString('ru-RU',{month:'long',year:'numeric'});
  prev.onclick=()=>{view=new Date(view.getFullYear(),view.getMonth()-1,1);render()};
  next.onclick=()=>{view=new Date(view.getFullYear(),view.getMonth()+1,1);render()};
  bar.append(prev,label,next);popup.append(bar);
  const grid=document.createElement('div');grid.className='date-popup-grid';
  for(const d of ['Пн','Вт','Ср','Чт','Пт','Сб','Вс']){const cell=document.createElement('span');cell.textContent=d;grid.append(cell)}
  const offset=(new Date(view.getFullYear(),view.getMonth(),1).getDay()+6)%7;
  for(let i=0;i<offset;i++)grid.append(document.createElement('span'));
  const count=new Date(view.getFullYear(),view.getMonth()+1,0).getDate();
  for(let day=1;day<=count;day++){const date=iso(new Date(view.getFullYear(),view.getMonth(),day));const b=document.createElement('button');b.type='button';b.textContent=day;b.className='date-popup-day';if(date===input.value)b.classList.add('selected');b.onclick=()=>{input.value=date;input.dispatchEvent(new Event('change',{bubbles:true}));closePopup();render()};grid.append(b)}
  popup.append(grid);
 }
 trigger.onclick=()=>{
  const opening=!host.classList.contains('picker-open');
  document.querySelectorAll('.date-popup-portal.is-portal-open').forEach(p=>p.classList.remove('is-portal-open'));
  document.querySelectorAll('.custom-date.picker-open').forEach(h=>h.classList.remove('picker-open'));
  if(!opening)return;
  view=input.value?new Date(input.value+'T12:00:00'):new Date();render();
  host.classList.add('picker-open');popup.classList.add('is-portal-open');positionPopup();
 };
 document.addEventListener('pointerdown',e=>{if(!host.contains(e.target)&&!popup.contains(e.target))closePopup()});
 document.addEventListener('keydown',e=>{if(e.key==='Escape')closePopup()});
 window.addEventListener('resize',()=>{if(host.classList.contains('picker-open'))positionPopup()});
 window.addEventListener('scroll',()=>{if(host.classList.contains('picker-open'))positionPopup()},true);
 input.addEventListener('change',render);render();
}
function init(){document.querySelectorAll('select:not([data-native-control])').forEach(enhanceSelect);document.querySelectorAll('input[type=date]:not([data-native-control])').forEach(enhanceDate)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
