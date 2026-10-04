# Handoff Report: Build, Versioning, Save Logic, & QA Testing Survey

- **Agent**: Build & Save Logic Investigator (`explorer_survey_3`)
- **Working Directory**: `C:\Users\Teknoist\.gemini\antigravity\scratch\Minecraft-Dungeons-2-Save-Editor\.agents\teamwork\explorer_survey_3`
- **Target Project Root**: `C:\Users\Teknoist\.gemini\antigravity\scratch\Minecraft-Dungeons-2-Save-Editor`
- **Scope**: Requirement R3 (Build and Versioning Fix) and Requirement R5 (QA and Bug Testing)

---

## 1. Observation

### 1.1 Package Configuration & Build Versioning
- **`package.json:4`**:
  ```json
  "version": "0.0.0",
  ```
  The version is initialized to `"0.0.0"`. There are no versioning scripts (`version`, `postversion`, etc.).
- **`package.json:7-13`**:
  ```json
  "scripts": {
    "dev": "concurrently \"vite\" \"wait-on http://localhost:5173 && cross-env NODE_ENV=development electron .\"",
    "build": "tsc -b && vite build",
    "lint": "oxlint",
    "preview": "vite preview",
    "package": "npm run build && electron-builder --win"
  }
  ```
  Notice there is **no test script** (`"test"` is completely missing).
- **`package.json:37-52`**:
  ```json
  "build": {
    "appId": "com.teknoist.mcd2saveedit",
    "productName": "MCD2 Save Editor",
    "directories": {
      "output": "C:\\temp\\mcd2-build"
    },
    "files": [
      "dist/**/*",
      "electron/**/*"
    ],
    "win": {
      "target": [
        "nsis"
      ]
    }
  }
  ```
- **Existing Build Artifacts**:
  - In `C:\temp\mcd2-build`: File `MCD2 Save Editor Setup 0.0.0.exe` (113,511,904 bytes) created 2026-10-04 15:55.
  - In project root `release/`: Subdirectory `win-unpacked.tmp` created 2026-10-04 15:53.
  - In project root `build-output/`: Subdirectory `win-unpacked.tmp` created 2026-10-04 15:54.
- **`.gitignore:1-25`**:
  `dist`, `dist-ssr`, and `node_modules` are ignored, but neither `release` nor `build-output` is listed in `.gitignore`.
- **Hardcoded Version Strings**:
  - `electron/main.cjs:443-452`:
    ```javascript
    ipcMain.handle('get-app-version', async () => {
      addLog('debug', 'get-app-version');
      try {
        const pkgPath = path.join(__dirname, '..', 'package.json');
        const pkg     = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        return pkg.version ?? '1.0.0';
      } catch {
        return app.getVersion() || '1.0.0';
      }
    });
    ```
    When `package.json` has `0.0.0`, `get-app-version` returns `"0.0.0"`.
  - `electron/main.cjs:466`: Window creation title:
    ```javascript
    title: 'MCD2 Save Editor v1.0',
    ```
  - `electron/main.cjs:562`: Help > About dialog message:
    ```javascript
    message: 'MCD2 Save Editor v1.0',
    ```
  - `src/components/GameDataTab.tsx:70`: Displays `Version {version}` fetched via `window.electronAPI.getAppVersion()`. Currently displays `Version 0.0.0`.

### 1.2 Save File Format & Structure
- **Game Installation on Host System**:
  `C:\Users\Teknoist\AppData\Local\Packages\Microsoft.MinecraftDungeons2_8wekyb3d8bbwe\SystemAppData\wgs` exists and contains real active character save blobs:
  `.../000901F7D49FD459_0000000000000000000000006B9DE498/483E779457834C1EA1EA8B5608311126/485F670AF0FE4FD99240C997B2D30340` (191,170 bytes).
- **Format Inspection**:
  The file is raw unencrypted UTF-8 JSON. It begins with:
  ```json
  {"SerializeMeta":{"InternalVersion":0,"HardFormat":"FCharacterSaveV1","SoftVersion":5,"FormatHash":1764133460},"CharacterSaveV1":{"MetaData":{"CharacterId":"95e8cd40-bc00-11f1-8018-6da01faf9ac1",...
  ```
