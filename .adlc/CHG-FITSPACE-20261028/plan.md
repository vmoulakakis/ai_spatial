# CHG-FITSPACE-20261028 — Build and Test Plan
Repository: vmoulakakis/ai_spatial. Status: PREPARED, NOT IMPLEMENTED.

## P0 Foundation — first runnable value
1. Isolated Next.js TypeScript mobile-first frontend, no forced app installation.
2. Deterministic geometry-core with room polygon, calibrated anchors, constraint solver, derived metrics, revision log, conflict checker and undo/redo.
3. Editable 2D floor-plan editor with cm input and accessibility; test wall 260 -> 240 across all dependent values.
4. 3D room view using same canonical scene model and clear uncertainty labels.
5. Generic product geometry and physical-fit rules, no commerce/ad network code.
6. Unit/property tests, mobile browser QA, performance and contrast/keyboard checks.

## P1 Adaptive guided capture
Privacy-reviewed uploads and quality/coverage agent that identifies missing viewpoints; optional scene reconstruction with per-value uncertainty, scale anchor checkpoint and manual edit review.

## P2 Multi-site reuse / optional native
Tenant-isolated embeddable SDK and API; test in two independent demo hosts. Optional supported RoomPlan/LiDAR/ARCore adapters. Separate approval required before touching any existing live site.

## Release gates
Geometry closure and unit consistency; revision-safe async results; no false precision; privacy retention & deletion; consent; tenant isolation; real device browser validation; evidence-backed precision metrics; independent review; production monitoring. No deploy claims without verified environment.

## Scope exclusions
Do not touch SocialMarket or CarCare, connect Awin/Linkwise, manage merchants, publish affiliate links or add shopping funnels to ai_spatial. Host apps may later consume a permissioned spatial fit service.