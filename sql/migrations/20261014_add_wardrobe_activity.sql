USE digital_wardrobe;

ALTER TABLE clothing
    ADD COLUMN care_instructions TEXT NULL,
    ADD COLUMN last_washed_at DATE NULL,
    ADD COLUMN wash_after_wears INT NOT NULL DEFAULT 3;

CREATE TABLE wear_logs (
    wear_log_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    worn_on DATE NOT NULL,
    note TEXT NULL,
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

CREATE TABLE outfit_plans (
    outfit_plan_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    outfit_id INT NOT NULL,
    planned_for DATE NOT NULL,
    occasion VARCHAR(100) NULL,
    note TEXT NULL,
    CONSTRAINT fk_outfit_plans_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_outfit_plans_outfit
        FOREIGN KEY (outfit_id) REFERENCES outfits(outfit_id)
        ON DELETE CASCADE,
    INDEX idx_outfit_plans_user_date (user_id, planned_for)
);
