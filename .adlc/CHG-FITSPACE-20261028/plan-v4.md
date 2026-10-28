# CHG-FITSPACE-20261028 — V4 Point-to-Point Spatial Capture Implementation Plan

Scope boundary: only `vmoulakakis/ai_spatial`; review branch; no merchant feeds, affiliate services, marketing, or external production deployment without the relevant gates.

## P0-A (implemented for review)
- Dedicated `/apps/web/measure.html`: sequential A→B→C measured wall input, corner angle entry with explicit confirmation state, generated points and touch/keyboard selection, reversible editing, visual closure-conflict resolution.
- Pure TS `packages/geometry-core/measurement.ts`: deterministic chain solver with immutable per-wall lengths/turns, relative bearing transforms, independent closure measurement and mismatch tolerance, self-intersection/area gate, immutable history and last-consistent snapshot.
- Shared-canonical 2D/3D SVG visualization and local-only persistence; main app deep link, PWA offline cache, separate current V3 workspace preserved.
- Tests: numerical L-shape, 380→320 correction, retained locked measurements, closure conflict, topology and undo/redo; browser E2E 320/390/768/1440.

## P0-B: general solver (not implemented)
- Nonconsecutive distance/angle anchors and arbitrary vertices; rank/DOF analysis; conflict-resolution UI that preserves all measured locks; controlled least-squares ONLY for explicitly uncertain estimates.
- Doors, windows, wall heights/thickness, openings, holes, cutouts, obstacle collision; real 3D Three.js rendering after licensing and device-budget validation. Direct point dragging must not invalidate confirmed anchors.

## P1: calibrated photo-guided capture (not implemented)
- Consent, encryption, deletable retention, tenant isolation; images with EXIF redaction, provenance and revision tokens.
- Coverage-quality/occlusion classifier proposes next viewpoint adaptively (not fixed photo count); calibration anchor measured in cm or supported hardware depth.
- Benchmark MapAnything Apache and DA3-BASE on 30–50 ground-truth rooms: median/P95 cm error, angle/coverage, false-safe-fit rate, GPU cost. Model outputs never override manual measurements.

## P2: visual empty-room and P3: redesigned furnishing (not implemented)
- Explicitly separate object detection/segmentation + inpainting of occluded pixels from geometry truth. Preserve source photos, visibly mark synthesis, support undo.
- GLB furnishings with trusted dimensions, material/color tuning, scale-consistent placement, clearance and delivery-route checking. No pricing or affiliate tracking.

## Release gates
Current V4 is a testable manual vertical slice only. CI and browser QA required, independent QA/review, physical room measurement comparison, privacy validation before any truthful accuracy or production-readiness claim. Avoid automatic merging or production domain updates.