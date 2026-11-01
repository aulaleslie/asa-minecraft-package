# Cosmic Anomaly reference provenance

Archived copies of the original creative sources for `sinbad:cosmic_anomaly`.
Never overwrite or edit these files; derived art lives in the packs.

## Sources

| File | Archived from | SHA-256 |
|------|---------------|---------|
| `info.md` | `ideas/mobs/cosmic-anomaly/info.md` | be6cfa0f0ecc62947ace2db933ca6dd79120a62af416084c67f8ea8e153001b4 |
| `download.jpeg` | `ideas/mobs/cosmic-anomaly/download.jpeg` | 2be0fd1e0be1d177528c3f6ac95dc2191ba975352df2a4a4619eea33fba33b5e |

The originals stay unchanged under `ideas/mobs/cosmic-anomaly/` (added in git
commit ba47638). `SHA256SUMS` checks both locations; see Verification.

## Origin

- Supplied with the project as the mob concept reference. Who made the image and
  where `download.jpeg` came from is not recorded in the repository; it is
  unattributed and must not be described as original project art.
- `info.md` describes the creature as a fan-made community creation in the
  Trevor Henderson-inspired "Giants" mythos. No author or licence is recorded.
  Treat both files as reference only, not as assets to ship.

## Supplied lore versus adaptation

| Topic | Supplied (`info.md` / image) | Approved adaptation for this add-on |
|-------|------------------------------|--------------------------------------|
| Form | Light-yellow glowing oval ring, pitch-black center, four dull-yellow ribbon tentacles | Same elements; pale-yellow ring about six blocks tall, solid black center, four darker-yellow ribbon tentacles |
| Scale | Interstellar, about 750,000,000 km wide | Roughly six blocks tall; cosmic scale deferred |
| Role | Protective, non-destructive | Guards an area (about eight blocks) against ordinary hostile mobs |
| Plasma beam | Devastating, billions of degrees | Single-target beam, 8 damage every 3 s, 16-block range, line of sight; no block damage |
| Durability | Immune to standard damage | Vulnerable: 200 health, no regeneration |
| Telekinesis, shockwaves | Listed powers | Deferred; not implemented |

Technical interpretations (cuboid tentacle segments, material and animation
choices, death choreography) are implementation decisions in
`openspec/changes/introduce-cosmic-anomaly/design.md`, not supplied content.

## Verification

From the repository root:

    sha256sum -c assets/references/cosmic-anomaly/SHA256SUMS
