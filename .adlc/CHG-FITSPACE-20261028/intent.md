# CHG-FITSPACE-20261028 — Intent
Status: SPEC ONLY (28 October 2026). Canonical: vmoulakakis/ai_spatial.

## Job to be done
Build one reusable Spatial Intelligence platform for different websites and categories, independent of any affiliate system. Visitors should photograph a room from AI-guided angles; the software requests further viewpoints based on missing coverage, proposes room geometry with disclosed uncertainty and assists calibration using a real scale reference.

Users can modify ANY displayed dimension or obstacle in a 2D/3D editor, and every adjustment must recompute the complete consistent spatial model, including all dependent wall lengths, floor area, clearances, placed products, and fits/does-not-fit status. All changes are undoable and manually confirmed anchors are protected.

## User priorities
- No mandatory downloaded native app; mobile web first, optional iOS/Android AR/depth on supported hardware.
- Multiple intelligently requested viewpoints, not arbitrary photo count or one-shot accuracy claims.
- Each measure independently editable, with centimetres, provenance and uncertainty.
- Geometry constrained, globally re-solved after corrections; no silent inconsistent room layout.
- Reusable privacy-preserving API or embedded widget in unrelated authorized sites.

## Hard truth
No reliable metric dimensions from single uncalibrated monocular images. Require verified reference, measured length or supported sensor. Do not call a visually plausible 3D rendering accurate or physically safe without validation.

## Scope separation
This repository implements ONLY spatial scanning, geometry, visualization, physical fit, and SDK. It does not implement merchant networks, application approvals, product feeds, prices, tracking, checkout, commerce or publishing. Other repositories remain unchanged.

## Acceptance
A 260 cm inferred wall changed by user to a measured 240 cm causes a new spatial revision, updates 2D, 3D, derived dimensions and product-fit checks, and preserves undo history. Conflicting anchors raise a visible conflict. Stale AI inference cannot replace the user correction.