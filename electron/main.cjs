const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 820,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  const loadRenderer = async () => {
    try {
      if (process.env.ELECTRON_DEV) {
        await win.loadURL('http://localhost:3000');
        win.webContents.openDevTools();
      } else {
        await win.loadFile(path.join(__dirname, '../dist/index.html'));
      }
    } catch (err) {
      console.error('Failed to load renderer:', err);
      // Show a simple fallback error page and open DevTools for debugging
      try {
        await win.loadFile(path.join(__dirname, 'error.html'));
      } catch (e) {
        console.error('Failed to load error page', e);
      }
      win.webContents.openDevTools({ mode: 'detach' });
    }
  };

  win.webContents.on('did-fail-load', (ev, errorCode, errorDescription, validatedURL, isMainFrame) => {
    console.error('did-fail-load', { errorCode, errorDescription, validatedURL, isMainFrame });
    win.webContents.openDevTools({ mode: 'detach' });
    // try loading local error page
    win.loadFile(path.join(__dirname, 'error.html')).catch(() => {});
  });

  // Listen for renderer error reports
  const { ipcMain, dialog, app } = require('electron');
  ipcMain.on('renderer-error', (event, payload) => {
    try {
      const userData = app.getPath('userData');
      const logPath = path.join(userData, 'renderer-errors.log');
      const entry = `[${new Date().toISOString()}] ${JSON.stringify(payload)}\n`;
      require('fs').appendFileSync(logPath, entry);
      console.error('Renderer error saved to', logPath, payload);
      // Optionally show a dialog to the user with location of log
      dialog.showErrorBox('Renderer error', `Se ha detectado un error en la UI. Se registró en: ${logPath}`);
    } catch (e) {
      console.error('Failed saving renderer error', e);
    }
  });

  loadRenderer();

  // If DEBUG_ELECTRON env var is set, open DevTools after renderer loads
  if (process.env.DEBUG_ELECTRON === 'true') {
    win.webContents.once('did-finish-load', () => {
      win.webContents.openDevTools({ mode: 'detach' });
    });
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
