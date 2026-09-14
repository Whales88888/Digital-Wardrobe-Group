# Digital Wardrobe – Tủ quần áo thông minh

## ① Phân tích bài tập nhóm

### 1. Phát triển cái gì?

Nhóm phát triển hệ thống Web **Digital Wardrobe – Tủ quần áo thông minh**.

Hệ thống giúp người dùng quản lý tủ quần áo cá nhân trên nền tảng Web.

Các chức năng chính của hệ thống:

- Quản lý thông tin người dùng
- Thêm quần áo vào tủ
- Xem danh sách quần áo
- Phân loại quần áo
- Chỉnh sửa thông tin quần áo
- Xóa quần áo
- Tạo Outfit từ các món quần áo
- Xem danh sách Outfit
- Chỉnh sửa và xóa Outfit

### 2. Xác định Objects / Table

Dựa trên các chức năng của hệ thống, nhóm xác định các Objects / Table cần quản lý:

1. User
2. Category
3. Clothing
4. Outfit
5. Outfit_Item

### 3. Xác định các đối tượng cần quản lý

#### 3.1 User

Quản lý thông tin người dùng của hệ thống.

Các thông tin cần quản lý:

- User ID
- Name
- Email
- Password

#### 3.2 Category

Quản lý các loại quần áo trong hệ thống.

Các thông tin cần quản lý:

- Category ID
- Category Name

Các loại quần áo được sử dụng trong hệ thống gồm:

- T-shirt
- Shirt
- Pants
- Skirt
- Dress
- Jacket
- Shoes

#### 3.3 Clothing

Quản lý các món quần áo thuộc về người dùng.

Các thông tin cần quản lý:

- Clothing ID
- User ID
- Category ID
- Clothing Name
- Color
- Size
- Image URL

Mỗi Clothing thuộc về một User và một Category.

#### 3.4 Outfit

Quản lý các bộ trang phục do người dùng tạo.

Các thông tin cần quản lý:

- Outfit ID
- User ID
- Outfit Name
- Description

Mỗi Outfit thuộc về một User.

#### 3.5 Outfit_Item

Quản lý các món Clothing được sử dụng trong từng Outfit.

Các thông tin cần quản lý:

- Outfit Item ID
- Outfit ID
- Clothing ID

Outfit_Item được sử dụng để liên kết Outfit và Clothing.

### 4. Xác định mối quan hệ giữa các Objects

#### User và Clothing

Một User có thể có nhiều Clothing.

Quan hệ:

**User 1 : N Clothing**


#### Category và Clothing

Một Category có thể có nhiều Clothing.

Một Clothing thuộc một Category.

Quan hệ:

**Category 1 : N Clothing**


#### User và Outfit

Một User có thể tạo nhiều Outfit.

Quan hệ:

**User 1 : N Outfit**


#### Outfit và Clothing

Một Outfit có thể chứa nhiều Clothing.

Một Clothing có thể được sử dụng trong nhiều Outfit.

Quan hệ:

**Outfit N : N Clothing**

Vì quan hệ giữa Outfit và Clothing là N:N nên sử dụng **Outfit_Item** làm bảng trung gian.

### 5. Tổng hợp Objects / Table

| Object / Table | Mục đích quản lý |
|---|---|
| User | Quản lý người dùng |
| Category | Quản lý loại quần áo |
| Clothing | Quản lý các món quần áo |
| Outfit | Quản lý các bộ trang phục |
| Outfit_Item | Liên kết Outfit và Clothing |

### 6. Sơ đồ quan hệ

```text
USER
 │
 ├── 1 : N ── CLOTHING ── N : 1 ── CATEGORY
 │
 └── 1 : N ── OUTFIT
                  │
                  │ 1 : N
                  ↓
             OUTFIT_ITEM
                  │
                  │ N : 1
                  ↓
              CLOTHING

```
### 7. Kết luận
Hệ thống Digital Wardrobe gồm 5 Objects / Table chính:
User
Category
Clothing
Outfit
Outfit_Item
Các Objects sẽ được sử dụng để thiết kế Database.
