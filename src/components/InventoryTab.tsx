import { useState, useMemo } from 'react';
import { Search, Plus, Copy, Trash2, ChevronRight } from 'lucide-react';
import type { InventoryEntry, SaveFile } from '../core/types';
import {
  RARITIES, EQUIPMENT_SLOTS, getRarityInfo,
  createNewItem, createEnchantEffect
} from '../core/types';
import {
  GEAR_LIST, ENCHANT_LIST, EFFECT_LIST,
  getGearName, getEffectName,
  GEAR_CATEGORIES
} from '../core/gameData';
import { ItemIcon, EnchantIcon } from './ItemIcon';

interface InventoryTabProps {
  saveData: SaveFile;
  updateSaveData: (data: SaveFile, description: string) => void;
}

export default function InventoryTab({ saveData, updateSaveData }: InventoryTabProps) {
  const entries = saveData.CharacterSaveV1.Inventory.Entries;

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [rarityFilter, setRarityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // New item state
  const [newType, setNewType] = useState(GEAR_LIST[0]?.Tag ?? '');
  const [newRarity, setNewRarity] = useState('SW.Rarity.Common');
  const [newPower, setNewPower] = useState(25);

  const filteredEntries = useMemo(() => {
    return entries.map((e, i) => ({ entry: e, originalIndex: i })).filter(({ entry }) => {
      const displayName = getGearName(entry.ItemData.TypeTag).toLowerCase();
      const query = searchQuery.toLowerCase();
      if (query && !displayName.includes(query) && !entry.ItemData.TypeTag.toLowerCase().includes(query)) return false;
      if (rarityFilter !== 'all' && entry.ItemData.RarityTag !== rarityFilter) return false;
      if (categoryFilter !== 'all') {
        const gearCat = GEAR_LIST.find(g => g.Tag === entry.ItemData.TypeTag)?.Category;
        if (gearCat !== categoryFilter) return false;
      }
      return true;
    });
  }, [entries, searchQuery, rarityFilter, categoryFilter]);

  const selectedEntry = selectedIndex !== null ? entries[selectedIndex] : null;
  const rarityInfo = selectedEntry ? getRarityInfo(selectedEntry.ItemData.RarityTag) : null;

  const updateEntry = (index: number, updated: InventoryEntry, desc: string) => {
    const newData = { ...saveData };
    newData.CharacterSaveV1.Inventory.Entries = [...entries];
    newData.CharacterSaveV1.Inventory.Entries[index] = updated;
    updateSaveData(newData, desc);
  };

  const handleClone = (index: number) => {
    const newData = { ...saveData };
    const cloned = JSON.parse(JSON.stringify(entries[index])) as InventoryEntry;
    cloned.EquippedSlot = 'None';
    cloned.ItemData.PickupTimestamp = Math.floor(Date.now() / 1000);
    newData.CharacterSaveV1.Inventory.Entries = [...entries, cloned];
    updateSaveData(newData, `Cloned ${getGearName(cloned.ItemData.TypeTag)}`);
    setSelectedIndex(newData.CharacterSaveV1.Inventory.Entries.length - 1);
  };

  const handleDelete = (index: number) => {
    if (!confirm(`Delete "${getGearName(entries[index].ItemData.TypeTag)}"?`)) return;
    const newData = { ...saveData };
    newData.CharacterSaveV1.Inventory.Entries = entries.filter((_, i) => i !== index);
    updateSaveData(newData, `Deleted ${getGearName(entries[index].ItemData.TypeTag)}`);
    setSelectedIndex(null);
  };

  const handleAddNew = () => {
    const item = createNewItem(newType, newRarity, newPower);
    const newData = { ...saveData };
    newData.CharacterSaveV1.Inventory.Entries = [...entries, item];
    updateSaveData(newData, `Added ${getGearName(newType)}`);
    setSelectedIndex(newData.CharacterSaveV1.Inventory.Entries.length - 1);
    setShowAddModal(false);
  };

  const getRaritySlotClass = (rarityTag: string) => {
    if (rarityTag?.includes('Rare')) return 'rarity-rare';
    if (rarityTag?.includes('Unique')) return 'rarity-unique';
    if (rarityTag?.includes('Special')) return 'rarity-special';
    return 'rarity-common';
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* LEFT: Inventory grid */}
      <div className="w-72 flex flex-col border-r border-[var(--border-subtle)] flex-shrink-0">
        <div className="p-3 border-b border-[var(--border-subtle)] flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span style={{ fontFamily: 'VT323, monospace', fontSize: '16px', color: 'var(--text-gold)', letterSpacing: '1px' }}>
              INVENTORY ({entries.length})
            </span>
            <button className="mc-btn mc-btn-primary ml-auto text-xs" onClick={() => setShowAddModal(true)}>
              <Plus size={12} /> ADD
            </button>
          </div>
          <div className="search-box">
            <Search size={12} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search items..." />
          </div>
          <select className="mc-select text-xs" value={rarityFilter} onChange={e => setRarityFilter(e.target.value)}>
            <option value="all">All Rarities</option>
            {RARITIES.map(r => <option key={r.tag} value={r.tag}>{r.label}</option>)}
          </select>
          <select className="mc-select text-xs" value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}>
            <option value="all">All Categories</option>
            {GEAR_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          <div className="grid grid-cols-4 gap-1.5">
            {filteredEntries.map(({ entry, originalIndex }) => (
              <div
                key={originalIndex}
                className={`item-slot ${getRaritySlotClass(entry.ItemData.RarityTag)} ${entry.EquippedSlot !== 'None' ? 'equipped' : ''} ${selectedIndex === originalIndex ? 'selected' : ''}`}
                onClick={() => setSelectedIndex(originalIndex)}
                data-tooltip={getGearName(entry.ItemData.TypeTag)}
              >
                <ItemIcon typeTag={entry.ItemData.TypeTag} size={28} />
                <div className="power-badge">
                  {entry.ItemData.GeneratorData?.PowerGeneratorValues?.ItemPower ?? '?'}
                </div>
              </div>
            ))}
          </div>
          {filteredEntries.length === 0 && (
            <div className="text-center py-8" style={{ color: 'var(--text-muted)', fontSize: '12px' }}>No items found</div>
          )}
        </div>
      </div>

      {/* RIGHT: Detail panel */}
      <div className="flex-1 overflow-y-auto">
        {selectedEntry ? (
          <ItemDetailPanel
            entry={selectedEntry}
            index={selectedIndex!}
            rarityInfo={rarityInfo!}
            showAdvanced={showAdvanced}
            onToggleAdvanced={() => setShowAdvanced(v => !v)}
            onUpdate={(updated, desc) => updateEntry(selectedIndex!, updated, desc)}
            onClone={() => handleClone(selectedIndex!)}
            onDelete={() => handleDelete(selectedIndex!)}
          />
        ) : (
          <div className="flex items-center justify-center h-full" style={{ color: 'var(--text-muted)', flexDirection: 'column', gap: 12 }}>
            <ChevronRight size={32} />
            <span>Select an item from the inventory</span>
          </div>
        )}
      </div>

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setShowAddModal(false)}>
          <div className="panel" style={{ minWidth: 360, maxWidth: 420, padding: 20, maxHeight: '80vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div className="section-title">CREATE NEW ITEM</div>
            <div className="flex flex-col gap-3">
              <div>
                <label className="attr-label block mb-1" style={{ fontSize: 10 }}>Category Filter</label>
                <select className="mc-select mb-2" onChange={e => {
                  const cat = e.target.value;
                  if (cat) {
                    const first = GEAR_LIST.find(g => g.Category === cat);
                    if (first) setNewType(first.Tag);
                  }
                }}>
                  <option value="">All Categories</option>
                  {GEAR_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <label className="attr-label block mb-1" style={{ fontSize: 10 }}>Item Type</label>
                <select className="mc-select" value={newType} onChange={e => setNewType(e.target.value)}>
                  {GEAR_LIST.map(g => (
                    <option key={g.Tag} value={g.Tag}>{g.Name} {g.Unique ? '★' : ''} ({g.Category})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="attr-label block mb-1" style={{ fontSize: 10 }}>Rarity</label>
                <select className="mc-select" value={newRarity} onChange={e => setNewRarity(e.target.value)}>
                  {RARITIES.map(r => <option key={r.tag} value={r.tag}>{r.label}</option>)}
                </select>
              </div>
              <div>
                <label className="attr-label block mb-1" style={{ fontSize: 10 }}>Power Level</label>
                <input type="number" className="mc-input" value={newPower} min={1} max={9999}
                  onChange={e => setNewPower(Number(e.target.value))} />
              </div>
              <div className="flex items-center gap-3 p-3" style={{ background: 'var(--bg-deep)', border: '1px solid var(--border-subtle)' }}>
                <div className={`item-slot ${getRaritySlotClass(newRarity)}`} style={{ width: 48, height: 48, cursor: 'default' }}>
                  <ItemIcon typeTag={newType} size={32} />
                  <div className="power-badge">{newPower}</div>
                </div>
                <div>
                  <div style={{ color: 'var(--text-primary)', fontSize: 13 }}>{getGearName(newType)}</div>
                  <div style={{ color: getRarityInfo(newRarity).glowColor, fontSize: 11 }}>{getRarityInfo(newRarity).label}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 10 }}>{GEAR_LIST.find(g => g.Tag === newType)?.Category}</div>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="mc-btn flex-1" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button className="mc-btn mc-btn-primary flex-1" onClick={handleAddNew}><Plus size={12} /> Create</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ===== Item detail panel =====
interface ItemDetailProps {
  entry: InventoryEntry;
  index: number;
  rarityInfo: typeof RARITIES[number];
  showAdvanced: boolean;
  onToggleAdvanced: () => void;
  onUpdate: (entry: InventoryEntry, desc: string) => void;
  onClone: () => void;
  onDelete: () => void;
}

function ItemDetailPanel({ entry, rarityInfo, showAdvanced, onToggleAdvanced, onUpdate, onClone, onDelete }: ItemDetailProps) {
  const power = entry.ItemData.GeneratorData?.PowerGeneratorValues?.ItemPower ?? 0;
  const displayName = getGearName(entry.ItemData.TypeTag);
  const gearEntry = GEAR_LIST.find(g => g.Tag === entry.ItemData.TypeTag);
  const allEffects = EFFECT_LIST;

  const updatePower = (v: number) => {
    const u = JSON.parse(JSON.stringify(entry)) as InventoryEntry;
    if (u.ItemData.GeneratorData?.PowerGeneratorValues) {
      u.ItemData.GeneratorData.PowerGeneratorValues.ItemPower = v;
      u.ItemData.GeneratorData.PowerGeneratorValues.ItemPowerOriginal = v;
    }
    onUpdate(u, `Set ${displayName} power to ${v}`);
  };

  const updateRarity = (tag: string) => {
    const u = JSON.parse(JSON.stringify(entry)) as InventoryEntry;
    u.ItemData.RarityTag = tag;
    onUpdate(u, `Set ${displayName} rarity`);
  };

  const updateSlot = (slot: string) => {
    const u = JSON.parse(JSON.stringify(entry)) as InventoryEntry;
    u.EquippedSlot = slot;
    onUpdate(u, `${slot === 'None' ? 'Unequipped' : 'Equipped'} ${displayName}`);
  };

  const addEnchant = (batchIndex: number) => {
    const u = JSON.parse(JSON.stringify(entry)) as InventoryEntry;
    // Pick first compatible enchant from pool
    const firstEffect = allEffects[0]?.Tag ?? 'SW.Effect.Sharpness';
    if (u.ItemData.Effects[batchIndex]) {
      u.ItemData.Effects[batchIndex].EffectsInThisBatch.push(createEnchantEffect(firstEffect, 1));
      onUpdate(u, `Added enchantment to ${displayName}`);
    }
  };

  const removeEnchant = (bi: number, ei: number) => {
    const u = JSON.parse(JSON.stringify(entry)) as InventoryEntry;
    u.ItemData.Effects[bi]?.EffectsInThisBatch.splice(ei, 1);
    onUpdate(u, `Removed enchantment from ${displayName}`);
  };

  const updateEnchantField = (bi: number, ei: number, field: string, value: unknown) => {
    const u = JSON.parse(JSON.stringify(entry)) as InventoryEntry;
    const eff = u.ItemData.Effects[bi]?.EffectsInThisBatch[ei];
    if (eff) {
      (eff as Record<string, unknown>)[field] = value;
      if (field === 'TypeTag') {
        const tag = value as string;
        const baseName = tag.replace('SW.Effect.', '').replace('SW.Enchantment.', '');
        const tierStr = ['I', 'II', 'III'][Math.max(0, Math.min(2, (eff.Quality || 1) - 1))];
        if (eff.GeneratorData) {
          eff.GeneratorData.GeneratorParentTemplate = `SW.EffectTemplate.${baseName}.${tierStr}`;
        }
      }
      onUpdate(u, `Updated enchantment on ${displayName}`);
    }
  };

  const getRaritySlotClass = (rt: string) => {
    if (rt?.includes('Rare')) return 'rarity-rare';
    if (rt?.includes('Unique')) return 'rarity-unique';
    if (rt?.includes('Special')) return 'rarity-special';
    return 'rarity-common';
  };

  return (
    <div className="p-4 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start gap-4 pb-3" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <div className={`item-slot ${getRaritySlotClass(entry.ItemData.RarityTag)}`} style={{ width: 64, height: 64, cursor: 'default' }}>
          <ItemIcon typeTag={entry.ItemData.TypeTag} size={48} />
        </div>
        <div className="flex-1">
          <div style={{ fontFamily: 'VT323, monospace', fontSize: '22px', color: 'var(--text-gold)', letterSpacing: 1 }}>{displayName}</div>
          <div style={{ color: rarityInfo.glowColor, fontSize: 12 }}>{rarityInfo.label}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>{gearEntry?.Category} • {entry.ItemData.TypeTag}</div>
        {gearEntry?.Description && (
            <div style={{ marginTop: 8, fontSize: 13, color: '#e8e8e8', fontStyle: 'italic', opacity: 0.85, lineHeight: 1.4, whiteSpace: 'pre-wrap' }}>
              "{gearEntry.Description}"
            </div>
          )}
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <button className="mc-btn mc-btn-icon" onClick={onClone} data-tooltip="Clone Item"><Copy size={14} /></button>
          <button className="mc-btn mc-btn-danger mc-btn-icon" onClick={onDelete} data-tooltip="Delete Item"><Trash2 size={14} /></button>
        </div>
      </div>

      {/* Stats */}
      <div>
        <div className="section-title">ITEM STATS</div>
        <div className="attr-row">
          <span className="attr-label">Power Level</span>
          <input type="number" className="mc-input" style={{ width: 100 }}
            value={power} min={1} max={9999} onChange={e => updatePower(Number(e.target.value))} />
          <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>
            Original: {entry.ItemData.GeneratorData?.PowerGeneratorValues?.ItemPowerOriginal ?? '?'}
          </span>
        </div>
        <div className="attr-row">
          <span className="attr-label">Rarity</span>
          <select className="mc-select" style={{ width: 150 }} value={entry.ItemData.RarityTag} onChange={e => updateRarity(e.target.value)}>
            {RARITIES.map(r => <option key={r.tag} value={r.tag}>{r.label}</option>)}
          </select>
        </div>
        <div className="attr-row">
          <span className="attr-label">Equipped Slot</span>
          <select className="mc-select" style={{ width: 240 }} value={entry.EquippedSlot} onChange={e => updateSlot(e.target.value)}>
            {EQUIPMENT_SLOTS.map(s => <option key={s.tag} value={s.tag}>{s.label}</option>)}
          </select>
        </div>
      </div>

      {/* Enchantments */}
      <div>
        <div className="section-title">ENCHANTMENT SLOTS</div>
        <div className="flex gap-2">
          {entry.ItemData.Effects.map((batch, bi) => (
            <div key={bi} className="enchant-slot flex-1" style={{ minWidth: 0 }}>
              <div className="enchant-slot-label">Slot {bi + 1}</div>
              {batch.EffectsInThisBatch.length === 0 && (
                <div style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 6, fontStyle: 'italic' }}>Empty</div>
              )}
              {batch.EffectsInThisBatch.map((eff, ei) => {
                const effName = getEffectName(eff.TypeTag);
                return (
                  <div key={ei} className="mb-2 p-2" style={{ background: 'var(--bg-void)', border: '1px solid var(--border-subtle)' }}>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <EnchantIcon effectTag={eff.TypeTag} size={14} />
                      <select className="mc-select" style={{ fontSize: 11, flex: 1, minWidth: 0 }}
                        value={eff.TypeTag}
                        onChange={e => updateEnchantField(bi, ei, 'TypeTag', e.target.value)}>
                        {/* Show current if not in list */}
                        {!EFFECT_LIST.find(ef => ef.Tag === eff.TypeTag) &&
                         !ENCHANT_LIST.find(en => en.Tag === eff.TypeTag) && (
                          <option value={eff.TypeTag}>{effName} ★</option>
                        )}
                        <optgroup label="Effects">
                          {EFFECT_LIST.map(ef => <option key={ef.Tag} value={ef.Tag}>{ef.Name}</option>)}
                        </optgroup>
                        <optgroup label="Enchantments">
                          {ENCHANT_LIST.map(en => <option key={en.Tag} value={en.Tag}>{en.Name}</option>)}
                        </optgroup>
                      </select>
                      <button className="mc-btn mc-btn-danger mc-btn-icon" style={{ padding: '2px 4px' }}
                        onClick={() => removeEnchant(bi, ei)}>
                        <Trash2 size={10} />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span style={{ color: 'var(--text-muted)', fontSize: 10, flexShrink: 0 }}>Tier</span>
                      <select className="mc-select" style={{ width: 60, fontSize: 11 }}
                        value={eff.Quality}
                        onChange={e => updateEnchantField(bi, ei, 'Quality', Number(e.target.value))}>
                        <option value={0}>None</option>
                        <option value={1}>I</option>
                        <option value={2}>II</option>
                        <option value={3}>III</option>
                      </select>
                      <div className="flex gap-0.5">
                        {[1, 2, 3].map(lv => (
                          <div key={lv} style={{
                            width: 12, height: 12,
                            background: eff.Quality >= lv ? 'var(--accent-gold)' : 'var(--bg-void)',
                            border: '1px solid var(--border-normal)',
                          }} />
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
              <button className="mc-btn mc-btn-primary w-full" style={{ fontSize: 10, padding: '4px 6px' }}
                onClick={() => addEnchant(bi)}>
                <Plus size={10} /> Add Enchantment
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Raw data */}
      <div>
        <button className="mc-btn text-xs mb-2" onClick={onToggleAdvanced}>
          {showAdvanced ? '▼' : '▶'} Advanced / Raw Data
        </button>
        {showAdvanced && (
          <div className="raw-viewer" style={{ maxHeight: 300 }}>{JSON.stringify(entry, null, 2)}</div>
        )}
      </div>
    </div>
  );
}
