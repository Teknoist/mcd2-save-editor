import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  ensureItemEffectSlots,
  deriveGeneratorParentTemplate,
  createEnchantmentEffect,
  addEnchantmentToItem,
  updateEnchantmentOnItem,
  removeEnchantmentFromItem,
  setCharacterLevel,
  setCharacterCurrency,
  serializeSave,
  deserializeSave,
  parseSaveHeader,
  formatBytes,
  formatTag
} from './contracts/saveEditorContracts.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');

export const name = 'Tier 4: Real-World Workload Scenarios';

export async function run() {
  console.log(`\n============================================================`);
  console.log(`RUNNING: ${name}`);
  console.log(`============================================================`);

  // --- Scenario 1: Authentic 104KB Real Character Save Roundtrip & Edit ---
  {
    console.log('-> Scenario 1: Authentic 104KB Real Character Save Roundtrip & Edit (Real-World Stress)');
    const realSavePath = path.join(__dirname, 'fixtures/real_character_save.json');
    assert.ok(fs.existsSync(realSavePath), 'real_character_save.json must exist');

    const originalRaw = fs.readFileSync(realSavePath, 'utf8');
    const originalSave = deserializeSave(originalRaw);

    // Initial state assertions
    assert.equal(originalSave.SerializeMeta.HardFormat, 'FCharacterSaveV1');
    assert.equal(originalSave.SerializeMeta.FormatHash, 1764133460);
    assert.equal(originalSave.CharacterSaveV1.MetaData.Level, 21);
    const initialItemCount = originalSave.CharacterSaveV1.Inventory.Entries.length;
    assert.equal(initialItemCount, 68, 'Authentic save must contain 68 inventory items');

    // 1. Level up from 21 to 55
    setCharacterLevel(originalSave, 55);

    // 2. Adjust currencies
    setCharacterCurrency(originalSave, 'Emeralds', 250000);
    setCharacterCurrency(originalSave, 'SpringStone', 1500);

    // 3. Edit Item 14 (CaveCrawlerLeggings with Effects: [])
    const commonItem = originalSave.CharacterSaveV1.Inventory.Entries[14];
    assert.equal(commonItem.ItemData.TypeTag, 'SW.Item.CaveCrawlerLeggings');
    assert.equal(commonItem.ItemData.Effects.length, 0);

    const added = addEnchantmentToItem(commonItem, 0, 'SW.Enchantment.Radiance', 2);
    assert.ok(added);
    assert.equal(commonItem.ItemData.Effects[0].EffectsInThisBatch[0].GeneratorData.GeneratorParentTemplate, 'SW.Enchantment.Radiance.II');

    // 4. Edit Item 47 (SW.Item.Claws_Unique1) Slot 2 enchantment
    const uniqueItem = originalSave.CharacterSaveV1.Inventory.Entries[47];
    assert.equal(uniqueItem.ItemData.TypeTag, 'SW.Item.Claws_Unique1');
    const channelEff = uniqueItem.ItemData.Effects[2].EffectsInThisBatch[0];
    assert.equal(channelEff.TypeTag, 'SW.Enchantment.Channeling');

    updateEnchantmentOnItem(uniqueItem, 2, 0, 'SW.Enchantment.Channeling', 3);
    assert.equal(channelEff.Quality, 3);
    assert.equal(channelEff.GeneratorData.GeneratorParentTemplate, 'SW.Enchantment.Channeling.III');

    // 5. Serialize to compact
    const serializedCompact = serializeSave(originalSave, false);
    assert.ok(serializedCompact.length > 90000, `Serialized payload should be >90KB, was ${serializedCompact.length}`);
    const compactHeader = parseSaveHeader(serializedCompact);
    assert.ok(compactHeader);
    assert.equal(compactHeader.characterId, originalSave.CharacterSaveV1.MetaData.CharacterId);

    // 6. Serialize to formatted multiline
    const serializedMultiline = serializeSave(originalSave, true);
    const multilineHeader = parseSaveHeader(serializedMultiline);
    assert.ok(multilineHeader);
    assert.equal(multilineHeader.characterId, originalSave.CharacterSaveV1.MetaData.CharacterId);

    // 7. Reload and verify deep preservation
    const reloaded = deserializeSave(serializedMultiline);
    assert.equal(reloaded.CharacterSaveV1.Inventory.Entries.length, 68);
    assert.equal(reloaded.CharacterSaveV1.MetaData.Level, 55);
    assert.equal(reloaded.CharacterSaveV1.Ability.Attributes.find(a => a.AttributeName === 'Level').CurrentValue, 55);
    assert.equal(reloaded.CharacterSaveV1.Ability.Attributes.find(a => a.AttributeName === 'Emeralds').CurrentValue, 250000);

    // Verify quest achievements and collections stats untouched
    assert.equal(reloaded.CharacterSaveV1.Achievements.QuestAchievements['SW.Achievements.CompleteTheCoreQuest'].bCompleted, false);
    assert.equal(reloaded.CharacterSaveV1.Achievements.QuestAchievements['SW.Achievements.CompleteTheSoulCandleConspiracyQuest'].bCompleted, true);
    assert.ok(reloaded.CharacterSaveV1.CollectionsStats.CollectedWeaponsUnique.includes('SW.Item.Claws_Unique1'));
    assert.equal(reloaded.CharacterSaveV1.Cosmetics.Cosmetics['SW.Skin'].TypeTag, 'SW.Skin.Valorie');
  }

  // --- Scenario 2: Dummy Save Full User Editing Lifecycle ---
  {
    console.log('-> Scenario 2: Dummy Save Full User Editing Lifecycle (File Persistence & Backup Simulation)');
    const dummyPath = path.join(__dirname, 'fixtures/dummy_save.json');
    const save = deserializeSave(fs.readFileSync(dummyPath, 'utf8'));

    // Step A: Modify properties
    setCharacterLevel(save, 75);
    setCharacterCurrency(save, 'Emeralds', 123456);

    // Step B: Write to temporary file
    const tempFilePath = path.join(__dirname, 'fixtures/temp_test_save.json');
    try {
      fs.writeFileSync(tempFilePath, serializeSave(save, true), 'utf8');
      assert.ok(fs.existsSync(tempFilePath));

      // Step C: Read back as if opening via electron main IPC
      const fileContent = fs.readFileSync(tempFilePath, 'utf8');
      const loadedSave = deserializeSave(fileContent);
      assert.equal(loadedSave.CharacterSaveV1.MetaData.Level, 75);
      assert.equal(loadedSave.CharacterSaveV1.Ability.Attributes.find(a => a.AttributeName === 'Emeralds').CurrentValue, 123456);

      // Verify file size via formatBytes
      const stats = fs.statSync(tempFilePath);
      const formattedSize = formatBytes(stats.size);
      assert.ok(formattedSize.includes('KB') || formattedSize.includes('B'));
    } finally {
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    }
  }

  // --- Scenario 3: Build & Vite/TypeScript Verification ---
  {
    console.log('-> Scenario 3: Build & Vite/TypeScript Verification (R5 / Acceptance Criteria)');
    console.log('   Executing "npm run build" to verify zero fatal compilation errors...');
    const buildOutput = execSync('npm run build', {
      cwd: projectRoot,
      encoding: 'utf8',
      stdio: 'pipe'
    });
    assert.ok(buildOutput.includes('built in') || buildOutput.includes('dist/index.html'), 'Build must succeed');

    const distIndex = path.join(projectRoot, 'dist/index.html');
    assert.ok(fs.existsSync(distIndex), 'dist/index.html must exist');
    const indexContent = fs.readFileSync(distIndex, 'utf8');
    assert.ok(indexContent.length > 100, 'dist/index.html must not be empty');

    const distAssets = path.join(projectRoot, 'dist/assets');
    assert.ok(fs.existsSync(distAssets), 'dist/assets must exist');
    const assets = fs.readdirSync(distAssets);
    assert.ok(assets.some(f => f.endsWith('.js')), 'dist/assets must contain JS bundles');
    assert.ok(assets.some(f => f.endsWith('.css')), 'dist/assets must contain CSS bundles');
    console.log('   Vite and TypeScript compilation passed cleanly!');
  }

  console.log(`\n[SUCCESS] All 3 real-world workload scenarios in ${name} passed!`);
  return { passed: 3, failed: 0 };
}
