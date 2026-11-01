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

#### Scenario: Maintainer accepts guardian candidate with untested checks
- **WHEN** the maintainer explicitly accepts the candidate for development closure with specific measurements, cases and browser limits recorded as untested
- **THEN** the change may be closed on that recorded scope, untested checks are not reported as passed, the acceptance applies only to that exact candidate, and public publication still requires passing evidence for the exact candidate
