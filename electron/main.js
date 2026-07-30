import { app, BrowserWindow, ipcMain, dialog, Notification, Tray, Menu } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow = null;
let tray = null;
let serverProcess = null;

const isDev = process.env.NODE_ENV !== 'production';
const PORT = process.env.PORT || 5005;

// Single instance lock
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(async () => {
    startBackendServer();
    createMainWindow();
    createSystemTray();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
    });
  });
}

function startBackendServer() {
  const serverPath = path.resolve(__dirname, '../server/server.js');
  if (existsSync(serverPath)) {
    console.log('[Electron] Starting local Express server engine...');
    serverProcess = spawn('node', [serverPath], {
      env: { ...process.env, PORT: String(PORT), NODE_ENV: 'production' },
      stdio: 'inherit',
    });

    serverProcess.on('error', (err) => {
      console.error('[Electron] Failed to start backend server:', err);
    });
  }
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 830,
    minWidth: 900,
    minHeight: 600,
    frame: false, // Custom frameless window for native Windows titlebar
    titleBarStyle: 'hidden',
    backgroundColor: '#0f172a',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  const startUrl = isDev 
    ? 'http://localhost:5173'
    : `file://${path.join(__dirname, '../client-2.0/dist/index.html')}`;

  mainWindow.loadURL(startUrl);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
      if (Notification.isSupported()) {
        new Notification({
          title: 'Universal Media Downloader',
          body: 'App is continuing to run in the system tray.',
        }).show();
      }
    }
  });
}

function createSystemTray() {
  const iconPath = path.join(__dirname, '../client-2.0/public/favicon.svg');
  tray = new Tray(existsSync(iconPath) ? iconPath : path.join(__dirname, 'default_icon.png'));
  
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Open App', click: () => { mainWindow.show(); mainWindow.focus(); } },
    { type: 'separator' },
    { label: 'Quit Engine', click: () => { app.isQuitting = true; app.quit(); } },
  ]);

  tray.setToolTip('Universal Media Downloader');
  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

// ==========================================
// IPC Handlers (Native Windows Integration)
// ==========================================

// 1. Native Folder Picker
ipcMain.handle('dialog:selectFolder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory', 'createDirectory'],
    title: 'Select Download Save Directory',
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  return result.filePaths[0];
});

// 2. Native System Notification
ipcMain.handle('notification:show', (_event, { title, body }) => {
  if (Notification.isSupported()) {
    new Notification({ title: title || 'Media Downloader', body }).show();
  }
});

// 3. Native Titlebar Window Controls
ipcMain.handle('window:minimize', () => mainWindow?.minimize());
ipcMain.handle('window:maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});
ipcMain.handle('window:close', () => mainWindow?.hide());
ipcMain.handle('window:isMaximized', () => mainWindow?.isMaximized() || false);

app.on('before-quit', () => {
  app.isQuitting = true;
  if (serverProcess) {
    serverProcess.kill();
  }
});
