# Chat: kiểm tra kết nối và ngân sách AI

## Vấn đề và hành vi

Trước sửa, nhãn “Trực tuyến” là văn bản cố định; mở chat không kiểm tra provider. Probe Admin chỉ chờ 8 giây, trong khi `gpt-6-luna` đã có lần trả lời sau khoảng 8,6 giây. `.env` đã đổi nhưng hồ sơ DATABASE cũ vẫn được ưu tiên. Lịch sử chat cũng bị cắt còn 10 lượt/4.000 ký tự và cùng chịu giới hạn hồ sơ 24 KB.

Khi mở chat, frontend gửi POST `/api/rag-governance/chat/connection` không kèm hồ sơ/nội dung. Backend dùng đúng snapshot cấu hình đang hoạt động để gửi một câu kiểm tra cố định, tối đa 32 token/60 giây. Chỉ câu trả lời `OK` hợp lệ mới cấp biên nhận ngẫu nhiên và bật nhãn “Đang hoạt động”. Thất bại hiển thị trạng thái chưa kết nối và nút thử lại. Biên nhận hết hạn sau năm phút; cấu hình thay đổi làm biên nhận cũ mất hiệu lực.

Các lượt mở đồng thời chia sẻ một probe; kết quả cache hai giây và tối đa sáu probe/phút cho một process. Đây là giới hạn chi phí phù hợp bản chạy cục bộ một worker; triển khai nhiều worker cần kho hạn mức/chia sẻ kết quả bên ngoài process. HTTP response luôn `no-store`, không trả key, base URL, model hoặc fingerprint cấu hình cho khách.

## Nguyên tắc hướng nghiệp

Giữ nguyên ranh giới đã nghiệm thu: chat/explain/personalize, điểm phù hợp và mức sẵn sàng được tạo từ dữ liệu hệ thống có quyền truy cập. Không thêm văn bản model vào kết luận tất định; không gửi câu hỏi, lịch sử, điểm hoặc hồ sơ học sinh đến provider. Probe kết nối độc lập với nội dung tư vấn và không chứng minh câu trả lời tư vấn do model tạo. Phản hồi chat khai báo `is_ai_generated=false`, `response_source=verified_guidance`; giao diện ghi rõ nguồn dữ liệu hệ thống.

`1+1=` là câu ngoài phạm vi, vẫn được chuyển hướng về hướng nghiệp. Không nới quy tắc này để giả lập kiểm tra API. Việc cho model tự soạn hội thoại sẽ cần thay đổi yêu cầu nghiệp vụ và kiểm chứng lại ranh giới riêng.

## Thời gian và ngữ cảnh

Adapter bỏ giới hạn cứng 30 giây, dùng deadline mặc định 300 giây (có giới hạn hữu hạn). Probe có ngân sách riêng để không sử dụng mức chờ dài không cần thiết. Mọi request hoàn tất ngay khi có phản hồi; không thêm thời gian đợi giả cho câu hỏi phức tạp. Proxy và frontend chờ đủ cho deadline backend.

Ngân sách cấu hình: tối đa 272.000 token context, 128.000 token output, một triệu ký tự; kiểm tra tổng input + output và request/response size. Đây là trần ứng dụng; từng consumer vẫn chỉ yêu cầu lượng đầu ra cần thiết. Metadata `/models` của Luna đã báo context 272.000/output 128.000; model thiếu metadata giữ giới hạn dự phòng nhỏ. Tokenizer chỉ dùng cache hợp lệ có sẵn; thiếu cache dùng số byte UTF-8 bảo thủ, không hứa số token chính xác của provider và không tải tokenizer trong request.

Ngữ cảnh hội thoại cục bộ tăng lên 64 lượt, mỗi lượt tối đa 12.000 ký tự, toàn request dưới 1 MB. Hồ sơ riêng vẫn giới hạn 24 KB. Phần này không được chuyển ra API model. Không lưu hội thoại vào localStorage; đổi phiên/hồ sơ/đóng khung hủy request cũ và loại kết quả đến muộn.

## Kiểm chứng

Test bảo vệ ownership/scope/PII hiện có; test mới cho probe thật với HTTP tổng hợp, không lộ cấu hình, request đồng thời, đổi cấu hình trong khi probe/chấm hồ sơ, giới hạn chi phí, hết hạn receipt, giới hạn context và deadline >30 giây. Kiểm tra trình duyệt cả lỗi/thử lại/hủy request bằng fixture tổng hợp, sau đó thử provider thật trên bản Docker đã build.

Cấu hình cũ trước chuyển sang ENV được bảo quản dạng mã hóa tại checkpoint riêng ngoài repo: `C:\Users\dyysi\AI_CAREERGUIDE_CHECKPOINTS\chat-runtime-20261117-153736`. Không có key thật trong báo cáo/test/ảnh.
