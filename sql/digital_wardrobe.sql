-- 1. Users
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL
);

-- 2. Categories
CREATE TABLE categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

-- 3. Clothing
CREATE TABLE clothing (
    clothing_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    category_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(50),
    size VARCHAR(20),
    image_url VARCHAR(500),

    FOREIGN KEY (user_id)
        REFERENCES users(user_id),

    FOREIGN KEY (category_id)
        REFERENCES categories(category_id)
);

-- 4. Outfits
CREATE TABLE outfits (
    outfit_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,

    FOREIGN KEY (user_id)
        REFERENCES users(user_id)
);

-- 5. Outfit Items
CREATE TABLE outfit_items (
    outfit_item_id INT AUTO_INCREMENT PRIMARY KEY,
    outfit_id INT NOT NULL,
    clothing_id INT NOT NULL,

    FOREIGN KEY (outfit_id)
        REFERENCES outfits(outfit_id),

    FOREIGN KEY (clothing_id)
        REFERENCES clothing(clothing_id)
);
