# CHG-FITSPACE-20261028 — V6 Real WebGL spatial view

**Intent:** User said continue from the point-and-drag CAD after confirming the desired behavior. The next deliverable is a **real interactive 3D** view and locally editable example furniture using the same canonical centimetre measurements.

**Architecture:** Keep current SVG CAD (V5) intact. Add pinned Three.js and build-time esbuild for an optional `/apps/web/three-viewer.bundle.js`; render only upon entering 3D. Derived floor mesh, derived wall boxes with shared height, `OrbitControls`, graceful fallback and full GPU resource teardown.

**Domain:** `packages/geometry-core/furnish.ts` contains cm footprints, room containment, overlap rejection, roundtrip edit, undo/redo. Three sample models are deliberately stylized, not from product feeds. Validate the original room before using the geometry.

**Acceptance:** Existing 2D point/wall movement, live dimensions, locks and JSON export preserved; switch 3D→2D→3D without WebGL context leaks. Furniture has editable X/Z, cm dimensions, rotation/color; drag creates a single committed action. Browser screenshot and interaction tests at mobile 390 and desktop 1440; unit regression suite remains green.

**Security/scope:** No AI camera, photogrammetry accuracy claims, uploads, commercial links, outside repository or production promotion. Review after CI.