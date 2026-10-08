# Digital Wardrobe

## Overview

Digital Wardrobe is a clothing collection and outfit management application for the existing MariaDB database and Express REST API in this repository. The frontend renders live API records; it does not use mock wardrobe data.

## Tech Stack

- React 19, TypeScript and Vite
- React Router for public and application routes
- Fetch API for HTTP requests
- Express 5 REST API
- MariaDB

## Architecture

```text
React UI
	↓
Fetch API services
	↓
Express REST API
	↓
MariaDB
```

Vite proxies `/api` to Express at `http://127.0.0.1:9000` during local development and preview. A deployed frontend needs a same-origin reverse proxy because the current Express server does not enable CORS.

## Features

- Public home with live clothing and outfit previews
- About page describing the database-backed project and its current limits
- Dashboard totals and category distribution from API responses
- Wardrobe search, category filter, sort, details and CRUD
- Category listing, counts, filtering and CRUD
- Outfit CRUD with linked clothing from Outfit Items
- Loading, empty, error/retry, validation, delete confirmation and broken-image fallback states
- Responsive public and application layouts

## Frontend Structure

```text
frontend/src/
├── components/  # shared states and clothing images
├── hooks/       # API resource state
├── layouts/     # public and application shells
├── pages/       # home, dashboard and management pages
├── services/    # typed API client and resource methods
├── App.tsx      # React Router routes
└── main.tsx
```

## API Integration

| Resource | Endpoints used | Methods |
|---|---|---|
| Users | `/api/users` | GET |
| Categories | `/api/categories`, `/api/categories/:id` | GET, POST, PUT, DELETE |
| Clothing | `/api/clothing`, `/api/clothing/:id` | GET, POST, PUT, DELETE |
| Outfits | `/api/outfits`, `/api/outfits/:id` | GET, POST, PUT, DELETE |
| Outfit Items | `/api/outfit-items`, `/api/outfit-items/:id` | GET, POST, PUT, DELETE |

Public routes are `/` and `/about`. Application routes are `/app/dashboard`, `/app/wardrobe`, `/app/wardrobe/:id`, `/app/categories` and `/app/outfits`. `/dashboard`, `/wardrobe`, `/categories` and `/outfits` are redirects to their `/app/...` counterparts.

Clothing fields follow the schema: `user_id`, `category_id`, `name`, `color`, `size`, `image_url`. Outfit Items link records through `outfit_id` and `clothing_id`. The API has no timestamps, season/type fields, image upload, or user-scoped filtering.

Because the existing API has no cascade-delete or transaction endpoint, the frontend removes dependent Outfit Item links before deleting a Clothing/Outfit record and attempts to restore links if a later request fails. This sequence is not atomic; if restoration also fails, refresh the affected views and verify the relationships before retrying.

## How to Run Backend

Ensure MariaDB is running, then from the repository root:

```bash
sudo service mariadb start
node backend/server.js
```

Express defaults to port `9000` and reads database configuration from the root `.env`. A fresh devcontainer creates that ignored file with random local credentials. For manual setup, copy `.env.example` to `.env` and replace the placeholders before starting MariaDB/Express. Do not commit environment files or expose their values.

## How to Run Frontend

In another terminal from the repository root:

```bash
npm --prefix frontend install
npm --prefix frontend run dev
```

Vite serves the app at `http://localhost:5173`.

## Environment Variables

The frontend uses `VITE_API_URL`, defaulting to `/api`. See `frontend/.env.example`; an optional `frontend/.env` is ignored by Git. Frontend variables must not contain database credentials.

## NestJS Authentication API

The NestJS backend in `backend/src/` now provides public registration and login endpoints and protects its API routes with a JWT bearer-token guard. This NestJS service is separate from the Express API currently used by the frontend; the frontend does not yet have a login screen or send JWTs.

Start MariaDB, copy `backend/.env.example` to `backend/.env`, set the database credentials, and replace `JWT_SECRET` with a private random value of at least 32 characters. From the repository root, start NestJS with:

```bash
npm --prefix backend run start:dev
```

The NestJS server uses port `3000` by default. Example requests (replace the sample password and token):

```bash
curl -X POST http://localhost:3000/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"Wardrobe User","email":"user@example.com","password":"secure-pass-123"}'

curl -X POST http://localhost:3000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"user@example.com","password":"secure-pass-123"}'

curl http://localhost:3000/clothing \
  -H 'Authorization: Bearer <access_token>'
```

