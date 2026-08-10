# Agrisense Phase 1 data connectors

These Vercel serverless endpoints proxy public Earth-observation data so the browser does not need to call external APIs directly.

- `/api/nasa-power?lat=15.123&lon=120.123`
- `/api/sentinel-search?lat=15.123&lon=120.123&days=30`

NASA POWER returns recent daily Agroclimatology values. Sentinel-2 searches the Copernicus Data Space STAC catalog by a small point bounding box and cloud-cover filter.

The Sentinel endpoint currently uses the phone/farm reference point. It must be upgraded to the saved farm polygon before Agrisense treats the imagery as farm-specific analysis.
