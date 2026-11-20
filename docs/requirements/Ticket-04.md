# TICKET-04 — "Bình minh: phát hành v1.0.0" (Phase 4)

Bản mô tả yêu cầu chính thức từ lab board cho Phase 4. Mọi thông số đo lường, quy chuẩn định dạng và tiêu chí kiểm thử ẩn đều căn cứ trên tài liệu này.

---

## 1. Bối cảnh & Phạm vi

Phase 4 là chặng cuối của dự án Đảo Đèn Lồng: đưa sản phẩm đến mức phát hành chính thức `v1.0.0`, có đo lường hiệu năng thực tế, tính ổn định qua kiểm thử ngâm (soak test), bảng xếp hạng cục bộ, tính năng hỗ trợ tiếp cận (accessibility), đóng gói và tài liệu hoàn chỉnh.

Luật chơi cốt lõi của Phase 3 được giữ nguyên (nhiên liệu đèn, cơ chế hút dầu của Bóng Mực, sức chứa đom đóm, tính điểm bình minh và thời lượng các Đêm 240/270/300 giây).

---

## 2. Bảng xếp hạng cục bộ (Local Leaderboard)

### A. Quy tắc nhập tên & lưu điểm
- Người chơi được nhập tên khi thắng Đêm 3 (toàn thắng hành trình) hoặc thua ở bất kỳ Đêm nào (Đêm 1, Đêm 2, Đêm 3).
- **Quy tắc tên**: Độ dài 3–12 ký tự, chỉ chứa các ký tự chữ cái `A-Z`, `a-z`, chữ số `0-9` và dấu gạch dưới `_`. Báo lỗi nếu nhập sai quy cách hoặc để trống.
- **Dữ liệu mục điểm**: Mỗi mục phải lưu đầy đủ:
  - `name`: Tên người chơi.
  - `score`: Tổng điểm các Đêm đã **thắng** (không cộng điểm của Đêm đang chơi dở mà bị thua).
  - `nights_won`: Số Đêm đã thắng trong lượt chơi (nằm trong khoảng 0–3).
  - `achieved_at`: Thời điểm đạt được theo chuẩn ISO 8601 có múi giờ (ví dụ: `2026-11-20T21:30:00+07:00`).
  - `seed`: Seed của lượt chơi.
- **Bảng Top 10**:
  - Giữ tối đa 10 mục điểm cao nhất.
  - Sắp xếp giảm dần theo `score`. Nếu bằng điểm (`tie-breaker`), mục có `achieved_at` sớm hơn sẽ đứng trước.
  - Dữ liệu bảng điểm phải được lưu trữ bền vững (persistent), đóng/mở lại game dữ liệu vẫn còn.

### B. Giao diện & Lệnh xuất bảng điểm
- Thêm nút và màn hình “Bảng xếp hạng” trong menu chính.
- Lệnh xuất bảng điểm:
  ```bash
  <run_cmd> --export-leaderboard out.json
  ```
  Xuất ra tệp JSON có định dạng:
  ```json
  {
    "entries": [
      {
        "name": "Player1",
        "score": 1250,
        "nights_won": 3,
        "achieved_at": "2026-11-20T21:30:00+07:00",
        "seed": 42
      }
    ]
  }
  ```
- **Yêu cầu nhất quán dữ liệu**: Giao diện người dùng (UI) trên trình duyệt và lệnh xuất CLI phải đọc và ghi trên **cùng một nguồn dữ liệu**.

---

## 3. Khả năng tiếp cận (Accessibility)

### A. Đổi phím điều khiển (Key Rebinding)
- Cho phép người chơi đổi phím cho mọi hành động: di chuyển (WASD), nhảy (Jump), lướt (Dash), tương tác/nạp dầu (Interact), tỏa sáng (Pulse), tạm dừng (Pause).
- Phát hiện và cảnh báo trùng phím; có nút “Khôi phục mặc định” (Reset to Defaults).
- Cài đặt phím được lưu trữ bền vững và có hiệu lực ngay lập tức.

### B. Chỉ báo hình ảnh (Visual Cues)
- Khi Bóng Mực xuất hiện: hiển thị chỉ báo kèm mũi tên chỉ hướng tiếp cận ở mép màn hình.
- Cảnh báo trước khi gió thổi (Đêm 3).
- Cảnh báo đếm ngược 10 giây cuối trước bình minh.
- Cảnh báo trực quan khi Đèn Lồng dưới 30 dầu (`low_fuel_threshold`).
- Đảm bảo người chơi khi tắt âm thanh hoàn toàn vẫn nắm bắt được mọi diễn biến nguy hiểm.

