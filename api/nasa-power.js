export default async function handler(req, res) {
  try {
    const lat = Number(req.query.lat);
    const lon = Number(req.query.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return res.status(400).json({ error: 'Valid lat and lon are required.' });
    }
    const end = new Date();
    const start = new Date(end);
    start.setUTCDate(end.getUTCDate() - 6);
    const fmt = d => d.toISOString().slice(0,10).replaceAll('-','');
    const params = 'T2M,PRECTOTCORR,RH2M,ALLSKY_SFC_SW_DWN,WS2M';
    const url = `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=${params}&community=AG&longitude=${lon}&latitude=${lat}&start=${fmt(start)}&end=${fmt(end)}&format=JSON`;
    const r = await fetch(url);
    if (!r.ok) return res.status(502).json({ error: 'NASA POWER request failed', status: r.status });
    const data = await r.json();
    const p = data?.properties?.parameter || {};
    const dates = Object.keys(p.T2M || {});
    const latest = dates.at(-1);
    if (!latest) return res.status(404).json({ error: 'No NASA POWER observation returned.' });
    return res.status(200).json({ source:'NASA POWER', date:latest, latitude:lat, longitude:lon, temperature_c:p.T2M?.[latest] ?? null, precipitation_mm:p.PRECTOTCORR?.[latest] ?? null, humidity_pct:p.RH2M?.[latest] ?? null, solar_kwh_m2_day:p.ALLSKY_SFC_SW_DWN?.[latest] ?? null, wind_m_s:p.WS2M?.[latest] ?? null });
  } catch (e) { return res.status(500).json({ error:'NASA POWER integration error' }); }
}