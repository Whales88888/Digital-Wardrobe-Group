# Xây dựng phát triển hệ thống quản lý tủ quần áo thông minh

## Giới thiệu

Đồ án xây dựng ứng dụng quản lý tủ quần áo và phối hợp trang phục. Người dùng có thể xem, tìm kiếm, phân loại quần áo; quản lý danh mục; tạo bộ trang phục từ các món đồ trong tủ. Dữ liệu được lưu trong MariaDB và giao diện hiển thị dữ liệu thật từ máy chủ.

Kho mã hiện có hai phần máy chủ riêng:

- **Express** (`backend/server.js`, `backend/routes/`): API đang được giao diện React sử dụng.
- **NestJS** (`backend/src/`): ứng dụng riêng có chức năng đăng ký, đăng nhập bằng JWT và giới hạn dữ liệu quần áo/trang phục theo người dùng. Chức năng xác thực hiện chưa nối vào giao diện React hoặc API Express.

## Công nghệ sử dụng

| Thành phần | Công nghệ | Vai trò |
|---|---|---|
| Giao diện | React, TypeScript, Vite | Hiển thị và tương tác với ứng dụng web |
| Điều hướng | React Router | Chuyển giữa các trang |
| API hiện dùng bởi giao diện | Node.js, Express | Nhận và xử lý yêu cầu từ giao diện |
| API xác thực | NestJS, TypeScript | Đăng ký, đăng nhập và kiểm tra JWT |
| Cơ sở dữ liệu | MariaDB | Lưu tài khoản, danh mục, quần áo và trang phục |
| Kết nối cơ sở dữ liệu | MariaDB driver, TypeORM | Đọc/ghi dữ liệu từ máy chủ |

## Chức năng chính

- Trang chủ giới thiệu ứng dụng và hiển thị trước một số quần áo, trang phục từ cơ sở dữ liệu.
- Bảng điều khiển hiển thị số liệu tổng quan và số lượng theo danh mục.
- Quản lý quần áo: xem, tìm kiếm, lọc theo danh mục, sắp xếp, xem chi tiết, thêm, sửa và xóa.
- Quản lý danh mục: xem, lọc, đếm số lượng, thêm, sửa và xóa.
- Quản lý trang phục và các món quần áo được ghép vào trang phục.
- Hiển thị trạng thái đang tải, danh sách trống, lỗi và thử tải lại; xác nhận trước khi xóa.
- Giao diện thích ứng với máy tính, máy tính bảng và điện thoại.
- NestJS hỗ trợ đăng ký/đăng nhập JWT, băm mật khẩu và bảo vệ API bằng mã thông báo.

## Cấu trúc hệ thống

```text
React + Vite
    │
    ├── /api → Express → MariaDB
    │
    └── (chưa tích hợp đăng nhập)

NestJS API → TypeORM → MariaDB
    └── /auth/register, /auth/login và API yêu cầu JWT
```

Trong quá trình phát triển, Vite chuyển tiếp đường dẫn `/api` đến Express tại `http://127.0.0.1:9000`. Khi triển khai, cần cấu hình máy chủ chuyển tiếp cùng nguồn đến Express vì Express hiện chưa bật CORS.

## Cấu trúc thư mục

```text
frontend/
├── src/components/   # Thành phần giao diện dùng lại
├── src/hooks/        # Hook tải và quản lý trạng thái dữ liệu
├── src/layouts/      # Bố cục trang công khai và trang ứng dụng
├── src/pages/        # Các trang giao diện
├── src/services/     # Gọi API và định nghĩa kiểu dữ liệu
└── src/App.tsx       # Khai báo các đường dẫn giao diện

backend/
├── routes/           # Các tuyến API Express
├── src/auth/         # Đăng ký, đăng nhập và kiểm tra JWT bằng NestJS
├── src/user/         # Tài khoản người dùng trong NestJS
├── src/clothing/     # Quần áo trong NestJS
├── src/outfit/       # Trang phục trong NestJS
├── src/outfit-item/  # Các món đồ thuộc trang phục trong NestJS
└── server.js         # Điểm khởi chạy Express

sql/
└── digital_wardrobe.sql
```

