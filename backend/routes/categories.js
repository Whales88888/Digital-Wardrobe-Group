const express = require('express');
const pool = require('../dbconnection');

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        const rows = await pool.query('SELECT * FROM categories');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const rows = await pool.query(
            'SELECT * FROM categories WHERE category_id = ?',
            [req.params.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Category not found' });
        }

        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/', async (req, res) => {
    try {
        const { name } = req.body;

        const result = await pool.query(
            'INSERT INTO categories (name) VALUES (?)',
            [name]
        );

        res.status(201).json({
            message: 'Category created',
            category_id: Number(result.insertId)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const { name } = req.body;

        const result = await pool.query(
            'UPDATE categories SET name = ? WHERE category_id = ?',
            [name, req.params.id]
        );

        res.json({
            message: 'Category updated',
            affectedRows: result.affectedRows
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const result = await pool.query(
            'DELETE FROM categories WHERE category_id = ?',
            [req.params.id]
        );

        res.json({
            message: 'Category deleted',
            affectedRows: result.affectedRows
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;