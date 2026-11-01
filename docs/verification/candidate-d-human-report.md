# Candidate D: Cosmic Anomaly human report and evidence status

Status: **partial evidence; accepted for development closure** by the maintainer
(see [`candidate-d-acceptance.md`](./candidate-d-acceptance.md)). Qualitative iOS passes were reported by the parent/user;
exact measurements and several matrix cases were not run. The publication
evidence gate is not satisfied, and no `docs/verification/evidence.json` exists.
This candidate's acceptance does not transfer to any later build.

## Candidate identity (verified)

| Field | Value |
|-------|-------|
| Artifact | `artifacts/candidate-d/asa-minecraft-package-v0.2.0.mcaddon` (preserved, unmodified) |
| Version | 0.2.0 |
| Source revision | `d853784e585b093690ab0324bfed39b9354dae07` (`source_dirty: false`) |
| SHA-256 | `b436c7a37ef4c7353663077f978e0112164067cb11319a4df3726a4ccd9619fe` |
| Pack UUIDs | behavior `d82f81a5-cec1-4e9d-8c34-19819a73db9c`, resource `8aa5ee10-fcca-4900-bab0-63e6c5cfb152` |
| CI | `Candidate` workflow run 41317446968 (push, `main`, success, 2026-11-01T14:41Z); artifact `candidate`, digest `sha256:a6df282e...9086a` |

Verification performed: the archive checksum equals its metadata; the ZIP is
intact; `tools/validate-candidate.mjs` accepts it for revision `d853784`;
`candidate.zip` in the folder has the CI artifact's recorded digest and its
two files are byte-identical to the loose files; the packaged manifest, entity
and both scripts are byte-identical to the files at `d853784`; a fresh local
build from that clean revision reproduces the same SHA-256. The archive
contains the ray-hit line-of-sight fix and the `sinbad:alive`/`begin_dying`
movement removal.

## Tester, device and date

- Tester: parent/user (reported in the maintainer conversation).
- Device: iPhone 15. Minecraft: 26.60.
- Date: the report was given on 2026-11-01 (conversation date). The actual
  test date was not stated and is left **unspecified**; it is not inferred
  from archive timestamps. A date is required before the evidence JSON can pass.

## Human-reported results (qualitative, not instrumented)

| Area | Reported | Evidence status |
|------|----------|-----------------|
| Appearance of the shipped guardian | Confirmed | Qualitative pass (shipped texture visible on device) |
| Moving tentacles and hovering | Confirmed | Qualitative pass |
| Combat effects and sound | Confirmed | Qualitative pass |
| Wall and range checks | Confirmed | Qualitative pass; no distances or timings recorded |
| Friendly safety and no retaliation | Confirmed | Qualitative pass for what was in the test scene |
| Guarding | Confirmed | Qualitative pass; ~8-block radius not measured |
| Save/reload persistence | Confirmed | Qualitative pass |
| Death animation, no drops | Confirmed | Qualitative pass |
| Nighttime glow | Confirmed | Qualitative pass (glow works with the `entity_emissive` + alpha mask approach) |
| Multiple-guardian responsiveness | Confirmed | Qualitative pass; guardian count not recorded |
| Existing-world update checks | Reported, then qualified: old and new packs observed active together | **Not verified; issue deferred**, cause unresolved ([`pack-version-investigation.md`](./pack-version-investigation.md)) |

## Not measured and not verified

- Exact 200 health, 8 damage and 3.0 s interval: **not measured**; not passed.
- Per-case acceptance matrix rows not explicitly covered (see the matrix in
  `design.md`), including bosses and default-excluded neutrals as targets,
  glass/water line of sight, the 17-block boundary, A9/A10, A17a/A17b, and
  first-shot-after-reload timing: **untested**.
- Not explicitly reported: readable names and egg, both packs active without
  experiments, that a dying guardian stops moving, leave-and-return, old egg
  absence, new egg after update, the **actual outcome for saved baseline
  cows**, whether the update world was backed up, the guardian count, and the
  test date.

## Browser review of candidate D's packaged sources (agent, pinned tool)

Creator Tools 0.20.0 `rendermodel` on the extracted packages of the SHA-256
above (`reviewed_archive_sha256` = the candidate checksum):

- Shipped texture: solid black center; ribbons translucent; ring invisible (the
  viewer treats low alpha as transparency).
- Preview-only opaque texture copy (silhouette only, not the shipped
  texture): pale ring, solid black center and four distinct darker-yellow
  ribbons.
- Luminosity, materials and animation playback are not shown by this viewer and
  were not observed in it. Browser results do not prove Bedrock behavior; the
  device report above is the evidence for shipped appearance and glow.

## Remaining decision

Resolved by the maintainer's closure acceptance in
[`candidate-d-acceptance.md`](./candidate-d-acceptance.md); the untested items
above stay untested.
