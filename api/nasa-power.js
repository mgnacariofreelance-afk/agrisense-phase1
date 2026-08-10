export default async function handler(req, res) {
  try {
    const lat = Number(req.query.lat);
    const lon = Number(req.query.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return res.status(400).json({ error: 'Valid lat and lon are required.' });
    }

    const now = new Date();
    // Leave a short near-real-time buffer, then search backwards far enough to
    // guarantee that we can find the latest published daily observation.
    const end = new Date(now);
    end.setUTCDate(end.getUTCDate() - 5);
    const start = new Date(end);
    start.setUTCDate(end.getUTCDate() - 60);
    const fmt = d => d.toISOString().slice(0, 10).replaceAll('-', '');
    const parameters = 'T2M,PRECTOTCORR,RH2M,ALLSKY_SFC_SW_DWN';

    async function requestCommunity(community) {
      const url = `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=${parameters}&community=${community}&longitude=${lon}&latitude=${lat}&start=${fmt(start)}&end=${fmt(end)}&time-standard=LST&format=JSON`;
      const r = await fetch(url, { headers: { Accept: 'application/json' } });
      const text = await r.text();
      let data;
      try { data = JSON.parse(text); } catch { data = null; }
      return { r, data, text: text.slice(0, 500) };
    }

    // AG is preferred for Agrisense. RE is a reliable fallback for the same
    // meteorological/solar variables if the AG dataset has a temporary gap.
    let upstream = await requestCommunity('AG');
    let community = 'AG';
    if (!upstream.r.ok || !upstream.data?.properties?.parameter) {
      upstream = await requestCommunity('RE');
      community = 'RE';
    }

    if (!upstream.r.ok) {
      return res.status(502).json({
        error: 'NASA POWER upstream request failed',
        upstream_status: upstream.r.status,
        upstream_response: upstream.text,
        community
      });
    }

    const p = upstream.data?.properties?.parameter || {};
    const dates = Object.keys(p.T2M || {}).sort();
    const clean = value => {
      const n = Number(value);
      return Number.isFinite(n) && n > -900 ? n : null;
    };

    let latest = null;
    for (let i = dates.length - 1; i >= 0; i--) {
      const d = dates[i];
      if ([p.T2M?.[d], p.PRECTOTCORR?.[d], p.RH2M?.[d], p.ALLSKY_SFC_SW_DWN?.[d]].some(v => clean(v) !== null)) {
        latest = d;
        break;
      }
    }

    if (!latest) {
      return res.status(200).json({
        source: 'NASA POWER', community, latitude: lat, longitude: lon,
        available: false, data_quality: 'no_published_values_in_window',
        requested_start: fmt(start), requested_end: fmt(end)
      });
    }

    return res.status(200).json({
      source: 'NASA POWER', community, date: latest,
      latitude: lat, longitude: lon,
      temperature_c: clean(p.T2M?.[latest]),
      precipitation_mm: clean(p.PRECTOTCORR?.[latest]),
      humidity_pct: clean(p.RH2M?.[latest]),
      solar_kwh_m2_day: clean(p.ALLSKY_SFC_SW_DWN?.[latest]),
      available: true,
      data_quality: 'published_observation'
    });
  } catch (e) {
    return res.status(500).json({ error: 'NASA POWER integration error', detail: e?.message || 'Unknown error' });
  }
}
