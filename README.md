# LanMirror

區網螢幕鏡像：把電腦畫面投到同一 Wi-Fi 上任何有瀏覽器的裝置。Deskreen 的免費替代品。
分享端 macOS / Windows / Linux 都可以（只要有 Node.js 和 Chrome/Edge），觀看端什麼都不用裝。

- Node.js 只負責靜態頁面與 WebSocket 信令
- 影像 / 聲音走 WebRTC 點對點，不經過伺服器
- 純區網，不需要 STUN / TURN，資料不出家門

## 使用

```bash
npm start
```

1. 啟動後會自動開啟 `http://localhost:3131/sender`（分享頁）
2. 觀看端用 Chrome / Edge 打開終端機印出的 `http://<分享端 IP>:3131`
3. 分享頁會列出該裝置，按「允許」
4. 按「選擇要分享的畫面」，挑整個螢幕或某個視窗
5. 觀看端雙擊全螢幕，點一下畫面解除靜音，按 `i` 看解析度 / fps / 位元率

## 注意

- Mac 端分享頁必須用 `localhost` 開（螢幕擷取只在安全來源可用），PC 端用 IP 即可
- 第一次分享，macOS 會要求給瀏覽器「螢幕錄製」權限
- Chrome 在 macOS 上分享「整個螢幕」時不會帶系統聲音，分享單一分頁才有聲音
- 改 port：`npm start -- --port 4000`；不自動開瀏覽器：`npm start -- --no-open`（macOS / Windows 都通用）

## Windows 當分享端

```
git clone https://github.com/addsIV/LanMirror.git
cd LanMirror
npm install ws
npm start
```

- 需要先裝 [Node.js](https://nodejs.org/)，用 PowerShell 或 cmd 跑都可以
- 第一次啟動 Windows 防火牆會詢問，要勾「私人網路」允許，否則別台連不進來
- Chrome / Edge 在 Windows 分享整個螢幕時可以勾「分享系統音訊」，觀看端會有聲音（這點比 macOS 好）

## 桌面版（Electron）

```bash
npm run app    # 直接跑桌面版
npm run dist   # 打包成 dist/LanMirror-<版本>-arm64.dmg
```

- 桌面版自帶信令 server，開 app 即可，不用另外跑 `npm start`
- 螢幕擷取用 macOS 系統選擇器，權限掛在 LanMirror 本身
- 未簽章：第一次開啟若被 Gatekeeper 擋，對 app 按右鍵 → 打開，或執行
  `xattr -dr com.apple.quarantine /Applications/LanMirror.app`
- 改版本號：改 `package.json` 的 `version` 再 `npm run dist`
