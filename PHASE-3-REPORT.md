# Phase 3 — Đèn cạn dầu — Contract1.2

Nguồn: [Ticket-03](docs/requirements/Ticket-03.md). Thay đổi mô hình và các lựa chọn thứ tự xử lý: [ADR-003](docs/notes/ADR-003-lantern-fuel.md). Luật/test bị thay: [CHANGELOG](CHANGELOG.md).

## Triển khai

| Yêu cầu | Cách làm | Kiểm chứng |
|---|---|---|
| Nhiên liệu, refuel, hết dầu, relight | Fuel nguyên1/60; hao/hút ở bước2, tắt ngay; đèn đầy bị lọc, nạp gần nhất/tie ID; ever_lit/relit_count | scenario-default, decay, out, first-light, relight, out-and-relight, refuel, partial-refuel và ca trực tiếp đèn đầy |
| AI hút dầu và vùng sáng | Wander chọn weak lamp, chase giữ Mây; drain5/s/con; xuất event mỗi60tick; ≥30 phục hồi vùng sáng và đẩy shade≤30tick | single-drain, double-drain, enter-drain, pulse-drain, restore-safe-zone; ca threshold/cadence/exit |
| Thắng bình minh | Đêm240/270/300; không thắng sớm; còn sống và≥ceil(.6n); chết ưu tiên; score dùng fuel chưa làm tròn | no-early-win, dawn-won/lost, out/dead/relight-at-dawn, threshold và below-threshold cả Đêm2/3 |
| Capacity và điểm | Tăng2 mỗi lần thắp, tối đa20; first100/relight40, mote5, pulse drain15 tổng; thưởng dầu/lửa | first-light, relight, max-capacity, reset next night, pulse-drain, dawn-won |
| Snapshot/scenario1.2 | Khai báo tuning khớp code, fuel1decimal, ever_lit/relit_count/capacity, state drain, scenario mới; lỗi schema→2 | build, toàn bộ scenario+schema+byte determinism, invalid-field group |
| Giao diện và mù màu | Thanh dầu, weak blink1Hz, đèn off xẹp20%/rách; setting lưu; viền/mắt cyan, warning white+⚠ | browser-check.json, colorblind-low-fuel.png, refueled.png |
| Hồi quy chưa bị thay | Map, dash, jump/pad, hit/drop/fall, bùa, Gió Lạc, gió, pause, input validation | Bộ Phase2 và standardized regression được gọi từ entry point Phase1 |

## Lệnh và kết quả thực tế

```bash
node scripts/build.mjs
node tests/phase1/verify.mjs
node tests/phase2/verify.mjs --evidence
node tests/phase3/verify.mjs --evidence
node tests/phase3/browser.mjs
node tests/phase3/benchmark.mjs
```

- Build/cú pháp và contract tuning: PASS.
- Clone sạch commit `5c57d49` vào thư mục tạm độc lập bằng `git clone --no-hardlinks`, chạy build và entry point toàn bộ hồi quy/Phase3: PASS, exit0. [Kết quả](docs/proof/phase-3/clean-clone.json).
- 14 scenario hồi quy Phase2 với kỳ vọng đã cập nhật đúng Ticket-03, 5 ca file lỗi và nhóm hồi quy chuẩn: PASS.
- Phase3: **33 mục kiểm tra**, gồm25scenario CLI chạy2lần so byte và8nhóm kiểm tra biên/state trực tiếp: PASS. [Summary máy tạo](docs/proof/phase-3/summary.json).
- Input, output JSONL và điều kiện đạt được lưu ở `tests/phase3/cases.json` và [docs/proof/phase-3](docs/proof/phase-3/). Hồi quy1.2 nằm trong thư mục regression riêng; không ghi đè output lịch sử Phase2.
- Browser1280×720: setting mù màu tồn tại sau navigation/reload, white+⚠, capacity14, E nạp5mote nhận25điểm/châm dầu, pause giữ dầu: PASS. [Kết quả](docs/proof/phase-3/browser-check.json), [ảnh đèn yếu](docs/proof/phase-3/colorblind-low-fuel.png), [ảnh sau refuel](docs/proof/phase-3/refueled.png).
- Mẫu browser3giây khoảng144FPS; không đại diện mọi máy hoặc một lượt chơi đầy đủ.
- Full Night3 18.000tick, spawn mặc định: khoảng1,4s≤30s. [Cấu hình và kết quả](docs/proof/phase-3/headless-benchmark.json). Benchmark dùng bất tử để tránh chết sớm và tắt gió tránh rơi; CLI và ghi JSONL được tính trong thời gian.

## Đánh giá AI và harness

Lỗi cần phòng: dùng số fuel đã làm tròn để xét30 hoặc tính floor tại bình minh; thưởng pulse drain thành20; giữ thắng sớm; test cũ báo đỏ vì luật bị thay nhưng bị bỏ qua. Các ca exact-boundary, dawn-won(score477 dù snapshotfuel60.0), pulse-drain(score15), no-early-win và CHANGELOG kiểm soát các điểm này.

AGENTS.md và `skills/verify-phase/SKILL.md` được cập nhật phạm vi1.2. Bộ so sánh ID được tái sử dụng để giảm chi phí AI trong headless. Không có số token/chi phí chính xác cho Phase3, nên không khai số giả.

## Giới hạn

Các kết quả trên chứng minh các ca tự viết, không phải kết quả test ẩn của giảng viên. Chưa chơi bằng tay trọn3Đêm và chưa chạy trực tiếp trên macOS/Linux; mã game dùng Node/WebGL không phụ thuộc thư viện hệ điều hành. Các tag/bằng chứng Phase1/2 là lịch sử theo luật lúc phát hành. Bản1.2 được chốt bằng tag cục bộ phase-3; việc push GitHub cần xác nhận xuất repo đã được hỏi trước đó.
