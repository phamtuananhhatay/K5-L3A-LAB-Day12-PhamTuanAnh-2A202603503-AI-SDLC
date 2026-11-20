# Phase 1 — ghi chú làm việc

## 1. Các giả định đã chọn và lý do

Do PRD-0 để ngỏ các thông số chi tiết ngoài 5 đèn và 60 tick/s, các giả định thiết kế sau đã được lựa chọn và khai báo nhất quán trong `game.contract.json`:
- **Không gian & vị trí đèn**: Đảo tròn bán kính 30 m, 5 Đèn Lồng Lớn (`L1`–`L5`) đặt tại bán kính 20 m đối xứng quanh tâm `(0,0,0)`. Lý do: Bố cục trực quan, cân đối, dễ tính toán khoảng cách và dựng scenario test.
- **Di chuyển & nhảy**: Mây chạy với vận tốc 6 m/s; phím nhảy kích hoạt vận tốc $Y = 6\text{ m/s}$ và trọng lực $14\text{ m/s}^2$. Khoảng cách tương tác/nhặt đo trên mặt phẳng ngang XZ.
- **Thu thập & nạp đèn**: Sức chứa tối đa 5 đom đóm (`carry_capacity=5`), bán kính nhặt $\le 1\text{ m}$, tương tác đèn $\le 2\text{ m}$, mỗi đèn cần 3 đom đóm (`lantern_cost=3`). Mây nạp tối đa lượng đang mang cho đến khi đủ đèn.
- **Sinh tồn & va chạm**: Mây có 3 tim đèn (`flames=3`), chạm Bóng Mực mất 1 tim và được miễn nhiễm 1 s (`invuln_s=1`), không rơi đom đóm khi trúng đòn (`hit_drop_ratio=0`), không rơi khỏi đảo (`fall_enabled=false`).
- **Tỏa sáng (Pulse)**: Tốn 1 đom đóm đang mang (`carried`), không trừ tim đèn `flames`. Tác động bán kính 5 m, đẩy quái xa 3 m, làm choáng 2 s (`pulse_stun_s=2`), thời gian hồi chiêu 3 s.
- **Vùng an toàn**: Chỉ kích hoạt quanh các **đèn đã thắp** (`lit: true`) với bán kính an toàn 4 m (`safe_radius=4`). Bóng Mực ở trạng thái `chase` bị chặn không thể đi vào vùng này.
- **Thứ tự ưu tiên kết thúc**: Nếu nhiều điều kiện cùng xảy ra trong một tick (ví dụ thắp đèn cuối cùng lúc hết máu hoặc hết giờ), game ưu tiên `won` (`all_lit`) $\rightarrow$ `lost` (`no_flames`) $\rightarrow$ `lost` (`dawn`).

## 2. Kết quả nghiệm thu: Đạt / Chưa đạt

### Yêu cầu đạt (100% Core & Contract):
- **PRD-0 (P1-01 đến P1-11)**: Đảo Đêm 1 chơi được từ đầu đến thắng/thua, điều khiển mượt mà, nhặt đom đóm, thắp 5 đèn, Bóng Mực đuổi theo, cơ chế tỏa sáng, HUD đầy đủ và phím R restart.
- **Test Contract v1.0 (C-01 đến C-12)**: 21/21 bài kiểm tra headless tự động đạt (PASS), bao gồm ca đơn lẻ, ca chuỗi (`sequence`), ca biên khoảng cách ngang (`boundary`), ca lỗi định dạng thoát mã 2 (`invalid.inputs`, `invalid.scenario`), ca patch scenario từng phần và ca ưu tiên chiến thắng.
- **Tính tất định**: Cùng seed cho output JSONL giống hệt từng byte giữa các lần chạy (đã lưu mã băm SHA-256).
- **Bản clone sạch**: Đã kiểm chứng clone sang thư mục độc lập và chạy theo README thành công mã 0.

