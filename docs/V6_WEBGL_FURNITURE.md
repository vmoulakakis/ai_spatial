# FitSpace AI V6 — On-demand Three.js 3D + editable furniture

**Single repository** `vmoulakakis/ai_spatial`, stacked onto V5 CAD branch. No other project modified.

## Engineering contract

- The **2D CAD `DesignerScene` remains canonical**. Its `points` are centimetres and its height is cm. The WebGL model is a derived, disposable view of the same revision; no geometric data are reconstructed from pixels or a separate manual 3D mesh.
- On switching to **3D**, dynamically import a bundled, locally served Three.js scene. The default 2D editor remains SVG and the 3D import is not downloaded until selected. Build-time dependencies: pinned `three@0.186.1` and `esbuild@0.25.12`; no runtime CDN.
- Create the validated polygon floor using `THREE.ShapeGeometry`, including concave L-shaped floorplans. Derive every wall box length/position/bearing from the canonical vertex list, with room height as a shared value. No invented openings/windows or room scans.
- `OrbitControls`: orbit, touch pinch zoom, pan. Dispose canvas, geometry, materials, RAF and observer on 3D → 2D. Fall back to honest isometric SVG if WebGL2 unavailable.
- `packages/geometry-core/furnish.ts` stores user-editable centimetre footprints. Three furniture archetypes (`sofa`, `table`, `desk`) are **stylized example meshes**, not manufacturer CAD models. Edit X/Z in cm, width, depth, height, rotation and color; drag objects on the 3D floor; remove or undo/redo. Do not imply imported catalog goods or exact real-world dimensions.
- Conservative footprint checks reject placements outside a concave room and intersections/overlaps. This is a **2D floor footprint prototype**, not a validated physical-fit verdict. Doors, swing, obstructions, clearance envelopes, structural accuracy and delivery access are not yet modeled.
- Furniture storage is local-only in browser `localStorage`, under a distinct V6 key. No photo upload, API credentials or new personal data integrations. Preserve original V5 room data and user revisions.
- 2D CAD editing may invalidate an existing furniture location; show a visible warning instead of silently moving or deleting it. A later release needs a more general constrained multi-room graph solver.

## Test and release gate

- Existing V5 CAD geometry and prior P0/V3/V4 tests must continue passing.
- Add unit tests covering concave room placement, geometry dimensions, color/rotation, overlap, invalid outside placement, undo/redo and room revision invalidation.
- Hosted Chromium verifies WebGL renderer and main furniture controls on desktop and mobile (with software WebGL flags), with screenshot evidence. If browser hardware denies WebGL2, return accessible SVG fallback without pretending to render 3D.
- Keep PR **draft**, Vercel deployment **preview**, no merging to `main` or production promotion. Independent device/GPU/accessibility review required.

## Future work (not in V6)

True multiroom constraint solving, hole triangulation/openings/doors, calibrated photo-guided capture with MapAnything/DA3 benchmarking, semantic furniture masking/removal from user photos, PBR catalog glTF assets, realistic inpainting of original photos and quantified physical-fit safety. Model inference requires consent, validated licenses, privacy controls, datasets and a separate deployment plan.