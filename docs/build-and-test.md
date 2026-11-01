# Build, verify, and troubleshoot

## Clean Ubuntu setup

Use the pinned Node/npm versions, then install only from the committed lockfile:

```sh
nvm install
nvm use
npm ci
```

Run the same sequence used by candidate CI:

```sh
npm run candidate
```

This runs repository identity/reference checks, Mojang Creator Tools 0.20.0's
`main` validation suite, the negative-fixture and packaging tests, then creates
the `.mcaddon` and metadata in ignored `dist/`. The package contains only the
two runtime packs. The metadata binds the archive name, package version, Git
revision, pack UUIDs, worktree cleanliness, and SHA-256 checksum. A locally
generated artifact with `source_dirty: true` is a development build, not a
trusted CI candidate.

The individual commands are:

```sh
npm run validate
npm test
npm run package
```

For CI artifact identity, human verification, and the publication gate, see
[`candidate-and-release.md`](./candidate-and-release.md) and
[`ios-acceptance.md`](./ios-acceptance.md).

To explicitly bump the patch version before building a later candidate:

```sh
npm run version:set -- 0.1.1
npm run candidate
```

The version command requires a strictly increasing numeric `major.minor.patch`
version and synchronizes `package.json`, its lockfile, both manifest headers,
all module and dependency versions, and the identity catalog. It never changes
UUIDs or content identifiers. Review the diff before packaging.

## Preview

Start the read-only existing Creator Tools viewer with:

```sh
node_modules/.bin/mct view -i .
```

It may start a local server and open a browser. Select **Entity type
visuals/audio → baseline_mob → Preview** to inspect appearance. Browser preview
is a visual check only; it does not prove Bedrock behavior or iOS compatibility.
For this fixture, WebGL 2.0 is available but Creator Tools 0.20.0 reports that
the model or texture for `sinbad:baseline_mob` could not be loaded when the
client entity referenced the external vanilla `geometry.cow.v2`. The geometry is
now bundled locally as `geometry.sinbad.baseline_mob` (attribution in
[`third-party-notices.md`](./third-party-notices.md)). A human reported on
2026-11-01 that the model and custom texture render in Chrome on Ubuntu
([record](./verification/browser-review-2026-11-01.md)); this is not
candidate-bound and does not cover iOS. See
[`tooling.md`](./tooling.md) for the investigation.

## Validation and packaging details

`npm run validate` stages only the Behavior and Resource Packs, calls the pinned
Creator Tools `validate main` suite with JSON output and a temporary report
directory, and adds narrow project checks for strict JSON parsing, UUID and
version drift, dependencies, duplicate identifiers, custom textures, entity
and controller links, bundled namespaced geometry (external references rejected), localization, and the
baseline's no-natural-spawn/no-gameplay-script rules.

The Creator Tools warning that a render controller is missing `uv_anim` is a
known false positive: render controllers do not require that property. The
Other validation errors or warnings must be investigated rather
than ignored.

`npm run package` uses Creator Tools export on a temporary folder containing
only both packs. It inspects the ZIP entries, manifests, versions, dependencies,
required mob assets, absence of development files, and checksum before writing
the named archive and `.metadata.json` to `dist/`.

## Troubleshooting

- **Dependency or identity check fails:** compare the manifests with
  `tools/identity-catalog.json`. Restore the committed UUIDs; do not regenerate
  them. Use the explicit version command for an approved version increase.
- **Creator Tools warns about `uv_anim`:** this is the documented false
  positive for render controllers; the local validator labels its detail.
- **Unknown or external geometry error:** every client-entity geometry must be
  bundled in the Resource Pack under `models/entity/` and use the
  `geometry.sinbad.` prefix. Vanilla references are not allowlisted.
- **Viewer cannot render:** check browser WebGL/hardware acceleration and use a
  compatible browser. Until it renders, browser verification remains pending.
- **A candidate's identity is unclear:** match the metadata's source revision,
  version, archive filename, and SHA-256. Do not rely on filename alone.
