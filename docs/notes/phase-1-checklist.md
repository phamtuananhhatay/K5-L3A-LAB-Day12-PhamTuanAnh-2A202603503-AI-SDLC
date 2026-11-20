# Phase 1 — yêu cầu, giả định và cách kiểm chứng

Nguồn: [PRD-0 và Test Contract v1.0](../requirements/PRD-0.txt) do người làm lab cung cấp. Tài liệu này được lập **trước khi code** và cập nhật sau triển khai. Các giá trị ở mục "Giả định thiết kế" đã được dùng trong code và khai báo ở `game.contract.json`.

## A. Bản chơi Đêm 1

| ID | Yêu cầu PRD-0 | Điểm chưa rõ / giả định | Bằng chứng kiểm chứng | Kết quả |
|---|---|---|---|:---:|
| P1-01 | Game 3D tên Đảo Đèn Lồng; một màn Đêm 1 – Đảo Bến, đảo tròn có **5** Đèn Lồng Lớn. | Bán kính đảo 30 m, 5 đèn xếp vòng cung đối xứng. | [game-screen.png](../proof/game-screen.png), verify check 1 | **Đạt** |
| P1-02 | Điều khiển Mây đi lại, nhảy, camera 3D. Mây đội nón lá có đèn lồng nhỏ. | Vận tốc 6 m/s, nhảy chỉ tác động Y, yaw camera xoay vector di chuyển. | Verify check 2 (di chuyển 60 Hz), bản chơi 3D | **Đạt** |
| P1-03 | Đom đóm rải trên đảo và nhặt được. | Bán kính nhặt 1 m, tối đa mang 5 đom đóm, +10 điểm/con. | [pickup.jsonl](../proof/pickup.jsonl), verify check 3 | **Đạt** |
| P1-04 | Mang ánh sáng đến nạp và thắp Đèn Lồng Lớn. | Cần 3 đom đóm/đèn, bán kính tương tác 2 m, +100 điểm/đèn. | [deposit.jsonl](../proof/deposit.jsonl), verify check 4 | **Đạt** |
| P1-05 | Bóng Mực xuất hiện và đuổi Mây. | Tốc độ 2 m/s, đuổi theo hướng vector Mây trên mặt phẳng XZ. | [pulse.jsonl](../proof/pulse.jsonl), verify check 5 | **Đạt** |
| P1-06 | Bóng Mực chạm Mây làm Mây mất máu. | Mây có 3 tim đèn, mỗi lần chạm mất 1 tim, miễn nhiễm 1 s. | [hit.jsonl](../proof/hit.jsonl), verify check 6 | **Đạt** |
| P1-07 | Mây tỏa sáng để xua Bóng Mực và tốn ánh sáng. | Tốn 1 đom đóm đang mang, bán kính 5 m, đẩy xa 3 m, choáng 2 s, hồi 3 s. | [pulse.jsonl](../proof/pulse.jsonl), verify check 5 | **Đạt** |
| P1-08 | Bóng Mực sợ những chiếc đèn. | Đèn đã thắp tạo vùng an toàn bán kính 4 m, Bóng Mực không vào được. | Verify check 18 (`safe_radius`) | **Đạt** |
| P1-09 | Thắp hết đèn thì thắng; hết máu thì thua. | Thắng khi thắp đủ 5 đèn (`all_lit`), thua khi hết máu (`no_flames`) hoặc hết 300 s (`dawn`). | [win.jsonl](../proof/win.jsonl), [loss.jsonl](../proof/loss.jsonl), [dawn.jsonl](../proof/dawn.jsonl), checks 7, 8, 9, 21 | **Đạt** |
| P1-10 | Có điểm số và HUD; chơi lại được sau thắng/thua. | Điểm lưu theo công thức `score.*`, HUD hiển thị đủ thông số, phím R restart. | [sequence.jsonl](../proof/sequence.jsonl), check 12, giao diện WebGL2 | **Đạt** |
| P1-11 | Cảm giác đêm ấm áp, cổ tích; đảo sáng dần; vàng cam tốt, tím đen nguy hiểm; không máu me. | Phong cách nghệ thuật tối giản, an toàn, ánh sáng ấm. | [game-screen.png](../proof/game-screen.png), README mục Sáng tạo | **Đạt** |

## B. Test Contract v1.0 — giao diện bắt buộc

