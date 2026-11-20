# Đảo Đèn Lồng — Phase 1

Game 3D góc nhìn thứ ba: giúp Mây nhặt đom đóm, thắp 5 Đèn Lồng Lớn trước bình minh và tránh Bóng Mực. Bản này triển khai Đêm 1 – Đảo Bến theo [PRD-0](docs/requirements/PRD-0.txt).

## Chạy game

Yêu cầu: Node.js 18+ và trình duyệt hỗ trợ WebGL2 trên macOS hoặc Linux. Không cần tải thư viện ngoài.

```bash
node scripts/build.mjs
node scripts/serve.mjs
```

Mở `http://127.0.0.1:4173/` trong trình duyệt. Hai lệnh trên cũng chạy trên Windows. Nếu PowerShell chặn `npm.ps1`, dùng các lệnh `node` như trên.

## Điều khiển

| Phím | Tác dụng |
|---|---|
| W A S D | Di chuyển tương đối với camera |
| Space | Nhảy |
| Mũi tên trái/phải | Xoay camera |
| F | Nạp đom đóm đang mang vào đèn ở gần |
| Q | Tỏa sáng, tốn 1 đom đóm đang mang; làm choáng và đẩy Bóng Mực trong bán kính 5 m |
| R | Chơi lại, kể cả sau thắng/thua |

Nhặt đom đóm bằng cách đi đến gần. Mây mang tối đa 5; mỗi đèn cần 3. Đèn đã thắp tạo vùng an toàn bán kính 4 m, Bóng Mực không vào được. Mây có 3 tim đèn; bị chạm mất 1 tim và miễn nhiễm 1 giây. Đêm kéo dài 300 giây. Thắp cả 5 đèn thì thắng; hết tim hoặc hết giờ thì thua. Không có cơ chế rơi khỏi đảo, nên `fall_enabled=false` và không phát event `player_hit` với `by:fall`.

## Điểm

- Nhặt một đom đóm: 10 điểm.
- Thắp một đèn: 100 điểm.
- Làm choáng một Bóng Mực bằng pulse: 5 điểm.
- Khi thắng: thêm `floor(số giây còn lại)` và `50 × số tim còn lại`.
- Dựng sẵn thực thể bằng scenario không cộng điểm.

## Headless và kiểm chứng

Lệnh trong `game.contract.json`: `node src/headless.mjs`. Ví dụ:

```bash
node src/headless.mjs --seed 42 --night 1 --scenario tests/phase1/pickup.scenario.json --ticks 1 --snapshot-every 1 --out pickup.jsonl
node tests/phase1/verify.mjs
```

Đầu ra là JSONL theo Test Contract v1.0. Cùng seed, scenario và inputs cho cùng output. Chạy `node scripts/capture-phase1-evidence.mjs` để tạo lại output bằng chứng và kiểm tra tính tất định. Xem [kế hoạch kiểm chứng](tests/phase1/PLAN.md), [checklist yêu cầu](docs/notes/phase-1-checklist.md) và [bằng chứng](docs/proof/phase-1.md).

## Giả định Phase 1

PRD-0 không quy định các con số gameplay ngoài 5 đèn và 60 tick/giây. Các giá trị đã chọn được khai trong `game.contract.json` và giải thích trong [checklist](docs/notes/phase-1-checklist.md). Pulse tiêu thụ `carried`, không tiêu thụ tim `flames`. Bóng Mực sợ vùng quanh **đèn đã thắp**. Va chạm, nhặt và tương tác dùng khoảng cách ngang XZ tính từ các điểm theo contract. Khi nhiều điều kiện kết thúc cùng xảy ra trong một bước, thắng do thắp hết đèn được xét trước, sau đó hết tim, rồi bình minh.

## Sáng tạo của tôi

Bản đồ đảo có các đèn xếp thành vòng, vùng sáng ấm xuất hiện khi thắp đèn, và Bóng Mực đổi màu khi bị choáng. Các hiệu ứng này chỉ dùng để hiển thị; logic headless dùng cùng trạng thái game và không phụ thuộc WebGL.

## Tài liệu lab

[Hướng dẫn gốc](docs/requirements/LAB-README.md) · [GUIDE](GUIDE.md) · [RULES](RULES.md) · [RUBRIC](RUBRIC.md) · [SUBMISSION](SUBMISSION.md)
