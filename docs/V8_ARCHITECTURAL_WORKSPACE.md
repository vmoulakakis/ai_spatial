# FitSpace AI V8 — Photos → Clean → 2D / Elevation / Section / 3D → CAD

**Project:** vmoulakakis/ai_spatial, stacked on V7 draft. No merchant/Awin integration, no production promotion.

## User flow
1. Import any 1–6 photos from local files, not mandatory viewpoints. They are compressed and EXIF stripped *in the browser*; never written into Git or localStorage. Only consented photos are transmitted to the OpenAI API via the backend.
2. Clean **the selected photograph** with the OpenAI Images Edit API (one explicit billable call per image). The original remains independently visible. Inpainting is NOT a ground-truth observation of occluded architecture.
3. Analyze the selected multi-view originals in one Responses API vision call. This is *qualitative*: detect apparent alcove, overhead beam/soffit, radiator, floor/door and uncertainties. Never return/photo-infer metric numbers. A failed/no-key API shows a clear unavailable message.
4. The app provides a separately labeled **illustrative** editable architectural CAD model with floor plan, frontal elevation, longitudinal section and real Three.js WebGL 3D. One canonical parameter store drives all of them. Parameters: left/right returns, alcove width, front/alcove depth, ceiling height, beam drop/depth, radiator width/height. Changes are immediate, undoable and validated; user can explicitly tag actual measured values as locked.
5. Deliberate transfer to existing CAD 2D drag editor via sessionStorage on the same origin, with confirmation that it replaces an existing draft. Because the generic CAD editor stores plan-only geometry, the beam/radiator remain editable in the architectural workspace; do **not** falsely claim complete cross-view architectural feature syncing after handoff. JSON exports are metadata/geometry only; no photo pixels.

## Provider configuration
Use Vercel environment variable `OPENAI_API_KEY` (server side, **Preview**). Optional: `FITSPACE_IMAGE_MODEL` defaults to `gpt-image-2`, `FITSPACE_VISION_MODEL` defaults to `gpt-4.1-mini`. API routes: GET `/api/ai-room` only reports configured state (not the key); POST `{action:'clear',image:<data URL>}` returns edited data URL; POST `{action:'analyze',images:[<data URL>]}` returns safe qualitative JSON. The backend does not persist images. The OpenAI provider processes them under its API data policies; this is not an offline-only pipeline. Consent required in UI. Access-control preview and future authentication/billing quotas are required prior to exposing the API publicly. No real inference is verified without a valid provider key.

## Hard limitations
- The 3-photo spatial **topology template** is a user-editable first approximation, not actual multi-view geometric photogrammetry or an accuracy-certified reconstruction. Camera poses, occluded geometry, metric depths and door/radiator dimensions are not inferred from pixels. The user's photographs are not embedded in source control.
- No color/image-derived textures on 3D surfaces; no actual AI-identified multi-view correspondences, depth maps, learned meshing, custom room topology, verified metric estimates, or opening/collision details.
- Image editing may add plausible texture to previously occluded areas: NEVER trust an inpainted wall for actual measurement.
- No furniture placement or product shopping in this V8 phase, only room shell.
- Before enabling publicly: account auth/authorization, quotas/rate-limit, image moderation/privacy/delete controls, inference cost budgets, real-device QA, accuracy benchmark against measured spaces.

## QA
Unit: architecture validation/provenance, model changes, undo/redo, beam sizing, no arbitrary known lengths, server key missing and request auth, mock edit/vision responses. Browser: 320/390/768/1440 viewports, 2D, elevation, section, WebGL context, dimensions, photo upload, consent, missing-key handling, transfer to CAD. Also run all V0–V7 suites. Preview only; do not merge to production without review.