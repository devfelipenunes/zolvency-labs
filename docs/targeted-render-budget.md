# R27 targeted rendering budget

P01: quick unit/build gate; targeted browser jobs desktop/mobile; concurrency cancellation only for this workflow/ref. Existing full workflows untouched. Local smoke: BUDGET_MODE=smoke node scripts/targeted-render-budget.mjs after npm run build. T3 compares three holds, three variants. No shared build artifact yet; setup was ~34s vs 519s browser in #134.

P02: opt-in &batch=static only in staged route. Batch same geometry/material static opaque rack-door mesh leaves, excluding known animated ancestors, glass, alpha-test, custom depth, layers and mirrored transforms. Preserve source transforms and shared resources. Batch may produce zero groups; measure instead of forcing. Coarser frustum bounding volume can increase visible triangles; compare actual renderer totals and screenshots. No speculative occlusion culling or default changes.

P03: compare frustum and per-root counts after actual fenced draws, identify grouping/visibility tradeoffs. No hidden geometry without proof.
P04: transmission 0.75 dimensions (56.25% target area) vs full; half earlier had visual detail loss. Fenced wall time includes submission/scheduling; no physical GPU claim. Baseline data #134 has only 1–2 asynchronous GPU query samples per hold, insufficient to rank performance.
P05: explicit diagnostics=1&benchmark=1&warmup=targeted uses seven representative holds plus opening, all assets and textures still prepared and fenced. Full 16+1 warmup retained for public path and release validation. Not a startup benchmark; no public optimization claimed. Full CI before merge, compare actual images and hardware, preserve narrative and no new scenery.

R31 decision: 0.75 transmission dimensions selected for integrated verification, after desktop and two mobile software runs showed approximately 20% reduction in fenced wall time. Static batching remains off by default: lower draw calls did not improve wall time. Short diagnostic warmup remains diagnostic only; the public loading contract is unchanged. Retarget to the release integration branch; no default promotion until combined and physical validation.
