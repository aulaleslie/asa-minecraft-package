# Candidate and release controls

## Find and identify a candidate

The `Candidate` GitHub Actions workflow runs the local
`npm run candidate` sequence on pushes and pull requests. A successful run
uploads one `candidate` artifact containing the `.mcaddon` and its
`.metadata.json` for **30 days**. It does not create a public release. Download
both files from the same successful run; an expired artifact must be rebuilt
and tested rather than substituted.

Use the metadata, not the filename alone, to identify bytes:

- `source_revision`: exact Git commit
- `version`: synchronized pack version
- `archive`: archive filename
- `sha256`: exact archive checksum
- `pack_uuids`: permanent Behavior and Resource Pack header UUIDs
- `source_dirty`: must be `false` for a CI candidate

After download, verify the checksum locally with `sha256sum <archive>` and
compare it to `sha256` in the matching metadata file.

## Record human evidence

Copy [`verification/evidence-template.json`](./verification/evidence-template.json)
(schema version 2, subject `sinbad:cosmic_anomaly`) to
`docs/verification/evidence.json` only when recording actual test results.
Follow [`verification/cosmic-anomaly-acceptance.md`](./verification/cosmic-anomaly-acceptance.md).
Record the single candidate's revision, version, archive name, checksum and pack
UUIDs, a candidate-bound browser review (including `reviewed_archive_sha256`),
and parent/child iOS results with tester, date, device, Minecraft version and
the candidate checksum. Keep pending or failed results as such; do not invent
evidence to make the gate pass. Old baseline-fixture evidence (schema version 1)
is history and is rejected for a guardian candidate.

A browser result is `passed` only after the actual guardian model renders with
its texture; WebGL availability or a listed entity is not sufficient. Browser
results never prove Bedrock behavior. See [`tooling.md`](./tooling.md) and
[`cosmic-anomaly.md`](./cosmic-anomaly.md) for viewer limits.

Validate a candidate and its evidence locally using the downloaded metadata and
the committed evidence file:

```sh
node tools/validate-candidate.mjs dist/<archive>.mcaddon.metadata.json \
  --revision <trusted-commit-sha> \
  --evidence docs/verification/evidence.json
```

The validator rejects dirty builds, mismatched revisions/checksums/UUIDs,
invalid pack contents, and incomplete, failed, unbound or baseline-era browser/iOS evidence. The
passing evidence shape is also covered by a synthetic unit-test fixture; that
fixture is not a claim that browser or device checks have been performed.

## Publication gate

The **Verified release** workflow is manually dispatched from the default
branch. Supply a successful `Candidate` workflow run ID and the committed
evidence JSON path. Its verify job checks the run's workflow, source repository,
default branch, push event, and success conclusion; downloads that run's
artifact; and verifies its revision, metadata, archive checksum, pack UUIDs,
and matching human evidence. Missing or expired artifacts and mismatched
evidence fail before any publication job can run.

`publish` defaults to **false**. That is the safe dry run: verification runs,
the exact candidate checksum is reported and preserved, and no public release
is created. Only set `publish` to **true** when publication is explicitly
approved. The separate publication job rechecks the same archive, metadata,
evidence, source revision, and checksum, then creates a version-tagged GitHub
release with those exact bytes. Its write permission is limited to that job.
The workflow refuses to replace an existing release.

Local builds with `source_dirty: true`, unverified browser previews, and
unreported device tests are not publishable candidates.
