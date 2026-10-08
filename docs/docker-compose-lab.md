# Bài lab: Docker và Docker Compose

**Thời lượng:** 0,5–1 ngày  
**Mục tiêu:** tự đóng gói MiniShop thành ba dịch vụ `frontend`, `backend`, `db` và chạy chúng bằng Docker Compose.

> Đây là hướng dẫn thực hành, không phải cấu hình hoàn chỉnh để sao chép. Tự tạo Dockerfile và Compose trong lúc làm; dùng phần tiêu chí cuối bài để tự kiểm tra.

## Những điều cần nắm trước Phase 1

1. **Container-to-container:** các service trong cùng Compose network gọi nhau bằng service name, ví dụ backend kết nối DB qua `db:5432`; không dùng `localhost` để gọi container khác.
2. **Host-to-container:** trình duyệt và công cụ trên máy host truy cập container qua `localhost` cùng published port, ví dụ `http://localhost:4000` khi Compose publish cổng API.
3. **Persistent storage:** PostgreSQL cần named volume gắn vào thư mục dữ liệu để dữ liệu còn sau khi container bị tạo lại. Xóa volume sẽ xóa dữ liệu trong đó.
4. **Next.js environment:** phân biệt biến được nhúng lúc build và biến được đọc khi container chạy. `NEXT_PUBLIC_API_URL` được dùng trong bundle phía trình duyệt nên cần đúng với URL mà trình duyệt truy cập được; service name nội bộ như `backend` không phải hostname cho trình duyệt trên host.
5. **Database readiness:** `depends_on` thông thường chỉ sắp thứ tự khởi động. Muốn backend chờ PostgreSQL sẵn sàng, khai báo healthcheck cho DB và `depends_on` với `condition: service_healthy`.

## Kết quả cần đạt

Khi hoàn tất, bạn có thể:

- Giải thích Docker image, container, build context, layer, volume và network.
- Tạo Dockerfile nhiều stage cho Next.js và Express/Prisma.
- Loại bỏ file thừa khỏi build context bằng `.dockerignore`.
- Dùng Compose để khởi động FE, BE và PostgreSQL theo đúng thứ tự sẵn sàng.
- Giữ dữ liệu PostgreSQL qua lần tạo lại container, kiểm tra health và đọc log.
- Chẩn đoán lỗi cấu hình URL, database, migration và port.

## Đọc repo trước khi bắt đầu

MiniShop là npm monorepo với workspaces `frontend` và `backend`. `package-lock.json` nằm ở thư mục gốc. Backend dùng Prisma; schema, migration và seed nằm trong `backend/prisma`. API chạy mặc định cổng `4000`; frontend chạy cổng `3000`.

Các endpoint kiểm tra sẵn có:

- `GET /api/health`: tiến trình API có phản hồi.
- `GET /api/ready`: API truy vấn DB để kiểm tra readiness.

Frontend lấy API base URL từ `NEXT_PUBLIC_API_URL` trong `frontend/src/lib/api.ts`. Backend lấy `DATABASE_URL`, `PORT` và `FRONTEND_URL` từ môi trường. Prisma connection string hiện dùng tham số `?schema=public`.

## Phần 1 — Chuẩn bị và vẽ luồng (20–30 phút)

1. Xác nhận Docker Engine/Desktop đang chạy bằng `docker version` và `docker compose version`.
2. Vẽ luồng request cho cấu hình Compose:

   ```text
   Trình duyệt -> frontend:3000
   Trình duyệt -> backend:4000/api
   backend -> db:5432
   ```

3. Trả lời trước khi viết file:
   - Khi backend kết nối PostgreSQL trong Compose, hostname nào nên dùng thay `localhost`?
   - Khi JavaScript chạy trong trình duyệt gọi API, trình duyệt có phân giải được tên service Compose không?
   - Dữ liệu PostgreSQL sẽ mất ở thao tác nào nếu không khai báo volume?

