# Baseline acceptance (2026-11-01)

The maintainer (repository owner) accepted the baseline as sufficient for real
development. This is a scope decision, not passing evidence for the checks
listed as untested. The publication gate is unchanged.

## Human-reported (as stated by the maintainer)

| Candidate | Reported |
| --- | --- |
| A 0.1.0 (`5d7f158`, SHA-256 `d3eca8f3…ef71c33`) | iPhone 15, Minecraft 26.60, experiments disabled; imported; mob spawned, wandered, teal texture, cow shape; spawn egg works and its name is readable; "everything worked" |
| B 0.1.1 (`a46320c`, SHA-256 `375610a1…537a3`) | Chrome preview passed; same-world update passed (retained and new mob updated, packs active, experiments disabled) |
| 0.1.2 (`41b3482`, SHA-256 `9170291f…44f8`) | visual approval (icon and mob) |

## Untested, explicitly accepted by the maintainer for closure

- Passive behavior when the mob is hit (hit-response test not performed).
- Any remaining per-item checks not individually confirmed: explicit
  pack-activation confirmation for candidate A, per-item detail for B's
  update checks, and per-item iOS detail for 0.1.2 (icon on both packs,
  experiments state).
- A separate browser review of 0.1.2.

## Consequences

- The OpenSpec change is closed on this accepted scope. Untested items are not
  marked passed anywhere.
- No release is published. The release workflow still requires passing
  candidate-bound evidence; the evidence JSON is not filled and would not pass
  for these untested items. A release needs fresh evidence for the exact
  candidate, geometry redistribution confirmation, and an explicit request.
- The baseline mob (`sinbad:baseline_mob`) is kept for now. Its removal will be
  planned in the next exploration alongside the first real mob.
