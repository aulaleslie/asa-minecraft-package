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

test("valid guardian uses its bundled namespaced geometry", () => {
  withFixture((dir) => {
    const result = inspectProject(dir);
    assert.deepEqual(result.errors, []);
  });
});

test("rejects an external vanilla geometry reference", () => {
  withFixture((dir) => {
    const file = path.join(dir, "resource_pack/entity/cosmic_anomaly.entity.json");
    fs.writeFileSync(file, fs.readFileSync(file, "utf8").replace("geometry.sinbad.cosmic_anomaly", "geometry.cow.v2"));
    assert.match(inspectProject(dir).errors.join("\n"), /not bundled in the Resource Pack/);
  });
});

test("rejects a missing bundled geometry file", () => {
  withFixture((dir) => {
    fs.rmSync(path.join(dir, "resource_pack/models/entity/cosmic_anomaly.geo.json"));
    assert.match(inspectProject(dir).errors.join("\n"), /Expected bundled geometry/);
  });
});

test("rejects a non-namespaced bundled geometry identifier", () => {
  withFixture((dir) => {
    const file = path.join(dir, "resource_pack/models/entity/cosmic_anomaly.geo.json");
    fs.writeFileSync(file, fs.readFileSync(file, "utf8").replace("geometry.sinbad.cosmic_anomaly", "geometry.cow.v2"));
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
      path.join(dir, "behavior_pack/entities/cosmic_anomaly.json"),
      path.join(dir, "behavior_pack/entities/duplicate.json"),
    );
    assert.match(inspectProject(dir).errors.join("\n"), /Duplicate behavior entity identifier/);
  });
});

