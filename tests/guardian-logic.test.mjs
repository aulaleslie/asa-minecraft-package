import assert from "node:assert/strict";
import test from "node:test";
import {
  ALLOWED_TYPES, EXCLUDED_TYPES, COOLDOWN_TICKS, MAX_QUERY, MAX_RAYS_PER_SCAN, RANGE,
  advanceCooldown, buildQuery, chooseCandidates, createState, isBlockedByRay,
  isEligibleType, rayHitDistance, isReady, markFired, markIdle, rememberBlocked, selectForScan,
  shouldInterceptLethal,
} from "../behavior_pack/scripts/logic.js";

test("allowlist and exclusions are disjoint and exclude bosses, neutrals and players", () => {
  for (const type of ALLOWED_TYPES) assert.equal(EXCLUDED_TYPES.includes(type), false, type);
  for (const type of ["minecraft:wither", "minecraft:ender_dragon", "minecraft:elder_guardian",
    "minecraft:enderman", "minecraft:spider", "minecraft:piglin", "minecraft:player",
    "minecraft:cow", "minecraft:villager_v2", "minecraft:iron_golem", "sinbad:cosmic_anomaly"]) {
    assert.equal(isEligibleType(type), false, type);
  }
  for (const type of ["minecraft:zombie", "minecraft:skeleton", "minecraft:creeper"]) {
    assert.equal(isEligibleType(type), true, type);
  }
  assert.equal(isEligibleType("modded:unknown_monster"), false);
});

test("the target query is finite, family-limited and carries the exclusion list", () => {
  const query = buildQuery({ x: 0, y: 3, z: 0 });
  assert.equal(query.closest, MAX_QUERY);
  assert.ok(Number.isFinite(query.closest));
  assert.equal(query.maxDistance, RANGE);
  assert.deepEqual(query.families, ["monster"]);
  assert.deepEqual(query.excludeTypes, EXCLUDED_TYPES);
});

test("cooldown starts full, only counts real elapsed ticks and never shortens", () => {
  const state = createState(100);
  assert.equal(isReady(state, 100), false);
  advanceCooldown(state, 130);
  assert.equal(state.cooldown, COOLDOWN_TICKS - 30);
  advanceCooldown(state, 120); // a clock that goes backwards must not add or remove time
  assert.equal(state.cooldown, COOLDOWN_TICKS - 30);
  advanceCooldown(state, 190);
  assert.equal(state.cooldown, 0);
  assert.equal(isReady(state, 190), true);
  markFired(state, 190);
  assert.equal(state.cooldown, COOLDOWN_TICKS);
  assert.equal(isReady(state, 190), false);
  advanceCooldown(state, 249);
  assert.equal(isReady(state, 249), false);
  advanceCooldown(state, 250);
  assert.equal(isReady(state, 250), true);
});

test("an idle guardian backs off before rescanning", () => {
  const state = createState(0);
  advanceCooldown(state, 100);
  markIdle(state, 100);
  assert.equal(isReady(state, 105), false);
  assert.equal(isReady(state, 110), true);
});

test("candidates are filtered, sorted and limited to the ray budget", () => {
  const state = createState(0);
  const candidates = [
    { id: "far", typeId: "minecraft:zombie", distance: 15 },
    { id: "cow", typeId: "minecraft:cow", distance: 1 },
    { id: "enderman", typeId: "minecraft:enderman", distance: 2 },
    { id: "out", typeId: "minecraft:zombie", distance: 17 },
    ...Array.from({ length: 6 }, (_, i) => ({ id: `z${i}`, typeId: "minecraft:zombie", distance: 3 + i })),
  ];
  const chosen = chooseCandidates(candidates, state, 0);
  assert.equal(chosen.length, MAX_RAYS_PER_SCAN);
  assert.deepEqual(chosen.map((entry) => entry.id), ["z0", "z1", "z2", "z3"]);
});

test("excluded neighbours cannot hide an eligible hostile from selection", () => {
  const state = createState(0);
  const candidates = [
    ...Array.from({ length: 20 }, (_, i) => ({ id: `cow${i}`, typeId: "minecraft:cow", distance: 1 + i * 0.1 })),
    { id: "zombie", typeId: "minecraft:zombie", distance: 12 },
  ];
  assert.deepEqual(chooseCandidates(candidates, state, 0).map((entry) => entry.id), ["zombie"]);
});

