# Creator tooling

The baseline pins Node.js and Mojang's Minecraft Creator Tools CLI. Its commands
are used locally and in CI:

```sh
npm ci
npm run validate
npm run preview
npm run package
```

The upstream CLI was checked on Ubuntu on 2026-11-01. `@minecraft/creator-tools`
version `0.20.0` exposes the following relevant commands:

```sh
npx -y @minecraft/creator-tools@0.20.0 validate main -i . --json --force
npx -y @minecraft/creator-tools@0.20.0 view -i .
npx -y @minecraft/creator-tools@0.20.0 exportaddon -i . -o dist --format mcaddon
```

The viewer is read-only. By default it can load vanilla Minecraft resources;
`--isolated`/`--offline` explicitly disable that loading, so they are not used
for the model preview. The CLI help confirms that validation supports JSON
reports and a separate output folder, and that `exportaddon` can explicitly
write an `.mcaddon` containing both packs.

The fixture was opened in the Creator Tools 0.20.0 browser viewer on Ubuntu on
2026-11-01. WebGL 2.0 (OpenGL ES 3.0 Chromium) is confirmed available, but the
viewer reports: “Couldn't load model for `sinbad:baseline_mob`. Textures or
model data may be unavailable.” With the external vanilla geometry the textured mob did not render. After bundling the geometry locally, a human reported on 2026-11-01 that the model and custom texture render in Chrome on Ubuntu; see [`verification/browser-review-2026-11-01.md`](./verification/browser-review-2026-11-01.md). Task 2.3 is complete on that human-reported basis.

Resolution: the geometry is now bundled locally (see below). The original
investigation, kept for the record, confirms the viewer's vanilla data endpoint returns the cow
client entity pointing to `geometry.cow.v2`, and its `cow.v2.geo.json` contains
that geometry ID with 64×64 texture dimensions. The matching vanilla
`cow_v2.png` is served successfully. The add-on texture reference
`textures/entity/baseline_mob` also resolves to an existing, valid 64×64 PNG in
the Resource Pack.

Source inspection confirms a limitation in Creator Tools' custom-entity
preview path: it searches the project for the referenced geometry, then tries
a vanilla entity lookup using the entity identifier. The project lookup only
checks model files contained in the project; the vanilla fallback looks up
`sinbad:baseline_mob`, not the geometry ID `geometry.cow.v2`. Consequently this
preview path cannot resolve the external geometry even though the vanilla
geometry and texture endpoints are available. This is a viewer-resolution
limitation, not evidence that the game cannot resolve a vanilla geometry
reference. Because of this, the same vanilla cow geometry is bundled as
`resource_pack/models/entity/baseline_mob.geo.json` with the namespaced
identifier `geometry.sinbad.baseline_mob` (source and rights in
[`third-party-notices.md`](./third-party-notices.md)). Do not mark
browser acceptance passed unless the actual textured mob renders. WebGL
availability alone is not a pass, and browser appearance is not proof of
Bedrock runtime or iOS compatibility.

The `addon` validation suite enforces additional marketplace packaging rules
that are not required for this world-scoped add-on (including a reverse
resource-pack dependency); use the `main` suite together with this repository's
specific dependency and identity checks.
