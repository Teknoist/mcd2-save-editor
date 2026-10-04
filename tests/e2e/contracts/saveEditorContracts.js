/**
 * Authoritative E2E Interface Contracts and Reference Oracle
 * Derived directly from PROJECT.md § Interface Contracts and ORIGINAL_REQUEST.md.
 * 
 * Provides pure, deterministic specifications for:
 * - Save manipulation (slot normalization, enchantment add/update/remove, level sync, serialization)
 * - Header parsing (compact vs multiline JSON detection)
 * - Formatters and tag transformations
 * - Database completeness verification
 * - Semantic versioning validation
 */

/**
 * Ensures item has at least minSlots (default 3) rerollable batches.
 * @param {object} item
 * @param {number} minSlots
 */
export function ensureItemEffectSlots(item, minSlots = 3) {
  if (!item || !item.ItemData) return;
  if (!Array.isArray(item.ItemData.Effects)) {
    item.ItemData.Effects = [];
  }
  while (item.ItemData.Effects.length < minSlots) {
    item.ItemData.Effects.push({
      TypeTag: 'SW.Item.Effect.Rerollable',
      EffectsInThisBatch: []
    });
  }
}

/**
 * Derives canonical template string following namespace rules:
 * - SW.Enchantment.* -> SW.Enchantment.<Name>.<Tier>
 * - SW.Effect.* -> SW.EffectTemplate.<Name>.<Tier>
 * @param {string} effectTag
 * @param {number} tier
 * @returns {string}
 */
export function deriveGeneratorParentTemplate(effectTag, tier = 1) {
  const tierSuffix = ['I', 'II', 'III'][Math.max(0, Math.min(2, tier - 1))] || 'I';
  if (effectTag.startsWith('SW.Enchantment.')) {
    return `${effectTag}.${tierSuffix}`;
  }
  if (effectTag.startsWith('SW.Effect.')) {
    const baseName = effectTag.replace('SW.Effect.', '');
    return `SW.EffectTemplate.${baseName}.${tierSuffix}`;
  }
  return `${effectTag}.${tierSuffix}`;
}

/**
 * Creates a new enchantment/effect entry.
 * @param {string} effectTag
 * @param {number} tier
 * @returns {object}
 */
export function createEnchantmentEffect(effectTag, tier = 1) {
  const normalizedTier = Math.max(1, Math.min(3, tier));
  const template = deriveGeneratorParentTemplate(effectTag, normalizedTier);
  return {
    TypeTag: effectTag,
    Intensity: Number((0.1 * normalizedTier).toFixed(2)),
    Quality: normalizedTier,
    EnchantmentPointsInvested: 0,
    GeneratorData: {
      GeneratorParentTemplate: template,
      Locked: false
    }
  };
}

/**
 * Adds an enchantment/effect to the specified slot of an item.
 * @param {object} item
 * @param {number} slotIndex
 * @param {string} effectTag
 * @param {number} tier
 * @returns {object|null}
 */
export function addEnchantmentToItem(item, slotIndex, effectTag, tier = 1) {
  if (!item || !item.ItemData || slotIndex < 0 || slotIndex >= 3) {
    return null;
  }
  ensureItemEffectSlots(item, 3);
  const slot = item.ItemData.Effects[slotIndex];
  if (!slot) return null;
  if (!Array.isArray(slot.EffectsInThisBatch)) {
    slot.EffectsInThisBatch = [];
  }
  const effect = createEnchantmentEffect(effectTag, tier);
  slot.EffectsInThisBatch.push(effect);
  return effect;
}

/**
 * Updates an enchantment/effect on a specific slot and index.
 * @param {object} item
 * @param {number} slotIndex
 * @param {number} enchantIndex
 * @param {string} effectTag
 * @param {number} tier
 * @returns {boolean}
 */
export function updateEnchantmentOnItem(item, slotIndex, enchantIndex, effectTag, tier) {
  if (!item || !item.ItemData || slotIndex < 0 || slotIndex >= 3) return false;
  ensureItemEffectSlots(item, 3);
  const slot = item.ItemData.Effects[slotIndex];
  if (!slot || !slot.EffectsInThisBatch || enchantIndex < 0 || enchantIndex >= slot.EffectsInThisBatch.length) {
    return false;
  }
  const target = slot.EffectsInThisBatch[enchantIndex];
  const normalizedTier = Math.max(1, Math.min(3, tier));
  target.TypeTag = effectTag;
  target.Quality = normalizedTier;
  target.Intensity = Number((0.1 * normalizedTier).toFixed(2));
  if (!target.GeneratorData) {
    target.GeneratorData = { Locked: false };
  }
  target.GeneratorData.GeneratorParentTemplate = deriveGeneratorParentTemplate(effectTag, normalizedTier);
  return true;
}

/**
 * Removes an enchantment/effect from a specific slot and index.
 * @param {object} item
 * @param {number} slotIndex
 * @param {number} enchantIndex
 * @returns {boolean}
 */
export function removeEnchantmentFromItem(item, slotIndex, enchantIndex) {
  if (!item || !item.ItemData || slotIndex < 0 || slotIndex >= 3) return false;
  const slot = item.ItemData.Effects?.[slotIndex];
  if (!slot || !slot.EffectsInThisBatch || enchantIndex < 0 || enchantIndex >= slot.EffectsInThisBatch.length) {
    return false;
  }
  slot.EffectsInThisBatch.splice(enchantIndex, 1);
  return true;
}

/**
 * Sets character level and synchronizes MetaData and Ability.Attributes.
 * @param {object} save
 * @param {number} newLevel
 */
