# `src/lib/stage` — Stage contracts + adaptors + brief + pack export

Frozen TypeScript types, pack profiles, and light parsers for **Stage**.

- Product freeze: [`docs/DIRECTION.md`](../../../docs/DIRECTION.md)
- OpenAPI: [`docs/api/stage-v1.openapi.yaml`](../../../docs/api/stage-v1.openapi.yaml)
- Auth: [`docs/api/AUTH.md`](../../../docs/api/AUTH.md)

**Phase 1:** `adaptPreset.ts` converts SynthPreset v2 ↔ StageRecipe (schema v3). Lab export builds a recipe from the store (via `gatherPresetExportInput` + adaptor); import validates with `parseStageRecipe`, converts back to v2, and applies through existing hydrate. Extra Source uploads live in `labStageDraft.ts` (module-level) so recipes can list N assets while the GPU still binds one hero + one decal.

**Phase 2:** Brief path — Server `POST /api/brief` (Gemini via `@google/generative-ai`) returns a validated patch only — see `buildBriefSystemPrompt.ts`, `runStageBrief.ts`, `validateBriefPatch.ts`, `applyBrief.ts`. No brand saved → weaker system prompt (brief still allowed). AI off/fail → keyword mood (`mapMoodToPreset`). OpenAI is **not** used for this path.

**Lab workspace (post–Phase 5 UI remake):** `workspace/` IndexedDB (`stage-workspace`) stores multi-brand kits + asset blobs (bytes copied into `Blob`s — not live `File` handles); active brand id in `localStorage`. Uploading to Library stores assets only — use **Use as hero** / **Use as overlay** to paint the canvas. Legacy `brandKitStorage.ts` (`stage.activeBrandKit.v1`) migrates once. Lab Library + floating Brief send the active workspace brand into `applyBriefFromText`. Not synced with `/v1/brands`.

**Phase 3:** `exportCampaignPack.ts` builds a campaign pack ZIP from `STAGE_PACK_PROFILES` defaults (3 PNGs at exact sizes + `stage-recipe.json`). Capture path: `packExportViewport.ts` + lab `PackExportViewportBridge` + `src/lib/export/captureCanvasAtSize.ts`. ZIP: `src/lib/export/zipStore.ts` (uncompressed STORED entries — no dependency).

**Phase 4:** Server `src/lib/stage/server/*` — in-memory brands/jobs, API key auth, sync job runner (Gemini → StageRecipe). Handlers under `api/v1/*`. Lab IndexedDB brands are **not** synced (see [`docs/DIRECTION.md`](../../../docs/DIRECTION.md) UI remake notes).

**Phase 5:** `embed/` helpers + `StageEmbedBackground` + [`EMBED.md`](./EMBED.md). Demo: `/embed-demo`.
