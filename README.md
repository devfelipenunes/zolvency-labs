# Zolvency Labs — V0.0

Experimental scroll-driven visual study. Not a final institutional release.

## Local preview

```sh
git clone https://github.com/devfelipenunes/zolvency-labs.git
cd zolvency-labs
python3 -m http.server 8000
```

Open http://localhost:8000 and scroll. No backend or mandatory clicks. Three.js 0.180.0 loads from jsDelivr; the local Canvas2D fallback runs without internet. In the browser console, `window.__renderMode` reports `three` or `canvas` once loading finishes.

## Vercel

Import this repository, choose the Other framework preset, leave build and install commands unset, and use the root as the output directory. The configuration serves static files only. Use a plan that permits the intended use; Vercel Hobby is limited to personal non-commercial use. No paid plan is authorized by this repository.

## Limitations

The fallback was validated in desktop and mobile Chromium. Three.js/WebGL was not validated in the restricted test environment. The geometry, copy and mark are provisional. Next: bundle Three.js locally, verify WebGL and refine geometry, materials and cinematic scroll transitions.
