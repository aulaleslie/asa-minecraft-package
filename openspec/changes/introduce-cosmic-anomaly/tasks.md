# Tasks

## 1. Approval and targeted feasibility

- [x] 1.1 Record maintainer approval of these artifacts and the explicit apply request; verify approval covers cow retirement and the agreed guardian contract before runtime edits.
  - Recorded 2026-11-01: maintainer (aulaleslie) approved all artifacts and issued `/opsx:apply`, covering `sinbad:baseline_mob` retirement without saved-cow conversion and the guardian contract (200 HP, 8 damage / 3 s, 16-block range, ~8-block guarding). This does NOT approve gameplay scripts; see 1.2.
- [x] 1.2 Check official Bedrock documentation and pinned Creator Tools support for persistent spawn anchors, bounded hovering, hostile exclusions, line-of-sight beam damage/cooldown synchronization, emissive rendering and death sequence completion on recorded stable Minecraft 26.60; record supported native mechanisms and documentation links in design.md. If any contract cannot be met natively, stop affected work and obtain explicit approval for a concrete script design or scope change; do not mark feasibility complete with unresolved blockers.
  - Closed 2026-11-01 for documentary/tooling feasibility. Script API direction approved; module pin `@minecraft/server` 2.11.0, damage-event APIs and cause `magic` verified; emissive approach (`entity_emissive_alpha` + TGA alpha mask) accepted by the pinned validator, but the 0.20.0 preview ignores materials so it cannot demonstrate emissivity. NOT proven: installed-iOS compatibility with 2.11.0, `minecraft:home` persistence, hover tuning, raycast accuracy, beam timing, lethal-hurt cancel and dying sequence, emissive glow, multi-guardian responsiveness. These stay pending device checks under group 5 (see design.md).
- [x] 1.3 Define the ordinary-hostile target list and explicit boss/neutral exclusions, damage timing measurement and proposed collision/hover bounds; document them with an acceptance matrix covering representative inclusions, exclusions and obstructed targets.
  - Done 2026-11-01 (planning only): allowlist, exclusions, query-budget safeguards, bounds, timing method and acceptance matrix (A1-A16) in design.md; all device rows Pending. Maintainer decision list defaults to excluded.

## 2. Guardian identity and visual assets

- [x] 2.1 Preserve original concept files unchanged and archive copies with provenance under assets/references/; document supplied lore separately from approved adaptations and verify original checksums remain unchanged.
  - Done 2026-11-01: archived copies and `PROVENANCE.md` in `assets/references/cosmic-anomaly/`; originals under `ideas/mobs/cosmic-anomaly/` untouched; `sha256sum -c SHA256SUMS` passes for both locations. Image origin/author is unrecorded.
- [x] 2.2 Create canonical custom geometry, texture, luminous material/render wiring, black center and four segmented tentacles for a roughly six-block ring; verify pinned-tool browser inspection shows the approved silhouette and daylight/darkness readability.
  - Implementation (done 2026-11-01): geometry, TGA texture and `entity_emissive` render wiring; ring, solid black center and four distinct tentacle chains generated and committed. Pinned-tool render of the packaged archive with a preview-only opaque texture copy shows the pale ring, solid black center and darker-yellow ribbons.
  - Verification NOT done / pending: glow, and daylight/darkness readability (device, 5.2); with the shipped alpha mask the 0.20.0 viewer draws the ring invisible and the ribbons translucent (it treats alpha as transparency), so browser review (5.1) must use the opaque preview copy.
- [x] 2.3 Wire idle tentacle/body motion, firing and finite death animation plus existing firing/death sounds; document preview commands and verify visible motion and complete animation references, reserving runtime proof for device checks.
  - Implementation (done 2026-11-01): idle, fire and death animations, controller, `sinbad:firing`/`sinbad:dying` properties and death sound wired; static validation covers every animation, controller, sound-effect and property reference; preview commands documented in docs/cosmic-anomaly.md.
  - Verification NOT done / pending: visible motion, sound audibility and the finite death sequence were not observed in the preview; runtime proof is reserved for 5.1/5.2.
- [x] 2.4 Add `sinbad:cosmic_anomaly` with readable names and Creative egg; update active identity/geometry catalog and remove the five cow runtime assets and obsolete localization entries. Verify the new catalog matches runtime declarations and old identifiers are not repurposed.
  - Done 2026-11-01: `sinbad:cosmic_anomaly`, names and egg added; catalog updated; five cow runtime assets and obsolete lang entries removed; tests reject the retired identifier.

## 3. Guardian behavior and lifecycle

- [x] 3.1 Implement the approved anchored hovering and persistent lifecycle without natural spawning or a spawn cap; document behavior and verify per-instance anchors survive save/reload and prevent chasing beyond roughly eight blocks on device.
  - Implementation (done 2026-11-01): native `minecraft:home` (radius 8, `all_movement`), `minecraft:persistent`, no `minecraft:despawn`, no spawn rules or cap, `spawn_category: misc`, hover movement (height `[3, 6]` provisional).
  - Device verification PENDING, not performed: per-instance anchor survives save/reload; no chasing beyond ~8 blocks; hover height and movement tuning (5.2, 5.3).
