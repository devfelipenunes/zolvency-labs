# V0.30 — photographic realism study

Parent candidate: PR #102, fda6faf57512b3f5df00be5d945f07e81c5adf1f. Production V0.29 is 6538f93528beb83629f4efa594998cc200509a80.

## Evidence and decisions
Desktop narrative artifact 15121422111 (27 frames) confirms 100% body opacity at non-Quantum holds, but all three roles are now simultaneously present. Opening logo projected width: default 13%, mid 22%, close 27%; mid/close are free-space, not wall-mounted. Higher finale has a better aim but floor still competes. Stellar and Quantum remain protected reference subjects. No default promotion until portrait and transition evidence.

## Independent candidates
- surface: existing PBR textures preserved, restrained roughness/environment response; no synthetic texture atlas or geometry.
- bounce: reduce camera-following fill, rebalance local light/environment; not true indirect GI.
- depth: restrained scene-depth fog, no volumetric beams or physical scattering claim.
- motion: existing status LEDs and existing crane 4m travel retimed; deterministic, reverse-compatible. Opening clearance sampled.
- reflection: desktop-only actual static room captures, 64px PMREM in three existing sets; capture once per room; no glass/Quantum override. Record startup cost, count and texture use. Not a mirror or a baked lightmap.
- combined: all eligible treatments (desktop; mobile excludes reflection).
- hero-brand: larger fixed world-space opening logo candidate; support not assumed. Compare after visual inspection.
- baseline: existing appearance, no changes unless diagnostic mode is selected.

Run REVIEW_GROUP=realism REVIEW_VIEW=desktop (or mobile) node scripts/visual-review.mjs after npm run build and Chromium installation. New workflow is isolated from the current nine-job V0.29 matrix. Seven reference holds × 7 modes desktop, six modes mobile, plus three hero frames per view. Record repeated timings, source UV/material audit and 81 opening clearance samples for relevant modes. Software renderer is not a real hardware benchmark.

## Actual baked lighting / lightmap feasibility
The surface audit records UV, uv1, uv2, AO, lightMap, normal, roughness and transparency across loaded meshes. UV presence alone is not proof of unique non-overlapping lightmap islands. Start with static hangar floor/walls and bridge shell only; exclude doors, crane, transparent surfaces and the Quantum reference. Next require an actual Blender/Cycles bake with verified decompression/import, unique secondary UV layout and padding, linear lightmap texture, source asset hashes and exact mesh identity. Compare render with/without lightmap, check texture and transfer budgets, seams, moving shadow interactions, portrait and real GPU; do not attach an untested lightmap to production. Blender not available in the current local runtime; no actual bake claimed here.

Technical references: Three.js r180 PMREMGenerator source https://github.com/mrdoob/three.js/blob/r180/src/extras/PMREMGenerator.js and MeshStandardMaterial https://threejs.org/docs/pages/MeshStandardMaterial.html.

## Promotion
Inspect PNGs, motion video and metrics at exact head. Prefer independent successful changes rather than automatically promoting combined. Keep production default unchanged until visual acceptance, collision and performance checks; merge only verified increments. Reuse existing asset lock; no new GLBs or paid assets.
