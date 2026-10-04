# Handoff Report: Architecture, UI/UX Redesign, & Code Deduplication

**Investigator**: Architecture & UI/UX Investigator (`explorer_survey_2`)  
**Mission**: Investigate R2 (UI/UX Redesign) and R4 (Code Deduplication)  
**Project Root**: `C:\Users\Teknoist\.gemini\antigravity\scratch\Minecraft-Dungeons-2-Save-Editor`  
**Date**: 2026-10-04  

---

## 1. Observation

### 1.1 Architecture & State Management
- **`src/App.tsx` (Lines 31-42)**: Root state is managed via 11 separate `useState` hooks (`saves`, `currentSaveInfo`, `currentSaveData`, `isDirty`, `activeTab`, `loading`, `saving`, `toasts`, `canUndo`, `canRedo`). Props and callbacks (`saveData`, `updateSaveData`) are drilled down to `GeneralTab` and `InventoryTab`.
- **`src/App.tsx` (Lines 43-54)**: Keyboard event listeners (`Ctrl+Z`, `Ctrl+Y`, `Ctrl+S`) are bound in `useEffect` referencing `currentSaveData` and `currentSaveInfo`. Oxlint detects warnings because `loadSaveList`, `handleUndo`, `handleRedo`, and `handleSave` are declared after `useEffect` as unhoisted arrow functions (e.g. `App.tsx:48:91` and `App.tsx:54:6`).
- **`src/core/historyService.ts` (Lines 11-75)**: Single-instance history manager storing up to 50 JSON snapshots (`JSON.stringify(data)`). Every call to `updateSaveData` in `App.tsx` performs a full JSON serialization of the save tree.
- **`src/components/GeneralTab.tsx` (Lines 15, 26)** & **`src/components/InventoryTab.tsx` (Lines 61, 241, 250, 256, 262, 272, 278)**: Every state update triggers a full deep-clone via `JSON.parse(JSON.stringify(...))`. Unthrottled typing in number inputs in `GeneralTab.tsx` (line 83) fires an instant clone and history push per keystroke.

### 1.2 Code Duplication & Dead Code
- **`src/utils/GameData.ts` (Lines 1-92)**: Defines `ITEM_TYPES` (24 items), `EFFECT_TYPES` (20 items), `RARITIES` (4 strings), and `generateNewItem()`.
  - Search verification: `grep_search` across `src` confirms zero references to `src/utils/GameData.ts` or `generateNewItem`. It is a 100% dead, redundant file.
- **`src/core/types.ts` (Lines 164-274)**:
  - Hardcodes `KNOWN_ITEM_TYPES` (73 lines) and `KNOWN_EFFECT_TYPES` (37 lines).
  - Search verification: `KNOWN_ITEM_TYPES` and `KNOWN_EFFECT_TYPES` are referenced 0 times outside their declarations. Actual items and effects are loaded from `src/data/gear.json`, `src/data/enchants.json`, and `src/data/effects.json`.
  - `getItemCategory` (`types.ts:302`), `getDisplayName` (`types.ts:319`), and `getEffectDisplayName` (`types.ts:333`) are declared but 0 references exist in the app.
- **`src/core/gameData.ts` (Lines 99-114)** vs **`src/core/types.ts` (Lines 319-342)**:
  - `formatTagToName` in `gameData.ts` replicates the regex stripping logic of `getDisplayName` and `getEffectDisplayName` in `types.ts` with minor discrepancies.
- **`src/components/InventoryTab.tsx` (Lines 86-91 & Lines 294-299)**:
  ```typescript
  // Line 86 in InventoryTab:
  const getRaritySlotClass = (rarityTag: string) => {
    if (rarityTag?.includes('Rare')) return 'rarity-rare';
    if (rarityTag?.includes('Unique')) return 'rarity-unique';
    if (rarityTag?.includes('Special')) return 'rarity-special';
    return 'rarity-common';
  };
  // Line 294 in ItemDetailPanel:
  const getRaritySlotClass = (rt: string) => {
    if (rt?.includes('Rare')) return 'rarity-rare';
    if (rt?.includes('Unique')) return 'rarity-unique';
    if (rt?.includes('Special')) return 'rarity-special';
    return 'rarity-common';
  };
  ```
  Identical function copy-pasted twice in the same file.
