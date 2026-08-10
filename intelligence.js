(function(){
 const KEY='agrisense';
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const read=()=>JSON.parse(localStorage.getItem(KEY)||'{}');
 function renderIntel(){
  const nav=document.querySelector('nav'),main=document.querySelector('main'); if(!nav||!main)return;
  let btn=nav.querySelector('[data-s="intel"]');
  if(!btn){btn=document.createElement('button');btn.dataset.s='intel';btn.innerHTML='<span>🛰️</span>Intel';btn.onclick=()=>goIntel();nav.appendChild(btn)}
  let sec=document.querySelector('#intel'); if(!sec){sec=document.createElement('section');sec.id='intel';sec.className='screen';main.appendChild(sec)}
  const data=read(),e=data.earth||{},s=e.sentinel,w=e.weather;
  sec.innerHTML='<div class="section-head"><div><small>Evidence & Analysis</small><h2>🧠 Agrisense Intelligence</h2></div></div>'+
   '<div class="card compact"><div class="row"><div><h3>🛰️ Sentinel-2</h3><small>Satellite observation</small></div><span class="status '+(s?'':'warn')+'">'+(s?(s.count||s.items?.length||0)+' match':'Not checked')+'</span></div>'+
   (s?.items?.length?s.items.slice(0,5).map(i=>'<button class="observation" type="button"><div><b>Sentinel-2 Level-2A</b><small>'+esc(i.date||'Latest observation')+'</small></div><span>'+((i.cloud_cover==null)?'—':Math.round(i.cloud_cover)+'% cloud')+'</span></button>').join(''):'<p class="muted">Mag-refresh ng Live Earth Data para maghanap ng satellite observation.</p>')+'</div>'+
   '<div class="card compact"><div class="row"><div><h3>🌦️ NASA POWER</h3><small>Weather evidence</small></div><span class="status '+(w?'':'warn')+'">'+(w?'Available':'Not checked')+'</span></div>'+
   (w?'<div class="grid"><div class="stat"><b>'+((w.temperature_c==null)?'—':Number(w.temperature_c).toFixed(1)+'°C')+'</b><small>Temperature</small></div><div class="stat"><b>'+((w.precipitation_mm==null)?'—':Number(w.precipitation_mm).toFixed(1)+' mm')+'</b><small>Rainfall</small></div><div class="stat"><b>'+((w.humidity_pct==null)?'—':Number(w.humidity_pct).toFixed(0)+'%')+'</b><small>Humidity</small></div></div><p class="muted">Latest available weather evidence for the selected farm.</p>':'<p class="muted">Mag-refresh ng Live Earth Data para makakuha ng NASA POWER weather data.</p>')+'</div>'+
   '<div class="card compact"><h3>🔎 What Agrisense uses</h3><div class="evidence-list"><span>• Satellite observations</span><span>• NASA POWER weather</span><span>• Crop variety & characteristics</span><span>• Crop stage</span><span>• Farmer field reports</span></div><p class="muted">Ang Intelligence section ang technical evidence layer ng Agrisense. Ang farmer-facing Risk Assessment at Recommendation ay ipinapakita sa specific farm.</p></div>';
 }
 window.goIntel=function(){document.querySelectorAll('.screen').forEach(x=>x.classList.remove('active'));document.querySelector('#intel')?.classList.add('active');document.querySelectorAll('nav button').forEach(x=>x.classList.toggle('active',x.dataset.s==='intel'));scrollTo(0,0);renderIntel()};
 new MutationObserver(()=>setTimeout(renderIntel,0)).observe(document.body,{childList:true,subtree:true}); setTimeout(renderIntel,150);
})();