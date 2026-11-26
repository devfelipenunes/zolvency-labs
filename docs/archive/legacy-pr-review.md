# Legacy PR reconciliation — V0.30

Baseline main a7313729c92be8e2741d22bc62989bf10d20c78f, verified release #105. GitHub compare against main and changed filenames plus targeted patch inspection; counts at audit time. Branches remain preserved; no wholesale merges.

| PR | Ahead / behind main | Decision |
|---|---:|---|
| #18 V0.10 narrative | 12 / 350 | Superseded by seven-act current story, semantic headings, actual external facility; old procedural scene not selected. |
| #24 V0.13 signal | 3 / 348 | Preserve docs/signal-in-motion.md and assets/external-lock.json already on main. Current models, deterministic scroll mechanics, actual cryostat and racks supersede candidate; no old procedural pulse overlay. |
| #34 progressive loading | 2 / 340 | Current threeScene.js already falls back to full-detail model on failed lowFile and exposes lodFallbacks. Recover the missing regression, adapted to current facility and native keyboard navigation before secondary loading. |
| #37 asset opportunities | 4 / 345 | Preserve exact catalog in docs/archive; old acquisition workflow and scripts not selected for production. Current asset-study uses pinned real GLB audits. Proposed placements remain unapproved; catalog is historical, not a current license/availability verification. |
| #38 render lab | 6 / 340 | Current renderPerformance.js implements coalescing, bounded governor, disjoint GPU timer; photographicLighting.js implements modern lighting; current benchmark and physical-device backlog replace old lab. Do not revert. |
| #40 spatial typography | 7 / 329 | Current spatialNarrativeText.js has extruded glyph meshes, actual SVG wordmark, authored world-space anchors and measured visibility, semantic DOM. Old title-only experiment superseded. |
| #41 composition A/B | 6 / 329 | Current facilityLayout.js uses rooftop tray and connected bridge/cryostat sets; actual #105 audition rejected control-room replacement. Archive exact candidate asset lock for future reference. No cleanroom/junction-box promotion without specific visual need. |

## Recovery acceptance
- Historical source data in docs/archive only; not used by build/staging.
- Progressive loading test deliberately holds secondary GLBs, checks native End/Home before full load, aborts low-detail server request and verifies full model recovery, completion, diagnostics, no page errors. Actual test result required before merging recovery PR.
- #122 selected final/operations improvements remain separate. #123 mechanical investigation has its own CI. Do not change released main to force merge or merge old branches solely because of history.
- No branch deletion; old PRs can be reopened if new evidence warrants a specific modern port.
