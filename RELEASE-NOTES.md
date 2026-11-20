# Đảo Đèn Lồng v1.0.0

Ba Đêm giữ đảo sáng tới bình minh, Bóng Mực hút dầu, Gió Lạc, Bùa Gió và dash. Bản phát hành có bảng điểm cục bộ, đổi phím, chế độ mù màu, giảm chuyển động và chữ lớn.

Tải dao-den-long-v1.0.0-web.zip, giải nén; cần Node.js22+ và browser WebGL2. Chạy:

```bash
node scripts/build.mjs
node scripts/serve.mjs
```

Mở http://127.0.0.1:4173/. WASD/Space/Shift/E/Q/Esc; các phím đổi được trong Cài đặt. Bảng điểm lưu trên máy, không kèm dữ liệu người chơi trong gói.

Contract1.3, benchmark/soak và bằng chứng thật được kèm trong repo/gói. Bench cần cài Chrome/Chromium, dùng CHROME_PATH nếu cần. Máy hiện tại đạt ngưỡng benchmark, kết quả máy chấm có thể khác. Xem PHASE-4-REPORT.md và README để tái hiện.

Đính kèm: ZIP chạy được, demo.mp4 dưới5phút, bench.json và soak.json. Video có phụ đề, gameplay thật, output test/headless thật và panel kết quả benchmark/soak đã đo.