### Giới hạn hiện tại (Chưa triển khai):
- Chưa có hiệu ứng âm thanh nền và tiếng động (PRD-0 không yêu cầu bắt buộc ở Phase 1).
- Chưa hỗ trợ điều khiển bằng tay cầm gamepad (chỉ điều khiển qua phím và chuột).
- Chưa quay video demo hoàn chỉnh (theo `GUIDE.md` và `SUBMISSION.md`, video demo tổng thể sẽ được thực hiện ở Phase 4 trước khi nộp bài).

## 3. Nhật ký dùng AI & Ước tính token

| Việc | Công cụ | Ước tính token/chi phí | Kết quả và điều chỉnh |
|---|---|---:|---|
| Chuẩn bị môi trường & khảo sát PRD-0 | Codex / Gemini 3.8 Flash | ~8.000 tokens ($0.03) | Tạo demo WebGL2 độc lập không phụ thuộc thư viện ngoài; thiết lập khung build/smoke/test |
| Triển khai Bước 4 (Game core & WebGL2) | Codex / Gemini 3.8 Flash | ~18.000 tokens ($0.07) | Thiết kế `src/core.mjs` làm nguồn sự thật duy nhất (single source of truth) cho cả WebGL2 và headless |
| Triển khai Bước 5 (Test Contract & Scenarios) | Codex / Gemini 3.8 Flash | ~14.000 tokens ($0.05) | Xây dựng 9 kịch bản scenario, validator schema JSONL, bắt lỗi mã thoát 2, đạt 21/21 headless checks |
| **Tổng cộng Phase 1** | | **~40.000 tokens (~$0.15)** | Tiết kiệm token nhờ dùng test tự động và giữ prompt ngữ cảnh gọn |

### Chiến lược kiểm soát và tiết kiệm token
- **Tự động hóa kiểm thử cục bộ**: Viết kịch bản `verify.mjs` và `capture-phase1-evidence.mjs` chạy trực tiếp bằng Node.js thay vì nhờ AI đọc và phân tích thủ công từng dòng output JSONL.
- **Harness tinh gọn**: Giữ file `AGENTS.md` dưới 15 dòng ngắn gọn với các quy tắc cốt lõi, tránh làm phình system prompt trong mỗi lượt tương tác.
- **Tái sử dụng kiến trúc**: Tách logic game ra hàm thuần túy `step(game, input, previousInput)`, tránh phải prompt agent code lại logic riêng cho giao diện đồ họa.

### Phân tích lỗi của AI và điều chỉnh harness
1. **Lỗi phán đoán cờ / event ngoài contract**: Ban đầu AI có xu hướng thêm các sự kiện như `dash` hay `fall` vào schema event.
   - *Cách phát hiện*: Đối chiếu với bảng Event trong Test Contract v1.0.
   - *Điều chỉnh harness*: Ghi rõ trong `AGENTS.md` chỉ dùng các event đã định nghĩa, và thêm hàm `validateOutput()` kiểm tra enum tên event và trường bắt buộc.
2. **Lỗi xử lý frame tick trong input**: AI dễ bỏ qua quy định tick phải tăng nghiêm ngặt hoặc quên giữ trạng thái của frame cũ khi frame mới vắng mặt một số trường.
   - *Cách phát hiện*: Chạy test scenario với frame cách quãng và frame trùng lặp.
   - *Điều chỉnh*: Thêm kiểm tra `input frame ticks must increase strictly` thoát mã 2 và kiểm tra duy trì input trước đó.

## 4. Việc cần điều chỉnh cho Phase 2

1. **Đối chiếu thay đổi yêu cầu (Ticket-02)**: Khi nhận Ticket-02, rà soát lại ngay danh sách giả định của Phase 1 xem có luật nào bị làm rõ hoặc thay đổi hay không. Nếu có, cập nhật `game.contract.json` và code đồng thời.
2. **Bảo vệ hồi quy (Regression Protection)**: Giữ nguyên 21 bài kiểm tra của Phase 1 để chạy lại sau mỗi lần tích hợp mã nguồn mới; nếu luật mới thay thế luật cũ, phải sửa hoặc bỏ test kèm lý do rõ ràng.
3. **Cập nhật Harness**: Nếu agent tiếp tục gặp lỗi hiểu sai luật mới của Đêm 2, cập nhật bổ sung quy tắc ngắn gọn vào `AGENTS.md`.
