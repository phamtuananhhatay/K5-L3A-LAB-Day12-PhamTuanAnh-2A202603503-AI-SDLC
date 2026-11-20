# Phase4 — phát hành v1.0.0 — Contract1.3

## Kết quả cục bộ

Core gameplay và số liệu Phase3 được giữ nguyên. Contract1.3 thêm lệnh bench/soak đã chạy thật. Tài liệu nguồn Ticket-04 được sửa về tên trường p1_low_fps và các trường contract_version/os đúng yêu cầu. Phần bảng điểm người làm lab đã bắt đầu được tích hợp và kiểm tra, không thay bằng bản lưu localStorage riêng biệt.

| Hạng mục | Bằng chứng / kết quả |
|---|---|
| Benchmark chuẩn | [bench.json](bench.json), [dt thật](bench.frames.json), [cảnh](bench.scene.json):200wander/100mote,3đèn100fuel, camera30m/Y15/15s, warmup3s rồi30s |
| Hiệu năng máy hiện tại | Avg143.7FPS,1%low113.8FPS,load~3721ms; đạt60/30/10000. GPU AMD Radeon, Chrome158, Windows. Số máy chấm có thể khác |
| Lần đo chưa đạt trước tối ưu | [bench-before-buffer-reuse.json](docs/proof/phase-4/bench-before-buffer-reuse.json):1%low25.8. Giữ lại để không che lỗi; renderer sau sửa tái sử dụng typed buffers |
| Soak10Đêm | [soak.json](soak.json):0crash; RSS50.49→57.00MB (~12.9%); seed7…16, một tiến trình;10kết quả lost là kết quả thật |
| Bảng điểm | 12test module/API/CLI đạt; [ảnh](docs/proof/phase-4/leaderboard.png). File dùng chung data/leaderboard.json, top10, JSON ISOtimezone, ghi tuần tự, chống double-submit |
| Accessibility | [browser.json](docs/proof/phase-4/browser.json): rebind/conflict/reset/persist, chữ lớn≥22.5px, reduced motion, lowfuel cue và journey score đạt |
| Chỉ báo hình ảnh | Cùng browser test đã quan sát shade spawn/mũi tên mép, gió báo trước và10s cuối: PASS; [ảnh](docs/proof/phase-4/wind-countdown.png) |
| Scene/formula test | node tests/phase4/verify.mjs: số lượng/freeze/seed, công thứcFPS/p1/p95, đổi phím trùng đạt |
| Hồi quy | node tests/phase1/verify.mjs gồm input, map,14scenario Phase2, hồi quy chuẩn và33kiểm tra Phase3 |
| Demo | [MP4](docs/demo/demo.mp4), [log thật](docs/demo/verification-log.json), metadata/preview được kiểm tra bằng browser |
| Thời lượng demo | [metadata](docs/demo/metadata.json):128.42giây,1280×720,7.48MB, MP4 hợp lệ, dưới5phút |
| Đóng gói | dist/dao-den-long-v1.0.0-web.zip: web HTML/JS và Node local server cho leaderboard; Node22+, chạy build/serve2lệnh |
| Thử ZIP giải nén | Build, smoke(localhost),12test bảng điểm/API/CLI đạt trong thư mục giải nén độc lập. Sandbox từng chặn loopback EACCES; smoke/API chạy lại với quyền kiểm tra cục bộ bình thường và đạt |
| Tài liệu | README có ảnh/video/lệnh; CHANGELOG4phase; CREDITS,LICENSE; [Retro](docs/notes/RETRO.md); AGENTS và skill được cập nhật |

## Các lệnh tái hiện

Clone sạch commit `48fceee` đã chạy build, toàn bộ hồi quy, test Phase4,12test bảng điểm và smoke thành công, exit0. [Bằng chứng](docs/proof/phase-4/clean-clone.json). Không dùng node_modules hoặc dữ liệu bảng điểm từ workspace gốc.

```bash
node scripts/build.mjs
npm test
node tests/phase4/browser.mjs
node scripts/bench.mjs --seed 42 --duration 30 --out bench.json
node --expose-gc scripts/soak.mjs --seed 7 --nights 10 --out soak.json
node scripts/serve.mjs --export-leaderboard out.json
node tests/phase4/media.mjs
node scripts/package.mjs
```

Trong PowerShell chặn npm.ps1, có thể dùng npm.cmd test hoặc các lệnh node tương ứng README.

## Giới hạn và phát hành

Bench chạy thật trên cửa sổ browser và dùng renderer game thật. Không tắt được RAF-vsync nên khai false; web không có RSS toàn renderer đáng tin cậy nên peak_mem_mb=null theo ngoại lệ của ticket. Frame p95 dùng nearest-rank ceil(.95N). Soak đo RSS Node sau GC tại cả hai mốc, với --expose-gc được khai rõ trong contract.

Mẫu video có gameplay thật và output tiến trình thật; các panel bench/soak là kết quả đã đo trước khi quay, được ghi rõ trên video. Không tuyên bố đã chơi bằng tay toàn bộ3Đêm hoặc chạy macOS/Linux. Test tự viết không phải test ẩn giảng viên.

GitHub push/Release vẫn chờ xác nhận rõ quyền xuất repo tới remote sau lần automatic approval review đã chặn. Gói ZIP, nội dung Release và tag cục bộ là phần chuẩn bị; chỉ cập nhật hoàn thành DoD GitHub khi đã quan sát được Release thật và truy cập công khai.
