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

- Module pin: `@minecraft/server` **2.11.0**. The npm registry shows 2.11.0 released alongside the 26.60 stable line (`2.11.0-rc.1.26.60-preview.30` -> `2.11.0`; dist-tag `latest`). The 2.11.0 type definitions (inspected locally) contain `world.beforeEvents.entityHurt`/`entityRemove`, `world.afterEvents.entityLoad`/`entitySpawn`/`worldLoad`/`dataDrivenEntityTrigger`, `Dimension.getBlockFromRay`/`getEntities`, `Entity.applyDamage`/dynamic properties/`getHeadLocation`, `system.runInterval`/`runTimeout`, all without beta markers. `Entity.target` and `BlockRaycastOptions.usePreciseRaycast` are experimental and MUST NOT be used.
- Peer dependencies of 2.11.0: `@minecraft/common ^1.2.0`, `@minecraft/vanilla-data` (types only). Manifest declares only `@minecraft/server`; confirm with the pinned validator.
- Before-events run with restricted-execution privilege: state-changing APIs throw. The `entityHurt` handler may only read and set `cancel`; all mutation is deferred via `system.run`.
- Damage cause: `EntityDamageCause.magic` (listed as magical attacks). `none` is script/command damage. Whether armor/defenses reduce the 8 is a device measurement, not a documentary assumption.
- `Entity.remove()` skips death animation and loot, so the scripted dying state must play first.
- Native pieces confirmed present in installed schemas: `minecraft:home` (`restriction_type: all_movement`), `minecraft:persistent`, `minecraft:damage_sensor`, `minecraft:behavior.random_hover`, `minecraft:movement.hover`, `minecraft:navigation.hover`, `minecraft:can_fly`.

### Open documentary items (block marking 1.2 done)

- Whether `entity_emissive`/`entity_emissive_alpha` works with PNG alpha on 26.60 (Learn material page says `.tga`); settle by pinned-tool preview/device.
- Hover tuning (`movement.hover`/`navigation.hover`/`random_hover` with `home`) is documented only at schema level.

### Device-dependent (pending until tested)

`minecraft:home` persistence across save/reload and ~8-block limit; stable block-raycast accuracy at walls/corners/glass; beam timing; defenses vs. 8 damage; lethal-hurt cancel and dying sequence; emissive appearance; multi-guardian responsiveness.

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
- Per pass: at most `MAX_SCANS_PER_PASS = 4` guardians scan; each scan queries `getEntities({location, maxDistance: 16, closest: MAX_CANDIDATES = 8})`, filters through the explicit type allowlist/exclusions (task 1.3), and tests at most `MAX_RAYS_PER_SCAN = 4` candidates (nearest first) with one `getBlockFromRay` each.
- Fair rotation: a persistent round-robin cursor over the registry; ready guardians are scanned starting at the cursor, which then advances past the last scanned guardian, so deferred guardians go first next pass and none starves.
- A guardian with no valid target waits `IDLE_RESCAN_TICKS = 10` before its next scan.
- Constants are tunable only with maintainer approval if they change agreed behavior; measured latencies are recorded in device results.

### Beam

Allowlisted hostile within 16 blocks, block-ray line of sight from the beam origin to the target's aim point (liquids/passable blocks ignored), then `applyDamage(8, {cause: magic, damagingEntity: guardian})` on the single selected target. Particles/sound are cosmetic; no entity ray, explosion or block change. Players, animals, neutrals and bosses are never selected because only allowlisted types are eligible.

### Manifest, UUID and pipeline

- `behavior_pack/manifest.json`: add a `script` module (`language: javascript`, `entry: scripts/main.js`) with a new unique permanent UUID and the pack version; add dependency `{ "module_name": "@minecraft/server", "version": "2.11.0" }`. Existing header/module/Resource Pack UUIDs and the Resource Pack dependency stay unchanged; both pack versions increase together.
- `tools/project-validation.mjs`: replace the blanket script ban with an allowance limited to the approved entry/logic files; add checks for module UUID uniqueness, dependency presence/version and entry existence, with negative fixtures. Update `docs/build-and-test.md` and keep natural spawning prohibited.
- Pure logic (allowlist, cooldown arithmetic, damage-vs-health, rotation, line-of-sight comparison) lives in a module with no `@minecraft/*` imports so `node --test` covers it.

### Stop condition

If any verified or device-tested mechanism cannot meet the agreed contract (200 HP, 8 damage, 3 s, 16 blocks, line of sight, ~8-block guarding, complete death sequence) without a scope change, work stops and the maintainer is asked before proceeding.