export function setCharacterLevel(save, newLevel) {
  if (!save || !save.CharacterSaveV1) return;
  const clamped = Math.max(1, Math.floor(newLevel));
  if (save.CharacterSaveV1.MetaData) {
    save.CharacterSaveV1.MetaData.Level = clamped;
  }
  if (save.CharacterSaveV1.Ability?.Attributes) {
    const levelAttr = save.CharacterSaveV1.Ability.Attributes.find(a => a.AttributeName === 'Level');
    if (levelAttr) {
      levelAttr.CurrentValue = clamped;
    } else {
      save.CharacterSaveV1.Ability.Attributes.push({
        AttributeName: 'Level',
        CurrentValue: clamped
      });
    }
  }
}

/**
 * Sets currency/attribute value on save.
 * @param {object} save
 * @param {string} currencyName
 * @param {number} amount
 */
export function setCharacterCurrency(save, currencyName, amount) {
  if (!save?.CharacterSaveV1?.Ability?.Attributes) return;
  const attr = save.CharacterSaveV1.Ability.Attributes.find(a => a.AttributeName === currencyName);
  if (attr) {
    attr.CurrentValue = amount;
  } else {
    save.CharacterSaveV1.Ability.Attributes.push({
      AttributeName: currencyName,
      CurrentValue: amount
    });
  }
}

/**
 * Serializes save object to JSON string.
 * @param {object} save
 * @param {boolean} formatted
 * @returns {string}
 */
export function serializeSave(save, formatted = false) {
  if (!save) throw new Error('Cannot serialize null or undefined save');
  return JSON.stringify(save, null, formatted ? 2 : 0);
}

/**
 * Deserializes JSON text to save object.
 * @param {string} jsonText
 * @returns {object}
 */
export function deserializeSave(jsonText) {
  if (typeof jsonText !== 'string' || !jsonText.trim()) {
    throw new Error('Invalid JSON string for save file');
  }
  const cleanText = jsonText.replace(/^\uFEFF/, '');
  const firstBrace = cleanText.indexOf('{');
  if (firstBrace === -1) {
    throw new Error('No JSON object found in save text');
  }
  return JSON.parse(cleanText.slice(firstBrace));
}

/**
 * Robust save header detector supporting compact and formatted multiline JSON.
 * @param {string} snippet
 * @returns {object|null}
 */
export function parseSaveHeader(snippet) {
  if (typeof snippet !== 'string') return null;
  const HEADER_REGEX = /^\s*\{\s*"SerializeMeta"/;
  if (!HEADER_REGEX.test(snippet)) return null;

  try {
    const parsed = deserializeSave(snippet);
    if (!parsed?.SerializeMeta?.HardFormat) return null;
    return {
      hardFormat: parsed.SerializeMeta.HardFormat,
      softVersion: parsed.SerializeMeta.SoftVersion ?? 0,
      formatHash: parsed.SerializeMeta.FormatHash ?? 0,
      characterId: parsed.CharacterSaveV1?.MetaData?.CharacterId ?? 'Unknown'
    };
  } catch {
    return null;
  }
}

/**
 * Shared byte formatter.
 * @param {number} bytes
 * @returns {string}
 */
export function formatBytes(bytes) {
  if (bytes === 0 || bytes === null || bytes === undefined || isNaN(bytes)) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const val = parseFloat((bytes / Math.pow(k, i)).toFixed(1));
  return `${val} ${sizes[i]}`;
}

/**
 * Shared tag to display name formatter.
 * @param {string} tag
 * @returns {string}
 */
export function formatTag(tag) {
  if (!tag) return 'Unknown';
  const cleaned = tag
    .replace(/^SW\.Item\./, '')
    .replace(/^SW\.Effect\./, '')
    .replace(/^SW\.Enchantment\./, '')
    .replace(/^SW\.Rarity\./, '')
    .replace(/^Artifact\./, '')
    .replace(/^Cosmetic\.(Cape|Pet)\./, '$1: ')
    .replace(/^EnchantmentBook\./, 'Enchantment: ')
    .replace(/^Talisman\./, 'Talisman: ')
    .replace(/\.Unique$/, '')
    .replace(/\.[I|V|X]+$/, '');
  return cleaned
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Database completeness validator for enchants, effects, and gear.
 * @param {Array} enchants
 * @param {Array} effects
 * @param {Array} gear
 * @returns {object}
 */
export function validateDatabaseCompleteness(enchants = [], effects = [], gear = []) {
  const evaluate = (list, name, threshold = 95.0) => {
    const total = list.length;
    const withDesc = list.filter(item => typeof item.Description === 'string' && item.Description.trim().length > 0).length;
    const pct = total === 0 ? 0 : Number(((withDesc / total) * 100).toFixed(2));
    const passed = pct > threshold;
    return { name, total, withDesc, missing: total - withDesc, pct, threshold, passed };
  };

  const enchantsResult = evaluate(enchants, 'enchants.json', 95.0);
  const effectsResult = evaluate(effects, 'effects.json', 95.0);
  const gearResult = evaluate(gear, 'gear.json', 95.0);

  return {
    enchants: enchantsResult,
    effects: effectsResult,
    gear: gearResult,
    allPassed: enchantsResult.passed && effectsResult.passed
  };
}

/**
 * Validates semantic versioning (must be semver and > 0.0.0).
 * @param {string} version
 * @returns {boolean}
 */
export function validateSemanticVersion(version) {
  if (typeof version !== 'string') return false;
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!match) return false;
  const [_, major, minor, patch] = match.map(Number);
  return major > 0 || minor > 0 || patch > 0;
}
