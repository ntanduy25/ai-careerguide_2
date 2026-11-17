# Vận hành Docker — CareerGuide V9

## Dự án đang sử dụng

Source: `E:\CMU-SoftWareEngineering\CAPSTONE PROJECT\capstone 1\AI_CAREERGUIDE_1`.

Docker Compose gom ba dịch vụ vào **một nhóm `careerguide-v9`**:

| Dịch vụ | Image | Địa chỉ trên máy |
| --- | --- | --- |
| frontend | `careerguide-v9-frontend:local` | http://localhost:5173 hoặc http://localhost:3000 |
| backend | `careerguide-v9-backend:local` | http://localhost:8000 |
| db | `pgvector/pgvector:pg16` | `127.0.0.1:55432` |

Các cổng chỉ mở trên loopback. Frontend chứa bản React đã build và Nginx proxy tới backend trong mạng Compose; không cần chạy Vite/Python trên Windows. Source và `dist` không được bind vào container, nên sau khi sửa code cần build lại image.

## Khởi động, cập nhật và dừng

Chạy trong PowerShell:

```powershell
Set-Location -LiteralPath 'E:\CMU-SoftWareEngineering\CAPSTONE PROJECT\capstone 1\AI_CAREERGUIDE_1'
docker compose config --quiet
docker compose up -d --build --wait --wait-timeout 180
docker compose ps
```

Dừng hoặc chạy lại bản đã build:

```powershell
docker compose stop
docker compose up -d --wait --wait-timeout 180
```

Xem log cục bộ khi có lỗi:

```powershell
docker compose logs --tail 100 backend frontend
docker compose logs --tail 100 db
```

Không chia sẻ log chưa kiểm tra thông tin nhạy cảm. Không in bản `docker compose config` đã mở rộng vì chứa biến bí mật; dùng `--quiet` để kiểm tra cấu hình.

## Dữ liệu và cấu hình cần giữ

- PostgreSQL dùng external volume **`careerguide1_dev_data`**, mount ở `/var/lib/postgresql/data`; `PGDATA` cũng trỏ đúng thư mục này. Volume phải tồn tại trước khi chạy.
- `.env` hiện tại nằm ngoài Git. Giữ nguyên danh tính DB, `SECRET_KEY`, `AI_CONFIG_ENCRYPTION_KEY` và `AI_CONFIG_ENCRYPTION_KEY_ID`. Khóa Fernet khác khóa JWT và cần thiết để đọc API key đã mã hóa trong DB.
- `.env.example` chỉ là mẫu. Không chép đè `.env` đang hoạt động và không thay thông tin DB bằng giá trị mẫu khi dùng volume cũ.
- Không chạy lại `careerguide1-dev-db` khi DB của `careerguide-v9` đang sử dụng volume đó. Chỉ một PostgreSQL được mở cùng thư mục dữ liệu.
- Không xóa volume bằng `docker volume rm`, `docker volume prune` hoặc quy trình dọn dữ liệu. Không dùng `docker compose down -v` để dừng dự án.
- Backend áp dụng migration có phiên bản trước khi phục vụ; không tự seed tài khoản hoặc ghi đè danh mục khi khởi động.

## Kiểm tra nhanh

```powershell
Invoke-RestMethod http://localhost:5173/health/db
(Invoke-RestMethod http://localhost:5173/api/taxonomy/majors).Count
```

Health trả `connected`, engine `postgresql`; danh mục tại thời điểm chuyển đổi có **435 ngành**. Đăng nhập bằng tài khoản Admin hiện hữu rồi mở `/admin/catalog` và `/admin/ai-settings`. Không bấm áp dụng/probe khi chỉ cần kiểm tra cấu hình.

Tính khả dụng của nhà cung cấp AI độc lập với health của ứng dụng và DB. Cấu hình đã lưu không bảo đảm nhà cung cấp cho phép mọi loại client. Google OAuth cần cấu hình hợp lệ tại Google và biến tương ứng; kiểm tra đăng nhập email không đồng nghĩa đã nghiệm thu OAuth.

Khi mở Cố vấn AI, chờ kiểm tra thực tế rồi mới xuất hiện “Đang hoạt động”. Probe không chứa hồ sơ học sinh. Nếu thay key/model trong `.env`, tạo lại backend để nạp biến mới và chọn nguồn ENV tại trang Admin nếu muốn sử dụng ENV; `docker compose restart` đơn thuần không nạp lại biến container. Timeout AI mặc định 300 giây, probe tối đa 60 giây. Ngữ cảnh hội thoại mở rộng vẫn được xử lý cục bộ theo nguyên tắc hướng nghiệp; nhãn kết nối không có nghĩa model tự soạn kết luận hồ sơ.

## Sao lưu và phục hồi

Checkpoint trước khi chuyển đổi:

`C:\Users\dyysi\AI_CAREERGUIDE_CHECKPOINTS\compose-v9-20261117-103524`

Thư mục được giới hạn quyền truy cập, chứa dump PostgreSQL custom format, cấu hình Docker trước thay đổi, trạng thái Git và bằng chứng kiểm tra. Bản `careerguide1-dev-before.dump` đã được khôi phục thử trên PostgreSQL 16 riêng, đối chiếu tài khoản, danh mục và cấu hình AI mã hóa thành công.

Năm container cũ được giữ ở trạng thái dừng để có thể đối chiếu hoặc quay lại. Muốn quay lại DB cũ, trước hết dừng toàn bộ nhóm mới và xác nhận không container nào còn dùng volume. Gateway cũ phụ thuộc runtime Vite/Python trên Windows nên chỉ bật gateway không đủ khôi phục ứng dụng cũ.

Không restore đè trực tiếp volume đang chạy. Khi cần khôi phục dump, dùng PostgreSQL 16 với volume mới, restore và kiểm chứng trước, rồi chuyển cấu hình volume khi mọi DB đã dừng. Bảo quản `.env` riêng cùng bản sao lưu; dump không thay thế được khóa giải mã.
