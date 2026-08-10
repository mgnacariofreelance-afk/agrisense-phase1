(() => {
  const powerEndpoint = '/api/power';
  const sentinelEndpoint = '/api/sentinel';
  const state = JSON.parse(localStorage.getItem('agrisense') || 'null') || {};
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function locate() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) return reject(new Error('This browser does not provide GPS.'));
      navigator.geolocation.getCurrentPosition(
        p => resolve({ latitude: p.coords.latitude, longitude: p.coords.longitude, accuracy: p.coords.accuracy }),
        e => reject(new Error(e.message || 'GPS permission was denied.')),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 }
      );
    });
  }

  function latestPower(data) {
    const p = data?.data?.properties?.parameter || {};
    const dates = Object.keys(p.T2M || p.PRECTOTCORR || {}).sort();
    const d = dates[dates.length - 1];
    if (!d) return null;
    const val = k => p[k]?.[d];
    return { date: d, t: val('T2M'), rain: val('PRECTOTCORR'), rh: val('RH2M'), solar: val('ALLSKY_SFC_SW_DWN'), wind: val('WS10M') };
  }

  async function loadEarthData() {
    const button = $('#earth-refresh');
    const status = $('#earth-status');
    if (!button || !status) return;
    button.disabled = true; button.textContent = 'Reading GPS…'; status.textContent = 'Requesting device location';
    try {
      const pos = await locate();
      localStorage.setItem('agrisense:lastGps', JSON.stringify(pos));
      const end = new Date().toISOString().slice(0,10).replaceAll('-','');
      const start = new Date(Date.now() - 6 * 86400000).toISOString().slice(0,10).replaceAll('-','');
      button.textContent = 'Loading NASA POWER…';
      const power = await fetch(`${powerEndpoint}?latitude=${pos.latitude}&longitude=${pos.longitude}&start=${start}&end=${end}`).then(r => r.ok ? r.json() : r.json().then(x => Promise.reject(new Error(x.error || `HTTP ${r.status}`))));
      const latest = latestPower(power);
      const pbox = $('#power-live');
      if (pbox && latest) pbox.innerHTML = `<div class="grid"><div class="stat"><b>${latest.t ?? '—'} °C</b><small>Temperature</small></div><div class="stat"><b>${latest.rain ?? '—'} mm</b><small>Precipitation</small></div><div class="stat"><b>${latest.rh ?? '—'}%</b><small>Relative humidity</small></div><div class="stat"><b>${latest.solar ?? '—'}</b><small>Solar radiation</small></div></div><p class="muted">NASA POWER • ${esc(latest.date)} • GPS ±${Math.round(pos.accuracy)} m</p>`;
      button.textContent = 'Searching Sentinel-2…'; status.textContent = 'Searching Copernicus Sentinel-2 Level-2A';
      const geometry = { type: 'Point', coordinates: [pos.longitude, pos.latitude] };
      const sentinel = await fetch(sentinelEndpoint, { method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({ geometry, start:new Date(Date.now()-30*86400000).toISOString(), end:new Date().toISOString(), maxCloud:40 }) }).then(r => r.ok ? r.json() : r.json().then(x => Promise.reject(new Error(x.error || `HTTP ${r.status}`))));
      const sbox = $('#sentinel-live');
      if (sbox) {
        if (!sentinel.features?.length) sbox.innerHTML = `<p class="muted">No Sentinel-2 Level-2A observation matched the last 30 days at this GPS point under 40% cloud cover.</p>`;
        else { const x=sentinel.features[0]; sbox.innerHTML=`<div class="row"><div><b>${esc(x.id)}</b><div class="muted">${esc(x.datetime)}</div></div><span class="status">${x.cloudCover ?? '—'}% cloud</span></div><p class="muted">${esc(x.platform || 'Sentinel-2')} • ${esc(x.processingLevel)}</p>${x.assets?.thumbnail?.href?`<img src="${esc(x.assets.thumbnail.href)}" alt="Sentinel-2 thumbnail" style="width:100%;border-radius:12px;margin-top:5px">`:''}<p class="muted">Source: Copernicus Data Space Ecosystem. This test uses the phone's current GPS point, not yet the full farm polygon.</p>`; }
      }
      status.textContent = `Live data loaded • ${pos.latitude.toFixed(5)}, ${pos.longitude.toFixed(5)}`;
      button.textContent = 'Refresh live Earth data';
    } catch (e) {
      status.textContent = e.message; button.textContent = 'Try again';
    } finally { button.disabled = false; }
  }

  function mount() {
    const intel = $('#intel'); if (!intel || $('#earth-connect')) return;
    const anchor = intel.querySelector('.title');
    const wrap = document.createElement('div'); wrap.id='earth-connect'; wrap.className='card';
    wrap.innerHTML=`<div class="row"><div><div class="title">🌍 Live Earth Data</div><div class="muted">Test the real data pipeline from this phone.</div></div><span class="status" id="earth-status">Not connected</span></div><button id="earth-refresh" class="primary" style="margin-top:12px;width:100%">Use phone GPS & load data</button><hr><div class="title">🛰️ Sentinel-2 result</div><div id="sentinel-live" class="muted" style="margin-top:8px">Waiting for GPS.</div><hr><div class="title">🌦️ NASA POWER result</div><div id="power-live" class="muted" style="margin-top:8px">Waiting for GPS.</div><p class="muted" style="margin-bottom:0">Live sources: Copernicus Data Space Ecosystem and NASA POWER. Values are not generated by Agrisense.</p>`;
    anchor?.parentNode?.insertBefore(wrap, anchor.nextSibling);
    $('#earth-refresh').onclick=loadEarthData;
  }
  new MutationObserver(mount).observe(document.body,{childList:true,subtree:true});
  mount();
})();