# Phase 1 — kế hoạch kiểm chứng trước khi code

Nguồn yêu cầu: [PRD-0 + Test Contract v1.0](../../docs/requirements/PRD-0.txt). Giả định và thông số: [checklist](../../docs/notes/phase-1-checklist.md). Các fixture JSON ở thư mục này được dùng bởi `verify.mjs`; xem [bằng chứng Phase 1](../../docs/proof/phase-1.md) cho kết quả chạy thật.

## Cách chạy dự kiến

Sau khi có `game.contract.json`, dùng đúng `headless_cmd` khai trong file đó. Nếu chọn kiến trúc Node như đã chuẩn bị, cú pháp dự kiến là:

```bash
node src/headless.mjs --seed 42 --night 1 --scenario tests/phase1/pickup.scenario.json --ticks 1 --snapshot-every 1 --out pickup.jsonl
```

`src/headless.mjs` đã triển khai. `node tests/phase1/verify.mjs` parse từng dòng JSONL, kiểm tra event và snapshot, đồng thời kiểm tra dòng cuối là `end`.

## Scenario theo yêu cầu chính

| Yêu cầu | Trạng thái ban đầu (fixture) | Hành động | Kết quả cần kiểm tra |
|---|---|---|---|
| P1-01 đảo/5 đèn | `empty.scenario.json` | Chạy 0 tick | Snapshot tick 0 có đúng L1…L5; bản chơi hiển thị đảo tròn và 5 đèn. |
| P1-02 di chuyển | `empty.scenario.json` | `move.inputs.json`, chạy 1 tick | `player.pos.x` tăng khoảng `6/60 = 0.1` m, Z giữ 0. Thêm ca yaw 90° và vector [1,1] để kiểm tra công thức/chuẩn hóa. Chơi thử nhảy và camera. |
| P1-03 nhặt | `pickup.scenario.json` | Không cần inputs, chạy 1 tick | Snapshot tick 0: carried 0, 1 mote. Event tick 1 `mote_picked` với carried 1; snapshot tick 1: mote 0, carried 1, score 10. Thêm ca mote ở bán kính đúng 1 m và >1 m. |
| P1-04 nạp đèn | `deposit.scenario.json` | `deposit.inputs.json`, chạy 1 tick | Event tick 1 `deposit` cho L1 amount 3/deposited 3, rồi `lantern_lit` L1; carried 0, L1 sáng, score 100. Thêm ca ngoài 2 m và nạp từng phần. |
| P1-05 Bóng Mực đuổi | `pulse.scenario.json` | Không pulse, không move, chạy 60 tick | Khi không bị đèn cản, khoảng cách XZ từ S1 tới Mây giảm. Dùng snapshot mỗi 10 tick để quan sát. |
| P1-06 va chạm/mất máu | `hit.scenario.json` | Không inputs, chạy 1 tick | `player_hit` tick 1, `by:shade`, flames 2, dropped 0. Trong 60 tick kế tiếp không bị trừ thêm khi còn invulnerability. |
| P1-07 tỏa sáng | `pulse.scenario.json` | `pulse.inputs.json`, chạy 1 tick | `pulse` tick 1 có `stunned_ids:["S1"]`; carried từ 1 xuống 0; S1 `stunned`, bị đẩy theo hướng ra xa. Thêm ca thiếu carried, ngoài bán kính, giữ nút true nhiều tick. |
| P1-08 đèn bảo vệ | Scenario sửa L1 `lit:true`, đặt S1 gần L1 | Chạy nhiều tick | S1 không đi vào vùng XZ ≤ safe_radius 4 m quanh L1. Ca đối chứng L1 tắt cho phép đuổi Mây. |
| P1-09 thắng | `win.scenario.json` | `deposit.inputs.json`, chạy 1 tick | L1 sáng, cả 5 đèn sáng; `game_over` result won/reason all_lit; `end.state=won`; dừng sớm. Đèn L2…L5 sáng từ scenario không cộng điểm. |
| P1-09 thua do máu | `loss.scenario.json` | Không inputs, chạy 1 tick | `player_hit` flames 0, `game_over` result lost/reason no_flames, `end.state=lost`. |
| P1-09 thua do bình minh | `dawn.scenario.json` | Không inputs, chạy 1 tick | `game_over` result lost/reason dawn, `end.state=lost`. |
| P1-10 điểm/HUD/restart | Dùng ca nhặt, nạp, pulse, thắng/thua | Chạy từng ca; sau thắng/thua thao tác restart bản chơi | Điểm theo `score.*` của contract; HUD hiển thị máu/ánh sáng/đèn/điểm/thời gian; restart đưa về trạng thái đầu. |
| P1-11 hình ảnh | Bản chơi | Chơi trước/sau thắp đèn | Ảnh cho thấy đảo sáng dần, Mây đội nón lá có đèn nhỏ, màu vàng cam/tím đen, không máu me. |

