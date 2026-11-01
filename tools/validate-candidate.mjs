#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { inspectAddonEntries, readZipEntries } from "./archive-utils.mjs";
import { validateEvidence } from "./evidence-validation.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const metadataPath = args.find((value) => !value.startsWith("--"));
function option(name) {
  const index = args.indexOf(name);
  return index < 0 ? undefined : args[index + 1];
}

try {
  if (!metadataPath) throw new Error("Usage: node tools/validate-candidate.mjs <candidate.metadata.json> [--revision <sha>] [--evidence <json>]");
  const resolvedMetadata = path.resolve(metadataPath);
  const metadata = JSON.parse(fs.readFileSync(resolvedMetadata, "utf8"));
  if (metadata.schema_version !== 1) throw new Error("Unsupported candidate metadata schema.");
  if (metadata.package !== "asa-minecraft-package") throw new Error("Candidate package name is incorrect.");
  if (metadata.source_dirty !== false) throw new Error("Candidate was not built from a clean source revision.");
  if (!/^\d+\.\d+\.\d+$/.test(metadata.version ?? "")) throw new Error("Candidate version must be numeric major.minor.patch.");
  const revision = option("--revision");
  if (revision && metadata.source_revision !== revision) throw new Error("Candidate source revision does not match the trusted workflow run.");
  if (typeof metadata.archive !== "string" ||
      path.basename(metadata.archive) !== metadata.archive || !metadata.archive.endsWith(".mcaddon")) {
    throw new Error("Candidate archive must be an .mcaddon filename, not a path.");
  }
  if (metadata.archive !== `asa-minecraft-package-v${metadata.version}.mcaddon`) {
    throw new Error("Candidate archive name does not match the package version.");
  }
  if (!/^[0-9a-f]{40}$/i.test(metadata.source_revision ?? "")) throw new Error("Candidate source_revision must be a Git commit SHA.");
  if (!/^[0-9a-f]{64}$/i.test(metadata.sha256 ?? "")) throw new Error("Candidate sha256 must be a 64-digit checksum.");

  const catalog = JSON.parse(fs.readFileSync(path.join(root, "tools/identity-catalog.json"), "utf8"));
  const expectedUuids = {
    behavior: catalog.packs.behavior.header_uuid,
    resource: catalog.packs.resource.header_uuid,
  };
  if (metadata.pack_uuids?.behavior !== expectedUuids.behavior ||
      metadata.pack_uuids?.resource !== expectedUuids.resource) {
    throw new Error("Candidate pack UUIDs do not match the approved identity catalog.");
  }
  const archivePath = path.join(path.dirname(resolvedMetadata), metadata.archive);
  const archiveBuffer = fs.readFileSync(archivePath);
  const checksum = crypto.createHash("sha256").update(archiveBuffer).digest("hex");
  if (checksum !== metadata.sha256) throw new Error("Candidate archive SHA-256 does not match its metadata.");
  const entries = readZipEntries(archiveBuffer);
  const archiveErrors = inspectAddonEntries(entries, metadata.version);
  if (archiveErrors.length) throw new Error(archiveErrors.join("\n"));
  const manifests = [...entries]
    .filter(([name]) => name.endsWith("/manifest.json"))
    .map(([name, contents]) => ({ name, json: JSON.parse(contents.toString("utf8")) }));
  for (const [packName, manifestType] of [["behavior", "data"], ["resource", "resources"]]) {
    const matches = manifests.filter(({ json }) => json.modules?.some(({ type }) => type === manifestType));
    if (matches.length !== 1) throw new Error(`Candidate must contain exactly one ${packName} manifest.`);
    const pack = catalog.packs[packName];
    if (matches[0].json.header?.uuid !== pack.header_uuid) throw new Error(`${packName} pack UUID does not match the approved identity catalog.`);
    const moduleUuids = matches[0].json.modules.map(({ uuid }) => uuid);
    if (moduleUuids.length !== pack.module_uuids.length ||
        pack.module_uuids.some((uuid) => !moduleUuids.includes(uuid))) {
      throw new Error(`${packName} module UUIDs do not match the approved identity catalog.`);
    }
  }

  const evidencePath = option("--evidence");
  if (evidencePath) {
    const evidence = JSON.parse(fs.readFileSync(path.resolve(evidencePath), "utf8"));
    const evidenceErrors = validateEvidence(evidence, metadata);
    if (evidenceErrors.length) throw new Error(`Evidence validation failed:\n${evidenceErrors.map((error) => `- ${error}`).join("\n")}`);
  }

  console.log(`Candidate verified: ${metadata.archive} (${metadata.version}), SHA-256 ${checksum}.`);
  if (evidencePath) console.log("Candidate-bound browser and iOS evidence passed.");
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
