# Cosmic Anomaly

`sinbad:cosmic_anomaly` is Sinbad Selection's first official mob: a roughly
six-block-tall luminous oval ring with a black center and four animated ribbon
tentacles. It guards the spot where it is placed. Contract, design decisions and
the acceptance matrix are in
`openspec/changes/introduce-cosmic-anomaly/` (proposal, specs, `design.md`).
Original concept material and its provenance are in
[`assets/references/cosmic-anomaly/`](../assets/references/cosmic-anomaly/PROVENANCE.md).

## What it does

- Created only with its Creative spawn egg; there are no spawn rules and no
  custom spawn cap. It is persistent and does not despawn.
- 200 health, no regeneration, no loot or experience.
- Hovers within about eight blocks of where it was placed (native
  `minecraft:home`). The hover height is provisional until visual review.
- While dying it stops hovering and returning home (its movement behaviors are removed by the `sinbad:begin_dying` event).
- Line of sight uses the ray's actual hit point; any block hit nearer than the target blocks the shot.
- Every three seconds it fires one beam at one ordinary hostile mob within 16
  blocks and clear line of sight for 8 base damage. The target list and
  exclusions are in `design.md` (Task 1.3); bosses, neutral or conditionally
  neutral mobs, players, animals and blocks are never harmed.
- Beam combat and the death sequence use one gameplay script,
  `behavior_pack/scripts/main.js` (pure rules in `logic.js`), built on the
  pinned `@minecraft/server` 2.11.0 API. No experiments are needed. Native
  attack behaviors are not used and the validator rejects them.
- The cooldown lives in memory: a guardian that is spawned or loaded starts with
  a full three-second cooldown. `/kill` and void damage bypass the custom death
  sequence by design.

## Preview

Browser preview is a visual check only. It does not prove Bedrock behavior or
iOS compatibility, and the Creator Tools 0.20.0 viewer ignores client-entity
materials and treats low texture alpha as transparent, so it cannot show the
emissive glow. The opaque copy below shows the silhouette only; it is not the shipped texture and is not appearance evidence (the shipped ring's visibility and glow need the device). To review the silhouette, generate a preview-only copy of the
texture with the alpha mask forced opaque and render the packs with that copy
outside the repository:

```sh
node tools/generate-cosmic-anomaly-assets.mjs --opaque-preview /tmp/preview/resource_pack/textures/entity/cosmic_anomaly.tga
```

(copy `behavior_pack/` and `resource_pack/` to `/tmp/preview/` first), then:

```sh
node_modules/.bin/mct rendermodel resource_pack/models/entity/cosmic_anomaly.geo.json out.png -i /tmp/preview --no-vanilla
node_modules/.bin/mct view -i /tmp/preview
```

Animations (idle sway and bob, fire, finite death) are wired through
`resource_pack/animation_controllers/` using entity properties
`sinbad:firing` and `sinbad:dying`. Their motion and the emissive glow must be
confirmed on a device.

## Regenerating the model

`tools/generate-cosmic-anomaly-assets.mjs` writes the geometry and the TGA
texture deterministically (ring segments, tentacle joint chains, alpha emissive
mask: ring 0, tentacles 110, center 255). The outputs are committed. If the
device shows the glow inverted, flip the mask constants in that file and
regenerate; no other file changes.

## Updating from the baseline cow (backup required)

The baseline fixture `sinbad:baseline_mob`, its Creative egg and runtime assets
are retired. Its identifier is never reused and existing cows are **not**
converted into guardians.

1. Back up every world that used the baseline candidates before importing the
   guardian candidate. Updating is not promised to preserve saved baseline
   instances; what actually happens to a saved cow is unknown until tested and
   is recorded in the acceptance evidence.
2. Import the new `.mcaddon` and keep both packs active. Pack and module UUIDs
   are unchanged, so the update applies in place.
3. The old egg disappears. Spawn guardians with the new Cosmic Anomaly egg.
4. **Rollback:** restore the world from the backup and re-import the previous
   candidate. Removed entities do not recover automatically.

Historical baseline evidence stays in `docs/verification/` and is not valid
guardian acceptance.
