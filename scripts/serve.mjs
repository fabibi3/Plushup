// Sert la build web (dist/) en local, sans dépendance réseau : `npm run demo` → http://localhost:8080
// Repli SPA : toutes les routes renvoient index.html (Expo Router gère la navigation côté client).
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';

const root = path.resolve('dist');
const port = Number(process.env.PORT ?? 8080);
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.ttf': 'font/ttf', '.ico': 'image/x-icon' };

http
  .createServer((req, res) => {
    const p = path.join(root, decodeURIComponent((req.url ?? '/').split('?')[0]));
    const file = p.startsWith(root) && fs.existsSync(p) && fs.statSync(p).isFile() ? p : path.join(root, 'index.html');
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] ?? 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  })
  .listen(port, () => console.log(`PlushUp → http://localhost:${port}`));
