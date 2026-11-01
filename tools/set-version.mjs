#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

function parseVersion(value) {
  if (!/^\d+\.\d+\.\d+$/.test(value ?? "")) throw new Error("Version must be numeric major.minor.patch.");
  return value.split(".").map(Number);
}

function compare(left, right) {
  for (let i = 0; i < 3; i++) {
    if (left[i] !== right[i]) return left[i] - right[i];
  }
  return 0;
}

const args = process.argv.slice(2);
const targetVersion = args[0];
const rootFlag = args.indexOf("--root");
const root = path.resolve(rootFlag >= 0 ? args[rootFlag + 1] : path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."));

if (!targetVersion) {
  console.error("Usage: node tools/set-version.mjs <major.minor.patch> [--root <project-folder>]");
  process.exit(2);
}

try {
  const next = parseVersion(targetVersion);
  const packageFile = path.join(root, "package.json");
  const lockFile = path.join(root, "package-lock.json");
  const catalogFile = path.join(root, "tools", "identity-catalog.json");
  const packageJson = JSON.parse(fs.readFileSync(packageFile, "utf8"));
  const lock = JSON.parse(fs.readFileSync(lockFile, "utf8"));
  const catalog = JSON.parse(fs.readFileSync(catalogFile, "utf8"));
  const current = parseVersion(packageJson.version);
  if (compare(next, current) <= 0) throw new Error(`Version ${targetVersion} must be greater than current version ${packageJson.version}.`);
  if (!lock.packages?.[""]) throw new Error("package-lock.json has no root package entry.");

  const manifests = Object.entries(catalog.packs ?? {}).map(([name, entry]) => {
    const file = path.join(root, entry.manifest);
    const manifest = JSON.parse(fs.readFileSync(file, "utf8"));
    if (manifest.header?.uuid !== entry.header_uuid) throw new Error(`${name} pack UUID does not match the identity catalog.`);
    if (JSON.stringify(manifest.header?.version) !== JSON.stringify(entry.version)) {
      throw new Error(`${name} pack version does not match the identity catalog.`);
    }
    return { name, entry, file, manifest };
  });
  const resource = manifests.find(({ name }) => name === "resource");
  const behavior = manifests.find(({ name }) => name === "behavior");
  if (!resource || !behavior) throw new Error("Identity catalog must define behavior and resource packs.");
  if (behavior.manifest.dependencies?.length !== 1 ||
      behavior.manifest.dependencies[0].uuid !== resource.manifest.header.uuid) {
    throw new Error("Behavior Pack dependency does not point to the Resource Pack.");
  }

  packageJson.version = targetVersion;
  lock.version = targetVersion;
  lock.packages[""].version = targetVersion;
  catalog.release_version = targetVersion;
  for (const { entry, manifest } of manifests) {
    entry.version = [...next];
    manifest.header.version = [...next];
    for (const module of manifest.modules ?? []) module.version = [...next];
    for (const dependency of manifest.dependencies ?? []) dependency.version = [...next];
  }

  fs.writeFileSync(packageFile, JSON.stringify(packageJson, null, 2) + "\n");
  fs.writeFileSync(lockFile, JSON.stringify(lock, null, 2) + "\n");
  fs.writeFileSync(catalogFile, JSON.stringify(catalog, null, 2) + "\n");
  for (const { file, manifest } of manifests) fs.writeFileSync(file, JSON.stringify(manifest, null, 2) + "\n");
  console.log(`Synchronized pack versions to ${targetVersion}. Pack and module UUIDs and content identifiers were preserved.`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
