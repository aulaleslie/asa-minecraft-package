# Candidate B: CI artifact and update-test guide

## Identity (from the successful Candidate run, verified locally)

| Field | Value |
| --- | --- |
| Workflow run | <https://github.com/aulaleslie/asa-minecraft-package/actions/runs/41310055058> (success) |
| Artifact | `candidate` (ID 13084444992), zip SHA-256 `cfae63d392c1c1f433eacf4856954b4c8512a56f4bec43465d9a7e0e5d42f54e` |
| Version | 0.1.1 |
| Source revision | `a46320c85d615333b915822df7c26d9096b41113` (`source_dirty: false`) |
| Archive | `asa-minecraft-package-v0.1.1.mcaddon` |
| Metadata | `asa-minecraft-package-v0.1.1.mcaddon.metadata.json` |
| SHA-256 | `375610a1ef961632e0924a23502d1db240e956ec6feca68695e134b036e537a3` |
| Behavior / resource pack UUIDs | unchanged: `d82f81a5-cec1-4e9d-8c34-19819a73db9c` / `8aa5ee10-fcca-4900-bab0-63e6c5cfb152` |

`node tools/validate-candidate.mjs <metadata> --revision a46320c...` passed.
The packaged geometry is unchanged from candidate A and the packaged texture is
byte-identical to the source texture. Source diff against candidate A: the
texture (teal to orange-brown), synchronized version 0.1.0 to 0.1.1, and
version-independent tests.

## Status

- Ubuntu validation, tests, packaging and CI: passed.
- Browser appearance of candidate B: **pending**; the agent's browser has no
  WebGL. Needs a human check in Chrome.
- iOS in-place update: **pending** human report.

## Update test (same world as candidate A)

1. **Back up first.** In Minecraft: Play, tap the pencil next to the candidate A
   world, scroll down, and choose **Export World** (save a `.mcworld` to Files or
   iCloud). Also **Duplicate** the world if offered. Do not test on a different
   world.
2. Note a mob from candidate A that still exists in the world (stay near it, or
   find it before updating).
3. Download `candidate.zip` from the run above, unzip, check the `.mcaddon`
   SHA-256 matches the table, and open it in Minecraft to import.
4. Open the same world. Confirm both Sinbad packs are still active and no
   experiments are enabled.
5. Check that the existing mob and a new one spawned with the spawn egg both
   show the new orange-brown texture and cow shape.
6. Report the results. Only those you actually observe are recorded.
