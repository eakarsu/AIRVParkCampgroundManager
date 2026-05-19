const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.*, s.site_number, s.type as site_type, g.first_name, g.last_name
       FROM reservations r
       LEFT JOIN sites s ON r.site_id = s.id
       LEFT JOIN guests g ON r.guest_id = g.id
       ORDER BY r.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT r.*, s.site_number, s.type as site_type, g.first_name, g.last_name
       FROM reservations r
       LEFT JOIN sites s ON r.site_id = s.id
       LEFT JOIN guests g ON r.guest_id = g.id
       WHERE r.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Reservation not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { site_id, guest_id, check_in, check_out, status, total_amount, notes } = req.body;

    if (!site_id || !check_in || !check_out) {
      return res.status(400).json({ error: 'site_id, check_in, and check_out are required' });
    }

    // Conflict check: overlapping reservation for same site
    const conflictCheck = await pool.query(`
      SELECT id, check_in, check_out FROM reservations
      WHERE site_id = $1
        AND status NOT IN ('cancelled', 'checked_out')
        AND check_in < $3
        AND check_out > $2
    `, [site_id, check_in, check_out]);

    if (conflictCheck.rows.length > 0) {
      const conflict = conflictCheck.rows[0];
      return res.status(409).json({
        error: 'Reservation conflict: site is already booked for overlapping dates',
        conflict: {
          reservation_id: conflict.id,
          check_in: conflict.check_in,
          check_out: conflict.check_out
        }
      });
    }

    const result = await pool.query(
      `INSERT INTO reservations (site_id, guest_id, check_in, check_out, status, total_amount, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [site_id, guest_id, check_in, check_out, status || 'confirmed', total_amount, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { site_id, guest_id, check_in, check_out, status, total_amount, notes } = req.body;
    const result = await pool.query(
      `UPDATE reservations SET site_id=$1, guest_id=$2, check_in=$3, check_out=$4, status=$5, total_amount=$6, notes=$7
       WHERE id=$8 RETURNING *`,
      [site_id, guest_id, check_in, check_out, status, total_amount, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Reservation not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM reservations WHERE id = $1', [req.params.id]);
    res.json({ message: 'Reservation deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
