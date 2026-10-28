# FitSpace AI — P0 implementation scope
Date: 2026-10-28 · Repository: vmoulakakis/ai_spatial only.

## Implemented in review branch
- TypeScript geometry-core: metre-based canonical axis-aligned rectangular room, 4 wall constraints, per-wall provenance/confirmation, re-solving opposite inferred walls, revision-safe AI proposal gate, explicit conflict choices, undo/redo.
- Greek-first mobile web editor: editable wall lengths (cm), object dimensions and positions, 2D SVG floor plan and 3D isometric projection from the SAME geometry revision, viewport navigation and local-only scene persistence.
- Conservative vendor-neutral footprint/obstacle/clearance evaluator with NEEDS_CONFIRMATION, DOES_NOT_FIT, FITS_ESTIMATED. It deliberately does NOT grant FITS_VERIFIED because transport/access/safety are not yet implemented.
- Installable static PWA shell and local static server with no paid dependencies or photo uploads.

## Deliberately deferred or excluded
- **P1**: camera capture, photogrammetry, MapAnything/DA3 model evaluation, scale calibration from image, uncertainty from empirical benchmarks.
- **P0 gaps**: arbitrary/nonorthogonal polygon solver, openings/door swings, continuous drag handles, true WebGL orbit scene, route feasibility, shared/session API, independent hardware QA.
- The draft implementation plan mentioned Next.js/Three.js. This first slice uses dependency-light native TypeScript ESM and SVG isometric 3D to keep deterministic calculations directly inspectable. Framework/WebGL adoption requires a separate reviewed decision and relevant QA.
- Never add commerce, merchant feeds, pricing, tracking or affiliate services to this repo.

## Verification policy
Run npm install, npm run check, npm test, npm start. CI must execute typecheck and tests on the PR head. The local environment ran 9/9 tests against an independent P0 prototype and TypeScript compiled successfully, but the PR-specific GitHub tree requires its OWN CI verification. Visual QA in available local Chromium could not proceed: its administrator URLBlocklist blocked localhost. Do not claim mobile browser QA complete until separately re-run.
