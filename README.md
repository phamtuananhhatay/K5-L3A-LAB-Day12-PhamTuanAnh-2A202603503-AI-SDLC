# Đảo Đèn Lồng — Phase 3 · Đèn cạn dầu

Game 3D ba Đêm, WebGL2 + JavaScript thuần. Mây phải **giữ đảo sáng tới bình minh**: cuối Đêm còn sống và ít nhất3/5,4/6,5/7đèn sáng. Thắp hết đèn không thắng sớm. Logic bản chơi và headless dùng chung `src/core.mjs`.

## Cài đặt và chạy

Node.js 18+ và trình duyệt hỗ trợ WebGL2 trên macOS/Linux/Windows. Không cần thư viện hoặc tải asset ngoài.

```bash
node scripts/build.mjs
node scripts/serve.mjs
```

Mở http://127.0.0.1:4173/. Menu → giới thiệu → bắt đầu Đêm 1. Thắng để tiếp tục Đêm kế; thua được chơi lại Đêm đó. Thắng Đêm 3 hiện Bình Minh và tổng điểm các Đêm thắng. Để kiểm tra riêng bản đồ: `http://127.0.0.1:4173/?night=2` hoặc `?night=3`.

Để xem nhanh cơ chế dầu và đèn yếu, mở `http://127.0.0.1:4173/?scene=fuel&night=1`. Đây là cảnh kiểm tra riêng với trạng thái dựng sẵn, không phải màn mặc định.

## Điều khiển

| Phím/thao tác | Hành động |
|---|---|
| W A S D | Di chuyển theo camera |
| Space | Nhảy |
| Shift | Lướt |
| E (hoặc F) | Nạp đèn ở gần |
| Q | Tỏa Sáng |
| Kéo chuột trái hoặc ← → | Xoay camera |
| Esc / P | Tạm dừng, cài đặt, tiếp tục, chơi lại hoặc về menu |
| R | Chơi lại Đêm hiện tại |

Đom đóm nhặt tự động trong1m. Sức chứa bắt đầu10, tăng2 mỗi lần thắp thành công (kể cả thắp lại), tối đa20. Đèn chưa từng sáng cần10, thắp lại cần5, có thể nạp từng phần. Mỗi lần thắp cấp100dầu; hao1/giây. E tại đèn sáng để châm10dầu/mote. Dầu dưới30 mất vùng an toàn và nhấp nháy1Hz; hết dầu thì tắt. Đêm kéo dài240/270/300giây.

Pulse tốn3, cooldown3s. Dash14m/s trong0.2s, cooldown1.5s. Bùa Gió kéo dài10s: chạy7.2m/s, dash không cooldown (vẫn phải nhấn lại).

Bóng Mực chạm mất1lửa, rơi một nửa đom đóm; có1.5s bất tử. Rơi khỏi đảo mất hết đom đóm, mất1lửa và chờ1s hồi sinh nếu còn sống. Gió Lạc không trừ lửa nhưng cướp tối đa3; pulse có thể lấy lại đom đóm chúng đang mang. Bóng Mực wander tìm đèn yếu để hút5dầu/giây/con; pulse ngắt hút. Đèn sáng có dầu≥30 tạo vùng an toàn6m, không ngăn Gió Lạc.

## Điểm chuẩn Phase 3

+5 mỗi đom đóm **nạp** (thắp mới/thắp lại/châm dầu), +100 thắp đầu, +40 thắp lại. Pulse trúng Bóng Mực +5, hoặc **tổng15** nếu nó đang hút dầu. Thắng bình minh cộng `50 + floor(fuel)` cho mỗi đèn đang sáng và50/lửa còn lại; không thưởng thời gian. Tổng hành trình chỉ cộng điểm các Đêm thắng. Chết luôn thua trước khi xét ngưỡng đèn, kể cả tick bình minh.

Trong Cài đặt có “Bảng màu dễ phân biệt”, lưu giữa các lần mở. Viền/mắt Bóng Mực chuyển xanh dương, cảnh báo trắng và⚠. Đèn tắt luôn xẹp20% và có vết rách để phân biệt không cần màu.

## Test Contract v1.2

```bash
node src/headless.mjs --seed 42 --night 2 --ticks 1200 --snapshot-every 10 --out night2.jsonl
node tests/phase1/verify.mjs
node tests/phase3/verify.mjs --evidence
```

`--night` nhận1/2/3. Có thể thêm `--scenario file.json --inputs file.json`. Scenario và input mẫu kèm output thật ở [bằng chứng Phase 3](docs/proof/phase-3/). Tick vẫn tăng khi pause, sim_tick/dầu/hút đứng yên. Lỗi file trả mã2 và stderr. Lõi dùng RNG seed và cố định60Hz.

Lệnh kiểm tra Phase1 hiện chạy hồi quy với luật1.2 và bộ test Phase3. Test cũ đã được thay đúng các kỳ vọng bị Ticket-03 thay thế, có lý do ở [CHANGELOG](CHANGELOG.md). Các tag phase-1/phase-2 và bằng chứng lịch sử được giữ nguyên.

## Kiểm chứng và phạm vi

[Báo cáo Phase 3](PHASE-3-REPORT.md) · [ADR](docs/notes/ADR-003-lantern-fuel.md) · [Ticket-03](docs/requirements/Ticket-03.md) · [Lịch sử Phase2](PHASE-2-REPORT.md). Kiểm tra browser: `node tests/phase3/browser.mjs` tự mở server4184 và Chrome profile tạm (đặt CHROME_PATH nếu cần). Không dùng server test này cho truy cập internet. Kết quả FPS là mẫu đo trên máy hiện tại.

## Sáng tạo của tôi

Ánh sáng ấm quanh đèn đủ dầu, nón lá gắn đèn nhỏ, vùng sáng tăng/giảm theo số đèn đang sáng. Các tầng cao/tháp mờ đi khi Mây ở dưới để không che nhân vật. Những hiệu ứng này chỉ nằm ở renderer và đã được điều chỉnh theo luật dầu mới.

## Tài liệu và nguồn

[Hướng dẫn lab](docs/requirements/LAB-README.md) · [PRD-0](docs/requirements/PRD-0.txt) · [Quy định](RULES.md) · [Rubric](RUBRIC.md) · [Credits](CREDITS.md). Tag Phase1 giữ nguyên lịch sử bản v1.0.
