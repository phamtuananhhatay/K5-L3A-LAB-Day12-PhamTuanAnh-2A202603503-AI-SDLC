# Phase 1 — ghi chú làm việc

## Yêu cầu và giả định

Đã nhận đầy đủ PRD-0 và Test Contract v1.0. Xem [danh sách yêu cầu và kế hoạch kiểm chứng](phase-1-checklist.md). Các thông số ở đó đã được triển khai và khai báo trong `game.contract.json`.

## Nhật ký dùng AI

| Việc | Công cụ | Ước tính token/chi phí | Kết quả và điều chỉnh |
|---|---|---:|---|
| Chuẩn bị môi trường & khảo sát PRD-0 | Codex / Gemini 3.8 Flash | ~8.000 tokens ($0.03) | Tạo demo WebGL2 độc lập không phụ thuộc thư viện ngoài; thiết lập khung build/smoke/test |
| Triển khai Bước 4 (Game core & WebGL2) | Codex / Gemini 3.8 Flash | ~18.000 tokens ($0.07) | Thiết kế `src/core.mjs` làm nguồn sự thật duy nhất (single source of truth) cho cả WebGL2 và headless |
| Triển khai Bước 5 (Test Contract & Scenarios) | Codex / Gemini 3.8 Flash | ~14.000 tokens ($0.05) | Xây dựng 9 kịch bản scenario, validator schema JSONL, bắt lỗi mã thoát 2, đạt 21/21 headless checks |
| **Tổng cộng Phase 1** | | **~40.000 tokens (~$0.15)** | Tiết kiệm token nhờ dùng test tự động và giữ prompt ngữ cảnh gọn |

### Chiến lược kiểm soát và tiết kiệm token
- **Tự động hóa kiểm thử cục bộ**: Viết kịch bản `verify.mjs` và `capture-phase1-evidence.mjs` chạy trực tiếp bằng Node.js thay vì nhờ AI đọc và phân tích thủ công từng dòng output JSONL.
- **Harness tinh gọn**: Giữ file `AGENTS.md` dưới 15 dòng ngắn gọn với các quy tắc cốt lõi, tránh làm phình system prompt trong mỗi lượt tương tác.
- **Tái sử dụng kiến trúc**: Tách logic game ra hàm thuần túy `step(game, input, previousInput)`, tránh phải prompt agent code lại logic riêng cho giao diện đồ họa.

### Phân tích lỗi của AI và điều chỉnh harness
1. **Lỗi phán đoán cờ / event ngoài contract**: Ban đầu AI có xu hướng thêm các sự kiện như `dash` hay `fall` vào schema event.
   - *Cách phát hiện*: Đối chiếu với bảng Event trong Test Contract v1.0.
   - *Điều chỉnh harness*: Ghi rõ trong `AGENTS.md` chỉ dùng các event đã định nghĩa, và thêm hàm `validateOutput()` kiểm tra enum tên event và trường bắt buộc.
2. **Lỗi xử lý frame tick trong input**: AI dễ bỏ qua quy định tick phải tăng nghiêm ngặt hoặc quên giữ trạng thái của frame cũ khi frame mới vắng mặt một số trường.
   - *Cách phát hiện*: Chạy test scenario với frame cách quãng và frame trùng lặp.
   - *Điều chỉnh*: Thêm kiểm tra `input frame ticks must increase strictly` thoát mã 2 và kiểm tra duy trì input trước đó.

## Đánh giá Phase 1

Các hành vi lõi của Đêm 1 và giao diện Test Contract v1.0 đã hoàn thành trọn vẹn:
- Headless đạt **21/21 kiểm tra tự động**, bao gồm các ca đơn lẻ, chuỗi nhiều hành động (`sequence`), ca biên khoảng cách ngang (`boundary`), ca lỗi định dạng (`invalid.inputs`/`invalid.scenario`), ca patch scenario một phần và thứ tự ưu tiên điều kiện kết thúc.
- Toàn bộ bằng chứng output JSONL thực tế và hash SHA-256 tính tất định được lưu tại `docs/proof/`.
- Bản chơi WebGL2 đã hiển thị đầy đủ đảo tròn, 5 Đèn Lồng Lớn, đom đóm, Bóng Mực và HUD qua Chrome headless (`game-screen.png`).
- Không có hồi quy, cấu trúc lệnh chạy hoàn toàn tương thích trên macOS/Linux/Windows.
