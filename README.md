# FitSpace AI — Spatial Intelligence

> **Dedicated canonical repository:** `vmoulakakis/ai_spatial`  
> **Status (2026-10-28):** Draft P0 implementation in [PR #2](https://github.com/vmoulakakis/ai_spatial/pull/2), not merged or deployed. AI camera scanning, vision inference and production services remain unimplemented.

## P0 source and verification
- `packages/geometry-core` — deterministic, revisioned rectangular room geometry and correction engine.
- `packages/fit-rules` — conservative vendor-neutral physical footprint evaluation.
- `apps/web` — Greek-first mobile PWA with editable 2D and shared-model isometric 3D scene.
- `npm install && npm test` — TypeScript build and unit tests; `npm run browser:test` — Playwright Chromium UI test after browser installation.
- [Implementation limits and QA](docs/P0_IMPLEMENTATION.md). P0 remains a **reviewable foundation**, not a certified scanner or physically safe product-fit service.

## Mission
Build a reusable **mobile-first spatial measurement and product-fit platform**. A visitor takes guided photographs of a room from multiple angles, supplies a calibrated scale measurement, corrects any estimate in a 2D/3D editor, and receives consistent geometry and product-fit results. The same engine can be embedded in authorized independent websites without forcing an app download.

**Primary promise:** “Δείξε μας τον χώρο, διόρθωσε ό,τι χρειάζεται, δες τι πραγματικά χωράει.”

## Core capabilities in scope
1. **Adaptive multi-angle capture assistant:** identifies missing corners/surfaces and guides retakes, not a rigid photo count.
2. **Scale-aware geometric estimation:** no unsupported absolute centimetres from one uncalibrated photo.
3. **Editable dimension model:** every wall/opening/obstacle/placed product can be corrected with a reliable undo/redo and clear sources.
4. **Constraint-based recalculation:** a changed measurement recomputes all dependent geometry, 2D plan, 3D scene, clearance and fit verdict without stale AI overrides.
5. **Reusable hosted API / embedded SDK:** tenant isolation and purpose-limited sharing across authorized host sites.
6. **Mobile web/PWA first; native AR/LiDAR adapters only for supported hardware**.

## Strict project separation
- **This repository is exclusively FitSpace AI** — computer vision, geometric constraints, 2D/3D spatial UX, multi-site SDK, privacy, and physical product-fit rules.
- **Awin, Linkwise, merchant applications/approvals, product feeds, affiliate tracking, sales funnels and commercial publishing belong to other projects and are NOT implemented here.**
- Host websites may consume fit results through a permissioned API. FitSpace never owns merchant integration, prices, payment flows, or affiliate credentials.
- Do not edit or move code into SocialMarket, CarCare, HomeFit, or FitMatch as part of an `ai_spatial` task unless separately authorized.

## Documents
- [Intent](.adlc/CHG-FITSPACE-20261028/intent.md)
- [Specification](.adlc/CHG-FITSPACE-20261028/spec.md)
- [Build plan](.adlc/CHG-FITSPACE-20261028/plan.md)
- [Project governance](AGENTS.md)
- [Project design direction](DESIGN.md)
- [New ChatGPT conversation handoff](docs/NEW_CHAT_HANDOFF.md)

## Development governance
Apply `vmoulakakis/Myagenticteam` universal-creation-orchestrator, ADLC, web-design-intelligence and ui-craft-quality as appropriate. Maintain PR review, real tests, device/visual QA and explicit release gates. Public repo: **never commit photos, API keys, personal data, credentials or private test scenes.**
