# FitSpace AI V4 — Point-to-point manual room measurement

Status: implementation in draft PR; NOT a general constrained-room solver, metric device scanner, or production fit certification.
Scope: `vmoulakakis/ai_spatial` only. No affiliate, price, merchant, checkout or Awin.

## User flow
1. Open `/apps/web/measure.html`. Empty workspace starts with point A=(0,0); **there is no default fictitious room size**.
2. Enter a measured length in cm to add A→B, then add the relative turn for the next wall (e.g. +90° for left, -90° for right). This places successive labeled points without manual X/Z coordinate entry.
3. If a direction is assumed, **leave angle unconfirmed**. If truly measured, explicitly confirm. First wall defines a reference heading, not geographic north.
4. Inspect the 2D path or shared-model isometric 3D. Choose a wall by its list or touch/keyboard point selection, and edit length/turn. Recompute all downstream coordinates from stored measured constraints. No other length or turn is silently changed.
5. To close the room, physically measure the return wall and enter its **independent** length. Set discrepancy tolerance (a conflict threshold, NOT an accuracy estimate). Only valid, non-self-intersecting polygons within closure tolerance receive derived area/perimeter. Conflicts are shown, not auto-repaired.
6. Undo/redo are monotonic revision transitions; local-only browser persistence. Example L-room provided for demonstration (9.72 m², 13.60 m perimeter), clearly not a scanned room.

## Deterministic contract
- Input: ordered segments with IDs, measured `lengthCm`, relative `turnDeg`, `angleConfirmed`, origin, revision, plus optional independently measured closure length/tolerance.
- Output: single scene revision, coordinates in cm, error residual, closure conflicts, area/perimeter only after validity gate.
- Exact measured input values are immutable **unless a user edits that particular wall**; all downstream coordinates may shift.
- Last consistent closed model is retained in the store for review, never substituted for an active conflicting scene or used as a verified fit verdict.
- No physical-fit assertion, no cloud uploads, no AI correction of user-locked values.

## Limitations and gates
- Sequential wall-chain parameterization, not a general graph/least-squares solver. Nonconsecutive anchors, measured diagonal braces, true corner handle dragging, multiple rooms, wall thickness and openings require the next geometry layer.
- Only manually entered scalar lengths/relative turns; angles are not deduced from an image. A matching closing length alone does **not** prove angles, obstacle positions, true scale accuracy or room construction geometry.
- The isometric 3D view remains SVG, not Three.js. Do not label a 3D preview as a measured scan.
- P1 AI photos: explicit consent; coverage and blur quality; MapAnything/DA3 benchmark on measured test rooms; ground-truth calibration; revision-safe proposals.
- P2 clearing furniture: segmentation masks + per-photo inpainting are visually synthetic, never proof of geometry behind occlusions; geometry object removal only after review. P3 furnishing uses dimensioned GLB models, materials, colors and conservative collision checks. No commerce integration.

## Verification
- `npm run check`, `npm test` (including `tests/measurement.test.mjs`), and `npm run browser:test` (adds `measurement.browser.e2e.mjs` 320/390/768/1440).
- CI evidence links must be added after GitHub-hosted run. The sandbox Chromium browser may be blocked by enterprise URL policy; never claim a successful visual QA without a passing run.