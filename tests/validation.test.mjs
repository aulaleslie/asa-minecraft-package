import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { inspectProject } from "../tools/project-validation.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function fixture() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "sinbad-fixture-"));
  for (const name of ["behavior_pack", "resource_pack", "tools"]) {
    fs.cpSync(path.join(root, name), path.join(dir, name), { recursive: true });
  }
  fs.copyFileSync(path.join(root, "package.json"), path.join(dir, "package.json"));
  return dir;
}

function mutateJson(dir, relative, update) {
  const file = path.join(dir, relative);
  const value = JSON.parse(fs.readFileSync(file, "utf8"));
  update(value);
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + "\n");
}

function withFixture(run) {
  const dir = fixture();
  try {
    run(dir);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

test("valid baseline uses its bundled namespaced geometry", () => {
  withFixture((dir) => {
    const result = inspectProject(dir);
    assert.deepEqual(result.errors, []);
  });
});

test("rejects an external vanilla geometry reference", () => {
  withFixture((dir) => {
    const file = path.join(dir, "resource_pack/entity/baseline_mob.entity.json");
    fs.writeFileSync(file, fs.readFileSync(file, "utf8").replace("geometry.sinbad.baseline_mob", "geometry.cow.v2"));
    assert.match(inspectProject(dir).errors.join("\n"), /not bundled in the Resource Pack/);
  });
});

test("rejects a missing bundled geometry file", () => {
  withFixture((dir) => {
    fs.rmSync(path.join(dir, "resource_pack/models/entity/baseline_mob.geo.json"));
    assert.match(inspectProject(dir).errors.join("\n"), /Expected bundled geometry/);
  });
});

test("rejects a non-namespaced bundled geometry identifier", () => {
  withFixture((dir) => {
    const file = path.join(dir, "resource_pack/models/entity/baseline_mob.geo.json");
    fs.writeFileSync(file, fs.readFileSync(file, "utf8").replace("geometry.sinbad.baseline_mob", "geometry.cow.v2"));
    assert.match(inspectProject(dir).errors.join("\n"), /must use the "geometry\.sinbad\./);
  });
});

test("rejects malformed JSON", () => {
  withFixture((dir) => {
    fs.writeFileSync(path.join(dir, "behavior_pack/entities/broken.json"), "{");
    assert.match(inspectProject(dir).errors.join("\n"), /invalid JSON/);
  });
});

test("rejects a malformed pack manifest", () => {
  withFixture((dir) => {
    fs.writeFileSync(path.join(dir, "behavior_pack/manifest.json"), "{");
    assert.match(inspectProject(dir).errors.join("\n"), /invalid JSON/);
  });
});

test("rejects duplicate entity declarations", () => {
  withFixture((dir) => {
    fs.copyFileSync(
      path.join(dir, "behavior_pack/entities/baseline_mob.json"),
      path.join(dir, "behavior_pack/entities/duplicate.json"),
    );
    assert.match(inspectProject(dir).errors.join("\n"), /Duplicate behavior entity identifier/);
  });
});

test("rejects missing custom textures", () => {
  withFixture((dir) => {
    fs.rmSync(path.join(dir, "resource_pack/textures/entity/baseline_mob.png"));
    assert.match(inspectProject(dir).errors.join("\n"), /missing custom texture/);
  });
});

test("rejects broken Behavior Pack dependencies", () => {
  withFixture((dir) => {
    mutateJson(dir, "behavior_pack/manifest.json", (manifest) => {
      manifest.dependencies[0].uuid = "11111111-1111-4111-8111-111111111111";
    });
    assert.match(inspectProject(dir).errors.join("\n"), /depend on the matching Resource Pack/);
  });
});

test("rejects pack identity drift", () => {
  withFixture((dir) => {
    mutateJson(dir, "resource_pack/manifest.json", (manifest) => {
      manifest.header.uuid = "22222222-2222-4222-8222-222222222222";
    });
    assert.match(inspectProject(dir).errors.join("\n"), /header UUID drifted/);
  });
});

test("rejects version mismatches", () => {
  withFixture((dir) => {
    mutateJson(dir, "behavior_pack/manifest.json", (manifest) => {
      manifest.modules[0].version = [9, 9, 9];
    });
    assert.match(inspectProject(dir).errors.join("\n"), /module version does not match/);
  });
});