- **`src/components/BackupsTab.tsx` (Lines 44-48)** vs **`src/components/GameDataTab.tsx` (Lines 53-58)**:
  - `formatSize(bytes: number)` is declared verbatim in both components.
- **`src/electron.d.ts` vs `src/core/types.ts` vs Tab Components**:
  - `SaveFileInfo` defined in `src/core/types.ts:130` is duplicated as an anonymous inline interface in `src/electron.d.ts:3-11`.
  - `GameInstall` (`GameDataTab.tsx:4`) and `GameDataScan` (`GameDataTab.tsx:17`) duplicate anonymous interfaces in `src/electron.d.ts:33-45`.
  - `BackupEntry` (`BackupsTab.tsx:5`) duplicates `src/electron.d.ts:24-28`.
  - `HistoryRecord` in `historyService.ts:4` duplicates `HistoryEntry` in `types.ts:146`.

### 1.3 UI/UX Shortcomings & Usability Issues
- **Tooltip Implementation (`src/index.css:371-396`)**:
  - Implemented as pure CSS `[data-tooltip]::after` with `position: absolute; bottom: 100%; left: 50%; transform: translateX(-50%)`.
  - Inside `.overflow-y-auto` containers (such as the inventory grid), top-row item tooltips are cut off by the scroll container's top boundary.
  - Plain string `attr(data-tooltip)` cannot display rich content (descriptions, rarity badges, power level, enchantment stats).
  - `data-tooltip` is only used on 5 elements across the entire application (`Undo`, `Redo`, `Item Slot`, `Clone`, `Delete`). All form inputs, tabs, currencies, and enchantment tiers lack tooltips.
- **Enchantment Editing (`src/components/InventoryTab.tsx:350-415`)**:
  - Enchantment slots are rendered in a horizontal flex layout (`<div className="flex gap-2">`). Adding multiple enchantments per slot causes cramped columns and horizontal distortion.
  - Enchantment selection uses a native `<select>` containing over 80 ungrouped effects and enchantments. There is no search filter, no preview of descriptions, and no display of tier stats.
  - Slot compatibility is ignored: `EFFECT_LIST` and `ENCHANT_LIST` are dumped unconditionally into every item's dropdown, even though `src/core/gameData.ts` provides `getEnchantsForSlot()` and `getItemEnchantPool()`.
  - Tier selection uses a dropdown alongside 3 inline-styled square `<div>` elements with hardcoded colors.
- **Item Add Modal (`src/components/InventoryTab.tsx:164-217`)**:
  - The modal dropdown maps `GEAR_LIST` (200+ items) into a flat `<select>`. Finding a specific item requires scrolling through hundreds of options without a text search box.
- **General Tab Forms (`src/components/GeneralTab.tsx:46-174`)**:
  - Plain unstyled number inputs with no increment/decrement steppers, no validation boundaries (negative numbers allowed), and no quick-fill helpers (e.g., "Max Emeralds", "Set Level 100").
  - Four merchant upgrade attributes are displayed as raw numeric inputs without explaining what upgrade levels do or their max level cap.
  - Progression Tags and Release Toggles are displayed as read-only badges with no ability to edit or toggle flags.
- **Backups Tab (`src/components/BackupsTab.tsx`)**:
  - Does not support manual backup creation on demand (backups only occur during save write).
  - Uses native browser `confirm()` modal for destructive restore actions.
  - Lacks character preview (level, date, items) for backups.

### 1.4 Linter & Build Baseline
- `npm run build` exits 0 (`tsc -b && vite build` built in 1.28s, 818 kB bundle).
- `npm run lint` (`oxlint`) outputs 10 warnings:
  - 4 React Compiler immutability / closure warnings in `src/App.tsx:44,48,49,50`.
  - 1 React Compiler immutability warning in `src/components/GameDataTab.tsx:31`.
  - 1 exhaustive-deps warning in `src/App.tsx:54`.
  - 1 unused catch error in `src/App.tsx:67`.
  - 3 unused variables in `electron/main.cjs` and survey test files.

---

## 2. Logic Chain

