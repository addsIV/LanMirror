# LanMirror

區網螢幕鏡像：Mac 畫面 → 同一 Wi-Fi 的 PC 瀏覽器。Deskreen 的免費替代品。

- Node.js 只負責靜態頁面與 WebSocket 信令
- 影像 / 聲音走 WebRTC 點對點，不經過伺服器
- 純區網，不需要 STUN / TURN，資料不出家門

## 使用

```bash
npm start
```

1. 啟動後會自動在 Mac 開啟 `http://localhost:3131/sender`
2. PC 用 Chrome / Edge 打開終端機印出的 `http://<Mac IP>:3131`
3. Mac 分享頁會列出該 PC，按「允許」
4. 按「選擇要分享的畫面」，挑整個螢幕或某個視窗
5. PC 端雙擊全螢幕，點一下畫面解除靜音

## 注意

- Mac 端分享頁必須用 `localhost` 開（螢幕擷取只在安全來源可用），PC 端用 IP 即可
- 第一次分享，macOS 會要求給瀏覽器「螢幕錄製」權限
- Chrome 在 macOS 上分享「整個螢幕」時不會帶系統聲音，分享單一分頁才有聲音
- 改 port：`PORT=4000 npm start`；不自動開瀏覽器：`NO_OPEN=1 npm start`

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
