'use strict';

const { contextBridge, ipcRenderer } = require('electron');

// ---------------------------------------------------------------------------
// Expose a safe, typed API to the renderer via window.electronAPI
// ---------------------------------------------------------------------------
contextBridge.exposeInMainWorld('electronAPI', {

  /**
   * Scan the WGS folder and return all detected character save files.
   * @returns {Promise<Array<{
   *   path: string,
   *   lastModified: number,
   *   size: number,
   *   characterId: string|null,
   *   level: number|null,
   *   powerLevel: number|null,
   *   softVersion: string|null
   * }>>}
   */
  getSaves: () => ipcRenderer.invoke('get-saves'),

  /**
   * Read and fully parse a save file.
   * @param {string} filePath - Absolute path to the save file.
   * @returns {Promise<{ success: true, data: object, path: string, size: number }
   *                  | { success: false, error: string }>}
   */
  readSave: (filePath) => ipcRenderer.invoke('read-save', filePath),

  /**
   * Atomically overwrite a save file (backup created automatically).
   * @param {string} filePath  - Absolute path to the save file.
   * @param {object} jsonData  - Parsed JS object to write back.
   * @returns {Promise<{ success: true, backupPath: string }
   *                  | { success: false, error: string }>}
   */
  writeSave: (filePath, jsonData) => ipcRenderer.invoke('write-save', filePath, jsonData),

  /**
   * List backup files for a given save path.
   * @param {string} savePath - Absolute path to the original save file.
   * @returns {Promise<Array<{ path: string, timestamp: number, size: number }>>}
   */
  getBackups: (savePath) => ipcRenderer.invoke('get-backups', savePath),

  /**
   * Restore a backup file to the target save path.
   * (A safety backup of the current target is created first.)
   * @param {string} backupPath - Absolute path to the .bak file.
   * @param {string} targetPath - Absolute path to write the restored data to.
   * @returns {Promise<{ success: true } | { success: false, error: string }>}
   */
  restoreBackup: (backupPath, targetPath) =>
    ipcRenderer.invoke('restore-backup', backupPath, targetPath),

  /**
   * Detect the game installation in WindowsApps.
   * @returns {Promise<{
   *   found: boolean,
   *   path: string|null,
   *   version: string|null,
   *   pakPath: string|null
   * }>}
   */
  getGameInstall: () => ipcRenderer.invoke('get-game-install'),

  /**
   * Open a folder in Windows Explorer.
   * @param {string} folderPath - Absolute path to open.
   * @returns {Promise<{ success: true } | { success: false, error: string }>}
   */
  openFolder: (folderPath) => ipcRenderer.invoke('open-folder', folderPath),

  /**
   * Retrieve recent log entries from the main process.
   * @returns {Promise<Array<{ timestamp: string, level: string, message: string }>>}
   */
  getLogs: () => ipcRenderer.invoke('get-logs'),

  /**
   * Get the application version from package.json.
   * @returns {Promise<string>}
   */
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),

  /**
   * Subscribe to progress events pushed from the main process.
   * @param {function(data: any): void} callback
   * @returns {function(): void} Call the returned function to remove the listener.
   */
  onProgress: (callback) => {
    if (typeof callback !== 'function') {
      throw new TypeError('onProgress: callback must be a function');
    }
    const handler = (_event, data) => callback(data);
    ipcRenderer.on('progress', handler);
    // Return a cleanup / unsubscribe function
    return () => {
      ipcRenderer.removeListener('progress', handler);
    };
  },
});
