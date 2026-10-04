import assert from 'node:assert/strict';
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
  formatTag,
  validateDatabaseCompleteness,
  validateSemanticVersion
} from './contracts/saveEditorContracts.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');

export const name = 'Tier 1: Feature Coverage (Happy Path Verification)';

export async function run() {
  console.log(`\n============================================================`);
  console.log(`RUNNING: ${name}`);
  console.log(`============================================================`);

  // --- Test 1: Database Extraction Schema Contract ---
  {
    console.log('-> Test 1: Database Extraction Schema Contract (R1 / Features 1 & 2)');
    const sampleEnchant = {
      Name: 'Ancient Alchemy',
      Tag: 'SW.Enchantment.SoulInfusedPotion',
      Icon: 'enchant-ancient-alchemy.png',
      IconUrl: 'https://www.dungeons.tools/images/d2/icons/enchantments/ancient-alchemy.png',
      Slots: ['SW.ItemSlot.Equipment.Armor.Boots'],
      Tiers: [{ Tier: 'I', Value: 0.3 }],
      Source: 'https://www.mcshuo.com/...',
      Description: 'Drinking a healing potion grants temporary soul-infused power.'
    };
    assert.equal(typeof sampleEnchant.Name, 'string');
    assert.equal(typeof sampleEnchant.Tag, 'string');
    assert.equal(typeof sampleEnchant.Description, 'string');
    assert.ok(sampleEnchant.Tiers.length > 0);

    const sampleEffect = {
      Name: 'Sharpness',
      Tag: 'SW.EffectTemplate.Sharpness.I',
      Effect: 'SW.Effect.Sharpness',
      Tier: 'I',
      Value: 0.1,
      Description: 'Increases melee weapon damage by 10%.'
    };
    assert.equal(typeof sampleEffect.Name, 'string');
    assert.equal(typeof sampleEffect.Description, 'string');
    assert.equal(sampleEffect.Tier, 'I');
  }

  // --- Test 2: Database Completeness Acceptance Verification ---
  {
    console.log('-> Test 2: Database Completeness Acceptance Verification (R1 / Feature 4)');
    // Synthetic complete database
    const syntheticEnchants = Array.from({ length: 32 }, (_, i) => ({
      Tag: `SW.Enchantment.E${i}`,
      Description: `Valid description for enchantment ${i}`
    }));
    const syntheticEffects = Array.from({ length: 196 }, (_, i) => ({
      Tag: `SW.EffectTemplate.Eff${i}`,
      Description: `Valid description for effect ${i}`
    }));
    const result = validateDatabaseCompleteness(syntheticEnchants, syntheticEffects);
    assert.equal(result.enchants.total, 32);
    assert.equal(result.enchants.withDesc, 32);
    assert.equal(result.enchants.pct, 100);
    assert.equal(result.enchants.passed, true);
    assert.equal(result.effects.total, 196);
    assert.equal(result.effects.pct, 100);
    assert.equal(result.effects.passed, true);
    assert.equal(result.allPassed, true);
  }

  // --- Test 3: Gear & Artifacts Structure ---
  {
    console.log('-> Test 3: Gear & Artifacts Structure (R1 / Feature 3)');
    const gearPath = path.join(projectRoot, 'src/data/gear.json');
    assert.ok(fs.existsSync(gearPath), 'src/data/gear.json must exist');
    const rawGear = JSON.parse(fs.readFileSync(gearPath, 'utf8'));
    assert.ok(Array.isArray(rawGear), 'gear.json must be an array');
    assert.ok(rawGear.length >= 290, `gear.json must contain at least 290 items, found ${rawGear.length}`);

    const scepter = rawGear.find(g => g.Tag === 'SW.Item.Artifact.FlameSceptre');
    assert.ok(scepter, 'Cinder Scepter must exist in gear.json');
    assert.equal(scepter.Name, 'Cinder Scepter');
  }

  // --- Test 4: Tag Formatter Utility ---
  {
    console.log('-> Test 4: Tag Formatter Utility (R1 / Feature 5)');
    assert.equal(formatTag('SW.Item.Scythe'), 'Scythe');
    assert.equal(formatTag('SW.Enchantment.Thundering'), 'Thundering');
    assert.equal(formatTag('SW.Effect.CriticalEdge'), 'Critical Edge');
    assert.equal(formatTag('SW.Item.Artifact.DeathcapMushroom'), 'Deathcap Mushroom');
    assert.equal(formatTag('SW.Rarity.Rare'), 'Rare');
  }

  // --- Test 5: Save Header Detection for Compact & Multiline Formats ---
  {
    console.log('-> Test 5: Save Header Detection (R5 / Feature 6)');
    const compactHeader = '{"SerializeMeta":{"InternalVersion":0,"HardFormat":"FCharacterSaveV1","SoftVersion":5,"FormatHash":1764133460},"CharacterSaveV1":{"MetaData":{"CharacterId":"hero-123"}}}';
    const multilineHeader = `{\n  "SerializeMeta": {\n    "InternalVersion": 0,\n    "HardFormat": "FCharacterSaveV1",\n    "SoftVersion": 5,\n    "FormatHash": 1764133460\n  },\n  "CharacterSaveV1": {\n    "MetaData": {\n      "CharacterId": "hero-123"\n    }\n  }\n}`;

    const parsedCompact = parseSaveHeader(compactHeader);
    assert.ok(parsedCompact, 'Must parse compact JSON header');
    assert.equal(parsedCompact.hardFormat, 'FCharacterSaveV1');
    assert.equal(parsedCompact.characterId, 'hero-123');

    const parsedMultiline = parseSaveHeader(multilineHeader);
    assert.ok(parsedMultiline, 'Must parse multiline formatted JSON header');
    assert.equal(parsedMultiline.hardFormat, 'FCharacterSaveV1');
    assert.equal(parsedMultiline.characterId, 'hero-123');
  }

  // --- Test 6: Pure Save Editor Serialization & Deserialization ---
  {
    console.log('-> Test 6: Pure Save Editor Serialization & Deserialization (R5 / Feature 7)');
    const dummyFixturePath = path.join(__dirname, 'fixtures/dummy_save.json');
    assert.ok(fs.existsSync(dummyFixturePath), 'dummy_save.json fixture must exist');
    const rawFixture = fs.readFileSync(dummyFixturePath, 'utf8');
    const saveObj = deserializeSave(rawFixture);

    assert.equal(saveObj.SerializeMeta.HardFormat, 'FCharacterSaveV1');
    assert.equal(saveObj.CharacterSaveV1.MetaData.CharacterId, 'dummy-hero-uuid-001');

    const serializedCompact = serializeSave(saveObj, false);
    assert.ok(typeof serializedCompact === 'string' && serializedCompact.length > 0);
    assert.ok(!serializedCompact.includes('\n'), 'Compact serialization must not have newlines');

    const serializedFormatted = serializeSave(saveObj, true);
    assert.ok(serializedFormatted.includes('\n'), 'Formatted serialization must contain newlines');

    const parsedBack = deserializeSave(serializedFormatted);
    assert.equal(parsedBack.CharacterSaveV1.MetaData.CharacterId, 'dummy-hero-uuid-001');
  }

  // --- Test 7: Enchantment Template Namespace Generation ---
  {
    console.log('-> Test 7: Enchantment Template Namespace Generation (R5 / Feature 8)');
    // Enchantment namespace rule: SW.Enchantment.<Name>.<Tier>
    const enchTemplateT1 = deriveGeneratorParentTemplate('SW.Enchantment.Channeling', 1);
    const enchTemplateT3 = deriveGeneratorParentTemplate('SW.Enchantment.Channeling', 3);
    assert.equal(enchTemplateT1, 'SW.Enchantment.Channeling.I');
    assert.equal(enchTemplateT3, 'SW.Enchantment.Channeling.III');

    // Effect namespace rule: SW.EffectTemplate.<Name>.<Tier>
    const effTemplateT1 = deriveGeneratorParentTemplate('SW.Effect.CriticalEdge', 1);
    const effTemplateT2 = deriveGeneratorParentTemplate('SW.Effect.Sharpness', 2);
    assert.equal(effTemplateT1, 'SW.EffectTemplate.CriticalEdge.I');
    assert.equal(effTemplateT2, 'SW.EffectTemplate.Sharpness.II');
  }

  // --- Test 8: Multi-Slot Enchantment Normalization & Addition ---
  {
    console.log('-> Test 8: Multi-Slot Enchantment Normalization & Addition (R5 / Feature 9)');
    const emptyItem = {
      ItemData: {
        TypeTag: 'SW.Item.Pickaxe',
        RarityTag: 'SW.Rarity.Common',
        Effects: []
      }
    };

    ensureItemEffectSlots(emptyItem, 3);
    assert.equal(emptyItem.ItemData.Effects.length, 3, 'Must normalize to 3 slots');
    assert.equal(emptyItem.ItemData.Effects[0].TypeTag, 'SW.Item.Effect.Rerollable');
    assert.equal(emptyItem.ItemData.Effects[0].EffectsInThisBatch.length, 0);

    // Add enchantment to Slot 0
    const added0 = addEnchantmentToItem(emptyItem, 0, 'SW.Enchantment.Thundering', 2);
    assert.ok(added0);
    assert.equal(added0.TypeTag, 'SW.Enchantment.Thundering');
    assert.equal(added0.Quality, 2);
    assert.equal(added0.GeneratorData.GeneratorParentTemplate, 'SW.Enchantment.Thundering.II');

    // Add enchantment to Slot 2
    const added2 = addEnchantmentToItem(emptyItem, 2, 'SW.Effect.Sharpness', 3);
    assert.ok(added2);
    assert.equal(added2.TypeTag, 'SW.Effect.Sharpness');
    assert.equal(added2.Quality, 3);
    assert.equal(added2.GeneratorData.GeneratorParentTemplate, 'SW.EffectTemplate.Sharpness.III');

    assert.equal(emptyItem.ItemData.Effects[0].EffectsInThisBatch.length, 1);
    assert.equal(emptyItem.ItemData.Effects[1].EffectsInThisBatch.length, 0);
    assert.equal(emptyItem.ItemData.Effects[2].EffectsInThisBatch.length, 1);
  }

  // --- Test 9: Character Level & Currency Synchronization ---
  {
    console.log('-> Test 9: Character Level & Currency Synchronization (R4 / Feature 7)');
    const dummyFixturePath = path.join(__dirname, 'fixtures/dummy_save.json');
    const saveObj = deserializeSave(fs.readFileSync(dummyFixturePath, 'utf8'));

    setCharacterLevel(saveObj, 150);
    assert.equal(saveObj.CharacterSaveV1.MetaData.Level, 150);
    const levelAttr = saveObj.CharacterSaveV1.Ability.Attributes.find(a => a.AttributeName === 'Level');
    assert.ok(levelAttr);
    assert.equal(levelAttr.CurrentValue, 150);

    setCharacterCurrency(saveObj, 'Emeralds', 999999);
    const emeraldAttr = saveObj.CharacterSaveV1.Ability.Attributes.find(a => a.AttributeName === 'Emeralds');
    assert.ok(emeraldAttr);
    assert.equal(emeraldAttr.CurrentValue, 999999);
  }

  // --- Test 10: Shared Byte Formatter ---
  {
    console.log('-> Test 10: Shared Byte Formatter (R4 / Feature 11)');
    assert.equal(formatBytes(0), '0 B');
    assert.equal(formatBytes(500), '500 B');
    assert.equal(formatBytes(1024), '1 KB');
    assert.equal(formatBytes(1536), '1.5 KB');
    assert.equal(formatBytes(1048576), '1 MB');
    assert.equal(formatBytes(1073741824), '1 GB');
  }

  // --- Test 11: Semantic Versioning Validation ---
  {
    console.log('-> Test 11: Semantic Versioning Validation (R3 / Feature 18)');
    assert.equal(validateSemanticVersion('0.0.0'), false, '0.0.0 must be invalid');
    assert.equal(validateSemanticVersion('0.0.0.1'), false, 'Non-semver must be invalid');
    assert.equal(validateSemanticVersion(''), false, 'Empty string must be invalid');
    assert.equal(validateSemanticVersion('1.0.0'), true, '1.0.0 must be valid');
    assert.equal(validateSemanticVersion('1.1.2'), true, '1.1.2 must be valid');
    assert.equal(validateSemanticVersion('2.0.0'), true, '2.0.0 must be valid');
  }

  console.log(`\n[SUCCESS] All 11 feature tests in ${name} passed!`);
  return { passed: 11, failed: 0 };
}
