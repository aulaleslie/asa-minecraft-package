#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { inspectAddonEntries, readZipEntries, writeZipEntries } from "./archive-utils.mjs";
import { inspectProject } from "./project-validation.mjs";

const toolRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const rootOption = args.indexOf("--root");
const outputOption = args.indexOf("--output-dir");
const projectRoot = path.resolve(rootOption >= 0 ? args[rootOption + 1] : toolRoot);
const outputDir = path.resolve(outputOption >= 0 ? args[outputOption + 1] : path.join(projectRoot, "dist"));

function run(command, commandArgs, options = {}) {
  const result = spawnSync(command, commandArgs, { encoding: "utf8", maxBuffer: 256 * 1024 * 1024, ...options });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${command} ${commandArgs.join(" ")} failed (exit ${result.status}).\n${result.stdout ?? ""}\n${result.stderr ?? ""}`);
  }
  return result;
}

try {
  const staticResult = inspectProject(projectRoot);
  if (staticResult.errors.length) throw new Error(staticResult.errors.join("\n"));
  const packageJson = JSON.parse(fs.readFileSync(path.join(projectRoot, "package.json"), "utf8"));
  const catalog = JSON.parse(fs.readFileSync(path.join(projectRoot, "tools/identity-catalog.json"), "utf8"));
  const version = packageJson.version;
  const archiveName = `asa-minecraft-package-v${version}.mcaddon`;
  fs.mkdirSync(outputDir, { recursive: true });

  const stage = fs.mkdtempSync(path.join(os.tmpdir(), "sinbad-package-"));
  try {
    for (const pack of ["behavior_pack", "resource_pack"]) {
      fs.cpSync(path.join(projectRoot, pack), path.join(stage, pack), { recursive: true });
    }
    const cli = path.join(toolRoot, "node_modules/@minecraft/creator-tools/cli/index.mjs");
    const archivePath = path.join(outputDir, archiveName);
    fs.rmSync(archivePath, { force: true });
    run(process.execPath, [
      cli, "exportaddon", "-i", stage, "--of", archivePath, "--format", "mcaddon", "--json",
    ]);

    // Creator Tools rewrites script dependency versions ("2.11.0" -> [2, 11, 0]),
    // which Bedrock does not accept for module_name dependencies. Restore the
    // exact source manifests inside the exported archive.
    const exported = readZipEntries(fs.readFileSync(archivePath));
    for (const name of exported.keys()) {
      if (!name.endsWith("/manifest.json")) continue;
      const packFolder = name.startsWith("behavior_pack") ? "behavior_pack" : name.startsWith("resource_pack") ? "resource_pack" : undefined;
      if (packFolder) exported.set(name, fs.readFileSync(path.join(projectRoot, packFolder, "manifest.json")));
    }
    fs.writeFileSync(archivePath, writeZipEntries(exported));
    const archiveBuffer = fs.readFileSync(archivePath);
    const entries = readZipEntries(archiveBuffer);
    const archiveErrors = inspectAddonEntries(entries, version);
    if (archiveErrors.length) throw new Error(archiveErrors.join("\n"));
    const archiveSha256 = crypto.createHash("sha256").update(archiveBuffer).digest("hex");
    const revisionResult = run("git", ["rev-parse", "HEAD"], { cwd: projectRoot });
    const dirtyResult = run("git", ["status", "--porcelain", "--untracked-files=all"], { cwd: projectRoot });
    const metadata = {
      schema_version: 1,
      package: packageJson.name,
      version,
      source_revision: revisionResult.stdout.trim(),
      source_dirty: Boolean(dirtyResult.stdout.trim()),
      archive: archiveName,
      sha256: archiveSha256,
      pack_uuids: {
        behavior: catalog.packs.behavior.header_uuid,
        resource: catalog.packs.resource.header_uuid,
      },
    };
    fs.writeFileSync(path.join(outputDir, `${archiveName}.metadata.json`), JSON.stringify(metadata, null, 2) + "\n");
    console.log(`Created ${archivePath}`);
    console.log(`SHA-256: ${archiveSha256}`);
    console.log(`Source revision: ${metadata.source_revision}${metadata.source_dirty ? " (working tree has uncommitted changes)" : ""}`);
  } finally {
    fs.rmSync(stage, { recursive: true, force: true });
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
