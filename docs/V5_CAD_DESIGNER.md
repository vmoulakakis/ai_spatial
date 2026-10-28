# FitSpace AI V5 — CAD-like live dimensional editor

**Canonical repository:** `vmoulakakis/ai_spatial`. **References:** `laanlabs/openPlan3D` and `pjm4github/FloorPlanner` are product/interaction references, not vendored libraries; no third-party dependencies added.

## User-corrected objective
The primary design task is **direct geometric manipulation**: touch and drag vertices and entire wall bodies, while the actual dimension labels drawn alongside each edge and the persistent inspector update live in centimetres. Clicking a dimension allows an exact numeric input. This is distinct from an add-wall sequential form and from an AI photo scanner.

## Implemented vertical slice
- `/apps/web/designer.html`: Greek-first desktop/mobile single-workspace editor, room canvas, side/bottom inspector, dimensions on all six sample edges, real-time X/Y and adjacent lengths, 2D geometry, optional isometric SVG preview.
- Point pointer events: live preview rendered for every pointermove and **single committed undo/redo transaction** on pointerup. Edge pointer movement: wall slides along its local normal, both endpoints move together, and the length of that wall stays constant.
- Exact inspector point X/Y and wall-length cm; toggle fixed point coordinates or fixed edge lengths. One locked adjacent edge constrains vertex drag to a circle; two locked adjacent edges constrain it to circle intersections. Impossible constraints and self-intersections reject rather than silently overwrite user constraints.
- Snap to 0.1 / 1 / 5 / 10 cm, accessible arrow-key vertex/edge adjustment and Enter to open inspector, insert/remove vertex with geometry/lock validation, zoom, pan, fit view, JSON export, local-only persistence. No network image upload.
- Geometry in centimetres, geometry validity and derived m²/perimeter from one canonical scene revision. The visual 3D is *isometric SVG*, **not** true Three.js WebGL.
- Browser QA must cover 320 / 390 / 768 / 1440 px: point drag, side inspector preview while pointer is down, numeric edge edit, locks, responsive and errors. Unit tests must include length conflicts and invariants; no certification claims.

## Limits / before P1
- This V5 editor is a local-plan editor, not a metrically calibrated scanner. The default room has **illustrative** dimensions; no actual photo accuracy benchmark.
- Corner and wall dragging are geometrically constrained by point and edge length locks. Global, multi-room nonlinear constraints (angle locks, tangent curves, robust holes/door sweeps) are not in this slice; graph locks are local.
- UI currently uses SVG, not an installed copy of openPlan3D or a Next/Svelte migration. Future Three.js renderer, LiDAR/AR capture, guided multi-angle AI photos, furniture removal, room texture inference and semantic fit require their own implementation, privacy and evaluation gates.
- Do not merge to `main` or promote production until independent review and physical measurements QA.

## Scope and security
No Awin, commerce, feeds, pricing, checkout, third-party analytics, photogrammetry uploads, or unrelated repository edits. Local-only browser persistence; no personal photo collection or cloud inference. No unsupported physical-fit certification.