# FitSpace AI — Design contract

Greek-first, mobile-first, calm, engineering-grade spatial editing. One task per step, not a lengthy shopping landing page.

## Core user flow
1. Start: Camera, photos, or manually drawn floor plan; understandable privacy choice.
2. Guide: Adaptive prompts for missing corners, wall/floor boundaries, occlusions and reshoots. Do not mandate a fixed photo count.
3. Calibrate: User-confirmed measured reference or compatible hardware depth. Explicitly mark unscaled scenes as qualitative.
4. Review: Unified 2D plan and 3D scene sharing identical geometry and revision.
5. Correct: Tap any wall, opening, obstacle or placed product dimension; enter centimetres or move handles.
6. Recalculate: Show changed lengths, floor area, layout, clearances and fit verdict, or explicitly resolve conflicts.
7. Export: Allow an understandable plan with uncertainty labels and provenance.

## Controls and quality
- Dimensions tagged Estimated / Calibrated / Confirmed / Conflict.
- No false precision or silent modification of user-confirmed measurements.
- Undo/redo; accessible keyboard alternatives to gestures and dragging.
- Reduced motion; lightweight fallback for low-end phones and 3D-disabled browsers.
- Geometry conflicts and outdated asynchronous results are handled explicitly.
- Never include affiliate, checkout, sales or merchant views in this repository.

QA: orientation, camera denied, upload error, obscure corner, incomplete scan, anchor correction, 2D/3D agreement, screen readers.