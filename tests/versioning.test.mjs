import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("version command updates package, manifests, module dependencies, and catalog without changing identities", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sinbad-version-"));
  try {
    for (const name of ["behavior_pack", "resource_pack", "tools"]) {
      fs.cpSync(path.join(root, name), path.join(dir, name), { recursive: true });
    }
    for (const name of ["package.json", "package-lock.json"]) {
      fs.copyFileSync(path.join(root, name), path.join(dir, name));
    }
    const before = ["behavior_pack", "resource_pack"].map((name) => {
      const manifest = JSON.parse(fs.readFileSync(path.join(dir, name, "manifest.json"), "utf8"));
      return [manifest.header.uuid, ...manifest.modules.map((module) => module.uuid)];
    });
    const identifiersBefore = JSON.parse(fs.readFileSync(path.join(dir, "tools/identity-catalog.json"), "utf8"))
      .content_identifiers;
    const result = spawnSync(process.execPath, [
      path.join(root, "tools/set-version.mjs"), "0.1.1", "--root", dir,
    ], { encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
    const pkg = JSON.parse(fs.readFileSync(path.join(dir, "package.json"), "utf8"));
    const lock = JSON.parse(fs.readFileSync(path.join(dir, "package-lock.json"), "utf8"));
    const catalog = JSON.parse(fs.readFileSync(path.join(dir, "tools/identity-catalog.json"), "utf8"));
    assert.equal(pkg.version, "0.1.1");
    assert.equal(lock.version, "0.1.1");
    assert.equal(lock.packages[""].version, "0.1.1");
    assert.equal(catalog.release_version, "0.1.1");
    assert.deepEqual(catalog.content_identifiers, identifiersBefore);
    for (const [index, name] of ["behavior_pack", "resource_pack"].entries()) {
      const manifest = JSON.parse(fs.readFileSync(path.join(dir, name, "manifest.json"), "utf8"));
      assert.deepEqual(manifest.header.version, [0, 1, 1]);
      assert.ok(manifest.modules.every((module) => JSON.stringify(module.version) === "[0,1,1]"));
      assert.deepEqual([manifest.header.uuid, ...manifest.modules.map((module) => module.uuid)], before[index]);
    }
    const behavior = JSON.parse(fs.readFileSync(path.join(dir, "behavior_pack/manifest.json"), "utf8"));
    assert.deepEqual(behavior.dependencies[0].version, [0, 1, 1]);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("version command rejects a non-increasing version", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sinbad-version-"));
  try {
    for (const name of ["behavior_pack", "resource_pack", "tools"]) {
      fs.cpSync(path.join(root, name), path.join(dir, name), { recursive: true });
    }
    for (const name of ["package.json", "package-lock.json"]) {
      fs.copyFileSync(path.join(root, name), path.join(dir, name));
    }
    const result = spawnSync(process.execPath, [
      path.join(root, "tools/set-version.mjs"), "0.1.0", "--root", dir,
    ], { encoding: "utf8" });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /must be greater than current version/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
