# Checklist Phase 4 — phát hành v1.0.0

Nguồn: docs/requirements/Ticket-04.md.
Trạng thái theo bằng chứng cục bộ trong PHASE-4-REPORT.md; GitHub Release vẫn chờ xuất repo được xác nhận.

| ID | Yêu cầu và điều kiện đạt | Cách kiểm tra | Bằng chứng dự kiến | Trạng thái |
|---|---|---|---|---|
| P4-01 | Contract v1.3, có bench_cmd và soak_cmd chạy được | Chạy đúng lệnh trong game.contract.json | Log và file kết quả | Đạt cục bộ — xem báo cáo |
| P4-02 | Cảnh benchmark 1280×720; 200 Bóng Mực, 100 đom đóm; L1–L3 sáng, fuel 100 | Kiểm tra trạng thái cảnh và ảnh chụp | Ảnh + trạng thái cảnh bench | Đạt cục bộ — xem báo cáo |
| P4-03 | Bench tắt spawn, hit, pickup, hao dầu và kết thúc Đêm; camera đúng đường bay | Kiểm tra cấu hình và chạy cảnh | Log + ảnh/video | Đạt cục bộ — xem báo cáo |
| P4-04 | Bỏ 3 giây khởi động, đo đúng duration; xuất đủ trường JSON | Chạy bench 30 giây | bench.json | Đạt cục bộ — xem báo cáo |
| P4-05 | FPS trung bình ≥60, 1% low ≥30, load ≤10000ms trên máy chấm | Đọc số đo thật và cấu hình máy | bench.json + cấu hình máy | Đạt cục bộ, chờ máy chấm |
| P4-06 | Soak chạy 10 Đêm trong cùng một tiến trình, input đúng seed | Chạy soak và kiểm tra kết quả từng Đêm | soak.json | Đạt cục bộ — xem báo cáo |
| P4-07 | Soak không crash, RSS cuối ≤1.2×RSS đầu | So sánh số đo | soak.json | Đạt cục bộ — xem báo cáo |
| P4-08 | Nhập tên khi thắng Đêm3 hoặc thua; tên đúng quy tắc | Thử tên hợp lệ/không hợp lệ | Test + ảnh giao diện | Đạt cục bộ — xem báo cáo |
| P4-09 | Bảng điểm lưu đủ trường, top10 đúng thứ tự, còn sau mở lại | Test thêm/sắp xếp/lưu/tải | Test + dữ liệu lưu | Đạt cục bộ — xem báo cáo |
| P4-10 | Có màn bảng điểm và lệnh export đúng dữ liệu | So sánh giao diện với file export | leaderboard-export.json | Đạt cục bộ — xem báo cáo |
| P4-11 | Đổi mọi phím, báo trùng, khôi phục mặc định, lưu lại | Test giao diện và tải lại game | Test + ảnh | Đạt cục bộ — xem báo cáo |
| P4-12 | Có chỉ báo shade spawn/hướng, gió, 10s cuối, đèn yếu | Thử từng tình huống khi tắt âm thanh | Ảnh/video | Đạt cục bộ — xem báo cáo |
| P4-13 | Có giảm chuyển động; chữ ≥18px và chế độ ×1.25 | Kiểm tra cài đặt và kích thước chữ | Test browser + ảnh | Đạt cục bộ — xem báo cáo |
| P4-14 | Clone sạch, tối đa3 lệnh để chơi | Làm theo README trong thư mục sạch | Log clone sạch | Đạt cục bộ — xem báo cáo |
| P4-15 | README, changelog4phase, credits và LICENSE đầy đủ | Rà từng mục tài liệu | Các file trong repo | Đạt cục bộ — xem báo cáo |
| P4-16 | Gói phát hành chạy được | Chạy từ gói đóng sẵn | File gói + log | Đạt cục bộ — xem báo cáo |
| P4-17 | Retro1–2trang và video mp4 dưới5phút | Đọc retro, kiểm tra video | Retro + demo.mp4 | Đạt cục bộ — xem báo cáo |
| P4-18 | Tag phase-4, Release v1.0.0; repo và video public | Kiểm tra GitHub khi chưa đăng nhập | Link tag/Release/video | Chưa đạt — chờ GitHub |
| P4-19 | Hành vi Phase1–3 còn hiệu lực vẫn đạt | Chạy toàn bộ hồi quy | Log test | Đạt test tự viết, chưa có test ẩn |

Cách sử dụng bảng:
- Chưa làm: chưa triển khai.
- Đang làm: đã bắt đầu nhưng chưa kiểm tra xong.
- Đạt: đã chạy kiểm tra và có bằng chứng.
- Chưa đạt: đã kiểm tra nhưng kết quả chưa đáp ứng yêu cầu.
“Bằng chứng dự kiến” mới là nơi bạn định lưu kết quả, chưa có nghĩa là file đó đã tồn tại.

