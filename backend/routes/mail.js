const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT mp.*, g.first_name, g.last_name
       FROM mail_packages mp
       LEFT JOIN guests g ON mp.guest_id = g.id
       ORDER BY mp.received_date DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT mp.*, g.first_name, g.last_name
       FROM mail_packages mp
       LEFT JOIN guests g ON mp.guest_id = g.id
       WHERE mp.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Mail/package not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { guest_id, type, sender, tracking_number, status, received_date, picked_up_date, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO mail_packages (guest_id, type, sender, tracking_number, status, received_date, picked_up_date, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [guest_id, type, sender, tracking_number, status || 'received', received_date || new Date(), picked_up_date, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { guest_id, type, sender, tracking_number, status, received_date, picked_up_date, notes } = req.body;
    const result = await pool.query(
      `UPDATE mail_packages SET guest_id=$1, type=$2, sender=$3, tracking_number=$4, status=$5, received_date=$6, picked_up_date=$7, notes=$8
       WHERE id=$9 RETURNING *`,
      [guest_id, type, sender, tracking_number, status, received_date, picked_up_date, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Mail/package not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM mail_packages WHERE id = $1', [req.params.id]);
    res.json({ message: 'Mail/package deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
