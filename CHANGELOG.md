# Changelog

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
