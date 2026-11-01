import assert from "node:assert/strict";
import test from "node:test";
import { validateEvidence } from "../tools/evidence-validation.mjs";

const metadata = {
  source_revision: "b".repeat(40),
  version: "0.2.0",
  archive: "asa-minecraft-package-v0.2.0.mcaddon",
  sha256: "d".repeat(64),
  pack_uuids: {
    behavior: "11111111-1111-4111-8111-111111111111",
    resource: "22222222-2222-4222-8222-222222222222",
  },
};

function device(extra) {
  return {
    status: "passed", date: "2026-11-01", tester_role: "parent", device: "iOS test device",
    minecraft_version: "26.60", candidate_sha256: metadata.sha256, result: "Synthetic fixture result.",
    ...extra,
  };
}

export function passingEvidence() {
  return {
    schema_version: 2,
    subject: "sinbad:cosmic_anomaly",
    candidate: { ...metadata },
    browser_review: {
      status: "passed", date: "2026-11-01", candidate_sha256: metadata.sha256,
      reviewed_archive_sha256: metadata.sha256, opaque_preview_is_silhouette_only: true,
      shipped_texture_viewer_result: "Synthetic: viewer drew the shipped ring transparent.", result: "Synthetic fixture result.",
      ring_visible: true, center_black: true, four_tentacles: true, texture_applied: true,
      luminosity_reviewed: true, idle_animation: true, firing_animation: true, death_animation: true,
    },
    ios_fresh_install: device({
      both_packs_active: true, experiments_required: false, readable_name: true, spawn_egg: true,
      appearance: true, shipped_ring_visible: true, emissive_glow: true, animation: true, sound: true, guarding: true, health_200: true,
      targeting_exclusions: true, beam_damage_and_cooldown: true, beam_range_and_obstruction: true,
      bystanders_safe: true, death_sequence: true, no_drops: true,
    }),
    ios_persistence: device({
      backed_up_world: true, both_packs_active: true, experiments_required: false, save_reload: true,
      leave_and_return: true, anchor_persists: true, old_egg_absent: true, new_egg_works: true,
      saved_baseline_outcome: "Synthetic: saved baseline mob outcome recorded here.",
    }),
    ios_combat: device({ representative_combat: true, multi_guardian_scene: true, guardian_count: 4, responsive: true }),
  };
}

test("rejects absent evidence", () => {
  assert.match(validateEvidence(undefined, metadata).join("\n"), /missing or invalid/);
});

test("rejects old baseline-fixture evidence for a guardian candidate", () => {
  const baseline = { schema_version: 1, tester_role: "parent", tested_at: "2026-11-01", candidate_a: {}, candidate_b: {} };
  const errors = validateEvidence(baseline, metadata).join("\n");
  assert.match(errors, /baseline-fixture evidence does not accept a guardian candidate/);
  assert.match(errors, /subject must be sinbad:cosmic_anomaly/);
});

test("rejects pending browser and device results", () => {
  const evidence = passingEvidence();
  evidence.browser_review.status = "pending";
  evidence.ios_fresh_install.status = "pending";
  assert.match(validateEvidence(evidence, metadata).join("\n"), /must have status passed/);
});

test("rejects incomplete guardian checks", () => {
  for (const [section, key] of [
    ["ios_fresh_install", "targeting_exclusions"], ["ios_fresh_install", "death_sequence"],
    ["ios_persistence", "anchor_persists"], ["browser_review", "death_animation"],
    ["ios_combat", "multi_guardian_scene"],
  ]) {
    const evidence = passingEvidence();
    evidence[section][key] = false;
    assert.match(validateEvidence(evidence, metadata).join("\n"), new RegExp(`${section} must confirm ${key}`));
  }
});

test("rejects experiments being required", () => {
  const evidence = passingEvidence();
  evidence.ios_fresh_install.experiments_required = true;
  assert.match(validateEvidence(evidence, metadata).join("\n"), /experiments_required is false/);
});

test("rejects evidence bound to a different candidate checksum", () => {
  const evidence = passingEvidence();
  evidence.candidate.sha256 = "e".repeat(64);
  assert.match(validateEvidence(evidence, metadata).join("\n"), /checksum does not match/);
  const mismatched = passingEvidence();
  mismatched.ios_fresh_install.candidate_sha256 = "e".repeat(64);
  assert.match(validateEvidence(mismatched, metadata).join("\n"), /ios_fresh_install is not bound to the candidate checksum/);
});

test("rejects browser results that do not identify the packaged sources", () => {
  const evidence = passingEvidence();
  evidence.browser_review.reviewed_archive_sha256 = "e".repeat(64);
  assert.match(validateEvidence(evidence, metadata).join("\n"), /exact packaged sources/);
});

test("rejects missing tester, device or wrong Minecraft version", () => {
  const evidence = passingEvidence();
  evidence.ios_persistence.tester_role = "";
  evidence.ios_combat.device = "";
  evidence.ios_fresh_install.minecraft_version = "26.50";
  const errors = validateEvidence(evidence, metadata).join("\n");
  assert.match(errors, /ios_persistence tester_role/);
  assert.match(errors, /ios_combat device model/);
  assert.match(errors, /ios_fresh_install minecraft_version/);
});

test("rejects missing saved-baseline outcome, unbacked world and single guardian scene", () => {
  const evidence = passingEvidence();
  evidence.ios_persistence.saved_baseline_outcome = "";
  evidence.ios_persistence.backed_up_world = false;
  evidence.ios_combat.guardian_count = 1;
  const errors = validateEvidence(evidence, metadata).join("\n");
  assert.match(errors, /saved_baseline_outcome/);
  assert.match(errors, /backed_up_world/);
  assert.match(errors, /guardian_count/);
});

test("accepts complete candidate-bound guardian evidence", () => {
  assert.deepEqual(validateEvidence(passingEvidence(), metadata), []);
});
