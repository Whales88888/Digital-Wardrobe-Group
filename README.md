# Digital Wardrobe – Xây dựng phát triển hệ thống quản lý tủ quần áo thông minh

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
