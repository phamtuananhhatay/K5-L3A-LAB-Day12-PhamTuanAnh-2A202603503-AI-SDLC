# Ticket-03 — Đèn cạn dầu — yêu cầu được người làm lab cung cấp

Contract1.2; tag phase-3. Đây là bản ghi cấu trúc từ Ticket-03 trong cuộc trò chuyện; [ADR](../notes/ADR-003-lantern-fuel.md) ghi quyết định triển khai và [changelog](../../CHANGELOG.md) ghi luật bị thay thế.

- Fuel max100, cấp đầy khi thắp; hao1/s; refuel used=min(carried,ceil((100-fuel)/10)), cộng10/used, clamp100; đèn đầy không được chọn/không event/không điểm. Chọn nhận được, gần nhất, tie ID. Khi fuel≤0 tắt, deposited0, lantern_out, giữ ever_lit. Thắp lại5, lần đầu10. Thanh dầu trên đèn, dưới30 nhấp nháy1Hz.
- Vùng an toàn chỉ còn khi sáng và fuel≥30. Wander chọn đèn sáng yếu gần nhất rồi đèn tắt nếu không có; chase không đổi mục tiêu. XZ≤2→drain, đứng yên hút5/s/con cộng dồn. Drain→chase khi Mây≤6, stunned khi pulse, wander khi target tắt/≥30/xa>2; hết stunned→wander. Vùng mới phục hồi đẩy shade ra mép≤30tick và không gây hit.
- Đêm240/270/300s. Không thắng sớm. Bình minh còn sống và số sáng≥ceil(.6×n) thắng dawn_survived, nếu không lost/dawn. Hết lửa luôn no_flames ưu tiên, cả tick cuối. Dầu hao/hút ở bước2, tắt ngay sau; kết quả xét sau mọi cập nhật tick.
- Capacity=min(20,10+2×successful_lights), tính cả relight, reset mỗi Đêm; scenario không cộng lần thành công.
- Điểm: +5/mote nạp mọi hình thức; +100/thắp đầu; +40/relight; pulse shade +5, drain +15 tổng. Thắng cộng50+floor(fuel) mỗi đèn sáng và50/lửa. Không thưởng thời gian; tổng hành trình/chơi lại theo Phase2.
- Cài đặt lưu “Bảng màu dễ phân biệt”: viền/mắt shade#00B3FF thay#7A3CFF; cảnh báo trắng thay#FF5A5F và biểu tượng⚠. Đèn tắt xẹp20% và giấy rách, phân biệt không cần màu.
- Contract thêm tuning fuel_max100, fuel_decay_per_s1, fuel_per_mote10, relight_cost5, win_ratio.6, drain_per_s5, low_fuel_threshold30, capacity_max20. Snapshot mỗi đèn fuel1chữ số thập phân (off0), ever_lit, relit_count; player.capacity; shade drain.
- Scenario lamp.lit/fuel/ever_lit, default littrue thiếufuel→100; player.successful_lights, shade.target_lantern_id.
- Event refuel{lantern_id,amount,fuel}, lantern_out{lantern_id}, fuel_drain{lantern_id,shade_id,fuel} mỗi60tick hút; lantern_lit thêm relight boolean; game_over reason dawn_survived thay all_lit.
- DoD: bằng chứng thật; ADR thay mô hình và luật thắng; test bị thay cập nhật/xóa có lý do; changelog breaking changes; mọi hành vi Phase1–2 không bị thay vẫn đạt.
