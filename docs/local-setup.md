# Thiết lập cục bộ trên Windows

## 1. Kiểm tra công cụ

Mở PowerShell:

```powershell
node --version
npm --version
Get-Service *postgres*
```

Cài Node.js LTS và PostgreSQL 16 trở lên theo quy trình quản lý máy của bạn nếu chưa có. Tài liệu này không cài phần mềm, sửa PATH hoặc đổi trạng thái dịch vụ. Nếu cài PostgreSQL nhưng `psql` chưa có trong PATH, tìm `psql.exe` trong thư mục `bin` của PostgreSQL.

## 2. Tạo database riêng

Trước hết kiểm tra danh sách database/role bằng công cụ PostgreSQL của máy. Chỉ tiếp tục nếu `minishop` và role `minishop` chưa được dùng cho dữ liệu cần giữ. Kết nối bằng tài khoản quản trị PostgreSQL hiện có, ví dụ:

```powershell
& 'D:\PostgreSQL\18\bin\psql.exe' -U postgres -h localhost -p 5432 -d postgres
```

Trong `psql`, tạo database trống và tài khoản ứng dụng. Đổi mật khẩu placeholder thành mật khẩu cục bộ của riêng bạn:

```sql
CREATE ROLE minishop LOGIN PASSWORD 'minishop';
CREATE DATABASE minishop OWNER minishop;
```

Mật khẩu `minishop` được dùng cho môi trường học tập cục bộ này; đổi nó thì cập nhật cùng mật khẩu trong `backend/.env`. Nếu role hoặc database đã tồn tại, đừng chạy lệnh tạo lại và đừng xóa/ghi đè chúng. Chọn tên mới, cập nhật `DATABASE_URL` tương ứng, hoặc xác minh rõ dữ liệu hiện có trước khi tiếp tục. Không đưa file `.env` vào Git.

## 3. Cấu hình và dữ liệu mẫu

Tại thư mục gốc dự án:

```powershell
npm install
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env.local
```

`backend/.env` dùng `DATABASE_URL=postgresql://minishop:minishop@localhost:5432/minishop?schema=public`. Nếu bạn đổi mật khẩu, cập nhật chuỗi kết nối này; các ký tự đặc biệt cần được percent-encode. `PORT` mặc định là `4000`; `FRONTEND_URL` mặc định là `http://localhost:3000`.

```powershell
npm run db:deploy
npm run db:seed
```

Seed dùng upsert theo slug, có thể chạy lặp lại. Migration chỉ chạy trên database trong `DATABASE_URL`; xác nhận chuỗi kết nối trước khi chạy.

## 4. Chạy ứng dụng

```powershell
npm run dev
```

Mở `http://localhost:3000`. API chạy ở `http://localhost:4000/api`; readiness ở `/api/ready`. Dừng tiến trình bằng `Ctrl+C` trong cửa sổ PowerShell.

## 5. Kiểm tra mã nguồn

```powershell
npm run typecheck
npm run lint
npm run test
npm run build
```

Test backend dùng stub cho Prisma, nên không sửa database phát triển. Kiểm tra đơn hàng tích hợp thật cần database test độc lập và chỉ được chạy sau khi đặt rõ `DATABASE_URL` test.

## Biến môi trường

| Biến                  | Ứng dụng | Ý nghĩa                                       |
| --------------------- | -------- | --------------------------------------------- |
| `DATABASE_URL`        | Backend  | Chuỗi kết nối PostgreSQL; bí mật, chỉ máy chủ |
| `PORT`                | Backend  | Cổng API, mặc định 4000                       |
| `FRONTEND_URL`        | Backend  | Origin được phép gọi API                      |
| `NODE_ENV`            | Backend  | Môi trường chạy                               |
| `NEXT_PUBLIC_API_URL` | Frontend | URL API công khai cho trình duyệt             |
