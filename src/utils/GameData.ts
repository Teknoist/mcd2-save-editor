export const ITEM_TYPES = [
  "SW.Item.Scythe",
  "SW.Item.Pike",
  "SW.Item.Sword",
  "SW.Item.Daggers",
  "SW.Item.Axe",
  "SW.Item.DoubleAxe",
  "SW.Item.Glaive",
  "SW.Item.Sickles",
  "SW.Item.Mace",
  "SW.Item.Bow",
  "SW.Item.Crossbow",
  "SW.Item.Shortbow",
  "SW.Item.Longbow",
  "SW.Item.Armor.Mercenary",
  "SW.Item.Armor.Hunter",
  "SW.Item.Armor.Spelunker",
  "SW.Item.Armor.Evocation",
  "SW.Item.Artifact.BootsOfSwiftness",
  "SW.Item.Artifact.DeathCapMushroom",
  "SW.Item.Artifact.CorruptedBeacon",
  "SW.Item.Artifact.TotemOfRegeneration",
  "SW.Item.Talisman.Health",
  "SW.Item.Talisman.Damage"
];

export const EFFECT_TYPES = [
  "SW.Effect.CriticalEdge",
  "SW.Effect.Sharpness",
  "SW.Effect.Leeching",
  "SW.Effect.VoidStrike",
  "SW.Effect.Radiance",
  "SW.Effect.Swirling",
  "SW.Effect.Shockwave",
  "SW.Effect.Thundering",
  "SW.Effect.Committed",
  "SW.Effect.Infinity",
  "SW.Effect.Multishot",
  "SW.Effect.Piercing",
  "SW.Effect.Ricochet",
  "SW.Effect.ChainReaction",
  "SW.Effect.Accelerate",
  "SW.Effect.FireAspect",
  "SW.Effect.Snowball",
  "SW.Effect.Deflect",
  "SW.Effect.Thorns",
  "SW.Effect.Chilling"
];

export const RARITIES = [
  "SW.Rarity.Common",
  "SW.Rarity.Rare",
  "SW.Rarity.Unique",
  "SW.Rarity.Special"
];

export function generateNewItem(typeTag: string, rarityTag: string, power: number) {
  return {
    "ItemData": {
      "TypeTag": typeTag,
      "RarityTag": rarityTag,
      "Effects": [
        {
          "TypeTag": "SW.Item.Effect.Rerollable",
          "EffectsInThisBatch": []
        },
        {
          "TypeTag": "SW.Item.Effect.Rerollable",
          "EffectsInThisBatch": []
        },
        {
          "TypeTag": "SW.Item.Effect.Rerollable",
          "EffectsInThisBatch": []
        }
      ],
      "ItemProgression": {
        "CurrentLevel": 0,
        "CurrentXP": 0,
        "ItemLevels": []
      },
      "GeneratorData": {
        "PowerGeneratorValues": {
          "ItemPower": power,
          "ItemPowerOriginal": power
        }
      }
    },
    "StackCount": 1,
    "EquippedSlot": "None"
  };
}