| ID | Điều bắt buộc, chính xác | Bằng chứng kiểm chứng | Kết quả |
|---|---|---|:---:|
| C-01 | `game.contract.json` ở gốc repo; `contract_version: "1.0"`, `team`, `build_cmd`, `run_cmd`, `headless_cmd`, `tuning` đúng tên và kiểu. Lệnh chạy trên macOS/Linux sau build. | `node scripts/build.mjs` kiểm tra cú pháp và so khớp toàn bộ tuning | **Đạt** |
| C-02 | Headless nhận `--seed <int> --night 1 [--scenario <file.json>] [--inputs <file.json>] --ticks <int> --out <file.jsonl> [--snapshot-every <int>]`. Mặc định snapshot mỗi **10** tick. | Verify check 14 (`snapshot-every defaults to ten`), kịch bản chạy tối thiểu và đầy đủ | **Đạt** |
| C-03 | Logic cố định **60 tick/giây**, không cửa sổ/GPU; dừng sau đúng N bước hoặc khi game kết thúc; thành công mã 0, lỗi khác 0, input/scenario sai định dạng mã **2** và báo stderr. | Verify check 15, 16; [contract-check.txt](../proof/contract-check.txt) ghi nhận exit code 2 và stderr | **Đạt** |
| C-04 | Snapshot tick 0 sau dựng scenario, trước input. Bước k đọc input tick k tạo trạng thái k+1; event trong bước đó mang tick k+1; `--ticks N` là N bước. `time_left_s = duration − steps/60`. | Verify checks 1, 2, 12; validator schema kiểm tra thứ tự tick | **Đạt** |
| C-05 | Đơn vị mét; Y lên; mặt đất Y=0; Mây mặc định (0,0,0). `player.pos` là chân, `shade.pos` là tâm, `lantern.pos` là chân cột, mote là điểm trên đất. Mọi bán kính đo trên XZ, tính cả biên `≤ r`. | [boundary.jsonl](../proof/boundary.jsonl), verify checks 13, 17 | **Đạt** |
| C-06 | `inputs.frames` có tick tăng **nghiêm ngặt**; trước frame đầu: move `[0,0]`, yaw 0, nút false. Trường vắng mặt giữ giá trị cũ. | Verify check 12 (`sequence`), check 15 (`invalid frame ticks exit 2`) | **Đạt** |
| C-07 | `move: [x,z]` mỗi phần tử trong [-1,1], chuẩn hóa nếu dài >1. Yaw θ: `x'=x cosθ+z sinθ`, `z'=-x sinθ+z cosθ`. `jump`, `interact`, `pulse` (và `dash` nếu có) kích hoạt ở cạnh false→true. Không file inputs = đứng yên. | Verify checks 2, 19 (`held pulse fires only on false-to-true`) | **Đạt** |
| C-08 | Scenario: trường vắng mặt dùng mặc định; `random_motes:false`/`random_shades:false` tắt tự sinh; `motes`/`shades` thay danh sách, kể cả mảng rỗng; `lanterns` cập nhật L1…L5 theo id, đèn không nhắc giữ nguyên; `lit:true` được phép; dựng scenario không phát event/cộng điểm. | Verify checks 1, 20 (`scenario partial lantern patch preserves unmentioned lanterns and lit gives zero score`) | **Đạt** |
| C-09 | Output **JSONL**: snapshot tick 0 và mỗi `snapshot-every`; event ngay khi xảy ra; end là dòng cuối **bắt buộc**. Snapshot có `type,tick,sim_tick,state,time_left_s,score,player,lanterns,shades,motes_active`; player có `pos,flames,carried`; lantern có `id,pos,lit,deposited`; shade có `id,pos,state`. | Hàm `validateOutput()` trong verify kiểm tra toàn diện mọi trường | **Đạt** |
| C-10 | Event names/data chính xác: `mote_picked{carried}`, `deposit{lantern_id,amount,deposited}`, `lantern_lit{lantern_id}`, `pulse{stunned_ids}`, `player_hit{by,flames,dropped}`, `shade_spawned{id}`, `game_over{result,reason}`. Lý do kết thúc: `all_lit`, `dawn`, `no_flames`. | Toàn bộ 9 fixture scenario và `validateOutput()` kiểm tra schema event | **Đạt** |
| C-11 | `state` là `playing/won/lost`; Bóng Mực tối thiểu có trạng thái `stunned`. Tọa độ làm tròn **3 chữ số thập phân**. `sim_tick=tick` ở Phase 1. | Verify checks và hàm kiểm tra `coordinate exceeds 3 decimals` | **Đạt** |
| C-12 | Cùng seed + scenario + inputs cho output **giống hệt từng byte**, gồm ID tự sinh. Không cần RNG trùng bài khác. | Verify check 10, 11; [contract-check.txt](../proof/contract-check.txt) có mã băm SHA-256 | **Đạt** |

### Tên trường `tuning` phải khai báo