- **Save Read/Write IPC Logic**:
  In `electron/main.cjs:226-287`:
  - `read-save`: Reads UTF-8, slices from `text.indexOf('{')`, and calls `JSON.parse`.
  - `write-save`: Creates backup `.bak<timestamp>`, writes formatted JSON `JSON.stringify(jsonData, null, 2)` to `<filePath>.tmp`, and calls `fs.renameSync(tmpPath, filePath)`.

### 1.3 Critical Bug Observations
1. **Save Header Regex Match Bug (Saved Characters Disappear)**:
   - `electron/main.cjs:133`:
     ```javascript
     const HEADER_MARKER = '{"SerializeMeta"';
     ```
   - `electron/main.cjs:145`:
     ```javascript
     if (!snippet.startsWith(HEADER_MARKER)) return null;
     ```
   - When the game writes the save file, it is compact: `{"SerializeMeta"...`, which starts with `HEADER_MARKER`.
   - When MCD2 Save Editor writes via `write-save`, it writes formatted JSON:
     ```json
     {
       "SerializeMeta": {
     ```
   - Verification in Node:
     `JSON.stringify({SerializeMeta: 1}, null, 2).startsWith('{\x22SerializeMeta\x22')` returns `false`!
   - Result: `parseSaveHeader` returns `null` for any save file previously written by the editor! In `get-saves` (`electron/main.cjs:198-202` and line 194), any file where `parseSaveHeader === null` is completely filtered out! The character vanishes from the editor upon saving.
2. **Enchantment Slot Rendering & Addition Bug**:
   - `src/components/InventoryTab.tsx:353-413`:
     ```tsx
     {entry.ItemData.Effects.map((batch, bi) => (
       <div key={bi} className="enchant-slot flex-1" style={{ minWidth: 0 }}>
         <div className="enchant-slot-label">Slot {bi + 1}</div>
         ...
         <button className="mc-btn mc-btn-primary w-full" onClick={() => addEnchant(bi)}>
           <Plus size={10} /> Add Enchantment
         </button>
       </div>
     ))}
     ```
   - In real saves, common items (e.g., `SW.Item.Pickaxe`) have `Effects: []`. Items with 1 enchantment have `Effects: [ { TypeTag: "SW.Item.Effect.Rerollable", EffectsInThisBatch: [...] } ]`.
   - Because slots are rendered solely by mapping over `entry.ItemData.Effects`, items with `Effects: []` render **zero enchantment slots** and no "+ Add Enchantment" button exists.
   - For items with 1 batch, only Slot 1 is rendered, and clicking Add Enchantment adds a second enchantment into `batch[0].EffectsInThisBatch` instead of Slots 2 and 3!
3. **Enchantment Template Namespace Bug**:
   - In `src/core/types.ts:398-400` (`createEnchantEffect`):
     ```typescript
     GeneratorParentTemplate: effectTag.startsWith('SW.Effect.')
       ? `SW.EffectTemplate.${baseName}.${tierSuffix}`
       : undefined,
     ```
     For any `SW.Enchantment.*` tag, `GeneratorParentTemplate` was set to `undefined`.
   - In `src/components/InventoryTab.tsx:284-288`:
     ```typescript
     const baseName = tag.replace('SW.Effect.', '').replace('SW.Enchantment.', '');
     const tierStr = ['I', 'II', 'III'][Math.max(0, Math.min(2, (eff.Quality || 1) - 1))];
     if (eff.GeneratorData) {
       eff.GeneratorData.GeneratorParentTemplate = `SW.EffectTemplate.${baseName}.${tierStr}`;
     }
     ```
     This forces all templates to start with `SW.EffectTemplate.`.
   - In authentic saves:
     - Real effect: `{"TypeTag":"SW.Effect.CriticalEdge", "GeneratorData":{"GeneratorParentTemplate":"SW.EffectTemplate.CriticalEdge.I"}}`
     - Real enchantment: `{"TypeTag":"SW.Enchantment.Channeling", "GeneratorData":{"GeneratorParentTemplate":"SW.Enchantment.Channeling.III"}}`
     Real game saves use `SW.Enchantment.<Name>.<Tier>` for enchantments, NOT `SW.EffectTemplate`.
