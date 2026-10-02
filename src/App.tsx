import { useState, useEffect } from 'react';
import {
  Save, RefreshCw, Undo2, Redo2, User, Package, Database, HardDrive, Clock, AlertTriangle
} from 'lucide-react';
import GeneralTab from './components/GeneralTab';
import InventoryTab from './components/InventoryTab';
import BackupsTab from './components/BackupsTab';
import GameDataTab from './components/GameDataTab';
import type { SaveFile, SaveFileInfo } from './core/types';
import { historyService } from './core/historyService';

// ===== Toast Notification =====
interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

let toastIdCounter = 0;

function ToastContainer({ toasts }: { toasts: Toast[] }) {
  return (
    <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 1000, display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none' }}>
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`}>{t.message}</div>
      ))}
    </div>
  );
}

export default function App() {
  const [saves, setSaves] = useState<SaveFileInfo[]>([]);
  const [currentSaveInfo, setCurrentSaveInfo] = useState<SaveFileInfo | null>(null);
  const [currentSaveData, setCurrentSaveData] = useState<SaveFile | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'inventory' | 'backups' | 'gamedata'>('general');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  useEffect(() => {
    loadSaveList();

    // Keyboard shortcuts
    const handleKeydown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); handleUndo(); }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); handleRedo(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); handleSave(); }
    };
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [currentSaveData, currentSaveInfo]);

  const showToast = (message: string, type: Toast['type'] = 'info') => {
    const id = ++toastIdCounter;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };

  const loadSaveList = async () => {
    setLoading(true);
    try {
      const result = await window.electronAPI.getSaves();
      setSaves(result);
    } catch (err) {
      showToast('Failed to load save list', 'error');
    }
    setLoading(false);
  };

  const openSave = async (info: SaveFileInfo) => {
    if (isDirty && !confirm('Discard unsaved changes?')) return;
    setLoading(true);
    const result = await window.electronAPI.readSave(info.path);
    if (result.success && result.data) {
      setCurrentSaveInfo(info);
      setCurrentSaveData(result.data);
      setIsDirty(false);
      historyService.clear();
      historyService.push('Opened save', result.data);
      setCanUndo(false);
      setCanRedo(false);
      setActiveTab('general');
      showToast(`Loaded: Character ${info.level > 0 ? `Level ${info.level}` : ''}`, 'success');
    } else {
      showToast(`Failed to read save: ${result.error}`, 'error');
    }
    setLoading(false);
  };

  const updateSaveData = (data: SaveFile, description: string) => {
    setCurrentSaveData(data);
    setIsDirty(true);
    historyService.push(description, data);
    setCanUndo(historyService.canUndo());
    setCanRedo(historyService.canRedo());
  };

  const handleUndo = () => {
    const result = historyService.undo();
    if (result) {
      setCurrentSaveData(result.data);
      setIsDirty(true);
      setCanUndo(historyService.canUndo());
      setCanRedo(historyService.canRedo());
      showToast(`Undo: ${result.description}`, 'info');
    }
  };

  const handleRedo = () => {
    const result = historyService.redo();
    if (result) {
      setCurrentSaveData(result.data);
      setIsDirty(true);
      setCanUndo(historyService.canUndo());
      setCanRedo(historyService.canRedo());
      showToast(`Redo: ${result.description}`, 'info');
    }
  };

  const handleSave = async () => {
    if (!currentSaveData || !currentSaveInfo) return;
    setSaving(true);
    const result = await window.electronAPI.writeSave(currentSaveInfo.path, currentSaveData);
    if (result.success) {
      setIsDirty(false);
      showToast('Save written successfully! Backup created.', 'success');
    } else {
      showToast(`Save failed: ${result.error}`, 'error');
    }
    setSaving(false);
  };

  const tabs = [
    { id: 'general' as const, label: 'General', Icon: User, requiresSave: true },
    { id: 'inventory' as const, label: 'Inventory', Icon: Package, requiresSave: true },
    { id: 'backups' as const, label: 'Backups', Icon: Clock, requiresSave: false },
    { id: 'gamedata' as const, label: 'Game Data', Icon: Database, requiresSave: false },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg-void)', overflow: 'hidden' }}>
      {/* ===== TOP BAR ===== */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        height: 48,
        background: 'var(--bg-deep)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '0 12px',
        gap: 12,
        flexShrink: 0,
      }}>
        {/* Logo */}
        <div style={{ fontFamily: 'VT323, monospace', fontSize: 20, color: 'var(--text-gold)', letterSpacing: 2, flexShrink: 0 }}>
          MCD2
        </div>
        <div style={{ width: 1, background: 'var(--border-subtle)', height: 24 }} />

        {/* Tabs */}
        <div style={{ display: 'flex', flex: 1 }}>
          {tabs.map(({ id, label, Icon }) => (
            <button
              key={id}
              className={`tab-btn ${activeTab === id ? 'active' : ''}`}
              onClick={() => setActiveTab(id)}
              disabled={id !== 'general' && id !== 'inventory' ? false : !currentSaveData}
            >
              <Icon size={13} />
              {label}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {isDirty && (
            <span className="badge badge-gold">UNSAVED</span>
          )}
          <button className="mc-btn mc-btn-icon" onClick={handleUndo} disabled={!canUndo} data-tooltip="Undo (Ctrl+Z)">
            <Undo2 size={14} />
          </button>
          <button className="mc-btn mc-btn-icon" onClick={handleRedo} disabled={!canRedo} data-tooltip="Redo (Ctrl+Y)">
            <Redo2 size={14} />
          </button>
          <button
            className="mc-btn mc-btn-primary"
            onClick={handleSave}
            disabled={!currentSaveData || !isDirty || saving}
          >
            {saving ? <span className="loading-spinner" /> : <Save size={13} />}
            Save
          </button>
        </div>
      </div>

      {/* ===== MAIN LAYOUT ===== */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* ===== LEFT SIDEBAR - Save List ===== */}
        <div style={{
          width: 220,
          background: 'var(--bg-deep)',
          borderRight: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
        }}>
          <div style={{ padding: '10px 12px 6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              <HardDrive size={11} style={{ display: 'inline', marginRight: 4 }} />
              Characters
            </span>
            <button className="mc-btn mc-btn-icon" style={{ padding: 3 }} onClick={loadSaveList} disabled={loading}>
              <RefreshCw size={11} />
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px 8px' }}>
            {loading && saves.length === 0 && (
              <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                <span className="loading-spinner" style={{ display: 'inline-block', marginBottom: 8 }} />
                <div style={{ fontSize: 11 }}>Scanning...</div>
              </div>
            )}

            {!loading && saves.length === 0 && (
              <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 11 }}>
                <AlertTriangle size={24} style={{ display: 'block', margin: '0 auto 8px' }} />
                No saves found.<br />Make sure MCD2 is installed.
              </div>
            )}

            {saves.map((s, i) => (
              <div
                key={s.path}
                className={`save-list-item ${currentSaveInfo?.path === s.path ? 'active' : ''}`}
                onClick={() => openSave(s)}
              >
                <div style={{ fontFamily: 'VT323, monospace', fontSize: 15, color: currentSaveInfo?.path === s.path ? 'var(--text-gold)' : 'var(--text-primary)', letterSpacing: 0.5 }}>
                  HERO {i + 1}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>
                  Lv.{s.level} • Power {s.powerLevel}
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>
                  {new Date(s.lastModified).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ===== MAIN CONTENT AREA ===== */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {activeTab === 'general' && currentSaveData ? (
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <GeneralTab saveData={currentSaveData} updateSaveData={updateSaveData} />
            </div>
          ) : activeTab === 'inventory' && currentSaveData ? (
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <InventoryTab saveData={currentSaveData} updateSaveData={updateSaveData} />
            </div>
          ) : activeTab === 'backups' ? (
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <BackupsTab currentSaveInfo={currentSaveInfo} />
            </div>
          ) : activeTab === 'gamedata' ? (
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <GameDataTab />
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
              <div style={{ fontFamily: 'VT323, monospace', fontSize: 40, color: 'var(--text-gold)', letterSpacing: 4 }}>
                MCD2
              </div>
              <div style={{ fontFamily: 'VT323, monospace', fontSize: 20, color: 'var(--text-secondary)', letterSpacing: 2 }}>
                SAVE EDITOR
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: 12, textAlign: 'center', maxWidth: 280 }}>
                Select a character from the left panel to begin editing.
              </div>
            </div>
          )}
        </div>
      </div>

      <ToastContainer toasts={toasts} />
    </div>
  );
}
