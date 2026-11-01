# Design

## Context

See proposal.md for motivation. Runtime sources are the two canonical packs. The current cow has no animation wiring, scripts or natural spawning. Its five runtime assets and two localization entries are referenced by the identity catalog, archive checks and validation tests. Existing verification documentation is baseline-specific. The pinned toolchain is Node 22.23.4, npm 10.9.9 and Creator Tools 0.20.0; the recorded device target is Minecraft 26.60.

## Goals / Non-Goals

**Goals:** Implement an auditable guardian state model and animated custom geometry, preserve the distribution pipeline and permanent pack identity, and make runtime acceptance measurable.

**Non-Goals:** General entity frameworks, generated replacement pack trees, natural encounters, spawn limits, new items, cosmic-scale simulation, extra powers or public release.

## Decisions

### Canonical assets and provenance

Use custom cuboid-based entity geometry with separate bones along each of four ribbon tentacles, texture/materials, client animation/controller definitions and matching behavior state. Compose an oval ring from segments rather than retaining the cow model. Use a dark center surface and luminous ring material; no dynamic world lighting is required. Continuous idle motion, firing response and a finite death sequence are mandatory; static geometry or sliding alone does not satisfy acceptance. Existing Minecraft sounds are preferred over new audio dependencies.

Keep `ideas/mobs/cosmic-anomaly/info.md` and `download.jpeg` unchanged. Preserve original creative files with provenance in `assets/references/` during implementation. Distinguish supplied lore from the agreed gameplay adaptation and technical interpretation. The proposed death choreography is dimming and curling inward, subject to visual review; its exact timing is an implementation detail.

### Behavior contract and feasibility gate

Model alive/idle, acquire, fire/cooldown and dying states. Store a stable spawn anchor, retain it across reloads and apply each guardian's guarding boundary independently. Select an eligible hostile before attacking, enforce distance and visibility per shot, and bind visual firing feedback to actual damage. Do not implement the beam as a damaging explosion or uncontrolled piercing effect. Use explicit targeting exclusions so family membership alone cannot accidentally include bosses or neutral mobs. Final target IDs and sound choices must be documented before acceptance.

Prefer native entity components, events and animation controllers. This is a proposed approach, not verified support for anchored hovering, precise safe beam timing or delayed death removal on the recorded stable target. Before runtime edits, inspect official Bedrock documentation and pinned tooling to resolve these specific mechanisms and record the supported design here. If native facilities cannot meet the contract, stop the affected implementation and request approval of a concrete stable Script API design, its dependency/UUID implications and bounded scheduling, or an explicit scope revision. This proposal does not authorize gameplay scripts or silent substitutions. A script alternative is therefore a separate approval branch, not a hidden implementation default.

### Focused pipeline evolution

Replace fixture-specific archive requirements and test paths with the approved guardian asset set; extend checks for animation/controller/particle references actually introduced. Preserve malformed JSON, reference, UUID, dependency and archive rejection tests. Do not remove safeguards merely to accommodate the new catalog. Keep natural spawning absent and retain the script prohibition unless a specific later design is approved.

### Explicit retirement

Retire the cow ID rather than repurpose it. Update the identity catalog's active content/geometry set and runtime localization, keeping committed pack/module UUIDs intact. The compatibility delta authorizes only this retirement. Keep historical baseline evidence, archived change artifacts and relevant attribution. Existing-world saved cow behavior is unknown until observed; no migration or retained-instance promise is made for the retired entity.

## Risks / Trade-offs

- Native feature gaps -> Complete the targeted feasibility gate before runtime edits; escalate unsupported behavior rather than reducing the agreed scope.
- Six-block geometry and moving tentacles intersect terrain -> Review collision/selection bounds and hover clearance in-world; visual extent need not imply solid tentacle collision.
- Persistent guardians and unrestricted spawning can increase load -> Avoid whole-world per-tick scanning; assess a small representative multi-guardian scene, with no unlimited performance guarantee or deliberate crash test.
- Friendly-fire or targeting mistakes -> Test players/animals/neutral entities/bosses alongside hostiles, walls and range boundaries on device.
- Death visuals may be cut off by entity removal -> Verify the full sequence and eventual removal on the actual stable device target.
- Lost baseline instances -> Require backup, report actual update behavior, and use restored backups for rollback.

