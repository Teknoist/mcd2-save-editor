import { useState, useEffect } from 'react';
import { RefreshCw, Folder, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface GameInstall {
  found: boolean;
  path: string;
  version: string;
  pakPath: string;
  installType: string;
}

interface GameDataFile {
  name: string;
  size: number;
}

interface GameDataScan {
  pakFiles: GameDataFile[];
  utocFiles: GameDataFile[];
  ucasFiles: GameDataFile[];
  encryptionRequired: boolean;
}

export default function GameDataTab() {
  const [gameInstall, setGameInstall] = useState<GameInstall | null>(null);
  const [gameScan, setGameScan] = useState<GameDataScan | null>(null);
  const [loading, setLoading] = useState(false);
  const [version, setVersion] = useState('');

  useEffect(() => {
    loadGameInfo();
  }, []);

  const loadGameInfo = async () => {
    setLoading(true);
    const [install, ver] = await Promise.all([
      window.electronAPI.getGameInstall(),
      window.electronAPI.getAppVersion(),
    ]);
    setGameInstall(install);
    setVersion(ver);
    setLoading(false);
  };

  const runScan = async () => {
    if (!gameInstall?.found) return;
    setLoading(true);
    const scan = await window.electronAPI.scanGameData(gameInstall.path);
    setGameScan(scan);
    setLoading(false);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  };

  return (
    <div className="p-4 flex flex-col gap-4">
      <div className="section-title">GAME DATA & INSTALLATION</div>

      {/* App info */}
      <div className="panel-surface p-3 flex items-center justify-between">
        <div>
          <div style={{ fontFamily: 'VT323, monospace', fontSize: 18, color: 'var(--text-gold)', letterSpacing: 1 }}>
            MCD2 Save Editor
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>Version {version} • Unofficial Community Tool</div>
        </div>
        <button className="mc-btn" onClick={loadGameInfo} disabled={loading}>
          {loading ? <span className="loading-spinner" /> : <RefreshCw size={12} />}
          Refresh
        </button>
      </div>

      {/* Game Installation */}
      <section>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Game Installation
        </div>

        {loading && !gameInstall ? (
          <div className="panel-surface p-4 text-center" style={{ color: 'var(--text-muted)' }}>
            <span className="loading-spinner" style={{ display: 'inline-block' }} /> Detecting...
          </div>
        ) : gameInstall?.found ? (
          <div className="panel-surface p-3 flex items-start gap-3">
            <CheckCircle size={16} style={{ color: 'var(--color-rare)', flexShrink: 0, marginTop: 2 }} />
            <div className="flex-1 min-w-0">
              <div style={{ color: 'var(--color-rare)', fontSize: 12, marginBottom: 4 }}>Game detected</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: 11 }}>Version: {gameInstall.version}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: 11 }}>Type: {gameInstall.installType}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 4, wordBreak: 'break-all' }}>{gameInstall.path}</div>
            </div>
            <button className="mc-btn mc-btn-icon" onClick={() => window.electronAPI.openFolder(gameInstall.path)}>
              <Folder size={12} />
            </button>
          </div>
        ) : (
          <div className="panel-surface p-3 flex items-start gap-3" style={{ borderColor: '#aa2222' }}>
            <XCircle size={16} style={{ color: 'var(--accent-red)', flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ color: 'var(--accent-red)', fontSize: 12, marginBottom: 4 }}>Game not detected</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: 11 }}>
                Minecraft Dungeons 2 was not found in the default Xbox/Microsoft Store location.
                Make sure the game is installed via Xbox App or Microsoft Store.
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Pak Files */}
      {gameInstall?.found && (
        <section>
          <div className="flex items-center justify-between mb-2">
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Game Asset Files
            </div>
            <button className="mc-btn text-xs" onClick={runScan} disabled={loading}>
              {loading ? <span className="loading-spinner" /> : <RefreshCw size={11} />}
              Scan
            </button>
          </div>

          {gameScan ? (
            <div className="flex flex-col gap-2">
              {/* Pak files */}
              {gameScan.pakFiles.map((f, i) => (
                <div key={i} className="panel-surface p-2 flex items-center justify-between">
                  <div style={{ fontSize: 11 }}>
                    <span style={{ color: 'var(--text-primary)' }}>{f.name}</span>
                    <span style={{ color: 'var(--text-muted)', marginLeft: 8 }}>PAK</span>
                  </div>
                  <span style={{ color: 'var(--text-secondary)', fontSize: 11 }}>{formatSize(f.size)}</span>
                </div>
              ))}
              {gameScan.utocFiles.map((f, i) => (
                <div key={i} className="panel-surface p-2 flex items-center justify-between">
                  <div style={{ fontSize: 11 }}>
                    <span style={{ color: 'var(--text-primary)' }}>{f.name}</span>
                    <span style={{ color: 'var(--text-muted)', marginLeft: 8 }}>UTOC</span>
                  </div>
                  <span style={{ color: 'var(--text-secondary)', fontSize: 11 }}>{formatSize(f.size)}</span>
                </div>
              ))}
              {gameScan.ucasFiles.map((f, i) => (
                <div key={i} className="panel-surface p-2 flex items-center justify-between">
                  <div style={{ fontSize: 11 }}>
                    <span style={{ color: 'var(--text-primary)' }}>{f.name}</span>
                    <span style={{ color: 'var(--text-muted)', marginLeft: 8 }}>UCAS</span>
                  </div>
                  <span style={{ color: 'var(--text-secondary)', fontSize: 11 }}>{formatSize(f.size)}</span>
                </div>
              ))}

              {gameScan.encryptionRequired && (
                <div className="p-3 flex items-start gap-2" style={{ background: 'rgba(255,200,0,0.05)', border: '1px solid rgba(255,200,0,0.2)' }}>
                  <AlertCircle size={14} style={{ color: 'var(--accent-gold)', flexShrink: 0, marginTop: 1 }} />
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                    <strong style={{ color: 'var(--accent-gold)' }}>AES Encryption Detected:</strong> The game's PAK/UCAS files are AES-encrypted
                    (standard for UE5 games). The AES key for this newly released game has not yet been published
                    by the modding community. As a result, dynamic icon extraction from game files is not yet
                    available. The editor uses accurate SVG-rendered icons that represent each item type.
                    <br /><br />
                    When the community key becomes available, you can provide it in Settings to enable
                    real game asset extraction.
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="panel-surface p-4 text-center" style={{ color: 'var(--text-muted)', fontSize: 11 }}>
              Click "Scan" to analyze game asset files.
            </div>
          )}
        </section>
      )}

      {/* Data source info */}
      <section>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Data Sources
        </div>
        <div className="flex flex-col gap-1">
          {[
            { label: 'Save Format', status: 'verified', desc: 'FCharacterSaveV1 JSON format confirmed from real save files' },
            { label: 'Item Types', status: 'verified', desc: 'Extracted from actual save file analysis (60+ item types)' },
            { label: 'Enchantment Types', status: 'verified', desc: 'Extracted from actual save file analysis (33 effects)' },
            { label: 'Equipment Slots', status: 'verified', desc: 'All 14 slots confirmed from real equipped items' },
            { label: 'Item Icons', status: 'limited', desc: 'Accurate category-based SVG icons (game pak is encrypted)' },
            { label: 'Item Names/Descriptions', status: 'limited', desc: 'Derived from TypeTag names (localization files encrypted)' },
          ].map((item, i) => (
            <div key={i} className="panel-surface p-2 flex items-start gap-3">
              {item.status === 'verified' ? (
                <CheckCircle size={13} style={{ color: 'var(--color-rare)', flexShrink: 0, marginTop: 1 }} />
              ) : (
                <AlertCircle size={13} style={{ color: 'var(--accent-gold)', flexShrink: 0, marginTop: 1 }} />
              )}
              <div>
                <div style={{ color: 'var(--text-primary)', fontSize: 11 }}>{item.label}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 10 }}>{item.desc}</div>
              </div>
              <span className={`badge ml-auto ${item.status === 'verified' ? 'badge-green' : 'badge-gold'}`}>
                {item.status === 'verified' ? 'VERIFIED' : 'LIMITED'}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
