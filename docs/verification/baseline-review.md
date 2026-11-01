# Baseline review against specs (2026-11-01)

Status: **not ready to close** until the gaps below are confirmed by the
owner. Nothing here is invented; human results are as reported.

## Evidence summary

| Candidate | Version | Revision | CI | Browser | iOS |
| --- | --- | --- | --- | --- | --- |
| A | 0.1.0 | `5d7f158…` | run 41308515734 ✔ | human-reported pass on the same asset hashes (`browser-review-2026-11-01.md`; geometry, entity, controller and texture hashes match revision `5d7f158`) | human-reported: imported, spawned, wandered, teal texture, cow shape, "everything worked" (`candidate-a-ios-report.md`) |
| B | 0.1.1 | `a46320c…` | run 41310055058 ✔ | human-reported pass | human-reported pass: same-world update, experiments disabled (`candidate-b-human-report.md`) |
| 0.1.2 | 0.1.2 | `41b3482…` | run 41311597046 ✔ | not separately reported | human-reported visual approval (`candidate-0.1.2-human-report.md`) |

## Spec review

- **addon-compatibility:** identities stable across 0.1.0 → 0.1.2 (UUIDs and
  `sinbad:baseline_mob` unchanged, versions synchronized, dependency matches);
  single bundled `.mcaddon` with both packs; recorded target 26.60. Initial
  import and the visible update are human-reported as passing.
- **addon-verification:** local validation/tests/packaging pass (0 errors, 20/20
  tests); CI produced downloadable artifacts and no release; negative tests cover
  missing assets, UUID drift and version drift; evidence validator and
  manual-only release gate exist; contribution lifecycle documented.
- **baseline-mob:** passive mob, spawn egg, no natural spawning, no scripts;
  bundled cow geometry with custom texture; B changed only texture color and
  version (plus icon-only/version change in 0.1.2).

## Gaps (specific, unconfirmed)

1. Candidate A: pack activation in the world settings, readable mob/spawn-egg
   names (no raw localization key), spawn via the Creative spawn egg, and
   passive behavior when approached/hit were not explicitly reported. Task 5.3
   stays pending.
2. Candidate B: no per-item detail beyond "requested checks passed"; the
   retained mob's survival and the pack-activation state are covered only by
   that statement.
3. Candidate 0.1.2: no per-item iOS detail (icon on both packs, version,
   experiments).
4. Release-gate evidence JSON (`docs/verification/evidence-template.json`
   format) has not been filled: it needs tester role, device, per-candidate
   fields and the booleans above, and it would fail validation until gaps 1–2
   are confirmed. Candidate A's archive files are no longer in `artifacts/`;
   they remain available from CI run 41308515734.
5. The Mojang sample geometry's redistribution terms still need the owner's
   confirmation before any public release (`third-party-notices.md`).
6. Release identity: the release gate binds evidence to one exact candidate.
   The tested B (0.1.1) differs from the current 0.1.2 head, so publishing 0.1.2
   would need renewed evidence for it.
7. The existing npm audit transitive findings are unresolved.
