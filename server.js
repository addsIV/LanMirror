// LanMirror: 區網螢幕鏡像。Node 只做靜態檔 + WebSocket 信令，影像走 WebRTC 點對點。
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { WebSocketServer } = require('ws');
const { exec } = require('child_process');

const PORT = Number(process.env.PORT) || 3131;
const PUB = path.join(__dirname, 'public');
const lanIps = Object.values(os.networkInterfaces()).flat()
  .filter(i => i.family === 'IPv4' && !i.internal).map(i => i.address);
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css' };

const server = http.createServer((req, res) => {
  let p = req.url.split('?')[0];
  if (p === '/hostinfo') { res.writeHead(200, {'Content-Type':'application/json'}); return res.end(JSON.stringify({ ips: lanIps, port: PORT })); }
  if (p === '/') p = '/viewer.html';
  if (p === '/sender') p = '/sender.html';
  const file = path.join(PUB, path.normalize(p));
  if (!file.startsWith(PUB) || !fs.existsSync(file)) { res.writeHead(404); return res.end('not found'); }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});

// 一個 sender（Mac），多個 viewer（PC）。信令訊息一律 {type, to?, ...}
const wss = new WebSocketServer({ server });
let sender = null;          // 目前作用中的分享頁
const senders = new Set();  // 所有開著的分享頁；作用中的關掉就換下一個
const viewers = new Map(); // id -> ws
let nextId = 1;

const sendViewerList = ws => send(ws, { type: 'viewer-list', viewers: [...viewers].map(([id, v]) => ({ id, ip: v.ip })) });
function activate(ws) {
  if (sender && sender !== ws) send(sender, { type: 'sender-replaced' });
  sender = ws;
  sendViewerList(sender);
  console.log(`sender 切換 → ${ws.ip}`);
}
const send = (ws, msg) => ws && ws.readyState === 1 && ws.send(JSON.stringify(msg));

wss.on('connection', (ws, req) => {
  const ip = (req.socket.remoteAddress || '').replace('::ffff:', '');
  ws.ip = ip;
  ws.on('message', raw => {
    let msg; try { msg = JSON.parse(raw); } catch { return; }
    if (msg.type === 'hello-sender') {
      ws.role = 'sender'; senders.add(ws);
      activate(ws);
      return;
    }
    if (msg.type === 'list-viewers') {
      if (ws.role === 'sender' && ws !== sender) activate(ws); // 舊分頁按重整 = 重新接管
      return sendViewerList(ws);
    }
    if (msg.type === 'hello-viewer') {
      ws.role = 'viewer'; ws.id = nextId++; ws.ip = ip;
      viewers.set(ws.id, ws);
      send(ws, { type: 'welcome', id: ws.id, hasSender: !!sender });
      send(sender, { type: 'viewer-joined', id: ws.id, ip });
      return;
    }
    // 轉發 offer / answer / ice / allow / deny
    if (ws.role === 'sender') { if (ws === sender) send(viewers.get(msg.to), { ...msg, from: 'sender' }); }
    else if (ws.role === 'viewer') send(sender, { ...msg, from: ws.id });
  });
  ws.on('close', () => {
    if (ws.role === 'sender') {
      senders.delete(ws);
      if (ws === sender) {
        sender = null;
        const next = [...senders].pop();
        if (next) activate(next);
        else for (const v of viewers.values()) send(v, { type: 'sender-left' });
      }
    }
    if (ws.role === 'viewer') { viewers.delete(ws.id); send(sender, { type: 'viewer-left', id: ws.id }); }
  });
});

function start({ openBrowser = true } = {}) {
  return new Promise(resolve => server.listen(PORT, () => {
    console.log(`LanMirror 啟動`);
    console.log(`  Mac 端（分享畫面）: http://localhost:${PORT}/sender`);
    for (const ip of lanIps) console.log(`  PC 端（觀看）:       http://${ip}:${PORT}`);
    if (openBrowser && process.platform === 'darwin') exec(`open http://localhost:${PORT}/sender`);
    resolve({ port: PORT, lanIps });
  }));
}

module.exports = { start, PORT, lanIps };
if (require.main === module) start({ openBrowser: !process.env.NO_OPEN });
