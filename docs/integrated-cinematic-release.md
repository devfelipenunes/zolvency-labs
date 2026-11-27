# R32 — consolidated cinematic release candidate

The selected experimental paths are combined on PR #131; this is not publication. Baseline/default controller, full preflight, full transmission and default framing/light remain unchanged except the verified overlap-order fix and precomputed equivalent pacing. Keep instancing disabled for the selected candidate. No new navigation, copy or models.

Candidate desktop:
`/?experience=editorial&direction=staged&profile=economy&travel=responsive&lighting=local&transmission=threequarter&framing=portrait&preflight=compact`

Candidate mobile: same, with `preflight=full`. Portrait mode only affects mobile.

This combines #133, #139, #136 and #140 with the already merged #132/#137/#138. #134 retained as comparison history (quarter/half remain opt-in). #135 is an alternate controller experiment, not combined with #136. The analytic responsive controller is the candidate because it includes precomputed pacing and loader telemetry; settle improved over the older candidate but frame tails and physical smoothness have not been certified. Local lighting without experimental floor partition selected; final bright floor remains an artistic issue.

Diagnostic warmup has precedence only when diagnostics+benchmark+warmup=targeted; it does not change the public route. Compact/guarded are explicit separate options. Overlap processing precedes any floor partition and optional static batch.

Integrated test: fourteen native scroll holds, keyboard/wheel, copy roles/bounds/contrast, readiness and aborted-model fallback, selected configuration assertions. No video in integrated mode, screenshots retained. Existing full suites remain. Software results not hardware approval.

Physical test on a connected machine (Node 22, headed Chromium with a supported GPU):
```sh
npm install --no-audit --no-fund
npm run build
npx playwright install chromium
EDITORIAL_INTEGRATED=1 EDITORIAL_PHYSICAL=1 EDITORIAL_DIRECTION=staged EDITORIAL_TRAVEL=responsive EDITORIAL_PROFILE=economy EDITORIAL_VIEW=desktop node scripts/editorial-experience-check.mjs
```
Run again with EDITORIAL_VIEW=mobile to check emulated portrait, not a physical phone. Confirm reported GPU, record browser/device/driver; use the clean native-scroll benchmark for timing without screenshot/loader interference. Test Safari on actual iPhone and Chrome on Android separately. No release or default promotion solely from a green software suite.
