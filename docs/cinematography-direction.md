# V0.22 — Cinematography direction

## References
- Roger Deakins / ARRI Rental, [Lighting Blade Runner 2049](https://www.arri.com/news-en/lighting-blade-runner-2049-): motivated sources, light as architecture.
- Greig Fraser, [Dune: Part Two](https://britishcinematographer.co.uk/greig-fraser-asc-acs-dune-part-two/): use simple silhouettes selectively to show scale and reduce visual clutter.
- [Invisible cuts](https://www.adobe.com/creativecloud/video/hub/ideas/what-is-an-invisible-cut-in-film.html): hide editorial discontinuity, not a literal wall crossing.
- [Selva](https://isolume.studio/work/selva), [XELEVEN](https://www.aaronjcunningham.com/scroll-based-animated-website-for-xeleven): authored frames, reversible scroll timeline.
- [Three.js r180 GTAOPass](https://github.com/mrdoob/three.js/blob/r180/examples/jsm/postprocessing/GTAOPass.js), [SMAAPass](https://github.com/mrdoob/three.js/blob/r180/examples/jsm/postprocessing/SMAAPass.js). SMAA before OutputPass.

## Implementation
Default seven lighting looks, eight area lights and a quantum rim spot; retain PBR base colors and texture filtering; desktop HDR with studio fallback, GTAO, thresholded restrained bloom, SMAA and ACES exposure. Mobile uses direct shading and photographic lighting without desktop passes. The proposed indirect-light baking and truly selective object bloom are separate follow-ups; thresholded bloom is not selective-layer bloom.

Server-to-security cut tries real opaque surfaces using multiple viewport rays, sampled closest-triangle clearance and 21/25 coverage at the terminal pose; if no verified pair exists, use a short masked optical splice between already audited poses. Operations-to-quantum edit skips retracing the corridor. Physical continuous path remains at the other thresholds. Full-screen dark mask is a transitional fallback, not a successful invisible match cut by definition.

Default typography is compact centered HTML, native screen graphics remain; experimental surface labels accessible only via explicit type modes. No long fake plaques or side masks. Default production models remain the cleanroom, lab bench, roof tray and bridge aperture from 0.21; no new model was added in this cycle.

## Acceptance
Run unit tests and browser screenshots on unflagged production, forward/reverse transitions and default lighting profile; compare legacy frames, report physical GPU performance separately from SwiftShader. Confirm exact Vercel commit, not merely a merged PR. No new claim of visual approval until observed.