Registration requires a name, valid email and a password of at least 8 characters and no more than 72 UTF-8 bytes. Passwords are stored as bcrypt hashes, duplicate emails are rejected, and responses omit the password. Access tokens expire after one hour; all NestJS endpoints except `/auth/register` and `/auth/login` require `Authorization: Bearer <access_token>`. `GET/PATCH /user/me` only accesses the signed-in user's account. Clothing, outfits and outfit items are also restricted to the owner in the JWT; a request cannot choose another `user_id` or attach another user's clothing to an outfit. Use the screenshot steps below to capture a successful API response and its corresponding database row. Existing accounts with plaintext passwords need a password reset to a bcrypt hash before they can use this login flow; no insecure plaintext fallback is enabled.

The NestJS CRUD API uses the same database, but it is separate from the Express API described above. Authentication is not yet wired into the Express routes or the React frontend.

### Chụp ảnh minh chứng bài tập

1. Tạo `backend/.env` từ `backend/.env.example`, điền thông tin MariaDB và đặt `JWT_SECRET` riêng dài ít nhất 32 ký tự. Khởi động MariaDB và API bằng `npm --prefix backend run start:dev`.
2. Mở terminal thứ hai tại thư mục gốc repo, đăng ký một tài khoản thử (đổi email nếu đã tồn tại):

   ```bash
   curl -i -X POST http://localhost:3000/auth/register \
     -H 'Content-Type: application/json' \
     -d '{"name":"Wardrobe Demo","email":"wardrobe-demo@example.com","password":"demo-pass-123"}'
   ```

   Chụp ảnh phản hồi `201` có `access_token` và thông tin người dùng. Token là thông tin bí mật; che token trong ảnh trước khi nộp.

3. Đăng nhập để lấy token mới, thay email/mật khẩu bằng thông tin đã đăng ký:

   ```bash
   curl -i -X POST http://localhost:3000/auth/login \
     -H 'Content-Type: application/json' \
     -d '{"email":"wardrobe-demo@example.com","password":"demo-pass-123"}'
   ```

   Chụp ảnh phản hồi `200`. Tiếp theo dùng token đăng nhập để kiểm tra API được bảo vệ (thay `<TOKEN>` bằng token vừa nhận):

   ```bash
   curl -i http://localhost:3000/user/me \
     -H 'Authorization: Bearer <TOKEN>'

   curl -i http://localhost:3000/clothing \
     -H 'Authorization: Bearer <TOKEN>'
   ```

   Để chụp minh chứng authorization, gọi thử `GET /user/me` không có header token: API phải trả `401 Unauthorized`. Có thể chụp hai kết quả (không token và có token) trong Postman hoặc terminal; không để lộ token trong ảnh.

4. Mở MariaDB client bằng tài khoản local của bạn và chạy truy vấn sau để chụp ảnh hàng user; truy vấn chỉ hiển thị trạng thái mật khẩu đã được băm, không hiển thị hash:

   ```sql
   SELECT user_id, name, email,
          CASE WHEN password LIKE '$2%' THEN 'bcrypt hash saved'
               ELSE 'not bcrypt' END AS password_storage
   FROM users
   WHERE email = 'wardrobe-demo@example.com';
   ```

   Nộp tối thiểu một ảnh API đăng ký/đăng nhập thành công và một ảnh kết quả truy vấn `users`. Nếu dùng ảnh Postman/terminal, đảm bảo ảnh có URL hoặc tên endpoint và status code.

Với database đã tạo trước đó, kiểm tra email trùng trước khi thêm ràng buộc duy nhất:

```sql
SELECT LOWER(email) AS normalized_email, COUNT(*) AS total
FROM users
GROUP BY LOWER(email)
HAVING COUNT(*) > 1;

ALTER TABLE users ADD UNIQUE KEY uq_users_email (email);
```

Chỉ chạy lệnh `ALTER TABLE` khi truy vấn đầu không trả về dòng nào; sao lưu DB trước khi thay đổi schema. Database mới sẽ nhận ràng buộc này từ `sql/digital_wardrobe.sql`.

## Testing

| Check | Result |
|---|---|
| GET API | PASS |
| POST | PASS through forms/API for Categories, Clothing, Outfits and Outfit Items |
| PUT/PATCH | PASS through forms/API for Categories, Clothing and Outfits; Express uses PUT, not PATCH |
| DELETE | PASS through forms/API for Categories, Clothing, Outfits and Outfit Items; temporary records removed and counts restored |
| Form validation | PASS: required fields, owner/category selection and invalid image URL blocked without writes |
| Responsive | PASS: Home, About and four management pages checked at desktop, tablet and mobile widths; Clothing/Category modals fit; no horizontal overflow |
| Lint | PASS: `npm --prefix frontend run lint` |
| Build | PASS: `npm --prefix frontend run build` |
| Backend build/lint | PASS: `npm --prefix backend run build` and `npm --prefix backend run lint` |
| Console/network | PASS: no console/page errors, failed requests or HTTP errors in production-preview route checks |

