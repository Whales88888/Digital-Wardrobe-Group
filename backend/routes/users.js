const express = require('express');
const pool = require('../dbconnection');

const router = express.Router();

// GET all users
router.get('/', async (req, res) => {
    try {
        const rows = await pool.query(
            'SELECT user_id, name, email FROM users'
        );

        res.json(rows);
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
});

// GET user by ID
router.get('/:id', async (req, res) => {
    try {
        const rows = await pool.query(
            'SELECT user_id, name, email FROM users WHERE user_id = ?',
            [req.params.id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                message: 'User not found'
            });
        }

        res.json(rows[0]);
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
});

// POST user
router.post('/', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const result = await pool.query(
            'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
            [name, email, password]
        );

        res.status(201).json({
            message: 'User created',
            user_id: Number(result.insertId)
        });
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
});

// PUT user
router.put('/:id', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const result = await pool.query(
            'UPDATE users SET name = ?, email = ?, password = ? WHERE user_id = ?',
            [name, email, password, req.params.id]
        );

        res.json({
            message: 'User updated',
            affectedRows: result.affectedRows
        });
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
});

// DELETE user
router.delete('/:id', async (req, res) => {
    try {
        const result = await pool.query(
            'DELETE FROM users WHERE user_id = ?',
            [req.params.id]
        );

        res.json({
            message: 'User deleted',
            affectedRows: result.affectedRows
        });
    } catch (error) {
        res.status(500).json({
            error: error.message
        });
    }
});

module.exports = router;