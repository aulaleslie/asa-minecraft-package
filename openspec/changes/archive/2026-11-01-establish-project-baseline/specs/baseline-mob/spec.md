# Spec Delta

## Purpose

Provide a minimal custom mob that exercises the Behavior and Resource Packs and makes installation and update results easy to observe.

## ADDED Requirements

### Requirement: Minimal passive entity
The baseline SHALL provide one custom mob with a stable `sinbad` identifier, simple passive behavior, and a spawn egg. It SHALL have no natural spawning, custom abilities, gameplay scripts, or experiment requirements.

#### Scenario: Spawn egg interaction
- **WHEN** a tester selects the mob's named spawn egg from the Creative inventory and uses it in the test world
- **THEN** the custom mob appears and does not initiate attacks on the player

### Requirement: Visible resource-pack fixture
The mob SHALL use a vanilla model with a distinctive custom texture and readable display names. The second verification build SHALL change its texture color without changing its entity identity or model.

#### Scenario: Initial visual inspection
- **WHEN** the first candidate is inspected in the browser and on iOS
- **THEN** the mob has the intended vanilla shape and custom texture, with no missing-texture fallback or raw localization key on iOS

#### Scenario: Second candidate appearance
- **WHEN** the second build is inspected
- **THEN** its color is visibly different and its entity identifier and model are unchanged
