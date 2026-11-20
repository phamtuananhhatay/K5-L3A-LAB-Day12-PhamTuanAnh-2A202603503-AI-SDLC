# Phase 2 — Đảo Đèn Lồng, Contract 1.1

## Thay đổi

- Chuẩn hóa thông số, điểm nạp và thứ tự thắng/thua theo Ticket-02; giữ lõi dùng chung giữa WebGL2 và CLI.
- Ba bản đồ chính xác về tọa độ đèn, điểm sinh, đảo/cầu/tầng/dốc/bục và tháp chuông.
- Lướt, jump/air control, rơi/hồi sinh, hit/drop/TTL, pulse 3D/đẩy theo tick, vùng an toàn, lịch spawn và trạng thái Bóng Mực.
- Gió Lạc, Bùa Gió, gió Đêm3, pause/resume và snapshot mở rộng.
- Menu/giới thiệu/kết quả/chuỗi3 Đêm/Bình Minh; cài đặt lưu localStorage, âm thanh Web Audio, HUD và bảng màu chuẩn.
- Renderer gom hình học thành hai lượt vẽ để giảm số lệnh WebGL.

## Bằng chứng thật và lệnh tái hiện

| Kiểm tra | Lệnh | Kết quả |
|---|---|---|
| Build/cú pháp/thông số khai báo | `node scripts/build.mjs` | Đạt |
| Clone sạch | Clone cục bộ commit `24b8873` bằng `git clone --no-hardlinks`, chạy build và toàn bộ entry point hồi quy trong thư mục tạm | Đạt, mã thoát0; không dùng node_modules hoặc cấu hình riêng của workspace |
| Tọa độ bản đồ, cầu, mép, tầng, dốc | `node tests/phase2/maps.mjs` | Đạt |
| 14 scenario mới, byte determinism, 5 ca file lỗi | `node tests/phase2/verify.mjs --evidence` | Đạt; mỗi ca lưu scenario, inputs, JSONL thật trong [thư mục bằng chứng](docs/proof/phase-2/) |
| Hồi quy với số chuẩn | `node tests/phase2/regression.mjs` | Đạt: yaw, capacity, nạp từng phần/đèn sáng lâu dài, hồi sinh, hai bục nhảy, dash trên không, biên nhặt, giữ nút, bùa |
| Entry point hồi quy lab | `node tests/phase1/verify.mjs` | Chạy các bộ kiểm tra1.1 trên; bản1.0 lịch sử được giữ riêng và tại tag Phase1 |
| Headless đầy đủ21.600 tick | `node tests/phase2/benchmark.mjs` | Khoảng6,06s trong lần đo có spawn mặc định, dưới30s. [Cấu hình và kết quả](docs/proof/phase-2/headless-benchmark.json) |
| Trình duyệt1280×720 | Server + `node tests/phase2/browser.mjs` | Menu/start, D sang phải, pause/resume, mở Đêm2/3 với6/7đèn đạt; [ảnh Đêm1](docs/proof/phase-2/browser.png), [Đêm2](docs/proof/phase-2/night-2.png), [Đêm3](docs/proof/phase-2/night-3.png) |
| FPS | Cùng browser test, đo requestAnimationFrame5s | Khoảng144 FPS trên GPU AMD Radeon; [dữ liệu đo](docs/proof/phase-2/browser-check.json) |

Benchmark headless dùng bất tử dài để chạy trọn Đêm3 và tắt gió tránh rơi sớm, giữ spawn mặc định. Benchmark browser là mẫu5giây ở Đêm1, không phải chơi trọn3Đêm. SwiftShader phần mềm chỉ đạt khoảng9–14FPS; số đạt30FPS ở trên là renderer AMD thật được ghi trong file kết quả.

## Giả định và thay test cũ

[Spec Phase2](docs/notes/phase-2-spec.md) liệt kê acceptance criteria, số chuẩn và các chi tiết tự chọn. Test v1.0 cũ thất bại do chi phí đèn3, điểm nhặt, snapshot đầu tiên và ưu tiên thắng khi chết đã bị Ticket-02 thay thế; không dùng chúng để kết luận game1.1 sai. Bản lịch sử nằm ở `tests/phase1/verify-v1.0.mjs` và tag `phase-1`.

## Nhật ký AI và đánh giá

Codex đọc ticket, phát hiện hai bảng số/màu bị thiếu trong bản dán ban đầu và chờ người làm lab bổ sung trước khi chốt thông số. Test và file bằng chứng được tạo bằng script. Chưa có số token/chi phí chính xác nên không đưa con số giả. Cải tiến harness: AGENTS.md chuyển sang phạm vi1.1, thêm skill `skills/verify-phase/SKILL.md` và script benchmark/browser.

Vấn đề phát hiện trong quá trình làm: sai số cộng dồn thời gian có thể làm đêm kết thúc muộn1tick; đã chuyển sang `duration - sim_tick/60`. FPS thấp với renderer phần mềm; đã gom draw call và đo lại với GPU thật. Không đồng nhất các test tự viết với test ẩn của giảng viên. Chưa nghe/xem bằng tay toàn bộ một lượt3Đêm hoặc chạy trên máy macOS/Linux; đường chạy Node và web không có phụ thuộc hệ điều hành trong mã game.