```
[Observation 1.2] src/utils/GameData.ts is never imported anywhere
       │
       ▼ (Step 1)
Target D1: Delete src/utils/GameData.ts completely with zero risk of regression.

[Observation 1.2] KNOWN_ITEM_TYPES & KNOWN_EFFECT_TYPES in types.ts duplicate JSON databases & are unused
       │
       ▼ (Step 2)
Target D2: Remove hardcoded arrays from types.ts; reference dynamic lists in core/gameData.ts.

[Observation 1.2] formatTagToName, getDisplayName, getEffectDisplayName duplicate regex formatting
       │
       ▼ (Step 3)
Target D3: Consolidate string formatters into a single formatTag(tag: string) helper.

[Observation 1.2] getRaritySlotClass is duplicated in InventoryTab.tsx (lines 86 and 294)
       │
       ▼ (Step 4)
Target D4: Move CSS class mapping into RARITIES in types.ts; expose via getRarityInfo(tag).slotClass.

[Observation 1.2] formatSize() duplicated in BackupsTab.tsx & GameDataTab.tsx
       │
       ▼ (Step 5)
Target D5: Create src/utils/formatters.ts with shared formatBytes(bytes: number).

[Observation 1.1] 9 separate calls to JSON.parse(JSON.stringify()) for deep cloning
       │
       ▼ (Step 6)
Target D6: Implement structuredClone or deepClone<T>() helper and immutable mutation helpers.

[Observation 1.2] Types duplicated between electron.d.ts, types.ts, and tab components
       │
       ▼ (Step 7)
Target D7: Consolidate all domain & IPC types in types.ts and import across all consumers.

[Observation 1.3] CSS [data-tooltip] clips in overflow containers, supports only plain text, 5 uses
       │
       ▼ (Step 8)
Target U1: Build a dedicated React Tooltip / Popover system with rich item card previews.

[Observation 1.3] Enchantment dropdown has 80+ items, no search, no pool filtering, cramped columns
       │
       ▼ (Step 9)
Target U2: Redesign Enchantment Editor with searchable modal/popover & slot compatibility filtering.

[Observation 1.3] GeneralTab inputs lack bounds, steppers, quick-action presets, merchant info
       │
       ▼ (Step 10)
Target U3: Upgrade forms with NumberStepper, quick-action buttons ("Max All"), and descriptive cards.

[Observation 1.3] Inventory grid lacks sorting, loadout view, and search inside Add modal
       │
       ▼ (Step 11)
Target U4: Add loadout filter (Equipped vs Stash), sorting options, and searchable Add Item modal.
```

---

## 3. Concrete Deduplication Targets (R4)

### Target D1: Remove Dead File `src/utils/GameData.ts`
- **Location**: `src/utils/GameData.ts` (92 lines)
- **Rationale**: Redundant leftover from early scaffolding. `ITEM_TYPES`, `EFFECT_TYPES`, and `generateNewItem` are unused.
- **Action**: Delete `src/utils/GameData.ts`. If `src/utils` becomes empty, use it for shared utilities (`formatters.ts`).

### Target D2: Prune Unused Arrays in `src/core/types.ts`
- **Location**: `src/core/types.ts` (Lines 164–274)
- **Rationale**: 110 lines of static strings (`KNOWN_ITEM_TYPES`, `KNOWN_EFFECT_TYPES`) that conflict with the true database in `src/data/gear.json`, `effects.json`, and `enchants.json`.
- **Action**: Delete lines 164–274. Remove unused `AppSettings`, `SaveState`, and `getItemCategory`.

### Target D3: Unify Tag and Name Formatters
- **Location**: `src/core/types.ts` (Lines 319–342) and `src/core/gameData.ts` (Lines 99–114)
- **Rationale**: Three separate regex-based functions perform identical string cleanups.
- **Action**: Consolidate into `formatTag(tag: string): string` in `src/core/gameData.ts`:
  ```typescript
  export function formatTag(tag: string): string {
    if (!tag) return 'Unknown';
    return tag
      .replace(/^SW\.(Item|Effect|Enchantment)\./, '')
      .replace(/^Artifact\./, '')
      .replace(/^Cosmetic\.(Cape|Pet)\./, '$1: ')
      .replace(/^EnchantmentBook\./, 'Enchantment: ')
      .replace(/^Talisman\./, 'Talisman: ')
      .replace(/([A-Z])/g, ' $1')
      .replace(/_/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
  ```

