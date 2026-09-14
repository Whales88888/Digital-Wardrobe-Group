const express = require('express');
const pool = require('../dbconnection');

const router = express.Router();

// GET all outfit items
router.get('/', async (req, res) => {
    try {
        const rows = await pool.query('SELECT * FROM outfit_items');
        res.json(rows);
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
});

// GET outfit item by ID
router.get('/:id', async (req, res) => {
    try {
        const rows = await pool.query(
            'SELECT * FROM outfit_items WHERE outfit_item_id = ?',
            [req.params.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                message: 'Outfit item not found'
            });
        }

        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
});

// POST outfit item
router.post('/', async (req, res) => {
    try {
        const { outfit_id, clothing_id } = req.body;

        const result = await pool.query(
            `INSERT INTO outfit_items
            (outfit_id, clothing_id)
            VALUES (?, ?)`,
            [outfit_id, clothing_id]
        );

        res.status(201).json({
            message: 'Outfit item created',
            outfit_item_id: Number(result.insertId)
        });
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
});

// PUT outfit item
router.put('/:id', async (req, res) => {
    try {
        const { outfit_id, clothing_id } = req.body;

        const result = await pool.query(
            `UPDATE outfit_items
            SET outfit_id = ?, clothing_id = ?
            WHERE outfit_item_id = ?`,
            [outfit_id, clothing_id, req.params.id]
        );

        res.json({
            message: 'Outfit item updated',
            affectedRows: result.affectedRows
        });
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
});

// DELETE outfit item
router.delete('/:id', async (req, res) => {
    try {
        const result = await pool.query(
            'DELETE FROM outfit_items WHERE outfit_item_id = ?',
            [req.params.id]
        );

        res.json({
            message: 'Outfit item deleted',
            affectedRows: result.affectedRows
        });
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
});

module.exports = router;