- [x] 3.2 Implement 200 health, no regeneration, no friendly retaliation, no loot/experience, and a completed death sequence before removal; add relevant static validation and device acceptance steps, verifying damage/death and no player/neutral retaliation.
  - Implementation (done 2026-11-01): 200 health, no regeneration, no loot/XP, no native attack or retaliation behaviors, intercepted lethal damage with the finite death sequence; `/kill` and void bypass by design; static validation and tests added.
  - Device verification PENDING, not performed: damage and death, no regeneration, no player/neutral retaliation, the complete death animation before removal, no drops (5.2).
- [x] 3.3 Implement single-target central beam with eight base damage, three-second interval, 16-block maximum range and clear line of sight, using the approved target list; verify hostile targeting, defenses, obstruction and cooldown, and no damage to players, animals, bosses or blocks in mixed scenes. Add meaningful automated checks for any introduced logic where supported and document runtime measurements.
  - Implementation (done 2026-11-01): script beam with the Task 1.3 allowlist, 8 damage, 60-tick cooldown (reset on load), 16-block range, block-ray line of sight and bounded fair scheduling; `logic.js` rules covered by automated tests (`tests/guardian-logic.test.mjs`).
  - Device verification PENDING, not performed: hostile targeting, defenses vs. the 8 damage, obstruction, cooldown timing, exclusions and bystander/block safety in mixed scenes; filter-before-limit assumption (A17a/b); runtime measurements (5.2, 5.4).

## 4. Validation, packaging and update documentation

- [x] 4.1 Replace cow-specific archive required files and validation test paths with the approved guardian asset set; extend missing-reference checks for introduced animation/controller/effect assets and add negative fixtures. Verify `npm run validate` and `npm test` pass while missing assets, identity drift, invalid dependencies and malformed archives still fail.
  - Done 2026-11-01: archive-required files, validation and tests use the guardian asset set; new reference, script, dependency and spawn-rule checks with negative fixtures; `npm run validate` and `npm test` (56 tests) pass.
- [x] 4.2 Update README, preview/iOS procedures and evidence handling for guardian-specific visual and runtime acceptance, preserving baseline history and the exact-candidate public release gate; verify the evidence validator rejects incomplete or mismatched guardian acceptance rather than accepting old baseline evidence.
  - Done 2026-11-01: README, docs/cosmic-anomaly.md, docs/verification/cosmic-anomaly-acceptance.md and the schema 2 evidence template/validator; the validator rejects baseline (schema 1), unbound, incomplete or mismatched guardian evidence (tests).
- [x] 4.3 Document backup requirements, unsupported saved baseline instances, new identity and rollback through a restored backup; verify documentation promises neither conversion nor saved-cow survival, and retain historical attribution/evidence.
  - Done 2026-11-01: backup, unsupported saved baseline instances, new identity and restore-from-backup rollback documented in docs/cosmic-anomaly.md; no conversion or survival is promised; baseline history kept.
- [ ] 4.4 Use the pinned toolchain and version synchronization command to choose an increasing candidate version; run `npm run candidate` and inspect both packaged packs, versions, dependencies, asset completeness and unchanged permanent UUIDs. Record revision/version/SHA-256 and verify CI produces the corresponding downloadable artifact.
  - Partial 2026-11-01: version 0.2.0 synchronized; `npm run candidate` passes locally; both packs, versions, dependencies (script module version kept as a string), assets and permanent UUIDs inspected. NOT done: revision/SHA-256 recording and CI artifact verification need a clean committed revision and a pushed workflow run (the working tree is uncommitted, so any local checksum is not final).

## 5. Candidate integration and human acceptance

- [ ] 5.1 Record candidate-bound browser review of ring/center/tentacles, texture, luminosity and idle/firing/death animations; verify results identify the exact packaged sources and remain separate from device evidence.
  - Note: the opaque preview copy shows the silhouette only and is not the shipped texture; also record the viewer's result for the shipped texture. Appearance acceptance (shipped ring visibility, glow) rests on the device (5.2).
- [ ] 5.2 Obtain parent/child fresh-install iOS results for egg/name, both active packs without experiments, appearance, animation, sound, guarding, health, targeting, safe beam timing/range/obstruction, death and no drops; record tester/date/device/Minecraft version and exact candidate identity, leaving missing checks pending.
- [ ] 5.3 Obtain parent/child save/reload, leave-and-return and backed-up baseline-world update results; record persistent guardian anchors, both packs remaining active, old egg absence, new egg functionality and actual saved-cow outcome against the exact candidate.
- [ ] 5.4 Observe representative combat and a small multi-guardian scene on iOS for responsiveness and the agreed fun/size/balance; record spawn count and observations without claiming unlimited performance. Obtain explicit approval for any changes to agreed health, damage, timing or guarding scope and retest affected candidate behavior.
- [ ] 5.5 Review all acceptance scenarios and provenance against the delivered candidate; verify local validation/tests/package and required human evidence pass before declaring runtime acceptance complete. Keep public release blocked until exact-candidate evidence passes and publication is explicitly requested.

## Workflow follow-up

- Archive only after implementation review and required verification, or an explicitly documented maintainer-approved closure scope that does not misreport untested results.
- Publish only through the existing manual exact-candidate evidence gate on a separate explicit request.
