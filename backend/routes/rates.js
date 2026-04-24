const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM rates ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM rates WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Rate not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { name, rate_type, site_type, amount, start_date, end_date, is_active, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO rates (name, rate_type, site_type, amount, start_date, end_date, is_active, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [name, rate_type, site_type, amount, start_date, end_date, is_active !== false, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { name, rate_type, site_type, amount, start_date, end_date, is_active, notes } = req.body;
    const result = await pool.query(
      `UPDATE rates SET name=$1, rate_type=$2, site_type=$3, amount=$4, start_date=$5, end_date=$6, is_active=$7, notes=$8
       WHERE id=$9 RETURNING *`,
      [name, rate_type, site_type, amount, start_date, end_date, is_active, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Rate not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM rates WHERE id = $1', [req.params.id]);
    res.json({ message: 'Rate deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