## Kiểm tra giao thức không phụ thuộc luật chơi

1. Chạy `--ticks 0`: chỉ có snapshot tick 0 và `end`; `sim_tick=0`, không event từ dựng scenario.
2. Chạy `--ticks 1 --snapshot-every 1`: bước 0 tạo trạng thái tick 1; event mang tick 1; `sim_tick=1`; thời gian giảm `1/60` giây.
3. Chạy `--ticks 60 --snapshot-every 10`: snapshot tại 0,10,…,60 nếu game còn chơi; `end.ticks=60`.
4. Dùng `invalid.inputs.json`: hai frame trùng tick phải cho exit code 2 và stderr giải thích lỗi. Thêm ca JSON hỏng cho inputs và scenario.
5. Scenario `motes:[]`, `shades:[]`, hai cờ random false phải không sinh thực thể. Đặt `lit:true` trong scenario không tạo `lantern_lit` hoặc điểm.
6. Kiểm tra các khoảng cách theo XZ, tính cả biên `≤ r`; độ cao Y không làm thay đổi kết quả pickup/interact/pulse/hit.
7. Đối chiếu tên trường, kiểu dữ liệu, thứ tự event, state hợp lệ, tọa độ làm tròn 3 chữ số thập phân, `end` ở dòng cuối.
8. Dùng cùng seed/scenario/inputs để chạy 2 lần và so sánh **toàn bộ byte JSONL**, kể cả ID. Không dùng thời gian thực hoặc RNG chưa seed trong logic.

## Lệnh so sánh tính tất định

Script [check-determinism.mjs](../../scripts/check-determinism.mjs) chạy cùng lệnh headless hai lần, mỗi lần với file `--out` riêng, rồi so sánh byte. Ví dụ **sau khi có game**:

```bash
node scripts/check-determinism.mjs -- node src/headless.mjs --seed 42 --night 1 --scenario tests/phase1/pickup.scenario.json --ticks 60 --snapshot-every 1
```

Để thử ID tự sinh, chạy thêm một ca **không truyền `--scenario`** nhưng cùng seed và inputs. Đây là kiểm tra tính tất định của từng bài, không so chuỗi ngẫu nhiên giữa các bài khác nhau.

## Tách logic cần thiết

```text
scenario + seed + input frames
             │
             ▼
    state ban đầu + step(state, input, tick)
             │
       ┌─────┴──────────┐
       ▼                ▼
  JSONL headless    WebGL2 + bàn phím/camera/HUD
```

`step` chỉ xử lý gameplay ở 60 Hz, nhận trạng thái và input, trả trạng thái mới cùng danh sách event. Renderer không quyết định nhặt đom đóm, nạp đèn, trúng đòn, điểm hoặc thắng/thua. Bộ headless dùng cùng `step` để tránh hai bản luật khác nhau.

## Trạng thái hiện tại

Đã chạy các scenario lõi và lưu output thực tế tại `docs/proof/`. Các ca kiểm tra bổ sung và phần đồ họa cần đối chiếu với [bằng chứng Phase 1](../../docs/proof/phase-1.md). Chưa kiểm thử thủ công toàn bộ một lượt chơi bằng bàn phím trên macOS/Linux.