**Gợi ý:** tên service được phân giải bên trong network Compose. Trình duyệt chạy trên máy host, vì vậy URL API công khai thường dùng `localhost` cùng port được publish. `NEXT_PUBLIC_*` của Next.js thường được nhúng lúc build; hãy xác định rõ URL nào phải có trong image và khi nào nó được thiết lập.

## Phần 2 — `.dockerignore` và build context (15–25 phút)

Tạo `.dockerignore` ở root. Vì lockfile và workspace manifest ở root, thử dùng root làm build context cho cả hai image; Dockerfile có thể đặt riêng trong `frontend/` và `backend/`.

Loại khỏi context các nội dung không cần để build, ví dụ:

- `node_modules`, `.next`, `dist`, coverage và log.
- Git metadata và file môi trường cá nhân (`.env`, `.env.local`); giữ lại các file `.env.example` nếu cần tham khảo.
- Cache hoặc file tạm không tham gia build.

Kiểm tra kích thước context khi chạy build. Tự cân nhắc ngoại lệ: nếu ignore cả thư mục `backend/prisma`, image/backend migration sẽ thiếu schema hoặc migration. Không đưa bí mật vào image bằng `COPY` hay `ARG`.

## Phần 3 — Dockerfile Backend (45–75 phút)

Tạo `backend/Dockerfile` với tối thiểu hai stage có mục đích rõ:

1. **Dependencies/build:** dùng phiên bản Node LTS phù hợp, cài dependency theo lockfile; generate Prisma Client; biên dịch TypeScript.
2. **Runtime:** chỉ mang theo những gì ứng dụng cần để chạy, thiết lập `NODE_ENV=production`, chạy bằng user không phải root nếu có thể, mở cổng `4000`, và dùng lệnh start production.

Lưu ý trong quá trình làm:

- Context root nghĩa là đường dẫn `COPY` tính từ root repo, không phải từ `backend/`.
- `npm ci` cần manifest và lockfile phù hợp với workspaces; tránh cài đặt dựa trên lockfile thiếu.
- Prisma Client phải được generate cho môi trường trong image. Đọc `backend/package.json`, `backend/prisma/schema.prisma` và `backend/prisma.config.ts` để hiểu lệnh tương ứng.
- Runtime cần có các file runtime, client đã generate và dependency production. So sánh thử chỉ copy `backend/dist` với cấu trúc output của `tsc` (`backend/tsconfig.json`).
- Tiến trình trong container phải lắng nghe trên interface có thể truy cập từ container khác, không chỉ loopback.
- DB chưa sẵn sàng không có nghĩa là migration đã chạy. Compose có thể đợi healthcheck DB, nhưng bạn vẫn phải thiết kế bước áp dụng migration.

**Tự kiểm tra:** build riêng image backend; khởi chạy với biến môi trường thử nghiệm và xác nhận API có phản hồi. Nếu chưa có DB, `/api/health` và `/api/ready` cho kết quả khác nhau như thế nào?

## Phần 4 — Dockerfile Frontend (45–75 phút)

Tạo `frontend/Dockerfile` theo hướng nhiều stage:

1. Cài dependencies từ workspace lockfile.
2. Build Next.js ở stage build.
3. Chạy Next.js ở runtime production, không chạy `next dev`.

Điều tra hai lựa chọn đầu ra Next.js: mặc định và `output: "standalone"`. Chọn một, sau đó bảo đảm runtime image có đầy đủ file cần cho lựa chọn đó. Nếu dùng standalone, kiểm tra output thực tế sau build và xác định tài nguyên public/static cần copy.

Thiết lập API URL cho frontend theo cách phù hợp với việc `NEXT_PUBLIC_API_URL` được nhúng vào bundle. Khi mở trang từ máy host, URL trong request của trình duyệt phải trỏ tới port API đã publish trên host (thường là `http://localhost:4000/api`). Tên service như `backend` chỉ dùng được từ container cùng network, không tự hoạt động trong trình duyệt.

