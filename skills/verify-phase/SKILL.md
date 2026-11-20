---
name: verify-phase
description: Kiểm chứng Đảo Đèn Lồng Phase2 và lưu bằng chứng thật.
---

1. Đọc PRD-0, Ticket-02, spec Phase2 và game.contract.json.
2. Chạy `node scripts/build.mjs`, sau đó `node tests/phase1/verify.mjs` (hồi quy chuẩn1.1).
3. Chạy `node tests/phase2/verify.mjs --evidence` để tạo input/output thực tế; không sửa JSONL bằng tay.
4. Chạy `node tests/phase2/benchmark.mjs` khi kiểm tra tốc độ headless.
5. Với server đang chạy, `node tests/phase2/browser.mjs` kiểm tra menu, hướng D, pause/resume, khởi động cả3 Đêm và FPS. Cần Chrome tại CHROME_PATH hoặc đường dẫn mặc định Windows; chỉ mở ứng dụng local trong profile tạm.
6. Không báo đạt nếu bất kỳ gate liên quan đỏ. Ghi renderer/GPU và giới hạn mẫu đo trong báo cáo; không đồng nhất test tự viết với test ẩn.
