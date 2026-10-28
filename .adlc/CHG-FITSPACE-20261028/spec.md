# CHG-FITSPACE-20261028 — Spatial Intelligence Specification v1
Status: Architecture for review; no deployed product implied.

## Capture and scale
1. Start session through mobile browser, PWA or authorized host widget; consented camera, image upload or manually drawn plan.
2. Ask for a full room view, then guide additional overlapping captures based on visible corners, wall/floor/ceiling joints, door/window edges, occlusions and blur. Inform user exactly what area is missing, allow skipping or retaking.
3. Evaluate image quality, parallax and coverage before attempting full reconstruction. Multiple photos can still be insufficient; expose missing coverage rather than guessing.
4. Ask for at least one trustworthy metric anchor from tape/laser measurement or independently verified known object length. Optional RoomPlan/LiDAR or compatible ARCore depth adapter may provide metric evidence. Do not presume a universally sized door or floor tile.
5. Propose 3D layout with per-measure uncertainty and origin metadata. If uncalibrated, allow qualitative layout only, not actual centimetres or definitive fit.

## Canonical scene model
- World units in metres, shown to users in centimetres.
- Entities: vertex, wall edge/plane, room polygon, opening, door sweep, window, obstacle, calibration anchor, product footprint, product clearance envelope and source image.
- Each scalar/constraint: ID, value, provenance, measured vs inferred, confidence/uncertainty, tolerance, timestamp, revision, lock state.
- One canonical geometry graph renders both 2D and 3D; do not allow view-specific dimensions to drift.

## Editable measurements and deterministic solver
- Any dimension can be selected and changed by entering cm or by moving a geometry handle (accessible keyboard equivalent required).
- On change: create new revision; lock a confirmed user anchor; solve lower-confidence related constraints; validate closure, angles, coordinates and impossible overlaps; recalculate derived geometry, area, perimeter, opening position, walkable area, object placement, safety/access clearance and product fit; rerender 2D and 3D.
- Manual corrections are authoritative only when internally consistent. When independently confirmed constraints conflict, show explicit resolution choices without overwriting either automatically.
- Maintain undo/redo and an audit trail; show before/after changes. AI can suggest adjustments but cannot numerically replace the geometry solver.
- Asynchronous CV work must be based on revision token; results from an old revision are discarded or submitted for user review, never silently merged.

## Physical-fit API (vendor-neutral)
- Input: product dimensions in cm, orientation options, clearance and use envelope, confidence/source of vendor dimensions.
- Compare real 3D/2D collisions, door swing, route accessibility, user ability to operate product, category-specific clearances.
- Output statuses: FITS_VERIFIED, FITS_ESTIMATED, NEEDS_CONFIRMATION, DOES_NOT_FIT with reasons and unresolved constraints.
- Never output FITS_VERIFIED when critical room geometry or product dimensions are unknown. Do not process prices, merchant links or transactions.

## Service boundaries
- Suggested modules: packages/geometry-core, packages/fit-rules, packages/embed-sdk, apps/web; later optional services/vision and mobile adapters.
- API candidates: POST /sessions, POST /sessions/:id/captures, POST /sessions/:id/anchors, PATCH /sessions/:id/constraints/:cid, POST /sessions/:id/recalculate, GET /sessions/:id/model, POST /sessions/:id/fit.
- SDK accepts tenant-signed session identity and style settings; it returns only purpose-scoped geometries and verdicts. Strict cross-tenant isolation, short-lived data access.
- Privacy: explicit upload consent; strip EXIF/location when not needed, private storage, signed short-lived media reads, retention limits, deletion support, no implicit model-training opt-in.

## Validation tests
A. Inferred wall 260 cm -> user measurement 240 cm: all related geometry and fit outputs recompute and share revision.
B. Single unscaled photo: no measured real-world dimensions nor definitive fit.
C. Conflicting confirmed measurements: show conflict and block unsafe verification.
D. Unknown product dimensions: NEEDS_CONFIRMATION.
E. Two host tenants: no cross-access to images or room models.
F. User corrects dimensions while AI runs: stale AI result cannot overwrite new revision.
G. No camera permission / no AR support: manual plan works.
H. Room with occluded corner: request additional angle and show missing coverage.

## Evidence
On ground-truth measured test rooms, track median and P95 absolute measurement error per capture mode, false-safe fit rate, corner coverage, manual correction burden and 2D/3D consistency. Never claim measured accuracy before device-level validation.