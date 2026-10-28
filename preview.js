/* Static GitHub Pages preview. Never sends or saves real business data. */
(()=>{
const css=document.createElement('style');css.textContent=`
.preview-banner{position:relative;z-index:100000;background:#233b32;color:#f4c7b5;text-align:center;padding:8px 10px;font:600 11px/1.35 Manrope,Arial,sans-serif;letter-spacing:.02em}
.preview-nav{position:fixed;bottom:0;left:0;right:0;z-index:100000;display:flex;gap:5px;overflow-x:auto;padding:10px max(10px,env(safe-area-inset-right)) calc(10px + env(safe-area-inset-bottom)) max(10px,env(safe-area-inset-left));background:rgba(13,29,25,.96);backdrop-filter:blur(20px);box-shadow:0 -8px 30px #0006;scrollbar-width:none}
.preview-nav a{flex:none;white-space:nowrap;border-radius:12px;padding:9px 11px;color:#e6eae6;text-decoration:none;font:600 11px Manrope,Arial,sans-serif;background:#30443c}
.preview-nav a.current{background:#db8b75;color:#182a24}
body{padding-bottom:calc(76px + env(safe-area-inset-bottom))!important}
`;document.head.append(css);
const nativeFetch=window.fetch.bind(window);
window.fetch=async (resource,init={})=>{
 const url=typeof resource==='string'?resource:resource.url;
 const path=new URL(url,location.href).pathname;
 const method=(init.method||'GET').toUpperCase();
 const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json'}});
 if(path.endsWith('/api/me'))return json({id:1,name:'Демо-фотограф'});
 if(path.endsWith('/api/catalog'))return json({products:[{id:1,key:'magnet',name:'Большой магнит',price:400,active:true},{id:2,key:'a6',name:'Фото A6',price:200,active:true},{id:3,key:'a5',name:'Фото A5',price:350,active:true},{id:4,key:'small',name:'Маленький магнит',price:250,active:true}],extraProducts:[]});
 if(path.includes('/api/') || path.includes('/worker/csrf'))return json({error:'Демо-версия: отправка и сохранение отключены'},403);
 return nativeFetch(resource,init);
};
window.addEventListener('DOMContentLoaded',()=>{
 const send=document.getElementById('send');if(send)send.addEventListener('click',e=>{e.stopImmediatePropagation();e.preventDefault();alert('Демо-режим: отчёты не отправляются.');},true);
 document.querySelectorAll('form').forEach(f=>{
  if(f.id==='report')return;
  f.addEventListener('submit',e=>{e.preventDefault();
   if(f.closest('.fc3-auth')){location.href=f.querySelector('[name="pin"]')?'index.html':'admin.html';return;}
   alert('Демо-режим: изменения не сохраняются.');
  },true);
 });
 document.querySelectorAll('a[href^="/"],a[href="./"]').forEach(a=>{
  const path=a.getAttribute('href');const map={'/':'index.html','/admin':'admin.html','/login':'login.html','/worker/login':'worker-login.html','/admin/staff':'staff.html','/admin/catalog':'catalog.html','/admin/finance':'finance.html'};
  if(map[path])a.href=map[path];
 });
});
})();