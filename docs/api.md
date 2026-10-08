# Tài liệu REST API

Base URL: `http://localhost:4000/api`. Phản hồi thành công có dạng `{ "success": true, "data": ..., "message": "..." }`; lỗi có `success: false` và `error.code`, `error.message`. Lỗi nội bộ không trả stack trace.

## Health

- `GET /health`: xác nhận tiến trình API đang hoạt động.
- `GET /ready`: chạy truy vấn nhỏ tới PostgreSQL; trả lỗi 500 nếu DB không sẵn sàng.

## Danh mục và sản phẩm

- `GET /categories`: danh mục cùng số sản phẩm đang hoạt động.
- `GET /products?page=1&limit=12`: phân trang (limit tối đa 48).
- Bộ lọc tùy chọn: `category=<slug>`, `search=<tên>`, `sort=newest|price-asc|price-desc`.
- `GET /products/:id`: ID phải là UUID; chỉ trả sản phẩm đang hoạt động.

Danh sách sản phẩm trả `data.items` và `data.pagination` với page, limit, total, pages. Giá PostgreSQL được trả dưới dạng decimal string.

## Đơn hàng

`POST /orders` nhận thông tin khách và các dòng sản phẩm. Ví dụ:

```json
{
  "customerName": "Nguyen An",
  "customerEmail": "an@example.com",
  "customerPhone": "+1 555 0100",
  "shippingAddress": "12 Example Street, District 1",
  "items": [{ "productId": "a86a4a7c-c2b8-46b4-9609-fc47f42272aa", "quantity": 2 }]
}
```

Máy chủ kiểm tra Zod, đọc giá/tồn kho hiện tại, tính tiền decimal, tạo đơn và trừ kho nguyên tử trong transaction. Giá client không được dùng. Thành công trả HTTP 201 và `data.lookupToken` một lần; giữ token này để tra cứu đơn.

- `GET /orders/:id?token=<lookupToken>` yêu cầu đúng token bí mật. Token được hash trong DB. Không có token hoặc token không đúng trả 404 để tránh lộ đơn và thông tin cá nhân.
- `400 VALIDATION_ERROR`: đầu vào sai.
- `404 PRODUCT_NOT_FOUND` / `PRODUCT_UNAVAILABLE`: sản phẩm không tồn tại/không bán.
- `409 INSUFFICIENT_STOCK` / `ORDER_CONFLICT`: tồn kho thay đổi hoặc transaction xung đột; có thể thử checkout lại.