## Migration Plan

1. Obtain maintainer review and an explicit apply request; resolve native feasibility before runtime changes.
2. Preserve source provenance, introduce guardian assets and retire the cow; update narrow tooling assumptions and documentation together.
3. Choose an increasing candidate version using the repository synchronization command; preserve pack UUIDs and matching dependency versions.
4. Run validation, tests and packaging, then associate browser review and human device evidence with the exact candidate revision/version/checksum.
5. Test fresh installation and a backed-up baseline-world update. Keep unresolved checks pending. Roll back through a restored world backup and the prior candidate, not a promise that removed entities recover automatically.
6. Public release remains a separate explicit action subject to the existing evidence gate.

## Script API Design (maintainer-approved direction, 2026-11-01)

Status: direction approved (new permanent script-module UUID, narrowly scoped validation changes). Native JSON alone cannot meet the beam contract (ranged_attack fires physical projectiles; interval scales with distance; no documented delayed removal). Scope and gameplay contract are unchanged. Runtime implementation has NOT started; task 1.2 stays pending.

### Verified documentary facts

- Module pin: `@minecraft/server` **2.11.0**. The npm release sequence supports it (`2.11.0-rc.1.26.60-preview.30` -> `2.11.0`; dist-tag `latest`) but does NOT by itself prove compatibility with the installed iOS build; compatibility is confirmed only by the pinned validator and by the guardian loading with scripts active on the device (device check, pending). The 2.11.0 type definitions (inspected locally) contain `world.beforeEvents.entityHurt`/`entityRemove`, `world.afterEvents.entityLoad`/`entitySpawn`/`worldLoad`/`dataDrivenEntityTrigger`, `Dimension.getBlockFromRay`/`getEntities`, `Entity.applyDamage`/dynamic properties/`getHeadLocation`, `system.runInterval`/`runTimeout`, all without beta markers. `Entity.target` and `BlockRaycastOptions.usePreciseRaycast` are experimental and MUST NOT be used.
- Peer dependencies of 2.11.0: `@minecraft/common ^1.2.0`, `@minecraft/vanilla-data` (types only). Manifest declares only `@minecraft/server`; confirm with the pinned validator.
- Before-events run with restricted-execution privilege: state-changing APIs throw. The `entityHurt` handler may only read and set `cancel`; all mutation is deferred via `system.run`.
- Damage cause: `EntityDamageCause.magic` (listed as magical attacks). `none` is script/command damage. Whether armor/defenses reduce the 8 is a device measurement, not a documentary assumption.
- `Entity.remove()` skips death animation and loot, so the scripted dying state must play first.
- Native pieces confirmed present in installed schemas: `minecraft:home` (`restriction_type: all_movement`), `minecraft:persistent`, `minecraft:damage_sensor`, `minecraft:behavior.random_hover`, `minecraft:movement.hover`, `minecraft:navigation.hover`, `minecraft:can_fly`.

### Emissive feasibility check (2026-11-01, Creator Tools 0.20.0)

Disposable packs were built outside the canonical trees (scratchpad copies of the baseline packs with a test cuboid and 16x16 textures whose alpha is 255 on half and 100 on the other half). Three variants: (a) `entity_alpha` + PNG, (b) `entity_emissive_alpha` + PNG, (c) `entity_emissive_alpha` + 32-bit TGA with alpha. Each was rendered with `mct rendermodel --no-vanilla` and validated with `mct validate main`.

