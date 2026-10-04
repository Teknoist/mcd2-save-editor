import gearData from '../../../src/data/gear.json';
import enchantsData from '../../../src/data/enchants.json';
import effectsData from '../../../src/data/effects.json';

export interface GearEntry {
  Name: string;
  Tag: string;
  Category: string;
  Unique: boolean;
  Description?: string;
  Icon: string;
  IconUrl: string;
  Source: string;
  Slot: string;
  Effects: unknown[];
  Levels: unknown[];
  Pool: string[];
}

export interface EnchantEntry {
  Name: string;
  Tag: string;
  Icon: string;
  IconUrl: string;
  Slots: string[];
  Tiers: Array<{ Tier: string; Value: number }>;
  Source: string;
  Description?: string;
}

export interface EffectEntry {
  Name: string;
  Tag: string;
  Effect: string;
  Tier: string;
  Value: number;
  Icon?: string;
  IconUrl?: string;
  Category?: string;
  Source?: string;
  Description?: string;
}

export const GEAR_LIST: GearEntry[] = gearData as GearEntry[];
export const ENCHANT_LIST: EnchantEntry[] = enchantsData as EnchantEntry[];
export const EFFECT_LIST: EffectEntry[] = effectsData as EffectEntry[];

const gearByTag = new Map<string, GearEntry>(GEAR_LIST.map(g => [g.Tag, g]));
const enchantByTag = new Map<string, EnchantEntry>(ENCHANT_LIST.map(e => [e.Tag, e]));
const effectByTag = new Map<string, EffectEntry>(EFFECT_LIST.map(e => [e.Tag, e]));

export function getGear(tag: string): GearEntry | undefined {
  return gearByTag.get(tag);
}

export function getEnchant(tag: string): EnchantEntry | undefined {
  return enchantByTag.get(tag);
}

export function getEffect(tag: string): EffectEntry | undefined {
  return effectByTag.get(tag);
}

export function getGearName(tag: string): string {
  return gearByTag.get(tag)?.Name ?? formatTag(tag);
}

export function getEffectName(tag: string): string {
  const enchant = enchantByTag.get(tag);
  if (enchant) return enchant.Name;
  const effect = effectByTag.get(tag);
  if (effect) return effect.Name;
  return formatTag(tag);
}

export function getIconUrl(tag: string): string | null {
  const gear = gearByTag.get(tag);
  if (gear?.IconUrl) return gear.IconUrl;
  const enchant = enchantByTag.get(tag);
  if (enchant?.IconUrl) return enchant.IconUrl;
  const effect = effectByTag.get(tag);
  if (effect?.IconUrl) return effect?.IconUrl ?? null;
  return null;
}

export function getItemEnchantPool(itemTag: string): string[] {
  return gearByTag.get(itemTag)?.Pool ?? [];
}

export function getEnchantsForSlot(slotTag: string): EnchantEntry[] {
  if (!slotTag || slotTag === 'None') return ENCHANT_LIST;
  return ENCHANT_LIST.filter(e => e.Slots.length === 0 || e.Slots.includes(slotTag));
}

export function formatTag(tag: string): string {
  if (!tag) return 'Unknown';
  return tag
    .replace(/^SW\.(Item|Effect|Enchantment)\./, '')
    .replace(/^Artifact\./, '')
    .replace(/^Cosmetic\.(Cape|Pet)\./, '$1: ')
    .replace(/^EnchantmentBook\./, 'Enchantment: ')
    .replace(/^Talisman\./, 'Talisman: ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export const formatTagToName = formatTag;

export const GEAR_CATEGORIES = [...new Set(GEAR_LIST.map(g => g.Category))].sort();

export function getGearByCategory(category: string): GearEntry[] {
  return GEAR_LIST.filter(g => g.Category === category);
}
