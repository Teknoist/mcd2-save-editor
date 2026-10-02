interface Window {
  electronAPI: {
    getSaves: () => Promise<Array<{
      path: string;
      lastModified: number;
      size: number;
      characterId: string;
      level: number;
      powerLevel: number;
      softVersion: number;
    }>>;
    readSave: (path: string) => Promise<{
      success: boolean;
      data?: import('./core/types').SaveFile;
      error?: string;
      path?: string;
      size?: number;
    }>;
    writeSave: (path: string, data: import('./core/types').SaveFile) => Promise<{
      success: boolean;
      backupPath?: string;
      error?: string;
    }>;
    getBackups: (path: string) => Promise<Array<{
      path: string;
      timestamp: number;
      size: number;
    }>>;
    restoreBackup: (backupPath: string, targetPath: string) => Promise<{
      success: boolean;
      error?: string;
    }>;
    getGameInstall: () => Promise<{
      found: boolean;
      path: string;
      version: string;
      pakPath: string;
      installType: string;
    }>;
    scanGameData: (gamePath: string) => Promise<{
      pakFiles: Array<{ name: string; size: number }>;
      utocFiles: Array<{ name: string; size: number }>;
      ucasFiles: Array<{ name: string; size: number }>;
      encryptionRequired: boolean;
    }>;
    openFolder: (path: string) => Promise<void>;
    getLogs: () => Promise<Array<{
      timestamp: string;
      level: string;
      message: string;
    }>>;
    getAppVersion: () => Promise<string>;
    onProgress: (callback: (data: { message: string; percent?: number }) => void) => () => void;
  };
}
