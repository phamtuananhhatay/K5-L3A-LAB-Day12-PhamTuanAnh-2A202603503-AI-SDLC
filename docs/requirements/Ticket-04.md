# TICKET-04 — "Bình minh: phát hành v1.0.0" (Phase 4)

> Loại: Non-functional + Release · Ưu tiên: Cao · Tag nộp: `phase-4` + GitHub Release `v1.0.0` · Contract: **v1.3**

## Mục tiêu

Đưa game từ "chạy được" thành sản phẩm phát hành được: đo được hiệu năng, ổn định khi chạy lâu, có bảng xếp hạng, dễ tiếp cận, cài đặt dễ dàng. Mọi yêu cầu dưới đây đều có số đo cụ thể và được chấm tự động hoặc theo checklist.

> Về sáng tạo: phần sáng tạo của bạn vẫn được giữ, miễn là luật, số liệu và Test Contract không bị đổi và đầu ra headless không đổi. Trong cảnh benchmark và soak test, nhân vật, kẻ địch và hiệu ứng sáng tạo thêm phải tắt (hoặc không ảnh hưởng số đo), để mọi bài được đo trên cùng một cảnh chuẩn.

## 1. Chế độ benchmark (bắt buộc)

Lệnh: `<bench_cmd> --seed 42 --duration 30 --out bench.json`

Cảnh benchmark (mọi bài giống nhau):

1. Mở cửa sổ1280×720, không toàn màn hình; tắt vsync nếu engine cho phép (ghi rõ trong README nếu không tắt được).
2. Tải Đêm1 với đầy đủ hiệu ứng và ánh sáng như lúc chơi thật.
3. Sinh đúng200 Bóng Mực ở trạng thái wander, rải đều trên đảo (seed42), và đúng100 đom đóm (bench được phép vượt trần của gameplay). 3đèn L1–L3 đang sáng với fuel100.
4. Trong cảnh bench tắt: sinh thêm thực thể, sát thương, nhặt đom đóm, hao dầu và điều kiện kết thúc Đêm. Bóng Mực vẫn di chuyển theo luật wander bình thường.
5. Không có input người chơi. Mây đứng yên tại(0,0,0). Camera bay vòng tròn tâm(0,0,0), bán kính30m, ở độ cao Y=15m, luôn nhìn vào(0,0,0), xuất phát ở góc0° (điểm(30,15,0)), quay ngược chiều kim đồng hồ khi nhìn từ trên xuống,15s một vòng.
6. 3s đầu là khởi động (không đo). Sau đó đo đúng duration giây rồi tự thoát với mã0.

Output bench.json:

```json
{
  "contract_version": "1.3",
  "avg_fps": 87.3,
  "p1_low_fps": 52.1,
  "frame_ms_p95": 14.2,
  "frames": 2619,
  "load_ms": 2400,
  "peak_mem_mb": 512,
  "vsync_off": true,
  "renderer": "mô tả engine/renderer và phiên bản",
  "os": "tự điền"
}
```

| Trường | Định nghĩa |
|---|---|
| frames | Số khung hình N trong khoảng đo |
| avg_fps | 1000 × N / Σ dt_i, với dt_i là thời gian từng khung(ms) |
| p1_low_fps | k=max(1,ceil(0.01×N)); lấy k dt lớn nhất; p1_low_fps=1000/trung bình k dt đó |
| frame_ms_p95 | Phân vị95 của dt(ms) |
| load_ms | Từ lúc tiến trình bắt đầu tới khung hình đầu tiên của cảnh bench |
| peak_mem_mb | RSS cao nhất trong lúc đo; bản web không đo được ghi null và giải thích |

Ngưỡng trên máy chấm: avg_fps≥60 · p1_low_fps≥30 · load_ms≤10000.

Máy chấm: giảng viên sẽ công bố cấu hình(CPU,GPU,RAM,hệ điều hành,chế độ nguồn) trước khi đo. Mọi bài được đo trên cùng máy này; số bạn tự đo chỉ để tham khảo.

## 2. Soak test (bắt buộc)

Lệnh: `<soak_cmd> --seed 7 --nights 10 --out soak.json`

