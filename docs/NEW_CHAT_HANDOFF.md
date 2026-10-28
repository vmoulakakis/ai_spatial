# FitSpace AI — New ChatGPT Conversation Handoff

Use this handoff as the starting context of a NEW ChatGPT Work conversation, independent of the Awin/affiliate automation chat.

## Conversation title
FitSpace AI — Spatial Intelligence | ai_spatial

## Repository — EXCLUSIVE
https://github.com/vmoulakakis/ai_spatial

## Current state
On 2026-10-28, this repository was initialized and core product requirements transferred. There is currently no functioning CV room scanner, 2D/3D editor, native application, hosted endpoint, or spatial inference verified here. The earlier specification drafted as SocialMarket PR #97 is superseded and should NOT be merged there.

## What to build
A reusable, Greek-first, mobile web/PWA spatial platform that works across multiple websites and product types, without making visitors download an app. AI chooses and explains which extra room photographic viewpoints are needed; reconstructs proposed geometry with explicit uncertainty and requires a measured scale reference for real dimensions.
Every measurement can be corrected interactively. A deterministic revisioned solver then recomputes linked room walls, coordinates, areas, obstacle clearances, product positioning, 2D plan, 3D view and fit verdict. Conflicts, undo/redo, provenance and stale asynchronous AI results must be addressed correctly.
Optional native iOS/Android LiDAR/AR depth support is a later enhancement for compatible devices.

## Strict boundaries
ONLY modify vmoulakakis/ai_spatial. NEVER build Awin, Linkwise, merchant programmes, offers, feeds, affiliate tracking, revenue funnels, purchase flow or deployment of other sites here. Other host sites may consume generic, permissioned physical-fit API results.

## Governance
Inspect README.md, AGENTS.md, DESIGN.md and .adlc/CHG-FITSPACE-20261028/{intent,spec,plan}.md.
Use vmoulakakis/Myagenticteam universal-creation-orchestrator, ADLC, appropriate UI/UX and agent skills. Implement through PR, tests and browser QA; privacy and measurement accuracy are release gates. Do not commit photographs, secrets, or private data.

## FIRST WORK TASK
Implement P0 geometry-core + mobile interactive dimension editor in ai_spatial: exact cm edits, canonical room coordinate graph, deterministic recomputation, undo/redo, conflicting anchors, accessible 2D plan, 3D view of same scene, generic product fit evaluation. Add unit tests for 260cm->240cm and AI response revision races, then report GitHub PR and test/visual QA evidence. Never claim AI photo measurement is implemented until it actually is.

## Return format
Describe what was actually built, GitHub paths/PR and test evidence, what remains unimplemented, known limits, and the next safe step.