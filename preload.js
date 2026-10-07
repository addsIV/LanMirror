// 畫面來源選擇視窗的 preload：只開放「收來源清單」與「回報選擇」兩個橋
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('picker', {
  onSources: cb => ipcRenderer.on('sources', (_e, sources) => cb(sources)),
  choose: id => ipcRenderer.send('picker-choose', id),
});
