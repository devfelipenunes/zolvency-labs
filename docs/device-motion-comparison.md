# Clean native-scroll device comparison — R21

The R19 Chromium screenshots and reports were inspected at SHA 55658c9700dfb8cda3becf6cee5ff82b20e317d1 (artifacts 15145462347 desktop and 15146170743 mobile). All 28 reading holds passed; minimum conservative CSS contrast 10.44:1. Desktop p50/p95 active frame intervals 18.8/6944ms, CPU p95 7.3ms, draws p95 106; mobile 19.3/3605.5ms, CPU p95 10.3ms, draws p95 92. These software-rendered results include video and screenshot overhead; no physical FPS or uniform speedup inference. Visual gaps: server faces and ops console dark, mobile security corridor dark, final mobile floor bright against dark hangar. Preserve copy, assets and existing composition for the motion comparison; separate lighting experiment required.

Use Node 22 and a local real GPU-enabled desktop:
```sh
npm install
npx playwright install chromium
npm run build
node scripts/device-motion-compare.mjs
DEVICE_ORDER=BA node scripts/device-motion-compare.mjs
DEVICE_VIEW=mobile node scripts/device-motion-compare.mjs
```

Use DEVICE_SOFTWARE=1 for explicit SwiftShader CI-like smoke only; DEVICE_HEADLESS=1 optionally enables headless. Default is headed Chromium, with no forced software backend. No renderer fingerprint stored; the script records only software/reported-non-software/unknown. Mobile viewport emulation is not a physical phone. For phones open the staged URL in actual Chrome/Safari and use the deviceStudy diagnostic if accessible; record hardware class manually, not a fingerprint. Native Playwright scroll targets are identical across A/B and do not use a diagnostic renderer. Isolate recording from performance; output startup, first observed motion, settling, frame intervals including gaps, render submission, unique GPU queries, draw/triangle counts and scale. Fresh contexts and AB/BA runs; no claim of statistical confidence from one run. Physical acceptance remains p95 <=20ms desktop / <=40ms mobile targets, no repeated stalls, no unacceptable settling delay, stable resolution, visual review. Values are targets only. No automated merge or default promotion.

R20 #131 exact-head CI continues independently; this stacked branch is diagnostic-only and does not replace the visual regression pipeline. The local physical device available through Desktop Commander was offline at review, so no physical benchmark was executed. Script syntax checked; browser execution remains pending.

## R50 physical capture
Use the staged candidate URL with `?experience=editorial&direction=staged&copy=manifesto&profile=economy&travel=responsive&framing=portrait&lighting=local&transmission=threequarter&device-study=1` (do not add diagnostics or benchmark). After the loader, Start capture, scroll the same seven holds forward and reverse, Stop capture, Export JSON. Repeat three times on each real desktop, iOS Safari and Android Chrome; note browser and hardware class manually, no device identifier in export. Use `observedIntervals` for p95 including stalls, `metrics.intervalMs` for the historical <=250ms statistic; reject truncated or empty captures. No automatic upload, no UI without the explicit flag. Actual physical measurements remain pending. Do not compare a mobile viewport to a physical phone.