## Cơ sở dữ liệu

Cơ sở dữ liệu tên `digital_wardrobe`, gồm năm bảng:

| Bảng | Nội dung |
|---|---|
| `users` | Tài khoản người dùng |
| `categories` | Danh mục quần áo |
| `clothing` | Các món quần áo |
| `outfits` | Bộ trang phục |
| `outfit_items` | Liên kết quần áo với bộ trang phục |

Các liên kết chính:

- Mỗi món quần áo thuộc về một người dùng và một danh mục.
- Mỗi bộ trang phục thuộc về một người dùng.
- Mỗi dòng `outfit_items` liên kết một bộ trang phục với một món quần áo.

Tệp tạo cấu trúc cơ sở dữ liệu: [sql/digital_wardrobe.sql](./sql/digital_wardrobe.sql). Với cơ sở dữ liệu có sẵn, xem phần cập nhật cấu trúc email ở dưới trước khi thêm chỉ mục duy nhất.

## Khởi chạy trên máy cá nhân

### 1. Cài đặt cần thiết

Cần có Node.js, npm và MariaDB. Tại thư mục gốc của kho mã, cài các gói:

```bash
npm --prefix frontend install
npm --prefix backend install
```

### 2. Cấu hình Express và cơ sở dữ liệu

Express đọc cấu hình từ tệp `.env` ở thư mục gốc. Sao chép tệp mẫu rồi điền thông tin MariaDB:

```bash
cp -n .env.example .env
```

Nếu tệp `.env` đã tồn tại, giữ nguyên tệp đó và chỉ kiểm tra các giá trị cấu hình. Không đưa `.env` lên GitHub và không chia sẻ mật khẩu cơ sở dữ liệu. Trong Codespaces mới, môi trường phát triển có thể đã tạo tệp `.env` với thông tin riêng.

Khởi động MariaDB, sau đó chạy Express từ thư mục gốc:

```bash
sudo service mariadb start
node backend/server.js
```

Express mặc định dùng cổng `9000`.

### 3. Chạy giao diện

Mở terminal khác tại thư mục gốc:

```bash
npm --prefix frontend run dev
```

Mở địa chỉ Vite hiển thị trong terminal, thường là `http://localhost:5173`.

### 4. Cấu hình và chạy NestJS

NestJS đọc cấu hình trong `backend/.env`. Tạo tệp từ mẫu:

```bash
cp -n backend/.env.example backend/.env
```

Nếu `backend/.env` đã tồn tại, không ghi đè; chỉ kiểm tra thông tin MariaDB và `JWT_SECRET`. `JWT_SECRET` phải là chuỗi bí mật dài ít nhất 32 ký tự. Có thể tạo chuỗi ngẫu nhiên bằng:

```bash
openssl rand -base64 48
```

Đặt kết quả vào `JWT_SECRET` trong `backend/.env`. Không chia sẻ hoặc chụp ảnh để lộ giá trị này. Từ thư mục gốc, chạy:

```bash
npm --prefix backend run start:dev
```

NestJS mặc định dùng cổng `3000`. Khi chạy trên Codespaces, mở thẻ **Ports**, tìm cổng `3000` và dùng địa chỉ được chuyển tiếp thay cho `localhost`.

## API xác thực bằng NestJS

Các tuyến xác thực công khai:

| Phương thức | Đường dẫn | Mô tả |
|---|---|---|
| `POST` | `/auth/register` | Tạo tài khoản |
| `POST` | `/auth/login` | Đăng nhập và nhận JWT |

Các tuyến còn lại của NestJS yêu cầu header `Authorization: Bearer <JWT>`. Token có thời hạn một giờ. Ví dụ:

