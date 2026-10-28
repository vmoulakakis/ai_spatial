# ADLC — V5 CAD Designer Direct Manipulation

## Intent
User explicitly rejected the add-one-wall form as the principal UX. Replace that interaction with direct manipulation in a desktop/mobile CAD drawing workspace: move points and full wall bodies, live side dimensions, precise cm editing, locks, drag undo, responsive touch controls. Keep all previous editors intact in the review branch.

## Specification and tests
- S1: Any selected corner has visible touch hit area, accessible keyboard equivalent, editable X/Y cm and immediate adjacent dimension labels on every pointermove.
- S2: Dragging an edge slides the wall orthogonally, preserves that edge's own length, updates the neighboring edges and room area, commits once on pointerup.
- S3: Explicit locks on points and edges protect measured dimensions. Local constrained moves can project onto locked circles; impossible lock combinations reject, and all graph polygons must remain simple and non-degenerate.
- S4: Numeric length edit changes one designated endpoint and rejects impossible topology or non-target lock violations; undo/redo restores all locks and coords.
- S5: 2D and 3D read one shared graph; 3D is explicitly isometric SVG until separate reviewed WebGL implementation.
- S6: Mobile first, small 320px layout with overlay inspector; no horizontal body overflow. QA at 320/390/768/1440; correct touch input and Playwright screenshots.
- S7: local-only JSON export; no photo capture, AI CV processing or claims of certified measurement.

## Plan
1. Implement deterministic `packages/geometry-core/designer.ts` graph operations and independently test geometry invariants.
2. Ship `apps/web/designer.html` + `designer.ts` direct UI, side dimensions and pointer transaction preview, link as primary CAD action from main workspace.
3. Run existing three editor suites and new fourth browser suite under GitHub Actions, inspect screenshot artifacts, correct regressions.
4. Deploy **protected preview only** from V5 branch, verify exact SHA + HTTP endpoints; no merge or production promotion.
5. Later P1: multi-source calibrated constraints with measured bearings and room openings, plus photogrammetry capture agent benchmarking. P2: semantic furniture removal and 3D furnishing; separate consent, model license and privacy audits.

## Review blockers
Hardware touch validation, independent physical benchmark, real WebGL, angular/orthogonal global constraints, full photo scan and digital-furniture system remain out of scope. No claim `FITS_VERIFIED`. No other repositories or commerce edits.