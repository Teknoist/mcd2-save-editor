import {
  GEAR_LIST,
  ENCHANT_LIST,
  EFFECT_LIST,
  getGear,
  getEnchant,
  getEffect,
  getGearName,
  getEffectName,
  getIconUrl,
  getItemEnchantPool,
  getEnchantsForSlot,
  formatTag,
  formatTagToName,
  GEAR_CATEGORIES,
  getGearByCategory,
  type GearEntry,
  type EnchantEntry,
  type EffectEntry,
} from './test_gameData';

const testEnchant: EnchantEntry = {
  Name: 'Test Enchant',
  Tag: 'SW.Enchantment.Test',
  Icon: 'test.png',
  IconUrl: 'https://example.com/test.png',
  Slots: ['SW.ItemSlot.Equipment.Armor.Boots'],
  Tiers: [{ Tier: 'I', Value: 1.0 }],
  Source: 'https://example.com',
  Description: 'A test enchantment description',
};

const testEnchantWithoutDesc: EnchantEntry = {
  Name: 'Test Enchant 2',
  Tag: 'SW.Enchantment.Test2',
  Icon: 'test.png',
  IconUrl: 'https://example.com/test.png',
  Slots: [],
  Tiers: [],
  Source: 'https://example.com',
};

const testEffect: EffectEntry = {
  Name: 'Test Effect',
  Tag: 'SW.EffectTemplate.Test.I',
  Effect: 'SW.Effect.Test',
  Tier: 'I',
  Value: 0.5,
  Icon: 'test.png',
  IconUrl: 'https://example.com/test.png',
  Category: 'Melee',
  Source: 'https://example.com',
  Description: 'A test effect description',
};

const testEffectMinimal: EffectEntry = {
  Name: 'Test Effect Minimal',
  Tag: 'SW.EffectTemplate.Test.II',
  Effect: 'SW.Effect.Test',
  Tier: 'II',
  Value: 1.0,
};

const e1 = getEnchant('SW.Enchantment.SoulInfusedPotion');
const eff1 = getEffect('SW.EffectTemplate.Protection.I');
const gear1: GearEntry | undefined = getGear('SW.Item.Scythe');

const formatted1 = formatTag('SW.Item.Sword');
const formatted2 = formatTagToName('SW.Item.Sword');
const slotEnchants = getEnchantsForSlot('SW.ItemSlot.Equipment.Armor.Boots');
const gearList = getGearByCategory('Armor');
const pool = getItemEnchantPool('SW.Item.Scythe');
const icon = getIconUrl('SW.Item.Scythe');
const gName = getGearName('SW.Item.Scythe');
const eName = getEffectName('SW.Effect.Protection');

console.log({
  testEnchant,
  testEnchantWithoutDesc,
  testEffect,
  testEffectMinimal,
  e1Name: e1?.Name,
  e1Desc: e1?.Description,
  eff1Name: eff1?.Name,
  eff1Desc: eff1?.Description,
  eff1Effect: eff1?.Effect,
  eff1Tier: eff1?.Tier,
  eff1Value: eff1?.Value,
  gear1Name: gear1?.Name,
  formatted1,
  formatted2,
  slotCount: slotEnchants.length,
  gearCount: gearList.length,
  categories: GEAR_CATEGORIES.length,
  poolCount: pool.length,
  icon,
  gName,
  eName,
  totalGear: GEAR_LIST.length,
  totalEnchants: ENCHANT_LIST.length,
  totalEffects: EFFECT_LIST.length,
});
