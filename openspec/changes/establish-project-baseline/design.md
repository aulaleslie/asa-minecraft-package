# Design

## Context

See proposal.md for motivation. The repository has a spec-driven OpenSpec configuration, installed creator skills, and a Copilot setup workflow; it has no packs, Node project, build pipeline, or durable capability specs. The handoff at `docs/sinbad-selection-handoff.html` supplies naming conventions. Ubuntu is the development host; the parent or child performs every iOS runtime check manually.

## Goals / Non-Goals

**Goals:** Use one maintainable source of pack content and the same validation/build entry points locally and in CI. Make package identity and verification evidence traceable across updates.

**Non-Goals:** A content-generation framework, a browser implementation of Bedrock behavior, or scaffolding unused gameplay script compilation. No claims of compatibility beyond the recorded tested stable version.

## Decisions

### Directly authored packs

Use `behavior_pack/` and `resource_pack/` as canonical runtime sources, `tools/` for small Node-based orchestration/checks, `tests/` for meaningful invalid-input and packaging checks, `docs/` for workflows and verification records, and ignored `dist/` for artifacts. Reserve `assets/references/` for original creative input. Prefer this to feature compilation or generated pack trees: the initial content does not justify another transformation layer. Document future Script API integration without adding `src/` or a gameplay compiler now.

### Identity and version control

Commit unique header/module UUIDs once and record the accepted identity baseline in a small machine-readable catalog. Compare actual manifests and custom declarations against it during validation; intentional catalog changes require review. Use the Node package version as the release version source and an explicit version command to synchronize numeric manifest versions and dependency versions. Packaging checks consistency rather than silently repairing it. Start with pre-1.0 candidates (proposed default `0.1.0`, followed by `0.1.1`); stable `1.0.0` remains a later explicit release decision. This avoids implying that the first import is already a stable release.

### Minimal fixture

Use a vanilla passive model with a locally authored, deliberately simple texture and one stable entity identifier (proposed `sinbad:baseline_mob`). Include readable entity/spawn-egg names and Creative acquisition. Select the exact vanilla model during implementation against the recorded stable target. Do not add natural spawn rules, special attacks, animation work, or Script API dependencies. The second candidate changes only texture color and version-related metadata, preserving identities and an existing placed mob.

### Pinned existing tools with narrow supplementary checks

Pin Node and exact creator-tool dependencies in committed configuration and a lockfile; use clean lockfile installation locally and in CI. Verify installed tool command syntax and target-version support during implementation before encoding scripts. Reuse Mojang validation, export, and viewer capabilities wherever supported; add small checks for identity drift, dependency/version consistency, external vanilla-reference allowlisting, and archive contents that tool output does not establish. No custom viewer is planned. If the existing viewer cannot display the selected vanilla model and texture, surface the limitation before expanding scope; a supported existing asset viewer is acceptable.

### Verification and evidence

The sequence is automated validation and archive inspection, manual browser appearance inspection, candidate installation on iOS, and manual publication. CI creates candidates automatically on pushes and pull requests; browser inspection is a human visual check using the documented viewer, not an automated gameplay test. Each candidate includes version, source revision, and SHA-256 archive checksum metadata.

Use a small versioned evidence record format with a readable checklist. Record the exact Minecraft/iOS environment, tester (parent or child; a role label is sufficient), date, candidate identity, browser outcome, initial install, spawn/appearance/passivity, existing-world update, retained mob instance, and new spawn results. Pending and failed results are explicit. Evidence can be committed after testing without rebuilding the archive: source revision refers to the candidate source, not the later evidence commit.

### Publish the tested bytes

Use a separate manually dispatched release workflow with a candidate workflow-run identity and evidence path as inputs. Validate evidence and metadata, download the candidate artifact from a successful trusted default-branch run, verify its checksum/version/revision, then publish those exact bytes. Do not rebuild during publication. Reject absent, failed, mismatched, or expired artifacts; an expired candidate must be rebuilt and verified again. Keep publishing credentials out of pull-request jobs and limit release write permissions to the publication job. A manual trigger alone does not substitute for device evidence. Public publication is optional for proving initiation; the gate must still be implemented and its rejection paths checked.

### Repository guidance

Add concise README and agent guidance for naming, identity preservation, setup/build/preview commands, creative input attribution, approved OpenSpec work, and human verification. Keep OpenSpec as the sole specification system and preserve the existing Copilot integration. Update the initiation handoff during implementation where agreed baseline decisions supersede its suggestions; do not represent pending checks as complete.

## Risks / Trade-offs

- Browser appearance does not prove Bedrock behavior -> label browser results separately and require device evidence.
- Device version and tool support are not yet recorded -> collect the version before choosing manifest format/minimum engine settings; check current official documentation during implementation.
- Vanilla references can evade local missing-file checks -> distinguish explicitly allowed vanilla references from missing custom assets and verify in the viewer and on iOS.
- Automated identity checks cannot detect a deliberately rewritten baseline -> document identity review and inspect changes against the previous accepted revision.
- Human evidence relies on accurate reporting -> use concrete observable checks and bind results to exact candidate bytes.
- iOS caches or import behavior can obscure updates -> document reopening the backed-up test world, checking active pack versions, and preserving the existing mob; a fresh-world-only test is insufficient.

## Migration Plan

No existing pack data requires migration. Generate candidate A, inspect it in the browser, and have a human import it into a dedicated test world and place a mob. Back up that world before installing candidate B. Verify the changed texture on the retained mob and on a new spawn. Keep baseline acceptance pending until both device tests pass. For failures preserve artifacts and evidence, restore the world backup when necessary, and produce a corrected increasing-version candidate; do not assume downgrading a world or pack is safe. Review against the specs and archive only after required verification. Publish only through the gated manual workflow when requested.
