# Zolvency Labs — V0.2 Camera Journey (greybox)

Experimental three-act Woven Systems study: Origin → Exploration → Connection. Independent Technology Company; Stellar as the initial focus. Not a commercial launch or a final visual identity.

## Run
Node 22.12+.
```sh
npm install
npm run dev
npm test
npm run build
npx playwright install chromium
npm run test:browser
```

The browser script tests the local production build, records desktop and mobile screenshots in artifacts/, logs the actual renderer, checks exact scroll reversal, keyboard End, reduced motion, fallback and static geometry allocation. Browser/CI screenshots are software-rendered where available and do not establish physical-device performance. Use ?renderer=canvas to force fallback. Inspect #stage data-pose, data-renderer, data-geometries and data-draw-calls.

## Architecture
- camera.js: separate position and target keyframes, fixed 42°/58° lens, deterministic scroll mapping, stationary final reading window.
- world.js: persistent original strands, elliptical threshold, nave and distant node.
- threeScene.js: one-time tube meshes and opaque basic greybox materials; render on demand.
- fallback.js: shared centerlines projected in Canvas2D.
- React semantic copy in flow; brand absolute rather than fixed.
- The remaining three acts of the full website are deferred until this proof is reviewed.

References and acceptance: https://app.notion.com/p/4249c563042581e5ac44efa7afc4a6c2
No backend, no paid assets, no scroll lock, no external browser benchmark. Vercel Vite build outputs dist. Physical WebGL performance and final artistic approval remain gates.