4. **Missing IPC Handler Runtime Crash**:
   - `src/electron.d.ts:40-45` defines `scanGameData: (gamePath: string) => Promise<{ pakFiles, utocFiles, ucasFiles, encryptionRequired }>`.
   - `src/components/GameDataTab.tsx:48`:
     ```typescript
     const scan = await window.electronAPI.scanGameData(gameInstall.path);
     ```
   - In `electron/preload.cjs`: `scanGameData` is NOT declared in `contextBridge.exposeInMainWorld('electronAPI', {...})`.
   - In `electron/main.cjs`: `ipcMain.handle('scan-game-data', ...)` does NOT exist.
   - Result: Navigating to GameDataTab and clicking Scan triggers an unhandled rejection: `TypeError: window.electronAPI.scanGameData is not a function`.
5. **Character Level Desynchronization**:
   - In authentic saves, `Level` is stored in two locations:
     1. `CharacterSaveV1.MetaData.Level`
     2. `CharacterSaveV1.Ability.Attributes` entry with `AttributeName: "Level"`
   - `GeneralTab.tsx:83` only mutates `MetaData.Level`, leaving `Ability.Attributes` out of sync.

### 1.4 Code Repetition & Test State
- **Duplicated Game Data**:
  - `src/utils/GameData.ts` contains hardcoded `ITEM_TYPES`, `EFFECT_TYPES`, `RARITIES`, and `generateNewItem`. It is never imported anywhere in the project (orphaned duplicate).
  - `src/core/types.ts` and `src/core/gameData.ts` contain the real, active definitions and loaders.
- **Scattered Save Editing Logic**:
  - Functions for modifying enchantments, tiers, powers, and rarities are tightly coupled inside `src/components/InventoryTab.tsx` and `src/components/GeneralTab.tsx`.
- **Zero Existing Tests**:
  - No `test` directory, no `verify_save` script, no unit tests, and no dummy save fixtures exist in the repository.

---

## 2. Logic Chain

1. **Why `package.json` generates `0.0.0.exe`**:
   - Electron-builder uses `${productName} Setup ${version}.${ext}` as the default artifact template for NSIS on Windows.
   - `package.json:4` sets `"version": "0.0.0"`.
   - Consequently, electron-builder outputs `MCD2 Save Editor Setup 0.0.0.exe`.
   - Therefore, updating `"version"` in `package.json` to a semantic version (e.g., `"1.1.2"`) directly fixes the installer output filename to `MCD2 Save Editor Setup 1.1.2.exe`.

2. **Why saved characters disappear**:
   - `write-save` outputs multiline formatted JSON (`null, 2`).
   - `parseSaveHeader` checks `snippet.startsWith('{"SerializeMeta"')`.
   - Formatted JSON begins with `{\n  "SerializeMeta": {\n`.
   - `startsWith('{"SerializeMeta"')` evaluates to `false`.
   - `parseSaveHeader` returns `null`, causing `get-saves` to discard the file.
   - Therefore, `parseSaveHeader` must be regex-based (`/^\s*\{\s*"SerializeMeta"/.test(snippet)`), and/or `write-save` should write compact JSON (`JSON.stringify(jsonData)`) matching authentic saves.

3. **Why enchantments cannot be edited on non-enchanted items**:
   - The UI directly maps `entry.ItemData.Effects` to render slots.
   - Non-enchanted items have `Effects: []`.
   - Because the "+ Add" button is rendered inside each batch element, zero slots and zero buttons are rendered.
   - Therefore, items must either be normalized upon loading to always have 3 batches (`{ TypeTag: 'SW.Item.Effect.Rerollable', EffectsInThisBatch: [] }`), or the UI/editor service must render 3 fixed slots regardless of underlying array length.

