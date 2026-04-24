const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT rr.*, s.site_number
       FROM revenue_records rr
       LEFT JOIN sites s ON rr.site_id = s.id
       ORDER BY rr.revenue_date DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT rr.*, s.site_number
       FROM revenue_records rr
       LEFT JOIN sites s ON rr.site_id = s.id
       WHERE rr.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Revenue record not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { source, site_id, amount, revenue_date, category, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO revenue_records (source, site_id, amount, revenue_date, category, notes)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [source, site_id, amount, revenue_date, category, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { source, site_id, amount, revenue_date, category, notes } = req.body;
    const result = await pool.query(
      `UPDATE revenue_records SET source=$1, site_id=$2, amount=$3, revenue_date=$4, category=$5, notes=$6
       WHERE id=$7 RETURNING *`,
      [source, site_id, amount, revenue_date, category, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Revenue record not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM revenue_records WHERE id = $1', [req.params.id]);
    res.json({ message: 'Revenue record deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
