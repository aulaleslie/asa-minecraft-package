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
  const packDependencies = dependencies.filter((dependency) => dependency.uuid);
  const moduleDependencies = dependencies.filter((dependency) => dependency.module_name);
  if (packDependencies.length !== 1 ||
      packDependencies[0]?.uuid !== resourceManifest.header?.uuid ||
      !equalArray(packDependencies[0]?.version, resourceManifest.header?.version)) {
    errors.push("Behavior Pack must depend on the matching Resource Pack UUID and version.");
  }
  if (packDependencies.length + moduleDependencies.length !== dependencies.length) {
    errors.push("Behavior Pack dependencies must each be a pack UUID or a script module_name dependency.");
  }
  const approvedModules = catalog.script?.dependencies ?? {};
  for (const dependency of moduleDependencies) {
    if (approvedModules[dependency.module_name] === undefined) {
      errors.push(`Behavior Pack script dependency "${dependency.module_name}" is not approved in the identity catalog.`);
    } else if (dependency.version !== approvedModules[dependency.module_name]) {
      errors.push(`Behavior Pack dependency "${dependency.module_name}" version drifted from the identity catalog.`);
    }
  }
  for (const name of Object.keys(approvedModules)) {
    if (!moduleDependencies.some((dependency) => dependency.module_name === name)) {
      errors.push(`Behavior Pack is missing the approved script dependency "${name}".`);
    }
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

  // A guardian that can die through the scripted sequence must stop moving:
  // every behavior lives in a component group that sinbad:begin_dying removes,
  // and those groups are added at spawn.
  for (const [file, json] of parsedFiles.behavior) {
    const entity = json?.["minecraft:entity"];
    const dying = entity?.events?.["sinbad:begin_dying"];
    if (!dying) continue;
    const removed = new Set(dying.remove?.component_groups ?? []);
    const spawned = new Set(entity.events?.["minecraft:entity_spawned"]?.add?.component_groups ?? []);
    for (const key of Object.keys(entity.components ?? {})) {
      if (key.startsWith("minecraft:behavior.")) {
        errors.push(`${file}: "${key}" must live in a component group removed by sinbad:begin_dying so a dying guardian stops moving.`);
      }
    }
    for (const [name, group] of Object.entries(entity.component_groups ?? {})) {
      if (!Object.keys(group).some((key) => key.startsWith("minecraft:behavior."))) continue;
      if (!removed.has(name)) errors.push(`${file}: behavior group "${name}" is not removed by sinbad:begin_dying.`);
      if (!spawned.has(name)) errors.push(`${file}: behavior group "${name}" is not added by minecraft:entity_spawned.`);
    }
  }

  const animationIds = new Set();
  const controllerIds = new Set();
  const controllerStates = new Map();
  for (const [file, json] of parsedFiles.resource) {
    if (file.includes("/animations/")) for (const id of Object.keys(json?.animations ?? {})) animationIds.add(id);
    if (file.includes("/animation_controllers/")) {
      for (const [id, controller] of Object.entries(json?.animation_controllers ?? {})) {
        controllerIds.add(id);
        controllerStates.set(id, controller);
      }
    }
  }
  const declaredProperties = new Set();
  for (const [, json] of parsedFiles.behavior) {
    for (const name of Object.keys(json?.["minecraft:entity"]?.description?.properties ?? {})) declaredProperties.add(name);
  }
  for (const [file, json] of parsedFiles.resource) {
    const description = json?.["minecraft:client_entity"]?.description;
    if (!description) continue;
    const shortNames = new Set(Object.keys(description.animations ?? {}));
    for (const [shortName, id] of Object.entries(description.animations ?? {})) {
      if (!animationIds.has(id) && !controllerIds.has(id)) {
        errors.push(`${description.identifier} animation "${shortName}" references missing animation or controller "${id}".`);
      }
    }
    for (const entry of description.scripts?.animate ?? []) {
      const name = typeof entry === "string" ? entry : Object.keys(entry)[0];
      if (!shortNames.has(name)) errors.push(`${description.identifier} animates unknown animation "${name}".`);
    }
    for (const id of Object.values(description.animations ?? {})) {
      for (const state of Object.values(controllerStates.get(id)?.states ?? {})) {
        for (const entry of state.animations ?? []) {
          const name = typeof entry === "string" ? entry : Object.keys(entry)[0];
          if (!shortNames.has(name)) errors.push(`${description.identifier} controller "${id}" references unknown animation "${name}".`);
        }
      }
    }
    const effects = new Set(Object.keys(description.sound_effects ?? {}));
    for (const [animationId, animation] of Object.entries(
      Object.assign({}, ...parsedFiles.resource.filter(([f]) => f.includes("/animations/")).map(([, j]) => j.animations ?? {})))) {
      if (!Object.values(description.animations ?? {}).includes(animationId)) continue;
      for (const key of Object.values(animation.sound_effects ?? {}).flatMap((value) => [].concat(value))) {
        if (key?.effect && !effects.has(key.effect)) {
          errors.push(`${description.identifier} animation "${animationId}" plays undeclared sound effect "${key.effect}".`);
        }
      }
    }
    for (const id of Object.values(description.animations ?? {})) {
      const text = JSON.stringify(controllerStates.get(id) ?? {});
      for (const match of text.matchAll(/q(?:uery)?\.property\('([^']+)'\)/g)) {
        if (!declaredProperties.has(match[1])) errors.push(`${description.identifier} controller "${id}" reads undeclared entity property "${match[1]}".`);
      }
    }
    void file;
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
    errors.push("Natural spawn rules are not allowed; the guardian is placed only with its Creative spawn egg.");
  }
  const scriptModules = (behaviorManifest.modules ?? []).filter((module) => module.type === "script");
  const approvedScripts = new Set((catalog.script?.files ?? []).map((file) => `behavior_pack/${file}`));
  const scriptFiles = [...listFiles(packDirs.behavior), ...listFiles(packDirs.resource)]
    .filter((file) => /\.(js|mjs|cjs|ts)$/i.test(file))
    .map((file) => path.relative(root, file).split(path.sep).join("/"));
  for (const file of scriptFiles) {
    if (!approvedScripts.has(file)) errors.push(`Script file "${file}" is not an approved gameplay script.`);
  }
  if (scriptModules.length > 1) errors.push("Behavior Pack must declare at most one script module.");
  if (scriptModules.length === 1) {
    const [module] = scriptModules;
    if (module.language !== "javascript") errors.push("Script module language must be javascript.");
    if (module.entry !== catalog.script?.entry) errors.push("Script module entry does not match the identity catalog.");
    if (!fs.existsSync(path.join(packDirs.behavior, String(module.entry ?? "")))) {
      errors.push(`Script module entry "${module.entry}" is missing from the Behavior Pack.`);
    }
    for (const file of approvedScripts) {
      if (!fs.existsSync(path.join(root, file))) errors.push(`Approved script file "${file}" is missing.`);
    }
  } else if (scriptFiles.length || moduleDependencies.length) {
    errors.push("Script files or script dependencies require the Behavior Pack script module.");
  }
  for (const [, json] of parsedFiles.behavior) {
    const entityJson = json?.["minecraft:entity"];
    if (!entityJson) continue;
    const serialized = JSON.stringify(entityJson);
    if (/minecraft:behavior\.(?:melee_attack|ranged_attack|nearest_attackable_target|hurt_by_target)/.test(serialized)) {
      errors.push("Native attack and target behaviors are not allowed; protective combat is limited to the approved script.");
    }
  }

  return { errors, warnings: [] };
}
