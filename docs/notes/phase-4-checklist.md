# Checklist Phase 4 — phát hành v1.0.0

Nguồn: docs/requirements/Ticket-04.md.
Trạng thái ban đầu: chưa kiểm chứng.

| ID | Yêu cầu và điều kiện đạt | Cách kiểm tra | Bằng chứng dự kiến | Trạng thái |
|---|---|---|---|---|
| P4-01 | Contract v1.3, có bench_cmd và soak_cmd chạy được | Chạy đúng lệnh trong game.contract.json | Log và file kết quả | Chưa làm |
| P4-02 | Cảnh benchmark 1280×720; 200 Bóng Mực, 100 đom đóm; L1–L3 sáng, fuel 100 | Kiểm tra trạng thái cảnh và ảnh chụp | Ảnh + trạng thái cảnh bench | Chưa làm |
| P4-03 | Bench tắt spawn, hit, pickup, hao dầu và kết thúc Đêm; camera đúng đường bay | Kiểm tra cấu hình và chạy cảnh | Log + ảnh/video | Chưa làm |
| P4-04 | Bỏ 3 giây khởi động, đo đúng duration; xuất đủ trường JSON | Chạy bench 30 giây | bench.json | Chưa làm |
| P4-05 | FPS trung bình ≥60, 1% low ≥30, load ≤10000ms trên máy chấm | Đọc số đo thật và cấu hình máy | bench.json + cấu hình máy | Chưa làm |
| P4-06 | Soak chạy 10 Đêm trong cùng một tiến trình, input đúng seed | Chạy soak và kiểm tra kết quả từng Đêm | soak.json | Chưa làm |
| P4-07 | Soak không crash, RSS cuối ≤1.2×RSS đầu | So sánh số đo | soak.json | Chưa làm |
| P4-08 | Nhập tên khi thắng Đêm3 hoặc thua; tên đúng quy tắc | Thử tên hợp lệ/không hợp lệ | Test + ảnh giao diện | Chưa làm |
| P4-09 | Bảng điểm lưu đủ trường, top10 đúng thứ tự, còn sau mở lại | Test thêm/sắp xếp/lưu/tải | Test + dữ liệu lưu | Chưa làm |
| P4-10 | Có màn bảng điểm và lệnh export đúng dữ liệu | So sánh giao diện với file export | leaderboard-export.json | Chưa làm |
| P4-11 | Đổi mọi phím, báo trùng, khôi phục mặc định, lưu lại | Test giao diện và tải lại game | Test + ảnh | Chưa làm |
| P4-12 | Có chỉ báo shade spawn/hướng, gió, 10s cuối, đèn yếu | Thử từng tình huống khi tắt âm thanh | Ảnh/video | Chưa làm |
| P4-13 | Có giảm chuyển động; chữ ≥18px và chế độ ×1.25 | Kiểm tra cài đặt và kích thước chữ | Test browser + ảnh | Chưa làm |
| P4-14 | Clone sạch, tối đa3 lệnh để chơi | Làm theo README trong thư mục sạch | Log clone sạch | Chưa làm |
| P4-15 | README, changelog4phase, credits và LICENSE đầy đủ | Rà từng mục tài liệu | Các file trong repo | Chưa làm |
| P4-16 | Gói phát hành chạy được | Chạy từ gói đóng sẵn | File gói + log | Chưa làm |
| P4-17 | Retro1–2trang và video mp4 dưới5phút | Đọc retro, kiểm tra video | Retro + demo.mp4 | Chưa làm |
| P4-18 | Tag phase-4, Release v1.0.0; repo và video public | Kiểm tra GitHub khi chưa đăng nhập | Link tag/Release/video | Chưa làm |
| P4-19 | Hành vi Phase1–3 còn hiệu lực vẫn đạt | Chạy toàn bộ hồi quy | Log test | Chưa làm |

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
