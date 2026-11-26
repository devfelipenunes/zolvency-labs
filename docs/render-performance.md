# V0.23 — Three.js render performance

## Reference research
- [Rendering on demand](https://threejs.org/manual/pages/rendering-on-demand.html): coalesce invalidation, avoid rendering when nothing changes.
- [Responsive rendering](https://threejs.org/manual/pages/responsive.html): bounded drawing buffer / pixel ratio.
- [WebGLRenderer](https://threejs.org/docs/pages/WebGLRenderer): info.autoReset=false for multipass metrics; compileAsync for future staged shader warm-up.
- [EXT_disjoint_timer_query_webgl2](https://developer.mozilla.org/en-US/docs/Web/API/EXT_disjoint_timer_query): asynchronous optional GPU timing; discard disjoint queries, never force GPU sync.
- [InstancedMesh](https://threejs.org/docs/pages/InstancedMesh), [optimize many objects](https://threejs.org/manual/pages/optimize-lots-of-objects.html), [KTX2Loader](https://threejs.org/docs/pages/KTX2Loader): later audit geometry/material repetitions and existing compression; do not merge animated doors or distinct materials blindly.

## Implemented
- Single RAF invalidation queue; latest scroll wins, asset completion redraws without overwriting pending scroll, desktop ambient 4 Hz when stationary, no continuous mobile idle render, pause on tab hidden. Legacy comparison available with perf=legacy.
- Eight architectural light placements retained, but only three simultaneous slots are needed over the entire timeline. Fixed slot count avoids shader variant churn while all nonzero contributions remain identical.
- Full multipass renderer.info counters. Optional asynchronous GPU timing, CPU submission and CPU frame timing, frame intervals, geometry and texture counts. No synchronous gl.finish().
- Adaptive resolution scale steps 1/.9/.8/.7/.6, nominal 16.7 ms desktop and 33.3 ms mobile, sustained thresholds and hysteresis; debug mode fixed. Avoid resize churn and redraw after changing buffer. At .8 scale there are 36% fewer framebuffer pixels; this is a theoretical pixel-count reduction, not an FPS claim.
- Incremental deferred wall search outside active scrolling; choose fallback at entry and keep it fixed for that transition. Reject distant collision bounds before creating BVH. Each individual raycast or BVH allocation may still be costly, so further profiling is needed.
- Existing visual design and ten production roots unchanged. No Blender dependency in this cycle.

## Reproducibility
npm run build && npm run bench:render (Playwright Chromium installed). The same build compares perf=legacy (8 area lights) vs optimized (3); both lock resolution, use the same seven poses and effects, disable idle and per-frame collision diagnostics, warm up then record 21 samples per viewport/mode. Report CPU frame p50/p95, CPU submission, RAF cadence, optional GPU p50/p95 and unique query sample count, whole-frame draw calls, triangles, texture/geometry counts and GPU renderer string. Default CI uses SwiftShader; BENCH_HARDWARE=1 removes forced software flags but hardware must be confirmed by renderer string. This comparison isolates light pooling and common code optimizations; does not compare actual historical V0.22 binaries or quantify idle queue improvement. Benchmark numbers and visual acceptance remain pending until execution.

## Follow-ups
Physical GPU tests on iPhone Safari and desktop Chromium; measure network/decode bytes, shader compilation, light/mesh instancing, LOD transitions and per-pass AO downsampling. WebGPU/TSL as a separate comparison with WebGL compatibility. Use measured baselines to set regression budgets.
