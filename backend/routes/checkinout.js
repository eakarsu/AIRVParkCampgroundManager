const express = require('express');
const router = express.Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*, r.check_in, r.check_out, s.site_number, g.first_name, g.last_name
       FROM checkin_checkout c
       LEFT JOIN reservations r ON c.reservation_id = r.id
       LEFT JOIN sites s ON c.site_id = s.id
       LEFT JOIN guests g ON c.guest_id = g.id
       ORDER BY c.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*, r.check_in, r.check_out, s.site_number, g.first_name, g.last_name
       FROM checkin_checkout c
       LEFT JOIN reservations r ON c.reservation_id = r.id
       LEFT JOIN sites s ON c.site_id = s.id
       LEFT JOIN guests g ON c.guest_id = g.id
       WHERE c.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Record not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', auth, async (req, res) => {
  try {
    const { reservation_id, guest_id, site_id, type, timestamp, notes, processed_by } = req.body;
    const result = await pool.query(
      `INSERT INTO checkin_checkout (reservation_id, guest_id, site_id, type, timestamp, notes, processed_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [reservation_id, guest_id, site_id, type, timestamp || new Date(), notes, processed_by]
    );

    let loyaltyPointsEarned = 0;

    // Auto-credit loyalty points on checkout
    if (type === 'checkout' && guest_id && reservation_id) {
      try {
        const reservationRes = await pool.query(
          'SELECT check_in, check_out, total_amount FROM reservations WHERE id = $1',
          [reservation_id]
        );
        if (reservationRes.rows.length > 0) {
          const res_ = reservationRes.rows[0];
          const checkIn = new Date(res_.check_in);
          const checkOut = timestamp ? new Date(timestamp) : new Date();
          const nightsStayed = Math.max(1, Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24)));

          // 10 points per night stayed + 1 point per $10 spent
          const nightsPoints = nightsStayed * 10;
          const spendPoints = Math.floor((parseFloat(res_.total_amount) || 0) / 10);
          loyaltyPointsEarned = nightsPoints + spendPoints;

          if (loyaltyPointsEarned > 0) {
            await pool.query(
              'UPDATE guests SET loyalty_points = COALESCE(loyalty_points, 0) + $1 WHERE id = $2',
              [loyaltyPointsEarned, guest_id]
            );
          }
        }
      } catch (loyaltyErr) {
        console.error('Loyalty points credit error (non-fatal):', loyaltyErr.message);
      }
    }

    res.status(201).json({ ...result.rows[0], loyalty_points_earned: loyaltyPointsEarned });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const { reservation_id, guest_id, site_id, type, timestamp, notes, processed_by } = req.body;
    const result = await pool.query(
      `UPDATE checkin_checkout SET reservation_id=$1, guest_id=$2, site_id=$3, type=$4, timestamp=$5, notes=$6, processed_by=$7
       WHERE id=$8 RETURNING *`,
      [reservation_id, guest_id, site_id, type, timestamp, notes, processed_by, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Record not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM checkin_checkout WHERE id = $1', [req.params.id]);
    res.json({ message: 'Record deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
