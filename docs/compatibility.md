# Minecraft compatibility target

The iOS test device's installed stable Minecraft Bedrock version was reported as
**26.60** on 2026-11-01. The baseline uses manifest format version `2` for both
packs and sets `min_engine_version` to `[1, 26, 60]`, the engine version
corresponding to that target. Creator Tools 0.20.0's validator identifies
`1.26.60` as the current expected engine version. No experimental features or
toggles are part of this target.

The [official manifest reference](https://learn.microsoft.com/en-us/minecraft/creator/reference/content/addonsreference/packmanifest?view=minecraft-bedrock-stable)
identifies format version `2` for resource and behavior packs and describes
version `3` as preview. It defines `min_engine_version` as a required
`[major, minor, revision]` vector for these pack types and recommends using the
highest version available when creating packs. The selected minimum therefore
matches the reported stable target and the Creator Tools validator's expected
version.

This records the target version supplied for the test device; it is not evidence
of a successful on-device import. Initial-install and existing-world update
acceptance remain pending until the parent or child reports the results.
