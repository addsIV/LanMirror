// 用 sips 把 build/icon.png 縮成多尺寸，打包成 Windows .ico（Vista+ 允許 PNG 編碼的 entry）。
// electron-builder 自轉的小尺寸會糊，所以自己做；用法：node build/make-ico.js
const { execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const SIZES = [16, 24, 32, 48, 64, 128, 256];
const src = path.join(__dirname, 'icon.png');
const out = path.join(__dirname, 'icon.ico');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'lanmirror-ico-'));

const pngs = SIZES.map(size => {
  const file = path.join(tmp, `${size}.png`);
  execFileSync('sips', ['-z', String(size), String(size), src, '--out', file], { stdio: 'ignore' });
  return fs.readFileSync(file);
});

// ICONDIR(6) + ICONDIRENTRY(16) * n，之後接各張 PNG 原始位元組
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(SIZES.length, 4);
const entries = [];
let offset = 6 + 16 * SIZES.length;
SIZES.forEach((size, i) => {
  const e = Buffer.alloc(16);
  e.writeUInt8(size === 256 ? 0 : size, 0);   // 0 代表 256
  e.writeUInt8(size === 256 ? 0 : size, 1);
  e.writeUInt8(0, 2); e.writeUInt8(0, 3);
  e.writeUInt16LE(1, 4); e.writeUInt16LE(32, 6);
  e.writeUInt32LE(pngs[i].length, 8); e.writeUInt32LE(offset, 12);
  offset += pngs[i].length;
  entries.push(e);
});
fs.writeFileSync(out, Buffer.concat([header, ...entries, ...pngs]));
fs.rmSync(tmp, { recursive: true, force: true });
console.log(`icon.ico 寫出 ${SIZES.join('/')}px，${fs.statSync(out).size} bytes`);
