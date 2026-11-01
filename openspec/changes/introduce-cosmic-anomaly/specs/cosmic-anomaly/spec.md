# Cosmic Anomaly Spec Delta

## Purpose

Provide an animated, approachable cosmic guardian that players can place to protect an area from ordinary hostile mobs.

## ADDED Requirements

### Requirement: Recognizable animated guardian
The mob SHALL have an upright pale-yellow luminous oval ring approximately six blocks tall, a solid black center, and four darker-yellow ribbon tentacles. It SHALL continuously animate tentacles and gentle body bobbing while alive, visibly animate firing and death, and play firing/death sounds without continuous ambient sound. Luminosity SHALL NOT require surrounding block illumination.

#### Scenario: Appearance and movement
- **WHEN** a player observes an idle guardian in daylight and darkness
- **THEN** the ring, black center and four tentacles remain recognizable and the tentacles and body visibly move

#### Scenario: Combat and death feedback
- **WHEN** it fires and later dies
- **THEN** firing and death each have visible animation and an audible sound, and death finishes with removal

### Requirement: Acquisition and persistent guarding
The entity SHALL use `sinbad:cosmic_anomaly`, a readable display name and Creative spawn egg, without natural spawning or a custom spawn cap. It SHALL persist through saves, reloads and distance without natural despawning, hovering slowly within roughly eight blocks of its original spawn location without chasing targets outside that area.

#### Scenario: Place and return
- **WHEN** a player uses its egg, leaves the area, saves and reloads, then returns
- **THEN** the guardian remains alive near its original guarding location unless it was killed or deliberately removed

#### Scenario: Multiple guardians
- **WHEN** a player uses several spawn eggs
- **THEN** each creates an independent guardian without a custom count restriction

#### Scenario: Enemy leaves guarding area
- **WHEN** an enemy moves away from the guarding location
- **THEN** the guardian stays within its approximate guarding area and only fires while range and visibility permit

### Requirement: Vulnerable guardian lifecycle
The guardian SHALL start with 200 health, take ordinary damage, have no automatic regeneration, and drop neither loot nor experience on death. It SHALL remain friendly to players and neutral creatures even when they damage it.

#### Scenario: Damage and defeat
- **WHEN** attackers inflict cumulative lethal damage
- **THEN** health decreases without automatic recovery and the guardian dies with no loot or experience

#### Scenario: Friendly damage
- **WHEN** a player or neutral creature damages it
- **THEN** it takes damage without retaliating against that attacker

### Requirement: Safe protective beam
The guardian SHALL proactively target ordinary hostile mobs, excluding bosses and neutral creatures. Its plasma beam SHALL originate visually from the center, hit one eligible target at a time for eight base damage per shot, and have a three-second firing interval, maximum 16-block range and clear line of sight. It SHALL NOT damage players, animals or blocks.

#### Scenario: Ordinary hostile target
- **WHEN** an ordinary hostile mob is visible within 16 blocks and firing is ready
- **THEN** the guardian fires a visible beam at that mob without waiting for a player to be attacked, applying eight base damage subject to normal target defenses

#### Scenario: Cooldown and obstruction
- **WHEN** three seconds have not elapsed since firing, or a target is beyond 16 blocks or behind a solid wall
- **THEN** it does not fire at that target

#### Scenario: Protected bystanders and bosses
- **WHEN** players, animals, neutral creatures, bosses and blocks are beside or along a beam toward an eligible target
- **THEN** only the selected eligible hostile receives beam damage and the surroundings remain intact
