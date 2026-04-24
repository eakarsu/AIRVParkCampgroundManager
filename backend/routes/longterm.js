const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT l.*, g.first_name, g.last_name, s.site_number
       FROM longterm_residents l
       LEFT JOIN guests g ON l.guest_id = g.id
       LEFT JOIN sites s ON l.site_id = s.id
       ORDER BY l.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT l.*, g.first_name, g.last_name, s.site_number
       FROM longterm_residents l
       LEFT JOIN guests g ON l.guest_id = g.id
       LEFT JOIN sites s ON l.site_id = s.id
       WHERE l.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Resident not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { guest_id, site_id, lease_start, lease_end, monthly_rate, status, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO longterm_residents (guest_id, site_id, lease_start, lease_end, monthly_rate, status, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [guest_id, site_id, lease_start, lease_end, monthly_rate, status || 'active', notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { guest_id, site_id, lease_start, lease_end, monthly_rate, status, notes } = req.body;
    const result = await pool.query(
      `UPDATE longterm_residents SET guest_id=$1, site_id=$2, lease_start=$3, lease_end=$4, monthly_rate=$5, status=$6, notes=$7
       WHERE id=$8 RETURNING *`,
      [guest_id, site_id, lease_start, lease_end, monthly_rate, status, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Resident not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM longterm_residents WHERE id = $1', [req.params.id]);
    res.json({ message: 'Resident record deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
