import { world, system, EntityDamageCause } from "@minecraft/server";
import {
  GUARDIAN_ID, DYING_TAG, PASS_TICKS, MAX_SCANS_PER_PASS, BEAM_DAMAGE,
  BEAM_ORIGIN_HEIGHT, FIRING_FLAG_TICKS, DYING_TICKS, RANGE,
  buildQuery, createState, advanceCooldown, isReady, markFired, markIdle,
  rememberBlocked, chooseCandidates, isBlockedByRay, rayHitDistance, selectForScan,
  shouldInterceptLethal,
} from "./logic.js";

const guardians = new Map();
let cursor = 0;

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

function beamOrigin(entity) {
  const { x, y, z } = entity.location;
  return { x, y: y + BEAM_ORIGIN_HEIGHT, z };
}

function aimPoint(target) {
  try {
    return target.getAABB().center;
  } catch {
    const { x, y, z } = target.location;
    return { x, y: y + 0.9, z };
  }
}

function beginDying(entity) {
  if (!entity.isValid || entity.hasTag(DYING_TAG)) return;
  guardians.delete(entity.id);
  entity.addTag(DYING_TAG);
  entity.triggerEvent("sinbad:begin_dying");
  system.runTimeout(() => {
    if (entity.isValid) entity.remove();
  }, DYING_TICKS);
}

function register(entity) {
  if (entity.typeId !== GUARDIAN_ID || guardians.has(entity.id)) return;
  if (entity.hasTag(DYING_TAG)) {
    // A reloaded dying guardian only restarts the short removal timer.
    entity.triggerEvent("sinbad:begin_dying");
    system.runTimeout(() => {
      if (entity.isValid) entity.remove();
    }, DYING_TICKS);
    return;
  }
  // Cooldown is in memory only: a spawned or loaded guardian starts with a
  // full cooldown, so the three-second minimum can never be violated.
  guardians.set(entity.id, { entity, state: createState(system.currentTick) });
}

function showBeam(dimension, from, to) {
  const length = distance(from, to);
  const steps = Math.max(1, Math.floor(length));
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    try {
      dimension.spawnParticle("minecraft:endrod", {
        x: from.x + (to.x - from.x) * t,
        y: from.y + (to.y - from.y) * t,
        z: from.z + (to.z - from.z) * t,
      });
    } catch {
      return;
    }
  }
  dimension.playSound("beacon.power", from);
}

function fire(entity, target, origin, aim) {
  target.applyDamage(BEAM_DAMAGE, { cause: EntityDamageCause.magic, damagingEntity: entity });
  showBeam(entity.dimension, origin, aim);
  entity.setProperty("sinbad:firing", true);
  system.runTimeout(() => {
    if (entity.isValid) entity.setProperty("sinbad:firing", false);
  }, FIRING_FLAG_TICKS);
}

function scan(entity, state, now) {
  const origin = beamOrigin(entity);
  const found = entity.dimension.getEntities(buildQuery(origin));
  const candidates = [];
  const byId = new Map();
  for (const other of found) {
    if (other.id === entity.id) continue;
    const aim = aimPoint(other);
    byId.set(other.id, { entity: other, aim });
    candidates.push({ id: other.id, typeId: other.typeId, distance: distance(origin, aim) });
  }
  for (const candidate of chooseCandidates(candidates, state, now)) {
    const { entity: target, aim } = byId.get(candidate.id);
    if (!(candidate.distance > 0)) continue;
    const direction = {
      x: (aim.x - origin.x) / candidate.distance,
      y: (aim.y - origin.y) / candidate.distance,
      z: (aim.z - origin.z) / candidate.distance,
    };
    const hit = entity.dimension.getBlockFromRay(origin, direction, {
      maxDistance: Math.min(RANGE, candidate.distance),
      includeLiquidBlocks: false,
      includePassableBlocks: false,
    });
    let hitDistance;
    if (hit) {
      try {
        hitDistance = rayHitDistance(origin, hit.block.location, hit.faceLocation);
      } catch {
        hitDistance = 0;
      }
    }
    if (isBlockedByRay(hitDistance, candidate.distance)) {
      rememberBlocked(state, candidate.id, now);
      continue;
    }
    fire(entity, target, origin, aim);
    markFired(state, now);
    return;
  }
  markIdle(state, now);
}

function pass() {
  const now = system.currentTick;
  const live = [];
  for (const [id, guardian] of guardians) {
    if (!guardian.entity.isValid) guardians.delete(id);
    else {
      advanceCooldown(guardian.state, now);
      live.push(guardian);
    }
  }
  const { selected, nextCursor } = selectForScan(
    live.length, cursor, MAX_SCANS_PER_PASS, (index) => isReady(live[index].state, now));
  cursor = nextCursor;
  for (const index of selected) {
    const { entity, state } = live[index];
    try {
      scan(entity, state, now);
    } catch {
      markIdle(state, now);
    }
  }
}

// The before event is read-only: it may only inspect and cancel. All changes
// are deferred through system.run.
world.beforeEvents.entityHurt.subscribe((event) => {
  const entity = event.hurtEntity;
  if (entity.typeId !== GUARDIAN_ID) return;
  const health = entity.getComponent("minecraft:health")?.currentValue ?? Infinity;
  if (!shouldInterceptLethal(event.damage, health, event.damageSource.cause, entity.hasTag(DYING_TAG))) return;
  event.cancel = true;
  system.run(() => beginDying(entity));
});

world.afterEvents.entitySpawn.subscribe(({ entity }) => register(entity));
world.afterEvents.entityLoad.subscribe(({ entity }) => register(entity));
world.afterEvents.entityRemove.subscribe(({ removedEntityId }) => guardians.delete(removedEntityId));
world.afterEvents.worldLoad.subscribe(() => {
  for (const dimensionId of ["overworld", "nether", "the_end"]) {
    try {
      for (const entity of world.getDimension(dimensionId).getEntities({ type: GUARDIAN_ID })) register(entity);
    } catch {
      // Dimension without loaded chunks; entityLoad covers later loads.
    }
  }
});

system.runInterval(pass, PASS_TICKS);