```bash
curl -i -X POST http://localhost:3000/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"Wardrobe Demo","email":"wardrobe-demo@example.com","password":"demo-pass-123"}'

curl -i -X POST http://localhost:3000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"wardrobe-demo@example.com","password":"demo-pass-123"}'
```

Đăng ký yêu cầu tên, email hợp lệ và mật khẩu dài ít nhất 8 ký tự, không vượt quá 72 byte UTF-8. Mật khẩu được băm bằng bcrypt trước khi lưu; API không trả mật khẩu hoặc mã băm về cho người gọi. Email được chuẩn hóa và không được trùng.

Sau khi đăng nhập, lấy giá trị `access_token` trong phản hồi và dùng nó để gọi API cần bảo vệ:

```bash
curl -i http://localhost:3000/user/me \
  -H 'Authorization: Bearer <JWT>'

curl -i http://localhost:3000/clothing \
  -H 'Authorization: Bearer <JWT>'
```

`GET/PATCH /user/me` chỉ đọc hoặc sửa tài khoản từ JWT. Quần áo, trang phục và các món trong trang phục được giới hạn theo người dùng đăng nhập. Máy chủ lấy mã người dùng từ JWT, không tin `user_id` do nội dung yêu cầu gửi lên. Khi thêm món vào trang phục, cả trang phục lẫn quần áo phải thuộc về cùng người dùng.

Các tuyến danh mục cũng yêu cầu JWT nhưng danh mục hiện là dữ liệu dùng chung, không gắn quyền sở hữu riêng. API xác thực NestJS hiện hoạt động độc lập với Express và chưa được nối vào giao diện React.

Tài khoản cũ lưu mật khẩu dạng văn bản không thể đăng nhập qua cơ chế mới; cần đặt lại mật khẩu để lưu dưới dạng bcrypt. Không có cơ chế dự phòng so sánh mật khẩu văn bản.

### Cập nhật cơ sở dữ liệu đã có sẵn

Tệp tạo CSDL mới đặt email là duy nhất. Trước khi áp dụng thay đổi lên CSDL hiện có, sao lưu CSDL và kiểm tra email trùng:

```sql
SELECT LOWER(email) AS normalized_email, COUNT(*) AS total
FROM users
GROUP BY LOWER(email)
HAVING COUNT(*) > 1;
```

Chỉ khi truy vấn không trả về dòng nào mới thêm chỉ mục:

```sql
ALTER TABLE users ADD UNIQUE KEY uq_users_email (email);
```

## Chụp ảnh minh chứng nộp bài

Cần nộp tối thiểu ảnh API hoạt động thành công và ảnh dữ liệu đã được lưu trong CSDL. Nên chụp thêm ảnh chứng minh API từ chối yêu cầu không có token.

### Ảnh API bằng Postman

1. Khởi chạy NestJS theo phần hướng dẫn bên trên. Mở Postman và tạo yêu cầu `POST` tới `http://localhost:3000/auth/register`.
2. Chọn **Body → raw → JSON**, nhập:

   ```json
   {
     "name": "Wardrobe Demo",
     "email": "wardrobe-demo@example.com",
     "password": "demo-pass-123"
   }
   ```

3. Bấm **Send**. Đăng ký thành công trả mã `201`. Nếu email đã tồn tại, đổi sang email khác.

<img width="1440" height="900" alt="Ảnh màn hình 2026-10-08 lúc 07 52 56" src="https://github.com/user-attachments/assets/6c74ae92-f4a4-4d98-a825-a999b1c24243" />

4. Tạo yêu cầu `POST http://localhost:3000/auth/login`, chọn **Body → raw → JSON** và nhập:

   ```json
   {
     "email": "wardrobe-demo@example.com",
     "password": "demo-pass-123"
   }
   ```

   Đăng nhập thành công trả mã `200` cùng `access_token`.
   
<img width="1440" height="900" alt="Ảnh màn hình 2026-10-08 lúc 07 53 08" src="https://github.com/user-attachments/assets/df86791f-e3a4-4fc7-bf63-3d7ddda24cc2" />