test("a recently blocked near target lets a farther visible one be tested", () => {
  const state = createState(0);
  const candidates = Array.from({ length: 6 }, (_, i) => ({ id: `z${i}`, typeId: "minecraft:zombie", distance: 2 + i }));
  for (let i = 0; i < 4; i++) rememberBlocked(state, `z${i}`, 0);
  assert.deepEqual(chooseCandidates(candidates, state, 5).map((entry) => entry.id), ["z4", "z5"]);
  assert.deepEqual(chooseCandidates(candidates, state, 20).map((entry) => entry.id), ["z0", "z1", "z2", "z3"]);
});

test("the blocked memo is bounded", () => {
  const state = createState(0);
  for (let i = 0; i < 20; i++) rememberBlocked(state, `id${i}`, 0);
  assert.ok(state.blocked.length <= 8);
});

test("line of sight uses the real hit point and blocks any earlier hit", () => {
  assert.equal(isBlockedByRay(undefined, 10), false);
  assert.equal(isBlockedByRay(4, 10), true);
  // A wall directly in front of the target must block, even when it is close.
  assert.equal(isBlockedByRay(9.7, 10), true);
  assert.equal(isBlockedByRay(9.4, 10), true);
  // A hit at or beyond the target (a wall behind it) leaves the shot clear.
  assert.equal(isBlockedByRay(10, 10), false);
  assert.equal(isBlockedByRay(10.6, 10), false);
  assert.equal(isBlockedByRay(9.97, 10), false);
});

test("ray hit distance adds the face location to the block corner", () => {
  const origin = { x: 0, y: 0, z: 0 };
  assert.equal(rayHitDistance(origin, { x: 5, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }), 5);
  assert.equal(rayHitDistance(origin, { x: 5, y: 0, z: 0 }, { x: 0.5, y: 0, z: 0 }), 5.5);
  assert.equal(rayHitDistance(origin, { x: 3, y: 4, z: 0 }, { x: 0, y: 0, z: 0 }), 5);
});

test("a malformed ray hit is treated as blocking", () => {
  const origin = { x: 0, y: 0, z: 0 };
  assert.equal(isBlockedByRay(rayHitDistance(origin, undefined, undefined), 10), true);
  assert.equal(isBlockedByRay(rayHitDistance(origin, { x: 1, y: 1, z: 1 }, { x: NaN, y: 0, z: 0 }), 10), true);
});

test("round-robin scanning is bounded and visits every ready guardian over time", () => {
  const count = 10;
  const seen = new Set();
  let cursor = 0;
  for (let pass = 0; pass < 5; pass++) {
    const { selected, nextCursor } = selectForScan(count, cursor, 4, () => true);
    assert.ok(selected.length <= 4);
    selected.forEach((index) => seen.add(index));
    cursor = nextCursor;
  }
  assert.equal(seen.size, count);
});

test("guardians deferred by the budget are served first on the next pass", () => {
  const first = selectForScan(6, 0, 4, () => true);
  assert.deepEqual(first.selected, [0, 1, 2, 3]);
  const second = selectForScan(6, first.nextCursor, 4, () => true);
  assert.deepEqual(second.selected.slice(0, 2), [4, 5]);
});

test("not-ready guardians are skipped without consuming budget", () => {
  const { selected } = selectForScan(6, 0, 2, (index) => index === 3 || index === 5);
  assert.deepEqual(selected, [3, 5]);
  assert.deepEqual(selectForScan(0, 3, 4, () => true), { selected: [], nextCursor: 0 });
});

test("lethal damage is intercepted except for the deliberate-removal causes", () => {
  assert.equal(shouldInterceptLethal(10, 5, "entityAttack", false), true);
  assert.equal(shouldInterceptLethal(5, 5, "magic", false), true);
  assert.equal(shouldInterceptLethal(4, 5, "entityAttack", false), false);
  assert.equal(shouldInterceptLethal(9999, 5, "selfDestruct", false), false);
  assert.equal(shouldInterceptLethal(9999, 5, "void", false), false);
  assert.equal(shouldInterceptLethal(1, 200, "entityAttack", true), true);
});