- Observed: the custom geometry and texture render, but all three renders are byte-identical (SHA-256 `60c6f1c14bad4ef6...`). The 0.20.0 browser preview ignores client-entity `materials` and texture alpha, so it **cannot demonstrate emissivity or distinguish texture formats**. This is a recorded preview limitation, not a feasibility failure; emissive appearance is a device-pending check.
- The validator accepted the `entity_emissive_alpha` material name and the TGA texture with the same finding count as the plain PNG variant (no material or texture errors; one render-controller warning is pre-existing in the baseline).
- Documentary basis: Learn material documentation describes `entity_emissive` as using the texture alpha channel for emissiveness and `entity_emissive_alpha` as its transparent variant, and says the texture must be `.tga`. The approved plan was `entity_emissive_alpha` with a TGA alpha mask; the implementation uses the opaque variant **`entity_emissive`** with a TGA texture carrying the alpha emissive mask (ring 0, tentacles 110, center 255; lower alpha = more glow, per community convention, unverified). Reason: a mask value of 0 under the alpha-blended variant could make the ring transparent, whereas a wrong mask under `entity_emissive` only fails to glow. Swapping the material or inverting the mask is a one-line change (`tools/generate-cosmic-anomaly-assets.mjs`, client entity `materials`) and is not a scope change. The guardian therefore uses **`entity_emissive` with a TGA texture carrying an alpha emissive mask** (a texture format different from the baseline PNG is acceptable).
- Not proven: that the ring actually glows on the installed iOS build. That is checked under 5.1 (browser, limited as above) and 5.2 (device). If the device shows no emissivity with this approach, work on the visual contract stops for maintainer direction rather than being reduced silently.

### Device-dependent (pending until tested)

`minecraft:home` persistence across save/reload and ~8-block limit; hover/movement tuning (`movement.hover`, `navigation.hover`, `random_hover` with `home`; no tuning guidance is documented, so this is a testing question); `@minecraft/server` 2.11.0 loading on the installed iOS build; stable block-raycast accuracy at walls/corners/glass; beam timing; defenses vs. 8 damage; lethal-hurt cancel and dying sequence; emissive appearance; multi-guardian responsiveness.

### Lifecycle

- Registry (in memory) of live guardians, filled by `entitySpawn`, `entityLoad` and a one-time `worldLoad` sweep; entries dropped on `entityRemove`. Unloaded guardians do not act.
- Persistent state: tag `sinbad:dying` only.
- Death: `entityHurt` (before) cancels damage that would reduce health to 0 unless the cause is an exception below; a deferred `system.run` adds the tag and fires entity event `sinbad:begin_dying` (native group: invulnerable via `damage_sensor`, behaviors stopped, death animation). `runTimeout` for the animation length then calls `remove()` (no loot/experience). A reloaded guardian tagged dying restarts only the removal timer.
- **Deliberate-removal exceptions (explicit):** `selfDestruct` (/kill), `void`, and non-damage removal (commands, other packs, world/chunk removal) are not intercepted; those guardians die or vanish without the custom sequence and are not a defect.

### Cooldown

- Beam interval: 60 ticks (3.0 s), counted from the actual `system.currentTick` elapsed per pass, never shortened by lag.
- **Cooldown resets on load (explicit):** the cooldown is in memory only. A spawned or loaded guardian starts with a full 60-tick cooldown, so the three-second minimum can never be violated; no cooldown value is persisted.

### Bounded scheduling and fair rotation

- One global `system.runInterval`, `PASS_TICKS = 5`. No per-entity intervals and no world-wide entity scans.
- Per pass: at most `MAX_SCANS_PER_PASS = 4` guardians scan; each scan queries `getEntities({location, maxDistance: 16, families: ["monster"], excludeTypes: <exclusion list>, closest: MAX_QUERY = 32})`, then filters through the allowlist, sorts by distance and tests at most `MAX_RAYS_PER_SCAN = 4` eligible candidates with one `getBlockFromRay` each. See the Task 1.3 query-budget section for the ordering assumption and its limitation.
- Fair rotation: a persistent round-robin cursor over the registry; ready guardians are scanned starting at the cursor, which then advances past the last scanned guardian, so deferred guardians go first next pass and none starves.
- A guardian with no valid target waits `IDLE_RESCAN_TICKS = 10` before its next scan.
- Constants are tunable only with maintainer approval if they change agreed behavior; measured latencies are recorded in device results.

