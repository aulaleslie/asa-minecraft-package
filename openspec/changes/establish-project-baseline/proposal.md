# Proposal

## Why

Sinbad Selection needs a stable, repeatable path from an approved idea to a verified Minecraft Bedrock add-on before substantial content is added. The repository currently contains OpenSpec and skills groundwork, but no packs, build pipeline, or device-tested artifact.

## What Changes

- Establish Behavior and Resource Packs with permanent identities, synchronized versions, and the `sinbad` namespace, distributed together as one `.mcaddon`.
- Add a minimal passive mob using a vanilla model, distinctive custom texture, and spawn egg; exclude natural spawning, abilities, and gameplay scripts.
- Provide pinned Ubuntu-compatible tooling, local validation and packaging, existing-tool browser preview, and automatic GitHub Actions candidate artifacts.
- Prove an initial installation and a visibly changed second build in the same iOS test world; human testers are the parent or child.
- Require recorded manual iOS verification and an explicit manual trigger before public release.
- Document repository conventions, OpenSpec approval/review flow, agent guidance, and future-content extension points.

## Capabilities

### New Capabilities

- `addon-compatibility`: Pack identity, bundled distribution, stable identifiers, and existing-world updates.
- `baseline-mob`: Minimal custom entity and visual fixture used to verify both packs.
- `addon-verification`: Ubuntu checks, browser inspection, candidate builds, manual iOS evidence, and publication gates.

### Modified Capabilities

None; no durable specs currently exist.

## Impact

Implementation will introduce pack directories, Node tooling and a lockfile, validation/packaging tools, CI and manual release workflows, documentation, and agent guidance. Existing OpenSpec/Copilot configuration and installed skills will be reused. No custom browser simulator, gameplay TypeScript, experimental features, complex content, or new specification framework is included. The installed stable iOS Minecraft version must be recorded during implementation; no specific version is assumed here.