- Chạy headless10Đêm liên tiếp trong cùng một tiến trình(Đêm1→2→3 xoay vòng), Đêm thứ i dùng seed7+i, mỗi Đêm chạy tới khi kết thúc hoặc hết thời lượng chuẩn. Input ngẫu nhiên theo seed: mỗi30tick chọn lại hướng di chuyển; mỗi tick xác suất5%nhảy,3%lướt,2%tỏa sáng,10%tương tác.
- mem_start_mb: RSS sau khi tải xong Đêm đầu tiên. mem_end_mb: RSS sau khi reset xong Đêm cuối cùng.
- Output:

```json
{"nights":10,"crashes":0,"results":["lost","won","lost"],"mem_start_mb":120,"mem_end_mb":131,"duration_s":84.2}
```

Ngưỡng: crashes=0 và mem_end_mb≤1.2×mem_start_mb.

## 3. Bảng xếp hạng cục bộ

- Sau màn hình Bình Minh(thắng Đêm3) hoặc sau khi thua ở bất kỳ Đêm nào, cho nhập tên để lưu điểm.
- Tên:3–12ký tự `[A-Za-z0-9_]`. Hỗ trợ tiếng Việt có dấu là điểm cộng, không bắt buộc.
- Mỗi mục: name,score(tổng điểm các Đêm đã thắng),nights_won(0–3),achieved_at(ISO8601 có múi giờ),seed.
- Giữ top10. Score giảm dần; bằng điểm thì ai đạt trước đứng trên.
- Lưu đĩa cục bộ, còn sau tắt/mở game. Có màn bảng điểm từ menu.
- Lệnh xuất: `<run_cmd> --export-leaderboard out.json` → `{"entries":[...]}` đúng thứ tự.

## 4. Dễ tiếp cận (accessibility)

| Yêu cầu | Chi tiết |
|---|---|
| Đổi phím | Mọi hành động:di chuyển4hướng,nhảy,lướt,tương tác,tỏa sáng,tạm dừng. Phát hiện trùng và báo; khôi phục mặc định; lưu lại |
| Phụ đề/chỉ báo | Bóng Mực xuất hiện kèm mũi tên hướng ở mép màn hình; gió sắp thổi;10s cuối; đèn fuel<30 |
| Giảm chuyển động | Tắt rung camera và chớp màn hình |
| Cỡ chữ | Tối thiểu18px tại1280×720; chữ lớn×1.25 |

## 5. Đóng gói & tài liệu

- Clone sạch → README tối đa3lệnh → chơi được; thử trên máy sạch.
- README: mô tả, ảnh/GIF, yêu cầu hệ thống, cài đặt, điều khiển, test,headless,bench,soak.
- CHANGELOG đủ4phase. CREDITS liệt kê mọi asset,âm thanh,công cụ AI. Có LICENSE.
- GitHub Release v1.0.0 có bản chạy:file thực thi,thư mục web tĩnh hoặc Docker image kèm hướng dẫn.

## 6. Test Contract v1.3

- contract_version:"1.3".
- game.contract.json thêm bench_cmd và soak_cmd.
- Mọi yêu cầu v1.0–v1.2 vẫn giữ nguyên.

## 7. Retro & demo

- Retro1–2trang: Evaluation4phase; làm với AI hiệu quả/không hiệu quả; AI sai/cách phát hiện; harness(AGENTS,skill,hook)hữu ích; tổng token/chi phí ước tính và cách tiết kiệm; nếu làm lại đổi gì.
- Video mp4 dưới5phút(Release v1.0.0 hoặc docs/demo/demo.mp4): chơi trực tiếp một đoạn, cho thấy bằng chứng game chạy đúng(test,headless,bench).

## Định nghĩa hoàn thành (DoD)

- Bằng chứng game đáp ứng yêu cầu phase.
- Tag phase-4 và Release v1.0.0.
- bench.json và soak.json tự chạy được commit.
- Test ẩn Phase1–3 còn hiệu lực vẫn đạt.
- Repo public, đủ harness/tài liệu theo quy định nộp bài.
