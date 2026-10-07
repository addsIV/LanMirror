// Electron 殼：啟動信令 server，開一個視窗載入分享頁，並把螢幕擷取交給畫面選擇器
const { app, BrowserWindow, session, desktopCapturer, Menu, shell, ipcMain } = require('electron');
const path = require('path');
const { start, PORT } = require('./server');

app.setName('LanMirror');
const isMac = process.platform === 'darwin';

// 自製畫面選擇器：列出螢幕 / 視窗縮圖讓使用者挑。
// macOS 15+ 走系統原生選擇器（useSystemPicker），Windows / Linux / 舊 macOS 才會進到這裡。
function showPicker(parent) {
  return new Promise(resolve => {
    const win = new BrowserWindow({
      width: 760, height: 520, parent, modal: true, title: '選擇要分享的畫面',
      backgroundColor: '#111111', minimizable: false, maximizable: false,
      webPreferences: { contextIsolation: true, preload: path.join(__dirname, 'preload.js') },
    });
    win.setMenuBarVisibility(false);
    let done = false;
    const finish = id => { if (done) return; done = true; resolve(id); if (!win.isDestroyed()) win.close(); };
    ipcMain.once('picker-choose', (_e, id) => finish(id));
    win.on('closed', () => finish(null));
    win.loadFile(path.join(__dirname, 'public', 'picker.html'));
    win.webContents.on('did-finish-load', async () => {
      try {
        const sources = await desktopCapturer.getSources({ types: ['screen', 'window'], thumbnailSize: { width: 320, height: 200 } });
        if (win.isDestroyed()) return; // 縮圖還沒抓完使用者就按了取消
        win.webContents.send('sources', sources.map(s => ({
          id: s.id, name: s.name, kind: s.id.startsWith('screen') ? 'screen' : 'window', thumb: s.thumbnail.toDataURL(),
        })));
      } catch (e) { console.error('getSources 失敗', e); finish(null); }
    });
  });
}

function setupDisplayMedia() {
  session.defaultSession.setDisplayMediaRequestHandler(async (request, callback) => {
    const parent = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0];
    const id = await showPicker(parent);
    if (!id) return callback(null); // 取消 → 分享頁的 getDisplayMedia 收到 NotAllowedError
    const sources = await desktopCapturer.getSources({ types: ['screen', 'window'] });
    const video = sources.find(s => s.id === id);
    if (!video) return callback(null);
    // Windows 可以直接擷取系統聲音（loopback）；macOS 沒有這條路，audio 鍵必須整個省略
    callback(process.platform === 'win32' ? { video, audio: 'loopback' } : { video });
  }, { useSystemPicker: !process.env.LANMIRROR_FORCE_PICKER }); // 設環境變數可在 macOS 15 測自製選擇器
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

function buildMenu() {
  const edit = { label: 'Edit', submenu: [{ role: 'copy' }, { role: 'paste' }, { role: 'selectAll' }] };
  const view = { label: 'View', submenu: [{ role: 'reload' }, { role: 'toggleDevTools' }] };
  // macOS 第一個選單是 app 名稱；Windows / Linux 沒這慣例，Quit 放到 File 底下
  const first = isMac
    ? { label: 'LanMirror', submenu: [{ role: 'about' }, { type: 'separator' }, { role: 'quit' }] }
    : { label: 'File', submenu: [{ role: 'quit' }] };
  return Menu.buildFromTemplate([first, edit, view]);
}

app.whenReady().then(async () => {
  Menu.setApplicationMenu(buildMenu());
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
