import { crc32, deflateRawSync, inflateRawSync } from "node:zlib";

const EOCD_SIGNATURE = 0x06054b50;
const CENTRAL_SIGNATURE = 0x02014b50;
const LOCAL_SIGNATURE = 0x04034b50;

export function readZipEntries(buffer) {
  const searchStart = Math.max(0, buffer.length - 22 - 0xffff);
  let eocd = -1;
  for (let offset = buffer.length - 22; offset >= searchStart; offset--) {
    if (buffer.readUInt32LE(offset) === EOCD_SIGNATURE) {
      eocd = offset;
      break;
    }
  }
  if (eocd < 0) throw new Error("Archive has no ZIP end-of-central-directory record.");
  if (buffer.readUInt16LE(eocd + 4) !== 0 || buffer.readUInt16LE(eocd + 6) !== 0) {
    throw new Error("Multi-disk ZIP archives are not supported.");
  }

  const count = buffer.readUInt16LE(eocd + 10);
  const centralSize = buffer.readUInt32LE(eocd + 12);
  const centralOffset = buffer.readUInt32LE(eocd + 16);
  if (count === 0xffff || centralSize === 0xffffffff || centralOffset === 0xffffffff) {
    throw new Error("ZIP64 archives are not supported for these add-on candidates.");
  }
  if (centralOffset + centralSize > eocd) throw new Error("Archive central directory is out of bounds.");

  const entries = new Map();
  let cursor = centralOffset;
  for (let index = 0; index < count; index++) {
    if (buffer.readUInt32LE(cursor) !== CENTRAL_SIGNATURE) throw new Error("Invalid ZIP central directory entry.");
    const flags = buffer.readUInt16LE(cursor + 8);
    const method = buffer.readUInt16LE(cursor + 10);
    const compressedSize = buffer.readUInt32LE(cursor + 20);
    const uncompressedSize = buffer.readUInt32LE(cursor + 24);
    const nameLength = buffer.readUInt16LE(cursor + 28);
    const extraLength = buffer.readUInt16LE(cursor + 30);
    const commentLength = buffer.readUInt16LE(cursor + 32);
    const localOffset = buffer.readUInt32LE(cursor + 42);
    const name = buffer.toString("utf8", cursor + 46, cursor + 46 + nameLength).replaceAll("\\", "/");
    cursor += 46 + nameLength + extraLength + commentLength;

    if (!name || name.startsWith("/") || name.split("/").includes("..")) {
      throw new Error(`Unsafe ZIP entry path "${name}".`);
    }
    if (entries.has(name)) throw new Error(`Duplicate ZIP entry "${name}".`);
    if (flags & 1) throw new Error(`Encrypted ZIP entry "${name}" is not supported.`);
    if (buffer.readUInt32LE(localOffset) !== LOCAL_SIGNATURE) throw new Error(`Invalid local ZIP header for "${name}".`);
    const localNameLength = buffer.readUInt16LE(localOffset + 26);
    const localExtraLength = buffer.readUInt16LE(localOffset + 28);
    const dataStart = localOffset + 30 + localNameLength + localExtraLength;
    const compressed = buffer.subarray(dataStart, dataStart + compressedSize);
    if (compressed.length !== compressedSize) throw new Error(`Truncated ZIP entry "${name}".`);
    let data;
    if (method === 0) data = Buffer.from(compressed);
    else if (method === 8) data = inflateRawSync(compressed);
    else throw new Error(`Unsupported ZIP compression method ${method} for "${name}".`);
    if (data.length !== uncompressedSize) throw new Error(`Uncompressed size mismatch for "${name}".`);
    entries.set(name, data);
  }
  return entries;
}