5. Tạo yêu cầu `GET http://localhost:3000/user/me`. Gửi một lần không có token để kiểm tra phản hồi `401 Unauthorized`. Sau đó chọn **Authorization → Bearer Token**, dán token và gửi lại; kết quả thành công là `200 OK`.

<img width="1440" height="900" alt="Ảnh màn hình 2026-10-08 lúc 07 53 12" src="https://github.com/user-attachments/assets/b7dd6293-de08-43be-9f5c-e41870d430ed" />

### Ảnh dữ liệu MariaDB

Sau khi đăng nhập MariaDB và chạy truy vấn ở bước tiếp theo, chụp ảnh phần truy vấn cùng hàng kết quả. Không đưa mật khẩu, JWT hoặc mã băm mật khẩu vào ảnh nộp.

<img width="1440" height="900" alt="Ảnh màn hình 2026-10-08 lúc 07 57 29" src="https://github.com/user-attachments/assets/a8f65023-037c-4265-8d14-71b8f0a011c5" />

## Kiểm thử và kiểm tra

Các kiểm tra gần nhất cho NestJS:

| Kiểm tra | Kết quả |
|---|---|
| Biên dịch NestJS | Đạt |
| Kiểm tra mã nguồn NestJS | Đạt |
| Kiểm thử tự động NestJS | 13 nhóm kiểm thử, 18 kiểm thử đạt |

Các giao diện và thao tác CRUD của ứng dụng Express/React cũng đã được kiểm tra trước đó bằng dữ liệu tạm thời; các dữ liệu kiểm thử đã được xóa sau khi kiểm tra. Để chạy lệnh kiểm tra:

```bash
npm --prefix backend run build
npm --prefix backend run lint
npm --prefix backend test -- --runInBand

npm --prefix frontend run lint
npm --prefix frontend run build
```

## Giới hạn hiện tại

- Giao diện React đang gọi API Express; chưa có màn hình đăng nhập và chưa gửi JWT.
- NestJS cung cấp API xác thực riêng; các đường dẫn CRUD và quy tắc phân quyền trong NestJS không tự động áp dụng cho Express.
- Danh mục là dữ liệu dùng chung; chưa có phân quyền theo vai trò quản trị.
- Việc xóa quần áo hoặc trang phục có liên kết trong ứng dụng hiện cần xử lý các dòng liên kết trước. Chuỗi thao tác của giao diện không phải một giao dịch nguyên tử; nếu khôi phục liên kết sau lỗi cũng thất bại, cần kiểm tra lại dữ liệu trước khi thử lại.
- API Express hiện chưa có tải ảnh lên, bộ lọc theo mùa/loại trang phục hoặc lọc dữ liệu theo người dùng.

## Minh chứng các phần đã thực hiện

Các ảnh bên dưới là minh chứng giao diện và thao tác quản lý dữ liệu đã có trong dự án.

### Cơ sở dữ liệu

<img width="1440" height="900" alt="Ảnh chụp cơ sở dữ liệu" src="https://github.com/user-attachments/assets/3b0c9ea6-acba-4614-8598-7b8eb090c580" />

### Kết nối cơ sở dữ liệu

<img width="1440" height="900" alt="Ảnh chụp kết nối cơ sở dữ liệu" src="https://github.com/user-attachments/assets/5f98d494-3bb9-4851-9c38-e4e7b118abdd" />

### Quản lý người dùng

<img width="1440" height="900" alt="Ảnh minh chứng quản lý người dùng 1" src="https://github.com/user-attachments/assets/0bd90bd4-b520-420a-8e78-5da1d72a89c4" />
<img width="1440" height="900" alt="Ảnh minh chứng quản lý người dùng 2" src="https://github.com/user-attachments/assets/a5639efc-e5a2-462c-9faf-c21e0901db6a" />
<img width="1440" height="900" alt="Ảnh minh chứng quản lý người dùng 3" src="https://github.com/user-attachments/assets/3a84ac70-4365-44c2-a2ea-b7895b9e2110" />
<img width="1440" height="900" alt="Ảnh minh chứng quản lý người dùng 4" src="https://github.com/user-attachments/assets/d803af14-9f66-4433-a675-bc2c25b75fc1" />

