'use strict';

const { app, BrowserWindow, ipcMain, Menu, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');

// ---------------------------------------------------------------------------
// In-memory logger
// ---------------------------------------------------------------------------
const LOG_MAX = 1000;
const logs = [];

function addLog(level, message) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,    // 'info' | 'warn' | 'error' | 'debug'
    message,
  };
  logs.push(entry);
  if (logs.length > LOG_MAX) logs.shift();
  // Mirror to Node console so Electron DevTools / terminal shows output
  const fn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
  fn(`[${entry.timestamp}] [${level.toUpperCase()}] ${message}`);
}

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------
const LOCAL_APP_DATA = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
const WGS_ROOT = path.join(
  LOCAL_APP_DATA,
  'Packages',
  'Microsoft.MinecraftDungeons2_8wekyb3d8bbwe',
  'SystemAppData',
  'wgs'
);
const WINDOWS_APPS_ROOT = path.join('C:\\', 'Program Files', 'WindowsApps');

// ---------------------------------------------------------------------------
// WGS Binary Parser: reads containers.index to find ACTIVE character save blobs
// Based on research from Tonystukl/MCD2SaveEdit (MIT) and Xbox WGS format.
// ---------------------------------------------------------------------------

function readWgsString(buf, offset) {
  const len = buf.readInt32LE(offset); offset += 4;
  if (len < 0 || len > 65536) throw new Error(`Invalid string length: ${len}`);
  const byteLen = len * 2;
  const value = buf.slice(offset, offset + byteLen).toString('utf16le');
  return { value, nextOffset: offset + byteLen };
}

function bufToGuidNoDash(buf) {
  const h = (b) => b.toString(16).padStart(2, '0').toUpperCase();
  return (
    h(buf[3])+h(buf[2])+h(buf[1])+h(buf[0]) +
    h(buf[5])+h(buf[4]) + h(buf[7])+h(buf[6]) +
    h(buf[8])+h(buf[9]) +
    h(buf[10])+h(buf[11])+h(buf[12])+h(buf[13])+h(buf[14])+h(buf[15])
  );
}

function wgsActiveCharacterBlobs(wgsRoot) {
  const results = [];
  let accountDirs;
  try {
    accountDirs = fs.readdirSync(wgsRoot, { withFileTypes: true })
      .filter(e => e.isDirectory()).map(e => path.join(wgsRoot, e.name));
  } catch { return results; }

  for (const accountDir of accountDirs) {
    const indexPath = path.join(accountDir, 'containers.index');
    if (!fs.existsSync(indexPath)) continue;
    let buf;
    try { buf = fs.readFileSync(indexPath); } catch { continue; }
    try {
      let offset = 0;
      const version = buf.readInt32LE(offset); offset += 4;
      if (version !== 14) continue;
      const count = buf.readInt32LE(offset); offset += 4;
      if (count < 0 || count > 10000) continue;

      offset += 4; // skip unknown int32
      const pkgRes = readWgsString(buf, offset); offset = pkgRes.nextOffset;
      if (!pkgRes.value.startsWith('Microsoft.MinecraftDungeons2_')) continue;

      // Skip: int64, int32, string, int64
      offset += 8; offset += 4;
      const s = readWgsString(buf, offset); offset = s.nextOffset;
      offset += 8;

      for (let i = 0; i < count; i++) {
        const n1 = readWgsString(buf, offset); offset = n1.nextOffset;
        const n2 = readWgsString(buf, offset); offset = n2.nextOffset;
        const name = n1.value;
        const cloud = readWgsString(buf, offset); offset = cloud.nextOffset; // skip cloud revision

        const sequence = buf.readUInt8(offset); offset += 1;
        offset += 4; // skip int32
        const folderGuidBytes = buf.slice(offset, offset + 16); offset += 16;
        offset += 8; offset += 8; // timestamps
        const sizeBI = buf.readBigInt64LE(offset); offset += 8;

        if (!name.startsWith('Character')) continue;

        const folderGuid = bufToGuidNoDash(folderGuidBytes);
        const containerDir = path.join(accountDir, folderGuid);
        const containerFile = path.join(containerDir, `container.${sequence}`);
        let tableBuf;
        try { tableBuf = fs.readFileSync(containerFile); } catch { continue; }
        if (tableBuf.length !== 168) continue;
        if (tableBuf.readInt32LE(0) !== 4 || tableBuf.readInt32LE(4) !== 1) continue;
        const label = tableBuf.slice(8, 136).toString('utf16le').replace(/\0+$/, '');
        if (label !== 'Data') continue;
        const blobGuid = bufToGuidNoDash(tableBuf.slice(152, 168));
        const blobPath = path.join(containerDir, blobGuid);
        if (fs.existsSync(blobPath)) {
          addLog('info', `wgs: found character blob: ${blobPath}`);
          results.push(blobPath);
        }
      }
    } catch (err) {
      addLog('warn', `wgs parse error at ${indexPath}: ${err.message}`);
    }
  }
  return results;
}