### Beam

Allowlisted hostile within 16 blocks, block-ray line of sight from the beam origin to the target's aim point (liquids/passable blocks ignored; the actual hit point, block location plus face location, is compared with the target distance and any hit nearer than the target minus 0.05 blocks blocks the shot; malformed hits block), then `applyDamage(8, {cause: magic, damagingEntity: guardian})` on the single selected target. Particles/sound are cosmetic; no entity ray, explosion or block change. Players, animals, neutrals and bosses are never selected because only allowlisted types are eligible.

### Manifest, UUID and pipeline

- `behavior_pack/manifest.json`: add a `script` module (`language: javascript`, `entry: scripts/main.js`) with a new unique permanent UUID and the pack version; add dependency `{ "module_name": "@minecraft/server", "version": "2.11.0" }`. Existing header/module/Resource Pack UUIDs and the Resource Pack dependency stay unchanged; both pack versions increase together.
- `tools/project-validation.mjs`: replace the blanket script ban with an allowance limited to the approved entry/logic files; add checks for module UUID uniqueness, dependency presence/version and entry existence, with negative fixtures. Update `docs/build-and-test.md` and keep natural spawning prohibited.
- Pure logic (allowlist, cooldown arithmetic, damage-vs-health, rotation, line-of-sight comparison) lives in a module with no `@minecraft/*` imports so `node --test` covers it.

### Stop condition

If any verified or device-tested mechanism cannot meet the agreed contract (200 HP, 8 damage, 3 s, 16 blocks, line of sight, ~8-block guarding, complete death sequence) without a scope change, work stops and the maintainer is asked before proceeding.

## Task 1.3: Target Policy and Acceptance Matrix

Planning only; no runtime edits. Families below come from Mojang's published `bedrock-samples` entity definitions. Device results stay **Pending**.

### Why family alone is unsafe

The `monster` family includes bosses (`wither`), a mini-boss (`elder_guardian`), conditionally neutral mobs (`enderman`, `spider`, `cave_spider`, `piglin`, `zombie_pigman`) and `warden`. `ender_dragon` has family `dragon`, not `monster`. Eligibility is therefore an explicit type allowlist; `families: ["monster"]` is only a coarse query pre-filter and cannot be the policy.

### Allowlist (ordinary hostile; eligible targets)

`minecraft:` zombie, husk, drowned, zombie_villager_v2, skeleton, stray, bogged, creeper, slime, magma_cube, phantom, witch, pillager, vindicator, evocation_illager, vex, ravager, blaze, ghast, silverfish, endermite, guardian, shulker, breeze, zoglin.

### Explicit exclusions (`excludeTypes` and never allowlisted)

- Bosses/boss-like: ender_dragon, wither, elder_guardian.
- Never targets: player, villager_v2, wandering_trader, iron_golem, wolf, bee, polar_bear, llama, dolphin, panda, goat, cow and all other animals, armor_stand, and `sinbad:cosmic_anomaly` (other guardians).
- Anything not on the allowlist, including unknown or modded entities, is ineligible.

### Maintainer decisions (default: EXCLUDED until confirmed)

Conditionally neutral or ambiguous mobs that the contract ("excluding neutral creatures") does not clearly settle: spider, cave_spider, enderman, zombie_pigman (zombified piglin), piglin, piglin_brute, hoglin, creaking, warden. Defaulting to exclusion honors "never damage neutrals"; promote any to the allowlist only on explicit approval.

### Query budget: bounded, and excluded creatures must not hide eligible hostiles

Revised after review: an uncapped query is not bounded (a dense mob farm in range could return arbitrarily many entities), so the earlier "no cap, 128 leftovers" strategy is withdrawn.

