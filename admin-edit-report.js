(()=>{
 const feedback=window.reportEditFeedback||{};
 const forms=[...document.querySelectorAll('.edit-grid[data-report-id]')];
 const number=(form,name)=>Number(form.elements.namedItem(name)?.value||0);
 const money=n=>(Math.round((n+Number.EPSILON)*100)/100).toLocaleString('ru-RU',{minimumFractionDigits:2,maximumFractionDigits:2})+' ₽';
 function calculate(form){
  let total=number(form,'magnet')*Number(form.dataset.priceMagnet||0)+number(form,'a6')*Number(form.dataset.priceA6||0)+number(form,'a5')*Number(form.dataset.priceA5||0)+number(form,'small')*Number(form.dataset.priceSmall||0)+number(form,'digital')+number(form,'discountPrice');
  for(const field of form.querySelectorAll('input[name^="line_"][name$="_qty"]')){
   const id=field.name.slice(5,-4),line=field.closest('.edit-line'),price=Number(line.dataset.unitPrice||0);
   const discount=form.elements.namedItem('line_'+id+'_total');
   total+=discount?Number(discount.value||0):Number(field.value||0)*price;
  }
  const paid=number(form,'cash')+number(form,'owner')+number(form,'workerCard');
  form.querySelector('.edit-new-total').textContent=money(total);
  form.querySelector('.edit-new-paid').textContent=money(paid);
  form.querySelector('.edit-new-wage').textContent=money(Math.max(0,total-300)*.4);
  form.querySelector('.edit-new-paid').style.color=Math.abs(total-paid)>.005?'#ff9c9c':'';
  return {total,paid};
 }
 for(const form of forms){
  form.querySelectorAll('.edit-line').forEach(line=>{const small=line.querySelector('small[data-unit-price]');if(small)line.dataset.unitPrice=small.dataset.unitPrice});
  for(const field of form.querySelectorAll('input[type="number"]')){
   field.addEventListener('focus',()=>{if(field.value==='0'||field.value==='0.00')field.value='' });
   field.addEventListener('blur',()=>{if(field.value.trim()==='')field.value='0';calculate(form)});
  }
  form.addEventListener('input',()=>calculate(form));
  form.addEventListener('submit',event=>{
   const {total,paid}=calculate(form);
   if(Math.abs(total-paid)>.005){event.preventDefault();alert('Выручка '+money(total)+', а сумма оплат '+money(paid)+'. Исправьте суммы оплат перед сохранением.');return}
   const submit=form.querySelector('button[type=submit]');if(submit){submit.disabled=true;submit.textContent='Сохраняем…'}
  });
  calculate(form);
 }
 if(feedback.reportId!=null){
  const form=forms.find(f=>String(f.dataset.reportId)===String(feedback.reportId));
  if(form){
   const report=form.closest('.compact-report');if(report)report.open=true;
   const edit=form.closest('.edit-panel');if(edit)edit.open=true;
   if(feedback.draft&&typeof feedback.draft==='object'){
    for(const [name,value] of Object.entries(feedback.draft)){
     const field=form.elements.namedItem(name);if(field&&field.tagName!=='BUTTON'&&field.type!=='hidden')field.value=value;
    }
    calculate(form);
   }
   const date=report?.dataset.date;if(date){const dateButton=document.querySelector('.calendar-day[data-date="'+date+'"]');dateButton?.click()}
   setTimeout(()=>report?.scrollIntoView({block:'center',behavior:'smooth'}),80);
  }
 }
})();
