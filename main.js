// Electron 殼：啟動信令 server，開一個視窗載入分享頁，並把螢幕擷取交給系統選擇器
const { app, BrowserWindow, session, desktopCapturer, Menu, shell } = require('electron');
const { start, PORT } = require('./server');

app.setName('LanMirror');

function setupDisplayMedia() {
  // macOS 15+ 用系統原生的畫面選擇器；其他情況退回第一個螢幕
  session.defaultSession.setDisplayMediaRequestHandler((request, callback) => {
    desktopCapturer.getSources({ types: ['screen', 'window'] }).then(sources => {
      callback({ video: sources[0], audio: process.platform === 'win32' ? 'loopback' : undefined });
    }).catch(() => callback({}));
  }, { useSystemPicker: true });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 720, height: 560, title: 'LanMirror',
    backgroundColor: '#111111',
    webPreferences: { contextIsolation: true },
  });
  win.loadURL(`http://localhost:${PORT}/sender`);
  // 外部連結用系統瀏覽器開
  win.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' }; });
  return win;
}

app.whenReady().then(async () => {
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    { label: 'LanMirror', submenu: [{ role: 'about' }, { type: 'separator' }, { role: 'quit' }] },
    { label: 'Edit', submenu: [{ role: 'copy' }, { role: 'paste' }, { role: 'selectAll' }] },
    { label: 'View', submenu: [{ role: 'reload' }, { role: 'toggleDevTools' }] },
  ]));
  setupDisplayMedia();
  try { await start({ openBrowser: false }); }
  catch (e) {
    const { dialog } = require('electron');
    dialog.showErrorBox('LanMirror 無法啟動', `Port ${PORT} 可能已被佔用：${e.message}`);
    return app.quit();
  }
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => app.quit());