test("rejects missing custom textures", () => {
  withFixture((dir) => {
    fs.rmSync(path.join(dir, "resource_pack/textures/entity/cosmic_anomaly.tga"));
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

test("rejects a missing animation definition", () => {
  withFixture((dir) => {
    fs.rmSync(path.join(dir, "resource_pack/animations/cosmic_anomaly.animation.json"));
    assert.match(inspectProject(dir).errors.join("\n"), /missing animation or controller/);
  });
});

test("rejects a missing animation controller", () => {
  withFixture((dir) => {
    fs.rmSync(path.join(dir, "resource_pack/animation_controllers/cosmic_anomaly.animation_controllers.json"));
    assert.match(inspectProject(dir).errors.join("\n"), /missing animation or controller/);
  });
});

test("rejects a controller that animates an unknown animation", () => {
  withFixture((dir) => {
    mutateJson(dir, "resource_pack/animation_controllers/cosmic_anomaly.animation_controllers.json", (json) => {
      json.animation_controllers["controller.animation.sinbad.cosmic_anomaly"].states.idle.animations.push("missing");
    });
    assert.match(inspectProject(dir).errors.join("\n"), /unknown animation "missing"/);
  });
});

test("rejects an animation that plays an undeclared sound effect", () => {
  withFixture((dir) => {
    mutateJson(dir, "resource_pack/entity/cosmic_anomaly.entity.json", (json) => {
      delete json["minecraft:client_entity"].description.sound_effects;
    });
    assert.match(inspectProject(dir).errors.join("\n"), /undeclared sound effect/);
  });
});

test("rejects a controller reading an undeclared entity property", () => {
  withFixture((dir) => {
    mutateJson(dir, "behavior_pack/entities/cosmic_anomaly.json", (json) => {
      delete json["minecraft:entity"].description.properties["sinbad:dying"];
    });
    assert.match(inspectProject(dir).errors.join("\n"), /undeclared entity property/);
  });
});

test("rejects native attack behaviors", () => {
  withFixture((dir) => {
    mutateJson(dir, "behavior_pack/entities/cosmic_anomaly.json", (json) => {
      json["minecraft:entity"].components["minecraft:behavior.melee_attack"] = { priority: 3 };
    });
    assert.match(inspectProject(dir).errors.join("\n"), /Native attack and target behaviors/);
  });
});

test("rejects movement behaviors that a dying guardian keeps", () => {
  withFixture((dir) => {
    mutateJson(dir, "behavior_pack/entities/cosmic_anomaly.json", (json) => {
      json["minecraft:entity"].components["minecraft:behavior.random_hover"] = { priority: 6 };
    });
    assert.match(inspectProject(dir).errors.join("\n"), /must live in a component group removed by sinbad:begin_dying/);
  });
});

test("rejects a behavior group that begin_dying does not remove", () => {
  withFixture((dir) => {
    mutateJson(dir, "behavior_pack/entities/cosmic_anomaly.json", (json) => {
      json["minecraft:entity"].events["sinbad:begin_dying"].remove = { component_groups: [] };
    });
    assert.match(inspectProject(dir).errors.join("\n"), /is not removed by sinbad:begin_dying/);
  });
});

test("rejects a behavior group that is never added at spawn", () => {
  withFixture((dir) => {
    mutateJson(dir, "behavior_pack/entities/cosmic_anomaly.json", (json) => {
      delete json["minecraft:entity"].events["minecraft:entity_spawned"];
    });
    assert.match(inspectProject(dir).errors.join("\n"), /is not added by minecraft:entity_spawned/);
  });
});

test("rejects natural spawn rules", () => {
  withFixture((dir) => {
    fs.mkdirSync(path.join(dir, "behavior_pack/spawn_rules"));
    fs.writeFileSync(path.join(dir, "behavior_pack/spawn_rules/x.json"), "{}");
    assert.match(inspectProject(dir).errors.join("\n"), /Natural spawn rules are not allowed/);
  });
});

test("rejects scripts outside the approved files", () => {
  withFixture((dir) => {
    fs.writeFileSync(path.join(dir, "behavior_pack/scripts/extra.js"), "export {};\n");
    assert.match(inspectProject(dir).errors.join("\n"), /not an approved gameplay script/);
  });
});

test("rejects scripts in the Resource Pack", () => {
  withFixture((dir) => {
    fs.writeFileSync(path.join(dir, "resource_pack/sneaky.js"), "export {};\n");
    assert.match(inspectProject(dir).errors.join("\n"), /not an approved gameplay script/);
  });
});

test("rejects a missing script entry", () => {
  withFixture((dir) => {
    fs.rmSync(path.join(dir, "behavior_pack/scripts/main.js"));
    assert.match(inspectProject(dir).errors.join("\n"), /entry "scripts\/main\.js" is missing/);
  });
});

test("rejects a drifted script dependency version", () => {
  withFixture((dir) => {
    mutateJson(dir, "behavior_pack/manifest.json", (manifest) => {
      manifest.dependencies.find((dependency) => dependency.module_name).version = "2.12.0";
    });
    assert.match(inspectProject(dir).errors.join("\n"), /version drifted from the identity catalog/);
  });
});

test("rejects an unapproved script dependency", () => {
  withFixture((dir) => {
    mutateJson(dir, "behavior_pack/manifest.json", (manifest) => {
      manifest.dependencies.push({ module_name: "@minecraft/server-ui", version: "2.0.0" });
    });
    assert.match(inspectProject(dir).errors.join("\n"), /not approved in the identity catalog/);
  });
});

test("rejects a missing script dependency", () => {
  withFixture((dir) => {
    mutateJson(dir, "behavior_pack/manifest.json", (manifest) => {
      manifest.dependencies = manifest.dependencies.filter((dependency) => !dependency.module_name);
    });
    assert.match(inspectProject(dir).errors.join("\n"), /missing the approved script dependency/);
  });
});

test("rejects a script module UUID that drifts or duplicates another", () => {
  withFixture((dir) => {
    mutateJson(dir, "behavior_pack/manifest.json", (manifest) => {
      manifest.modules.find((module) => module.type === "script").uuid = manifest.modules[0].uuid;
    });
    const errors = inspectProject(dir).errors.join("\n");
    assert.match(errors, /module UUIDs drifted|must all be present and unique/);
  });
});

test("rejects a script module without the approved entry", () => {
  withFixture((dir) => {
    mutateJson(dir, "behavior_pack/manifest.json", (manifest) => {
      manifest.modules.find((module) => module.type === "script").entry = "scripts/other.js";
    });
    assert.match(inspectProject(dir).errors.join("\n"), /entry does not match/);
  });
});

test("rejects a retired baseline identifier in the catalog", () => {
  withFixture((dir) => {
    mutateJson(dir, "tools/identity-catalog.json", (catalog) => {
      catalog.content_identifiers.push("sinbad:baseline_mob");
    });
    assert.match(inspectProject(dir).errors.join("\n"), /content_identifiers do not exactly match/);
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
