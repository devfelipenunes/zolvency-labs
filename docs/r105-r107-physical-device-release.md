# R105–R107 — physical device handoff and release checklist

## Candidate and comparison
Use the exact preview deployment commit, not an older branch alias. Normal route: `/?hybrid=1`. Entry comparison: `/?hybrid=1&type-entry=control`. If R100.5 is integrated, compare `&type-finale-contrast=control`.
The old legacy route remains available without hybrid=1. Do not publish production until manual approval.

## Device evidence
Open `/?hybrid=1&device-study=1` on physical iPhone Safari or Android Chrome. Capture is explicitly opt-in, local only; there is no telemetry upload. Approach the portal, wait for graphics ready, start capture in the panel, perform the route and stop/export before leaving the facility. Completed report remains in the panel after exit; an unfinished recording is interrupted on engine disposal. Record device model, OS/browser version, candidate commit, network/cache condition and whether reduced motion is enabled separately. Do not share identifiers. Repeat three times cold and three warm if practical.

Test:
- Scroll from hero to manifesto without 3D requests until approaching portal; open deep research link directly.
- Slow entrance, fast entrance, stop mid-reveal, reverse, repeat; observe text and native camera, browser address-bar changes, orientation.
- Seven environments; stop at each reading beat. Check legibility and frame continuity.
- Last scene, hold and dissolve, research/products/footer, reverse and re-enter.
- Reading mode, reduced motion, keyboard skip, renderer unavailable, hide/show tab, sound off by default.
- Record observedIntervals samples/p95/max/over50ms/over250ms, CPU, GPU if supported, target error, scroll-to-submit proxy, startup timings. No claim of input-to-photon latency or field CWV. Mark gaps and truncated reports rather than discard them.

## Release
1. Full hybrid browser checks and reading readiness checks pass for exact integrated head.
2. Review screenshots and physical recordings, approve selected visual variant.
3. Confirm product/contact destinations and public copy; do not invent contact details.
4. Preview deployment available, exact SHA verified; do not bypass rate limits.
5. Explicit production authorization, rollback SHA and smoke test.
6. If any gate fails, retain prior release. ReleaseApproved: false.
