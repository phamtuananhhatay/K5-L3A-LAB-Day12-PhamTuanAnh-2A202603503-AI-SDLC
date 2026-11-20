# Bằng chứng kiểm chứng Phase 1

Mã kiểm chứng: `src/core.mjs`, `src/headless.mjs`, `src/game.mjs`, `tests/phase1/verify.mjs`. Nguồn yêu cầu: [PRD-0 và Test Contract v1.0](../requirements/PRD-0.txt). Toàn bộ file JSONL và txt dưới đây do chương trình tạo tự động, không sửa tay.

| Yêu cầu | Cách kiểm chứng | Bằng chứng | Kết quả |
|---|---|---|:---:|
| Contract tuning khớp code và cú pháp nguồn | `node scripts/build.mjs` | `PASS: source syntax and Test Contract tuning` | **Đạt** |
| Máy chủ trả trang chơi và module logic | `node scripts/smoke.mjs` | `PASS: Node server returns the game page and shared game logic` | **Đạt** |
| Nhặt đom đóm rải rác trên đảo | `pickup.scenario.json`, 1 tick | [pickup.jsonl](pickup.jsonl): `mote_picked`, score 10 | **Đạt** |
| Nạp đom đóm và thắp sáng Đèn Lồng | `deposit.scenario.json` + `deposit.inputs.json`, 1 tick | [deposit.jsonl](deposit.jsonl): `deposit`, `lantern_lit`, score 100 | **Đạt** |
| Mây tỏa sáng (pulse), choáng và đẩy quái | `pulse.scenario.json` + `pulse.inputs.json`, 1 tick | [pulse.jsonl](pulse.jsonl): `pulse`, S1 stunned, dời vị trí | **Đạt** |
| Bóng Mực chạm Mây làm mất máu | `hit.scenario.json`, 1 tick | [hit.jsonl](hit.jsonl): `player_hit`, flames 2 | **Đạt** |
| Thắp đủ 5 đèn thì thắng cuộc | `win.scenario.json` + `deposit.inputs.json`, 1 tick | [win.jsonl](win.jsonl): `game_over/all_lit`, end won | **Đạt** |
| Hết máu hoặc hết thời gian thì thua | `loss.scenario.json` / `dawn.scenario.json`, 1 tick | [loss.jsonl](loss.jsonl), [dawn.jsonl](dawn.jsonl): end lost | **Đạt** |
| Ranh giới bán kính, vùng an toàn, pulse cạnh nút, tính tất định và lỗi input | `node tests/phase1/verify.mjs` | `Phase 1 headless checks: 21 passed` | **Đạt** |
| Chuỗi nhặt → nạp → pulse → đi bộ | `sequence.scenario.json` + `sequence.inputs.json`, 16 tick | [sequence.jsonl](sequence.jsonl): event tick 1/2/4; carried 4→1→0; điểm 20→120→125; X=1 ở tick 15 | **Đạt** |
| Bán kính nhặt đúng biên, chỉ đo XZ | `boundary.scenario.json`, 1 tick | [boundary.jsonl](boundary.jsonl): chỉ nhặt mote X=1 dù Y=4; mote X=1.001 còn lại | **Đạt** |
| Input và scenario sai định dạng | `invalid.inputs.json`, `invalid.scenario.json` | [contract-check.txt](contract-check.txt): exit code 2, stderr có lý do | **Đạt** |
| Tính tất định với thực thể tự sinh | Cùng seed 42, mặc định, 300 tick, chạy 2 lần | [contract-check.txt](contract-check.txt): byte identical và SHA-256 | **Đạt** |
| Bản clone sạch (Clean clone) | Clone sang thư mục độc lập và chạy theo README | Clone sạch, chạy `build.mjs` và 21 verify checks đều PASS mã 0 | **Đạt** |
| Render 3D và HUD Đêm 1 | Chrome headless, 1280×720, truy cập `http://127.0.0.1:4173/` | [game-screen.png](game-screen.png) | **Đạt** |

## Tái hiện và kiểm tra tính tất định

Tạo lại toàn bộ output và kết quả lỗi/tính tất định bằng 1 lệnh:

```bash
npm run evidence
npm test
```

Tái tạo riêng một output bất kỳ, ví dụ:

```bash
node src/headless.mjs --seed 42 --night 1 --scenario tests/phase1/pickup.scenario.json --ticks 1 --snapshot-every 1 --out pickup.jsonl
```

Tính tất định được tự động kiểm tra bằng cách chạy 2 lần cùng đầu vào (cả ca có scenario và ca tự sinh ngẫu nhiên 300 ticks) và so sánh toàn bộ byte trong `verify.mjs` và `capture-phase1-evidence.mjs` (lưu SHA-256 tại `contract-check.txt`). Có thể chạy độc lập bằng `scripts/check-determinism.mjs` như [kế hoạch](../../tests/phase1/PLAN.md).
