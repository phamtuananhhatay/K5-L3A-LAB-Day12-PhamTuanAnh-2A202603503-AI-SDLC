# Kế hoạch triển khai Phase 4 — chia thành 8 nhiệm vụ

Nguồn yêu cầu gốc: [Ticket-04](../requirements/Ticket-04.md).
Danh sách nghiệm thu: [Checklist Phase 4](phase-4-checklist.md).

Tài liệu này là kế hoạch triển khai.
Nếu nội dung kế hoạch khác ticket gốc, phải đối chiếu và sửa kế hoạch.

Phase 4 có thể chia thành 8 nhiệm vụ lớn. Mục tiêu là bổ sung các tính năng phát hành, đo bằng chứng thật, rồi đóng gói và nộp bản cuối. Phần luật chơi Phase 3 vẫn giữ nguyên.

## 1. Chốt phạm vi và nâng Test Contract lên v1.3

Việc cần làm:
- Lưu Ticket-04 vào repo.
- Lập checklist yêu cầu → cách kiểm tra → bằng chứng.
- Đổi contract_version thành "1.3".
- Thêm bench_cmd và soak_cmd vào game.contract.json.
- Cập nhật AGENTS.md và quy trình kiểm chứng cho Phase 4.

Hoàn thành khi: contract khai đúng các lệnh chạy thực tế và mọi nhiệm vụ bên dưới đều có tiêu chí kiểm tra cụ thể.

## 2. Làm bảng xếp hạng cục bộ

Người chơi được nhập tên khi thắng Đêm 3 hoặc thua ở bất kỳ Đêm nào.

Việc cần làm:
- Tạo ô nhập tên, kiểm tra tên dài 3–12 ký tự và chỉ chứa chữ, số, _.
- Lưu đủ name, score, nights_won, achieved_at, seed.
- Điểm lưu là tổng điểm các Đêm đã thắng, không cộng điểm Đêm đang thua.
- Giữ top 10; điểm cao đứng trước, bằng điểm thì người đạt trước đứng trước.
- Thêm nút “Bảng xếp hạng” trong menu.
- Làm lệnh xuất:
`<run_cmd> --export-leaderboard out.json`

Điểm cần quyết định sớm với bản web: giao diện và lệnh xuất phải đọc cùng một nguồn dữ liệu. Nếu chỉ lưu trong localStorage, chương trình Node không tự đọc được dữ liệu của trình duyệt.

Hoàn thành khi: lưu điểm, đóng/mở game vẫn còn, sắp xếp đúng và lệnh xuất trả đúng top 10.

## 3. Hoàn thiện khả năng tiếp cận

Có bốn nhóm công việc:
| Nhóm | Việc cần làm |
|---|---|
| Đổi phím | Cho đổi WASD, nhảy, lướt, tương tác, pulse, pause; phát hiện trùng; có khôi phục mặc định; lưu lại |
| Chỉ báo hình ảnh | Báo Bóng Mực xuất hiện và hướng của nó, gió sắp thổi, 10 giây cuối, đèn dưới 30 dầu |
| Giảm chuyển động | Thêm tùy chọn và áp dụng cho rung camera/chớp màn hình |
| Cỡ chữ | Mặc định tối thiểu 18 px ở 1280×720; chữ lớn ×1,25 |

Cài đặt mù màu đã có từ Phase 3 cần tiếp tục hoạt động.

Hoàn thành khi: đổi cài đặt có tác dụng ngay, tải lại game vẫn giữ, và các thông tin quan trọng hiểu được khi tắt âm thanh.

## 4. Xây dựng benchmark chuẩn

Đây là một cảnh đo riêng, dùng renderer và hiệu ứng của game thật.

