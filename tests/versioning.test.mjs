import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const currentVersion = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8")).version;
const nextVersion = currentVersion.split(".").map(Number).map((part, index) => (index === 2 ? part + 1 : part));
const nextText = nextVersion.join(".");

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
      path.join(root, "tools/set-version.mjs"), nextText, "--root", dir,
    ], { encoding: "utf8" });
    assert.equal(result.status, 0, result.stderr);
    const pkg = JSON.parse(fs.readFileSync(path.join(dir, "package.json"), "utf8"));
    const lock = JSON.parse(fs.readFileSync(path.join(dir, "package-lock.json"), "utf8"));
    const catalog = JSON.parse(fs.readFileSync(path.join(dir, "tools/identity-catalog.json"), "utf8"));
    assert.equal(pkg.version, nextText);
    assert.equal(lock.version, nextText);
    assert.equal(lock.packages[""].version, nextText);
    assert.equal(catalog.release_version, nextText);
    assert.deepEqual(catalog.content_identifiers, identifiersBefore);
    for (const [index, name] of ["behavior_pack", "resource_pack"].entries()) {
      const manifest = JSON.parse(fs.readFileSync(path.join(dir, name, "manifest.json"), "utf8"));
      assert.deepEqual(manifest.header.version, nextVersion);
      assert.ok(manifest.modules.every((module) => JSON.stringify(module.version) === JSON.stringify(nextVersion)));
      assert.deepEqual([manifest.header.uuid, ...manifest.modules.map((module) => module.uuid)], before[index]);
    }
    const behavior = JSON.parse(fs.readFileSync(path.join(dir, "behavior_pack/manifest.json"), "utf8"));
    assert.deepEqual(behavior.dependencies[0].version, nextVersion);
    // The pinned script API dependency must keep its own version.
    assert.equal(behavior.dependencies.find((dependency) => dependency.module_name)?.version, "2.11.0");
    assert.equal(behavior.modules.find((module) => module.type === "script")?.uuid, "7b622970-e47b-45fa-bb34-fa12a6b3badd");
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
      path.join(root, "tools/set-version.mjs"), currentVersion, "--root", dir,
    ], { encoding: "utf8" });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /must be greater than current version/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
