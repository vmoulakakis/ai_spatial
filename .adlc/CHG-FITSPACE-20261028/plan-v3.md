# CHG-FITSPACE-20261028 — Execution Plan V3
## Baseline
PR #2: rectangle solver, SVG 2D/isometric 3D, Playwright 320/390/768/1440. Preserve existing flow and domain boundaries.
## P0.1 — Implemented reviewable slice
- Experimental integer-centimetre polygon vertex layer: L-shaped room with exact area/perimeter, edge lengths, vertex changes, self-crossing validation, undo/redo and stale AI guard.
- Separate mobile polygon preview route: 2D and isometric 3D from same geometry with manual coordinate inputs and conservative footprint preview (`NEEDS_CONFIRMATION`).
- TypeScript/17 unit test assertions. Run hosted Chromium E2E and record results before signing off.
## P0.2 — Geometry contract solver (mandatory before production)
- Graph vertex IDs and edge IDs, confirmed lengths and angles, source/tolerance/provenance and revision; moving an endpoint must not silently invalidate a confirmed edge length.
- Detect over-constrained systems; visible resolution, last consistent geometry, no guessed metric coordinates.
- Add doors/openings, room holes, obstacles, wall thickness and mobility/door-sweep envelopes. Adopt pinned robust-predicates and polygon-clipping after tests, no blind imports.
- Mobile accessible direct manipulation with touch pointers, snapping, drag undo transaction, keyboard equivalent.
## P0.3 — 3D preview/renderer
- Adopt pinned Three.js + Earcut only for validated polygons; same revision, lazy load, GL unavailable -> SVG fallback, dispose resources.
- CI unit/property + browser 320/390/768/1440 + keyboard + low-end performance; real mobile device and independent review.
## P1 — AI benchmark, not installed
- Compare commercial-friendly `facebook/map-anything-apache` and `depth-anything/DA3-BASE`, segmentation candidates separately; ground-truth 30–50 rooms, P50/P95 dimensional error, false-safe rate, GPU cost, coverage, uncertainty and privacy consent.
## Release gate
No `FITS_VERIFIED`, metric confidence claim or production deployment until calibration, verified constraints/clearances, privacy, CI, accessibility and independent physical measurement QA pass.
## Scope
Only `vmoulakakis/ai_spatial`. Never add shopping, pricing, checkout, merchant feeds, Awin, affiliate tracking or modify other repos.
