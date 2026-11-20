# Rà soát Test Contract sau Phase 1

Rà soát từ [Test Contract v1.0](../requirements/PRD-0.txt) và chạy lại `node tests/phase1/verify.mjs` trên mã hiện tại. Đây là thay đổi **sau tag `phase-1`**, không phải bằng chứng rằng mã ở tag đã có các sửa đổi bên dưới.

| Phát hiện | Bằng chứng | Xử lý |
|---|---|---|
| Vùng an toàn có biên bao gồm (`distance <= safe_radius`), nhưng code ở tag đặt Bóng Mực đúng tại 4 m sau khi đẩy ra. | Ca Bóng Mực ban đầu tại X=3, đèn sáng tại gốc: code cũ trả X=4, vẫn thuộc vùng cấm. | `src/core.mjs` đặt Bóng Mực xa hơn biên 0,001 m; test mới yêu cầu khoảng cách `> 4`. |
| Báo cáo dùng ca `pulse` làm bằng chứng cho hành vi Bóng Mực đuổi Mây, trong khi ca đó làm choáng và đẩy Bóng Mực. | `pulse.jsonl` ghi `state: stunned`. | Thêm `chase.scenario.json`, `chase.jsonl` và test kiểm tra X=10 → X=8 sau 60 tick ở tốc độ 2 m/s. |
| Bộ validator trước đây chỉ kiểm tra `time_left_s` là số hữu hạn, chưa kiểm tra công thức 60 tick/giây hoặc thứ tự tick toàn bộ JSONL. | `tests/phase1/verify.mjs` ở tag `phase-1`. | Thêm kiểm tra giá trị thời gian theo tick, thứ tự record và một số kiểu dữ liệu event. |
| Báo cáo ghi commit của tag là `d67561c`. | `git rev-parse --short phase-1` trả `438f13e` khi rà soát. | Đính chính trong báo cáo; không di chuyển tag đã phát hành. |

## Giới hạn còn lại

- 23 test tự viết không chứng minh toàn bộ Test Contract hoặc kết quả test ẩn. Chúng chứng minh các ca cụ thể được ghi trong [bảng bằng chứng](phase-1.md).
- Ảnh WebGL2 chỉ xác nhận khung hình ban đầu. Chưa có bằng chứng chơi trọn một lượt bằng bàn phím trên macOS/Linux.
- Các thay đổi sau tag chỉ có hiệu lực trên nhánh hiện tại sau khi commit; tag `phase-1` vẫn trỏ vào mã lịch sử.
