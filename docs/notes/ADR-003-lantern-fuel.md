# ADR-003 — Đèn cạn dầu và thắng tại bình minh

Trạng thái: áp dụng cho Contract1.2. Nguồn: Ticket-03 do người làm lab cung cấp trong cuộc trò chuyện.

## Quyết định

Đèn lưu `fuelUnits` nguyên: 60 units=1fuel, max6000, hao1unit/tick. Mỗi shade drain hợp lệ hút5units/tick; nhiều con cộng dồn. Châm một mote thêm600units. Snapshot/event đổi sang fuel có1chữ số thập phân; mọi ngưỡng, ceil dùng và điểm floor sử dụng units chưa làm tròn.

Đèn có `ever_lit` và `relit_count`. Đèn tắt do hết dầu reset deposited0 nhưng giữ ever_lit. Lần đầu cần10, thắp lại cần5; mỗi thành công cấp đầy100fuel và tăng successfulLights. Scenario không tạo điểm/lần thắp thành công. Capacity=min(20,10+2×successfulLights), reset mỗi Đêm.

Ở bước2 trừ hao và hút trước, sau đó tắt những đèn hết dầu. Drain được tính từ trạng thái trước di chuyển của tick; shade mới vào drain ở bước8 chỉ hút từ bước2 tick sau. Mỗi60tick hút liên tục phát fuel_drain; reset bộ đếm khi dừng hút. Các event fuel_drain trong cùng tick dùng fuel sau tổng hao/hút của bước2. Pause không làm chạy bước2.

Ngưỡng vùng an toàn dùng units≥1800, không dùng fuel đã làm tròn. Refuel ở bước5 được cập nhật vùng an toàn ngay cùng tick trước pulse/di chuyển địch. Shade bên trong vùng mới phục hồi có tối đa30tick để ra mép và không gây hit khi đang được đẩy.

Chỉ shade wander tự chọn đèn yếu; tie-break khoảng cách rồi ID. Shade chase giữ mục tiêu Mây. Drain đứng yên, ngắt vì Mây≤6m, target tắt/châm≥30/xa>2, hoặc pulse. Pulse tính thưởng dựa trên trạng thái ngay trước trúng đòn: drain15 tổng, con khác5. Hết stunned trở về wander.

Đêm240/270/300s. Cuối tick luôn xét chết trước. Chỉ tại timeLeft=0 mới xét số đèn sáng≥ceil(0.6×n), reason dawn_survived hoặc dawn. Không thắng sớm. Điểm thắng=Σ(50+floor(fuel)) của đèn đang sáng +50×flames; bỏ thưởng thời gian.

## Chỗ cần hiểu theo thứ tự tick

Một đèn100fuel ở tick0 sẽ còn99+59/60 sau bước2 của tick1. Vì vậy nếu interact ở tick1, nó đã nhận được1mote theo ceil; không được gọi đây là lỗi nhận khi đầy. Bộ lọc đầy dầu được kiểm chứng riêng trên trạng thái6000units. Snapshot59.9833… có thể hiển thị60.0 nhưng thưởng fuel phải là59.

## Hệ quả và hồi quy

Core là nguồn luật duy nhất cho WebGL và headless. UI đọc fuelUnits để cảnh báo1Hz và đọc snapshot capacity để hiển thị. Cài đặt mù màu lưu localStorage, không đi vào core hoặc RNG.

Test cũ về thời lượng, điểm nạp, thưởng thời gian và thắng all_lit bị thay thế có ghi lý do trong CHANGELOG.md. Giữ nguyên tag phase-1/phase-2 và bằng chứng lịch sử; output1.2 lưu riêng trong docs/proof/phase-3.
