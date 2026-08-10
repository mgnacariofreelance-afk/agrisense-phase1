# Agrisense Phase 1

Agrisense Phase 1 is a mobile-first Farmer View proof of concept for AI-assisted precision agriculture.

## Current scope

- Farmer View PWA foundation
- Farm records and editing
- GPS farm boundary presentation and remapping workflow placeholder
- Area/hectare display
- Crop cycle and rice variety records
- Punla, transplanting and harvest dates
- Crop age calculation
- Field observations and editing
- Farm Intelligence UI
- Real NASA POWER daily weather connector
- Real Copernicus Data Space Sentinel-2 Level-2A catalog connector
- Live Earth-data test from the phone GPS
- Local browser persistence

## Live Earth-data test

Open **Farm Intelligence** and choose **Use phone GPS & load data**. The PWA sends the device location to its Vercel serverless API routes, which retrieve:

- NASA POWER daily agroclimatology data
- Copernicus Data Space Ecosystem Sentinel-2 Level-2A catalog metadata

The current test intentionally uses the phone's GPS **point**, not the full farm polygon. This proves the external-data pipeline without pretending that a GPS point is a completed farm boundary. The next mapping step will replace this with the farmer's walked pilapil polygon.

## Data integrity

Agrisense does not fabricate satellite or weather observations. Source, date, and location are retained in the live-data response. AI interpretation is not enabled yet; external observations must be retrieved first and validated before being used for agronomic recommendations.

## External data sources

- NASA POWER Daily API: https://power.larc.nasa.gov/docs/services/api/temporal/daily/
- Copernicus Data Space STAC: https://documentation.dataspace.copernicus.eu/APIs/STAC.html

## Status

Proof of concept / development phase. Do not treat the displayed satellite/weather data as an agronomic diagnosis or field recommendation.