4. **Why core logic must be decoupled for R4 and R5**:
   - Acceptance Criteria R5 requires: *"A test script can successfully load a dummy save file (JSON), modify an item's enchantment via the application's core logic, and write it back without throwing any serialization errors."*
   - Currently, enchantment editing is embedded within React component event handlers in `InventoryTab.tsx`.
   - A standalone Node/TypeScript test script cannot execute React event handlers.
   - Extracting item/enchantment editing into a pure module (`src/core/saveEditor.ts` or `src/core/saveService.ts`) enables:
     - Component deduplication and cleaner UI code (R4).
     - Headless programmatic testing of save parsing, enchantment modification, and serialization (R5).

5. **Test Runner Feasibility**:
   - Node on the system is v24.18.0.
   - Node 24 natively supports `--experimental-strip-types` (running `.ts` files directly) and the built-in `node:test` and `node:assert` modules.
   - No additional heavy testing dependencies (Jest, Vitest) need to be installed; tests can execute cleanly and quickly via `node --experimental-strip-types tests/verify_save_edit.ts` or `node scripts/verify_save_logic.js`.

---

## 3. Caveats

1. **Electron-builder packaging execution**:
   - Running full `electron-builder --win` produces a ~113MB installer and takes ~60-90 seconds. In Windows environments with active antivirus or indexers, file locking on `win-unpacked.tmp` can occasionally occur. Setting `directories.output` to `"release"` is standard, but the directory must be cleaned beforehand (`rimraf` or clean step).
2. **Authentic save format variations**:
   - Real saves from different game builds might contain different `SoftVersion` numbers (e.g. 5 vs 6) or different `HardFormat` names. The parser should continue to be flexible and preserve unknown properties (`[key: string]: unknown`).
3. **Read-only restriction**:
   - As an explorer agent, no source code files were edited during this survey. All proposed changes are documented with explicit specifications below.

---

## 4. Conclusion & Actionable Specifications

### 4.1 Specification for R3: Build and Versioning Fix
1. **`package.json`**:
   - Update line 4:
     ```json
     "version": "1.1.2",
     ```
   - Update `build.directories.output` in `package.json`:
     ```json
     "directories": {
       "output": "release"
     },
     ```
   - Add `"test"` script to `scripts`:
     ```json
     "test": "node --experimental-strip-types tests/verify_save_edit.ts",
     "test:db": "node scripts/verify_db.js"
     ```
2. **`.gitignore`**:
   - Append:
     ```gitignore
     release
     build-output
     *.tmp
     ```
3. **`electron/main.cjs`**:
   - Update window title (`createWindow` line 466):
     ```javascript
     title: `MCD2 Save Editor v${app.getVersion()}`,
     ```
   - Update About dialog (`buildMenu` line 562):
     ```javascript
     message: `MCD2 Save Editor v${app.getVersion()}`,
     ```
   - Fix `parseSaveHeader` (line 145):
     ```javascript
     if (!/^\s*\{\s*"SerializeMeta"/.test(snippet)) return null;
     ```
   - Implement `scanGameData` IPC handler in `electron/main.cjs` and expose in `electron/preload.cjs` to eliminate the runtime crash.

### 4.2 Specification for R5: QA and Bug Testing

#### A. Dummy Save File Fixture (`tests/fixtures/dummy_save.json`)
Create an authentic, minimal MCD2 save file containing:
- `SerializeMeta`: `InternalVersion: 0`, `HardFormat: "FCharacterSaveV1"`, `SoftVersion: 5`, `FormatHash: 1764133460`.
- `CharacterSaveV1`:
  - `MetaData`: `CharacterId: "test-hero-uuid-001"`, `Level: 32`, `PowerLevel: 40`, `ReleaseToggles: ["R1", "R2"]`.
  - `Ability.Attributes`: `Level: 32`, `Emeralds: 50000`, `EnchantmentPoints: 10`, `SpringStone: 100`.
  - `Inventory.Entries`:
    1. Item 0: A weapon (e.g., `SW.Item.Scythe`) with 3 batches (`SW.Item.Effect.Rerollable`), batch 0 containing `SW.Effect.CriticalEdge` (Tier 1).
    2. Item 1: A common weapon (e.g., `SW.Item.Pickaxe`) with `Effects: []` (to verify handling of zero-batch items).

