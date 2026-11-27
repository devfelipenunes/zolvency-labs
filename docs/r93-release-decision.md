# R93 — Version A release decision

Approved reference: R88 A (commit 730c07a757b6d33eb1c1209dd11975c84421782d), non-parallax. R89 contrast is an optional pilot, not an approved replacement. R90 pacing, R91.1 delta updates and R92.1 docking stay isolated until browser results and review. No production promotion.

## Observed comparison: 390 CSS px

Source: Actions run 46074519597, artifact 15235720973 (R88 control); run 46077177592, artifact 15235823653 (R89 control).

Both reports contain 197 sampled poses, zero reported failures and zero capture failures. At seven authored holds, the minimum headline line height is 37.91 px (R88) versus 38.63 px (R89); minimum body line height 19.68 px for both. The closing description moves away from the bright floor in R89 and is easier to read in the captured image. The Quantum title still overlaps the equipment in projection, so do not claim physical integration. Keep R88 A unchanged as the selected reference.

## Release gates

Run `node scripts/r93-release-gate.mjs baseline/report.json candidate/report.json` for each matching viewport. Automated evidence requires all 197 ordered pose samples, no reported failures, deterministic poses, and readable headline/body at all seven holds. This check does not establish real FPS or approve production.

Require completed desktop and native-touch CI, comparison of actual captures and motion, physical Safari device study, and explicit production authorization. Do not merge an experimental variant on the basis of a synthetic or software-renderer benchmark alone.
