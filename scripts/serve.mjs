import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const routes = new Map([
  ['/', ['../index.html', 'text/html; charset=utf-8']],
  ['/src/core.mjs', ['../src/core.mjs', 'text/javascript; charset=utf-8']],
  ['/src/game.mjs', ['../src/game.mjs', 'text/javascript; charset=utf-8']],
  ['/smoke', ['../smoke/hello-3d.html', 'text/html; charset=utf-8']],
]);
const port = Number(process.env.PORT || 4173);

createServer(async (request, response) => {
  const route = routes.get(request.url);
  if (!route) {
    response.writeHead(404).end('Not found');
    return;
  }
  try {
    const file = fileURLToPath(new URL(route[0], import.meta.url));
    response.writeHead(200, { 'content-type': route[1] });
    response.end(await readFile(file));
  } catch (error) {
    response.writeHead(500).end(error.message);
  }
}).listen(port, '127.0.0.1', () => {
  console.log(`Đảo Đèn Lồng: http://127.0.0.1:${port}/`);
});
