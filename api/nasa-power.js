export default async function handler(req, res) {
  try {
    const lat = Number(req.query.lat), lon = Number(req.query.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return res.status(400).json({ error: 'Valid lat and lon are required.' });
    }

    // POWER near-real-time values can lag. End the search 3 days ago and look
    // back 60 days so Agrisense does not mistake NRT gaps for missing climate data.
    const end = new Date(); end.setUTCDate(end.getUTCDate() - 3);
    const start = new Date(end); start.setUTCDate(end.getUTCDate() - 60);
    const fmt = d => d.toISOString().slice(0,10).replaceAll('-','');
    const parameters = 'T2M,PRECTOTCORR,RH2M,ALLSKY_SFC_SW_DWN';
    const base = `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=${parameters}&longitude=${lon}&latitude=${lat}&start=${fmt(start)}&end=${fmt(end)}&time-standard=LST&format=JSON`;

    async function request(community) {
      const r = await fetch(`${base}&community=${community}`, {headers:{Accept:'application/json'}});
      let data = null; try { data = await r.json(); } catch {}
      return {ok:r.ok,status:r.status,data};
    }

    // AG is the intended Agrisense community. If it cannot serve one of the
    // requested parameters, retry with the general Science community rather
    // than returning a misleading empty card.
    let response = await request('AG');
    let community = 'AG';
    if (!response.ok) { response = await request('SB'); community = 'SB'; }
    if (!response.ok) return res.status(502).json({error:'NASA POWER request failed',status:response.status,details:response.data?.messages||null});

    const p = response.data?.properties?.parameter || {};
    const clean = v => { const n=Number(v); return Number.isFinite(n) && n > -900 ? n : null; };
    const keys = ['T2M','PRECTOTCORR','RH2M','ALLSKY_SFC_SW_DWN'];
    const dateSet = new Set();
    keys.forEach(k => Object.keys(p[k]||{}).forEach(d=>dateSet.add(d)));
    const dates = [...dateSet].sort();
    if (!dates.length) return res.status(200).json({source:'NASA POWER',available:false,data_quality:'no_dates_returned',latitude:lat,longitude:lon,community});

    // Choose the newest date with at least one real value. Each parameter is
    // cleaned independently so one missing variable does not hide the others.
    let latest = null;
    for(let i=dates.length-1;i>=0;i--){
      const d=dates[i];
      if(keys.some(k=>clean(p[k]?.[d])!==null)){latest=d;break;}
    }
    if(!latest) return res.status(200).json({source:'NASA POWER',available:false,data_quality:'all_values_missing',latitude:lat,longitude:lon,community});

    return res.status(200).json({
      source:'NASA POWER', community, date:latest, latitude:lat, longitude:lon, available:true,
      temperature_c:clean(p.T2M?.[latest]),
      precipitation_mm:clean(p.PRECTOTCORR?.[latest]),
      humidity_pct:clean(p.RH2M?.[latest]),
      solar_kwh_m2_day:clean(p.ALLSKY_SFC_SW_DWN?.[latest]),
      data_quality:'real_api_observation'
    });
  } catch(e) {
    return res.status(500).json({error:'NASA POWER integration error',message:String(e?.message||e)});
  }
}