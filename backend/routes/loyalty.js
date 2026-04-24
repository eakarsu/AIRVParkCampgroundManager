const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT lr.*, g.first_name, g.last_name
       FROM loyalty_rewards lr
       LEFT JOIN guests g ON lr.guest_id = g.id
       ORDER BY lr.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT lr.*, g.first_name, g.last_name
       FROM loyalty_rewards lr
       LEFT JOIN guests g ON lr.guest_id = g.id
       WHERE lr.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Reward record not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { guest_id, points, action, description } = req.body;
    const result = await pool.query(
      `INSERT INTO loyalty_rewards (guest_id, points, action, description)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [guest_id, points, action, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { guest_id, points, action, description } = req.body;
    const result = await pool.query(
      `UPDATE loyalty_rewards SET guest_id=$1, points=$2, action=$3, description=$4
       WHERE id=$5 RETURNING *`,
      [guest_id, points, action, description, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Reward record not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM loyalty_rewards WHERE id = $1', [req.params.id]);
    res.json({ message: 'Reward record deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
