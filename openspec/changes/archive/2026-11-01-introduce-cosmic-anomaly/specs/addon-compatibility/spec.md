# Add-on Compatibility Spec Delta

## MODIFIED Requirements

### Requirement: Stable pack and content identities
The add-on SHALL use the public name Sinbad Selection, the `sinbad` content namespace, distinct permanent UUIDs for pack headers and modules, and stable custom identifiers except explicitly approved retirements. The baseline fixture `sinbad:baseline_mob` SHALL be retired without identifier reuse or conversion into Cosmic Anomaly. Behavior and Resource Pack versions SHALL be synchronized and their dependencies consistent.

#### Scenario: Subsequent version
- **WHEN** an existing add-on is rebuilt as a newer version
- **THEN** its committed UUIDs and non-retired content identifiers remain unchanged, both pack versions increase together, and dependencies reference the matching version

#### Scenario: Baseline retirement update
- **WHEN** the Cosmic Anomaly candidate replaces the baseline fixture
- **THEN** pack/module UUIDs remain unchanged, synchronized versions increase, baseline runtime assets and egg are absent, and Cosmic Anomaly has its own identifier
- **AND** update instructions require a world backup and explain that saved baseline instances are unsupported without promising conversion or survival
