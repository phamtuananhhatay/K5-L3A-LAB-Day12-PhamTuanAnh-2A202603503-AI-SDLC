# Retro — bốn phase Đảo Đèn Lồng

## Evaluation và cách làm với AI

Phase1 chứng minh vòng chơi và Test Contract trước khi trau chuốt hình ảnh. Logic tách khỏi WebGL giúp cùng scenario chạy không GPU. Điểm yếu ban đầu là test chưa phủ các ranh giới và report gắn nhầm commit của tag; kiểm tra Git và thêm ca biên đã phát hiện. Một ảnh render đầu Đêm chưa chứng minh chơi hết Đêm, vì vậy báo cáo cần phân biệt hình ảnh và hành vi đã test.

Phase2 thay số tự chọn bằng số chuẩn, thêm ba bản đồ, dash, bùa, Gió Lạc và pause. Bản ticket được dán ban đầu thiếu bảng số và màu; việc hỏi bổ sung trước khi chốt tuning tránh code theo giả định sai. Test cũ được chuyển sang số chuẩn và giữ bản lịch sử. Hai bục nhảy và hồi sinh được kiểm tra bằng trạng thái thay vì chỉ nhìn ảnh. Cộng dồn thời gian thực có nguy cơ sai một tick, nên thời gian được tính từ sim_tick cố định60Hz.

Phase3 là thay đổi mô hình thật: đèn không còn sáng mãi, không còn thắng sớm. ADR ghi fuel nguyên1/60 và thứ tự hao/hút/trừ dầu. Test đặc biệt hữu ích là snapshot hiển thị60.0 nhưng thưởng floor từ59.983… chỉ được59; dùng số hiển thị để tính điểm sẽ sai. Các ca bình minh, chết cùng tick, relight và pause giúp bảo vệ luật mới. 33kiểm tra Phase3 và hồi quy đã chạy; đây vẫn là test tự viết, không thay cho test ẩn.

Phase4 biến các yêu cầu thành số đo và gói chạy. Bảng điểm cần một nguồn file chung cho UI/CLI; localStorage đơn lẻ không đủ. Bản Ticket-04 viết lại từng đổi nhầm p1_low_fps thành one_percent_low_fps và thiếu os/contract_version. Đối chiếu nguyên văn giúp ngăn schema sai. Benchmark đầu có1%low khoảng25.8 dù FPS trung bình>100: nếu chỉ báo average sẽ che khựng. Typed buffers dùng lại giảm cấp phát và kết quả đo riêng sau sửa đạt ngưỡng trên máy này. Soak dùng đúng một tiến trình và dữ liệu thật, không thay results bằng danh sách đẹp hơn.

## Harness và phát hiện lỗi

AGENTS.md là nhắc việc ngắn về nguồn luật, lệnh test và bằng chứng. Skill verify-phase hệ thống hóa thứ tự chạy. Build kiểm tuning khớp code; scenario kiểm giá trị cụ thể và event; browser test kiểm cả input nhanh, focus, rebind và persistence. Những cơ chế thực thi này hiệu quả hơn chỉ nhắc AI “hãy cẩn thận”. Chưa thêm hook chỉ để đủ hình thức: các script kiểm chứng và lịch sử Git là harness đang dùng thật.

Nhận phím từng mất tap giữa hai tick và có phản ánh khi bật bộ gõ tiếng Việt. Buffer tap, ưu tiên code vật lý và focus canvas đã có test composing/hold/release. Điều chưa chứng minh là tương tác trực tiếp với hook UniKey trên máy người dùng; không nên biến test mô phỏng thành kết luận rằng mọi bộ gõ đều ổn.

## Token, chi phí và điều cần đổi

Không có bản xuất usage/billing đầy đủ. Ước lượng thủ công rất thô cho toàn bộ hội thoại, mã và kiểm chứng4phase là khoảng150.000–300.000token; đây là khoảng dự toán theo quy mô công việc, không phải số đếm API. Chi phí tiền chưa xác định vì thiếu hóa đơn/gói sử dụng, nên không suy ra USD từ giá không được xác minh. Các số tiền ở ghi chép Phase1 cần được coi là ước tính chưa đối soát.

Tiết kiệm bằng cách giữ core chung, dùng scenario nhỏ, không nhờ AI đọc lặp toàn bộ JSONL và lưu tài liệu nguồn trong repo. Việc phải sửa lại ticket đã tóm tắt là phần lãng phí rõ nhất. Nếu làm lại, sẽ lưu ticket gốc ngay, đánh dấu mọi giả định, ghi usage sau từng phase, có baseline benchmark sớm hơn và dành thời gian chơi bằng tay trên máy khác trước khi tag. Hệ điều hành khác và máy chấm giảng viên vẫn là giới hạn kiểm chứng; báo cáo phải ghi rõ thay vì hứa tương thích đã thử.
