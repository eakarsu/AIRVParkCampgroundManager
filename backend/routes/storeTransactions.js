const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT st.*, g.first_name, g.last_name
       FROM store_transactions st
       LEFT JOIN guests g ON st.guest_id = g.id
       ORDER BY st.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT st.*, g.first_name, g.last_name
       FROM store_transactions st
       LEFT JOIN guests g ON st.guest_id = g.id
       WHERE st.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Transaction not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { guest_id, items, total, payment_method, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO store_transactions (guest_id, items, total, payment_method, notes)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [guest_id, JSON.stringify(items), total, payment_method || 'cash', notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { guest_id, items, total, payment_method, notes } = req.body;
    const result = await pool.query(
      `UPDATE store_transactions SET guest_id=$1, items=$2, total=$3, payment_method=$4, notes=$5
       WHERE id=$6 RETURNING *`,
      [guest_id, JSON.stringify(items), total, payment_method, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Transaction not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM store_transactions WHERE id = $1', [req.params.id]);
    res.json({ message: 'Transaction deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
