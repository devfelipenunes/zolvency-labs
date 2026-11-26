# Zolvency Labs V0.12 — Cinematic Art & Industrial Design

V0.11 camera and narrative retained. Original hard-surface industrial assets: articulated open-frame ledger modules, layered cryptographic gate, multi-die processor, six-stage cryostat, Stellar stations and loose components. Seven PBR finishes, deterministic microtexture, studio lighting and local additive glow. No external assets.

Node 22.12+: npm install; npm run dev; npm test; npm run build; npx playwright install chromium; npm run test:browser. Build generates indexed GLB for ledger, processor, cryostat and an authoring JSON catalog of 52 parametric variants. Website starts with the shared procedural mesh blueprints and asynchronously replaces processor/cryostat by GLB when the camera approaches. No mandatory asset downloads before WebGL startup.

Blender authoring: npm run export:models; blender -b -t 2 --python scripts/blender-library.py -- artifacts/authoring/catalog.json artifacts/blender . This generates an editable .blend library of collections and separate hero GLBs. Blender outputs are reference/editing assets, not the production build inputs yet. See docs/industrial-art.md. Reduced motion and Canvas2D remain. ?renderer=canvas forces fallback. Experimental noindex, not a commercial launch.
