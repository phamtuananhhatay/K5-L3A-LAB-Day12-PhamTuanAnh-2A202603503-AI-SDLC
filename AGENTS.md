# Đảo Đèn Lồng — agent guide

- Đọc `docs/requirements/PRD-0.txt`, Ticket-02, `docs/requirements/Ticket-03.md`, `docs/notes/ADR-003-lantern-fuel.md` và `game.contract.json` trước khi sửa luật game. Ticket-03 thay luật dầu, điểm và thắng.
- Logic gameplay nằm trong `src/core.mjs`; cả trình duyệt và headless phải dùng chung `createGame` và `step`.
- Sau khi đổi thông số, cập nhật `game.contract.json` cùng lúc; `node scripts/build.mjs` kiểm tra chúng khớp nhau.
- Chạy `node tests/phase1/verify.mjs` sau khi sửa logic/CLI: gồm maps, hồi quy Phase2 đã cập nhật đúng luật và test Phase3. Không ghi đạt nếu lệnh đỏ; không skip test âm thầm. Đọc CHANGELOG.md cho kỳ vọng bị thay.
- Dùng `node tests/phase3/verify.mjs --evidence` để tạo input/output thực tế1.2. Hồi quy evidence ghi vào docs/proof/phase-3/regression, không ghi đè Phase1/2.
- Fuel lưu nguyên theo1/60. Chỉ làm tròn lúc xuất; không xét ngưỡng hoặc thưởng điểm từ snapshot làm tròn. Pause không chạy dầu/hút. Không thắng sớm all_lit.
- Lưu bằng chứng chạy thật trong `docs/proof/`. Không sửa tay output JSONL.
- Không commit `.env`, key hoặc token. Giữ tài liệu harness và lịch sử git.
