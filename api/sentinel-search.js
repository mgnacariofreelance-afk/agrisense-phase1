export default async function handler(req, res) {
  try {
    const lat = Number(req.query.lat), lon = Number(req.query.lon);
    const days = Math.min(Math.max(Number(req.query.days) || 60, 1), 120);
    const maxCloud = Math.min(Math.max(Number(req.query.maxCloud) || 70, 1), 100);
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return res.status(400).json({ error: 'Valid lat and lon are required.' });
    }
    const end = new Date();
    const start = new Date(end);
    start.setUTCDate(end.getUTCDate() - days);
    const iso = d => d.toISOString();
    const body = {
      collections: ['sentinel-2-l2a'],
      datetime: `${iso(start)}/${iso(end)}`,
      bbox: [lon - 0.01, lat - 0.01, lon + 0.01, lat + 0.01],
      limit: 20,
      query: { 'eo:cloud_cover': { lte: maxCloud } },
      sortby: [{ field: 'datetime', direction: 'desc' }]
    };
    const r = await fetch('https://stac.dataspace.copernicus.eu/v1/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/geo+json' },
      body: JSON.stringify(body)
    });
    if (!r.ok) return res.status(502).json({ error: 'Copernicus STAC request failed', status: r.status });
    const data = await r.json();
    const items = (data.features || []).sort((a,b) => new Date(b.properties?.datetime || 0) - new Date(a.properties?.datetime || 0));
    return res.status(200).json({
      source: 'Copernicus Data Space Ecosystem',
      satellite: 'Sentinel-2',
      product: 'Sentinel-2 Level-2A',
      count: items.length,
      search_days: days,
      max_cloud_cover: maxCloud,
      items: items.map(x => ({
        id: x.id,
        date: x.properties?.datetime,
        cloud_cover: x.properties?.['eo:cloud_cover'] ?? null,
        collection: Array.isArray(x.collection) ? x.collection[0] : (x.collection || 'sentinel-2-l2a'),
        assets: Object.keys(x.assets || {}),
        geometry: x.geometry || null
      }))
    });
  } catch (e) {
    return res.status(500).json({ error: 'Sentinel-2 integration error' });
  }
}