# Browser review: human-reported, 2026-11-01

- **Status:** passed (human-reported; not machine-captured).
- **Reviewer:** repository owner, manual check.
- **Environment:** Chrome on Ubuntu, Creator Tools 0.20.0 viewer
  (`mct view -i .`), Minecraft target 26.60.
- **Observed:** Entity type visuals → `sinbad:baseline_mob` → Preview renders
  the bundled cow-shaped model (`geometry.sinbad.baseline_mob`) with the custom
  teal texture.
- **Not covered:** this is a viewer check only. It does not prove Bedrock
  runtime or iOS behavior. iOS acceptance remains pending.
- **Limits:** no screenshot or console capture was produced by the agent; the
  automated browser used by the agent has no WebGL.

## Source state reviewed

Reviewed against the working tree on top of revision
`71b92dad545b355ab5e60592fd0753f02265dc30` (uncommitted at review time).
The reviewed assets are identified by SHA-256:

| File | SHA-256 |
| --- | --- |
| `resource_pack/models/entity/baseline_mob.geo.json` | `d61087bfafa606be30c5da61cbb443976b7598e4dd70eff5a894e41469c116bd` |
| `resource_pack/textures/entity/baseline_mob.png` | `8757304cd72c235c4f427b31c0ee3d13039132b684fe81ae9b272220502436f7` |
| `resource_pack/entity/baseline_mob.entity.json` | `38ffe1004b716c0ab131c384342a0f4ba09a72a0f5920cb64efb8eb9053f5772` |
| `resource_pack/render_controllers/baseline_mob.render_controllers.json` | `c775fc1983f7a0e6914f0606e0477d0175bdf2d21e353e0c112980a01a7ad45f` |

Candidate A must be built from a commit whose copies of these files hash the
same; otherwise repeat the browser review. This record is not candidate-bound
until a CI archive exists, so task 5.2 stays pending.
