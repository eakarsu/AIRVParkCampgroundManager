const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ab.*, a.name as amenity_name, a.type as amenity_type, g.first_name, g.last_name
       FROM amenity_bookings ab
       LEFT JOIN amenities a ON ab.amenity_id = a.id
       LEFT JOIN guests g ON ab.guest_id = g.id
       ORDER BY ab.booking_date DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ab.*, a.name as amenity_name, a.type as amenity_type, g.first_name, g.last_name
       FROM amenity_bookings ab
       LEFT JOIN amenities a ON ab.amenity_id = a.id
       LEFT JOIN guests g ON ab.guest_id = g.id
       WHERE ab.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Booking not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { amenity_id, guest_id, booking_date, start_time, end_time, status, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO amenity_bookings (amenity_id, guest_id, booking_date, start_time, end_time, status, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [amenity_id, guest_id, booking_date, start_time, end_time, status || 'confirmed', notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { amenity_id, guest_id, booking_date, start_time, end_time, status, notes } = req.body;
    const result = await pool.query(
      `UPDATE amenity_bookings SET amenity_id=$1, guest_id=$2, booking_date=$3, start_time=$4, end_time=$5, status=$6, notes=$7
       WHERE id=$8 RETURNING *`,
      [amenity_id, guest_id, booking_date, start_time, end_time, status, notes, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Booking not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM amenity_bookings WHERE id = $1', [req.params.id]);
    res.json({ message: 'Booking deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
