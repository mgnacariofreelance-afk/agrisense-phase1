(function(){
 function esc(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
 function patch(){
  const screen=document.querySelector('#intel');if(!screen)return;
  const cards=screen.querySelectorAll('.card');
  const sentinel=[...cards].find(c=>c.textContent.includes('Sentinel-2'));if(!sentinel||sentinel.dataset.fixed)return;
  sentinel.dataset.fixed='1';
  const map=sentinel.querySelector('.map');if(map)map.remove();
  const rows=[...sentinel.querySelectorAll('.row')].filter(r=>r.querySelector('.status')&&r!==sentinel.querySelector('.row'));
  rows.forEach(row=>{
   const text=row.textContent.trim();const status=row.querySelector('.status')?.textContent.trim()||'';
   const dateText=(row.querySelector('b')?.textContent||'').trim();const id=(row.querySelector('.muted')?.textContent||'').trim()||text;
   const item={id,date:dateText,cloud_cover:parseFloat(status)};
   const b=document.createElement('button');b.type='button';b.className='earth-match';b.style.cssText='display:block;width:100%;text-align:left;margin-top:12px;padding:13px;border:1px solid #dfe9e3;background:#f8fcf9;border-radius:14px;color:#17352a;white-space:normal';
   b.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><div style="min-width:0"><strong>🛰️ Sentinel-2 Level-2A</strong><div style="font-size:11px;color:#6d7f76;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:3px">${esc(id)}</div></div><span class="status">${Number.isFinite(item.cloud_cover)?Math.round(item.cloud_cover)+'% cloud':'—'}</span></div><div class="muted" style="margin-top:7px">${esc(dateText)} · Tap to view observation</div>`;
   b.onclick=()=>detail(item);row.replaceWith(b);
  });
 }
 function detail(i){const m=document.createElement('div');m.className='modal open';m.innerHTML=`<div class="sheet"><div class="row"><div><div class="muted">Satellite observation</div><div class="title">Sentinel-2 Level-2A</div></div><button onclick="this.closest('.modal').remove()">✕</button></div><div class="card" style="margin-top:14px;background:#f8fcf9"><div class="grid"><div class="stat"><b>${esc(i.date)||'—'}</b><small>Observation date</small></div><div class="stat"><b>${Number.isFinite(i.cloud_cover)?Math.round(i.cloud_cover)+'%':'—'}</b><small>Cloud coverage</small></div></div><p class="muted" style="margin-top:12px;word-break:break-word"><b>Product:</b> ${esc(i.id)}</p></div><p class="muted">This is a real Sentinel-2 Level-2A catalog match. The displayed cloud percentage is the value returned by the Copernicus catalog. A matched observation does not by itself diagnose crop health.</p><button class="primary" onclick="this.closest('.modal').remove()">Done</button></div>`;document.body.appendChild(m)}
 new MutationObserver(()=>setTimeout(patch,0)).observe(document.body,{childList:true,subtree:true});setTimeout(patch,100);
})();