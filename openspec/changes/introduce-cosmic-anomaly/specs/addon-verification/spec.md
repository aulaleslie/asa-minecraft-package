# Add-on Verification Spec Delta

## ADDED Requirements

### Requirement: Official mob candidate acceptance
Cosmic Anomaly acceptance SHALL require candidate-bound browser visual review and parent/child iOS runtime results for appearance, animation, spawning, persistence, guarding, combat safety, health and death. Results SHALL identify revision, version, checksum, tester, date, device and Minecraft version. Untested checks SHALL remain pending; browser results SHALL NOT prove Bedrock behavior.

#### Scenario: Guardian candidate review
- **WHEN** a candidate is reviewed
- **THEN** browser results cover geometry, texture and animation, while iOS results cover egg/name, idle/firing/death movement, sound, 200 health, no regeneration or drops, targeting exclusions, beam damage/cooldown/range/obstruction, guarding and save/reload persistence
- **AND** representative hostile encounters and several guardians are observed for responsiveness, without intentionally seeking a crash or claiming unlimited capacity

#### Scenario: Retirement update inspection
- **WHEN** a backed-up baseline test world is updated to the guardian candidate
- **THEN** both packs remain active, the new egg works, the old egg is unavailable, and the actual outcome for saved baseline instances is recorded

#### Scenario: Incomplete runtime proof
- **WHEN** local checks or browser review pass but required device checks are missing or fail
- **THEN** guardian acceptance remains pending and public publication remains blocked
