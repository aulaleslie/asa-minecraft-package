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

    const evidence = {
      schema_version: 1,
      tester_role: "parent",
      tested_at: "2026-11-01",
      device: "Synthetic evidence fixture",
      minecraft_version: "26.60",
      candidate_a: {
        source_revision: "a".repeat(40),
        version: "0.0.9",
        archive: "asa-minecraft-package-v0.0.9.mcaddon",
        sha256: "c".repeat(64),
        pack_uuids: metadata.pack_uuids,
        browser_review: { status: "passed", date: "2026-11-01", result: "Synthetic browser pass fixture." },
        ios_initial: {
          status: "passed",
          date: "2026-11-01",
          both_packs_active: true,
          experiments_required: false,
          readable_name: true,
          spawn_egg_passive: true,
          appearance: true,
          result: "Synthetic initial-install pass fixture.",
        },
      },
      candidate_b: {
        ...metadata,
        browser_review: { status: "passed", date: "2026-11-01", result: "Synthetic browser pass fixture." },
        ios_update: {
          status: "passed",
          date: "2026-11-01",
          same_test_world: true,
          both_packs_active: true,
          experiments_required: false,
          retained_mob_new_texture: true,
          new_spawn_new_texture: true,
          result: "Synthetic update pass fixture.",
        },
      },
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
