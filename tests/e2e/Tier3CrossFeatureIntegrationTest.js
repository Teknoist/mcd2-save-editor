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
const projectRoot = path.resolve(__dirname, '../..');

export const name = 'Tier 3: Cross-Feature Integration Workflows';

export async function run() {
  console.log(`\n============================================================`);
  console.log(`RUNNING: ${name}`);
  console.log(`============================================================`);

  // --- Workflow 1: Load -> Multi-Item Modify -> Serialize -> Reload Roundtrip ---
  {
    console.log('-> Workflow 1: Load -> Multi-Item Modify -> Serialize -> Reload Roundtrip (R5 / Acceptance Criteria)');
    const dummyPath = path.join(__dirname, 'fixtures/dummy_save.json');
    const originalText = fs.readFileSync(dummyPath, 'utf8');
    const save = deserializeSave(originalText);

    // Modify Item 0 (SW.Item.Scythe) Slot 0 existing enchantment
    const item0 = save.CharacterSaveV1.Inventory.Entries[0];
    const updateOk = updateEnchantmentOnItem(item0, 0, 0, 'SW.Enchantment.Channeling', 3);
    assert.ok(updateOk, 'Must update existing enchantment on Item 0');

    // Modify Item 1 (SW.Item.Pickaxe with empty Effects) Slot 0
    const item1 = save.CharacterSaveV1.Inventory.Entries[1];
    assert.equal(item1.ItemData.Effects.length, 0);
    const addedItem1 = addEnchantmentToItem(item1, 0, 'SW.Effect.Sharpness', 2);
    assert.ok(addedItem1, 'Must add enchantment to item with empty Effects');

    // Modify Item 2 (SW.Item.HeavyCrossbow) Slot 1
    const item2 = save.CharacterSaveV1.Inventory.Entries[2];
    const addedItem2 = addEnchantmentToItem(item2, 1, 'SW.Enchantment.Ricochet', 1);
    assert.ok(addedItem2, 'Must add enchantment to slot 1');

    // Serialize to multiline formatted JSON
    const serializedMultiline = serializeSave(save, true);
    assert.ok(serializedMultiline.length > 0);

    // Verify Save Header Parser detects multiline formatted JSON
    const header = parseSaveHeader(serializedMultiline);
    assert.ok(header, 'parseSaveHeader must recognize formatted save');
    assert.equal(header.hardFormat, 'FCharacterSaveV1');
    assert.equal(header.characterId, 'dummy-hero-uuid-001');

    // Deserialize and verify state integrity
    const reloaded = deserializeSave(serializedMultiline);
    const reloadedItem0 = reloaded.CharacterSaveV1.Inventory.Entries[0];
    assert.equal(reloadedItem0.ItemData.Effects[0].EffectsInThisBatch[0].TypeTag, 'SW.Enchantment.Channeling');
    assert.equal(reloadedItem0.ItemData.Effects[0].EffectsInThisBatch[0].Quality, 3);
    assert.equal(reloadedItem0.ItemData.Effects[0].EffectsInThisBatch[0].GeneratorData.GeneratorParentTemplate, 'SW.Enchantment.Channeling.III');

    const reloadedItem1 = reloaded.CharacterSaveV1.Inventory.Entries[1];
    assert.equal(reloadedItem1.ItemData.Effects.length, 3);
    assert.equal(reloadedItem1.ItemData.Effects[0].EffectsInThisBatch[0].TypeTag, 'SW.Effect.Sharpness');
    assert.equal(reloadedItem1.ItemData.Effects[0].EffectsInThisBatch[0].Quality, 2);
    assert.equal(reloadedItem1.ItemData.Effects[0].EffectsInThisBatch[0].GeneratorData.GeneratorParentTemplate, 'SW.EffectTemplate.Sharpness.II');

    const reloadedItem2 = reloaded.CharacterSaveV1.Inventory.Entries[2];
    assert.equal(reloadedItem2.ItemData.Effects[1].EffectsInThisBatch.length, 2);
  }

  // --- Workflow 2: Multi-Slot Enchanting & Slot Mutation Lifecycle ---
  {
    console.log('-> Workflow 2: Multi-Slot Enchanting & Slot Mutation Lifecycle (Full Gear Flow)');
    const armorItem = {
      ItemData: {
        TypeTag: 'SW.Item.PhantomChest',
        RarityTag: 'SW.Rarity.Rare',
        Effects: []
      },
      StackCount: 1
    };

    // Populate all 3 slots
    addEnchantmentToItem(armorItem, 0, 'SW.Enchantment.Protection', 3);
    addEnchantmentToItem(armorItem, 1, 'SW.Effect.Deflect', 2);
    addEnchantmentToItem(armorItem, 2, 'SW.Enchantment.Cooldown', 1);

    assert.equal(armorItem.ItemData.Effects[0].EffectsInThisBatch[0].TypeTag, 'SW.Enchantment.Protection');
    assert.equal(armorItem.ItemData.Effects[0].EffectsInThisBatch[0].GeneratorData.GeneratorParentTemplate, 'SW.Enchantment.Protection.III');
    assert.equal(armorItem.ItemData.Effects[1].EffectsInThisBatch[0].TypeTag, 'SW.Effect.Deflect');
    assert.equal(armorItem.ItemData.Effects[1].EffectsInThisBatch[0].GeneratorData.GeneratorParentTemplate, 'SW.EffectTemplate.Deflect.II');
    assert.equal(armorItem.ItemData.Effects[2].EffectsInThisBatch[0].TypeTag, 'SW.Enchantment.Cooldown');
    assert.equal(armorItem.ItemData.Effects[2].EffectsInThisBatch[0].GeneratorData.GeneratorParentTemplate, 'SW.Enchantment.Cooldown.I');

    // Mutate Slot 1 to a different enchantment
    const updated = updateEnchantmentOnItem(armorItem, 1, 0, 'SW.Enchantment.Thundering', 3);
    assert.ok(updated);
    assert.equal(armorItem.ItemData.Effects[1].EffectsInThisBatch[0].TypeTag, 'SW.Enchantment.Thundering');
    assert.equal(armorItem.ItemData.Effects[1].EffectsInThisBatch[0].GeneratorData.GeneratorParentTemplate, 'SW.Enchantment.Thundering.III');

    // Remove enchantment from Slot 0
    const removed = removeEnchantmentFromItem(armorItem, 0, 0);
    assert.ok(removed);
    assert.equal(armorItem.ItemData.Effects[0].EffectsInThisBatch.length, 0);
    assert.equal(armorItem.ItemData.Effects[1].EffectsInThisBatch.length, 1);
    assert.equal(armorItem.ItemData.Effects[2].EffectsInThisBatch.length, 1);
  }

  // --- Workflow 3: Complete Character Overhaul Transaction ---
  {
    console.log('-> Workflow 3: Complete Character Overhaul Transaction (Level, Currencies, Merchants)');
    const dummyPath = path.join(__dirname, 'fixtures/dummy_save.json');
    const save = deserializeSave(fs.readFileSync(dummyPath, 'utf8'));

    // 1. Level upgrade
    setCharacterLevel(save, 100);

    // 2. Currencies
    setCharacterCurrency(save, 'Emeralds', 999999);
    setCharacterCurrency(save, 'SpringStone', 5000);
    setCharacterCurrency(save, 'EnchantmentPoints', 50);

    // 3. Merchants
    setCharacterCurrency(save, 'VillageMerchantUpgradeLevel', 5);
    setCharacterCurrency(save, 'EnchantsmithUpgradeLevel', 5);
    setCharacterCurrency(save, 'OldBlacksmithUpgradeLevel', 5);

    // Serialize and verify
    const serialized = serializeSave(save, false);
    assert.ok(/^\s*\{\s*"SerializeMeta"/.test(serialized));

    const reloaded = deserializeSave(serialized);
    assert.equal(reloaded.CharacterSaveV1.MetaData.Level, 100);
    const attrs = reloaded.CharacterSaveV1.Ability.Attributes;
    assert.equal(attrs.find(a => a.AttributeName === 'Level').CurrentValue, 100);
    assert.equal(attrs.find(a => a.AttributeName === 'Emeralds').CurrentValue, 999999);
    assert.equal(attrs.find(a => a.AttributeName === 'SpringStone').CurrentValue, 5000);
    assert.equal(attrs.find(a => a.AttributeName === 'EnchantmentPoints').CurrentValue, 50);
    assert.equal(attrs.find(a => a.AttributeName === 'VillageMerchantUpgradeLevel').CurrentValue, 5);
    assert.equal(attrs.find(a => a.AttributeName === 'EnchantsmithUpgradeLevel').CurrentValue, 5);
    assert.equal(attrs.find(a => a.AttributeName === 'OldBlacksmithUpgradeLevel').CurrentValue, 5);
  }

  // --- Workflow 4: Database Catalog Entity Query to Save Injection ---
  {
    console.log('-> Workflow 4: Database Catalog Entity Query to Save Injection (Data Integration)');
    const gearPath = path.join(projectRoot, 'src/data/gear.json');
    const enchantsPath = path.join(projectRoot, 'src/data/enchants.json');
    const gearDb = JSON.parse(fs.readFileSync(gearPath, 'utf8').replace(/^\uFEFF/, ''));
    const enchantsDb = JSON.parse(fs.readFileSync(enchantsPath, 'utf8').replace(/^\uFEFF/, ''));

    // Pick weapon from DB
    const scytheFromDb = gearDb.find(g => g.Tag === 'SW.Item.Scythe');
    assert.ok(scytheFromDb, 'SW.Item.Scythe must exist in database');

    // Pick enchantment from DB
    const thundering = enchantsDb.find(e => e.Tag === 'SW.Enchantment.Thundering' || e.Name === 'Thundering') || {
      Tag: 'SW.Enchantment.Thundering',
      Name: 'Thundering',
      Slots: ['SW.ItemSlot.Equipment.Weapon.Melee']
    };

    const newItem = {
      ItemData: {
        TypeTag: scytheFromDb.Tag,
        RarityTag: 'SW.Rarity.Rare',
        Effects: []
      },
      StackCount: 1
    };

    addEnchantmentToItem(newItem, 0, thundering.Tag, 3);
    assert.equal(newItem.ItemData.Effects[0].EffectsInThisBatch[0].TypeTag, 'SW.Enchantment.Thundering');
    assert.equal(newItem.ItemData.Effects[0].EffectsInThisBatch[0].GeneratorData.GeneratorParentTemplate, 'SW.Enchantment.Thundering.III');
  }

  console.log(`\n[SUCCESS] All 4 integration workflows in ${name} passed!`);
  return { passed: 4, failed: 0 };
}
