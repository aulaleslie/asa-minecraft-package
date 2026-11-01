#!/usr/bin/env node
// Generates the Cosmic Anomaly custom geometry and texture. The outputs are
// committed under resource_pack/; run this only when the model changes:
//   node tools/generate-cosmic-anomaly-assets.mjs
// Units are 1/16 block. The ring is about 96 units (6 blocks) tall.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const round = (value) => Math.round(value * 1000) / 1000;

// Texture regions (32x32): ring, tentacle and center each map every face to a
// small solid patch so no cube depends on box-UV unfolding.
const PATCH = { ring: [4, 4], tentacle: [20, 4], center: [4, 20] };
const face = ([u, v]) => ({ uv: [u, v], uv_size: [2, 2] });
const uvFor = (kind) => Object.fromEntries(
  ["north", "south", "east", "west", "up", "down"].map((side) => [side, face(PATCH[kind])]));

const CENTER_Y = 48;
const SEMI_X = 40;
const SEMI_Y = 45;
const THICKNESS = 7;
const DEPTH = 6;
const SEGMENTS = 28;

const ringCubes = [];
for (let i = 0; i < SEGMENTS; i++) {
  const t0 = (i / SEGMENTS) * Math.PI * 2;
  const t1 = ((i + 1) / SEGMENTS) * Math.PI * 2;
  const tm = (t0 + t1) / 2;
  const x0 = SEMI_X * Math.cos(t0);
  const y0 = SEMI_Y * Math.sin(t0);
  const x1 = SEMI_X * Math.cos(t1);
  const y1 = SEMI_Y * Math.sin(t1);
  const length = Math.hypot(x1 - x0, y1 - y0) * 1.18;
  const cx = SEMI_X * Math.cos(tm);
  const cy = CENTER_Y + SEMI_Y * Math.sin(tm);
  const angle = (Math.atan2(y1 - y0, x1 - x0) * 180) / Math.PI;
  ringCubes.push({
    origin: [round(cx - length / 2), round(cy - THICKNESS / 2), -DEPTH / 2],
    size: [round(length), THICKNESS, DEPTH],
    pivot: [round(cx), round(cy), 0],
    rotation: [0, 0, round(angle)],
    uv: uvFor("ring"),
  });
}

// Boxes whose corners stay inside the ring's inner ellipse (36.5 x 41.5).
const centerCubes = [[60, 34], [44, 58], [28, 76]].map(([w, h]) => ({
  origin: [-w / 2, CENTER_Y - h / 2, -1],
  size: [w, h, 2],
  uv: uvFor("center"),
}));

const SEGMENT_LENGTH = 14;
const SEGMENT_COUNT = 4;
const TENTACLE_ANGLES = [45, 135, 225, 315];
const CURL = 12; // degrees added per joint so the ribbons sweep rather than stand straight
const bones = [
  { name: "body", pivot: [0, CENTER_Y, 0] },
  { name: "ring", parent: "body", pivot: [0, CENTER_Y, 0], cubes: ringCubes },
  { name: "center", parent: "body", pivot: [0, CENTER_Y, 0], cubes: centerCubes },
];
// Poses are baked into cube rotations (bone rotation is left at zero) so
// animations can rotate each joint about its own pivot from a neutral pose.
TENTACLE_ANGLES.forEach((degrees, k) => {
  let jx = SEMI_X * Math.cos((degrees * Math.PI) / 180);
  let jy = CENTER_Y + SEMI_Y * Math.sin((degrees * Math.PI) / 180);
  for (let s = 0; s < SEGMENT_COUNT; s++) {
    const heading = degrees + CURL * s;
    const radians = (heading * Math.PI) / 180;
    const width = round(10 - s * 1.6);
    bones.push({
      name: `tentacle${k}_${s}`,
      parent: s === 0 ? "body" : `tentacle${k}_${s - 1}`,
      pivot: [round(jx), round(jy), 0],
      cubes: [{
        origin: [round(jx - width / 2), round(jy), -1],
        size: [width, SEGMENT_LENGTH + 1, 2],
        pivot: [round(jx), round(jy), 0],
        rotation: [0, 0, round(heading - 90)],
        uv: uvFor("tentacle"),
      }],
    });
    jx += SEGMENT_LENGTH * Math.cos(radians);
    jy += SEGMENT_LENGTH * Math.sin(radians);
  }
});

const geometry = {
  format_version: "1.21.0",
  "minecraft:geometry": [{
    description: {
      identifier: "geometry.sinbad.cosmic_anomaly",
      texture_width: 32,
      texture_height: 32,
      visible_bounds_width: 8,
      visible_bounds_height: 9,
      visible_bounds_offset: [0, 3, 0],
    },
    bones,
  }],
};

// 32-bit uncompressed TGA with a top-left origin. For the emissive material the
// alpha channel is the emissive mask: ring 0, tentacles 110, center 255.
const SIZE = 32;
const pixels = Buffer.alloc(SIZE * SIZE * 4);
function fill(x0, y0, x1, y1, [r, g, b, a]) {
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) pixels.set([b, g, r, a], (y * SIZE + x) * 4);
  }
}
fill(0, 0, 32, 32, [0, 0, 0, 255]);
fill(0, 0, 16, 16, [255, 240, 140, 0]);
fill(16, 0, 32, 16, [196, 160, 40, 110]);
fill(0, 16, 16, 32, [0, 0, 0, 255]);
const header = Buffer.alloc(18);
header[2] = 2;
header.writeUInt16LE(SIZE, 12);
header.writeUInt16LE(SIZE, 14);
header[16] = 32;
header[17] = 0x28;

// `--opaque-preview <file>` writes a preview-only copy of the texture with the
// alpha mask forced opaque. The browser viewer draws low alpha as transparent,
// so this copy (never shipped) makes the silhouette reviewable there.
const previewIndex = process.argv.indexOf("--opaque-preview");
if (previewIndex >= 0) {
  const preview = Buffer.from(pixels);
  for (let i = 3; i < preview.length; i += 4) preview[i] = 255;
  fs.writeFileSync(process.argv[previewIndex + 1], Buffer.concat([header, preview]));
  console.log(`Wrote preview-only opaque texture ${process.argv[previewIndex + 1]}`);
  process.exit(0);
}

const modelFile = path.join(root, "resource_pack/models/entity/cosmic_anomaly.geo.json");
const textureFile = path.join(root, "resource_pack/textures/entity/cosmic_anomaly.tga");
fs.mkdirSync(path.dirname(modelFile), { recursive: true });
fs.mkdirSync(path.dirname(textureFile), { recursive: true });
fs.writeFileSync(modelFile, JSON.stringify(geometry, null, 2) + "\n");
fs.writeFileSync(textureFile, Buffer.concat([header, pixels]));
console.log(`Wrote ${path.relative(root, modelFile)} (${bones.length} bones) and ${path.relative(root, textureFile)}`);