export function inspectAddonEntries(entries, version) {
  const errors = [];
  const manifests = [];
  for (const [file, contents] of entries) {
    if (!file.endsWith("/manifest.json")) continue;
    try {
      manifests.push({
        folder: file.slice(0, -"manifest.json".length),
        json: JSON.parse(contents.toString("utf8")),
      });
    } catch (error) {
      errors.push(`Archive contains invalid manifest JSON in "${file}": ${error.message}`);
    }
  }
  const behavior = manifests.filter(({ json }) => json.modules?.some(({ type }) => type === "data"));
  const resource = manifests.filter(({ json }) => json.modules?.some(({ type }) => type === "resources"));
  if (manifests.length !== 2 || behavior.length !== 1 || resource.length !== 1) {
    errors.push("Archive must contain exactly one Behavior Pack and one Resource Pack.");
  }
  const behaviorFolder = behavior[0]?.folder;
  const resourceFolder = resource[0]?.folder;
  if (behaviorFolder && resourceFolder) {
    const required = [
      `${behaviorFolder}entities/cosmic_anomaly.json`,
      `${behaviorFolder}scripts/main.js`,
      `${behaviorFolder}scripts/logic.js`,
      `${resourceFolder}entity/cosmic_anomaly.entity.json`,
      `${resourceFolder}models/entity/cosmic_anomaly.geo.json`,
      `${resourceFolder}animations/cosmic_anomaly.animation.json`,
      `${resourceFolder}animation_controllers/cosmic_anomaly.animation_controllers.json`,
      `${resourceFolder}render_controllers/cosmic_anomaly.render_controllers.json`,
      `${resourceFolder}textures/entity/cosmic_anomaly.tga`,
      `${resourceFolder}texts/en_US.lang`,
    ];
    for (const file of required) if (!entries.has(file)) errors.push(`Archive is missing required runtime file "${file}".`);
    const behaviorManifest = behavior[0].json;
    const resourceManifest = resource[0].json;
    const expectedVersion = version.split(".").map(Number);
    for (const [name, manifest] of [["Behavior Pack", behaviorManifest], ["Resource Pack", resourceManifest]]) {
      if (JSON.stringify(manifest.header?.version) !== JSON.stringify(expectedVersion)) {
        errors.push(`${name} version does not match ${version}.`);
      }
    }
    for (const dependency of (behaviorManifest.dependencies ?? []).filter((entry) => entry.module_name)) {
      if (typeof dependency.version !== "string") {
        errors.push(`Archive script dependency "${dependency.module_name}" version must be a string, not ${JSON.stringify(dependency.version)}.`);
      }
    }
    const dependencies = (behaviorManifest.dependencies ?? []).filter((dependency) => dependency.uuid);
    if (dependencies.length !== 1 || dependencies[0]?.uuid !== resourceManifest.header?.uuid ||
        JSON.stringify(dependencies[0]?.version) !== JSON.stringify(resourceManifest.header?.version)) {
      errors.push("Archive Behavior Pack dependency does not match the Resource Pack.");
    }
  }

  const runtimePrefixes = [behaviorFolder, resourceFolder].filter(Boolean);
  for (const file of entries.keys()) {
    if (!runtimePrefixes.some((prefix) => file.startsWith(prefix))) {
      errors.push(`Archive contains development or unexpected file "${file}".`);
    }
    if (/(^|\/)(node_modules|\.git|tests|tools|docs)(\/|$)/.test(file)) {
      errors.push(`Archive contains development-only content "${file}".`);
    }
  }
  return errors;
}

// Minimal deterministic ZIP writer (deflate, fixed timestamp). Used to restore
// the source manifests after Creator Tools export, which rewrites script module
// dependency versions from strings to arrays.
export function writeZipEntries(entries) {
  const locals = [];
  const centrals = [];
  let offset = 0;
  for (const [name, data] of entries) {
    const nameBytes = Buffer.from(name, "utf8");
    const isDirectory = name.endsWith("/");
    const body = isDirectory ? Buffer.alloc(0) : deflateRawSync(data);
    const method = isDirectory ? 0 : 8;
    const checksum = isDirectory ? 0 : crc32(data);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6);
    local.writeUInt16LE(method, 8);
    local.writeUInt16LE(0, 10);
    local.writeUInt16LE(0x21, 12);
    local.writeUInt32LE(checksum, 14);
    local.writeUInt32LE(body.length, 18);
    local.writeUInt32LE(isDirectory ? 0 : data.length, 22);
    local.writeUInt16LE(nameBytes.length, 26);
    locals.push(local, nameBytes, body);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(method, 10);
    central.writeUInt16LE(0, 12);
    central.writeUInt16LE(0x21, 14);
    central.writeUInt32LE(checksum, 16);
    central.writeUInt32LE(body.length, 20);
    central.writeUInt32LE(isDirectory ? 0 : data.length, 24);
    central.writeUInt16LE(nameBytes.length, 28);
    central.writeUInt32LE(offset, 42);
    centrals.push(central, nameBytes);
    offset += local.length + nameBytes.length + body.length;
  }
  const centralBuffer = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.size, 8);
  end.writeUInt16LE(entries.size, 10);
  end.writeUInt32LE(centralBuffer.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, centralBuffer, end]);
}
