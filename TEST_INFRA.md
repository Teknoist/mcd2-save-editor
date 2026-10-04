# Test Infrastructure & E2E Testing Specification: Minecraft Dungeons 2 Save Editor

## 1. Overview & Architecture

This document specifies the end-to-end (E2E), integration, and contract test infrastructure for the **Minecraft Dungeons 2 Save Editor** desktop application.

The test suite is architected strictly around **opaque-box testing principles**: test cases are derived from user requirements (`ORIGINAL_REQUEST.md`) and architectural interface contracts (`PROJECT.md`), rather than coupled to ephemeral UI implementation details or internal component closures. This guarantees progressive testability across all implementation milestones (M1 through M5) without brittle test breakdowns.

### Dual Execution Pipeline
The project provides two complementary, automated execution pathways:
1. **Master Node E2E Runner**:
   ```bash
   node tests/e2e/runner.js
   ```
   Runs all 4 tiers in sequence using native Node 24 ESM, outputs tabular execution metrics, and exits with code 0 on 100% success or code 1 on failure.
2. **Windows Command Line Wrapper**:
   ```powershell
   .\tests\e2e\runner.bat
   ```
   Provides single-command verification for Windows development and CI environments.

---

## 2. Requirements Traceability Matrix

| Req | Feature Description | Project Feature # | Test Tier | Test Case |
|---|---|---|---|---|
| **R1** | Enchantments Database Schema & Descriptions | Feature 1 | Tier 1, 3 | `Tier1FeatureCoverageTest: Test 1 (Database Extraction Schema Contract)`<br>`Tier3CrossFeatureIntegrationTest: Workflow 4 (Database Catalog Entity Query)` |
| **R1** | Effects Database Schema & Canonical Descriptions | Feature 2 | Tier 1 | `Tier1FeatureCoverageTest: Test 1 (Database Extraction Schema Contract)` |
| **R1** | Gear & Artifacts Coverage (Cinder Scepter) | Feature 3 | Tier 1, 3 | `Tier1FeatureCoverageTest: Test 3 (Gear & Artifacts Structure)`<br>`Tier3CrossFeatureIntegrationTest: Workflow 4 (Database Catalog Entity Query)` |
| **R1** | Database Verification Script Algorithm (>95% check) | Feature 4 | Tier 1 | `Tier1FeatureCoverageTest: Test 2 (Database Completeness Acceptance Verification)` |
| **R1** | TypeScript Models & Tag Formatter (`formatTag`) | Feature 5 | Tier 1 | `Tier1FeatureCoverageTest: Test 4 (Tag Formatter Utility)` |
| **R2** | Multi-Slot UI Normalization & Editing | Feature 9, 14 | Tier 1, 3 | `Tier1FeatureCoverageTest: Test 8 (Multi-Slot Enchantment Normalization)`<br>`Tier3CrossFeatureIntegrationTest: Workflow 2 (Multi-Slot Enchanting Lifecycle)` |
| **R3** | Semantic Versioning Validation (> 0.0.0) | Feature 18 | Tier 1 | `Tier1FeatureCoverageTest: Test 11 (Semantic Versioning Validation)` |
| **R3** | Executable Packaging & Output Path | Feature 19, 20 | Tier 1 | `Tier1FeatureCoverageTest: Test 11 (Semantic Versioning Validation)` |
| **R4** | Pure Save Editing Operations Module | Feature 7 | Tier 1, 2, 3 | `Tier1FeatureCoverageTest: Test 6 (Pure Save Editor Serialization)`<br>`Tier2BoundaryCornerCaseTest: Test 1 (Empty Effects Item Addition)`<br>`Tier3CrossFeatureIntegrationTest: Workflow 1 (Load-Modify-Serialize Roundtrip)` |
| **R4** | Shared Utilities (`formatBytes`, `formatTag`) | Feature 11 | Tier 1, 4 | `Tier1FeatureCoverageTest: Test 10 (Shared Byte Formatter)`<br>`Tier4RealWorldWorkloadTest: Scenario 2 (Dummy Save File Persistence)` |
| **R5** | Save Header Regex Match (Compact & Multiline) | Feature 6 | Tier 1, 2, 3 | `Tier1FeatureCoverageTest: Test 5 (Save Header Detection)`<br>`Tier2BoundaryCornerCaseTest: Test 4 (Malformed Header Rejection)`<br>`Tier3CrossFeatureIntegrationTest: Workflow 1 (Header Verification on Formatted Save)` |
| **R5** | Enchantment Template Namespace Rules | Feature 8 | Tier 1, 3, 4 | `Tier1FeatureCoverageTest: Test 7 (Enchantment Template Namespace Generation)`<br>`Tier3CrossFeatureIntegrationTest: Workflow 1 (Namespace Verification on Reload)`<br>`Tier4RealWorldWorkloadTest: Scenario 1 (Authentic Save Template Integrity)` |
| **R5** | Multi-Slot Normalization on Items with `Effects: []` | Feature 9 | Tier 1, 2, 4 | `Tier1FeatureCoverageTest: Test 8 (Multi-Slot Normalization)`<br>`Tier2BoundaryCornerCaseTest: Test 1 (Empty Effects Item Addition)`<br>`Tier4RealWorldWorkloadTest: Scenario 1 (Authentic Save CaveCrawlerLeggings)` |
| **R5** | Dummy Save Roundtrip without Serialization Errors | Feature 12, 22 | Tier 3, 4 | `Tier3CrossFeatureIntegrationTest: Workflow 1 (Roundtrip Verification)`<br>`Tier4RealWorldWorkloadTest: Scenario 2 (Dummy Save Full User Lifecycle)` |
| **R5** | Vite and TypeScript Zero Fatal Errors (`npm run build`) | Feature 22 | Tier 4 | `Tier4RealWorldWorkloadTest: Scenario 3 (Build & Vite/TypeScript Verification)` |

