# Đảo Đèn Lồng — Phase 2

Game 3D ba Đêm, WebGL2 + JavaScript thuần. Mây thu thập đom đóm, nạp 10 con cho mỗi đèn, tránh Bóng Mực và Gió Lạc để đưa ánh sáng về đảo. Logic bản chơi và headless dùng chung `src/core.mjs`.

## Cài đặt và chạy

Node.js 18+ và trình duyệt hỗ trợ WebGL2 trên macOS/Linux/Windows. Không cần thư viện hoặc tải asset ngoài.

```bash
node scripts/build.mjs
node scripts/serve.mjs
```

Mở http://127.0.0.1:4173/. Menu → giới thiệu → bắt đầu Đêm 1. Thắng để tiếp tục Đêm kế; thua được chơi lại Đêm đó. Thắng Đêm 3 hiện Bình Minh và tổng điểm các Đêm thắng. Để kiểm tra riêng bản đồ: `http://127.0.0.1:4173/?night=2` hoặc `?night=3`.

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

Đom đóm nhặt tự động trong 1 m, sức chứa10. Mỗi đèn cần10 và nhớ lượng đã nạp; đèn sáng giữ nguyên suốt Đêm. Pulse tốn3, cooldown3s. Dash14m/s trong0.2s, cooldown1.5s. Bùa Gió kéo dài10s: chạy7.2m/s, dash không cooldown (vẫn phải nhấn lại).

Bóng Mực chạm mất1 lửa, rơi một nửa đom đóm; có1.5s bất tử. Rơi khỏi đảo mất hết đom đóm, mất1 lửa và chờ1s hồi sinh nếu còn sống. Gió Lạc không trừ lửa nhưng cướp tối đa3; pulse có thể lấy lại đom đóm chúng đang mang. Vùng an toàn6m quanh đèn sáng chỉ ngăn Bóng Mực.

## Điểm chuẩn Phase 2

+10 mỗi đom đóm **nạp**, +100 mỗi đèn thắp, +5 mỗi Bóng Mực trúng pulse. Thắng cộng `floor(giây còn lại)×2 + 50×lửa còn lại`. Tổng hành trình chỉ cộng điểm các Đêm thắng. Chết luôn thua trước khi xét thắng; còn sống và thắp hết đèn được thắng ngay cả ở tick hết giờ.

## Test Contract v1.1

```bash
node src/headless.mjs --seed 42 --night 2 --ticks 1200 --snapshot-every 10 --out night2.jsonl
node tests/phase1/verify.mjs
node tests/phase2/verify.mjs --evidence
```

`--night` nhận1/2/3. Có thể thêm `--scenario file.json --inputs file.json`. Scenario và input mẫu kèm output thật ở [bằng chứng Phase 2](docs/proof/phase-2/). Tick vẫn tăng khi pause, sim_tick đứng yên. Lỗi file trả mã2 và stderr. Lõi dùng RNG seed và cố định60Hz.

Lệnh kiểm tra Phase1 hiện chạy các hành vi hồi quy với số chuẩn1.1. Bản test cũ được giữ ở `tests/phase1/verify-v1.0.mjs` và tại tag `phase-1`; các kỳ vọng về số tự chọn/điểm nhặt/thứ tự thắng-thua cũ đã bị Ticket-02 thay thế.

## Kiểm chứng và phạm vi

[Báo cáo Phase 2](PHASE-2-REPORT.md) · [Spec/acceptance criteria](docs/notes/phase-2-spec.md) · [Ticket gốc](docs/requirements/Ticket-02.txt). Benchmark headless: `node tests/phase2/benchmark.mjs`. Kiểm tra browser khi server đang chạy: `node tests/phase2/browser.mjs` (cần Chrome; đặt `CHROME_PATH` nếu khác đường dẫn mặc định). Bản đo FPS dùng GPU được ghi trong báo cáo, không suy rộng kết quả sang mọi laptop.

## Sáng tạo của tôi

Ánh sáng ấm cố định quanh đèn, nón lá gắn đèn nhỏ, vùng sáng tăng cùng tiến độ. Các tầng cao/tháp mờ đi khi Mây ở dưới để không che nhân vật. Những hiệu ứng này chỉ nằm ở renderer.

## Tài liệu và nguồn

[Hướng dẫn lab](docs/requirements/LAB-README.md) · [PRD-0](docs/requirements/PRD-0.txt) · [Quy định](RULES.md) · [Rubric](RUBRIC.md) · [Credits](CREDITS.md). Tag Phase1 giữ nguyên lịch sử bản v1.0.
