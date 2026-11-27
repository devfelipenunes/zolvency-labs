# R100 — hybrid handoff release gates

## Recorded evidence (2026-11-27)
- R99.10, PR #230, commit 265d907: run 46084623128 passed all three jobs (desktop software WebGL, mobile software WebGL, editorial).
- R99.15, PR #231, commit 3ba7539: mobile and editorial jobs passed in run 46085029069; desktop outcome was pending at the time of this record.
- Artifact 15238588808 from the mobile R99.15 job: 96 RAF observations during one native-touch gesture, scroll 1980.8 → 2166 px. All camera targets and rendered progress remained exactly zero. This proves native scrolling but does not demonstrate camera motion during the gesture.
- The R100 evidence patch changes the gesture start to storyTop - 0.8 * viewport, captures both directions, and requires actual target movement, rendered progress and distinct camera poses. Retains traces for inspection. Measures browser RAF intervals and settled error; not physical iPhone performance.

## Approval rules
1. Confirm all candidate jobs at the same head SHA, including the geometry and screenshot-pixel checks, editorial budget and native input in both directions. Never infer passed tests from an earlier SHA.
2. Inspect actual entry and exit captures on both viewports, including readability of the final scene. Review the comparison route `?hybrid=1&type-entry=control` versus spatial default. Record the approved choice.
3. Physical iPhone Safari: cold/warm startup, slow and rapid touch scroll, reversal, address-bar resizing, orientation, deep links, reduced motion, fallback and return to editorial. Record device, browser version and observed problems; Chromium emulation is not a substitute.
4. Confirm direct navigation, accessible reading route and approved product/contact copy; no WebGL dependency for editorial.
5. Check deployment is available, test the exact preview commit, obtain visual approval and explicit production authorization.
6. Preserve previous preview/legacy route and rollback reference.

**ReleaseApproved: false.** A CI pass permits integration into preview only, not production. No Vercel quota bypass or additional purchases. The candidate keeps the A facility and its existing assets.
