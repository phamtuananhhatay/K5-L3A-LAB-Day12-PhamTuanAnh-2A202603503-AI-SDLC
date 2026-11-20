---
name: verify-phase
description: Kiểm chứng Đảo Đèn Lồng Phase3, hồi quy và lưu bằng chứng thật.
---

1. Đọc PRD-0, Ticket-02/03, ADR-003, CHANGELOG.md và game.contract.json.
2. Chạy `node scripts/build.mjs`, sau đó `node tests/phase1/verify.mjs` (toàn bộ hồi quy và Phase3 chuẩn1.2).
3. Chạy `node tests/phase2/verify.mjs --evidence` và `node tests/phase3/verify.mjs --evidence` để tạo input/output1.2 ở docs/proof/phase-3; không sửa JSONL bằng tay hoặc ghi đè bằng chứng tag cũ.
4. Chạy `node tests/phase3/benchmark.mjs` khi kiểm tra tốc độ headless.
5. `node tests/phase3/browser.mjs` tự mở server4184/profile Chrome tạm, kiểm tra mù màu lưu lại, HUD capacity, E refuel và pause giữ dầu. Cần CHROME_PATH hoặc Chrome đường dẫn mặc định Windows.
6. Không báo đạt nếu bất kỳ gate liên quan đỏ. Ghi cấu hình và giới hạn mẫu đo trong báo cáo; không đồng nhất test tự viết với test ẩn. Không di chuyển tag Phase1/2 để che luật/test bị thay.
