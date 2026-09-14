const express = require('express');
const pool = require('../dbconnection');

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const rows = await pool.query('SELECT * FROM clothing');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const rows = await pool.query(
            'SELECT * FROM clothing WHERE clothing_id = ?',
            [req.params.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                message: 'Clothing not found'
            });
        }

        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/', async (req, res) => {
    try {
        const {
            user_id,
            category_id,
            name,
            color,
            size,
            image_url
        } = req.body;

        const result = await pool.query(
            `INSERT INTO clothing
            (user_id, category_id, name, color, size, image_url)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [user_id, category_id, name, color, size, image_url]
        );

        res.status(201).json({
            message: 'Clothing created',
            clothing_id: Number(result.insertId)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const {
            user_id,
            category_id,
            name,
            color,
            size,
            image_url
        } = req.body;

        const result = await pool.query(
            `UPDATE clothing
            SET user_id = ?, category_id = ?, name = ?,
                color = ?, size = ?, image_url = ?
            WHERE clothing_id = ?`,
            [
                user_id,
                category_id,
                name,
                color,
                size,
                image_url,
                req.params.id
            ]
        );

        res.json({
            message: 'Clothing updated',
            affectedRows: result.affectedRows
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const result = await pool.query(
            'DELETE FROM clothing WHERE clothing_id = ?',
            [req.params.id]
        );

        res.json({
            message: 'Clothing deleted',
            affectedRows: result.affectedRows
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
