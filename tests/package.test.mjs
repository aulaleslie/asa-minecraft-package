import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { inspectAddonEntries, readZipEntries } from "../tools/archive-utils.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("package command creates one inspectable mcaddon with matching metadata and checksum", () => {
  const output = fs.mkdtempSync(path.join(os.tmpdir(), "sinbad-package-test-"));
  try {
    const result = spawnSync(process.execPath, [
      path.join(root, "tools/package-addon.mjs"), "--output-dir", output,
    ], { encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    const packageJson = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
    const archiveName = `asa-minecraft-package-v${packageJson.version}.mcaddon`;
    const archivePath = path.join(output, archiveName);
    const metadata = JSON.parse(fs.readFileSync(`${archivePath}.metadata.json`, "utf8"));
    const archive = fs.readFileSync(archivePath);
    metadata.source_dirty = true;
    assert.equal(metadata.archive, archiveName);
    assert.equal(metadata.version, packageJson.version);
    assert.equal(metadata.sha256, crypto.createHash("sha256").update(archive).digest("hex"));
    const entries = readZipEntries(archive);
    assert.deepEqual(inspectAddonEntries(entries, packageJson.version), []);
    assert.equal([...entries.keys()].some((file) => file.startsWith("tools/") || file.startsWith("docs/")), false);

    const device = (extra) => ({
      status: "passed", date: "2026-11-01", tester_role: "parent", device: "Synthetic evidence fixture",
      minecraft_version: "26.60", candidate_sha256: metadata.sha256, result: "Synthetic pass fixture.", ...extra,
    });
    const evidence = {
      schema_version: 2,
      subject: "sinbad:cosmic_anomaly",
      candidate: { ...metadata },
      browser_review: {
        status: "passed", date: "2026-11-01", candidate_sha256: metadata.sha256,
        reviewed_archive_sha256: metadata.sha256, opaque_preview_is_silhouette_only: true,
      shipped_texture_viewer_result: "Synthetic: viewer drew the shipped ring transparent.", result: "Synthetic browser pass fixture.",
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
        saved_baseline_outcome: "Synthetic fixture outcome.",
      }),
      ios_combat: device({ representative_combat: true, multi_guardian_scene: true, guardian_count: 3, responsive: true }),
    };
    const evidencePath = path.join(output, "evidence.json");
    fs.writeFileSync(evidencePath, JSON.stringify(evidence));
    const metadataPath = `${archivePath}.metadata.json`;
    fs.writeFileSync(metadataPath, JSON.stringify(metadata));
    const gate = path.join(root, "tools/validate-candidate.mjs");
    const missingResult = spawnSync(process.execPath, [
      gate, path.join(output, "missing.mcaddon.metadata.json"),
    ], { encoding: "utf8" });
    assert.notEqual(missingResult.status, 0);

    const dirtyResult = spawnSync(process.execPath, [
      gate, metadataPath, "--revision", metadata.source_revision, "--evidence", evidencePath,
    ], { encoding: "utf8" });
    assert.notEqual(dirtyResult.status, 0);
    assert.match(dirtyResult.stderr, /clean source revision/);

    metadata.source_dirty = false;
    fs.writeFileSync(metadataPath, JSON.stringify(metadata));
    const verifiedResult = spawnSync(process.execPath, [
      gate, metadataPath, "--revision", metadata.source_revision, "--evidence", evidencePath,
    ], { encoding: "utf8" });
    assert.equal(verifiedResult.status, 0, `${verifiedResult.stdout}\n${verifiedResult.stderr}`);
    assert.match(verifiedResult.stdout, new RegExp(metadata.sha256));

    const revisionResult = spawnSync(process.execPath, [
      gate, metadataPath, "--revision", "f".repeat(40),
    ], { encoding: "utf8" });
    assert.notEqual(revisionResult.status, 0);
    assert.match(revisionResult.stderr, /does not match the trusted workflow run/);

    metadata.sha256 = "f".repeat(64);
    fs.writeFileSync(metadataPath, JSON.stringify(metadata));
    const checksumResult = spawnSync(process.execPath, [
      gate, metadataPath, "--revision", metadata.source_revision,
    ], { encoding: "utf8" });
    assert.notEqual(checksumResult.status, 0);
    assert.match(checksumResult.stderr, /SHA-256 does not match/);
  } finally {
    fs.rmSync(output, { recursive: true, force: true });
  }
});

test("package keeps the script dependency version a string and the manifests byte-identical", () => {
  const output = fs.mkdtempSync(path.join(os.tmpdir(), "sinbad-package-manifest-"));
  try {
    const result = spawnSync(process.execPath, [path.join(root, "tools/package-addon.mjs"), "--output-dir", output],
      { encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    const archive = fs.readdirSync(output).find((file) => file.endsWith(".mcaddon"));
    const entries = readZipEntries(fs.readFileSync(path.join(output, archive)));
    for (const [folder, source] of [["behavior_pack", "behavior_pack"], ["resource_pack", "resource_pack"]]) {
      const name = [...entries.keys()].find((file) => file.startsWith(folder) && file.endsWith("/manifest.json"));
      assert.deepEqual(entries.get(name), fs.readFileSync(path.join(root, source, "manifest.json")));
    }
    const behavior = JSON.parse(entries.get([...entries.keys()].find((file) => file.startsWith("behavior_pack") && file.endsWith("/manifest.json"))));
    assert.equal(behavior.dependencies.find((dependency) => dependency.module_name).version, "2.11.0");
  } finally {
    fs.rmSync(output, { recursive: true, force: true });
  }
});

test("archive inspector rejects array-form script dependency versions", () => {
  const entries = new Map([
    ["behavior_pack_bp/manifest.json", Buffer.from(JSON.stringify({
      header: { uuid: "11111111-1111-4111-8111-111111111111", version: [0, 2, 0] },
      modules: [{ type: "data", version: [0, 2, 0] }],
      dependencies: [
        { uuid: "22222222-2222-4222-8222-222222222222", version: [0, 2, 0] },
        { module_name: "@minecraft/server", version: [2, 11, 0] },
      ],
    }))],
    ["resource_pack_rp/manifest.json", Buffer.from(JSON.stringify({
      header: { uuid: "22222222-2222-4222-8222-222222222222", version: [0, 2, 0] },
      modules: [{ type: "resources", version: [0, 2, 0] }],
    }))],
  ]);
  assert.ok(inspectAddonEntries(entries, "0.2.0").some((error) => error.includes("must be a string")));
});

test("archive inspector rejects version drift and non-runtime files", () => {
  const entries = new Map([
    ["behavior_pack_bp/manifest.json", Buffer.from(JSON.stringify({
      header: { uuid: "11111111-1111-4111-8111-111111111111", version: [0, 1, 0] },
      modules: [{ type: "data", version: [0, 1, 0] }],
      dependencies: [{ uuid: "22222222-2222-4222-8222-222222222222", version: [0, 1, 0] }],
    }))],
    ["resource_pack_rp/manifest.json", Buffer.from(JSON.stringify({
      header: { uuid: "22222222-2222-4222-8222-222222222222", version: [0, 1, 0] },
      modules: [{ type: "resources", version: [0, 1, 0] }],
    }))],
    ["tools/identity-catalog.json", Buffer.from("{}")],
  ]);
  const errors = inspectAddonEntries(entries, "0.1.1");
  assert.ok(errors.some((error) => error.includes("version does not match")));
  assert.ok(errors.some((error) => error.includes("development or unexpected file")));
});
