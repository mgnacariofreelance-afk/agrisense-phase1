(function(){
  function esc(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
  function patch(){
    const screen=document.querySelector('#intel'); if(!screen)return;
    const cards=screen.querySelectorAll('.card');
    const sentinel=[...cards].find(c=>c.textContent.includes('Sentinel-2'));
    if(sentinel && !sentinel.dataset.fixed){
      sentinel.dataset.fixed='1';
      const map=sentinel.querySelector('.map'); if(map)map.remove();
      const rows=[...sentinel.querySelectorAll('.row')].filter(r=>r.querySelector('.status') && r!==sentinel.querySelector('.row'));
      rows.forEach((row,i)=>{
        const item=(window.__agrisenseSentinelItems||[])[i];
        const b=document.createElement('button'); b.className='earth-match';
        b.innerHTML=`<div class="match-head"><div><strong>🛰️ Sentinel-2 Level-2A</strong><div class="match-id">${esc(item?.id||row.textContent.trim())}</div></div><span class="status">${item?.cloud_cover==null?'—':Math.round(item.cloud_cover)+'% cloud'}</span></div><div class="muted" style="margin-top:7px">${item?.date?new Date(item.date).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}):''} · Tap to view details</div>`;
        b.onclick=()=>detail(item); row.replaceWith(b);
      });
      const source=sentinel.querySelector('p.muted'); if(source)source.className='source-note';
    }
  }
  function detail(i){if(!i)return;const m=document.createElement('div');m.className='modal open';m.innerHTML=`<div class="sheet"><div class="row"><div><div class="muted">Satellite observation</div><div class="title">Sentinel-2 Level-2A</div></div><button onclick="this.closest('.modal').remove()">✕</button></div><div class="card" style="margin-top:14px;background:#f8fcf9"><div class="grid"><div class="stat"><b>${i.date?new Date(i.date).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}):'—'}</b><small>Observation date</small></div><div class="stat"><b>${i.cloud_cover==null?'—':Math.round(i.cloud_cover)+'%'}</b><small>Cloud coverage</small></div></div><p class="muted" style="margin-top:12px;word-break:break-word"><b>Product:</b> ${esc(i.id)}</p></div><p class="muted">This is a real Sentinel-2 Level-2A catalog match. Cloud coverage is the value reported by Copernicus for the observation. An observation match does not by itself diagnose crop health.</p><button class="primary" onclick="this.closest('.modal').remove()">Done</button></div>`;document.body.appendChild(m)}
  const oldRender=window.render; // render is global in the current PWA
  const observer=new MutationObserver(()=>{setTimeout(patch,0)});observer.observe(document.body,{childList:true,subtree:true});
  setTimeout(patch,100);
})();