// ---------------------------------------------------------------------------
// Helper: try to parse save header (regex-based, no full JSON parse needed)
// Returns { characterId, level, powerLevel, softVersion } or null
// ---------------------------------------------------------------------------
const HEADER_MARKER = '{"SerializeMeta"';

function parseSaveHeader(filePath) {
  try {
    const stat = fs.statSync(filePath);
    if (stat.size < 10 || stat.size > 33554432) return null;
    const readLen = Math.min(stat.size, 1024);
    const fd = fs.openSync(filePath, 'r');
    const buf = Buffer.alloc(readLen);
    const bytesRead = fs.readSync(fd, buf, 0, readLen, 0);
    fs.closeSync(fd);
    let snippet = buf.slice(0, bytesRead).toString('utf8');
    if (!snippet.startsWith(HEADER_MARKER)) return null;
    // Extend if we need more context for MetaData
    if (!snippet.includes('"Level"') && stat.size > readLen) {
      const fd2 = fs.openSync(filePath, 'r');
      const buf2 = Buffer.alloc(Math.min(stat.size, 4096));
      const read2 = fs.readSync(fd2, buf2, 0, buf2.length, 0);
      fs.closeSync(fd2);
      snippet = buf2.slice(0, read2).toString('utf8');
    }
    return {
      characterId: snippet.match(/"CharacterId"\s*:\s*"([^"]+)"/)?.[1] ?? null,
      level: +(snippet.match(/"Level"\s*:\s*(\d+)/)?.[1] ?? 0),
      powerLevel: +(snippet.match(/"PowerLevel"\s*:\s*(\d+)/)?.[1] ?? 0),
      softVersion: +(snippet.match(/"SoftVersion"\s*:\s*(\d+)/)?.[1] ?? 0),
    };
  } catch { return null; }
}

// ---------------------------------------------------------------------------
// IPC: get-saves
// ---------------------------------------------------------------------------
ipcMain.handle('get-saves', async () => {
  addLog('info', `get-saves: scanning ${WGS_ROOT}`);
  try {
    if (!fs.existsSync(WGS_ROOT)) {
      addLog('warn', `get-saves: WGS root not found: ${WGS_ROOT}`);
      return [];
    }

    // Use Xbox WGS binary parser — reads containers.index to find ACTIVE blobs only
    // This correctly handles Xbox Cloud Sync stale blobs that must not be opened
    let blobPaths = wgsActiveCharacterBlobs(WGS_ROOT);
    addLog('info', `get-saves: WGS parser found ${blobPaths.length} character blob(s)`);

    // Fallback: if WGS parser finds nothing (non-Xbox install or format mismatch),
    // fall back to scanning for any JSON file starting with {"SerializeMeta"
    if (blobPaths.length === 0) {
      addLog('warn', 'get-saves: WGS parser found 0 blobs, falling back to full directory scan');
      const allFiles = [];
      const scanDir = (dir) => {
        try {
          for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
            const fp = path.join(dir, e.name);
            if (e.isDirectory()) scanDir(fp);
            else if (e.isFile() && !e.name.startsWith('container')) allFiles.push(fp);
          }
        } catch {}
      };
      scanDir(WGS_ROOT);
      blobPaths = allFiles.filter(f => parseSaveHeader(f) !== null);
    }

    const saves = [];
    for (const filePath of blobPaths) {
      const header = parseSaveHeader(filePath);
      if (!header) continue;
      let stat;
      try { stat = fs.statSync(filePath); } catch { continue; }
      saves.push({
        path: filePath,
        lastModified: stat.mtimeMs,
        size: stat.size,
        characterId: header.characterId,
        level: header.level,
        powerLevel: header.powerLevel,
        softVersion: header.softVersion,
      });
    }

    saves.sort((a, b) => b.lastModified - a.lastModified);
    addLog('info', `get-saves: returned ${saves.length} character save(s)`);
    return saves;
  } catch (err) {
    addLog('error', `get-saves: ${err.message}`);
    return [];
  }
});