### C. Giảm chuyển động (Reduced Motion) & Cỡ chữ
- Thêm tùy chọn “Giảm chuyển động”: khi bật sẽ tắt hiệu ứng rung camera (screen shake) và chớp màn hình (flash).
- Kích thước chữ UI mặc định tối thiểu 18 px ở độ phân giải chuẩn 1280×720; có tùy chọn chữ lớn phóng đại $\times 1.25$.
- Chế độ màu hỗ trợ người mù màu (High Contrast / Colorblind mode) từ Phase 3 tiếp tục hoạt động ổn định.

---

## 4. Benchmark chuẩn hiệu năng

Cảnh đo kiểm hiệu năng riêng biệt, chạy ở độ phân giải cửa sổ 1280×720 (không toàn màn hình), sử dụng renderer và hiệu ứng ánh sáng thật của game.

### A. Thiết lập cảnh Benchmark
- Dựng cảnh Đêm 1 với đúng **200 Bóng Mực** (ở trạng thái wander) và **100 đom đóm**, phân bố tất định theo `seed 42`.
- Đèn `L1`, `L2`, `L3` được bật sáng sẵn và có **100 fuel**.
- Tắt cơ chế spawn thêm quái, tắt sát thương va chạm, tắt nhặt đom đóm, tắt hao dầu và tắt kết thúc Đêm. Bóng Mực tiếp tục di chuyển wander bình thường.
- Mây đứng yên tại gốc tọa độ `(0, 0, 0)`.
- Camera bay theo quỹ đạo tròn quanh đảo: bán kính 30 m, độ cao $Y = 15\text{ m}$, luôn nhìn về tâm `(0, 0, 0)`. Điểm xuất phát tại `(30, 15, 0)`, bay ngược chiều kim đồng hồ khi nhìn từ trên xuống, chu kỳ đúng 15 giây/vòng.

### B. Đo lường & Công thức tính
- Bỏ qua **3 giây khởi động** đầu tiên để ổn định pipeline đồ họa, sau đó đo liên tục trong đúng khoảng thời gian `--duration`.
- Với $N$ khung hình đo được và thời gian của từng khung hình là $dt_i$ (đơn vị mili-giây):
  - **FPS trung bình**:
    $$\text{avg\_fps} = \frac{1000 \times N}{\sum_{i=1}^{N} dt_i}$$
  - **1% Low FPS**: Lấy nhóm $\max(1, \text{ceil}(0.01 \times N))$ khung hình có $dt$ lớn nhất (chậm nhất). Gọi $\overline{dt}_{\text{slow}}$ là thời gian khung hình trung bình của nhóm này:
    $$\text{1\%\_low\_fps} = \frac{1000}{\overline{dt}_{\text{slow}}}$$
  - **frame_ms_p95**: Phân vị thứ 95 của thời gian khung hình $dt$.
  - **load_ms**: Thời gian tính từ lúc tiến trình khởi chạy đến khi khung hình đầu tiên của cảnh benchmark được hiển thị.
  - **peak_mem_mb**: Mức tiêu thụ bộ nhớ (RSS) cao nhất trong suốt khoảng thời gian đo. Bản web nếu môi trường sandbox không đo được RSS thì ghi `null` kèm giải thích.
  - **vsync_off**: Boolean cho biết vsync đã tắt hay chưa. Nếu trình duyệt ép vsync 60 Hz phải ghi đúng `false` và giải thích.

### C. Lệnh chạy & Định dạng JSON
Lệnh chạy chính thức theo contract:
```bash
<bench_cmd> --seed 42 --duration 30 --out bench.json
```
Định dạng JSON xuất ra `bench.json`:
```json
{
  "duration_s": 30,
  "frames": 1800,
  "avg_fps": 60.5,
  "one_percent_low_fps": 35.2,
  "frame_ms_p95": 18.2,
  "load_ms": 1250,
  "peak_mem_mb": 145.2,
  "vsync_off": true,
  "renderer": "WebGL2"
}
```
**Ngưỡng đạt trên máy chấm của giảng viên**: `avg_fps` $\ge 60$, `one_percent_low_fps` $\ge 30$, `load_ms` $\le 10000\text{ ms}$.

