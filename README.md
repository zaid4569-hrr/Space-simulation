# ORBITAL COMMAND

ORBITAL COMMAND is a browser-based mission-design game for students and beginners. Players choose a destination, assemble a simplified spacecraft, balance modeled budget/mass/power constraints, respond to an operations event, and compare an alternate build. NASA facts and imagery add real mission context; game parameters are explicitly labeled as simulated.

> This is an educational game, not a trajectory design, flight readiness, or spacecraft specification tool.

## Screenshots

- Home and destination selector: `docs/screenshots/home.png` (placeholder)
- Spacecraft design: `docs/screenshots/design.png` (placeholder)
- Mission debrief: `docs/screenshots/report.png` (placeholder)

## Features

- Earth orbit, Moon, and Mars destination briefings with cited NASA fact sheets.
- NASA Image and Video Library imagery, with local offline samples and attribution.
- Optional API adapters for current APOD feed, EONET v3, and EPIC.
- Live resource ledger, mission event decision, seeded results, and what-if comparison.
- One-click 88-second guided Judge Demo with manual next, pause, skip, and exit.
- Local cache and production service worker for repeat-visit offline play.
- Responsive layout, keyboard focus states, reduced-motion support, and error boundaries.

## Quick Start

Requirements: Node.js 20.19+ or 22.12+ and npm.

```sh
npm install
npm run dev
```

Open the URL printed by Vite, usually `http://localhost:5173`.

## Environment Setup

The implemented public sources do not require a key. If a future integration uses `api.nasa.gov`, copy `.env.example` to `.env.local` and set `VITE_NASA_API_KEY`. Vite embeds `VITE_*` variables into client code, so this is public, not a secret. A browser-only app should prefer no-key sources; use a small serverless proxy only if a private credential becomes necessary. Never commit `.env` files.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start local Vite development server |
| `npm run build` | Run strict TypeScript build and production bundle |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run Oxlint |
| `npm test` | Run Vitest unit & component test suite |
| `npm run test:e2e` | Run Playwright end-to-end and offline test suite |

## Judge Demo

Select **Judge Demo** on the home screen. It plays a fixed Mars build and seed through briefing, build trade-offs, launch, event, decision, result, what-if comparison, and NASA data. Automatic steps take about 88 seconds total. Use **Next step**, **Pause/Resume**, **Skip to result**, or **Exit demo** at any time. The demo does not depend on a live NASA request.

## NASA Data and Game Models

See [NASA data sources](docs/NASA_DATA_SOURCES.md) for endpoints, caching, citation, and API notes. The `REAL NASA DATA` badge marks sourced facts; `GAME-SIMULATED` marks costs, mass, power, probabilities, reliability, scores, and outcomes. The bundled planetary values are static and cited. Current live NASA imagery is optional and may be replaced by a clearly labeled offline sample.

## Game Mechanics

Choose a bus, power subsystem, antenna, and science instruments. Resource values are summed from selected equipment. The mission is blocked when cost exceeds 780 credits, modeled mass exceeds 301 kg, or power demand exceeds supply. The core spacecraft bus is required. Those limits and all equipment values are game balance values.

The score starts at 25, adds 0.8 points per science point, up to 12 points from power margin, up to 12 from communications, and subtracts 28 for each violated limit. It is clamped to 0–100. The science-priority decision adds 8 points; reserve-protection adds 4. A score of 65 or more with zero limit violations is a game success. The seeded simulation deterministically selects a dust-front or communications event. It does not model a real trajectory or risk calculation.

## Offline and Deployment

The game’s facts, media, mission design, simulation, and report are bundled or locally cached. The service worker is registered for production builds and caches the application shell and fallbacks on first successful visit. Live NASA data needs connectivity and falls back to saved samples. To deploy, run `npm run build` and publish the `dist/` directory to a static host with SPA fallback to `index.html` and HTTPS. Test offline using a production preview, not only the dev server.

## Technologies Used

React 19, TypeScript 6 strict checks, Vite 8, browser Fetch/AbortController, localStorage, and a small service worker. No runtime UI, map, or chart dependency is required.

## Performance Snapshot

Measured with `npm run build` in this workspace. The generated Vite starter baseline was 69.27 KB gzip JavaScript. The completed app is 77.80 KB gzip for the main chunk plus a lazy 3.99 KB NASA panel chunk (81.79 KB combined JS); CSS is 6.52 KB gzip. The panel is code-split, images are lazy-loaded, and NASA Image Library renditions use `srcset` candidates capped at 1280px. Bundled JPEG samples are approximately 77 KB Earth, 64 KB Moon, and 34 KB Mars.

## Known Limitations

- This MVP offers one simplified mission scenario and a compact equipment catalog.
- Current APOD replacement, EPIC, and EONET adapters exist but are not required by the primary game screens; only destination imagery is fetched in the MVP UI.
- NASA service quotas for Image Library, EPIC, and EONET are not published as a single fixed quota; calls are cached and infrequent.
- The first visit must load the app shell before the service worker can make a later visit available offline.
- NASA image reuse requirements and any third-party rights vary by asset; retain item-level credits and check the linked NASA media guidance.

## Future Improvements

Add focused calculation/service tests, an instructor-led classroom mode, more destinations after fact review, a GIBS layer only if a real map adds value, and a proxy only if a private API credential is required.

## Attribution

NASA data is linked at point of use. Image credits are provided by each Image Library record or source page. NASA imagery acknowledgment guidance: [NASA media usage guidelines](https://www.nasa.gov/nasa-brand-center/images-and-media/).