// electron-builder afterPack hook：沒有 Developer ID 憑證時，用 ad-hoc 簽章把整個 bundle 簽到一致。
// 沒簽的話 Gatekeeper 會直接說「已毀損」；簽了會變成「無法驗證開發者」，可在系統設定放行。
const { execFileSync } = require('child_process');
const path = require('path');

module.exports = async function (context) {
  if (context.electronPlatformName !== 'darwin') return;
  const app = path.join(context.appOutDir, `${context.packager.appInfo.productFilename}.app`);
  execFileSync('codesign', ['--force', '--deep', '--sign', '-', app], { stdio: 'inherit' });
  execFileSync('codesign', ['--verify', '--deep', '--strict', app], { stdio: 'inherit' });
  console.log(`  • ad-hoc signed   ${path.basename(app)}`);
};
