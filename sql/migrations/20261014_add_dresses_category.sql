USE digital_wardrobe;

INSERT INTO categories (name)
SELECT 'Dresses'
WHERE NOT EXISTS (
    SELECT 1
    FROM categories
    WHERE LOWER(TRIM(name)) IN ('dress', 'dresses')
);