// ---------------------------------------------------------------------------
// IPC: read-save
// ---------------------------------------------------------------------------
ipcMain.handle('read-save', async (_event, filePath) => {
  addLog('info', `read-save: ${filePath}`);
  try {
    if (!filePath || typeof filePath !== 'string') throw new Error('Invalid path argument');

    const raw = fs.readFileSync(filePath);
    const text = raw.toString('utf8');

    const braceIdx = text.indexOf('{');
    if (braceIdx === -1) throw new Error('No JSON object found in file');

    const jsonText = text.slice(braceIdx);
    const data = JSON.parse(jsonText);

    addLog('info', `read-save: success (${raw.length} bytes)`);
    return { success: true, data, path: filePath, size: raw.length };
  } catch (err) {
    addLog('error', `read-save error: ${err.message}`);
    return { success: false, error: err.message };
  }
});

// ---------------------------------------------------------------------------
// IPC: write-save  (atomic with backup)
// ---------------------------------------------------------------------------
ipcMain.handle('write-save', async (_event, filePath, jsonData) => {
  addLog('info', `write-save: ${filePath}`);
  try {
    if (!filePath || typeof filePath !== 'string') throw new Error('Invalid path argument');
    if (jsonData === undefined || jsonData === null) throw new Error('No data provided');

    // Validate round-trip
    JSON.parse(JSON.stringify(jsonData));

    const backupPath = `${filePath}.bak${Date.now()}`;
    const tmpPath    = `${filePath}.tmp`;

    // 1. Create backup of existing file (if it exists)
    if (fs.existsSync(filePath)) {
      fs.copyFileSync(filePath, backupPath);
      addLog('info', `write-save: backup created at ${backupPath}`);
    }

    // 2. Write temp file
    const serialized = JSON.stringify(jsonData, null, 2);
    fs.writeFileSync(tmpPath, serialized, { encoding: 'utf8', flag: 'w' });

    // 3. Atomic rename
    fs.renameSync(tmpPath, filePath);

    addLog('info', `write-save: success`);
    return { success: true, backupPath };
  } catch (err) {
    addLog('error', `write-save error: ${err.message}`);
    // Clean up orphaned tmp file if it exists
    try {
      const tmpPath = `${filePath}.tmp`;
      if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
    } catch { /* ignore */ }
    return { success: false, error: err.message };
  }
});

// ---------------------------------------------------------------------------
// IPC: get-backups
// ---------------------------------------------------------------------------
ipcMain.handle('get-backups', async (_event, savePath) => {
  addLog('info', `get-backups: ${savePath}`);
  try {
    if (!savePath || typeof savePath !== 'string') throw new Error('Invalid path argument');

    const dir      = path.dirname(savePath);
    const basename = path.basename(savePath);

    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return [];
    }

    const prefix = `${basename}.bak`;
    const backups = [];

    for (const entry of entries) {
      if (!entry.isFile()) continue;
      if (!entry.name.startsWith(prefix)) continue;

      const fullPath = path.join(dir, entry.name);
      let stat;
      try {
        stat = fs.statSync(fullPath);
      } catch { continue; }

      // Extract timestamp from suffix (e.g. ".bak1712345678901")
      const suffix    = entry.name.slice(prefix.length);
      const tsNum     = parseInt(suffix, 10);
      const timestamp = isNaN(tsNum) ? stat.mtimeMs : tsNum;

      backups.push({ path: fullPath, timestamp, size: stat.size });
    }

    backups.sort((a, b) => b.timestamp - a.timestamp);
    addLog('info', `get-backups: found ${backups.length} backup(s)`);
    return backups;
  } catch (err) {
    addLog('error', `get-backups error: ${err.message}`);
    return [];
  }
});

