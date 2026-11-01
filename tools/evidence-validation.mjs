const shaPattern = /^[0-9a-f]{40}$/i;
const checksumPattern = /^[0-9a-f]{64}$/i;

function isDate(value) {
  if (typeof value !== "string") return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value ?? "")) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function parseVersion(value) {
  if (!/^\d+\.\d+\.\d+$/.test(value ?? "")) return undefined;
  const parts = value.split(".").map(Number);
  return parts.every(Number.isSafeInteger) ? parts : undefined;
}

function compareVersion(left, right) {
  const a = parseVersion(left);
  const b = parseVersion(right);
  if (!a || !b) return NaN;
  for (let index = 0; index < 3; index++) {
    if (a[index] !== b[index]) return a[index] - b[index];
  }
  return 0;
}

function samePackUuids(left, right) {
  return Boolean(left?.behavior && left?.resource && right?.behavior && right?.resource &&
    left.behavior === right.behavior && left.resource === right.resource);
}

function checkCandidateRecord(record, label, errors) {
  if (!record || typeof record !== "object") {
    errors.push(`Missing ${label} candidate evidence.`);
    return;
  }
  if (!shaPattern.test(record.source_revision ?? "")) errors.push(`${label} source_revision must be a Git commit SHA.`);
  if (!parseVersion(record.version)) errors.push(`${label} version must be numeric major.minor.patch.`);
  if (typeof record.archive !== "string" || !record.archive.endsWith(".mcaddon")) errors.push(`${label} archive must name an .mcaddon file.`);
  if (!checksumPattern.test(record.sha256 ?? "")) errors.push(`${label} sha256 must be a 64-digit checksum.`);
  if (!record.pack_uuids?.behavior || !record.pack_uuids?.resource) errors.push(`${label} pack UUIDs are required.`);
}

export function validateEvidence(evidence, candidateMetadata) {
  const errors = [];
  if (!evidence || typeof evidence !== "object") return ["Evidence JSON is missing or invalid."];
  if (evidence.schema_version !== 1) errors.push("Evidence schema_version must be 1.");
  if (!["parent", "child"].includes(evidence.tester_role)) errors.push("tester_role must be parent or child.");
  if (!isDate(evidence.tested_at)) errors.push("tested_at must be a valid YYYY-MM-DD date.");
  if (!hasText(evidence.device)) errors.push("Device model is required.");
  if (evidence.minecraft_version !== "26.60") errors.push("minecraft_version must match the recorded iOS target 26.60.");

  const first = evidence.candidate_a;
  const second = evidence.candidate_b;
  checkCandidateRecord(first, "candidate_a", errors);
  checkCandidateRecord(second, "candidate_b", errors);
  if (first && second) {
    if (compareVersion(first.version, second.version) >= 0) errors.push("candidate_b must have a higher version than candidate_a.");
    if (first.source_revision === second.source_revision) errors.push("Candidate revisions must be different.");
    if (!samePackUuids(first.pack_uuids, second.pack_uuids)) errors.push("Pack UUIDs must remain unchanged between candidates.");
  }

  if (!candidateMetadata || !second) {
    errors.push("Candidate metadata is required to bind evidence to the exact archive.");
  } else {
    if (second.source_revision !== candidateMetadata.source_revision) errors.push("Evidence candidate_b revision does not match the candidate metadata.");
    if (second.version !== candidateMetadata.version) errors.push("Evidence candidate_b version does not match the candidate metadata.");
    if (second.archive !== candidateMetadata.archive) errors.push("Evidence candidate_b archive does not match the candidate metadata.");
    if (second.sha256 !== candidateMetadata.sha256) errors.push("Evidence candidate_b checksum does not match the candidate metadata.");
    if (!samePackUuids(second.pack_uuids, candidateMetadata.pack_uuids)) {
      errors.push("Evidence candidate_b pack UUIDs do not match the candidate metadata.");
    }
  }

  for (const [label, candidate] of [["candidate_a", first], ["candidate_b", second]]) {
    for (const key of ["browser_review"]) {
      const result = candidate?.[key];
      if (result?.status !== "passed") errors.push(`${label} ${key} must have status passed.`);
      if (!isDate(result?.date)) errors.push(`${label} ${key} date must be a valid YYYY-MM-DD date.`);
      if (!hasText(result?.result)) errors.push(`${label} ${key} result is required.`);
    }
  }

  const initial = first?.ios_initial;
  if (initial?.status !== "passed") errors.push("candidate_a ios_initial must have status passed.");
  if (!isDate(initial?.date)) errors.push("candidate_a ios_initial date must be a valid YYYY-MM-DD date.");
  if (initial?.both_packs_active !== true) errors.push("candidate_a initial test must confirm both packs are active.");
  if (initial?.experiments_required !== false) errors.push("candidate_a initial test must confirm no experiments were required.");
  if (initial?.readable_name !== true || initial?.spawn_egg_passive !== true || initial?.appearance !== true) {
    errors.push("candidate_a initial test must confirm readable names, spawn egg, appearance, and passive behavior.");
  }
  if (!hasText(initial?.result)) errors.push("candidate_a ios_initial result is required.");

  const update = second?.ios_update;
  if (update?.status !== "passed") errors.push("candidate_b ios_update must have status passed.");
  if (!isDate(update?.date)) errors.push("candidate_b ios_update date must be a valid YYYY-MM-DD date.");
  if (update?.same_test_world !== true) errors.push("candidate_b update must confirm it used the same backed-up test world.");
  if (update?.both_packs_active !== true) errors.push("candidate_b update must confirm both packs remain active.");
  if (update?.experiments_required !== false) errors.push("candidate_b update must confirm no experiments were required.");
  if (update?.retained_mob_new_texture !== true || update?.new_spawn_new_texture !== true) {
    errors.push("candidate_b update must confirm the retained mob and a new spawn use the new texture.");
  }
  if (!hasText(update?.result)) errors.push("candidate_b ios_update result is required.");
  return errors;
}
