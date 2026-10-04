# Original User Request

## 2026-10-04T14:16:03Z

# Teamwork Project Prompt — Draft

> Status: Launched
> Goal: Craft prompt → get user approval → delegate to teamwork_preview
> Requested team: [none — teamwork routes from the description]

Complete the MCD2 Save Editor by extracting and integrating all remaining database entities (enchantments, artifacts, etc.), redesigning the UI for maximum usability, fixing the build versioning (currently 0.0.0), reducing code repetition, and conducting a comprehensive bug test.

Working directory: C:\Users\Teknoist\.gemini\antigravity\scratch\Minecraft-Dungeons-2-Save-Editor
Integrity mode: demo

## Requirements

### R1. Comprehensive Database Extraction
Extract all remaining game data (Enchantments, Effects, Artifacts) from the reference databases (Maxroll/mcshuo) and integrate them into the application's local JSON database. The item descriptions, icons, and tags must be fully matched.

### R2. UI/UX Redesign
Improve the user interface to be highly intuitive and easy to use (e.g., cleaner forms, better tooltips). The specific UX decisions are left to the agent team, provided no existing functionality is broken or removed.

### R3. Build and Versioning Fix
Update the project configuration to use proper semantic versioning (greater than 0.0.0) so the final compiled `.exe` reflects the correct version, rather than "0.0.0.exe". 

### R4. Code Deduplication
Identify and refactor areas of the codebase (or UI elements) that suffer from excessive repetition. Consolidate duplicated logic into reusable components or helper functions.

### R5. QA and Bug Testing
Perform a final programmatic pass of bug testing to ensure that save editing, parsing, and writing remain completely functional after the changes.

## Acceptance Criteria

### Data Extraction
- [ ] A programmatic script (e.g., `verify_db.js`) can read the `enchants.json` and `effects.json` files and confirm that >95% of items have a valid, non-empty `Description` string.

### Code Quality & UI
- [ ] An agent-as-judge or static analysis tool confirms that at least one major source of duplication (e.g., repetitive UI mapping or duplicate type definitions) has been refactored into a reusable function/component.

### Build & Versioning
- [ ] The `package.json` file has a `version` field that is not `"0.0.0"`.
- [ ] The Electron builder successfully outputs an executable file that contains the new version number in its filename (e.g., `MCD2 Save Editor Setup 1.1.2.exe`).

### QA & Functionality
- [ ] A test script can successfully load a dummy save file (JSON), modify an item's enchantment via the application's core logic, and write it back without throwing any serialization errors.
- [ ] The React application compiles via `npm run build` with zero fatal Vite/TypeScript errors.
