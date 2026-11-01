# Proposal

## Why

The baseline cow proved the pack pipeline but is not intended gameplay content. Cosmic Anomaly will become Sinbad Selection's first official mob, translating the supplied cosmic-protector reference into an approachable, animated guardian.

## What Changes

- Add `sinbad:cosmic_anomaly`: roughly six-block-tall luminous oval ring, black center, four animated ribbon tentacles, hovering and attack/death animation.
- Provide a Creative spawn egg, no natural spawning or spawn cap, persistent placement and a roughly eight-block guarding area.
- Give it 200 health without regeneration; a single-target plasma beam deals eight damage every three seconds within 16 blocks and clear line of sight. Target ordinary hostile mobs, excluding bosses and neutral creatures; never retaliate against players or neutral creatures or damage blocks.
- Include firing/death sounds, no continuous hum, loot or experience. Defer telekinesis, shockwaves, cosmic scale and extra abilities.
- **BREAKING**: retire `sinbad:baseline_mob`, its egg and runtime assets; do not reuse its identity or convert existing cows. Preserve history and document backup/update consequences.
- Update fixture-specific validation, packaging, tests and candidate acceptance to cover the new catalog and animation/behavior assets.

## Capabilities

### New Capabilities

- `cosmic-anomaly`: guardian appearance, animation, acquisition, lifecycle and protective combat.

### Modified Capabilities

- `baseline-mob`: remove the retired fixture's runtime requirements.
- `addon-compatibility`: explicitly retire the baseline identity while retaining permanent pack identities and update safeguards.
- `addon-verification`: apply visual and candidate-bound device checks to the first official mob, including animations and gameplay.

## Impact

Canonical Behavior/Resource Packs, identity catalog, archive-required files, validation tests, preview and acceptance documentation are affected. Existing pack/module UUIDs remain permanent; versions increase together. A focused feasibility gate must establish stable Bedrock support for beam combat, anchored hovering and death animation before committing to implementation mechanics. Gameplay scripts are not assumed approved: if JSON-native behavior cannot satisfy the contract, seek explicit approval of a specific script design or revised scope. No implementation or public release is authorized by this proposal.
