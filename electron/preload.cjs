const { contextBridge, shell, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  openExternal: (url) => shell.openExternal(url),
  reportError: (msg, source, lineno, colno, error) => ipcRenderer.send('renderer-error', { msg, source, lineno, colno, error: error && error.stack ? error.stack : error })
});

// Forward unhandled errors to main
window.addEventListener('error', (e) => {
  try {
    ipcRenderer.send('renderer-error', { msg: e.message, source: e.filename, lineno: e.lineno, colno: e.colno, error: e.error && e.error.stack ? e.error.stack : null });
  } catch (err) {
    // ignore
  }
});

