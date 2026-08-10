# `src/lib/stage` — Stage contracts + Phase 1 adaptor

Frozen TypeScript types, pack profiles, and light parsers for **Stage**.

- Product freeze: [`docs/DIRECTION.md`](../../../docs/DIRECTION.md)
- OpenAPI: [`docs/api/stage-v1.openapi.yaml`](../../../docs/api/stage-v1.openapi.yaml)
- Auth: [`docs/api/AUTH.md`](../../../docs/api/AUTH.md)

**Phase 1:** `adaptPreset.ts` converts SynthPreset v2 ↔ StageRecipe (schema v3). Lab export builds a recipe from the store (via `gatherPresetExportInput` + adaptor); import validates with `parseStageRecipe`, converts back to v2, and applies through existing hydrate. Extra Source uploads live in `labStageDraft.ts` (module-level) so recipes can list N assets while the GPU still binds one hero + one decal.
