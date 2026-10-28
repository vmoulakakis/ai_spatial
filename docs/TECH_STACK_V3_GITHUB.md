# FitSpace AI — GitHub Technology Decision V3

Date: 2026-10-28. Canonical repository: `vmoulakakis/ai_spatial` ONLY.

## Decision principles
- Geometry is authoritative, rendering is derived: no 2D/3D independent geometry.
- Metric claims require measured calibration and independent validation; all demo dimensions must be labeled illustrative.
- Preserve already working no-framework TypeScript PWA. Do not migrate to React/Next.js on aesthetic grounds.
- License of the code and the exact model weights are separate checks. No unreviewed model weights or installation scripts.

## GitHub libraries / selection

| Candidate | Role | License | Decision | Rationale / gate |
|---|---|---|---|---|
| [mourner/robust-predicates](https://github.com/mourner/robust-predicates) | exact orient2d/incircle for noisy floating geometry | Unlicense | ADOPT when CV-derived real-coordinate input is introduced | Initial polygon core uses integer centimetres (< 20m), exact within JS safe integer domain; external arithmetic package not needed for this slice. |
| [mfogel/polygon-clipping](https://github.com/mfogel/polygon-clipping) | polygon union/intersection/difference | MIT | ADOPT for obstacle envelopes & voids | Exact installed version, regression and benchmark required before physical fit gating. |
| [mapbox/earcut](https://github.com/mapbox/earcut) | triangulation for 3D meshes | ISC | ADOPT for WebGL mesh slice | Does not validate invalid polygons; call only after validity tests. |
| [mrdoob/three.js](https://github.com/mrdoob/three.js) | 3D viewer | MIT | ADOPT incrementally | Lazy-load with GPU capability detection and SVG fallback; shared geometry remains external to renderer. |
| [konvajs/konva](https://github.com/konvajs/konva) | touch-friendly 2D editor | MIT | DEFER | Current native SVG supports keyboard and touch; benchmark accessibility, payload and drag stability before replacing. |
| [pmndrs/react-three-fiber](https://github.com/pmndrs/react-three-fiber) | React wrapper for Three.js | MIT | NOT NOW | React 19 requirement for current v9; existing app is vanilla TypeScript, migration unrelated to P0 geometry. |
| [facebookresearch/map-anything](https://github.com/facebookresearch/map-anything) | multi-view reconstruction | Apache 2.0 code; checkpoint-dependent | P1 BENCHMARK ONLY | Use `facebook/map-anything-apache` (Apache 2.0); standard weights CC-BY-NC 4.0 unsuitable for unlicensed commercial use. |
| [ByteDance-Seed/depth-anything-3](https://github.com/ByteDance-Seed/Depth-Anything-3) | multi-view depth/pose | checkpoint-dependent | P1 BENCHMARK ONLY | `depth-anything/DA3-BASE` card says Apache 2.0, relative depth. It does not prove real metric cm without calibration. |

**License caveat:** Reverify license/release of every pinned dependency at install time and maintain an attribution/license inventory. This matrix documents candidates, not a claim that their code is installed. The initial polygon core deliberately adds zero external runtime dependencies.

## What was implemented in this review branch
- `packages/geometry-core/polygon.ts`: integer-centimetre L-shaped room vertices, validity/self-crossing tests, area/perimeter/edge derivation, geometric footprint preview, revision-safe AI guard, undo/redo.
- `apps/web/polygon.html` + `polygon.ts`: Greek-first mobile 2D/3D shared geometry preview; input coordinates and touch/keyboard vertex choice. No image input or AI depth.
- Tests cover L-shape 9.72 m², 380 to 360 cm edit, nonintersection, safe incomplete fit, stale proposals, undo/redo.

## Strict limitations
- Experimental arbitrary coordinate polygon editing is NOT yet the full globally constrained graph solver. Confirmed vertex coordinates are preserved on other edits but confirmed *edge lengths* are not protected. Full solver must introduce explicit edge-length anchors and visible conflict resolution before production.
- No arbitrary polygon-based `FITS_VERIFIED` or production clearance. Preview status always `NEEDS_CONFIRMATION`; obstacles/openings and delivery path not implemented.
- 3D polygon preview is still shared-data SVG isometric, not WebGL; Three.js / Earcut are selected but not installed in this vertical slice.
- Camera, CV inference, consented image storage, true calibration, tenant API, native scan and benchmarks are unimplemented.

## Next branch implementation contracts
1. Polygon graph v2: immutable vertices + edges, measured edge lengths and angles, lock provenance, least-squares candidate with explicit inconsistent locked-edge blocking; no silent anchor overwrites.
2. Fit adapter: tested polygon-clipping for cutouts, obstacles, sweep and clearance envelopes; conservative status.
3. Three.js renderer + Earcut triangulation of VALID polygons; same scene revision, lazy loader, WebGL fallback, disposal and device perf limits.
4. Geometry input: 2D pointer drag with snap/constraints and equivalent keyboard input; mobile 320/390/768/1440 visual QA.
5. P1 model benchmark: 30–50 measured rooms, median/P95 cm error, false-safe fit rate, inference GPU cost, licenses, privacy and consent. Never infer metric scale from uncalibrated images.

No Awin, commerce, feeds, affiliates, merchant prices or modifications to other repositories.
