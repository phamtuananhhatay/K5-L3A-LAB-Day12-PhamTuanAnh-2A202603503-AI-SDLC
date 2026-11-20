import { readFile, writeFile, rename, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const NAME_REGEX = /^[A-Za-z0-9_]{3,12}$/;
const DEFAULT_DATA_FILE = new URL('../data/leaderboard.json', import.meta.url);

export function validateName(rawName) {
  const name = typeof rawName === 'string' ? rawName.trim() : '';
  if (!NAME_REGEX.test(name)) {
    throw new Error('Tên cần có 3–12 ký tự, chỉ gồm chữ không dấu, số và dấu _.');
  }
  return name;
}

export function sortEntries(entries) {
  return [...entries].sort((a, b) =>
    b.score - a.score ||
    Date.parse(a.achieved_at) - Date.parse(b.achieved_at)
  );
}

function resolveFilePath(target) {
  if (target instanceof URL) return fileURLToPath(target);
  if (typeof target === 'string' && target.startsWith('file://')) {
    return fileURLToPath(new URL(target));
  }
  return String(target);
}

export async function loadLeaderboard(target = DEFAULT_DATA_FILE) {
  const filePath = resolveFilePath(target);
  try {
    const content = await readFile(filePath, 'utf8');
    const parsed = JSON.parse(content);
    if (!parsed || !Array.isArray(parsed.entries)) {
      throw new Error(`Invalid leaderboard format in ${filePath}`);
    }
    return parsed;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return { entries: [] };
    }
    throw error;
  }
}

let writeChain = Promise.resolve();

export function addEntry(record, target = DEFAULT_DATA_FILE) {
  const op = writeChain.catch(() => {}).then(async () => {
    const name = validateName(record.name);
    const score = record.score;
    if (!Number.isInteger(score) || score < 0) {
      throw new Error('Điểm phải là số nguyên không âm');
    }
    const nightsWon = record.nights_won;
    if (!Number.isInteger(nightsWon) || nightsWon < 0 || nightsWon > 3) {
      throw new Error('Số Đêm thắng phải từ 0 đến 3');
    }
    const rawSeed = record.seed !== undefined ? record.seed : 42;
    const seed = rawSeed;
    if (!Number.isInteger(seed)) {
      throw new Error('Seed phải là số nguyên');
    }

    if(record.achieved_at!==undefined&&(typeof record.achieved_at!=='string'||!/(Z|[+-]\d{2}:\d{2})$/.test(record.achieved_at)||isNaN(Date.parse(record.achieved_at))))throw new Error('achieved_at phải là ISO8601 có múi giờ');
    const achievedAt = record.achieved_at??new Date().toISOString();

    const newEntry = {
      name,
      score,
      nights_won: nightsWon,
      achieved_at: achievedAt,
      seed,
    };

    const filePath = resolveFilePath(target);
    const data = await loadLeaderboard(target);

    data.entries.push(newEntry);
    const sorted = sortEntries(data.entries).slice(0, 10);
    const outputContent = JSON.stringify({ entries: sorted }, null, 2) + '\n';

    await mkdir(dirname(filePath), { recursive: true });
    const tmpPath = `${filePath}.tmp`;
    await writeFile(tmpPath, outputContent, 'utf8');
    await rename(tmpPath, filePath);

    return newEntry;
  });

  writeChain = op.catch(() => {});
  return op;
}

export async function exportLeaderboard(outPath, target = DEFAULT_DATA_FILE) {
  const data = await loadLeaderboard(target);
  const top10 = sortEntries(data.entries).slice(0, 10);
  const formatted = JSON.stringify({ entries: top10 }, null, 2) + '\n';
  await writeFile(outPath, formatted, 'utf8');
  return top10;
}
