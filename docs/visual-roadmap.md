# Visual roadmap — industrial premium

Source: R4 screenshots, artifact 15117898053; follow-up #85 / PR #84. A successful technical workflow is necessary, not sufficient for artistic approval.

| Stage | Delivery | Acceptance |
|---|---|---|
| P0 reference frames | Opening brand, active rack, quantum cryostat | Inspect bare plates and final composition on desktop and mobile; recognizable subjects, no obstructed letters |
| P0 Stellar | Compare devices, diagonal, opposite at fixed collision-tested camera | Compare actual rendered devices, not just cabinet geometry; choose after inspection |
| P0 brand | Real wall-support ray checks, physical depth, fixed logo, fallback to world-space if unsupported | Mount metadata must report hangar-wall to claim physical anchoring; complete and legible logo |
| P1 typography | Sequential role envelopes, depth and semantic HTML preserved | Read each message across actual scroll; no simultaneous information overload |
| P1 photography | Local color grades, less distracting hangar floor, contact-shadow and bloom candidates | Subject separation and readable equipment without excessive highlights |
| P1 mobile | Dedicated portrait capture and ops aim; validate each role | No text on primary equipment, clipping or inaccessible copy |
| P2 motion | Capture sampled real scroll and hold/transition frames | Check transition continuity and reverse scroll; do not infer smoothness from stills |
| P2 public UI | Version opt-in (?version) and smaller sound control | Production preview has no version badge; dev keeps version |
| P2 final | Separate front-wall brand candidate and different angle | Distinct final composition and brand readability |
| P3 effects | Modest desktop AO/bloom candidate, benchmark | Compare at actual drawing buffer resolution and check budget |
| P3 assets | Reassess after approving reference frames | Only research additions with a named visual gap; existing external models preserved |

## Evidence protocol
The cinematic workflow takes 1280x720 desktop and 390x844 portrait frames, bare plates, art=legacy composition control, three rack-angle candidates, staged narrative and seven actual scroll captures per viewport. All screenshots are from Chromium and are not a substitute for testing on physical mobile hardware. The legacy control is not an exact historical build: shared material changes remain. Compare archived R4 artifact separately. Clearance and performance regressions are release blockers; no merge before review.

## State
Candidate implementation, not artistic approval. Assets are unchanged. The wall-mount algorithm can fall back to fixed free-space lettering if no supported, visible wall is found. Full environmental lettering, more detailed surface assets, artistic selection of camera candidates and actual transition video review require subsequent inspection.

## Execution — issues #86–#101

Baseline PR #84, fbcf22522f3a93fdc34a93493a9ccac7cd3974da. Frontend, render benchmark and cinematic workflow succeeded; visual artifact 15121985006 still requires inspection for this exact head. Prior Notion review identified Stellar opposite as the chosen rack angle, small/occluded opening wall logo, weak body opacity at holds, floor-dominated closing, mobile Quantum railing overlap. Do not conflate earlier screenshots or metrics with new renders.

| Issues | Candidate/evidence in this branch | Remaining gate |
|---|---|---|
| #86 #87 #89 | Canonical opening/Stellar/Quantum reference; all rack angles and four glass finishes; preserve Quantum geometry | Compare images and choose glass, confirm subject hierarchy |
| #88 #96 | Middle-distance opening logo, close lens, higher finale; diagnostic only; fixed logo is explicitly free-space | Inspect framing, mounting and occlusion; select or reject |
| #90 #93 | Body reaches full opacity at hold after headline, retry failed anchors when visible sets change; portrait Quantum copy audition | Inspect actual readability and equipment overlap across viewport/device |
| #91 #92 | Local ops-focused light and independent original/matte floor treatments | Compare actual renders; no new textures or assets |
| #94 | Native smooth forward/reverse scroll video and captures, unflagged production route | Review video; software renderer caveat |
| #95 #101 | Public endnote version removed; semantic heading alignment; minimum sound target | Test keyboard/touch, content and production default |
| #97 #100 | Diagnostic AO/bloom A/B at real drawing buffer; repeated frame samples; existing benchmark preserved | Physical GPU/iOS/Android and budget assessment |
| #98 | No asset changes; evaluate only named gaps after accepted reference plates | License/mesh/hash audit and visual auditions if gaps remain |
| #99 | CI matrix with separate per-case evidence and errors, original workflow preserved | Inspect artifact, approve candidate, verify deploy SHA and rollback after merge |

### Asset gap decision rubric
Inventory only deficiencies visible on accepted plates: foreground structure obstructing brand, generic hangar floor, ops-console focal separation, corridor transition seams. First test camera/material/light with existing verified assets. If a gap remains, document screenshot ID, required scale and shape, source URL, license, pinned SHA256, mesh/texture/LOD and collision cost; audition at identical camera and lighting before adding to production. Do not add models merely for variety or declare a license without inspecting its source.

### Release gate
Do not close child issues solely on code or green CI. Review actual PNGs and videos from exact candidate commit, record selections and failed variants, run existing regression suite and physical-device checks where available; verify production alias exact Git SHA and rollback after explicit visual decision. No paid assets or deployment changes without authorization.

## R6 — selection and correction after visual matrix

Evidence head fda6faf57512b3f5df00be5d945f07e81c5adf1f, run 45828644303: 8/9 matrix jobs passed; desktop public scroll failed with timeout after 0, .055, .115, .205, .31; video remains in the rack aisle at the end, no recorded JS errors. Mobile public scroll completed all 22 forward/reverse targets. Root cause is not yet established. New test records native scroll position/anchors, actual document progress, React requested target, renderer progress, render count, viewport and visibility separately; no diagnostic frame API or instant retry in the real-scroll test. Requires a clean new run.

- Selected close opening candidate (free-space, not physical wall mount), preserving original as diagnostic control; selected portrait quantum-copy position. Actual opening/exit transitions and combined default need validation. Stellar opposite and glass split retained. Final-high not promoted; lighting ops-focus not promoted.
- Floor A/B was ineffective: mobile original and matte frames exactly pixel-identical to default at .055/.992; desktop mean absolute channel delta <.04/255. Source material scifi_panels_2 shared by floor and shell, not named floor. New diagnostic geometry-matte separates low upward-facing static hangar_bay faces by regrouping existing indices. No new triangles, UVs or scenery; keep original texture atlas and materials; require positive face count and area, then visual and performance comparison. Do not promote yet.
- Effects A/B desktop (15122228702): mean draws 119 default, 82.3 no AO, 106 no bloom, 69.3 neither over three reference frames. Difference in actual images subtle; software timing samples not physical FPS. Keep defaults until budget and visual review, consider no-AO as a low-tier candidate.
- V0.30 mobile (15123505213) 45 renders and tests passed; subtle changes, no case merits automatic combined promotion. UV audit 81 mesh/material rows, zero secondary UV or lightmaps. AO maps already exist on several models. Opening clearance sampled min 0.8m for baseline, motion, combined, hero candidates. Desktop V0.30 run still pending at this inspection. No true baked lightmap produced. #103 must reconcile with revised #102 before release.
