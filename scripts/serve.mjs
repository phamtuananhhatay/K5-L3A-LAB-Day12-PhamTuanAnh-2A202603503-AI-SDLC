import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { exportLeaderboard, loadLeaderboard, addEntry, sortEntries } from '../src/leaderboard.mjs';

const args = process.argv.slice(2);
const dataIndex = args.indexOf('--data');
const customDataFile = dataIndex !== -1 ? args[dataIndex + 1] : undefined;

const exportIndex = args.indexOf('--export-leaderboard');
if (exportIndex !== -1) {
  const outPath = args[exportIndex + 1];
  if (!outPath) {
    console.error('Lỗi: thiếu đường dẫn file xuất');
    process.exit(1);
  }
  await exportLeaderboard(outPath, customDataFile);
  console.log(`Đã xuất bảng điểm ra ${outPath}`);
  process.exit(0);
}

const routes = new Map([
  ['/', ['../index.html', 'text/html; charset=utf-8']],
  ['/src/core.mjs', ['../src/core.mjs', 'text/javascript; charset=utf-8']],
  ['/src/benchmark.mjs', ['../src/benchmark.mjs', 'text/javascript; charset=utf-8']],
  ['/src/maps.mjs', ['../src/maps.mjs', 'text/javascript; charset=utf-8']],
  ['/src/audio.mjs', ['../src/audio.mjs', 'text/javascript; charset=utf-8']],
  ['/src/colors.mjs', ['../src/colors.mjs', 'text/javascript; charset=utf-8']],
  ['/tests/phase3/preview.json', ['../tests/phase3/preview.json', 'application/json; charset=utf-8']],
  ['/tests/phase4/win.json', ['../tests/phase4/win.json', 'application/json; charset=utf-8']],
  ['/tests/phase4/lose.json', ['../tests/phase4/lose.json', 'application/json; charset=utf-8']],
  ['/tests/phase4/cues.json', ['../tests/phase4/cues.json', 'application/json; charset=utf-8']],
  ['/src/game.mjs', ['../src/game.mjs', 'text/javascript; charset=utf-8']],
  ['/src/input.mjs', ['../src/input.mjs', 'text/javascript; charset=utf-8']],
  ['/src/controls.mjs', ['../src/controls.mjs', 'text/javascript; charset=utf-8']],
  ['/smoke', ['../smoke/hello-3d.html', 'text/html; charset=utf-8']],
  ['/docs/demo/demo.mp4', ['../docs/demo/demo.mp4', 'video/mp4']],
]);
const port = Number(process.env.PORT || 4173);

createServer(async (request, response) => {
  const parsedUrl = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
  if (parsedUrl.pathname === '/api/leaderboard') {
    if (request.method === 'GET') {
      try {
        const data = await loadLeaderboard(customDataFile);
        const sorted = sortEntries(data.entries).slice(0, 10);
        response.writeHead(200, { 'content-type': 'application/json; charset=utf-8' });
        response.end(JSON.stringify({ entries: sorted }));
      } catch (error) {
        response.writeHead(500, { 'content-type': 'application/json; charset=utf-8' });
        response.end(JSON.stringify({ error: error.message }));
      }
      return;
    }
    if (request.method === 'POST') {
      let body = '';
      request.on('data', chunk => { body += chunk; });
      request.on('end', async () => {
        try {
          const payload = JSON.parse(body || '{}');
          const entry = await addEntry({...payload,achieved_at:new Date().toISOString()}, customDataFile);
          response.writeHead(201, { 'content-type': 'application/json; charset=utf-8' });
          response.end(JSON.stringify({ success: true, entry }));
        } catch (error) {
          response.writeHead(400, { 'content-type': 'application/json; charset=utf-8' });
          response.end(JSON.stringify({ error: error.message }));
        }
      });
      return;
    }
    response.writeHead(405).end('Method Not Allowed');
    return;
  }

  const route = routes.get(parsedUrl.pathname);
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
