# Spec Delta

## Purpose

Provide repeatable Ubuntu verification and candidate delivery while reserving real Bedrock acceptance and public publication for human-confirmed results.

## ADDED Requirements

### Requirement: Repeatable local checks
The repository SHALL document Ubuntu commands for clean dependency installation, validation, browser preview, and packaging using pinned tooling. Validation SHALL reject malformed JSON, invalid manifests, duplicate custom declarations, missing references or assets, broken dependencies, identity drift, inconsistent versions, and invalid archives.

#### Scenario: Invalid candidate
- **WHEN** a required asset is missing or a committed pack UUID is changed accidentally
- **THEN** validation exits unsuccessfully and identifies the fault before a successful candidate is produced

#### Scenario: Clean checkout
- **WHEN** a contributor follows the documented setup and build commands on Ubuntu
- **THEN** the same pinned tool versions are installed and the complete candidate can be validated and packaged

### Requirement: Browser visual gate
The baseline SHALL provide browser inspection through existing creator tooling for the mob model and custom texture before iOS installation. Inspection results SHALL be recorded separately from runtime results and SHALL NOT count as proof of Bedrock AI or iOS compatibility.

#### Scenario: Candidate visual review
- **WHEN** the tester prepares either baseline candidate for iOS installation
- **THEN** its geometry and texture have been inspected in the browser and the result is associated with that candidate

### Requirement: Automatic candidate artifacts
GitHub Actions SHALL run the local validation and packaging entry points for pushes and pull requests and provide a downloadable candidate on success without publishing a public release. Candidates SHALL be identifiable by source revision, version, and archive checksum.

#### Scenario: Successful CI build
- **WHEN** CI checks succeed
- **THEN** the bundled candidate and its identity metadata are downloadable as workflow artifacts and no public release is created

### Requirement: Human iOS acceptance
Baseline completion SHALL require manual initial-install and existing-world-update checks performed by the parent or child. Evidence SHALL identify tester, date, device, Minecraft version, candidate revisions, versions, checksums, browser results, and device results. Missing or failed checks SHALL leave acceptance pending.

#### Scenario: Automation succeeds but device testing is pending
- **WHEN** Ubuntu validation, browser inspection, and packaging pass without reported iOS results
- **THEN** the baseline remains incomplete and publication is blocked

### Requirement: Explicit verified publication
Public release SHALL require a manual trigger and passing human iOS evidence for the exact candidate being published. The published archive SHALL match the tested checksum; changes to its content SHALL require renewed verification.

#### Scenario: Verified candidate is released
- **WHEN** a maintainer manually requests publication of a candidate with passing evidence and matching identity and checksum
- **THEN** the workflow publishes that tested archive

#### Scenario: Unverified candidate is requested
- **WHEN** evidence is absent, failed, or refers to another candidate
- **THEN** publication fails without creating a public release

### Requirement: Documented contribution lifecycle
Repository and agent guidance SHALL describe creative-source preservation, approved OpenSpec planning before implementation, review against requirements, validation, human device verification, publication, and archiving only after required verification.

#### Scenario: Future content contribution
- **WHEN** a contributor follows repository guidance
- **THEN** they can locate pack conventions, the planning and approval process, build and preview commands, and the human acceptance checklist
