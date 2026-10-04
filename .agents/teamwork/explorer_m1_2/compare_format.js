function oldFormat(tag) {
  if (!tag) return 'Unknown';
  return tag
    .replace(/^SW\.Item\./, '')
    .replace(/^SW\.Effect\./, '')
    .replace(/^SW\.Enchantment\./, '')
    .replace(/^Artifact\./, '')
    .replace(/^Cosmetic\.(Cape|Pet)\./, '$1: ')
    .replace(/^EnchantmentBook\./, 'Enchantment: ')
    .replace(/^Talisman\./, 'Talisman: ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function newFormat(tag) {
  if (!tag) return 'Unknown';
  return tag
    .replace(/^SW\.(Item|Effect|Enchantment|EffectTemplate|Rarity)\./, '')
    .replace(/\.Unique$/, '')
    .replace(/\.[IVX]+$/, '')
    .replace(/^Artifact\./, '')
    .replace(/^Cosmetic\.(Cape|Pet)\./, '$1: ')
    .replace(/^EnchantmentBook\./, 'Enchantment: ')
    .replace(/^Talisman\./, 'Talisman: ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const testTags = [
  'SW.Item.Scythe',
  'SW.Item.Armor.Mercenary',
  'SW.Enchantment.SoulInfusedPotion',
  'SW.EffectTemplate.Protection.I',
  'SW.Effect.Sharpness',
  'Cosmetic.Cape.Hero',
  'EnchantmentBook.FireAspect',
  'SW.Item.Axe_Unique'
];

testTags.forEach(t => console.log(t, '\n  OLD:', oldFormat(t), '\n  NEW:', newFormat(t)));
