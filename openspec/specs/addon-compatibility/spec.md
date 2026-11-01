# Add-on Compatibility Specification

## Purpose

Keep Sinbad Selection identifiable and updateable as one growing add-on without replacing established content identities.

## Requirements

### Requirement: Stable pack and content identities
The add-on SHALL use the public name Sinbad Selection, the `sinbad` content namespace, distinct permanent UUIDs for pack headers and modules, and stable custom identifiers. Behavior and Resource Pack versions SHALL be synchronized and their dependencies consistent.

#### Scenario: Subsequent version
- **WHEN** an existing add-on is rebuilt as a newer version
- **THEN** its committed UUIDs and existing content identifiers remain unchanged, both pack versions increase together, and dependencies reference the matching version

### Requirement: Complete bundled distribution
Each candidate and release SHALL provide one `asa-minecraft-package-vX.Y.Z.mcaddon` containing both packs and the full approved content catalog, with matching package and manifest versions.

#### Scenario: Package inspection
- **WHEN** a candidate is packaged
- **THEN** its archive includes both valid packs and all required runtime assets without development-only dependencies

### Requirement: Stable iOS compatibility target
The baseline SHALL record and support the stable Minecraft version installed on the human tester's iOS device without experimental toggles.

#### Scenario: Initial import
- **WHEN** the tester imports the candidate and activates both packs in a test world on the recorded version
- **THEN** the add-on loads without requiring experiments

### Requirement: Existing-world update proof
Baseline completion SHALL require two increasing-version builds tested in the same iOS world, preserving pack and entity identities and existing instances while visibly updating the mob texture.

#### Scenario: Visible update
- **WHEN** the tester backs up the test world, imports the second build, and reopens that world
- **THEN** an already placed mob remains present with the new texture, a newly spawned mob uses that texture, and both packs remain active
