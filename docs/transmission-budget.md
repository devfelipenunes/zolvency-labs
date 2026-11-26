# R23 — glass transmission cost experiment

R20 mobile candidate: 526/556 observed motion frames at 0.60 resolution scale; median frame interval by provisional progress bands .115–.365 (Blockchain) 801.5ms, .365–.51 (Stellar) 693.4ms; all motion CPU p95 7.1ms. Software rendering and recording overhead prevent physical performance conclusions. R20 baseline desktop also has stalls. GPU query samples are sparse/async.

Three r180 WebGLRenderer source explicitly sizes the physical transmission render target using transmissionResolutionScale and renders opaque objects into it with MSAA and mipmaps: https://raw.githubusercontent.com/mrdoob/three.js/r180/src/renderers/WebGLRenderer.js (renderTransmissionPass). Server glass retains physical transmission; the extra pass is a plausible cost contributor, not yet isolated proof.

Opt-in editorial query `&transmission=half` (0.5 dimensions = 25% target area) and `&transmission=quarter` (0.25 dimensions = 6.25% area). Default unchanged. Fixed per session, no toggling or repeated target allocations at chapter boundaries. Main canvas and DOM type unchanged; only refracted image may lose detail. No new model or material replacements. Quarter is exploratory, not recommended for release.

A/B full vs half same economy profile, diagnostic fixed poses .205, .405 and .935, 12 measured samples per pose following 3 warm frames, screenshots after sampling. Compare poses, pixel ratio, assets, RAF distributions, unique GPU samples and visual clarity. AB desktop, BA mobile (different viewports, not paired repeats); no speedup claims before results. No physical hardware validation. Exact #131 CI preserved by separate branch. Run after build with `node scripts/transmission-budget.mjs`; use BENCH_HARDWARE=1 for headed local test. 
