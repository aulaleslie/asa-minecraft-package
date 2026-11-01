#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { inspectProject } from "./project-validation.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const { errors } = inspectProject(root);
if (errors.length) {
  console.error("Project checks failed:");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

const stage = fs.mkdtempSync(path.join(os.tmpdir(), "sinbad-validation-"));
const reportDir = fs.mkdtempSync(path.join(os.tmpdir(), "sinbad-mct-report-"));
try {
  for (const pack of ["behavior_pack", "resource_pack"]) {
    fs.cpSync(path.join(root, pack), path.join(stage, pack), { recursive: true });
  }
  const cli = path.join(root, "node_modules", "@minecraft", "creator-tools", "cli", "index.mjs");
  const result = spawnSync(process.execPath, [
    cli, "validate", "main", "-i", stage, "-o", reportDir, "--json", "--force",
  ], { encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
  if (result.error) throw result.error;
  const stdout = result.stdout ?? "";
  const jsonStart = stdout.indexOf("{");
  if (jsonStart < 0) {
    throw new Error(`Creator Tools returned no JSON report (exit ${result.status}).\n${result.stderr ?? ""}`);
  }
  const report = JSON.parse(stdout.slice(jsonStart));
  const projectErrors = (report.projects ?? []).flatMap((project) =>
    (project.items ?? []).filter((item) => item.type === "error" || item.type === "testFail" || item.type === "internalProcessingError"));
  if (result.status !== 0 || report.errors > 0 || projectErrors.length) {
    for (const item of projectErrors) {
      console.error(`Creator Tools [${item.generatorId ?? "UNKNOWN"}] ${item.path ?? ""}: ${item.message ?? item.data ?? "validation error"}`);
    }
    throw new Error(`Creator Tools validation failed: ${report.errors ?? projectErrors.length} error(s).`);
  }
  console.log(`Project checks passed. Creator Tools ${JSON.parse(fs.readFileSync(path.join(root, "node_modules", "@minecraft", "creator-tools", "package.json"), "utf8")).version} main suite: 0 errors, ${report.warnings ?? 0} warning(s), ${report.recommendations ?? 0} recommendation(s).`);
  for (const item of (report.projects ?? []).flatMap((project) => project.items ?? []).filter((entry) => entry.type === "warning")) {
    const detail = typeof item.data === "string" ? ` ${item.data}` : "";
    const knownNoise = item.generatorId === "COMJSON" && /uv_anim\) is missing and it is required/.test(detail);
    console.warn(
      `Creator Tools ${knownNoise ? "known false-positive" : "warning"} [${item.generatorId ?? "UNKNOWN"}] ${item.path ?? ""}: ${item.message ?? ""}${detail}` +
      (knownNoise ? " (render controllers do not require uv_anim)" : ""),
    );
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  fs.rmSync(stage, { recursive: true, force: true });
  fs.rmSync(reportDir, { recursive: true, force: true });
}
