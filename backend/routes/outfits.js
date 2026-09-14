const express = require('express');
const pool = require('../dbconnection');

const router = express.Router();

// GET all outfits
router.get('/', async (req, res) => {
    try {
        const rows = await pool.query('SELECT * FROM outfits');
        res.json(rows);
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
});

// GET outfit by ID
router.get('/:id', async (req, res) => {
    try {
        const rows = await pool.query(
            'SELECT * FROM outfits WHERE outfit_id = ?',
            [req.params.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                message: 'Outfit not found'
            });
        }

        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
});

// POST outfit
router.post('/', async (req, res) => {
    try {
        const { user_id, name, description } = req.body;

        const result = await pool.query(
            'INSERT INTO outfits (user_id, name, description) VALUES (?, ?, ?)',
            [user_id, name, description]
        );

        res.status(201).json({
            message: 'Outfit created',
            outfit_id: Number(result.insertId)
        });
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
});

// PUT outfit
router.put('/:id', async (req, res) => {
    try {
        const { user_id, name, description } = req.body;

        const result = await pool.query(
            `UPDATE outfits
            SET user_id = ?, name = ?, description = ?
            WHERE outfit_id = ?`,
            [user_id, name, description, req.params.id]
        );

        res.json({
            message: 'Outfit updated',
            affectedRows: result.affectedRows
        });
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
});

// DELETE outfit
router.delete('/:id', async (req, res) => {
    try {
        const result = await pool.query(
            'DELETE FROM outfits WHERE outfit_id = ?',
            [req.params.id]
        );

        res.json({
            message: 'Outfit deleted',
            affectedRows: result.affectedRows
        });
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
});

module.exports = router;