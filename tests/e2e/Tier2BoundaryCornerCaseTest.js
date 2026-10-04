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
  formatTag
} from './contracts/saveEditorContracts.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const name = 'Tier 2: Boundary, Edge Cases, & Adversarial Verification';

export async function run() {
  console.log(`\n============================================================`);
  console.log(`RUNNING: ${name}`);
  console.log(`============================================================`);

  // --- Test 1: Empty Effects Array Item Enchantment Addition ---
  {
    console.log('-> Test 1: Empty Effects Array Item Enchantment Addition (Adversarial Item Edge Case)');
    const commonItem = {
      ItemData: {
        TypeTag: 'SW.Item.Pickaxe',
        RarityTag: 'SW.Rarity.Common',
        Effects: [], // Completely empty
        GeneratorData: {
          GenesisRandomSeed: 987654321,
          PowerGeneratorValues: { ItemPower: 14 }
        }
      },
      StackCount: 1
    };

    // Adding to slot 1 directly without prior manual ensureItemEffectSlots
    const added = addEnchantmentToItem(commonItem, 1, 'SW.Enchantment.Radiance', 3);
    assert.ok(added, 'Must successfully add enchantment to slot 1 on item with empty Effects');
    assert.equal(commonItem.ItemData.Effects.length, 3, 'Must have auto-expanded to 3 slots');
    assert.equal(commonItem.ItemData.Effects[0].EffectsInThisBatch.length, 0);
    assert.equal(commonItem.ItemData.Effects[1].EffectsInThisBatch.length, 1);
    assert.equal(commonItem.ItemData.Effects[1].EffectsInThisBatch[0].TypeTag, 'SW.Enchantment.Radiance');
    assert.equal(commonItem.ItemData.Effects[1].EffectsInThisBatch[0].Quality, 3);
    assert.equal(commonItem.ItemData.Effects[1].EffectsInThisBatch[0].GeneratorData.GeneratorParentTemplate, 'SW.Enchantment.Radiance.III');
    // Ensure existing GeneratorData is untouched
    assert.equal(commonItem.ItemData.GeneratorData.GenesisRandomSeed, 987654321);
  }

  // --- Test 2: Extreme Currencies & Number Boundaries ---
  {
    console.log('-> Test 2: Extreme Currencies & Number Boundaries (Resource Stress)');
    const save = {
      SerializeMeta: { HardFormat: 'FCharacterSaveV1' },
      CharacterSaveV1: {
        MetaData: { Level: 1 },
        Ability: {
          Attributes: [
            { AttributeName: 'Level', CurrentValue: 1 },
            { AttributeName: 'Emeralds', CurrentValue: 0 },
            { AttributeName: 'SpringStone', CurrentValue: 0 },
            { AttributeName: 'XP', CurrentValue: 0 }
          ]
        }
      }
    };

    // Boundary 1: Max 32-bit signed integer
    const max32Bit = 2147483647;
    setCharacterCurrency(save, 'Emeralds', max32Bit);
    assert.equal(save.CharacterSaveV1.Ability.Attributes.find(a => a.AttributeName === 'Emeralds').CurrentValue, max32Bit);

    // Boundary 2: High floating point precision for XP
    const preciseXP = 987654.32105;
    setCharacterCurrency(save, 'XP', preciseXP);
    assert.equal(save.CharacterSaveV1.Ability.Attributes.find(a => a.AttributeName === 'XP').CurrentValue, preciseXP);

    // Roundtrip verification through JSON serialization
    const serialized = serializeSave(save);
    const parsed = deserializeSave(serialized);
    assert.equal(parsed.CharacterSaveV1.Ability.Attributes.find(a => a.AttributeName === 'Emeralds').CurrentValue, max32Bit);
    assert.equal(parsed.CharacterSaveV1.Ability.Attributes.find(a => a.AttributeName === 'XP').CurrentValue, preciseXP);
  }

  // --- Test 3: Special Characters, Unicode, HTML Entities & Multiline Escapes ---
  {
    console.log('-> Test 3: Special Characters, Unicode, & Escaping Integrity (Encoding Adversarial)');
    const unicodeHeroName = 'Valorie ⚔️ The Undaunted 🛡️ [測試] \u00A9 2026';
    const htmlEntityDescription = 'Mandolin with &#039;special&#039; strings & <script>alert("safe")</script>';
    const multilineBio = 'Hero Bio:\nLine 1: Born in Cacti Canyon\r\nLine 2: Defeated Arch-Illager\t\t[Tabbed]';

    const saveWithSpecialChars = {
      SerializeMeta: { HardFormat: 'FCharacterSaveV1', SoftVersion: 5 },
      CharacterSaveV1: {
        MetaData: {
          CharacterId: unicodeHeroName,
          Notes: htmlEntityDescription,
          Bio: multilineBio
        },
        Ability: { Attributes: [] },
        Inventory: { Entries: [] }
      }
    };

    const serialized = serializeSave(saveWithSpecialChars, true);
    const deserialized = deserializeSave(serialized);

    assert.equal(deserialized.CharacterSaveV1.MetaData.CharacterId, unicodeHeroName);
    assert.equal(deserialized.CharacterSaveV1.MetaData.Notes, htmlEntityDescription);
    assert.equal(deserialized.CharacterSaveV1.MetaData.Bio, multilineBio);
  }

  // --- Test 4: Corrupted, Non-JSON, and Malformed Header Rejection ---
  {
    console.log('-> Test 4: Corrupted, Non-JSON, and Malformed Header Rejection (Failure Cascading)');
    const invalidInputs = [
      '',
      '   ',
      '<!DOCTYPE html><html><body>404 Not Found</body></html>',
      '{"SerializeMeta": {"InternalVersion": 0, "HardFormat":', // Truncated
      '{"someOtherGame": {"Player": "Steve"}}', // Non-MCD2
      'Not JSON at all',
      null,
      undefined,
      12345
    ];

    for (const input of invalidInputs) {
      const headerResult = parseSaveHeader(input);
      assert.equal(headerResult, null, `Input '${input}' must evaluate to null`);
    }

    assert.throws(() => deserializeSave(''), /Invalid JSON string/, 'Empty string must throw on deserializeSave');
    assert.throws(() => deserializeSave('not a json'), /No JSON object found/, 'Non-JSON must throw on deserializeSave');
    assert.throws(() => serializeSave(null), /Cannot serialize null/, 'Null save must throw on serializeSave');
  }

  // --- Test 5: Character Level Clamping & Boundary Normalization ---
  {
    console.log('-> Test 5: Character Level Clamping & Boundary Normalization (Boundary Conditions)');
    const save = {
      SerializeMeta: { HardFormat: 'FCharacterSaveV1' },
      CharacterSaveV1: {
        MetaData: { Level: 10 },
        Ability: {
          Attributes: [{ AttributeName: 'Level', CurrentValue: 10 }]
        }
      }
    };

    // Sub-zero level clamped to 1
    setCharacterLevel(save, -50);
    assert.equal(save.CharacterSaveV1.MetaData.Level, 1);
    assert.equal(save.CharacterSaveV1.Ability.Attributes[0].CurrentValue, 1);

    // Level 0 clamped to 1
    setCharacterLevel(save, 0);
    assert.equal(save.CharacterSaveV1.MetaData.Level, 1);
    assert.equal(save.CharacterSaveV1.Ability.Attributes[0].CurrentValue, 1);

    // Fractional level floored
    setCharacterLevel(save, 75.8);
    assert.equal(save.CharacterSaveV1.MetaData.Level, 75);
    assert.equal(save.CharacterSaveV1.Ability.Attributes[0].CurrentValue, 75);

    // Extreme high level
    setCharacterLevel(save, 1000);
    assert.equal(save.CharacterSaveV1.MetaData.Level, 1000);
    assert.equal(save.CharacterSaveV1.Ability.Attributes[0].CurrentValue, 1000);
  }

  // --- Test 6: Out-of-Bounds Slot and Enchantment Index Handling ---
  {
    console.log('-> Test 6: Out-of-Bounds Slot and Enchantment Index Handling (Robustness)');
    const item = {
      ItemData: {
        TypeTag: 'SW.Item.Scythe',
        Effects: [
          { TypeTag: 'SW.Item.Effect.Rerollable', EffectsInThisBatch: [] }
        ]
      }
    };

    // Negative slot index
    assert.equal(addEnchantmentToItem(item, -1, 'SW.Enchantment.Thundering', 1), null);
    assert.equal(updateEnchantmentOnItem(item, -1, 0, 'SW.Enchantment.Thundering', 1), false);
    assert.equal(removeEnchantmentFromItem(item, -1, 0), false);

    // Slot index >= 3
    assert.equal(addEnchantmentToItem(item, 3, 'SW.Enchantment.Thundering', 1), null);
    assert.equal(addEnchantmentToItem(item, 10, 'SW.Enchantment.Thundering', 1), null);

    // Out-of-bounds enchantIndex inside a valid slot
    assert.equal(updateEnchantmentOnItem(item, 0, 99, 'SW.Enchantment.Thundering', 1), false);
    assert.equal(removeEnchantmentFromItem(item, 0, 99), false);

    // Null item handling
    assert.equal(addEnchantmentToItem(null, 0, 'SW.Enchantment.Thundering', 1), null);
    assert.equal(updateEnchantmentOnItem(null, 0, 0, 'SW.Enchantment.Thundering', 1), false);
    assert.equal(removeEnchantmentFromItem(null, 0, 0), false);
  }

  // --- Test 7: Lossless Preservation of Unknown & Future Save Properties ---
  {
    console.log('-> Test 7: Lossless Preservation of Unknown & Future Save Properties (Forward Compatibility)');
    const futureSave = {
      SerializeMeta: {
        InternalVersion: 0,
        HardFormat: 'FCharacterSaveV1',
        SoftVersion: 99, // Future soft version
        FormatHash: 1764133460,
        FutureEngineHeader: { SubFormat: 'ExperimentalDLC3' }
      },
      CharacterSaveV1: {
        MetaData: {
          CharacterId: 'future-hero-001',
          CustomModData: { ModVersion: '2.5.0', FeaturesUnlocked: ['Pets2', 'Mounts'] }
        },
        Ability: {
          Attributes: [{ AttributeName: 'Level', CurrentValue: 100 }],
          NewMechanicMeter: 450.5
        },
        Inventory: { Entries: [] },
        UnrecognizedFutureField: [1, 2, 3, 4]
      }
    };

    const serialized = serializeSave(futureSave);
    const reloaded = deserializeSave(serialized);

    assert.equal(reloaded.SerializeMeta.SoftVersion, 99);
    assert.deepEqual(reloaded.SerializeMeta.FutureEngineHeader, { SubFormat: 'ExperimentalDLC3' });
    assert.deepEqual(reloaded.CharacterSaveV1.MetaData.CustomModData, { ModVersion: '2.5.0', FeaturesUnlocked: ['Pets2', 'Mounts'] });
    assert.equal(reloaded.CharacterSaveV1.Ability.NewMechanicMeter, 450.5);
    assert.deepEqual(reloaded.CharacterSaveV1.UnrecognizedFutureField, [1, 2, 3, 4]);
  }

  console.log(`\n[SUCCESS] All 7 boundary & adversarial tests in ${name} passed!`);
  return { passed: 7, failed: 0 };
}