// ---------------------------------------------------------------------------
// IPC: restore-backup
// ---------------------------------------------------------------------------
ipcMain.handle('restore-backup', async (_event, backupPath, targetPath) => {
  addLog('info', `restore-backup: ${backupPath} -> ${targetPath}`);
  try {
    if (!backupPath || !targetPath) throw new Error('Invalid path arguments');

    // Create a safety backup of the current target before overwriting
    if (fs.existsSync(targetPath)) {
      const safetyBackup = `${targetPath}.bak${Date.now()}`;
      fs.copyFileSync(targetPath, safetyBackup);
      addLog('info', `restore-backup: safety backup at ${safetyBackup}`);
    }

    fs.copyFileSync(backupPath, targetPath);
    addLog('info', `restore-backup: success`);
    return { success: true };
  } catch (err) {
    addLog('error', `restore-backup error: ${err.message}`);
    return { success: false, error: err.message };
  }
});

// ---------------------------------------------------------------------------
// IPC: get-game-install
// ---------------------------------------------------------------------------
ipcMain.handle('get-game-install', async () => {
  addLog('debug', 'get-game-install called');
  const possiblePaths = [
    // Windows Store / Game Pass
    path.join('C:\\', 'Program Files', 'WindowsApps', 'Microsoft.MinecraftDungeons2_1.1.1.0_x64__8wekyb3d8bbwe'),
    path.join('C:\\', 'XboxGames', 'Minecraft Dungeons 2', 'Content'),
    path.join('D:\\', 'XboxGames', 'Minecraft Dungeons 2', 'Content'),
    path.join('E:\\', 'XboxGames', 'Minecraft Dungeons 2', 'Content'),
    
    // Steam
    path.join(process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)', 'Steam', 'steamapps', 'common', 'MinecraftDungeons2'),
    path.join(process.env.ProgramFiles || 'C:\\Program Files', 'Steam', 'steamapps', 'common', 'MinecraftDungeons2'),
    path.join('D:\\', 'Steam', 'steamapps', 'common', 'MinecraftDungeons2'),
    path.join('D:\\', 'SteamLibrary', 'steamapps', 'common', 'MinecraftDungeons2'),
    path.join('E:\\', 'Steam', 'steamapps', 'common', 'MinecraftDungeons2'),
    path.join('E:\\', 'SteamLibrary', 'steamapps', 'common', 'MinecraftDungeons2')
  ];

  for (const p of possiblePaths) {
    try {
      if (fs.existsSync(p)) {
        addLog('info', `get-game-install: found at ${p}`);
        let pakPath = null;
        const paksDir = path.join(p, 'Dungeons', 'Content', 'Paks');
        if (fs.existsSync(paksDir)) {
          const files = fs.readdirSync(paksDir);
          const pak = files.find(f => f.endsWith('.pak') && !f.includes('WindowsNoEditor_0'));
          if (pak) pakPath = path.join(paksDir, pak);
        }
        return { found: true, path: p, version: p.includes('Steam') ? 'Steam' : 'Xbox/PC', pakPath };
      }
    } catch {
      continue;
    }
  }

  try {
    const wa = path.join('C:\\', 'Program Files', 'WindowsApps');
    if (fs.existsSync(wa)) {
      const dirs = fs.readdirSync(wa);
      const mcd2 = dirs.find(d => d.startsWith('Microsoft.MinecraftDungeons2_'));
      if (mcd2) {
        const full = path.join(wa, mcd2);
        addLog('info', `get-game-install: found fallback at ${full}`);
        return { found: true, path: full, version: 'WindowsApps', pakPath: null };
      }
    }
  } catch { }

  return { found: false, path: null, version: null, pakPath: null };
});

