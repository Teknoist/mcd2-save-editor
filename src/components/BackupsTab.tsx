import { useState } from 'react';
import { RotateCcw, Clock, Folder, AlertTriangle } from 'lucide-react';
import type { SaveFileInfo } from '../core/types';

interface BackupEntry {
  path: string;
  timestamp: number;
  size: number;
}

interface BackupsTabProps {
  currentSaveInfo: SaveFileInfo | null;
}

export default function BackupsTab({ currentSaveInfo }: BackupsTabProps) {
  const [backups, setBackups] = useState<BackupEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [loaded, setLoaded] = useState(false);

  const loadBackups = async () => {
    if (!currentSaveInfo) return;
    setLoading(true);
    const result = await window.electronAPI.getBackups(currentSaveInfo.path);
    setBackups(result);
    setLoaded(true);
    setLoading(false);
  };

  const handleRestore = async (backupPath: string) => {
    if (!currentSaveInfo) return;
    if (!confirm('This will overwrite the current save with the backup. Current save will be backed up first. Continue?')) return;
    setLoading(true);
    const result = await window.electronAPI.restoreBackup(backupPath, currentSaveInfo.path);
    if (result.success) {
      setStatus('✓ Backup restored successfully. Please reload the save.');
    } else {
      setStatus(`✗ Restore failed: ${result.error}`);
    }
    setLoading(false);
    loadBackups();
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const openFolder = () => {
    if (currentSaveInfo) {
      const dir = currentSaveInfo.path.substring(0, currentSaveInfo.path.lastIndexOf('\\'));
      window.electronAPI.openFolder(dir);
    }
  };

  return (
    <div className="p-4 flex flex-col gap-4">
      <div className="section-title">SAVE BACKUPS</div>

      {!currentSaveInfo ? (
        <div className="panel-surface p-4 text-center" style={{ color: 'var(--text-muted)' }}>
          No save file selected. Open a save to manage its backups.
        </div>
      ) : (
        <>
          {/* Current save info */}
          <div className="panel-surface p-3 flex items-center justify-between">
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>CURRENT SAVE</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', wordBreak: 'break-all' }}>{currentSaveInfo.path}</div>
            </div>
            <div className="flex gap-2 flex-shrink-0 ml-4">
              <button className="mc-btn" onClick={openFolder}>
                <Folder size={12} /> Open Folder
              </button>
              <button className="mc-btn mc-btn-primary" onClick={loadBackups} disabled={loading}>
                {loading ? <span className="loading-spinner" /> : <RotateCcw size={12} />}
                {loaded ? 'Refresh' : 'Load Backups'}
              </button>
            </div>
          </div>

          {status && (
            <div className="panel-surface p-3" style={{ borderColor: status.startsWith('✓') ? 'var(--color-rare)' : 'var(--accent-red)', color: status.startsWith('✓') ? 'var(--color-rare)' : 'var(--accent-red)' }}>
              {status}
            </div>
          )}

          {/* Backups list */}
          {loaded && (
            <>
              {backups.length === 0 ? (
                <div className="panel-surface p-4 text-center" style={{ color: 'var(--text-muted)' }}>
                  No backups found for this save. Backups are created automatically when you save changes.
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  {backups.map((b, i) => (
                    <div key={i} className="panel-surface p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Clock size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                        <div>
                          <div style={{ fontSize: 12, color: 'var(--text-primary)' }}>
                            {new Date(b.timestamp).toLocaleString()}
                          </div>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                            {formatSize(b.size)} • {b.path.split('\\').pop()}
                          </div>
                        </div>
                      </div>
                      <button
                        className="mc-btn mc-btn-gold text-xs"
                        onClick={() => handleRestore(b.path)}
                        disabled={loading}
                      >
                        <RotateCcw size={11} /> Restore
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Warning */}
          <div className="p-3 flex items-start gap-2" style={{ background: 'rgba(240,192,48,0.05)', border: '1px solid rgba(240,192,48,0.2)' }}>
            <AlertTriangle size={14} style={{ color: 'var(--accent-gold)', flexShrink: 0, marginTop: 1 }} />
            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
              Backups are stored alongside the original save file. A new backup is automatically created before each save operation. When Xbox Cloud syncs, local backups may not be available on other devices.
            </div>
          </div>
        </>
      )}
    </div>
  );
}
