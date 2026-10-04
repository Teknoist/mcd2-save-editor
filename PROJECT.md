# Project: Minecraft Dungeons 2 Save Editor

## Architecture
The application is an Electron desktop app with a React + TypeScript frontend, bundled via Vite.
- **Main Process (`electron/main.cjs`, `electron/preload.cjs`)**: Manages OS-level save file discovery, file reading/writing (JSON backups, atomic write), application lifecycle, and IPC bridge.
- **Renderer Process (`src/`)**:
  - `src/core/`: Data models (`types.ts`), game database lookups (`gameData.ts`), history undo/redo (`historyService.ts`), and pure save manipulation logic (`saveEditor.ts`).
  - `src/components/`: Tab views (`GeneralTab`, `InventoryTab`, `BackupsTab`, `GameDataTab`), icon rendering (`ItemIcon`), tooltips, and modals.
  - `src/data/`: Static game databases (`gear.json`, `enchants.json`, `effects.json`).
  - `src/utils/`: Shared utilities (`formatters.ts`).
- **Tests & Scripts (`tests/`, `scripts/`)**: Automated headless test runners and verification scripts for database completeness and save modification serialization.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Database Extraction: Enchants | Populate canonical descriptions for all 32 enchantments in `enchants.json` | M1 | Survey / R1 |
| 2 | Database Extraction: Effects | Populate canonical descriptions for all 196 effect entries in `effects.json` | M1 | Survey / R1 |
| 3 | Database Extraction: Gear & Artifacts | Ensure 100% description coverage in `gear.json` (fix Cinder Scepter) | M1 | Survey / R1 |
| 4 | Database Verification Script | Implement `verify_db.js` confirming >95% valid non-empty descriptions | M1 | Survey / R1 |
| 5 | Type Model Updates | Update `EnchantEntry` and `EffectEntry` in `gameData.ts` to include `Description?: string` | M1 | Survey / R1 |
| 6 | Save Header Regex Fix | Fix `parseSaveHeader` in `electron/main.cjs` to detect multiline formatted JSON | M2 | Survey / R5 |
| 7 | Core Save Editor Module | Extract pure save editing functions into `src/core/saveEditor.ts` | M2 | Survey / R4, R5 |
| 8 | Enchantment Template Namespace | Fix enchantment template generator to use `SW.Enchantment.*` vs `SW.EffectTemplate.*` | M2 | Survey / R5 |
| 9 | Multi-Slot Enchantment Support | Support adding enchantments to all 3 slots even on items with `Effects: []` | M2 | Survey / R5 |
| 10 | Code Dead Code Removal | Delete unused `src/utils/GameData.ts` and prune dead arrays in `src/core/types.ts` | M2 | Survey / R4 |
| 11 | Shared Utilities & Types | Unify formatters into `src/utils/formatters.ts` and sync `electron.d.ts` with `types.ts` | M2 | Survey / R4 |
| 12 | Headless Save Test Fixture & Runner | Create `tests/fixtures/dummy_save.json` and `tests/verify_save_edit.ts` | M2 | Survey / R5 |
| 13 | Rich Tooltip System | Implement floating `<ItemTooltip>` and `<SimpleTooltip>` replacing clipped CSS | M3 | Survey / R2 |
| 14 | Searchable Enchantment Picker | Implement `<EnchantmentPicker>` with search, slot pool filtering, and descriptions | M3 | Survey / R2 |
| 15 | Form Controls & Quick Actions | Implement `<NumberStepper>` and quick presets ("Max Currencies", "Level Presets") | M3 | Survey / R2 |
| 16 | Inventory Filtering & Loadout View | Add Equipped Loadout view, sorting dropdown, and search in inventory & Add modal | M3 | Survey / R2 |
| 17 | Linter & Closure Warning Fixes | Resolve Oxlint warnings and React Compiler closure ordering in `App.tsx` | M3 | Survey / R2 |
| 18 | Semantic Versioning Fix | Update `package.json` version from `"0.0.0"` to `"1.1.2"` | M4 | Survey / R3 |
| 19 | Electron Builder Config | Configure builder output directory and package script | M4 | Survey / R3 |
| 20 | Executable Packaging Verification | Ensure compiled `.exe` contains the version number in filename | M4 | Survey / R3 |
| 21 | IPC Runtime Crash Fix | Implement missing `scanGameData` handler in `electron/main.cjs` and `preload.cjs` | M4 | Survey / R3 |
| 22 | Full E2E Test Suite (Tiers 1-4) | Opaque-box verification suite validating all user requirements | M5 | R1-R5 |
| 23 | Adversarial Coverage Hardening | Tier 5 white-box stress testing and edge-case verification | M5 | Project Pattern |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Database Extraction & Schema Integration | Features 1-5: Populate enchants, effects, and gear descriptions; add `verify_db.js`; update `gameData.ts` models | none | IN_PROGRESS |
| M2 | Core Logic Extraction, Deduplication & Save Fixes | Features 6-12: Create `saveEditor.ts`, fix header regex, fix template namespaces, fix multi-slot enchants, remove dead code, unify formatters/types, create dummy save & test runner | M1 | PLANNED |
| M3 | UI/UX Redesign & Component Polish | Features 13-17: Rich tooltips, searchable enchantment picker, form steppers, quick action presets, loadout views, sorting, fix Oxlint warnings | M1, M2 | PLANNED |
| M4 | Build, Versioning & Packaging Configuration | Features 18-21: Update semver in `package.json`, fix window title/about dialog, fix `scanGameData` IPC, verify `npm run build` and `npm run package` | M2, M3 | PLANNED |
| M5 | Final Milestone: E2E Verification & Adversarial Hardening | Features 22-23: Phase 1: Pass 100% of E2E test suite (Tiers 1-4); Phase 2: Tier 5 adversarial stress testing | M1, M2, M3, M4, TEST_READY.md | PLANNED |