CRUD was tested through both the UI and API using temporary records. The API test IDs were Category `3`, Clothing `2`, Outfits `2` and `3`, and Outfit Item `14`; UI CRUD used separately named temporary rows. Clothing and Outfit deletes were also tested with dependent Outfit Items. All test rows were deleted, and collection counts matched their pre-test values. The database currently has 1 user, 2 categories, 1 clothing item, 1 outfit and 11 outfit-item rows.

Run the built app locally with `npm --prefix frontend run preview` after building. Production hosting still needs an `/api` reverse proxy to Express.

## Project Notes

### Backend Structure

The frontend target is the Express application started by `backend/server.js`, with resource handlers in `backend/routes/` and the MariaDB pool in `backend/dbconnection.js`. `backend/src/` contains a separate NestJS/TypeORM scaffold and is not the API target used by the frontend. The root README's legacy CRUD screenshots document the Express routes.

### Database

The `digital_wardrobe` MariaDB schema is defined in `sql/digital_wardrobe.sql` and contains `users`, `categories`, `clothing`, `outfits` and `outfit_items`. Foreign keys connect clothing to users/categories and outfit items to outfits/clothing. The UI respects these relationships when deleting linked records; no schema changes were made.

The former fixed local bootstrap credential was removed from current source and appears in Git-history commit `6483a86f6abf`; history was not rewritten. The active local MariaDB account has been rotated to a random credential, and both ignored `.env` files are synchronized with owner-only permissions. Anyone with another clone should rotate their own local account independently. Fresh devcontainers generate random credentials. Runtime `.env` files are ignored and must not be committed.

## Quy trình bài tập nhóm

### ① Phân tích bài tập nhóm

**Phát triển:**  
Xây dựng hệ thống **Digital Wardrobe** để quản lý tủ quần áo và các bộ trang phục.

**Objects / Table:**

| Object | Table |
|---|---|
| User | `users` |
| Category | `categories` |
| Clothing | `clothing` |
| Outfit | `outfits` |
| Outfit Item | `outfit_items` |

**Các đối tượng cần quản lý:**

- Người dùng
- Danh mục quần áo
- Quần áo
- Bộ trang phục
- Các món quần áo trong bộ trang phục

---

### ② SQL

**Database:** `digital_wardrobe`  
**DBMS:** MariaDB

**Các Table:**

- `users`
- `categories`
- `clothing`
- `outfits`
- `outfit_items`

**Khóa chính / khóa ngoại:**

| Table | Primary Key | Foreign Key |
|---|---|---|
| `users` | `user_id` | — |
| `categories` | `category_id` | — |
| `clothing` | `clothing_id` | `user_id`, `category_id` |
| `outfits` | `outfit_id` | `user_id` |
| `outfit_items` | `outfit_item_id` | `outfit_id`, `clothing_id` |

**SQL file:** sql/digital_wardrobe.sql

---

### ③ Hệ quản trị CSDL

**DBMS:** MariaDB

**Database:** `digital_wardrobe`

Database gồm 5 bảng:

- `users`
- `categories`
- `clothing`
- `outfits`
- `outfit_items`

**Ảnh minh chứng:**
<img width="1440" height="900" alt="Ảnh màn hình 2026-09-14 lúc 11 27 22" src="https://github.com/user-attachments/assets/3b0c9ea6-acba-4614-8598-7b8eb090c580" />

---

### ④ Kết nối CSDL

Backend sử dụng Node.js để kết nối với MariaDB.

**File kết nối:** backend/dbconnection.js

**Thông tin kết nối:**

- Host
- Username
- Password
- Port
- Database
- SSL

Sử dụng:

- `mariadb`
- `dotenv`
- Connection Pool

**Ảnh minh chứng:**
<img width="1440" height="900" alt="Ảnh màn hình 2026-09-14 lúc 11 28 53" src="https://github.com/user-attachments/assets/5f98d494-3bb9-4851-9c38-e4e7b118abdd" />

---

### ⑤ Backend – CRUD

Backend sử dụng **Node.js + Express.js**.

CRUD được thực hiện cho 5 Object:

| Object | GET | POST | PUT | DELETE |
|---|---|---|---|---|
| Users | ✓ | ✓ | ✓ | ✓ |
| Categories | ✓ | ✓ | ✓ | ✓ |
| Clothing | ✓ | ✓ | ✓ | ✓ |
| Outfits | ✓ | ✓ | ✓ | ✓ |
| Outfit Items | ✓ | ✓ | ✓ | ✓ |

**CRUD:**

- Create → POST
- Read → GET
- Update → PUT
- Delete → DELETE

**Các file CRUD:**

