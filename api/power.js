export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const q = req.query || {};
    const latitude = Number(q.latitude);
    const longitude = Number(q.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return res.status(400).json({ error: 'latitude and longitude are required' });
    }
    const end = q.end || new Date().toISOString().slice(0,10).replaceAll('-','');
    const startDate = new Date(Date.now() - 6 * 86400000).toISOString().slice(0,10).replaceAll('-','');
    const start = q.start || startDate;
    const params = q.parameters || 'T2M,T2M_MAX,T2M_MIN,PRECTOTCORR,RH2M,ALLSKY_SFC_SW_DWN,WS10M';
    const url = new URL('https://power.larc.nasa.gov/api/temporal/daily/point');
    url.searchParams.set('parameters', params);
    url.searchParams.set('community', 'AG');
    url.searchParams.set('longitude', longitude.toFixed(6));
    url.searchParams.set('latitude', latitude.toFixed(6));
    url.searchParams.set('start', start);
    url.searchParams.set('end', end);
    url.searchParams.set('format', 'JSON');
    url.searchParams.set('time-standard', 'UTC');
    const r = await fetch(url);
    if (!r.ok) return res.status(r.status).json({ error: `NASA POWER returned ${r.status}` });
    const data = await r.json();
    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=3600');
    return res.status(200).json({ source: 'NASA POWER', request: { latitude, longitude, start, end, parameters: params }, data });
  } catch (e) {
    return res.status(500).json({ error: 'NASA POWER request failed', detail: e.message });
  }
}