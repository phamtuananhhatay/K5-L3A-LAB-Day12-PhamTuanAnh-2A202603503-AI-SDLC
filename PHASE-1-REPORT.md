# BÁO CÁO TỔNG KẾT PHASE 1 — ĐẢO ĐÈN LỒNG
**Khóa học:** Day 12 · AI SDLC Lab  
**Học viên:** Phạm Tuấn Anh — **MSSV:** 2A202603503  
**Repository:** [K5-L3-LAB-Day12-PhamTuanAnh-2A202603503-AI-SDLC](https://github.com/phamtuananhhatay/K5-L3-LAB-Day12-PhamTuanAnh-2A202603503-AI-SDLC)  
**Mốc phát hành:** Git tag `phase-1` (Commit hash: `d67561c`)  
**Test Contract:** v1.0  

---

## 1. Mục tiêu và phạm vi Phase 1 (PRD-0)

Triển khai màn chơi đầu tiên **Đêm 1 – Đảo Bến** theo [PRD-0](docs/requirements/PRD-0.txt) với hai giao thức song song:
1. **Bản chơi 3D tương tác**: Chạy trên trình duyệt qua WebGL2 thuần (không thư viện ngoài), góc nhìn thứ ba, hỗ trợ đầy đủ bàn phím điều khiển, HUD hiển thị trực quan và tính năng chơi lại (Restart).
2. **Chế độ Headless CLI**: Chạy không giao diện đồ họa ở tần số cố định **60 tick/giây**, tuân thủ nghiêm ngặt **Test Contract v1.0**, sinh đầu ra JSONL có cấu trúc chuẩn xác và đạt tính tất định byte-identical giữa các lần chạy.

---

## 2. Kiến trúc giải pháp (Architecture & Design)

Để đảm bảo tính nhất quán tuyệt đối và tránh tình trạng "game một đường, test một nẻo", dự án áp dụng mô hình kiến trúc chia sẻ logic:

```text
       [Fixture Scenario / Inputs]               [Bàn phím người chơi]
                   │                                       │
                   ▼                                       ▼
       ┌─────────────────────────────────────────────────────────────┐
       │                 LÕI GAME: src/core.mjs                       │
       │  • createGame(seed, scenario)                               │
       │  • step(game, input, previousInput)                         │
       │  • snapshot(game)                                           │
       └──────────────────────────────┬──────────────────────────────┘
                                      │
                 ┌────────────────────┴────────────────────┐
                 ▼                                         ▼
      [Headless CLI: src/headless.mjs]          [WebGL2 3D: src/game.mjs]
      • Tham số dòng lệnh CLI                   • Renderer WebGL2 (camera 3D)
      • Xuất JSONL: snapshot, event, end        • HUD, Canvas, vòng lặp requestAnimationFrame
```

- **Single Source of Truth**: Mọi quy tắc tính điểm, va chạm, nhặt đom đóm, trừ máu, bán kính an toàn và điều kiện thắng/thua đều nằm trong hàm thuần túy `step()` tại [src/core.mjs](src/core.mjs).
- **Renderer độc lập**: Renderer chỉ đọc dữ liệu trạng thái để vẽ, không can thiệp hay thay đổi luật chơi.

---

## 3. Ma trận đối chiếu yêu cầu & Bằng chứng thực tế (Traceability Matrix)

### A. Yêu cầu Gameplay (PRD-0: P1-01 đến P1-11)

| Mã | Yêu cầu PRD-0 | Tiêu chí & Giả định | Bằng chứng thực tế | Kết quả |
|:---:|---|---|---|:---:|
| **P1-01** | Game 3D Đảo Đèn Lồng, Đêm 1 – Đảo Bến, 5 Đèn Lồng Lớn | Đảo tròn bán kính 30 m, 5 đèn `L1`–`L5` đặt đối xứng bán kính 20 m | [game-screen.png](docs/proof/game-screen.png), verify check 1 | **ĐẠT** |
| **P1-02** | Điều khiển Mây đi lại, nhảy, camera 3D, nón lá có đèn nhỏ | Vận tốc 6 m/s, nhảy trục Y, yaw camera tính theo $X/Z$ | Verify check 2 (`camera-relative movement at 60 Hz`) | **ĐẠT** |
| **P1-03** | Đom đóm rải rác trên đảo, nhặt được | Bán kính $\le 1\text{ m}$, mang tối đa 5 con, +10 điểm/con | [pickup.jsonl](docs/proof/pickup.jsonl), verify check 3 | **ĐẠT** |
| **P1-04** | Nạp ánh sáng và thắp Đèn Lồng Lớn | Cần 3 đom đóm/đèn, bán kính nạp $\le 2\text{ m}$, +100 điểm/đèn | [deposit.jsonl](docs/proof/deposit.jsonl), verify check 4 | **ĐẠT** |
| **P1-05** | Bóng Mực xuất hiện và đuổi Mây | Vận tốc 2 m/s, đuổi theo vector XZ hướng về Mây | [pulse.jsonl](docs/proof/pulse.jsonl), verify check 5 | **ĐẠT** |
| **P1-06** | Bóng Mực chạm Mây làm Mây mất máu | Có 3 tim đèn (`flames`), chạm mất 1 tim, miễn nhiễm 1 s | [hit.jsonl](docs/proof/hit.jsonl), verify check 6 | **ĐẠT** |
| **P1-07** | Mây tỏa sáng (Pulse) để xua Bóng Mực | Tiêu tốn 1 đom đóm mang theo, bán kính 5 m, đẩy xa 3 m, choáng 2 s | [pulse.jsonl](docs/proof/pulse.jsonl), verify check 5 | **ĐẠT** |
| **P1-08** | Bóng Mực sợ những chiếc đèn | Bán kính an toàn 4 m quanh **đèn đã thắp**, quái bị chặn ngoài | Verify check 18 (`safe_radius`) | **ĐẠT** |
| **P1-09** | Thắp hết đèn thì thắng; hết máu/giờ thì thua | Thắp đủ 5 đèn $\rightarrow$ `won/all_lit`; hết tim $\rightarrow$ `lost/no_flames`; hết 300 s $\rightarrow$ `lost/dawn` | [win.jsonl](docs/proof/win.jsonl), [loss.jsonl](docs/proof/loss.jsonl), [dawn.jsonl](docs/proof/dawn.jsonl), checks 7, 8, 9, 21 | **ĐẠT** |
| **P1-10** | Điểm số, HUD trực quan, phím chơi lại (R) | Tính điểm chuẩn `score.*`, hiển thị máu/đèn/điểm/giờ, phím R restart | [sequence.jsonl](docs/proof/sequence.jsonl), verify check 12, WebGL2 | **ĐẠT** |
| **P1-11** | Cảm giác đêm ấm áp, cổ tích; vàng cam tốt, tím đen nguy hiểm | Phong cách tối giản, tone màu ấm, không bạo lực | [game-screen.png](docs/proof/game-screen.png), README mục Sáng tạo | **ĐẠT** |

### B. Yêu cầu Test Contract v1.0 (C-01 đến C-12)

| Mã | Tiêu chuẩn Contract v1.0 | Cách thức kiểm chứng | Kết quả |
|:---:|---|---|:---:|
| **C-01** | File `game.contract.json` đầy đủ các trường, `tuning` khớp 100% với code | `node scripts/build.mjs` kiểm tra cú pháp và so khớp tuning | **ĐẠT** |
| **C-02** | CLI nhận đủ flag; snapshot mặc định mỗi 10 tick | Chạy cả ca tối thiểu và ca có `--snapshot-every`, check 14 | **ĐẠT** |
| **C-03** | Chạy 60 tick/s, dừng sau N bước hoặc kết thúc; lỗi format thoát mã **2** | [contract-check.txt](docs/proof/contract-check.txt), verify checks 15, 16 | **ĐẠT** |
| **C-04** | Snapshot tick 0 sau scenario; bước $k$ tạo tick $k+1$; `time_left_s = duration - steps/60` | Hàm `validateOutput()` kiểm tra tick & thời gian | **ĐẠT** |
| **C-05** | Tọa độ mét, Y lên, đất $Y=0$, khoảng cách đo XZ tính cả biên $\le r$ | [boundary.jsonl](docs/proof/boundary.jsonl), verify checks 13, 17 | **ĐẠT** |
| **C-06** | `inputs.frames` tick tăng nghiêm ngặt; giữ giá trị trường cũ nếu vắng mặt | Verify checks 12, 15 | **ĐẠT** |
| **C-07** | Move $[-1, 1]$ chuẩn hóa độ dài $\le 1$, xoay yaw $\theta$, kích hoạt cạnh false $\rightarrow$ true | Verify checks 2, 19 (`held pulse fires only on transition`) | **ĐẠT** |
| **C-08** | Scenario thay thế motes/shades; patch đèn theo ID; `lit:true` không cộng điểm | Verify check 20 (`scenario partial lantern patch...`) | **ĐẠT** |
| **C-09** | Output JSONL: Snapshot, Event, End (dòng cuối bắt buộc); tọa độ 3 chữ số thập phân | `validateOutput()` kiểm tra schema và độ chính xác số | **ĐẠT** |
| **C-10** | Tên event và schema data chính xác (`mote_picked`, `deposit`, `lantern_lit`, `pulse`, `player_hit`, `game_over`) | Bộ 9 kịch bản scenario và `validateOutput()` | **ĐẠT** |
| **C-11** | Enum state `playing/won/lost`; Bóng Mực có `stunned`; `sim_tick = tick` | Kiểm tra chặt chẽ qua validator | **ĐẠT** |
| **C-12** | Tính tất định: cùng seed/scenario/inputs cho output byte-identical | [contract-check.txt](docs/proof/contract-check.txt) (SHA-256), verify checks 10, 11 | **ĐẠT** |

---

## 4. Kiểm chứng bản clone sạch (Clean Clone Verification)

Đã chạy kiểm thử độc lập mô phỏng quá trình chấm tự động của giảng viên:
1. Thực hiện `git clone` repository ra một thư mục tạm biệt lập.
2. Chạy đúng 2 lệnh theo hướng dẫn trong [README.md](README.md):
   ```bash
   node scripts/build.mjs
   npm test
   ```
3. Chạy lệnh headless xuất file JSONL:
   ```bash
   node src/headless.mjs --seed 42 --night 1 --scenario tests/phase1/pickup.scenario.json --ticks 1 --snapshot-every 1 --out pickup.jsonl
   ```
- **Kết quả**: Tất cả các lệnh đều hoàn thành với mã thoát `0`, toàn bộ **21 bài kiểm tra headless đều PASS**, chứng minh mã nguồn hoàn toàn độc lập và không phụ thuộc môi trường máy phát triển.

---

## 5. Nhật ký sử dụng AI & Kiểm soát Token (Rubric D)

### A. Thống kê định lượng

| Hoạt động | Công cụ AI | Token ước tính | Chi phí ước tính | Giá trị mang lại |
|---|---|---:|---:|---|
| Khảo sát PRD-0 & Thiết lập môi trường ban đầu | Gemini 3.8 Flash / Codex | ~8.000 tokens | ~$0.03 | Tạo demo WebGL2 độc lập không cần thư viện ngoài; cấu hình script build/serve/test |
| Triển khai Game Core & WebGL2 (Bước 4) | Gemini 3.8 Flash / Codex | ~18.000 tokens | ~$0.07 | Xây dựng lõi thuần `step()` chia sẻ chung cho browser và CLI; render 3D |
| Xây dựng Test Contract, Scenario & Bằng chứng (Bước 5–7) | Gemini 3.8 Flash | ~14.000 tokens | ~$0.05 | Xây dựng 9 scenario fixtures, 21 bài kiểm tra tự động, validator schema JSONL, bắt lỗi mã thoát 2 |
| **TỔNG CỘNG PHASE 1** | | **~40.000 tokens** | **~$0.15** | Hoàn thành trước hạn mốc 1h, tiết kiệm token tối đa |

### B. Biện pháp kiểm soát và tiết kiệm token
- **Tự động hóa kiểm thử cục bộ**: Sử dụng script Node.js (`verify.mjs`, `capture-phase1-evidence.mjs`) để tự động kiểm tra và chụp bằng chứng, không yêu cầu AI đọc và phân tích từng file JSONL.
- **Harness ngắn gọn**: Giữ file [AGENTS.md](AGENTS.md) dưới 15 dòng để giảm thiểu context overhead trong mỗi request.
- **Tách kiến trúc rõ ràng**: Tách logic game ra hàm thuần túy `step()`, không phải viết hoặc bảo trì 2 logic game riêng biệt cho đồ họa và headless.

### C. Phân tích lỗi AI và cách khắc phục bằng Harness
1. **Lỗi bịa thêm cờ / event ngoài tài liệu**: AI từng có xu hướng tự bổ sung cờ `dash` hoặc event `fall`.
   - *Khắc phục*: Ghi quy tắc bắt buộc vào `AGENTS.md` và viết hàm `validateOutput()` bắt buộc event name phải nằm trong whitelist của Contract v1.0.
2. **Lỗi tick không tăng nghiêm ngặt**: AI dễ bỏ qua ràng buộc tick frame phải tăng ngặt hoặc không duy trì trạng thái khi frame mới thiếu trường.
   - *Khắc phục*: Thêm bài test riêng `invalid.inputs.json` bắt buộc thoát mã 2 và kiểm tra duy trì input cũ.

---

## 6. Sáng tạo của tôi (My Creativity — Rubric F)

- **Hình ảnh & Thẩm mỹ**: Thiết kế 5 Đèn Lồng Lớn xếp thành vòng cung ấm áp quanh đảo tròn; nhân vật Mây đội nón lá gắn đèn nhỏ phát sáng; hiệu ứng màu vàng cam ấm áp lan tỏa khi thắp sáng đèn, phân biệt rõ với màu tím đen nguy hiểm của Bóng Mực.
- **Bóng Mực đổi màu khi bị choáng**: Khi Mây kích hoạt tỏa sáng (Pulse), Bóng Mực đổi sang trạng thái màu nhạt và bị đẩy lùi $3\text{ m}$.
- **Tuân thủ Test Contract**: Mọi hiệu ứng sáng tạo chỉ nằm ở tầng hiển thị WebGL2; logic headless dùng cùng một trạng thái thuần túy và không bị ảnh hưởng bởi phần đồ họa.

---

## 7. Kế hoạch chuẩn bị cho Phase 2 (Ticket-02)

1. **Tiếp nhận Ticket-02**: Ngay khi nhận ticket, đối chiếu ngay với bảng giả định của Phase 1 để cập nhật `game.contract.json` và code đồng thời.
2. **Bảo vệ tính hồi quy (Regression Guard)**: Chạy lại toàn bộ 21 bài test của Phase 1 sau mỗi lần sửa code. Nếu ticket mới thay đổi luật cũ, phải sửa hoặc bỏ test kèm lý do rõ ràng trong tài liệu.
3. **Cập nhật Harness**: Bổ sung quy tắc mới vào `AGENTS.md` nếu xuất hiện thêm quy ước hoặc cơ chế gameplay mới.

---
*Báo cáo được hoàn thành và đóng gói cùng git tag `phase-1`.*