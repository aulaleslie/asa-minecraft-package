import assert from "node:assert/strict";
import test from "node:test";
import { validateEvidence } from "../tools/evidence-validation.mjs";

const metadata = {
  source_revision: "b".repeat(40),
  version: "0.1.1",
  archive: "asa-minecraft-package-v0.1.1.mcaddon",
  sha256: "d".repeat(64),
  pack_uuids: {
    behavior: "11111111-1111-4111-8111-111111111111",
    resource: "22222222-2222-4222-8222-222222222222",
  },
};

function passingEvidence() {
  return {
    schema_version: 1,
    tester_role: "parent",
    tested_at: "2026-11-01",
    device: "iOS test device",
    minecraft_version: "26.60",
    candidate_a: {
      source_revision: "a".repeat(40),
      version: "0.1.0",
      archive: "asa-minecraft-package-v0.1.0.mcaddon",
      sha256: "c".repeat(64),
      pack_uuids: metadata.pack_uuids,
      browser_review: { status: "passed", date: "2026-11-01", result: "Model and texture rendered and inspected." },
      ios_initial: {
        status: "passed",
        date: "2026-11-01",
        both_packs_active: true,
        experiments_required: false,
        readable_name: true,
        spawn_egg_passive: true,
        appearance: true,
        result: "Fresh world created; both packs active and mob behavior confirmed.",
      },
    },
    candidate_b: {
      ...metadata,
      pack_uuids: metadata.pack_uuids,
      browser_review: { status: "passed", date: "2026-11-01", result: "Changed teal texture rendered and inspected." },
      ios_update: {
        status: "passed",
        date: "2026-11-01",
        same_test_world: true,
        both_packs_active: true,
        experiments_required: false,
        retained_mob_new_texture: true,
        new_spawn_new_texture: true,
        result: "Existing mob and new spawn used the updated texture in the same backed-up world.",
      },
    },
  };
}

test("rejects absent evidence", () => {
  assert.match(validateEvidence(undefined, metadata).join("\n"), /missing or invalid/);
});

test("rejects pending browser and device results", () => {
  const evidence = passingEvidence();
  evidence.candidate_a.browser_review.status = "pending";
  evidence.candidate_a.ios_initial.status = "pending";
  assert.match(validateEvidence(evidence, metadata).join("\n"), /must have status passed/);
});

test("rejects failed device results", () => {
  const evidence = passingEvidence();
  evidence.candidate_b.ios_update.status = "failed";
  assert.match(validateEvidence(evidence, metadata).join("\n"), /ios_update must have status passed/);
});

test("rejects evidence bound to a different candidate checksum", () => {
  const evidence = passingEvidence();
  evidence.candidate_b.sha256 = "e".repeat(64);
  assert.match(validateEvidence(evidence, metadata).join("\n"), /checksum does not match/);
});

test("accepts complete candidate-bound browser and iOS evidence", () => {
  assert.deepEqual(validateEvidence(passingEvidence(), metadata), []);
});
