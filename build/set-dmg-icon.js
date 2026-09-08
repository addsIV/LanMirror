// electron-builder afterAllArtifactBuild hook：把 app 圖示套到 .dmg 檔案本身（Finder custom icon）
const { execFileSync } = require('child_process');
const path = require('path');

module.exports = async function (context) {
  if (process.platform !== 'darwin') return [];
  const icon = path.join(__dirname, 'icon.png');
  for (const file of context.artifactPaths.filter(p => p.endsWith('.dmg'))) {
    const jxa = `
      ObjC.import('Cocoa');
      const img = $.NSImage.alloc.initWithContentsOfFile(${JSON.stringify(icon)});
      const ok = $.NSWorkspace.sharedWorkspace.setIconForFileOptions(img, ${JSON.stringify(file)}, 0);
      ok ? 'ok' : 'failed';`;
    const out = execFileSync('osascript', ['-l', 'JavaScript', '-e', jxa]).toString().trim();
    console.log(`  • dmg file icon   ${path.basename(file)} → ${out}`);
  }
  return [];
};
