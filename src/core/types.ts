// Core save data types for MCD2 Save Editor
// These types are derived from actual MCD2 save file analysis

export interface SerializeMeta {
  InternalVersion: number;
  HardFormat: string;
  SoftVersion: number;
  FormatHash: number;
}

export interface CharacterMetaData {
  CharacterId: string;
  Created: number;
  GameDataUpdated: number;
  IsOnline: boolean;
  IsGuest: boolean;
  Level: number;
  PowerLevel: number;
  CurrentLocation: string;
  ReleaseToggles: string[];
  CurrentDifficulty: string;
  [key: string]: unknown; // preserve unknown fields
}

export interface Attribute {
  AttributeName: string;
  CurrentValue: number;
  [key: string]: unknown;
}

export interface AbilityData {
  Attributes: Attribute[];
  ProgressionTags?: string[];
  [key: string]: unknown;
}

export interface EnchantmentEffect {
  TypeTag: string;
  Intensity: number;
  Quality: number; // 0-3
  EnchantmentPointsInvested: number;
  GeneratorData?: {
    GeneratorParentTemplate?: string;
    Locked: boolean;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface EffectBatch {
  TypeTag: string; // e.g. "SW.Item.Effect.Rerollable"
  EffectsInThisBatch: EnchantmentEffect[];
  [key: string]: unknown;
}

export interface PowerGeneratorValues {
  PlayerLevel: number;
  AreaThreatLevel: number;
  RecommendedThreatLevel: number;
  ThreatSliderOffset: number;
  ItemPowerMin: number;
  ItemPowerMax: number;
  RNGRoll: number;
  ItemPower: number;
  ItemPowerOriginal: number;
  [key: string]: unknown;
}

export interface ItemProgression {
  CurrentLevel: number;
  CurrentXP: number;
  ItemLevels: unknown[];
  [key: string]: unknown;
}

export interface ItemGeneratorData {
  GenesisRandomSeed?: number;
  PowerGeneratorValues: PowerGeneratorValues;
  [key: string]: unknown;
}

export interface ItemData {
  TypeTag: string;       // e.g. "SW.Item.Scythe"
  RarityTag: string;     // e.g. "SW.Rarity.Rare"
  Effects: EffectBatch[];
  ItemProgression?: ItemProgression;
  GeneratorData: ItemGeneratorData;
  DynamicPropertyTags?: string[];
  TargetSlotOverride?: string;
  PickupTimestamp?: number;
  EffectRerolls?: number;
  [key: string]: unknown;
}

export interface InventoryEntry {
  ItemData: ItemData;
  StackCount: number;
  EquippedSlot: string;  // e.g. "None" | "SW.ItemSlot.Equipment.MeleeWeapon" | ...
  MerchantItemSold?: boolean;
  MerchantDiscount?: number;
  [key: string]: unknown;
}

export interface Inventory {
  Entries: InventoryEntry[];
  [key: string]: unknown;
}

export interface CharacterSaveV1 {
  MetaData: CharacterMetaData;
  Ability: AbilityData;
  Achievements?: unknown;
  CollectionsStats?: unknown;
  Cosmetics?: unknown;
  Inventory: Inventory;
  LootProgression?: unknown;
  quest?: unknown;
  WorldExploration?: unknown;
  [key: string]: unknown;
}

export interface SaveFile {
  SerializeMeta: SerializeMeta;
  CharacterSaveV1: CharacterSaveV1;
  [key: string]: unknown;
}

// ---- Runtime state types ----

export interface SaveFileInfo {
  path: string;
  lastModified: number;
  size: number;
  characterId: string;
  level: number;
  powerLevel: number;
  softVersion: number;
}

export interface SaveState {
  info: SaveFileInfo;
  data: SaveFile;
  isDirty: boolean;
}

export interface HistoryEntry {
  timestamp: number;
  description: string;
  snapshot: string; // JSON.stringify of relevant part
}

export interface AppSettings {
  theme: 'dark' | 'minecraft';
  advancedMode: boolean;
  autoBackup: boolean;
  maxBackups: number;
  customGamePath?: string;
  customSavePath?: string;
  language: string;
}

// ---- Game data types (derived from real save analysis) ----

export const KNOWN_ITEM_TYPES: ReadonlyArray<string> = [
  // Melee Weapons
  'SW.Item.Scythe',
  'SW.Item.Pike',
  'SW.Item.CurvedLongsword',
  'SW.Item.Dagger',
  'SW.Item.Glaive',
  'SW.Item.Pickaxe',
  'SW.Item.Battlestaff',
  'SW.Item.Claws_Unique1',
  // Ranged Weapons
  'SW.Item.Longbow',
  'SW.Item.Crossbow',
  'SW.Item.HeavyCrossbow',
  'SW.Item.ScatterCrossbow',
  // Armor - Helmet
  'SW.Item.PhantomHelmet',
  'SW.Item.HoneyHelmet_Unique',
  // Armor - Chest
  'SW.Item.PhantomChest',
  'SW.Item.DiscipleChest',
  'SW.Item.WellspringChest',
  // Armor - Leggings
  'SW.Item.DiscipleLeggings',
  'SW.Item.CaveCrawlerLeggings',
  'SW.Item.RedstoneLeggings',
  'SW.Item.TimewornLeggings',
  // Armor - Boots
  'SW.Item.DiscipleBoots',
  'SW.Item.StalwartBoots',
  'SW.Item.MysticBoots_Unique',
  // Artifacts
  'SW.Item.Artifact.BlizzardStaff',
  'SW.Item.Artifact.CorruptedBeacon',
  'SW.Item.Artifact.CorruptedSeeds',
  'SW.Item.Artifact.CreeperCandle',
  'SW.Item.Artifact.Grindstone',
  'SW.Item.Artifact.Honeypot',
  'SW.Item.Artifact.IronHideLute',
  'SW.Item.Artifact.PoisonQuiver',
  'SW.Item.Artifact.Powershaker',
  'SW.Item.Artifact.RedstoneMines',
  'SW.Item.Artifact.Satchel.Freezing',
  'SW.Item.Artifact.SmokeBomb',
  'SW.Item.Artifact.TotemOfShielding',
  'SW.Item.Artifact.WarBanner',
  'SW.Item.Artifact.WardingChimes',
  'SW.Item.Artifact.WitchesBrew',
  // Talismans
  'SW.Item.Talisman.HealthBoost',
  'SW.Item.Talisman.Wolf',
  // Enchantment Books
  'SW.Item.EnchantmentBook.Channeling',
  'SW.Item.EnchantmentBook.CriticalQuiver',
  'SW.Item.EnchantmentBook.Dynamo',
  'SW.Item.EnchantmentBook.Piercing',
  'SW.Item.EnchantmentBook.PoisonFog',
  'SW.Item.EnchantmentBook.Radiance',
  'SW.Item.EnchantmentBook.Ricochet',
  'SW.Item.EnchantmentBook.ShadowStrike',
  'SW.Item.EnchantmentBook.SoulInfusedPotion',
  // Cosmetics
  'SW.Item.Cosmetic.Cape.CorruptedCreeper',
  'SW.Item.Cosmetic.Cape.Hero',
  'SW.Item.Cosmetic.Cape.Mojang',
  'SW.Item.Cosmetic.Cape.SliceSlayer',
  'SW.Item.Cosmetic.Cape.Soul',
  'SW.Item.Cosmetic.Cape.Special',
  'SW.Item.Cosmetic.Cape.Twisted',
  'SW.Item.Cosmetic.Pet.Blub',
  'SW.Item.Cosmetic.Pet.SlimeSupreme',
  'SW.Item.Cosmetic.Pet.TwistedChicken',
] as const;

export const KNOWN_EFFECT_TYPES: ReadonlyArray<string> = [
  // From real save analysis
  'SW.Effect.BeastBoss',
  'SW.Effect.Constitution',
  'SW.Effect.Cooldown',
  'SW.Effect.CriticalEdge',
  'SW.Effect.CriticalHit',
  'SW.Effect.Deflect',
  'SW.Effect.Duelist',
  'SW.Effect.ElementalProtection',
  'SW.Effect.Expand',
  'SW.Effect.FireFocus',
  'SW.Effect.FrostFocus',
  'SW.Effect.HealthBoost',
  'SW.Effect.Knockback',
  'SW.Effect.LightningFocus',
  'SW.Effect.Opulence',
  'SW.Effect.PoisonFocus',
  'SW.Effect.PotionCooldown',
  'SW.Effect.Power',
  'SW.Effect.ProjectileProtection',
  'SW.Effect.RapidStrike',
  'SW.Effect.Reconstruction',
  'SW.Effect.RollCooldown',
  'SW.Effect.Sharpness',
  'SW.Effect.Sidestep',
  'SW.Effect.SoulFocus',
  'SW.Effect.SoulMax',
  'SW.Effect.SwiftSneak',
  'SW.Effect.Vanguard',
  'SW.Effect.Vestige',
  'SW.Effect.Vivify',
  // Enchantments (different namespace)
  'SW.Enchantment.Channeling',
  'SW.Enchantment.ClawingShadow.Unique',
  'SW.Enchantment.SoulInfusedPotion',
] as const;

export const RARITIES = [
  { tag: 'SW.Rarity.Common', label: 'Common', color: '#8b8b8b', glowColor: '#a8a8a8', borderLight: '#a8a8a8', borderDark: '#373737' },
  { tag: 'SW.Rarity.Rare', label: 'Rare', color: '#4b7a47', glowColor: '#6bc264', borderLight: '#6bc264', borderDark: '#1e361b' },
  { tag: 'SW.Rarity.Unique', label: 'Unique', color: '#a36b2c', glowColor: '#d18d3a', borderLight: '#d18d3a', borderDark: '#3d250a' },
  { tag: 'SW.Rarity.Special', label: 'Special', color: '#6c3b8a', glowColor: '#9a5cd6', borderLight: '#9a5cd6', borderDark: '#230d33' },
] as const;

export const EQUIPMENT_SLOTS = [
  { tag: 'None', label: 'Not Equipped' },
  { tag: 'SW.ItemSlot.Equipment.MeleeWeapon', label: 'Melee Weapon' },
  { tag: 'SW.ItemSlot.Equipment.RangedWeapon', label: 'Ranged Weapon' },
  { tag: 'SW.ItemSlot.Equipment.Armor.Helmet', label: 'Helmet' },
  { tag: 'SW.ItemSlot.Equipment.Armor.Chest', label: 'Chest' },
  { tag: 'SW.ItemSlot.Equipment.Armor.Leggings', label: 'Leggings' },
  { tag: 'SW.ItemSlot.Equipment.Armor.Boots', label: 'Boots' },
  { tag: 'SW.ItemSlot.Equipment.Artifact.Slot1', label: 'Artifact Slot 1' },
  { tag: 'SW.ItemSlot.Equipment.Artifact.Slot2', label: 'Artifact Slot 2' },
  { tag: 'SW.ItemSlot.Equipment.Artifact.Slot3', label: 'Artifact Slot 3' },
  { tag: 'SW.ItemSlot.Equipment.Talisman.Slot1', label: 'Talisman Slot 1' },
  { tag: 'SW.ItemSlot.Equipment.Talisman.Slot2', label: 'Talisman Slot 2' },
  { tag: 'SW.ItemSlot.Equipment.Cosmetic.Capes', label: 'Cape' },
  { tag: 'SW.ItemSlot.Equipment.Cosmetic.Pets', label: 'Pet' },
] as const;

// ---- Helper functions ----

export function getItemCategory(typeTag: string): string {
  if (!typeTag) return 'Unknown';
  const t = typeTag.toLowerCase();
  if (t.includes('cosmetic.cape')) return 'Cape';
  if (t.includes('cosmetic.pet')) return 'Pet';
  if (t.includes('cosmetic')) return 'Cosmetic';
  if (t.includes('enchantmentbook')) return 'Enchantment Book';
  if (t.includes('talisman')) return 'Talisman';
  if (t.includes('artifact')) return 'Artifact';
  if (t.includes('helmet')) return 'Helmet';
  if (t.includes('chest')) return 'Chest Armor';
  if (t.includes('leggings')) return 'Leggings';
  if (t.includes('boots')) return 'Boots';
  if (t.includes('bow') || t.includes('crossbow')) return 'Ranged Weapon';
  return 'Melee Weapon';
}

export function getDisplayName(typeTag: string): string {
  if (!typeTag) return 'Unknown Item';
  // Strip prefix
  const name = typeTag.replace(/^SW\.Item\./, '')
    .replace(/^Artifact\./, '')
    .replace(/^Cosmetic\.Cape\./, 'Cape: ')
    .replace(/^Cosmetic\.Pet\./, 'Pet: ')
    .replace(/^EnchantmentBook\./, 'Enchantment: ')
    .replace(/^Talisman\./, 'Talisman: ')
    .replace(/^Armor\./, '');
  // Convert CamelCase to "Camel Case"
  return name.replace(/([A-Z])/g, ' $1').replace(/^\s/, '').replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
}

export function getEffectDisplayName(effectTag: string): string {
  if (!effectTag) return 'Unknown';
  return effectTag
    .replace(/^SW\.Effect\./, '')
    .replace(/^SW\.Enchantment\./, '')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^\s/, '')
    .replace(/_/g, ' ')
    .trim();
}

export function getRarityInfo(rarityTag: string) {
  return RARITIES.find(r => r.tag === rarityTag) || RARITIES[0];
}

export function createNewItem(typeTag: string, rarityTag: string, power: number): InventoryEntry {
  return {
    ItemData: {
      TypeTag: typeTag,
      RarityTag: rarityTag,
      Effects: [
        { TypeTag: 'SW.Item.Effect.Rerollable', EffectsInThisBatch: [] },
        { TypeTag: 'SW.Item.Effect.Rerollable', EffectsInThisBatch: [] },
        { TypeTag: 'SW.Item.Effect.Rerollable', EffectsInThisBatch: [] },
      ],
      ItemProgression: {
        CurrentLevel: 0,
        CurrentXP: 0,
        ItemLevels: []
      },
      GeneratorData: {
        GenesisRandomSeed: Math.floor(Math.random() * 4294967295),
        PowerGeneratorValues: {
          PlayerLevel: 1,
          AreaThreatLevel: 1,
          RecommendedThreatLevel: 1,
          ThreatSliderOffset: 0,
          ItemPowerMin: power,
          ItemPowerMax: power,
          RNGRoll: 0.5,
          ItemPower: power,
          ItemPowerOriginal: power,
        }
      },
      DynamicPropertyTags: [],
      TargetSlotOverride: 'None',
      PickupTimestamp: Math.floor(Date.now() / 1000),
      EffectRerolls: 0,
    },
    StackCount: 1,
    EquippedSlot: 'None',
    MerchantItemSold: false,
    MerchantDiscount: 0,
  };
}

export function createEnchantEffect(effectTag: string, quality: number = 1): EnchantmentEffect {
  const tierSuffix = ['I', 'II', 'III'][Math.max(0, Math.min(2, quality - 1))];
  const baseName = effectTag.replace('SW.Effect.', '').replace('SW.Enchantment.', '');
  return {
    TypeTag: effectTag,
    Intensity: 0.1 * quality,
    Quality: quality,
    EnchantmentPointsInvested: 0,
    GeneratorData: {
      GeneratorParentTemplate: effectTag.startsWith('SW.Effect.')
        ? `SW.EffectTemplate.${baseName}.${tierSuffix}`
        : undefined,
      Locked: false,
    }
  };
}
