export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  try {
    const body = req.body || {};
    const geometry = body.geometry;
    if (!geometry) return res.status(400).json({ error: 'GeoJSON geometry is required' });
    const start = body.start || new Date(Date.now() - 30 * 86400000).toISOString();
    const end = body.end || new Date().toISOString();
    const cloud = Number.isFinite(Number(body.maxCloud)) ? Number(body.maxCloud) : 40;
    const payload = {
      collections: ['sentinel-2-l2a'],
      intersects: geometry,
      datetime: `${start}/${end}`,
      limit: 10,
      query: { 'eo:cloud_cover': { lte: cloud } },
      sortby: [{ field: 'datetime', direction: 'desc' }]
    };
    const r = await fetch('https://stac.dataspace.copernicus.eu/v1/search', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!r.ok) return res.status(r.status).json({ error: `Copernicus STAC returned ${r.status}` });
    const data = await r.json();
    const features = (data.features || []).map(item => ({
      id: item.id,
      datetime: item.properties?.datetime || item.properties?.['start_datetime'],
      cloudCover: item.properties?.['eo:cloud_cover'] ?? null,
      platform: item.properties?.platform || null,
      processingLevel: item.properties?.['processing:level'] || 'Level-2A',
      assets: Object.fromEntries(Object.entries(item.assets || {}).filter(([key]) => ['thumbnail','quicklook','visual'].includes(key)).map(([key,a]) => [key, { href: a.href, type: a.type || null }]))
    }));
    res.setHeader('Cache-Control', 's-maxage=900, stale-while-revalidate=1800');
    return res.status(200).json({ source: 'Copernicus Data Space Ecosystem', collection: 'sentinel-2-l2a', query: { start, end, maxCloud: cloud }, count: features.length, features });
  } catch (e) {
    return res.status(500).json({ error: 'Sentinel-2 request failed', detail: e.message });
  }
}