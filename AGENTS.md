# Agent guidance

- Treat `behavior_pack/` and `resource_pack/` as canonical runtime sources.
  Keep edits focused; do not add generated pack trees or gameplay scripts
  without an approved OpenSpec task.
- Before implementing new content or behavior, read the active OpenSpec change
  and follow its tasks and acceptance criteria. Do not bypass maintainer
  approval or silently reduce scope.
- Preserve original creative sources in `assets/references/`; never overwrite
  source art with generated or edited versions. Keep provenance and the child's
  explicit requirements distinct from AI interpretations.
- Preserve committed pack/module UUIDs and existing `sinbad:` identifiers.
  Keep pack versions synchronized and the Behavior Pack dependency matched to
  the Resource Pack UUID and version.
- Use the pinned Node/npm toolchain and repository commands. Run validation,
  tests, and packaging before claiming a candidate is ready.
- Browser previews do not prove Bedrock runtime behavior. Do not mark manual
  iOS acceptance complete without candidate-bound results reported by the
  parent or child.
- Keep `.github/agents/openspec.agent.md` and the Copilot setup workflow intact;
  they provide the existing OpenSpec agent integration.
