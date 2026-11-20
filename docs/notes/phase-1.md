# Phase 1 — ghi chú làm việc

## Yêu cầu và giả định

Đã nhận đầy đủ PRD-0 và Test Contract v1.0. Xem [danh sách yêu cầu và kế hoạch kiểm chứng](phase-1-checklist.md). Các thông số ở đó đã được triển khai và khai báo trong `game.contract.json`.

## Nhật ký dùng AI

| Việc | Công cụ | Ước tính token/chi phí | Kết quả và điều chỉnh |
|---|---|---:|---|
| Chuẩn bị môi trường | Codex | Chưa có số liệu | Tạo demo WebGL2 không phụ thuộc thư viện và lệnh smoke |
| Triển khai Bước 4–5 | Codex | Chưa có số liệu truy xuất | Dùng chung lõi cho WebGL2 và headless; 19 kiểm tra headless đạt, ảnh WebGL2 và output JSONL đã lưu |

## Đánh giá Phase 1

Các hành vi lõi của Đêm 1 đã triển khai. Headless đạt 19 kiểm tra; output của scenario đơn lẻ, chuỗi nhiều hành động, ca biên và ca lỗi được lưu ở `docs/proof/`. WebGL2 đã render qua Chrome headless. Chưa kiểm thử thủ công một lượt chơi hoàn chỉnh trên macOS/Linux; chưa gắn tag hoặc push. Không có lỗi AI lặp lại đã được quan sát trong bước này. Bài học: kiểm tra schema và output từ các scenario nhỏ trước khi làm phần đồ họa giúp giữ một nguồn luật chung.