**Tự kiểm tra:** mở DevTools Network sau khi chạy Compose. Trang có tải được nhưng gọi API lỗi không? Request URL là gì, và URL đó đang được quyết định lúc build hay lúc chạy?

## Phần 5 — Compose cho FE + BE + PostgreSQL (60–90 phút)

Tạo `compose.yaml` ở root với ba service. Bài lab yêu cầu bạn tự viết cấu hình, không dùng `network_mode: host`.

### Service `db`

- Dùng image PostgreSQL có tag phiên bản cụ thể.
- Cấu hình database/user/password qua biến môi trường. Dùng thông tin học tập, không commit secret thật.
- Publish port `5432` nếu cần kết nối bằng công cụ DB trên host; có thể giới hạn publish về loopback.
- Gắn named volume vào thư mục dữ liệu PostgreSQL để dữ liệu sống qua vòng đời container.
- Thêm healthcheck dùng `pg_isready`.

### Service `backend`

- Build từ root context và Dockerfile backend.
- Publish `4000:4000` để trình duyệt trên host gọi API.
- Đặt `DATABASE_URL` với hostname là tên service DB, cổng `5432`, và credential khớp cấu hình DB. Trong container, `localhost` trỏ về chính container backend.
- Đặt `FRONTEND_URL` khớp origin frontend từ trình duyệt, thường là `http://localhost:3000`.
- Thêm healthcheck gọi `/api/ready` (hoặc `/api/health` nếu muốn chỉ kiểm tra tiến trình). Chọn lệnh probe có sẵn trong runtime image; image Node tối giản có thể không có `curl`.
- Dùng `depends_on` với điều kiện DB healthy để thể hiện thứ tự khởi động. Nhớ rằng điều này không tự chạy Prisma migration.

### Service `frontend`

- Build từ root context và Dockerfile frontend.
- Publish `3000:3000`.
- Đưa API URL phù hợp với trình duyệt vào build theo thiết kế Dockerfile của bạn.
- Có thể thêm healthcheck cho trang frontend nếu image có công cụ probe phù hợp; không cài thêm công cụ chỉ để làm healthcheck nếu chưa cân nhắc kích thước và nhu cầu.
- Khai báo phụ thuộc tới backend nếu muốn biểu diễn startup order. Frontend/backend vẫn cần xử lý việc API chưa sẵn sàng.

### Network và volume

Compose tạo network mặc định cho project nên service có thể kết nối nhau bằng tên service. Bạn có thể khai báo network riêng để làm rõ mô hình. Named volume DB nên được quản lý riêng khỏi container; không mount source code hay `node_modules` vào production container.

### Migration và seed

Chọn và ghi rõ cách chạy migration trước khi dùng ứng dụng:

- Tạo một tác vụ chạy một lần từ image phù hợp để thực hiện `npm run db:deploy -w backend` sau khi DB healthy; hoặc
- Dùng quy trình tương đương mà bạn có thể giải thích và chạy lặp an toàn.

Kiểm tra runtime image của bạn có Prisma CLI trước khi gọi lệnh migration trong đó. `prisma` hiện được khai báo trong devDependencies, nên image production chỉ cài production dependencies có thể không chạy được CLI. Tách tác vụ migration khỏi tiến trình API cũng giúp nhiều replica không cùng cố chạy migration.

Seed là bước tùy chọn cho bài lab; nếu chạy, xác nhận seed dùng upsert và chỉ trỏ tới DB Compose của bài lab. Không dùng URL database cá nhân/có dữ liệu cần giữ.

## Phần 6 — Chạy, quan sát, phá và sửa (30–45 phút)

Từ thư mục root, dùng các lệnh Compose tương ứng để:

1. Validate cấu hình (`docker compose config`).
2. Build và khởi động các service.
3. Xem `docker compose ps` và log từng service.
4. Chạy migration và seed nếu bạn đã chọn dùng dữ liệu mẫu.
5. Mở `http://localhost:3000`, gọi `http://localhost:4000/api/health` và `http://localhost:4000/api/ready`.
6. Dừng rồi khởi động lại stack; xác nhận named volume còn dữ liệu.
7. Dựng lại image sau khi sửa source/config để hiểu phần nào cần build lại.

