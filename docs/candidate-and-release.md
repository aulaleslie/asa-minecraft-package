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
to `docs/verification/evidence.json` only when recording actual test results.
Follow [`ios-acceptance.md`](./ios-acceptance.md). Record candidate A's browser
review and initial iOS installation, and candidate B's browser review and
same-world iOS update. Include both candidates' revisions, versions, archive
names, checksums, and pack UUIDs. Keep pending or failed results as such; do not
invent evidence to make the gate pass.

A browser result is `passed` only after the actual mob model renders with its
custom texture. WebGL availability, a listed entity, or successful loading of
the vanilla source files is not sufficient. A human-reported render of the
current source exists in
[`verification/browser-review-2026-11-01.md`](./verification/browser-review-2026-11-01.md);
the candidate-bound review must still be repeated or matched to CI archives. See
[`tooling.md`](./tooling.md) for the vanilla geometry resolution investigation.

Validate a candidate and its evidence locally using the downloaded metadata and
the committed evidence file:

```sh
node tools/validate-candidate.mjs dist/<archive>.mcaddon.metadata.json \
  --revision <trusted-commit-sha> \
  --evidence docs/verification/evidence.json
```

The validator rejects dirty builds, mismatched revisions/checksums/UUIDs,
invalid pack contents, and incomplete or failed browser/iOS evidence. The
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
