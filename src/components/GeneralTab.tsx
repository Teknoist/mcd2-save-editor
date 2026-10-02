import type { SaveFile } from '../core/types';

interface GeneralTabProps {
  saveData: SaveFile;
  updateSaveData: (data: SaveFile, description: string) => void;
}

export default function GeneralTab({ saveData, updateSaveData }: GeneralTabProps) {
  const meta = saveData.CharacterSaveV1.MetaData;
  const attrs = saveData.CharacterSaveV1.Ability.Attributes;

  const getAttr = (name: string) => attrs.find(a => a.AttributeName === name)?.CurrentValue ?? 0;

  const setAttr = (name: string, value: number) => {
    const newData: SaveFile = JSON.parse(JSON.stringify(saveData));
    const found = newData.CharacterSaveV1.Ability.Attributes.find(a => a.AttributeName === name);
    if (found) {
      found.CurrentValue = value;
    } else {
      newData.CharacterSaveV1.Ability.Attributes.push({ AttributeName: name, CurrentValue: value });
    }
    updateSaveData(newData, `Set ${name} to ${value}`);
  };

  const setMeta = (field: keyof typeof meta, value: unknown) => {
    const newData: SaveFile = JSON.parse(JSON.stringify(saveData));
    (newData.CharacterSaveV1.MetaData as Record<string, unknown>)[field as string] = value;
    updateSaveData(newData, `Set ${String(field)} to ${value}`);
  };

  const currencies = [
    { key: 'Emeralds', label: 'Emeralds', color: '#5ab552', icon: '◆' },
    { key: 'EnchantmentPoints', label: 'Enchantment Points', color: '#cc77ff', icon: '✦' },
    { key: 'SpringStone', label: 'Spring Stones', color: '#44aaff', icon: '◈' },
    { key: 'Gold', label: 'Gold', color: '#f0c030', icon: '◉' },
  ];

  const merchantAttrs = [
    { key: 'VillageMerchantRefreshCharges', label: 'Merchant Refresh Charges' },
    { key: 'VillageMerchantUpgradeLevel', label: 'Merchant Upgrade Level' },
    { key: 'EnchantsmithUpgradeLevel', label: 'Enchantsmith Upgrade Level' },
    { key: 'OldBlacksmithUpgradeLevel', label: 'Blacksmith Upgrade Level' },
  ];

  return (
    <div className="p-4 flex flex-col gap-6">
      {/* Character Info */}
      <section>
        <div className="section-title">CHARACTER INFO</div>
        <div className="grid grid-cols-2 gap-3">
          <div className="panel-surface p-3">
            <div className="attr-label mb-1" style={{ fontSize: 10 }}>Character ID</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 11, wordBreak: 'break-all' }}>{meta.CharacterId}</div>
          </div>
          <div className="panel-surface p-3">
            <div className="attr-label mb-1" style={{ fontSize: 10 }}>Current Location</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{meta.CurrentLocation || 'None'}</div>
          </div>
          <div className="panel-surface p-3">
            <div className="attr-label mb-1" style={{ fontSize: 10 }}>Difficulty</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{meta.CurrentDifficulty || 'None'}</div>
          </div>
          <div className="panel-surface p-3">
            <div className="attr-label mb-1" style={{ fontSize: 10 }}>Save Version</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
              v{saveData.SerializeMeta.SoftVersion} ({saveData.SerializeMeta.HardFormat})
            </div>
          </div>
        </div>
      </section>

      {/* Character Stats */}
      <section>
        <div className="section-title">CHARACTER STATS</div>
        <div className="grid grid-cols-2 gap-2">
          <div className="attr-row">
            <span className="attr-label">Character Level</span>
            <input
              type="number" min={1} max={9999}
              className="mc-input"
              style={{ width: 100 }}
              value={meta.Level}
              onChange={e => setMeta('Level', Number(e.target.value))}
            />
          </div>
          <div className="attr-row">
            <span className="attr-label">Power Level</span>
            <input
              type="number" min={1} max={9999}
              className="mc-input"
              style={{ width: 100 }}
              value={meta.PowerLevel}
              onChange={e => setMeta('PowerLevel', Number(e.target.value))}
            />
          </div>
          <div className="attr-row">
            <span className="attr-label">XP</span>
            <input
              type="number" min={0}
              className="mc-input"
              style={{ width: 120 }}
              value={getAttr('XP')}
              onChange={e => setAttr('XP', Number(e.target.value))}
            />
          </div>
        </div>
      </section>

      {/* Currencies */}
      <section>
        <div className="section-title">CURRENCIES</div>
        <div className="grid grid-cols-2 gap-3">
          {currencies.map(c => (
            <div key={c.key} className="panel-surface p-3 flex items-center gap-3">
              <span style={{ color: c.color, fontSize: 20, flexShrink: 0 }}>{c.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="attr-label mb-1" style={{ fontSize: 10 }}>{c.label}</div>
                <input
                  type="number"
                  min={0}
                  max={2147483647}
                  className="mc-input"
                  style={{ width: '100%' }}
                  value={getAttr(c.key)}
                  onChange={e => setAttr(c.key, Number(e.target.value))}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Merchants */}
      <section>
        <div className="section-title">MERCHANTS & VILLAGE</div>
        {merchantAttrs.map(m => (
          <div key={m.key} className="attr-row">
            <span className="attr-label">{m.label}</span>
            <input
              type="number"
              min={0}
              className="mc-input"
              style={{ width: 100 }}
              value={getAttr(m.key)}
              onChange={e => setAttr(m.key, Number(e.target.value))}
            />
          </div>
        ))}
      </section>

      {/* Progression Tags */}
      {saveData.CharacterSaveV1.Ability.ProgressionTags && (saveData.CharacterSaveV1.Ability.ProgressionTags as string[]).length > 0 && (
        <section>
          <div className="section-title">PROGRESSION TAGS</div>
          <div className="flex flex-wrap gap-1">
            {(saveData.CharacterSaveV1.Ability.ProgressionTags as string[]).map((tag, i) => (
              <span key={i} className="badge badge-purple">{tag}</span>
            ))}
          </div>
        </section>
      )}

      {/* Release Toggles */}
      {meta.ReleaseToggles && meta.ReleaseToggles.length > 0 && (
        <section>
          <div className="section-title">RELEASE TOGGLES</div>
          <div className="flex flex-wrap gap-1">
            {meta.ReleaseToggles.map((t, i) => (
              <span key={i} className="badge badge-green">{t}</span>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
