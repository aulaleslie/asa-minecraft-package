# Investigation: old and new Sinbad Selection packs both active in one world

Status: **deferred, cause unresolved** (2026-11-01). Reported by the maintainer
after the candidate D update test. The maintainer deferred it and accepted
development closure without a runtime fix; the cause is **not** explained and
**automatic replacement of old packs by the update is not verified**. Pack and module UUIDs are permanent: they are **not** regenerated
as a fix, and nothing in this investigation changes them.

## What the actual artifacts show

Manifests read directly from every preserved archive (candidate B 0.1.1, C 0.1.2,
D 0.2.0, plus the local 0.1.0 build):

| | Behavior Pack header | Resource Pack header |
|---|---|---|
| UUID, all versions | `d82f81a5-cec1-4e9d-8c34-19819a73db9c` | `8aa5ee10-fcca-4900-bab0-63e6c5cfb152` |
| Name, all versions | Sinbad Selection - Behavior | Sinbad Selection - Resources |
| Versions | 0.1.0, 0.1.1, 0.1.2, **0.2.0** | 0.1.0, 0.1.1, 0.1.2, **0.2.0** |
| Module UUID(s) | data `5944750f-6750-412a-aa16-b3f605da4ae1`; 0.2.0 adds script `7b622970-e47b-45fa-bb34-fa12a6b3badd` | resources `1a42a071-04f7-4cde-857c-2d16adce28a2` |

Dependencies:

- Behavior 0.1.x depends on Resource UUID `8aa5ee10-...` at the **same** 0.1.x
  version; Behavior 0.2.0 depends on it at 0.2.0, and on module
  `@minecraft/server` `2.11.0` (a string). The Resource Pack has no dependencies.
- Candidate D's header UUIDs, data/resources module UUIDs and the dependency
  UUID are identical to the old artifacts; only the versions differ (and the new
  script module and script dependency exist).
- There is no second pack, duplicate header UUID, renamed pack or leftover
  baseline manifest inside candidate D (two manifests; the archive passes the
  repository's archive inspector).

Conclusion from the artifacts: candidate D is a correct **same-UUID, higher
version** update of the old packs. The artifacts alone do not make a second pack
appear; they do not explain what the device shows.

## What the artifacts cannot show (unverified)

- How Minecraft 26.60 on iOS stores and lists several versions of one UUID
  (0.1.0, 0.1.1, 0.1.2 and 0.2.0 were each imported on this device), and whether
  a world can hold or list more than one version of the same UUID as "active".
- Whether a world's stored pack entry (`world_behavior_packs.json`,
  `world_resource_packs.json`: `pack_id` + `version`) keeps pointing at an older
  version after a higher one is imported, and how the game resolves that.
- Whether a behavior pack's dependency `version` is a minimum or an exact match.
  The documentation found does not state it (it says to copy the dependency's
  UUID and version exactly), so mixed old/new pairs are a hypothesis, not a fact.
- Because every version has identical names and descriptions, the pack lists
  show indistinguishable entries unless the version number is visible.

## Hypotheses (none confirmed)

1. Several imported versions of the same UUID remain in the device's pack list,
   and the world lists more than one of them as active.
2. The world still references an old version (for example Behavior 0.1.2 plus
   Resources 0.1.2) alongside the new one, so the old and new baseline-era
   content could both load.
3. A mixed pair, such as new Behavior 0.2.0 with an older Resource Pack, because
   of how the dependency version is resolved.
4. A display artifact only: the same pack shown in "available" and "active"
   lists.

The new guardian working (scripts, entity and animations active) shows the new
Behavior Pack loaded; it does not show that the old one is absent.

## Information needed from the device (read-only)

1. A screenshot or list of the world's active Behavior and Resource packs with
   their version numbers, and of the global pack lists.
2. The contents of `world_behavior_packs.json` and `world_resource_packs.json`
   for the updated test world, and the pack folders under the app's
   `behavior_packs` / `resource_packs` (names and the `version` in each
   `manifest.json`), if the Files app allows it.
3. Whether the old baseline egg, the old cow behavior or the old model still
   appears in that world (i.e. whether old content is actually active).
4. The order used: which versions were imported before opening the world, and
   whether packs were activated, removed or re-added by hand.

## Rules for any fix

- Keep the existing pack, module and dependency UUIDs. Never regenerate them.
- Only versions may increase, together, using `npm run version:set`.
- If the device behavior requires a packaging or manifest change, produce a new
  candidate and renew the affected update checks; do not transfer candidate D's
  acceptance.

## Deferral and consequence for acceptance

- Deferred by the maintainer on 2026-11-01. No runtime or manifest fix is
  required for development closure. Pack, module and dependency UUIDs are
  unchanged; none was regenerated.
- The existing-world update result stays **unverified**: that installing a
  higher version replaces, rather than coexists with, the old Sinbad Selection
  packs in a world is not established. Users should not be told updates
  replace old packs automatically; the backup and rollback guidance in
  `docs/cosmic-anomaly.md` still applies.
- Reopen this item if old baseline content (egg, cow, model) is found active,
  before any publication, or when the device information above is available.
  If a fix is ever needed it must keep all UUIDs, raise both versions together
  and produce a new candidate with renewed affected checks.
- Publication gate unchanged: still blocked until passing candidate-bound
  evidence and an explicit request.