---

## 5. Kiểm thử ngâm (Soak Test)

Kiểm tra độ ổn định và phát hiện rò rỉ bộ nhớ (memory leak) khi game chạy liên tục qua nhiều Đêm.

### A. Quy trình chạy
- Chạy liên tiếp **10 Đêm** trong **cùng một tiến trình duy nhất** (không được tạo tiến trình mới cho mỗi Đêm).
- Luân phiên xoay vòng: Đêm 1 $\rightarrow$ Đêm 2 $\rightarrow$ Đêm 3 $\rightarrow$ Đêm 1 $\rightarrow$ ...
- Seed của từng Đêm thứ $i$ ($i = 0 \dots 9$) tính theo công thức: $\text{seed}_i = \text{seed} + i$.
- Tạo đầu vào tự động ngẫu nhiên: cứ mỗi 30 tick chọn lại hướng di chuyển ngẫu nhiên.
- Tại mỗi tick, xác suất hành động độc lập:
  - **5%** xác suất bấm nhảy (`jump`).
  - **3%** xác suất bấm lướt (`dash`).
  - **2%** xác suất bấm tỏa sáng (`pulse`).
  - **10%** xác suất bấm tương tác/nạp dầu (`interact`).
- Mỗi Đêm chạy cho đến khi thắng/thua hoặc hết thời lượng quy định của Đêm đó. Reset sạch toàn bộ trạng thái game trước khi chuyển sang Đêm tiếp theo.

### B. Đo lường & Điều kiện đạt
- `mem_start_mb`: Đo RSS ngay sau khi hoàn tất tải và khởi tạo Đêm đầu tiên (Đêm 1).
- `mem_end_mb`: Đo RSS ngay sau khi dọn dẹp và reset xong Đêm cuối cùng (Đêm 10).
- Lệnh chạy:
  ```bash
  <soak_cmd> --seed 7 --nights 10 --out soak.json
  ```
- Định dạng file `soak.json`:
  ```json
  {
    "nights": 10,
    "crashes": 0,
    "results": ["won", "won", "won", "won", "won", "won", "won", "won", "won", "won"],
    "mem_start_mb": 85.4,
    "mem_end_mb": 92.1,
    "duration_s": 15.6
  }
  ```
- **Điều kiện đạt bắt buộc**:
  $$\text{crashes} = 0 \quad \text{và} \quad \text{mem\_end\_mb} \le 1.2 \times \text{mem\_start\_mb}$$

---

## 6. Nâng cấp Test Contract v1.3

Tệp `game.contract.json` nâng cấp lên phiên bản `"1.3"` và bổ sung hai trường lệnh:
```json
{
  "contract_version": "1.3",
  "team": "2A202603503-PhamTuanAnh",
  "build_cmd": "node scripts/build.mjs",
  "run_cmd": "node scripts/serve.mjs",
  "headless_cmd": "node src/headless.mjs",
  "bench_cmd": "node scripts/bench.mjs",
  "soak_cmd": "node scripts/soak.mjs",
  "tuning": { ... }
}
```

---

## 7. Định nghĩa hoàn thành (DoD)

1. `game.contract.json` đạt chuẩn contract v1.3, khai báo đúng các lệnh đang hoạt động thật.
2. Cảnh benchmark chạy đúng cấu hình yêu cầu, xuất `bench.json` có số đo tính từ khung hình thực tế; đạt ngưỡng trên máy chấm.
3. Lệnh soak chạy 10 Đêm trong một tiến trình, xuất `soak.json`, không crash và không rò rỉ bộ nhớ ($\le 1.2 \times \text{RSS ban đầu}$).
4. Bảng xếp hạng hoạt động đúng quy tắc điểm/thứ hạng, dữ liệu lưu bền vững và lệnh export xuất đúng định dạng.
5. Đổi phím, chỉ báo tiếp cận, giảm chuyển động và kích thước chữ hoạt động hoàn chỉnh.
6. Toàn bộ kịch bản hồi quy Phase 1–3 còn hiệu lực đều tiếp tục PASS.
7. Đóng gói phát hành chạy được trong tối đa 3 lệnh; README, CHANGELOG, CREDITS.md, LICENSE và Retro hoàn chỉnh.
8. Gắn tag `phase-4` và tạo GitHub Release `v1.0.0` kèm video demo dưới 5 phút trên repository public.