### Quản lý danh mục

<img width="1440" height="900" alt="Ảnh minh chứng quản lý danh mục 1" src="https://github.com/user-attachments/assets/83bb3332-492c-40af-b44b-24e74286bc41" />
<img width="1440" height="900" alt="Ảnh minh chứng quản lý danh mục 2" src="https://github.com/user-attachments/assets/dace1472-6559-4ec4-a199-88e10df24e1e" />
<img width="1440" height="900" alt="Ảnh minh chứng quản lý danh mục 3" src="https://github.com/user-attachments/assets/b3233d84-10c2-4625-8df7-e1103b42f979" />
<img width="1440" height="900" alt="Ảnh minh chứng quản lý danh mục 4" src="https://github.com/user-attachments/assets/4b509a51-2812-4309-979a-c1014db24a2d" />

### Quản lý quần áo

<img width="1440" height="900" alt="Ảnh minh chứng quản lý quần áo 1" src="https://github.com/user-attachments/assets/f485028d-d32d-499f-9ba1-bf4aa2da01f1" />
<img width="1440" height="900" alt="Ảnh minh chứng quản lý quần áo 2" src="https://github.com/user-attachments/assets/76ce03e3-e08a-4cff-9deb-ac02bda33c68" />
<img width="1440" height="900" alt="Ảnh minh chứng quản lý quần áo 3" src="https://github.com/user-attachments/assets/a51c362b-c84d-416e-a371-60080f518ccc" />
<img width="1440" height="900" alt="Ảnh minh chứng quản lý quần áo 4" src="https://github.com/user-attachments/assets/4d678585-e96f-477a-b14f-980ad6850d72" />

### Quản lý trang phục

<img width="1440" height="900" alt="Ảnh minh chứng quản lý trang phục 1" src="https://github.com/user-attachments/assets/0c57b179-ccc2-4e32-b0e5-abd4a66e852e" />
<img width="1440" height="900" alt="Ảnh minh chứng quản lý trang phục 2" src="https://github.com/user-attachments/assets/aa53fda8-3e20-40c5-a2a4-dff794dde0a1" />
<img width="1440" height="900" alt="Ảnh minh chứng quản lý trang phục 3" src="https://github.com/user-attachments/assets/c9ddd795-6fe2-41ef-ac2d-6302947ddd14" />
<img width="1440" height="900" alt="Ảnh minh chứng quản lý trang phục 4" src="https://github.com/user-attachments/assets/b976c885-a082-4a73-b751-d5477d32eec1" />

### Quản lý các món đồ trong trang phục

<img width="1440" height="900" alt="Ảnh minh chứng các món đồ trong trang phục 1" src="https://github.com/user-attachments/assets/cc707c97-28e8-45a9-bfc5-7788d6f2b918" />
<img width="1440" height="900" alt="Ảnh minh chứng các món đồ trong trang phục 2" src="https://github.com/user-attachments/assets/a063e281-a2db-4ce8-bde4-8db302d8a2af" />
<img width="1440" height="900" alt="Ảnh minh chứng các món đồ trong trang phục 3" src="https://github.com/user-attachments/assets/f27bb61f-07b5-4664-b9a8-7d708bdb5d4d" />
<img width="1440" height="900" alt="Ảnh minh chứng các món đồ trong trang phục 4" src="https://github.com/user-attachments/assets/939a5f04-a686-499c-9fd3-80f0a82ea519" />

## Thông tin kho mã

[Mã nguồn trên GitHub](https://github.com/Whales88888/Digital-Wardrobe-Group)
