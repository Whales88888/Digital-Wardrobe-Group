USE digital_wardrobe;

ALTER TABLE clothing
    ADD COLUMN season VARCHAR(20) NULL,
    ADD COLUMN clothing_type VARCHAR(20) NULL;
