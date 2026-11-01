# Cosmic Anomaly candidate acceptance (procedure)

Status: **pending**. No guardian check has been run on a device. Browser
results never stand in for iOS results. Use the exact CI candidate archive and
its metadata; record revision, version, archive name, SHA-256 and both pack
UUIDs in the evidence JSON (`evidence-template.json`, schema version 2), and
bind every result to that SHA-256.

The matrix IDs (A1-A17b) below refer to `design.md` in the change folder.

## Browser review (candidate-bound)

Render the candidate's packaged sources (unzip the archive) twice: once as
shipped, and once with the preview-only opaque texture described in
[`../cosmic-anomaly.md`](../cosmic-anomaly.md). **The opaque copy only shows the
silhouette (ring, black center, four tentacles); it is not the shipped texture
and cannot satisfy appearance acceptance.** Record the viewer's result for the
shipped texture too (`shipped_texture_viewer_result`; with the shipped alpha
mask the 0.20.0 viewer draws the ring invisible), the animation references, and
`reviewed_archive_sha256`. The shipped ring's visibility and the emissive glow
are confirmed only on the device. Browser evidence is separate from device
evidence.

## iOS: fresh installation (parent or child)

1. Import the archive; create a disposable world; activate both packs; no
   experiments.
2. Spawn the guardian from the Creative egg. Check name, that the shipped ring is
   visible (`shipped_ring_visible`), appearance in daylight and darkness, emissive
   glow without nearby light (`emissive_glow`), idle tentacle and body motion, no
   ambient hum.
3. Guarding: stay away from the placement point and confirm it does not chase
   beyond about eight blocks. Record hover height.
4. Health and death: damage it to 200 total, confirm no regeneration, firing
   and death animation and sound, no drops or experience, and that it stops
   moving and hovering during the death sequence.
5. Combat (A1-A14): hostiles in range, at 15/16/17 blocks, behind walls, glass
   and water; bosses, neutrals and bystanders (player, cow, villager, wolf,
   iron golem) beside the line of fire; blocks unchanged. Measure the interval
   with a 60 fps screen recording (never below 3.0 s).
6. Density (A17a, A17b): excluded neighbours and 32+ eligible monsters.

## iOS: persistence and baseline-world update

Back up the world first. Save, reload, leave and return; confirm the guardian
anchor persists and the first shot after loading is no sooner than 3.0 s. Update
a backed-up baseline-cow world, confirm both packs stay active, the old egg is
gone, the new egg works, and record the actual outcome for saved cows.

## iOS: combat and several guardians

Observe a representative fight and a small multi-guardian scene (record the
count) for responsiveness and balance. Do not seek a crash or claim unlimited
capacity. Any change to health, damage, timing or guarding scope needs
maintainer approval and a retest.

Mark a check passed only after it actually passed; leave the rest pending.
