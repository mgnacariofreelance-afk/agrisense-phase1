export default async function handler(req, res) {
  try {
    const lat = Number(req.query.lat);
    const lon = Number(req.query.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return res.status(400).json({ error: 'Valid lat and lon are required.' });
    }

    // NASA POWER near-real-time data can lag. Request a wider window and use the
    // newest date that actually contains usable values instead of displaying a
    // missing-data sentinel as if it were a measurement.
    const end = new Date();
    const start = new Date(end);
    start.setUTCDate(end.getUTCDate() - 30);
    const fmt = d => d.toISOString().slice(0, 10).replaceAll('-', '');
    const params = 'T2M,PRECTOTCORR,RH2M,ALLSKY_SFC_SW_DWN,WS2M';
    const url = `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=${params}&community=AG&longitude=${lon}&latitude=${lat}&start=${fmt(start)}&end=${fmt(end)}&time-standard=LST&format=JSON`;

    const r = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!r.ok) return res.status(502).json({ error: 'NASA POWER request failed', status: r.status });
    const data = await r.json();
    const p = data?.properties?.parameter || {};
    const dates = Object.keys(p.T2M || {}).sort();
    if (!dates.length) return res.status(404).json({ error: 'No NASA POWER observation returned.' });

    // POWER commonly uses -999 for missing values. Treat any very negative
    // sentinel-like value as unavailable; never show it to the farmer.
    const clean = value => {
      const n = Number(value);
      return Number.isFinite(n) && n > -900 ? n : null;
    };

    let latest = null;
    for (let i = dates.length - 1; i >= 0; i--) {
      const d = dates[i];
      const values = [p.T2M?.[d], p.PRECTOTCORR?.[d], p.RH2M?.[d], p.ALLSKY_SFC_SW_DWN?.[d], p.WS2M?.[d]];
      if (values.some(v => clean(v) !== null)) {
        latest = d;
        break;
      }
    }
    if (!latest) {
      return res.status(200).json({
        source: 'NASA POWER', latitude: lat, longitude: lon,
        available: false, data_quality: 'unavailable_for_requested_period'
      });
    }

    const result = {
      source: 'NASA POWER', date: latest, latitude: lat, longitude: lon,
      temperature_c: clean(p.T2M?.[latest]),
      precipitation_mm: clean(p.PRECTOTCORR?.[latest]),
      humidity_pct: clean(p.RH2M?.[latest]),
      solar_kwh_m2_day: clean(p.ALLSKY_SFC_SW_DWN?.[latest]),
      wind_m_s: clean(p.WS2M?.[latest]),
      available: true,
      data_quality: 'partial_or_complete'
    };
    return res.status(200).json(result);
  } catch (e) {
    return res.status(500).json({ error: 'NASA POWER integration error' });
  }
}