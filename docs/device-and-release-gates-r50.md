# R50 — physical device and release gates

Related: #36 #66 #97 #100 #116 #15 #85 #106. Software Chromium results are not hardware evidence. At R50 the registered desktop was offline, and iOS/Android devices were unavailable. Do not record invented FPS, GPU or commercial approval.

## Physical-device capture

Use the exact approved candidate SHA and local or explicitly approved preview URL; do not deploy main to obtain a test URL. For a local checkout, run Node 22, npm install, npm run build, npm run preview -- --host 0.0.0.0. Use a trusted local network for real phones and stop the server afterward. Open /?experience=editorial&direction=staged&copy=manifesto&profile=economy&lighting=local&travel=responsive&framing=portrait&transmission=threequarter&device-study=1 . Keep diagnostic benchmark mode OFF. For iOS use Safari Web Inspector on a paired Mac if available; Android Chrome remote debugging or desktop browser console.

After loader disappears, call document.querySelector('#stage').startDeviceStudy() in the inspector console. Scroll normally through all seven acts, pause to read, reverse, and test faster scroll. Export JSON via JSON.stringify(document.querySelector('#stage').stopDeviceStudy(), null, 2). Repeat with matching viewport, browser and device, three trials per candidate/control; alternate order. Record SHA, device category (not serial/account), browser/version, power/thermal state, viewport, DPR, selected query flags, trial order, startup/cold-cache conditions. Do not store personal browsing data.

Report legacy filtered p50/p95 and allActiveIntervals p50/p95/max/over50ms/over250ms/truncated. Missing GPU timer = unavailable, not zero. Latest scroll-to-CPU submission proxy is not input-to-photon; geometry/texture counts are not VRAM bytes. Long active gaps can be scheduler stalls. Test idle/hidden, resize, fallback and reduced motion separately. Compare images and performance before selecting AO, bloom, fixed scale or resource-budget variants; no automatic promotion from SwiftShader.

## Release decision checklist (not approved)
- [ ] Exact combined candidate head: full CI, matched images, scroll forward/reverse, no unintended geometry collisions or occlusion.
- [ ] Physical desktop, iOS and Android evidence; explicit limitation review if a device is unavailable.
- [ ] Confirm approved commercial hosting plan, domain, contact destination, privacy/SEO/indexing and final institutional copy with both founders.
- [ ] Dependency/security review, licensed asset inventory, rollback rehearsal, exact deployment SHA and smoke checks.
- [ ] Explicit founder authorization before commercial production deployment. Do not purchase a service or change public defaults without authorization.

Production remains 0.30.1 until the release decision. Candidate branches and diagnostic parameters are not production approval. #15 remains open.
