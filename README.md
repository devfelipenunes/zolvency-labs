# Zolvency Labs — V0.29

Independent technology company. Cinematic institutional experience, React/Vite and Three.js.

## Local development

Node.js 22 (22.12 or newer), npm, then:

```sh
npm install
npm run dev
```

The preparation step verifies the locked external model bytes (length and SHA-256), reuses valid staged models and the content-addressed cache in .cache/facility/, and downloads only missing or corrupted assets. A failed download never deletes all existing models or writes unverified files. The manifest is replaced only after successful staging. First-time setup still requires authorized HTTPS access to the model providers; no source-lock bypass or alternate unverified asset is used.

The Node staging launcher includes system-trusted CAs where supported; older Node 22 builds on Linux may use the existing OS trust bundle as NODE_EXTRA_CA_CERTS if no custom bundle is configured. If an enterprise proxy certificate is not trusted, ask IT for its approved CA bundle. Example on Ubuntu:

```sh
NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt npm run dev
```

Keep TLS verification enabled. Do not set NODE_TLS_REJECT_UNAUTHORIZED=0 or disable strict SSL. If the OS itself does not trust the issuer, an IT-approved certificate is necessary.

After a successful initial staging, offline development on Linux/macOS:

```sh
FACILITY_OFFLINE=1 npm run dev
```

Or run npm run facility:offline to verify/restore assets without any network request. On a fresh machine without models, npm run dev:canvas opens the explicit 2D fallback for layout work; it is not the full 3D experience. It does not silently change production.

## Verification

```sh
npm test
npm run build
npm run facility:offline
npx playwright install chromium
npm run test:smoke
```

Production build remains strict: incomplete or mismatched assets fail staging. Cached bytes are always verified against the repository locks. Preserve .cache/facility/ for offline recovery. No generated models, cache files or certificate secrets are committed. See docs/visual-roadmap.md for cinematic review and docs/industrial-art.md for historical design studies. Experimental noindex, not a commercial launch.
