# Đảo Đèn Lồng — agent guide

- Đọc `docs/requirements/PRD-0.txt`, `docs/requirements/Ticket-02.txt`, `docs/notes/phase-2-spec.md` và `game.contract.json` trước khi sửa luật game. Ticket-02 thay các thông số Phase 1.
- Logic gameplay nằm trong `src/core.mjs`; cả trình duyệt và headless phải dùng chung `createGame` và `step`.
- Sau khi đổi thông số, cập nhật `game.contract.json` cùng lúc; `node scripts/build.mjs` kiểm tra chúng khớp nhau.
- Chạy `node tests/phase2/maps.mjs` và `node tests/phase2/verify.mjs` sau khi sửa logic hoặc CLI. Không ghi đạt nếu lệnh đỏ. Test Phase 1 được giữ làm lịch sử, số liệu tự chọn cũ đã bị ticket thay thế.
- Dùng `node tests/phase2/verify.mjs --evidence` để tạo input/output thực tế. Pause tăng tick nhưng không tăng sim_tick.
- Lưu bằng chứng chạy thật trong `docs/proof/`. Không sửa tay output JSONL.
- Không commit `.env`, key hoặc token. Giữ tài liệu harness và lịch sử git.
