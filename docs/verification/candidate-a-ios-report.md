# Candidate A: human-reported iOS result (2026-11-01)

Human-reported by the parent/repository owner. Nothing here was machine-observed.

## Candidate identity (verified from `artifacts/candidate.zip`)

| Field | Value |
| --- | --- |
| Version | 0.1.0 |
| Source revision | `5d7f1584bb84a5b0748c269c50c67c90f77c34e3` (`source_dirty: false`) |
| Archive | `asa-minecraft-package-v0.1.0.mcaddon` |
| SHA-256 | `d3eca8f32b33749cfd05eea92071788b27938764da78ac5692710efaaef71c33` |
| Behavior pack UUID | `d82f81a5-cec1-4e9d-8c34-19819a73db9c` |
| Resource pack UUID | `8aa5ee10-fcca-4900-bab0-63e6c5cfb152` |

The archive inside the zip is byte-identical to the extracted `.mcaddon`, its
recomputed SHA-256 equals the metadata value, and the metadata revision is the
commit that holds the human-reviewed browser assets.

## Reported observations

- Device: iPhone 15. Minecraft: 26.60. Experiments: disabled.
- The `.mcaddon` imported successfully.
- The custom mob spawned, wandered, displayed its teal texture, and had the
  expected cow shape.
- Overall report: "everything worked".

## Not reported (left unconfirmed, not marked passed)

Explicit confirmation of both packs active in the world's pack settings, a
readable localized name for the mob and spawn egg, passive behavior when
approached and hit, and the name of the world used. The evidence fields for
these stay unset until the owner confirms them. Task 5.3 stays pending.