```text
backend/routes/
├── users.js
├── categories.js
├── clothing.js
├── outfits.js
└── outfitItems.js
```
**Ảnh minh chứng:**

### CRUD cho Users
<img width="1440" height="900" alt="Ảnh màn hình 2026-09-14 lúc 12 20 52" src="https://github.com/user-attachments/assets/0bd90bd4-b520-420a-8e78-5da1d72a89c4" />
<img width="1440" height="900" alt="Ảnh màn hình 2026-09-14 lúc 12 21 11" src="https://github.com/user-attachments/assets/a5639efc-e5a2-462c-9faf-c21e0901db6a" />
<img width="1440" height="900" alt="Ảnh màn hình 2026-09-14 lúc 12 21 21" src="https://github.com/user-attachments/assets/3a84ac70-4365-44c2-a2ea-b7895b9e2110" />
<img width="1440" height="900" alt="Ảnh màn hình 2026-09-14 lúc 12 21 28" src="https://github.com/user-attachments/assets/d803af14-9f66-4433-a675-bc2c25b75fc1" />

### CRUD cho Categories
<img width="1440" height="900" alt="Ảnh màn hình 2026-09-14 lúc 12 22 26" src="https://github.com/user-attachments/assets/83bb3332-492c-40af-b44b-24e74286bc41" />
<img width="1440" height="900" alt="Ảnh màn hình 2026-09-14 lúc 12 25 43" src="https://github.com/user-attachments/assets/dace1472-6559-4ec4-a199-88e10df24e1e" />
<img width="1440" height="900" alt="Ảnh màn hình 2026-09-14 lúc 12 26 30" src="https://github.com/user-attachments/assets/b3233d84-10c2-4625-8df7-e1103b42f979" />
<img width="1440" height="900" alt="Ảnh màn hình 2026-09-14 lúc 12 27 11" src="https://github.com/user-attachments/assets/4b509a51-2812-4309-979a-c1014db24a2d" />

### CRUD cho Clothing
<img width="1440" height="900" alt="Ảnh màn hình 2026-09-14 lúc 12 34 15" src="https://github.com/user-attachments/assets/f485028d-d32d-499f-9ba1-bf4aa2da01f1" />
<img width="1440" height="900" alt="Ảnh màn hình 2026-09-14 lúc 12 35 30" src="https://github.com/user-attachments/assets/76ce03e3-e08a-4cff-9deb-ac02bda33c68" />
<img width="1440" height="900" alt="Ảnh màn hình 2026-09-14 lúc 12 36 04" src="https://github.com/user-attachments/assets/a51c362b-c84d-416e-a371-60080f518ccc" />
<img width="1440" height="900" alt="Ảnh màn hình 2026-09-14 lúc 12 36 31" src="https://github.com/user-attachments/assets/4d678585-e96f-477a-b14f-980ad6850d72" />

### CRUD cho Outfits
<img width="1440" height="900" alt="Ảnh màn hình 2026-09-14 lúc 12 38 18" src="https://github.com/user-attachments/assets/0c57b179-ccc2-4e32-b0e5-abd4a66e852e" />
<img width="1440" height="900" alt="Ảnh màn hình 2026-09-14 lúc 12 38 23" src="https://github.com/user-attachments/assets/aa53fda8-3e20-40c5-a2a4-dff794dde0a1" />
<img width="1440" height="900" alt="Ảnh màn hình 2026-09-14 lúc 12 38 31" src="https://github.com/user-attachments/assets/c9ddd795-6fe2-41ef-ac2d-6302947ddd14" />
<img width="1440" height="900" alt="Ảnh màn hình 2026-09-14 lúc 12 38 40" src="https://github.com/user-attachments/assets/b976c885-a082-4a73-b751-d5477d32eec1" />

### CRUD cho Outfit Items
<img width="1440" height="900" alt="Ảnh màn hình 2026-09-14 lúc 12 40 48" src="https://github.com/user-attachments/assets/cc707c97-28e8-45a9-bfc5-7788d6f2b918" />
<img width="1440" height="900" alt="Ảnh màn hình 2026-09-14 lúc 12 40 52" src="https://github.com/user-attachments/assets/a063e281-a2db-4ce8-bde4-8db302d8a2af" />
<img width="1440" height="900" alt="Ảnh màn hình 2026-09-14 lúc 12 40 58" src="https://github.com/user-attachments/assets/f27bb61f-07b5-4664-b9a8-7d708bdb5d4d" />
<img width="1440" height="900" alt="Ảnh màn hình 2026-09-14 lúc 12 41 02" src="https://github.com/user-attachments/assets/939a5f04-a686-499c-9fd3-80f0a82ea519" />

**GitHub Repository:** https://github.com/Whales88888/Digital-Wardrobe-Group
