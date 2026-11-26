# Zolvency Labs — V0.1 React migration

Experimental static frontend. No backend, click-driven navigation, or mandatory services. React + Vite + Three.js, with a Canvas2D fallback and scroll-driven geometry. Three.js is bundled locally; no runtime CDN.

## Local
Node.js 22.12+ recommended.
```sh
npm install
npm run dev
npm test
npm run build
npm run preview
```
Open the local URL printed by Vite. Inspect `#stage[data-renderer]` in DevTools: `three` or `canvas`.

## Vercel
Vite preset; build `npm run build`; output `dist`. Use a plan that permits the intended use. No paid plan authorized. This is a draft, not a final commercial launch.

## Scope
Six chapters; native reversible scroll; responsive scene, reduced motion, canvas fallback. Future: more sophisticated geometry, lighting, Blender assets and cinematic camera. Build and actual WebGL browser validation remain required; no lockfile generated until npm install is run.
