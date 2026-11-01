# Tasks

## 1. Tooling and repository foundation

- [x] 1.1 Obtain the installed stable iOS Minecraft version from the human tester and record the target; verify the selected manifest formats and minimum engine version against current official documentation without experiments.
- [x] 1.2 Check current Mojang CLI validation, export, and browser-viewer support for the proposed vanilla-model fixture; document verified commands and any limitation before expanding scope.
- [x] 1.3 Add pinned Node and creator tooling with a package lock, ignored build outputs, and documented setup commands; verify clean lockfile installation on Ubuntu.
- [x] 1.4 Add README and agent guidance covering OpenSpec approval/review, creative-source preservation, pack layout, identity conventions, and deferred scripts; verify consistency with the approved proposal and existing Copilot integration.

## 2. Packs and minimal mob

- [x] 2.1 Create Behavior and Resource Packs, permanent unique UUIDs, a committed identity catalog, synchronized initial versions, and correct dependencies; verify manifest validation and identity checks pass.
- [x] 2.2 Add the minimal passive custom mob, vanilla-model reference, distinctive custom texture, Creative spawn egg, and readable names; verify referenced custom assets exist and no natural-spawn or gameplay-script content is introduced.
- [x] 2.3 Document and demonstrate the existing-tool browser preview on Ubuntu; verify the actual fixture model and texture render and record the viewer/tool versions and result.

## 3. Validation and packaging

- [x] 3.1 Implement documented local validation entry points using Mojang tooling plus narrow supplementary checks; verify meaningful negative fixtures reject malformed JSON/manifests, duplicate declarations, missing custom references, broken dependencies, identity drift, and version mismatches while allowed vanilla references pass.
- [x] 3.2 Add the explicit version synchronization command and package consistency checks; verify an increasing patch version updates both manifests and dependencies without changing UUIDs or entity identifiers.
- [x] 3.3 Package both packs into the named single `.mcaddon`, excluding development files, and emit revision/version/SHA-256 metadata; verify archive inspection checks contents, versions, required assets, and checksum.
- [x] 3.4 Document validation, versioning, packaging, and troubleshooting commands; verify the documented sequence from a clean checkout produces a valid candidate.

## 4. Candidate CI and publication gate

- [x] 4.1 Add push/pull-request candidate CI using the same local checks and packaging commands, preserving the Copilot workflow; verify a successful GitHub Actions run provides downloadable archive and metadata without creating a public release.
- [x] 4.2 Add an evidence template and validator for browser review and manual iOS results bound to candidate revision/version/checksum; verify absent, pending, failed, and mismatched records are rejected and a complete passing fixture is accepted.
- [x] 4.3 Add the manually triggered release workflow to retrieve a successful trusted default-branch candidate, validate evidence and checksums, and publish its exact archive; verify missing/expired artifacts and mismatched evidence fail before publication, and a dry-run passing path preserves the tested checksum.
- [x] 4.4 Document candidate downloads, artifact retention, manual evidence entry, and publication controls; verify a maintainer can identify the candidate to test and the matching evidence without relying on filename alone.

## 5. Human device verification and baseline acceptance

- [x] 5.1 Document the manual iOS procedure including both pack activation, no experiments, initial spawn/appearance/passivity, test-world backup, and update checks; verify every acceptance scenario has a concrete observable step.
- [x] 5.2 Produce candidate A through CI, complete browser inspection, and provide its archive and identity metadata to the parent or child; verify the recorded browser result corresponds to that candidate.
- [ ] 5.3 Have the parent or child manually install candidate A on iOS and report initial world creation, pack activation, readable names, appearance, spawn egg, and passive behavior; record evidence and leave this task pending until the report passes.
- [x] 5.4 Change the fixture texture color and increment synchronized versions, preserving all identities; produce candidate B and verify Ubuntu checks, CI metadata, browser appearance, and the limited source diff.
- [x] 5.5 Have the parent or child back up and update the same iOS test world with candidate B; record that the retained mob and a new spawn display the new texture, both packs remain active, and no experiments are required. Keep this task pending until the human report passes.
- [ ] 5.6 Review implementation and evidence against all three specs, align the initiation handoff with the delivered baseline, and confirm local checks and CI pass; declare completion only when both manual device tests have passing candidate-bound evidence.

## Workflow follow-up

- Publish the verified candidate only when explicitly requested, through the manual release gate; public publication is not required to prove the initiation baseline.
- Archive this change after review and all required verification have passed; do not archive while human iOS checks remain pending.
