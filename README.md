# Zolvency Labs — V0.30.1

Independent technology company. Cinematic institutional experience, React/Vite and Three.js.

## Local development

Node.js 22 (22.12 or newer), npm. On the first checkout:

```sh
npm install
npm run dev
```

On an existing checkout with dependencies installed:

```sh
git pull --ff-only
npm run dev
```

All 21 locked facility GLB/HDR files (7,571,663 bytes at this revision) are included in ordinary Git under `assets/vendor/facility/`. No Git LFS, model-provider access, special environment variables or additional model download is required. The default predev/prebuild stage checks each byte length and SHA-256 against the original locks and restores missing or corrupt generated files using the local verified cache or bundled files. Generated `public/models/` and cache remain ignored, avoiding conflicts with previous local staging. Three.js decoders and typeface are copied from installed npm dependencies. An initial npm install (and subsequent dependency updates) still requires npm registry access or a populated package cache.

## Verification

```sh
npm test
npm run build
npm run facility:offline
npx playwright install chromium
npm run test:smoke
```

A missing or invalid bundle fails closed; do not disable TLS or integrity checks. To explicitly refresh model bytes during maintenance only, use `FACILITY_SOURCE=upstream npm run facility:stage` or `FACILITY_SOURCE=published npm run facility:stage`. Update the bundled files and locks together after verifying provenance, licenses and integrity. See `assets/vendor/README.md`. No credentials, certificate secrets, dependency directories or cache are committed. `npm run dev:canvas` remains an explicit 2D fallback.

Production build remains strict; no external model network requests by default. See docs/visual-roadmap.md and docs/industrial-art.md. Experimental noindex, not a commercial launch.
