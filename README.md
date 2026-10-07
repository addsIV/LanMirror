# LanMirror

區網螢幕鏡像：把電腦畫面投到同一 Wi-Fi 上任何有瀏覽器的裝置。Deskreen 的免費替代品。
分享端 macOS / Windows 有桌面版（Linux 可用 Node.js + Chrome/Edge 跑），觀看端什麼都不用裝。

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

最省事：下載桌面版（見下節 **桌面版**），不用裝 Node.js。想用原始碼跑也可以：

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

macOS 與 Windows 都有，從 [Releases](https://github.com/addsIV/LanMirror/releases) 下載：

| 平台 | 檔案 | 說明 |
| --- | --- | --- |
| macOS (Apple Silicon) | `LanMirror-<版本>-arm64.dmg` | 拖進 Applications |
| Windows (x64) | `LanMirror Setup <版本>.exe` | 安裝版，可選安裝位置 |
| Windows (x64) | `LanMirror-<版本>-portable.exe` | 免安裝，直接執行 |

- 桌面版自帶信令 server，開 app 即可，不用另外跑 `npm start`
- macOS 15+ 用系統畫面選擇器；Windows / 舊 macOS 用內建選擇器，一樣可以挑整個螢幕或單一視窗
- Windows 桌面版分享時會一併擷取系統聲音；macOS 沒有這條路
- 未簽章：
  - macOS 第一次開啟若被 Gatekeeper 擋，對 app 按右鍵 → 打開，或執行
    `xattr -dr com.apple.quarantine /Applications/LanMirror.app`
  - Windows 第一次執行 SmartScreen 會跳「Windows 已保護您的電腦」，按「其他資訊」→「仍要執行」
  - Windows 防火牆詢問時要勾「私人網路」，否則觀看端連不進來

### 自己打包

```bash
npm run app        # 直接跑桌面版（開發用）
npm run dist       # macOS：dist/LanMirror-<版本>-arm64.dmg
npm run dist:win   # Windows：安裝版 + portable（在 Mac 上就能交叉打包）
npm run dist:all   # 兩個平台一起
npm run icons      # 從 build/icon.png 重做 build/icon.ico（換圖示時才需要）
```

- 改版本號：改 `package.json` 的 `version` 再打包
- macOS 15 上要測內建選擇器：`LANMIRROR_FORCE_PICKER=1 npm run app`
