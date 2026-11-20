# Đảo Đèn Lồng — agent guide

- Đọc `docs/requirements/PRD-0.txt` và `game.contract.json` trước khi sửa luật game.
- Logic gameplay nằm trong `src/core.mjs`; cả trình duyệt và headless phải dùng chung `createGame` và `step`.
- Sau khi đổi thông số, cập nhật `game.contract.json` cùng lúc; `node scripts/build.mjs` kiểm tra chúng khớp nhau.
- Chạy `node tests/phase1/verify.mjs` sau khi sửa logic hoặc CLI. Không ghi đạt nếu lệnh đỏ.
- Lưu bằng chứng chạy thật trong `docs/proof/`. Không sửa tay output JSONL.
- Không commit `.env`, key hoặc token. Giữ tài liệu harness và lịch sử git.
