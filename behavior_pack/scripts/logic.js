// Pure Cosmic Anomaly rules. This module must not import @minecraft/* so the
// repository's Node test suite can exercise it; main.js supplies the engine.

export const GUARDIAN_ID = "sinbad:cosmic_anomaly";
export const DYING_TAG = "sinbad:dying";

export const PASS_TICKS = 5;
export const MAX_SCANS_PER_PASS = 4;
export const MAX_QUERY = 32;
export const MAX_RAYS_PER_SCAN = 4;
export const IDLE_RESCAN_TICKS = 10;
export const COOLDOWN_TICKS = 60;
export const BLOCKED_MEMO_TICKS = 20;
export const BLOCKED_MEMO_MAX = 8;
export const RANGE = 16;
export const BEAM_DAMAGE = 8;
export const BEAM_ORIGIN_HEIGHT = 3;
export const FIRING_FLAG_TICKS = 10;
export const DYING_TICKS = 40;
// A ray hit counts as in the way when its actual hit point is nearer than the
// target by more than this small allowance. The hit point (block location plus
// face location) is used, never the block centre, so a wall directly in front
// of a target blocks the shot.
export const RAY_TOLERANCE = 0.05;

export const QUERY_FAMILIES = ["monster"];

// Ordinary hostile mobs the guardian may target (design.md, Task 1.3).
export const ALLOWED_TYPES = new Set([
  "zombie", "husk", "drowned", "zombie_villager_v2", "skeleton", "stray",
  "bogged", "creeper", "slime", "magma_cube", "phantom", "witch", "pillager",
  "vindicator", "evocation_illager", "vex", "ravager", "blaze", "ghast",
  "silverfish", "endermite", "guardian", "shulker", "breeze", "zoglin",
].map((name) => `minecraft:${name}`));

// Types that must never be targeted even though some share the monster family.
export const EXCLUDED_TYPES = [
  "ender_dragon", "wither", "elder_guardian", "warden", "creaking",
  "enderman", "spider", "cave_spider", "zombie_pigman", "piglin",
  "piglin_brute", "hoglin", "player", "villager_v2", "wandering_trader",
  "iron_golem", "wolf", "bee", "polar_bear", "llama", "dolphin", "panda",
  "goat", "cow", "armor_stand",
].map((name) => `minecraft:${name}`).concat(GUARDIAN_ID);

export function isEligibleType(typeId) {
  return ALLOWED_TYPES.has(typeId) && !EXCLUDED_TYPES.includes(typeId);
}

export function buildQuery(origin) {
  return {
    location: origin,
    maxDistance: RANGE,
    families: QUERY_FAMILIES,
    excludeTypes: EXCLUDED_TYPES,
    closest: MAX_QUERY,
  };
}

export function createState(now) {
  return { cooldown: COOLDOWN_TICKS, lastTick: now, nextScanTick: now, blocked: [] };
}

// Cooldown only counts real elapsed ticks, so lag cannot shorten it.
export function advanceCooldown(state, now) {
  const elapsed = Math.max(0, now - state.lastTick);
  state.cooldown = Math.max(0, state.cooldown - elapsed);
  state.lastTick = now;
}

export function isReady(state, now) {
  return state.cooldown <= 0 && now >= state.nextScanTick;
}

export function markFired(state, now) {
  state.cooldown = COOLDOWN_TICKS;
  state.lastTick = now;
  state.nextScanTick = now;
}

export function markIdle(state, now) {
  state.nextScanTick = now + IDLE_RESCAN_TICKS;
}

export function rememberBlocked(state, id, now) {
  state.blocked = state.blocked.filter((entry) => entry.id !== id);
  state.blocked.push({ id, until: now + BLOCKED_MEMO_TICKS });
  if (state.blocked.length > BLOCKED_MEMO_MAX) state.blocked.shift();
}

export function isRecentlyBlocked(state, id, now) {
  state.blocked = state.blocked.filter((entry) => entry.until > now);
  return state.blocked.some((entry) => entry.id === id);
}

// candidates: [{ id, typeId, distance }] from the bounded query. Returns the
// nearest eligible, not recently blocked ones, limited to the ray budget.
export function chooseCandidates(candidates, state, now) {
  return candidates
    .filter((candidate) => candidate.distance <= RANGE &&
      isEligibleType(candidate.typeId) &&
      !isRecentlyBlocked(state, candidate.id, now))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, MAX_RAYS_PER_SCAN);
}

// Absolute distance from the beam origin to a ray hit. faceLocation is relative
// to the block's bottom north-west corner. Any malformed hit is treated as
// touching the origin, i.e. blocking (conservative).
export function rayHitDistance(origin, blockLocation, faceLocation) {
  const values = [blockLocation?.x, blockLocation?.y, blockLocation?.z, faceLocation?.x, faceLocation?.y, faceLocation?.z];
  if (values.some((value) => !Number.isFinite(value))) return 0;
  return Math.hypot(
    blockLocation.x + faceLocation.x - origin.x,
    blockLocation.y + faceLocation.y - origin.y,
    blockLocation.z + faceLocation.z - origin.z,
  );
}

export function isBlockedByRay(hitDistance, targetDistance) {
  return hitDistance !== undefined && hitDistance < targetDistance - RAY_TOLERANCE;
}

// Fair round-robin: scan ready guardians starting at the cursor, then move the
// cursor past the last one scanned so deferred guardians go first next pass.
export function selectForScan(count, cursor, budget, isReadyAt) {
  const selected = [];
  if (count === 0) return { selected, nextCursor: 0 };
  const start = cursor % count;
  for (let offset = 0; offset < count && selected.length < budget; offset++) {
    const index = (start + offset) % count;
    if (isReadyAt(index)) selected.push(index);
  }
  const nextCursor = selected.length ? (selected[selected.length - 1] + 1) % count : start;
  return { selected, nextCursor };
}

// Deaths that bypass the custom sequence (see design.md): /kill and the void.
const UNINTERCEPTED_CAUSES = new Set(["selfDestruct", "void"]);

export function shouldInterceptLethal(damage, health, cause, alreadyDying) {
  if (UNINTERCEPTED_CAUSES.has(cause)) return false;
  return alreadyDying || damage >= health;
}
