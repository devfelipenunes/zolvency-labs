# R112–R115 — threshold acceptance gates

Scope: landing page → immersive facility. All later camera rails, geometry and public content remain unchanged.

Candidate: stable preparation slot and matched editorial/3D reveal; low-priority opening GLB and three typeface resources after first paint; decoder initialization only on facility intent; readiness requires a new submitted frame at the requested progress with valid narrative. This is not display scanout or hardware FPS evidence.

Comparison:
- Control: /?hybrid=1&hybrid-perf=control&type-threshold=control&hybrid-seam=control
- Candidate: /?hybrid=1
- Isolate: hybrid-prefetch=control, hybrid-fonts=control, hybrid-decoder=control, hybrid-seam=control, hybrid-warmup=control, type-threshold=control.

R114 workflow: 390px Chromium software renderer, four independent cold jobs (control/candidate × local/limited network). Limited is 180ms RTT, 1.6 Mbps down, 0.8 Mbps up; candidate limited intentionally delays opening GLB then crosses into reading mode, verifies no spontaneous mid-story swap and returns to threshold. Do not treat that deliberate-delay time as directly comparable. Record first paint, request durations/bytes, portal-to-ready, preparation stages, title/control positions, settled poses, screenshot sequence and errors. Full hybrid matrix still checks 390 and 1280 live and editorial/reduced motion; first later encounters measured before end jump. Evidence must come from same candidate SHA.

Acceptance: no WebGL during initial editorial paint; no graphics fetch on direct research; bounded idle fetch; no unexpected layout shift on readiness; no blank interval; no late 3D swap; smooth reversal; screenshot approval at matching progress; no later first-use regression hidden by startup improvement. Physical Safari and Android still required for true fluidity. Do not publish production or claim user approval from automation. Avoid adding effects or assets until entry passes physical review.