---

## 3. Test Tier Breakdown

### Tier 1: Feature Coverage (Happy Path Verification)
- **Objective**: Verify standard functionality for all 21 features under valid inputs.
- **Test File**: `tests/e2e/Tier1FeatureCoverageTest.js`
- **Test Cases**:
  1. `Database Extraction Schema Contract`: Verifies `EnchantEntry` and `EffectEntry` fields (`Name`, `Tag`, `Tiers`, `Description`).
  2. `Database Completeness Acceptance Verification`: Validates that the verification algorithm correctly evaluates >95% threshold and flags incomplete files.
  3. `Gear & Artifacts Structure`: Validates `src/data/gear.json` integrity (296 items) and existence of Cinder Scepter (`SW.Item.Artifact.FlameSceptre`).
  4. `Tag Formatter Utility`: Validates canonical humanization of item, enchant, and effect tags.
  5. `Save Header Detection`: Validates regex detection on both compact and multiline indented JSON headers (`{"SerializeMeta"...`).
  6. `Pure Save Editor Serialization & Deserialization`: Validates JSON parsing and stringification modes (compact vs formatted).
  7. `Enchantment Template Namespace Generation`: Validates `SW.Enchantment.*.<Tier>` for enchantments and `SW.EffectTemplate.*.<Tier>` for effects.
  8. `Multi-Slot Enchantment Normalization & Addition`: Validates auto-expansion to 3 slots and insertion into specific slot indexes.
  9. `Character Level & Currency Synchronization`: Validates atomic updates across `MetaData.Level` and `Ability.Attributes`.
  10. `Shared Byte Formatter`: Validates exact byte size conversions (`0 B`, `1.5 KB`, `1 MB`, `1 GB`).
  11. `Semantic Versioning Validation`: Validates rejection of `0.0.0` and acceptance of valid semver strings (`1.1.2`).

### Tier 2: Boundary, Edge Cases, & Adversarial Verification
- **Objective**: Stress-test extreme inputs, data boundary limits, encoding corruptions, and invalid parameters.
- **Test File**: `tests/e2e/Tier2BoundaryCornerCaseTest.js`
- **Test Cases**:
  1. `Empty Effects Array Item Enchantment Addition`: Tests auto-normalization and slot expansion on common items with `Effects: []` without mutating other properties.
  2. `Extreme Currencies & Number Boundaries`: Tests 32-bit integer limits (`2147483647`), high precision floating points (`987654.32105`), and roundtrip precision.
  3. `Special Characters, Unicode, & Escaping Integrity`: Tests character IDs with emojis (`Valorie ⚔️ The Undaunted 🛡️`), HTML entities (`&#039;`), scripts, and multiline escape characters.
  4. `Corrupted, Non-JSON, and Malformed Header Rejection`: Asserts that empty strings, HTML pages, truncated JSON, and non-MCD2 payloads return `null` without throwing unhandled exceptions.
  5. `Character Level Clamping & Boundary Normalization`: Validates clamping negative/zero levels to 1, flooring fractional levels, and supporting high levels (1000).
  6. `Out-of-Bounds Slot and Enchantment Index Handling`: Tests negative and out-of-bounds slot indices (< 0, >= 3) and non-existent enchantment index deletions.
  7. `Lossless Preservation of Unknown & Future Save Properties`: Ensures unexpected future game fields (`FutureEngineHeader`, custom mod data) are preserved during save editing.

### Tier 3: Cross-Feature Integration Workflows
- **Objective**: Validate end-to-end state transitions across combined application subsystems.
- **Test File**: `tests/e2e/Tier3CrossFeatureIntegrationTest.js`
- **Test Cases**:
  1. `Load -> Multi-Item Modify -> Serialize -> Reload Roundtrip`: Modifies an existing enchanted item, enchants a non-enchanted item, adds to a special weapon, serializes to formatted JSON, verifies header detection, re-deserializes, and asserts exact property integrity.
  2. `Multi-Slot Enchanting & Slot Mutation Lifecycle`: Full item lifecycle: populate all 3 slots, mutate middle slot to a different enchantment, remove first slot, reload, and verify slot indices.
  3. `Complete Character Overhaul Transaction`: Atomic single-pass update of character level, 4 currencies, and 3 merchant upgrade levels, serialized and verified.
  4. `Database Catalog Entity Query to Save Injection`: Real database lookup of weapon (`SW.Item.Scythe`) and enchantment (`SW.Enchantment.Thundering`), slot compatibility verification, and item generation.

