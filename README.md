# Sinbad Selection

Sinbad Selection is a growing Minecraft Bedrock Edition add-on for iOS. The
repository keeps the Behavior Pack and Resource Pack as directly authored
runtime sources and distributes them together in one `.mcaddon`.

## Compatibility target

The iOS test device's installed stable version was reported as Minecraft 26.60.
The packs use stable manifest format 2 and target `min_engine_version`
`[1, 26, 60]`; experiments are not required. This is a declared target, not
proof of an iOS runtime test. See [compatibility notes](docs/compatibility.md).

## Repository layout

- `behavior_pack/` and `resource_pack/`: canonical Bedrock pack sources.
- `assets/references/`: preserved original creative input; never overwrite it
  with generated or edited output.
- `tools/` and `tests/`: narrow validation, packaging, versioning, and test
  helpers.
- `docs/`: contributor, compatibility, and verification guidance.
- `dist/`: generated candidates; ignored by Git.
- `openspec/`: approved change proposals, specifications, design, and tasks.

The public pack names are **Sinbad Selection - Behavior** and **Sinbad
Selection - Resources**. Custom content uses the `sinbad` namespace. Pack and
module UUIDs are committed identities: preserve them, and preserve existing
content identifiers across updates. Keep both pack versions synchronized and
the Behavior Pack dependency pointed at the Resource Pack's matching UUID and
version.

## Development setup

Use the pinned Node and npm versions in `.nvmrc` and `package.json`:

```sh
nvm install
nvm use
npm ci
```

Run local checks and produce a candidate with:

```sh
npm run candidate
```

See [Creator tooling](docs/tooling.md) for verified Mojang CLI commands and
viewer limitations, and [build, test, and troubleshooting](docs/build-and-test.md)
for the complete local workflow. Version changes are explicit; packaging must
not silently rewrite pack identity or version metadata.

## Contribution workflow

Plan substantial content or behavior changes in OpenSpec before implementation.
Review the proposal and requirements with the maintainer and obtain approval;
then implement the tracked tasks, run the checks, and review the diff against
the approved requirements. Do not introduce gameplay scripts, experiments, or
a custom viewer unless an approved change calls for them.

Keep original drawings and other creative inputs unchanged. Record their source
and preserve the child's stated requirements separately from AI-generated
interpretations. Do not treat generated assets as replacements for originals.

CI candidates are not public releases. Browser appearance review and real
Bedrock behavior are separate checks. Initial installation and existing-world
update acceptance require human iOS results tied to the exact candidate; do not
archive an OpenSpec change or publish a release while those required checks are
pending.
