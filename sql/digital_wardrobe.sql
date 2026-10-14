CREATE DATABASE IF NOT EXISTS digital_wardrobe
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE digital_wardrobe;

-- 1. Users
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user'
);

-- 2. Revocable browser sessions
CREATE TABLE sessions (
    session_id CHAR(36) PRIMARY KEY,
    user_id INT NOT NULL,
    expires_at DATETIME NOT NULL,
    revoked_at DATETIME NULL,
    CONSTRAINT fk_sessions_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE CASCADE,
    INDEX idx_sessions_user_expiry (user_id, expires_at)
);

CREATE TABLE password_reset_tokens (
    password_reset_token_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token_hash CHAR(64) NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    used_at DATETIME NULL,
    CONSTRAINT fk_password_reset_tokens_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE CASCADE,
    INDEX idx_password_reset_user_expiry (user_id, expires_at)
);

CREATE TABLE rate_limit_counters (
    rate_limit_key VARCHAR(512) NOT NULL,
    throttler_name VARCHAR(64) NOT NULL,
    last_seen_at DATETIME(3) NOT NULL,
    PRIMARY KEY (rate_limit_key, throttler_name),
    INDEX idx_rate_limit_counters_last_seen (last_seen_at)
);

CREATE TABLE rate_limit_hits (
    rate_limit_hit_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    rate_limit_key VARCHAR(512) NOT NULL,
    throttler_name VARCHAR(64) NOT NULL,
    hit_at DATETIME(3) NOT NULL,
    INDEX idx_rate_limit_hits_window (rate_limit_key, throttler_name, hit_at),
    INDEX idx_rate_limit_hits_expiry (hit_at)
);

-- 3. Categories
CREATE TABLE categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

-- 4. Clothing
CREATE TABLE clothing (
    clothing_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    category_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(50),
    size VARCHAR(20),
    image_url VARCHAR(500),
    season VARCHAR(20),
    clothing_type VARCHAR(20),
    care_instructions TEXT,
    last_washed_at DATE,
    wash_after_wears INT NOT NULL DEFAULT 3,

    CONSTRAINT fk_clothing_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_clothing_category
        FOREIGN KEY (category_id) REFERENCES categories(category_id)
        ON DELETE RESTRICT
);

-- 5. Outfits
CREATE TABLE outfits (
    outfit_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,

    CONSTRAINT fk_outfits_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE CASCADE
);

-- 6. Outfit Items
CREATE TABLE outfit_items (
    outfit_item_id INT AUTO_INCREMENT PRIMARY KEY,
    outfit_id INT NOT NULL,
    clothing_id INT NOT NULL,

    CONSTRAINT fk_outfit_items_outfit
        FOREIGN KEY (outfit_id) REFERENCES outfits(outfit_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_outfit_items_clothing
        FOREIGN KEY (clothing_id) REFERENCES clothing(clothing_id)
        ON DELETE CASCADE
);

-- 7. Clothing wear history
CREATE TABLE wear_logs (
    wear_log_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    worn_on DATE NOT NULL,
    note TEXT,
    outfit_id INT NULL,
    CONSTRAINT fk_wear_logs_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_wear_logs_outfit
        FOREIGN KEY (outfit_id) REFERENCES outfits(outfit_id)
        ON DELETE SET NULL,
    INDEX idx_wear_logs_user_date (user_id, worn_on)
);

CREATE TABLE wear_log_items (
    wear_log_item_id INT AUTO_INCREMENT PRIMARY KEY,
    wear_log_id INT NOT NULL,
    clothing_id INT NOT NULL,
    CONSTRAINT fk_wear_log_items_log
        FOREIGN KEY (wear_log_id) REFERENCES wear_logs(wear_log_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_wear_log_items_clothing
        FOREIGN KEY (clothing_id) REFERENCES clothing(clothing_id)
        ON DELETE CASCADE,
    UNIQUE KEY uq_wear_log_clothing (wear_log_id, clothing_id),
    INDEX idx_wear_log_items_clothing (clothing_id)
);

-- 8. Planned outfits
CREATE TABLE outfit_plans (
    outfit_plan_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    outfit_id INT NOT NULL,
    planned_for DATE NOT NULL,
    occasion VARCHAR(100),
    note TEXT,
    CONSTRAINT fk_outfit_plans_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_outfit_plans_outfit
        FOREIGN KEY (outfit_id) REFERENCES outfits(outfit_id)
        ON DELETE CASCADE,
    INDEX idx_outfit_plans_user_date (user_id, planned_for)
);

INSERT INTO categories (name)
SELECT seed.name
FROM (
    SELECT 'Tops' AS name
    UNION ALL SELECT 'Bottoms'
    UNION ALL SELECT 'Outerwear'
    UNION ALL SELECT 'Dresses'
    UNION ALL SELECT 'Shoes'
    UNION ALL SELECT 'Accessories'
) AS seed
WHERE NOT EXISTS (
    SELECT 1
    FROM categories existing
    WHERE LOWER(TRIM(existing.name)) = LOWER(seed.name)
);