`player_speed`, `carry_capacity`, `lantern_cost`, `lantern_count_night1` (**5**), `pickup_radius`, `interact_radius`, `pulse_cost`, `pulse_radius`, `night1_duration_s`, `flames`, `invuln_s`, `hit_drop_ratio`, `pulse_stun_s`, `pulse_push_m`, `pulse_cooldown_s`, `safe_radius`, `shade_speed`, `shade_hit_radius`, `fall_enabled`; `score` gồm `per_mote`, `per_lantern`, `per_stun`, `per_second_left`, `per_flame_left`.

Các giá trị phải phản ánh **code thực tế**. Cơ chế không tồn tại thì dùng `null` (hoặc `false` cho cờ) và giải thích trong README. Không điền số giả để qua test.

## C. Giả định thiết kế đề xuất cho chỗ PRD-0 chưa quy định

Đây là quyết định cho bản đầu tiên, hiện đã dùng trong game. Nếu đổi, cập nhật mục này và `game.contract.json` cùng lúc.

| Chủ đề | Giá trị/luật đề xuất | Lý do |
|---|---|---|
| Không gian và đèn | Đảo bán kính 30 m, 5 đèn L1…L5 đặt vòng quanh tâm; Mây ở gốc. | Dễ chơi, dễ dựng scenario và đo khoảng cách. |
| Di chuyển | `player_speed=6` m/s; nhảy chỉ tác động Y, các khoảng cách tương tác vẫn đo XZ. | Một vòng đảo có thể chơi trong vài phút. |
| Thu thập/nạp | `carry_capacity=5`, `pickup_radius=1` m, `interact_radius=2` m, `lantern_cost=3`; mỗi lần interact nạp tối đa lượng đang mang cho đến khi đủ 3. | Cần vừa nhặt vừa quay về đèn, vẫn hỗ trợ nạp từng phần. |
| Sống và bị chạm | `flames=3`, mỗi lần trúng mất 1, `invuln_s=1`, `hit_drop_ratio=0`, `fall_enabled=false`. | Luật đơn giản, tránh mất máu mỗi tick; không thêm cơ chế rơi khỏi đảo. |
| Pulse | Tốn `pulse_cost=1` **carried**, bán kính `pulse_radius=5` m, stun `pulse_stun_s=2`, đẩy `pulse_push_m=3` m, hồi `pulse_cooldown_s=3`. Không đủ carried thì không kích hoạt. | Làm rõ "tốn ánh sáng" mà không tự gây hết máu. |
| Bóng Mực | `shade_speed=2` m/s, `shade_hit_radius=0.8` m; không vào `safe_radius=4` m quanh đèn đã thắp. | Mây có thể chạy thoát, đèn tạo vùng an toàn rõ. |
| Thời gian | `night1_duration_s=300`; hết thời gian khi còn đèn tắt là thua `dawn`. | Vừa đủ một màn chơi ngắn. |
| Điểm | `per_mote=10`, `per_lantern=100`, `per_stun=5`, `per_second_left=1`, `per_flame_left=50`; thưởng thời gian/máu còn lại khi thắng. | Tất cả thành phần điểm có ý nghĩa và giải thích được. |
| Đồng thời | Trong một bước: input/di chuyển → nhặt → interact → pulse → Bóng Mực → va chạm → hết giờ/thắng thua. Nếu đèn cuối được thắp trong bước đó, ưu tiên thắng; nếu không, `no_flames` trước `dawn`. | Tạo thứ tự tất định, dễ kiểm thử. |

## D. Việc cần có khi chốt Phase 1

- Game chơi được từ đầu tới thắng/thua, có restart và HUD.
- README nêu cài/chạy tối đa 3 lệnh, điều khiển, tính điểm, lệnh headless, giả định và mục "Sáng tạo của tôi" nếu có phần thêm.
- `game.contract.json` khớp code; chạy được trên macOS/Linux.
- Bằng chứng cho từng mục chính, input/output scenario và phép kiểm tra tính tất định; chỗ chưa đạt ghi thật.
- Giữ file harness AI, ghi chú giả định/AI/token, commit và tag `phase-1` trên repo public.

## E. Tình trạng kiểm chứng hiện tại

Đã triển khai hoàn tất lõi game, headless và bản chơi WebGL2. Toàn bộ 12 tiêu chí Test Contract v1.0 (C-01 đến C-12) cùng các hành vi Đêm 1 (P1-01 đến P1-11) đã vượt qua 21 automated checks trong `tests/phase1/verify.mjs`. Bằng chứng output JSONL, ảnh chụp màn hình WebGL2 và kiểm tra tính tất định SHA-256 đã lưu đầy đủ tại [docs/proof/phase-1.md](../proof/phase-1.md). Sẵn sàng cho Bước 6 kiểm chứng bản chơi thực tế và Bước 7 phát hành tag `phase-1`.
