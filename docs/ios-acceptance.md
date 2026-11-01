# Manual iOS acceptance

Run these checks only with the exact CI candidate archive and metadata selected
for the test. Record the candidate revision, version, archive filename,
SHA-256, and both pack header UUIDs in
[`evidence-template.json`](./verification/evidence-template.json). Never
describe an unperformed or failed check as passing.

Candidate A's human-reported result is in
[`candidate-a-ios-report.md`](./verification/candidate-a-ios-report.md).

## Candidate A: initial installation

1. Download both files from the successful default-branch Candidate workflow
   run. Confirm the archive's SHA-256 matches its metadata and record all
   candidate A identity fields.
2. On the iOS device, import that `.mcaddon` into Minecraft. Create a new
   disposable test world.
3. Activate both **Sinbad Baseline Behavior Pack** and **Sinbad Baseline
   Resource Pack** in the world's pack settings. Do not enable experiments.
4. Enter Creative mode, find the baseline mob spawn egg, and spawn the mob.
   Record whether its localized name is readable, its appearance and texture
   render, and it remains passive when approached and hit.
5. Record the observed results, date, device model, Minecraft version, both
   packs active, and that experiments were not required. Do not claim a pass if
   any observation fails or is incomplete.
6. Back up or duplicate this world before candidate B is installed. Preserve
   the original test world and do not use a different world for the update
   check.

## Candidate B: in-place update

1. Obtain candidate B from a successful default-branch Candidate workflow run.
   Record its revision, version, archive filename, SHA-256, and pack UUIDs.
   Confirm its UUIDs match candidate A and its version is higher.
2. Import candidate B, then open the backed-up candidate A test world. Keep
   both packs active and leave experiments disabled.
3. Inspect the mob retained from candidate A and spawn another using the
   Creative spawn egg. Confirm both show candidate B's changed texture, names
   remain readable, both packs stay active, and no experiments are required.
4. Record the date and observations. If possible, confirm the changed texture
   against the successful browser preview of candidate B. Do not report a
   browser pass if the viewer did not render the model and texture.

Complete the corresponding status, date, and result fields in the evidence
JSON only after each check has actually passed. Set all required boolean
observations explicitly. The release gate rejects missing, pending, failed, or
candidate-mismatched evidence.
