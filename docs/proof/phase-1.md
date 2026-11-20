# Bằng chứng Phase 1 — Bước 4

Mã kiểm chứng: `src/core.mjs`, `src/headless.mjs`, `src/game.mjs`, `tests/phase1/verify.mjs`. PRD-0: [bản gốc](../requirements/PRD-0.txt). Các file JSONL dưới đây do chương trình tạo trực tiếp, không sửa tay.

| Yêu cầu | Lệnh/đầu vào | Bằng chứng thực tế | Kết quả |
|---|---|---|---|
| Contract tuning khớp code và cú pháp nguồn | `node scripts/build.mjs` | `PASS: source syntax and Test Contract tuning` | Đạt |
| Máy chủ trả trang chơi và core | `node scripts/smoke.mjs` | `PASS: Node server returns the game page and shared game logic` | Đạt |
| Nhặt đom đóm | `pickup.scenario.json`, 1 tick | [pickup.jsonl](pickup.jsonl): `mote_picked`, score 10 | Đạt |
| Nạp/thắp đèn | `deposit.scenario.json` + `deposit.inputs.json`, 1 tick | [deposit.jsonl](deposit.jsonl): `deposit`, `lantern_lit`, score 100 | Đạt |
| Pulse | `pulse.scenario.json` + `pulse.inputs.json`, 1 tick | [pulse.jsonl](pulse.jsonl): `pulse`, S1 stunned | Đạt |
| Bóng Mực chạm Mây | `hit.scenario.json`, 1 tick | [hit.jsonl](hit.jsonl): `player_hit`, flames 2 | Đạt |
| Thắp đèn cuối để thắng | `win.scenario.json` + `deposit.inputs.json`, 1 tick | [win.jsonl](win.jsonl): `game_over/all_lit`, end won | Đạt |
| Hết máu/hết thời gian | `loss.scenario.json` / `dawn.scenario.json`, 1 tick | [loss.jsonl](loss.jsonl), [dawn.jsonl](dawn.jsonl): end lost | Đạt |
| Ranh giới bán kính, vùng an toàn, pulse cạnh nút, tính tất định và lỗi input | `node tests/phase1/verify.mjs` | `Phase 1 headless checks: 19 passed` | Đạt |
| Chuỗi nhặt → nạp → pulse → đi bộ | `sequence.scenario.json` + `sequence.inputs.json`, 16 tick | [sequence.jsonl](sequence.jsonl): event tick 1/2/4; carried 4→1→0; điểm 20→120→125; X=1 ở tick 15 | Đạt |
| Bán kính nhặt đúng biên, chỉ đo XZ | `boundary.scenario.json`, 1 tick | [boundary.jsonl](boundary.jsonl): chỉ nhặt mote X=1 dù Y=4; mote X=1.001 còn lại | Đạt |
| Input và scenario sai định dạng | `invalid.inputs.json`, `invalid.scenario.json` | [contract-check.txt](contract-check.txt): exit code 2, stderr có lý do | Đạt |
| Tính tất định với thực thể tự sinh | Cùng seed 42, mặc định, 300 tick, chạy 2 lần | [contract-check.txt](contract-check.txt): byte identical và SHA-256 | Đạt |
| Render 3D và HUD | Chrome headless, 1280×720, truy cập `http://127.0.0.1:4173/` | [game-screen.png](game-screen.png) | Đạt cho khung hình đầu; chưa kiểm thử một lượt chơi bằng bàn phím |

Tạo lại toàn bộ output và kết quả lỗi/tính tất định:

```bash
node scripts/capture-phase1-evidence.mjs
node tests/phase1/verify.mjs
```

Tái tạo riêng một output, ví dụ:

```bash
node src/headless.mjs --seed 42 --night 1 --scenario tests/phase1/pickup.scenario.json --ticks 1 --snapshot-every 1 --out pickup.jsonl
```

Tính tất định được kiểm tra bằng cùng seed/scenario/inputs chạy hai lần và so sánh byte trong `verify.mjs`; `capture-phase1-evidence.mjs` còn kiểm tra ca có thực thể tự sinh. Có thể chạy riêng bằng `scripts/check-determinism.mjs` như [kế hoạch](../../tests/phase1/PLAN.md).

**Giới hạn hiện tại:** Ảnh xác nhận WebGL2 hiển thị được trên môi trường kiểm tra; chưa xác nhận thao tác bàn phím và chơi trọn Đêm 1 trên macOS/Linux. Chưa có video demo hoặc bằng chứng hiệu năng.
