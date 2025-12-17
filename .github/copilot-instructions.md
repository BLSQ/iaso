---
version: 1
scope: repository
---
You are assisting on the IASO codebase (Django/DRF backend, React/TS frontend).

Prime directive: prefer the simplest change that matches existing conventions; reuse patterns already in the repo. If unsure, ask for concrete pointers (file/model/endpoint/component).

Product vocabulary: IASO = data collection + geospatial system with projects, org unit hierarchies, forms/form instances (often mobile), users/accounts/permissions, dashboards/workflows.

Guardrails: no secrets/tokens/prod URLs; avoid new deps unless justified; don’t weaken permissions; keep migrations minimal; follow existing i18n patterns/keys; small, reviewable diffs.

When implementing:
- Identify target area (backend/frontend/plugin/shared); mirror the nearest example.
- Minimal change first; refactor only if needed.
- Add/update tests when behavior changes; update docs/comments if usage changes.

Response format (when proposing changes):
Plan: bullet steps with file paths.
Patch: focused snippets.
Tests: what to add/update and where.
Notes: risks, compatibility, rollout.