### Tier 4: Real-World Workload Scenarios
- **Objective**: Execute authentic large-scale workloads and end-to-end build verification.
- **Test File**: `tests/e2e/Tier4RealWorldWorkloadTest.js`
- **Test Cases**:
  1. `Authentic 104KB Real Character Save Roundtrip & Edit`: Real game save blob (`4A78E5E60FE94B14A4AC5A66F2E9EE49`) containing 68 inventory items; performs multi-item edits, serializes, re-parses, and confirms 100% preservation of all items, quest achievements, collections stats, and cosmetic skins.
  2. `Dummy Save Full User Editing Lifecycle`: Complete user workflow from disk read, editing stats/inventory, saving to a temporary backup file, validating file size, and cleanup.
  3. `Build & Vite/TypeScript Verification`: Programmatic invocation of `npm run build`, verifying clean Vite compilation, bundle emission in `dist/assets`, and zero TypeScript diagnostics.

---

## 4. Test Suite Inventory

| File Path | Language | Purpose | Test Cases |
|---|---|---|---|
| `tests/e2e/contracts/saveEditorContracts.js` | JavaScript (ESM) | Authoritative Interface Contracts & Reference Oracle | 15 Functions |
| `tests/e2e/fixtures/dummy_save.json` | JSON | Clean, self-contained authentic dummy save fixture | 3 Items |
| `tests/e2e/fixtures/real_character_save.json` | JSON | Authentic 104KB game save blob from active system | 68 Items |
| `tests/e2e/Tier1FeatureCoverageTest.js` | JavaScript (ESM) | Tier 1: Feature Coverage (Happy Path Verification) | 11 Cases |
| `tests/e2e/Tier2BoundaryCornerCaseTest.js` | JavaScript (ESM) | Tier 2: Boundary, Edge Cases, & Adversarial Verification | 7 Cases |
| `tests/e2e/Tier3CrossFeatureIntegrationTest.js` | JavaScript (ESM) | Tier 3: Cross-Feature Integration Workflows | 4 Cases |
| `tests/e2e/Tier4RealWorldWorkloadTest.js` | JavaScript (ESM) | Tier 4: Real-World Workload Scenarios | 3 Cases |
| `tests/e2e/runner.js` | JavaScript (ESM) | Master E2E Automated Test Runner CLI | Runner |
| `tests/e2e/runner.bat` | Windows Batch | Windows Execution Wrapper | Wrapper |

**Total Comprehensive Test Cases**: **25**

---

## 5. Execution Instructions

### A. Run via Master Test Runner
```bash
node tests/e2e/runner.js
```

### B. Run via Windows Batch File
```powershell
.\tests\e2e\runner.bat
```

### C. Run Individual Test Tiers
```bash
node -e "import('./tests/e2e/Tier1FeatureCoverageTest.js').then(m => m.run());"
node -e "import('./tests/e2e/Tier2BoundaryCornerCaseTest.js').then(m => m.run());"
node -e "import('./tests/e2e/Tier3CrossFeatureIntegrationTest.js').then(m => m.run());"
node -e "import('./tests/e2e/Tier4RealWorldWorkloadTest.js').then(m => m.run());"
```

---

## 6. Authoritative Sources of Truth for Expected Outputs

1. **Save Header Format**: Compact JSON (`{"SerializeMeta"...`) and multiline formatted JSON (`{\n  "SerializeMeta"...`) must both evaluate to true against `/^\s*\{\s*"SerializeMeta"/`.
2. **Template Namespaces**:
   - `SW.Enchantment.<Name>` -> `SW.Enchantment.<Name>.<Tier>`
   - `SW.Effect.<Name>` -> `SW.EffectTemplate.<Name>.<Tier>`
3. **Database Completeness**: `enchants.json` and `effects.json` must contain valid non-empty description strings for >95% of entries.
4. **UTF-8 BOM Compatibility**: Files with `\uFEFF` byte order marks must be stripped before parsing to avoid JSON syntax errors.
5. **Level Synchronization**: Level updates must mutate both `CharacterSaveV1.MetaData.Level` and `CharacterSaveV1.Ability.Attributes[AttributeName: "Level"]`.
6. **Semantic Versioning**: `package.json` version must be greater than `"0.0.0"`.

---

## 7. Pass / Fail Criteria & Defect Escalation

- **Pass Criterion**: 100% of test cases (25 / 25) must exit with code 0 and zero unhandled exceptions.
- **Defect Escalation**: Test writer writes test code only. Any defects found in implementation code files (`src/` or `electron/`) are escalated to the milestone implementing agents via handoff report.
