# Architecture

## Runtime Structure

```text
App (screen state, mission choices, demo script)
├── Home / Destination Briefing
├── Spacecraft Design → calculateMission()
├── Mission Simulation → seeded event + player decision
├── Report → score + what-if comparison
└── lazy NASADataPanel
    └── useNasaData → memory/localStorage cache → NASA service
                                      └──────────→ bundled fallback JSON/media
```

The game is client-side and has no backend. Simulation state remains in React state. NASA services enrich briefing/report visuals only; a NASA request can never block design, launch, or reporting.

## Source Layout

```text
src/
  App.tsx                         screen flow and deterministic demo
  App.css / index.css             design tokens and responsive styling
  components/
    DataBadge.tsx                 REAL NASA DATA / GAME-SIMULATED labels
    ErrorBoundary.tsx             app-level recovery UI
    NASADataPanel.tsx              lazy NASA imagery, status, fallback
    OfflineIndicator.tsx           global network/fallback state
  hooks/useNasaData.ts             cache-first state and live revalidation
  services/nasa/
    nasaClient.ts                  host allowlist, timeout, bounded retries
    cache.ts                       versioned memory + localStorage cache
    nasaService.ts                 typed response guards and normalizers
  main.tsx                         production service-worker registration
public/
  fallback/                        static facts, source metadata, images
  sw.js                            app-shell runtime cache
docs/
  ARCHITECTURE.md
  NASA_DATA_SOURCES.md
  PITCH.md
```

## NASA Data Flow

1. The lazy panel requests an image by destination through `nasaService`.
2. `nasaClient` enforces HTTPS and an allowlisted NASA hostname, applies an 8-second abort timeout, retries transient network/429/5xx failures at most twice, validates JSON content type, and runs a source-specific shape guard.
3. A successful normalized response is written to an in-memory cache and versioned localStorage cache. Cache TTL is seven days for destination image metadata.
4. A cached item renders immediately while a refresh occurs. If the request fails, stale cached data remains available; otherwise the destination fixture JSON and locally bundled media render.
5. Cache, fallback, and live source states appear in the panel. Failure never affects mission state.

The cache prefix is versioned (`orbital-command:nasa:v1:`). Invalid JSON, unavailable storage, quota errors, and shape mismatch are treated as cache misses. Bundled fixtures are validated before rendering. External image and citation URLs must be HTTPS URLs on an expected NASA hostname; only app-local `/fallback/media/` paths are accepted as relative image URLs.

## Mission State and Mechanics

Selected equipment is the source of truth. Cost, mass, power draw/supply, science points, and communications points are calculated by summing the selected catalog entries. The core bus is required. The build is launchable at the exact limit and rejected only when a strict `>` overflow occurs.

The game score is `clamp(round(25 + 0.8 × science + min(12, 0.5 × powerMargin) + min(12, 0.24 × communications) − 28 × violations), 0, 100)`. The decision bonus is +8 for science priority and +4 for reserve protection. Success requires score ≥65 with no resource violations. The event type and event probability are game-authored, not NASA observations or operational forecasts.

## Offline Behavior

The app shell and static facts, media metadata, and images are pre-cached by the production service worker. Runtime same-origin assets are cached after successful requests. Live NASA calls are skipped only when network is unavailable at the browser level; a remote endpoint timeout or error falls back to cache/sample. First-visit offline use requires a prior successful load so the service worker has installed.

## Errors and Accessibility

The root app is wrapped in an error boundary. The NASA panel has its own bounded lazy import boundary. Fetches are aborted on unmount. App-level online/offline listeners and timer intervals are cleaned up. All actions are buttons or links, with keyboard focus styles, status announcements, reduced-motion rules, and responsive touch-size controls.