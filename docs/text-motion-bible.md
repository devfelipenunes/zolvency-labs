# Zolvency Labs — Text Motion Bible V1
**R62 / Living Typography / design draft**  
Reference: R60 `f0ebe00` (reported 7/7 manual tests on iPhone 16e; native scroll browser CI passed). No production changes in this proposal.

## Art direction and copy
One coherent extruded 3D title and short supporting line per act. Network-agnostic blockchain positioning; cryptography, AI and quantum research complement it. Keep existing scene/rail identifiers internally until a coordinated migration. Never surface the legacy third-act name in public copy or accessibility labels. Keep original logo distinct from the title; do not duplicate HTML copy over WebGL. Retain accessible semantic copy and reduced-motion/2D fallback.

## Reference board
- [MaleX Studio — Words](https://malex.studio/projects/words-kinetic-type): mass, contact, reassembly.
- [Magnetic Typography System](https://www.behance.net/gallery/243462269/Magnetic-Typography-System-Motion-Design-Physics): character attraction and lock.
- [Future Typo](https://www.jantomas.com/future-typo/): spatial letterforms and sculpture.
- [MoGraph Life — Typography & Font Experiments](https://www.mograph.life/work/typography-font-experiments): assembly/disassembly.
- [Blender glTF export manual](https://docs.blender.org/manual/pt/latest/addons/scene_gltf2.html): sampled transform animation export.
These are design references, not licensed source assets. Use original geometry and verify font redistribution rights.

## Modeling and rig
Compare Space Grotesk, Manrope and Inter, Medium/Semibold. Preserve kerning, curves and readability. Initial depth 6–10% cap height; bevel 0.5–1.5%; roughness 0.35–0.55. Compare satin titanium, mineral white, restrained green accent; side light to reveal depth. Keep editable text/curves in a source collection; export triangulated mesh copies with shared materials. Rig hierarchy: act root > word group > character pivots. Use instancing for repeating glyphs where appropriate; compare draw calls versus merged settled geometry. Avoid high-poly bevels and unnecessary shadows. Preserve no-copy/logo duplication rule.

## Motion contract
The camera owns time: evaluate a deterministic pose for normalized rendered progress p, not elapsed seconds, not the native scroll target. Sample exactly the same tracks on forward/reverse, pause while p is stationary, never run physics after finger reversal or during loading. Existing optical mask remains authoritative. Rig collisions offline with primitive/convex proxies and low restitution, then bake and clean transforms; export GLB tracks or compact sampled TRS with quaternion interpolation. No runtime rigid body engine. Use guided push + magnetic settle as common vocabulary; limit overshoot to 8% glyph height and entry rotation to 12 degrees as starting hypotheses. Final reading transform is exact, not an endlessly oscillating spring. An intentional rebound may use a damped response, but clamp the final hold to its rest pose and zero derivative. Do not call simulated contact physically validated until tested against scene geometry. GLB must be preloaded/prewarmed as part of R60 startup; no late network requests.

## Seven acts
Global camera-progress intervals below are proposals; camera poses are unchanged. Read windows contain the existing authored hold. Refine against actual Blender camera/framing and current masks; short intervals may require an adjusted text reveal or reading dwell after separate review.
### 1. ORIGIN — Magnetic assembly
**Beyond the known.**  
Engineering the next generation of digital infrastructure.

- Placement: Hangar axis, separate from existing brand mark; test support and silhouette.
- Entrance: Letters converge in depth and align from the edges toward the center.
- Secondary motion: Small damped overshoot, no repeated bounce.
- Exit: Move with the approaching camera and disappear behind the next framing.
- Global progress: entrance 0–0.043; reading 0.043–0.083; existing hold 0.055; exit 0.083–0.115.

### 2. BLOCKCHAIN — Guided push / lock
**Trust by design.**  
Building decentralized, verifiable and programmable systems.

- Placement: Server frontage lateral plane, clear of doors and moving parts.
- Entrance: Word blocks travel along the aisle direction and settle against a virtual stop.
- Secondary motion: One restrained recoil; title holds while the body settles.
- Exit: Retreat along the same axis.
- Global progress: entrance 0.125–0.193; reading 0.193–0.275; existing hold 0.205; exit 0.275–0.31.

### 3. INFRASTRUCTURE — Modular magnetic docking
**Built for scale.**  
Infrastructure for digital assets, payments and institutional operations.

- Placement: Rack aisle, keep LEDs and equipment readable; do not cover glass.
- Entrance: Word modules converge from two adjacent planes with staggered docking.
- Secondary motion: Sequential alignment, no loose fragments during reading.
- Exit: Separate behind the existing optical mask.
- Global progress: entrance 0.315–0.393; reading 0.393–0.415; existing hold 0.405; exit 0.415–0.505.

### 4. CRYPTOGRAPHY — Precision assembly
**Verify without revealing.**  
Privacy and security through advanced cryptographic systems.

- Placement: Security portal side, outside door swing and camera path.
- Entrance: Complete glyphs align from discrete offsets, using a controlled stagger rather than shattered triangles.
- Secondary motion: Near-inelastic lock, no rotation during reading.
- Exit: Retract behind the portal edge.
- Global progress: entrance 0.54–0.613; reading 0.613–0.638; existing hold 0.625; exit 0.638–0.65.

### 5. INTELLIGENCE — Traveling impulse
**Intelligence in motion.**  
Connecting artificial intelligence with autonomous digital systems.

- Placement: Beside or behind console, do not obscure controls.
- Entrance: A single traveling push propagates through word groups with a small delay.
- Secondary motion: Damped spring response once, then static.
- Exit: Follow the optical transition toward the next room.
- Global progress: entrance 0.681–0.718; reading 0.718–0.755; existing hold 0.73; exit 0.755–0.805.

### 6. QUANTUM — Orbital convergence
**Beyond classical limits.**  
Exploring the next frontier of computation and security.

- Placement: Lateral cryostat composition; preserve machinery silhouette.
- Entrance: Letters arrive on shallow arcs around a common focal axis, not a spinning title.
- Secondary motion: Angular damping and exact final alignment.
- Exit: Separate along authored arcs under the masked transition.
- Global progress: entrance 0.875–0.923; reading 0.923–0.943; existing hold 0.935; exit 0.943–0.95.

### 7. CONVERGENCE — Hero assembly
**Engineering what comes next.**  
Where blockchain, cryptography and emerging technologies converge.

- Placement: Final hangar brand composition, maintain logo dominance and clear floor.
- Entrance: Large word groups converge toward the final brand composition, avoiding a second duplicate logo.
- Secondary motion: Minimal recoil, stable closing frame.
- Exit: None; remain readable until user reverses.
- Global progress: entrance 0.978–0.988; reading 0.988–1; existing hold 0.992; exit none.

## Blender production order
1. Import R60 real geometry and rail/hold poses; use matching aspect and focal lengths. Verify existing camera export covers every act, extend it before claiming coverage.
2. Build three material/font swatches and compare mobile renders. Prototype Blockchain (push), Infrastructure (docking), Cryptography (precision lock) first.
3. Animate at 30 fps authoring reference, sample by progress for web. Preserve source .blend; export GLB and manifest with coordinate convention, bounds, track duration, hashes, material and triangle counts.
4. Render start/hold/end and transitions at 390×844 and desktop; inspect actual occlusion and safe areas. Test at 320 and 430 CSS px, short landscape, reverse, resize, reduced motion. Validate font rights.
5. Integrate only as an opt-in preview, A/B against R60. No default changes without review.

## Acceptance / preliminary budgets
- All seven manual R60 navigation checks plus true native touch from origin, forward/reverse, no duplicate text.
- Exactly one public copy composition, no network-specific name, no pop-in (except fully masked cut), readable title/body at all seven holds, no clipping, unintended occlusion, or geometry intersection. Semantic text remains accessible.
- At 320/390/430 CSS px, projected title at least 24 px and body 15 px as initial targets; contrast aim 4.5:1 for normal copy, evaluate rendered images rather than material color alone.
- Candidate incremental budget: <=12 draw calls, <=25k visible text triangles, <=400kB compressed text asset payload across seven acts. These are proposed caps, not measured performance; report baseline/candidate deltas.
- Physical iPhone 16e: compare p95 active frame intervals against R60, aim <=33.3 ms sustained during movement (30 FPS goal); 60 FPS aspirational. Record cold/warm startup, GPU memory proxy, draw calls, dropped frames, long sessions and visual quality. No claim based on SwiftShader alone.
- Do not change the camera or GPU A settings in the first typography experiments.

Machine-readable direction: [text-motion-bible.v1.json](text-motion-bible.v1.json). This file describes intent and validation, not an implemented animation.
