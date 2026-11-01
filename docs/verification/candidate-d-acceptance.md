# Candidate D acceptance for development closure (2026-11-01)

The maintainer (repository owner) accepted candidate D for **development
closure** of `introduce-cosmic-anomaly`. This is a scope decision, not passing
evidence for the checks listed as untested. It does not authorize publication
and does not change or weaken the publication evidence gate.

## Candidate (verified)

Version 0.2.0, source revision `d853784e585b093690ab0324bfed39b9354dae07`
(clean), SHA-256 `b436c7a37ef4c7353663077f978e0112164067cb11319a4df3726a4ccd9619fe`,
CI run 41317446968. Details and verification steps:
[`candidate-d-human-report.md`](./candidate-d-human-report.md).

## Preserved qualitative device passes (not instrumented)

Reported by the parent/user on an iPhone 15, Minecraft 26.60, for this exact
candidate (test date unspecified): appearance of the shipped guardian; moving
tentacles and hovering; combat effects and sound; wall and range checks;
friendly safety and no retaliation; guarding; save/reload persistence; death
animation without drops; nighttime glow; multiple-guardian responsiveness;
existing-world update checks.

> **Deferred issue:** both an old and the new Sinbad Selection pack were observed
> active in the same world. The maintainer deferred it for development closure;
> its cause is unresolved, UUIDs are unchanged and no runtime fix is required.
> **Automatic replacement of old packs by the update is not verified.** See
> [`pack-version-investigation.md`](./pack-version-investigation.md).

## Unmeasured values (not verified, not passed)

- Exact 200 health.
- Exact 8 base damage per shot (including whether defenses reduce it).
- Exact 3.0 s firing interval, and first-shot timing after a reload.
- Exact ~8-block guarding radius, hover height and 16-block range distances.

## Unreported or untested cases (not passed)

- Readable name and Creative egg; both packs active without experiments.
- Bosses (wither, ender dragon, elder guardian) and default-excluded neutral or
  conditionally neutral mobs (enderman, spider, piglin, ...) as non-targets.
- A dying guardian stopping its movement.
- Glass, water and 17-block line-of-sight boundary cases; matrix rows A9, A10,
  A17a and A17b (excluded-neighbour filter ordering and candidate saturation).
- Automatic replacement of old packs by the update (deferred issue above; cause unresolved).
- Leave-and-return; anchor persistence specifics; old egg absence and new egg
  after the update; whether the update world was backed up; the **actual
  outcome for saved baseline cows**.
- Guardian count in the multi-guardian scene; balance of the encounter in detail.
- The actual test date.

## Browser limitations (recorded, not failures)

Creator Tools 0.20.0's viewer ignores client-entity materials and treats low
alpha as transparency: with the shipped texture it draws the ring invisible and
the ribbons translucent. The opaque preview copy shows the silhouette only and
is not shipped-appearance evidence. Luminosity and idle/firing/death animation
playback cannot be demonstrated or were not observed in the viewer. Browser
results never prove Bedrock behavior; shipped appearance and glow rest on the
qualitative device report above.

## Consequences

- The change may be closed on this recorded scope. Untested items are not
  marked passed anywhere, and tasks 5.1-5.5 say so.
- This acceptance applies only to candidate D's exact bytes. Any runtime change
  produces a new candidate, and renewed checks are needed for the affected
  behavior; nothing transfers automatically.
- The release workflow is unchanged. `docs/verification/evidence.json` does not
  exist; filling it from this report would fail the gate for the items above
  (missing luminosity/animation browser items, packs/experiments, name/egg,
  health/damage/timing, exclusions, leave-and-return, old/new egg, the saved
  baseline outcome and backup, guardian count and test dates). Publication
  needs passing candidate-bound evidence for the exact candidate and an
  explicit request.
- The change is not archived or committed by this record.