### Target D4: Consolidate Rarity Classification & Styling
- **Location**: `src/components/InventoryTab.tsx` (Lines 86, 294) & `src/core/types.ts` (Lines 276–281)
- **Rationale**: `getRaritySlotClass` is declared identically twice.
- **Action**: Add `slotClass` and `badgeClass` to `RARITIES`:
  ```typescript
  export const RARITIES = [
    { tag: 'SW.Rarity.Common', label: 'Common', color: '#8b8b8b', glowColor: '#a8a8a8', slotClass: 'rarity-common' },
    { tag: 'SW.Rarity.Rare', label: 'Rare', color: '#4b7a47', glowColor: '#6bc264', slotClass: 'rarity-rare' },
    { tag: 'SW.Rarity.Unique', label: 'Unique', color: '#a36b2c', glowColor: '#d18d3a', slotClass: 'rarity-unique' },
    { tag: 'SW.Rarity.Special', label: 'Special', color: '#6c3b8a', glowColor: '#9a5cd6', slotClass: 'rarity-special' },
  ] as const;
  ```
  Replace both functions with `getRarityInfo(rarityTag).slotClass`.

### Target D5: Shared Byte Formatter
- **Location**: `src/components/BackupsTab.tsx` (Lines 44–48) and `src/components/GameDataTab.tsx` (Lines 53–58)
- **Action**: Create `src/utils/formatters.ts`:
  ```typescript
  export function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }
  ```

### Target D6: Centralized Mutation & Cloning Utility
- **Location**: `GeneralTab.tsx` and `InventoryTab.tsx`
- **Action**: Replace repeated `JSON.parse(JSON.stringify(x))` with `structuredClone(x)` or a typed helper `clone<T>(data: T): T`.
- Implement immutable item updater helper in `src/core/itemService.ts`:
  ```typescript
  export function updateInventoryEntry(
    save: SaveFile,
    index: number,
    updater: (entry: InventoryEntry) => void
  ): SaveFile {
    const next = structuredClone(save);
    updater(next.CharacterSaveV1.Inventory.Entries[index]);
    return next;
  }
  ```

### Target D7: Shared IPC and Domain Type Definitions
- **Location**: `src/core/types.ts` & `src/electron.d.ts` & `GameDataTab.tsx` & `BackupsTab.tsx`
- **Action**: Export the canonical interfaces from `src/core/types.ts`:
  - `SaveFileInfo`
  - `GameInstallInfo`
  - `GameDataScanResult`
  - `BackupFileInfo`
  - `HistoryRecord`
- Update `electron.d.ts` and components to import from `src/core/types.ts`.

---

## 4. Concrete UI/UX Redesign Proposals (R2)

### Proposal U1: In-Game Rich Item Card Tooltip System
- **Current Problem**: Plain CSS tooltips clip at scroll boundaries and only show the item name in plain text.
- **Redesign**:
  - Implement a React floating `<ItemTooltip>` component (using fixed positioning or portal).
  - Displays a true Minecraft Dungeons styled inspect card:
    - **Header**: Item icon, name in VT323 font colored by rarity, rarity label, category.
    - **Power Level Badge**: Large gold power rating.
    - **Lore/Description**: Flavor text from `gear.json` rendered in styled quotes.
    - **Equipped Status**: Badge indicating slot (`Melee Weapon`, `Armor`, etc.).
    - **Enchantment Preview**: Compact list of currently slotted enchantments with tier icons (I, II, III).
  - Add `<SimpleTooltip content="Help text" shortcut="Ctrl+S">` for all toolbar buttons and settings.

### Proposal U2: Searchable Enchantment Picker with Slot Filtering
- **Current Problem**: 80+ enchantments and effects in a tiny `<select>` dropdown inside squished columns. Incompatible enchantments are offered.
- **Redesign**:
  - Replace native `<select>` with a searchable popover/modal `<EnchantmentPicker>`:
    - Search input (live text filter by name or description).
    - Category tabs (`All`, `Offensive`, `Defensive`, `Utility`, `Enchantments`, `Effects`).
    - Filter options: checkbox for **"Show Compatible Only"** using `getItemEnchantPool(item.TypeTag)` and `getEnchantsForSlot(item.Slot)`.
    - Each item shows icon, name, tier value ranges, and description text.
  - Layout: Re-orient enchantment slots with cleaner cards, clear tier toggle buttons (`[I] [II] [III]`), and a button to "Max All Tiers".

