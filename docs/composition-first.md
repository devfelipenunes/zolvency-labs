# V0.30 — composition before effects

## Accepted V0.29 baseline
PR #104 merged at 2914cdb0ffa5c73d7b96f7f803b8430e8efa9c36 (local TLS/system CA, persistent verified asset cache, offline restoration). PR #102 merged at 77aaa4f43023f590069b8dd7bd29421be2df6a47. Exact reviewed head 863ace701aec3e60416829905a7e6e92d0bd65fa, all three workflows passed. Actual native scroll artifacts 15128506493 (desktop) and 15128461364 (mobile): 22 each, zero failures, max absolute target-progress error .001781 and .002073 respectively. This confirms successful rerun, not proven root cause of original timeout or real GPU performance. Opening close, portrait Quantum copy, Stellar opposite/split selected; geometry-matte still diagnostic, 582 desktop faces, 692.388 m². Final floor distracts; server wall intrudes in opening, console composition still weak.

## Reject ineffective experiments
#103: 45 mobile and 52 desktop diagnostic captures; desktop workflow cancelled despite saved screenshots. PMREM local probes darkened surfaces and added substantial cost in SwiftShader, so no reflection capture or combined treatment promoted. Preserve #103 as historical experiment, supersede with a clean branch from merged main; no conflicting stacked merge. Larger opening hero candidate was strongest (~39% viewport width on desktop). Existing external assets, no invented scenery.

## Independent studies
- brand-hero: reproduce larger opening plane (-1.5,4.2,2) with width candidates 5.2/4.6/3.6m desktop, capped portrait; actual occlusion check and fallback, no physical-wall claim.
- final-hero: higher, tighter mid-distance brand shot, separate floor via real source triangles and tested geometry-matte; no camera path relocation.
- ops-hero: narrow lens, different subject aim, left text composition desktop, stronger existing practical ceiling light. Preserve existing bridge until external alternatives prove better.
- subject light: modest local exposure and fill on opening, servers and operations; reduce hall spill. Stellar camera/glass and Quantum hold protected. No PMREM, volumetric simulation or fake GI claims.
- crane: retime original 4m mechanical path with reversible scroll function; measure actual clearance.
- composition-first: combined candidate, diagnostic only. 42 frames per viewport plus timing and clearance. No default changes until visual evidence.
- Postprocessing: keep default; #102 A/B 119 mean draws default, 82.3 without AO. Physical GPU/device testing remains required. No speculative promotion.

## External asset audition and genuine bake experiment
Use existing pinned CC0 files: current bridge (https://tevy.dev/models/scifi-bridge-room), alternative factory control room (https://tevy.dev/models/control-room), external server rack (https://grab3d.com/models/electronics/server-rack/), hangar (https://tevy.dev/models/scifi-hangar). Reuse locks, verify hashes, render real GLB via separate Vite viewport with actual texture decoding, collect dimensions/node/material/triangle counts. No change to production layout or staging manifest. Asset acceptance requires in-situ framing, licensing, model fit, clearance, LOD, performance, and artistic review.

Export actual decoded opaque static hangar_bay geometry with source vertex/index mapping, transform Y-up to Blender coordinates, skip degenerate faces explicitly, smart unwrap secondary UV, use neutral diffuse receiver and actual Cycles direct+indirect CPU lighting at 512px/16 samples, save EXR/PNG/UV mapping and blend. This is a real offline light transport experiment, NOT production lightmap integration or a validated UV packing solution. Require overlap/padding verification, texture-size and runtime A/B before applying. No bake success claimed until artifacts exist.

## Release criteria
Review exact-head candidate renders, prioritize individual visible gains over combined, confirm native navigation on both viewports, semantic DOM and fallback, verify clearance and performance. Keep main stable until verified. Hardware physical tests still outstanding.


## R8 — measured selection and UV repair
Exact prior #105 head 1c97517f6195e8f6529d48dafebb7f2c38b2d0f1: composition desktop 15132147394 and mobile 15130257200, 42 frames each, both passed. Opening hero span .273→.390 desktop and .709→.840 mobile; at .005/.025/.055/.075 all visible hero samples inside and ray visibility estimate 1.0, no text at .105 after exit; 81 sampled opening positions minimum clearance .8m. Select brand-hero as candidate default; still require actual native scroll and full CI at final head. Keep rejected final-hero diagnostic only (desktop .58→.205, mobile .807→.419, text overlap). New final-clean retains control wordmark anchor and lens; new ops-clear moves copy to upper/lower regions, no new model. Quantum and Stellar camera geometry protected.

#120 actual Cycles run 45845803018 succeeded, artifact 15130513330: FINISHED, 786432 finite RGB values, 204492 positive, max 3.584736, mean .095149. #120 merged into #105 branch at 7da52d19c3625ba918e16b19cc130278efd952fe, not main. First real lightmap is a failed atlas design: 13014 triangles, 5789 islands, 0.767% coverage at 512, 11566 subpixel triangles, 2297 island pairs within expanded padding; at 1024 coverage 0.792%, 10250 subpixel, 2857 pairs. Zero sampled overlap is not adequate. Includes crane components that must be excluded. New proxy welds near-identical positions within each source mesh, records original triangle identities, excludes movable node names, skips degenerates/duplicates with counts, unwraps and bakes at 1024. Original GLB/UV unchanged. Transfer prototype rejects partial mappings, mismatched asset hash/indices and inadequate UV audit; no runtime production lightmap.

## Additional evidence work
- Screenshot photometry: linearized sRGB display-referred luminance percentiles and near-white-channel/dark fractions in fixed normalized regions; no physical lux or object segmentation claim.
- Responsive tests: 360×800, 390×844, 430×932, 740×390; projected hold text inside and ray visibility >= .85, actual PNGs for visual review. Not physical devices.
- Diagnostic device study and adaptive AO: opt-in only; physical-device test still pending. In browser open local or reviewed preview with ?diagnostics=1, wait until 3D loaded, console:
  ```js
  document.querySelector('#stage').startDeviceStudy()
  // Scroll through all seven acts forward and reverse, then:
  copy(JSON.stringify(document.querySelector('#stage').stopDeviceStudy(),null,2))
  ```
  Repeat with ?diagnostics=1&effects=adaptive-ao on desktop. Report browser/device model manually, no GPU fingerprint collected. Active interval, CPU, unique available GPU samples, render calls, triangles, pixel ratio, resource counts, target error and startup times. Hidden and >250ms gaps excluded from percentile but counted. This is not input latency or physical memory bytes. AO hysteresis requires sustained slow/fast observations, 5s cooldown; no default promotion. On mobile no desktop GTAO pass.
- Institutional copy tests preserve seven acts, approved positioning/headline, current Stellar vs future AI/quantum, no unapproved CTA. Copy overlap/timing remains subject to visual review.
- #106 child issues #107–119. #109 implementation and successful bake proof delivered; all quality/integration/release gates remain open. No new production deployment in this R8 cycle.
