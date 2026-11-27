# Zolvency Labs — Immersive Experience 2.0
Status: proposal / research, 2026-11-27. No runtime change or production authorization.
## Intent
Transform the site into an editorial institutional experience with an optional, continuous transition into the existing facility. R88 A (no parallax) is the selected visual reference. R93 merged into preview only; PR #218 remains open. R89–92 are independent experiments and not automatically included. Avoid adding motion merely for novelty. English draft copy and business claims require owner review; no invented clients, products, or partnerships.
## Evidence and constraints
Current App.jsx mounts Stage immediately, starts a dynamic import, and can lock document scroll and focus behind full preflight; useScrollStory.js measures the first section at zero and uses whole document max, coupling the rail to the existing page. Hybrid layout needs a separately measured facility range, no global lock, and explicit lifecycle. Existing Three.js, React, Vite and native scroll are the default stack; do not migrate to R3F, Lenis, GSAP or WebGPU unless a measured need appears. Keep legacy preview query working.
## Research references
- KODE: https://tympanus.net/codrops/2025/06/16/inside-the-frontier-of-ai-webxr-real-time-3d-crafting-kode-immersive/ — entry into a spatial world.
- The Spark: https://tympanus.net/codrops/2026/01/09/the-spark-engineering-an-immersive-story-first-web-experience/ — story-first shared scroll state.
- Trionn: https://tympanus.net/codrops/2026/07/15/the-architecture-behind-trionn-coordinating-gsap-three-js-lenis-and-web-audio/ — coordination and noncritical work.
- ZERO: https://tympanus.net/codrops/2026/07/17/zero-the-engineering-behind-a-defiant-interactive-narrative/ — desktop/mobile rendering and timing.
- MERSI: https://tympanus.net/codrops/2026/07/27/between-print-and-digital-the-making-of-mersis-website/ — editorial structure.
- Podium: https://tympanus.net/codrops/2026/06/23/podium-building-a-website-where-running-becomes-storytelling/ — unified scene and interaction state.
- https://web.dev/articles/vitals ; https://www.w3.org/TR/WCAG22/ ; https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices ; https://web.dev/articles/codelab-code-splitting
## Direction
A + D: Threshold + Digital Exhibition. Blueprint and typography-to-space are candidate transition motifs. Hero in semantic HTML, restrained kinetic type, portal aligned with first actual camera frame, facility (A), editorial exit into research/product pages and contact. Native scroll, no artificial dwell outside facility, skip links. Desktop/mobile variants keep identical meaning. Design review before runtime implementation.
## Roadmap
| Revision | Deliverable | Depends on | Acceptance |
|---|---|---|---|
| R94 | Reference matrix, content audit, narrative, three concept storyboards | — | Each design states what user learns and why motion matters; owner selects |
| R95 | ADR + state contract for editorial, threshold, facility, exit and fallback | R94 | Reversible mapping independent of document height; boundary and resize tests |
| R96 | Static/prerendered landing hero, nav, typography, design tokens | R94 | Useful content before graphics load; direct links; no layout jump |
| R97 | Editorial manifesto, copy hierarchy and motion grammar | R94,R96 | Readable with JS/animation disabled, no unsupported claims |
| R98 | Portal prototype (aperture / matched typography / blueprint) | R94,R95 | Selected visual target; forward/reverse transition, no abrupt cut |
| R99 | HTML-WebGL handoff, matched camera/FOV/color, one scroll owner | R95,R98 | Slow scrub, reverse, fast skip, resize, refresh, no duplicate text |
| R100 | Deferred module import, first-scene asset priority, preflight lifecycle | R95 | No modal lock; loading failure leaves content navigable; cancel/resume |
| R101 | Mount approved A via isolated adapter, use local facility progress | R95,R99,R100 | 197-pose regression, touch and desktop matrix, no parallax by default |
| R102 | Optional one meaningful research demo (signed mandate or proof) | R101 | Clearly labeled prototype; sandbox; keyboard/reduced-motion path; no real funds |
| R103 | Research/product pages, evidence, CTA and contact | R94,R96 | Accessible deep links, approved claims, functioning contact destination |
| R104 | Optional sound design, user-controlled ambience | R99 | Muted default, explicit opt-in, mute persists, no audio on hidden tab |
| R105 | Keyboard, reduced motion, navigation, SEO and fallback audit | R96,R99,R101,R103 | WCAG 2.2 AA target and voluntary motion-disable AAA criterion; focus and skip paths |
| R106 | Device performance, lifecycle, memory and network profiling | R101,R105 | Physical Safari and Android traces; budgets; WebGL loss recovery; no hidden render loop |
| R107 | Release review, rollback and docs | R103,R105,R106 | Owner approves content and experience; all mandatory gates, no production without approval |
## Architecture
Native scroll -> measured section ranges -> deterministic experience controller -> editorial DOM and facility adapter. Experience progress and asset readiness are orthogonal: idle / loading / ready / error, not a blocking global phase. Deep links to research or contact must not mount the engine unnecessarily. A static matched poster bridges an unready portal; no camera entrance until ready; do not change scroll position automatically. Unmount or suspend outside range, respect visibility and reduced motion; bound memory; recover to HTML on context loss. Compare retain-and-pause vs dispose-and-recreate on real devices.
## Release metrics (proposed targets, not measurements)
Field Core Web Vitals at p75 per device class: LCP <= 2.5s, INP <= 200ms, CLS <= .1. Initial compressed JS budget <= 150 KiB, hero payload <= 500 KiB provisional; measure current baseline and revise with justification. Aim 60 fps on target device with 16.7ms frame budget, adaptive 30 fps fallback if necessary; measure frame intervals, p95, long gaps, CPU/GPU, memory and energy over repeat forward/back journeys. Software renderer cannot establish physical FPS. Test cold/warm cache, constrained network, no WebGL, failed assets, context loss, reduced motion, tab hide/show, fast scroll, anchors, resize, orientation, keyboard and screen reader. Validate 320/390/430/768/1280/1440 widths, physical iOS and Android. No new asset or license claims without inventory.
## Parallel execution
Wave 1: R94 creative research, R95 architecture study, existing R88–92 closure. Wave 2: R96/R97/R100/R103 after relevant contracts; R98 prototype once chosen. Wave 3: R99/R101, then R104 optional and R102 after core. Wave 4: R105/R106 then R107. Prioritize P0 editorial, safe gateway, A integration, direct contact and fallback; P1 narrative polish; P2 audio and research demo. No experimental scope may block the P0 release.
## Decision register
R88 A selected; production unchanged. Proposed: Threshold + Exhibition, native scroll, no required sound, no global loading lock, static fallback. Hero copy, portal shape, exact pacing, product claims, contact destination and budgets require review. Do not claim conversion uplift until measured. Track qualified contact completion, direct navigation, portal entry/exit, fallback rate and CWV using privacy-respecting aggregate events only.
