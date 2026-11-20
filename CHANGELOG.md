# Changelog

## Phase 4 — Contract1.3 — v1.0.0

- Benchmark chuẩn200wander/100mote, camera quỹ đạo30m/15s, warmup3s; đo dt thật, schema p1_low_fps, contract_version và os đúng ticket; raw frames/cấu hình cảnh được lưu.
- Soak10Đêm cùng tiến trình, seed7…16, input xác suất chuẩn, RSS trước/sau reset. Không thay luật gameplay1.2.
- Bảng điểm cục bộ top10, tên đúng quy tắc, điểm các Đêm thắng, lưu bền vững và export cùng nguồn dữ liệu; chống submit lặp và ghi file tuần tự.
- Đổi phím9hành động, báo trùng/reset/lưu; chỉ báo hình ảnh; reduced motion; chữ≥18px và×1.25.
- Dùng lại typed render buffers để giảm GC spikes ở scene200shade.
- README/credits/license/retro/demo, gói ZIP và tài liệu bản phát hành.

## Phase 1 — Contract1.0

- Đêm1 tối thiểu, core dùng chung WebGL/headless, nhặt/nạp/pulse/hit, thắng/thua, scenario và JSONL tất định. Các số tự chọn ban đầu được thay chuẩn trong Phase2.

## Sửa điều khiển sau tag phase-3

- Đệm lần nhấn nhanh giữa hai tick để không mất input; giữ trạng thái phím cho tới keyup, không phụ thuộc nhịp lặp của bàn phím.
- Ưu tiên event.code vật lý, hỗ trợ keyCode/key khi cần, đưa focus về canvas sau menu và resume; xóa trạng thái khi cửa sổ mất focus.
- Chuyển cập nhật DOM HUD ra ngoài vòng tick và giới hạn10Hz để giảm khựng. Logic/headless và thông số60Hz không đổi.
- Thêm test nhấn nhanh/giữ/nhả và sự kiện đang composing; test browser là mô phỏng sự kiện, không phải chạy chính bộ UniKey của người làm lab. Tag phase-3 giữ nguyên lịch sử.

## Phase 3 — Contract1.2 — breaking changes

- Thời lượng300/330/360 →240/270/300s. Snapshot lantern thêm fuel, ever_lit, relit_count; player thêm capacity. Scenario thêm fuel/ever_lit, successful_lights và target_lantern_id; trạng thái shade thêm drain.
- Đèn không còn sáng vĩnh viễn hoặc từ chối mọi tương tác khi sáng. Nay hao dầu, nhận refuel, tắt khi cạn và thắp lại với5mote.
- Đèn fuel<30 mất vùng an toàn. Wander có mục tiêu đèn yếu và drain5fuel/s/con. Các cơ chế vùng sáng khác và map/dash/Gió Lạc/bùa được giữ theo Ticket-02.
- Thắng ngay all_lit bị bỏ. Chỉ thắng ở bình minh với3/5,4/6,5/7đèn, còn sống. Reason all_lit không còn xuất; dùng dawn_survived. Chết vẫn ưu tiên no_flames.
- Nạp10điểm/mote →5; thắp lại40; pulse drain15 tổng; thưởng thời gian2/giây →0; thay bằng50+floor(fuel) mỗi đèn sáng và50/lửa lúc thắng.
- Carry capacity10 cố định →10+2mỗi lần thắp thành công, tối đa20. Thắp lại cũng tính.
- Bổ sung cài đặt bảng màu dễ phân biệt và hình đèn tắt xẹp/rách, thanh dầu/nhấp nháy1Hz.

### Test cập nhật có lý do

- `tests/phase2/cases.json`: pause còn240s thay300; deposit score150 thay200. Đây là thay đổi chuẩn bắt buộc từ Ticket-03.
- `tests/phase2/regression.mjs`: partial deposit4mote được20 thay40; per_second_left=0. Test đèn còn sáng sau120tick được giữ vì chưa cạn; thêm test cạn đúng6000tick và out/relight trong Phase3.
- Những kỳ vọng thắng sớm all_lit, đèn sáng vĩnh viễn và thắng dù chết cùng tick ở các bản đầu không dùng cho1.2. Các bộ test lịch sử/tag cũ vẫn giữ, thay bằng ca no-early-win, dawn thresholds, out-at-dawn, dead-at-dawn và điểm thắng mới.
- Không skip âm thầm các ca map, input, dash, bùa, Gió Lạc, va chạm, jump pad, respawn và deterministic output. Chạy lại entry point hồi quy và Phase3 cùng nhau.
- Hồi quy evidence1.2 ghi vào `docs/proof/phase-3/regression`, giữ nguyên file bằng chứng1.1. `tests/phase1/verify.mjs` thêm bộ Phase3, không bỏ các test Phase2 còn hiệu lực.

## Phase 2 — Contract1.1

Ba bản đồ và chuỗi3Đêm; số liệu chuẩn; dash, Gió Lạc, bùa, gió, pause, HUD/âm thanh/cài đặt; điểm nạp thay điểm nhặt; snapshot1.1. Lịch sử tại tag phase-2.
