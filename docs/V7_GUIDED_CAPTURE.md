# FitSpace AI V7 · Privacy-first Guided Room Capture

## Scope
One CAD workspace: a Capture dialog embedded in `/apps/web/designer.html`. No new disconnected demo, no merge or production promotion, and no Awin/commerce/feeds. The user explicitly starts the camera or selects local files. The photography workflow guides them to entrance/left/right/opposite and optional ceiling/floor views, with adaptive missing-view prompts. These steps are human labeled, not automatically inferred camera poses.

## Working functionality
- `packages/capture-core/index.ts`: deterministic image quality heuristic (exposure, clipping, local edge/detail score), 64-bit difference-hash to flag near-duplicates, coverage/readiness tracking, manual calibration source, corner annotations and metadata-only report. No fabricated confidence or percentage of 3D accuracy.
- `apps/web/capture.ts`: on-device camera via `getUserMedia({facingMode:'environment'})` with fall-back local file chooser and denied-camera handling; canvas analysis, safe bounded image re-encoding (max 1600px), object URLs revoked on removal or navigation, image data kept in memory (NOT localStorage, no uploading). Captured photos do not retain EXIF in re-encoded previews. No automatic cloud inference or upload endpoint.
- UI: overlay keeps V5 CAD and V6 WebGL mounted, shot guidance, quality warnings, photo strip, manual corner annotations, clear/remove controls, user-confirmed tape/laser reference to selected existing CAD wall. The manual value is applied through the existing constraint-safe `setEdgeLength` with explicit user action; a failed lock constraint is reported and does not mutate the scene.
- Export metadata and annotations, *not* images or EXIF/GPS. Camera tracks stopped when leaving the capture workflow.

## Hard limitations
No real photogrammetry, ML-powered camera pose/depth, automatic furniture removal/inpainting, occluded-wall ground truth or metric 3D reconstruction. A hamming image hash alone does not prove camera overlap or pose. Laplacian texture is a heuristic, not a calibrated blur confidence. User-tagged angles and corner markers are guidance, not computer-vision output. A manual measured anchor does not imply that photographs have an accurate metric coordinate system.

## Next ADLC gate
1. Controlled opt-in server-side inference with tenant-isolated short-lived image storage, deletion controls and GPU cost guard.
2. Benchmark pinned commercially permissible checkpoints `facebook/map-anything-apache`, `depth-anything/DA3-BASE`, segmentation models with 30–50 rooms independently measured by tape/laser. Median and P95 wall error, false-safe physical fit, camera pose and overlap success, privacy and GPU time.
3. Pose/scene proposal -> human inspection -> revision-aware merge into CAD; never overwrite locked lengths or point positions; block unsupported topology/doors/obstacles.
4. Independent physical measurement and mobile device review before metric guarantee claims.