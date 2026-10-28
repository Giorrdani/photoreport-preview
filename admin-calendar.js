(()=>{let reports=[...document.querySelectorAll('.compact-report')],grid=document.getElementById('calendarGrid'),title=document.getElementById('calendarTitle'),heading=document.getElementById('selectedDateTitle'),empty=document.getElementById('emptyDay');if(!grid)return;const iso=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');let selected=iso(new Date()),view=new Date();const byDate=new Map();function indexReports(){byDate.clear();for(const r of reports){const key=r.dataset.date;if(!byDate.has(key))byDate.set(key,[]);byDate.get(key).push(r)}}indexReports();function showDay(date){selected=date;const [y,m,d]=date.split('-').map(Number);heading.textContent='Отчёты за '+new Date(y,m-1,d).toLocaleDateString('ru-RU',{day:'numeric',month:'long',year:'numeric'});let count=0;for(const r of reports){r.hidden=r.dataset.date!==date;if(!r.hidden)count++}empty.hidden=count!==0;grid.querySelectorAll('button[data-date]').forEach(b=>{b.classList.toggle('selected',b.dataset.date===date);b.setAttribute('aria-pressed',String(b.dataset.date===date))})}function render(){grid.replaceChildren();title.textContent=view.toLocaleDateString('ru-RU',{month:'long',year:'numeric'});const first=new Date(view.getFullYear(),view.getMonth(),1),offset=(first.getDay()+6)%7,last=new Date(view.getFullYear(),view.getMonth()+1,0).getDate();for(let i=0;i<offset;i++){const spacer=document.createElement('span');spacer.className='calendar-spacer';grid.append(spacer)}for(let day=1;day<=last;day++){const date=iso(new Date(view.getFullYear(),view.getMonth(),day)),b=document.createElement('button');b.type='button';b.className='calendar-day';b.dataset.date=date;b.setAttribute('aria-label',new Date(view.getFullYear(),view.getMonth(),day).toLocaleDateString('ru-RU',{day:'numeric',month:'long',year:'numeric'}));const n=document.createElement('span');n.textContent=day;b.append(n);const dots=document.createElement('span');dots.className='calendar-dots';const rs=byDate.get(date)||[];for(const [club,cls] of [['Аладдин','dot-aladdin'],['Денди АК','dot-dendi']])if(rs.some(r=>r.dataset.club===club)){const dot=document.createElement('i');dot.className='club-dot '+cls;dots.append(dot)}b.append(dots);b.addEventListener('click',()=>showDay(date));grid.append(b)}showDay(selected)}document.getElementById('prevMonth').addEventListener('click',()=>{view=new Date(view.getFullYear(),view.getMonth()-1,1);selected=iso(view);render()});document.getElementById('nextMonth').addEventListener('click',()=>{view=new Date(view.getFullYear(),view.getMonth()+1,1);selected=iso(view);render()});render();
const refreshButton=document.getElementById('refreshReports'),status=document.getElementById('refreshReportsStatus');
let refreshing=false;
async function refreshReports(manual=false){
 if(refreshing||document.hidden)return;
 // Never discard unsaved admin edits while the owner is editing a report.
 if(document.querySelector('.compact-report .edit-panel[open]')){if(manual)status.textContent='Закройте редактор, чтобы обновить список отчётов';return}
 refreshing=true;if(manual){refreshButton.disabled=true;status.textContent='Обновление…'}
 try{
  const response=await fetch('/admin',{credentials:'same-origin',cache:'no-store',headers:{'X-Requested-With':'XMLHttpRequest'}});
  if(!response.ok||response.redirected||!response.url.includes('/admin'))throw Error('Не удалось загрузить отчёты');
  const doc=new DOMParser().parseFromString(await response.text(),'text/html');
  const fresh=[...doc.querySelectorAll('.compact-report')];
  const oldSignature=reports.map(r=>r.outerHTML.replace(/\s+(hidden|open)(="")?/g,'')).join('');
  const newSignature=fresh.map(r=>r.outerHTML.replace(/\s+(hidden|open)(="")?/g,'')).join('');
  if(oldSignature!==newSignature){
   const openIds=new Set(reports.filter(r=>r.open).map(r=>r.dataset.id));
   const anchor=reports[0]||empty;
   for(const r of fresh){if(openIds.has(r.dataset.id))r.open=true;anchor.parentNode.insertBefore(r,anchor)}
   for(const r of reports)r.remove();
   reports=fresh;indexReports();render();
   status.textContent='Список отчётов обновлён';
  }else if(manual)status.textContent='Новых изменений нет';
 }catch(e){if(manual)status.textContent=e.message||'Ошибка обновления'}
 finally{refreshing=false;if(refreshButton)refreshButton.disabled=false}
}
refreshButton?.addEventListener('click',()=>refreshReports(true));
setInterval(()=>refreshReports(false),15000);
})();