Việc cần làm:
- Mở cửa sổ 1280×720.
- Dựng Đêm 1 với đúng 200 Bóng Mực, 100 đom đóm, L1–L3 sáng và có 100 dầu.
- Tắt spawn thêm, sát thương, nhặt, hao dầu và kết thúc Đêm.
- Giữ Bóng Mực di chuyển theo yêu cầu benchmark.
- Mây đứng yên; camera bay vòng bán kính 30 m, cao 15 m, 15 giây/vòng.
- Bỏ 3 giây khởi động, sau đó đo đúng thời lượng yêu cầu.
- Tính FPS trung bình, 1% low, p95 frame time, thời gian tải và bộ nhớ.
- Xuất bench.json bằng lệnh:
`<bench_cmd> --seed 42 --duration 30 --out bench.json`

Với bản web, nếu không tắt được vsync hoặc không đo được RSS, phải khai đúng và giải thích trong README.

Hoàn thành khi: file có đủ trường, số liệu được tính từ các khung hình đo thật. Ngưỡng trên máy chấm là FPS trung bình ≥ 60, 1% low ≥ 30, tải ≤ 10 giây.

## 5. Xây dựng soak test

Soak test kiểm tra game có ổn định khi chơi và reset nhiều Đêm liên tiếp hay không.

Việc cần làm:
- Chạy 10 Đêm trong cùng một tiến trình.
- Xoay vòng Đêm 1 → 2 → 3.
- Tạo input ngẫu nhiên theo seed và đúng xác suất ticket.
- Reset sạch trạng thái sau mỗi Đêm.
- Đo RSS tại hai thời điểm ticket quy định.
- Ghi kết quả từng Đêm, số crash và thời gian vào soak.json.
`<soak_cmd> --seed 7 --nights 10 --out soak.json`

Hoàn thành khi:
- crashes = 0
- mem_end_mb ≤ 1,2 × mem_start_mb
Không được mở một tiến trình mới cho mỗi Đêm vì cách đó có thể che lỗi tích tụ bộ nhớ.

## 6. Chạy kiểm chứng tổng thể và sửa lỗi

Sau khi các tính năng trên ổn định:
- Chạy lại toàn bộ test Phase 1–3 còn hiệu lực.
- Thêm test cho bảng xếp hạng, đổi phím, lưu cài đặt và các lệnh mới.
- Chạy benchmark và soak thật.
- Chơi thử menu, một đoạn gameplay, pause, thua, nhập tên và xem bảng điểm.
- Kiểm tra từ một bản clone sạch.
- Lưu input, output, cấu hình máy, lệnh chạy và kết quả vào repo.

Hoàn thành khi: mọi yêu cầu chính có bằng chứng tái hiện được; mục chưa đạt được ghi rõ. Không coi test tự viết đạt là bằng chứng đã vượt test ẩn.

## 7. Đóng gói bản phát hành và hoàn thiện tài liệu

Việc cần làm:
- Chuẩn bị gói chạy được theo một hình thức ticket cho phép.
- Người khác clone sạch và chơi được trong tối đa 3 lệnh.
- README có mô tả, ảnh/GIF, cấu hình yêu cầu, cách chạy, điều khiển, test, headless, bench và soak.
- CHANGELOG có đủ bốn phase.
- Hoàn thiện CREDITS.md và thêm LICENSE.
- Viết retro 1–2 trang: kết quả bốn phase, lỗi AI, cách phát hiện, harness hữu ích, token/chi phí ước tính và bài học.

Hoàn thành khi: gói phát hành chạy được từ môi trường sạch, tài liệu đủ để người khác sử dụng.

## 8. Quay demo và phát hành v1.0.0

Việc cần làm:
- Quay video .mp4 dưới 5 phút: chơi trực tiếp và cho thấy test, headless, benchmark thực sự chạy.
- Đặt link video ở đầu README.
- Commit mã và bằng chứng cuối, gồm bench.json, soak.json.
- Tạo tag phase-4.
- Tạo GitHub Release v1.0.0, đính kèm bản chạy được và video nếu chọn cách này.
- Kiểm tra repo, Release và video truy cập được khi chưa đăng nhập.

Hoàn thành khi: đủ tag, Release, gói chạy, video và bằng chứng trên repo public.

Thứ tự thực hiện phù hợp là 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8. Nên dành riêng 10–15 phút cuối cho video và phát hành; đừng để đến lúc hết giờ mới bắt đầu đóng gói.
