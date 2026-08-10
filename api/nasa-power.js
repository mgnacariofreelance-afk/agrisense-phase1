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
    const fmt = d => d.toISOString().slice(0, 10).replaceAll('-', '');
    const params = 'T2M,PRECTOTCORR,RH2M,ALLSKY_SFC_SW_DWN,WS2M';
    const url = `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=${params}&community=AG&longitude=${lon}&latitude=${lat}&start=${fmt(start)}&end=${fmt(end)}&format=JSON`;
    const r = await fetch(url);
    if (!r.ok) return res.status(502).json({ error: 'NASA POWER request failed', status: r.status });
    const data = await r.json();
    const p = data?.properties?.parameter || {};
    const dates = Object.keys(p.T2M || {}).sort();
    if (!dates.length) return res.status(404).json({ error: 'No NASA POWER observation returned.' });

    // NASA POWER uses -999 as its missing-data sentinel. Never expose it as a real measurement.
    const clean = value => {
      const n = Number(value);
      return Number.isFinite(n) && n !== -999 ? n : null;
    };
    let latest = dates.at(-1);
    for (let i = dates.length - 1; i >= 0; i--) {
      const d = dates[i];
      if ([p.T2M?.[d], p.PRECTOTCORR?.[d], p.RH2M?.[d], p.ALLSKY_SFC_SW_DWN?.[d], p.WS2M?.[d]].some(v => clean(v) !== null)) {
        latest = d;
        break;
      }
    }
    const result = {
      source: 'NASA POWER', date: latest, latitude: lat, longitude: lon,
      temperature_c: clean(p.T2M?.[latest]),
      precipitation_mm: clean(p.PRECTOTCORR?.[latest]),
      humidity_pct: clean(p.RH2M?.[latest]),
      solar_kwh_m2_day: clean(p.ALLSKY_SFC_SW_DWN?.[latest]),
      wind_m_s: clean(p.WS2M?.[latest])
    };
    result.available = Object.values(result).some(v => typeof v === 'number' && Number.isFinite(v));
    result.data_quality = result.available ? 'partial_or_complete' : 'unavailable_for_requested_period';
    return res.status(200).json(result);
  } catch (e) {
    return res.status(500).json({ error: 'NASA POWER integration error' });
  }
}