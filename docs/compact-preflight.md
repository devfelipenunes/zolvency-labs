# R28: compact preflight candidate

Prior #136 mobile telemetry: 16.192s preflight, 12.237s final GPU fence, 3.248s warm submission, 452ms assets wait, 254ms texture upload. Software only. GPU fence time is queued work, not isolated shader time.

Opt-in &preflight=compact on staged route: all 16 authored poses still receive compileAsync; compile pose respects masked cut and mechanical state, but only seven representative holds plus opening submit complete draws. All model and texture preparation, fonts, fence, loading screen and fallback remain. Default path retains 17 full draws. This differs from #139 diagnostic-only warmup, which also reduces the compile count. Potential risk: render-target allocation, shader/material state and first encounter stalls at skipped poses; compileAsync does not guarantee all render passes are warm. Do not promote without A/B. Test cold startup plus first/repeated fenced draw at all nine skipped poses, matching pose/mechanics/mask and inspect captures. SwiftShader timing is not native scrolling or physical GPU. Balanced/cinematic profiles need separate checks before any production promotion.

Release policy: retain full preflight unless candidate demonstrates smaller startup and no meaningful first-encounter regressions, then verify actual native scrolling and physical device. No new assets, copy, lighting or camera rail.