Thực hiện các tình huống cố ý sau, rồi khôi phục cấu hình:

- Đổi hostname DB trong `DATABASE_URL` thành sai: đọc log backend và health status.
- Tắt DB hoặc làm readiness probe sai: phân biệt unhealthy với container đã dừng.
- Đặt frontend API URL thành tên service nội bộ: xem request trong DevTools và giải thích vì sao lỗi.
- Xóa container DB rồi tạo lại nhưng giữ named volume: kiểm tra dữ liệu.
- Chỉ xóa named volume sau khi chắc chắn đó là dữ liệu thử nghiệm của lab; volume chứa dữ liệu sẽ bị mất.

## Checklist hoàn thành

- [ ] Có `.dockerignore` root; build context không mang theo `node_modules`, `.next`, `.env` hay file thừa.
- [ ] Frontend và backend có Dockerfile nhiều stage và chạy production command.
- [ ] Image không chứa file `.env` hoặc secret; backend chạy bằng `DATABASE_URL` cấp lúc chạy.
- [ ] `compose.yaml` có ba service FE/BE/DB, port mapping và network hoạt động.
- [ ] PostgreSQL có named volume và healthcheck.
- [ ] Backend đợi DB healthy; readiness API phản ánh kết nối DB.
- [ ] Migration được chạy có chủ đích, không dựa vào giả định rằng healthcheck tự tạo schema.
- [ ] Trình duyệt mở được storefront và gọi đúng API URL; backend kết nối DB bằng hostname service.
- [ ] Bạn giải thích được `docker compose down` khác gì với `docker compose down -v`.

## Lỗi thường gặp và hướng điều tra

| Triệu chứng | Hướng kiểm tra |
| --- | --- |
| Backend báo `ECONNREFUSED` tới DB | Kiểm tra hostname, port nội bộ `5432`, credential, DB health và log `db`. Không dùng port host hoặc `localhost` từ backend container. |
| `/api/health` chạy nhưng `/api/ready` lỗi | Tiến trình API hoạt động nhưng DB hoặc schema chưa sẵn sàng; đọc log, kiểm tra URL và migration. |
| Trang hiện nhưng API lỗi từ browser | Xem request URL trong DevTools; kiểm tra `NEXT_PUBLIC_API_URL`, build-time env, port publish và CORS origin. |
| Compose đánh dấu unhealthy | Xác nhận healthcheck command có trong image, đúng port/path, có thời gian khởi động đủ và endpoint mong đợi đúng trạng thái. |
| Prisma báo thiếu bảng | Migration chưa chạy, chạy nhầm database/schema, hoặc file migration không có trong tác vụ migration. |
| Build workspace lỗi hoặc thiếu module | Kiểm tra context root, manifest/lockfile, đường dẫn `COPY`, và `.dockerignore`. |
| App chạy được bằng `npm run dev` nhưng lỗi trong container | Kiểm tra production build/start, output `dist`, Prisma Client, biến môi trường và file runtime đã copy. |

## Mở rộng nếu còn thời gian

- Giảm kích thước image bằng cách đo từng stage, rồi loại file runtime không cần thiết.
- Thêm healthcheck backend bằng Node `fetch` thay vì cài `curl`.
- Thêm giới hạn tài nguyên hoặc cấu hình restart policy và giải thích vì sao chọn giá trị đó.
- Viết README ngắn cho người khác: prerequisites, lệnh khởi động, migration, seed, URL truy cập và cách xóa dữ liệu lab.

## Dọn môi trường lab

Dừng stack bằng Compose. Chỉ xóa volume bằng lệnh có tùy chọn xóa volume khi bạn đã xác nhận volume đó chỉ chứa dữ liệu thực hành và có thể bỏ. Việc xóa volume làm mất dữ liệu PostgreSQL trong volume đó.