1. The query is `getEntities({location, maxDistance: 16, families: ["monster"], excludeTypes: <exclusion list>, closest: MAX_QUERY = 32})`. Script work per scan is therefore bounded by 32 entities, 4 rays and one sort of at most 32 items.
2. Exclusions and the family filter are intended to apply in the engine before the `closest` limit, so excluded or non-monster neighbours cannot occupy the 32 slots. **Unverified assumption:** the docs say only that `closest` "limits the number of entities to return, opting for the closest N" and do not state filter/limit ordering. Device rows A9 and A17a test it; A17b separately records candidate saturation. If limit-before-filter is observed, the strategy must be revised (for example, per-type queries over a bounded allowlist) before acceptance; this is not silently accepted.
3. Candidates are then allowlist-checked, sorted by distance and limited to 4 ray tests per scan.
4. **Recorded limitation:** eligible hostiles are not unbounded in cost but can still crowd one another out. If at least 32 monster-family, non-excluded entities are nearer than a visible eligible hostile, that hostile is not considered in that scan. Unlisted monster-family entities (modded or newly added vanilla types) also consume slots until they are added to `excludeTypes`. This is accepted for the first version and observed in the dense-scene device rows; it does not weaken the safety rule (nothing outside the allowlist is ever damaged).
5. Consistently obstructed near targets must not hide a visible farther one: each guardian keeps a bounded memo (max 8 entries) of recently ray-blocked target ids, skipped for 20 ticks, so later scans test farther candidates among the 32.
6. A scan that finds eligible candidates but no clear line sets the idle rescan delay; it never fires.

### Proposed bounds (to be tuned on device)

- Collision/selection box: width 2.0, height 6.0; visual ring ~6 blocks tall.
- Beam origin: ring center, entity location + 3.0 blocks on Y.
- Hover: flying/hovering; the height above the surface is **provisional and not agreed** (3-6 blocks is only a starting guess) until visual review on the preview and device; `minecraft:home` radius 8 with `all_movement`; wander `xz_dist` ~4, `y_dist` ~2. Clearance above terrain is checked in-world; tentacle extent is visual only.

### Damage timing measurement

Record screen video on the device (>= 60 fps) with one guardian and a stationary eligible hostile in range; compare hit-flash frames over >= 10 consecutive shots. Pass: no interval below 3.0 s (minus one frame of measurement error); typical interval ~3.0 s with at most 0.25 s scan granularity. Also record a cooldown-reset-on-load observation (first shot after reload no sooner than 3.0 s).

### Acceptance matrix (all device rows Pending)

| ID | Scene | Expected | Verified by | Status |
|----|-------|----------|-------------|--------|
| A1 | Zombie, skeleton, creeper, witch in clear view at <= 16 blocks | Each is hit once per 3 s window, 8 damage subject to defenses | Device | Pending |
| A2 | Hostile at 15-16 blocks / 17 blocks | Fired at 16; not fired at 17 | Device | Pending |
| A3 | Hostile behind a solid wall | No beam, no damage | Device | Pending |
| A4 | Hostile behind glass / leaves / water | Outcome recorded and matches documented ray rules (liquids/passable ignored) | Device | Pending |
| A5 | Wither, ender dragon, elder guardian in range | No damage | Device (creative summon) | Pending |
| A6 | Enderman, spider, piglin, zombified piglin (default-excluded set) | No damage | Device | Pending |
| A7 | Player, villager, cow, wolf, iron golem, bee beside the line of fire | No damage; no retaliation | Device | Pending |
| A8 | Blocks on and around beam path | Unchanged | Device | Pending |
| A9 | Eligible hostile among 10+ cows/villagers/endermen nearby | Hostile is still selected and hit | Device | Pending |
| A10 | Near hostile behind a wall, farther hostile in clear view | Farther hostile is hit | Device | Pending |
| A11 | Two eligible hostiles | One target per shot; a single hit per 3 s | Device | Pending |
| A12 | Two guardians, one target | Independent cooldowns | Device | Pending |
| A13 | 6+ guardians with several hostiles | Every guardian eventually fires (fair rotation); responsive | Device | Pending |
| A14 | Save/reload with hostile in range | First shot no sooner than 3.0 s after load | Device | Pending |
| A17a | Filter ordering: 10+ excluded or non-monster neighbours (cows, villagers, endermen, spiders) nearer than one visible eligible hostile, more than 32 neighbours in range in total | The hostile is still selected and hit; confirms or refutes the filter-before-limit assumption | Device | Pending |
| A17b | Candidate saturation: 32+ eligible or unknown (non-excluded, monster-family) monsters nearer than a second visible eligible hostile | Records which targets are served and that the farther hostile may be hidden; confirms the documented saturation limitation and that nothing outside the allowlist is damaged | Device | Pending |
| A15 | Allowlist/exclusion data and query construction | Allowlist and exclusion lists are disjoint; no excluded type is allowlisted; query always includes a finite `closest` limit and the exclusion list | Automated (`node --test`, once logic exists) | Pending |
| A16 | Rotation/budget logic | Cursor visits all guardians; rays <= 4 per scan; blocked-memo skips obstructed ids | Automated | Pending |

