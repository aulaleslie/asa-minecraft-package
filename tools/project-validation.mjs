import fs from "node:fs";
import path from "node:path";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function listFiles(root) {
  if (!fs.existsSync(root)) return [];
  return fs.readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(root, entry.name);
    return entry.isDirectory() ? listFiles(fullPath) : [fullPath];
  });
}

function readJson(file, errors) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (error) {
    errors.push(`${path.relative(process.cwd(), file)}: invalid JSON (${error.message})`);
    return undefined;
  }
}

function equalArray(left, right) {
  return Array.isArray(left) && Array.isArray(right) &&
    left.length === right.length && left.every((value, index) => value === right[index]);
}

function versionArray(value) {
  return typeof value === "string" && /^\d+\.\d+\.\d+$/.test(value)
    ? value.split(".").map(Number)
    : undefined;
}

function collectIds(files, getId, label, errors) {
  const found = new Map();
  for (const [file, json] of files) {
    const id = getId(json);
    if (!id) continue;
    if (found.has(id)) errors.push(`Duplicate ${label} identifier "${id}" in ${file} and ${found.get(id)}.`);
    else found.set(id, file);
  }
  return found;
}

export function inspectProject(projectRoot) {
  const root = path.resolve(projectRoot);
  const errors = [];
  const packageFile = path.join(root, "package.json");
  const catalogFile = path.join(root, "tools", "identity-catalog.json");
  const packageJson = readJson(packageFile, errors);
  const catalog = readJson(catalogFile, errors);
  const packDirs = {
    behavior: path.join(root, "behavior_pack"),
    resource: path.join(root, "resource_pack"),
  };
  const manifests = {};
  const parsedFiles = {};

  for (const [name, dir] of Object.entries(packDirs)) {
    const manifestFile = path.join(dir, "manifest.json");
    manifests[name] = readJson(manifestFile, errors);
    if (!manifests[name]) errors.push(`Missing ${name} pack manifest.`);
    const files = listFiles(dir).filter((file) => file.endsWith(".json"));
    parsedFiles[name] = files
      .map((file) => [path.relative(root, file).split(path.sep).join("/"), readJson(file, errors)])
      .filter(([, json]) => json !== undefined);
    if (!fs.existsSync(path.join(dir, "pack_icon.png"))) errors.push(`Missing ${name} pack icon.`);
  }

  if (!packageJson || !catalog || !manifests.behavior || !manifests.resource) {
    return { errors, warnings: [] };
  }

  const releaseVersion = versionArray(packageJson.version);
  if (!releaseVersion) errors.push(`package.json version "${packageJson.version}" must be numeric major.minor.patch.`);
  if (catalog.release_version !== packageJson.version) errors.push("Identity catalog release_version does not match package.json.");

  const target = String(catalog.target_minecraft_version ?? "").split(".").map(Number);
  if (target.length !== 2 || target.some((part) => !Number.isInteger(part) || part < 0)) {
    errors.push("Identity catalog target_minecraft_version must be major.minor.");
  }
  const expectedEngine = target.length === 2 ? [1, ...target] : undefined;
  const allUuids = [];
  for (const [name, manifest] of Object.entries(manifests)) {
    const expected = catalog.packs?.[name];
    if (!expected) {
      errors.push(`Identity catalog has no ${name} pack entry.`);
      continue;
    }
    if (manifest.format_version !== 2) errors.push(`${name} pack manifest must use format_version 2.`);
    if (manifest.header?.uuid !== expected.header_uuid) errors.push(`${name} pack header UUID drifted from the identity catalog.`);
    if (!equalArray(manifest.header?.version, releaseVersion)) errors.push(`${name} pack version does not match package.json.`);
    if (expectedEngine && !equalArray(manifest.header?.min_engine_version, expectedEngine)) {
      errors.push(`${name} pack min_engine_version does not match the recorded Minecraft target.`);
    }
    if (!uuidPattern.test(String(manifest.header?.uuid ?? ""))) errors.push(`${name} pack header UUID is invalid.`);
    if (!equalArray(manifest.header?.version, expected.version)) errors.push(`${name} pack version does not match the identity catalog.`);
    if (expected.manifest !== `${name === "behavior" ? "behavior" : "resource"}_pack/manifest.json`) {
      errors.push(`${name} pack manifest path in the identity catalog is incorrect.`);
    }
    const moduleUuids = (manifest.modules ?? []).map((module) => module.uuid);
    if (!equalArray(moduleUuids, expected.module_uuids)) errors.push(`${name} pack module UUIDs drifted from the identity catalog.`);
    for (const module of manifest.modules ?? []) {
      if (!uuidPattern.test(String(module.uuid ?? ""))) errors.push(`${name} pack has an invalid module UUID.`);
      if (!equalArray(module.version, releaseVersion)) errors.push(`${name} pack module version does not match package.json.`);
    }
    allUuids.push(manifest.header?.uuid, ...moduleUuids);
  }
  if (allUuids.some((id) => !id) || new Set(allUuids).size !== allUuids.length) {
    errors.push("Pack header and module UUIDs must all be present and unique.");
  }

  const behaviorManifest = manifests.behavior;
  const resourceManifest = manifests.resource;
  const dependencies = behaviorManifest.dependencies ?? [];
  if (dependencies.length !== 1 ||
      dependencies[0]?.uuid !== resourceManifest.header?.uuid ||
      !equalArray(dependencies[0]?.version, resourceManifest.header?.version)) {
    errors.push("Behavior Pack must depend on the matching Resource Pack UUID and version.");
  }
  if ((resourceManifest.dependencies ?? []).length !== 0) {
    errors.push("Resource Pack must not depend back on the Behavior Pack.");
  }

  const behaviorEntities = collectIds(
    parsedFiles.behavior.filter(([file]) => file.startsWith("behavior_pack/entities/")),
    (json) => json?.["minecraft:entity"]?.description?.identifier,
    "behavior entity",
    errors,
  );
  const clientEntities = collectIds(
    parsedFiles.resource.filter(([file]) => file.startsWith("resource_pack/entity/")),
    (json) => json?.["minecraft:client_entity"]?.description?.identifier,
    "client entity",
    errors,
  );
  const behaviorIds = [...behaviorEntities.keys()].sort();
  const catalogIds = [...(catalog.content_identifiers ?? [])].sort();
  if (JSON.stringify(behaviorIds) !== JSON.stringify(catalogIds)) {
    errors.push("Identity catalog content_identifiers do not exactly match the Behavior Pack entity identifiers.");
  }
  for (const id of behaviorEntities.keys()) {
    if (!clientEntities.has(id)) errors.push(`Missing Resource Pack client entity for "${id}".`);
  }
  for (const id of clientEntities.keys()) {
    if (!behaviorEntities.has(id)) errors.push(`Missing Behavior Pack entity for "${id}".`);
  }

  const textureFiles = new Set(listFiles(packDirs.resource).map((file) =>
    path.relative(packDirs.resource, file).split(path.sep).join("/")));
  const geometryIds = new Set();
  for (const [file, json] of parsedFiles.resource) {
    if (!file.includes("/models/entity/")) continue;
    for (const geometry of json?.["minecraft:geometry"] ?? []) {
      if (geometry.description?.identifier) geometryIds.add(geometry.description.identifier);
    }
  }
  for (const id of catalog.geometry_identifiers ?? []) {
    if (!geometryIds.has(id)) errors.push(`Expected bundled geometry "${id}" is missing from the Resource Pack.`);
  }
  for (const id of geometryIds) {
    if (!id.startsWith(`geometry.${catalog.namespace}.`)) errors.push(`Bundled geometry "${id}" must use the "geometry.${catalog.namespace}." prefix.`);
  }
  const renderControllerIds = new Set();
  for (const [, json] of parsedFiles.resource) {
    for (const id of Object.keys(json?.render_controllers ?? {})) renderControllerIds.add(id);
  }
  for (const [, json] of parsedFiles.resource) {
    const description = json?.["minecraft:client_entity"]?.description;
    if (!description) continue;
    if (!description.spawn_egg) errors.push(`${description.identifier} is missing its Creative spawn egg definition.`);
    for (const texture of Object.values(description.textures ?? {})) {
      if (!texture.startsWith("textures/")) continue;
      const base = texture.replace(/\.(png|tga|jpg)$/i, "");
      if (!textureFiles.has(`${base}.png`) && !textureFiles.has(`${base}.tga`) && !textureFiles.has(`${base}.jpg`)) {
        errors.push(`${description.identifier} references missing custom texture "${texture}".`);
      }
    }
    for (const geometry of Object.values(description.geometry ?? {})) {
      if (geometryIds.has(geometry)) continue;
      errors.push(`${description.identifier} references geometry "${geometry}" that is not bundled in the Resource Pack.`);
    }
    for (const controller of description.render_controllers ?? []) {
      if (!renderControllerIds.has(controller)) errors.push(`${description.identifier} references missing render controller "${controller}".`);
    }
  }

  const language = path.join(packDirs.resource, "texts", "en_US.lang");
  const languageText = fs.existsSync(language) ? fs.readFileSync(language, "utf8") : "";
  for (const [id, file] of behaviorEntities) {
    const entity = parsedFiles.behavior.find(([filePath]) => filePath === file)?.[1]?.["minecraft:entity"];
    if (entity?.description?.is_spawnable) {
      if (!languageText.includes(`entity.${id}.name=`)) errors.push(`Missing localized entity name for "${id}".`);
      if (!languageText.includes(`item.spawn_egg.entity.${id}.name=`)) errors.push(`Missing localized spawn egg name for "${id}".`);
    }
  }
  if (listFiles(path.join(packDirs.behavior, "spawn_rules")).length) {
    errors.push("Natural spawn rules are not allowed in the baseline fixture.");
  }
  if ([...listFiles(packDirs.behavior), ...listFiles(packDirs.resource)].some((file) => /\.(js|ts)$/i.test(file))) {
    errors.push("Gameplay scripts are not allowed in the baseline fixture.");
  }
  for (const [, json] of parsedFiles.behavior) {
    const entityJson = json?.["minecraft:entity"];
    if (!entityJson) continue;
    const serialized = JSON.stringify(entityJson);
    if (/minecraft:behavior\.(?:melee_attack|ranged_attack|nearest_attackable_target|hurt_by_target)/.test(serialized)) {
      errors.push("Baseline mob must remain passive and must not have attack or target behaviors.");
    }
  }

  return { errors, warnings: [] };
}
