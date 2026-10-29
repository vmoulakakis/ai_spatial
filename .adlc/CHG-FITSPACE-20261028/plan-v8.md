# V8 — Architectural Workspace, phase one

Intent: With any available 3 photos of the same furnished space, user wants to remove furniture via OpenAI image edit, review the empty appearance, and edit a measured 2D/3D architectural shell. No shopping or redecorating.

Specification: Keep originals private and unaltered. Opt-in AI editing request via server key; no claims inpainting is surveyed geometry. Qualitative multi-view AI interpretation only. Editable illustrated scene dimensions (source tags) drive floor plan, front elevation, vertical section and Three.js 3D. User measured values override placeholders. Export CAD when confirmed. If key unavailable, visual model still usable while image-edit button returns explicit failure.

Implementation: New V8 architecture-core, reconstruction workspace UI and WebGL renderer; serverless AI proxy. Link from existing CAD, transfer plan via sessionStorage with explicit confirmation. Automated unit plus multi-device Chromium browser QA.

Review gates: GitHub draft PR stacked on V7; verify browser screenshots, HTTP routes, no photo uploads without consent; no merge/production promotion. Product limitations, needed real metric benchmark and server-side auth/rate limiting are documented.