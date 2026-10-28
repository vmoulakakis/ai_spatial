# CHG FITSPACE V7 – implementation evidence
Goal: User said "build" after V6 CAD + WebGL and explicit next-stage Guided Room Capture. Build real in-app photo intake with privacy, quality, adaptive guidance and scale confirmation, not falsely claimed automatic photogrammetry.

Contract: `vmoulakakis/ai_spatial` only, stacked draft PR on V6, no production promotion. Add capture core, UX overlay, bridge to measured CAD, and browser QA. Full AI inference intentionally excluded absent validated licensed inference endpoint and privacy gate.

Verification: TypeScript, deterministic unit scenarios, GitHub-hosted Chromium 320/390/768/1440 for local image import, overlays, manual corner marking, camera-denied fallback, anchor -> CAD geometry bridge, metadata export, privacy controls, no JS errors. Manually inspect desktop/mobile screenshots before sign-off.

Release blockers: true photogrammetric photo-to-scene, model benchmark and independent physical-room measurement; accessibility actual hardware; consent+tenant deletion for eventual cloud images; no certified physical fit.