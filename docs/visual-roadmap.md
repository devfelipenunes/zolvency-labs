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