## Phạm vi Phase 4

Bổ sung:
- Benchmark và soak.
- Bảng xếp hạng cục bộ và lệnh xuất.
- Đổi phím, chỉ báo hình ảnh, giảm chuyển động, cỡ chữ.
- Đóng gói, tài liệu, retro, video và phát hành.

Giữ các luật gameplay của Ticket-03:
- Nhiên liệu và hút dầu.
- Thắng tại bình minh.
- Sức chứa và công thức điểm.
- Thời lượng Đêm 240/270/300 giây.

Cảnh benchmark có cấu hình riêng theo Ticket-04.
Cấu hình benchmark không được làm thay đổi luật của bản chơi thường.

## Chi tiết nghiệm thu bắt buộc

Nguồn đầy đủ: ../requirements/Ticket-04.md.
Các mục dưới đây bổ sung chi tiết cho bảng checklist, không thay thế ticket gốc.

### P4-02 đến P4-05 — Benchmark

- Cửa sổ 1280×720, không toàn màn hình.
- Cảnh Đêm 1, đầy đủ hiệu ứng và ánh sáng của bản chơi thật.
- Đúng 200 Bóng Mực wander và 100 đom đóm, phân bố theo seed 42.
- L1–L3 đang sáng và có 100 fuel.
- Tắt spawn thêm, sát thương, pickup, hao dầu và kết thúc Đêm.
- Phần sáng tạo bổ sung không được ảnh hưởng số đo.
- Mây đứng yên tại (0,0,0), không input.
- Camera bán kính 30 m, Y=15 m, nhìn vào gốc.
- Bắt đầu tại (30,15,0), quay ngược chiều kim đồng hồ khi nhìn từ trên.
- Camera hoàn thành một vòng trong 15 giây.
- Bỏ 3 giây khởi động; sau đó đo đúng duration.
- avg_fps = 1000 × N / tổng thời gian các frame đo.
- 1% low: lấy max(1,ceil(0.01×N)) frame có dt lớn nhất;
  kết quả = 1000 / trung bình dt của nhóm đó.
- frame_ms_p95 là phân vị 95 của thời gian frame.
- load_ms tính từ lúc tiến trình bắt đầu tới frame đầu của cảnh bench.
- peak_mem_mb là RSS cao nhất trong khoảng đo.
- Bản web không đo được RSS thì ghi null và giải thích.
- Ghi đúng vsync_off; nếu không tắt được phải giải thích.
- Output có đủ trường theo JSON mẫu của ticket.
- Đo thật, không tự điền hoặc sửa số liệu.
- Ghi cấu hình máy; ngưỡng chính thức được chấm trên máy giảng viên.

### P4-06 đến P4-07 — Soak

- Chạy 10 Đêm trong cùng một tiến trình.
- Luân phiên Đêm 1→2→3.
- Seed từng Đêm theo quy tắc seed+i của ticket.
- Mỗi 30 tick chọn lại hướng di chuyển.
- Mỗi tick: xác suất 5% nhảy, 3% dash, 2% pulse, 10% interact.
- Mỗi Đêm chạy tới kết thúc hoặc hết thời lượng chuẩn.
- mem_start_mb: RSS sau khi tải xong Đêm đầu.
- mem_end_mb: RSS sau khi reset xong Đêm cuối.
- Output đủ nights, crashes, results, mem_start_mb,
  mem_end_mb và duration_s.
- Đạt khi crashes=0 và mem_end_mb≤1.2×mem_start_mb.

### P4-08 đến P4-10 — Bảng xếp hạng

- Tên dài 3–12 ký tự, chỉ dùng A–Z,a–z,0–9 và dấu gạch dưới.
- Mỗi mục đủ name, score, nights_won, achieved_at, seed.
- score chỉ là tổng điểm các Đêm đã thắng.
- nights_won nằm trong 0–3.
- achieved_at là ISO 8601 có múi giờ.
- Top 10: score giảm dần; bằng điểm thì đạt trước đứng trước.
- Dữ liệu còn sau khi đóng/mở game.
- UI và lệnh export đọc cùng nguồn dữ liệu.
- Export đúng dạng {"entries":[...]} và đúng thứ tự.

### P4-11 đến P4-13 — Accessibility

- Đổi được mọi hành động mà ticket liệt kê.
- Báo trùng phím, khôi phục mặc định và lưu cài đặt.
- Chỉ báo Bóng Mực xuất hiện có mũi tên hướng ở mép màn hình.
- Có chỉ báo gió sắp thổi, 10 giây cuối và đèn dưới 30 fuel.
- Giảm chuyển động tắt rung camera/chớp màn hình.
- Chữ UI tối thiểu 18 px tại 1280×720; chữ lớn ×1.25.
