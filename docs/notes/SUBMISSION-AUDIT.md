# Đối chiếu SUBMISSION.md — bản nộp cuối

Đối chiếu ngày20/11/2026 (giờ Việt Nam). Bằng chứng GitHub kiểm tra không đăng nhập: [github-submission.json](../proof/phase-4/github-submission.json).

| Mục SUBMISSION | Trạng thái và bằng chứng |
|---|---|
| Repo cá nhân public | Đã xác minh API không đăng nhập trả private=false; tài khoản phamtuananhhatay |
| Tên repo đúng mẫu | **Chưa hoàn tất**: người làm lab đã xác nhận tự đổi tên. Tên cần dùng: K5-L3A-DAY12-PhamTuanAnh-2A202603503-AI-SDLC-Dao-Den-Long |
| Mã nguồn | Đã push main, gồm core/browser/headless và phần phát hành |
| Tag4phase | phase-1/2/3/4 đã có trên GitHub; hash trùng local trong bằng chứng |
| Releasev1.0.0 | Đã tạo công khai, không draft/prerelease; gắn tag cùng commit phase-4 |
| Bản chạy | dao-den-long-v1.0.0-web.zip tải công khai được, SHA256 trùng local; giải nén thử build/smoke/API/CLI đạt |
| README | Link MP4 ở đầu, ảnh, Node22+/WebGL2, chạy2lệnh, điều khiển, test/headless/bench/soak, giới hạn vsync/RSS |
| Contract | Mỗi tag giữ phiên bản lúc phát hành; bản cuối1.3 có bench_cmd/soak_cmd đã chạy |
| Bằng chứng | docs/proof chia từng phase; bench.json/soak.json commit và đính kèm Release; không sửa tay số đo |
| Harness và Git | AGENTS.md, skills/verify-phase, build/test/browser scripts được giữ trong lịch sử; không force-push |
| Ghi chép | ADR/changelog/ghi chú từng phase, các báo cáo và retro. Token toàn dự án là khoảng ước lượng thủ công, không có usage/billing chính xác |
| Video | docs/demo/demo.mp4 và asset Release;128.42giây (<5phút),7.48MB (<100MB), tải không đăng nhập/hash trùng |
| Credits/LICENSE | Có cả hai; nguồn lab, hình học tự tạo bằng code, WebAudio, hỗ trợ AI được ghi |
| Bảo mật | Không thấy .env/file khóa trong tên file theo dõi/lịch sử; scan text diff mọi ref không có mẫu GitHub/OpenAI/AWS/private-key phổ biến. Không bảo đảm phát hiện mọi loại bí mật |
| Deadline/LMS | Không có giờ bắt đầu ca lab hoặc thông báo gia hạn để xác nhận đúng hạn; không thay đổi ngày Git. Người làm lab tự nộp link LMS theo Coach |

## Link nộp

- Repo: https://github.com/phamtuananhhatay/K5-L3-LAB-Day12-PhamTuanAnh-2A202603503-AI-SDLC
- Release: https://github.com/phamtuananhhatay/K5-L3-LAB-Day12-PhamTuanAnh-2A202603503-AI-SDLC/releases/tag/v1.0.0

## Giới hạn phải giữ trung thực

Test tự viết không phải test ẩn. Kết quả benchmark chỉ đo trên máy hiện tại, chưa phải máy chấm. Phase1 có lỗi biên được phát hiện/sửa sau tag và ghi trong phase-1-audit.md; không tuyên bố mã ở tag cũ đã được sửa. Chưa chơi bằng tay trọn3Đêm hoặc xác minh trực tiếp trên macOS/Linux.

Biên bản này được thêm sau tag phát hành vì chỉ có thể xác minh Release sau khi nó được tạo. Không di chuyển các tag để gộp việc xác minh xuất bản vào lịch sử sản phẩm.