## Implementation Notes (2026-11-01)

- Assets: `tools/generate-cosmic-anomaly-assets.mjs` generates the 19-bone geometry (28 ring segments, black center, four 4-joint tentacle chains with poses baked into cube rotations) and the 32x32 TGA. A browser preview of the packaged geometry with a preview-only opaque texture copy showed the pale ring, black center and four curved ribbons. The 0.20.0 viewer draws low alpha as transparent and ignores materials, so shape review needs the opaque copy.
- Animations: `animation.sinbad.cosmic_anomaly.{idle,fire,death}` driven by controller states reading entity properties `sinbad:firing` and `sinbad:dying` (declared in the behavior entity, client-synced). Death is finite (2.0 s, hold last frame) and its choreography (curl inward, sink, shrink) is subject to visual review; no dimming is implemented.
- Sounds: firing uses `beacon.power` played by the script at the shot; death uses `mob.guardian.death` from the death animation. Audibility is a device check.
- Behavior entity: `spawn_category: misc` (so guardians do not use the vanilla creature cap), no `minecraft:despawn`, `minecraft:persistent`, 200 health, no native attack/target behaviors, `minecraft:home` (radius 8, `all_movement`), hover/flying movement with `random_hover` height `[3, 6]` (provisional), event `sinbad:begin_dying` adding an all-cause `damage_sensor` denial group.
- Script: `behavior_pack/scripts/main.js` plus pure `logic.js`, with the constants and policies above; module UUID `7b622970-e47b-45fa-bb34-fa12a6b3badd`, dependency `@minecraft/server` 2.11.0.
- Packaging finding: Creator Tools 0.20.0 `exportaddon` rewrites the module dependency version `"2.11.0"` to `[2, 11, 0]`, which is not the string form Bedrock documents for script modules. `tools/package-addon.mjs` therefore restores the exact source manifests inside the exported archive, and the archive inspector rejects array-form module versions.
- Viewer check of the packaged archive (0.2.0): with the shipped alpha mask the 0.20.0 viewer shows the solid black center but draws the ring invisible and the ribbons translucent, because it treats alpha as transparency; with the preview-only opaque copy the ring, black center and darker-yellow ribbons are all visible and distinct. Whether Bedrock's `entity_emissive` ignores alpha for transparency, as assumed, is part of the pending glow/device check.
- Version: candidate version is 0.2.0 (synchronized with `npm run version:set`).
- Review fixes (2026-11-01): (1) line of sight no longer uses the block centre with a 0.9 tolerance, which let a wall directly in front of a target count as clear; it uses the real hit point. (2) The hover and return-home behaviors now live in component group `sinbad:alive`, added by `minecraft:entity_spawned` and removed by `sinbad:begin_dying`, so a dying guardian stops moving; validation and tests enforce this. (3) The evidence gate separates the opaque silhouette preview from the shipped texture (`opaque_preview_is_silhouette_only`, `shipped_texture_viewer_result`) and requires `shipped_ring_visible` and `emissive_glow` from the device.