### Proposal U3: General Tab Form Polish & Quick Actions
- **Current Problem**: Unstyled inputs, no validation, raw merchant fields, repetitive layout.
- **Redesign**:
  - **Hero Summary Card**: Displays Character Avatar, Level, Power Level, Difficulty, and Save Version in an immersive game-themed card.
  - **Quick Action Bar**:
    - `Max Currencies` (sets Emeralds, Enchantment Points, Gold, Spring Stones to 999,999).
    - `Level Presets` (quick buttons for Lv.50, Lv.100, Lv.250).
    - `Unlock Village` (sets all merchant upgrade levels to max).
  - **Number Input Component**: Labeled inputs with `+` / `-` increment buttons, range clamping (`min=0, max=2147483647`), and onBlur/Enter commit to avoid flood of undo states.
  - **Merchant Visual Badges**: Render upgrade levels as 1-3 star ratings rather than raw numbers.

### Proposal U4: Inventory Management & Loadout View
- **Current Problem**: 4-column fixed grid with no sorting, hard to distinguish equipped gear from backpack junk.
- **Redesign**:
  - **View Tabs**:
    - `All Items` (grid view with sort controls).
    - `Equipped Loadout` (dedicated character equipment paper-doll view: Melee, Ranged, Armor, 3 Artifacts, 2 Talismans).
  - **Sort Dropdown**: Sort by `Power (High -> Low)`, `Rarity`, `Category`, `Name`.
  - **Search Bar**: Debounced text search with instant count badge (`Showing 12 of 48 items`).
  - **Add Item Modal Upgrade**: Add search input inside the modal to instantly filter the 200+ gear items.

### Proposal U5: Fix React Compiler / Oxlint Closure Warnings
- **Current Problem**: `App.tsx` has 4 compiler warnings due to arrow functions defined after `useEffect`.
- **Redesign**:
  - Hoist `loadSaveList`, `handleUndo`, `handleRedo`, `handleSave` before `useEffect`, or wrap them in `useCallback`.
  - Fix missing dependency warnings.

---

## 5. Caveats

1. **Read-Only Investigation**: No source code was modified during this survey. All proposed refactorings and code replacements must be executed by downstream implementer agents.
2. **Icon Offline Availability**: The current application references remote URLs (`https://www.dungeons.tools/...`). If offline, the fallback SVG rendering is triggered. The SVG fallbacks should remain functional and robust.
3. **Data Dependency**: R2/R4 depend partially on R1 (Database extraction) for description text in tooltips. If an enchantment lacks a description in the local database, the tooltip should gracefully display a fallback string or tier value.

---

## 6. Conclusion

The application has a functional foundation, but suffers from:
1. **Significant Code Redundancy**: 1 completely dead file (`utils/GameData.ts`), 110 lines of dead hardcoded arrays in `types.ts`, duplicate rarity mapping functions, duplicate file size formatters, duplicate type definitions across IPC boundaries, and repetitive deep-cloning patterns.
2. **Usability Bottlenecks**: Tooltips are clipped and underutilized, enchantment editing is cramped and lacks search/filtering, forms allow unbounded inputs without quick actions, and the inventory lacks sorting and a loadout view.

Refactoring these areas into clean, reusable components (`Tooltip`, `ItemCardTooltip`, `EnchantmentPicker`, `NumberStepper`, `formatters.ts`) will directly fulfill requirements **R2** and **R4** with zero regressions to save serialization or application stability.

---

## 7. Verification Method

To independently verify these findings:
1. **Static Build Check**:
   ```powershell
   npm run build
   ```
   *Expected result*: Exits 0 with `dist/` output.
2. **Lint Warning Inspection**:
   ```powershell
   npm run lint
   ```
   *Expected result*: Confirms 10 existing warnings (closure order in `App.tsx:48-50` and unused variables).
3. **Duplication Verification**:
   - Inspect `src/utils/GameData.ts`: verify 0 imports exist in the repo.
   - Inspect `src/core/types.ts`: lines 164–274 (`KNOWN_ITEM_TYPES`, `KNOWN_EFFECT_TYPES`) have 0 callers.
   - Inspect `src/components/InventoryTab.tsx`: lines 86 and 294 contain identical `getRaritySlotClass`.
   - Inspect `src/components/BackupsTab.tsx:44` and `src/components/GameDataTab.tsx:53`: verify identical `formatSize`.
4. **Post-Implementation Regression Check**:
   - Verify all 4 tabs (`General`, `Inventory`, `Backups`, `Game Data`) render without runtime errors.
   - Verify save reading and writing roundtrips successfully.
   - Verify `npm run build` produces 0 fatal errors.
