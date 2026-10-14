USE digital_wardrobe;

ALTER TABLE clothing
    DROP FOREIGN KEY clothing_ibfk_1,
    ADD CONSTRAINT fk_clothing_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE CASCADE;

ALTER TABLE outfits
    DROP FOREIGN KEY outfits_ibfk_1,
    ADD CONSTRAINT fk_outfits_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE CASCADE;

ALTER TABLE outfit_items
    DROP FOREIGN KEY outfit_items_ibfk_1,
    ADD CONSTRAINT fk_outfit_items_outfit
        FOREIGN KEY (outfit_id) REFERENCES outfits(outfit_id)
        ON DELETE CASCADE;

ALTER TABLE outfit_items
    DROP FOREIGN KEY outfit_items_ibfk_2,
    ADD CONSTRAINT fk_outfit_items_clothing
        FOREIGN KEY (clothing_id) REFERENCES clothing(clothing_id)
        ON DELETE CASCADE;

INSERT INTO categories (name)
SELECT seed.name
FROM (
    SELECT 'Tops' AS name
    UNION ALL SELECT 'Bottoms'
    UNION ALL SELECT 'Outerwear'
    UNION ALL SELECT 'Shoes'
    UNION ALL SELECT 'Accessories'
) AS seed
WHERE NOT EXISTS (
    SELECT 1 FROM categories existing WHERE existing.name = seed.name
);
