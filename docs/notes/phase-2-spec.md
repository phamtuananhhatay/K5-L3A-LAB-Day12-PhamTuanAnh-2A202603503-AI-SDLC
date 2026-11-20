# Phase 2 — acceptance criteria và thay đổi

Nguồn: `docs/requirements/Ticket-02.txt` và bảng số liệu chuẩn/màu người làm lab cung cấp bổ sung trong cuộc trò chuyện. Contract 1.1 thay thế các giả định Phase 1. Bảng màu được lưu tại `src/colors.mjs`; ánh sáng môi trường = 0.15 + 0.55 × số đèn sáng/tổng đèn. Các màu là màu vật liệu trước chiếu sáng.

| Tính năng | Tiêu chí nghiệm thu | Kiểm chứng |
|---|---|---|
| Ba bản đồ | Đúng 5/6/7 đèn, tọa độ cố định; mép đảo, cầu, dốc, tầng, bục và tháp theo ticket | Map test + scenario địa hình |
| Lướt | 14 m/s, 12 tick, cooldown 90 tick từ bắt đầu; đứng yên dùng hướng mặt; giữ độ cao trên không | scenario dash |
| Bị đánh/rơi | Drop nửa khi hit, TTL 480; fall mất hết, chờ 60 tick và hồi sinh; chết ưu tiên hơn thắng | scenario hit/fall |
| Pulse | Chi phí 3, đo 3D từ chân +0.8, choáng 120 tick, đẩy 4 m/15 tick | scenario pulse |
| Gió Lạc | Spawn mỗi 1200 tick ở Đêm 2/3; idle/chase/flee/removed; cướp trước hit, pulse trả đồ | scenario drifter |
| Bùa | 600 tick, chạy 7.2 và dash không cooldown; hồi bùa 2700 tick | scenario charm |
| Pause | tick tăng, sim_tick và mọi gameplay đứng yên; edge pause để tiếp tục | scenario pause |
| Chuỗi Đêm | Menu → giới thiệu → chơi → kết quả; thua chơi lại Đêm đó; thắng Đêm 3 tổng điểm các Đêm thắng | kiểm tra UI |
| Cài đặt/âm thanh | Âm lượng và độ nhạy lưu localStorage; nhạc và hiệu ứng sự kiện | kiểm tra UI |
| HUD | Tim, mm:ss, đèn, điểm, 10 ô, cooldown, E nạp, chỉ hướng đèn | kiểm tra UI |
| Hiệu năng | Headless 21600 tick ≤30s; bản thường trung bình ≥30 FPS 1280×720 | benchmark thật |

## Hồi quy

Test Phase 1 có số tự chọn (5 sức chứa, 3 chi phí đèn, điểm nhặt, đẩy ngay, ưu tiên thắng khi chết) không còn hợp lệ dưới Ticket-02. Giữ các file lịch sử tại tag `phase-1`; bộ kiểm chứng mới dùng giá trị chuẩn, kiểm tra lại tick 0, deterministic output, input validation, nhặt, nạp, pulse và kết thúc.

## Số liệu chuẩn đã áp dụng

- Chạy 6 m/s; nhảy 7 m/s, gravity −20; dash 14 m/s ×12 tick, cooldown 90 từ bắt đầu, không bất tử; bùa chạy 7.2, dash không cooldown.
- Mang 10; nhặt XZ≤1 và chênh cao≤1.5; đầu Đêm 20 mote tại điểm khác nhau; thêm mỗi240 tick nếu còn chỗ và dưới trần30.
- Nạp min(carried,10−deposited), XZ≤2, gần nhất rồi id; điểm +10/mote **nạp**, không cộng khi nhặt; +100/đèn.
- Vùng sáng6; pulse tốn3, radius3D5 từ chân+.8, cooldown180, stun120 và push4m trong15 tick; +5/mục tiêu/lần.
- Shade 4m/s (Đêm3:4.5), phát hiện12/bỏ18, hit XZ≤1 và chênh cao≤1.5; recoil2m/60 tick; hit−1 lửa, drop floor(carried/2), bất tử90, TTL480.
- Fall Y<−10 bỏ qua bất tử, mất hết carried, −1 lửa, chờ60 rồi respawn bất tử90; chết thì không hồi sinh.
- Đêm300/330/360s; chết ưu tiên, sau đó tất cả đèn sáng, sau đó dawn. Thưởng thắng floor(time)×2+50×flames.
- Gió Lạc: tốc độ7, idle2; phát hiện khi carried≥5 và ≤15m; chạm≤1.2 cướp min(3,carried), flee240 tick; pulse khi flee trả đồ và còn120 tick; spawn mỗi1200 tick tối đa2.
- Bùa600 tick, hồi2700 tick; gió Đêm3 mỗi1800 tick kéo300 tick, đẩy2m/s và cảnh báo120 tick trước.

## Quyết định cho chỗ ticket không chỉ rõ

Shade mới có 60 tick `spawning` trước `wander`. Các khoảng sinh Đêm2/3 được áp dụng sau mốc hai shade đầu tick300, giống cấu trúc lịch Đêm1. Night_start là event tick0 do bắt đầu Đêm, không do dựng scenario. ID được giữ tất định. Âm thanh tự tổng hợp bằng Web Audio, không dùng asset ngoài. Đêm2/3 dùng tên hiển thị Cầu Tre/Tháp Chuông do bản ticket được dán chưa có tên riêng.