## Interface Contracts

### `src/core/gameData.ts`
- `EnchantEntry`: `{ Name: string; Tag: string; Icon: string; IconUrl: string; Slots: string[]; Tiers: Array<{ Tier: string; Value: number }>; Source: string; Description?: string; }`
- `EffectEntry`: `{ Name: string; Tag: string; Effect: string; Tier: string; Value: number; Icon?: string; IconUrl?: string; Category?: string; Source?: string; Description?: string; }`
- `formatTag(tag: string): string`

### `src/core/saveEditor.ts`
- `ensureItemEffectSlots(item: InventoryEntry, minSlots?: number): void`
- `addEnchantmentToItem(item: InventoryEntry, slotIndex: number, effectTag: string, tier?: number): EnchantmentEffect`
- `updateEnchantmentOnItem(item: InventoryEntry, slotIndex: number, enchantIndex: number, effectTag: string, tier: number): void`
- `removeEnchantmentFromItem(item: InventoryEntry, slotIndex: number, enchantIndex: number): void`
- `setCharacterLevel(save: SaveFile, newLevel: number): void`
- `serializeSave(save: SaveFile): string`
- `deserializeSave(jsonText: string): SaveFile`

### `src/utils/formatters.ts`
- `formatBytes(bytes: number): string`

## Code Layout
- `src/core/`: `types.ts`, `gameData.ts`, `saveEditor.ts`, `historyService.ts`
- `src/utils/`: `formatters.ts`
- `src/components/`: `GeneralTab.tsx`, `InventoryTab.tsx`, `BackupsTab.tsx`, `GameDataTab.tsx`, `ItemIcon.tsx`, `Tooltips/`, `EnchantmentPicker.tsx`
- `src/data/`: `gear.json`, `enchants.json`, `effects.json`
- `electron/`: `main.cjs`, `preload.cjs`
- `tests/`: `fixtures/dummy_save.json`, `verify_save_edit.ts`
- `tests/e2e/`: E2E test suite and runner
- `scripts/` or project root: `verify_db.js`
