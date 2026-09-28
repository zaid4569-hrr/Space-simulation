# NASA Data Sources

Endpoints and status checked on **September 28, 2026**. NASA service schemas, availability, and terms can change; review the linked provider docs before a public release.

| Source | Endpoint and auth | Use in ORBITAL COMMAND | Limits, cache, and fallback |
|---|---|---|---|
| NASA Image and Video Library | `https://images-api.nasa.gov/search`; item assets at `https://images-assets.nasa.gov/`. No API key in the documented search flow. | Destination imagery in briefing and report. Fixture images are verified NASA Image Library small/thumbnail renditions with item-specific credits. | No single fixed request quota published in the API docs; app caches metadata for 7 days and does not poll. Bundled JPEG sample per destination. Docs: [NASA Image Library API PDF](https://images.nasa.gov/docs/images.nasa.gov_api_docs.pdf). |
| APOD replacement feed | `https://science.nasa.gov/wp-json/wp/v2/apod-basic?page=1&per_page=1`. No key in the current guide. | Optional space fact adapter (`getSpaceFact`); not used by the primary mission flow. | Request quota is not documented in the feed guide; cache if enabled. The NASA API portal says the legacy `api.nasa.gov/planetary/apod` API will be archived on Dec 1, 2026; this project does not call that legacy endpoint. Docs: [APOD Basic JSON guide](https://schlotterer.notion.site/APOD-Feed-And-API-User-Guide-39697d8747c38015a53edfdde76d4f5e), [NASA API portal notice](https://api.nasa.gov/). |
| EONET v3 | `https://eonet.gsfc.nasa.gov/api/v3/events?limit=8&days=14`. No key documented. | Optional Earth-observation context adapter (`getEonetEvents`); events are not presented as Mars hazards. | No fixed public quota listed in v3 docs; request sparingly and cache. The documented current version is v3; v2.1 is deprecated and not used. Docs: [EONET v3](https://eonet.gsfc.nasa.gov/docs/v3). |
| EPIC | Metadata: `https://epic.gsfc.nasa.gov/api/natural`; date image archive: `https://epic.gsfc.nasa.gov/archive/natural/{yyyy}/{mm}/{dd}/jpg/{image}.jpg`. No key documented for direct service. | Current Earth image adapter (`getEarthImage`) for Earth orbit destination. | No fixed quota published in the EPIC API guide; metadata is cached by destination. Offline Earth-orbit sample is from the NASA Image Library, not mislabeled as current EPIC. Docs: [EPIC API](https://epic.gsfc.nasa.gov/about/api). |
| Planet facts | [NSSDC metric fact sheets](https://nssdc.gsfc.nasa.gov/planetary/factsheet/) and item fact sheets for [Earth](https://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html), [Moon](https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html), and [Mars](https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html). | Static destination facts for distance, gravity, day length, and environment; every destination links to its specific fact sheet. | Bundled static JSON; update values and citations by review rather than depending on a live fact-sheet API. Units and definitions follow NSSDC’s linked fact-sheet notes. |
| GIBS | WMTS base: `https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/`; WMS base: `https://gibs.earthdata.nasa.gov/wms/epsg4326/best/wms.cgi`. | Not integrated into the MVP interface. Kept out because this app has no map workflow. | No key shown in documented service pattern; no simple fixed quota cited here. Do not add full tile maps unless that workflow earns its complexity. Docs: [GIBS access basics](https://nasa-gibs.github.io/gibs-api-docs/access-basics/). |

## Current Use

Only Image Library search and EPIC are called by the MVP panel, selected according to destination. APOD and EONET adapters are implemented but intentionally remain optional and are not on the critical user path. GIBS is documented but not integrated. All supported user experiences work with bundled content and no API key.

## Authentication and Rate Limits

The NASA API portal currently documents default `api.nasa.gov` key limits of 1,000 requests/hour. `DEMO_KEY` is limited to 30 requests/hour/IP and 50/day/IP. Those quotas apply to `api.nasa.gov`; they should not be projected onto other NASA hostnames. Current application endpoints above do not use `api.nasa.gov` or require a key. If one is added, a `VITE_NASA_API_KEY` value is visible to every browser user; use it only for a public-rate-limit-safe key, otherwise add a small serverless proxy. No credential is committed.

## Attribution and Asset Use

Each live image uses the NASA Image Library item details URL and provider metadata for title, date, and creator where supplied. Offline fixture images link to the corresponding item record. NASA media reuse is not a substitute for checking item-level credits, third-party copyright notes, or [NASA image/media usage guidance](https://www.nasa.gov/nasa-brand-center/images-and-media/). Retain attribution in the UI and presentation. Do not remove credits when compressing or replacing an image.

## Real Data Versus Simulation

`REAL NASA DATA` is reserved for fact-sheet values and source-linked NASA imagery/observations. `GAME-SIMULATED` marks all hardware/catalog values, cost, mass, power, communications points, probability, score, and outcomes. An Earth event from EONET must remain Earth-observation context and must not be relabeled as a Mars mission event. The scenario’s crisis event is generated by the deterministic game seed.