// ---------------------------------------------------------------------------
// IPC: open-folder
// ---------------------------------------------------------------------------
ipcMain.handle('open-folder', async (_event, folderPath) => {
  addLog('info', `open-folder: ${folderPath}`);
  try {
    if (!folderPath || typeof folderPath !== 'string') throw new Error('Invalid path argument');
    await shell.openPath(folderPath);
    return { success: true };
  } catch (err) {
    addLog('error', `open-folder error: ${err.message}`);
    return { success: false, error: err.message };
  }
});

// ---------------------------------------------------------------------------
// IPC: get-logs
// ---------------------------------------------------------------------------
ipcMain.handle('get-logs', async () => {
  addLog('debug', 'get-logs: returning log buffer');
  // Return a copy so callers can't mutate the internal array
  return [...logs];
});

// ---------------------------------------------------------------------------
// IPC: get-app-version
// ---------------------------------------------------------------------------
ipcMain.handle('get-app-version', async () => {
  addLog('debug', 'get-app-version');
  try {
    const pkgPath = path.join(__dirname, '..', 'package.json');
    const pkg     = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    return pkg.version ?? '1.0.0';
  } catch {
    return app.getVersion() || '1.0.0';
  }
});

// ---------------------------------------------------------------------------
// BrowserWindow creation
// ---------------------------------------------------------------------------
let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width:           1400,
    height:          900,
    minWidth:        900,
    minHeight:       600,
    backgroundColor: '#1a1a2e',
    title:           'MCD2 Save Editor v1.0',
    show:            false, // avoid flash; shown after ready-to-show
    webPreferences: {
      preload:             path.join(__dirname, 'preload.cjs'),
      contextIsolation:    true,
      nodeIntegration:     false,
      sandbox:             false,
      webSecurity:         true,
    },
  });

  // Gracefully show once content is ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    addLog('info', 'BrowserWindow ready-to-show');
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Load the renderer
  const isDev = process.env.NODE_ENV === 'development' || process.env.ELECTRON_DEV === '1';
  if (isDev) {
    const devPort = process.env.VITE_PORT || 5173;
    mainWindow.loadURL(`http://localhost:${devPort}`);
    // mainWindow.webContents.openDevTools(); // Disabled by user request
    addLog('info', `Dev mode: loading http://localhost:${devPort}`);
  } else {
    const indexPath = path.join(__dirname, '..', 'dist', 'index.html');
    mainWindow.loadFile(indexPath);
    addLog('info', `Prod mode: loading ${indexPath}`);
  }
}

// ---------------------------------------------------------------------------
// Application menu
// ---------------------------------------------------------------------------
function buildMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label:       'Open Saves Folder',
          accelerator: 'CmdOrCtrl+Shift+O',
          click:       () => {
            shell.openPath(WGS_ROOT);
            addLog('info', 'Menu: opened saves folder');
          },
        },
        { type: 'separator' },
        {
          label:       'Quit',
          accelerator: 'CmdOrCtrl+Q',
          role:        'quit',
        },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About MCD2 Save Editor',
          click: () => {
            if (mainWindow) {
              const { dialog } = require('electron');
              dialog.showMessageBox(mainWindow, {
                type:    'info',
                title:   'About',
                message: 'MCD2 Save Editor v1.0',
                detail:  'A save editor for Minecraft Dungeons 2.',
              });
            }
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// ---------------------------------------------------------------------------
// App lifecycle
// ---------------------------------------------------------------------------
app.whenReady().then(() => {
  addLog('info', `App ready — Electron ${process.versions.electron}, Node ${process.versions.node}`);
  buildMenu();
  createWindow();

  app.on('activate', () => {
    // macOS: re-create window when dock icon is clicked and no windows open
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    addLog('info', 'All windows closed — quitting');
    app.quit();
  }
});

app.on('before-quit', () => {
  addLog('info', 'App before-quit');
});