#### B. Core Save Editing Logic Module (`src/core/saveEditor.ts`)
Extract pure editing operations:
```typescript
export function ensureItemEffectSlots(item: InventoryEntry, minSlots: number = 3): void;
export function addEnchantmentToItem(item: InventoryEntry, slotIndex: number, effectTag: string, tier: number = 1): EnchantmentEffect;
export function updateEnchantmentOnItem(item: InventoryEntry, slotIndex: number, enchantIndex: number, effectTag: string, tier: number): void;
export function removeEnchantmentFromItem(item: InventoryEntry, slotIndex: number, enchantIndex: number): void;
export function setCharacterLevel(save: SaveFile, newLevel: number): void;
export function serializeSave(save: SaveFile): string;
export function deserializeSave(jsonText: string): SaveFile;
```

Template logic resolution in `saveEditor.ts`:
- If `effectTag.startsWith('SW.Enchantment.')`:
  `GeneratorParentTemplate = `${effectTag}.${tierStr}``
- If `effectTag.startsWith('SW.Effect.')`:
  `const base = effectTag.replace('SW.Effect.', '');`
  `GeneratorParentTemplate = `SW.EffectTemplate.${base}.${tierStr}``

#### C. Automated Test Script (`tests/verify_save_edit.ts`)
The test script will:
1. Load `tests/fixtures/dummy_save.json` using `deserializeSave`.
2. Assert `save.SerializeMeta.HardFormat === "FCharacterSaveV1"`.
3. Locate Item 0 (`SW.Item.Scythe`).
4. Modify existing enchantment in Slot 0 to `SW.Enchantment.Channeling` at Tier 3 using `updateEnchantmentOnItem`.
5. Locate Item 1 (`SW.Item.Pickaxe` with empty effects).
6. Call `addEnchantmentToItem(item1, 0, 'SW.Effect.Sharpness', 2)`.
7. Call `serializeSave(save)`.
8. Assert serialization returns non-empty string without throwing errors.
9. Assert that `/^\s*\{\s*"SerializeMeta"/.test(serializedText)` is true.
10. Re-parse serialized JSON with `JSON.parse` and verify:
    - Item 0 Slot 0 has `TypeTag: "SW.Enchantment.Channeling"` and `GeneratorParentTemplate: "SW.Enchantment.Channeling.III"`.
    - Item 1 Slot 0 has `TypeTag: "SW.Effect.Sharpness"` and `GeneratorParentTemplate: "SW.EffectTemplate.Sharpness.II"`.
    - All other metadata and inventory entries remain intact.
11. Exit with code `0` on success, code `1` on failure.

---

## 5. Verification Method

To independently verify the implementation:

1. **Verify `package.json` Version & Build**:
   ```bash
   # Check version field is not "0.0.0"
   node -e "const pkg = require('./package.json'); if (pkg.version === '0.0.0') throw new Error('Version is 0.0.0'); console.log('Version:', pkg.version);"
   # Check build compiles with 0 errors
   npm run build
   ```
2. **Verify Save Editing & Parsing Test Script**:
   ```bash
   # Run the automated test script
   npm test
   # Or directly
   node --experimental-strip-types tests/verify_save_edit.ts
   ```
3. **Verify Header Marker Bug Fix**:
   ```bash
   node -e "const regex = /^\s*\{\s*\"SerializeMeta\"/; const formatted = JSON.stringify({SerializeMeta: 1}, null, 2); if (!regex.test(formatted)) throw new Error('Regex failed'); console.log('Header test passed');"
   ```
4. **Verify Electron Builder Output Filename**:
   ```bash
   npm run package
   # Verify the resulting executable in the output directory contains the version number
   # e.g., MCD2 Save Editor Setup 1.1.2.exe
   ```
5. **Invalidation Conditions**:
   - `package.json` version remains `"0.0.0"`.
   - Running `npm test` throws an uncaught serialization exception or fails assertions.
   - Any save written by the editor fails `parseSaveHeader` detection.
