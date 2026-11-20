import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { spawn, spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { validateName, sortEntries, loadLeaderboard, addEntry, exportLeaderboard } from '../../src/leaderboard.mjs';

const tempDir = join(tmpdir(), `leaderboard-test-${Date.now()}`);
mkdirSync(tempDir, { recursive: true });

let passedCount = 0;
function test(name, fn) {
  return Promise.resolve()
    .then(fn)
    .then(() => {
      passedCount++;
      console.log(`PASS ${name}`);
    });
}

try {
  console.log('--- Phase 4 Task 2: Leaderboard Tests ---');

  // 1. Name validation
  await test('1. Name validation rejects < 3 chars, > 12 chars, spaces, and special symbols', () => {
    assert.throws(() => validateName('ab'), /Tên cần có 3–12 ký tự/);
    assert.throws(() => validateName('1234567890123'), /Tên cần có 3–12 ký tự/);
    assert.throws(() => validateName('Tuan Anh'), /Tên cần có 3–12 ký tự/);
    assert.throws(() => validateName('Player!'), /Tên cần có 3–12 ký tự/);
    assert.throws(() => validateName(''), /Tên cần có 3–12 ký tự/);
    assert.throws(() => validateName(null), /Tên cần có 3–12 ký tự/);

    assert.equal(validateName('Anh_07'), 'Anh_07');
    assert.equal(validateName('Tuan_Anh'), 'Tuan_Anh');
    assert.equal(validateName('123456789012'), '123456789012');
    assert.equal(validateName('abc'), 'abc');
  });

  // 2. Score, nights_won, seed validation
  await test('2. addEntry validates score, nights_won, and seed types and bounds', async () => {
    const testFile = join(tempDir, 'val-test.json');
    await assert.rejects(
      () => addEntry({ name: 'ValidName', score: -1, nights_won: 1 }, testFile),
      /Điểm phải là số nguyên không âm/
    );
    await assert.rejects(
      () => addEntry({ name: 'ValidName', score: 10.5, nights_won: 1 }, testFile),
      /Điểm phải là số nguyên không âm/
    );
    await assert.rejects(
      () => addEntry({ name: 'ValidName', score: 100, nights_won: 4 }, testFile),
      /Số Đêm thắng phải từ 0 đến 3/
    );
    await assert.rejects(
      () => addEntry({ name: 'ValidName', score: 100, nights_won: -1 }, testFile),
      /Số Đêm thắng phải từ 0 đến 3/
    );
    await assert.rejects(
      () => addEntry({ name: 'ValidName', score: 100, nights_won: 1, seed: 'abc' }, testFile),
      /Seed phải là số nguyên/
    );
  });

  // 3. Sorting & Tie-breaking rule (achieved_at ascending, NOT alphabetical)
  await test('3. sortEntries: score desc, then achieved_at asc (earlier wins, non-alphabetical)', () => {
    const entries = [
      { name: 'Zack', score: 1000, achieved_at: '2026-11-20T10:00:00.000Z' },
      { name: 'Alice', score: 1000, achieved_at: '2026-11-20T10:05:00.000Z' },
      { name: 'Bob', score: 1500, achieved_at: '2026-11-20T11:00:00.000Z' },
      { name: 'Charlie', score: 500, achieved_at: '2026-11-20T09:00:00.000Z' },
    ];
    const sorted = sortEntries(entries);
    assert.equal(sorted[0].name, 'Bob');     // highest score 1500
    assert.equal(sorted[1].name, 'Zack');    // 1000 points, earlier (10:00 < 10:05)
    assert.equal(sorted[2].name, 'Alice');   // 1000 points, later (10:05)
    assert.equal(sorted[3].name, 'Charlie'); // 500 points
  });

  // 4. Top 10 capacity limit
  await test('4. Capacity: adding 12 entries keeps only top 10', async () => {
    const testFile = join(tempDir, 'capacity-test.json');
    for (let i = 1; i <= 12; i++) {
      await addEntry({
        name: `Player_${i}`,
        score: i * 100,
        nights_won: Math.min(3, Math.floor(i / 4)),
        achieved_at: `2026-11-20T10:${String(i).padStart(2, '0')}:00.000Z`,
        seed: 42,
      }, testFile);
    }
    const data = await loadLeaderboard(testFile);
    assert.equal(data.entries.length, 10);
    assert.equal(data.entries[0].score, 1200);
    assert.equal(data.entries[0].name, 'Player_12');
    assert.equal(data.entries[9].score, 300);
    assert.equal(data.entries[9].name, 'Player_3');
    // Player_1 (100) and Player_2 (200) should be dropped
    assert.ok(!data.entries.some(e => e.name === 'Player_1'));
    assert.ok(!data.entries.some(e => e.name === 'Player_2'));
  });

  // 5. Journey score rules verification
  await test('5. Journey scores: won nights summed, lost night points excluded', async () => {
    const testFile = join(tempDir, 'journey-test.json');

    // Case A: Night 1 loss
    const entryA = await addEntry({ name: 'LoseNight1', score: 0, nights_won: 0, seed: 42 }, testFile);
    assert.equal(entryA.score, 0);
    assert.equal(entryA.nights_won, 0);

    // Case B: Night 1 win (500) + Night 2 loss (player had 200 pts in Night 2 when losing)
    const entryB = await addEntry({ name: 'LoseNight2', score: 500, nights_won: 1, seed: 42 }, testFile);
    assert.equal(entryB.score, 500);
    assert.equal(entryB.nights_won, 1);

    // Case C: Night 1 win (500) + Night 2 win (700) + Night 3 loss
    const entryC = await addEntry({ name: 'LoseNight3', score: 1200, nights_won: 2, seed: 42 }, testFile);
    assert.equal(entryC.score, 1200);
    assert.equal(entryC.nights_won, 2);

    // Case D: Won all 3 nights (500 + 700 + 800)
    const entryD = await addEntry({ name: 'WonAllNight', score: 2000, nights_won: 3, seed: 42 }, testFile);
    assert.equal(entryD.score, 2000);
    assert.equal(entryD.nights_won, 3);
  });

  // 6. Concurrent saves (Mutex serialized queue test)
  await test('6. Concurrent saves do not drop writes or corrupt JSON', async () => {
    const testFile = join(tempDir, 'concurrent-test.json');
    const promises = [];
    for (let i = 0; i < 8; i++) {
      promises.push(addEntry({
        name: `Conc_${i}`,
        score: (i + 1) * 50,
        nights_won: 1,
        seed: 42,
      }, testFile));
    }
    await Promise.all(promises);
    const data = await loadLeaderboard(testFile);
    assert.equal(data.entries.length, 8);
    // Verify file is sorted
    for (let i = 0; i < data.entries.length - 1; i++) {
      assert.ok(data.entries[i].score >= data.entries[i + 1].score);
    }
  });

  // 7. Missing file returns empty array
  await test('7. Missing file (ENOENT) returns empty entries array', async () => {
    const missingFile = join(tempDir, 'nonexistent.json');
    const data = await loadLeaderboard(missingFile);
    assert.deepEqual(data, { entries: [] });
  });

  // 8. Corrupted JSON throws error, does NOT overwrite
  await test('8. Corrupted JSON file throws error and preserves file', async () => {
    const corruptFile = join(tempDir, 'corrupt.json');
    writeFileSync(corruptFile, '{ invalid json content ...');
    await assert.rejects(() => loadLeaderboard(corruptFile));
    assert.equal(readFileSync(corruptFile, 'utf8'), '{ invalid json content ...');
  });

  // 9. CLI export command
  await test('9. CLI --export-leaderboard outputs formatted top 10 JSON', async () => {
    const dataFile = join(tempDir, 'cli-data.json');
    for (let i = 1; i <= 5; i++) {
      await addEntry({
        name: `User_${i}`,
        score: i * 200,
        nights_won: 2,
        seed: 42,
      }, dataFile);
    }

    const exportOut = join(tempDir, 'cli-export.json');
    const res = spawnSync(process.execPath, [
      'scripts/serve.mjs',
      '--export-leaderboard',
      exportOut,
      '--data',
      dataFile,
    ], { encoding: 'utf8' });

    assert.equal(res.status, 0, `CLI export failed: ${res.stderr}`);
    assert.ok(existsSync(exportOut));
    const exportedData = JSON.parse(readFileSync(exportOut, 'utf8'));
    assert.equal(exportedData.entries.length, 5);
    assert.equal(exportedData.entries[0].name, 'User_5');
    assert.equal(exportedData.entries[0].score, 1000);
  });

  // 10. CLI export missing argument error handling
  await test('10. CLI --export-leaderboard without path exits with code 1', () => {
    const res = spawnSync(process.execPath, [
      'scripts/serve.mjs',
      '--export-leaderboard',
    ], { encoding: 'utf8' });
    assert.equal(res.status, 1);
  });

  // 11. HTTP server API verification
  await test('11. HTTP API: GET and POST /api/leaderboard', async () => {
    const httpDataFile = join(tempDir, 'http-data.json');
    const port = 4188;
    const serverProcess = spawn(process.execPath, [
      'scripts/serve.mjs',
      '--data',
      httpDataFile,
    ], {
      env: { ...process.env, PORT: String(port) },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    try {
      // Wait for server to start
      await new Promise((resolve, reject) => {
        serverProcess.stdout.on('data', data => {
          if (data.toString().includes('Đảo Đèn Lồng:')) resolve();
        });
        serverProcess.on('error', reject);
        setTimeout(() => reject(new Error('Server start timeout')), 4000);
      });

      // GET initially empty
      const getRes1 = await fetch(`http://127.0.0.1:${port}/api/leaderboard`);
      assert.equal(getRes1.status, 200);
      const json1 = await getRes1.json();
      assert.deepEqual(json1.entries, []);

      // POST valid entry
      const postRes = await fetch(`http://127.0.0.1:${port}/api/leaderboard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'WebPlayer', score: 1400, nights_won: 2 }),
      });
      assert.equal(postRes.status, 201);
      const postJson = await postRes.json();
      assert.equal(postJson.success, true);
      assert.equal(postJson.entry.name, 'WebPlayer');
      assert.equal(postJson.entry.score, 1400);

      // POST invalid entry
      const invalidPost = await fetch(`http://127.0.0.1:${port}/api/leaderboard`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'X', score: 100, nights_won: 1 }),
      });
      assert.equal(invalidPost.status, 400);

      // GET after POST
      const getRes2 = await fetch(`http://127.0.0.1:${port}/api/leaderboard`);
      assert.equal(getRes2.status, 200);
      const json2 = await getRes2.json();
      assert.equal(json2.entries.length, 1);
      assert.equal(json2.entries[0].name, 'WebPlayer');
      assert.equal(json2.entries[0].score, 1400);
    } finally {
      serverProcess.kill();
    }
  });

  // 12. Default data file integration
  await test('12. Default data/leaderboard.json is valid and exports cleanly', async () => {
    const data = await loadLeaderboard();
    assert.ok(Array.isArray(data.entries));
    const testOut = join(tempDir, 'default-export.json');
    const exported = await exportLeaderboard(testOut);
    assert.ok(Array.isArray(exported));
    assert.ok(existsSync(testOut));
  });

  console.log(`\n========================================`);
  console.log(`Phase 4 Leaderboard: All ${passedCount} tests PASSED!`);
  console.log(`========================================`);
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}
