const shaPattern = /^[0-9a-f]{40}$/i;
const checksumPattern = /^[0-9a-f]{64}$/i;
export const EVIDENCE_SCHEMA_VERSION = 2;
export const GUARDIAN_SUBJECT = "sinbad:cosmic_anomaly";

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

function samePackUuids(left, right) {
  return Boolean(left?.behavior && left?.resource && right?.behavior && right?.resource &&
    left.behavior === right.behavior && left.resource === right.resource);
}

function checkCandidate(record, errors) {
  if (!record || typeof record !== "object") {
    errors.push("Missing candidate evidence.");
    return;
  }
  if (!shaPattern.test(record.source_revision ?? "")) errors.push("candidate source_revision must be a Git commit SHA.");
  if (!parseVersion(record.version)) errors.push("candidate version must be numeric major.minor.patch.");
  if (typeof record.archive !== "string" || !record.archive.endsWith(".mcaddon")) errors.push("candidate archive must name an .mcaddon file.");
  if (!checksumPattern.test(record.sha256 ?? "")) errors.push("candidate sha256 must be a 64-digit checksum.");
  if (!record.pack_uuids?.behavior || !record.pack_uuids?.resource) errors.push("candidate pack UUIDs are required.");
}

// Every result is bound to the exact candidate archive and must name who ran
// it, on what, and when. Pending, failed or partly confirmed checks reject.
function checkResult(result, label, requiredTrue, requiredFalse, candidateSha, errors, { device }) {
  if (!result || typeof result !== "object") {
    errors.push(`${label} result is missing.`);
    return;
  }
  if (result.status !== "passed") errors.push(`${label} must have status passed.`);
  if (!isDate(result.date)) errors.push(`${label} date must be a valid YYYY-MM-DD date.`);
  if (!hasText(result.result)) errors.push(`${label} result is required.`);
  if (result.candidate_sha256 !== candidateSha) errors.push(`${label} is not bound to the candidate checksum.`);
  for (const key of requiredTrue) if (result[key] !== true) errors.push(`${label} must confirm ${key}.`);
  for (const key of requiredFalse) if (result[key] !== false) errors.push(`${label} must confirm ${key} is false.`);
  if (device) {
    if (!["parent", "child"].includes(result.tester_role)) errors.push(`${label} tester_role must be parent or child.`);
    if (!hasText(result.device)) errors.push(`${label} device model is required.`);
    if (result.minecraft_version !== "26.60") errors.push(`${label} minecraft_version must match the recorded iOS target 26.60.`);
  }
}

export function validateEvidence(evidence, candidateMetadata) {
  const errors = [];
  if (!evidence || typeof evidence !== "object") return ["Evidence JSON is missing or invalid."];
  if (evidence.schema_version !== EVIDENCE_SCHEMA_VERSION) {
    errors.push(`Evidence schema_version must be ${EVIDENCE_SCHEMA_VERSION}; baseline-fixture evidence does not accept a guardian candidate.`);
  }
  if (evidence.subject !== GUARDIAN_SUBJECT) errors.push(`Evidence subject must be ${GUARDIAN_SUBJECT}.`);

  const candidate = evidence.candidate;
  checkCandidate(candidate, errors);
  if (!candidateMetadata || !candidate) {
    errors.push("Candidate metadata is required to bind evidence to the exact archive.");
  } else {
    if (candidate.source_revision !== candidateMetadata.source_revision) errors.push("Evidence candidate revision does not match the candidate metadata.");
    if (candidate.version !== candidateMetadata.version) errors.push("Evidence candidate version does not match the candidate metadata.");
    if (candidate.archive !== candidateMetadata.archive) errors.push("Evidence candidate archive does not match the candidate metadata.");
    if (candidate.sha256 !== candidateMetadata.sha256) errors.push("Evidence candidate checksum does not match the candidate metadata.");
    if (!samePackUuids(candidate.pack_uuids, candidateMetadata.pack_uuids)) {
      errors.push("Evidence candidate pack UUIDs do not match the candidate metadata.");
    }
  }
  const sha = candidate?.sha256;

  checkResult(evidence.browser_review, "browser_review", [
    "ring_visible", "center_black", "four_tentacles", "texture_applied", "luminosity_reviewed",
    "idle_animation", "firing_animation", "death_animation",
  ], [], sha, errors, { device: false });
  if (evidence.browser_review && evidence.browser_review.reviewed_archive_sha256 !== sha) {
    errors.push("browser_review must identify the exact packaged sources (reviewed_archive_sha256).");
  }
  // The opaque preview copy shows the silhouette only; it is not the shipped
  // texture. The viewer's result for the shipped texture must be recorded
  // separately, and appearance acceptance rests on the device.
  if (evidence.browser_review && evidence.browser_review.opaque_preview_is_silhouette_only !== true) {
    errors.push("browser_review must confirm the opaque preview copy was used for the silhouette only (opaque_preview_is_silhouette_only).");
  }
  if (!hasText(evidence.browser_review?.shipped_texture_viewer_result)) {
    errors.push("browser_review must record what the viewer showed for the shipped texture (shipped_texture_viewer_result).");
  }

  checkResult(evidence.ios_fresh_install, "ios_fresh_install", [
    "both_packs_active", "readable_name", "spawn_egg", "appearance", "shipped_ring_visible", "emissive_glow",
    "animation", "sound", "guarding",
    "health_200", "targeting_exclusions", "beam_damage_and_cooldown", "beam_range_and_obstruction",
    "bystanders_safe", "death_sequence", "no_drops",
  ], ["experiments_required"], sha, errors, { device: true });

  checkResult(evidence.ios_persistence, "ios_persistence", [
    "both_packs_active", "save_reload", "leave_and_return", "anchor_persists", "old_egg_absent", "new_egg_works",
  ], ["experiments_required"], sha, errors, { device: true });
  if (!hasText(evidence.ios_persistence?.saved_baseline_outcome)) {
    errors.push("ios_persistence must record the actual outcome for saved baseline instances (saved_baseline_outcome).");
  }
  if (evidence.ios_persistence && evidence.ios_persistence.backed_up_world !== true) {
    errors.push("ios_persistence must confirm the baseline-world update used a backed-up world (backed_up_world).");
  }

  checkResult(evidence.ios_combat, "ios_combat", ["representative_combat", "multi_guardian_scene", "responsive"], [],
    sha, errors, { device: true });
  if (!Number.isInteger(evidence.ios_combat?.guardian_count) || evidence.ios_combat.guardian_count < 2) {
    errors.push("ios_combat must record the guardian_count of the multi-guardian scene (at least 2).");
  }
  return errors;
}
